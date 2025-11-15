# Testing Next Steps - Action Plan

**Status:** 190/219 tests passing (86.8%)  
**Priority:** Fix remaining 29 test failures  
**Timeline:** 1-2 hours of focused work

---

## Immediate Action Items (In Order)

### 1. Fix Auth Store Tests (14 failures) ⚠️ HIGH PRIORITY

**Issue:** Async mock handling in Zustand store with Supabase auth methods

**Location:** `__tests__/unit/stores/auth.store.test.ts`

**Fix Steps:**
```typescript
// In jest.setup.js, update the Supabase mock:
const mockSupabaseAuth = {
  signInWithPassword: jest.fn((credentials) => 
    Promise.resolve({
      data: { 
        user: { id: 'test-user-id', email: credentials.email },
        session: { access_token: 'test-token', refresh_token: 'test-refresh' }
      },
      error: null
    })
  ),
  signUp: jest.fn((credentials) =>
    Promise.resolve({
      data: {
        user: { id: 'new-user-id', email: credentials.email },
        session: { access_token: 'test-token', refresh_token: 'test-refresh' }
      },
      error: null
    })
  ),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  getSession: jest.fn(() =>
    Promise.resolve({ data: { session: null }, error: null })
  ),
  signInWithIdToken: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  signInWithOAuth: jest.fn(() => Promise.resolve({ data: { url: 'test-url' }, error: null })),
};
```

**Expected Outcome:** All 21 auth.store tests passing

---

### 2. Fix InjuryDetectionService Tests (11 failures) ⚠️ MEDIUM PRIORITY

**Issue:** Keyword matching logic not detecting injuries correctly in tests

**Location:** `__tests__/unit/InjuryDetectionService.test.ts`

**Debug Steps:**
1. Run single test: `npm test -- InjuryDetectionService.test.ts`
2. Log actual vs expected detection results
3. Compare mock keywords with test input strings
4. Verify body part detection logic

**Potential Issues:**
- Case sensitivity in keyword matching
- Missing synonyms in mock data
- Confidence score calculation off
- False positive filtering too aggressive

**Fix:** Update either:
- Mock keyword data to match test expectations
- OR test expectations to match actual implementation
- OR fix keyword matching algorithm

---

### 3. Fix Accessibility Tests (5 failures) 🔧 LOW PRIORITY

**Affected Components:**
- TimelineItem (1 failure)
- MetricCard (2 failures)
- SSOButton (2 failures)

**Issue:** `getByRole("button")` not finding Pressable components

**Solution A - Fix Components:**
```typescript
// Add explicit accessibility role to Pressable
<Pressable
  accessibilityRole="button"
  accessibilityLabel={...}
  onPress={onPress}
>
```

**Solution B - Fix Tests:**
```typescript
// Use UNSAFE_getByType instead
const { UNSAFE_getByType } = render(<Component />);
const pressable = UNSAFE_getByType(Pressable);
fireEvent.press(pressable);
```

**Recommendation:** Use Solution A (better for real accessibility)

---

### 4. Verify Fixed Tests (Rerun) ✅ QUICK WIN

**These should now pass after our fixes:**

```bash
# VoiceAPIClient - class now exported
npm test -- VoiceAPIClient.test.ts

# ChatHeader - imports fixed
npm test -- ChatHeader.test.tsx
```

**Expected:** Both suites fully passing

---

### 5. Fix ExplanationFormatterService (1 failure) 🔧 TRIVIAL

**Issue:** Muscle list formatting test failing

**Location:** `__tests__/unit/ExplanationFormatterService.test.ts`

**Debug:**
```bash
npm test -- ExplanationFormatterService.test.ts
```

**Likely Fix:** String formatting expectation mismatch (comma, semicolon, "and", etc.)

---

## After Fixes Complete (Test Suite at 100%)

### Add Missing Test Coverage

#### A. Screen-Level Tests
```bash
# Create integration tests for main screens
__tests__/integration/screens/HomeScreen.test.tsx
__tests__/integration/screens/RunScreen.test.tsx
__tests__/integration/screens/ProfileScreen.test.tsx
__tests__/integration/screens/ChatScreen.test.tsx
```

#### B. Store Tests
```bash
# Add tests for remaining stores
__tests__/unit/stores/workout.store.test.ts
__tests__/unit/stores/run.store.test.ts
```

#### C. API Client Tests
```bash
# Test API methods with fetch mocks
__tests__/integration/api/client.test.ts
```

#### D. Navigation Tests
```bash
# Test navigation flows
__tests__/integration/navigation/RootNavigator.test.tsx
__tests__/integration/navigation/AuthNavigator.test.tsx
```

---

## Testing Strategy Going Forward

### Unit Tests (Current Focus)
- ✅ Core UI components - DONE
- ⚠️ Services - MOSTLY DONE
- ❌ Stores - NEEDS WORK
- ❌ Utilities - NOT STARTED

### Integration Tests (Next Phase)
- ❌ API + Store integration
- ❌ Navigation flows
- ❌ Data sync (WatermelonDB + API)
- ❌ Auth flows (OAuth)

### E2E Tests (Future)
- ❌ Maestro flows for critical paths
- ❌ User journey tests
- ❌ Cross-platform validation

---

## Commands for Quick Testing

```bash
# Run failing tests only
npm test -- --onlyFailures

# Run specific suite
npm test -- auth.store.test.ts

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}'

# Watch mode for development
npm run test:watch
```

---

## Expected Timeline

| Task | Time | Priority |
|------|------|----------|
| Fix auth.store mocks | 20 min | 🔴 HIGH |
| Fix InjuryDetection tests | 30 min | 🟡 MED |
| Fix accessibility tests | 15 min | 🟢 LOW |
| Verify VoiceAPI/ChatHeader | 5 min | ✅ QUICK |
| Fix ExplanationFormatter | 5 min | ✅ QUICK |
| **Total** | **75 min** | **~1.5 hours** |

---

## Success Criteria

- [ ] All 219 tests passing
- [ ] No test suites failing
- [ ] Coverage reports clean
- [ ] CI/CD ready (can add GitHub Actions)

---

## Blockers & Dependencies

**None.** All necessary infrastructure is in place:
- ✅ Jest configured
- ✅ Mocks created
- ✅ Test utilities available
- ✅ Mock data files present

Only code fixes needed, no additional setup required.

---

## Notes for Next Session

1. Start with auth.store - it's the critical path blocker
2. Use `npm test -- --onlyFailures` to focus on broken tests
3. Consider adding `console.log` in failing tests to debug expectations
4. Run `npm test -- --coverage` after fixes to see coverage metrics
5. Update TESTING_PROGRESS_SUMMARY.md when complete

---

**Last Updated:** November 14, 2024  
**Next Session Goal:** 100% test pass rate (219/219)