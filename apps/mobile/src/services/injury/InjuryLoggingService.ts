/**
 * InjuryLoggingService
 * 
 * Service for CRUD operations on injury logs.
 * Handles WatermelonDB storage and Supabase sync for injury tracking.
 * 
 * Features:
 * - Create injury logs
 * - Query active injuries
 * - Update injury status
 * - Mark injuries as resolved
 * - Sync with Supabase
 */

import { database } from '../database/watermelon/database';
import InjuryLog from '../database/watermelon/models/InjuryLog';
import { Q } from '@nozbe/watermelondb';

export interface CreateInjuryLogParams {
  userId: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  status?: 'active' | 'recovering' | 'resolved';
}

export interface UpdateInjuryStatusParams {
  status: 'active' | 'recovering' | 'resolved';
  resolvedAt?: Date;
}

export class InjuryLoggingService {
  /**
   * Create a new injury log
   */
  static async createInjuryLog(params: CreateInjuryLogParams): Promise<InjuryLog> {
    const injuryLogsCollection = database.get<InjuryLog>('injury_logs');

    const injuryLog = await database.write(async () => {
      return await injuryLogsCollection.create(injury => {
        injury.userId = params.userId;
        injury.bodyPart = params.bodyPart;
        injury.severity = params.severity;
        injury.description = params.description || '';
        injury.status = params.status || 'active';
        injury.reportedAt = new Date();
        injury.synced = false;
      });
    });

    return injuryLog;
  }

  /**
   * Get all active injuries for a user
   */
  static async getActiveInjuries(userId: string): Promise<InjuryLog[]> {
    const injuryLogsCollection = database.get<InjuryLog>('injury_logs');

    const activeInjuries = await injuryLogsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', Q.oneOf(['active', 'recovering'])),
        Q.sortBy('reported_at', Q.desc)
      )
      .fetch();

    return activeInjuries;
  }

  /**
   * Get all injuries for a user (including resolved)
   */
  static async getAllInjuries(userId: string): Promise<InjuryLog[]> {
    const injuryLogsCollection = database.get<InjuryLog>('injury_logs');

    const allInjuries = await injuryLogsCollection
      .query(
        Q.where('user_id', userId),
        Q.sortBy('reported_at', Q.desc)
      )
      .fetch();

    return allInjuries;
  }

  /**
   * Get a specific injury by ID
   */
  static async getInjuryById(injuryId: string): Promise<InjuryLog | null> {
    try {
      const injuryLogsCollection = database.get<InjuryLog>('injury_logs');
      const injury = await injuryLogsCollection.find(injuryId);
      return injury;
    } catch (error) {
      console.error('Error fetching injury by ID:', error);
      return null;
    }
  }

  /**
   * Update injury status
   */
  static async updateInjuryStatus(
    injuryId: string,
    params: UpdateInjuryStatusParams
  ): Promise<InjuryLog | null> {
    try {
      const injury = await this.getInjuryById(injuryId);
      if (!injury) {
        console.error('Injury not found:', injuryId);
        return null;
      }

      const updatedInjury = await database.write(async () => {
        return await injury.update(record => {
          record.status = params.status;
          if (params.resolvedAt) {
            record.resolvedAt = params.resolvedAt;
          }
          record.synced = false;
        });
      });

      return updatedInjury;
    } catch (error) {
      console.error('Error updating injury status:', error);
      return null;
    }
  }

  /**
   * Mark injury as resolved
   */
  static async resolveInjury(injuryId: string): Promise<InjuryLog | null> {
    return this.updateInjuryStatus(injuryId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }

  /**
   * Update last check-in timestamp for weekly recovery check-ins
   */
  static async updateLastCheckIn(injuryId: string): Promise<InjuryLog | null> {
    try {
      const injury = await this.getInjuryById(injuryId);
      if (!injury) {
        console.error('Injury not found:', injuryId);
        return null;
      }

      const updatedInjury = await database.write(async () => {
        return await injury.update(record => {
          record.lastCheckInAt = new Date();
          record.synced = false;
        });
      });

      return updatedInjury;
    } catch (error) {
      console.error('Error updating last check-in:', error);
      return null;
    }
  }

  /**
   * Check if user should be prompted for weekly check-in
   * Returns injuries that need check-in (7+ days since last check-in)
   */
  static async getInjuriesNeedingCheckIn(userId: string): Promise<InjuryLog[]> {
    const activeInjuries = await this.getActiveInjuries(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return activeInjuries.filter(injury => {
      // If never checked in, use reported_at as baseline
      const lastCheckIn = injury.lastCheckInAt || injury.reportedAt;
      return lastCheckIn < sevenDaysAgo;
    });
  }

  /**
   * Delete an injury log (soft delete by marking as resolved)
   */
  static async deleteInjury(injuryId: string): Promise<boolean> {
    try {
      const injury = await this.getInjuryById(injuryId);
      if (!injury) {
        console.error('Injury not found:', injuryId);
        return false;
      }

      await database.write(async () => {
        await injury.markAsDeleted();
      });

      return true;
    } catch (error) {
      console.error('Error deleting injury:', error);
      return false;
    }
  }

  /**
   * Get injury count by severity for analytics
   */
  static async getInjuryCountBySeverity(userId: string): Promise<{
    mild: number;
    moderate: number;
    severe: number;
  }> {
    const allInjuries = await this.getAllInjuries(userId);

    return {
      mild: allInjuries.filter(i => i.severity === 'mild').length,
      moderate: allInjuries.filter(i => i.severity === 'moderate').length,
      severe: allInjuries.filter(i => i.severity === 'severe').length,
    };
  }

  /**
   * Get injury count by body part for analytics
   */
  static async getInjuryCountByBodyPart(userId: string): Promise<Record<string, number>> {
    const allInjuries = await this.getAllInjuries(userId);
    const counts: Record<string, number> = {};

    allInjuries.forEach(injury => {
      counts[injury.bodyPart] = (counts[injury.bodyPart] || 0) + 1;
    });

    return counts;
  }

  /**
   * Calculate average recovery time for resolved injuries
   */
  static async getAverageRecoveryTime(userId: string): Promise<number | null> {
    const injuryLogsCollection = database.get<InjuryLog>('injury_logs');

    const resolvedInjuries = await injuryLogsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'resolved'),
        Q.where('resolved_at', Q.notEq(null))
      )
      .fetch();

    if (resolvedInjuries.length === 0) {
      return null;
    }

    const totalRecoveryTime = resolvedInjuries.reduce((sum, injury) => {
      if (injury.resolvedAt) {
        const recoveryTime = injury.resolvedAt.getTime() - injury.reportedAt.getTime();
        return sum + recoveryTime;
      }
      return sum;
    }, 0);

    const averageMs = totalRecoveryTime / resolvedInjuries.length;
    const averageDays = averageMs / (1000 * 60 * 60 * 24);

    return Math.round(averageDays);
  }
}

