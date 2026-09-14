"""Real HA runtime + fake HA MQTT client, no hardware or household connection."""

import asyncio
from copy import deepcopy

from homeassistant.core import CoreState
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_mqtt_message

from custom_components.smart_house_dingtian.const import DOMAIN


async def setup_manager(hass, mqtt_mock):
    mqtt_mock.conf = mqtt_mock.return_value.conf
    entry = MockConfigEntry(domain=DOMAIN, title="Dingtian Manager", data={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    manager = hass.data[DOMAIN]
    # Tests drive synchronization explicitly; no timer-driven nondeterminism.
    await manager.port.close()
    manager.port.closed = False
    manager.port.retry_task = None
    await manager.port.start()
    manager.port.retry_task.cancel()
    try:
        await manager.port.retry_task
    except asyncio.CancelledError:
        pass
    return manager, entry


async def test_config_flow_and_single_instance(hass, mqtt_mock):
    mqtt_mock.conf = mqtt_mock.return_value.conf
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "form"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()
    assert DOMAIN in hass.data
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["reason"] == "already_configured"


async def test_empty_install_panel_resources_and_unload(hass, mqtt_mock):
    manager, entry = await setup_manager(hass, mqtt_mock)
    assert not manager.state["modules"]
    assert "smart-house-dingtian" in hass.data["frontend_panels"]
    mqtt_mock.async_publish.assert_not_called()
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert DOMAIN not in hass.data
    assert "smart-house-dingtian" not in hass.data["frontend_panels"]


async def test_actual_mqtt_entities_lifecycle(hass, mqtt_mock):
    manager, entry = await setup_manager(hass, mqtt_mock)
    hass.set_state(CoreState.running)

    # Echo only into this isolated HA event loop, simulating a broker roundtrip.
    async def publish(topic, payload, qos, retain, **kwargs):
        async_fire_mqtt_message(hass, topic, payload)
        await hass.async_block_till_done()

    mqtt_mock.async_publish.side_effect = publish
    await manager.mutate("create", 0, {"serial": "00123", "channel_count": 8})
    await manager.port.sync_subscriptions()
    mid = next(iter(manager.state["modules"]))
    data = deepcopy(manager.state["modules"][mid])
    data["channels"][0]["enabled"] = True
    data["channels"][6].update(enabled=True, entity_type="switch")
    await manager.mutate("save", 1, data)
    assert manager.state["error"] is None
    assert hass.states.get("light.cabeado1_r1") is not None
    assert hass.states.get("switch.cabeado1_r7") is not None
    assert not any("/in/" in call.args[0] for call in mqtt_mock.async_publish.call_args_list)
    # Explicit rename changes the HA registry name, preserving unique_id and ID.
    data = deepcopy(manager.state["modules"][mid])
    data["display_name"] = "Quadro de demonstração"
    data["channels"][0]["display_name"] = "Luz da bancada"
    await manager.mutate("save", manager.state["revision"], data)
    await hass.async_block_till_done()
    registry = er.async_get(hass)
    registered = registry.async_get("light.cabeado1_r1")
    assert registered.unique_id == "Cabeado1-r1"
    assert registered.name == "Luz da bancada"
    # External HA overrides are read and not reset by reconciliation.
    registry.async_update_entity("light.cabeado1_r1", name="Nome externo", new_entity_id="light.bancada")
    await hass.async_block_till_done()
    await manager.reconcile()
    snapshot = manager.snapshot()["modules"][mid]["channels"][0]
    assert snapshot["entity_id"] == "light.bancada"
    assert snapshot["display_name"] == "Nome externo"
    async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/lwt_availability", "online")
    async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r1", "ON")
    await hass.async_block_till_done()
    assert hass.states.get("light.bancada").state == "on"
    assert manager.snapshot()["modules"][mid]["channels"][0]["state"] == "ON"
    await manager.operate(mid, 1, "OFF", True)
    command = [c for c in mqtt_mock.async_publish.call_args_list if "/in/" in c.args[0]][0]
    assert command.args[:4] == ("/Cabeado/relay00123/in/r1", "OFF", 0, False)
    assert hass.states.get("light.bancada").state == "on"  # non-optimistic
    data = deepcopy(manager.state["modules"][mid])
    data["channels"][0]["entity_type"] = "switch"
    await manager.mutate("save", manager.state["revision"], data, True)
    assert manager.state["error"] is None
    assert hass.states.get("light.bancada") is None
    assert hass.states.get("switch.cabeado1_r1") is not None
    # Revert the domain and recover its last externally assigned entity_id.
    data = deepcopy(manager.state["modules"][mid])
    data["channels"][0]["entity_type"] = "light"
    await manager.mutate("save", manager.state["revision"], data, True)
    assert manager.state["error"] is None
    assert hass.states.get("light.bancada") is not None
    assert hass.states.get("switch.cabeado1_r1") is None
    await manager.mutate("delete", manager.state["revision"], {"module_uuid": mid}, True)
    assert not manager.state["owned_topics"]
    assert hass.states.get("switch.cabeado1_r1") is None
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_websocket_non_admin_denied(hass, hass_ws_client, hass_read_only_access_token, mqtt_mock):
    await async_setup_component(hass, "websocket_api", {})
    manager, entry = await setup_manager(hass, mqtt_mock)
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    await client.send_json(
        {
            "id": 1,
            "type": f"{DOMAIN}/request",
            "action": "create",
            "revision": 0,
            "data": {"serial": "00123", "channel_count": 8},
        }
    )
    result = await client.receive_json()
    assert result["success"] is False
    assert not manager.state["modules"]
