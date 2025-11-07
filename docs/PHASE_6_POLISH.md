# Phase 6: Polish & Advanced Features

**Duration:** Week 8 (5-7 days)  
**Team Size:** 2-3 developers  
**Prerequisites:** Phase 5 complete (iOS native features)  
**Deliverable:** Production-ready UI with animations, dark mode, charts, and accessibility

---

## 📋 Overview

Phase 6 adds polish and advanced features:
- Smooth animations with Reanimated 3.x
- Dark mode implementation
- Performance charts with Victory Native XL
- Accessibility improvements (WCAG 2.1 AA)
- Confirmation sheets and modals
- Loading states and error handling
- Onboarding flow

**Success Criteria:**
- ✅ All animations run at 60fps
- ✅ Dark mode works throughout app
- ✅ Charts display workout data correctly
- ✅ WCAG 2.1 AA compliance (VoiceOver, contrast, touch targets)
- ✅ Smooth confirmation sheets for voice logging
- ✅ Loading states for all async operations
- ✅ Onboarding flow for new users

---

## 🎯 Tasks

### **Task 6.1: Add Animations**

**Install Victory Native XL:**
```bash
npm install victory-native@^41.4.0
npm install react-native-svg@15.6.0
```

**Create animated Voice FAB:**
```typescript
// src/components/voice/VoiceFAB.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

export default function VoiceFAB() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const startListening = () => {
    // Pulse animation while listening
    scale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1, // Infinite
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withSpring(0.6),
        withSpring(1)
      ),
      -1,
      true
    );
  };

  const stopListening = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        className="w-16 h-16 bg-accent-500 rounded-full items-center justify-center shadow-lg"
        onPress={handlePress}
      >
        <Mic color="white" size={32} />
      </Pressable>
    </Animated.View>
  );
}
```

**Create confirmation sheet animation:**
```typescript
// src/components/voice/ConfirmationSheet.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export default function ConfirmationSheet({ visible, onConfirm, onCancel, data }) {
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      translateY.value = withTiming(500, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-lg shadow-2xl"
    >
      <Text className="text-xl font-heading text-gray-800 mb-md">
        Confirm Set
      </Text>
      
      <View className="bg-gray-100 rounded-xl p-md mb-lg">
        <Text className="text-2xl font-heading text-primary-500">
          {data.exerciseName}
        </Text>
        <Text className="text-lg font-body text-gray-700 mt-sm">
          {data.weight} lbs × {data.reps} reps
        </Text>
        {data.rpe && (
          <Text className="text-base font-body text-gray-600 mt-xs">
            RPE {data.rpe}
          </Text>
        )}
      </View>

      <View className="flex-row gap-md">
        <Pressable
          className="flex-1 bg-gray-300 p-md rounded-xl items-center"
          onPress={onCancel}
        >
          <Text className="text-base font-heading text-gray-700">Cancel</Text>
        </Pressable>
        
        <Pressable
          className="flex-1 bg-primary-500 p-md rounded-xl items-center"
          onPress={onConfirm}
        >
          <Text className="text-base font-heading text-white">Confirm</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
```

---

### **Task 6.2: Implement Dark Mode**

**Create theme context:**
```typescript
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');

  const isDark = theme === 'auto' ? systemTheme === 'dark' : theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      <View className={isDark ? 'dark' : ''}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Update components for dark mode:**
```typescript
// Example: HomeScreen with dark mode
export default function HomeScreen() {
  const { isDark } = useTheme();

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-lg">
        <Text className={`text-2xl font-heading ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
          Welcome back!
        </Text>
      </View>
    </ScrollView>
  );
}
```

---

### **Task 6.3: Add Performance Charts**

**Create volume chart:**
```typescript
// src/components/charts/VolumeChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';

interface VolumeChartProps {
  data: { date: string; volume: number }[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
  return (
    <View className="bg-white rounded-xl p-md">
      <Text className="text-lg font-heading text-gray-800 mb-md">
        Weekly Volume
      </Text>
      
      <VictoryChart
        theme={VictoryTheme.material}
        height={200}
      >
        <VictoryAxis
          tickFormat={(t) => new Date(t).toLocaleDateString('en-US', { weekday: 'short' })}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t / 1000}k`}
        />
        <VictoryLine
          data={data}
          x="date"
          y="volume"
          style={{
            data: { stroke: '#2C5F3D', strokeWidth: 3 },
          }}
        />
      </VictoryChart>
    </View>
  );
}
```

**Add to Log screen:**
```typescript
// src/screens/LogScreen.tsx
import VolumeChart from '../components/charts/VolumeChart';

const mockVolumeData = [
  { date: '2025-11-01', volume: 12500 },
  { date: '2025-11-02', volume: 15000 },
  { date: '2025-11-03', volume: 13200 },
  { date: '2025-11-04', volume: 16800 },
];

export default function LogScreen() {
  return (
    <ScrollView>
      {/* ... other content ... */}
      <VolumeChart data={mockVolumeData} />
    </ScrollView>
  );
}
```

---

### **Task 6.4: Accessibility Improvements**

**Add VoiceOver labels:**
```typescript
<Pressable
  className="bg-primary-500 p-md rounded-xl"
  accessibilityLabel="Start workout"
  accessibilityHint="Begins a new workout session"
  accessibilityRole="button"
>
  <Text className="text-white font-heading">Start Workout</Text>
</Pressable>
```

**Ensure touch targets:**
```typescript
// All buttons should be at least 60pt (gym-optimized)
<Pressable
  className="min-h-[60px] min-w-[60px] items-center justify-center"
  // ...
>
```

**Test with VoiceOver:**
```bash
# On physical iPhone:
# Settings → Accessibility → VoiceOver → ON
# Navigate app with VoiceOver
# Verify all elements are labeled correctly
```

**Check color contrast:**
```typescript
// Use contrast checker: https://webaim.org/resources/contrastchecker/
// Ensure all text meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large)

// Example: Primary text on background
// #2C5F3D on #FBF7F5 = 8.2:1 ✅ (exceeds 4.5:1)
```

---

### **Task 6.5: Loading States**

**Create loading component:**
```typescript
// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#2C5F3D" />
      {message && (
        <Text className="text-base font-body text-gray-600 mt-md">
          {message}
        </Text>
      )}
    </View>
  );
}
```

**Add to async operations:**
```typescript
// Example: Home screen with loading state
export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading your workouts..." />;
  }

  return (
    // ... normal content
  );
}
```

---

### **Task 6.6: Onboarding Flow**

**Create onboarding screens:**
```typescript
// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';

const screens = [
  {
    title: 'Voice-First Logging',
    description: 'Log sets by speaking. No need to touch your phone.',
    image: require('../../assets/onboarding-1.png'),
  },
  {
    title: 'Track Your Progress',
    description: 'See your PRs, volume, and performance over time.',
    image: require('../../assets/onboarding-2.png'),
  },
  {
    title: 'AI-Powered Coaching',
    description: 'Get personalized training advice from your AI coach.',
    image: require('../../assets/onboarding-3.png'),
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const screen = screens[currentIndex];

  return (
    <View className="flex-1 bg-background-light p-lg">
      <Image source={screen.image} className="w-full h-64 mb-lg" />
      
      <Text className="text-3xl font-heading text-primary-500 mb-md">
        {screen.title}
      </Text>
      
      <Text className="text-lg font-body text-gray-600 mb-lg">
        {screen.description}
      </Text>

      <View className="flex-row justify-center mb-lg">
        {screens.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>

      <Pressable
        className="bg-primary-500 p-lg rounded-xl items-center"
        onPress={handleNext}
      >
        <Text className="text-xl font-heading text-white">
          {currentIndex < screens.length - 1 ? 'Next' : 'Get Started'}
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## ✅ Acceptance Criteria

- [ ] All animations run at 60fps
- [ ] Dark mode works throughout app
- [ ] Charts display correctly (Victory Native XL)
- [ ] VoiceOver labels on all interactive elements
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)
- [ ] Touch targets ≥60pt for all buttons
- [ ] Loading states for all async operations
- [ ] Onboarding flow for new users
- [ ] Confirmation sheet for voice logging
- [ ] Error handling with user-friendly messages

---

## 🚀 Next Phase

**Phase 7: Testing & Launch**
- Maestro E2E tests (iOS)
- TestFlight beta
- Bug fixes
- Performance tuning
- App Store submission

See `phases/PHASE_7_LAUNCH.md`

