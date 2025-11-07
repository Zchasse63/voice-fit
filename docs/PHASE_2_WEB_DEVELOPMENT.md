# Phase 2: Web Development & Testing Infrastructure

**Duration:** Weeks 2-3 (10-14 days)  
**Team Size:** 2-3 developers  
**Prerequisites:** Phase 1 complete (navigation + basic screens)  
**Deliverable:** Functional web app with Supabase auth, Zustand stores, and Playwright E2E tests

---

## 📋 Overview

Phase 2 builds the core web application:
- Implement actual screen content (Home, Log, START, PRs, Coach)
- Set up Supabase client for authentication and data
- Create Zustand stores for state management
- Build platform abstraction layer (web implementations)
- Configure Playwright for E2E testing
- Create reusable UI components

**Success Criteria:**
- ✅ Users can sign up/login via Supabase
- ✅ Home screen shows daily overview
- ✅ Log screen displays workout history
- ✅ START screen has workout/run options
- ✅ PRs screen shows personal records
- ✅ Coach screen has basic chat UI
- ✅ Zustand stores manage global state
- ✅ Playwright tests cover critical flows
- ✅ All features work on web (`npx expo start --web`)

---

## 🎯 Tasks

### **Task 2.1: Set Up Supabase Client**

**Install dependencies:**
```bash
npm install @supabase/supabase-js@^2.45.0
```

**Create `src/services/database/supabase.client.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

**Create `.env` file:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Add to `.gitignore`:**
```
.env
.env.local
```

---

### **Task 2.2: Create Zustand Stores**

**Create `src/store/auth.store.ts`:**
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '../services/database/supabase.client';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,

        signIn: async (email, password) => {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          set({ user: data.user, isLoading: false });
        },

        signUp: async (email, password) => {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          set({ user: data.user, isLoading: false });
        },

        signOut: async () => {
          await supabase.auth.signOut();
          set({ user: null });
        },

        checkSession: async () => {
          const { data } = await supabase.auth.getSession();
          set({ user: data.session?.user ?? null });
        },
      }),
      { name: 'auth-storage' }
    )
  )
);
```

**Create `src/store/workout.store.ts`:**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Set {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  timestamp: Date;
}

interface WorkoutState {
  activeWorkout: { id: string; name: string; startTime: Date } | null;
  sets: Set[];
  startWorkout: (name: string) => void;
  addSet: (set: Omit<Set, 'id' | 'timestamp'>) => void;
  completeWorkout: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>()(
  devtools((set, get) => ({
    activeWorkout: null,
    sets: [],

    startWorkout: (name) => {
      set({
        activeWorkout: {
          id: crypto.randomUUID(),
          name,
          startTime: new Date(),
        },
        sets: [],
      });
    },

    addSet: (newSet) => {
      set((state) => ({
        sets: [
          ...state.sets,
          {
            ...newSet,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
        ],
      }));
    },

    completeWorkout: async () => {
      const { activeWorkout, sets } = get();
      if (!activeWorkout) return;

      // TODO: Save to Supabase (Phase 3)
      console.log('Saving workout:', { activeWorkout, sets });

      set({ activeWorkout: null, sets: [] });
    },
  }))
);
```

---

### **Task 2.3: Build Home Screen**

**Update `src/screens/HomeScreen.tsx`:**
```typescript
import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useWorkoutStore } from '../store/workout.store';
import { Dumbbell, TrendingUp, Calendar } from 'lucide-react-native';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  return (
    <ScrollView className="flex-1 bg-background-light">
      <View className="p-lg">
        {/* Header */}
        <Text className="text-2xl font-heading text-primary-500">
          Welcome back, {user?.name || 'Athlete'}!
        </Text>
        <Text className="text-base font-body text-gray-600 mt-xs">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>

        {/* Active Workout Card */}
        {activeWorkout && (
          <View className="mt-lg p-md bg-accent-500 rounded-xl">
            <Text className="text-lg font-heading text-white">
              Active Workout
            </Text>
            <Text className="text-base font-body text-white mt-xs">
              {activeWorkout.name}
            </Text>
            <Text className="text-sm font-body text-white/80 mt-xs">
              Started {activeWorkout.startTime.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mt-lg">
          <Text className="text-lg font-heading text-gray-800 mb-md">
            Quick Actions
          </Text>
          
          <Pressable
            className="flex-row items-center p-md bg-primary-500 rounded-xl mb-md"
            onPress={() => startWorkout('Quick Workout')}
          >
            <Dumbbell color="white" size={24} />
            <Text className="text-base font-heading text-white ml-md">
              Start Workout
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center p-md bg-secondary-500 rounded-xl mb-md">
            <TrendingUp color="white" size={24} />
            <Text className="text-base font-heading text-white ml-md">
              View Progress
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center p-md bg-accent-500 rounded-xl">
            <Calendar color="white" size={24} />
            <Text className="text-base font-heading text-white ml-md">
              Today's Program
            </Text>
          </Pressable>
        </View>

        {/* Stats Summary */}
        <View className="mt-lg">
          <Text className="text-lg font-heading text-gray-800 mb-md">
            This Week
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1 p-md bg-white rounded-xl mr-sm">
              <Text className="text-2xl font-heading text-primary-500">5</Text>
              <Text className="text-sm font-body text-gray-600">Workouts</Text>
            </View>
            <View className="flex-1 p-md bg-white rounded-xl ml-sm">
              <Text className="text-2xl font-heading text-primary-500">12.5k</Text>
              <Text className="text-sm font-body text-gray-600">lbs Volume</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
```

---

### **Task 2.4: Build Log Screen**

**Update `src/screens/LogScreen.tsx`:**
```typescript
import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { Calendar, TrendingUp } from 'lucide-react-native';

const mockWorkouts = [
  { id: '1', name: 'Upper Body', date: '2025-11-03', sets: 12, volume: 3200 },
  { id: '2', name: 'Lower Body', date: '2025-11-01', sets: 10, volume: 4500 },
  { id: '3', name: 'Full Body', date: '2025-10-30', sets: 15, volume: 5100 },
];

export default function LogScreen() {
  return (
    <ScrollView className="flex-1 bg-background-light">
      <View className="p-lg">
        <Text className="text-2xl font-heading text-primary-500">
          Workout Log
        </Text>
        <Text className="text-base font-body text-gray-600 mt-xs">
          Your training history
        </Text>

        {/* Calendar View (Placeholder) */}
        <View className="mt-lg p-md bg-white rounded-xl">
          <View className="flex-row items-center mb-md">
            <Calendar color="#2C5F3D" size={20} />
            <Text className="text-lg font-heading text-gray-800 ml-sm">
              November 2025
            </Text>
          </View>
          <Text className="text-sm font-body text-gray-600">
            Calendar view coming in Phase 6
          </Text>
        </View>

        {/* Workout List */}
        <View className="mt-lg">
          <Text className="text-lg font-heading text-gray-800 mb-md">
            Recent Workouts
          </Text>
          
          {mockWorkouts.map((workout) => (
            <View
              key={workout.id}
              className="p-md bg-white rounded-xl mb-md"
            >
              <Text className="text-lg font-heading text-gray-800">
                {workout.name}
              </Text>
              <Text className="text-sm font-body text-gray-600 mt-xs">
                {new Date(workout.date).toLocaleDateString()}
              </Text>
              <View className="flex-row mt-sm">
                <Text className="text-sm font-body text-gray-600 mr-md">
                  {workout.sets} sets
                </Text>
                <Text className="text-sm font-body text-gray-600">
                  {workout.volume.toLocaleString()} lbs
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
```

---

### **Task 2.5: Configure Playwright**

**Install Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e/web',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:19006',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx expo start --web',
    url: 'http://localhost:19006',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create `__tests__/e2e/web/navigation.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/');

    // Check Home tab is active
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // Click Log tab
    await page.click('text=Log');
    await expect(page.locator('text=Workout Log')).toBeVisible();

    // Click START tab
    await page.click('text=START');
    await expect(page.locator('text=START Screen')).toBeVisible();

    // Click PRs tab
    await page.click('text=PRs');
    await expect(page.locator('text=PRs Screen')).toBeVisible();

    // Click Coach tab
    await page.click('text=Coach');
    await expect(page.locator('text=Coach Screen')).toBeVisible();
  });
});
```

**Run tests:**
```bash
npx playwright test
```

---

## ✅ Acceptance Criteria

- [ ] Supabase client configured and working
- [ ] Auth store (Zustand) handles sign in/up/out
- [ ] Workout store manages active workout state
- [ ] Home screen shows daily overview + quick actions
- [ ] Log screen displays workout history
- [ ] START screen has workout/run options (placeholder)
- [ ] PRs screen shows personal records (placeholder)
- [ ] Coach screen has chat UI (placeholder)
- [ ] Playwright tests pass (`npx playwright test`)
- [ ] Web app runs without errors
- [ ] TypeScript compiles (`npx tsc --noEmit`)

---

## 🚀 Next Phase

**Phase 3: Voice Processing (Web)**
- Implement keyboard-based voice input
- Build VoiceParser logic
- Create ExerciseResolver
- Mock Web Speech API

See `phases/PHASE_3_VOICE_PROCESSING.md`

