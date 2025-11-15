/**
 * Workout Notification Manager
 *
 * Unified cross-platform manager for workout notifications.
 * Uses Live Activities on iOS and Foreground Service on Android.
 */

import { Platform } from 'react-native';
import { liveActivityService } from '../liveActivity/LiveActivityService';
import { foregroundServiceManager } from '../foregroundService/ForegroundServiceManager';

// Unified workout notification state
export interface WorkoutNotificationState {
  workoutName: string;
  workoutId: string;
  currentExercise: string | null;
  currentSet: number;
  totalSets: number;
  elapsedTime: number;
  lastSetWeight?: number;
  lastSetReps?: number;
  lastSetRPE?: number;
  status: 'active' | 'paused' | 'completed';
}

// Workout notification event callbacks
export interface WorkoutNotificationCallbacks {
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onTap?: () => void;
}

class WorkoutNotificationManager {
  private isActive: boolean = false;
  private currentPlatform: 'ios' | 'android' | 'other';
  private callbacks: WorkoutNotificationCallbacks = {};

  constructor() {
    this.currentPlatform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other';
  }

  /**
   * Check if workout notifications are supported on this device
   */
  public isSupported(): boolean {
    if (this.currentPlatform === 'ios') {
      return liveActivityService.isLiveActivitySupported();
    } else if (this.currentPlatform === 'android') {
      return foregroundServiceManager.isForegroundServiceSupported();
    }
    return false;
  }

  /**
   * Get the platform-specific notification type
   */
  public getNotificationType(): 'live-activity' | 'foreground-service' | 'none' {
    if (this.currentPlatform === 'ios' && liveActivityService.isLiveActivitySupported()) {
      return 'live-activity';
    } else if (this.currentPlatform === 'android' && foregroundServiceManager.isForegroundServiceSupported()) {
      return 'foreground-service';
    }
    return 'none';
  }

  /**
   * Start workout notification
   */
  public async start(
    workoutName: string,
    workoutId: string,
    callbacks?: WorkoutNotificationCallbacks
  ): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('⚠️ Workout notifications not supported on this device');
      return false;
    }

    if (this.isActive) {
      console.log('⚠️ Workout notification already active');
      return false;
    }

    try {
      // Store callbacks
      this.callbacks = callbacks || {};

      let success = false;

      if (this.currentPlatform === 'ios') {
        const activityId = await liveActivityService.startActivity(workoutName, workoutId);
        success = activityId !== null;
      } else if (this.currentPlatform === 'android') {
        success = await foregroundServiceManager.startService(workoutName, workoutId);
      }

      if (success) {
        this.isActive = true;
        console.log(`✅ Workout notification started (${this.getNotificationType()})`);
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to start workout notification:', error);
      return false;
    }
  }

  /**
   * Update workout notification with new data
   */
  public async update(data: Partial<WorkoutNotificationState>): Promise<boolean> {
    if (!this.isActive) {
      console.warn('⚠️ No active workout notification to update');
      return false;
    }

    try {
      let success = false;

      if (this.currentPlatform === 'ios') {
        success = await liveActivityService.updateActivity(data);
      } else if (this.currentPlatform === 'android') {
        success = await foregroundServiceManager.updateService(data);
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update workout notification:', error);
      return false;
    }
  }

  /**
   * End workout notification
   */
  public async end(finalState?: Partial<WorkoutNotificationState>): Promise<boolean> {
    if (!this.isActive) {
      console.warn('⚠️ No active workout notification to end');
      return false;
    }

    try {
      let success = false;

      if (this.currentPlatform === 'ios') {
        success = await liveActivityService.endActivity(finalState);
      } else if (this.currentPlatform === 'android') {
        success = await foregroundServiceManager.stopService(finalState);
      }

      if (success) {
        this.isActive = false;
        this.callbacks = {};
        console.log('✅ Workout notification ended');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to end workout notification:', error);
      return false;
    }
  }

  /**
   * Pause the workout
   */
  public async pause(): Promise<boolean> {
    if (!this.isActive) return false;

    try {
      let success = false;

      if (this.currentPlatform === 'ios') {
        success = await liveActivityService.updateActivity({ status: 'paused' });
      } else if (this.currentPlatform === 'android') {
        success = await foregroundServiceManager.pauseWorkout();
      }

      if (success && this.callbacks.onPause) {
        this.callbacks.onPause();
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to pause workout:', error);
      return false;
    }
  }

  /**
   * Resume the workout
   */
  public async resume(): Promise<boolean> {
    if (!this.isActive) return false;

    try {
      let success = false;

      if (this.currentPlatform === 'ios') {
        success = await liveActivityService.updateActivity({ status: 'active' });
      } else if (this.currentPlatform === 'android') {
        success = await foregroundServiceManager.resumeWorkout();
      }

      if (success && this.callbacks.onResume) {
        this.callbacks.onResume();
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to resume workout:', error);
      return false;
    }
  }

  /**
   * Update current exercise being performed
   */
  public async updateCurrentExercise(
    exerciseName: string,
    currentSet: number,
    totalSets: number
  ): Promise<boolean> {
    return await this.update({
      currentExercise: exerciseName,
      currentSet,
      totalSets,
    });
  }

  /**
   * Update last completed set
   */
  public async updateLastSet(
    weight: number,
    reps: number,
    rpe?: number
  ): Promise<boolean> {
    return await this.update({
      lastSetWeight: weight,
      lastSetReps: reps,
      lastSetRPE: rpe,
    });
  }

  /**
   * Update set counts
   */
  public async updateSetCounts(currentSet: number, totalSets: number): Promise<boolean> {
    return await this.update({
      currentSet,
      totalSets,
    });
  }

  /**
   * Check if notification is currently active
   */
  public isNotificationActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current elapsed time (formatted)
   */
  public formatElapsedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get platform-specific implementation details (for debugging)
   */
  public getDebugInfo(): {
    platform: string;
    notificationType: string;
    isSupported: boolean;
    isActive: boolean;
  } {
    return {
      platform: this.currentPlatform,
      notificationType: this.getNotificationType(),
      isSupported: this.isSupported(),
      isActive: this.isActive,
    };
  }
}

// Export singleton instance
export const workoutNotificationManager = new WorkoutNotificationManager();

// Export types
export type {
  WorkoutNotificationState,
  WorkoutNotificationCallbacks,
};
