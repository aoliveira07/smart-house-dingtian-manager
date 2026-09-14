"""Executed only in the Linux Home Assistant CI job."""

import sys

import pytest

collect_ignore_glob = ["test_*.py"] if sys.platform == "win32" else []


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    yield
