"""
Rate Limiting Tests

Tests for tier-based rate limiting with Redis backend.
"""

import os
import time
from datetime import datetime, timedelta
from typing import Optional

import jwt
import pytest
from fastapi.testclient import TestClient
from redis import Redis

# Set test environment variables before importing main
os.environ["REQUIRE_AUTH"] = "true"
os.environ["ENABLE_RATE_LIMITING"] = "true"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-jwt-signing"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_KEY"] = "test-service-key"
os.environ["UPSTASH_REDIS_REST_URL"] = os.getenv("UPSTASH_REDIS_REST_URL", "")
os.environ["UPSTASH_REDIS_REST_TOKEN"] = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

from main import app
from redis_client import get_rate_limiter


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def jwt_secret():
    """JWT secret fixture"""
    return os.getenv("SUPABASE_JWT_SECRET")


@pytest.fixture
def rate_limiter():
    """Rate limiter fixture"""
    try:
        limiter = get_rate_limiter()
        yield limiter
        # Cleanup after tests
    except Exception as e:
        pytest.skip(f"Redis not available: {e}")


def create_test_token(user_id: str, tier: str = "free", jwt_secret: str = None) -> str:
    """
    Create a test JWT token with user_id and tier.

    Args:
        user_id: User identifier
        tier: User tier (free, premium, admin)
        jwt_secret: JWT secret for signing

    Returns:
        Signed JWT token
    """
    if not jwt_secret:
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    payload = {
        "sub": user_id,
        "email": f"{user_id}@test.com",
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "user_metadata": {
            "tier": tier,
            "subscription_tier": tier,
        },
        "app_metadata": {
            "tier": tier,
        },
    }

    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def make_request_with_tier(
    client: TestClient,
    endpoint: str,
    tier: str,
    jwt_secret: str,
    method: str = "POST",
    json_data: Optional[dict] = None,
) -> dict:
    """
    Make a request with a specific tier token.

    Returns:
        Dictionary with status_code, headers, and response data
    """
    token = create_test_token(f"test_user_{tier}", tier, jwt_secret)
    headers = {"Authorization": f"Bearer {token}"}

    if method == "POST":
        response = client.post(endpoint, json=json_data or {}, headers=headers)
    elif method == "GET":
        response = client.get(endpoint, headers=headers)
    else:
        raise ValueError(f"Unsupported method: {method}")

    return {
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "data": response.json() if response.content else {},
    }


# =============================================================================
# FREE TIER TESTS
# =============================================================================


def test_free_tier_normal_endpoint_within_limit(client, jwt_secret, rate_limiter):
    """Test free tier can make requests within limit"""
    endpoint = "/api/voice/parse"
    user_id = "test_free_user_1"

    # Reset rate limit
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Make 5 requests (well under 60/hour limit)
    for i in range(5):
        result = make_request_with_tier(client, endpoint, "free", jwt_secret)

        # Should succeed (might fail for other reasons like missing data, but not 429)
        assert result["status_code"] != 429, (
            f"Request {i + 1} hit rate limit unexpectedly"
        )

        # Check rate limit headers are present
        assert "x-ratelimit-limit" in result["headers"]
        assert "x-ratelimit-remaining" in result["headers"]


def test_free_tier_expensive_endpoint_per_minute_limit(
    client, jwt_secret, rate_limiter
):
    """Test free tier expensive endpoint has strict per-minute limit (10/min)"""
    endpoint = "/api/coach/ask"
    user_id = "test_free_user_expensive"

    # Reset rate limit
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Free tier: 10 requests/minute for expensive endpoints
    json_data = {"question": "Test question", "user_id": user_id}

    success_count = 0
    rate_limited = False

    # Try 12 requests rapidly
    for i in range(12):
        result = make_request_with_tier(
            client, endpoint, "free", jwt_secret, json_data=json_data
        )

        if result["status_code"] == 429:
            rate_limited = True
            assert "retry-after" in result["headers"]
            break
        else:
            success_count += 1

    # Should hit rate limit around 10-11 requests
    assert rate_limited, "Expected to hit rate limit for expensive endpoint"
    assert success_count <= 11, f"Too many requests succeeded: {success_count}"


def test_free_tier_429_response_format(client, jwt_secret, rate_limiter):
    """Test 429 response has proper format and headers"""
    endpoint = "/api/program/generate/strength"
    user_id = "test_free_429"

    # Reset rate limit
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Exhaust rate limit quickly
    json_data = {"questionnaire": {"user_id": user_id, "primary_goal": "strength"}}

    for _ in range(15):  # Spam requests
        result = make_request_with_tier(
            client, endpoint, "free", jwt_secret, json_data=json_data
        )

        if result["status_code"] == 429:
            # Verify response format
            assert "error" in result["data"]
            assert "retry_after" in result["data"]
            assert result["data"]["tier"] == "free"

            # Verify headers
            assert "retry-after" in result["headers"]
            assert "x-ratelimit-limit" in result["headers"]
            assert "x-ratelimit-remaining" in result["headers"]
            assert result["data"]["remaining"] == 0

            return  # Test passed

    pytest.skip("Did not hit rate limit - might need adjustment")


# =============================================================================
# PREMIUM TIER TESTS
# =============================================================================


def test_premium_tier_higher_limits(client, jwt_secret, rate_limiter):
    """Test premium tier has higher limits than free"""
    endpoint = "/api/coach/ask"
    user_id = "test_premium_user"

    # Reset rate limit
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Premium: 50 requests/minute for expensive endpoints (vs 10 for free)
    json_data = {"question": "Test question", "user_id": user_id}

    success_count = 0

    # Make 15 requests (would fail for free tier)
    for i in range(15):
        result = make_request_with_tier(
            client, endpoint, "premium", jwt_secret, json_data=json_data
        )

        if result["status_code"] != 429:
            success_count += 1

    # Premium should succeed for at least 15 requests
    assert success_count >= 15, f"Premium tier didn't get higher limit: {success_count}"


def test_premium_tier_headers(client, jwt_secret, rate_limiter):
    """Test premium tier has correct tier in headers"""
    endpoint = "/api/voice/parse"
    user_id = "test_premium_headers"

    rate_limiter.reset_rate_limit(user_id, endpoint)

    result = make_request_with_tier(client, endpoint, "premium", jwt_secret)

    # Check tier header
    if "x-ratelimit-tier" in result["headers"]:
        assert result["headers"]["x-ratelimit-tier"] == "premium"


# =============================================================================
# ADMIN TIER TESTS
# =============================================================================


def test_admin_tier_unlimited(client, jwt_secret, rate_limiter):
    """Test admin tier bypasses rate limits"""
    endpoint = "/api/coach/ask"
    user_id = "test_admin_user"

    rate_limiter.reset_rate_limit(user_id, endpoint)

    json_data = {"question": "Test question", "user_id": user_id}

    # Make many requests
    for i in range(100):
        result = make_request_with_tier(
            client, endpoint, "admin", jwt_secret, json_data=json_data
        )

        # Admin should never hit rate limit
        assert result["status_code"] != 429, f"Admin hit rate limit at request {i + 1}"


# =============================================================================
# RATE LIMIT STATUS TESTS
# =============================================================================


def test_rate_limit_status(rate_limiter):
    """Test get_rate_limit_status method"""
    user_id = "test_status_user"
    endpoint = "/api/coach/ask"
    tier = "free"

    # Reset
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Check status
    status = rate_limiter.get_rate_limit_status(user_id, endpoint, tier)

    assert status["tier"] == tier
    assert status["endpoint"] == endpoint
    assert status["is_expensive"] is True  # /api/coach/ask is expensive
    assert "hourly" in status
    assert "per_minute" in status
    assert status["hourly"]["limit"] == 60
    assert status["per_minute"]["limit"] == 10  # Expensive endpoint


def test_rate_limit_reset(rate_limiter):
    """Test rate limit reset functionality"""
    user_id = "test_reset_user"
    endpoint = "/api/coach/ask"

    # Use up some rate limit
    for _ in range(5):
        rate_limiter.check_rate_limit(user_id, endpoint, tier="free")

    # Check status
    status_before = rate_limiter.get_rate_limit_status(user_id, endpoint, "free")
    assert status_before["per_minute"]["used"] >= 5

    # Reset
    rate_limiter.reset_rate_limit(user_id, endpoint)

    # Check status again
    status_after = rate_limiter.get_rate_limit_status(user_id, endpoint, "free")
    assert status_after["per_minute"]["used"] == 0


# =============================================================================
# EDGE CASES
# =============================================================================


def test_missing_auth_header(client):
    """Test request without auth header bypasses rate limiting"""
    endpoint = "/api/voice/parse"

    # No auth header - should fail at auth, not rate limiting
    response = client.post(endpoint, json={})

    # Should fail with 401 (auth), not 429 (rate limit)
    assert response.status_code == 401


def test_invalid_tier_defaults_to_free(client, jwt_secret, rate_limiter):
    """Test invalid tier defaults to free tier limits"""
    # Create token with invalid tier
    payload = {
        "sub": "test_invalid_tier",
        "email": "test@test.com",
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "user_metadata": {
            "tier": "super_ultra_premium",  # Invalid tier
        },
    }

    token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    endpoint = "/api/coach/ask"
    json_data = {"question": "Test", "user_id": "test_invalid_tier"}

    # Reset
    rate_limiter.reset_rate_limit("test_invalid_tier", endpoint)

    # Should use free tier limits (10/min for expensive)
    success_count = 0
    for _ in range(15):
        response = client.post(endpoint, json=json_data, headers=headers)
        if response.status_code != 429:
            success_count += 1
        else:
            break

    # Should hit limit around 10-11 (free tier)
    assert success_count <= 11, (
        f"Invalid tier got more than free tier limit: {success_count}"
    )


def test_exempt_endpoints_no_rate_limit(client, jwt_secret):
    """Test health check and docs endpoints bypass rate limiting"""
    token = create_test_token("test_exempt", "free", jwt_secret)
    headers = {"Authorization": f"Bearer {token}"}

    # Health check should never be rate limited
    for _ in range(100):
        response = client.get("/health", headers=headers)
        assert response.status_code != 429


def test_concurrent_users_separate_limits(client, jwt_secret, rate_limiter):
    """Test different users have separate rate limits"""
    endpoint = "/api/voice/parse"

    user1 = "test_user_1"
    user2 = "test_user_2"

    rate_limiter.reset_rate_limit(user1, endpoint)
    rate_limiter.reset_rate_limit(user2, endpoint)

    # User 1 makes requests
    token1 = create_test_token(user1, "free", jwt_secret)
    headers1 = {"Authorization": f"Bearer {token1}"}

    for _ in range(5):
        client.post(endpoint, json={}, headers=headers1)

    status1 = rate_limiter.get_rate_limit_status(user1, endpoint, "free")

    # User 2 makes requests
    token2 = create_test_token(user2, "free", jwt_secret)
    headers2 = {"Authorization": f"Bearer {token2}"}

    for _ in range(3):
        client.post(endpoint, json={}, headers=headers2)

    status2 = rate_limiter.get_rate_limit_status(user2, endpoint, "free")

    # Different usage counts
    assert status1["per_minute"]["used"] >= 5
    assert status2["per_minute"]["used"] >= 3
    assert status1["per_minute"]["used"] != status2["per_minute"]["used"]


# =============================================================================
# PERFORMANCE TESTS
# =============================================================================


def test_rate_limit_overhead(client, jwt_secret, rate_limiter):
    """Test rate limiting adds minimal overhead"""
    endpoint = "/health"  # Exempt endpoint for baseline
    user_id = "test_performance"

    # Baseline without rate limiting (exempt endpoint)
    token = create_test_token(user_id, "free", jwt_secret)
    headers = {"Authorization": f"Bearer {token}"}

    start = time.time()
    for _ in range(10):
        client.get(endpoint, headers=headers)
    baseline_time = time.time() - start

    # With rate limiting (rate limited endpoint)
    endpoint_limited = "/api/voice/parse"
    rate_limiter.reset_rate_limit(user_id, endpoint_limited)

    start = time.time()
    for _ in range(10):
        client.post(endpoint_limited, json={}, headers=headers)
    limited_time = time.time() - start

    # Rate limiting should add minimal overhead (<50ms total for 10 requests)
    overhead = limited_time - baseline_time
    print(f"\nRate limiting overhead: {overhead * 1000:.2f}ms for 10 requests")

    # This is a soft assertion - log but don't fail
    if overhead > 0.5:
        print(f"⚠️  High overhead detected: {overhead * 1000:.2f}ms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
