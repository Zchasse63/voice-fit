/**
 * Jest Setup File for VoiceFit (React Native + Expo)
 *
 * This file configures global mocks and test utilities for unit and integration tests:
 * - AsyncStorage mock
 * - React Navigation hooks mock (useNavigation/useRoute)
 * - Supabase client mock (via @supabase/supabase-js createClient)
 * - Global console suppression (warn/error)
 * - Common RN-specific silences/mocks
 */

// -----------------------------
// Global console: suppress noise
// -----------------------------
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// ------------------------------------
// Mock AsyncStorage (memory-backed)
// ------------------------------------
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// -------------------------------------------------
// Silence RN Animated warnings in test environment
// -------------------------------------------------
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// -------------------------------------------------
// Mock React Native Reanimated (stable test behavior)
// -------------------------------------------------
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// -------------------------------------------------
// Mock React Navigation hooks (unit-test friendly)
// - For integration tests that need real navigation,
//   you can override this mock within the specific test.
// -------------------------------------------------
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      key: "mock-route-key",
      name: "MockRoute",
      params: {},
    }),
  };
});

// -------------------------------------------------
// Mock Safe Area (avoid platform-specific layout issues)
// -------------------------------------------------
jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// -------------------------------------------------
// Supabase mock via @supabase/supabase-js
// - We mock createClient so our app's supabase client module receives this stub.
// - Tests can adjust methods via global.__SUPABASE_AUTH__ if needed.
// -------------------------------------------------
const SUPABASE_AUTH_MOCK = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest
    .fn()
    .mockResolvedValue({ data: { session: null }, error: null }),
  signInWithIdToken: jest.fn(),
  signInWithOAuth: jest.fn(),
};

Object.defineProperty(global, "__SUPABASE_AUTH__", {
  value: SUPABASE_AUTH_MOCK,
  writable: false,
  enumerable: false,
  configurable: true,
});

jest.mock("@supabase/supabase-js", () => {
  return {
    // createClient returns an object that mimics Supabase client shape used in the app
    createClient: jest.fn(() => ({
      auth: SUPABASE_AUTH_MOCK,
    })),
  };
});

// -------------------------------------------------
// Optional: mock fetch if tests rely on manual fetch usage
// (Uncomment if you need a default mock; otherwise tests can stub per-suite)
// -------------------------------------------------
// if (typeof global.fetch === 'undefined') {
//   global.fetch = jest.fn();
// }
