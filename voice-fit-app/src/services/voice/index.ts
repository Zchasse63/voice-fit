/**
 * Voice Service - Platform Selector
 *
 * Automatically exports the correct voice service implementation based on platform.
 * - Web: Keyboard input for testing
 * - iOS: Apple Speech Framework via @react-native-voice/voice
 */

import { Platform } from 'react-native';
import { IVoiceService } from './VoiceService';
import { VoiceServiceWeb } from './VoiceService.web';
import { VoiceServiceIOS } from './VoiceService.ios';

// Platform-specific export
export const voiceService: IVoiceService =
  Platform.OS === 'web'
    ? new VoiceServiceWeb()
    : new VoiceServiceIOS();

// Re-export types
export * from './VoiceService';

