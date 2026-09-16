"""Pure MQTT discovery generation. Physical command publishing lives elsewhere."""

from .const import VERSION
from .models import TONES


def tone_topics(state, module, channel):
    base = f"shd/{state['manager_uuid']}/{module['module_uuid']}/r{channel['number']}/tone"
    return {"command_topic": base + "/set", "state_topic": base + "/state"}


def tone_entity_id(channel):
    return channel["last_entity_ids"].get(
        "select", "select." + entity_id(channel).split(".", 1)[1] + "_tonalidade"
    )


def tone_discovery(state, module, channel, prefix):
    topic = f"{prefix}/select/shd_{state['manager_uuid']}/{module['module_uuid']}_r{channel['number']}/config"
    return topic, {
        "unique_id": channel["unique_id"] + "_tonalidade",
        "name": channel["display_name"] + " tonalidade",
        "default_entity_id": tone_entity_id(channel),
        **tone_topics(state, module, channel),
        "options": list(TONES.values()),
        "optimistic": False,
        "qos": 0,
        "retain": False,
        "availability_topic": topics(module, channel)["availability_topic"],
        "payload_available": "online",
        "payload_not_available": "offline",
        "icon": "mdi:lightbulb-auto",
        "origin": {"name": "Smart House Dingtian Manager", "sw_version": VERSION},
    }


def topics(module, channel):
    base = f"{module['mqtt_prefix']}/relay{module['serial']}"
    return {
        "state_topic": f"{base}/out/r{channel['number']}",
        "command_topic": f"{base}/in/r{channel['number']}",
        "availability_topic": f"{base}/out/lwt_availability",
    }


def entity_id(channel):
    domain = channel["entity_type"]
    return channel["last_entity_ids"].get(
        domain, f"{domain}.{channel['unique_id'].lower().replace('-', '_')}"
    )


def discovery(state, module, channel, prefix):
    domain = channel["entity_type"]
    topic = (
        f"{prefix}/{domain}/shd_{state['manager_uuid']}/{module['module_uuid']}_r{channel['number']}/config"
    )
    addresses = topics(module, channel)
    payload = {
        "unique_id": channel["unique_id"],
        "name": channel["display_name"],
        "default_entity_id": entity_id(channel),
        "state_topic": addresses["state_topic"],
        "command_topic": addresses["command_topic"],
        "availability": [
            {
                "topic": addresses["availability_topic"],
                "payload_available": "online",
                "payload_not_available": "offline",
            }
        ],
        "payload_on": "ON",
        "payload_off": "OFF",
        "optimistic": False,
        "qos": 0,
        "retain": False,
        "origin": {"name": "Smart House Dingtian Manager", "sw_version": VERSION},
    }
    if domain == "switch":
        payload.update(state_on="ON", state_off="OFF")
    else:
        payload["schema"] = "basic"
    return topic, payload
