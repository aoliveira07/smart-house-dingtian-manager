"""Transactional desired inventory and recoverable, serialized reconciliation."""

import asyncio
import json
from copy import deepcopy

from .models import ManagerError, initial, new_module, unique_module_name, update_module, validate_storage
from .mqtt_discovery import discovery


class Manager:
    """All mutations share one lock, including retries and physical operations."""

    def __init__(self, port):
        self.port = port
        self.state = initial()
        self.lock = asyncio.Lock()

    async def load(self):
        stored = await self.port.load()
        if stored is not None:
            self.state = validate_storage(stored)
        else:
            await self.port.save(self.state)

    def snapshot(self):
        return self.port.decorate(deepcopy(self.state))

    def targets(self, state):
        targets = {}
        for module in state["modules"].values():
            if module["deleted"]:
                continue
            for c in module["channels"]:
                if not c["enabled"]:
                    continue
                topic, payload = discovery(state, module, c, self.port.prefix)
                targets[topic] = {
                    "module_uuid": module["module_uuid"],
                    "number": c["number"],
                    "entity_type": c["entity_type"],
                    "payload": payload,
                }
        return targets

    async def mutate(self, action, revision, data, confirmed=False):
        async with self.lock:
            if type(revision) is not int or revision != self.state["revision"]:
                raise ManagerError("Cadastro alterado em outra aba. Recarregue antes de salvar.")
            if self.state["prepared_removal"]:
                raise ManagerError("Gerenciador preparado para remoção; remova a integração.")
            if self.state["error"] or self.state["applied_revision"] != self.state["revision"]:
                raise ManagerError("Resolva a sincronização pendente antes de alterar o cadastro.")
            # Capture current HA overrides and IDs without persisting stale names on restart.
            before = deepcopy(self.state)
            self.port.refresh(before)
            desired = deepcopy(before)
            destructive = False
            if action == "create":
                module = new_module(desired, data)
                unique_module_name(desired, module)
                desired["modules"][module["module_uuid"]] = module
                desired["next_module_number"] += 1
            elif action == "prepare_remove":
                destructive = True
                for module in desired["modules"].values():
                    module["deleted"] = True
                desired["prepared_removal"] = True
            else:
                mid = data.get("module_uuid")
                if mid not in desired["modules"] or desired["modules"][mid]["deleted"]:
                    raise ManagerError("Módulo não encontrado.")
                module = desired["modules"][mid]
                if action == "delete":
                    destructive = True
                    module["deleted"] = True
                elif action == "save":
                    updated = update_module(module, data)
                    if updated["display_name"] != module["display_name"]:
                        unique_module_name(desired, updated)
                    destructive = any(
                        a["enabled"] and (not b["enabled"] or a["entity_type"] != b["entity_type"])
                        for a, b in zip(module["channels"], updated["channels"], strict=True)
                    )
                    desired["modules"][mid] = updated
                else:
                    raise ManagerError("Operação inválida.")
            if destructive and not confirmed:
                raise ManagerError(
                    "Confirme a remoção/troca de domínio; automações podem ser afetadas. Nenhum OFF será enviado."
                )
            if destructive and not self.port.connected:
                raise ManagerError("Broker offline: limpeza bloqueada. Reconecte antes de remover/desativar.")
            await self.port.preflight(desired, self.targets(desired))
            desired["revision"] += 1
            # Journal name updates so crashes between save and registry update can be retried.
            desired["name_updates"] = self.port.name_updates(before, desired)
            await self.port.save(desired)
            self.state = desired
            await self._reconcile()
            return self.snapshot()

    async def reconcile(self, force=False):
        async with self.lock:
            await self._reconcile(force)
            return self.snapshot()

    async def _reconcile(self, force=False):
        try:
            self.port.refresh(self.state)
            targets = self.targets(self.state)
            owned = self.state["owned_topics"]
            if (targets or owned) and not self.port.connected:
                raise ManagerError("Broker offline; intenção salva, sincronização pendente.")
            await self.port.preflight(self.state, targets)
            # Cleanup EVERY previous domain/prefix before creating any replacement.
            for topic in list(owned):
                if topic not in targets:
                    await self.port.publish_config(topic, "", owned[topic])
                    await self.port.wait_removed(owned[topic])
                    del owned[topic]
                    await self.port.save(self.state)
            for topic, record in targets.items():
                signature = json.dumps(record["payload"], sort_keys=True, ensure_ascii=False)
                old = owned.get(topic)
                if not force and old and old.get("applied") == signature:
                    continue
                owned[topic] = dict(record, applied=None)
                self.state["modules"][record["module_uuid"]]["ever_published"] = True
                await self.port.save(self.state)  # durable ownership BEFORE side effect
                await self.port.publish_config(topic, signature, record)
                await self.port.wait_created(record)
                owned[topic]["applied"] = signature
                await self.port.save(self.state)
            await self.port.apply_names(self.state.get("name_updates", []))
            self.state["name_updates"] = []
            for mid in list(self.state["modules"]):
                if self.state["modules"][mid]["deleted"]:
                    del self.state["modules"][mid]
            self.port.refresh(self.state)
            self.state["applied_revision"] = self.state["revision"]
            self.state["error"] = None
            await self.port.save(self.state)
        except Exception as exc:
            self.state["error"] = f"Sincronização pendente: {exc}"
            await self.port.save(self.state)
        finally:
            self.port.changed()

    async def operate(self, mid, number, payload, confirmed, revision=None):
        # Physical intent must be immediate: never wait behind a save, retry or another command.
        # There is no await between this check and acquiring the uncontended asyncio lock.
        if self.lock.locked():
            raise ManagerError("Gerenciador ocupado; comando descartado, sem fila. Tente novamente depois.")
        async with self.lock:
            if type(revision) is not int or revision != self.state["revision"]:
                raise ManagerError("Cadastro alterado. Recarregue antes de testar o relé.")
            if confirmed is not True or payload not in ("ON", "OFF"):
                raise ManagerError("Comando real exige confirmação e ON/OFF.")
            module = self.state["modules"].get(mid)
            if not module or type(number) is not int or not 1 <= number <= module["channel_count"]:
                raise ManagerError("Canal inválido.")
            c = module["channels"][number - 1]
            if module["deleted"] or self.state["prepared_removal"] or self.state["error"]:
                raise ManagerError("Canal inativo ou sincronização pendente.")
            if not self.port.connected:
                raise ManagerError("Broker offline; comando descartado, sem fila.")
            await self.port.operate(module, c, payload)
