/**
 * UserBadge Model
 * 
 * WatermelonDB model for gamification badges.
 * Tracks achievements and milestones (Premium feature).
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class UserBadge extends Model {
  static table = 'user_badges';

  @field('user_id') userId!: string;
  @field('badge_type') badgeType!: string; // 'streak_7', 'pr_milestone', etc.
  @field('badge_name') badgeName!: string;
  @field('badge_description') badgeDescription!: string;
  @date('earned_at') earnedAt!: Date;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

