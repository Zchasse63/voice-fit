/**
 * Foreground Service Native Module Interface
 *
 * This module provides the TypeScript interface for the native Android Foreground Service.
 * The actual implementation is in Java/Kotlin on the Android side.
 */

import { NativeModules, Platform } from 'react-native';
import type {
  WorkoutServiceState,
  NotificationConfig,
} from './ForegroundServiceManager';

interface ForegroundServiceModuleInterface {
  /**
   * Start the foreground service
   */
  startService(
    initialState: WorkoutServiceState,
    config: NotificationConfig
  ): Promise<void>;

  /**
   * Update the notification with new workout state
   */
  updateNotification(state: WorkoutServiceState): Promise<void>;

  /**
   * Stop the foreground service
   */
  stopService(): Promise<void>;

  /**
   * Check if the service is currently running
   */
  isServiceRunning(): Promise<boolean>;

  /**
   * Pause the workout (update notification)
   */
  pauseWorkout(): Promise<void>;

  /**
   * Resume the workout (update notification)
   */
  resumeWorkout(): Promise<void>;
}

// Native module stub - will be replaced by actual native implementation
const LINKING_ERROR =
  `The package 'ForegroundServiceModule' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ android: "- Run 'gradle sync' in the android directory\n", default: '' }) +
  '- You have added FOREGROUND_SERVICE permission in AndroidManifest.xml\n' +
  '- Your Android SDK version is 26 or higher\n';

// Mock implementation for development
const MockForegroundServiceModule: ForegroundServiceModuleInterface = {
  startService: async (initialState, config) => {
    console.log('[Mock] Starting foreground service:', initialState, config);
  },
  updateNotification: async (state) => {
    console.log('[Mock] Updating notification:', state);
  },
  stopService: async () => {
    console.log('[Mock] Stopping foreground service');
  },
  isServiceRunning: async () => {
    console.log('[Mock] Checking if service is running');
    return false;
  },
  pauseWorkout: async () => {
    console.log('[Mock] Pausing workout');
  },
  resumeWorkout: async () => {
    console.log('[Mock] Resuming workout');
  },
};

// Try to get the native module, fall back to mock if not available
let ForegroundServiceModule: ForegroundServiceModuleInterface;

try {
  if (Platform.OS === 'android') {
    const NativeModule = NativeModules.ForegroundServiceModule;

    if (NativeModule) {
      ForegroundServiceModule = NativeModule as ForegroundServiceModuleInterface;
      console.log('✅ Native ForegroundServiceModule loaded');
    } else {
      console.warn(LINKING_ERROR);
      console.warn('Using mock implementation for development');
      ForegroundServiceModule = MockForegroundServiceModule;
    }
  } else {
    // iOS or other platforms - use mock
    ForegroundServiceModule = MockForegroundServiceModule;
  }
} catch (error) {
  console.warn('Failed to load ForegroundServiceModule:', error);
  ForegroundServiceModule = MockForegroundServiceModule;
}

export { ForegroundServiceModule };
export type { ForegroundServiceModuleInterface };
