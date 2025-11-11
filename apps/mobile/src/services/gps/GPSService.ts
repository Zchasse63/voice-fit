import * as Location from 'expo-location';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

export interface RunStats {
  distance: number; // meters
  duration: number; // seconds
  pace: number; // minutes per mile
  avgSpeed: number; // mph
  calories: number;
  elevationGain: number; // meters
  elevationLoss: number; // meters
  gradeAdjustedPace: number | null; // minutes per mile (GAP)
  gradePercent: number; // average grade percentage
  terrainDifficulty: string; // flat, rolling, moderate_uphill, etc.
}

class GPSService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private coordinates: GPSCoordinate[] = [];
  private startTime: number | null = null;
  private isTracking = false;

  /**
   * Request location permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.error('❌ Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission denied (optional)');
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check location permissions:', error);
      return false;
    }
  }

  /**
   * Start tracking GPS location
   */
  async startTracking(onLocationUpdate: (coordinate: GPSCoordinate) => void): Promise<void> {
    if (this.isTracking) {
      console.warn('⚠️ GPS tracking already started');
      return;
    }

    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      throw new Error('Location permissions not granted');
    }

    try {
      this.isTracking = true;
      this.startTime = Date.now();
      this.coordinates = [];

      console.log('🚀 Starting GPS tracking...');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every 1 second
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          const coordinate: GPSCoordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          this.coordinates.push(coordinate);
          onLocationUpdate(coordinate);

          console.log(`📍 Location update: ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
        }
      );

      console.log('✅ GPS tracking started');
    } catch (error) {
      this.isTracking = false;
      console.error('❌ Failed to start GPS tracking:', error);
      throw error;
    }
  }

  /**
   * Stop tracking GPS location
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      console.warn('⚠️ GPS tracking not started');
      return;
    }

    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isTracking = false;
      console.log('🛑 GPS tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop GPS tracking:', error);
      throw error;
    }
  }

  /**
   * Get current tracking status
   */
  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  /**
   * Get all recorded coordinates
   */
  getCoordinates(): GPSCoordinate[] {
    return [...this.coordinates];
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate total distance from all coordinates
   */
  getTotalDistance(): number {
    if (this.coordinates.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < this.coordinates.length; i++) {
      totalDistance += this.calculateDistance(this.coordinates[i - 1], this.coordinates[i]);
    }

    return totalDistance; // meters
  }

  /**
   * Calculate elevation gain and loss from GPS data
   */
  getElevationData(): { gain: number; loss: number } {
    if (this.coordinates.length < 2) {
      return { gain: 0, loss: 0 };
    }

    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      const prevAltitude = this.coordinates[i - 1].altitude;
      const currAltitude = this.coordinates[i].altitude;

      // Skip if altitude data is missing
      if (prevAltitude === null || currAltitude === null) {
        continue;
      }

      const elevationChange = currAltitude - prevAltitude;

      // Only count significant changes (> 1 meter) to filter GPS noise
      if (elevationChange > 1) {
        totalGain += elevationChange;
      } else if (elevationChange < -1) {
        totalLoss += Math.abs(elevationChange);
      }
    }

    return {
      gain: totalGain,
      loss: totalLoss,
    };
  }

  /**
   * Calculate grade-adjusted pace (GAP)
   * Formula: GAP = Actual Pace × (1 - 0.075 × Grade%)
   */
  private calculateGAP(
    actualPace: number,
    elevationGain: number,
    elevationLoss: number,
    distance: number
  ): { gap: number; gradePercent: number; difficulty: string } {
    // Handle edge cases
    if (distance <= 0) {
      return { gap: actualPace, gradePercent: 0, difficulty: 'flat' };
    }

    // Calculate net elevation change
    const netElevationChange = elevationGain - elevationLoss;

    // Calculate average grade percentage
    const gradePercent = (netElevationChange / distance) * 100;

    // Calculate pace adjustment
    // Formula: GAP = Actual Pace × (1 - 0.075 × Grade%)
    const adjustmentPercent = 0.075 * gradePercent;
    let gap = actualPace * (1 - adjustmentPercent / 100);

    // Ensure GAP is positive and reasonable
    if (gap <= 0) {
      gap = actualPace;
    }

    // Classify terrain difficulty
    let difficulty = 'flat';
    if (Math.abs(gradePercent) < 0.5) {
      difficulty = 'flat';
    } else if (gradePercent > 0) {
      // Uphill
      if (gradePercent > 5) {
        difficulty = 'very_steep_uphill';
      } else if (gradePercent > 3) {
        difficulty = 'steep_uphill';
      } else if (gradePercent > 1) {
        difficulty = 'moderate_uphill';
      } else {
        difficulty = 'rolling';
      }
    } else {
      // Downhill
      if (gradePercent < -5) {
        difficulty = 'steep_downhill';
      } else if (gradePercent < -3) {
        difficulty = 'moderate_downhill';
      } else {
        difficulty = 'rolling';
      }
    }

    return {
      gap,
      gradePercent,
      difficulty,
    };
  }

  /**
   * Calculate run statistics
   */
  getRunStats(): RunStats {
    const distance = this.getTotalDistance(); // meters
    const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0; // seconds
    const distanceMiles = distance * 0.000621371; // Convert meters to miles
    const durationHours = duration / 3600; // Convert seconds to hours
    const avgSpeed = durationHours > 0 ? distanceMiles / durationHours : 0; // mph
    const pace = avgSpeed > 0 ? 60 / avgSpeed : 0; // minutes per mile

    // Rough calorie calculation (based on average 100 calories per mile)
    const calories = Math.round(distanceMiles * 100);

    // Calculate elevation data
    const elevationData = this.getElevationData();

    // Calculate GAP if we have elevation data
    let gradeAdjustedPace: number | null = null;
    let gradePercent = 0;
    let terrainDifficulty = 'flat';

    if (elevationData.gain > 0 || elevationData.loss > 0) {
      const gapData = this.calculateGAP(
        pace,
        elevationData.gain,
        elevationData.loss,
        distance
      );
      gradeAdjustedPace = gapData.gap;
      gradePercent = gapData.gradePercent;
      terrainDifficulty = gapData.difficulty;
    }

    return {
      distance,
      duration,
      pace,
      avgSpeed,
      calories,
      elevationGain: elevationData.gain,
      elevationLoss: elevationData.loss,
      gradeAdjustedPace,
      gradePercent,
      terrainDifficulty,
    };
  }

  /**
   * Reset tracking data
   */
  reset(): void {
    this.coordinates = [];
    this.startTime = null;
    this.isTracking = false;
    console.log('🔄 GPS service reset');
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<GPSCoordinate | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Format pace as MM:SS string
   */
  formatPace(pace: number): string {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted run summary with GAP
   */
  getFormattedRunSummary(): {
    distance: string;
    duration: string;
    pace: string;
    gap: string | null;
    elevation: string;
    terrain: string;
  } {
    const stats = this.getRunStats();
    const distanceMiles = (stats.distance * 0.000621371).toFixed(2);
    const durationMinutes = Math.floor(stats.duration / 60);
    const durationSeconds = Math.floor(stats.duration % 60);
    const paceFormatted = this.formatPace(stats.pace);
    const gapFormatted = stats.gradeAdjustedPace
      ? this.formatPace(stats.gradeAdjustedPace)
      : null;
    const elevationFormatted = `+${Math.round(stats.elevationGain)}m / -${Math.round(stats.elevationLoss)}m`;

    return {
      distance: `${distanceMiles} mi`,
      duration: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
      pace: `${paceFormatted}/mi`,
      gap: gapFormatted ? `${gapFormatted}/mi` : null,
      elevation: elevationFormatted,
      terrain: stats.terrainDifficulty,
    };
  }
}

export const gpsService = new GPSService();

