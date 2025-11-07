/**
 * PR (Personal Record) Service
 * 
 * Implements 1RM calculation, PR detection, and prediction.
 * Uses Epley formula for 1RM estimation: 1RM = weight × (1 + reps/30)
 */

import { database } from '../database/watermelon/database';
import PRHistory from '../database/watermelon/models/PRHistory';
import Set from '../database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';

export interface PRData {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  oneRM: number;
  achievedAt: Date;
  workoutLogId: string;
}

export interface PRPrediction {
  weeks: number;
  predictedOneRM: number;
  predictedWeight: number;
  predictedReps: number;
}

class PRService {
  /**
   * Calculate 1RM using Epley formula
   * Formula: 1RM = weight × (1 + reps/30)
   * 
   * @param weight - Weight lifted (lbs)
   * @param reps - Number of reps completed
   * @returns Estimated 1RM
   */
  calculate1RM(weight: number, reps: number): number {
    if (reps === 1) {
      return weight; // Actual 1RM
    }

    // Epley formula
    const oneRM = weight * (1 + reps / 30);
    return Math.round(oneRM * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Detect if a new PR was achieved
   * Compares current 1RM with historical PRs for the exercise
   */
  async detectNewPR(
    userId: string,
    exerciseId: string,
    exerciseName: string,
    weight: number,
    reps: number,
    workoutLogId: string
  ): Promise<{ isNewPR: boolean; prData?: PRData; previousPR?: number }> {
    const currentOneRM = this.calculate1RM(weight, reps);

    // Get historical PRs for this exercise
    const historicalPRs = await database
      .get<PRHistory>('pr_history')
      .query(
        Q.where('user_id', userId),
        Q.where('exercise_id', exerciseId),
        Q.sortBy('one_rm', Q.desc)
      )
      .fetch();

    const previousBest = historicalPRs.length > 0 ? historicalPRs[0].oneRM : 0;

    if (currentOneRM > previousBest) {
      const prData: PRData = {
        exerciseId,
        exerciseName,
        weight,
        reps,
        oneRM: currentOneRM,
        achievedAt: new Date(),
        workoutLogId,
      };

      return {
        isNewPR: true,
        prData,
        previousPR: previousBest > 0 ? previousBest : undefined,
      };
    }

    return {
      isNewPR: false,
      previousPR: previousBest > 0 ? previousBest : undefined,
    };
  }

  /**
   * Save PR to database
   */
  async savePR(userId: string, prData: PRData): Promise<PRHistory> {
    const newPR = await database.write(async () => {
      return await database.get<PRHistory>('pr_history').create((record) => {
        record.userId = userId;
        record.exerciseId = prData.exerciseId;
        record.exerciseName = prData.exerciseName;
        record.oneRM = prData.oneRM;
        record.weight = prData.weight;
        record.reps = prData.reps;
        record.workoutLogId = prData.workoutLogId;
        record.achievedAt = prData.achievedAt;
        record.synced = false;
      });
    });

    console.log(`🎉 New PR saved: ${prData.exerciseName} - ${prData.oneRM} lbs (${prData.weight}x${prData.reps})`);
    return newPR;
  }

  /**
   * Get current PR for an exercise
   */
  async getCurrentPR(userId: string, exerciseId: string): Promise<PRHistory | null> {
    const prs = await database
      .get<PRHistory>('pr_history')
      .query(
        Q.where('user_id', userId),
        Q.where('exercise_id', exerciseId),
        Q.sortBy('one_rm', Q.desc),
        Q.take(1)
      )
      .fetch();

    return prs.length > 0 ? prs[0] : null;
  }

  /**
   * Get all PRs for a user
   */
  async getAllPRs(userId: string): Promise<PRHistory[]> {
    // Get all PRs, grouped by exercise (only the best for each)
    const allPRs = await database
      .get<PRHistory>('pr_history')
      .query(
        Q.where('user_id', userId),
        Q.sortBy('achieved_at', Q.desc)
      )
      .fetch();

    // Group by exercise and keep only the best PR for each
    const prsByExercise = new Map<string, PRHistory>();
    
    for (const pr of allPRs) {
      const existing = prsByExercise.get(pr.exerciseId);
      if (!existing || pr.oneRM > existing.oneRM) {
        prsByExercise.set(pr.exerciseId, pr);
      }
    }

    return Array.from(prsByExercise.values()).sort((a, b) => 
      b.achievedAt.getTime() - a.achievedAt.getTime()
    );
  }

  /**
   * Get PR history for an exercise
   */
  async getPRHistory(userId: string, exerciseId: string): Promise<PRHistory[]> {
    const history = await database
      .get<PRHistory>('pr_history')
      .query(
        Q.where('user_id', userId),
        Q.where('exercise_id', exerciseId),
        Q.sortBy('achieved_at', Q.desc)
      )
      .fetch();

    return history;
  }

  /**
   * Predict future PR using linear regression
   * Returns predictions for 4, 8, and 12 weeks
   */
  async predictFuturePR(userId: string, exerciseId: string): Promise<PRPrediction[]> {
    const history = await this.getPRHistory(userId, exerciseId);

    if (history.length < 2) {
      // Not enough data for prediction
      return [];
    }

    // Convert dates to weeks since first PR
    const firstDate = history[history.length - 1].achievedAt.getTime();
    const dataPoints = history.map((pr) => ({
      weeks: (pr.achievedAt.getTime() - firstDate) / (7 * 24 * 60 * 60 * 1000),
      oneRM: pr.oneRM,
    }));

    // Simple linear regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.weeks, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.oneRM, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.weeks * p.oneRM, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.weeks * p.weeks, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Current week
    const currentWeek = (new Date().getTime() - firstDate) / (7 * 24 * 60 * 60 * 1000);

    // Predict for 4, 8, and 12 weeks from now
    const predictions: PRPrediction[] = [4, 8, 12].map((weeks) => {
      const futureWeek = currentWeek + weeks;
      const predictedOneRM = slope * futureWeek + intercept;

      // Convert predicted 1RM back to weight/reps (assume 5 reps)
      const predictedWeight = this.calculateWeightForReps(predictedOneRM, 5);

      return {
        weeks,
        predictedOneRM: Math.round(predictedOneRM * 10) / 10,
        predictedWeight: Math.round(predictedWeight),
        predictedReps: 5,
      };
    });

    return predictions;
  }

  /**
   * Calculate weight needed for target reps given a 1RM
   * Inverse of Epley formula: weight = 1RM / (1 + reps/30)
   */
  private calculateWeightForReps(oneRM: number, reps: number): number {
    if (reps === 1) {
      return oneRM;
    }

    return oneRM / (1 + reps / 30);
  }

  /**
   * Check for PRs in a completed workout
   * Returns array of new PRs detected
   */
  async checkWorkoutForPRs(
    userId: string,
    workoutLogId: string
  ): Promise<PRData[]> {
    // Get all sets from the workout
    const sets = await database
      .get<Set>('sets')
      .query(Q.where('workout_log_id', workoutLogId))
      .fetch();

    const newPRs: PRData[] = [];

    // Group sets by exercise
    const setsByExercise = new Map<string, Set[]>();
    for (const set of sets) {
      const existing = setsByExercise.get(set.exerciseId) || [];
      existing.push(set);
      setsByExercise.set(set.exerciseId, existing);
    }

    // Check each exercise for PRs
    for (const [exerciseId, exerciseSets] of setsByExercise) {
      // Find the best set (highest estimated 1RM)
      let bestSet = exerciseSets[0];
      let bestOneRM = this.calculate1RM(bestSet.weight, bestSet.reps);

      for (const set of exerciseSets) {
        const oneRM = this.calculate1RM(set.weight, set.reps);
        if (oneRM > bestOneRM) {
          bestSet = set;
          bestOneRM = oneRM;
        }
      }

      // Check if it's a new PR
      const result = await this.detectNewPR(
        userId,
        exerciseId,
        bestSet.exerciseName,
        bestSet.weight,
        bestSet.reps,
        workoutLogId
      );

      if (result.isNewPR && result.prData) {
        // Save the PR
        await this.savePR(userId, result.prData);
        newPRs.push(result.prData);
      }
    }

    return newPRs;
  }
}

export const prService = new PRService();

