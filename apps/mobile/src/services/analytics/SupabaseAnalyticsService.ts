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

class SupabaseAnalyticsService {
  /**
   * Get volume trends for last 12 weeks from Supabase
   */
  async getVolumeTrends(userId: string): Promise<VolumeDataPoint[]> {
    try {
      // Get workouts from last 12 weeks
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

      // Query workout_logs which contain the sets data
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select('workout_date, weight_used, reps_completed')
        .eq('user_id', userId)
        .gte('workout_date', twelveWeeksAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: true });

      if (error) throw error;
      if (!workoutLogs || workoutLogs.length === 0) return [];

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
      console.error('Failed to fetch volume trends from Supabase:', error);
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

      const { data, error } = await supabase
        .from('readiness_scores')
        .select('date, score')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        date: item.date,
        compositeScore: item.score || 0,
      }));

    } catch (error) {
      console.error('Failed to fetch readiness trend from Supabase:', error);
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

      const { count, error } = await supabase
        .from('pr_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('achieved_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      return count || 0;

    } catch (error) {
      console.error('Failed to fetch PR count from Supabase:', error);
      return 0;
    }
  }

  /**
   * Get start of week (Sunday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}

export const supabaseAnalyticsService = new SupabaseAnalyticsService();

