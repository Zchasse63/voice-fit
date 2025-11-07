/**
 * Haptics Service - iOS Implementation
 * 
 * Provides tactile feedback using expo-haptics for iOS devices.
 * Different feedback types for different user actions.
 */

import * as Haptics from 'expo-haptics';

export class HapticsServiceIOS {
  /**
   * Light impact - for subtle interactions
   * Use for: button taps, minor UI interactions
   */
  light(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium impact - for standard interactions
   * Use for: navigation, selection changes
   */
  medium(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy impact - for significant interactions
   * Use for: important actions, confirmations
   */
  heavy(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Success notification - for successful operations
   * Use for: set logged, workout completed, sync successful
   */
  success(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification - for warnings
   * Use for: validation errors, warnings
   */
  warning(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification - for errors
   * Use for: failed operations, critical errors
   */
  error(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Selection changed - for picker/selector changes
   * Use for: scrolling through options, changing values
   */
  selection(): void {
    Haptics.selectionAsync();
  }
}

// Export singleton instance
export const hapticsService = new HapticsServiceIOS();

