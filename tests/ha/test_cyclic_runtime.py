"""One RGB light entity, controlled through real HA MQTT discovery and feedback."""

import asyncio
from copy import deepcopy

import pytest
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import async_fire_mqtt_message

from dingtian_manager.app.core.manager import Manager
from dingtian_manager.app.ha_client import HAClient
from dingtian_manager.app.port import RemotePort


@pytest.mark.usefixtures("socket_enabled")
async def test_rgb_light_feedback_and_single_entity(
    hass, mqtt_mock, hass_client, hass_access_token, tmp_path
):
    mqtt_mock.conf = mqtt_mock.return_value.conf
    for component in ("config", "diagnostics", "websocket_api"):
        assert await async_setup_component(hass, component, {})
    http = await hass_client()
    base = str(http.make_url("/api"))
    client = HAClient(hass_access_token, base=base, rest_base=base)
    port = RemotePort(client, tmp_path / "cyclic.json")
    manager = port.manager = Manager(port)

    async def publish(topic, payload, qos, retain, **kwargs):
        async_fire_mqtt_message(hass, topic, payload)
        if "/in/" in topic:
            async_fire_mqtt_message(hass, topic.replace("/in/", "/out/"), payload)

    mqtt_mock.async_publish.side_effect = publish
    try:
        await client.open()
        await manager.load()
        await port.inspect()
        await port.sync_subscriptions()
        await manager.mutate("create", 0, {"serial": "00123", "channel_count": 8})
        mid = next(iter(manager.state["modules"]))
        module = deepcopy(manager.state["modules"][mid])
        module["channels"][0].update(
            enabled=True, display_name="Leitura", mode="cyclic_3", pulse_interval_ms=100
        )
        await manager.mutate("save", 1, module)
        assert manager.state["error"] is None
        await port.sync_subscriptions()
        await hass.async_block_till_done()
        light_id = "light.cabeado1_r1"
        light_entry = er.async_get(hass).async_get(light_id)
        assert light_entry and light_entry.device_id is None
        assert not [
            entry for entry in er.async_get(hass).entities.values() if entry.entity_id.startswith("select.")
        ]
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/lwt_availability", "online")
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r1", "ON")
        await asyncio.sleep(0.1)
        await port.cycles.events.join()
        await port.cycles.synchronize(mid, 1, "warm", 2)
        await hass.async_block_till_done()
        assert hass.states.get(light_id).attributes["rgb_color"] == (255, 156, 74)
        await hass.services.async_call(
            "light", "turn_on", {"entity_id": light_id, "rgb_color": [176, 210, 255]}, blocking=True
        )
        for _ in range(200):
            if hass.states.get(light_id).attributes.get("rgb_color") == (
                176,
                210,
                255,
            ) and not port.cycles.busy(mid, 1):
                break
            await asyncio.sleep(0.02)
        assert hass.states.get(light_id).attributes["rgb_color"] == (176, 210, 255)
        assert manager.state["modules"][mid]["channels"][0]["current_position"] == 2
        commands = [c.args[:4] for c in mqtt_mock.async_publish.call_args_list if "/in/" in c.args[0]]
        assert commands == [
            ("/Cabeado/relay00123/in/r1", value, 0, False) for value in ("OFF", "ON", "OFF", "ON")
        ]
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r1", "OFF")
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r1", "ON")
        await asyncio.sleep(0.1)
        await port.cycles.events.join()
        await hass.async_block_till_done()
        assert hass.states.get(light_id).attributes["rgb_color"] == (255, 156, 74)
        module = deepcopy(manager.state["modules"][mid])
        module["channels"][0]["mode"] = "normal"
        await manager.mutate("save", 2, module)
        assert manager.state["error"] is None
        assert er.async_get(hass).async_get(light_id).id == light_entry.id
    finally:
        await port.cycles.close()
        port.tests.close()
        await client.close()
