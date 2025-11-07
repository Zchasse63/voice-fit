/**
 * Voice Service Interface
 * 
 * Platform-agnostic interface for voice recognition services.
 * Implementations:
 * - VoiceService.web.ts: Keyboard input for web testing
 * - VoiceService.ios.ts: Apple Speech API (Phase 4)
 */

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface IVoiceService {
  /**
   * Start listening for voice input
   */
  startListening(): Promise<void>;

  /**
   * Stop listening for voice input
   */
  stopListening(): void;

  /**
   * Register callback for voice recognition results
   */
  onResult(callback: (result: VoiceRecognitionResult) => void): void;

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Check if voice recognition is supported on this platform
   */
  isSupported(): boolean;

  /**
   * Check if currently listening
   */
  isListening(): boolean;
}

