/**
 * Integration Test Environment Setup
 *
 * Provides utilities for integration testing against REAL environments:
 * - Railway backend (live API)
 * - Supabase (cloud database)
 * - WatermelonDB (local database)
 *
 * NO MOCKING - Tests verify actual system integration
 */

import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../src/types/database.types";

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Required environment variables for integration tests
 */
export interface TestEnvironment {
  // Railway Backend
  backendUrl: string;

  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string; // For admin operations

  // Test User
  testUserId?: string;
  testUserEmail?: string;
  testUserPassword?: string;
}

/**
 * Load and validate test environment variables
 */
export function loadTestEnvironment(): TestEnvironment {
  const env: TestEnvironment = {
    backendUrl:
      process.env.EXPO_PUBLIC_VOICE_API_URL || process.env.VOICE_API_URL || "",
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    testUserId: process.env.TEST_USER_ID,
    testUserEmail: process.env.TEST_USER_EMAIL,
    testUserPassword: process.env.TEST_USER_PASSWORD,
  };

  // Validate required variables
  const missing: string[] = [];

  if (!env.backendUrl)
    missing.push("EXPO_PUBLIC_VOICE_API_URL or VOICE_API_URL");
  if (!env.supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!env.supabaseAnonKey) missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for integration tests:\n` +
        `${missing.map((v) => `  - ${v}`).join("\n")}\n\n` +
        `Please ensure these are set in your .env file.`,
    );
  }

  return env;
}

// ============================================================================
// Test Clients
// ============================================================================

let testEnv: TestEnvironment;
let supabaseClient: ReturnType<typeof createClient<Database>>;
let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null =
  null;

/**
 * Initialize test environment and clients
 */
export function initializeTestEnvironment() {
  testEnv = loadTestEnvironment();

  // Create Supabase client
  supabaseClient = createClient<Database>(
    testEnv.supabaseUrl,
    testEnv.supabaseAnonKey,
  );

  // Create admin client if service key available
  if (testEnv.supabaseServiceKey) {
    supabaseAdminClient = createClient<Database>(
      testEnv.supabaseUrl,
      testEnv.supabaseServiceKey,
    );
  }

  return { testEnv, supabaseClient, supabaseAdminClient };
}

/**
 * Get test environment
 */
export function getTestEnvironment() {
  if (!testEnv) {
    throw new Error(
      "Test environment not initialized. Call initializeTestEnvironment() first.",
    );
  }
  return testEnv;
}

/**
 * Get Supabase client for tests
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client not initialized. Call initializeTestEnvironment() first.",
    );
  }
  return supabaseClient;
}

/**
 * Get Supabase admin client (requires service key)
 */
export function getSupabaseAdminClient() {
  if (!supabaseAdminClient) {
    throw new Error(
      "Supabase admin client not available. Set SUPABASE_SERVICE_KEY in .env",
    );
  }
  return supabaseAdminClient;
}

// ============================================================================
// Test User Management
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  password: string;
  accessToken: string;
}

/**
 * Create a test user for integration testing
 * Returns user credentials and access token
 */
export async function createTestUser(
  email?: string,
  password?: string,
): Promise<TestUser> {
  const testEmail = email || `test-${Date.now()}@voicefit.com`;
  const testPassword = password || `Test123!${Date.now()}`;

  const { data, error } = await supabaseClient.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (error || !data.user || !data.session) {
    console.error("❌ Test user creation failed:");
    console.error("  Email:", testEmail);
    console.error("  Error:", error);
    console.error("  Data:", data);

    const errorMessage = error?.message || "Unknown error";
    const errorDetails = error
      ? JSON.stringify(error, null, 2)
      : "No error object";

    throw new Error(
      `Failed to create test user (${testEmail}): ${errorMessage}\n` +
        `Details: ${errorDetails}\n` +
        `Hint: Check if email confirmation is disabled in Supabase Auth settings`,
    );
  }

  return {
    id: data.user.id,
    email: testEmail,
    password: testPassword,
    accessToken: data.session.access_token,
  };
}

/**
 * Get or create the default test user
 */
export async function getTestUser(): Promise<TestUser> {
  const env = getTestEnvironment();

  // If test user credentials provided, sign in
  if (env.testUserEmail && env.testUserPassword) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: env.testUserEmail,
      password: env.testUserPassword,
    });

    if (error || !data.user || !data.session) {
      throw new Error(
        `Failed to sign in test user: ${error?.message || "Unknown error"}`,
      );
    }

    return {
      id: data.user.id,
      email: env.testUserEmail,
      password: env.testUserPassword,
      accessToken: data.session.access_token,
    };
  }

  // Otherwise create a new test user
  return createTestUser();
}

/**
 * Sign in as test user
 */
export async function signInTestUser(
  email: string,
  password: string,
): Promise<TestUser> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    throw new Error(`Failed to sign in: ${error?.message || "Unknown error"}`);
  }

  return {
    id: data.user.id,
    email,
    password,
    accessToken: data.session.access_token,
  };
}

/**
 * Sign out current user
 */
export async function signOutTestUser(): Promise<void> {
  await supabaseClient.auth.signOut();
}

// Track test users for cleanup
let testUserCleanupIds: string[] = [];

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

/**
 * Get list of test users to cleanup
 */
export function getTestUserCleanupIds(): string[] {
  return testUserCleanupIds;
}

/**
 * Clear test user cleanup list
 */
export function clearTestUserCleanupIds(): void {
  testUserCleanupIds = [];
}

// ============================================================================
// Database Cleanup Utilities
// ============================================================================

/**
 * Clean up test data for a specific user
 */
export async function cleanupTestUserData(userId: string): Promise<void> {
  const client = getSupabaseAdminClient();

  // Delete in order to respect foreign key constraints
  const tables = [
    "sets",
    "workout_logs",
    "scheduled_workouts",
    "program_weeks",
    "generated_programs",
    "injury_logs",
    "recovery_check_ins",
    "user_profiles",
  ];

  for (const table of tables) {
    const { error } = await client
      .from(table as any)
      .delete()
      .eq("user_id", userId);

    if (error && error.code !== "PGRST116") {
      // Ignore "not found" errors
      console.warn(
        `Failed to cleanup ${table} for user ${userId}:`,
        error.message,
      );
    }
  }
}

/**
 * Delete test user completely (requires admin client)
 */
export async function deleteTestUser(userId: string): Promise<void> {
  // Clean up data first
  await cleanupTestUserData(userId);

  // Delete user from auth (requires admin client)
  const client = getSupabaseAdminClient();
  const { error } = await client.auth.admin.deleteUser(userId);

  if (error) {
    console.warn(`Failed to delete test user ${userId}:`, error.message);
  }
}

// ============================================================================
// API Testing Helpers
// ============================================================================

/**
 * Make authenticated request to backend API
 */
export async function makeBackendRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const env = getTestEnvironment();
  const url = `${env.backendUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Backend request failed: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  return response.json();
}

/**
 * Make authenticated backend request with user token
 */
export async function makeAuthenticatedRequest<T = any>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  return makeBackendRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Wait for condition to be true (polling)
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 10000,
  interval: number = 500,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create a test workout log
 */
export async function createTestWorkoutLog(
  userId: string,
  data: Partial<any> = {},
): Promise<any> {
  const client = getSupabaseClient();

  const { data: workoutLog, error } = await client
    .from("workout_logs")
    .insert({
      user_id: userId,
      workout_date: new Date().toISOString(),
      workout_type: "strength",
      duration_minutes: 60,
      notes: "Test workout",
      ...data,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test workout log: ${error.message}`);
  }

  return workoutLog;
}

/**
 * Create test sets for a workout
 */
export async function createTestSets(
  workoutLogId: string,
  exerciseName: string,
  count: number = 3,
): Promise<any[]> {
  const client = getSupabaseClient();

  const sets = Array.from({ length: count }, (_, i) => ({
    workout_log_id: workoutLogId,
    exercise_name: exerciseName,
    set_number: i + 1,
    weight: 135 + i * 10,
    reps: 10 - i,
    rpe: 7 + i,
  }));

  const { data, error } = await client.from("sets").insert(sets).select();

  if (error) {
    throw new Error(`Failed to create test sets: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// Assertions & Validators
// ============================================================================

/**
 * Assert backend is healthy
 */
export async function assertBackendHealthy(): Promise<void> {
  const env = getTestEnvironment();

  try {
    const response = await fetch(`${env.backendUrl}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "healthy") {
      throw new Error(`Backend is not healthy: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    throw new Error(
      `Backend not reachable at ${env.backendUrl}/health: ${(error as Error).message}`,
    );
  }
}

/**
 * Assert Supabase is connected
 */
export async function assertSupabaseConnected(): Promise<void> {
  const client = getSupabaseClient();

  try {
    const { error } = await client
      .from("user_profiles")
      .select("count")
      .limit(1);

    if (error && error.code !== "PGRST116") {
      // Ignore empty table
      throw new Error(`Supabase query failed: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Supabase not connected: ${(error as Error).message}`);
  }
}

/**
 * Validate test environment is ready
 */
export async function validateTestEnvironment(): Promise<void> {
  await assertBackendHealthy();
  await assertSupabaseConnected();
}
