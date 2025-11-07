/**
 * Haptics Service - Platform Selector
 * 
 * Automatically exports the correct haptics service implementation based on platform.
 * - Web: No-op (haptics not supported)
 * - iOS: expo-haptics
 */

import { Platform } from 'react-native';

// Platform-specific export
export const hapticsService = 
  Platform.OS === 'web'
    ? require('./HapticsService.web').hapticsService
    : require('./HapticsService.ios').hapticsService;

