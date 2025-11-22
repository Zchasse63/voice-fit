/**
 * RunAnalyticsService
 * 
 * Queries Supabase for running analytics data.
 * Provides weekly distance, pace trends, and recent runs.
 */

import { supabase } from '../database/supabase.client';

export interface RunSummary {
  id: string;
  startTime: Date;
  distance: number; // meters
  duration: number; // seconds
  pace: number; // min/mile
  calories: number;
}

export interface WeeklyRunStats {
  totalDistance: number; // meters
  totalDuration: number; // seconds
  runCount: number;
  avgPace: number; // min/mile
  totalCalories: number;
}

class RunAnalyticsService {
  /**
   * Get recent runs for a user
   */
  async getRecentRuns(userId: string, limit: number = 5): Promise<RunSummary[]> {
    try {
      const { data: runs, error } = await supabase
        .from('runs')
        .select('id, start_time, distance, duration, pace, calories')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit) as any;

      if (error) {
        console.error('❌ getRecentRuns query failed:', {
          error,
          userId,
          limit,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        return [];
      }

      if (!runs || runs.length === 0) {
        console.warn('⚠️ getRecentRuns returned 0 results:', {
          userId,
          limit,
          message: 'No runs found - check if user has completed any runs',
        });
        return [];
      }

      return (runs as any[]).map((run: any) => ({
        id: run.id,
        startTime: new Date(run.start_time),
        distance: run.distance,
        duration: run.duration,
        pace: run.pace,
        calories: run.calories,
      }));
    } catch (error) {
      console.error('❌ getRecentRuns error:', error);
      return [];
    }
  }

  /**
   * Get weekly run statistics
   */
  async getWeeklyRunStats(userId: string): Promise<WeeklyRunStats> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: runs, error } = await supabase
        .from('runs')
        .select('distance, duration, pace, calories')
        .eq('user_id', userId)
        .gte('start_time', weekAgo.toISOString()) as any;

      if (error) {
        console.error('❌ getWeeklyRunStats query failed:', {
          error,
          userId,
          weekAgo: weekAgo.toISOString(),
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        return {
          totalDistance: 0,
          totalDuration: 0,
          runCount: 0,
          avgPace: 0,
          totalCalories: 0,
        };
      }

      if (!runs || runs.length === 0) {
        console.warn('⚠️ getWeeklyRunStats returned 0 results:', {
          userId,
          weekAgo: weekAgo.toISOString(),
          message: 'No runs found in the last 7 days',
        });
        return {
          totalDistance: 0,
          totalDuration: 0,
          runCount: 0,
          avgPace: 0,
          totalCalories: 0,
        };
      }

      const totalDistance = (runs as any[]).reduce((sum: number, run: any) => sum + run.distance, 0);
      const totalDuration = (runs as any[]).reduce((sum: number, run: any) => sum + run.duration, 0);
      const totalCalories = (runs as any[]).reduce((sum: number, run: any) => sum + run.calories, 0);
      const avgPace = (runs as any[]).reduce((sum: number, run: any) => sum + run.pace, 0) / runs.length;

      return {
        totalDistance,
        totalDuration,
        runCount: runs.length,
        avgPace,
        totalCalories,
      };
    } catch (error) {
      console.error('❌ getWeeklyRunStats error:', error);
      return {
        totalDistance: 0,
        totalDuration: 0,
        runCount: 0,
        avgPace: 0,
        totalCalories: 0,
      };
    }
  }
}

export const runAnalyticsService = new RunAnalyticsService();

