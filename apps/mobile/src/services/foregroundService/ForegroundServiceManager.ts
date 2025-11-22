/**
 * Foreground Service Manager for Android
 *
 * Manages Android foreground service for workout tracking.
 * Shows a persistent notification during workouts with workout progress.
 */

import { Platform } from 'react-native';

// Foreground service state
export interface WorkoutServiceState {
  workoutName: string;
  workoutId: string;
  currentExercise: string | null;
  currentSet: number;
  totalSets: number;
  elapsedTime: number; // in seconds
  lastSetWeight?: number;
  lastSetReps?: number;
  lastSetRPE?: number;
  status: 'active' | 'paused' | 'completed';
}

// Notification configuration
export interface NotificationConfig {
  channelId: string;
  channelName: string;
  title: string;
  subtitle?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

class ForegroundServiceManager {
  private isServiceRunning: boolean = false;
  private startTime: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentState: WorkoutServiceState | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if foreground services are supported
   */
  private checkSupport(): void {
    // Foreground services are available on Android
    this.isSupported = Platform.OS === 'android';
  }

  /**
   * Check if device supports foreground services
   */
  public isForegroundServiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Start the foreground service for a workout
   */
  public async startService(
    workoutName: string,
    workoutId: string
  ): Promise<boolean> {
    if (!this.isSupported) {
      console.log('⚠️ Foreground services not supported on this platform');
      return false;
    }

    if (this.isServiceRunning) {
      console.log('⚠️ Foreground service already running');
      return false;
    }

    try {
      const initialState: WorkoutServiceState = {
        workoutName,
        workoutId,
        currentExercise: null,
        currentSet: 0,
        totalSets: 0,
        elapsedTime: 0,
        status: 'active',
      };

      const config: NotificationConfig = {
        channelId: 'workout_tracking',
        channelName: 'Workout Tracking',
        title: workoutName,
        subtitle: 'Tap to return to workout',
        actions: [
          { id: 'pause', title: 'Pause', icon: 'ic_pause' },
          { id: 'stop', title: 'Stop', icon: 'ic_stop' },
        ],
      };

      await this.startNativeService(initialState, config);

      this.isServiceRunning = true;
      this.currentState = initialState;
      this.startTime = Date.now();
      this.startElapsedTimeUpdater();

      console.log('✅ Foreground service started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start foreground service:', error);
      return false;
    }
  }

  /**
   * Update the foreground service notification with new workout data
   */
  public async updateService(data: Partial<WorkoutServiceState>): Promise<boolean> {
    if (!this.isServiceRunning || !this.currentState) {
      console.warn('⚠️ No active foreground service to update');
      return false;
    }

    try {
      const elapsedTime = this.startTime
        ? Math.floor((Date.now() - this.startTime) / 1000)
        : 0;

      const updatedState: WorkoutServiceState = {
        ...this.currentState,
        ...data,
        elapsedTime,
      };

      await this.updateNativeService(updatedState);
      this.currentState = updatedState;

      console.log('✅ Foreground service updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update foreground service:', error);
      return false;
    }
  }

  /**
   * Stop the foreground service
   */
  public async stopService(finalState?: Partial<WorkoutServiceState>): Promise<boolean> {
    if (!this.isServiceRunning) {
      console.warn('⚠️ No active foreground service to stop');
      return false;
    }

    try {
      // Stop the elapsed time updater
      this.stopElapsedTimeUpdater();

      // Update with final state if provided
      if (finalState && this.currentState) {
        await this.updateService({ ...finalState, status: 'completed' });
      }

      // Stop the native service
      await this.stopNativeService();

      console.log('✅ Foreground service stopped');
      this.isServiceRunning = false;
      this.currentState = null;
      this.startTime = null;
      return true;
    } catch (error) {
      console.error('❌ Failed to stop foreground service:', error);
      return false;
    }
  }

  /**
   * Pause the workout (update notification state)
   */
  public async pauseWorkout(): Promise<boolean> {
    if (!this.isServiceRunning) return false;

    this.stopElapsedTimeUpdater();
    return await this.updateService({ status: 'paused' });
  }

  /**
   * Resume the workout
   */
  public async resumeWorkout(): Promise<boolean> {
    if (!this.isServiceRunning) return false;

    this.startElapsedTimeUpdater();
    return await this.updateService({ status: 'active' });
  }

  /**
   * Check if service is currently running
   */
  public isRunning(): boolean {
    return this.isServiceRunning;
  }

  /**
   * Get current service state
   */
  public getCurrentState(): WorkoutServiceState | null {
    return this.currentState;
  }

  /**
   * Start automatic elapsed time updates (every 5 seconds)
   */
  private startElapsedTimeUpdater(): void {
    this.stopElapsedTimeUpdater();

    this.updateInterval = setInterval(() => {
      if (this.isServiceRunning && this.currentState?.status === 'active') {
        this.updateService({});
      }
    }, 5000) as any; // Update every 5 seconds
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
  // These methods will be implemented by a native Android module
  // ============================================================================

  private async startNativeService(
    initialState: WorkoutServiceState,
    config: NotificationConfig
  ): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const { ForegroundServiceModule } = await import('./ForegroundServiceModule');
      await ForegroundServiceModule.startService(initialState, config);
    } catch (error) {
      console.warn('⚠️ Native Foreground Service module not available, using mock');
      // Mock implementation for development
      console.log('[Mock] Starting foreground service:', initialState, config);
    }
  }

  private async updateNativeService(state: WorkoutServiceState): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const { ForegroundServiceModule } = await import('./ForegroundServiceModule');
      await ForegroundServiceModule.updateNotification(state);
    } catch (error) {
      console.warn('⚠️ Native Foreground Service module not available');
      // Mock update for development
      console.log('[Mock] Updating foreground service:', state);
    }
  }

  private async stopNativeService(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const { ForegroundServiceModule } = await import('./ForegroundServiceModule');
      await ForegroundServiceModule.stopService();
    } catch (error) {
      console.warn('⚠️ Native Foreground Service module not available');
      // Mock stop for development
      console.log('[Mock] Stopping foreground service');
    }
  }
}

// Export singleton instance
export const foregroundServiceManager = new ForegroundServiceManager();
