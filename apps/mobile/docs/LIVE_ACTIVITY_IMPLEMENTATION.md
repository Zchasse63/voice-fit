# Live Activity Implementation Guide

## Overview

Live Activities provide real-time workout updates on the Lock Screen and Dynamic Island during active workout sessions.

## Features

- **Lock Screen Widget**: Shows current exercise, set progress, rest timer
- **Dynamic Island**: Compact view with exercise name and timer
- **Real-time Updates**: Updates as user logs sets via voice or manual input
- **Rest Timer**: Visual countdown for rest periods between sets

## Architecture

### 1. Activity Attributes

```swift
// WorkoutActivityAttributes.swift
import ActivityKit

struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentExercise: String
        var currentSet: Int
        var totalSets: Int
        var repsCompleted: Int
        var targetReps: Int
        var restTimeRemaining: Int? // seconds
        var workoutStatus: String // "active", "resting", "completed"
    }
    
    var workoutName: String
    var startTime: Date
}
```

### 2. Live Activity Widget

```swift
// WorkoutLiveActivity.swift
import ActivityKit
import WidgetKit
import SwiftUI

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen view
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(context.attributes.workoutName)
                        .font(.headline)
                    Spacer()
                    Text(formatDuration(from: context.attributes.startTime))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if context.state.workoutStatus == "resting" {
                    // Rest timer
                    HStack {
                        Image(systemName: "timer")
                        Text("Rest: \(context.state.restTimeRemaining ?? 0)s")
                            .font(.title2)
                            .bold()
                    }
                    .foregroundColor(.orange)
                } else {
                    // Current exercise
                    Text(context.state.currentExercise)
                        .font(.title3)
                        .bold()
                    
                    // Set progress
                    HStack {
                        Text("Set \(context.state.currentSet)/\(context.state.totalSets)")
                        Spacer()
                        Text("\(context.state.repsCompleted)/\(context.state.targetReps) reps")
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                }
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.8))
            .activitySystemActionForegroundColor(Color.white)
            
        } dynamicIsland: { context in
            // Dynamic Island views
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.currentExercise)
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Set \(context.state.currentSet)/\(context.state.totalSets)")
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.workoutStatus == "resting" {
                        Text("Rest: \(context.state.restTimeRemaining ?? 0)s")
                            .font(.title3)
                    } else {
                        Text("\(context.state.repsCompleted)/\(context.state.targetReps) reps")
                            .font(.title3)
                    }
                }
            } compactLeading: {
                Image(systemName: "figure.strengthtraining.traditional")
            } compactTrailing: {
                if context.state.workoutStatus == "resting" {
                    Text("\(context.state.restTimeRemaining ?? 0)s")
                        .font(.caption2)
                } else {
                    Text("\(context.state.currentSet)/\(context.state.totalSets)")
                        .font(.caption2)
                }
            } minimal: {
                Image(systemName: "figure.strengthtraining.traditional")
            }
        }
    }
}
```

### 3. Starting Live Activity

```typescript
// apps/mobile/src/services/liveActivity/LiveActivityService.ts
import { NativeModules } from 'react-native';

const { LiveActivityModule } = NativeModules;

export class LiveActivityService {
  static async startWorkoutActivity(
    workoutName: string,
    currentExercise: string,
    totalSets: number
  ): Promise<string> {
    try {
      const activityId = await LiveActivityModule.startActivity({
        workoutName,
        currentExercise,
        currentSet: 1,
        totalSets,
        repsCompleted: 0,
        targetReps: 0,
        workoutStatus: 'active',
      });
      
      return activityId;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      throw error;
    }
  }

  static async updateActivity(
    activityId: string,
    updates: {
      currentExercise?: string;
      currentSet?: number;
      repsCompleted?: number;
      targetReps?: number;
      restTimeRemaining?: number;
      workoutStatus?: 'active' | 'resting' | 'completed';
    }
  ): Promise<void> {
    try {
      await LiveActivityModule.updateActivity(activityId, updates);
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }

  static async endActivity(activityId: string): Promise<void> {
    try {
      await LiveActivityModule.endActivity(activityId);
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }
}
```

### 4. Integration with Workout Store

```typescript
// apps/mobile/src/store/workout.store.ts
import { LiveActivityService } from '../services/liveActivity/LiveActivityService';

// In workout store
let currentActivityId: string | null = null;

const startWorkout = async (workoutId: string) => {
  // ... existing workout start logic
  
  // Start Live Activity
  const workout = get().currentWorkout;
  if (workout) {
    currentActivityId = await LiveActivityService.startWorkoutActivity(
      workout.name,
      workout.exercises[0]?.name || 'Workout',
      workout.exercises[0]?.sets || 3
    );
  }
};

const logSet = async (exerciseId: string, setData: SetData) => {
  // ... existing set logging logic
  
  // Update Live Activity
  if (currentActivityId) {
    await LiveActivityService.updateActivity(currentActivityId, {
      currentSet: setData.setNumber,
      repsCompleted: setData.reps,
      targetReps: setData.targetReps,
      workoutStatus: 'active',
    });
  }
};

const startRestTimer = async (durationSeconds: number) => {
  // ... existing rest timer logic
  
  // Update Live Activity to show rest timer
  if (currentActivityId) {
    await LiveActivityService.updateActivity(currentActivityId, {
      restTimeRemaining: durationSeconds,
      workoutStatus: 'resting',
    });
  }
};

const endWorkout = async () => {
  // ... existing workout end logic
  
  // End Live Activity
  if (currentActivityId) {
    await LiveActivityService.endActivity(currentActivityId);
    currentActivityId = null;
  }
};
```

## Implementation Checklist

- [ ] Create WorkoutActivityAttributes.swift
- [ ] Create WorkoutLiveActivity widget
- [ ] Add Live Activity capability to Xcode project
- [ ] Create native module bridge (LiveActivityModule)
- [ ] Implement LiveActivityService.ts
- [ ] Integrate with workout store
- [ ] Test on physical device (Live Activities don't work in simulator)
- [ ] Handle edge cases (app termination, background updates)
- [ ] Add error handling and fallbacks

## Testing

Live Activities require a physical device running iOS 16.1+. They do NOT work in the simulator.

Test scenarios:
1. Start workout → Live Activity appears
2. Log sets → Activity updates in real-time
3. Start rest timer → Activity shows countdown
4. Complete workout → Activity dismisses
5. Force quit app → Activity persists and updates via push notifications

