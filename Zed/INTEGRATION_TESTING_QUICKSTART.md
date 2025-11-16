# Integration Testing - Quick Start Guide

## 🎯 What Was Fixed

1. **Backend Endpoint** - `/api/voice/log` now returns actual set IDs from database
2. **Integration Tests** - Updated to query correct table (`workout_logs` instead of `sets`)
3. **Schema Alignment** - Tests now match real database structure
4. **Response Handling** - Fixed field access (`response.data` vs `response.parsed_data`)

## ✅ Pre-Flight Checklist

Before running tests, verify:

```bash
# 1. Check Railway backend is live
curl https://voice-fit-production.up.railway.app/health

# Expected response:
# {"status":"healthy","supabase_connected":true,"model_id":"..."}

# 2. Verify environment variables exist
cd apps/mobile
cat .env | grep -E "EXPO_PUBLIC_(VOICE_API_URL|SUPABASE_URL|SUPABASE_ANON_KEY)"

# 3. Check you have test user credentials
cat .env | grep -E "TEST_USER_(EMAIL|PASSWORD)"
```

## 🚀 Running Tests

```bash
# Navigate to mobile app
cd apps/mobile

# Run all integration tests
npm run test:integration

# Run specific test suite
npm run test:integration -- voice-to-database.test.ts

# Run with verbose output
npm run test:integration -- --verbose

# Run specific test
npm run test:integration -- -t "should log voice workout and store in Supabase"
```

## 📊 Expected Results

### ✅ Should Pass (No Auth Required)
- Backend API health checks
- OPTIONS/CORS handling
- 404 handling for unknown routes

### ⚠️ May Fail (Auth Required)
- Voice parsing tests (need authentication)
- Voice logging tests (need authentication)
- Database verification tests (need authentication)

**Why?** Authentication is still being stabilized. Tests will pass once test user creation is reliable.

## 🔧 Quick Troubleshooting

### "404 Not Found" on `/api/voice/log`
```bash
# Check Railway deployment status
curl https://voice-fit-production.up.railway.app/health

# If unhealthy, redeploy:
git push railway main
```

### "Unauthorized" or "Invalid JWT"
```bash
# Verify your Supabase anon key is correct
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Check test user exists (requires service key)
# See apps/mobile/__tests__/integration/setup/testEnvironment.ts
```

### "Table does not exist" errors
```bash
# Regenerate Supabase types
cd ../..  # Back to VoiceFit root
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > apps/mobile/types/supabase.ts

# Or run migrations
npx supabase db push
```

### TypeScript errors in IDE
These are warnings from Supabase type generation. They don't block test execution:
```typescript
// error TS2769: No overload matches this call...
// from("workouts") or from("sets")
```

**Fix:** Regenerate types (see above) or ignore for now - tests still run.

## 📋 What Each Test Suite Does

### `backend-api-no-auth.test.ts`
- ✅ Health endpoint
- ✅ CORS/OPTIONS handling  
- ✅ 404 for invalid routes
- ⚠️ Endpoint availability (auth required but returns 401, not 404)

### `voice-to-database.test.ts`
- ⚠️ Voice parsing (parse transcript → structured data)
- ⚠️ Voice logging (parse + save to database)
- ⚠️ End-to-end workout sessions
- ⚠️ Data integrity verification
- ⚠️ Concurrent logging

### `sync-workflow.test.ts`
- ⚠️ WatermelonDB ↔ Supabase sync
- ⚠️ Cloud → Local sync
- ⚠️ Local → Cloud sync  
- ⚠️ Conflict resolution

## 🎯 Success Criteria

After running tests, you should see:

```
PASS  __tests__/integration/workflows/backend-api-no-auth.test.ts
  ✓ Health check returns 200
  ✓ Supabase connection is true
  ✓ OPTIONS returns CORS headers

PASS  __tests__/integration/workflows/voice-to-database.test.ts (if auth working)
  ✓ Parse simple voice input
  ✓ Log voice workout and store in Supabase
  ✓ Verify set IDs are returned
  ✓ Query workout_logs table successfully
```

## 🔍 Verifying the Set ID Fix

Manual verification:

```bash
# 1. Call the API
curl -X POST https://voice-fit-production.up.railway.app/api/voice/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "voice_input": "Bench press 185 for 8 reps",
    "user_id": "YOUR_USER_ID"
  }'

# 2. Check response includes set_ids
# Expected:
# {
#   "success": true,
#   "set_ids": ["abc-123-def-456"],  ← Should NOT be empty!
#   "parsed_data": {...}
# }

# 3. Verify in Supabase dashboard
# Go to: Table Editor → workout_logs
# Find row with id = "abc-123-def-456"
# Confirm weight=185, reps=8
```

## 📚 Next Steps

1. **Fix Authentication** (blocking most tests)
   - Stabilize test user creation
   - Add service key support for test setup
   - Document test user provisioning

2. **Expand Coverage**
   - Program scheduling tests
   - Injury detection tests
   - Analytics tests

3. **CI/CD Integration**
   - Add integration tests to GitHub Actions
   - Run on every PR to main
   - Alert on failures

## 📖 Related Docs

- **Full Details:** `INTEGRATION_TESTING_SET_ID_FIX.md`
- **Test Setup:** `apps/mobile/__tests__/integration/README.md`
- **Environment Setup:** `apps/mobile/__tests__/integration/setup/testEnvironment.ts`
- **Backend API:** `apps/backend/main.py`

---

**Last Updated:** 2025-01-19  
**Status:** ✅ Set ID fix complete, ⚠️ Auth stabilization in progress