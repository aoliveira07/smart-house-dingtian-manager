"""Pure MQTT discovery generation. Physical command publishing lives elsewhere."""

from .const import VERSION


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
        "device": {
            "identifiers": [f"shd_{module['module_uuid']}"],
            "name": module["display_name"],
            "manufacturer": "Dingtian",
            "model": f"Perfil MQTT de {module['channel_count']} canais",
            "serial_number": module["serial"],
        },
        "origin": {"name": "Smart House Dingtian Manager", "sw_version": VERSION},
    }
    if domain == "switch":
        payload.update(state_on="ON", state_off="OFF")
    else:
        payload["schema"] = "basic"
    return topic, payload
