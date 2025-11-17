"""
Monitoring Service for Rate Limiting and Caching

Tracks metrics for:
- Rate limiting (429 responses, tier distribution, endpoint usage)
- Caching (hit/miss rates, latency improvements, cache sizes)
- Redis health and performance
- API endpoint performance

Provides logging, metrics collection, and health reporting.
"""

import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from redis_client import get_cache_manager, get_rate_limiter, get_redis_client


class MonitoringService:
    """
    Service for monitoring rate limiting, caching, and system health
    """

    def __init__(self):
        """Initialize monitoring service"""
        self.metrics = {
            "rate_limiting": defaultdict(int),
            "caching": defaultdict(int),
            "endpoints": defaultdict(lambda: defaultdict(int)),
            "redis": defaultdict(int),
        }
        self.start_time = time.time()

        # Try to get Redis clients
        try:
            self.cache_manager = get_cache_manager()
            self.rate_limiter = get_rate_limiter()
            self.redis_client = get_redis_client()
            self.redis_available = True
        except Exception as e:
            print(f"⚠️  Redis not available for monitoring: {e}")
            self.redis_available = False

    # =========================================================================
    # RATE LIMITING METRICS
    # =========================================================================

    def record_rate_limit_check(
        self, user_id: str, endpoint: str, tier: str, allowed: bool, remaining: int
    ):
        """
        Record a rate limit check

        Args:
            user_id: User identifier
            endpoint: API endpoint
            tier: User tier (free/premium/admin)
            allowed: Whether request was allowed
            remaining: Requests remaining
        """
        timestamp = datetime.utcnow().isoformat()

        # Overall metrics
        if allowed:
            self.metrics["rate_limiting"]["total_requests"] += 1
            self.metrics["rate_limiting"]["allowed_requests"] += 1
        else:
            self.metrics["rate_limiting"]["total_requests"] += 1
            self.metrics["rate_limiting"]["blocked_requests"] += 1
            self.metrics["rate_limiting"]["429_responses"] += 1

        # Tier metrics
        self.metrics["rate_limiting"][f"{tier}_requests"] += 1
        if not allowed:
            self.metrics["rate_limiting"][f"{tier}_blocked"] += 1

        # Endpoint metrics
        self.metrics["endpoints"][endpoint]["requests"] += 1
        if not allowed:
            self.metrics["endpoints"][endpoint]["blocked"] += 1

        # Log if blocked
        if not allowed:
            print(
                f"🚫 Rate limit blocked: user={user_id[:8]}... tier={tier} endpoint={endpoint}"
            )

    def record_rate_limit_reset(self, user_id: str, endpoint: str):
        """Record a manual rate limit reset"""
        self.metrics["rate_limiting"]["manual_resets"] += 1
        print(f"🔄 Rate limit reset: user={user_id[:8]}... endpoint={endpoint}")

    def get_rate_limit_stats(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        total = self.metrics["rate_limiting"]["total_requests"]
        blocked = self.metrics["rate_limiting"]["blocked_requests"]

        return {
            "total_requests": total,
            "allowed_requests": self.metrics["rate_limiting"]["allowed_requests"],
            "blocked_requests": blocked,
            "block_rate": (blocked / total * 100) if total > 0 else 0,
            "429_responses": self.metrics["rate_limiting"]["429_responses"],
            "manual_resets": self.metrics["rate_limiting"]["manual_resets"],
            "tier_breakdown": {
                "free": {
                    "requests": self.metrics["rate_limiting"]["free_requests"],
                    "blocked": self.metrics["rate_limiting"]["free_blocked"],
                },
                "premium": {
                    "requests": self.metrics["rate_limiting"]["premium_requests"],
                    "blocked": self.metrics["rate_limiting"]["premium_blocked"],
                },
                "admin": {
                    "requests": self.metrics["rate_limiting"]["admin_requests"],
                    "blocked": self.metrics["rate_limiting"]["admin_blocked"],
                },
            },
        }

    # =========================================================================
    # CACHING METRICS
    # =========================================================================

    def record_cache_hit(self, cache_type: str, key: str, latency_saved_ms: float = 0):
        """
        Record a cache hit

        Args:
            cache_type: Type of cache (user_context, rag_context, ai_response, etc.)
            key: Cache key
            latency_saved_ms: Estimated latency saved by cache hit
        """
        self.metrics["caching"]["total_lookups"] += 1
        self.metrics["caching"]["cache_hits"] += 1
        self.metrics["caching"][f"{cache_type}_hits"] += 1
        self.metrics["caching"]["total_latency_saved_ms"] += latency_saved_ms

        print(
            f"✅ Cache hit: type={cache_type} key={key[:30]}... saved={latency_saved_ms:.0f}ms"
        )

    def record_cache_miss(self, cache_type: str, key: str):
        """Record a cache miss"""
        self.metrics["caching"]["total_lookups"] += 1
        self.metrics["caching"]["cache_misses"] += 1
        self.metrics["caching"][f"{cache_type}_misses"] += 1

        print(f"❌ Cache miss: type={cache_type} key={key[:30]}...")

    def record_cache_set(
        self, cache_type: str, key: str, size_bytes: int = 0, ttl: int = 0
    ):
        """Record a cache set operation"""
        self.metrics["caching"]["cache_sets"] += 1
        self.metrics["caching"][f"{cache_type}_sets"] += 1
        self.metrics["caching"]["total_cache_size_bytes"] += size_bytes

    def record_cache_invalidation(self, cache_type: str, key: str, reason: str = ""):
        """Record a cache invalidation"""
        self.metrics["caching"]["cache_invalidations"] += 1
        self.metrics["caching"][f"{cache_type}_invalidations"] += 1

        print(
            f"🔄 Cache invalidated: type={cache_type} key={key[:30]}... reason={reason}"
        )

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get caching statistics"""
        total_lookups = self.metrics["caching"]["total_lookups"]
        hits = self.metrics["caching"]["cache_hits"]
        misses = self.metrics["caching"]["cache_misses"]

        return {
            "total_lookups": total_lookups,
            "cache_hits": hits,
            "cache_misses": misses,
            "hit_rate": (hits / total_lookups * 100) if total_lookups > 0 else 0,
            "total_latency_saved_ms": self.metrics["caching"]["total_latency_saved_ms"],
            "average_latency_saved_ms": (
                self.metrics["caching"]["total_latency_saved_ms"] / hits
            )
            if hits > 0
            else 0,
            "cache_sets": self.metrics["caching"]["cache_sets"],
            "cache_invalidations": self.metrics["caching"]["cache_invalidations"],
            "total_cache_size_bytes": self.metrics["caching"]["total_cache_size_bytes"],
            "by_type": {
                "user_context": {
                    "hits": self.metrics["caching"]["user_context_hits"],
                    "misses": self.metrics["caching"]["user_context_misses"],
                },
                "rag_context": {
                    "hits": self.metrics["caching"]["rag_context_hits"],
                    "misses": self.metrics["caching"]["rag_context_misses"],
                },
                "ai_response": {
                    "hits": self.metrics["caching"]["ai_response_hits"],
                    "misses": self.metrics["caching"]["ai_response_misses"],
                },
                "exercise_match": {
                    "hits": self.metrics["caching"]["exercise_match_hits"],
                    "misses": self.metrics["caching"]["exercise_match_misses"],
                },
            },
        }

    # =========================================================================
    # ENDPOINT METRICS
    # =========================================================================

    def record_endpoint_request(
        self, endpoint: str, method: str, status_code: int, latency_ms: float
    ):
        """Record an endpoint request"""
        self.metrics["endpoints"][endpoint]["total"] += 1
        self.metrics["endpoints"][endpoint]["latency_sum"] += latency_ms

        if status_code >= 200 and status_code < 300:
            self.metrics["endpoints"][endpoint]["success"] += 1
        elif status_code >= 400 and status_code < 500:
            self.metrics["endpoints"][endpoint]["client_errors"] += 1
        elif status_code >= 500:
            self.metrics["endpoints"][endpoint]["server_errors"] += 1

    def get_endpoint_stats(self) -> Dict[str, Any]:
        """Get endpoint statistics"""
        stats = {}

        for endpoint, metrics in self.metrics["endpoints"].items():
            total = metrics["requests"]
            blocked = metrics["blocked"]
            latency_sum = metrics.get("latency_sum", 0)
            request_count = metrics.get("total", 0)

            stats[endpoint] = {
                "total_requests": total,
                "blocked_requests": blocked,
                "block_rate": (blocked / total * 100) if total > 0 else 0,
                "avg_latency_ms": (latency_sum / request_count)
                if request_count > 0
                else 0,
                "success_count": metrics.get("success", 0),
                "client_errors": metrics.get("client_errors", 0),
                "server_errors": metrics.get("server_errors", 0),
            }

        return stats

    # =========================================================================
    # REDIS HEALTH
    # =========================================================================

    def check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health"""
        if not self.redis_available:
            return {
                "status": "unavailable",
                "message": "Redis client not initialized",
                "connected": False,
            }

        try:
            # Test Redis connection
            start = time.time()
            self.redis_client.ping()
            latency = (time.time() - start) * 1000

            # Get Redis info
            info = self.redis_client.info()

            return {
                "status": "healthy",
                "connected": True,
                "latency_ms": round(latency, 2),
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "uptime_seconds": info.get("uptime_in_seconds", 0),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
            }

    # =========================================================================
    # OVERALL HEALTH
    # =========================================================================

    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        uptime = time.time() - self.start_time

        return {
            "status": "healthy",
            "uptime_seconds": int(uptime),
            "uptime_human": self._format_uptime(uptime),
            "redis": self.check_redis_health(),
            "rate_limiting": self.get_rate_limit_stats(),
            "caching": self.get_cache_stats(),
            "endpoints": self.get_endpoint_stats(),
        }

    def get_health_summary(self) -> str:
        """Get human-readable health summary"""
        health = self.get_system_health()

        lines = []
        lines.append("=" * 80)
        lines.append("SYSTEM HEALTH SUMMARY")
        lines.append("=" * 80)
        lines.append(f"\nUptime: {health['uptime_human']}")

        # Redis
        redis = health["redis"]
        lines.append(f"\nRedis: {redis['status'].upper()}")
        if redis["connected"]:
            lines.append(f"  Latency: {redis['latency_ms']}ms")
            lines.append(f"  Memory: {redis['used_memory_human']}")

        # Rate Limiting
        rl = health["rate_limiting"]
        lines.append(f"\nRate Limiting:")
        lines.append(f"  Total Requests: {rl['total_requests']}")
        lines.append(f"  Blocked: {rl['blocked_requests']} ({rl['block_rate']:.1f}%)")
        lines.append(f"  429 Responses: {rl['429_responses']}")

        # Caching
        cache = health["caching"]
        lines.append(f"\nCaching:")
        lines.append(f"  Total Lookups: {cache['total_lookups']}")
        lines.append(f"  Hit Rate: {cache['hit_rate']:.1f}%")
        lines.append(
            f"  Latency Saved: {cache['total_latency_saved_ms']:.0f}ms total, {cache['average_latency_saved_ms']:.0f}ms avg"
        )

        # Top endpoints
        lines.append(f"\nTop Endpoints:")
        sorted_endpoints = sorted(
            health["endpoints"].items(),
            key=lambda x: x[1]["total_requests"],
            reverse=True,
        )
        for endpoint, stats in sorted_endpoints[:5]:
            lines.append(
                f"  {endpoint}: {stats['total_requests']} requests, {stats['avg_latency_ms']:.0f}ms avg"
            )

        lines.append("\n" + "=" * 80)

        return "\n".join(lines)

    # =========================================================================
    # ALERTS
    # =========================================================================

    def check_alerts(self) -> List[Dict[str, str]]:
        """Check for alerting conditions"""
        alerts = []

        # Check Redis health
        redis_health = self.check_redis_health()
        if not redis_health["connected"]:
            alerts.append(
                {
                    "severity": "critical",
                    "component": "redis",
                    "message": "Redis is disconnected",
                }
            )

        # Check rate limiting block rate
        rl_stats = self.get_rate_limit_stats()
        if rl_stats["total_requests"] > 100 and rl_stats["block_rate"] > 50:
            alerts.append(
                {
                    "severity": "warning",
                    "component": "rate_limiting",
                    "message": f"High rate limit block rate: {rl_stats['block_rate']:.1f}%",
                }
            )

        # Check cache hit rate
        cache_stats = self.get_cache_stats()
        if cache_stats["total_lookups"] > 100 and cache_stats["hit_rate"] < 30:
            alerts.append(
                {
                    "severity": "warning",
                    "component": "caching",
                    "message": f"Low cache hit rate: {cache_stats['hit_rate']:.1f}%",
                }
            )

        return alerts

    # =========================================================================
    # UTILITIES
    # =========================================================================

    def _format_uptime(self, seconds: float) -> str:
        """Format uptime in human-readable format"""
        uptime_delta = timedelta(seconds=int(seconds))
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if seconds > 0 or not parts:
            parts.append(f"{seconds}s")

        return " ".join(parts)

    def reset_metrics(self):
        """Reset all metrics (for testing)"""
        self.metrics = {
            "rate_limiting": defaultdict(int),
            "caching": defaultdict(int),
            "endpoints": defaultdict(lambda: defaultdict(int)),
            "redis": defaultdict(int),
        }
        self.start_time = time.time()
        print("🔄 Metrics reset")


# =============================================================================
# GLOBAL INSTANCE
# =============================================================================

_monitoring_service = None


def get_monitoring_service() -> MonitoringService:
    """Get or create monitoring service instance"""
    global _monitoring_service
    if _monitoring_service is None:
        _monitoring_service = MonitoringService()
    return _monitoring_service


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================


def log_rate_limit_check(
    user_id: str, endpoint: str, tier: str, allowed: bool, remaining: int
):
    """Convenience function to log rate limit check"""
    try:
        service = get_monitoring_service()
        service.record_rate_limit_check(user_id, endpoint, tier, allowed, remaining)
    except Exception as e:
        print(f"⚠️  Failed to log rate limit check: {e}")


def log_cache_hit(cache_type: str, key: str, latency_saved_ms: float = 0):
    """Convenience function to log cache hit"""
    try:
        service = get_monitoring_service()
        service.record_cache_hit(cache_type, key, latency_saved_ms)
    except Exception as e:
        print(f"⚠️  Failed to log cache hit: {e}")


def log_cache_miss(cache_type: str, key: str):
    """Convenience function to log cache miss"""
    try:
        service = get_monitoring_service()
        service.record_cache_miss(cache_type, key)
    except Exception as e:
        print(f"⚠️  Failed to log cache miss: {e}")


def get_health_report() -> str:
    """Get health report as string"""
    try:
        service = get_monitoring_service()
        return service.get_health_summary()
    except Exception as e:
        return f"⚠️  Failed to generate health report: {e}"


# =============================================================================
# TESTING
# =============================================================================

if __name__ == "__main__":
    # Test monitoring service
    service = MonitoringService()

    # Simulate some metrics
    print("\n📊 Simulating metrics...")

    # Rate limiting
    service.record_rate_limit_check("user1", "/api/coach/ask", "free", True, 9)
    service.record_rate_limit_check("user1", "/api/coach/ask", "free", True, 8)
    service.record_rate_limit_check("user1", "/api/coach/ask", "free", False, 0)

    # Caching
    service.record_cache_hit("user_context", "user:123", latency_saved_ms=500)
    service.record_cache_miss("user_context", "user:456")
    service.record_cache_hit("rag_context", "rag:endpoint:hash", latency_saved_ms=300)

    # Print health summary
    print("\n" + service.get_health_summary())

    # Check alerts
    alerts = service.check_alerts()
    if alerts:
        print("\n🚨 ALERTS:")
        for alert in alerts:
            print(
                f"  [{alert['severity'].upper()}] {alert['component']}: {alert['message']}"
            )
