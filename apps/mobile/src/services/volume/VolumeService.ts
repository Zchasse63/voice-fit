/**
 * Volume Service
 * 
 * Implements volume tracking and tonnage calculation.
 * Tracks total volume (weight × reps) and muscle group distribution.
 * 
 * Formula: Tonnage = ∑(weight × reps × sets)
 */

import { database } from '../database/watermelon/database';
import WorkoutLog from '../database/watermelon/models/WorkoutLog';
import Set from '../database/watermelon/models/Set';
import { readinessService } from '../readiness/ReadinessService';
import { Q } from '@nozbe/watermelondb';

export interface VolumeData {
  date: string; // ISO date string
  volume: number; // Total tonnage in lbs
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  volume: number;
  percentage: number;
}

export interface FatigueIndicator {
  status: 'green' | 'yellow' | 'red';
  message: string;
  volumeTrend: number; // Percentage change
  readinessScore?: number;
}

// Muscle group mapping for common exercises
const MUSCLE_GROUP_MAP: Record<string, string> = {
  // Chest
  'bench press': 'chest',
  'incline bench': 'chest',
  'dumbbell press': 'chest',
  'push up': 'chest',
  'chest fly': 'chest',
  
  // Back
  'deadlift': 'back',
  'pull up': 'back',
  'row': 'back',
  'lat pulldown': 'back',
  
  // Legs
  'squat': 'legs',
  'leg press': 'legs',
  'lunge': 'legs',
  'leg curl': 'legs',
  'leg extension': 'legs',
  
  // Shoulders
  'overhead press': 'shoulders',
  'shoulder press': 'shoulders',
  'lateral raise': 'shoulders',
  'front raise': 'shoulders',
  
  // Arms
  'bicep curl': 'arms',
  'tricep': 'arms',
  'hammer curl': 'arms',
};

class VolumeService {
  /**
   * Calculate weekly tonnage
   * Formula: ∑(weight × reps) for all sets
   */
  async calculateWeeklyTonnage(userId: string): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(oneWeekAgo.getTime()))
      )
      .fetch();

    if (workouts.length === 0) return 0;

    const workoutIds = workouts.map((w) => w.id);
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
      .fetch();

    // Calculate tonnage: sum(weight × reps)
    return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  }

  /**
   * Get volume data for the last N days
   */
  async getVolumeHistory(userId: string, days: number = 30): Promise<VolumeData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime())),
        Q.sortBy('start_time', Q.asc)
      )
      .fetch();

    // Group workouts by date
    const volumeByDate = new Map<string, number>();

    for (const workout of workouts) {
      if (!workout.startTime) continue;
      const dateKey = workout.startTime.toISOString().split('T')[0];
      
      // Get sets for this workout
      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', workout.id))
        .fetch();

      const workoutVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      
      const existing = volumeByDate.get(dateKey) || 0;
      volumeByDate.set(dateKey, existing + workoutVolume);
    }

    // Convert to array format
    return Array.from(volumeByDate.entries())
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate muscle group volume distribution
   */
  async calculateMuscleGroupVolume(userId: string, days: number = 7): Promise<MuscleGroupVolume[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime()))
      )
      .fetch();

    if (workouts.length === 0) return [];

    const workoutIds = workouts.map((w) => w.id);
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
      .fetch();

    // Calculate volume per muscle group
    const volumeByMuscle = new Map<string, number>();
    let totalVolume = 0;

    for (const set of sets) {
      const volume = set.weight * set.reps;
      totalVolume += volume;

      // Determine muscle group from exercise name
      const muscleGroup = this.getMuscleGroup(set.exerciseName);
      const existing = volumeByMuscle.get(muscleGroup) || 0;
      volumeByMuscle.set(muscleGroup, existing + volume);
    }

    // Convert to array with percentages
    return Array.from(volumeByMuscle.entries())
      .map(([muscleGroup, volume]) => ({
        muscleGroup,
        volume,
        percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
      }))
      .sort((a, b) => b.volume - a.volume);
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

    return 'other';
  }

  /**
   * Calculate fatigue indicator based on volume trends and readiness
   * Returns traffic light status: green (good), yellow (moderate), red (high fatigue)
   */
  async calculateFatigueIndicator(userId: string): Promise<FatigueIndicator> {
    // Get volume from last week and previous week
    const lastWeekVolume = await this.calculateWeeklyTonnage(userId);
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(twoWeeksAgo.getTime())),
        Q.where('start_time', Q.lte(oneWeekAgo.getTime()))
      )
      .fetch();

    let previousWeekVolume = 0;
    if (workouts.length > 0) {
      const workoutIds = workouts.map((w) => w.id);
      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
        .fetch();
      previousWeekVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    }

    // Calculate volume trend
    const volumeTrend = previousWeekVolume > 0
      ? ((lastWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
      : 0;

    // Get readiness score
    const readinessScore = await readinessService.getAverageReadiness(userId, 7);

    // Determine fatigue status
    let status: 'green' | 'yellow' | 'red';
    let message: string;

    if (volumeTrend > 20 || readinessScore < 60) {
      status = 'red';
      message = 'High fatigue detected - consider reducing volume or taking a deload';
    } else if (volumeTrend > 10 || readinessScore < 70) {
      status = 'yellow';
      message = 'Moderate fatigue - monitor recovery and adjust if needed';
    } else {
      status = 'green';
      message = 'Good recovery status - continue training as planned';
    }

    return {
      status,
      message,
      volumeTrend,
      readinessScore: readinessScore > 0 ? readinessScore : undefined,
    };
  }

  /**
   * Get volume statistics for display
   */
  async getVolumeStats(userId: string): Promise<{
    weeklyTonnage: number;
    dailyAverage: number;
    muscleGroupDistribution: MuscleGroupVolume[];
    fatigueIndicator: FatigueIndicator;
  }> {
    const weeklyTonnage = await this.calculateWeeklyTonnage(userId);
    const muscleGroupDistribution = await this.calculateMuscleGroupVolume(userId, 7);
    const fatigueIndicator = await this.calculateFatigueIndicator(userId);

    return {
      weeklyTonnage,
      dailyAverage: Math.round(weeklyTonnage / 7),
      muscleGroupDistribution,
      fatigueIndicator,
    };
  }
}

export const volumeService = new VolumeService();

