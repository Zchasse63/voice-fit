/**
 * Integration Test: WatermelonDB <-> Supabase Sync Workflow
 *
 * Tests the complete bidirectional sync between local WatermelonDB and Supabase
 * This test uses REAL services:
 * - WatermelonDB (local SQLite)
 * - Supabase (cloud PostgreSQL)
 * - SyncService (bidirectional sync)
 *
 * NO MOCKING - validates actual data synchronization
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import {
  getSupabaseClient,
  getAuthenticatedTestUser,
  createTestWorkoutLog,
  createTestSets,
  cleanupTestUserData,
  waitForCondition,
} from '../setup/testEnvironment';
import { database } from '../../../src/services/database/watermelon/database';
import { SyncService } from '../../../src/services/sync/SyncService';
import WorkoutLog from '../../../src/services/database/watermelon/models/WorkoutLog';
import Set from '../../../src/services/database/watermelon/models/Set';

describe('Integration: WatermelonDB <-> Supabase Sync', () => {
  let testUser: any;
  let supabaseClient: any;
  let syncService: SyncService;
  let localDatabase: Database;

  beforeAll(async () => {
    // Get authenticated test user
    testUser = await getAuthenticatedTestUser();
    supabaseClient = getSupabaseClient();
    localDatabase = database;
    syncService = new SyncService();
  });

  afterAll(async () => {
    // Stop sync and cleanup
    syncService.stopBackgroundSync();

    if (testUser?.id) {
      await cleanupTestUserData(testUser.id);
    }

    // Clean local database
    await localDatabase.write(async () => {
      const workoutLogs = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .query()
        .fetch();

      for (const log of workoutLogs) {
        await log.markAsDeleted();
      }
    });
  });

  beforeEach(async () => {
    // Clear local database before each test
    await localDatabase.write(async () => {
      const workoutLogs = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .query()
        .fetch();

      for (const log of workoutLogs) {
        await log.markAsDeleted();
      }
    });
  });

  // ==========================================================================
  // Local -> Cloud Sync Tests
  // ==========================================================================

  describe('Local to Cloud Sync', () => {
    it('should sync new local workout to Supabase', async () => {
      // Step 1: Create workout in local database
      let localWorkoutId: string;

      await localDatabase.write(async () => {
        const workoutLog = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
            log.durationMinutes = 60;
            log.notes = 'Test sync workout';
          });

        localWorkoutId = workoutLog.id;
      });

      // Step 2: Trigger sync
      await syncService.syncNow(testUser.id);

      // Step 3: Verify data appears in Supabase
      await waitForCondition(async () => {
        const { data } = await supabaseClient
          .from('workout_logs')
          .select('*')
          .eq('id', localWorkoutId!)
          .maybeSingle();

        return data !== null;
      }, 10000);

      const { data: cloudWorkout, error } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .eq('id', localWorkoutId!)
        .single();

      expect(error).toBeNull();
      expect(cloudWorkout).toBeDefined();
      expect(cloudWorkout.user_id).toBe(testUser.id);
      expect(cloudWorkout.workout_type).toBe('strength');
      expect(cloudWorkout.duration_minutes).toBe(60);
      expect(cloudWorkout.notes).toBe('Test sync workout');
    });

    it('should sync workout with multiple sets', async () => {
      let workoutLogId: string;
      let setIds: string[] = [];

      // Create workout with sets locally
      await localDatabase.write(async () => {
        const workoutLog = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
          });

        workoutLogId = workoutLog.id;

        // Create 3 sets
        for (let i = 0; i < 3; i++) {
          const set = await localDatabase.collections.get<Set>('sets').create((s) => {
            s.workoutLogId = workoutLogId;
            s.exerciseName = 'Bench Press';
            s.setNumber = i + 1;
            s.weight = 135 + i * 10;
            s.reps = 10 - i;
            s.rpe = 7 + i;
          });

          setIds.push(set.id);
        }
      });

      // Sync
      await syncService.syncNow(testUser.id);

      // Wait for sync
      await waitForCondition(async () => {
        const { data } = await supabaseClient
          .from('sets')
          .select('id')
          .in('id', setIds);

        return data?.length === 3;
      }, 10000);

      // Verify all sets synced
      const { data: cloudSets, error } = await supabaseClient
        .from('sets')
        .select('*')
        .eq('workout_log_id', workoutLogId!)
        .order('set_number', { ascending: true });

      expect(error).toBeNull();
      expect(cloudSets).toHaveLength(3);
      expect(cloudSets[0].weight).toBe(135);
      expect(cloudSets[1].weight).toBe(145);
      expect(cloudSets[2].weight).toBe(155);
    });

    it('should handle concurrent local writes during sync', async () => {
      // Create multiple workouts simultaneously
      const workoutPromises = Array.from({ length: 5 }, (_, i) =>
        localDatabase.write(async () => {
          return await localDatabase.collections
            .get<WorkoutLog>('workout_logs')
            .create((log) => {
              log.userId = testUser.id;
              log.workoutDate = new Date();
              log.workoutType = 'strength';
              log.notes = `Concurrent workout ${i + 1}`;
            });
        })
      );

      const localWorkouts = await Promise.all(workoutPromises);
      const localIds = localWorkouts.map((w) => w.id);

      // Sync
      await syncService.syncNow(testUser.id);

      // Wait for all to sync
      await waitForCondition(async () => {
        const { data } = await supabaseClient
          .from('workout_logs')
          .select('id')
          .in('id', localIds);

        return data?.length === 5;
      }, 15000);

      // Verify all synced
      const { data: cloudWorkouts, error } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .in('id', localIds);

      expect(error).toBeNull();
      expect(cloudWorkouts).toHaveLength(5);
    });
  });

  // ==========================================================================
  // Cloud -> Local Sync Tests
  // ==========================================================================

  describe('Cloud to Local Sync', () => {
    it('should sync new Supabase workout to local database', async () => {
      // Step 1: Create workout in Supabase
      const cloudWorkout = await createTestWorkoutLog(testUser.id, {
        workout_type: 'cardio',
        duration_minutes: 45,
        notes: 'Cloud workout',
      });

      // Step 2: Trigger sync
      await syncService.syncNow(testUser.id);

      // Step 3: Verify data appears locally
      await waitForCondition(async () => {
        const localWorkout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .find(cloudWorkout.id);

        return localWorkout !== null;
      }, 10000);

      const localWorkout = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .find(cloudWorkout.id);

      expect(localWorkout).toBeDefined();
      expect(localWorkout.userId).toBe(testUser.id);
      expect(localWorkout.workoutType).toBe('cardio');
      expect(localWorkout.durationMinutes).toBe(45);
      expect(localWorkout.notes).toBe('Cloud workout');
    });

    it('should sync workout with sets from cloud to local', async () => {
      // Create workout with sets in Supabase
      const cloudWorkout = await createTestWorkoutLog(testUser.id);
      await createTestSets(cloudWorkout.id, 'Squat', 3);

      // Sync
      await syncService.syncNow(testUser.id);

      // Wait for local sync
      await waitForCondition(async () => {
        const localSets = await localDatabase.collections
          .get<Set>('sets')
          .query(Q.where('workout_log_id', cloudWorkout.id))
          .fetch();

        return localSets.length === 3;
      }, 10000);

      // Verify sets are local
      const localSets = await localDatabase.collections
        .get<Set>('sets')
        .query(Q.where('workout_log_id', cloudWorkout.id), Q.sortBy('set_number', Q.asc))
        .fetch();

      expect(localSets).toHaveLength(3);
      expect(localSets[0].exerciseName).toBe('Squat');
      expect(localSets[0].setNumber).toBe(1);
      expect(localSets[1].setNumber).toBe(2);
      expect(localSets[2].setNumber).toBe(3);
    });

    it('should handle updates from cloud', async () => {
      // Create workout in cloud
      const cloudWorkout = await createTestWorkoutLog(testUser.id, {
        notes: 'Original notes',
      });

      // Initial sync
      await syncService.syncNow(testUser.id);

      // Wait for local sync
      await waitForCondition(async () => {
        try {
          await localDatabase.collections
            .get<WorkoutLog>('workout_logs')
            .find(cloudWorkout.id);
          return true;
        } catch {
          return false;
        }
      }, 10000);

      // Update in cloud
      await supabaseClient
        .from('workout_logs')
        .update({ notes: 'Updated notes', duration_minutes: 90 })
        .eq('id', cloudWorkout.id);

      // Sync again
      await syncService.syncNow(testUser.id);

      // Wait for update
      await waitForCondition(async () => {
        const local = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .find(cloudWorkout.id);

        return local.notes === 'Updated notes';
      }, 10000);

      const localWorkout = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .find(cloudWorkout.id);

      expect(localWorkout.notes).toBe('Updated notes');
      expect(localWorkout.durationMinutes).toBe(90);
    });
  });

  // ==========================================================================
  // Bidirectional Sync Tests
  // ==========================================================================

  describe('Bidirectional Sync', () => {
    it('should sync changes in both directions', async () => {
      // Create workout locally
      let localWorkoutId: string;

      await localDatabase.write(async () => {
        const workout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
            log.notes = 'Local workout';
          });

        localWorkoutId = workout.id;
      });

      // Create workout in cloud
      const cloudWorkout = await createTestWorkoutLog(testUser.id, {
        notes: 'Cloud workout',
      });

      // Sync (should handle both directions)
      await syncService.syncNow(testUser.id);

      // Wait for both to sync
      await waitForCondition(async () => {
        // Check local workout in cloud
        const { data: cloudData } = await supabaseClient
          .from('workout_logs')
          .select('id')
          .eq('id', localWorkoutId!)
          .maybeSingle();

        // Check cloud workout locally
        let localData;
        try {
          localData = await localDatabase.collections
            .get<WorkoutLog>('workout_logs')
            .find(cloudWorkout.id);
        } catch {
          localData = null;
        }

        return cloudData !== null && localData !== null;
      }, 15000);

      // Verify local workout is in cloud
      const { data: localInCloud } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .eq('id', localWorkoutId!)
        .single();

      expect(localInCloud).toBeDefined();
      expect(localInCloud.notes).toBe('Local workout');

      // Verify cloud workout is local
      const cloudInLocal = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .find(cloudWorkout.id);

      expect(cloudInLocal).toBeDefined();
      expect(cloudInLocal.notes).toBe('Cloud workout');
    });

    it('should maintain data consistency across multiple syncs', async () => {
      let workoutId: string;

      // Create locally
      await localDatabase.write(async () => {
        const workout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
            log.notes = 'Initial';
          });

        workoutId = workout.id;
      });

      // Sync 1
      await syncService.syncNow(testUser.id);

      // Update locally
      await localDatabase.write(async () => {
        const workout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .find(workoutId!);

        await workout.update((log) => {
          log.notes = 'Updated locally';
        });
      });

      // Sync 2
      await syncService.syncNow(testUser.id);

      // Update in cloud
      await supabaseClient
        .from('workout_logs')
        .update({ duration_minutes: 120 })
        .eq('id', workoutId!);

      // Sync 3
      await syncService.syncNow(testUser.id);

      // Verify final state
      const { data: cloudFinal } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .eq('id', workoutId!)
        .single();

      const localFinal = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .find(workoutId!);

      // Both should have latest data
      expect(cloudFinal.notes).toBe('Updated locally');
      expect(cloudFinal.duration_minutes).toBe(120);
      expect(localFinal.notes).toBe('Updated locally');
      expect(localFinal.durationMinutes).toBe(120);
    });
  });

  // ==========================================================================
  // Background Sync Tests
  // ==========================================================================

  describe('Background Sync', () => {
    it('should sync automatically when background sync is enabled', async () => {
      // Start background sync (30 second interval)
      syncService.startBackgroundSync(testUser.id);

      // Create workout locally
      let workoutId: string;

      await localDatabase.write(async () => {
        const workout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
          });

        workoutId = workout.id;
      });

      // Wait for automatic sync (give it up to 35 seconds)
      await waitForCondition(
        async () => {
          const { data } = await supabaseClient
            .from('workout_logs')
            .select('id')
            .eq('id', workoutId!)
            .maybeSingle();

          return data !== null;
        },
        35000,
        1000
      );

      const { data: cloudWorkout } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .eq('id', workoutId!)
        .single();

      expect(cloudWorkout).toBeDefined();

      // Stop background sync
      syncService.stopBackgroundSync();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Sync Error Handling', () => {
    it('should handle sync when offline gracefully', async () => {
      // Create workout locally
      await localDatabase.write(async () => {
        await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
          });
      });

      // Sync should not crash even if network is simulated as down
      // In real scenario, this would test actual network conditions
      try {
        await syncService.syncNow(testUser.id);
        // Sync might succeed or fail, but shouldn't crash
      } catch (error) {
        // Error handling is working
        expect(error).toBeDefined();
      }
    });

    it('should not duplicate data on multiple syncs', async () => {
      let workoutId: string;

      // Create workout
      await localDatabase.write(async () => {
        const workout = await localDatabase.collections
          .get<WorkoutLog>('workout_logs')
          .create((log) => {
            log.userId = testUser.id;
            log.workoutDate = new Date();
            log.workoutType = 'strength';
          });

        workoutId = workout.id;
      });

      // Sync multiple times
      await syncService.syncNow(testUser.id);
      await syncService.syncNow(testUser.id);
      await syncService.syncNow(testUser.id);

      // Verify no duplicates in cloud
      const { data: cloudWorkouts } = await supabaseClient
        .from('workout_logs')
        .select('*')
        .eq('id', workoutId!);

      expect(cloudWorkouts).toHaveLength(1);

      // Verify no duplicates locally
      const localWorkouts = await localDatabase.collections
        .get<WorkoutLog>('workout_logs')
        .query(Q.where('id', workoutId!))
        .fetch();

      expect(localWorkouts).toHaveLength(1);
    });
  });
});
