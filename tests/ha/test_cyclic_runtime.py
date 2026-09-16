"""Tone select discovery and service calls through real HA, with simulated MQTT relays."""

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
async def test_tone_select_feedback_and_cleanup(hass, mqtt_mock, hass_client, hass_access_token, tmp_path):
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
        select_id = "select.cabeado1_r1_tonalidade"
        entry = er.async_get(hass).async_get(select_id)
        assert entry and entry.device_id is None
        light_entry = er.async_get(hass).async_get("light.cabeado1_r1")
        assert hass.states.get(select_id).attributes["options"] == ["Quente", "Neutro", "Frio"]
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/lwt_availability", "online")
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r1", "ON")
        await asyncio.sleep(0.1)
        await port.cycles.events.join()
        await port.cycles.synchronize(mid, 1, "warm", 2)
        await hass.async_block_till_done()
        assert hass.states.get(select_id).state == "Quente"
        await hass.services.async_call(
            "select", "select_option", {"entity_id": select_id, "option": "Frio"}, blocking=True
        )
        for _ in range(200):
            if hass.states.get(select_id).state == "Frio" and not port.cycles.busy(mid, 1):
                break
            await asyncio.sleep(0.02)
        assert hass.states.get(select_id).state == "Frio"
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
        assert hass.states.get(select_id).state == "Quente"
        module = deepcopy(manager.state["modules"][mid])
        module["channels"][0]["mode"] = "normal"
        await manager.mutate("save", 2, module)
        assert manager.state["error"] is None
        assert er.async_get(hass).async_get(select_id) is None
        assert er.async_get(hass).async_get("light.cabeado1_r1").id == light_entry.id
    finally:
        await port.cycles.close()
        port.tests.close()
        await client.close()
