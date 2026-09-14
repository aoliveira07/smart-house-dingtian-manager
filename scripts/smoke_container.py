"""Boot and restart the built add-on without a Supervisor or real MQTT broker."""

import http.client
import json
import subprocess
import time
import urllib.error
import urllib.request


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


metadata = json.loads(docker("image", "inspect", "dingtian-test"))[0]
labels = metadata["Config"]["Labels"]
assert labels["io.hass.type"] == "app" and labels["io.hass.version"] == "1.1.2"
assert labels["io.hass.arch"] == {"amd64": "amd64", "arm64": "aarch64"}[metadata["Architecture"]]

container = docker(
    "run",
    "--detach",
    "--publish",
    "127.0.0.1:18099:8099",
    "--env",
    "SUPERVISOR_TOKEN=isolated-test-token",
    "dingtian-test",
)
try:
    for _ in range(60):
        try:
            urllib.request.urlopen("http://127.0.0.1:18099/", timeout=2)
            raise AssertionError("Direct access must not succeed")
        except urllib.error.HTTPError as exc:
            assert exc.code == 403
            break
        except (urllib.error.URLError, OSError, http.client.HTTPException):
            time.sleep(1)
    else:
        raise AssertionError("Container did not start")
    before = json.loads(docker("exec", container, "cat", "/data/inventory.json"))
    assert before["modules"] == {} and before["owned_topics"] == {}
    docker("restart", container)
    after = json.loads(docker("exec", container, "cat", "/data/inventory.json"))
    assert after == before
    print("Container boot, Ingress-only denial and restart persistence passed; no real MQTT connection.")
finally:
    docker("rm", "--force", container)
