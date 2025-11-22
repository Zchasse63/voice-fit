import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Run extends Model {
  static table = 'runs';

  @field('user_id') userId!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('distance') distance!: number; // meters
  @field('duration') duration!: number; // seconds
  @field('pace') pace!: number; // minutes per mile
  @field('avg_speed') avgSpeed!: number; // mph
  @field('calories') calories!: number;
  @field('elevation_gain') elevationGain!: number; // meters
  @field('elevation_loss') elevationLoss!: number; // meters
  @field('grade_adjusted_pace') gradeAdjustedPace?: number; // GAP in minutes per mile
  @field('grade_percent') gradePercent!: number; // average grade percentage
  @field('terrain_difficulty') terrainDifficulty!: string; // flat, rolling, moderate_uphill, etc.
  @field('route') route!: string; // JSON string of coordinates
  @field('workout_type') workoutType?: string; // 'free_run', 'custom_workout', 'scheduled_workout'
  @field('workout_name') workoutName?: string; // name of the workout if applicable
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

