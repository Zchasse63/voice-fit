/**
 * UserStreak Model
 * 
 * WatermelonDB model for tracking user streaks.
 * Monitors consecutive days of activity (Premium feature).
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class UserStreak extends Model {
  static table = 'user_streaks';

  @field('user_id') userId!: string;
  @field('streak_type') streakType!: string; // 'workout', 'readiness_check'
  @field('current_count') currentCount!: number;
  @field('longest_count') longestCount!: number;
  @date('last_activity_date') lastActivityDate!: Date;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

