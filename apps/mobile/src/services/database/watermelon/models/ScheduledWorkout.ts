/**
 * ScheduledWorkout Model
 *
 * Represents a workout scheduled on a specific date in the calendar.
 * Links to a workout template and tracks completion status.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class ScheduledWorkout extends Model {
  static table = 'scheduled_workouts';

  @field('program_id') programId!: string;
  @field('template_id') templateId?: string;
  @field('user_id') userId!: string;
  @field('scheduled_date') scheduledDate!: number; // timestamp
  @field('week_number') weekNumber?: number;
  @field('day_of_week') dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  @field('position') position!: number; // ordering on same day
  @field('status') status!: string; // 'scheduled', 'completed', 'skipped', 'rescheduled'
  @field('completed_workout_log_id') completedWorkoutLogId?: string;
  @field('notes') notes?: string;
  @field('rescheduled_from') rescheduledFrom?: number; // timestamp of original date
  @field('reschedule_reason') rescheduleReason?: string;
  @field('conflict_acknowledged') conflictAcknowledged?: boolean;
  @field('warmup_routine') warmupRoutine?: string; // JSON string
  @field('cooldown_routine') cooldownRoutine?: string; // JSON string
  @field('warmup_duration_min') warmupDurationMin?: number;
  @field('cooldown_duration_min') cooldownDurationMin?: number;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed properties
  get scheduledDateObject(): Date {
    // Handle null/undefined scheduledDate gracefully
    if (!this.scheduledDate) {
      return new Date(); // Return current date as fallback
    }
    return new Date(this.scheduledDate);
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  get isSkipped(): boolean {
    return this.status === 'skipped';
  }

  get isRescheduled(): boolean {
    return this.status === 'rescheduled';
  }

  get isPast(): boolean {
    if (!this.scheduledDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.scheduledDateObject < today;
  }

  get isToday(): boolean {
    if (!this.scheduledDate) return false;
    const today = new Date();
    const scheduledDate = this.scheduledDateObject;
    return (
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear()
    );
  }

  get isFuture(): boolean {
    if (!this.scheduledDate) return false;
    return !this.isPast && !this.isToday;
  }

  get dayOfWeekName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.dayOfWeek || 0] || 'Unknown';
  }

  get dayOfWeekShort(): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[this.dayOfWeek || 0] || '?';
  }

  get statusDisplay(): string {
    const statusMap: Record<string, string> = {
      scheduled: 'Scheduled',
      completed: 'Completed',
      skipped: 'Skipped',
      rescheduled: 'Rescheduled',
    };
    return statusMap[this.status] || 'Unknown';
  }

  get statusColor(): string {
    const colorMap: Record<string, string> = {
      scheduled: '#4A9B6F', // green
      completed: '#3498DB', // blue
      skipped: '#95A5A6', // gray
      rescheduled: '#F39C12', // orange
    };
    return colorMap[this.status] || '#95A5A6';
  }

  get formattedDate(): string {
    if (!this.scheduledDate) return 'No date';
    const dateObj = this.scheduledDateObject;
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get formattedDateShort(): string {
    if (!this.scheduledDate) return 'No date';
    const dateObj = this.scheduledDateObject;
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
