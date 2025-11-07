/**
 * WorkoutLog Model
 * 
 * WatermelonDB model for workout sessions.
 * Represents a single workout session with start/end times.
 */

import { Model, Query } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class WorkoutLog extends Model {
  static table = 'workout_logs';
  
  static associations: Associations = {
    sets: { type: 'has_many', foreignKey: 'workout_log_id' },
  };

  @field('user_id') userId!: string;
  @field('workout_name') workoutName?: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime?: Date;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('sets') sets!: Query<any>;
}

