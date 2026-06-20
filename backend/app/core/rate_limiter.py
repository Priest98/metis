import time
import logging
from typing import Optional
import redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisRateLimiter:
    """
    Server-side rate limiter backing onto Redis.
    Falls back to in-memory if Redis connection is unavailable.
    """
    def __init__(self):
        self.redis_client = None
        self.memory_store = {}
        self.redis_connected = False
        
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                self.redis_connected = True
                logger.info("✅ Connected to Redis for rate limiting")
            except Exception as e:
                logger.warning(f"⚠️ Redis connection failed: {e}. Falling back to in-memory rate limiting.")

    def is_rate_limited(self, client_id: str, limit: int, period: int = 60) -> bool:
        """
        Check if client_id is rate limited.
        Uses a sliding window log approach.
        """
        now = time.time()
        
        # Redis implementation
        if self.redis_connected and self.redis_client:
            key = f"rl:{client_id}"
            try:
                pipe = self.redis_client.pipeline()
                # Remove expired entries
                pipe.zremrangebyscore(key, 0, now - period)
                # Count current window requests
                pipe.zcard(key)
                # Add current request timestamp
                pipe.zadd(key, {str(now): now})
                # Set TTL
                pipe.expire(key, period)
                # Execute
                _, count, _, _ = pipe.execute()
                
                return count >= limit
            except Exception as e:
                logger.error(f"Redis rate limit calculation failed: {e}")
                # Fallback to memory logic
                return self._is_memory_limited(client_id, limit, period, now)
        else:
            return self._is_memory_limited(client_id, limit, period, now)

    def _is_memory_limited(self, client_id: str, limit: int, period: int, now: float) -> bool:
        """Fallback in-memory sliding window rate limiter"""
        if client_id not in self.memory_store:
            self.memory_store[client_id] = []
            
        # Filter out old requests outside the sliding window
        self.memory_store[client_id] = [t for t in self.memory_store[client_id] if now - t < period]
        
        if len(self.memory_store[client_id]) >= limit:
            return True
            
        self.memory_store[client_id].append(now)
        return False

rate_limiter = RedisRateLimiter()
