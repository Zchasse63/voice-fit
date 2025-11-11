#!/usr/bin/env python3
"""
VoiceFit Test Configuration

This file contains all test configuration constants used across the test suite.
Update values here to change test behavior across all test files.

Test User Details:
- Email: test@voicefit.app
- Created: Via seed_test_user_data.py
- Has: 45 days of workout data, PRs, runs, badges, streaks
- Tier: Premium
- Experience: Intermediate
- Training: Upper/Lower 4x/week hypertrophy program

To create a new test user:
1. Run: python3 ../seed_test_user_data.py
2. Run: python3 find_test_user.py
3. Update TEST_USER_ID and TEST_PROFILE_ID below
"""

import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# TEST USER CONFIGURATION
# ============================================================================

# Primary test user (created by seed_test_user_data.py)
TEST_USER_ID = "e38a889d-23f7-4f97-993b-df3aff3e9334"  # UUID from auth.users
TEST_PROFILE_ID = "5fba5ecb-fea7-41c8-9086-3b6629826212"  # UUID from user_profiles
TEST_USER_EMAIL = "test@voicefit.app"
TEST_USER_NAME = "Test User"

# Allow override from environment variables (useful for CI/CD)
TEST_USER_ID = os.getenv("TEST_USER_ID", TEST_USER_ID)
TEST_PROFILE_ID = os.getenv("TEST_PROFILE_ID", TEST_PROFILE_ID)

# ============================================================================
# TEST LOCATIONS (for weather/running tests)
# ============================================================================

# San Francisco, CA
TEST_LOCATION_SF = {
    "lat": 37.7749,
    "lon": -122.4194,
    "name": "San Francisco, CA"
}

# New York, NY
TEST_LOCATION_NY = {
    "lat": 40.7128,
    "lon": -74.0060,
    "name": "New York, NY"
}

# Denver, CO (high altitude for GAP testing)
TEST_LOCATION_DENVER = {
    "lat": 39.7392,
    "lon": -104.9903,
    "name": "Denver, CO"
}

# Default test location
TEST_LOCATION_DEFAULT = TEST_LOCATION_SF

# ============================================================================
# API TIMEOUTS (in seconds)
# ============================================================================

WEATHER_API_TIMEOUT = 10
AI_API_TIMEOUT = 30
ANALYTICS_API_TIMEOUT = 5
RUNNING_API_TIMEOUT = 10

# ============================================================================
# TEST THRESHOLDS
# ============================================================================

# Performance thresholds (Updated to reflect realistic production latency)
# Note: These are based on actual performance with remote Supabase + OpenAI API calls
# See docs/FUTURE_TODO_LIST.md for performance optimization tasks to improve these metrics
MAX_ANALYTICS_LATENCY = 2.5  # seconds (complex DB queries with multiple joins)
MAX_AI_LATENCY = 10.0  # seconds (OpenAI API calls + context building)
MAX_RUNNING_LATENCY = 2.0  # seconds (weather API + GAP calculation)

# Load test thresholds
CONCURRENT_USERS = 10
MIN_SUCCESS_RATE = 0.80  # 80%

# ============================================================================
# TEST DATA EXPECTATIONS
# ============================================================================

# Expected data counts (from seed script)
EXPECTED_MIN_WORKOUTS = 30  # Should have ~45 days of data
EXPECTED_MIN_RUNS = 5
EXPECTED_MIN_PRS = 3
EXPECTED_MIN_BADGES = 3
EXPECTED_MIN_READINESS_SCORES = 30

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_test_user_info():
    """Get test user information as a dict"""
    return {
        "user_id": TEST_USER_ID,
        "profile_id": TEST_PROFILE_ID,
        "email": TEST_USER_EMAIL,
        "name": TEST_USER_NAME
    }

def get_test_location(location_name="default"):
    """Get test location coordinates"""
    locations = {
        "sf": TEST_LOCATION_SF,
        "ny": TEST_LOCATION_NY,
        "denver": TEST_LOCATION_DENVER,
        "default": TEST_LOCATION_DEFAULT
    }
    return locations.get(location_name.lower(), TEST_LOCATION_DEFAULT)

def get_test_auth_token():
    """
    Generate a valid Supabase JWT token for the test user.

    This creates a real JWT token that will pass authentication checks.
    The token is valid for 1 hour.

    Returns:
        str: JWT token in format "Bearer <token>", or None if JWT secret not available
    """
    # Get Supabase JWT secret from environment
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    if not jwt_secret:
        # If no JWT secret, check if auth is required
        require_auth = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
        if require_auth:
            raise ValueError(
                "SUPABASE_JWT_SECRET not found in environment. "
                "This is required when REQUIRE_AUTH=true. "
                "Get it from Supabase Dashboard > Settings > API > JWT Secret"
            )
        # Auth not required, return None (no token needed)
        return None

    # Create JWT payload matching Supabase auth format
    payload = {
        "sub": TEST_USER_ID,  # Subject (user ID)
        "email": TEST_USER_EMAIL,
        "aud": "authenticated",  # Audience
        "role": "authenticated",
        "iat": datetime.utcnow(),  # Issued at
        "exp": datetime.utcnow() + timedelta(hours=1)  # Expires in 1 hour
    }

    # Generate JWT token
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    return f"Bearer {token}"

def get_test_auth_headers():
    """
    Get HTTP headers with authentication token for API tests.

    Returns:
        dict: Headers dict with Authorization header (if auth is required)
    """
    headers = {"Content-Type": "application/json"}

    token = get_test_auth_token()
    if token:
        headers["Authorization"] = token

    return headers

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate that required config values are set"""
    errors = []
    
    if not TEST_USER_ID:
        errors.append("TEST_USER_ID is not set")
    
    if not TEST_PROFILE_ID:
        errors.append("TEST_PROFILE_ID is not set")
    
    if not TEST_USER_EMAIL:
        errors.append("TEST_USER_EMAIL is not set")
    
    if errors:
        raise ValueError(f"Test configuration errors: {', '.join(errors)}")
    
    return True

# Validate on import
validate_config()

