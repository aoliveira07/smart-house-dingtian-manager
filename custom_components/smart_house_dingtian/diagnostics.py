"""Diagnostics expose counts/status only; no household names, IDs, serials or topics."""

from .const import DOMAIN, VERSION


async def async_get_config_entry_diagnostics(hass, entry):
    manager = hass.data[DOMAIN]
    state = manager.state
    return {
        "version": VERSION,
        "broker_connected": manager.port.connected,
        "revision": state["revision"],
        "applied_revision": state["applied_revision"],
        "module_count": len(state["modules"]),
        "owned_topic_count": len(state["owned_topics"]),
        "sync_pending": bool(state["error"]),
        "prepared_removal": state["prepared_removal"],
    }
