"""Load the pure core without importing Home Assistant on Windows."""

import sys
import types
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1] / "custom_components" / "smart_house_dingtian"
package = types.ModuleType("dingtian_core")
package.__path__ = [str(PACKAGE)]
sys.modules["dingtian_core"] = package
