/**
 * Auto-Regulation Service
 * 
 * Implements RPE-based auto-regulation to adjust training load and volume
 * based on user readiness and performance.
 * 
 * Formula: ΔLoad = −10% × (RPE − TargetRPE)
 */

import { database } from '../database/watermelon/database';
import WorkoutLog from '../database/watermelon/models/WorkoutLog';
import Set from '../database/watermelon/models/Set';
import { readinessService } from '../readiness/ReadinessService';
import { Q } from '@nozbe/watermelondb';

export interface LoadAdjustment {
  shouldAdjust: boolean;
  adjustmentPercentage: number; // e.g., -10 for 10% reduction, +5 for 5% increase
  reason: string;
  recommendedAction: string;
}

export interface AutoRegulationTrigger {
  triggered: boolean;
  reasons: string[];
  readinessScore?: number;
  recentRPEs?: number[];
}

class AutoRegulationService {
  private readonly TARGET_RPE = 7.5; // Target RPE for most training
  private readonly HIGH_RPE_THRESHOLD = 8.5; // RPE threshold for fatigue
  private readonly LOW_READINESS_THRESHOLD = 70; // Readiness threshold (0-100)
  private readonly ADJUSTMENT_FACTOR = 0.10; // 10% adjustment per RPE point

  /**
   * Calculate load adjustment based on RPE
   * Formula: ΔLoad = −10% × (RPE − TargetRPE)
   * 
   * @param currentRPE - Current RPE (1-10 scale)
   * @param targetRPE - Target RPE (default 7.5)
   * @returns Adjustment percentage (negative = reduce, positive = increase)
   */
  calculateLoadAdjustment(currentRPE: number, targetRPE: number = this.TARGET_RPE): LoadAdjustment {
    if (currentRPE < 1 || currentRPE > 10) {
      throw new Error('RPE must be between 1 and 10');
    }

    const rpeDifference = currentRPE - targetRPE;
    const adjustmentPercentage = -this.ADJUSTMENT_FACTOR * 100 * rpeDifference;

    let reason = '';
    let recommendedAction = '';
    let shouldAdjust = false;

    if (rpeDifference > 1) {
      // RPE too high - reduce load
      shouldAdjust = true;
      reason = `Your recent workouts have been too challenging (RPE ${currentRPE} vs target ${targetRPE})`;
      recommendedAction = `Reduce weight by ${Math.abs(adjustmentPercentage).toFixed(0)}% to prevent overtraining`;
    } else if (rpeDifference < -1) {
      // RPE too low - increase load
      shouldAdjust = true;
      reason = `Your workouts are not challenging enough (RPE ${currentRPE} vs target ${targetRPE})`;
      recommendedAction = `Increase weight by ${adjustmentPercentage.toFixed(0)}% for better progress`;
    } else {
      // RPE in acceptable range
      reason = `Your training intensity is optimal (RPE ${currentRPE})`;
      recommendedAction = 'Continue with current load';
    }

    return {
      shouldAdjust,
      adjustmentPercentage: Math.round(adjustmentPercentage),
      reason,
      recommendedAction,
    };
  }

  /**
   * Check if auto-regulation should be triggered
   * Triggers if:
   * 1. Readiness < 70% for 2+ consecutive days, OR
   * 2. RPE > 8.5 for 3+ consecutive workouts
   */
  async shouldTriggerAutoRegulation(userId: string): Promise<AutoRegulationTrigger> {
    const reasons: string[] = [];
    let triggered = false;

    // Check 1: Low readiness for 2+ days
    const recentReadiness = await readinessService.getRecentReadinessScores(userId, 7);
    if (recentReadiness.length >= 2) {
      const lastTwoDays = recentReadiness.slice(0, 2);
      const bothLow = lastTwoDays.every((score) => score.score < this.LOW_READINESS_THRESHOLD);
      
      if (bothLow) {
        triggered = true;
        const avgScore = Math.round(
          lastTwoDays.reduce((sum, s) => sum + s.score, 0) / lastTwoDays.length
        );
        reasons.push(
          `Low readiness for 2+ days (${avgScore}% average). Your body needs recovery.`
        );
      }
    }

    // Check 2: High RPE for 3+ workouts
    const recentWorkouts = await this.getRecentWorkouts(userId, 7);
    if (recentWorkouts.length >= 3) {
      const lastThreeWorkouts = recentWorkouts.slice(0, 3);
      const avgRPE = await this.calculateAverageRPE(lastThreeWorkouts);
      
      if (avgRPE > this.HIGH_RPE_THRESHOLD) {
        triggered = true;
        reasons.push(
          `High training intensity for 3+ workouts (RPE ${avgRPE.toFixed(1)}). Risk of overtraining.`
        );
      }
    }

    // Check 3: Declining readiness trend
    const isReadinessDeclining = await readinessService.isReadinessDeclining(userId);
    if (isReadinessDeclining) {
      triggered = true;
      reasons.push('Your readiness is trending downward. Consider reducing training load.');
    }

    return {
      triggered,
      reasons,
      readinessScore: recentReadiness.length > 0 ? recentReadiness[0].score : undefined,
      recentRPEs: recentWorkouts.length > 0 ? await this.getRecentRPEs(recentWorkouts) : undefined,
    };
  }

  /**
   * Get recent workouts for a user
   */
  private async getRecentWorkouts(userId: string, days: number = 7): Promise<WorkoutLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime())),
        Q.sortBy('start_time', Q.desc)
      )
      .fetch();

    return workouts;
  }

  /**
   * Calculate average RPE from recent workouts
   */
  private async calculateAverageRPE(workouts: WorkoutLog[]): Promise<number> {
    if (workouts.length === 0) return 0;

    // Get all sets from these workouts
    const workoutIds = workouts.map((w) => w.id);
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
      .fetch();

    if (sets.length === 0) return 0;

    // Calculate average RPE from sets that have RPE recorded
    const setsWithRPE = sets.filter((s) => s.rpe && s.rpe > 0);
    if (setsWithRPE.length === 0) return 0;

    const totalRPE = setsWithRPE.reduce((sum, s) => sum + (s.rpe || 0), 0);
    return totalRPE / setsWithRPE.length;
  }

  /**
   * Get recent RPE values
   */
  private async getRecentRPEs(workouts: WorkoutLog[]): Promise<number[]> {
    const workoutIds = workouts.map((w) => w.id);
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
      .fetch();

    const setsWithRPE = sets.filter((s) => s.rpe && s.rpe > 0);
    return setsWithRPE.map((s) => s.rpe || 0);
  }

  /**
   * Apply load adjustment to a weight value
   */
  applyLoadAdjustment(currentWeight: number, adjustmentPercentage: number): number {
    const adjustment = currentWeight * (adjustmentPercentage / 100);
    const newWeight = currentWeight + adjustment;
    
    // Round to nearest 2.5 lbs (common plate increment)
    return Math.round(newWeight / 2.5) * 2.5;
  }

  /**
   * Get recommended load for next workout
   */
  async getRecommendedLoad(
    userId: string,
    exerciseId: string,
    currentWeight: number
  ): Promise<{ weight: number; adjustment: LoadAdjustment }> {
    // Get recent workouts for this exercise
    const recentWorkouts = await this.getRecentWorkouts(userId, 14);
    const workoutIds = recentWorkouts.map((w) => w.id);

    // Get sets for this exercise
    const sets = await database
      .get<Set>('sets')
      .query(
        Q.where('workout_log_id', Q.oneOf(workoutIds)),
        Q.where('exercise_id', exerciseId),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();

    if (sets.length === 0) {
      return {
        weight: currentWeight,
        adjustment: {
          shouldAdjust: false,
          adjustmentPercentage: 0,
          reason: 'No recent data for this exercise',
          recommendedAction: 'Continue with current weight',
        },
      };
    }

    // Calculate average RPE for this exercise
    const setsWithRPE = sets.filter((s) => s.rpe && s.rpe > 0);
    if (setsWithRPE.length === 0) {
      return {
        weight: currentWeight,
        adjustment: {
          shouldAdjust: false,
          adjustmentPercentage: 0,
          reason: 'No RPE data available',
          recommendedAction: 'Continue with current weight',
        },
      };
    }

    const avgRPE = setsWithRPE.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRPE.length;
    const adjustment = this.calculateLoadAdjustment(avgRPE);

    const recommendedWeight = this.applyLoadAdjustment(currentWeight, adjustment.adjustmentPercentage);

    return {
      weight: recommendedWeight,
      adjustment,
    };
  }
}

export const autoRegulationService = new AutoRegulationService();

