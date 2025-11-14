# Comprehensive Testing Strategy - VoiceFit Mobile App

**Date**: January 15, 2025  
**Purpose**: Complete architecture audit and testing strategy for comprehensive test coverage  
**Approach**: Bottom-up testing pyramid with live Railway backend integration  
**Goal**: Write tests once, correctly, with no rework needed

---

## 📋 Executive Summary

This document provides a complete audit of the VoiceFit mobile app architecture and a comprehensive testing strategy that leverages the live Railway backend. The strategy follows the testing pyramid (Unit → Integration → E2E) and ensures that each layer provides appropriate coverage without duplication or gaps.

**Key Principles:**
- ✅ Test the right thing at the right level
- ✅ Leverage live Railway backend for integration tests
- ✅ Mock only what's necessary at each level
- ✅ Write tests that validate actual behavior, not implementation
- ✅ Ensure tests are maintainable and not brittle

---

## 🏗️ Architecture Audit

### 1. Application Structure Overview

```
VoiceFit Mobile App
├── Navigation Layer (React Navigation)
│   ├── AuthNavigator (SignIn/SignUp)
│   └── RootNavigator (Tabs + Stacks)
│
├── State Management (Zustand)
│   ├── auth.store.ts (user, session, auth methods)
│   ├── workout.store.ts (workout state)
│   └── run.store.ts (run tracking state)
│
├── Data Layer
│   ├── Railway API (FastAPI backend)
│   ├── Supabase (Auth + PostgreSQL)
│   └── WatermelonDB (Local offline storage)
│
├── Services Layer (Business Logic)
│   ├── API Clients (Voice, Analytics)
│   ├── Database Services (Sync, Models)
│   ├── Feature Services (GPS, Voice, Injury, etc.)
│   └── Platform Services (Haptics, etc.)
│
├── Components Layer (38 components)
│   ├── Screen-specific components
│   ├── Common/Shared components
│   └── Feature components (analytics, charts, etc.)
│
└── Screens Layer (21 screens)
    ├── Auth Screens (SignIn, SignUp - Redesigned)
    ├── Main Tabs (Home, Chat, Run - Redesigned)
    └── Supporting Screens (Analytics, Profile, Log)
```

---

## 📊 Complete Inventory

### Screens (21 Total)

#### ✅ Redesigned & Active (Used in Navigation)
1. **SignInScreenRedesign.tsx** - Email/password + SSO signin
2. **SignUpScreenRedesign.tsx** - Email/password + SSO signup
3. **HomeScreenRedesign.tsx** - Main dashboard with metrics
4. **ChatScreenRedesign.tsx** - AI coach interaction
5. **RunScreenRedesign.tsx** - GPS run tracking
6. **ProfileScreenRedesign.tsx** - User profile & settings
7. **AnalyticsScreen.tsx** - Performance charts & metrics
8. **LogScreenRedesign.tsx** - Workout history

#### ⚠️ Legacy (Not Currently Used in Navigation)
9. LoginScreen.tsx
10. SignUpScreen.tsx
11. HomeScreen.tsx
12. ChatScreen.tsx
13. RunScreen.tsx
14. LogScreen.tsx

#### 📝 Supporting Screens
15. **OnboardingScreen.tsx** - First-time user flow
16. **CoachScreen.tsx** - Legacy coach screen
17. **ExerciseLibraryScreen.tsx** - Exercise database
18. **SettingsScreen.tsx** - App settings
19. **PRsScreen.tsx** - Personal records
20. **WorkoutDetailScreen.tsx** - Workout details
21. **StartScreen.tsx** - App entry point

---

### State Stores (3 Total)

#### 1. **auth.store.ts** (Authentication)
**State:**
- `user: User | null`
- `session: Session | null`
- `isLoading: boolean`
- `error: string | null`

**Actions:**
- `signIn(email, password)` → Supabase auth
- `signUp(email, password, name)` → Supabase auth
- `signInWithSSO(provider)` → Apple/Google OAuth
- `signUpWithSSO(provider)` → Apple/Google OAuth
- `signOut()` → Clear session
- `checkSession()` → Restore session
- `clearError()` → Clear error state

**Persistence:** AsyncStorage via Zustand persist middleware

**Dependencies:**
- Supabase client (`supabase.auth.*`)
- AsyncStorage

#### 2. **workout.store.ts** (Workout Tracking)
**State:** (Need to audit - not fully reviewed)
- Workout session state
- Exercise data
- Set tracking

**Dependencies:**
- WatermelonDB models
- Railway API (likely)

#### 3. **run.store.ts** (Run Tracking)
**State:** (Need to audit - not fully reviewed)
- Active run data
- GPS tracking state
- Run metrics

**Dependencies:**
- GPS service
- WatermelonDB
- Railway API (likely)

---

### Services (30+ Files)

#### API Services (Railway Integration)
1. **VoiceAPIClient.ts** - Voice command parsing
   - `parseVoiceCommand(request)` → Railway `/api/voice/parse`
   - `healthCheck()` → Railway `/health`

2. **AnalyticsAPIClient.ts** - Analytics data
   - (Need to review endpoints)

3. **config.ts** - Centralized API client
   - `apiClient.post()` → Generic POST with auth
   - `apiClient.get()` → Generic GET with auth
   - `apiClient.put()` → Generic PUT with auth
   - `apiClient.delete()` → Generic DELETE with auth
   - Uses: `process.env.EXPO_PUBLIC_VOICE_API_URL`
   - Auth: Automatic Bearer token from auth store

#### Database Services
4. **supabase.client.ts** - Supabase initialization
5. **database.ts** - WatermelonDB setup
6. **SyncService.ts** - Local/remote sync

**WatermelonDB Models:**
- UserBadge
- Set
- ReadinessScore
- InjuryLog
- UserStreak
- Message
- WorkoutLog
- PRHistory
- Run

#### Feature Services
7. **GPSService.ts** - Location tracking
8. **VoiceService.ts** - Voice recognition
9. **InjuryDetectionService.ts** - Injury detection logic
10. **InjuryLoggingService.ts** - Injury tracking
11. **RecoveryCheckInService.ts** - Recovery tracking
12. **AutoRegulationService.ts** - Training load management
13. **ChartDataService.ts** - Chart data preparation
14. **DeloadService.ts** - Deload week detection
15. **PRService.ts** - Personal record tracking
16. **ReadinessService.ts** - Readiness scoring
17. **VolumeService.ts** - Volume tracking
18. **ExerciseSubstitutionService.ts** - Exercise recommendations
19. **OnboardingService.ts** - Onboarding flow

#### Platform Services
20. **HapticsService.ios.ts** - iOS haptic feedback
21. **HapticsService.web.ts** - Web haptic fallback
22. **VoiceService.ios.ts** - iOS voice recognition
23. **VoiceService.web.ts** - Web voice fallback

---

### Components (38 Total)

#### Common Components (src/components/common)
- LoadingSpinner
- ErrorBoundary
- Toast
- Buttons, Inputs, etc.

#### Feature Components
**Analytics** (src/components/analytics)
- Analytics-specific components

**Charts** (src/components/charts)
- Chart visualizations

**Injury** (src/components/injury)
- ActiveInjuryBanner ✅ HAS TEST
- InjuryDetectionModal ✅ HAS TEST
- RecoveryCheckInModal ✅ HAS TEST

**Voice** (src/components/voice)
- Voice input components

**Stats, PR, Readiness, etc.**
- Various feature-specific components

#### Screen Components
- AdherenceAlertCard
- BadgeUnlock
- LogOverlay
- WorkoutSummaryCard

---

### Hooks (4 Total)

1. **useAuth.ts** - Auth operations wrapper
2. **useOnboarding.ts** - Onboarding state (AsyncStorage)
3. **useAutoRegulation.ts** - Auto-regulation logic
4. **useToast.ts** - Toast notifications

---

### Existing Tests (8 Total)

#### Unit Tests (5) ✅
1. `ExplanationFormatterService.test.ts`
2. `InjuryDetectionService.test.ts`
3. `InjuryLoggingService.test.ts`
4. `RecoveryCheckInService.test.ts`
5. `VoiceAPIClient.test.ts`

#### Component Tests (3) ✅
1. `ActiveInjuryBanner.test.tsx`
2. `InjuryDetectionModal.test.tsx`
3. `RecoveryCheckInModal.test.tsx`

#### E2E Tests (3) - Playwright (Web Only)
1. `navigation.spec.ts`
2. `voice-logging.spec.ts`
3. `workout.spec.ts`

---

## 🎯 Testing Strategy - Three Layers

### Testing Pyramid Distribution

```
             E2E Tests (Maestro)              ← 5-10 tests
            /                    \               (Critical paths only)
           /                      \
    Integration Tests               ← 30-50 tests
   (With Live Railway)              (API + Navigation + Data flow)
  /                      \
Unit Tests                          ← 100-150 tests
(Isolated, Fast, Mocked)            (Components, Services, Utils)
```

**Coverage Goals:**
- Unit Tests: 80-90% code coverage
- Integration Tests: 100% of API contracts and navigation flows
- E2E Tests: 100% of critical user journeys

---

## 1️⃣ Unit Testing Strategy

### What to Test at Unit Level

**Philosophy:** Test in isolation with all dependencies mocked. Fast, focused, deterministic.

#### A. **Zustand Stores**

**Test File:** `__tests__/store/auth.store.test.ts`

**What to Test:**
- ✅ Initial state is correct
- ✅ Actions update state correctly
- ✅ Error handling sets error state
- ✅ Loading states toggle appropriately
- ✅ Persistence works (mock AsyncStorage)

**Mock:**
- ❌ Supabase client (mock all `supabase.auth.*` methods)
- ❌ AsyncStorage (use `@react-native-async-storage/async-storage` mock)

**Example Test Structure:**
```typescript
// Mock Supabase
jest.mock('../services/database/supabase.client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe('auth.store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
  });

  it('should sign in successfully', async () => {
    // Mock successful response
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    // Execute
    await useAuthStore.getState().signIn('test@example.com', 'password');

    // Assert
    expect(useAuthStore.getState().user).toEqual(expect.objectContaining({
      id: '123',
      email: 'test@example.com',
    }));
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBe(null);
  });

  it('should handle sign in error', async () => {
    // Mock error response
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    // Execute and assert throws
    await expect(
      useAuthStore.getState().signIn('test@example.com', 'wrong')
    ).rejects.toThrow();

    // Assert error state
    expect(useAuthStore.getState().user).toBe(null);
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
```

**Tests to Write:**
- `auth.store.test.ts` (signIn, signUp, signOut, SSO, checkSession)
- `workout.store.test.ts` (workout CRUD operations)
- `run.store.test.ts` (run state management)

---

#### B. **Services (Business Logic)**

**Test Files:**
- `__tests__/services/OnboardingService.test.ts`
- `__tests__/services/GPSService.test.ts`
- `__tests__/services/SyncService.test.ts`
- `__tests__/services/ChartDataService.test.ts`
- etc.

**What to Test:**
- ✅ Service methods return correct outputs for given inputs
- ✅ Error handling (invalid inputs, API failures)
- ✅ Data transformations are correct
- ✅ Business logic calculations are accurate

**Mock:**
- ❌ All external dependencies (API clients, database, other services)
- ❌ Platform-specific APIs (GPS, Voice)

**Example: ChartDataService**
```typescript
describe('ChartDataService', () => {
  it('should format volume data for chart', () => {
    const mockWorkouts = [
      { date: '2025-01-01', volume: 1000 },
      { date: '2025-01-02', volume: 1200 },
    ];

    const result = ChartDataService.formatVolumeData(mockWorkouts);

    expect(result).toEqual([
      { x: '2025-01-01', y: 1000 },
      { x: '2025-01-02', y: 1200 },
    ]);
  });

  it('should handle empty workout data', () => {
    const result = ChartDataService.formatVolumeData([]);
    expect(result).toEqual([]);
  });
});
```

---

#### C. **Hooks**

**Test Files:**
- `__tests__/hooks/useOnboarding.test.ts`
- `__tests__/hooks/useAuth.test.ts`
- `__tests__/hooks/useAutoRegulation.test.ts`

**What to Test:**
- ✅ Hook returns correct initial state
- ✅ Hook state updates on actions
- ✅ Side effects work correctly (AsyncStorage, etc.)
- ✅ Cleanup happens on unmount

**Use:** `@testing-library/react-hooks` (or `renderHook` from RTL)

**Example: useOnboarding**
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('useOnboarding', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('should initialize with null state', () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.hasCompletedOnboarding).toBe(null);
    expect(result.current.isLoading).toBe(true);
  });

  it('should complete onboarding', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOnboarding());

    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@voicefit_onboarding_completed',
      'true'
    );
  });
});
```

---

#### D. **Components (React Testing Library)**

**Test Files:**
- `__tests__/components/common/LoadingSpinner.test.tsx`
- `__tests__/components/common/ErrorBoundary.test.tsx`
- `__tests__/components/charts/VolumeChart.test.tsx`
- etc.

**What to Test:**
- ✅ Component renders without crashing
- ✅ Props are applied correctly
- ✅ User interactions trigger expected behavior
- ✅ Conditional rendering works
- ✅ Accessibility props are present

**Mock:**
- ❌ Navigation (use `@react-navigation/native` mock)
- ❌ Stores (mock Zustand stores)
- ❌ API calls (mock service methods)

**Example: LoadingSpinner**
```typescript
import { render } from '@testing-library/react-native';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    const { getByText } = render(<LoadingSpinner />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    const { getByText } = render(<LoadingSpinner message="Please wait" />);
    expect(getByText('Please wait')).toBeTruthy();
  });

  it('should be accessible', () => {
    const { getByA11yHint } = render(<LoadingSpinner />);
    expect(getByA11yHint('Loading content')).toBeTruthy();
  });
});
```

---

#### E. **Navigation Components**

**Test Files:**
- `__tests__/navigation/RootNavigator.test.tsx`
- `__tests__/navigation/AuthNavigator.test.tsx`

**What to Test:**
- ✅ Navigator renders correct initial screen
- ✅ Navigation structure is correct
- ✅ Screen options are applied
- ✅ TypeScript types are correct

**Mock:**
- ❌ All screens (use simple mock components)
- ❌ Auth store (mock user state)

**Example: RootNavigator**
```typescript
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../RootNavigator';

// Mock screens
jest.mock('../../screens/HomeScreenRedesign', () => 'HomeScreen');
jest.mock('../../screens/ChatScreenRedesign', () => 'ChatScreen');
jest.mock('../../screens/RunScreenRedesign', () => 'RunScreen');

describe('RootNavigator', () => {
  it('should render without crashing', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Tab bar should be visible
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Coach')).toBeTruthy();
    expect(getByText('Run')).toBeTruthy();
  });

  it('should start on Chat tab by default', () => {
    const { UNSAFE_getByType } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Check initial route (implementation depends on RN testing utilities)
    // This is a simplified example
  });
});
```

---

## 2️⃣ Integration Testing Strategy

### What to Test at Integration Level

**Philosophy:** Test real interactions between multiple components with live Railway backend. Focus on data flow and API contracts.

### Integration Test Categories

#### A. **API Integration Tests (With Live Railway)**

**Test Files:**
- `__tests__/integration/api/auth-api.test.ts`
- `__tests__/integration/api/voice-api.test.ts`
- `__tests__/integration/api/workout-api.test.ts`
- `__tests__/integration/api/analytics-api.test.ts`

**What to Test:**
- ✅ Real API calls to Railway succeed
- ✅ API client handles errors correctly
- ✅ Authentication works end-to-end
- ✅ Request/response formats match expectations
- ✅ API rate limiting and timeouts work

**DO NOT Mock:**
- ✅ Railway backend (use real API)
- ✅ apiClient methods (use real HTTP)
- ✅ Supabase auth (use test account)

**Mock:**
- ❌ UI components (not needed)
- ❌ AsyncStorage (use memory storage)

**Environment:**
- Use test user accounts on Railway staging
- Use test Supabase project
- Clean up test data after tests

**Example: Voice API Integration**
```typescript
import { VoiceAPIClient } from '../../services/api/VoiceAPIClient';

describe('Voice API Integration', () => {
  let client: VoiceAPIClient;

  beforeAll(() => {
    client = new VoiceAPIClient({
      baseUrl: process.env.EXPO_PUBLIC_VOICE_API_URL,
      timeout: 10000,
    });
  });

  it('should successfully parse voice command (LIVE API)', async () => {
    const response = await client.parseVoiceCommand({
      transcript: 'bench press 225 pounds for 8 reps',
      user_id: 'test-user-123',
      session_context: {},
    });

    expect(response.success).toBe(true);
    expect(response.data.exercise_name).toContain('bench press');
    expect(response.data.weight).toBe(225);
    expect(response.data.reps).toBe(8);
  }, 15000); // 15 second timeout

  it('should handle API errors gracefully', async () => {
    await expect(
      client.parseVoiceCommand({
        transcript: '', // Invalid empty transcript
        user_id: 'test-user-123',
        session_context: {},
      })
    ).rejects.toThrow();
  });

  it('should timeout on slow requests', async () => {
    const slowClient = new VoiceAPIClient({
      baseUrl: process.env.EXPO_PUBLIC_VOICE_API_URL,
      timeout: 100, // Very short timeout
    });

    await expect(
      slowClient.parseVoiceCommand({
        transcript: 'test',
        user_id: 'test-user-123',
        session_context: {},
      })
    ).rejects.toThrow('timeout');
  });
});
```

**Test Data Management:**
```typescript
// Setup test data
beforeAll(async () => {
  await createTestUser('test-user-123', 'test@voicefit.com');
});

// Cleanup test data
afterAll(async () => {
  await deleteTestUser('test-user-123');
});
```

---

#### B. **Authentication Flow Integration Tests**

**Test File:** `__tests__/integration/auth-flow.test.ts`

**What to Test:**
- ✅ Sign up creates user in Supabase (real)
- ✅ Sign in returns valid session (real)
- ✅ Session persists to AsyncStorage
- ✅ Sign out clears session
- ✅ checkSession restores user on app launch
- ✅ Invalid credentials handled correctly

**DO NOT Mock:**
- ✅ Supabase auth (use test project)
- ✅ auth.store (use real store)
- ✅ AsyncStorage (use real or memory version)

**Example:**
```typescript
import { useAuthStore } from '../../store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Auth Flow Integration', () => {
  beforeEach(async () => {
    // Reset store and storage
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
    await AsyncStorage.clear();
  });

  it('should complete full signup flow (LIVE)', async () => {
    const testEmail = `test-${Date.now()}@voicefit.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';

    // Sign up
    await useAuthStore.getState().signUp(testEmail, testPassword, testName);

    // Verify user created
    const state = useAuthStore.getState();
    expect(state.user).toBeTruthy();
    expect(state.user?.email).toBe(testEmail);
    expect(state.session).toBeTruthy();

    // Verify persisted to AsyncStorage
    const storedData = await AsyncStorage.getItem('auth-storage');
    expect(storedData).toBeTruthy();

    // Cleanup: Delete test user
    await useAuthStore.getState().signOut();
    // Call Railway/Supabase endpoint to delete test user
  }, 15000);

  it('should restore session from AsyncStorage', async () => {
    // Create a session first
    const testEmail = `test-${Date.now()}@voicefit.com`;
    await useAuthStore.getState().signUp(testEmail, 'Test123!', 'Test');

    // Simulate app restart (clear memory, keep storage)
    const storedData = await AsyncStorage.getItem('auth-storage');
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });

    // Check session (should restore from storage)
    await useAuthStore.getState().checkSession();

    // Verify restored
    expect(useAuthStore.getState().user).toBeTruthy();
    expect(useAuthStore.getState().session).toBeTruthy();

    // Cleanup
    await useAuthStore.getState().signOut();
  }, 15000);
});
```

---

#### C. **Navigation Flow Integration Tests**

**Test Files:**
- `__tests__/integration/navigation/auth-navigation.test.tsx`
- `__tests__/integration/navigation/tab-navigation.test.tsx`
- `__tests__/integration/navigation/screen-navigation.test.tsx`

**What to Test:**
- ✅ Unauthenticated users see AuthNavigator
- ✅ Authenticated users see RootNavigator
- ✅ Tab switching works and preserves state
- ✅ Screen navigation within stacks works
- ✅ Modal screens present and dismiss correctly
- ✅ Navigation params are passed correctly

**DO NOT Mock:**
- ✅ Navigation (use real React Navigation)
- ✅ auth.store (use real store with mock Supabase)

**Mock:**
- ❌ Supabase (use mock for fast tests)
- ❌ Heavy components (use simple placeholders)

**Example:**
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from '../../App';

describe('Navigation Flow Integration', () => {
  it('should show auth screens when not logged in', () => {
    // Mock unauthenticated state
    useAuthStore.setState({ user: null, session: null });

    const { getByText } = render(<App />);

    // Should show sign in screen
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should show main tabs when logged in', async () => {
    // Mock authenticated state
    useAuthStore.setState({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
    });

    const { getByText } = render(<App />);

    // Should show tab bar
    await waitFor(() => {
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Coach')).toBeTruthy();
      expect(getByText('Run')).toBeTruthy();
    });
  });

  it('should navigate from Home to Analytics', async () => {
    useAuthStore.setState({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
    });

    const { getByText, getByTestId } = render(<App />);

    // Tap on analytics card
    const analyticsCard = getByTestId('analytics-card');
    fireEvent.press(analyticsCard);

    // Should navigate to analytics screen
    await waitFor(() => {
      expect(getByText('Analytics')).toBeTruthy();
    });
  });
});
```

---

#### D. **Data Sync Integration Tests**

**Test File:** `__tests__/integration/data-sync.test.ts`

**What to Test:**
- ✅ Workout data syncs to Railway
- ✅ Local WatermelonDB updates after Railway sync
- ✅ Offline changes queue and sync when online
- ✅ Conflict resolution works correctly

**DO NOT Mock:**
- ✅ Railway API (use real API)
- ✅ WatermelonDB (use test database)
- ✅ SyncService (use real service)

**Example:**
```typescript
import { SyncService } from '../../services/sync/SyncService';
import { database } from '../../services/database/watermelon/database';

describe('Data Sync Integration', () => {
  let syncService: SyncService;

  beforeAll(async () => {
    syncService = new SyncService();
    await database.write(async () => {
      // Clear test data
      await database.unsafeResetDatabase();
    });
  });

  it('should sync workout to Railway', async () => {
    // Create local workout
    const workout = await database.write(async () => {
      return await database.collections
        .get('workout_logs')
        .create((record) => {
          record.exerciseName = 'Bench Press';
          record.weight = 225;
          record.reps = 8;
        });
    });

    // Trigger sync
    await syncService.syncWorkouts('test-user-123');

    // Verify synced to Railway (check API)
    const response = await apiClient.get('/api/workouts/test-user-123');
    const syncedWorkout = response.find((w) => w.id === workout.id);

    expect(syncedWorkout).toBeTruthy();
    expect(syncedWorkout.exerciseName).toBe('Bench Press');
  }, 15000);
});
```

---

## 3️⃣ End-to-End Testing Strategy (Maestro)

### What to Test at E2E Level

**Philosophy:** Test complete user journeys through the real app with real backend. Focus ONLY on critical paths that provide value beyond integration tests.

**Use Maestro ONLY for:**
- ✅ Critical user journeys (signup → home → workout → log)
- ✅ Flows that require multiple screens and interactions
- ✅ Scenarios that cannot be tested in unit or integration tests
- ✅ End-to-end validation of key app features

**DO NOT use Maestro for:**
- ❌ Individual button clicks
- ❌ Basic navigation flows
- ❌ Testing app startup (use unit tests)
- ❌ Testing individual components (use unit tests)
- ❌ Testing API integrations (use integration tests)