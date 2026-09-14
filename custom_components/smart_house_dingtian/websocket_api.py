"""Authenticated admin commands; the frontend cannot grant itself authorization."""

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL
from .models import ManagerError


def admin(connection):
    if not connection.user or not connection.user.is_admin:
        raise ManagerError("Acesso restrito a administradores.")


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/request",
        vol.Required("action"): vol.In(
            (
                "list",
                "get",
                "create",
                "save",
                "edit_module",
                "delete",
                "reconcile",
                "operate",
                "command",
                "operate_group",
                "prepare_remove",
            )
        ),
        vol.Optional("revision"): vol.All(int, vol.Range(min=0)),
        vol.Optional("data", default={}): dict,
        vol.Optional("confirmed", default=False): bool,
    }
)
@websocket_api.async_response
async def request(hass, connection, msg):
    try:
        admin(connection)
        manager = hass.data.get(DOMAIN)
        if manager is None:
            raise ManagerError("Gerenciador não carregado. Confira a integração MQTT.")
        action, data = msg["action"], msg["data"]
        if action == "list":
            result = manager.snapshot()
        elif action == "get":
            result = manager.snapshot()["modules"].get(data.get("module_uuid"))
            if result is None:
                raise ManagerError("Módulo não encontrado.")
        elif action == "reconcile":
            result = await manager.reconcile(force=True)
        elif action == "operate_group":
            result = await manager.operate_group(data, msg["confirmed"], msg.get("revision"))
        elif action in {"operate", "command"}:
            if set(data) != {"module_uuid", "number", "payload"}:
                raise ManagerError("Parâmetros de comando inválidos; tópicos livres não são aceitos.")
            await manager.operate(
                data.get("module_uuid"),
                data.get("number"),
                data.get("payload"),
                msg["confirmed"],
                msg.get("revision"),
                direct=action == "command",
            )
            result = {"sent": True, "state_confirmed": False}
        else:
            result = await manager.mutate(action, msg.get("revision"), data, msg["confirmed"])
        await manager.port.sync_subscriptions()
        if manager.state["error"]:
            manager.port.schedule_reconcile()
        connection.send_result(msg["id"], result)
    except (ManagerError, KeyError, TypeError, ValueError) as exc:
        connection.send_error(msg["id"], "manager_error", str(exc))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def subscribe(hass, connection, msg):
    try:
        admin(connection)
    except ManagerError as exc:
        connection.send_error(msg["id"], "unauthorized", str(exc))
        return

    @callback
    def changed():
        connection.send_event(msg["id"], {"changed": True})

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL, changed)
    connection.send_result(msg["id"])


@callback
def async_register(hass):
    websocket_api.async_register_command(hass, request)
    websocket_api.async_register_command(hass, subscribe)
