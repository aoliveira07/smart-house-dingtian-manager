"""Atomic durable inventory in the Supervisor-backed /data volume."""

import asyncio
import json
import os
from pathlib import Path


class Store:
    def __init__(self, path):
        self.path = Path(path)

    async def load(self):
        def read():
            if not self.path.exists():
                return None
            return json.loads(self.path.read_text(encoding="utf8"))

        return await asyncio.to_thread(read)

    async def save(self, state):
        payload = json.dumps(state, ensure_ascii=False, indent=2)

        def write():
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temp = self.path.with_suffix(".tmp")
            with temp.open("w", encoding="utf8") as file:
                file.write(payload)
                file.flush()
                os.fsync(file.fileno())
            os.replace(temp, self.path)
            if os.name == "posix":
                descriptor = os.open(self.path.parent, os.O_RDONLY)
                try:
                    os.fsync(descriptor)
                finally:
                    os.close(descriptor)

        await asyncio.to_thread(write)
