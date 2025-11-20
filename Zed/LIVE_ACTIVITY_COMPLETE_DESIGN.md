# Live Activity Complete Implementation Design

## Overview
Complete the Live Activity implementation for real-time workout tracking on iOS lock screen and Dynamic Island.

## Current Status
✅ **Already Implemented:**
- LiveActivityService.ts (TypeScript service)
- LiveActivityModule.ts (Native module interface)
- Entitlements configured (`com.apple.developer.live-activities`)
- Info.plist configured (`NSSupportsLiveActivities`)
- Mock implementation for development

❌ **Missing (P7 Tasks):**
- WorkoutActivityAttributes.swift (Activity Kit attributes)
- WorkoutLiveActivity.swift (Widget UI)
- LiveActivityModule.swift (Native bridge)
- Integration with workout store
- Device testing

## Architecture

### 1. Activity Attributes (Swift)
**File**: `apps/mobile/ios/VoiceFit/WorkoutActivityAttributes.swift`

```swift
import ActivityKit
import Foundation

struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Current exercise info
        var currentExercise: String?
        var currentSet: Int
        var totalSets: Int
        
        // Last set data
        var lastSetWeight: Double?
        var lastSetReps: Int?
        var lastSetRPE: Int?
        
        // Timing
        var elapsedTime: Int // seconds
        var status: String // "active" | "paused" | "completed"
    }
    
    // Static attributes (don't change during activity)
    var workoutName: String
    var workoutId: String
}
```

### 2. Live Activity Widget (Swift)
**File**: `apps/mobile/ios/VoiceFit/WorkoutLiveActivity.swift`

```swift
import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen UI
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.currentExercise ?? "Workout")
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.currentSet)/\(context.state.totalSets)")
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text("⏱ \(formatTime(context.state.elapsedTime))")
                        Spacer()
                        if let weight = context.state.lastSetWeight,
                           let reps = context.state.lastSetReps {
                            Text("\(Int(weight))lbs × \(reps)")
                        }
                    }
                }
            } compactLeading: {
                // Compact leading (left side of notch)
                Image(systemName: "figure.strengthtraining.traditional")
            } compactTrailing: {
                // Compact trailing (right side of notch)
                Text("\(context.state.currentSet)/\(context.state.totalSets)")
            } minimal: {
                // Minimal view (when multiple activities)
                Image(systemName: "figure.strengthtraining.traditional")
            }
        }
    }
}

struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundColor(.green)
                Text(context.attributes.workoutName)
                    .font(.headline)
                Spacer()
                Text(formatTime(context.state.elapsedTime))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Current exercise
            if let exercise = context.state.currentExercise {
                Text(exercise)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            // Progress
            HStack {
                Text("Set \(context.state.currentSet) of \(context.state.totalSets)")
                    .font(.subheadline)
                Spacer()
                if let weight = context.state.lastSetWeight,
                   let reps = context.state.lastSetReps {
                    Text("\(Int(weight))lbs × \(reps)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
    }
}

func formatTime(_ seconds: Int) -> String {
    let minutes = seconds / 60
    let secs = seconds % 60
    return String(format: "%d:%02d", minutes, secs)
}
```

### 3. Native Module Bridge (Swift)
**File**: `apps/mobile/ios/VoiceFit/LiveActivityModule.swift`

```swift
import ActivityKit
import Foundation

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    private var currentActivity: Activity<WorkoutActivityAttributes>?
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func startActivity(
        _ attributes: NSDictionary,
        initialState: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Parse attributes
        guard let workoutName = attributes["workoutName"] as? String,
              let workoutId = attributes["workoutId"] as? String else {
            rejecter("INVALID_PARAMS", "Missing required attributes", nil)
            return
        }
        
        // Parse initial state
        let state = parseState(initialState)
        
        // Create activity
        let activityAttributes = WorkoutActivityAttributes(
            workoutName: workoutName,
            workoutId: workoutId
        )
        
        do {
            let activity = try Activity.request(
                attributes: activityAttributes,
                contentState: state,
                pushType: nil
            )
            
            currentActivity = activity
            resolver(activity.id)
        } catch {
            rejecter("START_FAILED", error.localizedDescription, error)
        }
    }
    
    // Additional methods: updateActivity, endActivity, etc.
}
```

## Integration Points

### Workout Store Integration
Update `apps/mobile/src/store/workout.store.ts`:

```typescript
import { liveActivityService } from '../services/liveActivity/LiveActivityService';

// Start Live Activity when workout begins
startWorkout: (workoutId: string, workoutName: string) => {
  // ... existing logic ...
  
  // Start Live Activity
  liveActivityService.startActivity(workoutName, workoutId);
},

// Update Live Activity when set is logged
logSet: (exerciseName: string, weight: number, reps: number) => {
  // ... existing logic ...
  
  // Update Live Activity
  liveActivityService.updateExercise(exerciseName, currentSet, totalSets);
  liveActivityService.updateLastSet(weight, reps);
},

// End Live Activity when workout completes
completeWorkout: () => {
  // ... existing logic ...
  
  // End Live Activity
  liveActivityService.endActivity();
}
```

## Testing Checklist

- [ ] Build on physical iOS device (iOS 16.1+)
- [ ] Start workout and verify Live Activity appears
- [ ] Log sets and verify updates appear in real-time
- [ ] Test Dynamic Island compact/expanded states
- [ ] Test lock screen widget
- [ ] Complete workout and verify activity ends
- [ ] Test app termination during active workout
- [ ] Verify elapsed time updates every 5 seconds

## Success Metrics

1. **Activation Rate**: % of workouts with Live Activity enabled
2. **Update Latency**: Time from set log to Live Activity update
3. **Crash Rate**: Live Activity-related crashes
4. **User Engagement**: Lock screen interactions vs. app opens

