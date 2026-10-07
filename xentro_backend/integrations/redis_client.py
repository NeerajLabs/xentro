"""
XENTRO Redis Client
Manages ephemeral state: OTP cooldowns, typing indicators, online presence, and recommendation caches.
Includes in-memory fallback for local testing without external Redis server.
"""
import os
import time
import logging
import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class MemoryRedis:
    """Thread-safe dictionary simulating Redis TTL keys for offline local development."""
    def __init__(self):
        self._store = {}
        self._expiry = {}

    def _purge_expired(self, key):
        if key in self._expiry and time.time() > self._expiry[key]:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    def set(self, key, value, ex=None):
        self._store[key] = str(value)
        if ex:
            self._expiry[key] = time.time() + ex
        else:
            self._expiry.pop(key, None)
        return True

    def setex(self, key, seconds, value):
        return self.set(key, value, ex=seconds)

    def get(self, key):
        self._purge_expired(key)
        val = self._store.get(key)
        return val.encode('utf-8') if val is not None else None

    def delete(self, *keys):
        count = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                self._expiry.pop(k, None)
                count += 1
        return count

    def incr(self, key):
        self._purge_expired(key)
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = str(val)
        return val

    def exists(self, key):
        self._purge_expired(key)
        return 1 if key in self._store else 0

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    try:
        r = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        r.ping()
        logger.info(f"Connected to live Redis at {REDIS_URL}")
        _redis_client = r
    except Exception as e:
        logger.warning(f"Could not connect to Redis ({e}). Using in-memory fallback store.")
        _redis_client = MemoryRedis()
    return _redis_client
