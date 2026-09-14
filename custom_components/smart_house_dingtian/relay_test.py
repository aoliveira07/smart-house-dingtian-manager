"""Ephemeral command confirmation; never persisted, retried or inferred from ACK."""

import asyncio

from .models import ManagerError
from .mqtt_discovery import topics


class RelayTests:
    def __init__(self, changed, timeout=15):
        self.changed = changed
        self.timeout = timeout
        self.items = {}
        self.timers = {}

    def get(self, module, channel):
        return self.items.get(topics(module, channel)["state_topic"], {})

    def begin(self, module, channel, payload):
        topic = topics(module, channel)["state_topic"]
        if self.items.get(topic, {}).get("status") == "pending":
            raise ManagerError("Já existe comando pendente neste canal. Aguarde o retorno ou timeout.")
        self.items[topic] = {"status": "pending", "desired": payload}
        self.timers[topic] = asyncio.get_running_loop().call_later(
            self.timeout, self.fail, topic, "Resultado físico não confirmado: tempo de espera esgotado."
        )
        self.changed()
        return topic

    def fail(self, topic, message):
        timer = self.timers.pop(topic, None)
        if timer:
            timer.cancel()
        if topic in self.items:
            self.items[topic].update(status="error", message=message)
        self.changed()

    def receive(self, topic, payload, retained=False):
        item = self.items.get(topic)
        if item and item["status"] == "pending" and not retained and payload == item["desired"]:
            timer = self.timers.pop(topic, None)
            if timer:
                timer.cancel()
            item.update(status="confirmed", message="Estado recebido do módulo.")
            self.changed()

    def disconnected(self):
        for topic in list(self.timers):
            self.fail(topic, "Conexão interrompida; resultado físico não confirmado. Sem reenvio.")

    def close(self):
        for timer in self.timers.values():
            timer.cancel()
        self.timers.clear()
