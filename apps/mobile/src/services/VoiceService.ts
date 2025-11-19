/**
 * VoiceService
 * 
 * Handles voice recording and speech-to-text for workout logging.
 * Uses iOS Speech Recognition for real-time transcription.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';

export interface VoiceRecognitionResult {
  transcription: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceService {
  private isRecording: boolean = false;
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // Set up Voice event listeners
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Coach needs access to your microphone for voice workout logging.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting microphone permission:', err);
        return false;
      }
    }
    // iOS permissions are handled automatically
    return true;
  }

  /**
   * Start voice recognition
   */
  async startRecording(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    // Request permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      onError?.('Microphone permission denied');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      await Voice.start('en-US');
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      onError?.('Failed to start voice recognition');
    }
  }

  /**
   * Stop voice recognition
   */
  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      await Voice.stop();
      this.isRecording = false;
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  /**
   * Cancel voice recognition
   */
  async cancelRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      await Voice.cancel();
      this.isRecording = false;
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Destroy voice service and clean up listeners
   */
  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (error) {
      console.error('Error destroying voice service:', error);
    }
  }

  // Event handlers

  private onSpeechStart(event: any): void {
    console.log('Speech started');
  }

  private onSpeechEnd(event: any): void {
    console.log('Speech ended');
    this.isRecording = false;
  }

  private onSpeechResults(event: any): void {
    if (event.value && event.value.length > 0) {
      const transcription = event.value[0];
      this.onResultCallback?.({
        transcription,
        confidence: 1.0,
        isFinal: true,
      });
    }
  }

  private onSpeechPartialResults(event: any): void {
    if (event.value && event.value.length > 0) {
      const transcription = event.value[0];
      this.onResultCallback?.({
        transcription,
        confidence: 0.5,
        isFinal: false,
      });
    }
  }

  private onSpeechError(event: any): void {
    console.error('Speech recognition error:', event.error);
    this.isRecording = false;
    this.onErrorCallback?.(event.error?.message || 'Speech recognition error');
  }
}

// Singleton instance
export const voiceService = new VoiceService();

