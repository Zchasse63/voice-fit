/**
 * Jest Configuration for VoiceFit (React Native + Expo)
 *
 * Goals:
 * - Support React Native component testing (Testing Library)
 * - Support integration tests (navigation, stores, API client)
 * - Keep E2E (Maestro) out of Jest scope
 *
 * Notes:
 * - Uses jest-expo preset to align with Expo SDK 53
 * - TypeScript is handled by Babel via Expo (no ts-jest)
 */

module.exports = {
  preset: "jest-expo",

  // Jest runs in a Node-like environment for RN; jest-expo configures the rest
  testEnvironment: "node",

  // Include both unit and integration tests; explicitly ignore e2e folder
  testMatch: [
    "**/__tests__/unit/**/*.test.ts?(x)",
    "**/__tests__/unit/**/*.test.js?(x)",
    "**/__tests__/integration/**/*.test.ts?(x)",
    "**/__tests__/integration/**/*.test.js?(x)",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/__tests__/e2e/", // Maestro handles E2E separately
  ],

  // Setup files: Testing Library matchers, RN gesture handler, and local jest setup
  setupFilesAfterEnv: [
    "@testing-library/jest-native/extend-expect",
    "<rootDir>/jest.setup.js",
  ],

  // Transform and resolver behavior for RN ecosystem
  transformIgnorePatterns: [
    // Allow transpiling of RN and community packages
    "node_modules/(?!(" +
      "react-native|" +
      "@react-native|" +
      "react-native-.*|" +
      "@react-navigation|" +
      "@react-native-community|" +
      "expo|" +
      "expo-.*|" +
      "@expo|" +
      "@expo/.*|" +
      "expo-modules-core|" +
      "@unimodules/.*|" +
      "unimodules|" +
      "native-base|" +
      "react-native-svg|" +
      "@nozbe/watermelondb|" +
      "lucide-react-native|" +
      "victory-native|" +
      "zustand" +
      ")/)",
  ],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Map module aliases if used (keep generic for src/*)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Style mocks (rarely needed with RN, but harmless)
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Mock JSON files that don't exist in test environment
    "^.*/injury_keywords\\.json$": "<rootDir>/__mocks__/injury_keywords.json",
  },

  // Coverage settings (focus on app source; ignore d.ts, test folders, barrel files)
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/index.{ts,tsx,js,jsx}",
    "!src/**/types.{ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },

  // Reasonable default timeout (integration tests may do network; keep moderate)
  testTimeout: 15000,

  // Be explicit and verbose in CI logs
  verbose: true,
};
