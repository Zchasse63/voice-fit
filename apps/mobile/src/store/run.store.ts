import { create } from 'zustand';
import { gpsService, GPSCoordinate, RunStats } from '../services/gps/GPSService';
import { database } from '../services/database/watermelon/database';
import Run from '../services/database/watermelon/models/Run';
import { useAuthStore } from './auth.store';
import { audioCueService } from '../services/AudioCueService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Lap {
  lapNumber: number;
  startTime: number;
  endTime: number;
  distance: number; // meters
  duration: number; // seconds
  pace: number; // minutes per mile
  coordinates: GPSCoordinate[];
}

export interface WorkoutSegment {
  id: string;
  type: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'steady';
  duration?: number; // seconds
  distance?: number; // meters
  targetPace?: number; // min/mile
  name: string;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  segments: WorkoutSegment[];
  currentSegmentIndex: number;
  segmentStartTime: number;
  segmentStartDistance: number;
}

export interface SavedWorkout {
  id: string;
  name: string;
  description?: string;
  segments: WorkoutSegment[];
  createdAt: number;
}

interface RunSettings {
  autoPause: boolean;
  startOnMotion: boolean;
  countdown: number; // 0 = off, 3, 5, 10 seconds
  feedbackDistance: 'half' | 'mile';
}

interface RunState {
  // State
  isTracking: boolean;
  isPaused: boolean;
  isAutoPaused: boolean;
  isWaitingForMotion: boolean;
  isCountingDown: boolean;
  countdownValue: number;
  coordinates: GPSCoordinate[];
  stats: RunStats;
  currentSpeed: number; // mph
  error: string | null;
  hasPermission: boolean;
  lastRunId: string | null;

  // Lap tracking
  laps: Lap[];
  currentLapStartIndex: number;
  lastDistanceInterval: number; // Track last announced distance milestone

  // Workout guidance
  activeWorkout: ActiveWorkout | null;
  savedWorkouts: SavedWorkout[];

  // Settings
  settings: RunSettings;

  // Actions
  requestPermissions: () => Promise<boolean>;
  startRun: (workout?: ActiveWorkout) => Promise<void>;
  pauseRun: () => Promise<void>;
  resumeRun: () => Promise<void>;
  stopRun: () => Promise<void>;
  updateLocation: (coordinate: GPSCoordinate) => void;
  markLap: () => void;
  completeCurrentSegment: () => void;
  updateSettings: (settings: Partial<RunSettings>) => void;
  loadSettings: () => Promise<void>;
  saveWorkout: (workout: Omit<SavedWorkout, 'id' | 'createdAt'>) => Promise<void>;
  loadWorkouts: () => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setActiveWorkoutFromSaved: (workoutId: string) => void;
  checkWorkoutProgress: () => void;
  reset: () => void;

  // Helper functions
  calculateCurrentSpeed: (coordinates: GPSCoordinate[]) => number;
  checkAutoPause: () => void;
  checkDistanceIntervals: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  // Initial state
  isTracking: false,
  isPaused: false,
  isAutoPaused: false,
  isWaitingForMotion: false,
  isCountingDown: false,
  countdownValue: 0,
  coordinates: [],
  stats: {
    distance: 0,
    duration: 0,
    pace: 0,
    avgSpeed: 0,
    calories: 0,
    elevationGain: 0,
    elevationLoss: 0,
    gradeAdjustedPace: null,
    gradePercent: 0,
    terrainDifficulty: 'flat',
  },
  currentSpeed: 0,
  error: null,
  hasPermission: false,
  lastRunId: null,
  laps: [],
  currentLapStartIndex: 0,
  lastDistanceInterval: 0,
  activeWorkout: null,
  savedWorkouts: [],
  settings: {
    autoPause: false,
    startOnMotion: false,
    countdown: 5,
    feedbackDistance: 'mile',
  },

  // Helper: Calculate speed from last few coordinates
  calculateCurrentSpeed: (coordinates: GPSCoordinate[]): number => {
    if (coordinates.length < 2) return 0;

    // Use last 3 coordinates for smoothing
    const recentCoords = coordinates.slice(-3);
    if (recentCoords.length < 2) return 0;

    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < recentCoords.length; i++) {
      const prev = recentCoords[i - 1];
      const curr = recentCoords[i];

      // Calculate distance using Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (prev.latitude * Math.PI) / 180;
      const φ2 = (curr.latitude * Math.PI) / 180;
      const Δφ = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const Δλ = ((curr.longitude - prev.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // meters

      totalDistance += distance;
      totalTime += (curr.timestamp - prev.timestamp) / 1000; // seconds
    }

    if (totalTime === 0) return 0;

    // Convert to mph
    const metersPerSecond = totalDistance / totalTime;
    const mph = metersPerSecond * 2.23694;

    return mph;
  },

  // Helper: Check if should auto-pause
  checkAutoPause: () => {
    const { settings, currentSpeed, isTracking, isPaused, isAutoPaused } = get();

    if (!settings.autoPause || !isTracking || isPaused) return;

    // Auto pause if speed < 0.5 mph
    if (currentSpeed < 0.5 && !isAutoPaused) {
      set({ isAutoPaused: true, isPaused: true });
      gpsService.stopTracking();
      audioCueService.announceAutoPause();
      console.log('⏸️ Auto-paused (speed < 0.5 mph)');
    }
    // Auto resume if speed > 1.0 mph
    else if (currentSpeed > 1.0 && isAutoPaused) {
      set({ isAutoPaused: false, isPaused: false });
      gpsService.startTracking((coordinate) => {
        get().updateLocation(coordinate);
      });
      audioCueService.announceAutoResume();
      console.log('▶️ Auto-resumed (speed > 1.0 mph)');
    }
  },

  // Helper: Check distance intervals for audio feedback
  checkDistanceIntervals: () => {
    const { stats, settings, lastDistanceInterval } = get();
    const distanceMiles = stats.distance * 0.000621371;
    const intervalSize = settings.feedbackDistance === 'half' ? 0.5 : 1.0;
    const currentInterval = Math.floor(distanceMiles / intervalSize);

    if (currentInterval > lastDistanceInterval && currentInterval > 0) {
      set({ lastDistanceInterval: currentInterval });
      const averagePace = gpsService.formatPace(stats.pace);
      audioCueService.announceDistanceInterval(distanceMiles, averagePace);
    }
  },

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
  startRun: async (workout?: ActiveWorkout) => {
    const { hasPermission, settings } = get();

    if (!hasPermission) {
      const granted = await get().requestPermissions();
      if (!granted) {
        return;
      }
    }

    try {
      // Handle countdown
      if (settings.countdown > 0) {
        set({ isCountingDown: true, countdownValue: settings.countdown });

        for (let i = settings.countdown; i > 0; i--) {
          set({ countdownValue: i });
          await audioCueService.announceCountdown(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        set({ isCountingDown: false, countdownValue: 0 });
      }

      // Reset state
      set({
        error: null,
        isTracking: true,
        isPaused: false,
        isAutoPaused: false,
        coordinates: [],
        laps: [],
        currentLapStartIndex: 0,
        lastDistanceInterval: 0,
        activeWorkout: workout ? {
          ...workout,
          currentSegmentIndex: 0,
          segmentStartTime: Date.now(),
          segmentStartDistance: 0,
        } : null,
      });

      // Announce workout start
      if (workout) {
        const firstSegment = workout.segments[0];
        await audioCueService.speak(`Starting ${workout.name}. Begin ${firstSegment.name}.`);
      }

      // Handle start on motion
      if (settings.startOnMotion) {
        set({ isWaitingForMotion: true });
        await audioCueService.announceStartOnMotion();

        // Start GPS tracking but don't count distance/time yet
        await gpsService.startTracking((coordinate) => {
          const coords = [...get().coordinates, coordinate];
          const speed = get().calculateCurrentSpeed(coords);
          set({ coordinates: coords, currentSpeed: speed });

          // Start actual tracking when motion detected
          if (speed > 1.0 && get().isWaitingForMotion) {
            set({ isWaitingForMotion: false });
            gpsService.reset();
            gpsService.startTracking((coord) => {
              get().updateLocation(coord);
            });
            audioCueService.announceWorkoutStart();
            console.log('✅ Run started (motion detected)');
          }
        });
      } else {
        // Normal start
        await gpsService.startTracking((coordinate) => {
          get().updateLocation(coordinate);
        });
        await audioCueService.announceWorkoutStart();
        console.log('✅ Run started');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start run';
      console.error('❌ Failed to start run:', error);
      set({ error: message, isTracking: false, isCountingDown: false, isWaitingForMotion: false });
    }
  },

  // Pause run
  pauseRun: async () => {
    try {
      await gpsService.stopTracking();
      set({ isPaused: true, isAutoPaused: false });
      await audioCueService.announceWorkoutPaused();
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
      set({ isPaused: false, isAutoPaused: false, error: null });

      await gpsService.startTracking((coordinate) => {
        get().updateLocation(coordinate);
      });

      await audioCueService.announceWorkoutResumed();
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

      // Announce completion
      const distanceMiles = finalStats.distance * 0.000621371;
      const paceFormatted = gpsService.formatPace(finalStats.pace);
      await audioCueService.announceWorkoutComplete({
        distance: distanceMiles,
        duration: finalStats.duration,
        pace: paceFormatted,
      });

      set({
        isTracking: false,
        isPaused: false,
        isAutoPaused: false,
        isWaitingForMotion: false,
        stats: finalStats,
        coordinates: finalCoordinates,
      });

      // Save run to WatermelonDB
      try {
        const user = useAuthStore.getState().user;
        const { activeWorkout } = get();

        if (user && finalCoordinates.length > 0) {
          await database.write(async () => {
            const newRun = await database.get<Run>('runs').create((run) => {
              run.userId = user.id;
              run.startTime = new Date(finalCoordinates[0].timestamp);
              run.endTime = new Date(finalCoordinates[finalCoordinates.length - 1].timestamp);
              run.distance = finalStats.distance;
              run.duration = finalStats.duration;
              run.pace = finalStats.pace;
              run.avgSpeed = finalStats.avgSpeed;
              run.calories = finalStats.calories;
              run.elevationGain = finalStats.elevationGain;
              run.elevationLoss = finalStats.elevationLoss;
              run.gradeAdjustedPace = finalStats.gradeAdjustedPace || undefined;
              run.gradePercent = finalStats.gradePercent;
              run.terrainDifficulty = finalStats.terrainDifficulty;
              run.route = JSON.stringify(finalCoordinates);

              // Set workout type based on whether there was an active workout
              if (activeWorkout) {
                run.workoutType = 'custom_workout';
                run.workoutName = activeWorkout.name;
              } else {
                run.workoutType = 'free_run';
                run.workoutName = undefined;
              }

              run.synced = false;
            });
            set({ lastRunId: newRun.id });
          });

          const workoutTypeLabel = activeWorkout ? `custom workout: ${activeWorkout.name}` : 'free run';
          console.log(`💾 Run saved to WatermelonDB as ${workoutTypeLabel}`);
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
    const { coordinates, isWaitingForMotion } = get();

    // Don't update if waiting for motion
    if (isWaitingForMotion) return;

    const updatedCoordinates = [...coordinates, coordinate];

    // Calculate current speed
    const currentSpeed = get().calculateCurrentSpeed(updatedCoordinates);

    // Calculate updated stats
    const stats = gpsService.getRunStats();

    set({
      coordinates: updatedCoordinates,
      stats,
      currentSpeed,
    });

    // Check auto-pause
    get().checkAutoPause();

    // Check distance intervals
    get().checkDistanceIntervals();

    // Check workout progress
    get().checkWorkoutProgress();
  },

  // Mark lap
  markLap: () => {
    const { coordinates, currentLapStartIndex, laps } = get();

    if (coordinates.length === 0) return;

    const lapCoordinates = coordinates.slice(currentLapStartIndex);
    if (lapCoordinates.length < 2) return;

    const startTime = lapCoordinates[0].timestamp;
    const endTime = lapCoordinates[lapCoordinates.length - 1].timestamp;
    const duration = (endTime - startTime) / 1000; // seconds

    // Calculate lap distance
    let lapDistance = 0;
    for (let i = 1; i < lapCoordinates.length; i++) {
      const prev = lapCoordinates[i - 1];
      const curr = lapCoordinates[i];

      const R = 6371e3;
      const φ1 = (prev.latitude * Math.PI) / 180;
      const φ2 = (curr.latitude * Math.PI) / 180;
      const Δφ = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const Δλ = ((curr.longitude - prev.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      lapDistance += R * c;
    }

    const lapDistanceMiles = lapDistance * 0.000621371;
    const lapPace = duration > 0 ? (duration / 60) / lapDistanceMiles : 0;

    const lap: Lap = {
      lapNumber: laps.length + 1,
      startTime,
      endTime,
      distance: lapDistance,
      duration,
      pace: lapPace,
      coordinates: lapCoordinates,
    };

    set({
      laps: [...laps, lap],
      currentLapStartIndex: coordinates.length,
    });

    // Announce lap
    const lapPaceFormatted = gpsService.formatPace(lapPace);
    audioCueService.announceLapComplete(lap.lapNumber, lapPaceFormatted);

    console.log(`🏁 Lap ${lap.lapNumber} marked: ${lapDistanceMiles.toFixed(2)} mi, ${lapPaceFormatted}/mi`);
  },

  // Update settings
  updateSettings: (newSettings: Partial<RunSettings>) => {
    const { settings } = get();
    set({ settings: { ...settings, ...newSettings } });
  },

  // Load settings from storage
  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem('runSettings');
      if (stored) {
        const loadedSettings = JSON.parse(stored);
        set({ settings: { ...get().settings, ...loadedSettings } });
        console.log('✅ Loaded run settings:', loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load run settings:', error);
    }
  },

  // Manually complete current segment and advance to next
  completeCurrentSegment: () => {
    const { activeWorkout, stats } = get();
    if (!activeWorkout) return;

    const currentSegment = activeWorkout.segments[activeWorkout.currentSegmentIndex];
    if (!currentSegment) return;

    // Mark a lap for this segment completion
    get().markLap();

    const nextIndex = activeWorkout.currentSegmentIndex + 1;

    if (nextIndex < activeWorkout.segments.length) {
      // Move to next segment
      const nextSegment = activeWorkout.segments[nextIndex];
      set({
        activeWorkout: {
          ...activeWorkout,
          currentSegmentIndex: nextIndex,
          segmentStartTime: Date.now(),
          segmentStartDistance: stats.distance,
        },
      });

      // Announce transition
      audioCueService.speak(`${currentSegment.name} complete. Begin ${nextSegment.name}.`);
      console.log(`✅ Manual segment completion: ${currentSegment.name} → ${nextSegment.name}`);
    } else {
      // Workout complete
      audioCueService.speak(`${activeWorkout.name} complete! Great work!`);
      set({ activeWorkout: null });
      console.log('🎉 Workout complete!');
    }
  },

  // Check workout progress and announce segment transitions
  checkWorkoutProgress: () => {
    const { activeWorkout, stats, isPaused } = get();
    if (!activeWorkout || isPaused) return;

    const currentSegment = activeWorkout.segments[activeWorkout.currentSegmentIndex];
    if (!currentSegment) return;

    const elapsedTime = (Date.now() - activeWorkout.segmentStartTime) / 1000;
    const elapsedDistance = stats.distance - activeWorkout.segmentStartDistance;

    let shouldAdvance = false;

    // Check if segment is complete
    if (currentSegment.duration && elapsedTime >= currentSegment.duration) {
      shouldAdvance = true;
    } else if (currentSegment.distance && elapsedDistance >= currentSegment.distance) {
      shouldAdvance = true;
    }

    if (shouldAdvance) {
      const nextIndex = activeWorkout.currentSegmentIndex + 1;

      if (nextIndex < activeWorkout.segments.length) {
        // Move to next segment
        const nextSegment = activeWorkout.segments[nextIndex];
        set({
          activeWorkout: {
            ...activeWorkout,
            currentSegmentIndex: nextIndex,
            segmentStartTime: Date.now(),
            segmentStartDistance: stats.distance,
          },
        });

        // Announce transition
        audioCueService.speak(`${currentSegment.name} complete. Begin ${nextSegment.name}.`);
        console.log(`🔄 Auto segment transition: ${currentSegment.name} → ${nextSegment.name}`);
      } else {
        // Workout complete
        audioCueService.speak(`${activeWorkout.name} complete! Great work!`);
        set({ activeWorkout: null });
        console.log('🎉 Workout complete!');
      }
    }
  },

  // Reset state
  reset: () => {
    gpsService.reset();
    audioCueService.stop();
    set({
      isTracking: false,
      isPaused: false,
      isAutoPaused: false,
      isWaitingForMotion: false,
      isCountingDown: false,
      countdownValue: 0,
      coordinates: [],
      currentSpeed: 0,
      laps: [],
      currentLapStartIndex: 0,
      lastDistanceInterval: 0,
      stats: {
        distance: 0,
        duration: 0,
        pace: 0,
        avgSpeed: 0,
        calories: 0,
        elevationGain: 0,
        elevationLoss: 0,
        gradeAdjustedPace: null,
        gradePercent: 0,
        terrainDifficulty: 'flat',
      },
      error: null,
    });
    console.log('🔄 Run store reset');
  },

  // Save a workout to storage
  saveWorkout: async (workout: Omit<SavedWorkout, 'id' | 'createdAt'>) => {
    const newWorkout: SavedWorkout = {
      ...workout,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    const updatedWorkouts = [...get().savedWorkouts, newWorkout];
    set({ savedWorkouts: updatedWorkouts });

    try {
      await AsyncStorage.setItem('saved_workouts', JSON.stringify(updatedWorkouts));
      console.log('💾 Workout saved:', newWorkout.name);
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  },

  // Load workouts from storage
  loadWorkouts: async () => {
    try {
      const stored = await AsyncStorage.getItem('saved_workouts');
      if (stored) {
        const workouts = JSON.parse(stored) as SavedWorkout[];
        set({ savedWorkouts: workouts });
        console.log('📂 Loaded', workouts.length, 'saved workouts');
      }
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  },

  // Delete a workout
  deleteWorkout: async (id: string) => {
    const updatedWorkouts = get().savedWorkouts.filter(w => w.id !== id);
    set({ savedWorkouts: updatedWorkouts });

    try {
      await AsyncStorage.setItem('saved_workouts', JSON.stringify(updatedWorkouts));
      console.log('🗑️ Workout deleted');
    } catch (error) {
      console.error('Failed to delete workout:', error);
    }
  },

  // Set active workout from a saved workout
  setActiveWorkoutFromSaved: (workoutId: string) => {
    const savedWorkout = get().savedWorkouts.find(w => w.id === workoutId);
    if (!savedWorkout) return;

    const activeWorkout: ActiveWorkout = {
      id: savedWorkout.id,
      name: savedWorkout.name,
      segments: savedWorkout.segments,
      currentSegmentIndex: 0,
      segmentStartTime: 0,
      segmentStartDistance: 0,
    };

    set({ activeWorkout });
    console.log('🎯 Active workout set:', savedWorkout.name);
  },
}));

// Load settings and workouts on store initialization
useRunStore.getState().loadSettings();
useRunStore.getState().loadWorkouts();
