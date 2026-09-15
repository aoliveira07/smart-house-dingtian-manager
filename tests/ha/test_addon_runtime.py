"""Standalone add-on talking to real HA APIs, with only MQTT transport mocked."""

import asyncio
from copy import deepcopy

import pytest
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import async_fire_mqtt_message

from dingtian_manager.app.core.manager import Manager
from dingtian_manager.app.ha_client import HAClient
from dingtian_manager.app.port import RemotePort


@pytest.mark.usefixtures("socket_enabled")
async def test_standalone_application_real_ha_apis(
    hass,
    mqtt_mock,
    hass_client,
    hass_access_token,
    hass_admin_user,
    hass_read_only_user,
    tmp_path,
    monkeypatch,
):
    from dingtian_manager.app.core import manager as core

    original = core.discovery

    def grouped(state, module, channel, prefix):
        topic, payload = original(state, module, channel, prefix)
        payload["device"] = {"identifiers": ["shd_" + module["module_uuid"]], "name": module["display_name"]}
        return topic, payload

    monkeypatch.setattr(core, "discovery", grouped)
    mqtt_mock.conf = mqtt_mock.return_value.conf
    for component in ("config", "diagnostics", "websocket_api"):
        assert await async_setup_component(hass, component, {})
    http = await hass_client()
    base = str(http.make_url("/api"))
    client = HAClient(hass_access_token, base=base, rest_base=base)
    port = RemotePort(client, tmp_path / "addon-inventory.json")
    manager = port.manager = Manager(port)

    async def publish(topic, payload, qos, retain, **kwargs):
        async_fire_mqtt_message(hass, topic, payload)

    mqtt_mock.async_publish.side_effect = publish
    try:
        await client.open()
        assert await client.is_admin(hass_admin_user.id)
        assert not await client.is_admin(hass_read_only_user.id)
        await manager.load()
        await port.inspect()
        assert port.prefix == "custom_discovery" and port.connected
        assert not port.legacy_active
        await port.sync_subscriptions()
        await manager.mutate("create", 0, {"serial": "00123", "channel_count": 8})
        await port.sync_subscriptions()
        mid = next(iter(manager.state["modules"]))
        assert mqtt_mock.async_publish.call_count == 0
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/lwt_availability", "online")
        for _ in range(100):
            if port.received.get("/Cabeado/relay00123/out/lwt_availability") == "online":
                break
            await asyncio.sleep(0.01)
        await manager.operate(mid, 7, "ON", True, 1)
        assert mqtt_mock.async_publish.call_count == 1
        assert mqtt_mock.async_publish.call_args.args[:4] == ("/Cabeado/relay00123/in/r7", "ON", 0, False)
        assert not er.async_get(hass).async_get("light.cabeado1_r7")
        assert manager.snapshot()["modules"][mid]["channels"][6]["state"] == "unknown"
        async_fire_mqtt_message(hass, "/Cabeado/relay00123/out/r7", "ON")
        await asyncio.sleep(0.05)
        assert manager.snapshot()["modules"][mid]["channels"][6]["test"]["status"] == "confirmed"
        module = deepcopy(manager.state["modules"][mid])
        kitchen = ar.async_get(hass).async_create("Cozinha")
        module["channels"][6].update(
            enabled=False, display_name="Bancada", entity_type="light", area_id=kitchen.id
        )
        await manager.mutate("save", 1, module)
        module["channels"][6]["enabled"] = True
        await manager.mutate("save", 2, module)
        await hass.async_block_till_done()
        assert hass.states.get("light.cabeado1_r7").attributes["friendly_name"] == "Bancada"
        er.async_get(hass).async_update_entity("light.cabeado1_r7", name=None)
        await port.registries()
        await manager.reconcile()
        await hass.async_block_till_done()
        assert hass.states.get("light.cabeado1_r7").attributes["friendly_name"] == "Bancada"
        assert manager.state["error"] is None
        assert er.async_get(hass).async_get("light.cabeado1_r7").unique_id == "Cabeado1-r7"
        assert er.async_get(hass).async_get("light.cabeado1_r7").area_id == kitchen.id
        assert {"area_id": kitchen.id, "name": "Cozinha"} in manager.snapshot()["areas"]
        registry = er.async_get(hass)
        registry.async_update_entity(
            "light.cabeado1_r7", new_entity_id="light.minha_bancada", name="Nome externo"
        )
        await port.registries()
        snapshot = manager.snapshot()["modules"][mid]
        assert snapshot["channels"][6]["entity_id"] == "light.minha_bancada"
        assert snapshot["channels"][6]["display_name"] == "Nome externo"
        snapshot["channels"][6]["display_name"] = "Novo nome"
        snapshot["channels"][6]["area_id"] = None
        await manager.mutate("save", 3, snapshot)
        assert manager.state["error"] is None
        assert registry.async_get("light.minha_bancada").name == "Novo nome"
        assert registry.async_get("light.minha_bancada").area_id is None
        registry.async_update_entity(
            "light.minha_bancada", icon="mdi:lamp", aliases={"Luz de leitura"}, area_id=kitchen.id
        )
        monkeypatch.setattr(core, "discovery", original)
        await manager.reconcile()
        await hass.async_block_till_done()
        assert manager.state["error"] is None
        migrated = registry.async_get("light.minha_bancada")
        assert migrated.device_id is None and migrated.unique_id == "Cabeado1-r7"
        assert migrated.name == "Novo nome" and migrated.icon == "mdi:lamp"
        assert migrated.area_id == kitchen.id and "Luz de leitura" in migrated.aliases
        old_entry = migrated
        await manager.mutate(
            "edit_module", 4, {"module_uuid": mid, "serial": "00999", "display_name": "Quadro novo"}
        )
        await port.sync_subscriptions()
        await hass.async_block_till_done()
        assert manager.state["error"] is None
        new_entry = registry.async_get("light.minha_bancada")
        assert new_entry.id == old_entry.id and new_entry.unique_id == old_entry.unique_id
        assert hass.states.get("light.minha_bancada").attributes["friendly_name"] == "Novo nome"
        assert new_entry.device_id is None
        assert not any("relay00123" in topic for topic in port.subscriptions)
        async_fire_mqtt_message(hass, "/Cabeado/relay00999/out/lwt_availability", "online")
        for _ in range(100):
            if port.received.get("/Cabeado/relay00999/out/lwt_availability") == "online":
                break
            await asyncio.sleep(0.01)
        result = await manager.operate_group(
            {"module_ids": [mid], "area_id": None, "payload": "OFF"}, True, 5
        )
        assert result["sent"] == [{"module_uuid": mid, "number": n} for n in range(1, 9)]
        await manager.mutate("delete", 5, {"module_uuid": mid}, True)
        assert manager.state["error"] is None
        assert not registry.async_get("light.minha_bancada")
        commands = [c.args[:4] for c in mqtt_mock.async_publish.call_args_list if "/in/" in c.args[0]]
        assert commands == [
            ("/Cabeado/relay00123/in/r7", "ON", 0, False),
            *[(f"/Cabeado/relay00999/in/r{n}", "OFF", 0, False) for n in range(1, 9)],
        ]
        await port.sync_subscriptions()
        assert len(port.subscriptions) == 1
    finally:
        port.tests.close()
        await client.close()
