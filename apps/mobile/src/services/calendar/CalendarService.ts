/**
 * Calendar Service
 * 
 * Handles advanced calendar operations including:
 * - Workout rescheduling with conflict detection
 * - Availability window management
 * - AI-powered schedule optimization suggestions
 */

import { supabase } from '../database/supabase.client';

export interface ConflictInfo {
  has_conflict: boolean;
  conflict_type?: string;
  total_duration_minutes: number;
  workout_count: number;
  workouts: Array<{
    workout_id: string;
    workout_name: string;
    estimated_duration: number;
    status: string;
  }>;
  warnings: string[];
}

export interface AvailabilityWindow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  availability_type: 'travel' | 'vacation' | 'injury' | 'other';
  notes?: string;
  created_at: string;
}

export interface ScheduleSuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'reschedule' | 'deload' | 'swap' | 'skip' | 'compress' | 'extend';
  affected_workout_ids: string[];
  reasoning: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  metadata: Record<string, any>;
  created_at: string;
}

class CalendarService {
  /**
   * Reschedule a workout to a new date
   */
  async rescheduleWorkout(
    scheduledWorkoutId: string,
    newDate: string,
    reason?: string
  ): Promise<{ success: boolean; workout: any; conflicts: ConflictInfo }> {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-reschedule', {
        body: {
          scheduled_workout_id: scheduledWorkoutId,
          new_date: newDate,
          reason,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rescheduling workout:', error);
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts on a specific date
   */
  async checkConflicts(
    userId: string,
    date: string,
    excludeWorkoutId?: string
  ): Promise<ConflictInfo> {
    try {
      const { data, error } = await supabase.rpc('check_schedule_conflicts', {
        p_user_id: userId,
        p_date: date,
        p_exclude_workout_id: excludeWorkoutId,
      });

      if (error) throw error;

      // Process the raw data into ConflictInfo format
      const conflicts = data || [];
      const totalDuration = conflicts.reduce(
        (sum: number, c: any) => sum + (c.estimated_duration || 0),
        0
      );

      return {
        has_conflict: conflicts.length > 1 || totalDuration > 120,
        conflict_type: this.determineConflictType(conflicts.length, totalDuration),
        total_duration_minutes: totalDuration,
        workout_count: conflicts.length,
        workouts: conflicts,
        warnings: this.generateConflictWarnings(conflicts.length, totalDuration),
      };
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return {
        has_conflict: false,
        total_duration_minutes: 0,
        workout_count: 0,
        workouts: [],
        warnings: [],
      };
    }
  }

  /**
   * Get conflicts for a date range
   */
  async getConflictsForRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, ConflictInfo>> {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-conflicts', {
        body: { user_id: userId, start_date: startDate, end_date: endDate },
      });

      if (error) throw error;
      return data.conflicts || {};
    } catch (error) {
      console.error('Error getting conflicts for range:', error);
      return {};
    }
  }

  /**
   * Create an availability window
   */
  async createAvailabilityWindow(
    userId: string,
    startDate: string,
    endDate: string,
    availabilityType: 'travel' | 'vacation' | 'injury' | 'other',
    notes?: string
  ): Promise<AvailabilityWindow> {
    try {
      const { data, error } = await supabase
        .from('availability_windows')
        .insert({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          availability_type: availabilityType,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating availability window:', error);
      throw error;
    }
  }

  private determineConflictType(workoutCount: number, totalDuration: number): string | undefined {
    if (workoutCount > 2) return 'too_many_workouts';
    if (totalDuration > 180) return 'excessive_duration';
    if (totalDuration > 120) return 'duration_warning';
    return undefined;
  }

  private generateConflictWarnings(workoutCount: number, totalDuration: number): string[] {
    const warnings: string[] = [];

    if (workoutCount > 2) {
      warnings.push(`You have ${workoutCount} workouts scheduled. Consider spreading them out.`);
    }

    if (totalDuration > 180) {
      warnings.push(`Total workout time is ${totalDuration} minutes. This may be too much for one day.`);
    } else if (totalDuration > 120) {
      warnings.push(`Total workout time is ${totalDuration} minutes. Ensure adequate recovery.`);
    }

    return warnings;
  }
}

export default new CalendarService();

