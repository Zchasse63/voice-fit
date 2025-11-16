# Integration Tests

## Overview

Integration tests verify VoiceFit's complete workflows against **REAL environments**:
- ✅ Railway backend (live API)
- ✅ Supabase (cloud database)
- ✅ WatermelonDB (local database)

**NO MOCKING** - Tests validate actual system integration.

## Quick Start

### 1. Prerequisites

Ensure your test environment is ready:

```bash
# Check backend is healthy
curl https://your-app.up.railway.app/health

# Should return: {"status": "healthy", "supabase_connected": true}
```

### 2. Environment Setup

Create/update `.env` in `apps/mobile/`:

```bash
# Required
EXPO_PUBLIC_VOICE_API_URL=https://your-app.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for admin operations)
SUPABASE_SERVICE_KEY=your-service-key

# Optional (reuse test user instead of creating new)
TEST_USER_EMAIL=test@voicefit.test
TEST_USER_PASSWORD=Test123!
```

### 3. Run Tests

```bash
# All integration tests
npm test -- __tests__/integration

# Specific workflow
npm test -- __tests__/integration/workflows/voice-to-database.test.ts

# With verbose output
npm test -- __tests__/integration --verbose

# Watch mode (for development)
npm test -- __tests__/integration --watch
```

## Test Suites

### 🎤 Voice-to-Database Workflow
**File:** `workflows/voice-to-database.test.ts`

Tests voice input → backend parsing → database storage:
- Parse voice input (with RPE, sets, notes)
- Log workouts via voice API
- Complete workout sessions
- Data integrity checks
- Concurrent logging
- Error handling

**Runtime:** ~30-60 seconds

### 🔄 Sync Workflow
**File:** `workflows/sync-workflow.test.ts`

Tests bidirectional sync between WatermelonDB and Supabase:
- Local → Cloud sync
- Cloud → Local sync
- Bidirectional updates
- Background sync
- Conflict resolution
- No duplicates

**Runtime:** ~45-90 seconds

## How It Works

### Test Environment Setup

1. **Before All Tests:**
   - Validates backend and Supabase connections
   - Creates/reuses test user
   - Initializes test clients

2. **Before Each Test:**
   - Cleans local database
   - Prepares fresh test data

3. **After All Tests:**
   - Signs out test user
   - Cleans up all test data
   - Removes test user (if ephemeral)

### Test User Strategy

**Ephemeral (Default):**
- Creates unique test user per run
- Cleanup after tests complete
- No state pollution between runs

**Persistent (Optional):**
- Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- Reuses same test account
- Faster (no signup delay)

## Utilities

Located in `setup/testEnvironment.ts`:

### Environment
```typescript
import { getTestEnvironment, validateTestEnvironment } from './setup/testEnvironment';

// Get configuration
const env = getTestEnvironment();

// Validate before tests
await validateTestEnvironment();
```

### API Requests
```typescript
import { makeAuthenticatedRequest } from './setup/testEnvironment';

// Make authenticated API call
const response = await makeAuthenticatedRequest(
  '/api/voice/parse',
  testUser.accessToken,
  { method: 'POST', body: JSON.stringify({ text: 'Bench press 135 for 10' }) }
);
```

### Test Data
```typescript
import { createTestWorkoutLog, createTestSets } from './setup/testEnvironment';

// Create test workout
const workout = await createTestWorkoutLog(userId, {
  workout_type: 'strength',
  duration_minutes: 60
});

// Create test sets
const sets = await createTestSets(workout.id, 'Squat', 3);
```

### Waiting & Polling
```typescript
import { waitForCondition } from './setup/testEnvironment';

// Wait for condition to be true (with timeout)
await waitForCondition(async () => {
  const { data } = await supabase.from('sets').select('*').eq('id', setId);
  return data !== null;
}, 10000); // 10 second timeout
```

## Troubleshooting

### Backend Not Reachable

**Error:** `Backend not reachable at https://...`

**Fix:**
1. Check Railway deployment is running
2. Verify `EXPO_PUBLIC_VOICE_API_URL` in `.env`
3. Test health endpoint: `curl $EXPO_PUBLIC_VOICE_API_URL/health`

### Supabase Connection Failed

**Error:** `Supabase not connected`

**Fix:**
1. Check Supabase project is active (dashboard)
2. Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Test query in Supabase SQL editor
4. Check RLS policies allow test user access

### Test User Creation Failed

**Error:** `Failed to create test user`

**Fix:**
1. Check email auth is enabled (Supabase → Authentication → Providers)
2. Use unique email or set `TEST_USER_EMAIL` to reuse account
3. Verify email confirmation is disabled for testing

### Tests Timing Out

**Error:** `Timeout - Async callback was not invoked within...`

**Fix:**
1. Increase test timeout: `jest.setTimeout(60000)`
2. Check network connection
3. Verify backend is responding quickly
4. Use `waitForCondition` instead of fixed delays

### Data Not Syncing

**Error:** Data doesn't appear after sync

**Fix:**
1. Add debug logs in `SyncService`
2. Check sync is completing without errors
3. Verify user has permission to read/write data
4. Use `waitForCondition` to poll for data instead of assuming immediate sync

## Best Practices

### ✅ DO

- Clean up test data in `afterAll`/`afterEach`
- Use `waitForCondition` for eventual consistency
- Test real error cases (network failures, invalid data)
- Verify data at each step (API → DB → Local)
- Run locally before pushing to CI

### ❌ DON'T

- Mock external services (defeats integration testing purpose)
- Use fixed delays (`setTimeout(5000)`)
- Hardcode test data (use factories)
- Ignore cleanup (causes test pollution)
- Skip environment validation

## Adding New Tests

1. **Create test file** in `workflows/` or `screens/`
2. **Import test utilities** from `setup/testEnvironment`
3. **Setup test user** in `beforeAll`
4. **Cleanup data** in `afterAll`
5. **Write tests** that verify real data flow
6. **Update this README** with new test suite info

Example:

```typescript
import {
  getAuthenticatedTestUser,
  getSupabaseClient,
  cleanupTestUserData,
} from '../setup/testEnvironment';

describe('Integration: New Feature', () => {
  let testUser: any;

  beforeAll(async () => {
    testUser = await getAuthenticatedTestUser();
  });

  afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestUserData(testUser.id);
    }
  });

  it('should test real workflow', async () => {
    // Test implementation
  });
});
```

## CI/CD

Integration tests run in CI via GitHub Actions. Required secrets:

- `RAILWAY_API_URL` - Railway backend URL
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `TEST_USER_EMAIL` - Persistent test user email
- `TEST_USER_PASSWORD` - Persistent test user password

## Resources

- **Full Plan:** `/Zed/INTEGRATION_TESTING_PLAN.md`
- **Test Environment:** `setup/testEnvironment.ts`
- **Jest Setup:** `setup/jest.integration.setup.ts`
- **Backend API:** `apps/backend/`
- **Supabase Migrations:** `supabase/migrations/`

---

**Status:** 2/5 workflows implemented  
**Coverage:** Voice parsing, Sync  
**Next:** Program management, Injury detection, Analytics