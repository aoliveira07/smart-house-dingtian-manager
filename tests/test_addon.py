"""Isolated application contract tests; no home network or relay hardware."""

import asyncio
import json
from copy import deepcopy
from types import SimpleNamespace

import pytest
from aiohttp import web

from dingtian_manager.app.core.manager import Manager
from dingtian_manager.app.core.models import ManagerError
from dingtian_manager.app.port import RemotePort
from dingtian_manager.app.server import api, protect
from dingtian_manager.app.store import Store


class FakeHA:
    connected = True
    broker = True
    legacy = False
    admin = True

    def __init__(self):
        self.calls = []
        self.published = []
        self.subs = {}
        self.entities = {}
        self.devices = {}
        self.areas = [{"area_id": "cozinha", "name": "Cozinha"}, {"area_id": "sala", "name": "Sala"}]
        self.discovery = {}

    async def is_admin(self, uid):
        return self.admin and uid == "admin-user"

    async def call(self, kind, callback=None, **data):
        self.calls.append((kind, data))
        if kind == "config_entries/get":
            return [{"domain": "mqtt", "state": "loaded", "entry_id": "mqtt-test"}] + (
                [{"domain": "smart_house_dingtian"}] if self.legacy else []
            )
        if kind == "config/entity_registry/list":
            return list(self.entities.values())
        if kind == "config/entity_registry/get_entries":
            return {key: self.entities[key] for key in data["entity_ids"]}
        if kind == "config/device_registry/list":
            return list(self.devices.values())
        if kind == "config/area_registry/list":
            return self.areas
        if kind == "get_states":
            return []
        if kind == "mqtt/subscribe":
            ident = len(self.calls)
            self.subs[ident] = (data["topic"], callback)
            return ident
        if kind == "config/entity_registry/update":
            self.entities[data["entity_id"]].update({k: data[k] for k in ("name", "area_id") if k in data})
        if kind == "config/device_registry/update":
            self.devices[data["device_id"]]["name_by_user"] = data["name_by_user"]

    async def get(self, path):
        return {
            "data": {
                "connected": self.broker,
                "mqtt_config": {"data": {}, "options": {"discovery_prefix": "isolated_discovery"}},
                "mqtt_debug_info": {"entities": []},
            }
        }

    async def unsubscribe(self, ident):
        self.subs.pop(ident)

    def receive(self, topic, payload, retain=False):
        for subscription, callback in list(self.subs.values()):
            if topic.startswith(subscription[:-1]):
                callback({"topic": topic, "payload": payload, "retain": retain})

    async def publish(self, topic, payload, qos, retain):
        self.published.append((topic, payload, qos, retain))
        if topic.endswith("/config"):
            if payload:
                config = json.loads(payload)
                eid = config["default_entity_id"]
                did = config["device"]["identifiers"][0]
                self.devices[did] = {"id": did, "identifiers": [["mqtt", did]]}
                self.entities[eid] = {
                    **self.entities.get(eid, {}),
                    "entity_id": eid,
                    "unique_id": config["unique_id"],
                    "platform": "mqtt",
                    "device_id": did,
                }
                self.discovery[topic] = eid
            else:
                self.entities.pop(self.discovery.pop(topic, None), None)
            self.receive(topic, payload)


async def setup(tmp_path, count=8):
    client = FakeHA()
    port = RemotePort(client, tmp_path / "inventory.json")
    manager = port.manager = Manager(port)
    await manager.load()
    await port.inspect()
    await port.sync_subscriptions()
    await manager.mutate("create", 0, {"serial": "00123", "channel_count": count})
    await port.sync_subscriptions()
    mid = next(iter(manager.state["modules"]))
    return client, port, manager, mid


async def test_area_persists_before_enable_moves_entity_and_survives_restart(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0]["area_id"] = "cozinha"
    await manager.mutate("save", 1, module)
    assert not client.published
    assert manager.snapshot()["areas"][0]["name"] == "Cozinha"
    module["channels"][0]["enabled"] = True
    await manager.mutate("save", 2, module)
    assert manager.state["error"] is None
    assert client.entities["light.cabeado1_r1"]["area_id"] == "cozinha"
    # Another channel is not moved along with R1; the module device has no area mutation.
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0].update(area_id="sala", entity_type="switch")
    await manager.mutate("save", 3, module, True)
    assert manager.state["error"] is None
    assert client.entities["switch.cabeado1_r1"]["area_id"] == "sala"
    restarted = Manager(port)
    await restarted.load()
    assert restarted.state["modules"][mid]["channels"][0]["area_id"] == "sala"
    # External HA edits are read back instead of being overwritten by reconcile.
    client.entities["switch.cabeado1_r1"]["area_id"] = "cozinha"
    await port.registries()
    await manager.reconcile()
    assert manager.snapshot()["modules"][mid]["channels"][0]["area_id"] == "cozinha"
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0]["area_id"] = None
    await manager.mutate("save", 4, module)
    assert client.entities["switch.cabeado1_r1"]["area_id"] is None
    assert not any("/in/" in p[0] for p in client.published)


async def test_missing_area_rejected_without_persisting_or_publishing(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0]["area_id"] = "area_removida"
    with pytest.raises(ManagerError, match="Cômodo"):
        await manager.mutate("save", 1, module)
    assert manager.state["revision"] == 1
    assert not client.published


async def test_area_failure_is_journaled_and_reconciled(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    original = client.call

    async def fail_area(kind, **data):
        if kind == "config/entity_registry/update" and "area_id" in data:
            raise RuntimeError("HA temporarily unavailable")
        return await original(kind, **data)

    client.call = fail_area
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0].update(enabled=True, area_id="cozinha")
    await manager.mutate("save", 1, module)
    assert manager.state["error"]
    assert manager.state["name_updates"][-1]["area_id"] == "cozinha"
    client.call = original
    await manager.reconcile()
    assert manager.state["error"] is None
    assert client.entities["light.cabeado1_r1"]["area_id"] == "cozinha"
    assert not any("/in/" in p[0] for p in client.published)


@pytest.mark.parametrize("count", [8, 16, 32])
async def test_unused_r7_before_name_type_and_discovery(tmp_path, count):
    client, port, manager, mid = await setup(tmp_path, count)
    module = deepcopy(manager.state["modules"][mid])
    channel = module["channels"][6]
    channel.update(display_name="", entity_type="", enabled=False)
    await manager.mutate("save", 1, module)
    client.receive("/Cabeado/relay00123/out/lwt_availability", "online")
    before = deepcopy(manager.state)
    await manager.operate(mid, 7, "ON", True, 2)
    assert client.published == [("/Cabeado/relay00123/in/r7", "ON", 0, False)]
    assert manager.state == before
    assert not manager.state["owned_topics"] and not client.entities
    result = manager.snapshot()["modules"][mid]["channels"][6]
    assert result["state"] == "unknown" and result["test"]["status"] == "pending"
    client.receive("/Cabeado/relay00123/out/r7", "ON", retain=True)
    assert manager.snapshot()["modules"][mid]["channels"][6]["test"]["status"] == "pending"
    client.receive("/Cabeado/relay00123/out/r1", "OFF")
    client.receive("/Cabeado/relay00123/out/r7", "ON")
    result = manager.snapshot()["modules"][mid]["channels"][6]
    assert result["state"] == "ON" and result["test"]["status"] == "confirmed"
    # Naming/enabling preserves identity, publishes only one Discovery, no second command.
    channel.update(display_name="Cozinha", entity_type="light", enabled=True)
    await manager.mutate("save", 2, module)
    assert manager.state["error"] is None
    assert list(client.entities) == ["light.cabeado1_r7"]
    assert len(client.published) == 2 and client.published[1][0].startswith("isolated_discovery/light/")
    assert client.published[1][2:] == (1, True)
    port.tests.close()


@pytest.mark.parametrize("availability,broker", [(None, True), ("offline", True), ("online", False)])
async def test_offline_unknown_no_queue(tmp_path, availability, broker):
    client, port, manager, mid = await setup(tmp_path)
    if availability:
        client.receive("/Cabeado/relay00123/out/lwt_availability", availability)
    client.broker = broker
    with pytest.raises(ManagerError):
        await manager.operate(mid, 7, "ON", True, 1)
    client.broker = True
    await port.inspect()
    assert client.published == []


async def test_duplicate_timeout_revision_and_disconnect(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    client.receive("/Cabeado/relay00123/out/lwt_availability", "online")
    port.tests.timeout = 0.02
    for number, payload, confirmed, revision in [
        (0, "ON", True, 1),
        (9, "ON", True, 1),
        (True, "ON", True, 1),
        (1, "TOGGLE", True, 1),
        (1, "ON", False, 1),
        (1, "ON", True, 0),
    ]:
        with pytest.raises(ManagerError):
            await manager.operate(mid, number, payload, confirmed, revision)
    assert client.published == []
    await manager.operate(mid, 7, "ON", True, 1)
    with pytest.raises(ManagerError, match="pendente"):
        await manager.operate(mid, 7, "ON", True, 1)
    assert len(client.published) == 1
    await asyncio.sleep(0.04)
    assert manager.snapshot()["modules"][mid]["channels"][6]["test"]["status"] == "error"
    await manager.operate(mid, 7, "OFF", True, 1)
    port.disconnected()
    await port.inspect()
    await port.sync_subscriptions()
    assert len(client.published) == 2
    assert not port.tests.timers


async def test_subscriptions_release_and_registry_identity(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    await port.sync_subscriptions()
    assert len(client.subs) == 2
    module = deepcopy(manager.state["modules"][mid])
    module["channels"][0].update(enabled=True, entity_type="switch")
    await manager.mutate("save", 1, module)
    old = client.entities.pop("switch.cabeado1_r1")
    old.update(entity_id="switch.externally_renamed", name="Nome externo")
    client.entities[old["entity_id"]] = old
    await port.registries()
    snap = manager.snapshot()["modules"][mid]
    assert snap["channels"][0]["last_entity_ids"]["switch"] == "switch.externally_renamed"
    assert snap["channels"][0]["display_name"] == "Nome externo"
    # Fake HA discovery deletion resolves the renamed registry entry.
    client.discovery[next(iter(client.discovery))] = old["entity_id"]
    await manager.mutate("delete", 2, {"module_uuid": mid}, True)
    await port.sync_subscriptions()
    assert len(client.subs) == 1
    assert not manager.state["modules"]
    assert all("/in/" not in topic for topic, *_ in client.published)


def request(port, message, remote="172.30.32.2", uid="admin-user"):
    async def json_body():
        return message

    return SimpleNamespace(
        remote=remote,
        app={"port": port},
        method="POST",
        content_type="application/json",
        headers={"X-Remote-User-Id": uid, "X-Dingtian-Request": "1"},
        json=json_body,
    )


async def test_ingress_admin_arbitrary_topic_and_legacy_rejected(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    message = {
        "action": "operate",
        "revision": 1,
        "confirmed": True,
        "data": {"module_uuid": mid, "number": 7, "payload": "ON"},
    }
    with pytest.raises(web.HTTPForbidden):
        await protect(request(port, message, remote="127.0.0.1"), api)
    with pytest.raises(web.HTTPForbidden):
        await protect(request(port, message, uid="normal-user"), api)
    message["data"]["topic"] = "/arbitrary/in/r1"
    result = await protect(request(port, message), api)
    assert result.status == 400
    del message["data"]["topic"]
    client.legacy = True
    client.receive("/Cabeado/relay00123/out/lwt_availability", "online")
    result = await protect(request(port, message), api)
    assert result.status == 400
    assert client.published == []


async def test_atomic_restart_and_import_preserve_without_commands(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    before = deepcopy(manager.state)
    restored = Manager(RemotePort(client, tmp_path / "inventory.json"))
    await restored.load()
    assert restored.state == before
    new_port = RemotePort(client, tmp_path / "imported.json")
    new_port.manager = Manager(new_port)
    await new_port.manager.load()
    result = await protect(
        request(
            new_port,
            {
                "action": "import",
                "revision": 0,
                "confirmed": True,
                "data": {"inventory": {"version": 1, "data": before}},
            },
        ),
        api,
    )
    assert result.status == 200
    assert new_port.manager.state == before
    assert client.published == []
    assert await Store(tmp_path / "imported.json").load() == before


async def test_corrupt_storage_does_not_reset(tmp_path):
    path = tmp_path / "inventory.json"
    path.write_text('{"broken":', encoding="utf8")
    port = RemotePort(FakeHA(), path)
    with pytest.raises(ValueError):
        await Manager(port).load()
    assert path.read_text() == '{"broken":'


async def test_physical_commands_never_wait_behind_other_operations(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    client.receive("/Cabeado/relay00123/out/lwt_availability", "online")
    async with manager.lock:
        with pytest.raises(ManagerError, match="sem fila"):
            await manager.operate(mid, 7, "ON", True, 1)
    assert client.published == []
    started, release = asyncio.Event(), asyncio.Event()
    publish = client.publish

    async def slow_publish(*args):
        started.set()
        await release.wait()
        await publish(*args)

    client.publish = slow_publish
    first = asyncio.create_task(manager.operate(mid, 7, "ON", True, 1))
    await started.wait()
    try:
        with pytest.raises(ManagerError, match="sem fila"):
            await manager.operate(mid, 7, "OFF", True, 1)
    finally:
        release.set()
        await first
        port.tests.close()
    assert client.published == [("/Cabeado/relay00123/in/r7", "ON", 0, False)]
