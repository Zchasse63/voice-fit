# Running Live Activity - Design Document

## Overview

This document describes the Live Activity implementation for running workouts in VoiceFit. Unlike strength training Live Activities, running workouts require real-time GPS tracking, pace calculations, and lap/interval management.

---

## Key Differences: Running vs Strength Training

| Feature | Strength Training | Running |
|---------|------------------|---------|
| **Primary Metrics** | Sets, reps, weight, RPE | Pace, distance, time |
| **Update Frequency** | Manual (user logs sets) | Continuous (GPS updates) |
| **Timer Type** | Rest timer (countdown) | Elapsed time + lap timer |
| **Workout Structure** | Exercises → Sets | Laps/Intervals → Distance/Time |
| **User Input** | Voice/manual logging | Automatic GPS tracking |
| **Interactive Buttons** | Complete Set, Skip Rest | Pause/Resume, End Lap |

---

## Running Live Activity Features

### 1. **Real-Time Metrics Display**

#### Lock Screen View
```
┌─────────────────────────────────────┐
│ 🏃 5 Mile Interval Run      23:45   │ ← Header
├─────────────────────────────────────┤
│ ⚡️ Current Lap                      │
│ Quarter Mile @ 6:30 pace            │
│ Target: 6:30 /mi                    │
│ ████████░░░░░░░░░░░░░░░░░░░░ 35%    │ ← Progress bar
│ 0.09 / 0.25 mi                      │
├─────────────────────────────────────┤
│ 📊 Pace      Distance    Avg Pace   │
│    6:28 /mi  2.34 mi     7:15 /mi   │
├─────────────────────────────────────┤
│ ➡️ Next: Rest - 1 min walk          │
└─────────────────────────────────────┘
```

### 2. **Lap/Interval Types**

- **⚡️ Interval**: High-intensity running at target pace (orange)
- **🚶 Rest**: Walking/jogging recovery (blue)
- **🏃 Easy**: Steady-state easy pace (green)
- **🔥 Warmup**: Pre-workout warmup (yellow)
- **❄️ Cooldown**: Post-workout cooldown (cyan)

### 3. **Workout Types**

#### Easy Run
- **Example**: "8 Mile Easy Run"
- **Display**: Single lap, no intervals
- **Metrics**: Current pace, distance, elapsed time
- **No target pace** - just track progress

#### Interval Run
- **Example**: "5 Mile Interval Run"
- **Structure**: Multiple laps with different paces
  - Warmup: 1 mile easy
  - 4x (Quarter mile @ 6:30, 1 min rest)
  - Cooldown: 1 mile easy
- **Display**: Current lap highlighted, next lap preview
- **Metrics**: Current pace vs target pace, lap progress

#### Tempo Run
- **Example**: "6 Mile Tempo Run"
- **Structure**: Warmup → Sustained tempo pace → Cooldown
- **Display**: Target pace for tempo section
- **Metrics**: Pace deviation from target

#### Long Run
- **Example**: "12 Mile Long Run"
- **Display**: Similar to easy run, but with distance milestones
- **Metrics**: Total distance, average pace, elapsed time

---

## Data Model

### RunningActivityAttributes

```swift
struct RunningActivityAttributes: ActivityAttributes {
    // Static (doesn't change)
    var workoutName: String        // "5 Mile Interval Run"
    var workoutId: String
    var workoutType: String        // "interval" | "easy" | "tempo" | "long"
    
    struct ContentState: Codable, Hashable {
        // Real-time metrics
        var currentPace: String           // "6:30 /mi"
        var averagePace: String           // "7:15 /mi"
        var distanceCovered: Double       // 2.34 miles
        var elapsedTime: Int              // seconds
        
        // Current lap
        var currentLapType: String        // "interval" | "rest" | "easy"
        var currentLapDescription: String // "Quarter Mile @ 6:30 pace"
        var currentLapTargetPace: String? // "6:30 /mi"
        var currentLapTargetDistance: Double? // 0.25 miles
        var currentLapProgress: Double    // 0.0 to 1.0
        var currentLapDistanceCovered: Double // 0.09 miles
        
        // Next lap
        var nextLapType: String?          // "rest"
        var nextLapDescription: String?   // "Rest - 1 min walk"
        
        // Workout overview
        var totalPlannedDistance: Double? // 5.0 miles
        var totalPlannedTime: Int?        // nil for distance-based
        
        // Status
        var status: String                // "active" | "paused" | "completed"
        
        // User preferences
        var showElapsedTimer: Bool
        var showPaceMetrics: Bool
    }
}
```

---

## GPS Integration & Pace Calculation

### Location Service Requirements

1. **High-accuracy GPS tracking**
   - Request `kCLLocationAccuracyBest` for running workouts
   - Update frequency: Every 1-2 seconds during active running
   - Pause updates during rest intervals to save battery

2. **Pace Calculation**
   ```typescript
   // Current pace (last 10 seconds of movement)
   currentPace = distance_last_10s / time_last_10s
   
   // Average pace (entire workout)
   averagePace = totalDistance / totalElapsedTime
   
   // Format: "6:30 /mi" (minutes:seconds per mile)
   ```

3. **Lap Detection**
   - **Distance-based laps**: Auto-advance when `currentLapDistanceCovered >= targetDistance`
   - **Time-based laps**: Auto-advance when lap timer reaches target time
   - **Manual laps**: User can manually advance via button/voice

### Update Strategy

```typescript
// GPS updates every 1-2 seconds
onLocationUpdate(location) {
  // Calculate current pace
  const currentPace = calculatePace(recentLocations);
  
  // Update distance
  const distanceCovered = calculateTotalDistance(allLocations);
  
  // Check lap progress
  const lapProgress = currentLapDistanceCovered / targetLapDistance;
  
  // Auto-advance lap if complete
  if (lapProgress >= 1.0) {
    advanceToNextLap();
  }
  
  // Update Live Activity (throttled to every 5 seconds)
  if (shouldUpdateLiveActivity()) {
    liveActivityService.updateRunningActivity({
      currentPace,
      distanceCovered,
      currentLapProgress: lapProgress,
      // ... other fields
    });
  }
}
```

---

## Workout Data Schema

### Database Tables

#### `running_workouts` table
```sql
CREATE TABLE running_workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  workout_name TEXT NOT NULL,
  workout_type TEXT NOT NULL, -- 'interval' | 'easy' | 'tempo' | 'long'
  total_distance DECIMAL,     -- total planned distance in miles
  total_time INTEGER,          -- total planned time in seconds (optional)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `running_workout_laps` table
```sql
CREATE TABLE running_workout_laps (
  id UUID PRIMARY KEY,
  workout_id UUID REFERENCES running_workouts(id),
  lap_number INTEGER NOT NULL,
  lap_type TEXT NOT NULL,     -- 'interval' | 'rest' | 'easy' | 'warmup' | 'cooldown'
  description TEXT NOT NULL,   -- "Quarter Mile @ 6:30 pace"
  target_pace TEXT,            -- "6:30" (min:sec per mile, null for rest/easy)
  target_distance DECIMAL,     -- 0.25 miles (null for time-based)
  target_time INTEGER,         -- 60 seconds (null for distance-based)
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP
);
```

---

## Integration Points

### 1. Location Service
- **File**: `apps/mobile/src/services/location/LocationService.ts`
- **Responsibilities**:
  - Request location permissions
  - Start/stop GPS tracking
  - Calculate pace and distance
  - Detect lap completion
  - Update Live Activity with GPS data

### 2. Running Live Activity Service
- **File**: `apps/mobile/src/services/liveActivity/RunningLiveActivityService.ts`
- **Responsibilities**:
  - Start/update/end running Live Activity
  - Format pace strings ("6:30 /mi")
  - Calculate lap progress
  - Handle lap transitions
  - Throttle Live Activity updates (max every 5 seconds)

### 3. Workout Store
- **File**: `apps/mobile/src/store/workout.store.ts`
- **Integration**:
  - Start running workout → Start GPS + Live Activity
  - GPS updates → Update Live Activity
  - Lap completion → Advance to next lap
  - End workout → Stop GPS + End Live Activity

---

## Next Steps

1. ✅ Create `RunningActivityAttributes.swift`
2. ✅ Create `RunningLiveActivity.swift` with UI
3. ⏳ Update `LiveActivityModule.swift` to support running workouts
4. ⏳ Create `RunningLiveActivityService.ts`
5. ⏳ Integrate with Location Service for GPS tracking
6. ⏳ Create database schema for running workouts and laps
7. ⏳ Wire running workout start/stop to Live Activity
8. ⏳ Test on physical device with real GPS data

---

## Testing Checklist

- [ ] Live Activity starts when running workout begins
- [ ] GPS updates reflect in Live Activity (pace, distance)
- [ ] Current lap progress bar updates correctly
- [ ] Lap auto-advances when distance/time target reached
- [ ] Next lap preview shows correct information
- [ ] Easy run shows single lap (no intervals)
- [ ] Interval run shows multiple laps with different paces
- [ ] Pause/resume updates Live Activity status
- [ ] Live Activity ends when workout completes
- [ ] Dynamic Island shows compact running metrics

