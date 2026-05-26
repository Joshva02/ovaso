"""Simple async TTL cache for API responses."""

import asyncio
import time
from typing import Any

DEFAULT_TTL = 300  # 5 minutes


class TTLCache:
    """Thread-safe in-memory cache with per-key TTL expiry."""

    def __init__(self, ttl: int = DEFAULT_TTL, max_size: int = 1000) -> None:
        self._ttl = ttl
        self._max_size = max_size
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: Any) -> None:
        async with self._lock:
            # Evict expired entries if at capacity
            if len(self._store) >= self._max_size:
                now = time.monotonic()
                expired = [k for k, (exp, _) in self._store.items() if now > exp]
                for k in expired:
                    del self._store[k]

            self._store[key] = (time.monotonic() + self._ttl, value)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()

    @property
    def size(self) -> int:
        return len(self._store)
