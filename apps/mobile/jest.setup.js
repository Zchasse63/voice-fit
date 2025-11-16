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
// Load .env file for integration tests
// -----------------------------
require("dotenv").config();

// -----------------------------
// Environment variables for tests
// -----------------------------
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "test-anon-key";
process.env.EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://test-api.example.com";

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
// Mock React Native Reanimated (stable test behavior)
// -------------------------------------------------
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

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
// - Uses mockResolvedValue for easy per-test overrides
// -------------------------------------------------
jest.mock("@supabase/supabase-js", () => {
  const mockSupabaseAuth = {
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        session: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: "test-user-id",
            email: "test@example.com",
          },
        },
      },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "new-user-id",
          email: "new@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        session: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: "new-user-id",
            email: "new@example.com",
          },
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithIdToken: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "oauth-user-id",
          email: "oauth@example.com",
        },
        session: {
          access_token: "oauth-access-token",
          refresh_token: "oauth-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
        },
      },
      error: null,
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: {
        provider: "google",
        url: "https://test-oauth-url.example.com",
      },
      error: null,
    }),
  };

  // Expose to global for test access
  if (typeof global !== "undefined") {
    global.__SUPABASE_AUTH__ = mockSupabaseAuth;
  }

  return {
    createClient: jest.fn(() => ({
      auth: mockSupabaseAuth,
    })),
  };
});

// -------------------------------------------------
// Polyfill for localStorage (needed for Zustand persist)
// -------------------------------------------------
if (typeof localStorage === "undefined") {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

// -------------------------------------------------
// Mock expo-apple-authentication (not installed yet)
// -------------------------------------------------
jest.mock(
  "expo-apple-authentication",
  () => ({
    isAvailableAsync: jest.fn(() => Promise.resolve(false)),
    signInAsync: jest.fn(),
    AppleAuthenticationScope: {
      FULL_NAME: 0,
      EMAIL: 1,
    },
  }),
  { virtual: true },
);

// -------------------------------------------------
// Mock expo-auth-session (not installed yet)
// -------------------------------------------------
jest.mock(
  "expo-auth-session",
  () => ({
    useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
    makeRedirectUri: jest.fn(() => "exp://localhost:8081"),
  }),
  { virtual: true },
);

// -------------------------------------------------
// Mock expo-web-browser (not installed yet)
// -------------------------------------------------
jest.mock(
  "expo-web-browser",
  () => ({
    openBrowserAsync: jest.fn(),
    maybeCompleteAuthSession: jest.fn(),
  }),
  { virtual: true },
);
