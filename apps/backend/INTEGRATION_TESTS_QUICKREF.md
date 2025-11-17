# Integration Tests - Quick Reference

**One-page cheat sheet for running VoiceFit integration tests**

---

## Quick Start (Copy & Paste)

```bash
# 1. Navigate to backend
cd apps/backend

# 2. Run all integration tests (auto-starts server)
python3 run_integration_tests.py

# 3. Or run quick tests only (45-60s)
python3 run_integration_tests.py --quick
```

---

## Common Commands

### Run Tests (Automated)

```bash
# All integration tests with auto server management
python3 run_integration_tests.py

# Quick tests only (RAG + Redis)
python3 run_integration_tests.py --quick

# Use existing server (don't auto-start)
python3 run_integration_tests.py --no-server-start

# Custom port
python3 run_integration_tests.py --port 8080
```

### Run Tests (Manual Server)

```bash
# Terminal 1: Start server
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Run specific test
python3 test_rag_redis_integration.py
python3 test_full_stack_integration.py
python3 test_ai_coach.py
python3 test_user_context_builder.py
```

### Run All Tests (Unit + Integration + Performance)

```bash
python3 run_all_tests.py
```

---

## Prerequisites Check

```bash
# Check environment variables
env | grep -E '(SUPABASE|UPSTASH|OPENAI|MOONSHOT)'

# Check test user exists
python3 find_test_user.py

# Create test user if missing
python3 seed_test_user_data.py

# Check server health
curl http://localhost:8000/health
```

---

## Test Suites

| Suite | File | Duration | What It Tests |
|-------|------|----------|---------------|
| **RAG + Redis** | `test_rag_redis_integration.py` | 45-60s | RAG context, caching, rate limiting |
| **Full Stack** | `test_full_stack_integration.py` | 20-30s | Complete workout workflow |
| **AI Coach** | `test_ai_coach.py` | 45-60s | Q&A, RAG retrieval, user context |
| **User Context** | `test_user_context_builder.py` | 10-15s | Context building and caching |

---

## Expected Output (Success)

```
================================================================================
RAG + REDIS INTEGRATION TEST SUITE
================================================================================

✅ PASS: Server Health Check
✅ PASS: RAG Integration - Coach Ask
✅ PASS: RAG Integration - Program Generation
✅ PASS: User Context Caching
✅ PASS: Rate Limiting
✅ PASS: RAG Chat Classify
✅ PASS: RAG Onboarding Extract
✅ PASS: Monitoring Endpoints

📊 Overall Results: 8/8 tests passed (100.0%)
🎉 ALL RAG + REDIS INTEGRATION TESTS PASSED!
```

---

## Troubleshooting One-Liners

```bash
# Server not running?
lsof -i :8000

# Kill existing server
kill $(lsof -t -i:8000)

# Check environment variables
echo $SUPABASE_URL
echo $UPSTASH_REDIS_REST_URL
echo $OPENAI_API_KEY

# Test database connection
python3 -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv(); print('Connected!' if create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY')).table('exercises').select('id').limit(1).execute() else 'Failed')"

# Test Redis connection
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/ping"
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Connection refused` | Start server: `python3 run_integration_tests.py` |
| `Upstash not connected` | Check `UPSTASH_REDIS_REST_URL` and token in `.env` |
| `Test user not found` | Run: `python3 seed_test_user_data.py` |
| `401/403 auth error` | Set `SUPABASE_JWT_SECRET` or `REQUIRE_AUTH=false` |
| `No RAG sources` | Check Upstash Vector credentials and index |

---

## Configuration Files

- `test_config.py` - Test user, timeouts, thresholds
- `.env` - API keys and credentials
- `run_integration_tests.py` - Test runner settings

---

## CI/CD Quick Setup

```yaml
# .github/workflows/integration-tests.yml
- run: pip install -r requirements.txt
- name: Integration Tests
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
    UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    cd apps/backend
    python3 run_integration_tests.py --quick
```

---

## Help & Documentation

- **Detailed Guide**: `INTEGRATION_TESTING_GUIDE.md`
- **Implementation**: `INTEGRATION_TESTING_COMPLETE.md`
- **Test Config**: `test_config.py`
- **API Health**: `http://localhost:8000/health`
- **Monitoring**: `http://localhost:8000/api/monitoring/summary`

---

**Version:** 2.0 | **Last Updated:** January 2025