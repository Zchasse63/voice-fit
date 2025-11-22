/**
 * WorkoutLog Model
 *
 * WatermelonDB model for workout logs (individual sets).
 * Updated to match Supabase schema - represents a single set in a workout.
 */

import { Model, Query } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import Set from './Set';

export default class WorkoutLog extends Model {
  static table = 'workout_logs';

  static associations: Associations = {
    sets: { type: 'has_many', foreignKey: 'workout_log_id' },
  };

  // Core fields (match Supabase schema)
  @field('user_id') userId!: string;
  @field('exercise_id') exerciseId!: string;
  @date('workout_date') workoutDate!: Date;
  @field('set_number') setNumber!: number;
  @field('reps_completed') repsCompleted!: number;
  @field('weight_used') weightUsed?: number;
  @field('rpe') rpe?: number;

  // Optional reference fields
  @field('program_exercise_id') programExerciseId?: string;
  @field('voice_command_id') voiceCommandId?: string;
  @field('workout_id') workoutId?: string;

  // Status fields
  @field('was_prescribed') wasPrescribed?: boolean;
  @field('was_completed') wasCompleted?: boolean;
  @field('notes') notes?: string;

  // Legacy fields (kept for backward compatibility)
  @field('workout_name') workoutName?: string;
  @date('start_time') startTime?: Date;
  @date('end_time') endTime?: Date;
  @field('warmup_routine') warmupRoutine?: string;
  @field('cooldown_routine') cooldownRoutine?: string;
  @field('warmup_duration_min') warmupDurationMin?: number;
  @field('cooldown_duration_min') cooldownDurationMin?: number;

  // Additional fields for test compatibility
  @field('duration_minutes') durationMinutes?: number;
  @field('workout_type') workoutType?: string;

  // Sync metadata
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('sets') sets!: Query<Set>;
}

