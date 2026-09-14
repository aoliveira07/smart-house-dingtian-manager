"""HA registries and its existing MQTT connection, reached through Supervisor."""

import asyncio
import json
import time
from copy import deepcopy

from .core.models import ManagerError
from .core.mqtt_discovery import entity_id, topics
from .core.relay_test import RelayTests
from .store import Store


class RemotePort:
    def __init__(self, client, path):
        self.client = client
        self.store = Store(path)
        self.manager = None
        self.entities = {}
        self.devices = {}
        self.areas = {}
        self.states = {}
        self.received = {}
        self.state_versions = {}
        self.discovery_seen = {}
        self.debug = []
        self.subscriptions = {}
        self.pending_echo = {}
        self._connected = False
        self.checked_at = 0
        self.prefix = "homeassistant"
        self.legacy_active = False
        self.error = "Conectando ao Home Assistant…"
        self.tests = RelayTests(self.changed)
        client.on_disconnect = self.disconnected

    @property
    def connected(self):
        return self.client.connected and self._connected and time.monotonic() - self.checked_at < 10

    async def load(self):
        return await self.store.load()

    async def save(self, state):
        await self.store.save(deepcopy(state))

    def changed(self):
        pass  # Ingress clients poll snapshots; no per-browser broker subscriptions.

    def disconnected(self):
        self._connected = False
        self.received.clear()
        self.discovery_seen.clear()
        self.subscriptions.clear()
        self.tests.disconnected()
        for _, future in self.pending_echo.values():
            if not future.done():
                future.set_exception(ManagerError("Conexão interrompida durante Discovery."))

    async def inspect(self):
        """Fail closed if actual MQTT configuration/connection cannot be verified."""
        try:
            entries = await self.client.call("config_entries/get")
            self.legacy_active = any(
                e["domain"] == "smart_house_dingtian" and not e.get("disabled_by") for e in entries
            )
            mqtt_entries = [e for e in entries if e["domain"] == "mqtt" and e.get("state") == "loaded"]
            if len(mqtt_entries) != 1:
                raise ManagerError("Configure uma integração MQTT ativa em Dispositivos e serviços.")
            diagnostic = (await self.client.get("diagnostics/config_entry/" + mqtt_entries[0]["entry_id"]))[
                "data"
            ]
            config = diagnostic["mqtt_config"]
            merged = {**config.get("data", {}), **config.get("options", {})}
            if not merged.get("discovery", True):
                raise ManagerError("Ative MQTT Discovery na integração MQTT do Home Assistant.")
            prefix = merged.get("discovery_prefix", "homeassistant")
            if not isinstance(prefix, str) or not prefix or any(c in prefix for c in ("#", "+", "\x00")):
                raise ManagerError("Prefixo Discovery inválido no Home Assistant.")
            self.prefix = prefix
            now_connected = diagnostic["connected"] is True
            if now_connected != self._connected:
                self.received.clear()
                self.tests.disconnected()
                if now_connected:
                    # Refresh retained availability and state after a broker reconnect.
                    for ident in list(self.subscriptions.values()):
                        await self.client.unsubscribe(ident)
                    self.subscriptions.clear()
                    self.discovery_seen.clear()
            self._connected = now_connected
            self.checked_at = time.monotonic()
            self.debug = diagnostic.get("mqtt_debug_info", {}).get("entities", [])
            self.error = None
        except Exception:
            self._connected = False
            self.received.clear()
            self.tests.disconnected()
            raise

    async def registries(self):
        entities, devices, states, areas = await asyncio.gather(
            self.client.call("config/entity_registry/list"),
            self.client.call("config/device_registry/list"),
            self.client.call("get_states"),
            self.client.call("config/area_registry/list"),
        )
        # Registry list omits unique_id in HA; get each MQTT entry's full details.
        mqtt_entities = [e for e in entities if e.get("platform") == "mqtt"]
        details = (
            await self.client.call(
                "config/entity_registry/get_entries", entity_ids=[e["entity_id"] for e in mqtt_entities]
            )
            if mqtt_entities
            else {}
        )
        self.entities = {e["entity_id"]: e for e in entities}
        self.entities.update({e["entity_id"]: e for e in details.values() if e})
        self.devices = {d["id"]: d for d in devices}
        self.areas = {a["area_id"]: {"area_id": a["area_id"], "name": a["name"]} for a in areas}
        self.states = {s["entity_id"]: s for s in states}

    def device(self, module):
        return next(
            (
                d
                for d in self.devices.values()
                if ["mqtt", "shd_" + module["module_uuid"]] in d.get("identifiers", [])
            ),
            None,
        )

    def is_ours(self, entry, module):
        device = self.device(module)
        if device and entry.get("device_id") == device["id"]:
            return True
        return not entry.get("device_id") and any(
            rec["module_uuid"] == module["module_uuid"]
            and rec["payload"]["unique_id"] == entry.get("unique_id")
            for rec in self.manager.state["owned_topics"].values()
        )

    def registry_entry(self, module, channel, domain=None):
        domain = domain or channel["entity_type"]
        return next(
            (
                e
                for e in self.entities.values()
                if e.get("platform") == "mqtt"
                and e.get("unique_id") == channel["unique_id"]
                and e["entity_id"].startswith(domain + ".")
                and self.is_ours(e, module)
            ),
            None,
        )

    def refresh(self, state):
        pending = {(x["module_uuid"], x.get("number")) for x in state.get("name_updates", [])}
        pending_areas = {
            (x["module_uuid"], x.get("number")) for x in state.get("name_updates", []) if "area_id" in x
        }
        for module in state["modules"].values():
            mid = module["module_uuid"]
            device = self.device(module)
            if device and device.get("name_by_user") and (mid, None) not in pending:
                module["display_name"] = device["name_by_user"]
            for channel in module["channels"]:
                for domain in ("light", "switch"):
                    entry = self.registry_entry(module, channel, domain)
                    if not entry:
                        continue
                    creating = next(
                        (
                            r
                            for r in state["owned_topics"].values()
                            if r["module_uuid"] == mid
                            and r["number"] == channel["number"]
                            and r["entity_type"] == domain
                            and r.get("applied") is None
                        ),
                        None,
                    )
                    if creating and entry["entity_id"] != creating["payload"]["default_entity_id"]:
                        continue
                    channel["last_entity_ids"][domain] = entry["entity_id"]
                    if domain == channel["entity_type"] and (mid, channel["number"]) not in pending_areas:
                        channel["area_id"] = entry.get("area_id")
                    if (
                        domain == channel["entity_type"]
                        and entry.get("name")
                        and (mid, channel["number"]) not in pending
                    ):
                        channel["display_name"] = entry["name"]

    def decorate(self, state):
        self.refresh(state)
        state["areas"] = sorted(self.areas.values(), key=lambda a: a["name"].casefold())
        state.update(
            broker_connected=self.connected, discovery_prefix=self.prefix, application_version="1.4.0"
        )
        if self.error or self.legacy_active:
            state["error"] = (
                self.error
                or "Desative a integração Dingtian anterior antes de usar o aplicativo. Preserve/exporte o cadastro."
            )
        for module in state["modules"].values():
            lwt = self.received.get(topics(module, module["channels"][0])["availability_topic"])
            module["availability"] = (
                "broker_offline" if not self.connected else lwt if lwt in ("online", "offline") else "unknown"
            )
            module["area_id"] = (self.device(module) or {}).get("area_id")
            module["used_count"] = sum(c["enabled"] for c in module["channels"])
            for channel in module["channels"]:
                entry = self.registry_entry(module, channel)
                channel["entity_id"] = entry["entity_id"] if entry else None
                channel["effective_area_id"] = channel.get("area_id") or module["area_id"]
                channel["effective_name"] = channel["display_name"]
                channel["topics"] = topics(module, channel)
                raw = self.received.get(channel["topics"]["state_topic"])
                channel["state"] = (
                    raw if self.connected and lwt == "online" and raw in ("ON", "OFF") else "unknown"
                )
                channel["state_version"] = self.state_versions.get(channel["topics"]["state_topic"], 0)
                channel["test"] = dict(self.tests.get(module, channel))
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
                if a.get("area_id") != b.get("area_id") or (
                    b["enabled"] and (not a["enabled"] or a["entity_type"] != b["entity_type"])
                ):
                    changes.append({"module_uuid": mid, "number": b["number"], "area_id": b.get("area_id")})
        return changes

    async def apply_names(self, changes):
        changes = list(changes)
        # HA automatically prefixes device names when the entity has no name override.
        # Repair existing entities and initialize newly enabled/recreated channels alike.
        pending_names = {(c["module_uuid"], c.get("number")) for c in changes if "name" in c}
        for module in self.manager.state["modules"].values():
            if module["deleted"]:
                continue
            for channel in module["channels"]:
                entry = self.registry_entry(module, channel)
                if channel["enabled"] and entry and entry.get("name") is None:
                    if (module["module_uuid"], channel["number"]) not in pending_names:
                        changes.append(
                            {
                                "module_uuid": module["module_uuid"],
                                "number": channel["number"],
                                "name": channel["display_name"],
                            }
                        )
        for change in changes:
            module = self.manager.state["modules"][change["module_uuid"]]
            if "number" in change:
                entry = self.registry_entry(module, module["channels"][change["number"] - 1])
                if entry:
                    await self.client.call(
                        "config/entity_registry/update",
                        entity_id=entry["entity_id"],
                        **{k: change[k] for k in ("name", "area_id") if k in change},
                    )
            else:
                device = self.device(module)
                if device:
                    await self.client.call(
                        "config/device_registry/update", device_id=device["id"], name_by_user=change["name"]
                    )
        if changes:
            await self.registries()

    def external_configs(self):
        for topic, payload in self.discovery_seen.items():
            components = payload.get("components", payload.get("cmps"))
            for item in components.values() if isinstance(components, dict) else [payload]:
                if isinstance(item, dict):
                    cmd = item.get("command_topic", item.get("cmd_t", ""))
                    if isinstance(cmd, str):
                        cmd = cmd.replace("~", payload.get("~", ""))
                    yield topic, item.get("unique_id", item.get("uniq_id")), cmd
        for info in self.debug:
            discovery = info.get("discovery_data") or {}
            payload = discovery.get("payload") or {}
            if isinstance(payload, dict):
                yield discovery.get("topic"), payload.get("unique_id"), payload.get("command_topic")

    async def preflight(self, state, targets):
        if self.legacy_active:
            raise ManagerError(
                "Desative a integração Dingtian anterior para evitar dois gerenciadores simultâneos."
            )
        if self.error:
            raise ManagerError(self.error)
        await self.registries()
        for module in state["modules"].values():
            if module["deleted"]:
                continue
            for channel in module["channels"]:
                if channel.get("area_id") and channel["area_id"] not in self.areas:
                    raise ManagerError("Cômodo não existe mais no Home Assistant. Selecione outra área.")
        for record in targets.values():
            module = state["modules"][record["module_uuid"]]
            channel = module["channels"][record["number"] - 1]
            for entry in self.entities.values():
                if (
                    entry.get("platform") == "mqtt"
                    and entry.get("unique_id") == channel["unique_id"]
                    and not self.is_ours(entry, module)
                ):
                    raise ManagerError("Conflito de unique_id com entidade existente: " + entry["entity_id"])
            planned = entity_id(channel)
            existing = self.entities.get(planned)
            if existing and (
                existing.get("unique_id") != channel["unique_id"] or not self.is_ours(existing, module)
            ):
                raise ManagerError("entity_id ocupado: " + planned)
            if not existing and planned in self.states:
                raise ManagerError("entity_id ocupado fora do registro: " + planned)
            for topic, uid, cmd in self.external_configs():
                if topic not in state["owned_topics"] and (
                    uid == channel["unique_id"] or cmd == record["payload"]["command_topic"]
                ):
                    raise ManagerError("Conflito MQTT por identidade/tópico. Confira o cadastro legado.")

    def receive(self, message):
        topic, raw = message["topic"], message["payload"]
        if topic in self.pending_echo:
            expected, future = self.pending_echo[topic]
            if raw == expected and not future.done():
                future.set_result(None)
        if topic.endswith("/config"):
            if not raw:
                self.discovery_seen.pop(topic, None)
            else:
                try:
                    payload = json.loads(raw)
                    if isinstance(payload, dict):
                        self.discovery_seen[topic] = payload
                except (TypeError, ValueError):
                    pass
        else:
            self.received[topic] = raw
            if not message.get("retain", False):
                self.state_versions[topic] = self.state_versions.get(topic, 0) + 1
            self.tests.receive(topic, raw, message.get("retain", False))
            if topic.endswith("/lwt_availability") and raw != "online":
                base = topic.rsplit("/", 1)[0] + "/"
                for pending in list(self.tests.timers):
                    if pending.startswith(base):
                        self.tests.fail(pending, "Módulo offline; resultado físico não confirmado.")

    def forget_prefix(self, prefix):
        for topic in list(self.received):
            if topic.startswith(prefix):
                self.received.pop(topic, None)
        for topic in list(self.tests.items):
            if topic.startswith(prefix):
                timer = self.tests.timers.pop(topic, None)
                if timer:
                    timer.cancel()
                self.tests.items.pop(topic, None)

    async def sync_subscriptions(self):
        wanted = {self.prefix + "/#"}
        for topic, record in self.manager.state["owned_topics"].items():
            marker = f"/{record['entity_type']}/shd_{self.manager.state['manager_uuid']}/"
            wanted.add(topic.split(marker)[0] + "/#")
        for module in self.manager.state["modules"].values():
            wanted.add(f"{module['mqtt_prefix']}/relay{module['serial']}/out/#")
        for topic in set(self.subscriptions) - wanted:
            await self.client.unsubscribe(self.subscriptions.pop(topic))
            self.forget_prefix(topic[:-1])
        for topic in wanted - set(self.subscriptions):
            self.subscriptions[topic] = await self.client.call(
                "mqtt/subscribe", topic=topic, qos=1, callback=self.receive
            )

    async def publish_config(self, topic, payload, record):
        if time.monotonic() - self.checked_at > 5:
            await self.inspect()
        if not self.connected:
            raise ManagerError("Broker desconectado durante Discovery.")
        future = asyncio.get_running_loop().create_future()
        self.pending_echo[topic] = (payload, future)
        try:
            await self.client.publish(topic, payload, 1, True)
            await asyncio.wait_for(future, 15)
        finally:
            self.pending_echo.pop(topic, None)

    async def _wait_entity(self, record, created):
        module = self.manager.state["modules"][record["module_uuid"]]
        channel = module["channels"][record["number"] - 1]
        for _ in range(30):
            await self.registries()
            entry = self.registry_entry(module, channel, record["entity_type"])
            if not created and not entry:
                return
            if created and entry:
                if entry["entity_id"] != entity_id(channel):
                    raise ManagerError("HA atribuiu um sufixo inesperado; resolva a colisão no registro.")
                channel["last_entity_ids"][channel["entity_type"]] = entry["entity_id"]
                return
            await asyncio.sleep(0.3)
        raise ManagerError("Discovery enviado; alteração da entidade ainda não confirmada no HA.")

    async def wait_created(self, record):
        await self._wait_entity(record, True)

    async def wait_removed(self, record):
        await self._wait_entity(record, False)

    async def capture_entity(self, record):
        await self.registries()
        module = self.manager.state["modules"][record["module_uuid"]]
        channel = module["channels"][record["number"] - 1]
        entry = self.registry_entry(module, channel)
        if not entry:
            return {}
        metadata = {
            k: entry[k]
            for k in ("name", "icon", "area_id", "aliases", "labels", "disabled_by", "hidden_by")
            if k in entry
        }
        metadata["area_id"] = entry.get("area_id") or (self.device(module) or {}).get("area_id")
        return metadata

    async def restore_entity(self, record, metadata):
        module = self.manager.state["modules"][record["module_uuid"]]
        channel = module["channels"][record["number"] - 1]
        entry = self.registry_entry(module, channel)
        if metadata and entry:
            await self.client.call("config/entity_registry/update", entity_id=entry["entity_id"], **metadata)
            channel["area_id"] = metadata.get("area_id")
            await self.registries()
        if not entry or entry.get("device_id"):
            raise ManagerError("Migração para entidade independente ainda não confirmada.")

    async def send_command(self, module, channel, payload):
        await self.inspect()
        if self.legacy_active or not self.connected:
            raise ManagerError("MQTT indisponível; comando não enviado.")
        await self.client.publish(topics(module, channel)["command_topic"], payload, 0, False)

    async def operate(self, module, channel, payload):
        # Fresh broker check immediately before a command. No cached credentials/client queue.
        await self.inspect()
        if self.legacy_active or not self.connected:
            raise ManagerError("Comando bloqueado: conexão indisponível ou integração anterior ativa.")
        if self.received.get(topics(module, channel)["availability_topic"]) != "online":
            raise ManagerError("Disponibilidade do módulo não confirmada; comando descartado.")
        topic = self.tests.begin(module, channel, payload)
        try:
            await self.client.publish(topics(module, channel)["command_topic"], payload, 0, False)
        except Exception:
            self.tests.fail(topic, "Falha no envio; resultado físico não confirmado. Sem reenvio.")
            raise
