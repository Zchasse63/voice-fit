# Voice Fit - Technical Architecture & Project Structure
**Version:** 1.0  
**Last Updated:** November 4, 2025  
**Status:** Implementation-Ready  
**Development Strategy:** Web-First Testing → iOS Production

---

## CRITICAL DEVELOPMENT APPROACH

### Why Web-First?

**iOS is the target platform, but we develop/test on web first:**

✅ **Faster iteration**: Hot reload is instant, no rebuilds  
✅ **Better debugging**: Chrome DevTools >> Safari/Xcode debuggers  
✅ **Easier E2E testing**: Playwright/Cypress >> Maestro flakiness  
✅ **Auth testing**: Test Supabase flows without simulator restarts  
✅ **Team velocity**: Designers can preview on any browser  
✅ **CI/CD simplicity**: Web builds in 30s vs 5-10min for iOS

**The workflow:**
```
1. Build feature on web with mocked iOS APIs (Speech, Haptics)
2. Test auth, state, data flows with Playwright
3. Verify UI/UX with design team in browser
4. Port to iOS, integrate real Apple frameworks
5. Final testing on physical iPhone
```

**Platform-specific features handled via:**
- Abstraction layers (services)
- Feature flags
- Graceful degradation on web
- Platform detection utilities

---

## ⚠️ CRITICAL: DATABASE ARCHITECTURE CLARIFICATION

**Backend Database (SHARED BY BOTH PLATFORMS):**
- **Supabase PostgreSQL + pgvector** - This is your production database
- Stores ALL user data, workouts, exercises
- Handles authentication (Supabase Auth)
- Vector embeddings for exercise semantic search
- Both web and iOS sync to THIS backend

**Local Storage (PLATFORM-SPECIFIC):**
- **iOS (Production):** WatermelonDB (SQLite on device)
- **Web (Testing):** IndexedDB (browser storage)
- Both are offline-first local caches that sync to Supabase

**You have ONE backend database (Supabase), TWO local storage implementations.**

---

## TECHNICAL STACK

### Core Framework
```typescript
{
  "dependencies": {
    // Core React Native + Web
    "expo": "~51.0.38",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-web": "~0.19.10",      // ← KEY: Enables web support
    "react-dom": "18.2.0",               // ← For web rendering
    
    // UI Library (Web + iOS compatible)
    "@gluestack-ui/themed": "^1.1.30",   // ← Using v2 (stable, web-compatible)
    "react-native-svg": "15.2.0",        // ← Works on web + iOS
    
    // Navigation (universal)
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native-stack": "^6.9.17",
    
    // State Management
    "zustand": "^4.4.6",                 // ← Platform-agnostic
    
    // Backend & Database
    "@supabase/supabase-js": "^2.39.0",  // ← Supabase client (BOTH platforms)
    "@nozbe/watermelondb": "^0.27.0",    // ← iOS local storage
    "idb": "^7.1.1",                     // ← Web local storage (IndexedDB wrapper)
    
    // Platform-Specific APIs (abstracted)
    "expo-speech": "~11.7.0",            // ← iOS: native, Web: mock
    "expo-haptics": "~13.0.1",           // ← iOS: native, Web: no-op
    "expo-location": "~17.0.1"           // ← Both platforms
  },
  
  "devDependencies": {
    // Web Testing
    "@playwright/test": "^1.40.0",       // ← E2E for web
    "cypress": "^13.6.0",                // ← Alternative E2E
    
    // iOS Testing (later phase)
    "detox": "^20.14.0",                 // ← iOS E2E (after web validated)
    
    // Development
    "@expo/webpack-config": "^19.0.1",   // ← Web bundler
    "typescript": "^5.3.0",
    "jest": "^29.7.0"
  }
}
```

### Database Architecture Overview

**CRITICAL: Two-Database System**

```
┌─────────────────────────────────────────────────────────┐
│                  CLOUD BACKEND (Shared)                  │
│                                                          │
│              Supabase PostgreSQL + pgvector              │
│         • Central source of truth                        │
│         • User accounts, exercises, workouts             │
│         • Vector embeddings for semantic search          │
│         • Authentication (Supabase Auth)                 │
│         • Row-Level Security (RLS)                       │
└─────────────────────────────────────────────────────────┘
                            ↕
                    Sync when online
                            ↕
┌──────────────────────┐              ┌──────────────────────┐
│   LOCAL (iOS Prod)   │              │  LOCAL (Web Testing) │
│                      │              │                      │
│   WatermelonDB       │              │   IndexedDB          │
│   • SQLite-based     │              │   • Browser storage  │
│   • Reactive queries │              │   • Similar API      │
│   • Offline-first    │              │   • Testing only     │
│   • ~200ms queries   │              │   • Same schema      │
└──────────────────────┘              └──────────────────────┘
```

**Key Points:**
- **Supabase is the backend for BOTH platforms** (web and iOS)
- **Local storage differs by platform:**
  - iOS: WatermelonDB (production)
  - Web: IndexedDB (testing only)
- **Both local DBs sync to the same Supabase PostgreSQL backend**
- **Abstraction layer makes them interchangeable in code**

### Platform Compatibility Matrix

| Feature | Web (Dev/Test) | iOS (Production) | Implementation |
|---------|----------------|------------------|----------------|
| **Auth** | ✅ Supabase | ✅ Supabase | Shared service |
| **Backend Database** | ✅ Supabase PostgreSQL | ✅ Supabase PostgreSQL | **Same backend** |
| **Local Database** | ✅ IndexedDB (testing) | ✅ WatermelonDB (production) | Abstraction layer |
| **Voice Input** | ⚠️ Mocked | ✅ Apple Speech | Platform service |
| **Haptics** | ⚠️ No-op | ✅ Native | Platform service |
| **GPS Tracking** | ⚠️ Simulated | ✅ Native | Platform service |
| **UI Components** | ✅ Gluestack v2 | ✅ Gluestack v2 | Shared |
| **Navigation** | ✅ React Navigation | ✅ React Navigation | Shared |
| **Charts** | ✅ Victory Native | ✅ Victory Native | Shared (Skia web support) |

---

## PROJECT STRUCTURE

### Root Directory

```
voice-fit/
├── .expo/                      # Expo configuration
├── .github/                    # CI/CD workflows
├── __tests__/                  # Test files (mirrors src/)
│   ├── e2e/                    # End-to-end tests
│   │   ├── web/                # Playwright tests (run first)
│   │   └── ios/                # Detox tests (run after web validated)
│   ├── integration/            # Integration tests
│   └── unit/                   # Unit tests
│
├── android/                    # Android native (future)
├── ios/                        # iOS native (AUTO-GENERATED BY EXPO)
│   ├── VoiceFit/               # Xcode project (Expo creates this)
│   └── Podfile                 # CocoaPods dependencies (Expo manages)
│   # ⚠️ YOU DON'T WRITE CODE HERE - This is auto-generated
│   # Only open Xcode for: native permissions, entitlements, Swift modules
│   # All app logic is written in TypeScript in src/
│
├── web/                        # Web-specific files
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   └── webpack.config.js       # Custom web config (if needed)
│
├── assets/                     # Static assets
│   ├── fonts/
│   │   └── Inter/              # Inter font family
│   ├── images/
│   │   ├── icons/
│   │   ├── illustrations/
│   │   └── exercises/          # Exercise thumbnails
│   ├── sounds/                 # Audio feedback
│   └── animations/             # Lottie files
│
├── src/                        # Main application code (detailed below)
│
├── scripts/                    # Build/deployment scripts
│   ├── setup-web.sh
│   ├── setup-ios.sh
│   └── seed-database.ts
│
├── app.json                    # Expo configuration
├── babel.config.js
├── metro.config.js             # Metro bundler
├── webpack.config.js           # Web bundler (Expo Webpack)
├── package.json
├── tsconfig.json
├── jest.config.js
├── playwright.config.ts        # Web E2E config
└── eas.json                    # EAS Build/Submit
```

### Detailed `src/` Structure

```
src/
├── components/                 # Reusable UI components
│   ├── common/                 # Platform-agnostic components
│   │   ├── Button/
│   │   │   ├── Button.tsx      # Main component
│   │   │   ├── Button.web.tsx  # Web-specific overrides (optional)
│   │   │   ├── Button.ios.tsx  # iOS-specific overrides (optional)
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Spinner/
│   │   └── ...
│   │
│   ├── workout/                # Workout-specific components
│   │   ├── SetCard/
│   │   │   ├── SetCard.tsx
│   │   │   ├── SetCard.types.ts
│   │   │   └── index.ts
│   │   ├── ExerciseSelector/
│   │   ├── RPEPicker/
│   │   │   ├── RPEPicker.tsx
│   │   │   ├── BeginnerScale.tsx    # 5-point
│   │   │   ├── IntermediateScale.tsx # 10-point
│   │   │   └── AdvancedScale.tsx    # 10-point w/ half-increments
│   │   ├── RestTimer/
│   │   ├── WorkoutSummary/
│   │   └── ...
│   │
│   ├── voice/                  # Voice interaction components
│   │   ├── VoiceButton/
│   │   │   ├── VoiceButton.tsx
│   │   │   ├── VoiceButton.web.tsx   # ← Mock/keyboard input fallback
│   │   │   └── VoiceButton.ios.tsx   # ← Real Apple Speech API
│   │   ├── VoiceWaveform/
│   │   ├── VoiceConfirmation/
│   │   │   ├── ImplicitConfirmation.tsx  # "Logged" + visual
│   │   │   ├── ExplicitConfirmation.tsx  # Voice + modal
│   │   │   └── HapticConfirmation.tsx    # Vibration only
│   │   └── ...
│   │
│   ├── run/                    # Run tracking components
│   │   ├── GPSMap/
│   │   │   ├── GPSMap.tsx
│   │   │   ├── GPSMap.web.tsx      # ← Simulated data
│   │   │   └── GPSMap.ios.tsx      # ← Real GPS
│   │   ├── RunStats/
│   │   ├── PaceDisplay/
│   │   └── ...
│   │
│   ├── charts/                 # Analytics/visualization
│   │   ├── ProgressChart/
│   │   ├── VolumeChart/
│   │   ├── PRHistoryChart/
│   │   └── ...
│   │
│   └── layout/                 # Layout components
│       ├── Screen/             # Base screen wrapper
│       ├── TabBar/             # Custom tab bar
│       ├── Header/
│       └── ...
│
├── screens/                    # Screen-level components
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx
│   │   ├── PermissionsScreen.tsx
│   │   │   ├── PermissionsScreen.web.tsx  # ← Mock permissions
│   │   │   └── PermissionsScreen.ios.tsx  # ← Real iOS permissions
│   │   ├── QuestionnaireScreen.tsx
│   │   ├── VoiceTutorialScreen.tsx
│   │   └── index.ts
│   │
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   ├── ReadinessCheck.tsx
│   │   └── index.ts
│   │
│   ├── log/
│   │   ├── LogScreen.tsx
│   │   ├── WorkoutDetailScreen.tsx
│   │   ├── CalendarView.tsx
│   │   └── index.ts
│   │
│   ├── start/
│   │   ├── StartScreen.tsx
│   │   ├── WorkoutTypeSelector.tsx
│   │   ├── ProgramSelector.tsx
│   │   └── index.ts
│   │
│   ├── workout/                # Active workout screens
│   │   ├── ActiveWorkoutScreen.tsx
│   │   ├── ExerciseScreen.tsx
│   │   ├── RestScreen.tsx
│   │   ├── WorkoutCompleteScreen.tsx
│   │   └── index.ts
│   │
│   ├── run/                    # Active run screens
│   │   ├── ActiveRunScreen.tsx
│   │   ├── RunCompleteScreen.tsx
│   │   └── index.ts
│   │
│   ├── prs/
│   │   ├── PRsScreen.tsx
│   │   ├── PRDetailScreen.tsx
│   │   ├── FitnessProgressScreen.tsx
│   │   └── index.ts
│   │
│   ├── coach/
│   │   ├── CoachScreen.tsx
│   │   ├── ChatInterface.tsx
│   │   └── index.ts
│   │
│   └── settings/
│       ├── SettingsScreen.tsx
│       ├── ProfileScreen.tsx
│       ├── SubscriptionScreen.tsx
│       └── index.ts
│
├── navigation/                 # Navigation configuration
│   ├── RootNavigator.tsx       # Main app navigator
│   ├── TabNavigator.tsx        # Bottom tabs (5 tabs)
│   ├── OnboardingNavigator.tsx # Onboarding flow
│   ├── WorkoutNavigator.tsx    # Active workout stack
│   ├── linking.ts              # Deep linking config
│   └── types.ts                # Navigation type definitions
│
├── services/                   # Business logic & API calls
│   ├── api/                    # Backend API calls
│   │   ├── client.ts           # Axios/Fetch config
│   │   ├── auth.ts             # Supabase auth
│   │   ├── workouts.ts         # Workout CRUD
│   │   ├── exercises.ts        # Exercise library
│   │   ├── programs.ts         # Training programs
│   │   └── index.ts
│   │
│   ├── platform/               # ← CRITICAL: Platform-specific services
│   │   ├── voice/
│   │   │   ├── VoiceService.ts          # Interface
│   │   │   ├── VoiceService.web.ts      # ← Mock implementation
│   │   │   ├── VoiceService.ios.ts      # ← Apple Speech API
│   │   │   └── types.ts
│   │   ├── haptics/
│   │   │   ├── HapticsService.ts        # Interface
│   │   │   ├── HapticsService.web.ts    # ← No-op
│   │   │   └── HapticsService.ios.ts    # ← Real haptics
│   │   ├── gps/
│   │   │   ├── GPSService.ts            # Interface
│   │   │   ├── GPSService.web.ts        # ← Simulated data
│   │   │   └── GPSService.ios.ts        # ← expo-location
│   │   └── index.ts                     # Export correct service per platform
│   │
│   ├── voice-processing/       # Voice parsing logic
│   │   ├── VoiceParser.ts      # Parse transcribed text → structured data
│   │   ├── ExerciseResolver.ts # Match voice input to exercise DB
│   │   ├── UnitConverter.ts    # Handle "225 pounds" vs "225 lbs"
│   │   ├── ContextManager.ts   # Track workout context for disambiguation
│   │   └── index.ts
│   │
│   ├── ai/                     # GPT API integration
│   │   ├── ChatService.ts      # GPT-4o API client
│   │   ├── RAGService.ts       # Vector search + context retrieval
│   │   ├── PromptBuilder.ts    # System prompts + context injection
│   │   └── index.ts
│   │
│   ├── sync/                   # Database synchronization
│   │   ├── SyncService.ts      # Coordinate local ↔️ remote sync
│   │   ├── ConflictResolver.ts # Handle merge conflicts
│   │   └── index.ts
│   │
│   └── analytics/              # Analytics & tracking
│       ├── AnalyticsService.ts
│       └── index.ts
│
├── store/                      # State management (Zustand)
│   ├── index.ts                # Root store
│   ├── auth.store.ts           # Auth state (user, session)
│   ├── workout.store.ts        # Active workout state
│   ├── run.store.ts            # Active run state
│   ├── exercises.store.ts      # Exercise library cache
│   ├── programs.store.ts       # Training programs
│   ├── ui.store.ts             # UI state (modals, loading)
│   ├── settings.store.ts       # User preferences
│   └── types.ts                # Store type definitions
│
├── database/                   # Database layer
│   ├── index.ts                # Export correct DB per platform
│   ├── schema.ts               # Shared schema definition
│   │
│   ├── watermelon/             # ← iOS: WatermelonDB
│   │   ├── models/
│   │   │   ├── Workout.ts
│   │   │   ├── Exercise.ts
│   │   │   ├── Set.ts
│   │   │   ├── Run.ts
│   │   │   └── ...
│   │   ├── migrations/
│   │   └── sync.ts
│   │
│   └── indexeddb/              # ← Web: IndexedDB wrapper
│       ├── models/             # Same schema as WatermelonDB
│       ├── idb-wrapper.ts      # Abstraction layer
│       └── sync.ts
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # Auth state & actions
│   ├── useWorkout.ts           # Active workout management
│   ├── useVoiceInput.ts        # Voice recording & processing
│   ├── useExerciseSearch.ts    # Fuzzy exercise search
│   ├── useOfflineSync.ts       # Auto-sync when online
│   ├── usePlatform.ts          # Platform detection utility
│   └── ...
│
├── utils/                      # Utility functions
│   ├── platform.ts             # ← Platform detection & feature flags
│   │   // Example: `isWeb()`, `isIOS()`, `hasFeature('voice')`
│   ├── validation.ts           # Zod schemas
│   ├── formatting.ts           # Date, number formatters
│   ├── constants.ts            # App constants
│   ├── errors.ts               # Error handling
│   └── ...
│
├── types/                      # TypeScript type definitions
│   ├── models/                 # Data models
│   │   ├── Workout.ts
│   │   ├── Exercise.ts
│   │   ├── Set.ts
│   │   ├── Run.ts
│   │   ├── User.ts
│   │   └── ...
│   ├── api.ts                  # API request/response types
│   ├── navigation.ts           # Navigation types
│   └── index.ts
│
├── config/                     # Configuration
│   ├── env.ts                  # Environment variables
│   ├── theme.ts                # Gluestack theme customization
│   ├── navigation.ts           # Navigation config
│   └── constants.ts            # App-wide constants
│
├── App.tsx                     # Root component
└── index.js                    # Entry point
```

---

## PLATFORM ABSTRACTION LAYER

### Critical Pattern: Platform Services

**Problem:** iOS has native APIs (Speech, Haptics) that don't exist on web.

**Solution:** Service interfaces + platform-specific implementations

#### Example: Voice Service

**File:** `src/services/platform/voice/VoiceService.ts` (Interface)

```typescript
// Shared interface for both platforms
export interface IVoiceService {
  requestPermission(): Promise<boolean>;
  startListening(onResult: (text: string) => void): Promise<void>;
  stopListening(): Promise<void>;
  isAvailable(): boolean;
}

export interface VoiceResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}
```

**File:** `src/services/platform/voice/VoiceService.web.ts` (Web Mock)

```typescript
import { IVoiceService, VoiceResult } from './VoiceService';

/**
 * Web implementation - keyboard input fallback
 * For testing voice logic without iOS device
 */
export class VoiceServiceWeb implements IVoiceService {
  private isListening = false;
  private callback: ((text: string) => void) | null = null;

  async requestPermission(): Promise<boolean> {
    console.log('[Web] Voice permission mocked - always granted');
    return true;
  }

  async startListening(onResult: (text: string) => void): Promise<void> {
    this.isListening = true;
    this.callback = onResult;
    console.log('[Web] Voice listening started (keyboard input mode)');
    
    // In development, show a prompt input for testing
    if (__DEV__) {
      this.simulateVoiceInput();
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    this.callback = null;
    console.log('[Web] Voice listening stopped');
  }

  isAvailable(): boolean {
    return true; // Always available on web (mocked)
  }

  // Development helper: simulate voice input with keyboard
  private simulateVoiceInput() {
    const input = prompt('Enter voice command (simulated):');
    if (input && this.callback) {
      this.callback(input);
    }
  }
}
```

**File:** `src/services/platform/voice/VoiceService.ios.ts` (iOS Real)

```typescript
import { IVoiceService, VoiceResult } from './VoiceService';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

/**
 * iOS implementation - real Apple Speech framework
 */
export class VoiceServiceIOS implements IVoiceService {
  private isListening = false;
  private recording: Audio.Recording | null = null;

  async requestPermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    const speechStatus = await Speech.requestPermissionsAsync();
    return status === 'granted' && speechStatus.status === 'granted';
  }

  async startListening(onResult: (text: string) => void): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      this.isListening = true;

      // Start speech recognition
      Speech.speak('', {
        onDone: () => {
          // Handle recognition result
          onResult('bench press 225 for 10'); // Example
        }
      });
    } catch (error) {
      console.error('[iOS] Voice start error:', error);
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    this.isListening = false;
  }

  isAvailable(): boolean {
    return Speech.isSpeechAvailable();
  }
}
```

**File:** `src/services/platform/voice/index.ts` (Platform Selector)

```typescript
import { Platform } from 'react-native';
import { IVoiceService } from './VoiceService';
import { VoiceServiceWeb } from './VoiceService.web';
import { VoiceServiceIOS } from './VoiceService.ios';

// Automatically exports correct implementation based on platform
export const VoiceService: IVoiceService = 
  Platform.OS === 'web' 
    ? new VoiceServiceWeb() 
    : new VoiceServiceIOS();

export type { IVoiceService, VoiceResult } from './VoiceService';
```

**Usage in Components:**

```typescript
import { VoiceService } from '@/services/platform/voice';

function VoiceButton() {
  const handlePress = async () => {
    const granted = await VoiceService.requestPermission();
    if (granted) {
      await VoiceService.startListening((text) => {
        console.log('Heard:', text);
        // Process voice input
      });
    }
  };

  // Works on both web (keyboard prompt) and iOS (real voice)!
  return <Button onPress={handlePress}>Start Voice</Button>;
}
```

### Platform Detection Utility

**File:** `src/utils/platform.ts`

```typescript
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;

/**
 * Feature flag system for platform-specific capabilities
 */
export const features = {
  voice: isIOS, // Real voice only on iOS
  haptics: isIOS, // Real haptics only on iOS
  gps: true, // Available everywhere (simulated on web)
  offlineStorage: true, // IndexedDB on web, WatermelonDB on iOS
  pushNotifications: isNative,
  backgroundSync: isNative,
  appIntents: isIOS,
} as const;

export function hasFeature(feature: keyof typeof features): boolean {
  return features[feature];
}

/**
 * Platform-specific component loader
 * Usage: const Component = loadPlatformComponent(require('./Component'))
 */
export function loadPlatformComponent<T>(imports: any): T {
  if (Platform.OS === 'web' && imports.web) {
    return imports.web;
  }
  if (Platform.OS === 'ios' && imports.ios) {
    return imports.ios;
  }
  return imports.default;
}
```

---

## STATE MANAGEMENT (Zustand)

### Why Zustand?

- **4KB** (vs Redux 30KB+)
- **No boilerplate** (no actions, reducers, providers)
- **TypeScript-first**
- **Works identically on web & iOS**
- **DevTools support** for debugging

### Example Store: Active Workout

**File:** `src/store/workout.store.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Workout, Exercise, Set } from '@/types/models';

interface WorkoutState {
  // State
  activeWorkout: Workout | null;
  currentExercise: Exercise | null;
  sets: Set[];
  startTime: number | null;
  isPaused: boolean;

  // Actions
  startWorkout: (workout: Workout) => void;
  addSet: (set: Set) => void;
  updateSet: (setId: string, updates: Partial<Set>) => void;
  deleteSet: (setId: string) => void;
  setCurrentExercise: (exercise: Exercise) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => Promise<void>;
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeWorkout: null,
        currentExercise: null,
        sets: [],
        startTime: null,
        isPaused: false,

        // Actions
        startWorkout: (workout) => set({ 
          activeWorkout: workout,
          startTime: Date.now(),
          sets: [],
          isPaused: false 
        }),

        addSet: (newSet) => set((state) => ({
          sets: [...state.sets, newSet]
        })),

        updateSet: (setId, updates) => set((state) => ({
          sets: state.sets.map(s => 
            s.id === setId ? { ...s, ...updates } : s
          )
        })),

        deleteSet: (setId) => set((state) => ({
          sets: state.sets.filter(s => s.id !== setId)
        })),

        setCurrentExercise: (exercise) => set({ currentExercise: exercise }),

        pauseWorkout: () => set({ isPaused: true }),

        resumeWorkout: () => set({ isPaused: false }),

        completeWorkout: async () => {
          const { activeWorkout, sets, startTime } = get();
          if (!activeWorkout || !startTime) return;

          // Calculate duration
          const duration = Date.now() - startTime;

          // Save to database (works on both web & iOS)
          await WorkoutService.save({
            ...activeWorkout,
            sets,
            duration,
            completedAt: new Date()
          });

          // Reset state
          set({
            activeWorkout: null,
            currentExercise: null,
            sets: [],
            startTime: null,
            isPaused: false
          });
        },

        cancelWorkout: () => set({
          activeWorkout: null,
          currentExercise: null,
          sets: [],
          startTime: null,
          isPaused: false
        })
      }),
      {
        name: 'workout-storage', // LocalStorage key (web) or AsyncStorage (iOS)
        partialize: (state) => ({
          // Only persist these fields
          activeWorkout: state.activeWorkout,
          sets: state.sets,
          startTime: state.startTime
        })
      }
    )
  )
);
```

**Usage in Components:**

```typescript
import { useWorkoutStore } from '@/store/workout.store';

function ActiveWorkoutScreen() {
  // Select only needed state (prevents unnecessary re-renders)
  const activeWorkout = useWorkoutStore(state => state.activeWorkout);
  const sets = useWorkoutStore(state => state.sets);
  const addSet = useWorkoutStore(state => state.addSet);
  const completeWorkout = useWorkoutStore(state => state.completeWorkout);

  const handleAddSet = () => {
    addSet({
      id: generateId(),
      exercise: 'Bench Press',
      weight: 225,
      reps: 10,
      rpe: 7,
      timestamp: Date.now()
    });
  };

  return (
    <View>
      <Text>{activeWorkout?.name}</Text>
      <Text>{sets.length} sets completed</Text>
      <Button onPress={handleAddSet}>Add Set</Button>
      <Button onPress={completeWorkout}>Finish</Button>
    </View>
  );
}
```

---

## DATABASE ABSTRACTION

### Three-Layer Database Architecture

**Layer 1: Cloud Backend (Shared)**
- **Supabase PostgreSQL + pgvector** (production database for both platforms)
- Central source of truth for all user data
- Handles authentication via Supabase Auth
- Vector embeddings for exercise semantic search
- Row-Level Security (RLS) for data isolation

**Layer 2: Local Storage (Platform-Specific)**
- **iOS Production:** WatermelonDB (SQLite) - Reactive, optimized for React Native
- **Web Testing:** IndexedDB wrapper - Browser-native, similar API
- Both sync to the same Supabase backend when online
- Offline-first: App works without network, syncs later

**Layer 3: Abstraction Interface**
- Components use identical API regardless of platform
- Same function calls work on web (IndexedDB) and iOS (WatermelonDB)
- Both implementations sync to Supabase

**Data Flow:**
```
Component → Abstraction Layer → Platform Storage (WatermelonDB/IndexedDB) → Supabase PostgreSQL
                                         ↓ (read local)                    ↑ (sync when online)
```

### Shared Schema

**File:** `src/database/schema.ts`

```typescript
/**
 * Shared schema definition used by both platforms
 * WatermelonDB uses this directly
 * IndexedDB wrapper maps to this structure
 */

export interface WorkoutSchema {
  id: string;
  name: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  notes?: string;
  userId: string;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetSchema {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  notes?: string;
  order: number;
  timestamp: number;
  synced: boolean;
}

export interface ExerciseSchema {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  embeddings?: number[]; // Vector embeddings for semantic search
}

// ... more schemas
```

### Database Service Interface

**File:** `src/database/index.ts`

```typescript
/**
 * Unified database interface
 * Implementations in /watermelon (iOS) and /indexeddb (web)
 */

export interface IDatabase {
  // Workouts
  createWorkout(data: Omit<WorkoutSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutSchema>;
  getWorkout(id: string): Promise<WorkoutSchema | null>;
  getWorkouts(filters?: WorkoutFilters): Promise<WorkoutSchema[]>;
  updateWorkout(id: string, updates: Partial<WorkoutSchema>): Promise<WorkoutSchema>;
  deleteWorkout(id: string): Promise<void>;

  // Sets
  createSet(data: Omit<SetSchema, 'id' | 'timestamp'>): Promise<SetSchema>;
  getSetsForWorkout(workoutId: string): Promise<SetSchema[]>;
  updateSet(id: string, updates: Partial<SetSchema>): Promise<SetSchema>;
  deleteSet(id: string): Promise<void>;

  // Exercises
  searchExercises(query: string): Promise<ExerciseSchema[]>;
  getExercise(id: string): Promise<ExerciseSchema | null>;
  
  // Sync
  getUnsyncedRecords(): Promise<{ workouts: WorkoutSchema[]; sets: SetSchema[] }>;
  markAsSynced(recordIds: string[]): Promise<void>;
}

// Platform-specific implementation loader
import { Platform } from 'react-native';
import { WatermelonDatabase } from './watermelon';
import { IndexedDBDatabase } from './indexeddb';

export const db: IDatabase = 
  Platform.OS === 'web' 
    ? new IndexedDBDatabase() 
    : new WatermelonDatabase();
```

### Supabase Sync Service (Both Platforms)

**File:** `src/services/sync/SupabaseSync.ts`

```typescript
/**
 * Syncs local database (WatermelonDB/IndexedDB) with Supabase PostgreSQL
 * Works on both web and iOS
 */

import { createClient } from '@supabase/supabase-js';
import { db } from '@/database';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export class SupabaseSync {
  /**
   * Push local changes to Supabase
   */
  async pushToSupabase(): Promise<void> {
    const unsynced = await db.getUnsyncedRecords();
    
    // Upload workouts
    if (unsynced.workouts.length > 0) {
      const { error } = await supabase
        .from('workouts')
        .upsert(unsynced.workouts);
      
      if (!error) {
        await db.markAsSynced(unsynced.workouts.map(w => w.id));
      }
    }
    
    // Upload sets
    if (unsynced.sets.length > 0) {
      const { error } = await supabase
        .from('workout_sets')
        .upsert(unsynced.sets);
      
      if (!error) {
        await db.markAsSynced(unsynced.sets.map(s => s.id));
      }
    }
  }

  /**
   * Pull latest changes from Supabase
   */
  async pullFromSupabase(): Promise<void> {
    const lastSync = await this.getLastSyncTime();
    
    // Download workouts updated since last sync
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .gte('updated_at', lastSync)
      .order('updated_at', { ascending: false });
    
    if (workouts) {
      for (const workout of workouts) {
        await db.updateWorkout(workout.id, workout);
      }
    }
    
    await this.setLastSyncTime(new Date().toISOString());
  }

  /**
   * Auto-sync on network reconnection
   */
  async autoSync(): Promise<void> {
    try {
      await this.pullFromSupabase(); // Get server changes first
      await this.pushToSupabase();   // Then push local changes
    } catch (error) {
      console.error('Sync failed:', error);
      // Retry logic here
    }
  }

  private async getLastSyncTime(): Promise<string> {
    // Implementation depends on storage
    return localStorage.getItem('lastSyncTime') || '1970-01-01';
  }

  private async setLastSyncTime(time: string): Promise<void> {
    localStorage.setItem('lastSyncTime', time);
  }
}

export const syncService = new SupabaseSync();
```

**Key Points:**
- Both WatermelonDB (iOS) and IndexedDB (web) sync to **same Supabase backend**
- Offline-first: Local writes happen instantly, sync in background
- Conflict resolution: Last-write-wins (workouts rarely edited after completion)
- Auto-sync triggers on network reconnection

### WatermelonDB Implementation (iOS)

**File:** `src/database/watermelon/index.ts`

```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Workout, Set, Exercise } from './models';
import { IDatabase, WorkoutSchema, SetSchema } from '../index';

const adapter = new SQLiteAdapter({
  schema,
  // migrations,
  jsi: true, // JSI for faster queries
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error);
  }
});

const database = new Database({
  adapter,
  modelClasses: [Workout, Set, Exercise],
});

export class WatermelonDatabase implements IDatabase {
  async createWorkout(data): Promise<WorkoutSchema> {
    const workout = await database.write(async () => {
      return await database.get<Workout>('workouts').create((w) => {
        w.name = data.name;
        w.startedAt = data.startedAt;
        w.userId = data.userId;
        w.synced = false;
      });
    });
    
    return this.workoutToSchema(workout);
  }

  async getWorkouts(filters?): Promise<WorkoutSchema[]> {
    const workouts = await database.get<Workout>('workouts')
      .query()
      .fetch();
    
    return workouts.map(this.workoutToSchema);
  }

  // ... implement all interface methods

  private workoutToSchema(workout: Workout): WorkoutSchema {
    return {
      id: workout.id,
      name: workout.name,
      startedAt: workout.startedAt,
      completedAt: workout.completedAt,
      duration: workout.duration,
      notes: workout.notes,
      userId: workout.userId,
      synced: workout.synced,
      createdAt: workout.createdAt.getTime(),
      updatedAt: workout.updatedAt.getTime(),
    };
  }
}
```

### IndexedDB Implementation (Web)

**File:** `src/database/indexeddb/index.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IDatabase, WorkoutSchema, SetSchema } from '../index';

interface VoiceFitDB extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutSchema;
    indexes: { 'by-user': string; 'by-date': number };
  };
  sets: {
    key: string;
    value: SetSchema;
    indexes: { 'by-workout': string };
  };
  exercises: {
    key: string;
    value: ExerciseSchema;
    indexes: { 'by-name': string };
  };
}

export class IndexedDBDatabase implements IDatabase {
  private db!: IDBPDatabase<VoiceFitDB>;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await openDB<VoiceFitDB>('voice-fit', 1, {
      upgrade(db) {
        // Create object stores
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-user', 'userId');
        workoutStore.createIndex('by-date', 'startedAt');

        const setStore = db.createObjectStore('sets', { keyPath: 'id' });
        setStore.createIndex('by-workout', 'workoutId');

        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
        exerciseStore.createIndex('by-name', 'name');
      },
    });
  }

  async createWorkout(data): Promise<WorkoutSchema> {
    const workout: WorkoutSchema = {
      ...data,
      id: generateId(),
      synced: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.db.add('workouts', workout);
    return workout;
  }

  async getWorkouts(filters?): Promise<WorkoutSchema[]> {
    return await this.db.getAll('workouts');
  }

  // ... implement all interface methods (similar to WatermelonDB)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## VOICE PROCESSING PIPELINE

### Architecture Flow

```
User speaks → Platform Service → Voice Parser → Exercise Resolver → Store Update → UI Confirmation
     ↓             ↓                  ↓                  ↓                ↓              ↓
  "Bench       Transcribe         Extract:          Match to         addSet()      "Logged"
   press        audio to         - Exercise         database         action        + haptic
   225          text              - Weight          (semantic                       (iOS only)
   for                            - Reps            search)
   10"                            - RPE
```

### 1. Transcription (Platform Service)

Already covered above - `VoiceService.web.ts` (keyboard) vs `VoiceService.ios.ts` (Apple Speech)

### 2. Voice Parser

**File:** `src/services/voice-processing/VoiceParser.ts`

```typescript
/**
 * Parses transcribed text into structured workout data
 * Works identically on web (keyboard testing) and iOS (real voice)
 */

import { Exercise } from '@/types/models';

export interface ParsedVoiceInput {
  exerciseName: string;
  weight?: number;
  reps?: number;
  sets?: number;
  rpe?: number;
  unit?: 'lbs' | 'kg';
  confidence: 'high' | 'medium' | 'low';
  ambiguities?: string[]; // Fields needing clarification
}

export class VoiceParser {
  /**
   * Main parsing function
   * Example inputs:
   * - "bench press 225 for 10 reps" 
   * - "squat 185 pounds, 5 reps, RPE 8"
   * - "three sets of bicep curls at 30"
   */
  parse(transcript: string, context?: WorkoutContext): ParsedVoiceInput {
    const normalized = this.normalize(transcript);
    
    return {
      exerciseName: this.extractExercise(normalized),
      weight: this.extractWeight(normalized),
      reps: this.extractReps(normalized),
      sets: this.extractSets(normalized),
      rpe: this.extractRPE(normalized, context),
      unit: this.extractUnit(normalized),
      confidence: this.calculateConfidence(normalized),
      ambiguities: this.findAmbiguities(normalized, context)
    };
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractExercise(text: string): string {
    // Remove numbers and common words to isolate exercise name
    const cleaned = text
      .replace(/\d+/g, '')
      .replace(/\b(for|at|reps?|sets?|pounds?|lbs|kg|rpe|easy|hard)\b/gi, '')
      .trim();
    
    return cleaned;
  }

  private extractWeight(text: string): number | undefined {
    // Match patterns: "225", "225 pounds", "225 lbs", "at 185"
    const patterns = [
      /(\d+)\s*(pounds?|lbs)/i,
      /at\s+(\d+)/i,
      /^(\d+)\s+\w+/, // "225 bench press"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseInt(match[1]);
    }

    return undefined;
  }

  private extractReps(text: string): number | undefined {
    // Match patterns: "for 10", "10 reps", "times 8"
    const patterns = [
      /for\s+(\d+)/i,
      /(\d+)\s*reps?/i,
      /times\s+(\d+)/i,
      /x\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseInt(match[1]);
    }

    return undefined;
  }

  private extractSets(text: string): number | undefined {
    // Match patterns: "3 sets", "three sets"
    const numberWords: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5
    };

    const patterns = [
      /(\d+)\s*sets?/i,
      /(one|two|three|four|five)\s*sets?/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1];
        return isNaN(+value) ? numberWords[value.toLowerCase()] : parseInt(value);
      }
    }

    return undefined;
  }

  private extractRPE(text: string, context?: WorkoutContext): number | undefined {
    // Match patterns: "RPE 8", "8 out of 10", "felt hard"
    
    // Explicit RPE number
    const rpePattern = /rpe\s*(\d+(?:\.\d+)?)/i;
    const match = text.match(rpePattern);
    if (match) return parseFloat(match[1]);

    // Descriptive RPE
    const descriptors: Record<string, number> = {
      'easy': 3,
      'light': 3,
      'moderate': 5,
      'medium': 5,
      'challenging': 7,
      'hard': 8,
      'very hard': 9,
      'max': 10,
      'maximal': 10,
    };

    for (const [keyword, rpe] of Object.entries(descriptors)) {
      if (text.includes(keyword)) return rpe;
    }

    return undefined;
  }

  private extractUnit(text: string): 'lbs' | 'kg' {
    if (/\bkg\b/i.test(text)) return 'kg';
    return 'lbs'; // Default to pounds
  }

  private calculateConfidence(text: string): 'high' | 'medium' | 'low' {
    // Simple heuristic based on how many fields were extracted
    const hasExercise = text.length > 3;
    const hasNumbers = /\d+/.test(text);
    
    if (hasExercise && hasNumbers) return 'high';
    if (hasExercise || hasNumbers) return 'medium';
    return 'low';
  }

  private findAmbiguities(text: string, context?: WorkoutContext): string[] {
    const ambiguities: string[] = [];

    // Ambiguous numbers (could be weight or reps)
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length === 1 && !context) {
      ambiguities.push('Unclear if number is weight or reps');
    }

    return ambiguities;
  }
}

interface WorkoutContext {
  currentExercise?: Exercise;
  lastSet?: SetSchema;
  preferredUnit: 'lbs' | 'kg';
}
```

### 3. Exercise Resolver (Semantic Search)

**File:** `src/services/voice-processing/ExerciseResolver.ts`

```typescript
/**
 * Matches parsed exercise name to database using 3-tier search:
 * 1. Exact match
 * 2. Phonetic match (handles voice recognition errors)
 * 3. Semantic match (vector similarity)
 */

import { ExerciseSchema } from '@/database/schema';
import { db } from '@/database';

export class ExerciseResolver {
  /**
   * Find best matching exercise from voice input
   * Examples:
   * - "bench press" → exact match
   * - "binch press" → phonetic match (voice error)
   * - "lying barbell chest press" → semantic match
   */
  async resolve(voiceInput: string): Promise<ExerciseSchema | null> {
    // Tier 1: Exact match (1-5ms)
    const exact = await this.exactMatch(voiceInput);
    if (exact) return exact;

    // Tier 2: Phonetic match (5-20ms) - handles voice errors
    const phonetic = await this.phoneticMatch(voiceInput);
    if (phonetic) return phonetic;

    // Tier 3: Semantic match (20-50ms) - uses embeddings
    const semantic = await this.semanticMatch(voiceInput);
    return semantic;
  }

  private async exactMatch(input: string): Promise<ExerciseSchema | null> {
    // Check exact name match
    const exercises = await db.searchExercises(input);
    return exercises.find(ex => 
      ex.name.toLowerCase() === input.toLowerCase()
    ) || null;
  }

  private async phoneticMatch(input: string): Promise<ExerciseSchema | null> {
    // Use Soundex or Metaphone algorithm for phonetic matching
    const inputPhonetic = this.soundex(input);
    const exercises = await db.searchExercises(input);
    
    for (const exercise of exercises) {
      if (this.soundex(exercise.name) === inputPhonetic) {
        return exercise;
      }
    }
    
    return null;
  }

  private async semanticMatch(input: string): Promise<ExerciseSchema | null> {
    // This would call your Supabase pgvector similarity search
    // For now, simplified version:
    const exercises = await db.searchExercises(input);
    
    // Return most relevant (could use vector similarity scores here)
    return exercises[0] || null;
  }

  private soundex(text: string): string {
    // Simplified Soundex implementation
    // Full implementation would use standard Soundex algorithm
    const upper = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (!upper) return '';
    
    const first = upper[0];
    const coded = upper
      .slice(1)
      .replace(/[AEIOUYHW]/g, '0')
      .replace(/[BFPV]/g, '1')
      .replace(/[CGJKQSXZ]/g, '2')
      .replace(/[DT]/g, '3')
      .replace(/[L]/g, '4')
      .replace(/[MN]/g, '5')
      .replace(/[R]/g, '6')
      .replace(/0+/g, '0')
      .replace(/(\d)\1+/g, '$1');
    
    return (first + coded + '0000').slice(0, 4);
  }
}
```

---

## COMPONENT PATTERNS

### Smart vs. Presentational Components

**Pattern:** Separate business logic (Smart) from UI (Presentational)

**Example: SetCard**

**File:** `src/components/workout/SetCard/SetCard.tsx` (Presentational)

```typescript
/**
 * Pure presentational component - no business logic
 * Easy to test, easy to style, reusable
 */

import { View, Text, Pressable } from 'react-native';
import { SetSchema } from '@/types/models';

interface SetCardProps {
  set: SetSchema;
  onEdit: (set: SetSchema) => void;
  onDelete: (setId: string) => void;
}

export function SetCard({ set, onEdit, onDelete }: SetCardProps) {
  return (
    <Pressable 
      onPress={() => onEdit(set)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.exercise}>{set.exerciseName}</Text>
        {set.rpe && (
          <View style={styles.rpeBadge}>
            <Text>RPE {set.rpe}</Text>
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <Text style={styles.weight}>{set.weight} lbs</Text>
        <Text style={styles.reps}>× {set.reps} reps</Text>
      </View>

      {set.notes && (
        <Text style={styles.notes}>{set.notes}</Text>
      )}

      <Pressable 
        onPress={() => onDelete(set.id)}
        style={styles.deleteButton}
      >
        <Text>Delete</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = {
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  exercise: { fontSize: 18, fontWeight: '600' },
  rpeBadge: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 8 },
  weight: { fontSize: 16, fontWeight: '500' },
  reps: { fontSize: 16, color: '#666' },
  notes: { fontSize: 14, color: '#999', marginTop: 8 },
  deleteButton: { marginTop: 8, padding: 8 },
} as const;
```

**File:** `src/screens/workout/ActiveWorkoutScreen.tsx` (Smart Container)

```typescript
/**
 * Smart component - contains business logic, state, side effects
 * Passes data and callbacks to presentational components
 */

import { useWorkoutStore } from '@/store/workout.store';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { SetCard } from '@/components/workout/SetCard';

export function ActiveWorkoutScreen() {
  // State from store
  const sets = useWorkoutStore(state => state.sets);
  const addSet = useWorkoutStore(state => state.addSet);
  const updateSet = useWorkoutStore(state => state.updateSet);
  const deleteSet = useWorkoutStore(state => state.deleteSet);

  // Voice input hook
  const { startListening, stopListening, isListening } = useVoiceInput({
    onResult: (parsed) => {
      // Add set from voice input
      addSet({
        id: generateId(),
        exerciseName: parsed.exerciseName,
        weight: parsed.weight || 0,
        reps: parsed.reps || 0,
        rpe: parsed.rpe,
        timestamp: Date.now(),
        synced: false,
      });
    }
  });

  const handleEditSet = (set: SetSchema) => {
    // Navigate to edit screen or open modal
    navigation.navigate('EditSet', { setId: set.id });
  };

  const handleDeleteSet = (setId: string) => {
    deleteSet(setId);
  };

  return (
    <View>
      <VoiceButton 
        onPress={isListening ? stopListening : startListening}
        isListening={isListening}
      />

      <FlatList
        data={sets}
        renderItem={({ item }) => (
          <SetCard
            set={item}
            onEdit={handleEditSet}
            onDelete={handleDeleteSet}
          />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

---

## DEVELOPMENT WORKFLOW

### Phase 1: Web Development (Weeks 1-4)

**Goal:** Build and test core features on web without iOS simulator

**Setup:**

```bash
# Install dependencies
npm install

# Start web dev server
npm run web

# Runs at http://localhost:19006
# Fast hot reload, Chrome DevTools available
```

**What to Build on Web:**

1. **Authentication flows** (Supabase)
   - Sign up, login, password reset
   - Test OAuth flows (Google, Apple)
   
2. **Core UI layouts**
   - All 5 tabs
   - Onboarding screens
   - Settings screens
   
3. **State management**
   - Test Zustand stores
   - Verify data flows
   
4. **Data persistence**
   - IndexedDB CRUD operations
   - Test offline mode
   
5. **Voice logic** (mocked with keyboard input)
   - VoiceParser unit tests
   - ExerciseResolver logic
   - Test command variations

**Testing on Web:**

```bash
# E2E tests with Playwright
npm run test:e2e:web

# Example test
# __tests__/e2e/web/workout-logging.spec.ts
import { test, expect } from '@playwright/test';

test('log set via voice input (mocked)', async ({ page }) => {
  await page.goto('http://localhost:19006');
  
  // Login
  await page.fill('[placeholder="Email"]', 'test@example.com');
  await page.fill('[placeholder="Password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  
  // Navigate to workout
  await page.click('[data-testid="start-tab"]');
  await page.click('button:has-text("Start Workout")');
  
  // Simulate voice input (keyboard prompt on web)
  await page.click('[data-testid="voice-button"]');
  await page.fill('[placeholder="Enter voice command"]', 'bench press 225 for 10');
  await page.press('[placeholder="Enter voice command"]', 'Enter');
  
  // Verify set logged
  await expect(page.locator('text=Bench Press')).toBeVisible();
  await expect(page.locator('text=225 lbs')).toBeVisible();
  await expect(page.locator('text=10 reps')).toBeVisible();
});
```

### Phase 2: iOS Integration (Weeks 5-8)

**Goal:** Port web-validated features to iOS, integrate native APIs

**Setup:**

```bash
# Build iOS development build
eas build --profile development --platform ios

# Install on device/simulator
eas build:run -p ios

# Start metro bundler
npm run ios
```

**What Changes for iOS:**

1. **Replace mocked services** with real implementations
   - `VoiceService.web.ts` → `VoiceService.ios.ts` (Apple Speech)
   - `HapticsService.web.ts` → `HapticsService.ios.ts` (Native vibration)
   - `GPSService.web.ts` → `GPSService.ios.ts` (expo-location)

2. **Swap IndexedDB** for WatermelonDB
   - Run data migration script
   - Test sync with Supabase

3. **Test on physical device**
   - Voice recognition accuracy
   - GPS tracking during runs
   - Haptic feedback patterns
   - Battery usage during active workout

**iOS-Specific Testing:**

```bash
# Unit tests still run normally
npm test

# iOS E2E with Detox (after web E2E passing)
npm run test:e2e:ios
```

### Development Checklist

**Before moving to iOS:**

- ✅ All web E2E tests passing
- ✅ Auth flows working (signup, login, logout, password reset)
- ✅ 5-tab navigation functional
- ✅ Workout logging with keyboard input works
- ✅ IndexedDB persistence and sync tested
- ✅ UI/UX approved by design team
- ✅ Core business logic unit tested (80%+ coverage)

**iOS validation:**

- ✅ Voice recognition 90%+ accuracy on test phrases
- ✅ WatermelonDB sync with Supabase working
- ✅ GPS tracking accurate within 5%
- ✅ Haptic feedback feels natural
- ✅ No crashes or memory leaks during 30min workout
- ✅ Battery usage <10% for 1hr workout

---

## PERFORMANCE OPTIMIZATION

### Sub-3-Second Voice Logging Target

**Breakdown:**

```
User speaks → Recognition → Parsing → DB Write → UI Update
   (1s)          (0.5s)      (0.2s)     (0.1s)      (0.1s)
                                                    
Total: 1.9s ✅ (under 3s target)
```

**Optimization Strategies:**

1. **Optimistic UI Updates**
   ```typescript
   async function logSet(setData: Partial<SetSchema>) {
     const tempId = generateTempId();
     
     // Immediate UI update (0ms perceived latency)
     addSet({ ...setData, id: tempId, syncing: true });
     
     // Background save
     db.createSet(setData)
       .then(savedSet => {
         // Replace temp with real
         updateSet(tempId, { ...savedSet, syncing: false });
       })
       .catch(error => {
         // Rollback on error
         deleteSet(tempId);
         showError('Failed to save set');
       });
   }
   ```

2. **Debounced Search**
   ```typescript
   import { useMemo } from 'react';
   import { debounce } from 'lodash';
   
   function ExerciseSearch() {
     const searchExercises = useMemo(
       () => debounce(async (query: string) => {
         const results = await db.searchExercises(query);
         setResults(results);
       }, 300), // Wait 300ms after user stops typing
       []
     );
   }
   ```

3. **Memoized Computations**
   ```typescript
   import { useMemo } from 'react';
   
   function WorkoutStats({ sets }: { sets: SetSchema[] }) {
     const totalVolume = useMemo(() => {
       return sets.reduce((sum, set) => 
         sum + (set.weight * set.reps), 
         0
       );
     }, [sets]); // Only recompute when sets change
     
     return <Text>Total Volume: {totalVolume} lbs</Text>;
   }
   ```

4. **Virtualized Lists**
   ```typescript
   import { FlashList } from '@shopify/flash-list';
   
   function WorkoutHistory({ workouts }: { workouts: WorkoutSchema[] }) {
     return (
       <FlashList
         data={workouts}
         renderItem={({ item }) => <WorkoutCard workout={item} />}
         estimatedItemSize={120} // Hint for better performance
         // 10x faster than FlatList for 100+ items
       />
     );
   }
   ```

### Bundle Size Optimization

**Target:** <50MB iOS app

**Strategies:**

1. **Lazy load screens**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const CoachScreen = lazy(() => import('./screens/coach/CoachScreen'));
   
   function App() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <CoachScreen />
       </Suspense>
     );
   }
   ```

2. **Compress assets**
   ```bash
   # Convert PNGs to WebP (25-35% smaller)
   cwebp input.png -o output.webp -q 80
   
   # Optimize existing images
   npx expo-optimize
   ```

3. **Remove unused dependencies**
   ```bash
   npx depcheck
   # Shows unused dependencies to remove
   ```

---

## TESTING STRATEGY

### Test Pyramid

```
          /\
         /  \         E2E Tests (Playwright web, Detox iOS)
        /____\        5% of tests, high value
       /      \       
      /  Inte- \      Integration Tests (API + DB)
     /   gration \    15% of tests
    /____________\    
   /              \   
  /   Unit Tests   \  Component + Service tests
 /    (Jest +       \ 80% of tests
/___React Testing___\
        Library
```

### Unit Tests (80%)

**File:** `src/services/voice-processing/__tests__/VoiceParser.test.ts`

```typescript
import { VoiceParser } from '../VoiceParser';

describe('VoiceParser', () => {
  const parser = new VoiceParser();

  describe('parse()', () => {
    it('parses simple exercise command', () => {
      const result = parser.parse('bench press 225 for 10 reps');
      
      expect(result).toEqual({
        exerciseName: 'bench press',
        weight: 225,
        reps: 10,
        unit: 'lbs',
        confidence: 'high',
        ambiguities: []
      });
    });

    it('handles RPE descriptors', () => {
      const result = parser.parse('squat 315 for 5, felt hard');
      
      expect(result.rpe).toBe(8);
    });

    it('handles ambiguous numbers with context', () => {
      const context = { currentExercise: { name: 'Bicep Curl' } };
      const result = parser.parse('30', context);
      
      // 30 likely means reps for bicep curl, not weight
      expect(result.reps).toBe(30);
      expect(result.weight).toBeUndefined();
    });
  });
});
```

### Integration Tests (15%)

**File:** `__tests__/integration/workout-flow.test.ts`

```typescript
import { db } from '@/database';
import { useWorkoutStore } from '@/store/workout.store';

describe('Workout Flow Integration', () => {
  beforeEach(async () => {
    await db.clearAll(); // Reset test database
  });

  it('creates workout → adds sets → saves to database', async () => {
    const { startWorkout, addSet, completeWorkout } = useWorkoutStore.getState();
    
    // Start workout
    startWorkout({
      id: 'test-workout',
      name: 'Chest Day',
      startedAt: Date.now(),
      userId: 'test-user',
      synced: false
    });
    
    // Add sets
    addSet({
      id: 'set-1',
      exerciseName: 'Bench Press',
      weight: 225,
      reps: 10,
      timestamp: Date.now(),
      synced: false
    });
    
    addSet({
      id: 'set-2',
      exerciseName: 'Bench Press',
      weight: 225,
      reps: 9,
      timestamp: Date.now(),
      synced: false
    });
    
    // Complete workout
    await completeWorkout();
    
    // Verify saved to database
    const saved = await db.getWorkout('test-workout');
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Chest Day');
    
    const sets = await db.getSetsForWorkout('test-workout');
    expect(sets).toHaveLength(2);
  });
});
```

### E2E Tests (5%)

**File:** `__tests__/e2e/web/auth-flow.spec.ts` (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('new user signs up and completes onboarding', async ({ page }) => {
    await page.goto('http://localhost:19006');
    
    // Sign up
    await page.click('text=Sign Up');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("Create Account")');
    
    // Verify redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/);
    
    // Complete questionnaire
    await page.click('text=Running');
    await page.click('text=Strength Training');
    await page.click('text=Next');
    
    // Select experience level
    await page.click('text=Intermediate');
    await page.click('text=Next');
    
    // Grant permissions (mocked on web)
    await page.click('text=Enable Microphone');
    
    // Verify lands on home screen
    await expect(page).toHaveURL(/.*home/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

**File:** `__tests__/e2e/ios/voice-logging.e2e.ts` (Detox)

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Voice Logging (iOS)', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('logs set via voice input', async () => {
    // Navigate to workout
    await element(by.id('start-tab')).tap();
    await element(by.text('Start Workout')).tap();
    
    // Tap voice button
    await element(by.id('voice-button')).tap();
    
    // NOTE: Cannot actually speak in automated test
    // Would need manual testing or pre-recorded audio injection
    
    // For now, verify voice button opens and UI responds
    await detoxExpect(element(by.id('voice-waveform'))).toBeVisible();
  });
});
```

---

## DEPLOYMENT & CI/CD

### Build Configurations

**File:** `eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false,
        "bundleIdentifier": "com.voicefit.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "TEAMID"
      }
    }
  }
}
```

### GitHub Actions CI

**File:** `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run E2E tests (web)
        run: |
          npm run web &
          npx wait-on http://localhost:19006
          npm run test:e2e:web
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-ios:
    runs-on: macos-latest
    needs: test-web
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Build iOS preview
        run: eas build --platform ios --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## ENVIRONMENT SETUP

### Required .env Variables

**File:** `.env.example`

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for GPT-4o voice processing & Coach feature)
OPENAI_API_KEY=sk-your-api-key

# Environment
NODE_ENV=development

# Web dev server
PORT=19006

# Feature flags (for testing)
ENABLE_VOICE=true  # false on web for keyboard testing
ENABLE_HAPTICS=true
ENABLE_GPS=true
```

### Setup Scripts

**File:** `scripts/setup-web.sh`

```bash
#!/bin/bash
echo "Setting up Voice Fit for web development..."

# Install dependencies
npm install

# Create .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env file - please fill in your keys"
fi

# Seed database with exercises
echo "Seeding exercise database..."
npx ts-node scripts/seed-database.ts

echo "✅ Setup complete! Run 'npm run web' to start."
```

**File:** `scripts/setup-ios.sh`

```bash
#!/bin/bash
echo "Setting up Voice Fit for iOS development..."

# Check for CocoaPods
if ! command -v pod &> /dev/null; then
  echo "❌ CocoaPods not installed. Run: sudo gem install cocoapods"
  exit 1
fi

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Create development build
echo "Building iOS development build..."
eas build --profile development --platform ios --local

echo "✅ Setup complete! Run 'npm run ios' to start."
```

---

## NEXT STEPS & IMPLEMENTATION ORDER

### Week 1: Project Setup
1. Initialize Expo project with TypeScript
2. Install all dependencies
3. Set up folder structure
4. Configure ESLint, Prettier, TypeScript strict mode
5. Set up web dev server

### Week 2: Authentication & Database (Web)
1. Supabase integration (auth service)
2. IndexedDB database layer
3. User store (Zustand)
4. Login/signup screens
5. Test auth flow with Playwright

### Week 3: Core UI Components (Web)
1. Build layout components (Screen, TabBar, Header)
2. Build common components (Button, Card, Input, Modal)
3. Build workout components (SetCard, ExerciseSelector, RPEPicker)
4. Test on web with Storybook or in-browser

### Week 4: Workout Logging (Web)
1. Voice parser (with keyboard input for testing)
2. Exercise resolver
3. Workout store
4. Active workout screen
5. Test complete workout flow on web

### Week 5: iOS Migration Begins
1. Set up iOS build with EAS
2. Replace IndexedDB with WatermelonDB
3. Replace mocked voice service with real Apple Speech
4. Test on iOS simulator

### Week 6: iOS Native Features
1. Integrate real haptic feedback
2. Integrate GPS tracking
3. Test voice recognition accuracy
4. Optimize performance (60fps target)

### Week 7: Polish & Testing
1. Add animations (Moti + Lottie)
2. Complete E2E test coverage
3. Performance profiling
4. Bug fixes

### Week 8: Beta Launch
1. TestFlight build
2. Internal testing
3. User feedback collection
4. Iterate based on feedback

---

## CRITICAL REMINDERS

### ✅ DO:
- Build on web first for faster iteration
- Test auth flows on web before iOS
- Use platform abstraction layer for all native APIs
- Write unit tests as you build features
- Optimize performance from day 1
- Use TypeScript strict mode
- Follow component patterns (smart vs presentational)

### ❌ DON'T:
- Try to build iOS-first (slower, harder to debug)
- Skip web testing phase
- Use actual iOS features on web (will break)
- Write platform-specific code in components (use services)
- Ignore performance until later (hard to fix)
- Skip TypeScript types (causes bugs later)
- Put business logic in components (hard to test)

---

**END OF TECHNICAL ARCHITECTURE DOCUMENT**

This document provides the complete middle layer structure to connect your UI designs to the backend. Your development team now has:

✅ Complete project folder structure  
✅ Platform abstraction patterns (web testing → iOS production)  
✅ State management architecture (Zustand stores)  
✅ **Database architecture (Supabase PostgreSQL backend + local storage)**
   - **Backend:** Supabase PostgreSQL + pgvector (shared by both platforms)
   - **iOS Local:** WatermelonDB (SQLite) syncs to Supabase
   - **Web Local:** IndexedDB syncs to Supabase
✅ Voice processing pipeline  
✅ Component patterns and examples  
✅ Testing strategy (unit, integration, E2E)  
✅ Development workflow (web-first approach)  
✅ Performance optimization strategies  
✅ Deployment configuration  

Ready for implementation! 🚀