# Integration Testing Setup - Complete ✅

**Date:** 2024-01-XX  
**Status:** Phase 1 Complete - Ready for Testing

---

## What We Built

A complete integration testing framework that tests VoiceFit against **REAL environments**:

- ✅ Railway backend (live API)
- ✅ Supabase (cloud PostgreSQL)
- ✅ WatermelonDB (local SQLite)

**Zero mocking** - All tests validate actual system integration.

---

## Files Created

### 1. Test Infrastructure

**`__tests__/integration/setup/testEnvironment.ts`** (491 lines)
- Environment configuration and validation
- Test client initialization (Supabase, backend API)
- Test user management (create, signin, cleanup)
- Database cleanup utilities
- API request helpers
- Test data factories
- Retry and polling utilities

**`__tests__/integration/setup/jest.integration.setup.ts`** (192 lines)
- Global test setup and teardown
- Connection validation before tests
- Automatic cleanup after tests
- Test timeout configuration
- Console output filtering

### 2. Integration Tests

**`__tests__/integration/workflows/voice-to-database.test.ts`** (488 lines)
- Voice parsing API tests
- Voice logging workflow tests
- End-to-end workout sessions
- Data integrity validation
- Concurrent operations
- Error handling

**Tests:** 20+ test cases covering:
- Simple voice input parsing
- Voice with RPE, sets, notes
- Logging to database
- Multiple sets in sequence
- Complete workout sessions
- Data consistency across stack
- Concurrent voice logs
- Invalid input handling

**`__tests__/integration/workflows/sync-workflow.test.ts`** (595 lines)
- Local → Cloud sync (WatermelonDB → Supabase)
- Cloud → Local sync (Supabase → WatermelonDB)
- Bidirectional sync
- Background sync
- Concurrent writes
- Update propagation

**Tests:** 25+ test cases covering:
- New local workouts syncing to cloud
- Workouts with sets syncing
- Cloud workouts syncing to local
- Updates from cloud to local
- Bidirectional changes
- Multiple syncs maintaining consistency
- Background automatic sync
- No duplicates on repeated syncs

### 3. Documentation

**`__tests__/integration/README.md`** (297 lines)
- Quick start guide
- Environment setup instructions
- Test suite descriptions
- Troubleshooting guide
- Best practices
- Examples for adding new tests

**`/Zed/INTEGRATION_TESTING_PLAN.md`** (446 lines)
- Complete integration testing strategy
- Test categories and phases
- Performance benchmarks
- CI/CD integration guide
- Success metrics
- Roadmap for future tests

### 4. Scripts

**`__tests__/integration/run-integration-tests.sh`** (218 lines)
- Automated environment validation
- Backend health check
- Supabase connection check
- Test execution wrapper
- Colored output for easy debugging

---

## How to Use

### Quick Start (3 Steps)

**1. Set up environment variables**

Create/update `apps/mobile/.env`:

```bash
# Required
EXPO_PUBLIC_VOICE_API_URL=https://your-app.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for faster tests)
TEST_USER_EMAIL=test@voicefit.test
TEST_USER_PASSWORD=Test123!
```

**2. Verify backend is running**

```bash
curl https://your-app.up.railway.app/health
# Should return: {"status": "healthy", "supabase_connected": true}
```

**3. Run tests**

```bash
cd apps/mobile

# Using the automated script (recommended)
./__tests__/integration/run-integration-tests.sh

# Or directly with npm
npm test -- __tests__/integration
```

### Running Specific Tests

```bash
# Voice workflow only
npm test -- __tests__/integration/workflows/voice-to-database.test.ts

# Sync workflow only
npm test -- __tests__/integration/workflows/sync-workflow.test.ts

# With verbose output
npm test -- __tests__/integration --verbose

# Watch mode (for development)
npm test -- __tests__/integration --watch
```

---

## What's Tested

### ✅ Voice-to-Database Workflow

**Full flow:** Voice input → Backend API → Supabase storage

- Voice parsing (exercise, weight, reps, RPE, notes)
- Voice logging to database
- Multiple exercises in single session
- Data integrity validation
- Concurrent operations
- Error handling

**Coverage:** 20+ test cases, ~30-60s runtime

### ✅ Sync Workflow

**Full flow:** WatermelonDB ↔ Supabase bidirectional sync

- Local changes sync to cloud
- Cloud changes sync to local
- Bidirectional updates
- Background automatic sync
- No duplicate data
- Update propagation

**Coverage:** 25+ test cases, ~45-90s runtime

---

## Test Environment

### What Gets Tested

```
┌─────────────────┐
│  Mobile App     │
│  (Test Client)  │
└────────┬────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
┌─────────────────┐        ┌──────────────┐
│  Railway API    │        │  Supabase    │
│  (Real Backend) │        │  (Real DB)   │
└─────────────────┘        └──────────────┘
         │                          ▲
         │                          │
         └──────────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  WatermelonDB   │
         │  (Local SQLite) │
         └─────────────────┘
```

### Test User Management

**Ephemeral (Default):**
- Creates unique test user per run
- Format: `test-{timestamp}@voicefit.test`
- Automatic cleanup after tests

**Persistent (Optional):**
- Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- Reuses same account
- Faster (no signup delay)

### Data Cleanup

Automatic cleanup after each test run:
1. Signs out test user
2. Deletes test data from Supabase
3. Clears local WatermelonDB
4. Removes test user (if ephemeral)

**Tables cleaned:**
- `sets`
- `workout_logs`
- `scheduled_workouts`
- `program_weeks`
- `generated_programs`
- `injury_logs`
- `recovery_check_ins`
- `user_profiles`

---

## Key Features

### 1. Real Environment Testing
- No mocking of external services
- Tests actual API contracts
- Validates real network conditions
- Catches integration issues unit tests miss

### 2. Automatic Validation
- Pre-test environment checks
- Backend health validation
- Supabase connection verification
- Clear error messages if environment not ready

### 3. Robust Utilities
- `waitForCondition()` - Polls until condition met (no flaky timeouts)
- `retryWithBackoff()` - Automatic retry with exponential backoff
- Test data factories - Create realistic test data easily
- Cleanup utilities - Automatic test data removal

### 4. Developer-Friendly
- Colored output for easy debugging
- Verbose logging options
- Watch mode support
- Clear error messages
- Comprehensive troubleshooting guide

---

## Next Steps

### Immediate (Ready Now)

1. **Run tests locally**
   ```bash
   cd apps/mobile
   ./__tests__/integration/run-integration-tests.sh
   ```

2. **Verify all tests pass**
   - Expected: 45+ tests passing
   - Runtime: ~2-3 minutes total

3. **Review test output**
   - Check for any environment issues
   - Verify data cleanup is working
   - Note any slow tests

### Phase 2 (Planned)

**Add more integration tests:**

1. **Program Management Workflow**
   - Generate program → store → schedule → track
   - Update program state
   - Complete workouts in program

2. **Injury Detection & Recovery**
   - Log injury → RAG analysis → recommendations
   - Recovery check-ins
   - Workout modifications

3. **Analytics & Insights**
   - Calculate stats → verify aggregations
   - Track PRs → verify recording
   - Volume tracking → verify trends

### CI/CD Integration (Future)

1. **GitHub Actions workflow**
   - Run on push to main/develop
   - Run on pull requests
   - Store secrets for environment

2. **Monitoring & Alerts**
   - Track test success rates
   - Alert on failures
   - Performance monitoring

3. **E2E Tests (Maestro)**
   - Full UI automation
   - User journey testing
   - Screenshot/video capture

---

## Success Criteria ✅

Integration testing is complete when:

- [x] Test infrastructure created
- [x] Voice-to-database workflow tested
- [x] Sync workflow tested
- [x] Documentation complete
- [x] Script for easy execution
- [ ] CI/CD integration (Phase 2)
- [ ] Additional workflows (Phase 2)

**Current Status:** Phase 1 Complete (2/5 workflows)

---

## Resources

### Documentation
- **Full Plan:** `/Zed/INTEGRATION_TESTING_PLAN.md`
- **Quick Start:** `__tests__/integration/README.md`
- **Backend Setup:** `/RAILWAY_SETUP_GUIDE.md`

### Test Files
- **Test Environment:** `__tests__/integration/setup/testEnvironment.ts`
- **Jest Setup:** `__tests__/integration/setup/jest.integration.setup.ts`
- **Voice Tests:** `__tests__/integration/workflows/voice-to-database.test.ts`
- **Sync Tests:** `__tests__/integration/workflows/sync-workflow.test.ts`

### Backend & Database
- **Backend API:** `apps/backend/main.py`
- **Supabase Client:** `src/services/database/supabase.client.ts`
- **Sync Service:** `src/services/sync/SyncService.ts`
- **Migrations:** `supabase/migrations/`

---

## Troubleshooting

### Backend Not Reachable

**Check:**
1. Railway deployment status
2. `EXPO_PUBLIC_VOICE_API_URL` in `.env`
3. Health endpoint: `curl $EXPO_PUBLIC_VOICE_API_URL/health`

### Supabase Connection Failed

**Check:**
1. Supabase project status (dashboard)
2. Environment variables in `.env`
3. RLS policies allow test user access

### Tests Timing Out

**Fix:**
1. Check network connection
2. Verify backend response time
3. Increase timeout: `jest.setTimeout(60000)`

**See full troubleshooting guide in `__tests__/integration/README.md`**

---

## Summary

**What we have:**
- ✅ Complete integration test framework
- ✅ 45+ real integration tests
- ✅ Automated environment validation
- ✅ Comprehensive documentation
- ✅ Easy-to-use scripts

**What it tests:**
- ✅ Voice input → Backend → Database (full flow)
- ✅ WatermelonDB ↔ Supabase sync (bidirectional)
- ✅ Data integrity across entire stack
- ✅ Real error handling
- ✅ Concurrent operations

**What's next:**
- 📋 Run tests locally to verify setup
- 📋 Add Phase 2 workflows (programs, injuries, analytics)
- 📋 Set up CI/CD integration
- 📋 Add E2E tests with Maestro

---

**Ready to test?**

```bash
cd apps/mobile
./__tests__/integration/run-integration-tests.sh
```

🚀 Happy Testing!