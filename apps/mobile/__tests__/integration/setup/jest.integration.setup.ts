/**
 * Jest Setup for Integration Tests
 *
 * Runs before integration tests to:
 * - Validate test environment (backend, Supabase)
 * - Initialize test clients
 * - Set up test user
 * - Configure global test utilities
 */

import {
  initializeTestEnvironment,
  validateTestEnvironment,
  getTestUser,
  signOutTestUser,
  cleanupTestUserData,
} from './testEnvironment';

// ============================================================================
// Global Setup
// ============================================================================

let testUserCleanupIds: string[] = [];

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('\n🚀 Integration Test Setup Starting...\n');

  // Initialize test environment
  try {
    initializeTestEnvironment();
    console.log('✅ Test environment initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }

  // Validate connections
  try {
    await validateTestEnvironment();
    console.log('✅ Backend and Supabase are healthy');
  } catch (error) {
    console.error('❌ Test environment validation failed:', error);
    console.error('\nPlease ensure:');
    console.error('  1. Railway backend is running');
    console.error('  2. Supabase project is active');
    console.error('  3. Environment variables are set in .env');
    throw error;
  }

  console.log('\n✅ Integration test environment ready\n');
}, 30000); // 30 second timeout for setup

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('\n🧹 Cleaning up integration tests...\n');

  // Sign out
  try {
    await signOutTestUser();
    console.log('✅ Signed out test user');
  } catch (error) {
    console.warn('⚠️  Failed to sign out:', (error as Error).message);
  }

  // Clean up test users created during tests
  if (testUserCleanupIds.length > 0) {
    console.log(`🗑️  Cleaning up ${testUserCleanupIds.length} test user(s)...`);

    for (const userId of testUserCleanupIds) {
      try {
        await cleanupTestUserData(userId);
        console.log(`✅ Cleaned up data for user ${userId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to cleanup user ${userId}:`, (error as Error).message);
      }
    }
  }

  console.log('\n✅ Integration test cleanup complete\n');
}, 30000); // 30 second timeout for teardown

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Register a test user ID for cleanup after tests
 */
export function registerTestUserForCleanup(userId: string): void {
  if (!testUserCleanupIds.includes(userId)) {
    testUserCleanupIds.push(userId);
  }
}

/**
 * Get authenticated test user for integration tests
 * Creates/reuses test user based on environment configuration
 */
export async function getAuthenticatedTestUser() {
  const user = await getTestUser();
  registerTestUserForCleanup(user.id);
  return user;
}

// ============================================================================
// Global Test Configuration
// ============================================================================

// Increase timeout for integration tests (network requests take time)
jest.setTimeout(30000); // 30 seconds

// Suppress console warnings in tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Suppress specific known warnings
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';

    // Filter out known noisy warnings
    if (
      message.includes('Warning: ReactDOM.render') ||
      message.includes('act() warning') ||
      message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }

    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';

    // Filter out known noisy errors
    if (
      message.includes('Warning: ReactDOM.render') ||
      message.includes('act() warning')
    ) {
      return;
    }

    originalError(...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.warn = originalWarn;
  console.error = originalError;
});

// ============================================================================
// Helper: Skip tests if environment not available
// ============================================================================

/**
 * Skip test if integration environment is not available
 * Useful for running tests locally without full environment setup
 */
export function describeIntegration(name: string, fn: () => void) {
  const envAvailable =
    process.env.EXPO_PUBLIC_VOICE_API_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!envAvailable) {
    describe.skip(`${name} (SKIPPED - Integration environment not available)`, fn);
  } else {
    describe(name, fn);
  }
}

/**
 * Skip individual test if integration environment not available
 */
export function itIntegration(name: string, fn: () => void | Promise<void>, timeout?: number) {
  const envAvailable =
    process.env.EXPO_PUBLIC_VOICE_API_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!envAvailable) {
    it.skip(`${name} (SKIPPED - Integration environment not available)`, fn, timeout);
  } else {
    it(name, fn, timeout);
  }
}
