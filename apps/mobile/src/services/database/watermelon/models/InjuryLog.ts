/**
 * InjuryLog Model
 * 
 * WatermelonDB model for injury tracking and management.
 * Helps monitor injury status and recovery progress.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class InjuryLog extends Model {
  static table = 'injury_logs';

  @field('user_id') userId!: string;
  @field('body_part') bodyPart!: string; // e.g., 'lower_back', 'shoulder'
  @field('severity') severity!: string; // 'minor', 'moderate', 'severe'
  @field('description') description?: string;
  @field('status') status!: string; // 'active', 'recovering', 'resolved'
  @date('reported_at') reportedAt!: Date;
  @date('resolved_at') resolvedAt?: Date;
  @date('last_check_in_at') lastCheckInAt?: Date; // Phase 3: Weekly recovery check-ins
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

