# Voice Fit - Frontend Technical Specification (Part 3)
**Continued from FRONTEND_TECHNICAL_SPECIFICATION_PART2.md**

---

## 6. Voice Interaction UX Specifications

### 6.1 Supported Voice Commands & Natural Language Patterns

**Standard Format:**
```
[Exercise Name] [Weight] [Weight Unit] for [Reps] [at RPE X]

Examples:
- "Bench press 225 pounds for 8 reps"
- "Bench press 225 for 8"
- "Bench 225 for 8 at RPE 8"
```

**Abbreviations & Shortcuts:**
```
Exercise Abbreviations:
- RDL → Romanian Deadlift
- OHP → Overhead Press
- DB → Dumbbell
- KB → Kettlebell
- BB → Barbell
- GHD → Glute Ham Developer
- ATG → Ass To Grass (split squat)
- Nord Curl → Nordic Hamstring Curl

Equipment Shortcuts:
- "db rows" → Dumbbell Bent Over Row
- "kb swings" → Kettlebell Swing
- "bb bench" → Barbell Bench Press

Examples:
- "RDL 315 for 5"
- "OHP 135 for 8"
- "db rows 80s for 12"
```

**Competition Terminology:**
```
- "comp bench" → Competition Bench Press (pause bench)
- "pause squat" → Pause Squat
- "box squat" → Box Squat
- "touch and go bench" → Bench Press (no pause)

Examples:
- "comp bench 185 for 8"
- "pause squat 315 for 3"
```

**Same Weight References:**
```
- "same weight for 7"
- "same for 6"
- "repeat for 8"

Requirements:
- Must have previous_set context
- Backend uses last weight from session
```

**Bodyweight Exercises:**
```
- "pull-ups for 10"
- "push-ups for 20"
- "dips for 12"
- "chin-ups for 8"

Note: No weight specified, backend returns weight: null
```

**YouTube Influencer Terminology:**
```
Supported influencers:
- Jeff Nippard
- Renaissance Periodization (Dr. Mike Israetel)
- Squat University (Dr. Aaron Horschig)
- Barbell Medicine
- AthleanX
- Jeff Cavaliere
- Alan Thrall
- Omar Isuf
- Brian Alsruhe
- Calgary Barbell
- Juggernaut Training Systems
- Mark Rippetoe
- Starting Strength

Examples:
- "Nippard RDL" → Romanian Deadlift
- "RP chest fly" → Dumbbell Chest Fly
- "Squat U goblet squat" → Goblet Squat
```

**Full Command Examples:**
```
1. "Barbell bench press 225 pounds for 8 reps at RPE 8"
2. "Bench 225 for 8"
3. "RDL 315 for 5"
4. "db rows 80s for 12"
5. "comp bench 185 for 8"
6. "same weight for 7"
7. "pull-ups for 10"
8. "OHP 135 for 8 at RPE 7"
9. "Nippard RDL 275 for 6"
10. "pause squat 315 for 3 at RPE 9"
```

### 6.2 Real-Time Feedback Requirements

**Visual Feedback Timeline:**
```
0ms: User taps Voice FAB
  ↓
  - FAB animates (scale up, color change)
  - Mic icon changes to waveform
  - Haptic feedback (light impact)
  
100ms: Start listening
  ↓
  - Waveform animates (pulse with audio)
  - "Listening..." text appears
  - Background dims slightly
  
0-5000ms: User speaks
  ↓
  - Waveform responds to audio levels
  - Transcript appears in real-time (optional)
  
5000ms: Auto-stop (or user taps FAB again)
  ↓
  - Waveform stops
  - "Processing..." text appears
  - Loading spinner
  
500-3000ms: API call to /api/voice/parse
  ↓
  - Loading spinner continues
  - "Analyzing..." text
  
Response received:
  ↓
  HIGH CONFIDENCE (≥85%):
    - Green checkmark animation
    - Brief confirmation (2s)
    - "Logged: Bench Press 225 lbs × 8"
    - Auto-dismiss
  
  MEDIUM CONFIDENCE (70-85%):
    - Yellow warning icon
    - Confirmation sheet slides up
    - Display parsed data
    - "Confirm" or "Retry" buttons
  
  LOW CONFIDENCE (<70%):
    - Red X animation
    - Error message
    - "Could not understand. Please try again."
    - Retry button
```

**Haptic Feedback:**
```typescript
import * as Haptics from 'expo-haptics';

// On FAB tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On successful parse (high confidence)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// On error (low confidence)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// On confirmation (medium confidence)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

**Audio Feedback:**
```
- Start listening: Subtle "beep" sound
- Stop listening: Subtle "beep" sound (different pitch)
- Success: Subtle "ding" sound
- Error: Subtle "error" sound

Note: All sounds optional, user can disable in settings
```

### 6.3 Error States & User Corrections Flow

**Error States:**

1. **Low Confidence (<70%):**
   ```
   UI:
   - Red X icon
   - "Could not understand. Please try again."
   - Retry button
   
   User Actions:
   - Tap "Retry" → Return to listening
   - Tap "Manual Entry" → Show form
   ```

2. **Network Error:**
   ```
   UI:
   - Orange warning icon
   - "Network error. Check your connection."
   - Retry button
   
   User Actions:
   - Tap "Retry" → Retry API call
   - Tap "Offline Mode" → Save locally, sync later
   ```

3. **Timeout:**
   ```
   UI:
   - Orange warning icon
   - "Request timed out. Please try again."
   - Retry button
   
   User Actions:
   - Tap "Retry" → Retry API call
   ```

4. **Ambiguous Exercise:**
   ```
   UI:
   - Yellow warning icon
   - "Did you mean Barbell Bench Press?"
   - Confirmation sheet with alternatives
   
   User Actions:
   - Tap "Yes" → Accept suggestion
   - Tap "No" → Show alternatives
   - Tap "Manual Entry" → Show form
   ```

**User Corrections Flow:**

```
1. User sees incorrect parse
   ↓
2. Tap "Edit" button on confirmation sheet
   ↓
3. Show edit form with pre-filled data
   - Exercise (dropdown with search)
   - Weight (number input)
   - Reps (number input)
   - RPE (slider 1-10)
   ↓
4. User makes corrections
   ↓
5. Tap "Save"
   ↓
6. Update workout_logs table
   ↓
7. Log correction to voice_commands table
   - was_corrected: true
   - corrected_output: { corrected data }
   ↓
8. Return to START screen
```

**Correction Tracking:**
```typescript
// Log correction to backend
await supabase
  .from('voice_commands')
  .update({
    was_corrected: true,
    corrected_output: {
      exercise_id: correctedExerciseId,
      weight: correctedWeight,
      reps: correctedReps,
      rpe: correctedRpe,
    },
    corrected_at: new Date().toISOString(),
  })
  .eq('id', voiceCommandId);

// This data is used for monthly retraining
```

### 6.4 Offline Behavior & Sync Requirements

**Offline Strategy:**

**Web (Development):**
- No offline support
- Requires internet connection
- Show error if offline

**iOS (Production):**
- Full offline support with WatermelonDB
- Sync to Supabase when online

**Offline Workflow:**
```
1. User starts workout (offline)
   ↓
2. Voice commands processed locally (if possible)
   - Use cached exercise list
   - Simple regex parsing (fallback)
   ↓
3. Sets saved to WatermelonDB
   - Marked as "pending_sync"
   ↓
4. User goes online
   ↓
5. Auto-sync to Supabase
   - Upload pending sets
   - Update voice_commands table
   - Mark as "synced"
   ↓
6. Resolve conflicts (if any)
   - Server wins (default)
   - Or show conflict resolution UI
```

**Sync Indicators:**
```
UI Elements:
- Sync status icon (top right)
  - Green checkmark: Synced
  - Orange cloud: Syncing...
  - Red X: Sync failed
  
- Pending sync count
  - "3 sets pending sync"
  
- Manual sync button
  - "Sync Now"
```

**Conflict Resolution:**
```
Scenarios:
1. User edits set on device A, device B syncs first
   → Server wins, show notification
   
2. User deletes set on device A, device B adds set
   → Server wins, restore deleted set
   
3. User edits same set on multiple devices
   → Show conflict resolution UI
   → User chooses which version to keep
```

---

## 7. Technical Implementation Notes

### 7.1 Web-First Development Approach

**Development Workflow:**
```
1. Build feature on WEB (localhost)
   - Faster iteration (instant hot reload)
   - Better debugging (Chrome DevTools)
   - Easier E2E testing (Playwright)
   
2. Test with Playwright
   - Mock voice input (keyboard)
   - Mock API responses
   - Test all user flows
   
3. Verify UI/UX in browser
   - Responsive design
   - Accessibility
   - Performance
   
4. Port to iOS
   - Replace keyboard → Apple Speech Framework
   - Replace Supabase direct → WatermelonDB
   - Add native features (haptics, notifications)
   
5. Test with Detox (iOS)
   - Real device testing
   - E2E tests
   
6. Deploy to TestFlight
   - Beta testing
   - Bug fixes
```

**Why Web-First:**
- ✅ Faster iteration (instant hot reload vs 30s+ iOS builds)
- ✅ Better debugging (Chrome DevTools vs Xcode)
- ✅ Easier E2E testing (Playwright > Detox flakiness)
- ✅ Team velocity (designers preview in browser)
- ✅ CI/CD simplicity (30s builds vs 5-10min iOS builds)

**Web Limitations:**
- ❌ No Apple Speech Framework (use keyboard input)
- ❌ No WatermelonDB (use Supabase direct)
- ❌ No native features (haptics, notifications)
- ❌ No offline support

**Web → iOS Migration Checklist:**
```
[ ] Replace keyboard input → Apple Speech Framework
[ ] Replace Supabase direct → WatermelonDB + sync
[ ] Add haptic feedback (expo-haptics)
[ ] Add push notifications (expo-notifications)
[ ] Add offline support (WatermelonDB)
[ ] Test on physical device
[ ] Configure Detox for E2E testing
[ ] Deploy to TestFlight
```

### 7.2 iOS Production Deployment Strategy

**Build Configuration:**
```
Expo Config (app.json):
{
  "expo": {
    "name": "Voice Fit",
    "slug": "voice-fit",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.voicefit.app",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSSpeechRecognitionUsageDescription": "Voice Fit uses speech recognition to log your workouts hands-free.",
        "NSMicrophoneUsageDescription": "Voice Fit needs microphone access to recognize your voice commands."
      }
    },
    "plugins": [
      "expo-speech",
      "expo-haptics",
      "expo-notifications",
      "expo-secure-store"
    ]
  }
}
```

**Deployment Steps:**
```
1. Build iOS app with EAS Build
   $ eas build --platform ios --profile production
   
2. Submit to TestFlight
   $ eas submit --platform ios
   
3. Beta testing (2-4 weeks)
   - Invite testers
   - Collect feedback
   - Fix bugs
   
4. Submit to App Store
   - App Store Connect
   - Screenshots, description, keywords
   - App Review (1-3 days)
   
5. Launch! 🚀
```

### 7.3 Figma UI Kit Integration

**Design System:**
- **Source:** FinWise Banking UI Kit (Figma)
- **Adaptation:** Banking → Fitness tracking
- **Components:** Buttons, cards, inputs, modals, charts
- **Colors:** Forest green, terracotta, deep teal
- **Typography:** Inter (Bold, Regular)

**Component Mapping:**
```
Figma Component → Voice Fit Component
─────────────────────────────────────
Account Card → Workout Card
Transaction List → Set History List
Balance Display → Stats Display
Send Money Button → Voice FAB
Category Filter → Exercise Filter
Chart Card → Performance Chart
Settings Screen → Coach Screen
```

**Design Tokens (Tailwind):**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      // Light Mode
      background: {
        light: '#FBF7F5',
        dark: '#1A1A1A',
      },
      primary: {
        500: '#2C5F3D',  // Forest Green
        600: '#234A31',
      },
      secondary: {
        500: '#DD7B57',  // Terracotta
      },
      accent: {
        500: '#36625E',  // Deep Teal
      },
      // Dark Mode
      primaryDark: '#4A9B6F',
      secondaryDark: '#F9AC60',
      accentDark: '#86F4EE',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    fontFamily: {
      heading: ['Inter-Bold'],
      body: ['Inter-Regular'],
    },
  },
};
```

### 7.4 WatermelonDB for iOS Offline Storage

**Setup:**
```typescript
// src/database/watermelon/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'workout_logs',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'workout_id', type: 'string' },
        { name: 'exercise_id', type: 'string' },
        { name: 'set_number', type: 'number' },
        { name: 'weight', type: 'number', isOptional: true },
        { name: 'weight_unit', type: 'string', isOptional: true },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'rir', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    // ... other tables
  ],
});
```

**Sync Strategy:**
```typescript
// src/services/sync/SyncService.ts
export class SyncService {
  async syncToSupabase() {
    // 1. Get all unsynced records
    const unsyncedSets = await database
      .get('workout_logs')
      .query(Q.where('synced', false))
      .fetch();
    
    // 2. Upload to Supabase
    for (const set of unsyncedSets) {
      await supabase.from('workout_logs').insert({
        user_id: set.user_id,
        workout_id: set.workout_id,
        exercise_id: set.exercise_id,
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        created_at: new Date(set.created_at).toISOString(),
      });
      
      // 3. Mark as synced
      await set.update((record) => {
        record.synced = true;
      });
    }
  }
}
```

### 7.5 Apple Speech Framework Integration

**Setup:**
```typescript
// src/services/voice/AppleSpeechService.ts
import * as Speech from 'expo-speech';

export class AppleSpeechService implements IVoiceService {
  private recognition: Speech.SpeechRecognition;
  
  async startListening(): Promise<void> {
    // Request permissions
    const { status } = await Speech.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission denied');
    }
    
    // Start recognition
    this.recognition = new Speech.SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      this.onResultCallback({ transcript, confidence });
    };
    
    this.recognition.onerror = (event) => {
      this.onErrorCallback(new Error(event.error));
    };
    
    this.recognition.start();
  }
  
  stopListening(): void {
    this.recognition?.stop();
  }
}
```

**Usage:**
```typescript
// In VoiceFAB component
const handleVoiceInput = async () => {
  try {
    await voiceService.startListening();
    
    voiceService.onResult((result) => {
      // Call API with transcript
      parseVoiceCommand(result.transcript);
    });
    
    voiceService.onError((error) => {
      showError(error.message);
    });
  } catch (error) {
    showError('Failed to start voice recognition');
  }
};
```

---

## 8. Data Synchronization

### 8.1 Voice Commands Sync with Supabase

**Web (Direct):**
```typescript
// Direct insert to Supabase
const { data, error } = await supabase
  .from('voice_commands')
  .insert({
    user_id: userId,
    workout_id: workoutId,
    transcript: transcript,
    parsed_output: parsedData,
    confidence: confidence,
    model_id: modelId,
    latency_ms: latencyMs,
    created_at: new Date().toISOString(),
  });
```

**iOS (WatermelonDB → Supabase):**
```typescript
// 1. Insert to WatermelonDB
await database.write(async () => {
  await database.get('voice_commands').create((record) => {
    record.user_id = userId;
    record.transcript = transcript;
    record.parsed_output = JSON.stringify(parsedData);
    record.confidence = confidence;
    record.synced = false;
  });
});

// 2. Sync to Supabase (when online)
await syncService.syncVoiceCommands();
```

### 8.2 Cache Behavior & Performance Optimization

**Upstash Search Cache:**
- **Purpose:** Fast exercise name matching
- **Strategy:** Check cache first, then call fine-tuned model
- **Hit Rate Target:** 60-80%
- **Latency:** ~50-100ms (cache hit), ~2-5s (cache miss)

**Cache Flow:**
```
1. User speaks: "Bench press 225 for 8"
   ↓
2. Backend checks Upstash Search cache
   - Query: "bench press"
   - Returns: "Barbell Bench Press" (confidence: 0.95)
   ↓
3. If cache hit (confidence ≥ 0.8):
   - Skip fine-tuned model call
   - Return cached result
   - Latency: ~50-100ms
   ↓
4. If cache miss (confidence < 0.8):
   - Call fine-tuned model
   - Update cache with result
   - Latency: ~2-5s
```

**Frontend Caching:**
```typescript
// Cache exercises in memory
const exerciseCache = new Map<string, Exercise>();

// On app launch, fetch all exercises
const exercises = await supabase.from('exercises').select('*');
exercises.forEach((ex) => exerciseCache.set(ex.id, ex));

// Use cache for fast lookups
const exercise = exerciseCache.get(exerciseId);
```

### 8.3 Offline-First Considerations for iOS

**Offline Capabilities:**
- ✅ Log workouts (WatermelonDB)
- ✅ View workout history (last 30 days cached)
- ✅ View exercise library (cached)
- ❌ Voice parsing (requires API call)
- ❌ Sync to Supabase (requires internet)

**Offline Voice Parsing (Fallback):**
```typescript
// Simple regex-based parsing (offline fallback)
const parseOffline = (transcript: string) => {
  const regex = /(\w+)\s+(\d+)\s+for\s+(\d+)/i;
  const match = transcript.match(regex);
  
  if (match) {
    return {
      exercise_name: match[1],
      weight: parseFloat(match[2]),
      reps: parseInt(match[3]),
      confidence: 0.6, // Low confidence
    };
  }
  
  return null;
};
```

**Sync Queue:**
```typescript
// Queue pending syncs
const syncQueue = [];

// Add to queue when offline
syncQueue.push({
  type: 'workout_log',
  data: workoutLogData,
  timestamp: Date.now(),
});

// Process queue when online
const processSyncQueue = async () => {
  for (const item of syncQueue) {
    await supabase.from(item.type).insert(item.data);
  }
  syncQueue.length = 0; // Clear queue
};
```

---

## 9. Summary & Next Steps

### 9.1 Key Takeaways

**Backend (Production Ready):**
- ✅ Fine-tuned GPT-4o-mini model (95.57% accuracy)
- ✅ 456 exercises with 100% synonym coverage
- ✅ Upstash Search cache (100% test success)
- ✅ FastAPI backend with JWT authentication
- ✅ Comprehensive testing (96 tests passing)

**Frontend (To Be Built):**
- ⚠️ React Native app (Expo SDK 53)
- ⚠️ 5-tab navigation (Home, Log, START, PRs, Coach)
- ⚠️ Voice-first interaction (Apple Speech Framework)
- ⚠️ Offline support (WatermelonDB)
- ⚠️ Figma UI kit integration

**Core Feature (Voice Logging):**
- User taps Voice FAB → speaks command → sees parsed data → confirms → set logged
- Confidence-based UX (auto-accept ≥85%, confirm 70-85%, retry <70%)
- Real-time feedback (<3s from speech → confirmed log)

### 9.2 Development Phases

**Phase 1: Foundation (Week 1)**
- Initialize Expo project
- Set up navigation
- Configure Tailwind + Figma tokens

**Phase 2: Web Development (Weeks 2-3)**
- Build core screens
- Implement Zustand stores
- Set up Supabase client

**Phase 3: Voice Processing (Week 4)**
- Integrate FastAPI backend
- Build VoiceFAB component
- Test with keyboard input

**Phase 4: iOS Migration (Weeks 5-6)**
- Add Apple Speech Framework
- Implement WatermelonDB
- Configure Detox testing

**Phase 5-7: Polish & Launch (Weeks 7-10)**
- Animations, dark mode, charts
- TestFlight beta
- App Store submission

### 9.3 Contact & Support

**Backend Documentation:**
- API Docs: `http://localhost:8000/docs`
- Database Schema: `archive/database-migrations/01_schema.sql`
- Voice Commands: `archive/backend-development/voice_parser_api.py`

**Questions?**
- Technical questions: Check existing documentation
- API issues: Test with `/health` endpoint
- Database issues: Verify Supabase connection

---

**End of Technical Specification**

This document provides everything your UI/UX development team needs to build the Voice Fit frontend. All backend services are production-ready and tested. Focus on building a great user experience with voice-first interaction!

