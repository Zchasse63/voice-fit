/**
 * Live Activity Service for iOS
 *
 * Manages Live Activities and Dynamic Island integration for workout tracking.
 * Requires iOS 16.1+ and Activity Kit framework.
 */

import { Platform } from 'react-native';

// Live Activity state attributes
export interface WorkoutActivityAttributes {
  workoutName: string;
  workoutId: string;
}

// Dynamic state that updates during the activity
export interface WorkoutActivityState {
  currentExercise: string | null;
  currentSet: number;
  totalSets: number;
  elapsedTime: number; // in seconds
  lastSetWeight?: number;
  lastSetReps?: number;
  lastSetRPE?: number;
  status: 'active' | 'paused' | 'completed';
}

// Live Activity data structure
export interface LiveActivityData {
  activityId: string;
  attributes: WorkoutActivityAttributes;
  state: WorkoutActivityState;
}

class LiveActivityService {
  private activeActivityId: string | null = null;
  private startTime: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if Live Activities are supported
   */
  private checkSupport(): void {
    // Live Activities require iOS 16.1+ and are only available on iOS
    if (Platform.OS === 'ios') {
      const version = parseInt(Platform.Version as string, 10);
      this.isSupported = version >= 16;
    } else {
      this.isSupported = false;
    }
  }

  /**
   * Check if device supports Live Activities
   */
  public isLiveActivitySupported(): boolean {
    return this.isSupported;
  }

  /**
   * Start a new Live Activity for a workout
   */
  public async startActivity(
    workoutName: string,
    workoutId: string
  ): Promise<string | null> {
    if (!this.isSupported) {
      console.log('⚠️ Live Activities not supported on this device');
      return null;
    }

    try {
      const attributes: WorkoutActivityAttributes = {
        workoutName,
        workoutId,
      };

      const initialState: WorkoutActivityState = {
        currentExercise: null,
        currentSet: 0,
        totalSets: 0,
        elapsedTime: 0,
        status: 'active',
      };

      // In a real implementation, this would call the native module
      // For now, we'll use a mock implementation
      const activityId = await this.startNativeActivity(attributes, initialState);

      if (activityId) {
        this.activeActivityId = activityId;
        this.startTime = Date.now();
        this.startElapsedTimeUpdater();
        console.log('✅ Live Activity started:', activityId);
      }

      return activityId;
    } catch (error) {
      console.error('❌ Failed to start Live Activity:', error);
      return null;
    }
  }

  /**
   * Update the Live Activity with new workout data
   */
  public async updateActivity(data: Partial<WorkoutActivityState>): Promise<boolean> {
    if (!this.activeActivityId) {
      console.warn('⚠️ No active Live Activity to update');
      return false;
    }

    try {
      const elapsedTime = this.startTime
        ? Math.floor((Date.now() - this.startTime) / 1000)
        : 0;

      const updatedState: WorkoutActivityState = {
        currentExercise: data.currentExercise || null,
        currentSet: data.currentSet || 0,
        totalSets: data.totalSets || 0,
        elapsedTime,
        lastSetWeight: data.lastSetWeight,
        lastSetReps: data.lastSetReps,
        lastSetRPE: data.lastSetRPE,
        status: data.status || 'active',
      };

      await this.updateNativeActivity(this.activeActivityId, updatedState);
      console.log('✅ Live Activity updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update Live Activity:', error);
      return false;
    }
  }

  /**
   * End the active Live Activity
   */
  public async endActivity(finalState?: Partial<WorkoutActivityState>): Promise<boolean> {
    if (!this.activeActivityId) {
      console.warn('⚠️ No active Live Activity to end');
      return false;
    }

    try {
      // Stop the elapsed time updater
      this.stopElapsedTimeUpdater();

      // Update with final state if provided
      if (finalState) {
        await this.updateActivity({ ...finalState, status: 'completed' });
      }

      // End the native activity
      await this.endNativeActivity(this.activeActivityId);

      console.log('✅ Live Activity ended');
      this.activeActivityId = null;
      this.startTime = null;
      return true;
    } catch (error) {
      console.error('❌ Failed to end Live Activity:', error);
      return false;
    }
  }

  /**
   * Get the current active activity ID
   */
  public getActiveActivityId(): string | null {
    return this.activeActivityId;
  }

  /**
   * Start automatic elapsed time updates (every 5 seconds)
   */
  private startElapsedTimeUpdater(): void {
    this.stopElapsedTimeUpdater();

    this.updateInterval = setInterval(() => {
      if (this.activeActivityId && this.startTime) {
        this.updateActivity({});
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Stop the elapsed time updater
   */
  private stopElapsedTimeUpdater(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Format elapsed time as HH:MM:SS or MM:SS
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

  // ============================================================================
  // NATIVE MODULE INTERFACE
  // These methods will be implemented by a native iOS module
  // ============================================================================

  private async startNativeActivity(
    attributes: WorkoutActivityAttributes,
    initialState: WorkoutActivityState
  ): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;

    try {
      // Import native module dynamically
      const { LiveActivityModule } = await import('./LiveActivityModule');
      return await LiveActivityModule.startActivity(attributes, initialState);
    } catch (error) {
      console.warn('⚠️ Native Live Activity module not available, using mock');
      // Return mock activity ID for development
      return `mock-activity-${Date.now()}`;
    }
  }

  private async updateNativeActivity(
    activityId: string,
    state: WorkoutActivityState
  ): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      const { LiveActivityModule } = await import('./LiveActivityModule');
      await LiveActivityModule.updateActivity(activityId, state);
    } catch (error) {
      console.warn('⚠️ Native Live Activity module not available');
      // Mock update for development
    }
  }

  private async endNativeActivity(activityId: string): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      const { LiveActivityModule } = await import('./LiveActivityModule');
      await LiveActivityModule.endActivity(activityId);
    } catch (error) {
      console.warn('⚠️ Native Live Activity module not available');
      // Mock end for development
    }
  }
}

// Export singleton instance
export const liveActivityService = new LiveActivityService();

// Export types
export type {
  WorkoutActivityAttributes,
  WorkoutActivityState,
  LiveActivityData,
};
