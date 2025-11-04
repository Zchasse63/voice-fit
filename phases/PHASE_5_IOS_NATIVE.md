# Phase 5: iOS Native Features

**Duration:** Week 7 (5-7 days)  
**Team Size:** 2 developers  
**Prerequisites:** Phase 4 complete (iOS app with voice + offline)  
**Deliverable:** Full-featured iOS app with GPS tracking, optimized performance, and battery efficiency

---

## 📋 Overview

Phase 5 adds iOS-specific native features:
- GPS tracking for outdoor runs (expo-location)
- Voice recognition accuracy tuning
- Performance optimization (60fps animations)
- Battery usage testing and optimization
- Background location tracking
- Run statistics (pace, distance, elevation)

**Success Criteria:**
- ✅ GPS tracks outdoor runs accurately
- ✅ Voice recognition >90% accuracy (quiet), >75% (gym)
- ✅ App maintains 60fps during workouts
- ✅ Battery drain <10%/hour (workout), <15%/hour (run with GPS)
- ✅ Background location works when app is minimized
- ✅ Run stats display correctly (pace, distance, elevation)

---

## 🎯 Tasks

### **Task 5.1: Add GPS Tracking**

**Install expo-location:**
```bash
npx expo install expo-location
```

**Create `src/services/gps/GPSService.ios.ts`:**
```typescript
import * as Location from 'expo-location';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: Date;
}

export class GPSServiceIOS {
  private watchId?: Location.LocationSubscription;
  private coordinates: GPSCoordinate[] = [];

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    // Request background permissions for run tracking
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    return bgStatus === 'granted';
  }

  async startTracking(callback: (coord: GPSCoordinate) => void): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // Update every 1 second
        distanceInterval: 5, // Or every 5 meters
      },
      (location) => {
        const coord: GPSCoordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude ?? undefined,
          accuracy: location.coords.accuracy ?? undefined,
          timestamp: new Date(location.timestamp),
        };

        this.coordinates.push(coord);
        callback(coord);
      }
    );
  }

  stopTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = undefined;
    }
  }

  getCoordinates(): GPSCoordinate[] {
    return this.coordinates;
  }

  clearCoordinates(): void {
    this.coordinates = [];
  }

  calculateDistance(): number {
    // Haversine formula for distance between coordinates
    let totalDistance = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      const prev = this.coordinates[i - 1];
      const curr = this.coordinates[i];

      const R = 6371e3; // Earth radius in meters
      const φ1 = (prev.latitude * Math.PI) / 180;
      const φ2 = (curr.latitude * Math.PI) / 180;
      const Δφ = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const Δλ = ((curr.longitude - prev.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      totalDistance += R * c;
    }

    return totalDistance; // meters
  }

  calculatePace(): number {
    // Pace in minutes per mile
    if (this.coordinates.length < 2) return 0;

    const distance = this.calculateDistance() / 1609.34; // Convert to miles
    const duration =
      (this.coordinates[this.coordinates.length - 1].timestamp.getTime() -
        this.coordinates[0].timestamp.getTime()) /
      60000; // Convert to minutes

    return duration / distance; // min/mile
  }
}
```

---

### **Task 5.2: Create Run Tracking Store**

**Create `src/store/run.store.ts`:**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GPSServiceIOS, GPSCoordinate } from '../services/gps/GPSService.ios';

interface RunState {
  isRunning: boolean;
  startTime: Date | null;
  coordinates: GPSCoordinate[];
  distance: number; // meters
  pace: number; // min/mile
  elevation: number; // meters
  startRun: () => void;
  stopRun: () => Promise<void>;
  updateCoordinate: (coord: GPSCoordinate) => void;
}

const gpsService = new GPSServiceIOS();

export const useRunStore = create<RunState>()(
  devtools((set, get) => ({
    isRunning: false,
    startTime: null,
    coordinates: [],
    distance: 0,
    pace: 0,
    elevation: 0,

    startRun: () => {
      set({ isRunning: true, startTime: new Date(), coordinates: [] });

      gpsService.startTracking((coord) => {
        get().updateCoordinate(coord);
      });
    },

    stopRun: async () => {
      gpsService.stopTracking();

      const { coordinates } = get();
      const distance = gpsService.calculateDistance();
      const pace = gpsService.calculatePace();

      // TODO: Save to WatermelonDB + Supabase
      console.log('Run completed:', { distance, pace, coordinates });

      set({ isRunning: false, startTime: null });
      gpsService.clearCoordinates();
    },

    updateCoordinate: (coord) => {
      set((state) => ({
        coordinates: [...state.coordinates, coord],
        distance: gpsService.calculateDistance(),
        pace: gpsService.calculatePace(),
        elevation: coord.altitude ?? state.elevation,
      }));
    },
  }))
);
```

---

### **Task 5.3: Build Run Tracking Screen**

**Create `src/screens/RunScreen.tsx`:**
```typescript
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRunStore } from '../store/run.store';
import { Play, Square } from 'lucide-react-native';

export default function RunScreen() {
  const { isRunning, distance, pace, elevation, startRun, stopRun } = useRunStore();

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return miles.toFixed(2);
  };

  const formatPace = (minPerMile: number) => {
    const minutes = Math.floor(minPerMile);
    const seconds = Math.round((minPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-background-light p-lg">
      <Text className="text-2xl font-heading text-primary-500 mb-lg">
        Run Tracking
      </Text>

      {/* Stats */}
      <View className="bg-white rounded-xl p-lg mb-lg">
        <View className="flex-row justify-between mb-md">
          <View>
            <Text className="text-sm font-body text-gray-600">Distance</Text>
            <Text className="text-3xl font-heading text-primary-500">
              {formatDistance(distance)}
            </Text>
            <Text className="text-sm font-body text-gray-600">miles</Text>
          </View>

          <View>
            <Text className="text-sm font-body text-gray-600">Pace</Text>
            <Text className="text-3xl font-heading text-primary-500">
              {formatPace(pace)}
            </Text>
            <Text className="text-sm font-body text-gray-600">min/mile</Text>
          </View>
        </View>

        <View>
          <Text className="text-sm font-body text-gray-600">Elevation</Text>
          <Text className="text-2xl font-heading text-primary-500">
            {elevation.toFixed(0)} m
          </Text>
        </View>
      </View>

      {/* Start/Stop Button */}
      <Pressable
        className={`p-lg rounded-xl items-center ${
          isRunning ? 'bg-red-500' : 'bg-primary-500'
        }`}
        onPress={isRunning ? stopRun : startRun}
      >
        {isRunning ? (
          <>
            <Square color="white" size={32} />
            <Text className="text-xl font-heading text-white mt-sm">
              Stop Run
            </Text>
          </>
        ) : (
          <>
            <Play color="white" size={32} />
            <Text className="text-xl font-heading text-white mt-sm">
              Start Run
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
```

---

### **Task 5.4: Optimize Performance**

**Enable Hermes (if not already):**
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes",
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

**Optimize animations:**
```typescript
// Use Reanimated for 60fps animations
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

// Example: Voice FAB pulse animation
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

// Trigger animation
scale.value = withSpring(1.2, { damping: 2 });
```

**Memoize expensive components:**
```typescript
import React, { memo } from 'react';

const SetCard = memo(({ set }) => {
  return (
    <View>
      <Text>{set.exerciseName}</Text>
      <Text>{set.weight} lbs × {set.reps}</Text>
    </View>
  );
});
```

---

### **Task 5.5: Battery Optimization**

**Configure background location:**
```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Voice Fit needs your location to track outdoor runs.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Voice Fit needs background location to track runs when the app is minimized.",
        "UIBackgroundModes": ["location"]
      }
    }
  }
}
```

**Reduce GPS update frequency when not needed:**
```typescript
// In GPSService, adjust accuracy based on activity
const accuracy = isRunning 
  ? Location.Accuracy.BestForNavigation  // High accuracy for runs
  : Location.Accuracy.Balanced;          // Lower accuracy for workouts
```

**Test battery usage:**
```bash
# Run app on physical device
# Start workout/run
# Monitor battery in Settings → Battery
# Target: <10%/hour (workout), <15%/hour (run)
```

---

### **Task 5.6: Voice Recognition Tuning**

**Add noise cancellation:**
```typescript
// In VoiceService.ios.ts
Speech.startSpeechRecognitionAsync({
  language: 'en-US',
  continuous: false,
  interimResults: false,
  maxAlternatives: 3, // Get top 3 alternatives
  // iOS-specific: Use on-device recognition for better privacy
  requiresOnDeviceRecognition: true,
});
```

**Add confidence threshold:**
```typescript
// In VoiceFAB component
const handleVoiceResult = (result: VoiceRecognitionResult) => {
  if (result.confidence < 0.7) {
    // Low confidence, ask user to repeat
    alert('Could not understand. Please try again.');
    return;
  }

  // Process command
  handleVoiceInput(result.transcript);
};
```

**Test in noisy environment:**
```bash
# Test in gym with background music/noise
# Target: >75% accuracy
# Adjust confidence threshold as needed
```

---

## ✅ Acceptance Criteria

- [ ] GPS tracks outdoor runs accurately
- [ ] Run stats display correctly (distance, pace, elevation)
- [ ] Background location works when app minimized
- [ ] Voice recognition >90% (quiet), >75% (gym)
- [ ] App maintains 60fps during workouts
- [ ] Battery drain <10%/hour (workout), <15%/hour (run)
- [ ] No performance issues on iPhone 12 or newer
- [ ] Hermes enabled for faster startup

---

## 🚀 Next Phase

**Phase 6: Polish & Advanced Features**
- Animations (Reanimated 3.x)
- Dark mode
- Charts (Victory Native XL)
- Accessibility (WCAG 2.1 AA)

See `phases/PHASE_6_POLISH.md`

