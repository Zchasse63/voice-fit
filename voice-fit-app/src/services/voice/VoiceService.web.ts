/**
 * Voice Service - Web Implementation
 * 
 * For Phase 3 web testing, this uses keyboard input to simulate voice commands.
 * Real Web Speech API integration will be added in Phase 6.
 */

import { IVoiceService, VoiceRecognitionResult } from './VoiceService';

export class VoiceServiceWeb implements IVoiceService {
  private resultCallback?: (result: VoiceRecognitionResult) => void;
  private errorCallback?: (error: Error) => void;
  private listening = false;

  /**
   * Start listening (keyboard mode for web testing)
   */
  async startListening(): Promise<void> {
    this.listening = true;
    console.log('[VoiceService.web] Listening started (keyboard mode)');
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.listening = false;
    console.log('[VoiceService.web] Listening stopped');
  }

  /**
   * Register result callback
   */
  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  /**
   * Register error callback
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Check if voice recognition is supported
   * Always true on web (keyboard fallback)
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.listening;
  }

  /**
   * Simulate voice input (for testing)
   * This method is called by the keyboard input modal
   */
  simulateVoiceInput(transcript: string): void {
    if (!this.listening) {
      console.warn('[VoiceService.web] Not listening, ignoring input');
      return;
    }

    if (this.resultCallback) {
      this.resultCallback({
        transcript,
        confidence: 1.0,
        isFinal: true,
      });
    }
  }

  /**
   * Trigger error callback (for testing)
   */
  simulateError(error: Error): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}

