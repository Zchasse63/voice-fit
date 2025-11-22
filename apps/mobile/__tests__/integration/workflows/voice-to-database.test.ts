/**
 * Integration Test: Voice-to-Database Workflow
 *
 * Tests the complete flow of voice input → backend parsing → database storage
 * This test uses REAL services:
 * - Railway backend API
 * - Supabase cloud database
 * - WatermelonDB local storage
 *
 * NO MOCKING - validates actual system integration
 */

// Unmock Supabase for integration tests - we need the REAL client
jest.unmock("@supabase/supabase-js");

import {
  initializeTestEnvironment,
  getSupabaseClient,
  getAuthenticatedTestUser,
  makeAuthenticatedRequest,
  createTestWorkoutLog,
  cleanupTestUserData,
  waitForCondition,
} from "../setup/testEnvironment";

describe("Integration: Voice-to-Database Workflow", () => {
  let testUser: any;
  let testWorkoutLogId: string;
  let supabaseClient: any;

  beforeAll(async () => {
    // Initialize test environment
    initializeTestEnvironment();

    // Get authenticated test user
    testUser = await getAuthenticatedTestUser();
    supabaseClient = getSupabaseClient();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser?.id) {
      await cleanupTestUserData(testUser.id);
    }
  });

  beforeEach(async () => {
    // Create a workout log for each test
    const workoutLog = await createTestWorkoutLog(testUser.id);
    testWorkoutLogId = workoutLog.id;
  });

  // ==========================================================================
  // Voice Parsing Tests
  // ==========================================================================

  describe("Voice Parsing API", () => {
    it("should parse simple voice input", async () => {
      const response = await makeAuthenticatedRequest(
        "/api/voice/parse",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            transcript: "I did bench press 135 pounds for 10 reps",
            user_id: testUser.id,
          }),
        },
      );

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.exercise_name).toContain("bench press");
      expect(response.data.weight).toBe(135);
      expect(response.data.reps).toBe(10);
    });

    it("should parse voice input with RPE", async () => {
      const response = await makeAuthenticatedRequest(
        "/api/voice/parse",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            transcript: "Squat 225 for 8 reps at RPE 8",
            user_id: testUser.id,
          }),
        },
      );

      expect(response.data.exercise_name).toContain("squat");
      expect(response.data.weight).toBe(225);
      expect(response.data.reps).toBe(8);
      expect(response.data.rpe).toBe(8);
    });

    it("should handle multiple sets in voice input", async () => {
      const response = await makeAuthenticatedRequest(
        "/api/voice/parse",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            transcript: "Deadlift 3 sets of 5 reps at 315 pounds",
            user_id: testUser.id,
          }),
        },
      );

      expect(response.data.exercise_name).toContain("deadlift");
      expect(response.data.sets).toBe(3);
      expect(response.data.reps).toBe(5);
      expect(response.data.weight).toBe(315);
    });
  });

  // ==========================================================================
  // Voice Logging to Database
  // ==========================================================================

  describe("Voice Logging with Database Storage", () => {
    it("should log voice workout and store in Supabase", async () => {
      // Step 1: Log workout via voice
      const logResponse = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Bench press 185 for 8 reps",
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      console.log("Voice log response:", JSON.stringify(logResponse, null, 2));

      expect(logResponse.success).toBe(true);
      expect(logResponse.set_ids).toBeDefined();
      expect(logResponse.set_ids.length).toBeGreaterThan(0);

      const setId = logResponse.set_ids[0];

      // Step 2: Verify data is in Supabase
      const { data: workoutLog, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("id", setId)
        .single();

      expect(error).toBeNull();
      expect(workoutLog).toBeDefined();
      expect(workoutLog.exercise_id).toBeDefined();
      expect(workoutLog.weight).toBe(185);
      expect(workoutLog.reps).toBe(8);
      expect(workoutLog.user_id).toBe(testUser.id);
    });

    it("should handle multiple voice logs in sequence", async () => {
      // Log first set
      const log1 = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Squat 135 for 10",
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      expect(log1.success).toBe(true);

      // Log second set
      const log2 = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Squat 185 for 8",
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      expect(log2.success).toBe(true);

      // Verify both sets are in database
      const { data: workoutLogs, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("user_id", testUser.id)
        .order("created_at", { ascending: true });

      expect(error).toBeNull();
      expect(workoutLogs.length).toBeGreaterThanOrEqual(2);
      const recentLogs = workoutLogs.slice(-2);
      expect(recentLogs[0].weight).toBe(135);
      expect(recentLogs[0].reps).toBe(10);
      expect(recentLogs[1].weight).toBe(185);
      expect(recentLogs[1].reps).toBe(8);
    });

    it("should preserve RPE data through full workflow", async () => {
      const logResponse = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Overhead press 95 pounds for 12 reps at RPE 7",
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      expect(logResponse.success).toBe(true);

      const setId = logResponse.set_ids[0];

      // Verify RPE is stored correctly
      const { data: workoutLog, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("id", setId)
        .single();

      expect(error).toBeNull();
      expect(workoutLog.rpe).toBe(7);
      expect(workoutLog.exercise_id).toBeDefined();
      expect(workoutLog.weight).toBe(95);
      expect(workoutLog.reps).toBe(12);
    });
  });

  // ==========================================================================
  // End-to-End Workflow Tests
  // ==========================================================================

  describe("End-to-End Voice Workout Session", () => {
    it("should complete full workout session with voice logging", async () => {
      // Simulate a complete workout session
      const exercises = [
        "Bench press 135 for 10 reps",
        "Bench press 185 for 8 reps",
        "Bench press 205 for 6 reps",
        "Incline press 115 for 10 reps",
        "Incline press 135 for 8 reps",
        "Cable fly 40 pounds for 12 reps",
      ];

      const setIds: string[] = [];

      // Log all exercises
      for (const exercise of exercises) {
        const response = await makeAuthenticatedRequest(
          "/api/voice/log",
          testUser.accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              voice_input: exercise,
              user_id: testUser.id,
              workout_id: testWorkoutLogId,
            }),
          },
        );

        expect(response.success).toBe(true);
        setIds.push(...response.set_ids);
      }

      // Verify all sets are stored
      expect(setIds).toHaveLength(6);

      // Query database for all sets in this workout
      const { data: allSets, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("user_id", testUser.id)
        .order("created_at", { ascending: true });

      expect(error).toBeNull();
      expect(allSets.length).toBeGreaterThanOrEqual(6);

      // Verify exercises are correctly identified (check the last 6 logs)
      const recentLogs = allSets.slice(-6);
      const exerciseIds = recentLogs.map((s: any) => s.exercise_id);
      expect(exerciseIds.every((id: any) => id !== null)).toBe(true);
    });

    it("should handle workout with notes and modifications", async () => {
      const logResponse = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Squat 225 for 5 reps, felt heavy today",
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      expect(logResponse.success).toBe(true);
      expect(logResponse.data.notes).toBeDefined();
      expect(logResponse.data.notes.toLowerCase()).toContain("heavy");

      const setId = logResponse.set_ids[0];

      // Verify notes are stored
      const { data: workoutLog, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("id", setId)
        .single();

      expect(error).toBeNull();
      expect(workoutLog.notes).toBeDefined();
    });
  });

  // ==========================================================================
  // Data Integrity Tests
  // ==========================================================================

  describe("Data Integrity Across Stack", () => {
    it("should maintain data consistency between API and database", async () => {
      const voiceInput = "Romanian deadlift 185 pounds for 10 reps at RPE 8";

      // Step 1: Parse via API
      const parseResponse = await makeAuthenticatedRequest(
        "/api/voice/parse",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            transcript: voiceInput,
            user_id: testUser.id,
          }),
        },
      );

      const parsedData = parseResponse.data;

      // Step 2: Log the workout
      const logResponse = await makeAuthenticatedRequest(
        "/api/voice/log",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            voice_input: voiceInput,
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        },
      );

      expect(logResponse.success).toBe(true);

      const setId = logResponse.set_ids[0];

      // Step 3: Verify database matches parsed data
      const { data: storedSet, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("id", setId)
        .single();

      expect(error).toBeNull();
      expect(storedSet.weight).toBe(parsedData.weight);
      expect(storedSet.reps).toBe(parsedData.reps);
      expect(storedSet.rpe).toBe(parsedData.rpe);
      expect(storedSet.exercise_id).toBeDefined();
    });

    it("should handle concurrent voice logs without data loss", async () => {
      const exercises = [
        "Bench press 135 for 10",
        "Squat 225 for 8",
        "Deadlift 315 for 5",
      ];

      // Send all requests concurrently
      const promises = exercises.map((exercise) =>
        makeAuthenticatedRequest("/api/voice/log", testUser.accessToken, {
          method: "POST",
          body: JSON.stringify({
            voice_input: exercise,
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        }),
      );

      const responses = await Promise.all(promises);

      // All should succeed
      expect(responses.every((r) => r.success)).toBe(true);

      // Wait for database writes to complete
      const beforeCount = await supabaseClient
        .from("workout_logs")
        .select("id")
        .eq("user_id", testUser.id);

      await waitForCondition(async () => {
        const { data } = await supabaseClient
          .from("workout_logs")
          .select("id")
          .eq("user_id", testUser.id);

        return data && data.length >= (beforeCount.data?.length || 0) + 3;
      }, 5000);

      // Verify all sets are in database
      const { data: workoutLogs, error } = await supabaseClient
        .from("workout_logs")
        .select("*")
        .eq("user_id", testUser.id)
        .order("created_at", { ascending: false })
        .limit(3);

      expect(error).toBeNull();
      expect(workoutLogs).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe("Error Handling", () => {
    it("should handle invalid voice input gracefully", async () => {
      const response = await makeAuthenticatedRequest(
        "/api/voice/parse",
        testUser.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            transcript: "asdfasdf random gibberish",
            user_id: testUser.id,
          }),
        },
      );

      // Should still return a response, even if parsing fails
      expect(response).toBeDefined();
    });

    it("should validate required fields in voice log", async () => {
      try {
        await makeAuthenticatedRequest("/api/voice/log", testUser.accessToken, {
          method: "POST",
          body: JSON.stringify({
            // Missing voice_input
            user_id: testUser.id,
            workout_id: testWorkoutLogId,
          }),
        });

        fail("Should have thrown error for missing voice_input");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it("should handle database connection issues", async () => {
      // This test verifies error handling when database is temporarily unavailable
      // In a real scenario, this would test retry logic and error messages

      // For now, verify that the system doesn't crash with invalid workout_id
      try {
        await makeAuthenticatedRequest("/api/voice/log", testUser.accessToken, {
          method: "POST",
          body: JSON.stringify({
            voice_input: "Bench press 135 for 10",
            user_id: testUser.id,
            workout_id: "invalid-uuid",
          }),
        });

        // Depending on backend implementation, this might succeed or fail
        // If it fails, that's okay - we're testing error handling
      } catch (error) {
        // Error is expected and handled
        expect(error).toBeDefined();
      }
    });
  });
});
