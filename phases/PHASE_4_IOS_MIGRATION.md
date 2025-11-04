# Phase 4: iOS Migration

**Duration:** Weeks 5-6 (10-14 days)  
**Team Size:** 2-3 developers  
**Prerequisites:** Phase 3 complete (voice processing on web)  
**Deliverable:** iOS app with real voice recognition, offline storage, and Supabase sync

---

## 📋 Overview

Phase 4 ports the web app to iOS with native features:
- Replace keyboard input → Apple Speech Recognition API
- Add WatermelonDB for offline-first storage
- Implement Supabase sync (bidirectional)
- Add expo-haptics for tactile feedback
- Configure Detox for iOS E2E testing
- Test on iOS simulator and physical device

**Success Criteria:**
- ✅ User can speak "bench press 225 for 10" → logs set
- ✅ Voice recognition works on iOS (expo-speech)
- ✅ Sets save to WatermelonDB (offline)
- ✅ Data syncs to Supabase when online
- ✅ Haptic feedback on button presses
- ✅ Detox tests pass on iOS simulator
- ✅ App runs on physical iPhone

---

## 🎯 Tasks

### **Task 4.1: Install iOS Dependencies**

```bash
# Voice recognition
npx expo install expo-speech

# Haptics
npx expo install expo-haptics

# Offline database
npm install @nozbe/watermelondb@^0.27.1
npm install --save-dev @nozbe/with-observables

# Detox
npm install --save-dev detox@^20.0.0
npm install --save-dev detox-expo-helpers
```

---

### **Task 4.2: Create iOS Voice Service**

**Create `src/services/voice/VoiceService.ios.ts`:**
```typescript
import * as Speech from 'expo-speech';
import { IVoiceService, VoiceRecognitionResult } from './VoiceService';

export class VoiceServiceIOS implements IVoiceService {
  private resultCallback?: (result: VoiceRecognitionResult) => void;
  private errorCallback?: (error: Error) => void;
  private isListening = false;

  async startListening(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Speech.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Speech recognition permission denied');
      }

      this.isListening = true;

      // Start recognition
      Speech.startSpeechRecognitionAsync({
        language: 'en-US',
        onResult: (result) => {
          if (this.resultCallback) {
            this.resultCallback({
              transcript: result.transcript,
              confidence: result.confidence || 0.9,
            });
          }
        },
        onError: (error) => {
          if (this.errorCallback) {
            this.errorCallback(new Error(error.message));
          }
        },
      });
    } catch (error) {
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
    }
  }

  stopListening(): void {
    if (this.isListening) {
      Speech.stopSpeechRecognitionAsync();
      this.isListening = false;
    }
  }

  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  isSupported(): boolean {
    return Speech.isAvailableAsync();
  }
}
```

**Update `src/services/voice/index.ts`:**
```typescript
import { Platform } from 'react-native';
import { IVoiceService } from './VoiceService';
import { VoiceServiceWeb } from './VoiceService.web';
import { VoiceServiceIOS } from './VoiceService.ios';

export const VoiceService: IVoiceService = 
  Platform.OS === 'web' 
    ? new VoiceServiceWeb()
    : new VoiceServiceIOS();

export * from './VoiceService';
```

---

### **Task 4.3: Set Up WatermelonDB**

**Create `src/services/database/watermelon/schema.ts`:**
```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'workout_logs',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'workout_name', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'workout_log_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string' },
        { name: 'exercise_name', type: 'string' },
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'voice_command_id', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
```

**Create `src/services/database/watermelon/models/WorkoutLog.ts`:**
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export class WorkoutLog extends Model {
  static table = 'workout_logs';
  static associations = {
    sets: { type: 'has_many', foreignKey: 'workout_log_id' },
  };

  @field('user_id') userId!: string;
  @field('workout_name') workoutName!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime?: Date;
  @field('synced') synced!: boolean;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('sets') sets: any;
}
```

**Create `src/services/database/watermelon/database.ts`:**
```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { WorkoutLog } from './models/WorkoutLog';
import { Set } from './models/Set';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'VoiceFit',
});

export const database = new Database({
  adapter,
  modelClasses: [WorkoutLog, Set],
});
```

---

### **Task 4.4: Implement Supabase Sync**

**Create `src/services/sync/SyncService.ts`:**
```typescript
import { database } from '../database/watermelon/database';
import { supabase } from '../database/supabase.client';
import { Q } from '@nozbe/watermelondb';

export class SyncService {
  async syncWorkouts(): Promise<void> {
    // Get unsynced workouts from WatermelonDB
    const unsyncedWorkouts = await database
      .get('workout_logs')
      .query(Q.where('synced', false))
      .fetch();

    for (const workout of unsyncedWorkouts) {
      // Upload to Supabase
      const { error } = await supabase.from('workout_logs').insert({
        id: workout.id,
        user_id: workout.userId,
        workout_name: workout.workoutName,
        start_time: workout.startTime.toISOString(),
        end_time: workout.endTime?.toISOString(),
      });

      if (!error) {
        // Mark as synced
        await workout.update((w: any) => {
          w.synced = true;
        });
      }
    }
  }

  async syncSets(): Promise<void> {
    const unsyncedSets = await database
      .get('sets')
      .query(Q.where('synced', false))
      .fetch();

    for (const set of unsyncedSets) {
      const { error } = await supabase.from('workout_logs').insert({
        id: set.id,
        workout_log_id: set.workoutLogId,
        exercise_id: set.exerciseId,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      });

      if (!error) {
        await set.update((s: any) => {
          s.synced = true;
        });
      }
    }
  }

  async fullSync(): Promise<void> {
    await this.syncWorkouts();
    await this.syncSets();
  }
}
```

---

### **Task 4.5: Add Haptic Feedback**

**Create `src/services/haptics/HapticsService.ios.ts`:**
```typescript
import * as Haptics from 'expo-haptics';

export class HapticsServiceIOS {
  light(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  medium(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  heavy(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  success(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  error(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
```

**Update VoiceFAB to use haptics:**
```typescript
import { HapticsServiceIOS } from '../../services/haptics/HapticsService.ios';

const haptics = new HapticsServiceIOS();

// In handleVoiceInput:
if (exercise && parsed.weight && parsed.reps) {
  haptics.success(); // ← Add this
  addSet({ ... });
}
```

---

### **Task 4.6: Configure Detox**

**Create `.detoxrc.js`:**
```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VoiceFit.app',
      build: 'xcodebuild -workspace ios/VoiceFit.xcworkspace -scheme VoiceFit -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
```

**Create `__tests__/e2e/ios/voice-logging.e2e.ts`:**
```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Voice Logging (iOS)', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should log set via voice', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();

    // Tap voice FAB
    await element(by.id('voice-fab')).tap();

    // Note: Real voice testing requires manual testing
    // For automated tests, we can test the UI flow
    await detoxExpect(element(by.text('Voice Input'))).toBeVisible();
  });
});
```

---

### **Task 4.7: Test on iOS Simulator**

```bash
# Build iOS app
npx expo prebuild --platform ios

# Run on simulator
npx expo run:ios

# Run Detox tests
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

---

### **Task 4.8: Test on Physical iPhone**

```bash
# Connect iPhone via USB
# Enable Developer Mode on iPhone (Settings → Privacy & Security)

# Run on device
npx expo run:ios --device

# Test voice recognition
# 1. Tap voice FAB
# 2. Speak: "bench press 225 for 10"
# 3. Verify set logs correctly
# 4. Check haptic feedback
```

---

## ✅ Acceptance Criteria

- [ ] Apple Speech Recognition works on iOS
- [ ] User can speak commands → logs sets
- [ ] WatermelonDB stores data offline
- [ ] Supabase sync works (upload unsynced data)
- [ ] Haptic feedback on button presses
- [ ] Detox tests pass on iOS simulator
- [ ] App runs on physical iPhone
- [ ] Voice recognition accuracy >75% in quiet environment
- [ ] No crashes or errors

---

## 🚀 Next Phase

**Phase 5: iOS Native Features**
- GPS tracking for runs
- Voice recognition tuning
- Performance optimization (60fps)
- Battery usage testing

See `phases/PHASE_5_IOS_NATIVE.md`

