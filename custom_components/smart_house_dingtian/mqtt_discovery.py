"""Pure MQTT discovery generation. Physical command publishing lives elsewhere."""

from .const import VERSION

# These are visual values for Home Assistant's RGB light picker. The relay still
# has only three physical tones; arbitrary picker values are mapped to the nearest
# configured tone by the Manager.
TONE_RGB = {"warm": (255, 156, 74), "neutral": (255, 234, 202), "cool": (176, 210, 255)}


def cyclic_topics(state, module, channel):
    base = f"shd/{state['manager_uuid']}/{module['module_uuid']}/r{channel['number']}/cyclic"
    return {
        "command_topic": base + "/power/set",
        "rgb_command_topic": base + "/rgb/set",
        "rgb_state_topic": base + "/rgb/state",
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
        if channel.get("mode") == "cyclic_3":
            # Keep one light entity. Power and RGB commands enter the Manager,
            # which confirms every relay transition before publishing its color.
            payload.update(
                **cyclic_topics(state, module, channel),
                rgb_command_template="{{ red }},{{ green }},{{ blue }}",
                payload_on="ON",
                payload_off="OFF",
                on_command_type="last",
                icon="mdi:lightbulb-auto",
            )
    return topic, payload
