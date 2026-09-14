import asyncio
import json
from copy import deepcopy

import pytest
from dingtian_core.manager import Manager
from dingtian_core.models import ManagerError, validate_storage
from dingtian_core.mqtt_discovery import discovery, topics


class FakePort:
    """Fault-injectable isolated broker/storage boundary, no network."""

    prefix = "custom_discovery"
    connected = True

    def __init__(self):
        self.stored = None
        self.published = []
        self.retained = {}
        self.events = []
        self.fail_at = None
        self.reject = False
        self.entities = set()
        self.names = []

    async def load(self):
        return deepcopy(self.stored)

    async def save(self, state):
        self.stored = deepcopy(state)
        self.events.append("save")

    def decorate(self, state):
        return state

    def refresh(self, state):
        pass

    def name_updates(self, before, desired):
        return []

    async def apply_names(self, changes):
        self.names.extend(changes)

    def changed(self):
        self.events.append("changed")

    async def preflight(self, state, targets):
        if self.reject:
            raise ManagerError("Conflito")

    async def publish_config(self, topic, payload, record):
        # The journal must already own the exact config being sent or removed.
        assert topic in self.stored["owned_topics"]
        if self.fail_at == len(self.published):
            raise OSError("injected broker failure")
        self.published.append((topic, payload, 1, True))
        self.events.append("publish")
        key = (record["module_uuid"], record["number"], record["entity_type"])
        if payload:
            self.retained[topic] = payload
            self.entities.add(key)
        else:
            self.retained.pop(topic, None)
            self.entities.discard(key)

    async def wait_removed(self, record):
        assert (record["module_uuid"], record["number"], record["entity_type"]) not in self.entities
        self.events.append("removed")

    async def wait_created(self, record):
        assert (record["module_uuid"], record["number"], record["entity_type"]) in self.entities

    async def operate(self, module, channel, payload):
        self.published.append((topics(module, channel)["command_topic"], payload, 0, False))


async def fresh(count=8, serial="00123"):
    port = FakePort()
    manager = Manager(port)
    await manager.load()
    await manager.mutate("create", 0, {"serial": serial, "channel_count": count})
    mid = next(iter(manager.state["modules"]))
    return manager, port, mid


async def save(manager, mid, changes, confirmed=False):
    data = deepcopy(manager.state["modules"][mid])
    for n, change in changes.items():
        data["channels"][n - 1].update(change)
    return await manager.mutate("save", manager.state["revision"], data, confirmed)


@pytest.mark.parametrize("count", [8, 16, 32])
async def test_empty_module_and_exact_capacity(count):
    manager, port, mid = await fresh(count)
    module = manager.state["modules"][mid]
    assert len(module["channels"]) == count
    assert not any(c["enabled"] for c in module["channels"])
    assert port.published == []
    assert module["serial"] == "00123"


@pytest.mark.parametrize("serial", [None, "", 123, "12/3", "12+", "#", "12\n", " 123", "１２３", "1" * 65])
async def test_invalid_serial_is_atomic(serial):
    manager, port, _ = await fresh()
    before = deepcopy(manager.state)
    with pytest.raises(ManagerError):
        await manager.mutate("create", 1, {"serial": serial, "channel_count": 8})
    assert manager.state == before
    assert port.published == []


async def test_duplicate_and_monotonic_identifiers():
    manager, port, first = await fresh()
    with pytest.raises(ManagerError, match="Serial"):
        await manager.mutate("create", 1, {"serial": "00123", "channel_count": 16})
    for i in (2, 3):
        await manager.mutate("create", manager.state["revision"], {"serial": str(i), "channel_count": 16})
    middle = list(manager.state["modules"])[1]
    await manager.mutate("delete", 3, {"module_uuid": middle}, True)
    await manager.mutate("create", 4, {"serial": "4", "channel_count": 32})
    assert [m["technical_id"] for m in manager.state["modules"].values()] == [
        "Cabeado1",
        "Cabeado3",
        "Cabeado4",
    ]
    assert manager.state["modules"][first]["technical_id"] == "Cabeado1"
    assert not port.published


async def test_mixed_channels_protocol_and_never_commands():
    manager, port, mid = await fresh(16)
    await save(manager, mid, {1: {"enabled": True}, 7: {"enabled": True, "entity_type": "switch"}})
    assert len(port.entities) == 2
    payloads = [json.loads(p) for _, p, _, _ in port.published]
    assert [p["unique_id"] for p in payloads] == ["Cabeado1-r1", "Cabeado1-r7"]
    assert payloads[0]["command_topic"] == "/Cabeado/relay00123/in/r1"
    assert payloads[1]["state_topic"] == "/Cabeado/relay00123/out/r7"
    assert "state_on" not in payloads[0]
    assert payloads[1]["state_on"] == "ON"
    assert all(p["retain"] is False and p["optimistic"] is False and p["qos"] == 0 for p in payloads)
    assert all(t.startswith("custom_discovery/") and "/in/" not in t for t, _, _, _ in port.published)
    old_topics = set(port.retained)
    await save(manager, mid, {1: {"display_name": "Nome novo <img onerror=alert(1)>"}})
    assert set(port.retained) == old_topics
    assert not any("/in/" in t for t, *_ in port.published)


async def test_idempotent_reload_and_reconnect():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    count = len(port.published)
    await manager.reconcile()
    assert len(port.published) == count
    restored = Manager(port)
    await restored.load()
    await restored.reconcile(force=True)
    assert restored.state["manager_uuid"] == manager.state["manager_uuid"]
    assert len(port.entities) == 1
    assert len(port.published) == count + 1


async def test_domain_swap_cleanup_order_and_reactivation():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    with pytest.raises(ManagerError, match="Confirme"):
        await save(manager, mid, {1: {"entity_type": "switch"}})
    await save(manager, mid, {1: {"entity_type": "switch"}}, True)
    assert port.published[1][1] == ""
    assert "/light/" in port.published[1][0]
    assert "/switch/" in port.published[2][0]
    assert len(port.entities) == 1
    await save(manager, mid, {1: {"enabled": False}}, True)
    assert not port.entities and not port.retained
    await save(manager, mid, {1: {"enabled": True}})
    assert json.loads(port.published[-1][1])["unique_id"] == "Cabeado1-r1"


async def test_broker_offline_blocks_destructive_ops():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    port.connected = False
    before = deepcopy(manager.state)
    with pytest.raises(ManagerError, match="offline"):
        await save(manager, mid, {1: {"enabled": False}}, True)
    assert before == manager.state
    with pytest.raises(ManagerError, match="offline"):
        await manager.operate(mid, 1, "ON", True)
    assert not any("/in/" in t for t, *_ in port.published)


async def test_failure_journal_restart_and_scoped_cleanup():
    manager, port, mid = await fresh()
    foreign = "custom_discovery/light/other/config"
    port.retained[foreign] = "foreign"
    port.fail_at = 1
    await save(manager, mid, {1: {"enabled": True}, 2: {"enabled": True}})
    assert manager.state["error"]
    assert len(manager.state["owned_topics"]) == 2
    assert manager.state["applied_revision"] < manager.state["revision"]
    with pytest.raises(ManagerError, match="pendente"):
        await save(manager, mid, {3: {"enabled": True}})
    port.fail_at = None
    restored = Manager(port)
    await restored.load()
    await restored.reconcile()
    assert not restored.state["error"]
    assert len(port.entities) == 2
    await restored.mutate("delete", restored.state["revision"], {"module_uuid": mid}, True)
    assert port.retained == {foreign: "foreign"}
    assert not restored.state["modules"]


async def test_failure_during_delete_keeps_tombstone():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    port.fail_at = len(port.published)
    await manager.mutate("delete", 2, {"module_uuid": mid}, True)
    assert manager.state["modules"][mid]["deleted"]
    assert manager.state["owned_topics"]
    port.fail_at = None
    await manager.reconcile()
    assert not manager.state["modules"] and not port.retained


async def test_invalid_batch_and_conflict_never_partially_apply():
    manager, port, mid = await fresh()
    before = deepcopy(manager.state)
    with pytest.raises(ManagerError):
        await save(manager, mid, {1: {"enabled": True}, 8: {"display_name": ""}})
    assert before == manager.state
    port.reject = True
    with pytest.raises(ManagerError, match="Conflito"):
        await save(manager, mid, {1: {"enabled": True}})
    assert before == manager.state and not port.published


async def test_concurrent_tabs_one_wins():
    manager, port, mid = await fresh()
    a = deepcopy(manager.state["modules"][mid])
    b = deepcopy(a)
    a["display_name"] = "A"
    b["display_name"] = "B"
    results = await asyncio.gather(
        manager.mutate("save", 1, a), manager.mutate("save", 1, b), return_exceptions=True
    )
    assert sum(isinstance(r, ManagerError) for r in results) == 1
    assert manager.state["modules"][mid]["display_name"] == "A"


async def test_explicit_physical_command_only():
    manager, port, mid = await fresh()
    with pytest.raises(ManagerError):
        await manager.operate(mid, 1, "ON", True)
    await save(manager, mid, {1: {"enabled": True}})
    with pytest.raises(ManagerError):
        await manager.operate(mid, 1, "ON", False)
    with pytest.raises(ManagerError):
        await manager.operate(mid, -1, "ON", True)
    await manager.operate(mid, 1, "ON", True)
    assert port.published[-1] == ("/Cabeado/relay00123/in/r1", "ON", 0, False)


async def test_permanent_removal_and_serial_lock():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    data = deepcopy(manager.state["modules"][mid])
    data["serial"] = "99999"
    data["channel_count"] = 32
    await manager.mutate("save", 2, data)
    assert manager.state["modules"][mid]["serial"] == "00123"
    assert manager.state["modules"][mid]["channel_count"] == 8
    await manager.mutate("prepare_remove", 3, {}, True)
    assert manager.state["prepared_removal"] and not port.retained
    with pytest.raises(ManagerError, match="remoção"):
        await manager.mutate("create", 4, {"serial": "7", "channel_count": 8})


async def test_storage_rejects_unsafe_cleanups_and_versions():
    manager, port, mid = await fresh()
    await save(manager, mid, {1: {"enabled": True}})
    assert validate_storage(port.stored) == manager.state
    bad = deepcopy(port.stored)
    record = next(iter(bad["owned_topics"].values()))
    bad["owned_topics"] = {"homeassistant/#": record}
    with pytest.raises(ManagerError):
        validate_storage(bad)
    bad = deepcopy(port.stored)
    bad["schema_version"] = 99
    with pytest.raises(ManagerError):
        validate_storage(bad)


async def test_default_entity_id_preserves_last_domain_id():
    manager, port, mid = await fresh()
    module = manager.state["modules"][mid]
    c = module["channels"][0]
    c["last_entity_ids"]["light"] = "light.custom_admin_id"
    _, payload = discovery(manager.state, module, c, "custom")
    assert payload["default_entity_id"] == "light.custom_admin_id"
