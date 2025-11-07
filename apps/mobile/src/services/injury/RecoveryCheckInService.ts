/**
 * RecoveryCheckInService
 * 
 * Service for weekly recovery check-ins and progress tracking.
 * Implements evidence-based recovery protocols from recovery_protocols.md.
 * 
 * Features:
 * - Weekly check-in timing logic (7+ days)
 * - Recovery progress calculation
 * - Plateau detection
 * - Escalation criteria (recommend medical consultation)
 * - Return-to-activity assessment
 */

import { InjuryLoggingService } from './InjuryLoggingService';
import InjuryLog from '../database/watermelon/models/InjuryLog';

export interface RecoveryCheckInData {
  painLevel: number; // 0-10 scale
  romQuality: 'better' | 'same' | 'worse'; // Range of motion
  activityTolerance: 'improving' | 'plateau' | 'declining';
  newSymptoms?: string;
}

export interface RecoveryProgressResult {
  progressScore: number; // 0.0-1.0
  status: 'improving' | 'plateau' | 'worsening' | 'resolved';
  recommendation: string;
  requiresMedicalAttention: boolean;
  daysInRecovery: number;
}

export class RecoveryCheckInService {
  /**
   * Process a weekly recovery check-in
   */
  static async processCheckIn(
    injuryId: string,
    checkInData: RecoveryCheckInData
  ): Promise<RecoveryProgressResult> {
    const injury = await InjuryLoggingService.getInjuryById(injuryId);
    if (!injury) {
      throw new Error('Injury not found');
    }

    // Update last check-in timestamp
    await InjuryLoggingService.updateLastCheckIn(injuryId);

    // Calculate days in recovery
    const daysInRecovery = this.calculateDaysInRecovery(injury);

    // Calculate progress score
    const progressScore = this.calculateProgressScore(checkInData, injury, daysInRecovery);

    // Determine recovery status
    const status = this.determineRecoveryStatus(checkInData, progressScore, daysInRecovery);

    // Check if medical attention required
    const requiresMedicalAttention = this.checkMedicalAttentionRequired(
      checkInData,
      status,
      daysInRecovery,
      injury.severity
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      status,
      requiresMedicalAttention,
      daysInRecovery,
      injury.severity
    );

    // Update injury status if resolved
    if (status === 'resolved') {
      await InjuryLoggingService.resolveInjury(injuryId);
    } else if (status === 'improving') {
      await InjuryLoggingService.updateInjuryStatus(injuryId, { status: 'recovering' });
    }

    return {
      progressScore,
      status,
      recommendation,
      requiresMedicalAttention,
      daysInRecovery,
    };
  }

  /**
   * Calculate days since injury was reported
   */
  private static calculateDaysInRecovery(injury: InjuryLog): number {
    const now = new Date();
    const reportedAt = injury.reportedAt;
    const diffMs = now.getTime() - reportedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate recovery progress score (0.0-1.0)
   * Based on recovery_protocols.md formula
   */
  private static calculateProgressScore(
    checkInData: RecoveryCheckInData,
    injury: InjuryLog,
    daysInRecovery: number
  ): number {
    // Pain reduction component (0.4 weight)
    // Assume initial pain was 7/10 for moderate, 5/10 for mild, 9/10 for severe
    const initialPain = injury.severity === 'severe' ? 9 : injury.severity === 'moderate' ? 7 : 5;
    const painReduction = Math.max(0, (initialPain - checkInData.painLevel) / initialPain);

    // ROM improvement component (0.3 weight)
    const romImprovement = checkInData.romQuality === 'better' ? 1.0 : 
                           checkInData.romQuality === 'same' ? 0.5 : 0.0;

    // Activity tolerance component (0.2 weight)
    const activityTolerance = checkInData.activityTolerance === 'improving' ? 1.0 :
                              checkInData.activityTolerance === 'plateau' ? 0.5 : 0.0;

    // Time-based component (0.1 weight)
    // Expected recovery time: mild=7 days, moderate=21 days, severe=60 days
    const expectedRecoveryDays = injury.severity === 'severe' ? 60 : 
                                 injury.severity === 'moderate' ? 21 : 7;
    const timeProgress = Math.min(1.0, daysInRecovery / expectedRecoveryDays);

    // Calculate weighted score
    const progressScore = (
      painReduction * 0.4 +
      romImprovement * 0.3 +
      activityTolerance * 0.2 +
      timeProgress * 0.1
    );

    return Math.min(1.0, Math.max(0.0, progressScore));
  }

  /**
   * Determine recovery status based on check-in data and progress
   */
  private static determineRecoveryStatus(
    checkInData: RecoveryCheckInData,
    progressScore: number,
    daysInRecovery: number
  ): 'improving' | 'plateau' | 'worsening' | 'resolved' {
    // Check for resolved (pain ≤1, ROM better, activity improving)
    if (
      checkInData.painLevel <= 1 &&
      checkInData.romQuality === 'better' &&
      checkInData.activityTolerance === 'improving'
    ) {
      return 'resolved';
    }

    // Check for worsening (pain increasing, ROM worse, or activity declining)
    if (
      checkInData.romQuality === 'worse' ||
      checkInData.activityTolerance === 'declining'
    ) {
      return 'worsening';
    }

    // Check for plateau (progress score < 0.3 after 2+ weeks)
    if (progressScore < 0.3 && daysInRecovery >= 14) {
      return 'plateau';
    }

    // Otherwise, improving
    return 'improving';
  }

  /**
   * Check if medical attention is required based on recovery protocols
   */
  private static checkMedicalAttentionRequired(
    checkInData: RecoveryCheckInData,
    status: 'improving' | 'plateau' | 'worsening' | 'resolved',
    daysInRecovery: number,
    severity: string
  ): boolean {
    // Red flags requiring immediate medical attention
    if (checkInData.painLevel >= 8) {
      return true;
    }

    // Worsening symptoms
    if (status === 'worsening') {
      return true;
    }

    // Plateau for 3+ weeks (21+ days)
    if (status === 'plateau' && daysInRecovery >= 21) {
      return true;
    }

    // Severe injury not improving after 2 weeks
    if (severity === 'severe' && daysInRecovery >= 14 && status !== 'improving') {
      return true;
    }

    // Moderate injury not improving after 4 weeks
    if (severity === 'moderate' && daysInRecovery >= 28 && status !== 'improving') {
      return true;
    }

    return false;
  }

  /**
   * Generate recommendation based on recovery status
   */
  private static generateRecommendation(
    status: 'improving' | 'plateau' | 'worsening' | 'resolved',
    requiresMedicalAttention: boolean,
    daysInRecovery: number,
    severity: string
  ): string {
    if (requiresMedicalAttention) {
      return 'Your symptoms suggest you should consult a healthcare provider (physician, physical therapist, or sports medicine specialist) for proper evaluation.';
    }

    switch (status) {
      case 'resolved':
        return 'Great progress! Your injury appears to be resolved. You can gradually return to full training. Monitor for any symptom recurrence.';

      case 'improving':
        return 'You\'re making good progress! Continue your current recovery approach and gradually increase activity as tolerated.';

      case 'plateau':
        if (daysInRecovery >= 14) {
          return 'Your recovery has plateaued. Consider consulting a physical therapist for guidance on progression strategies.';
        }
        return 'Your recovery progress has slowed. Focus on proper rest, nutrition, and gradual activity progression.';

      case 'worsening':
        return 'Your symptoms are worsening. Reduce activity level and consult a healthcare provider if symptoms don\'t improve within 48 hours.';

      default:
        return 'Continue monitoring your symptoms and check in weekly.';
    }
  }

  /**
   * Check if injury is ready for return-to-activity
   * Based on return-to-activity criteria from recovery_protocols.md
   */
  static async assessReturnToActivity(injuryId: string): Promise<{
    ready: boolean;
    criteria: {
      painCriteria: boolean; // Pain ≤1/10 at rest, ≤2/10 with activity
      romCriteria: boolean; // ≥90% of uninjured side
      functionalCriteria: boolean; // Can perform daily activities
    };
    recommendation: string;
  }> {
    const injury = await InjuryLoggingService.getInjuryById(injuryId);
    if (!injury) {
      throw new Error('Injury not found');
    }

    // For now, we'll use simplified criteria based on status
    // In a full implementation, this would use actual check-in data
    const ready = injury.status === 'resolved';

    return {
      ready,
      criteria: {
        painCriteria: ready,
        romCriteria: ready,
        functionalCriteria: ready,
      },
      recommendation: ready
        ? 'You meet the criteria for return to full training. Start with 50-75% of your previous volume and gradually increase over 2-3 weeks.'
        : 'Continue recovery and check in weekly. You\'ll be ready to return when pain is minimal and function is restored.',
    };
  }

  /**
   * Get recovery phase based on days in recovery
   * Based on recovery_protocols.md phases
   */
  static getRecoveryPhase(daysInRecovery: number): {
    phase: 'acute' | 'early_stage' | 'advanced';
    description: string;
    checkInFrequency: string;
  } {
    if (daysInRecovery <= 5) {
      return {
        phase: 'acute',
        description: 'Acute phase (0-5 days): Focus on protection and pain management',
        checkInFrequency: 'Daily self-assessment',
      };
    } else if (daysInRecovery <= 21) {
      return {
        phase: 'early_stage',
        description: 'Early-stage recovery (5-21 days): Progressive loading and mobility work',
        checkInFrequency: 'Every 3-5 days',
      };
    } else {
      return {
        phase: 'advanced',
        description: 'Advanced recovery (21+ days): Sport-specific training and return to activity',
        checkInFrequency: 'Weekly',
      };
    }
  }
}

