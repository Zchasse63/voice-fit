/**
 * PRHistory Model
 * 
 * WatermelonDB model for personal record tracking.
 * Stores calculated 1RM and actual performance data for each exercise.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class PRHistory extends Model {
  static table = 'pr_history';

  @field('user_id') userId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('exercise_name') exerciseName!: string;
  @field('one_rm') oneRM!: number; // calculated 1RM using Epley formula
  @field('weight') weight!: number; // actual weight lifted
  @field('reps') reps!: number; // actual reps performed
  @field('workout_log_id') workoutLogId?: string; // reference to workout
  @date('achieved_at') achievedAt!: Date; // timestamp of PR
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

