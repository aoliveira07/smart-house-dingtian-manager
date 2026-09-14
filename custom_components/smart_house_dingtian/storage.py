"""Home Assistant owns atomic storage writes and version checks."""

from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_VERSION


class InventoryStore(Store):
    """No predecessor integration storage exists; reject unknown versions."""

    def __init__(self, hass):
        super().__init__(hass, STORAGE_VERSION, DOMAIN)

    async def _async_migrate_func(self, old_major_version, old_minor_version, old_data):
        if old_major_version == STORAGE_VERSION:
            return old_data
        raise ValueError("Armazenamento incompatível; restaure uma versão compatível.")
