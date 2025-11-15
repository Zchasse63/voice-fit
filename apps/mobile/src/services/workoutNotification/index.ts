/**
 * Workout Notification Services
 *
 * Exports unified workout notification manager and related types.
 * Handles Live Activities (iOS) and Foreground Service (Android).
 */

// Main unified manager
export {
  workoutNotificationManager,
  WorkoutNotificationManager
} from './WorkoutNotificationManager';

// Types
export type {
  WorkoutNotificationState,
  WorkoutNotificationCallbacks,
} from './WorkoutNotificationManager';

// Platform-specific services (for advanced usage)
export { liveActivityService } from '../liveActivity/LiveActivityService';
export { foregroundServiceManager } from '../foregroundService/ForegroundServiceManager';

// Platform-specific types
export type {
  WorkoutActivityAttributes,
  WorkoutActivityState,
  LiveActivityData,
} from '../liveActivity/LiveActivityService';

export type {
  WorkoutServiceState,
  NotificationConfig,
  NotificationAction,
} from '../foregroundService/ForegroundServiceManager';
