import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VoiceOption = 'default' | 'male' | 'female';
export type VolumeLevel = 'low' | 'normal' | 'high';

interface AudioSettings {
  startStopCues: boolean;
  runSplits: boolean;
  paceAlerts: boolean;
  feedbackDistance: 'half' | 'mile';
  voice: VoiceOption;
  volume: VolumeLevel;
}

class AudioCueService {
  private settings: AudioSettings = {
    startStopCues: true,
    runSplits: false,
    paceAlerts: false,
    feedbackDistance: 'mile',
    voice: 'default',
    volume: 'normal',
  };

  private volumeMap: Record<VolumeLevel, number> = {
    low: 0.3,
    normal: 0.7,
    high: 1.0,
  };

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('audioSettings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await AsyncStorage.setItem('audioSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async speak(text: string) {
    const volume = this.volumeMap[this.settings.volume];
    
    // Stop any ongoing speech
    await Speech.stop();
    
    await Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      volume,
    });
  }

  async announceWorkoutStart() {
    if (this.settings.startStopCues) {
      await this.speak('Workout started');
    }
  }

  async announceWorkoutPaused() {
    if (this.settings.startStopCues) {
      await this.speak('Workout paused');
    }
  }

  async announceWorkoutResumed() {
    if (this.settings.startStopCues) {
      await this.speak('Workout resumed');
    }
  }

  async announceWorkoutComplete(stats: { distance: number; duration: number; pace: string }) {
    if (this.settings.startStopCues) {
      const miles = stats.distance.toFixed(2);
      const minutes = Math.floor(stats.duration / 60);
      const seconds = stats.duration % 60;
      await this.speak(
        `Workout complete. ${miles} miles in ${minutes} minutes and ${seconds} seconds. Average pace ${stats.pace}`
      );
    }
  }

  async announceLapComplete(lapNumber: number, lapPace: string) {
    if (this.settings.runSplits) {
      await this.speak(`Lap ${lapNumber} complete. Pace ${lapPace}`);
    }
  }

  async announceDistanceInterval(distance: number, averagePace: string) {
    const distanceText = this.settings.feedbackDistance === 'half' ? 'Half mile' : 'Mile';
    const intervalNumber = Math.floor(distance / (this.settings.feedbackDistance === 'half' ? 0.5 : 1));
    
    if (intervalNumber > 0) {
      await this.speak(`${distanceText} ${intervalNumber} complete. Average pace ${averagePace}`);
    }
  }

  async announcePaceAlert(type: 'fast' | 'slow') {
    if (this.settings.paceAlerts) {
      const message = type === 'fast' ? 'Pace too fast' : 'Pace too slow';
      await this.speak(message);
    }
  }

  async announceCountdown(seconds: number) {
    await this.speak(seconds.toString());
  }

  async announceStartOnMotion() {
    await this.speak('Waiting for motion');
  }

  async announceAutoPause() {
    await this.speak('Auto paused');
  }

  async announceAutoResume() {
    await this.speak('Auto resumed');
  }

  async stop() {
    await Speech.stop();
  }
}

export const audioCueService = new AudioCueService();

