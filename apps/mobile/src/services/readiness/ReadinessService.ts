/**
 * Readiness Service
 * 
 * Calculates and manages user readiness scores for training.
 * Supports both simple (emoji-based) and detailed (slider-based) assessments.
 */

import { database } from '../database/watermelon/database';
import ReadinessScore from '../database/watermelon/models/ReadinessScore';
import { Q } from '@nozbe/watermelondb';

export type ReadinessType = 'simple' | 'detailed';

export interface SimpleReadinessInput {
  emoji: '😊' | '😐' | '😓';
}

export interface DetailedReadinessInput {
  sleepQuality: number; // 1-10
  soreness: number; // 1-10
  stress: number; // 1-10
  energy: number; // 1-10
}

export interface ReadinessScoreData {
  score: number; // 0-100
  type: ReadinessType;
  emoji?: string;
  sleepQuality?: number;
  soreness?: number;
  stress?: number;
  energy?: number;
  notes?: string; // Phase 3: User notes for injury detection
}

class ReadinessService {
  /**
   * Calculate simple readiness score from emoji selection
   * Free tier feature
   */
  calculateSimpleReadiness(input: SimpleReadinessInput): ReadinessScoreData {
    const emojiScores: Record<string, number> = {
      '😊': 85, // Great - high readiness
      '😐': 60, // OK - moderate readiness
      '😓': 35, // Tired - low readiness
    };

    const score = emojiScores[input.emoji] || 60;

    return {
      score,
      type: 'simple',
      emoji: input.emoji,
    };
  }

  /**
   * Calculate detailed readiness score from slider inputs
   * Premium tier feature
   * 
   * Formula: R = 0.3×Sleep + 0.25×(10-Soreness) + 0.2×(10-Stress) + 0.25×Energy
   * Normalized to 0-100 scale
   */
  calculateDetailedReadiness(input: DetailedReadinessInput): ReadinessScoreData {
    const { sleepQuality, soreness, stress, energy } = input;

    // Validate inputs (1-10 scale)
    if (
      sleepQuality < 1 || sleepQuality > 10 ||
      soreness < 1 || soreness > 10 ||
      stress < 1 || stress > 10 ||
      energy < 1 || energy > 10
    ) {
      throw new Error('All inputs must be between 1 and 10');
    }

    // Calculate composite score
    // Higher sleep and energy = better
    // Lower soreness and stress = better
    const score = Math.round(
      (0.3 * sleepQuality * 10) +
      (0.25 * (10 - soreness) * 10) +
      (0.2 * (10 - stress) * 10) +
      (0.25 * energy * 10)
    );

    return {
      score: Math.min(100, Math.max(0, score)), // Clamp to 0-100
      type: 'detailed',
      sleepQuality,
      soreness,
      stress,
      energy,
    };
  }

  /**
   * Save readiness score to database
   */
  async saveReadinessScore(
    userId: string,
    scoreData: ReadinessScoreData
  ): Promise<ReadinessScore> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Check if score already exists for today
    const existingScores = await database
      .get<ReadinessScore>('readiness_scores')
      .query(
        Q.where('user_id', userId),
        Q.where('date', today.getTime())
      )
      .fetch();

    if (existingScores.length > 0) {
      // Update existing score
      const existingScore = existingScores[0];
      await database.write(async () => {
        await existingScore.update((record) => {
          record.score = scoreData.score;
          record.type = scoreData.type;
          record.emoji = scoreData.emoji;
          record.sleepQuality = scoreData.sleepQuality;
          record.soreness = scoreData.soreness;
          record.stress = scoreData.stress;
          record.energy = scoreData.energy;
          record.notes = scoreData.notes; // Phase 3: Save injury notes
          record.synced = false;
        });
      });
      return existingScore;
    }

    // Create new score
    const newScore = await database.write(async () => {
      return await database.get<ReadinessScore>('readiness_scores').create((record) => {
        record.userId = userId;
        record.date = today;
        record.score = scoreData.score;
        record.type = scoreData.type;
        record.emoji = scoreData.emoji;
        record.sleepQuality = scoreData.sleepQuality;
        record.soreness = scoreData.soreness;
        record.stress = scoreData.stress;
        record.energy = scoreData.energy;
        record.notes = scoreData.notes; // Phase 3: Save injury notes
        record.synced = false;
      });
    });

    return newScore;
  }

  /**
   * Get today's readiness score
   */
  async getTodayReadinessScore(userId: string): Promise<ReadinessScore | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scores = await database
      .get<ReadinessScore>('readiness_scores')
      .query(
        Q.where('user_id', userId),
        Q.where('date', today.getTime())
      )
      .fetch();

    return scores.length > 0 ? scores[0] : null;
  }

  /**
   * Get readiness scores for the last N days
   */
  async getRecentReadinessScores(
    userId: string,
    days: number = 7
  ): Promise<ReadinessScore[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const scores = await database
      .get<ReadinessScore>('readiness_scores')
      .query(
        Q.where('user_id', userId),
        Q.where('date', Q.gte(startDate.getTime())),
        Q.sortBy('date', Q.desc)
      )
      .fetch();

    return scores;
  }

  /**
   * Get average readiness score for the last N days
   */
  async getAverageReadiness(userId: string, days: number = 7): Promise<number> {
    const scores = await this.getRecentReadinessScores(userId, days);
    
    if (scores.length === 0) return 0;

    const sum = scores.reduce((acc, score) => acc + score.score, 0);
    return Math.round(sum / scores.length);
  }

  /**
   * Check if readiness is trending down (potential fatigue)
   */
  async isReadinessDeclining(userId: string): Promise<boolean> {
    const scores = await this.getRecentReadinessScores(userId, 7);
    
    if (scores.length < 3) return false;

    // Check if last 2 days are significantly lower than average
    const recentScores = scores.slice(0, 2);
    const olderScores = scores.slice(2);

    const recentAvg = recentScores.reduce((acc, s) => acc + s.score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((acc, s) => acc + s.score, 0) / olderScores.length;

    // Declining if recent average is 15+ points lower
    return recentAvg < olderAvg - 15;
  }
}

export const readinessService = new ReadinessService();

