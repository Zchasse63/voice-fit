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

    return {
      distance,
      duration,
      pace,
      avgSpeed,
      calories,
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
}

export const gpsService = new GPSService();

