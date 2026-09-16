"""Pure MQTT discovery generation. Physical command publishing lives elsewhere."""

from .const import VERSION

TONE_EFFECTS = ["Quente", "Neutro", "Frio"]


def cyclic_topics(state, module, channel):
    base = f"shd/{state['manager_uuid']}/{module['module_uuid']}/r{channel['number']}/cyclic"
    return {
        "command_topic": base + "/power/set",
        "effect_command_topic": base + "/tone/set",
        "effect_state_topic": base + "/tone/state",
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
            # Keep one light entity. Fixed effects expose only the three physical
            # tones and deliberately omit RGB/brightness support.
            payload.update(
                **cyclic_topics(state, module, channel),
                effect_list=TONE_EFFECTS,
                payload_on="ON",
                payload_off="OFF",
                on_command_type="last",
                icon="mdi:lightbulb-auto",
            )
    return topic, payload
