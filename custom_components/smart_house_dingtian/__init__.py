"""Smart House Dingtian Manager: administration over the existing HA MQTT client."""

from homeassistant.components import frontend, mqtt
from homeassistant.exceptions import ConfigEntryNotReady

from .const import DOMAIN, PANEL
from .ha_adapter import HAPort
from .manager import Manager
from .panel import async_setup_panel
from .websocket_api import async_register


async def async_setup(hass, config):
    async_register(hass)
    return True


async def async_setup_entry(hass, entry):
    if not await mqtt.async_wait_for_mqtt_client(hass):
        raise ConfigEntryNotReady("Configure a integração MQTT existente antes de abrir o gerenciador.")
    config = hass.data[mqtt.DATA_MQTT].client.conf
    if not config.get("discovery", True):
        raise ConfigEntryNotReady("Habilite MQTT Discovery nas opções da integração MQTT.")
    port = HAPort(hass, entry)
    manager = Manager(port)
    port.manager = manager
    await manager.load()
    hass.data[DOMAIN] = manager
    try:
        await port.start()
        await async_setup_panel(hass)
    except Exception:
        await port.close()
        hass.data.pop(DOMAIN, None)
        raise
    return True


async def async_unload_entry(hass, entry):
    manager = hass.data.pop(DOMAIN, None)
    if manager:
        await manager.port.close()
    frontend.async_remove_panel(hass, PANEL)
    return True


async def async_remove_entry(hass, entry):
    # HA does not offer a reliable veto after forced config-entry removal.
    # Preserve recovery journal unless the explicit online preparation finished.
    port = HAPort(hass, entry)
    stored = await port.load()
    if stored and stored.get("prepared_removal") and not stored["owned_topics"]:
        await port.store.async_remove()
