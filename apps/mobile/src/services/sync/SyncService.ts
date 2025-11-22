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
import Run from '../database/watermelon/models/Run';
import Message from '../database/watermelon/models/Message';
import ReadinessScore from '../database/watermelon/models/ReadinessScore';
import PRHistory from '../database/watermelon/models/PRHistory';

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
   * Sync runs from local to Supabase
   */
  async syncRunsToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing runs to Supabase...');

      // Get unsynced runs from WatermelonDB
      const unsyncedRuns = await database
        .get<Run>('runs')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedRuns.length} unsynced runs`);

      for (const run of unsyncedRuns) {
        // Parse route JSON string to JSONB
        let routeData;
        try {
          routeData = JSON.parse(run.route);
        } catch (error) {
          console.error(`[SyncService] Invalid route JSON for run ${run.id}:`, error);
          continue;
        }

        // Upload to Supabase
        const { error } = await supabase.from('runs').insert({
          id: run.id,
          user_id: run.userId,
          start_time: run.startTime.toISOString(),
          end_time: run.endTime.toISOString(),
          distance: run.distance,
          duration: run.duration,
          pace: run.pace,
          avg_speed: run.avgSpeed,
          calories: run.calories,
          elevation_gain: run.elevationGain,
          elevation_loss: run.elevationLoss,
          grade_adjusted_pace: run.gradeAdjustedPace,
          grade_percent: run.gradePercent,
          terrain_difficulty: run.terrainDifficulty,
          route: routeData, // JSONB field
          workout_type: run.workoutType,
          workout_name: run.workoutName,
          created_at: run.createdAt.toISOString(),
          updated_at: run.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing run:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await run.update((r) => {
            r.synced = true;
          });
        });

        console.log(`[SyncService] Synced run ${run.id}`);
      }

      console.log('[SyncService] Run sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing runs:', error);
      throw error;
    }
  }

  /**
   * Sync messages from local to Supabase (bidirectional)
   */
  async syncMessagesToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing messages to Supabase...');

      // Get unsynced messages from WatermelonDB
      const unsyncedMessages = await database
        .get<Message>('messages')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedMessages.length} unsynced messages`);

      for (const message of unsyncedMessages) {
        // Parse data JSON string if present
        let messageData = null;
        if (message.data) {
          try {
            messageData = JSON.parse(message.data);
          } catch (error) {
            console.error(`[SyncService] Invalid data JSON for message ${message.id}:`, error);
          }
        }

        // Upload to Supabase
        const { error } = await supabase.from('messages').insert({
          id: message.id,
          user_id: message.userId,
          text: message.text,
          sender: message.sender,
          message_type: message.messageType,
          data: messageData, // JSONB field
          created_at: message.createdAt.toISOString(),
          updated_at: message.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing message:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await message.update((m) => {
            m.synced = true;
          });
        });

        console.log(`[SyncService] Synced message ${message.id}`);
      }

      console.log('[SyncService] Message sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing messages:', error);
      throw error;
    }
  }

  /**
   * Sync readiness scores from local to Supabase
   */
  async syncReadinessScoresToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing readiness scores to Supabase...');

      // Get unsynced readiness scores from WatermelonDB
      const unsyncedScores = await database
        .get<ReadinessScore>('readiness_scores')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedScores.length} unsynced readiness scores`);

      for (const score of unsyncedScores) {
        // Upload to Supabase
        const { error } = await supabase.from('readiness_scores').insert({
          id: score.id,
          user_id: score.userId,
          date: score.date.toISOString(),
          score: score.score,
          type: score.type,
          emoji: score.emoji,
          sleep_quality: score.sleepQuality,
          soreness: score.soreness,
          stress: score.stress,
          energy: score.energy,
          notes: score.notes,
          created_at: score.createdAt.toISOString(),
          updated_at: score.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing readiness score:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await score.update((s) => {
            s.synced = true;
          });
        });

        console.log(`[SyncService] Synced readiness score ${score.id}`);
      }

      console.log('[SyncService] Readiness score sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing readiness scores:', error);
      throw error;
    }
  }

  /**
   * Sync PR history from local to Supabase
   */
  async syncPRHistoryToSupabase(): Promise<void> {
    try {
      console.log('[SyncService] Syncing PR history to Supabase...');

      // Get unsynced PR records from WatermelonDB
      const unsyncedPRs = await database
        .get<PRHistory>('pr_history')
        .query(Q.where('synced', false))
        .fetch();

      console.log(`[SyncService] Found ${unsyncedPRs.length} unsynced PR records`);

      for (const pr of unsyncedPRs) {
        // Upload to Supabase
        const { error } = await supabase.from('pr_history').insert({
          id: pr.id,
          user_id: pr.userId,
          exercise_id: pr.exerciseId,
          exercise_name: pr.exerciseName,
          one_rm: pr.oneRM,
          weight: pr.weight,
          reps: pr.reps,
          workout_log_id: pr.workoutLogId,
          achieved_at: pr.achievedAt.toISOString(),
          created_at: pr.createdAt.toISOString(),
          updated_at: pr.updatedAt.toISOString(),
        });

        if (error) {
          console.error('[SyncService] Error syncing PR record:', error);
          continue;
        }

        // Mark as synced in local database
        await database.write(async () => {
          await pr.update((p) => {
            p.synced = true;
          });
        });

        console.log(`[SyncService] Synced PR record ${pr.id}`);
      }

      console.log('[SyncService] PR history sync complete');
    } catch (error) {
      console.error('[SyncService] Error syncing PR history:', error);
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

      const lastUpdated = latestWorkout[0]?.createdAt || new Date(0);

      // Fetch new workouts from Supabase
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading workouts:', error);
        return;
      }

      if (!workouts || workouts.length === 0) {
        console.log('[SyncService] No new workouts to download');
        return;
      }

      console.log(`[SyncService] Downloading ${workouts.length} workouts`);

      // Insert or update workouts into local database with conflict resolution
      await database.write(async () => {
        for (const workout of workouts) {
          // Check if workout already exists locally
          const existingWorkout = await database
            .get<WorkoutLog>('workout_logs')
            .find(workout.id)
            .catch(() => null);

          if (existingWorkout) {
            // Conflict detected - compare timestamps (last-write-wins)
            const remoteUpdated = new Date(workout.updated_at);
            const localUpdated = existingWorkout.updatedAt;

            if (remoteUpdated > localUpdated) {
              console.log(`[SyncService] Conflict resolved: Remote workout ${workout.id} is newer, updating local`);
              await existingWorkout.update((w) => {
                w.workoutName = workout.workout_name;
                w.startTime = new Date(workout.start_time);
                w.endTime = workout.end_time ? new Date(workout.end_time) : undefined;
                w.synced = true;
              });
            } else {
              console.log(`[SyncService] Conflict resolved: Local workout ${workout.id} is newer, keeping local`);
            }
          } else {
            // No conflict - create new record
            await database.get<WorkoutLog>('workout_logs').create((w) => {
              w._raw.id = workout.id;
              w.userId = workout.user_id;
              w.workoutName = workout.workout_name;
              w.startTime = new Date(workout.start_time);
              w.endTime = workout.end_time ? new Date(workout.end_time) : undefined;
              w.synced = true;
            });
          }
        }
      });

      console.log('[SyncService] Workout download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading workouts:', error);
      throw error;
    }
  }

  /**
   * Download runs from Supabase to local database
   */
  async downloadRunsFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[SyncService] Downloading runs from Supabase...');

      // Get latest run from local database
      const latestRun = await database
        .get<Run>('runs')
        .query(Q.sortBy('updated_at', Q.desc), Q.take(1))
        .fetch();

      const lastUpdated = latestRun[0]?.createdAt || new Date(0);

      // Fetch new runs from Supabase
      const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading runs:', error);
        return;
      }

      if (!runs || runs.length === 0) {
        console.log('[SyncService] No new runs to download');
        return;
      }

      console.log(`[SyncService] Downloading ${runs.length} runs`);

      // Insert or update runs into local database with conflict resolution
      await database.write(async () => {
        for (const run of runs) {
          // Check if run already exists locally
          const existingRun = await database
            .get<Run>('runs')
            .find(run.id)
            .catch(() => null);

          if (existingRun) {
            // Conflict detected - compare timestamps (last-write-wins)
            const remoteUpdated = new Date(run.updated_at);
            const localUpdated = existingRun.updatedAt;

            if (remoteUpdated > localUpdated) {
              console.log(`[SyncService] Conflict resolved: Remote run ${run.id} is newer, updating local`);
              await existingRun.update((r) => {
                r.startTime = new Date(run.start_time);
                r.endTime = new Date(run.end_time);
                r.distance = run.distance;
                r.duration = run.duration;
                r.pace = run.pace;
                r.avgSpeed = run.avg_speed;
                r.calories = run.calories;
                r.elevationGain = run.elevation_gain;
                r.elevationLoss = run.elevation_loss;
                r.gradeAdjustedPace = run.grade_adjusted_pace;
                r.gradePercent = run.grade_percent;
                r.terrainDifficulty = run.terrain_difficulty;
                r.route = JSON.stringify(run.route);
                r.workoutType = run.workout_type;
                r.workoutName = run.workout_name;
                r.synced = true;
              });
            } else {
              console.log(`[SyncService] Conflict resolved: Local run ${run.id} is newer, keeping local`);
            }
          } else {
            // No conflict - create new record
            await database.get<Run>('runs').create((r) => {
              r._raw.id = run.id;
              r.userId = run.user_id;
              r.startTime = new Date(run.start_time);
              r.endTime = new Date(run.end_time);
              r.distance = run.distance;
              r.duration = run.duration;
              r.pace = run.pace;
              r.avgSpeed = run.avg_speed;
              r.calories = run.calories;
              r.elevationGain = run.elevation_gain;
              r.elevationLoss = run.elevation_loss;
              r.gradeAdjustedPace = run.grade_adjusted_pace;
              r.gradePercent = run.grade_percent;
              r.terrainDifficulty = run.terrain_difficulty;
              r.route = JSON.stringify(run.route); // JSONB to JSON string
              r.workoutType = run.workout_type;
              r.workoutName = run.workout_name;
              r.synced = true;
            });
          }
        }
      });

      console.log('[SyncService] Run download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading runs:', error);
      throw error;
    }
  }

  /**
   * Download messages from Supabase to local database
   */
  async downloadMessagesFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[SyncService] Downloading messages from Supabase...');

      // Get latest message from local database
      const latestMessage = await database
        .get<Message>('messages')
        .query(Q.sortBy('updated_at', Q.desc), Q.take(1))
        .fetch();

      const lastUpdated = latestMessage[0]?.createdAt || new Date(0);

      // Fetch new messages from Supabase
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading messages:', error);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log('[SyncService] No new messages to download');
        return;
      }

      console.log(`[SyncService] Downloading ${messages.length} messages`);

      // Insert or update messages into local database with conflict resolution
      await database.write(async () => {
        for (const message of messages) {
          // Check if message already exists locally
          const existingMessage = await database
            .get<Message>('messages')
            .find(message.id)
            .catch(() => null);

          if (existingMessage) {
            // Conflict detected - compare timestamps (last-write-wins)
            const remoteUpdated = new Date(message.updated_at);
            const localUpdated = existingMessage.updatedAt;

            if (remoteUpdated > localUpdated) {
              console.log(`[SyncService] Conflict resolved: Remote message ${message.id} is newer, updating local`);
              await existingMessage.update((m) => {
                m.text = message.text;
                m.sender = message.sender;
                m.messageType = message.message_type;
                m.data = message.data ? JSON.stringify(message.data) : undefined;
                m.synced = true;
              });
            } else {
              console.log(`[SyncService] Conflict resolved: Local message ${message.id} is newer, keeping local`);
            }
          } else {
            // No conflict - create new record
            await database.get<Message>('messages').create((m) => {
              m._raw.id = message.id;
              m.userId = message.user_id;
              m.text = message.text;
              m.sender = message.sender;
              m.messageType = message.message_type;
              m.data = message.data ? JSON.stringify(message.data) : undefined;
              m.synced = true;
            });
          }
        }
      });

      console.log('[SyncService] Message download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading messages:', error);
      throw error;
    }
  }

  /**
   * Download readiness scores from Supabase to local database
   */
  async downloadReadinessScoresFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[SyncService] Downloading readiness scores from Supabase...');

      // Get latest readiness score from local database
      const latestScore = await database
        .get<ReadinessScore>('readiness_scores')
        .query(Q.sortBy('updated_at', Q.desc), Q.take(1))
        .fetch();

      const lastUpdated = latestScore[0]?.createdAt || new Date(0);

      // Fetch new readiness scores from Supabase
      const { data: scores, error } = await supabase
        .from('readiness_scores')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading readiness scores:', error);
        return;
      }

      if (!scores || scores.length === 0) {
        console.log('[SyncService] No new readiness scores to download');
        return;
      }

      console.log(`[SyncService] Downloading ${scores.length} readiness scores`);

      // Insert or update readiness scores into local database with conflict resolution
      await database.write(async () => {
        for (const score of scores) {
          // Check if readiness score already exists locally
          const existingScore = await database
            .get<ReadinessScore>('readiness_scores')
            .find(score.id)
            .catch(() => null);

          if (existingScore) {
            // Conflict detected - compare timestamps (last-write-wins)
            const remoteUpdated = new Date(score.updated_at);
            const localUpdated = existingScore.updatedAt;

            if (remoteUpdated > localUpdated) {
              console.log(`[SyncService] Conflict resolved: Remote readiness score ${score.id} is newer, updating local`);
              await existingScore.update((s) => {
                s.date = new Date(score.date);
                s.score = score.score;
                s.type = score.type;
                s.emoji = score.emoji;
                s.sleepQuality = score.sleep_quality;
                s.soreness = score.soreness;
                s.stress = score.stress;
                s.energy = score.energy;
                s.notes = score.notes;
                s.synced = true;
              });
            } else {
              console.log(`[SyncService] Conflict resolved: Local readiness score ${score.id} is newer, keeping local`);
            }
          } else {
            // No conflict - create new record
            await database.get<ReadinessScore>('readiness_scores').create((s) => {
              s._raw.id = score.id;
              s.userId = score.user_id;
              s.date = new Date(score.date);
              s.score = score.score;
              s.type = score.type;
              s.emoji = score.emoji;
              s.sleepQuality = score.sleep_quality;
              s.soreness = score.soreness;
              s.stress = score.stress;
              s.energy = score.energy;
              s.notes = score.notes;
              s.synced = true;
            });
          }
        }
      });

      console.log('[SyncService] Readiness score download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading readiness scores:', error);
      throw error;
    }
  }

  /**
   * Download PR history from Supabase to local database
   */
  async downloadPRHistoryFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[SyncService] Downloading PR history from Supabase...');

      // Get latest PR record from local database
      const latestPR = await database
        .get<PRHistory>('pr_history')
        .query(Q.sortBy('updated_at', Q.desc), Q.take(1))
        .fetch();

      const lastUpdated = latestPR[0]?.createdAt || new Date(0);

      // Fetch new PR records from Supabase
      const { data: prs, error } = await supabase
        .from('pr_history')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastUpdated.toISOString());

      if (error) {
        console.error('[SyncService] Error downloading PR history:', error);
        return;
      }

      if (!prs || prs.length === 0) {
        console.log('[SyncService] No new PR records to download');
        return;
      }

      console.log(`[SyncService] Downloading ${prs.length} PR records`);

      // Insert or update PR records into local database with conflict resolution
      await database.write(async () => {
        for (const pr of prs) {
          // Check if PR record already exists locally
          const existingPR = await database
            .get<PRHistory>('pr_history')
            .find(pr.id)
            .catch(() => null);

          if (existingPR) {
            // Conflict detected - compare timestamps (last-write-wins)
            const remoteUpdated = new Date(pr.updated_at);
            const localUpdated = existingPR.updatedAt;

            if (remoteUpdated > localUpdated) {
              console.log(`[SyncService] Conflict resolved: Remote PR ${pr.id} is newer, updating local`);
              await existingPR.update((p) => {
                p.exerciseId = pr.exercise_id;
                p.exerciseName = pr.exercise_name;
                p.oneRM = pr.one_rm;
                p.weight = pr.weight;
                p.reps = pr.reps;
                p.workoutLogId = pr.workout_log_id;
                p.achievedAt = new Date(pr.achieved_at);
                p.synced = true;
              });
            } else {
              console.log(`[SyncService] Conflict resolved: Local PR ${pr.id} is newer, keeping local`);
            }
          } else {
            // No conflict - create new record
            await database.get<PRHistory>('pr_history').create((p) => {
              p._raw.id = pr.id;
              p.userId = pr.user_id;
              p.exerciseId = pr.exercise_id;
              p.exerciseName = pr.exercise_name;
              p.oneRM = pr.one_rm;
              p.weight = pr.weight;
              p.reps = pr.reps;
              p.workoutLogId = pr.workout_log_id;
              p.achievedAt = new Date(pr.achieved_at);
              p.synced = true;
            });
          }
        }
      });

      console.log('[SyncService] PR history download complete');
    } catch (error) {
      console.error('[SyncService] Error downloading PR history:', error);
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
      await this.syncRunsToSupabase();
      await this.syncMessagesToSupabase();
      await this.syncReadinessScoresToSupabase();
      await this.syncPRHistoryToSupabase();

      // Download remote changes
      await this.downloadWorkoutsFromSupabase(userId);
      await this.downloadRunsFromSupabase(userId);
      await this.downloadMessagesFromSupabase(userId);
      await this.downloadReadinessScoresFromSupabase(userId);
      await this.downloadPRHistoryFromSupabase(userId);

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
    unsyncedRuns: number;
    unsyncedMessages: number;
    unsyncedReadinessScores: number;
    unsyncedPRHistory: number;
  }> {
    const unsyncedWorkouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedSets = await database
      .get<Set>('sets')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedRuns = await database
      .get<Run>('runs')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedMessages = await database
      .get<Message>('messages')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedReadinessScores = await database
      .get<ReadinessScore>('readiness_scores')
      .query(Q.where('synced', false))
      .fetchCount();

    const unsyncedPRHistory = await database
      .get<PRHistory>('pr_history')
      .query(Q.where('synced', false))
      .fetchCount();

    return {
      isSyncing: this.isSyncing,
      unsyncedWorkouts,
      unsyncedSets,
      unsyncedRuns,
      unsyncedMessages,
      unsyncedReadinessScores,
      unsyncedPRHistory,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
