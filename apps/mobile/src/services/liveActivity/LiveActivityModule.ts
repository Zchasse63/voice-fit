/**
 * Live Activity Native Module Interface
 *
 * This module provides the TypeScript interface for the native iOS ActivityKit module.
 * The actual implementation is in Swift/Objective-C on the iOS side.
 */

import { NativeModules, Platform } from 'react-native';
import type {
  WorkoutActivityAttributes,
  WorkoutActivityState,
} from './LiveActivityService';

interface LiveActivityModuleInterface {
  /**
   * Start a new Live Activity
   * @returns Promise resolving to activity ID or null if failed
   */
  startActivity(
    attributes: WorkoutActivityAttributes,
    initialState: WorkoutActivityState
  ): Promise<string | null>;

  /**
   * Update an existing Live Activity
   */
  updateActivity(
    activityId: string,
    state: WorkoutActivityState
  ): Promise<void>;

  /**
   * End a Live Activity
   */
  endActivity(activityId: string): Promise<void>;

  /**
   * Check if Live Activities are supported on this device
   */
  areActivitiesEnabled(): Promise<boolean>;

  /**
   * Get all active activity IDs
   */
  getActiveActivityIds(): Promise<string[]>;
}

// Native module stub - will be replaced by actual native implementation
const LINKING_ERROR =
  `The package 'LiveActivityModule' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- Run 'pod install' in the ios directory\n", default: '' }) +
  '- You have configured ActivityKit in your iOS project\n' +
  '- Your iOS deployment target is 16.1 or higher\n';

// Mock implementation for development
const MockLiveActivityModule: LiveActivityModuleInterface = {
  startActivity: async (attributes, initialState) => {
    console.log('[Mock] Starting Live Activity:', attributes, initialState);
    return `mock-activity-${Date.now()}`;
  },
  updateActivity: async (activityId, state) => {
    console.log('[Mock] Updating Live Activity:', activityId, state);
  },
  endActivity: async (activityId) => {
    console.log('[Mock] Ending Live Activity:', activityId);
  },
  areActivitiesEnabled: async () => {
    console.log('[Mock] Checking Live Activities support');
    return Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;
  },
  getActiveActivityIds: async () => {
    console.log('[Mock] Getting active activity IDs');
    return [];
  },
};

// Try to get the native module, fall back to mock if not available
let LiveActivityModule: LiveActivityModuleInterface;

try {
  if (Platform.OS === 'ios') {
    const NativeModule = NativeModules.LiveActivityModule;

    if (NativeModule) {
      LiveActivityModule = NativeModule as LiveActivityModuleInterface;
      console.log('✅ Native LiveActivityModule loaded');
    } else {
      console.warn(LINKING_ERROR);
      console.warn('Using mock implementation for development');
      LiveActivityModule = MockLiveActivityModule;
    }
  } else {
    // Android or other platforms - use mock
    LiveActivityModule = MockLiveActivityModule;
  }
} catch (error) {
  console.warn('Failed to load LiveActivityModule:', error);
  LiveActivityModule = MockLiveActivityModule;
}

export { LiveActivityModule };
export type { LiveActivityModuleInterface };
