"""HA 2026.9 MQTT/registry boundary, kept separate from transaction logic."""

import asyncio
import json
from copy import deepcopy

from homeassistant.components import mqtt
from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import SIGNAL
from .models import ManagerError
from .mqtt_discovery import entity_id, topics
from .relay_test import RelayTests
from .storage import InventoryStore


class HAPort:
    def __init__(self, hass, entry):
        self.hass = hass
        self.entry = entry
        self.store = InventoryStore(hass)
        self.manager = None
        self.unsubs = []
        self.module_unsubs = {}
        self.received = {}
        self.discovery_seen = {}
        self.pending_echo = {}
        self.closed = False
        self.retry_task = None
        self.tests = RelayTests(self.changed)
        self._prefix = mqtt.DEFAULT_PREFIX

    @property
    def connected(self):
        return mqtt.DATA_MQTT in self.hass.data and mqtt.is_connected(self.hass)

    @property
    def prefix(self):
        if mqtt.DATA_MQTT in self.hass.data:
            self._prefix = self.hass.data[mqtt.DATA_MQTT].client.conf.get(
                mqtt.CONF_DISCOVERY_PREFIX, mqtt.DEFAULT_PREFIX
            )
        return self._prefix

    async def load(self):
        return await self.store.async_load()

    async def save(self, state):
        await self.store.async_save(deepcopy(state))

    @callback
    def changed(self):
        async_dispatcher_send(self.hass, SIGNAL)

    def registry_entry(self, module, channel, domain=None):
        registry = er.async_get(self.hass)
        eid = registry.async_get_entity_id(domain or channel["entity_type"], "mqtt", channel["unique_id"])
        entry = registry.async_get(eid) if eid else None
        if entry and self.is_ours(entry, module):
            return entry
        return None

    def is_ours(self, entry, module):
        device = dr.async_get(self.hass).async_get(entry.device_id) if entry.device_id else None
        return bool(device and ("mqtt", f"shd_{module['module_uuid']}") in device.identifiers)

    def refresh(self, state):
        """Read HA overrides; explicit pending renames win until applied."""
        updates = state.get("name_updates", [])
        pending = {(x["module_uuid"], x.get("number")) for x in updates}
        for module in state["modules"].values():
            device = dr.async_get(self.hass).async_get_device(
                identifiers={("mqtt", f"shd_{module['module_uuid']}")}
            )
            if device and device.name_by_user and (module["module_uuid"], None) not in pending:
                module["display_name"] = device.name_by_user
            for c in module["channels"]:
                for domain in ("light", "switch"):
                    entry = self.registry_entry(module, c, domain)
                    if entry:
                        pending_creation = next(
                            (
                                r
                                for r in state["owned_topics"].values()
                                if r["module_uuid"] == module["module_uuid"]
                                and r["number"] == c["number"]
                                and r["entity_type"] == domain
                                and r.get("applied") is None
                            ),
                            None,
                        )
                        if (
                            pending_creation
                            and entry.entity_id != pending_creation["payload"]["default_entity_id"]
                        ):
                            continue  # Never silently adopt a suffix assigned in a failed creation.
                        c["last_entity_ids"][domain] = entry.entity_id
                        if (
                            domain == c["entity_type"]
                            and entry.name
                            and (module["module_uuid"], c["number"]) not in pending
                        ):
                            c["display_name"] = entry.name

    def decorate(self, state):
        self.refresh(state)
        state["broker_connected"] = self.connected
        state["discovery_prefix"] = self.prefix
        state["pending_topics"] = [t for t, r in state["owned_topics"].items() if not r.get("applied")]
        for module in state["modules"].values():
            availability = topics(module, module["channels"][0])["availability_topic"]
            lwt = self.received.get(availability)
            module["availability"] = (
                "broker_offline" if not self.connected else lwt if lwt in ("online", "offline") else "unknown"
            )
            module["used_count"] = sum(c["enabled"] for c in module["channels"])
            for c in module["channels"]:
                addresses = topics(module, c)
                entry = self.registry_entry(module, c)
                current = self.hass.states.get(entry.entity_id) if entry else None
                c["entity_id"] = entry.entity_id if entry else None
                c["effective_name"] = current.name if current else c["display_name"]
                c["topics"] = addresses
                c["test"] = dict(self.tests.get(module, c))
                raw = self.received.get(addresses["state_topic"])
                c["state"] = raw if self.connected and lwt == "online" and raw in ("ON", "OFF") else "unknown"
        return state

    def name_updates(self, before, desired):
        changes = []
        for mid, module in desired["modules"].items():
            if mid not in before["modules"] or module["deleted"]:
                continue
            old = before["modules"][mid]
            if module["display_name"] != old["display_name"]:
                changes.append({"module_uuid": mid, "name": module["display_name"]})
            for a, b in zip(old["channels"], module["channels"], strict=True):
                if a["display_name"] != b["display_name"]:
                    changes.append({"module_uuid": mid, "number": b["number"], "name": b["display_name"]})
        return changes

    async def apply_names(self, changes):
        for change in changes:
            module = self.manager.state["modules"][change["module_uuid"]]
            if "number" in change:
                c = module["channels"][change["number"] - 1]
                entry = self.registry_entry(module, c)
                if entry:
                    er.async_get(self.hass).async_update_entity(entry.entity_id, name=change["name"])
            else:
                device = dr.async_get(self.hass).async_get_device(
                    identifiers={("mqtt", f"shd_{module['module_uuid']}")}
                )
                if device:
                    dr.async_get(self.hass).async_update_device(device.id, name_by_user=change["name"])

    def external_configs(self):
        # Retained single-component AND manufacturer device-discovery messages.
        for topic, payload in self.discovery_seen.items():
            base = payload.get("~", "")
            components = payload.get("components", payload.get("cmps"))
            for item in components.values() if isinstance(components, dict) else [payload]:
                if not isinstance(item, dict):
                    continue
                cmd = item.get("command_topic", item.get("cmd_t", ""))
                if isinstance(cmd, str):
                    cmd = cmd.replace("~", base)
                yield topic, item.get("unique_id", item.get("uniq_id")), cmd
        # Debug info also exposes active YAML and expanded MQTT discovery config.
        data = self.hass.data.get(mqtt.DATA_MQTT)
        if data is None:
            return
        for info in data.debug_info_entities.values():
            discovery_data = info.get("discovery_data") or {}
            payload = discovery_data.get("discovery_payload") or {}
            yield (
                discovery_data.get("discovery_topic"),
                payload.get("unique_id"),
                payload.get("command_topic"),
            )
        for block in data.config:
            for items in block.values():
                for item in items if isinstance(items, list) else []:
                    if isinstance(item, dict):
                        yield None, item.get("unique_id"), item.get("command_topic")

    async def preflight(self, state, targets):
        registry = er.async_get(self.hass)
        for record in targets.values():
            module = state["modules"][record["module_uuid"]]
            c = module["channels"][record["number"] - 1]
            for domain in ("light", "switch"):
                eid = registry.async_get_entity_id(domain, "mqtt", c["unique_id"])
                if eid and not self.is_ours(registry.async_get(eid), module):
                    raise ManagerError(
                        f"Conflito com entidade existente: {eid}. Remova o legado individualmente."
                    )
            planned = entity_id(c)
            existing = registry.async_get(planned)
            if existing and (existing.unique_id != c["unique_id"] or not self.is_ours(existing, module)):
                raise ManagerError(f"entity_id ocupado: {planned}. Nenhum sufixo automático será aceito.")
            if not existing and self.hass.states.get(planned):
                raise ManagerError(f"entity_id ocupado fora do registro: {planned}.")
            for topic, uid, cmd in self.external_configs():
                if topic in state["owned_topics"]:
                    continue
                if uid == c["unique_id"] or cmd == record["payload"]["command_topic"]:
                    raise ManagerError(
                        "Conflito MQTT detectado por unique_id/tópico de comando; confira o legado/discovery do fabricante."
                    )

    async def publish_config(self, topic, payload, record):
        if not self.connected:
            raise ManagerError("Broker desconectado durante a sincronização.")
        # Receive our own config back from the broker, not just a local publish ACK.
        future = self.hass.loop.create_future()
        self.pending_echo[topic] = (payload, future)
        try:
            await mqtt.async_publish(self.hass, topic, payload, qos=1, retain=True)
            await asyncio.wait_for(future, 15)
        finally:
            self.pending_echo.pop(topic, None)

    async def wait_removed(self, record):
        module = self.manager.state["modules"][record["module_uuid"]]
        c = module["channels"][record["number"] - 1]
        for _ in range(100):
            entry = self.registry_entry(module, c, record["entity_type"])
            if not entry:
                return
            await asyncio.sleep(0.1)
        raise ManagerError(
            "Discovery removido no broker; HA ainda mantém a entidade. Tente sincronizar novamente."
        )

    async def wait_created(self, record):
        module = self.manager.state["modules"][record["module_uuid"]]
        c = module["channels"][record["number"] - 1]
        for _ in range(100):
            entry = self.registry_entry(module, c)
            if entry:
                expected = entity_id(c)
                if entry.entity_id != expected:
                    raise ManagerError(
                        f"HA atribuiu {entry.entity_id}; esperado {expected}. Resolva a colisão no registro."
                    )
                c["last_entity_ids"][c["entity_type"]] = entry.entity_id
                return
            await asyncio.sleep(0.1)
        raise ManagerError("Discovery publicado; criação da entidade no HA ainda não confirmada.")

    async def operate(self, module, channel, payload):
        if not self.connected:
            raise ManagerError("Broker offline; comando descartado.")
        if self.received.get(topics(module, channel)["availability_topic"]) != "online":
            raise ManagerError("Disponibilidade do módulo não confirmada; comando descartado.")
        topic = self.tests.begin(module, channel, payload)
        try:
            await mqtt.async_publish(
                self.hass, topics(module, channel)["command_topic"], payload, qos=0, retain=False
            )
        except Exception:
            self.tests.fail(topic, "Falha no envio; resultado físico não confirmado. Sem reenvio.")
            raise

    async def start(self):
        @callback
        def discovery_received(msg):
            raw = str(msg.payload)
            if msg.topic in self.pending_echo:
                expected, future = self.pending_echo[msg.topic]
                if raw == expected and not future.done():
                    future.set_result(None)
            if not msg.topic.endswith("/config"):
                return
            if not raw:
                self.discovery_seen.pop(msg.topic, None)
            else:
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, dict):
                        self.discovery_seen[msg.topic] = parsed
                except (ValueError, TypeError):
                    pass

        prefixes = {self.prefix}
        for topic, record in self.manager.state["owned_topics"].items():
            marker = f"/{record['entity_type']}/shd_{self.manager.state['manager_uuid']}/"
            prefixes.add(topic.split(marker)[0])
        for prefix in prefixes:
            self.unsubs.append(
                await mqtt.async_subscribe(self.hass, f"{prefix}/#", discovery_received, qos=1)
            )
        self.unsubs.append(mqtt.async_subscribe_connection_status(self.hass, self.connection_changed))
        self.unsubs.append(
            self.hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, self.registry_changed)
        )
        self.unsubs.append(
            self.hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, self.registry_changed)
        )
        await self.sync_subscriptions()
        self.schedule_reconcile(force=True)

    @callback
    def registry_changed(self, event):
        self.changed()

    @callback
    def connection_changed(self, connected):
        self.tests.disconnected()
        self.received.clear()  # never show stale restored state as current confirmation
        self.changed()
        if connected:
            self.schedule_reconcile(force=True)

    def schedule_reconcile(self, force=False):
        if self.closed:
            return
        if self.retry_task and not self.retry_task.done():
            return

        async def run():
            nonlocal force
            # Allow HA MQTT discovery/subscriptions to settle, then bounded backoff.
            delay = 1
            while not self.closed:
                await asyncio.sleep(delay)
                await self.sync_subscriptions()
                await self.manager.reconcile(force=force)
                force = False
                if not self.manager.state["error"] or not self.connected:
                    break
                delay = min(delay * 2, 60)

        self.retry_task = self.entry.async_create_background_task(self.hass, run(), "Dingtian reconciliation")

    async def sync_subscriptions(self):
        active = self.manager.state["modules"]
        for mid in set(self.module_unsubs) - set(active):
            self.module_unsubs.pop(mid)()
        for mid, module in active.items():
            if mid in self.module_unsubs:
                continue

            @callback
            def received(msg):
                self.received[msg.topic] = msg.payload
                self.tests.receive(msg.topic, msg.payload, msg.retain)
                if msg.topic.endswith("/lwt_availability") and msg.payload != "online":
                    base = msg.topic.rsplit("/", 1)[0] + "/"
                    for topic in list(self.tests.timers):
                        if topic.startswith(base):
                            self.tests.fail(topic, "Módulo offline; resultado físico não confirmado.")
                self.changed()

            base = f"{module['mqtt_prefix']}/relay{module['serial']}/out/#"
            self.module_unsubs[mid] = await mqtt.async_subscribe(self.hass, base, received)

    async def close(self):
        self.closed = True
        self.tests.close()
        if self.retry_task and not self.retry_task.done():
            self.retry_task.cancel()
            try:
                await self.retry_task
            except asyncio.CancelledError:
                pass
        for unsub in self.unsubs + list(self.module_unsubs.values()):
            unsub()
        self.unsubs.clear()
        self.module_unsubs.clear()
