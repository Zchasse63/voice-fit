# VoiceFit Integration Testing Guide

Complete guide for running integration tests against the VoiceFit backend API.

## Overview

Integration tests validate the complete system including:
- **RAG Integration**: Context retrieval across 13+ endpoints
- **Redis/Upstash**: Caching and rate limiting
- **User Context**: Building and caching user context
- **AI Services**: Coach Q&A, program generation, onboarding
- **Analytics**: Volume tracking, fatigue monitoring, deload recommendations
- **Real API Calls**: Tests use production endpoints and services (no mocks)

## Quick Start

### Prerequisites

1. **Environment Variables** - Ensure `.env` is configured:
   ```bash
   # Required
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   UPSTASH_VECTOR_REST_URL=your_vector_url
   UPSTASH_VECTOR_REST_TOKEN=your_vector_token
   OPENAI_API_KEY=your_openai_key  # or MOONSHOT_API_KEY
   
   # Optional (for auth tests)
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

2. **Test User** - Integration tests require a test user:
   ```bash
   # Check if test user exists
   python3 find_test_user.py
   
   # Create test user if needed
   python3 seed_test_user_data.py
   ```

3. **Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running Tests

#### Option 1: Automated (Recommended)

The test runner automatically starts/stops the server:

```bash
# Run all integration tests
python3 run_integration_tests.py

# Run quick tests only (RAG + Redis)
python3 run_integration_tests.py --quick

# Use existing server (don't auto-start)
python3 run_integration_tests.py --no-server-start
```

#### Option 2: Manual Server Management

Start server in one terminal:
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Run tests in another terminal:
```bash
# RAG + Redis integration tests
python3 test_rag_redis_integration.py

# Full stack integration
python3 test_full_stack_integration.py

# AI Coach tests
python3 test_ai_coach.py

# User context builder tests
python3 test_user_context_builder.py
```

#### Option 3: Run All Backend Tests

```bash
# Run ALL tests (unit + integration + performance)
python3 run_all_tests.py
```

## Test Suites

### 1. RAG + Redis Integration (`test_rag_redis_integration.py`)

**What it tests:**
- ✅ Server health and connectivity
- ✅ RAG context retrieval in `/api/coach/ask`
- ✅ RAG integration in program generation
- ✅ User context caching
- ✅ Rate limiting with Redis
- ✅ Chat classification with RAG
- ✅ Onboarding extraction with RAG
- ✅ Monitoring endpoints

**Expected duration:** ~45-60 seconds

**Example output:**
```
================================================================================
RAG + REDIS INTEGRATION TEST SUITE
================================================================================
Target: http://localhost:8000
User ID: e38a889d-23f7-4f97-993b-df3aff3e9334
================================================================================

TEST 1: Server Health Check
   ✅ Server healthy
   
TEST 2: RAG Integration - Coach Ask
   ✅ RAG retrieval successful
   Sources: 3 RAG sources
   
TEST 3: RAG Integration - Program Generation
   ✅ Program generated successfully
   
...

📊 Overall Results: 8/8 tests passed (100.0%)
🎉 ALL RAG + REDIS INTEGRATION TESTS PASSED!
```

### 2. Full Stack Integration (`test_full_stack_integration.py`)

**What it tests:**
- Complete workout logging workflow
- Voice parsing → database → insights → analytics
- Volume tracking, fatigue, deload recommendations

**Expected duration:** ~20-30 seconds

### 3. AI Coach Tests (`test_ai_coach.py`)

**What it tests:**
- Basic Q&A with RAG retrieval
- Context-aware responses using user data
- RAG knowledge base integration
- Source attribution

**Expected duration:** ~45-60 seconds

### 4. User Context Builder (`test_user_context_builder.py`)

**What it tests:**
- Context initialization
- Building context from real user data
- Expected context sections (profile, workouts, PRs, etc.)
- Handling missing data gracefully

**Expected duration:** ~10-15 seconds

## Understanding Test Results

### Success Indicators

✅ **PASS** - Test completed successfully
```
✅ PASS: RAG Coach Ask
         Answer: True, Sources: True
```

### Failure Indicators

❌ **FAIL** - Test failed
```
❌ FAIL: RAG Integration - Coach Ask
         Status 500
```

Common failures:
- **Connection refused**: Server not running
- **500 errors**: Missing environment variables or API keys
- **422 errors**: Invalid request payload (check test data)
- **Authentication errors**: Missing or invalid JWT token

### Warnings

⚠️ **SKIP** - Test skipped (file not found or prerequisites not met)
```
⚠️ SKIP: Latency Tests
        test_latency.py not found
```

## Configuration

### Test User Configuration

Edit `test_config.py` to change test user:

```python
# Primary test user (created by seed_test_user_data.py)
TEST_USER_ID = "your-user-id"
TEST_PROFILE_ID = "your-profile-id"
TEST_USER_EMAIL = "test@voicefit.app"
```

### Performance Thresholds

Adjust timeouts in `test_config.py`:

```python
# API timeouts (in seconds)
WEATHER_API_TIMEOUT = 10
AI_API_TIMEOUT = 30        # OpenAI API calls
ANALYTICS_API_TIMEOUT = 5
RUNNING_API_TIMEOUT = 10

# Performance thresholds
MAX_ANALYTICS_LATENCY = 2.5  # Complex DB queries
MAX_AI_LATENCY = 10.0        # OpenAI API + context building
MAX_RUNNING_LATENCY = 2.0    # Weather API + GAP calc
```

### Server Port

Change test server port:

```bash
# Default port 8000
python3 run_integration_tests.py

# Custom port
python3 run_integration_tests.py --port 8080
```

## Troubleshooting

### "Connection refused" Error

**Problem:** Tests can't connect to server

**Solutions:**
1. Check if server is running: `lsof -i :8000`
2. Use automated runner: `python3 run_integration_tests.py`
3. Start server manually: `python3 -m uvicorn main:app --port 8000`

### "Upstash/Redis not connected" Warning

**Problem:** Redis/Upstash connection failed

**Impact:** Caching and rate limiting tests may fail

**Solutions:**
1. Check environment variables:
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```
2. Verify Upstash credentials in dashboard
3. Check network connectivity to Upstash

### "Test user not found" Error

**Problem:** Test user doesn't exist in database

**Solution:**
```bash
# Check for test user
python3 find_test_user.py

# Create test user with seed data
python3 seed_test_user_data.py

# Update test_config.py with new user ID
```

### RAG Tests Returning "No sources"

**Problem:** RAG retrieval not working or no matching content

**Possible causes:**
1. Upstash Vector not configured
2. RAG index empty or not populated
3. Query doesn't match any content

**Solutions:**
1. Check Upstash Vector credentials
2. Verify RAG index has data: check Upstash dashboard
3. Test with known query like "What is progressive overload?"

### Slow Test Execution

**Problem:** Tests taking longer than expected

**Normal durations:**
- RAG + Redis: 45-60s (includes multiple AI API calls)
- Full Stack: 20-30s
- AI Coach: 45-60s (multiple AI queries)
- User Context: 10-15s

**If slower:**
1. Check network latency to external APIs (OpenAI, Upstash)
2. Check Supabase query performance
3. Run quick tests only: `python3 run_integration_tests.py --quick`

### Authentication Errors (401/403)

**Problem:** Endpoints requiring auth are failing

**Solution:**
1. Set `SUPABASE_JWT_SECRET` in `.env`
2. Or disable auth for testing:
   ```bash
   REQUIRE_AUTH=false
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Set up environment
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          echo "Environment configured"
      
      - name: Run integration tests
        run: |
          cd apps/backend
          python3 run_integration_tests.py --quick
```

## Best Practices

### 1. Test Against Real Endpoints

Per VoiceFit testing rules:
- ✅ **DO** test against real Supabase, Upstash, OpenAI APIs
- ✅ **DO** use production-like data and scenarios
- ❌ **DON'T** mock external services unless necessary
- ❌ **DON'T** rewrite tests to pass when they fail

### 2. Use Dedicated Test Data

- Use `TEST_USER_ID` from `test_config.py`
- Seed test data with `seed_test_user_data.py`
- Never use production user data in tests

### 3. Clean Up After Tests

Tests should be idempotent:
- Use consistent test user
- Don't rely on specific data state
- Clean up any created resources

### 4. Monitor Test Performance

Track test durations over time:
```bash
# Run with timing
python3 run_integration_tests.py 2>&1 | tee test_results.log

# Extract durations
grep "Duration:" test_results.log
```

## Next Steps

After integration tests pass:

1. **Run load tests**: `python3 test_load.py`
2. **Check monitoring**: Visit `/api/monitoring/summary`
3. **Review logs**: Check for warnings or errors
4. **Deploy**: Tests passing = ready for production

## Support

- **Documentation**: `/docs` folder
- **Test issues**: Check `test_config.py` configuration
- **API issues**: Check `/api/monitoring/health`
- **RAG issues**: Verify Upstash Vector index populated

---

**Last Updated:** January 2025  
**Version:** 2.0 (Post RAG/Redis Integration)