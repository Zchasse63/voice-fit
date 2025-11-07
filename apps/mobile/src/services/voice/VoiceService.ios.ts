/**
 * Voice Service - iOS Implementation
 * 
 * Uses Apple Speech Framework via @react-native-voice/voice
 * for native speech recognition on iOS devices.
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { IVoiceService, VoiceRecognitionResult } from './VoiceService';

export class VoiceServiceIOS implements IVoiceService {
  private resultCallback?: (result: VoiceRecognitionResult) => void;
  private errorCallback?: (error: Error) => void;
  private listening = false;

  constructor() {
    // Set up event listeners
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  private onSpeechStart(): void {
    console.log('[VoiceService.ios] Speech recognition started');
    this.listening = true;
  }

  private onSpeechEnd(): void {
    console.log('[VoiceService.ios] Speech recognition ended');
    this.listening = false;
  }

  private onSpeechResults(event: SpeechResultsEvent): void {
    if (event.value && event.value.length > 0 && this.resultCallback) {
      const transcript = event.value[0];
      console.log('[VoiceService.ios] Final result:', transcript);

      this.resultCallback({
        transcript,
        confidence: 0.95, // Apple Speech Framework doesn't provide confidence scores
        isFinal: true,
      });
    }
  }

  private onSpeechPartialResults(event: SpeechResultsEvent): void {
    if (event.value && event.value.length > 0 && this.resultCallback) {
      const transcript = event.value[0];
      console.log('[VoiceService.ios] Partial result:', transcript);

      // Send partial results for real-time feedback
      this.resultCallback({
        transcript,
        confidence: 0.7, // Lower confidence for partial results
        isFinal: false,
      });
    }
  }

  private onSpeechError(event: SpeechErrorEvent): void {
    console.error('[VoiceService.ios] Speech error:', event.error);

    if (this.errorCallback) {
      this.errorCallback(
        new Error(event.error?.message || 'Speech recognition error')
      );
    }

    this.listening = false;
  }

  async startListening(): Promise<void> {
    try {
      // Check if speech recognition is available
      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Speech recognition not available on this device');
      }

      // Destroy any existing session
      if (this.listening) {
        await Voice.destroy();
      }

      // Start listening with Apple Speech Framework
      await Voice.start('en-US', {
        EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 60000, // 60 seconds max
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000, // 10s silence = done
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000, // 3s pause = might be done
      });

      console.log('[VoiceService.ios] Listening started');
    } catch (error) {
      console.error('[VoiceService.ios] Start error:', error);
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
      throw error;
    }
  }

  stopListening(): void {
    Voice.stop()
      .then(() => {
        this.listening = false;
        console.log('[VoiceService.ios] Listening stopped');
      })
      .catch((error) => {
        console.error('[VoiceService.ios] Stop error:', error);
      });
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
      this.listening = false;
      console.log('[VoiceService.ios] Voice service destroyed');
    } catch (error) {
      console.error('[VoiceService.ios] Destroy error:', error);
    }
  }

  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  isSupported(): boolean {
    // Apple Speech Framework is available on iOS 10+
    return true;
  }

  isListening(): boolean {
    return this.listening;
  }
}

