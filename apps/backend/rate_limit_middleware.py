"""
Rate Limiting Middleware for FastAPI

Implements tier-based rate limiting with Redis backend.
Supports free, premium, and admin tiers with different limits.
"""

import os
from typing import Optional

import jwt
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from monitoring_service import log_rate_limit_check
from redis_client import get_rate_limiter
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.

    Features:
    - Tier-based limits (free, premium, admin)
    - Per-endpoint and global rate limiting
    - Proper HTTP 429 responses with Retry-After headers
    - Graceful degradation if Redis fails
    """

    # Endpoints that should be rate limited
    RATE_LIMITED_ENDPOINTS = [
        "/api/voice/parse",
        "/api/voice/log",
        "/api/chat/classify",
        "/api/chat/swap-exercise",
        "/api/chat/swap-exercise-enhanced",
        "/api/coach/ask",
        "/api/program/generate/strength",
        "/api/program/generate/running",
        "/api/program/generate",
        "/api/running/parse",
        "/api/running/analyze",
        "/api/workout/insights",
        "/api/analytics/volume",
        "/api/analytics/fatigue",
        "/api/analytics/deload",
        "/api/injury/analyze",
        "/api/injury/log",
        "/api/injury/check-in",
        "/api/exercises/substitutes",
        "/api/exercises/substitutes/risk-aware",
        "/api/exercises/substitutes/explain",
        "/api/exercises/create-or-match",
        "/api/onboarding/extract",
        "/api/onboarding/conversational",
        "/api/adherence/report",
        "/api/adherence/check-in",
    ]

    # Endpoints that bypass rate limiting
    EXEMPT_ENDPOINTS = [
        "/",
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
    ]

    def __init__(self, app, enable_rate_limiting: bool = True):
        super().__init__(app)
        self.enable_rate_limiting = enable_rate_limiting
        self.rate_limiter = None

        # Initialize rate limiter only if enabled
        if self.enable_rate_limiting:
            try:
                self.rate_limiter = get_rate_limiter()
                print("✅ Rate limiting middleware initialized")
            except Exception as e:
                print(f"⚠️  Failed to initialize rate limiter: {e}")
                print("⚠️  Rate limiting will be disabled")
                self.enable_rate_limiting = False

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""

        # Skip rate limiting if disabled or rate limiter failed to initialize
        if not self.enable_rate_limiting or not self.rate_limiter:
            return await call_next(request)

        # Skip rate limiting for exempt endpoints
        path = request.url.path
        if any(path.startswith(exempt) for exempt in self.EXEMPT_ENDPOINTS):
            return await call_next(request)

        # Only rate limit specific endpoints
        if not any(
            path.startswith(endpoint) for endpoint in self.RATE_LIMITED_ENDPOINTS
        ):
            return await call_next(request)

        # Extract user info from JWT token
        user_id, tier = self._extract_user_info(request)

        # If no user_id, allow request (auth will handle it)
        if not user_id:
            return await call_next(request)

        # Check rate limit
        try:
            is_allowed, remaining, retry_after = self.rate_limiter.check_rate_limit(
                user_id=user_id, endpoint=path, tier=tier
            )

            # Log rate limit check to monitoring
            log_rate_limit_check(
                user_id=user_id,
                endpoint=path,
                tier=tier,
                allowed=is_allowed,
                remaining=remaining,
            )

            if not is_allowed:
                # Rate limit exceeded - return 429
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Please retry after {retry_after} seconds.",
                        "retry_after": retry_after,
                        "tier": tier,
                        "endpoint": path,
                        "remaining": 0,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self._get_limit_for_tier(tier, path)),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(retry_after),
                    },
                )

            # Request allowed - proceed and add rate limit headers
            response = await call_next(request)

            # Add rate limit headers to successful responses
            response.headers["X-RateLimit-Limit"] = str(
                self._get_limit_for_tier(tier, path)
            )
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Tier"] = tier

            return response

        except Exception as e:
            print(f"⚠️  Rate limit check failed: {e}")
            # Fail open - allow request if rate limiting fails
            return await call_next(request)

    def _extract_user_info(self, request: Request) -> tuple[Optional[str], str]:
        """
        Extract user_id and tier from JWT token.

        Returns:
            (user_id, tier) - tier defaults to 'free'
        """
        try:
            # Try to get token from Authorization header
            auth_header = request.headers.get("Authorization", "")

            if not auth_header or not auth_header.startswith("Bearer "):
                return (None, "free")

            token = auth_header.replace("Bearer ", "")

            # Decode JWT token
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
            if not jwt_secret:
                print("⚠️  SUPABASE_JWT_SECRET not set")
                return (None, "free")

            payload = jwt.decode(
                token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False}
            )

            # Extract user_id (Supabase uses 'sub' claim)
            user_id = payload.get("sub")

            # Extract tier from user_metadata or app_metadata
            user_metadata = payload.get("user_metadata", {})
            app_metadata = payload.get("app_metadata", {})

            # Try multiple locations for tier information
            tier = (
                user_metadata.get("tier")
                or user_metadata.get("subscription_tier")
                or app_metadata.get("tier")
                or app_metadata.get("subscription_tier")
                or "free"
            )

            # Normalize tier
            tier = tier.lower()
            if tier not in ["free", "premium", "admin"]:
                tier = "free"

            return (user_id, tier)

        except jwt.ExpiredSignatureError:
            print("⚠️  Expired JWT token")
            return (None, "free")
        except jwt.InvalidTokenError as e:
            print(f"⚠️  Invalid JWT token: {e}")
            return (None, "free")
        except Exception as e:
            print(f"⚠️  Error extracting user info: {e}")
            return (None, "free")

    def _get_limit_for_tier(self, tier: str, endpoint: str) -> int:
        """Get rate limit for tier and endpoint"""
        from redis_client import RateLimiter

        tier_config = RateLimiter.TIER_LIMITS.get(tier, RateLimiter.TIER_LIMITS["free"])
        is_expensive = any(exp in endpoint for exp in RateLimiter.EXPENSIVE_ENDPOINTS)

        if is_expensive:
            return tier_config["expensive"]
        else:
            return tier_config["default"]


# Helper function to add middleware to FastAPI app
def add_rate_limiting(app, enable: bool = True):
    """
    Add rate limiting middleware to FastAPI app.

    Usage:
        from rate_limit_middleware import add_rate_limiting

        app = FastAPI()
        add_rate_limiting(app, enable=True)
    """
    app.add_middleware(RateLimitMiddleware, enable_rate_limiting=enable)
    print(
        f"{'✅' if enable else '⚠️ '} Rate limiting {'enabled' if enable else 'disabled'}"
    )
