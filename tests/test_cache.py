import asyncio
import pytest
from app.cache import TTLCache


@pytest.mark.asyncio
async def test_set_and_get():
    cache = TTLCache(ttl=60)
    await cache.set("key1", {"data": "value"})
    result = await cache.get("key1")
    assert result == {"data": "value"}


@pytest.mark.asyncio
async def test_get_missing_key():
    cache = TTLCache(ttl=60)
    result = await cache.get("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_ttl_expiry():
    cache = TTLCache(ttl=0)  # Expires immediately
    await cache.set("key1", "value")
    # Value should be expired
    result = await cache.get("key1")
    assert result is None


@pytest.mark.asyncio
async def test_max_size_eviction():
    cache = TTLCache(ttl=0, max_size=2)
    # Fill past capacity — expired entries should be evicted
    await cache.set("a", 1)
    await cache.set("b", 2)
    await cache.set("c", 3)  # Should trigger eviction of expired a and b
    assert cache.size <= 2


@pytest.mark.asyncio
async def test_clear():
    cache = TTLCache(ttl=60)
    await cache.set("a", 1)
    await cache.set("b", 2)
    await cache.clear()
    assert cache.size == 0
    assert await cache.get("a") is None


@pytest.mark.asyncio
async def test_overwrite():
    cache = TTLCache(ttl=60)
    await cache.set("key", "old")
    await cache.set("key", "new")
    assert await cache.get("key") == "new"
