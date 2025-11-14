/**
 * API Services - Barrel Export
 *
 * Central export point for all API clients and related types.
 */

// Main API client and config
export { apiClient, APIError, checkBackendHealth, handleAPIError } from './config';
export type { VoiceParseResponse } from './config';

// Analytics API client
export { default as analyticsAPIClient } from './AnalyticsAPIClient';
export type {
  VolumeAnalytics,
  VolumeByMuscle,
  VolumeTrend,
  FatigueAnalytics,
  CurrentFatigue,
  FatigueHistory,
  DeloadRecommendation,
  WorkoutInsight,
} from './AnalyticsAPIClient';

// Voice API client (if exists)
export * from './VoiceAPIClient';
