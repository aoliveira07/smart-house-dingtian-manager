"""Closed-loop tone changes with simulated feedback; never talks to physical hardware."""

import asyncio
import json
from copy import deepcopy

import pytest
from test_addon import setup

from dingtian_manager.app.core.manager import Manager
from dingtian_manager.app.core.models import ManagerError, validate_storage
from dingtian_manager.app.core.mqtt_discovery import cyclic_topics, topics


async def configured(tmp_path):
    client, port, manager, mid = await setup(tmp_path)
    m = deepcopy(manager.state["modules"][mid])
    m["channels"][0].update(
        enabled=True,
        display_name="Luz de leitura",
        mode="cyclic_3",
        sequence=["warm", "neutral", "cool"],
        pulse_interval_ms=100,
    )
    await manager.mutate("save", 1, m)
    assert manager.state["error"] is None
    await port.sync_subscriptions()
    m = manager.state["modules"][mid]
    c = m["channels"][0]
    addresses = topics(m, c)
    client.receive(addresses["availability_topic"], "online")
    client.receive(addresses["state_topic"], "ON", True)
    await port.cycles.events.join()
    await port.cycles.synchronize(mid, 1, "warm", 2)
    return client, port, manager, mid, c, addresses


async def feedback(client, port, address, raw, retained=False):
    client.receive(address, raw, retained)
    await port.cycles.events.join()


def commands(client):
    return [p for p in client.published if "/in/" in p[0]]


def echo_commands(client, port):
    original = client.publish

    async def publish(topic, payload, qos, retain):
        await original(topic, payload, qos, retain)
        if "/in/" in topic:
            client.receive(topic.replace("/in/", "/out/"), payload)

    client.publish = publish


async def test_feedback_only_duplicate_retained_baseline_and_persistence(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    assert not commands(client)
    assert "light.cabeado1_r1" in client.entities
    assert not any(entity.startswith("select.") for entity in client.entities)
    await feedback(client, port, address["state_topic"], "ON")
    assert c["current_position"] == 0
    await feedback(client, port, address["state_topic"], "OFF")
    await feedback(client, port, address["state_topic"], "ON", True)
    assert c["current_position"] == 0
    await feedback(client, port, address["state_topic"], "ON")
    await feedback(client, port, address["state_topic"], "ON")
    assert c["current_position"] == 1
    await feedback(client, port, address["state_topic"], "OFF")
    assert c["current_position"] == 1 and c["last_relay_state"] == "OFF"
    restarted = Manager(port)
    await restarted.load()
    assert restarted.state["modules"][mid]["channels"][0]["current_position"] == 1
    validate_storage(manager.state)
    assert client.published[-1][1] == "255,234,202"
    # Reconnect retained values seed a baseline without replaying an OFF->ON edge.
    port.cycles.disconnected()
    await feedback(client, port, address["state_topic"], "ON", True)
    assert c["current_position"] == 1
    await port.cycles.close()


@pytest.mark.parametrize(
    "relay,current,target,expected",
    [
        ("ON", "warm", "Frio", ["OFF", "ON", "OFF", "ON"]),
        ("OFF", "neutral", "Frio", ["ON"]),
        ("OFF", "warm", "Quente", ["ON", "OFF", "ON", "OFF", "ON"]),
        ("ON", "warm", "Quente", []),
    ],
)
async def test_target_cycles_include_next_on_when_initially_off(tmp_path, relay, current, target, expected):
    client, port, manager, mid, c, address = await configured(tmp_path)
    await feedback(client, port, address["state_topic"], relay)
    await port.cycles.synchronize(mid, 1, current, 2)
    echo_commands(client, port)
    port.cycles.request((mid, 1), target)
    await port.cycles.tasks[(mid, 1)]
    assert [p[1] for p in commands(client)] == expected
    assert all(p[2:] == (0, False) for p in commands(client))
    rgb = {"Quente": "255,156,74", "Neutro": "255,234,202", "Frio": "176,210,255"}
    assert client.published[-1][1] == rgb[target]
    assert not c.get("cycle_error")
    await port.cycles.close()


async def test_timeout_does_not_assume_color_or_replay_and_manual_sync_sends_nothing(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    port.cycles.feedback_timeout = 0.05
    port.cycles.request((mid, 1), "Frio")
    await port.cycles.tasks[(mid, 1)]
    assert [p[1] for p in commands(client)] == ["OFF"]
    assert c["current_position"] == 0 and c["cycle_needs_sync"] and c["cycle_error"]
    with pytest.raises(ManagerError, match="Sincronize"):
        port.cycles.request((mid, 1), "Quente")
    await port.cycles.synchronize(mid, 1, "neutral", 2)
    assert c["current_position"] == 1 and not c["cycle_needs_sync"] and not c["cycle_error"]
    assert len(commands(client)) == 1
    await port.cycles.close()


async def test_latest_target_no_concurrent_sequence_and_module_edits_blocked(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    echo_commands(client, port)
    port.cycles.request((mid, 1), "Frio")
    task = port.cycles.tasks[(mid, 1)]
    port.cycles.request((mid, 1), "Neutro")
    assert port.cycles.tasks[(mid, 1)] is task
    with pytest.raises(ManagerError, match="sequência"):
        await manager.mutate("save", 2, deepcopy(manager.state["modules"][mid]))
    with pytest.raises(ManagerError, match="Sequência"):
        await manager.operate(mid, 1, "OFF", True, 2)
    with pytest.raises(ManagerError, match="sequência"):
        await manager.operate_group({"module_ids": [mid], "area_id": None, "payload": "OFF"}, True, 2)
    await task
    assert [p[1] for p in commands(client)] == ["OFF", "ON"]
    assert c["current_position"] == 1
    await port.cycles.close()


async def test_interval_measured_after_off_feedback_and_retained_commands_ignored(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    control = cyclic_topics(manager.state, manager.state["modules"][mid], c)["rgb_command_topic"]
    client.receive(control, "176,210,255", True)
    assert not port.cycles.tasks and not commands(client)
    sent = []
    original = client.publish

    async def publish(topic, payload, qos, retain):
        await original(topic, payload, qos, retain)
        if "/in/" in topic:
            sent.append((payload, asyncio.get_running_loop().time()))
            if payload == "OFF":
                await asyncio.sleep(0.06)
            client.receive(address["state_topic"], payload)

    client.publish = publish
    client.receive(control, "255,234,202")
    await port.cycles.tasks[(mid, 1)]
    assert sent[1][1] - sent[0][1] >= 0.15
    assert c["current_position"] == 1
    await port.cycles.close()


async def test_validation_reorder_identity_and_single_rgb_light(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    m = deepcopy(manager.state["modules"][mid])
    m["channels"][0]["sequence"] = ["warm"] * 3
    with pytest.raises(ManagerError, match="sequência"):
        await manager.mutate("save", 2, m)
    m["channels"][0]["sequence"] = ["cool", "warm", "neutral"]
    m["channels"][0]["pulse_interval_ms"] = 0
    with pytest.raises(ManagerError, match="Intervalo"):
        await manager.mutate("save", 2, m)
    m["channels"][0]["pulse_interval_ms"] = 100
    await manager.mutate("save", 2, m)
    c = manager.state["modules"][mid]["channels"][0]
    assert c["current_position"] is None
    await port.cycles.synchronize(mid, 1, "cool", 3)
    echo_commands(client, port)
    port.cycles.request((mid, 1), "Quente")
    await port.cycles.tasks[(mid, 1)]
    assert c["current_position"] == 1
    before = deepcopy(client.entities["light.cabeado1_r1"])
    m = deepcopy(manager.state["modules"][mid])
    m["channels"][0]["mode"] = "normal"
    await manager.mutate("save", 3, m)
    await port.sync_subscriptions()
    assert manager.state["error"] is None
    assert client.entities["light.cabeado1_r1"] == before
    count = len(client.published)
    await feedback(client, port, address["state_topic"], "OFF")
    await feedback(client, port, address["state_topic"], "ON")
    assert len(client.published) == count
    await port.cycles.close()


async def test_rgb_command_and_power_share_one_light_entity(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    control = cyclic_topics(manager.state, manager.state["modules"][mid], c)
    targets = manager.targets(manager.state)
    assert len(targets) == 1
    payload = next(iter(targets.values()))["payload"]
    assert payload["rgb_command_topic"] == control["rgb_command_topic"]
    assert payload["rgb_state_topic"] == control["rgb_state_topic"]
    assert payload["command_topic"] == control["command_topic"]
    assert payload["state_topic"] == address["state_topic"]
    assert "select" not in " ".join(targets)
    echo_commands(client, port)
    client.receive(control["rgb_command_topic"], "176,210,255")
    await port.cycles.tasks[(mid, 1)]
    assert c["current_position"] == 2
    client.receive(control["command_topic"], "OFF")
    await asyncio.sleep(0)
    assert commands(client)[-1][1] == "OFF"
    await port.cycles.close()


async def test_upgrade_removes_the_old_tone_select_without_recreating_the_light(tmp_path):
    client, port, manager, mid, c, _ = await configured(tmp_path)
    old_topic = f"{port.prefix}/select/shd_{manager.state['manager_uuid']}/{mid}_r1/config"
    old_payload = {
        "unique_id": c["unique_id"] + "_tonalidade",
        "name": c["display_name"] + " tonalidade",
        "default_entity_id": "select.cabeado1_r1_tonalidade",
        "command_topic": "old/tone/set",
        "state_topic": "old/tone/state",
        "options": ["Quente", "Neutro", "Frio"],
    }
    old_record = {"module_uuid": mid, "number": 1, "entity_type": "select", "payload": old_payload}
    await client.publish(old_topic, json.dumps(old_payload), 1, True)
    manager.state["owned_topics"][old_topic] = {
        **old_record,
        "applied": json.dumps(old_payload, sort_keys=True),
    }
    light_id = client.entities["light.cabeado1_r1"]["entity_id"]
    await manager.reconcile()
    assert manager.state["error"] is None
    assert old_topic not in manager.state["owned_topics"]
    assert "select.cabeado1_r1_tonalidade" not in client.entities
    assert client.entities["light.cabeado1_r1"]["entity_id"] == light_id
    assert not commands(client)
    await port.cycles.close()


async def test_missing_initial_sync_and_disconnect_cancel_without_restart(tmp_path):
    client, port, manager, mid, c, address = await configured(tmp_path)
    c["current_position"] = None
    with pytest.raises(ManagerError, match="Sincronize"):
        port.cycles.request((mid, 1), "Frio")
    await port.cycles.synchronize(mid, 1, "warm", 2)
    port.cycles.request((mid, 1), "Frio")
    task = port.cycles.tasks[(mid, 1)]
    await asyncio.sleep(0.02)
    port.disconnected()
    await task
    assert c["cycle_needs_sync"] and c["current_position"] == 0
    assert len(commands(client)) <= 1
    assert not port.cycles.tasks and not port.cycles.destinations
    await port.cycles.close()
