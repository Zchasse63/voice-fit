import { create } from 'zustand';
import { gpsService, GPSCoordinate, RunStats } from '../services/gps/GPSService';
import { database } from '../services/database/watermelon/database';
import Run from '../services/database/watermelon/models/Run';
import { useAuthStore } from './auth.store';

interface RunState {
  // State
  isTracking: boolean;
  isPaused: boolean;
  coordinates: GPSCoordinate[];
  stats: RunStats;
  error: string | null;
  hasPermission: boolean;

  // Actions
  requestPermissions: () => Promise<boolean>;
  startRun: () => Promise<void>;
  pauseRun: () => Promise<void>;
  resumeRun: () => Promise<void>;
  stopRun: () => Promise<void>;
  updateLocation: (coordinate: GPSCoordinate) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  // Initial state
  isTracking: false,
  isPaused: false,
  coordinates: [],
  stats: {
    distance: 0,
    duration: 0,
    pace: 0,
    avgSpeed: 0,
    calories: 0,
  },
  error: null,
  hasPermission: false,

  // Request location permissions
  requestPermissions: async () => {
    try {
      const granted = await gpsService.requestPermissions();
      set({ hasPermission: granted, error: granted ? null : 'Location permissions denied' });
      return granted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request permissions';
      set({ error: message, hasPermission: false });
      return false;
    }
  },

  // Start tracking run
  startRun: async () => {
    const { hasPermission } = get();
    
    if (!hasPermission) {
      const granted = await get().requestPermissions();
      if (!granted) {
        return;
      }
    }

    try {
      set({ error: null, isTracking: true, isPaused: false, coordinates: [] });

      await gpsService.startTracking((coordinate) => {
        get().updateLocation(coordinate);
      });

      console.log('✅ Run started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start run';
      console.error('❌ Failed to start run:', error);
      set({ error: message, isTracking: false });
    }
  },

  // Pause run
  pauseRun: async () => {
    try {
      await gpsService.stopTracking();
      set({ isPaused: true });
      console.log('⏸️ Run paused');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pause run';
      console.error('❌ Failed to pause run:', error);
      set({ error: message });
    }
  },

  // Resume run
  resumeRun: async () => {
    try {
      set({ isPaused: false, error: null });

      await gpsService.startTracking((coordinate) => {
        get().updateLocation(coordinate);
      });

      console.log('▶️ Run resumed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume run';
      console.error('❌ Failed to resume run:', error);
      set({ error: message, isPaused: true });
    }
  },

  // Stop run
  stopRun: async () => {
    try {
      await gpsService.stopTracking();

      // Get final stats
      const finalStats = gpsService.getRunStats();
      const finalCoordinates = gpsService.getCoordinates();

      set({
        isTracking: false,
        isPaused: false,
        stats: finalStats,
        coordinates: finalCoordinates,
      });

      // Save run to WatermelonDB
      try {
        const user = useAuthStore.getState().user;
        if (user && finalCoordinates.length > 0) {
          await database.write(async () => {
            await database.get<Run>('runs').create((run) => {
              run.userId = user.id;
              run.startTime = new Date(finalCoordinates[0].timestamp);
              run.endTime = new Date(finalCoordinates[finalCoordinates.length - 1].timestamp);
              run.distance = finalStats.distance;
              run.duration = finalStats.duration;
              run.pace = finalStats.pace;
              run.avgSpeed = finalStats.avgSpeed;
              run.calories = finalStats.calories;
              run.route = JSON.stringify(finalCoordinates);
              run.synced = false;
            });
          });
          console.log('💾 Run saved to WatermelonDB');
        }
      } catch (saveError) {
        console.error('❌ Failed to save run to WatermelonDB:', saveError);
      }

      console.log('🛑 Run stopped');
      console.log('📊 Final stats:', finalStats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop run';
      console.error('❌ Failed to stop run:', error);
      set({ error: message });
    }
  },

  // Update location
  updateLocation: (coordinate: GPSCoordinate) => {
    const { coordinates } = get();
    const updatedCoordinates = [...coordinates, coordinate];
    
    // Calculate updated stats
    const stats = gpsService.getRunStats();

    set({
      coordinates: updatedCoordinates,
      stats,
    });
  },

  // Reset state
  reset: () => {
    gpsService.reset();
    set({
      isTracking: false,
      isPaused: false,
      coordinates: [],
      stats: {
        distance: 0,
        duration: 0,
        pace: 0,
        avgSpeed: 0,
        calories: 0,
      },
      error: null,
    });
    console.log('🔄 Run store reset');
  },
}));

