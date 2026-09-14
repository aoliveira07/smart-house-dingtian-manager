"""Validated, JSON-serializable inventory. No Home Assistant or network dependency."""

import re
from copy import deepcopy
from typing import TypedDict
from uuid import uuid4


class ManagerError(ValueError):
    """User-visible validation or synchronization failure."""


class Channel(TypedDict):
    number: int
    enabled: bool
    entity_type: str
    display_name: str
    unique_id: str
    last_entity_ids: dict[str, str]


def name(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 120:
        raise ManagerError("Informe um nome de 1 a 120 caracteres.")
    if any(ord(c) < 32 for c in value):
        raise ManagerError("Nome contém caracteres de controle.")
    return value.strip()


def serial(value):
    if not isinstance(value, str) or not re.fullmatch(r"[0-9]{1,64}", value):
        raise ManagerError("Serial deve ser texto com 1 a 64 dígitos, sem espaços.")
    return value


def capacity(value):
    if type(value) is not int or value not in (8, 16, 32):
        raise ManagerError("Capacidade deve ser 8, 16 ou 32.")
    return value


def initial():
    return {
        "schema_version": 1,
        "manager_uuid": uuid4().hex,
        "next_module_number": 1,
        "revision": 0,
        "applied_revision": 0,
        "modules": {},
        "owned_topics": {},
        "error": None,
        "prepared_removal": False,
    }


def new_module(state, data):
    number = state["next_module_number"]
    technical = f"Cabeado{number}"
    count = capacity(data.get("channel_count"))
    identifier = serial(data.get("serial"))
    if any(m["serial"] == identifier for m in state["modules"].values()):
        raise ManagerError("Serial/base MQTT já cadastrado.")
    return {
        "module_uuid": uuid4().hex,
        "technical_id": technical,
        "serial": identifier,
        "channel_count": count,
        "display_name": name(data.get("display_name") or f"Cabeado {number}"),
        "mqtt_prefix": "/Cabeado",
        "ever_published": False,
        "deleted": False,
        "channels": [
            {
                "number": n,
                "enabled": False,
                "entity_type": "light",
                "display_name": f"Saída {n}",
                "unique_id": f"{technical}-r{n}",
                "last_entity_ids": {},
            }
            for n in range(1, count + 1)
        ],
    }


def update_module(module, data):
    for field in ("serial", "channel_count", "technical_id", "mqtt_prefix"):
        if field in data and data[field] != module[field]:
            raise ManagerError(
                "Serial, capacidade e identidade ficam fixos após o cadastro. Cadastre outro módulo."
            )
    result = deepcopy(module)
    result["display_name"] = name(data.get("display_name"))
    items = data.get("channels")
    if not isinstance(items, list) or len(items) != module["channel_count"]:
        raise ManagerError("Envie todos os canais do módulo em um único lote.")
    seen = set()
    for item in items:
        n = item.get("number")
        if type(n) is not int or n in seen or not 1 <= n <= module["channel_count"]:
            raise ManagerError("Canal inválido ou repetido.")
        seen.add(n)
        if (
            type(item.get("enabled")) is not bool
            or item.get("entity_type") not in ("", "light", "switch")
            or (item.get("enabled") and not item.get("entity_type"))
        ):
            raise ManagerError("Uso e tipo do canal são obrigatórios.")
        target = result["channels"][n - 1]
        target.update(
            enabled=item["enabled"],
            entity_type=item["entity_type"],
            display_name=name(item.get("display_name"))
            if item.get("enabled") or item.get("display_name")
            else "",
        )
    return result


def validate_storage(data):
    """Fail closed on unsupported/corrupt storage; never silently reset identities."""
    if not isinstance(data, dict):
        raise ManagerError("Arquivo de cadastro inválido.")
    if data.get("schema_version") != 1:
        raise ManagerError("Versão de armazenamento não suportada. Restaure o backup compatível.")
    if not re.fullmatch(r"[a-f0-9]{32}", data["manager_uuid"]):
        raise ManagerError("Identidade do gerenciador inválida.")
    serials, numbers = set(), set()
    for key, module in data["modules"].items():
        if key != module["module_uuid"] or not re.fullmatch(r"[a-f0-9]{32}", key):
            raise ManagerError("Identidade de módulo inválida.")
        s = serial(module["serial"])
        match = re.fullmatch(r"Cabeado([1-9][0-9]*)", module["technical_id"])
        if not match or s in serials or int(match[1]) in numbers:
            raise ManagerError("Identidade/serial duplicado no armazenamento.")
        serials.add(s)
        numbers.add(int(match[1]))
        capacity(module["channel_count"])
        update_module(module, module)
        if module["mqtt_prefix"] != "/Cabeado":
            raise ManagerError("Perfil MQTT não suportado.")
        for n, c in enumerate(module["channels"], 1):
            if c["number"] != n or c["unique_id"] != f"{module['technical_id']}-r{n}":
                raise ManagerError("Identidade de canal inválida.")
            for domain, entity_id in c["last_entity_ids"].items():
                if domain not in ("light", "switch") or not re.fullmatch(domain + r"\.[a-z0-9_]+", entity_id):
                    raise ManagerError("Referência de entidade inválida.")
    if type(data["next_module_number"]) is not int or data["next_module_number"] <= max(numbers, default=0):
        raise ManagerError("Sequência de módulos inválida.")
    for topic, record in data["owned_topics"].items():
        mid, n, domain = record["module_uuid"], record["number"], record["entity_type"]
        if mid not in data["modules"] or domain not in ("light", "switch"):
            raise ManagerError("Propriedade de discovery inválida.")
        if type(n) is not int or not 1 <= n <= data["modules"][mid]["channel_count"]:
            raise ManagerError("Canal de discovery inválido.")
        suffix = f"/{domain}/shd_{data['manager_uuid']}/{mid}_r{n}/config"
        if not topic.endswith(suffix) or any(x in topic for x in ("+", "#", "\x00")):
            raise ManagerError("Tópico de limpeza fora do namespace reservado.")
    return deepcopy(data)
