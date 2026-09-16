"""Build HACS (integration root) and manual (custom_components root) ZIPs."""

import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "smart_house_dingtian"
REQUIRED = {"__init__.py", "manifest.json", "config_flow.py", "frontend/panel.js", "translations/pt-BR.json"}


def main():
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf8"))
    assert manifest["domain"] == "smart_house_dingtian"
    assert manifest["config_flow"] and "mqtt" in manifest["dependencies"]
    assert not manifest["requirements"]
    hacs = json.loads((ROOT / "hacs.json").read_text(encoding="utf8"))
    assert hacs["filename"] == "smart_house_dingtian.zip"
    files = sorted(p for p in INTEGRATION.rglob("*") if p.is_file() and "__pycache__" not in p.parts)
    assert REQUIRED <= {p.relative_to(INTEGRATION).as_posix() for p in files}
    assert (INTEGRATION / "frontend/panel.js").read_bytes() == (ROOT / "frontend/panel.js").read_bytes()
    (ROOT / "dist").mkdir(exist_ok=True)
    for filename, base in [
        ("smart_house_dingtian.zip", INTEGRATION),
        ("smart-house-dingtian-manager-manual.zip", ROOT),
    ]:
        with ZipFile(ROOT / "dist" / filename, "w", compression=8) as archive:
            for path in files:
                info = ZipInfo(path.relative_to(base).as_posix(), (2026, 9, 14, 0, 0, 0))
                info.compress_type = 8
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes())
        with ZipFile(ROOT / "dist" / filename) as archive:
            assert archive.testzip() is None
            assert not any(
                "referencias_privadas" in f or f.endswith((".pyc", ".yaml")) for f in archive.namelist()
            )
        print(filename, (ROOT / "dist" / filename).stat().st_size, "bytes; verified")
    addon = ROOT / "dingtian_manager"
    target = ROOT / "dist/smart-house-dingtian-manager-addon-1.9.0.zip"
    files = sorted(p for p in addon.rglob("*") if p.is_file() and "__pycache__" not in p.parts)
    files.append(ROOT / "repository.json")
    with ZipFile(target, "w", compression=8) as archive:
        for path in files:
            info = ZipInfo(path.relative_to(ROOT).as_posix(), (2026, 9, 14, 0, 0, 0))
            info.compress_type = 8
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert "dingtian_manager/config.json" in archive.namelist()
        assert "dingtian_manager/app/core/manager.py" in archive.namelist()
    print(target.name, target.stat().st_size, "bytes; verified")


if __name__ == "__main__":
    main()
