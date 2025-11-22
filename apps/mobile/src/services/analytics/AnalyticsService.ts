import * as Amplitude from "expo-analytics-amplitude";

// Public API key is provided via EXPO_PUBLIC_AMPLITUDE_API_KEY at build/runtime.
// If the key is missing (e.g., in local dev), all methods become safe no-ops.
const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? "";

export class AnalyticsService {
  static async initialize() {
    if (!AMPLITUDE_API_KEY) return;

    try {
      await Amplitude.initializeAsync(AMPLITUDE_API_KEY);
    } catch (error) {
      console.warn("[Analytics] Failed to initialize Amplitude", error);
    }
  }

  /**
   * Identify the current user. Pass null to clear the identity on logout.
   */
  static async setUserId(userId: string | null) {
    if (!AMPLITUDE_API_KEY) return;

    try {
      await Amplitude.setUserIdAsync(userId);
    } catch (error) {
      console.warn("[Analytics] Failed to set user id", error);
    }
  }

  /**
   * Log a typed analytics event.
   */
  static async logEvent(eventName: string, _properties?: Record<string, unknown>) {
    if (!AMPLITUDE_API_KEY) return;

    try {
      await Amplitude.logEventAsync(eventName);
    } catch (error) {
      console.warn(`[Analytics] Failed to log event ${eventName}`, error);
    }
  }
}

