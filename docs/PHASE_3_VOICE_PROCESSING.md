# Phase 3: Voice Processing (Web)

**Status:** ✅ COMPLETE
**Completed:** November 5, 2025
**Duration:** Week 4 (5-7 days)
**Team Size:** 2 developers
**Prerequisites:** Phase 2 complete (web app + stores)
**Deliverable:** Voice logging works on web with keyboard input and FastAPI backend integration

---

## 📋 Overview

Phase 3 implements voice processing for web testing:
- Create platform abstraction layer for voice services
- Build VoiceParser to extract exercise/weight/reps from text
- Implement ExerciseResolver with 3-tier search (exact, phonetic, semantic)
- Add keyboard input for testing (simulates voice)
- Mock Web Speech API for E2E tests
- Integrate with workout store

**Success Criteria:**
- ✅ User can type "bench press 225 for 10" → logs set
- ✅ VoiceParser extracts exercise, weight, reps, RPE
- ✅ ExerciseResolver matches to database (877 exercises)
- ✅ Playwright tests cover voice logging flow
- ✅ Voice FAB component works on web
- ✅ Confirmation sheet shows parsed data

---

## 🎯 Tasks

### **Task 3.1: Create Voice Service Interface**

**Create `src/services/voice/VoiceService.ts`:**
```typescript
export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
}

export interface IVoiceService {
  startListening(): Promise<void>;
  stopListening(): void;
  onResult(callback: (result: VoiceRecognitionResult) => void): void;
  onError(callback: (error: Error) => void): void;
  isSupported(): boolean;
}
```

**Create `src/services/voice/VoiceService.web.ts`:**
```typescript
import { IVoiceService, VoiceRecognitionResult } from './VoiceService';

export class VoiceServiceWeb implements IVoiceService {
  private resultCallback?: (result: VoiceRecognitionResult) => void;
  private errorCallback?: (error: Error) => void;
  private isListening = false;

  // For web testing, we'll use keyboard input
  // Real Web Speech API integration in Phase 6
  async startListening(): Promise<void> {
    this.isListening = true;
    console.log('[VoiceService.web] Listening started (keyboard mode)');
  }

  stopListening(): void {
    this.isListening = false;
    console.log('[VoiceService.web] Listening stopped');
  }

  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  isSupported(): boolean {
    return true; // Always supported on web (keyboard fallback)
  }

  // Helper method for testing
  simulateVoiceInput(transcript: string): void {
    if (this.resultCallback) {
      this.resultCallback({
        transcript,
        confidence: 1.0,
      });
    }
  }
}
```

**Create `src/services/voice/index.ts`:**
```typescript
import { Platform } from 'react-native';
import { IVoiceService } from './VoiceService';
import { VoiceServiceWeb } from './VoiceService.web';

// Platform-specific export
export const VoiceService: IVoiceService = 
  Platform.OS === 'web' 
    ? new VoiceServiceWeb()
    : new VoiceServiceWeb(); // iOS implementation in Phase 4

export * from './VoiceService';
```

---

### **Task 3.2: Build VoiceParser**

**Create `src/services/voice-processing/VoiceParser.ts`:**
```typescript
export interface ParsedVoiceCommand {
  exerciseName: string;
  weight?: number;
  reps?: number;
  rpe?: number;
  rawTranscript: string;
}

export class VoiceParser {
  parse(transcript: string): ParsedVoiceCommand {
    const normalized = transcript.toLowerCase().trim();

    // Extract weight (e.g., "225", "225 pounds", "225 lbs")
    const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kgs?|kilograms?)?/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : undefined;

    // Extract reps (e.g., "for 10", "10 reps", "times 10")
    const repsMatch = normalized.match(/(?:for|times|x)\s*(\d+)|(\d+)\s*reps?/);
    const reps = repsMatch ? parseInt(repsMatch[1] || repsMatch[2]) : undefined;

    // Extract RPE (e.g., "RPE 8", "at 8", "@8")
    const rpeMatch = normalized.match(/(?:rpe|at|@)\s*(\d+(?:\.\d+)?)/);
    const rpe = rpeMatch ? parseFloat(rpeMatch[1]) : undefined;

    // Extract exercise name (everything before weight/reps)
    let exerciseName = normalized;
    
    // Remove weight phrase
    if (weightMatch) {
      exerciseName = exerciseName.replace(weightMatch[0], '').trim();
    }
    
    // Remove reps phrase
    if (repsMatch) {
      exerciseName = exerciseName.replace(repsMatch[0], '').trim();
    }
    
    // Remove RPE phrase
    if (rpeMatch) {
      exerciseName = exerciseName.replace(rpeMatch[0], '').trim();
    }

    // Clean up common filler words
    exerciseName = exerciseName
      .replace(/\b(for|times|x|at|rpe|@)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      exerciseName,
      weight,
      reps,
      rpe,
      rawTranscript: transcript,
    };
  }
}
```

**Create tests `__tests__/unit/VoiceParser.test.ts`:**
```typescript
import { VoiceParser } from '../../src/services/voice-processing/VoiceParser';

describe('VoiceParser', () => {
  const parser = new VoiceParser();

  it('parses basic command', () => {
    const result = parser.parse('bench press 225 for 10');
    expect(result.exerciseName).toBe('bench press');
    expect(result.weight).toBe(225);
    expect(result.reps).toBe(10);
  });

  it('parses with RPE', () => {
    const result = parser.parse('squat 315 for 5 at 8');
    expect(result.exerciseName).toBe('squat');
    expect(result.weight).toBe(315);
    expect(result.reps).toBe(5);
    expect(result.rpe).toBe(8);
  });

  it('handles different formats', () => {
    const result = parser.parse('deadlift 405 times 3 RPE 9');
    expect(result.exerciseName).toBe('deadlift');
    expect(result.weight).toBe(405);
    expect(result.reps).toBe(3);
    expect(result.rpe).toBe(9);
  });
});
```

---

### **Task 3.3: Build ExerciseResolver**

**Create `src/services/voice-processing/ExerciseResolver.ts`:**
```typescript
import { supabase } from '../database/supabase.client';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment?: string;
}

export class ExerciseResolver {
  private exerciseCache: Exercise[] = [];

  async initialize(): Promise<void> {
    // Load all exercises into memory for fast lookup
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, category, equipment');

    if (error) throw error;
    this.exerciseCache = data || [];
  }

  async resolve(exerciseName: string): Promise<Exercise | null> {
    if (this.exerciseCache.length === 0) {
      await this.initialize();
    }

    // Tier 1: Exact match (1-5ms)
    const exactMatch = this.findExactMatch(exerciseName);
    if (exactMatch) return exactMatch;

    // Tier 2: Phonetic match (5-20ms)
    const phoneticMatch = this.findPhoneticMatch(exerciseName);
    if (phoneticMatch) return phoneticMatch;

    // Tier 3: Semantic match via pgvector (20-50ms)
    const semanticMatch = await this.findSemanticMatch(exerciseName);
    return semanticMatch;
  }

  private findExactMatch(name: string): Exercise | null {
    const normalized = name.toLowerCase().trim();
    return this.exerciseCache.find(
      (ex) => ex.name.toLowerCase() === normalized
    ) || null;
  }

  private findPhoneticMatch(name: string): Exercise | null {
    // Simple phonetic matching (Soundex-like)
    const normalized = name.toLowerCase().replace(/[^a-z\s]/g, '');
    
    return this.exerciseCache.find((ex) => {
      const exNormalized = ex.name.toLowerCase().replace(/[^a-z\s]/g, '');
      return this.levenshteinDistance(normalized, exNormalized) <= 2;
    }) || null;
  }

  private async findSemanticMatch(name: string): Promise<Exercise | null> {
    // Use Supabase pgvector for semantic search
    const { data, error } = await supabase.rpc('search_exercises_semantic', {
      query_text: name,
      match_threshold: 0.7,
      match_count: 1,
    });

    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
```

---

### **Task 3.4: Create Voice FAB Component**

**Create `src/components/voice/VoiceFAB.tsx`:**
```typescript
import React, { useState } from 'react';
import { Pressable, View, Text, TextInput, Modal } from 'react-native';
import { Mic, X } from 'lucide-react-native';
import { VoiceService } from '../../services/voice';
import { VoiceParser } from '../../services/voice-processing/VoiceParser';
import { ExerciseResolver } from '../../services/voice-processing/ExerciseResolver';
import { useWorkoutStore } from '../../store/workout.store';

export default function VoiceFAB() {
  const [isListening, setIsListening] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const addSet = useWorkoutStore((state) => state.addSet);

  const parser = new VoiceParser();
  const resolver = new ExerciseResolver();

  const handleVoiceInput = async (transcript: string) => {
    // Parse the transcript
    const parsed = parser.parse(transcript);

    // Resolve exercise name to database
    const exercise = await resolver.resolve(parsed.exerciseName);

    if (exercise && parsed.weight && parsed.reps) {
      // Add to workout store
      addSet({
        exerciseName: exercise.name,
        weight: parsed.weight,
        reps: parsed.reps,
        rpe: parsed.rpe,
      });

      // Show confirmation (TODO: Phase 6)
      alert(`Logged: ${exercise.name} ${parsed.weight}lbs x ${parsed.reps}`);
    } else {
      alert('Could not parse voice command');
    }

    setShowInput(false);
    setInputText('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-20 right-6 w-16 h-16 bg-accent-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowInput(true)}
      >
        <Mic color="white" size={32} />
      </Pressable>

      {/* Keyboard Input Modal (Web Testing) */}
      <Modal visible={showInput} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-lg rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-md">
              <Text className="text-xl font-heading text-gray-800">
                Voice Input (Keyboard)
              </Text>
              <Pressable onPress={() => setShowInput(false)}>
                <X color="#666" size={24} />
              </Pressable>
            </View>

            <TextInput
              className="border border-gray-300 rounded-xl p-md text-base font-body mb-md"
              placeholder="e.g., bench press 225 for 10"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
            />

            <Pressable
              className="bg-primary-500 p-md rounded-xl items-center"
              onPress={() => handleVoiceInput(inputText)}
            >
              <Text className="text-base font-heading text-white">
                Log Set
              </Text>
            </Pressable>

            <Text className="text-sm font-body text-gray-600 mt-md text-center">
              Type your command (voice input coming in Phase 4)
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
```

---

### **Task 3.5: Add Voice FAB to START Screen**

**Update `src/screens/StartScreen.tsx`:**
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import VoiceFAB from '../components/voice/VoiceFAB';

export default function StartScreen() {
  return (
    <View className="flex-1 bg-background-light">
      <View className="p-lg">
        <Text className="text-2xl font-heading text-primary-500">
          Start Workout
        </Text>
        <Text className="text-base font-body text-gray-600 mt-xs">
          Use voice to log sets
        </Text>
      </View>

      <VoiceFAB />
    </View>
  );
}
```

---

### **Task 3.6: Create Playwright Voice Tests**

**Create `__tests__/e2e/web/voice-logging.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Voice Logging', () => {
  test('logs set via keyboard input', async ({ page }) => {
    await page.goto('/');

    // Navigate to START tab
    await page.click('text=START');

    // Click voice FAB
    await page.click('[data-testid="voice-fab"]');

    // Type command
    await page.fill('input[placeholder*="bench press"]', 'bench press 225 for 10');

    // Submit
    await page.click('text=Log Set');

    // Verify confirmation
    await expect(page.locator('text=Logged: Bench Press')).toBeVisible();
  });
});
```

---

## ✅ Acceptance Criteria

- [x] Voice parsing via FastAPI backend with fine-tuned GPT-4o-mini model
- [x] Exercise matching with fuzzy + semantic search (backend handles this)
- [x] Voice FAB component renders on START screen
- [x] Keyboard input modal works for testing
- [x] Typing "bench press 225 for 10" calls API and shows parsed data
- [x] Confidence-based UX (auto-accept ≥85%, confirm 70-85%, retry <70%)
- [x] Workout store updates with confirmed sets
- [x] Playwright E2E tests written (mocked API responses)
- [x] Unit tests for Voice API Client written (retry, timeout, errors)
- [x] FastAPI backend running and accessible
- [x] Documentation updated with implementation notes

---

## 📝 Implementation Notes (Updated)

### **FastAPI Backend Integration**

Phase 3 was updated to integrate with the existing FastAPI backend instead of building a simple client-side parser. This provides:

**Architecture:**
- **Frontend:** VoiceFAB component with keyboard input modal
- **API Client:** TypeScript HTTP client (`VoiceAPIClient.ts`)
- **Backend:** FastAPI server with fine-tuned GPT-4o-mini model
- **Model:** `ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`

**Key Components Created:**

1. **Voice API Client** (`src/services/api/VoiceAPIClient.ts`)
   - HTTP client with retry logic (2 retries)
   - Timeout handling (10 seconds)
   - Error handling with custom `VoiceAPIError` class
   - Methods: `parseVoiceCommand()`, `healthCheck()`

2. **Voice FAB Component** (`src/components/voice/VoiceFAB.tsx`)
   - Floating action button with mic icon
   - Keyboard input modal for web testing
   - Integrated confirmation UI (shows parsed data with confidence)
   - Auto-accept for high confidence (≥85%)
   - Manual confirmation for medium confidence (70-85%)
   - Error handling and retry

3. **Type Definitions** (`src/services/api/types.ts`)
   - `VoiceParseRequest`: transcript, workout_context
   - `VoiceParseResponse`: exercise_id, exercise_name, weight, reps, rpe, confidence, requires_confirmation, model_used, latency_ms

**Confidence-Based UX:**
- **High (≥85%):** Auto-accept, show confirmation briefly
- **Medium (70-85%):** Show confirmation sheet, require user acceptance
- **Low (<70%):** Show error, ask user to retry

**Testing:**
- Unit tests for API client (retry, timeout, error handling)
- E2E tests with Playwright (mocked API responses)
- Manual testing on localhost:8081

**Environment Variables:**
```bash
EXPO_PUBLIC_VOICE_API_URL=http://localhost:8000
```

**Running the System:**
```bash
# Terminal 1: Start FastAPI backend
cd api
python3 voice_parser.py

# Terminal 2: Start web app
cd voice-fit-app
npm run web
```

**Benefits of This Approach:**
- ✅ Production-ready from day one
- ✅ Sophisticated parsing with fine-tuned model (3,890 training examples)
- ✅ Confidence scoring for smart UX
- ✅ Exercise matching with fuzzy + semantic search
- ✅ Context awareness ("same weight" references)
- ✅ Comprehensive logging to Supabase for analytics

---

## 🚀 Next Phase

**Phase 4: iOS Migration**
- Replace keyboard → Apple Speech API
- Add WatermelonDB for offline storage
- Implement Supabase sync

See `phases/PHASE_4_IOS_MIGRATION.md`

