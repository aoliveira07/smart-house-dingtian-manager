"""Feedback-driven three-tone controller. Commands never advance the stored position."""

import asyncio
import logging

from .core.models import TONES, ManagerError
from .core.mqtt_discovery import tone_topics, topics

LOG = logging.getLogger(__name__)


class CyclicController:
    feedback_timeout = 5

    def __init__(self, port):
        self.port = port
        self.relays = {}
        self.waiters = {}
        self.tasks = {}
        self.destinations = {}
        self.events = asyncio.Queue()
        self.worker = None
        self.event_number = 0
        self.epoch = 0

    @property
    def manager(self):
        return self.port.manager

    def channels(self):
        if not self.manager:
            return
        for module in self.manager.state["modules"].values():
            if not module["deleted"]:
                for c in module["channels"]:
                    if c["enabled"] and c.get("mode") == "cyclic_3":
                        yield module, c

    def get(self, key):
        for module, c in self.channels():
            if key == (module["module_uuid"], c["number"]):
                return module, c
        raise ManagerError("Canal cíclico não está ativo.")

    def busy(self, mid, number):
        task = self.tasks.get((mid, number))
        return task is not None and not task.done()

    def busy_module(self, mid):
        return any(not task.done() and (mid is None or key[0] == mid) for key, task in self.tasks.items())

    def reconfigure(self, before, desired):
        for mid, module in before["modules"].items():
            new = desired["modules"].get(mid)
            for c in module["channels"]:
                current = new["channels"][c["number"] - 1] if new else {}
                if (
                    not new
                    or new["deleted"]
                    or new["serial"] != module["serial"]
                    or any(current.get(k) != c.get(k) for k in ("mode", "sequence", "enabled"))
                ):
                    self.relays.pop((mid, c["number"]), None)

    def receive(self, topic, raw, retained):
        for module, c in self.channels():
            key = (module["module_uuid"], c["number"])
            address = topics(module, c)
            if topic == tone_topics(self.manager.state, module, c)["command_topic"]:
                if not retained:
                    try:
                        self.request(key, raw)
                    except ManagerError as exc:
                        self.enqueue(("error", key, str(exc)))
                return
            if topic == address["availability_topic"] and raw != "online":
                self.relays.pop(key, None)
                waiter = self.waiters.get(key)
                if waiter and not waiter[2].done():
                    waiter[2].set_exception(ManagerError("Módulo offline durante a sequência."))
            if topic == address["state_topic"] and raw in ("ON", "OFF"):
                self.enqueue(("feedback", key, raw, retained, module["serial"]))
                return

    def enqueue(self, event):
        self.event_number += 1
        self.events.put_nowait((self.epoch, self.event_number, event))
        if self.worker is None or self.worker.done():
            self.worker = asyncio.create_task(self.drain())

    async def drain(self):
        while not self.events.empty():
            epoch, version, event = await self.events.get()
            try:
                async with self.manager.lock:
                    if epoch != self.epoch:
                        continue
                    kind, key, raw, *extra = event
                    try:
                        module, c = self.get(key)
                    except ManagerError:
                        continue
                    if kind == "error":
                        c["cycle_error"] = raw
                        LOG.warning("Solicitação de tonalidade recusada: %s", raw)
                    else:
                        retained, serial = extra
                        if serial != module["serial"]:
                            continue
                        previous = self.relays.get(key)
                        # Retained snapshots seed a baseline; never count as an edge or an ACK.
                        if retained and previous is not None:
                            continue
                        self.relays[key] = raw
                        c["last_relay_state"] = raw
                        if not retained and previous == "OFF" and raw == "ON":
                            if c.get("current_position") is not None and not c.get("cycle_needs_sync"):
                                c["current_position"] = (c["current_position"] + 1) % 3
                    await self.port.save(self.manager.state)
                    await self.publish(module, c)
                    if kind == "feedback" and not retained:
                        waiter = self.waiters.get(key)
                        if waiter and raw == waiter[0] and version > waiter[1] and not waiter[2].done():
                            waiter[2].set_result(None)
            except asyncio.CancelledError:
                raise
            except Exception:
                LOG.exception("Falha ao persistir ou publicar feedback de tonalidade")
                self.relays.clear()
                for _, _, future in self.waiters.values():
                    if not future.done():
                        future.set_exception(
                            ManagerError("Falha ao persistir feedback. Sincronize a tonalidade.")
                        )
            finally:
                self.events.task_done()

    async def publish(self, module, c):
        if not self.port.connected:
            return
        position = c.get("current_position")
        raw = "None" if position is None or c.get("cycle_needs_sync") else TONES[c["sequence"][position]]
        await self.port.client.publish(
            tone_topics(self.manager.state, module, c)["state_topic"], raw, 1, True
        )

    async def publish_all(self):
        for module, c in self.channels():
            await self.publish(module, c)

    def request(self, key, tone):
        if tone not in TONES.values():
            raise ManagerError("Tonalidade inválida.")
        module, c = self.get(key)
        if self.manager.lock.locked() and not self.busy(*key):
            raise ManagerError("Gerenciador ocupado; solicite a tonalidade novamente após salvar.")
        if self.manager.state["error"] or not self.port.connected or self.port.legacy_active:
            raise ManagerError("Conexão ou sincronização pendente; tonalidade não enfileirada.")
        if self.port.received.get(topics(module, c)["availability_topic"]) != "online":
            raise ManagerError("Módulo offline; tonalidade não enfileirada.")
        if c.get("current_position") is None or c.get("cycle_needs_sync"):
            raise ManagerError("Sincronize a tonalidade atual em Avançado antes de selecionar um destino.")
        if key not in self.relays:
            raise ManagerError("Aguarde o feedback do relé antes de selecionar uma tonalidade.")
        self.destinations[key] = tone
        if not self.busy(*key):
            self.tasks[key] = asyncio.create_task(self.run(key))

    async def command(self, key, payload):
        future = asyncio.get_running_loop().create_future()
        self.waiters[key] = (payload, self.event_number, future)
        try:

            async def send_and_wait():
                async with self.manager.lock:
                    module, c = self.get(key)
                    if self.port.received.get(topics(module, c)["availability_topic"]) != "online":
                        raise ManagerError("Módulo offline durante a sequência.")
                    if self.manager.state["error"]:
                        raise ManagerError("Sincronização pendente durante a sequência.")
                    await self.port.send_command(module, c, payload)
                await future

            await asyncio.wait_for(send_and_wait(), self.feedback_timeout)
        finally:
            self.waiters.pop(key, None)
            if not future.done():
                future.cancel()
            elif not future.cancelled():
                future.exception()  # Consume errors if publishing itself failed first.

    async def run(self, key):
        try:
            for _ in range(12):
                _, c = self.get(key)
                if c.get("cycle_needs_sync"):
                    raise ManagerError("Sincronize a tonalidade atual.")
                tone = TONES[c["sequence"][c["current_position"]]]
                if self.relays.get(key) == "ON" and tone == self.destinations[key]:
                    destination = self.destinations[key]
                    async with self.manager.lock:
                        c["cycle_error"] = None
                        await self.port.save(self.manager.state)
                    if self.destinations[key] == destination:
                        return
                    continue
                if self.relays.get(key) == "ON":
                    await self.command(key, "OFF")
                elif self.relays.get(key) != "OFF":
                    raise ManagerError("Estado do relé desconhecido.")
                await asyncio.sleep(c["pulse_interval_ms"] / 1000)
                await self.command(key, "ON")
            raise ManagerError("Sequência interrompida por mudanças concorrentes. Sincronize a tonalidade.")
        except (Exception, asyncio.CancelledError) as exc:
            error = (
                "Sem confirmação do relé; sincronize a tonalidade atual."
                if isinstance(exc, TimeoutError)
                else "Sequência interrompida; sincronize a tonalidade atual."
            )
            LOG.warning("%s (%s)", error, type(exc).__name__)
            async with self.manager.lock:
                try:
                    module, c = self.get(key)
                    c.update(cycle_error=error, cycle_needs_sync=True)
                    await self.port.save(self.manager.state)
                    try:
                        await self.publish(module, c)
                    except Exception:
                        LOG.warning("Tonalidade será republicada após reconectar.")
                except ManagerError:
                    pass
        finally:
            self.destinations.pop(key, None)
            self.tasks.pop(key, None)

    async def synchronize(self, mid, number, tone, revision):
        key = (mid, number)
        if type(number) is not int or tone not in TONES:
            raise ManagerError("Canal ou tonalidade inválida.")
        if self.busy(*key):
            raise ManagerError("Aguarde o fim da sequência para sincronizar.")
        await self.events.join()
        async with self.manager.lock:
            if self.busy(*key):
                raise ManagerError("Aguarde o fim da sequência para sincronizar.")
            if type(revision) is not int or revision != self.manager.state["revision"]:
                raise ManagerError("Cadastro alterado. Recarregue antes de sincronizar.")
            module, c = self.get(key)
            c.update(current_position=c["sequence"].index(tone), cycle_needs_sync=False, cycle_error=None)
            address = topics(module, c)
            relay = self.port.received.get(address["state_topic"])
            if (
                self.port.connected
                and self.port.received.get(address["availability_topic"]) == "online"
                and relay in ("ON", "OFF")
            ):
                self.relays[key] = relay
            await self.port.save(self.manager.state)
            await self.publish(module, c)
        return self.manager.snapshot()

    def disconnected(self):
        self.epoch += 1
        self.relays.clear()
        for task in list(self.tasks.values()):
            task.cancel()

    async def close(self):
        self.disconnected()
        tasks = list(self.tasks.values())
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        if self.worker:
            await self.worker
