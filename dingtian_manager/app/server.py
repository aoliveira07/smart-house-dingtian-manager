"""Ingress-only admin HTTP interface and reconnect lifecycle."""

import asyncio
import contextlib
import logging
import os
from copy import deepcopy
from pathlib import Path

from aiohttp import web

from .core.manager import Manager
from .core.models import ManagerError, validate_storage
from .ha_client import HAClient
from .port import RemotePort

LOG = logging.getLogger(__name__)


@web.middleware
async def protect(request, handler):
    # Never trust user-supplied forwarded IP or admin flags. Supervisor is the only peer.
    if request.remote != "172.30.32.2":
        raise web.HTTPForbidden(text="Acesso somente pelo Ingress do Home Assistant.")
    try:
        if not await request.app["port"].client.is_admin(request.headers.get("X-Remote-User-Id")):
            raise web.HTTPForbidden(text="Acesso restrito a administradores.")
        if request.method == "POST" and (
            request.content_type != "application/json" or request.headers.get("X-Dingtian-Request") != "1"
        ):
            raise web.HTTPForbidden(text="Solicitação de alteração inválida.")
        response = await handler(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response
    except (ManagerError, ValueError, KeyError, TypeError) as exc:
        return web.json_response({"error": str(exc)}, status=400)
    except (TimeoutError, OSError):
        return web.json_response(
            {"error": "Comunicação indisponível; operação não reenviada. Resultado físico não confirmado."},
            status=503,
        )


async def api(request):
    port = request.app["port"]
    manager = port.manager
    message = await request.json()
    if not isinstance(message, dict) or set(message) - {"type", "action", "data", "confirmed", "revision"}:
        raise ManagerError("Solicitação inválida.")
    action, data = message.get("action"), message.get("data", {})
    if not isinstance(data, dict):
        raise ManagerError("Dados inválidos.")
    revision = message.get("revision")
    confirmed = message.get("confirmed") is True
    if action == "list":
        return web.json_response(manager.snapshot())
    if action == "export":
        async with manager.lock:
            port.refresh(manager.state)
            result = deepcopy(manager.state)
        return web.json_response(result)
    if not port.client.connected:
        raise ManagerError("Home Assistant desconectado. Nenhum comando foi enfileirado.")
    if action == "operate":
        if set(data) != {"module_uuid", "number", "payload"}:
            raise ManagerError("Parâmetros inválidos; tópicos arbitrários não são aceitos.")
        await manager.operate(data["module_uuid"], data["number"], data["payload"], confirmed, revision)
        return web.json_response({"sent": True, "state_confirmed": False})
    if action == "import":
        async with manager.lock:
            await port.inspect()
            if port.legacy_active:
                raise ManagerError("Desative a integração anterior antes de importar o cadastro.")
            if not confirmed or type(revision) is not int or revision != manager.state["revision"]:
                raise ManagerError("Confirme a importação sobre a revisão atual.")
            if (
                manager.state["modules"]
                or manager.state["owned_topics"]
                or manager.state["next_module_number"] != 1
            ):
                raise ManagerError(
                    "Importação permitida somente em aplicativo vazio; não sobrescreve cadastros."
                )
            inventory = data.get("inventory")
            if isinstance(inventory, dict) and "data" in inventory and "version" in inventory:
                inventory = inventory["data"]  # Native HA Store wrapper, preserved identities.
            inventory = validate_storage(inventory)
            await port.save(inventory)
            manager.state = inventory
            await port.sync_subscriptions()
        return web.json_response(manager.snapshot())
    if action not in {"create", "save", "delete", "prepare_remove", "reconcile"}:
        raise ManagerError("Operação inválida.")
    # Validate actual configuration before generating targets and applying changes.
    async with manager.lock:
        await port.inspect()
        await port.sync_subscriptions()
    if action == "reconcile":
        result = await manager.reconcile(force=True)
    else:
        result = await manager.mutate(action, revision, data, confirmed)
    await port.sync_subscriptions()
    return web.json_response(result)


async def lifecycle(app):
    port = app["port"]
    await port.manager.load()  # Corrupt inventory stops startup; never silently resets.

    async def monitor():
        delay = 1
        force = True
        while True:
            try:
                if not port.client.connected:
                    await port.client.open()
                    force = True
                async with port.manager.lock:
                    was_connected = port.connected
                    old_prefix = port.prefix
                    await port.inspect()
                    await port.sync_subscriptions()
                    await port.registries()
                    force = force or (not was_connected and port.connected) or old_prefix != port.prefix
                if port.connected and not port.legacy_active and (force or port.manager.state["error"]):
                    await port.manager.reconcile(force=force)
                    force = False
                delay = 2 if not port.manager.state["error"] else min(delay * 2, 30)
            except asyncio.CancelledError:
                raise
            except Exception:
                # No diagnostics, credentials, inventory or MQTT traffic in public logs.
                port.error = (
                    "Não foi possível verificar o Home Assistant/MQTT. Reconexão automática em andamento."
                )
                port._connected = False
                port.received.clear()
                port.tests.disconnected()
                delay = min(delay * 2, 30)
            await asyncio.sleep(delay)

    task = asyncio.create_task(monitor())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    port.tests.close()
    await port.client.close()


def create_app(port, static=None, start=True):
    app = web.Application(middlewares=[protect], client_max_size=8 * 1024 * 1024)
    app["port"] = port
    if port.manager is None:
        port.manager = Manager(port)
    if start:
        app.cleanup_ctx.append(lifecycle)
    app.router.add_post("/api", api)
    static = Path(static or Path(__file__).resolve().parents[1] / "static")

    async def index(request):
        return web.FileResponse(static / "index.html")

    app.router.add_get("/", index)
    # An explicit allowlist prevents exposing backend files or inventory.
    for name in ("bootstrap.js", "panel.js"):

        async def asset(request, filename=name):
            return web.FileResponse(static / filename)

        app.router.add_get("/" + name, asset)
    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    token = os.environ.get("SUPERVISOR_TOKEN")
    if not token:
        raise SystemExit("Este aplicativo requer o Supervisor do Home Assistant.")
    port = RemotePort(HAClient(token), "/data/inventory.json")
    web.run_app(create_app(port), port=8099, access_log=None)
