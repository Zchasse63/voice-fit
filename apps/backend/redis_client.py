"""
Redis Client and Utilities for VoiceFit

Provides singleton Redis client and helper functions for:
- Session management
- Caching (AI responses, exercise matches, user context)
- Rate limiting
- Temporary data storage
- Leaderboards
"""

import hashlib
import json
import os
from datetime import timedelta
from functools import wraps
from typing import Any, Dict, List, Optional

from upstash_redis import Redis

# Redis client singleton
_redis_client: Optional[Redis] = None


def get_redis_client() -> Redis:
    """
    Get or create Redis client singleton.

    Uses Upstash Redis REST API.

    Returns:
        Redis client instance
    """
    global _redis_client

    if _redis_client is None:
        redis_url = os.getenv("UPSTASH_REDIS_REST_URL")
        redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

        if not redis_url or not redis_token:
            raise ValueError(
                "Missing Redis configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
            )

        _redis_client = Redis(url=redis_url, token=redis_token)
        print("✅ Redis client initialized")

    return _redis_client


def get_redis() -> Redis:
    """Alias for get_redis_client()"""
    return get_redis_client()


# =============================================================================
# Session Management
# =============================================================================


class SessionManager:
    """Manage user workout sessions in Redis"""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.session_ttl = 7200  # 2 hours in seconds

    def get_session(self, user_id: str) -> Optional[Dict]:
        """
        Get user session from Redis.

        Args:
            user_id: User ID

        Returns:
            Session dict or None
        """
        try:
            key = f"session:{user_id}"
            data = self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Error getting session: {e}")
            return None

    def set_session(self, user_id: str, session_data: Dict) -> bool:
        """
        Save user session to Redis with TTL.

        Args:
            user_id: User ID
            session_data: Session data dict

        Returns:
            Success boolean
        """
        try:
            key = f"session:{user_id}"
            self.redis.setex(key, self.session_ttl, json.dumps(session_data))
            return True
        except Exception as e:
            print(f"Error setting session: {e}")
            return False

    def delete_session(self, user_id: str) -> bool:
        """Delete user session from Redis"""
        try:
            key = f"session:{user_id}"
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False

    def extend_session(self, user_id: str) -> bool:
        """Extend session TTL (reset to 2 hours)"""
        try:
            key = f"session:{user_id}"
            self.redis.expire(key, self.session_ttl)
            return True
        except Exception as e:
            print(f"Error extending session: {e}")
            return False


# =============================================================================
# Caching
# =============================================================================


class CacheManager:
    """Manage cached data in Redis"""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """
        Set cached value with TTL.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl_seconds: Time to live in seconds (default 1 hour)
        """
        try:
            self.redis.setex(key, ttl_seconds, json.dumps(value))
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete cached value"""
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    def get_or_set(self, key: str, factory_fn, ttl_seconds: int = 3600) -> Any:
        """
        Get from cache or compute and cache if not found.

        Args:
            key: Cache key
            factory_fn: Function to call if cache miss
            ttl_seconds: TTL for cached value
        """
        cached = self.get(key)
        if cached is not None:
            return cached

        # Cache miss - compute value
        value = factory_fn()
        self.set(key, value, ttl_seconds)
        return value


# =============================================================================
# Exercise Match Caching
# =============================================================================


def cache_exercise_match(
    exercise_name: str, exercise_data: Dict, ttl_days: int = 7
) -> bool:
    """
    Cache exercise match result.

    Args:
        exercise_name: Original exercise name
        exercise_data: Matched exercise data (id, name, score)
        ttl_days: Cache TTL in days
    """
    try:
        redis = get_redis()
        key = f"ex_match:{exercise_name.lower().strip()}"
        ttl_seconds = ttl_days * 86400
        redis.setex(key, ttl_seconds, json.dumps(exercise_data))
        return True
    except Exception as e:
        print(f"Error caching exercise match: {e}")
        return False


def get_cached_exercise_match(exercise_name: str) -> Optional[Dict]:
    """Get cached exercise match"""
    try:
        redis = get_redis()
        key = f"ex_match:{exercise_name.lower().strip()}"
        data = redis.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting cached exercise: {e}")
        return None


# =============================================================================
# User Context Caching
# =============================================================================


def cache_user_context(user_id: str, context: Dict, ttl_minutes: int = 15) -> bool:
    """
    Cache user context (PRs, injuries, profile).

    Args:
        user_id: User ID
        context: User context dict
        ttl_minutes: Cache TTL in minutes
    """
    try:
        redis = get_redis()
        key = f"user_ctx:{user_id}"
        ttl_seconds = ttl_minutes * 60
        redis.setex(key, ttl_seconds, json.dumps(context))
        return True
    except Exception as e:
        print(f"Error caching user context: {e}")
        return False


def get_cached_user_context(user_id: str) -> Optional[Dict]:
    """Get cached user context"""
    try:
        redis = get_redis()
        key = f"user_ctx:{user_id}"
        data = redis.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting cached user context: {e}")
        return None


def invalidate_user_context(user_id: str) -> bool:
    """Invalidate user context cache (call when user data changes)"""
    try:
        redis = get_redis()
        key = f"user_ctx:{user_id}"
        redis.delete(key)
        return True
    except Exception as e:
        print(f"Error invalidating user context: {e}")
        return False


# =============================================================================
# AI Response Caching
# =============================================================================


def hash_query(query: str) -> str:
    """Create cache key hash from query"""
    return hashlib.md5(query.encode()).hexdigest()


def cache_ai_response(query: str, response: Dict, ttl_hours: int = 24) -> bool:
    """
    Cache AI response for common queries.

    Args:
        query: Original query
        response: AI response dict
        ttl_hours: Cache TTL in hours
    """
    try:
        redis = get_redis()
        key = f"ai_response:{hash_query(query)}"
        ttl_seconds = ttl_hours * 3600
        redis.setex(key, ttl_seconds, json.dumps(response))
        return True
    except Exception as e:
        print(f"Error caching AI response: {e}")
        return False


def get_cached_ai_response(query: str) -> Optional[Dict]:
    """Get cached AI response"""
    try:
        redis = get_redis()
        key = f"ai_response:{hash_query(query)}"
        data = redis.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting cached AI response: {e}")
        return None


# =============================================================================
# Rate Limiting
# =============================================================================


class RateLimiter:
    """
    Redis-backed rate limiter with tier-based limits and sliding window.

    Tier-based limits:
    - free: 60 requests/hour, 10 requests/minute for expensive endpoints
    - premium: 300 requests/hour, 50 requests/minute for expensive endpoints
    - admin: Unlimited
    """

    # Tier configurations (requests per hour, requests per minute)
    TIER_LIMITS = {
        "free": {"default": 60, "expensive": 10},
        "premium": {"default": 300, "expensive": 50},
        "admin": {"default": 10000, "expensive": 10000},
    }

    # Expensive endpoints require stricter per-minute limits
    EXPENSIVE_ENDPOINTS = [
        "/api/program/generate/strength",
        "/api/program/generate/running",
        "/api/coach/ask",
        "/api/injury/analyze",
        "/api/running/analyze",
        "/api/workout/insights",
    ]

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def check_rate_limit(
        self, user_id: str, endpoint: str, tier: str = "free"
    ) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit using sliding window.

        Args:
            user_id: User identifier
            endpoint: API endpoint path
            tier: User tier (free, premium, admin)

        Returns:
            (is_allowed, requests_remaining, retry_after_seconds)
        """
        try:
            # Admin tier bypasses rate limits
            if tier == "admin":
                return (True, 999, 0)

            # Determine if this is an expensive endpoint
            is_expensive = any(exp in endpoint for exp in self.EXPENSIVE_ENDPOINTS)
            limit_type = "expensive" if is_expensive else "default"

            # Get tier limits
            tier_config = self.TIER_LIMITS.get(tier, self.TIER_LIMITS["free"])
            hourly_limit = tier_config["default"]
            minute_limit = tier_config[limit_type]

            # Check both hourly and per-minute limits
            hour_key = f"ratelimit:hour:{user_id}:{endpoint}"
            minute_key = f"ratelimit:minute:{user_id}:{endpoint}"

            # Check hourly limit (3600 seconds)
            hour_count = self.redis.incr(hour_key)
            if hour_count == 1:
                self.redis.expire(hour_key, 3600)

            hour_ttl = self.redis.ttl(hour_key)
            if hour_ttl < 0:  # Key exists but has no expiry
                self.redis.expire(hour_key, 3600)
                hour_ttl = 3600

            # Check minute limit (60 seconds)
            minute_count = self.redis.incr(minute_key)
            if minute_count == 1:
                self.redis.expire(minute_key, 60)

            minute_ttl = self.redis.ttl(minute_key)
            if minute_ttl < 0:  # Key exists but has no expiry
                self.redis.expire(minute_key, 60)
                minute_ttl = 60

            # Check if over limits
            hour_exceeded = hour_count > hourly_limit
            minute_exceeded = minute_count > minute_limit

            if hour_exceeded or minute_exceeded:
                # Calculate retry-after (use the shorter TTL)
                retry_after = minute_ttl if minute_exceeded else hour_ttl
                remaining = 0

                # Decrement counters since we're rejecting the request
                self.redis.decr(hour_key)
                self.redis.decr(minute_key)

                return (False, remaining, retry_after)

            # Calculate remaining (use the more restrictive limit)
            hour_remaining = max(0, hourly_limit - hour_count)
            minute_remaining = max(0, minute_limit - minute_count)
            remaining = min(hour_remaining, minute_remaining)

            return (True, remaining, 0)

        except Exception as e:
            print(f"⚠️  Rate limit check error: {e}")
            # Fail open - allow request if Redis fails (with logging)
            return (True, 999, 0)

    def check_rate_limit_legacy(
        self, identifier: str, limit: int, window_seconds: int = 60
    ) -> tuple[bool, int]:
        """
        Legacy rate limit check (backwards compatible).

        Use check_rate_limit() for new implementations.
        """
        try:
            key = f"ratelimit:{identifier}"
            count = self.redis.incr(key)

            if count == 1:
                self.redis.expire(key, window_seconds)

            is_allowed = count <= limit
            remaining = max(0, limit - count)

            return (is_allowed, remaining)

        except Exception as e:
            print(f"Rate limit check error: {e}")
            return (True, limit)

    def reset_rate_limit(self, user_id: str, endpoint: str = None) -> bool:
        """
        Reset rate limit counters for a user.

        Args:
            user_id: User identifier
            endpoint: Optional specific endpoint. If None, resets all endpoints.
        """
        try:
            if endpoint:
                # Reset specific endpoint
                hour_key = f"ratelimit:hour:{user_id}:{endpoint}"
                minute_key = f"ratelimit:minute:{user_id}:{endpoint}"
                self.redis.delete(hour_key)
                self.redis.delete(minute_key)
            else:
                # Reset all endpoints for user
                pattern = f"ratelimit:*:{user_id}:*"
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)

            return True
        except Exception as e:
            print(f"Rate limit reset error: {e}")
            return False

    def get_rate_limit_status(
        self, user_id: str, endpoint: str, tier: str = "free"
    ) -> dict:
        """
        Get current rate limit status without incrementing counters.

        Returns:
            Dictionary with current usage and limits
        """
        try:
            tier_config = self.TIER_LIMITS.get(tier, self.TIER_LIMITS["free"])
            is_expensive = any(exp in endpoint for exp in self.EXPENSIVE_ENDPOINTS)

            hour_key = f"ratelimit:hour:{user_id}:{endpoint}"
            minute_key = f"ratelimit:minute:{user_id}:{endpoint}"

            hour_count = int(self.redis.get(hour_key) or 0)
            minute_count = int(self.redis.get(minute_key) or 0)

            hour_ttl = self.redis.ttl(hour_key) if hour_count > 0 else 3600
            minute_ttl = self.redis.ttl(minute_key) if minute_count > 0 else 60

            return {
                "tier": tier,
                "endpoint": endpoint,
                "is_expensive": is_expensive,
                "hourly": {
                    "limit": tier_config["default"],
                    "used": hour_count,
                    "remaining": max(0, tier_config["default"] - hour_count),
                    "resets_in": hour_ttl,
                },
                "per_minute": {
                    "limit": tier_config["expensive" if is_expensive else "default"],
                    "used": minute_count,
                    "remaining": max(
                        0,
                        tier_config["expensive" if is_expensive else "default"]
                        - minute_count,
                    ),
                    "resets_in": minute_ttl,
                },
            }
        except Exception as e:
            print(f"Error getting rate limit status: {e}")
            return {}


# =============================================================================
# Temporary Data Storage
# =============================================================================


def store_temporary_data(key: str, data: Any, ttl_seconds: int) -> bool:
    """
    Store temporary data with TTL.

    Use cases:
    - Email verification tokens
    - Password reset codes
    - Temporary workout drafts
    - Pending operations
    """
    try:
        redis = get_redis()
        redis.setex(key, ttl_seconds, json.dumps(data))
        return True
    except Exception as e:
        print(f"Error storing temporary data: {e}")
        return False


def get_temporary_data(key: str) -> Optional[Any]:
    """Get temporary data"""
    try:
        redis = get_redis()
        data = redis.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting temporary data: {e}")
        return None


# =============================================================================
# Leaderboards
# =============================================================================


class LeaderboardManager:
    """Manage leaderboards with sorted sets"""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def add_score(self, leaderboard: str, member: str, score: float) -> bool:
        """Add or update score in leaderboard"""
        try:
            key = f"leaderboard:{leaderboard}"
            self.redis.zadd(key, {member: score})
            return True
        except Exception as e:
            print(f"Leaderboard add error: {e}")
            return False

    def get_top(self, leaderboard: str, limit: int = 10) -> List[tuple]:
        """
        Get top N from leaderboard.

        Returns:
            List of (member, score) tuples
        """
        try:
            key = f"leaderboard:{leaderboard}"
            return self.redis.zrevrange(key, 0, limit - 1, withscores=True)
        except Exception as e:
            print(f"Leaderboard get top error: {e}")
            return []

    def get_rank(self, leaderboard: str, member: str) -> Optional[int]:
        """Get member's rank (1-indexed)"""
        try:
            key = f"leaderboard:{leaderboard}"
            rank = self.redis.zrevrank(key, member)
            return rank + 1 if rank is not None else None
        except Exception as e:
            print(f"Leaderboard get rank error: {e}")
            return None

    def get_score(self, leaderboard: str, member: str) -> Optional[float]:
        """Get member's score"""
        try:
            key = f"leaderboard:{leaderboard}"
            return self.redis.zscore(key, member)
        except Exception as e:
            print(f"Leaderboard get score error: {e}")
            return None


# =============================================================================
# Decorators
# =============================================================================


def cached(ttl_seconds: int = 3600, key_prefix: str = "cache"):
    """
    Decorator to cache function results.

    Usage:
        @cached(ttl_seconds=300, key_prefix="user")
        def get_user_data(user_id: str):
            return expensive_operation(user_id)
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = (
                f"{key_prefix}:{func.__name__}:{hash_query(str(args) + str(kwargs))}"
            )

            # Try to get from cache
            cache_mgr = CacheManager(get_redis())
            cached_value = cache_mgr.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Cache miss - call function
            result = func(*args, **kwargs)
            cache_mgr.set(cache_key, result, ttl_seconds)
            return result

        return wrapper

    return decorator


# =============================================================================
# Health Check
# =============================================================================


def check_redis_health() -> bool:
    """Check if Redis is accessible"""
    try:
        redis = get_redis()
        redis.ping()
        return True
    except Exception as e:
        print(f"Redis health check failed: {e}")
        return False


# =============================================================================
# Cleanup Utilities
# =============================================================================


def clear_cache_pattern(pattern: str) -> int:
    """
    Clear all cache keys matching pattern.

    Args:
        pattern: Redis key pattern (e.g., "user_ctx:*")

    Returns:
        Number of keys deleted
    """
    try:
        redis = get_redis()
        keys = redis.keys(pattern)
        if keys:
            deleted = redis.delete(*keys)
            return deleted
        return 0
    except Exception as e:
        print(f"Cache clear error: {e}")
        return 0


# =============================================================================
# Initialize on import
# =============================================================================


# Create singleton instances
def get_session_manager() -> SessionManager:
    """Get SessionManager instance"""
    return SessionManager(get_redis())


def get_cache_manager() -> CacheManager:
    """Get CacheManager instance"""
    return CacheManager(get_redis())


def get_rate_limiter() -> RateLimiter:
    """Get RateLimiter instance"""
    return RateLimiter(get_redis())


def get_leaderboard_manager() -> LeaderboardManager:
    """Get LeaderboardManager instance"""
    return LeaderboardManager(get_redis())


# Export main components
__all__ = [
    "get_redis",
    "get_redis_client",
    "SessionManager",
    "CacheManager",
    "RateLimiter",
    "LeaderboardManager",
    "get_session_manager",
    "get_cache_manager",
    "get_rate_limiter",
    "get_leaderboard_manager",
    "cache_exercise_match",
    "get_cached_exercise_match",
    "cache_user_context",
    "get_cached_user_context",
    "invalidate_user_context",
    "cache_ai_response",
    "get_cached_ai_response",
    "store_temporary_data",
    "get_temporary_data",
    "check_redis_health",
    "cached",
]
