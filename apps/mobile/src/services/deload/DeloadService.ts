/**
 * Deload Service
 * 
 * Implements deload detection and programming logic.
 * Deloads are recovery weeks with reduced volume (40-60%) and maintained intensity (85-90%).
 * 
 * Triggers:
 * - Volume increase > 20% over 2 weeks
 * - RPE > 8.5 for 3+ consecutive workouts
 * - Declining readiness trend
 * - Programmed deload weeks (weeks 4, 8, 12)
 */

import { database } from '../database/watermelon/database';
import WorkoutLog from '../database/watermelon/models/WorkoutLog';
import Set from '../database/watermelon/models/Set';
import { readinessService } from '../readiness/ReadinessService';
import { Q } from '@nozbe/watermelondb';

export interface FatigueAssessment {
  isFatigued: boolean;
  reasons: string[];
  volumeIncrease?: number;
  averageRPE?: number;
  readinessScore?: number;
  recommendDeload: boolean;
}

export interface DeloadPrescription {
  volumeReduction: number; // Percentage (40-60%)
  intensityMaintenance: number; // Percentage (85-90%)
  duration: number; // Days (typically 7)
  reason: string;
}

class DeloadService {
  private readonly VOLUME_INCREASE_THRESHOLD = 0.20; // 20% increase
  private readonly HIGH_RPE_THRESHOLD = 8.5;
  private readonly LOW_READINESS_THRESHOLD = 70;
  private readonly DELOAD_VOLUME_MIN = 0.40; // 40% of normal volume
  private readonly DELOAD_VOLUME_MAX = 0.60; // 60% of normal volume
  private readonly DELOAD_INTENSITY_MIN = 0.85; // 85% of normal intensity

  /**
   * Assess fatigue levels and determine if deload is needed
   */
  async assessFatigue(userId: string): Promise<FatigueAssessment> {
    const reasons: string[] = [];
    let isFatigued = false;

    // Check 1: Volume increase > 20% over last 2 weeks
    const volumeIncrease = await this.calculateVolumeIncrease(userId);
    if (volumeIncrease > this.VOLUME_INCREASE_THRESHOLD) {
      isFatigued = true;
      reasons.push(
        `Training volume increased by ${(volumeIncrease * 100).toFixed(0)}% over the last 2 weeks`
      );
    }

    // Check 2: High RPE for 3+ consecutive workouts
    const avgRPE = await this.getRecentAverageRPE(userId, 3);
    if (avgRPE > this.HIGH_RPE_THRESHOLD) {
      isFatigued = true;
      reasons.push(
        `High training intensity for recent workouts (RPE ${avgRPE.toFixed(1)})`
      );
    }

    // Check 3: Declining readiness trend
    const isReadinessDeclining = await readinessService.isReadinessDeclining(userId);
    if (isReadinessDeclining) {
      isFatigued = true;
      reasons.push('Your readiness scores are trending downward');
    }

    // Check 4: Low readiness score
    const currentReadiness = await readinessService.getTodayReadinessScore(userId);
    if (currentReadiness && currentReadiness.score < this.LOW_READINESS_THRESHOLD) {
      isFatigued = true;
      reasons.push(
        `Low readiness score (${currentReadiness.score}%)`
      );
    }

    return {
      isFatigued,
      reasons,
      volumeIncrease: volumeIncrease > 0 ? volumeIncrease : undefined,
      averageRPE: avgRPE > 0 ? avgRPE : undefined,
      readinessScore: currentReadiness?.score,
      recommendDeload: isFatigued && reasons.length >= 2, // Recommend deload if 2+ fatigue indicators
    };
  }

  /**
   * Calculate volume increase over last 2 weeks
   */
  private async calculateVolumeIncrease(userId: string): Promise<number> {
    const now = new Date();
    
    // Get volume from 2 weeks ago (weeks 3-4)
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const oldVolume = await this.calculateVolumeForPeriod(userId, fourWeeksAgo, twoWeeksAgo);

    // Get volume from last 2 weeks (weeks 1-2)
    const recentVolume = await this.calculateVolumeForPeriod(userId, twoWeeksAgo, now);

    if (oldVolume === 0) return 0;

    return (recentVolume - oldVolume) / oldVolume;
  }

  /**
   * Calculate total volume for a time period
   */
  private async calculateVolumeForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime())),
        Q.where('start_time', Q.lte(endDate.getTime()))
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
   * Get average RPE from recent workouts
   */
  private async getRecentAverageRPE(userId: string, workoutCount: number): Promise<number> {
    const workouts = await database
      .get<WorkoutLog>('workout_logs')
      .query(
        Q.where('user_id', userId),
        Q.sortBy('start_time', Q.desc),
        Q.take(workoutCount)
      )
      .fetch();

    if (workouts.length === 0) return 0;

    const workoutIds = workouts.map((w) => w.id);
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
      .fetch();

    const setsWithRPE = sets.filter((s) => s.rpe && s.rpe > 0);
    if (setsWithRPE.length === 0) return 0;

    const totalRPE = setsWithRPE.reduce((sum, s) => sum + (s.rpe || 0), 0);
    return totalRPE / setsWithRPE.length;
  }

  /**
   * Calculate deload volume prescription
   * Returns volume reduction percentage (40-60% of normal)
   */
  calculateDeloadVolume(fatigueLevel: 'low' | 'moderate' | 'high'): DeloadPrescription {
    let volumeReduction: number;
    let reason: string;

    switch (fatigueLevel) {
      case 'high':
        volumeReduction = this.DELOAD_VOLUME_MIN; // 40% of normal (60% reduction)
        reason = 'High fatigue detected - significant volume reduction recommended';
        break;
      case 'moderate':
        volumeReduction = 0.50; // 50% of normal (50% reduction)
        reason = 'Moderate fatigue detected - moderate volume reduction recommended';
        break;
      case 'low':
      default:
        volumeReduction = this.DELOAD_VOLUME_MAX; // 60% of normal (40% reduction)
        reason = 'Preventive deload - light volume reduction recommended';
        break;
    }

    return {
      volumeReduction,
      intensityMaintenance: this.DELOAD_INTENSITY_MIN, // 85% intensity
      duration: 7, // 1 week
      reason,
    };
  }

  /**
   * Determine fatigue level based on assessment
   */
  determineFatigueLevel(assessment: FatigueAssessment): 'low' | 'moderate' | 'high' {
    const indicatorCount = assessment.reasons.length;

    if (indicatorCount >= 3) return 'high';
    if (indicatorCount === 2) return 'moderate';
    return 'low';
  }

  /**
   * Check if user is in a programmed deload week
   * Programmed deloads occur at weeks 4, 8, 12, etc.
   */
  async isProgrammedDeloadWeek(_userId: string, programStartDate: Date): Promise<boolean> {
    const now = new Date();
    const weeksSinceStart = Math.floor(
      (now.getTime() - programStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Deload every 4 weeks
    return weeksSinceStart > 0 && weeksSinceStart % 4 === 0;
  }

  /**
   * Apply deload prescription to a workout
   * Reduces volume while maintaining intensity
   */
  applyDeloadToWorkout(
    originalSets: number,
    originalWeight: number,
    prescription: DeloadPrescription
  ): { sets: number; weight: number } {
    // Reduce sets (volume)
    const deloadSets = Math.max(1, Math.round(originalSets * prescription.volumeReduction));

    // Maintain intensity (weight)
    const deloadWeight = Math.round(originalWeight * prescription.intensityMaintenance);

    return {
      sets: deloadSets,
      weight: deloadWeight,
    };
  }

  /**
   * Get recommended deload prescription for user
   */
  async getDeloadRecommendation(userId: string): Promise<{
    shouldDeload: boolean;
    prescription?: DeloadPrescription;
    assessment: FatigueAssessment;
  }> {
    const assessment = await this.assessFatigue(userId);

    if (!assessment.recommendDeload) {
      return {
        shouldDeload: false,
        assessment,
      };
    }

    const fatigueLevel = this.determineFatigueLevel(assessment);
    const prescription = this.calculateDeloadVolume(fatigueLevel);

    return {
      shouldDeload: true,
      prescription,
      assessment,
    };
  }
}

export const deloadService = new DeloadService();

