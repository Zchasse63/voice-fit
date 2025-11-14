/**
 * Analytics API Client
 *
 * Client for analytics-related endpoints:
 * - Volume tracking and trends
 * - Fatigue monitoring
 * - Deload recommendations
 */

import { apiClient, APIError } from './config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface VolumeAnalytics {
  total_volume: number;
  volume_by_muscle: VolumeByMuscle[];
  weekly_trend: VolumeTrend[];
  current_week: number;
  previous_week: number;
  change_percentage: number;
}

export interface VolumeByMuscle {
  muscle_group: string;
  volume: number;
  percentage: number;
  sets: number;
}

export interface VolumeTrend {
  week: number;
  week_start: string;
  total_volume: number;
  workout_count: number;
}

export interface FatigueAnalytics {
  current_fatigue: CurrentFatigue;
  history: FatigueHistory[];
  recommendation: string;
  risk_level: 'low' | 'moderate' | 'high';
}

export interface CurrentFatigue {
  fatigue_score: number;
  acute_load: number;
  chronic_load: number;
  acr_ratio: number;
  updated_at: string;
}

export interface FatigueHistory {
  date: string;
  fatigue_score: number;
  acute_load: number;
  chronic_load: number;
  acr_ratio: number;
}

export interface DeloadRecommendation {
  recommended: boolean;
  reason: string;
  suggested_reduction: number;
  duration_weeks: number;
  priority: 'low' | 'medium' | 'high';
  metrics: {
    fatigue_score: number;
    volume_trend: string;
    recovery_quality: number;
    injury_risk: number;
  };
  auto_regulation?: {
    enabled: boolean;
    approved: boolean;
    scheduled_date?: string;
  };
}

export interface WorkoutInsight {
  type: 'volume' | 'fatigue' | 'pr' | 'consistency' | 'recovery';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action_text?: string;
  data?: any;
}

// ============================================================================
// Analytics API Client Class
// ============================================================================

class AnalyticsAPIClient {
  /**
   * Get volume analytics for a user
   */
  async getVolumeAnalytics(
    userId: string,
    options?: {
      weeks?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<VolumeAnalytics> {
    try {
      return await apiClient.get<VolumeAnalytics>(
        `/api/analytics/volume/${userId}`,
        { params: options }
      );
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch volume analytics', 500, error);
    }
  }

  /**
   * Get volume trend over time
   */
  async getVolumeTrend(
    userId: string,
    weeks: number = 12
  ): Promise<VolumeTrend[]> {
    try {
      const data = await apiClient.get<{ trend: VolumeTrend[] }>(
        `/api/analytics/volume/${userId}/trend`,
        { params: { weeks } }
      );
      return data.trend || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch volume trend', 500, error);
    }
  }

  /**
   * Get volume breakdown by muscle group
   */
  async getVolumeByMuscle(
    userId: string,
    weeks: number = 4
  ): Promise<VolumeByMuscle[]> {
    try {
      const data = await apiClient.get<{ breakdown: VolumeByMuscle[] }>(
        `/api/analytics/volume/${userId}/by-muscle`,
        { params: { weeks } }
      );
      return data.breakdown || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch volume by muscle', 500, error);
    }
  }

  /**
   * Get fatigue analytics for a user
   */
  async getFatigueAnalytics(
    userId: string,
    days: number = 30
  ): Promise<FatigueAnalytics> {
    try {
      return await apiClient.get<FatigueAnalytics>(
        `/api/analytics/fatigue/${userId}`,
        { params: { days } }
      );
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch fatigue analytics', 500, error);
    }
  }

  /**
   * Get current fatigue score
   */
  async getCurrentFatigue(userId: string): Promise<CurrentFatigue> {
    try {
      return await apiClient.get<CurrentFatigue>(
        `/api/analytics/fatigue/${userId}/current`
      );
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch current fatigue', 500, error);
    }
  }

  /**
   * Get fatigue history
   */
  async getFatigueHistory(
    userId: string,
    days: number = 30
  ): Promise<FatigueHistory[]> {
    try {
      const data = await apiClient.get<{ history: FatigueHistory[] }>(
        `/api/analytics/fatigue/${userId}/history`,
        { params: { days } }
      );
      return data.history || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch fatigue history', 500, error);
    }
  }

  /**
   * Get deload recommendations
   */
  async getDeloadRecommendation(userId: string): Promise<DeloadRecommendation> {
    try {
      return await apiClient.get<DeloadRecommendation>(
        `/api/analytics/deload/${userId}`
      );
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch deload recommendation', 500, error);
    }
  }

  /**
   * Approve auto-regulation deload
   */
  async approveDeload(userId: string, deloadId: string): Promise<void> {
    try {
      await apiClient.post(`/api/analytics/deload/${userId}/approve`, {
        deload_id: deloadId,
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to approve deload', 500, error);
    }
  }

  /**
   * Get workout insights (combination of analytics)
   */
  async getWorkoutInsights(userId: string): Promise<WorkoutInsight[]> {
    try {
      const data = await apiClient.get<{ insights: WorkoutInsight[] }>(
        `/api/analytics/insights/${userId}`
      );
      return data.insights || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch workout insights', 500, error);
    }
  }

  /**
   * Get weekly summary
   */
  async getWeeklySummary(userId: string, weekOffset: number = 0): Promise<{
    total_workouts: number;
    total_volume: number;
    avg_rpe: number;
    fatigue_score: number;
    prs_achieved: number;
    adherence_rate: number;
  }> {
    try {
      return await apiClient.get(
        `/api/analytics/summary/${userId}/weekly`,
        { params: { week_offset: weekOffset } }
      );
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch weekly summary', 500, error);
    }
  }
}

// Export singleton instance
const analyticsAPIClient = new AnalyticsAPIClient();
export default analyticsAPIClient;
