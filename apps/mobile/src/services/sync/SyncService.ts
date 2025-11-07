/**
 * Sync Service
 * 
 * Handles bidirectional sync between WatermelonDB (local) and Supabase (cloud).
 * - Uploads unsynced local data to Supabase
 * - Downloads new data from Supabase to local database
 */

import { database } from '../database/watermelon/database';
import { supabase } from '../database/supabase.client';
import { Q } from '@nozbe/watermelondb';
import WorkoutLog from '../database/watermelon/models/WorkoutLog';
import Set from '../database/watermelon/models/Set';

export class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Start background sync
   */
  startBackgroundSync(userId: string): void {
    if (this.syncInterval) {
      console.log('[SyncService] Background sync already running');
      return;
    }

    console.log('[SyncService] Starting background sync (every 30s)');

    // Initial sync
    this.fullSync(userId).catch((error) => {
      console.error('[SyncService] Initial sync failed:', error);
    });

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.fullSync(userId).catch((error) => {
        console.error('[SyncService] Background sync failed:', error);
      });
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SyncService] Background sync stopped');
    }
  }

  /**
   * Manually trigger sync
   */
  async syncNow(userId: string): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return;
    }

    await this.fullSync(userId);
  }

  /**
   * Sync workout logs from local to Supabase
   */
  async syncWorkoutsToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing workouts to Supabase...');

      // Get unsynced workouts from WatermelonDB
      const unsyncedWorkouts = await database
        .get<WorkoutLog>('workout_logs')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedWorkouts.length} unsynced workouts`);

      for (const workout of unsyncedWorkouts) {
        // Upload to Supabase
        const { error } = await supabase.from('workout_logs').insert({
          id: workout.id,
          user_id: workout.userId,
          workout_name: workout.workoutName,
          start_time: workout.startTime.toISOString(),
          end_time: workout.endTime?.toISOString(),
          created_at: workout.createdAt.toISOString(),
          updated_at: workout.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing workout:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await workout.update((w) => {
            w.synced = true;
          });
        });

        console.log(`[SyncService] Synced workout ${workout.id}`);
      }

      console.log('[SyncService] Workout sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing workouts:', error);
      throw error;
    }
  }

  /**
   * Sync sets from local to Supabase
   */
  async syncSetsToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing sets to Supabase...');

      // Get unsynced sets from WatermelonDB
      const unsyncedSets = await database
        .get<Set>('sets')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedSets.length} unsynced sets`);

      for (const set of unsyncedSets) {
        // Upload to Supabase
        const { error } = await supabase.from('sets').insert({
          id: set.id,
          workout_log_id: set.workoutLogId,
          exercise_id: set.exerciseId,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          voice_command_id: set.voiceCommandId,
          created_at: set.createdAt.toISOString(),
          updated_at: set.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing set:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await set.update((s) => {
            s.synced = true;
          });
        });

        console.log(`[SyncService] Synced set ${set.id}`);
      }

      console.log('[SyncService] Set sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing sets:', error);
      throw error;
    }
  }

  /**
   * Download workouts from Supabase to local database
   */
  async downloadWorkoutsFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[SyncService] Downloading workouts from Supabase...');

      // Get latest workout from local database
      const latestWorkout = await database
        .get<WorkoutLog>('workout_logs')
        .query(Q.sortBy('updated_at', Q.desc), Q.take(1))
        .fetch();

      const lastUpdated = latestWorkout[0]?.updatedAt || new Date(0);

      // Fetch new workouts from Supabase
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading workouts:', error);
        return;
      }

      if (!workouts || workouts.length === 0) {
        console.log('[SyncService] No new workouts to download');
        return;
      }

      console.log(`[SyncService] Downloading ${workouts.length} workouts`);

      // Insert workouts into local database
      await database.write(async () => {
        for (const workout of workouts) {
          await database.get<WorkoutLog>('workout_logs').create((w) => {
            w._raw.id = workout.id;
            w.userId = workout.user_id;
            w.workoutName = workout.workout_name;
            w.startTime = new Date(workout.start_time);
            w.endTime = workout.end_time ? new Date(workout.end_time) : undefined;
            w.synced = true;
          });
        }
      });

      console.log('[SyncService] Workout download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading workouts:', error);
      throw error;
    }
  }

  /**
   * Full bidirectional sync
   */
  async fullSync(userId: string): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('[SyncService] Starting full sync...');

      // Upload local changes
      await this.syncWorkoutsToSupabase();
      await this.syncSetsToSupabase();

      // Download remote changes
      await this.downloadWorkoutsFromSupabase(userId);

      console.log('✅ [SyncService] Full sync complete');
    } catch (error) {
      console.error('❌ [SyncService] Error during full sync:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    unsyncedWorkouts: number;
    unsyncedSets: number;
  }> {
    const unsyncedWorkouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedSets = await database
      .get<Set>('sets')
      .query(Q.where('synced', false))
      .fetchCount();

    return {
      isSyncing: this.isSyncing,
      unsyncedWorkouts,
      unsyncedSets,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();

