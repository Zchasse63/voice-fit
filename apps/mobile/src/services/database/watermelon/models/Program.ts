/**
 * Program Model
 *
 * Represents a training program with scheduled workouts.
 * Used for the Runna-inspired calendar view and program scheduling.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Program extends Model {
  static table = 'programs';

  @field('user_id') userId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('focus') focus?: string; // 'strength', 'hypertrophy', 'endurance', etc.
  @field('start_date') startDate?: number;
  @field('end_date') endDate?: number;
  @field('current_week') currentWeek!: number;
  @field('total_weeks') totalWeeks?: number;
  @field('color') color!: string; // hex color for visual coding
  @field('is_active') isActive!: boolean;
  @field('status') status!: string; // 'active', 'completed', 'paused'
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed properties
  get startDateObject(): Date | null {
    return this.startDate ? new Date(this.startDate) : null;
  }

  get endDateObject(): Date | null {
    return this.endDate ? new Date(this.endDate) : null;
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isPaused(): boolean {
    return this.status === 'paused';
  }

  get durationInWeeks(): number | null {
    if (!this.startDate || !this.endDate) return null;
    const diffTime = this.endDate - this.startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  get progressPercentage(): number {
    if (!this.totalWeeks) return 0;
    return Math.round((this.currentWeek / this.totalWeeks) * 100);
  }
}
