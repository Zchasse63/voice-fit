/**
 * ReadinessScore Model
 * 
 * WatermelonDB model for daily readiness assessments.
 * Tracks user's readiness to train with simple emoji or detailed metrics.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ReadinessScore extends Model {
  static table = 'readiness_scores';

  @field('user_id') userId!: string;
  @date('date') date!: Date; // timestamp for the day
  @field('score') score!: number; // 0-100 composite score
  @field('type') type!: string; // 'simple' or 'detailed'
  @field('emoji') emoji?: string; // 😊, 😐, 😓 for simple
  @field('sleep_quality') sleepQuality?: number; // 1-10 for detailed
  @field('soreness') soreness?: number; // 1-10 for detailed
  @field('stress') stress?: number; // 1-10 for detailed
  @field('energy') energy?: number; // 1-10 for detailed
  @field('notes') notes?: string; // Phase 3: User notes for injury detection
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

