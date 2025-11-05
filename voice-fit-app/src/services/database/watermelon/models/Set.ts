/**
 * Set Model
 * 
 * WatermelonDB model for individual exercise sets.
 * Each set belongs to a workout log.
 */

import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import WorkoutLog from './WorkoutLog';

export default class Set extends Model {
  static table = 'sets';
  
  static associations: Associations = {
    workout_logs: { type: 'belongs_to', key: 'workout_log_id' },
  };

  @field('workout_log_id') workoutLogId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('exercise_name') exerciseName!: string;
  @field('weight') weight!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe?: number;
  @field('voice_command_id') voiceCommandId?: string;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('workout_logs', 'workout_log_id') workoutLog!: Relation<WorkoutLog>;
}

