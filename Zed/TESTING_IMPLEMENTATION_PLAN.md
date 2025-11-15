# VoiceFit - Testing Implementation Plan

**Date**: January 2025  
**Status**: Ready to Implement  
**Focus**: Unit Tests + Integration Tests (NO E2E or Manual Yet)  
**Estimated Time**: 2-3 weeks

---

## 🎯 Overview

This plan implements automated testing for VoiceFit following the testing pyramid:
1. **Unit Tests** (70%) - Fast, isolated, mocked dependencies
2. **Integration Tests** (25%) - Real Railway backend, real data flow
3. **E2E Tests** (5%) - Maestro (LATER, not in this plan)
4. **Manual Testing** (LATER, not in this plan)

**This Plan Covers**: Unit + Integration tests only  
**Deferred**: E2E (Maestro) and Manual testing for later phase

---

## 📊 Testing Pyramid Structure

```
                    Manual Testing
                   (LATER - not now)
                  /                \
            E2E Tests (Maestro)      ← 5% (LATER)
           (Critical user flows)
          /                      \
    Integration Tests              ← 25% (THIS PLAN)
   (Railway + Navigation + Data)
  /                              \
Unit Tests                         ← 70% (THIS PLAN)
(Components, Stores, Services, Utils)
```

---

## 🏗️ What We're Testing

### Recent Work (Sessions 5-7)
✅ **New Components**:
- MetricCard, TimelineItem, StatsOverview (dashboard)
- New screens: HomeScreen, RunScreen (redesigned)

✅ **Navigation**:
- 3-tab structure (Home, Run, Chat)
- Profile modal via avatar button
- AuthNavigator with stack navigation

✅ **Backend Integration**:
- API client for Railway
- Chat message sending/receiving
- Authentication token handling

### Existing Work (Sessions 1-4)
✅ **Already Built** (need tests added):
- Core UI components (Button, Input, Card, PillBadge)
- Auth components (SSOButton, AuthContainer, ErrorMessage)
- Profile components (Avatar, SettingsSection)
- Chat components (ChatBubble, ChatInput, ChatHeader)
- Auth screens (SignIn, SignUp)
- Profile screen
- Chat screen

### Existing Tests (Keep)
✅ **Already Have Tests** (8 tests):
- Unit: ExplanationFormatterService, InjuryDetectionService, InjuryLoggingService, RecoveryCheckInService, VoiceAPIClient
- Component: ActiveInjuryBanner, InjuryDetectionModal, RecoveryCheckInModal

---

## 📁 Test Directory Structure

```
apps/mobile/__tests__/
├── unit/                           # Unit tests (70%)
│   ├── components/                 # Component tests
│   │   ├── ui/                     # Core UI components
│   │   │   ├── Button.test.tsx
│   │   │   ├── Input.test.tsx
│   │   │   ├── Card.test.tsx
│   │   │   └── PillBadge.test.tsx
│   │   ├── auth/                   # Auth components
│   │   │   ├── SSOButton.test.tsx
│   │   │   ├── AuthContainer.test.tsx
│   │   │   └── ErrorMessage.test.tsx
│   │   ├── profile/                # Profile components
│   │   │   ├── Avatar.test.tsx
│   │   │   └── SettingsSection.test.tsx
│   │   ├── chat/                   # Chat components
│   │   │   ├── ChatBubble.test.tsx
│   │   │   ├── ChatInput.test.tsx
│   │   │   └── ChatHeader.test.tsx
│   │   └── dashboard/              # Dashboard components (NEW)
│   │       ├── MetricCard.test.tsx
│   │       ├── TimelineItem.test.tsx
│   │       └── StatsOverview.test.tsx
│   ├── stores/                     # State management tests
│   │   ├── auth.store.test.ts
│   │   ├── workout.store.test.ts
│   │   └── run.store.test.ts
│   ├── services/                   # Service tests (some exist)
│   │   ├── api/
│   │   │   ├── client.test.ts      # NEW - API client
│   │   │   └── VoiceAPIClient.test.ts (EXISTS)
│   │   ├── OnboardingService.test.ts
│   │   ├── ChartDataService.test.ts
│   │   └── SyncService.test.ts
│   ├── hooks/                      # Hook tests
│   │   ├── useAuth.test.ts
│   │   └── useOnboarding.test.ts
│   └── utils/                      # Utility tests
│       └── formatters.test.ts
│
├── integration/                    # Integration tests (25%)
│   ├── api/                        # API integration (Railway)
│   │   ├── auth-api.test.ts        # Auth with real Supabase
│   │   ├── chat-api.test.ts        # Chat with real Railway
│   │   └── health-check.test.ts    # Railway health check
│   ├── navigation/                 # Navigation flows
│   │   ├── auth-flow.test.tsx      # SignIn → SignUp → Home
│   │   ├── tab-navigation.test.tsx # Home ↔ Run ↔ Chat
│   │   └── modal-navigation.test.tsx # Profile modal
│   └── data/                       # Data flow
│       ├── watermelon-sync.test.ts # WatermelonDB sync
│       └── auth-persistence.test.ts # Auth state persistence
│
├── e2e/                            # E2E tests (LATER - Maestro)
│   └── README.md                   # "Use Maestro - See TESTING_E2E.md"
│
└── setup/                          # Test configuration
    ├── jest.setup.js               # Global setup
    ├── test-utils.tsx              # Testing utilities
    └── mocks/                      # Mock implementations
        ├── supabase.mock.ts
        ├── asyncstorage.mock.ts
        └── navigation.mock.ts
```

---

## 🧪 Phase 1: Unit Tests (Week 1-2)

**Goal**: 70% code coverage with fast, isolated tests  
**Estimated Time**: 8-10 days

### 1.1 Core UI Components (Day 1-2)

**Priority**: HIGH  
**Files**: 4 components (Button, Input, Card, PillBadge)

**Test Template: Button.test.tsx**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Click</Button>);
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders all variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'];
    variants.forEach(variant => {
      const { getByText } = render(
        <Button variant={variant as any}>Test</Button>
      );
      expect(getByText('Test')).toBeTruthy();
    });
  });

  it('renders all sizes', () => {
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      const { getByText } = render(
        <Button size={size as any}>Test</Button>
      );
      expect(getByText('Test')).toBeTruthy();
    });
  });

  it('shows loading state', () => {
    const { getByTestId } = render(<Button loading>Loading</Button>);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button disabled onPress={onPress}>Disabled</Button>
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

**Similar Tests For**:
- Input.test.tsx (password toggle, validation, error states)
- Card.test.tsx (variants, press states, padding)
- PillBadge.test.tsx (variants, sizes)

**Success Criteria**:
- ✅ All components render without crashing
- ✅ Props are applied correctly
- ✅ User interactions work
- ✅ Conditional rendering tested
- ✅ Accessibility props present

---

### 1.2 Dashboard Components (Day 2-3)

**Priority**: HIGH (New components from Session 5)  
**Files**: 3 components (MetricCard, TimelineItem, StatsOverview)

**Test Template: MetricCard.test.tsx**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import MetricCard from '../MetricCard';
import { Dumbbell } from 'lucide-react-native';

describe('MetricCard', () => {
  it('renders with required props', () => {
    const { getByText } = render(
      <MetricCard title="Workouts" value="12" />
    );
    expect(getByText('Workouts')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { UNSAFE_getByType } = render(
      <MetricCard 
        title="Workouts" 
        value="12" 
        icon={Dumbbell}
      />
    );
    expect(UNSAFE_getByType(Dumbbell)).toBeTruthy();
  });

  it('renders trend indicator when provided', () => {
    const { getByText } = render(
      <MetricCard 
        title="Workouts" 
        value="12" 
        trend="up"
        trendValue="+2"
      />
    );
    expect(getByText('↑ +2')).toBeTruthy();
  });

  it('calls onPress when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MetricCard 
        title="Workouts" 
        value="12" 
        onPress={onPress}
      />
    );
    fireEvent.press(getByText('12'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders compact variant', () => {
    const { getByText } = render(
      <MetricCard 
        title="Workouts" 
        value="12" 
        variant="compact"
      />
    );
    // Verify styling differences (component should render smaller)
    expect(getByText('12')).toBeTruthy();
  });
});
```

**Similar Tests For**:
- TimelineItem.test.tsx (icon, vertical line, last item)
- StatsOverview.test.tsx (grid/row variants, scrolling)

---

### 1.3 Auth & Profile Components (Day 3-4)

**Priority**: HIGH  
**Files**: 5 components (SSOButton, AuthContainer, ErrorMessage, Avatar, SettingsSection)

**Quick wins** - these are simpler presentation components

---

### 1.4 Chat Components (Day 4)

**Priority**: MEDIUM  
**Files**: 3 components (ChatBubble, ChatInput, ChatHeader)

---

### 1.5 Zustand Stores (Day 5-6)

**Priority**: CRITICAL  
**Files**: 3 stores (auth.store, workout.store, run.store)

**Test Template: auth.store.test.ts**
```typescript
import { useAuthStore } from '../auth.store';
import { supabase } from '../../services/database/supabase.client';

// Mock Supabase
jest.mock('../../services/database/supabase.client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      signInWithIdToken: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
}));

describe('auth.store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      await useAuthStore.getState().signIn('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toMatchObject({ id: '123', email: 'test@example.com' });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle sign in error', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(
        useAuthStore.getState().signIn('test@example.com', 'wrong')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set loading state during sign in', async () => {
      let loadingDuringCall = false;

      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => {
        loadingDuringCall = useAuthStore.getState().isLoading;
        return Promise.resolve({
          data: { user: { id: '123' }, session: {} },
          error: null,
        });
      });

      await useAuthStore.getState().signIn('test@example.com', 'password');

      expect(loadingDuringCall).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      await useAuthStore.getState().signUp(
        'new@example.com',
        'password123',
        'Test User'
      );

      expect(useAuthStore.getState().user).toBeTruthy();
    });

    it('should include name in user metadata', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: '123' }, session: {} },
        error: null,
      });

      await useAuthStore.getState().signUp(
        'new@example.com',
        'password123',
        'Test User'
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { name: 'Test User' },
          }),
        })
      );
    });
  });

  describe('signOut', () => {
    it('should clear user state on sign out', async () => {
      // Set up initial authenticated state
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com' },
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await useAuthStore.getState().signOut();

      expect(useAuthStore.getState().user).toBe(null);
    });
  });

  describe('signInWithApple', () => {
    it('should handle Apple sign in', async () => {
      // Test Apple SSO flow
      // This will need AppleAuthentication mocked
    });
  });

  describe('signInWithGoogle', () => {
    it('should handle Google sign in', async () => {
      // Test Google SSO flow
    });
  });
});
```

**Similar Tests For**:
- workout.store.test.ts
- run.store.test.ts

---

### 1.6 Services (Day 7-8)

**Priority**: MEDIUM  
**Files**: API client + other services

**Test Template: client.test.ts**
```typescript
import { apiClient } from '../client';
import { supabase } from '../../database/supabase.client';

jest.mock('../../database/supabase.client');

global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getAuthToken', () => {
    it('should retrieve token from Supabase session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      // Call private method indirectly via public method
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message to chat endpoint', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'AI response' }),
      });

      const result = await apiClient.sendMessage('Hello');

      expect(result).toEqual({ response: 'AI response' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Hello' }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw on network error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should throw on 4xx error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });
  });
});
```

**Similar Tests For**:
- OnboardingService.test.ts
- ChartDataService.test.ts
- SyncService.test.ts

---

### 1.7 Hooks (Day 9)

**Priority**: LOW  
**Files**: useAuth, useOnboarding

**Test with**: `@testing-library/react-hooks`

---

### 1.8 Navigation (Day 10)

**Priority**: MEDIUM  
**Files**: RootNavigator, AuthNavigator

---

## 🔗 Phase 2: Integration Tests (Week 3)

**Goal**: Test real API interactions and data flow  
**Estimated Time**: 5-7 days

### 2.1 Railway API Integration (Day 1-2)

**Priority**: CRITICAL  
**Files**: auth-api.test.ts, chat-api.test.ts, health-check.test.ts

**Test Template: chat-api.test.ts**
```typescript
import { apiClient } from '../../../services/api/client';

describe('Chat API Integration (LIVE)', () => {
  // Use real Railway backend
  const RAILWAY_URL = process.env.EXPO_PUBLIC_API_URL;

  beforeAll(() => {
    if (!RAILWAY_URL) {
      throw new Error('EXPO_PUBLIC_API_URL not set');
    }
  });

  it('should send message and receive response', async () => {
    // This hits the REAL Railway API
    const response = await apiClient.sendMessage('Hello');

    expect(response).toBeDefined();
    expect(response.response).toBeTruthy();
    expect(typeof response.response).toBe('string');
  }, 15000); // 15 second timeout

  it('should include auth token in request', async () => {
    // Verify auth token is sent
    // This requires inspecting network request
  });

  it('should handle network timeout', async () => {
    // Test with very short timeout
  });

  it('should handle 500 error from backend', async () => {
    // Send message that triggers backend error
  });
});
```

**Success Criteria**:
- ✅ Real API calls succeed
- ✅ Auth tokens included
- ✅ Error handling works
- ✅ Timeouts handled

---

### 2.2 Navigation Flow Integration (Day 3-4)

**Priority**: HIGH  
**Files**: auth-flow.test.tsx, tab-navigation.test.tsx, modal-navigation.test.tsx

**Test Template: auth-flow.test.tsx**
```typescript
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../../store/auth.store';
import App from '../../../App';

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false, error: null });
  });

  it('should navigate from SignIn to Home after login', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    // Should show SignIn screen
    expect(getByText('Sign In')).toBeTruthy();

    // Fill in credentials
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Tap Sign In
    fireEvent.press(getByText('Sign In'));

    // Wait for navigation to Home
    await waitFor(() => {
      expect(getByText(/Good morning/i)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should show error on invalid credentials', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText(/Invalid credentials/i)).toBeTruthy();
    });
  });

  it('should navigate SignIn → SignUp → SignIn', async () => {
    const { getByText } = render(<App />);

    expect(getByText('Sign In')).toBeTruthy();

    // Tap "Sign Up" link
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(getByText('Create Account')).toBeTruthy();
    });

    // Go back
    // (Depends on navigation implementation)
  });
});
```

**Similar Tests For**:
- tab-navigation.test.tsx (Home ↔ Run ↔ Chat)
- modal-navigation.test.tsx (Profile modal open/close)

---

### 2.3 Data Persistence (Day 5)

**Priority**: MEDIUM  
**Files**: watermelon-sync.test.ts, auth-persistence.test.ts

**Test Template: auth-persistence.test.ts**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../store/auth.store';

describe('Auth Persistence Integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.setState({ user: null });
  });

  it('should persist auth state to AsyncStorage', async () => {
    // Sign in
    useAuthStore.setState({
      user: { id: '123', email: 'test@example.com' },
    });

    // Check AsyncStorage
    const stored = await AsyncStorage.getItem('auth-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.user.email).toBe('test@example.com');
  });

  it('should restore auth state from AsyncStorage', async () => {
    // Manually set AsyncStorage
    const authData = {
      state: {
        user: { id: '123', email: 'test@example.com' },
      },
    };
    await AsyncStorage.setItem('auth-storage', JSON.stringify(authData));

    // Clear memory state
    useAuthStore.setState({ user: null });

    // Trigger restore (simulating app restart)
    // This depends on how Zustand persist works
    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().user).toBeTruthy();
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
  });
});
```

---

### 2.4 WatermelonDB Integration (Day 6-7)

**Priority**: MEDIUM  
**Files**: watermelon-sync.test.ts

**Test**: Real database queries, sync operations

---

## ⚙️ Test Configuration

### jest.config.js
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/setup/jest.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
};
```

### __tests__/setup/jest.setup.js
```javascript
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Supabase (for unit tests)
jest.mock('../src/services/database/supabase.client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      signInWithIdToken: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

---

## 📊 Success Metrics

### Coverage Goals
- **Unit Tests**: 70-80% code coverage
- **Integration Tests**: 100% of API endpoints tested
- **Critical Paths**: 100% tested

### Quality Metrics
- **Test Pass Rate**: >95%
- **Test Speed**: Unit tests <5 min, Integration tests <10 min
- **False Positives**: <5%
- **Flaky Tests**: 0 (fix or remove)

---

## 🚀 Implementation Schedule

### Week 1: Unit Tests Foundation
- **Day 1-2**: Core UI components (Button, Input, Card, PillBadge)
- **Day 2-3**: Dashboard components (MetricCard, TimelineItem, StatsOverview)
- **Day 3-4**: Auth & Profile components
- **Day 4**: Chat components
- **Day 5-6**: Zustand stores (auth, workout, run)
- **Day 7-8**: Services (API client, OnboardingService, etc.)
- **Day 9**: Hooks
- **Day 10**: Navigation components

**Deliverable**: ~50-70 unit tests, 70% code coverage

### Week 2: Complete Unit Tests
- **Day 1-3**: Finish any remaining unit tests
- **Day 3-5**: Fix any failing tests
- **Day 5**: Review coverage reports, add missing tests

**Deliverable**: All unit tests complete and passing

### Week 3: Integration Tests
- **Day 1-2**: Railway API integration tests
- **Day 3-4**: Navigation flow integration tests
- **Day 5**: Data persistence tests
- **Day 6-7**: WatermelonDB integration tests

**Deliverable**: ~15-25 integration tests, critical paths covered

---

## 🔧 Running Tests

### Local Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm test __tests__/unit

# Run integration tests only
npm test __tests__/integration

# Run specific test file
npm test Button.test.tsx

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/tests.yml
name: VoiceFit Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

concurrency:
  group: tests-${{ github.ref }}
  cancel-in-progress: true

jobs:
  unit-and-integration:
    name: Unit & Integration Tests (apps/mobile)
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: apps/mobile

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: apps/mobile/package.json

      - name: Install dependencies
        run: npm ci

      - name: Create .env for test
        run: |
          cp .env.example .env
          # Optionally inject CI-safe test values via GitHub secrets
          # echo "EXPO_PUBLIC_SUPABASE_URL=${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}" >> .env
          # echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}" >> .env
          # echo "EXPO_PUBLIC_API_URL=${{ secrets.EXPO_PUBLIC_API_URL }}" >> .env

      - name: Run Unit Tests
        run: npm test -- --coverage --selectProjects default

      - name: Upload Coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: apps/mobile/coverage

      - name: Run Integration Tests
        # If integration tests call live Railway/Supabase, ensure CI secrets are set.
        env:
          EXPO_PUBLIC_API_URL: ${{ secrets.EXPO_PUBLIC_API_URL }}
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
        run: npm test __tests__/integration -- --runInBand
```

---

## ✅ Next Steps (After Merging This Plan)

1) Unit Tests
- Implement tests for:
  - ui: Button, Input, Card, PillBadge
  - dashboard: MetricCard, TimelineItem, StatsOverview
  - stores: auth.store, workout.store, run.store
  - services: api/client, ChartDataService, SyncService (where feasible)
  - hooks: useOnboarding, useAuth
- Target coverage: 70%+ lines and functions

2) Integration Tests
- API (live): chat-api.test, health-check.test, (auth-api if using test Supabase)
- Navigation: auth-flow.test, tab-navigation.test, modal-navigation.test
- Persistence: auth-persistence.test, watermelon-sync.test (scaffold and iterate)

3) CI Secrets (if calling live services)
- Add the following repository secrets:
  - EXPO_PUBLIC_API_URL
  - EXPO_PUBLIC_SUPABASE_URL
  - EXPO_PUBLIC_SUPABASE_ANON_KEY
- Keep secrets out of the repo; inject via CI only

4) Local Dev Workflow
- Run unit tests frequently:
  - npm test -- --watch
- Run integration tests before PRs:
  - npm test __tests__/integration -- --runInBand

5) Flakiness Management
- Any test failing intermittently → quarantine, fix root cause, or mark with a TODO and skip with justification
- Prefer deterministic test data and explicit waits where needed

6) Documentation
- Keep TESTING_IMPLEMENTATION_PLAN.md updated as tests are added
- Add a short CONTRIBUTING-TESTS.md describing:
  - How to run tests locally
  - How to write new tests (with examples)
  - Where to place unit vs integration tests

7) Deferred (Future Phase)
- E2E (Maestro) suite for critical flows
- Manual exploratory testing and visual QA