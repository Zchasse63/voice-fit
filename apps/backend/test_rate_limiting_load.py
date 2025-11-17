"""
Load Testing for Rate Limiting

Tests rate limiting behavior under concurrent load.
Validates that rate limits hold up with 100+ concurrent users.
"""

import asyncio
import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Dict, List

import jwt
import pytest
import requests
from fastapi.testclient import TestClient

# Set test environment
os.environ["REQUIRE_AUTH"] = "true"
os.environ["ENABLE_RATE_LIMITING"] = "true"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-jwt-signing"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_KEY"] = "test-service-key"


def create_test_token(user_id: str, tier: str = "free") -> str:
    """Create JWT token for testing"""
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    payload = {
        "sub": user_id,
        "email": f"{user_id}@test.com",
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "user_metadata": {"tier": tier},
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


class LoadTester:
    """Load testing utility"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []

    def make_request(self, endpoint: str, user_id: str, tier: str = "free") -> Dict:
        """Make a single request and record metrics"""
        token = create_test_token(user_id, tier)
        headers = {"Authorization": f"Bearer {token}"}

        start_time = time.time()
        try:
            response = requests.post(
                f"{self.base_url}{endpoint}",
                json={"question": "Test", "user_id": user_id},
                headers=headers,
                timeout=5,
            )
            latency = (time.time() - start_time) * 1000
            return {
                "status_code": response.status_code,
                "latency_ms": latency,
                "success": response.status_code != 429,
                "user_id": user_id,
                "tier": tier,
            }
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return {
                "status_code": 500,
                "latency_ms": latency,
                "success": False,
                "error": str(e),
                "user_id": user_id,
                "tier": tier,
            }

    def concurrent_requests(
        self, endpoint: str, num_users: int, requests_per_user: int, tier: str = "free"
    ) -> List[Dict]:
        """Execute concurrent requests from multiple users"""
        results = []

        def user_requests(user_id: str):
            user_results = []
            for _ in range(requests_per_user):
                result = self.make_request(endpoint, user_id, tier)
                user_results.append(result)
                time.sleep(0.1)  # Small delay between requests
            return user_results

        # Use ThreadPoolExecutor for concurrent execution
        with ThreadPoolExecutor(max_workers=num_users) as executor:
            futures = [
                executor.submit(user_requests, f"load_test_user_{i}")
                for i in range(num_users)
            ]
            for future in futures:
                results.extend(future.result())

        return results

    def analyze_results(self, results: List[Dict]) -> Dict:
        """Analyze load test results"""
        total_requests = len(results)
        successful = sum(1 for r in results if r["success"])
        rate_limited = sum(1 for r in results if r["status_code"] == 429)
        errors = sum(1 for r in results if r["status_code"] == 500)

        latencies = [r["latency_ms"] for r in results if "latency_ms" in r]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0
        p99_latency = sorted(latencies)[int(len(latencies) * 0.99)] if latencies else 0

        return {
            "total_requests": total_requests,
            "successful": successful,
            "rate_limited": rate_limited,
            "errors": errors,
            "success_rate": (successful / total_requests * 100)
            if total_requests
            else 0,
            "avg_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "p99_latency_ms": round(p99_latency, 2),
        }


# =============================================================================
# LOAD TESTS
# =============================================================================


def test_free_tier_under_load():
    """
    Test free tier rate limiting with 50 concurrent users

    Expected: ~10 requests per user should hit rate limit (10/min limit for expensive endpoints)
    """
    print("\n" + "=" * 80)
    print("TEST: Free Tier Under Load (50 concurrent users)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"

    # 50 users, 15 requests each = 750 total requests
    # Free tier: 10/min for expensive endpoints
    # Expected: Most requests beyond 10 per user should be rate limited
    results = tester.concurrent_requests(
        endpoint=endpoint, num_users=50, requests_per_user=15, tier="free"
    )

    analysis = tester.analyze_results(results)

    print(f"\nResults:")
    print(f"  Total Requests: {analysis['total_requests']}")
    print(f"  Successful: {analysis['successful']}")
    print(f"  Rate Limited (429): {analysis['rate_limited']}")
    print(f"  Errors (500): {analysis['errors']}")
    print(f"  Success Rate: {analysis['success_rate']:.1f}%")
    print(f"\nLatency:")
    print(f"  Average: {analysis['avg_latency_ms']}ms")
    print(f"  P95: {analysis['p95_latency_ms']}ms")
    print(f"  P99: {analysis['p99_latency_ms']}ms")

    # Assertions
    assert analysis["rate_limited"] > 0, "Expected some requests to be rate limited"
    assert analysis["success_rate"] < 100, (
        "Expected success rate < 100% due to rate limiting"
    )
    assert analysis["avg_latency_ms"] < 100, (
        "Rate limiting should add minimal overhead (<100ms)"
    )

    print("\n✅ Free tier rate limiting working under load")


def test_premium_tier_under_load():
    """
    Test premium tier rate limiting with 50 concurrent users

    Expected: Higher success rate than free tier (50/min limit vs 10/min)
    """
    print("\n" + "=" * 80)
    print("TEST: Premium Tier Under Load (50 concurrent users)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"

    # 50 users, 60 requests each = 3000 total requests
    # Premium tier: 50/min for expensive endpoints
    results = tester.concurrent_requests(
        endpoint=endpoint, num_users=50, requests_per_user=60, tier="premium"
    )

    analysis = tester.analyze_results(results)

    print(f"\nResults:")
    print(f"  Total Requests: {analysis['total_requests']}")
    print(f"  Successful: {analysis['successful']}")
    print(f"  Rate Limited (429): {analysis['rate_limited']}")
    print(f"  Success Rate: {analysis['success_rate']:.1f}%")
    print(f"\nLatency:")
    print(f"  Average: {analysis['avg_latency_ms']}ms")
    print(f"  P95: {analysis['p95_latency_ms']}ms")

    # Premium should have much higher success rate than free
    assert analysis["success_rate"] > 70, (
        "Premium tier should have >70% success rate with 60 requests/min"
    )

    print("\n✅ Premium tier allows higher throughput")


def test_mixed_tier_load():
    """
    Test mixed tier usage (50% free, 50% premium)

    Validates that different tiers don't interfere with each other
    """
    print("\n" + "=" * 80)
    print("TEST: Mixed Tier Load (25 free + 25 premium users)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"

    # Test free tier users
    free_results = tester.concurrent_requests(
        endpoint=endpoint, num_users=25, requests_per_user=15, tier="free"
    )

    # Test premium users simultaneously
    premium_results = tester.concurrent_requests(
        endpoint=endpoint, num_users=25, requests_per_user=60, tier="premium"
    )

    free_analysis = tester.analyze_results(free_results)
    premium_analysis = tester.analyze_results(premium_results)

    print(f"\nFree Tier Results:")
    print(f"  Success Rate: {free_analysis['success_rate']:.1f}%")
    print(f"  Rate Limited: {free_analysis['rate_limited']}")

    print(f"\nPremium Tier Results:")
    print(f"  Success Rate: {premium_analysis['success_rate']:.1f}%")
    print(f"  Rate Limited: {premium_analysis['rate_limited']}")

    # Premium should have much higher success rate
    assert premium_analysis["success_rate"] > free_analysis["success_rate"], (
        "Premium should have higher success rate than free"
    )

    print("\n✅ Mixed tier load handled correctly")


def test_burst_traffic():
    """
    Test sudden burst of traffic (100 users, 20 requests each in 10 seconds)

    Tests system stability under sudden load spike
    """
    print("\n" + "=" * 80)
    print("TEST: Burst Traffic (100 users, 2000 requests in ~10 seconds)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"

    start_time = time.time()

    # 100 users making requests as fast as possible
    results = tester.concurrent_requests(
        endpoint=endpoint, num_users=100, requests_per_user=20, tier="free"
    )

    duration = time.time() - start_time
    analysis = tester.analyze_results(results)

    print(f"\nBurst Duration: {duration:.2f} seconds")
    print(f"Throughput: {analysis['total_requests'] / duration:.0f} requests/sec")
    print(f"\nResults:")
    print(f"  Total Requests: {analysis['total_requests']}")
    print(f"  Successful: {analysis['successful']}")
    print(f"  Rate Limited: {analysis['rate_limited']}")
    print(f"  Errors: {analysis['errors']}")
    print(f"\nLatency:")
    print(f"  Average: {analysis['avg_latency_ms']}ms")
    print(f"  P95: {analysis['p95_latency_ms']}ms")
    print(f"  P99: {analysis['p99_latency_ms']}ms")

    # System should remain stable (no 500 errors from overload)
    assert analysis["errors"] < analysis["total_requests"] * 0.01, (
        "Error rate should be <1%"
    )
    assert analysis["p95_latency_ms"] < 500, "P95 latency should be <500ms under load"

    print("\n✅ System stable under burst traffic")


def test_rate_limit_accuracy():
    """
    Test rate limit accuracy with precise timing

    Validates that rate limits are enforced accurately
    """
    print("\n" + "=" * 80)
    print("TEST: Rate Limit Accuracy (Free tier: 10/min)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"
    user_id = "accuracy_test_user"

    # Make exactly 12 requests (should allow 10, block 2)
    results = []
    for i in range(12):
        result = tester.make_request(endpoint, user_id, tier="free")
        results.append(result)
        print(f"  Request {i + 1}: {'✅' if result['success'] else '❌ 429'}")
        time.sleep(0.5)  # 500ms between requests

    successful = sum(1 for r in results if r["success"])
    rate_limited = sum(1 for r in results if r["status_code"] == 429)

    print(f"\nResults:")
    print(f"  Successful: {successful}")
    print(f"  Rate Limited: {rate_limited}")

    # Should allow ~10 requests and block ~2
    assert 9 <= successful <= 11, f"Expected ~10 successful, got {successful}"
    assert 1 <= rate_limited <= 3, f"Expected ~2 rate limited, got {rate_limited}"

    print("\n✅ Rate limit accuracy validated")


def test_rate_limit_reset():
    """
    Test that rate limits reset correctly after TTL expires
    """
    print("\n" + "=" * 80)
    print("TEST: Rate Limit Reset (Wait for TTL expiry)")
    print("=" * 80)

    tester = LoadTester()
    endpoint = "/api/coach/ask"
    user_id = "reset_test_user"

    # Exhaust rate limit
    print("\nExhausting rate limit (10 requests)...")
    for i in range(12):
        tester.make_request(endpoint, user_id, tier="free")

    # Last request should be rate limited
    result = tester.make_request(endpoint, user_id, tier="free")
    assert result["status_code"] == 429, "Should be rate limited"
    print("✅ Rate limit exhausted")

    # Wait for 65 seconds (60 second TTL + buffer)
    print("\n⏳ Waiting 65 seconds for rate limit to reset...")
    time.sleep(65)

    # Should be able to make requests again
    result = tester.make_request(endpoint, user_id, tier="free")
    assert result["success"], "Rate limit should have reset"
    print("✅ Rate limit reset successfully")


def test_middleware_overhead():
    """
    Measure middleware overhead by comparing exempt vs rate-limited endpoints
    """
    print("\n" + "=" * 80)
    print("TEST: Middleware Overhead")
    print("=" * 80)

    tester = LoadTester()

    # Test exempt endpoint (no rate limiting)
    print("\nTesting exempt endpoint (/health)...")
    exempt_results = []
    for _ in range(100):
        start = time.time()
        requests.get(f"{tester.base_url}/health", timeout=5)
        latency = (time.time() - start) * 1000
        exempt_results.append(latency)

    # Test rate-limited endpoint
    print("Testing rate-limited endpoint (/api/coach/ask)...")
    limited_results = []
    user_id = "overhead_test_user"
    for _ in range(100):
        result = tester.make_request("/api/coach/ask", user_id, tier="premium")
        limited_results.append(result["latency_ms"])

    exempt_avg = sum(exempt_results) / len(exempt_results)
    limited_avg = sum(limited_results) / len(limited_results)
    overhead = limited_avg - exempt_avg

    print(f"\nResults:")
    print(f"  Exempt endpoint avg: {exempt_avg:.2f}ms")
    print(f"  Rate-limited endpoint avg: {limited_avg:.2f}ms")
    print(f"  Middleware overhead: {overhead:.2f}ms")

    # Overhead should be minimal (<10ms target)
    assert overhead < 20, f"Middleware overhead too high: {overhead}ms (target: <10ms)"

    print(f"\n✅ Middleware overhead acceptable: {overhead:.2f}ms")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("RATE LIMITING LOAD TESTS")
    print("=" * 80)
    print("\nNOTE: These tests require the backend to be running on localhost:8000")
    print("Start the server with: uvicorn main:app --reload")
    print("\nPress Ctrl+C to cancel, or Enter to continue...")
    try:
        input()
    except KeyboardInterrupt:
        print("\nCancelled")
        exit(0)

    # Run all tests
    try:
        test_free_tier_under_load()
        test_premium_tier_under_load()
        test_mixed_tier_load()
        test_burst_traffic()
        test_rate_limit_accuracy()
        test_middleware_overhead()

        # Skip reset test by default (takes 65 seconds)
        # Uncomment to run:
        # test_rate_limit_reset()

        print("\n" + "=" * 80)
        print("✅ ALL LOAD TESTS PASSED")
        print("=" * 80)

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        exit(1)
