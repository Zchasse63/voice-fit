/**
 * HealthKit Service
 * 
 * Manages Apple HealthKit integration for VoiceFit.
 * Handles permissions, background sync, and data ingestion.
 */

// @ts-ignore - react-native-health types may not be available
const AppleHealthKit = require('react-native-health');

export interface HealthValue {
  value: number;
}

export interface HealthKitPermissions {
  permissions: {
    read: string[];
    write: string[];
  };
}

import { supabase } from '../database/supabase.client';

export interface HealthKitData {
  heartRate?: number;
  hrv?: number;
  restingHeartRate?: number;
  steps?: number;
  activeEnergy?: number;
  sleepAnalysis?: any[];
  workouts?: any[];
}

class HealthKitService {
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize HealthKit with required permissions
   */
  async initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.RespiratoryRate,
            AppleHealthKit.Constants.Permissions.OxygenSaturation,
            AppleHealthKit.Constants.Permissions.BodyTemperature,
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage,
          ],
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('[HealthKit] Initialization error:', error);
          resolve(false);
        } else {
          console.log('[HealthKit] Initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Request HealthKit permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isInitialized) {
      return await this.initialize();
    }
    return true;
  }

  /**
   * Start background sync (every 30 minutes)
   */
  startBackgroundSync(userId: string) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    this.syncHealthData(userId);

    // Sync every 30 minutes
    this.syncInterval = setInterval(() => {
      this.syncHealthData(userId);
    }, 30 * 60 * 1000) as any;

    console.log('[HealthKit] Background sync started');
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[HealthKit] Background sync stopped');
    }
  }

  /**
   * Sync all health data to backend
   */
  async syncHealthData(userId: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[HealthKit] Not initialized, skipping sync');
      return;
    }

    try {
      console.log('[HealthKit] Starting sync...');

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch all health data
      const [
        heartRate,
        hrv,
        restingHR,
        steps,
        activeEnergy,
        sleep,
        workouts,
        respiratoryRate,
        spo2,
        bodyTemp,
        weight,
        bodyFat,
      ] = await Promise.all([
        this.getHeartRate(yesterday, now),
        this.getHRV(yesterday, now),
        this.getRestingHeartRate(yesterday, now),
        this.getSteps(yesterday, now),
        this.getActiveEnergy(yesterday, now),
        this.getSleepAnalysis(yesterday, now),
        this.getWorkouts(yesterday, now),
        this.getRespiratoryRate(yesterday, now),
        this.getOxygenSaturation(yesterday, now),
        this.getBodyTemperature(yesterday, now),
        this.getWeight(yesterday, now),
        this.getBodyFatPercentage(yesterday, now),
      ]);

      // Send to backend
      await this.sendToBackend(userId, {
        heartRate,
        hrv,
        restingHR,
        steps,
        activeEnergy,
        sleep,
        workouts,
        respiratoryRate,
        spo2,
        bodyTemp,
        weight,
        bodyFat,
      });

      console.log('[HealthKit] Sync completed successfully');
    } catch (error) {
      console.error('[HealthKit] Sync error:', error);
    }
  }

  /**
   * Get heart rate data
   */
  private async getHeartRate(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getHeartRateSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Heart rate error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get HRV data
   */
  private async getHRV(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getHeartRateVariabilitySamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] HRV error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get resting heart rate
   */
  private async getRestingHeartRate(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getRestingHeartRate(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Resting HR error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get steps
   */
  private async getSteps(startDate: Date, endDate: Date): Promise<number> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getStepCount(options, (err: any, results: HealthValue) => {
        if (err) {
          console.error('[HealthKit] Steps error:', err);
          resolve(0);
        } else {
          resolve(results?.value || 0);
        }
      });
    });
  }

  /**
   * Get active energy burned
   */
  private async getActiveEnergy(startDate: Date, endDate: Date): Promise<number> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: HealthValue) => {
        if (err) {
          console.error('[HealthKit] Active energy error:', err);
          resolve(0);
        } else {
          resolve(results?.value || 0);
        }
      });
    });
  }

  /**
   * Get sleep analysis
   */
  private async getSleepAnalysis(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getSleepSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Sleep error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get workouts
   */
  private async getWorkouts(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Workouts error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get respiratory rate
   */
  private async getRespiratoryRate(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getRespiratoryRateSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Respiratory rate error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get oxygen saturation
   */
  private async getOxygenSaturation(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      AppleHealthKit.getOxygenSaturationSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] SpO2 error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get body temperature
   */
  private async getBodyTemperature(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      (AppleHealthKit as any).getBodyTemperatureSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Body temperature error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get weight
   */
  private async getWeight(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      (AppleHealthKit as any).getWeightSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Weight error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Get body fat percentage
   */
  private async getBodyFatPercentage(startDate: Date, endDate: Date): Promise<any[]> {
    return new Promise((resolve) => {
      const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
      (AppleHealthKit as any).getBodyFatPercentageSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Body fat percentage error:', err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Send health data to backend
   */
  private async sendToBackend(userId: string, data: any): Promise<void> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('[HealthKit] No active session');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/wearables/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          source: 'apple_health',
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend sync failed: ${response.statusText}`);
      }

      console.log('[HealthKit] Data sent to backend successfully');
    } catch (error) {
      console.error('[HealthKit] Backend sync error:', error);
      throw error;
    }
  }
}

export default new HealthKitService();

