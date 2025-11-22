/**
 * Chart Data Service
 * 
 * Provides data calculation and aggregation utilities for analytics charts.
 * Handles volume trends, muscle balance, PR predictions, and readiness trends.
 */

import { database } from '../database/watermelon/database';
import { Q } from '@nozbe/watermelondb';
import WorkoutLog from '../database/watermelon/models/WorkoutLog';
import Set from '../database/watermelon/models/Set';
import PRHistory from '../database/watermelon/models/PRHistory';
import ReadinessScore from '../database/watermelon/models/ReadinessScore';

// ============================================================================
// Types
// ============================================================================

export interface VolumeDataPoint {
  week: string; // ISO date string of week start (Sunday)
  tonnage: number; // Total volume in lbs
}

export interface MuscleGroupData {
  muscleGroup: string;
  volume: number; // Total tonnage
  percentage: number; // Percentage of total volume
}

export interface PRDataPoint {
  date: string; // ISO date string
  estimated1RM: number; // Calculated 1RM
  weight: number; // Actual weight lifted
  reps: number; // Actual reps performed
}

export interface PRPrediction {
  date: string; // ISO date string
  estimated1RM: number; // Predicted 1RM
  weeksAhead: number; // 4, 8, or 12 weeks
}

export interface ReadinessDataPoint {
  date: string; // ISO date string
  compositeScore: number; // 0-100
}

// ============================================================================
// Muscle Group Mapping
// ============================================================================

const MUSCLE_GROUP_MAP: Record<string, string> = {
  // Chest
  'bench press': 'Chest',
  'incline bench': 'Chest',
  'decline bench': 'Chest',
  'dumbbell press': 'Chest',
  'push up': 'Chest',
  'chest fly': 'Chest',
  'cable fly': 'Chest',
  'pec deck': 'Chest',
  
  // Back
  'deadlift': 'Back',
  'pull up': 'Back',
  'chin up': 'Back',
  'row': 'Back',
  'lat pulldown': 'Back',
  'face pull': 'Back',
  'shrug': 'Back',
  
  // Legs
  'squat': 'Legs',
  'leg press': 'Legs',
  'lunge': 'Legs',
  'leg curl': 'Legs',
  'leg extension': 'Legs',
  'calf raise': 'Legs',
  'rdl': 'Legs',
  'romanian deadlift': 'Legs',
  
  // Shoulders
  'overhead press': 'Shoulders',
  'shoulder press': 'Shoulders',
  'military press': 'Shoulders',
  'lateral raise': 'Shoulders',
  'front raise': 'Shoulders',
  'rear delt': 'Shoulders',
  
  // Arms
  'bicep curl': 'Arms',
  'tricep': 'Arms',
  'hammer curl': 'Arms',
  'preacher curl': 'Arms',
  'skull crusher': 'Arms',
  'dip': 'Arms',
  
  // Core
  'plank': 'Core',
  'crunch': 'Core',
  'sit up': 'Core',
  'ab wheel': 'Core',
  'leg raise': 'Core',
  'russian twist': 'Core',
};

// ============================================================================
// Chart Data Service Class
// ============================================================================

class ChartDataService {
  /**
   * Get weekly volume trends for the last 12 weeks
   */
  async getVolumeTrends(userId: string): Promise<VolumeDataPoint[]> {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

    // Get all workouts from the last 12 weeks
    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(twelveWeeksAgo.getTime())),
        Q.sortBy('start_time', Q.asc)
      )
      .fetch();

    // Group by week and calculate tonnage
    const weeklyData = new Map<string, number>();

    for (const workout of workouts) {
      if (!workout.startTime) continue;
      const weekStart = this.getWeekStart(workout.startTime);
      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', workout.id))
        .fetch();

      const tonnage = sets.reduce((total, set) => total + (set.weight * set.reps), 0);
      weeklyData.set(weekStart, (weeklyData.get(weekStart) || 0) + tonnage);
    }

    // Convert to array and sort by date
    return Array.from(weeklyData.entries())
      .map(([week, tonnage]) => ({ week, tonnage }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  /**
   * Get muscle group balance data for the last 4 weeks
   */
  async getMuscleBalance(userId: string): Promise<MuscleGroupData[]> {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Get all workouts from the last 4 weeks
    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(fourWeeksAgo.getTime()))
      )
      .fetch();

    // Calculate volume per muscle group
    const muscleVolumes = new Map<string, number>();

    for (const workout of workouts) {
      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', workout.id))
        .fetch();

      for (const set of sets) {
        const muscleGroup = this.getMuscleGroup(set.exerciseName);
        const volume = set.weight * set.reps;
        muscleVolumes.set(muscleGroup, (muscleVolumes.get(muscleGroup) || 0) + volume);
      }
    }

    // Calculate total volume and percentages
    const totalVolume = Array.from(muscleVolumes.values()).reduce((sum, vol) => sum + vol, 0);

    if (totalVolume === 0) {
      return [];
    }

    return Array.from(muscleVolumes.entries())
      .map(([muscleGroup, volume]) => ({
        muscleGroup,
        volume,
        percentage: (volume / totalVolume) * 100,
      }))
      .sort((a, b) => b.volume - a.volume);
  }

  /**
   * Get PR history for a specific exercise
   */
  async getPRHistory(userId: string, exerciseId: string): Promise<PRDataPoint[]> {
    const prHistory = await database
      .get<PRHistory>('pr_history')
      .query(
        Q.where('user_id', userId),
        Q.where('exercise_id', exerciseId),
        Q.sortBy('achieved_at', Q.asc)
      )
      .fetch();

    return prHistory.map((pr) => ({
      date: pr.achievedAt.toISOString().split('T')[0],
      estimated1RM: pr.oneRM,
      weight: pr.weight,
      reps: pr.reps,
    }));
  }

  /**
   * Predict future PRs using linear regression
   */
  predictFuturePRs(historicalData: PRDataPoint[]): PRPrediction[] {
    if (historicalData.length < 3) {
      return [];
    }

    // Linear regression calculation
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + d.estimated1RM, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.estimated1RM, 0);
    const sumX2 = historicalData.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict 4, 8, 12 weeks ahead
    const lastDate = new Date(historicalData[historicalData.length - 1]!.date);
    return [4, 8, 12].map((weeks) => {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + weeks * 7);
      const futureIndex = n + weeks;
      const predicted1RM = slope * futureIndex + intercept;

      return {
        date: futureDate.toISOString().split('T')[0],
        estimated1RM: Math.round(predicted1RM),
        weeksAhead: weeks,
      };
    });
  }

  /**
   * Get readiness trend for the last 7 days
   */
  async getReadinessTrend(userId: string): Promise<ReadinessDataPoint[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const readinessScores = await database
      .get<ReadinessScore>('readiness_scores')
      .query(
        Q.where('user_id', userId),
        Q.where('date', Q.gte(sevenDaysAgo.getTime())),
        Q.sortBy('date', Q.asc)
      )
      .fetch();

    return readinessScores.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      compositeScore: r.score,
    }));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get the start of the week (Sunday) for a given date
   */
  private getWeekStart(date: Date): string {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Determine muscle group from exercise name
   */
  private getMuscleGroup(exerciseName: string): string {
    const lowerName = exerciseName.toLowerCase();

    for (const [keyword, muscleGroup] of Object.entries(MUSCLE_GROUP_MAP)) {
      if (lowerName.includes(keyword)) {
        return muscleGroup;
      }
    }

    return 'Other';
  }
}

export const chartDataService = new ChartDataService();

