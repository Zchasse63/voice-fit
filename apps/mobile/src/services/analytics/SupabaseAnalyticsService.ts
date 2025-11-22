/**
 * Supabase Analytics Service
 * 
 * Queries Supabase directly for analytics data instead of WatermelonDB.
 * Used for dashboard analytics when local DB might not be synced.
 */

import { supabase } from '../database/supabase.client';

export interface VolumeDataPoint {
  week: string;
  tonnage: number;
}

export interface ReadinessDataPoint {
  date: string;
  compositeScore: number;
}

export interface PRCount {
  count: number;
}

interface WorkoutLog {
  id?: string;
  workout_date: string;
  weight_used?: number;
  reps_completed?: number;
  user_id?: string;
  // Note: duration_seconds column does NOT exist in Supabase workout_logs table
}

class SupabaseAnalyticsService {
  /**
   * Get volume trends for last 12 weeks from Supabase
   */
  async getVolumeTrends(userId: string): Promise<VolumeDataPoint[]> {
    try {
      // Get workouts from last 12 weeks
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks
      const dateFilter = twelveWeeksAgo.toISOString().split('T')[0];

      // Query workout_logs which contain the sets data
      const { data, error } = await supabase
        .from('workout_logs')
        .select('workout_date, weight_used, reps_completed')
        .eq('user_id', userId)
        .gte('workout_date', dateFilter)
        .order('workout_date', { ascending: true });

      if (error) {
        console.error('❌ getVolumeTrends query failed:', {
          error,
          userId,
          dateFilter,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw error;
      }

      const workoutLogs = data as WorkoutLog[] || [];

      if (workoutLogs.length === 0) {
        console.warn('⚠️ getVolumeTrends returned 0 results:', {
          userId,
          dateFilter,
          message: 'No workout logs found - check if user_id exists in database and data is within date range'
        });
        return [];
      }

      // Group by week and calculate tonnage
      const weeklyData = new Map<string, number>();

      workoutLogs.forEach(log => {
        const tonnage = (log.weight_used || 0) * (log.reps_completed || 0);
        const weekStart = this.getWeekStart(new Date(log.workout_date));
        const weekKey = weekStart.toISOString().split('T')[0];

        weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + tonnage);
      });

      // Convert to array and sort
      return Array.from(weeklyData.entries())
        .map(([week, tonnage]) => ({ week, tonnage }))
        .sort((a, b) => a.week.localeCompare(b.week));

    } catch (error) {
      console.error('❌ Failed to fetch volume trends from Supabase:', error);
      return [];
    }
  }

  /**
   * Get readiness scores for last 7 days from Supabase
   */
  async getReadinessTrend(userId: string): Promise<ReadinessDataPoint[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('readiness_scores')
        .select('date, score')
        .eq('user_id', userId)
        .gte('date', dateFilter)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ getReadinessTrend query failed:', {
          error,
          userId,
          dateFilter,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw error;
      }

      const scores = data as any[] || [];

      if (scores.length === 0) {
        console.warn('⚠️ getReadinessTrend returned 0 results:', {
          userId,
          dateFilter,
          message: 'No readiness scores found - check if user_id exists and data is within date range'
        });
      }

      return scores.map(item => ({
        date: item.date,
        compositeScore: item.score || 0,
      }));

    } catch (error) {
      console.error('❌ Failed to fetch readiness trend from Supabase:', error);
      return [];
    }
  }

  /**
   * Count PRs from last 30 days from Supabase
   */
  async getPRCount(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString();

      const { count, error } = await supabase
        .from('pr_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('achieved_at', dateFilter);

      if (error) {
        console.error('❌ getPRCount query failed:', {
          error,
          userId,
          dateFilter,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw error;
      }

      if (count === 0) {
        console.warn('⚠️ getPRCount returned 0 results:', {
          userId,
          dateFilter,
          message: 'No PR records found - check if user_id exists and data is within date range'
        });
      }

      return count || 0;

    } catch (error) {
      console.error('❌ Failed to fetch PR count from Supabase:', error);
      return 0;
    }
  }

  /**
   * Get daily volume for last 7 days
   */
  async getDailyVolume(userId: string): Promise<VolumeDataPoint[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('workout_logs')
        .select('workout_date, weight_used, reps_completed')
        .eq('user_id', userId)
        .gte('workout_date', dateFilter)
        .order('workout_date', { ascending: true });

      if (error) {
        console.error('❌ getDailyVolume query failed:', {
          error,
          userId,
          dateFilter,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        throw error;
      }

      const workoutLogs = data as WorkoutLog[] || [];

      if (workoutLogs.length === 0) {
        console.warn('⚠️ getDailyVolume returned 0 results:', {
          userId,
          dateFilter,
          message: 'No workout logs found - check if user_id exists and data is within date range'
        });
        return [];
      }

      const dailyData = new Map<string, number>();

      workoutLogs.forEach(log => {
        const tonnage = (log.weight_used || 0) * (log.reps_completed || 0);
        const dateKey = log.workout_date; // Assuming YYYY-MM-DD
        dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + tonnage);
      });

      return Array.from(dailyData.entries())
        .map(([date, tonnage]) => ({ week: date, tonnage })) // Reusing VolumeDataPoint interface where week=date
        .sort((a, b) => a.week.localeCompare(b.week));

    } catch (error) {
      console.error('❌ Failed to fetch daily volume:', error);
      return [];
    }
  }

  /**
   * Get weekly stats for "This Week" card
   */
  async getWeeklyStats(userId: string) {
    try {
      const startOfWeek = this.getWeekStart(new Date());
      const dateFilter = startOfWeek.toISOString().split('T')[0];

      // Get workouts - NOTE: duration_seconds column doesn't exist in workout_logs table
      // We'll calculate totalTime as 0 for now or estimate based on sets
      const { data, error: workoutsError } = await supabase
        .from('workout_logs')
        .select('id, workout_date, weight_used, reps_completed')
        .eq('user_id', userId)
        .gte('workout_date', dateFilter);

      if (workoutsError) {
        console.error('❌ getWeeklyStats query failed:', {
          error: workoutsError,
          userId,
          dateFilter,
          errorMessage: workoutsError.message,
          errorDetails: workoutsError.details,
          errorHint: workoutsError.hint,
        });
        throw workoutsError;
      }

      const workouts = data as WorkoutLog[] || [];

      if (workouts.length === 0) {
        console.warn('⚠️ getWeeklyStats returned 0 results:', {
          userId,
          dateFilter,
          message: 'No workout logs found this week - check if user_id exists and has recent data'
        });
      }

      const workoutCount = new Set(workouts?.map(w => w.workout_date)).size; // Approximate by unique dates
      const totalVolume = workouts?.reduce((sum, w) => sum + ((w.weight_used || 0) * (w.reps_completed || 0)), 0) || 0;
      const totalSets = workouts?.length || 0; // Each log row is a set
      // Estimate time: ~3 minutes per set (rough estimate since duration_seconds doesn't exist)
      const totalTime = Math.round((totalSets * 3)); // minutes

      return {
        workoutCount,
        totalVolume,
        totalSets,
        totalTime
      };

    } catch (error) {
      console.error('❌ Failed to fetch weekly stats:', error);
      return {
        workoutCount: 0,
        totalVolume: 0,
        totalSets: 0,
        totalTime: 0
      };
    }
  }

  /**
   * Get start of week (Sunday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

export const supabaseAnalyticsService = new SupabaseAnalyticsService();

