"""Supervisor-authenticated HA API client. Requests are never replayed."""

import asyncio
import contextlib

from aiohttp import ClientSession, ClientTimeout, WSMsgType

from .core.models import ManagerError


class HAClient:
    def __init__(self, token, base="http://supervisor/core", rest_base=None):
        self.token = token
        self.base = base.rstrip("/")
        self.rest_base = rest_base or self.base + "/api"
        self.session = None
        self.ws = None
        self.reader = None
        self.sequence = 0
        self.pending = {}
        self.callbacks = {}
        self.on_disconnect = lambda: None

    @property
    def connected(self):
        return self.ws is not None and not self.ws.closed

    async def open(self):
        await self.close()
        self.session = ClientSession(timeout=ClientTimeout(total=20))
        self.ws = await self.session.ws_connect(
            self.base.replace("http://", "ws://").replace("https://", "wss://") + "/websocket",
            max_msg_size=32 * 1024 * 1024,
        )
        if (await self.ws.receive_json())["type"] != "auth_required":
            raise ManagerError("Resposta de autenticação inesperada do Home Assistant.")
        await self.ws.send_json({"type": "auth", "access_token": self.token})
        if (await self.ws.receive_json())["type"] != "auth_ok":
            raise ManagerError("O Supervisor não autorizou o acesso ao Home Assistant.")
        self.reader = asyncio.create_task(self._read())

    async def _read(self):
        try:
            async for raw in self.ws:
                if raw.type != WSMsgType.TEXT:
                    continue
                msg = raw.json()
                ident = msg.get("id")
                if msg.get("type") == "result":
                    future = self.pending.get(ident)
                    if future and not future.done():
                        if msg.get("success"):
                            future.set_result(msg.get("result"))
                        else:
                            future.set_exception(
                                ManagerError(
                                    "Home Assistant: "
                                    + msg.get("error", {}).get("message", "operação recusada")
                                )
                            )
                elif msg.get("type") == "event" and ident in self.callbacks:
                    self.callbacks[ident](msg["event"])
        finally:
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(ManagerError("Conexão com HA interrompida. Operação não reenviada."))
            self.callbacks.clear()
            self.on_disconnect()

    async def call(self, kind, callback=None, **fields):
        if not self.connected:
            raise ManagerError("Home Assistant desconectado.")
        self.sequence += 1
        ident = self.sequence
        future = asyncio.get_running_loop().create_future()
        self.pending[ident] = future
        if callback:
            self.callbacks[ident] = callback
        try:
            await self.ws.send_json({"id": ident, "type": kind, **fields})
            result = await asyncio.wait_for(future, 20)
            return ident if callback else result
        except BaseException:
            self.callbacks.pop(ident, None)
            raise
        finally:
            self.pending.pop(ident, None)

    async def unsubscribe(self, ident):
        self.callbacks.pop(ident, None)
        if self.connected:
            await self.call("unsubscribe_events", subscription=ident)

    async def get(self, path):
        if not self.connected:
            raise ManagerError("Home Assistant desconectado.")
        async with self.session.get(
            self.rest_base + "/" + path, headers={"Authorization": "Bearer " + self.token}
        ) as response:
            if response.status != 200:
                raise ManagerError(f"Home Assistant recusou leitura necessária ({response.status}).")
            return await response.json(content_type=None)

    async def publish(self, topic, payload, qos, retain):
        await self.call(
            "call_service",
            domain="mqtt",
            service="publish",
            service_data={
                "topic": topic,
                "payload": payload,
                "qos": qos,
                "retain": retain,
            },
        )

    async def is_admin(self, user_id):
        if not user_id:
            return False
        users = await self.call("config/auth/list")
        return any(
            u["id"] == user_id
            and u.get("is_active")
            and (u.get("is_owner") or "system-admin" in u.get("group_ids", []))
            for u in users
        )

    async def close(self):
        if self.ws:
            await self.ws.close()
        if self.reader:
            self.reader.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.reader
        if self.session:
            await self.session.close()
        self.reader = self.ws = self.session = None
