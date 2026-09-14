"""Automatic admin panel with bundled resources; no YAML or CDN."""

from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN, PANEL, VERSION


async def async_setup_panel(hass):
    key = f"{DOMAIN}_static_registered"
    if not hass.data.get(key):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(f"/{DOMAIN}_static", str(Path(__file__).parent / "frontend"), False)]
        )
        hass.data[key] = True
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL,
        webcomponent_name="smart-house-dingtian-panel",
        sidebar_title="Dingtian Manager",
        sidebar_icon="mdi:electric-switch",
        module_url=f"/{DOMAIN}_static/panel.js?v={VERSION}",
        require_admin=True,
        config_panel_domain=DOMAIN,
    )
