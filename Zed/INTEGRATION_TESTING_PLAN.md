# Integration Testing Plan - VoiceFit

## Overview

This document outlines the integration testing strategy for VoiceFit. Unlike unit tests that mock dependencies, integration tests verify actual system integration against **real environments**:

- **Railway Backend** (live API running on Railway)
- **Supabase** (cloud PostgreSQL database)
- **WatermelonDB** (local SQLite database)

## Goals

1. ✅ Verify end-to-end workflows work in production-like environment
2. ✅ Catch integration issues that unit tests miss
3. ✅ Validate data flow across entire stack (mobile → backend → database)
4. ✅ Test real API contracts and response formats
5. ✅ Ensure bidirectional sync works correctly
6. ✅ Validate error handling with real network conditions

## Test Environment Setup

### Prerequisites

Before running integration tests, ensure:

1. **Railway Backend is Running**
   - Health check: `curl https://your-app.up.railway.app/health`
   - Should return: `{"status": "healthy", "supabase_connected": true}`

2. **Supabase Project is Active**
   - All migrations applied
   - RLS policies configured
   - Test user can authenticate

3. **Environment Variables Set**
   ```bash
   # Required in .env
   EXPO_PUBLIC_VOICE_API_URL=https://your-app.up.railway.app
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # Optional (for advanced tests)
   SUPABASE_SERVICE_KEY=your-service-key
   TEST_USER_EMAIL=test@voicefit.test
   TEST_USER_PASSWORD=Test123!
   ```

### Setup Files

- **`__tests__/integration/setup/testEnvironment.ts`**
  - Loads and validates environment configuration
  - Provides test utilities (clients, factories, assertions)
  - NO MOCKING - uses real clients

- **`__tests__/integration/setup/jest.integration.setup.ts`**
  - Runs before all tests (validates connections)
  - Creates test user
  - Cleans up after tests

## Test Categories

### 1. Voice-to-Database Workflow (`workflows/voice-to-database.test.ts`)

**Coverage:**
- Voice parsing API (speech → structured data)
- Voice logging (parsing → database storage)
- End-to-end workout sessions
- Data integrity across stack
- Error handling

**Key Tests:**
- ✅ Parse simple voice input → verify structured output
- ✅ Parse voice with RPE → verify all fields preserved
- ✅ Log workout via voice → verify data in Supabase
- ✅ Complete workout session (multiple exercises) → verify all stored
- ✅ Concurrent voice logs → no data loss
- ✅ Invalid input → graceful error handling

**Success Criteria:**
- All parsed data reaches Supabase correctly
- No data loss during concurrent operations
- API responses match database state
- Errors are handled gracefully

---

### 2. Sync Workflow (`workflows/sync-workflow.test.ts`)

**Coverage:**
- Local → Cloud sync (WatermelonDB → Supabase)
- Cloud → Local sync (Supabase → WatermelonDB)
- Bidirectional sync
- Background sync
- Conflict resolution

**Key Tests:**
- ✅ Create workout locally → sync → verify in Supabase
- ✅ Create workout in Supabase → sync → verify locally
- ✅ Update both sides → sync → verify consistency
- ✅ Multiple concurrent writes → no duplicates
- ✅ Background sync → automatic propagation
- ✅ Offline changes → sync when online

**Success Criteria:**
- Data syncs correctly in both directions
- No duplicates after multiple syncs
- Updates are propagated correctly
- Background sync works automatically

---

### 3. Program Management Workflow (TODO)

**Coverage:**
- Generate program via API
- Store program in database
- Schedule workouts
- Track progress
- Update program state

**Key Tests:**
- [ ] Generate program → verify in Supabase & WatermelonDB
- [ ] Schedule workouts for program → verify calendar
- [ ] Complete workout → update program progress
- [ ] Modify program → sync changes
- [ ] Delete program → cascade delete workouts

---

### 4. Injury Detection & Recovery (TODO)

**Coverage:**
- Log injury via voice/form
- RAG-based injury analysis
- Recovery check-ins
- Workout modifications based on injury

**Key Tests:**
- [ ] Log injury → verify stored with analysis
- [ ] Get injury recommendations → verify RAG response
- [ ] Recovery check-in → update injury status
- [ ] Injury affects workout suggestions
- [ ] Clear injury → remove workout restrictions

---

### 5. Analytics & Insights (TODO)

**Coverage:**
- Calculate workout statistics
- Track PRs (personal records)
- Volume tracking
- Trend analysis

**Key Tests:**
- [ ] Log multiple workouts → verify stats calculated
- [ ] Achieve PR → verify PR recorded
- [ ] Query volume trends → verify aggregation
- [ ] Historical data → verify charts data

## Running Integration Tests

### Local Development

```bash
# Navigate to mobile app
cd apps/mobile

# Ensure environment variables are set
cp .env.example .env
# Edit .env with real values

# Run integration tests only
npm test -- __tests__/integration

# Run specific workflow
npm test -- __tests__/integration/workflows/voice-to-database.test.ts

# Run with verbose output
npm test -- __tests__/integration --verbose
```

### CI/CD Pipeline

**GitHub Actions Example:**

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/mobile
          npm install
      
      - name: Run integration tests
        env:
          EXPO_PUBLIC_VOICE_API_URL: ${{ secrets.RAILWAY_API_URL }}
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: |
          cd apps/mobile
          npm test -- __tests__/integration --ci --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/mobile/coverage/lcov.info
```

## Test Data Management

### Test User Strategy

**Option 1: Ephemeral Test Users (Recommended)**
- Create new user for each test run
- Cleanup after tests complete
- Pros: Isolated, no conflicts
- Cons: Slower (auth time)

**Option 2: Persistent Test User**
- Use dedicated test account (TEST_USER_EMAIL)
- Cleanup data between tests
- Pros: Faster (no signup)
- Cons: Potential state pollution

**Current Implementation:** Option 1 (ephemeral) with Option 2 fallback if `TEST_USER_EMAIL` provided

### Data Cleanup

**Automatic Cleanup:**
```typescript
afterAll(async () => {
  // Cleans up all test data for test user
  await cleanupTestUserData(testUser.id);
});
```

**Tables Cleaned (in order):**
1. `sets`
2. `workout_logs`
3. `scheduled_workouts`
4. `program_weeks`
5. `generated_programs`
6. `injury_logs`
7. `recovery_check_ins`
8. `user_profiles`

## Test Execution Timeline

### Phase 1: Foundation (✅ COMPLETE)
- [x] Test environment setup
- [x] Voice-to-database workflow tests
- [x] Sync workflow tests
- [x] CI/CD integration

### Phase 2: Core Features (IN PROGRESS)
- [ ] Program management workflow
- [ ] Injury detection & recovery
- [ ] Analytics & insights

### Phase 3: Advanced Features (PLANNED)
- [ ] Deload recommendations
- [ ] Exercise substitutions
- [ ] Social features (if applicable)
- [ ] Notification system

## Performance Benchmarks

Integration tests should complete within reasonable timeframes:

| Test Suite | Target Time | Max Time |
|------------|-------------|----------|
| Voice-to-Database | 30s | 60s |
| Sync Workflow | 45s | 90s |
| Program Management | 30s | 60s |
| Injury Detection | 20s | 45s |
| Full Suite | 2min | 5min |

**Optimization Strategies:**
- Run tests in parallel where possible
- Reuse test user across tests (within suite)
- Batch database operations
- Use `waitForCondition` with reasonable timeouts

## Troubleshooting

### Common Issues

#### 1. "Backend not reachable"

**Cause:** Railway backend is down or environment variable incorrect

**Fix:**
```bash
# Check backend is running
curl https://your-app.up.railway.app/health

# Verify environment variable
echo $EXPO_PUBLIC_VOICE_API_URL
```

#### 2. "Supabase query failed"

**Cause:** Database connection issue or RLS policy blocking

**Fix:**
- Check Supabase project status (dashboard)
- Verify RLS policies allow test user access
- Check service key has admin access (if using)

#### 3. "Test user creation failed"

**Cause:** Email already exists or auth disabled

**Fix:**
```bash
# Use unique email each time (automatic)
# OR clean up old test users via Supabase dashboard

# Verify auth is enabled
# Supabase Dashboard → Authentication → Providers → Email enabled
```

#### 4. "Sync tests timing out"

**Cause:** Network latency or sync service not working

**Fix:**
- Increase timeout: `jest.setTimeout(60000)`
- Check network connection
- Verify sync service is running correctly
- Add debug logs in sync service

#### 5. "Data not appearing after sync"

**Cause:** Sync didn't complete or query issue

**Fix:**
```typescript
// Use waitForCondition instead of fixed delays
await waitForCondition(async () => {
  const { data } = await supabase.from('table').select('*').eq('id', id);
  return data !== null;
}, 10000); // 10 second timeout
```

### Debug Mode

Enable verbose logging for integration tests:

```bash
# Set debug environment variable
DEBUG=voicefit:* npm test -- __tests__/integration

# Or in test file
process.env.DEBUG = 'voicefit:*';
```

## Best Practices

### DO ✅

- **Test against real environments** - No mocking of external services
- **Clean up test data** - Always cleanup in `afterAll`/`afterEach`
- **Use unique identifiers** - Timestamps, UUIDs to avoid conflicts
- **Wait for async operations** - Use `waitForCondition` for eventual consistency
- **Assert real data flow** - Verify data at each step (API → DB → Local)
- **Test error cases** - Network failures, invalid data, etc.
- **Run locally before CI** - Catch issues early

### DON'T ❌

- **Mock external services** - Defeats purpose of integration tests
- **Hardcode test data** - Use factories and random data
- **Ignore cleanup** - Can cause test pollution
- **Use fixed delays** - `setTimeout(5000)` is unreliable; use polling
- **Test UI rendering** - Integration tests focus on data flow, not UI
- **Run without environment check** - Validate connections first

## Success Metrics

Integration test suite is successful when:

- ✅ **95%+ Pass Rate** - Consistent passing across runs
- ✅ **<5 min Total Runtime** - Fast enough for CI/CD
- ✅ **Zero Flaky Tests** - Reliable, reproducible results
- ✅ **Real Bug Detection** - Catches issues unit tests miss
- ✅ **Clear Failure Messages** - Easy to diagnose failures
- ✅ **Complete Cleanup** - No test data pollution

## Next Steps

1. **Complete Phase 2 Tests** (IN PROGRESS)
   - Program management workflow
   - Injury detection & recovery
   - Analytics & insights

2. **CI/CD Integration** (TODO)
   - Set up GitHub Actions workflow
   - Configure secrets
   - Add status badges to README

3. **Monitoring & Alerts** (TODO)
   - Track integration test metrics
   - Alert on failures/slowness
   - Dashboard for test health

4. **E2E Tests** (FUTURE)
   - Maestro for UI automation
   - Full user journey testing
   - Screenshot/video capture

## Resources

- **Test Environment Setup**: `__tests__/integration/setup/testEnvironment.ts`
- **Jest Setup**: `__tests__/integration/setup/jest.integration.setup.ts`
- **Workflow Tests**: `__tests__/integration/workflows/`
- **Railway Backend**: `apps/backend/`
- **Supabase Migrations**: `supabase/migrations/`

---

**Last Updated:** 2024-01-XX  
**Status:** Phase 1 Complete, Phase 2 In Progress  
**Test Coverage:** 2/5 workflows implemented