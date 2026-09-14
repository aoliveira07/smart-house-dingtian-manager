"""Executed only in the Linux Home Assistant CI job."""

import sys
from unittest.mock import patch

import pytest

collect_ignore_glob = ["test_*.py"] if sys.platform == "win32" else []


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    yield


@pytest.fixture
def mqtt_config_entry_options():
    return {"birth_message": {}, "discovery_prefix": "custom_discovery"}


@pytest.fixture(autouse=True)
async def runtime_lifecycle(hass):
    from homeassistant.core import CoreState

    hass.set_state(CoreState.running)
    with patch("homeassistant.components.mqtt.client.MQTT._async_start_misc_periodic"):
        yield
    await hass.async_stop(force=True)
