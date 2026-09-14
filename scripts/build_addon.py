"""Build an independent Supervisor Docker context from the shared, tested engine."""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components/smart_house_dingtian"
TARGET = ROOT / "dingtian_manager/app/core"
TARGET.mkdir(parents=True, exist_ok=True)
(TARGET / "__init__.py").write_text(
    '"""Generated pure engine; edit custom_components source, then build_addon.py."""\n', encoding="utf8"
)
for name in ("const.py", "models.py", "mqtt_discovery.py", "manager.py", "relay_test.py"):
    shutil.copyfile(SOURCE / name, TARGET / name)
shutil.copyfile(ROOT / "frontend/panel.js", ROOT / "dingtian_manager/static/panel.js")
