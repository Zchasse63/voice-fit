# VoiceFit Comprehensive Feature Planning
**Technical Specification & Implementation Roadmap**

**Date:** 2025-01-24  
**Status:** Planning Phase  
**Timeline:** 24-36 months  
**Owner:** Engineering Team

---

## Table of Contents

1. [Wearable Integration & Biometric Data](#1-wearable-integration--biometric-data)
2. [Heart Rate Zone Tracking & Cardio Analytics](#2-heart-rate-zone-tracking--cardio-analytics)
3. [Multi-Sport & Hybrid Athlete Programming](#3-multi-sport--hybrid-athlete-programming)
4. [Program Scheduling & Calendar View](#4-program-scheduling--calendar-view)
5. [Lock Screen Widget & Live Activity](#5-lock-screen-widget--live-activity)
6. [Smart Exercise Creation & Synonym Checking](#6-smart-exercise-creation--synonym-checking)
7. [Equipment Brand & Attachment Tracking](#7-equipment-brand--attachment-tracking)
8. [Warm-up & Cooldown Programming](#8-warm-up--cooldown-programming)
9. [Gym Location Detection & Equipment Defaults](#9-gym-location-detection--equipment-defaults)
10. [CrossFit & Hyrox Programming](#10-crossfit--hyrox-programming)
11. [Triathlon Programming](#11-triathlon-programming)
12. [Additional Feature Ideas](#12-additional-feature-ideas)
13. [System Architecture Overview](#13-system-architecture-overview)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Wearable Integration & Biometric Data

### Overview
Enable automatic data ingestion from wearables (Whoop, Fitbit, Garmin, Apple Watch, Withings) to replace manual readiness entries and enable advanced analytics.

### Database Schema

```sql
-- Wearable connections
CREATE TABLE wearable_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider TEXT NOT NULL CHECK (provider IN ('whoop', 'fitbit', 'garmin', 'apple_health', 'withings')),
    access_token TEXT, -- encrypted
    refresh_token TEXT, -- encrypted
    token_expires_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    sync_preferences JSONB DEFAULT '{"auto_sync": true, "sync_frequency_minutes": 30}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Biometric data (time-series)
CREATE TABLE biometric_data (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL,
    source_provider TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('hrv', 'resting_hr', 'sleep_score', 'recovery_score', 'spo2', 'respiratory_rate')),
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    metadata JSONB, -- provider-specific fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast time-range queries
CREATE INDEX idx_biometric_data_user_time ON biometric_data(user_id, timestamp DESC);
CREATE INDEX idx_biometric_data_type ON biometric_data(user_id, data_type, timestamp DESC);

-- Partition by month for scalability
-- ALTER TABLE biometric_data PARTITION BY RANGE (timestamp);

-- Heart rate zones (user-specific)
CREATE TABLE heart_rate_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 5),
    min_bpm INTEGER NOT NULL,
    max_bpm INTEGER NOT NULL,
    zone_name TEXT, -- e.g., "Recovery", "Aerobic", "Threshold", "VO2 Max", "Anaerobic"
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_method TEXT CHECK (calculation_method IN ('max_hr', 'threshold', 'custom')),
    UNIQUE(user_id, zone_number)
);

-- Workout heart rate data
CREATE TABLE workout_hr_data (
    id BIGSERIAL PRIMARY KEY,
    workout_id UUID NOT NULL REFERENCES workouts(id),
    timestamp TIMESTAMPTZ NOT NULL,
    heart_rate INTEGER NOT NULL,
    zone INTEGER, -- calculated zone
    source_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_hr_data_workout ON workout_hr_data(workout_id, timestamp);
```

### Implementation Architecture

#### Data Pipeline
```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Device (Native)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HealthKit (iOS) / Google Fit (Android)              │  │
│  │  - Real-time HR during workout                       │  │
│  │  - Sleep data (synced overnight)                     │  │
│  │  - HRV (morning reading)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Local Database (WatermelonDB)                       │  │
│  │  - 7-day cache                                       │  │
│  │  - Offline support                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Wearable Sync Endpoint                              │  │
│  │  POST /api/wearable/sync                             │  │
│  │  - Batch upload from mobile                          │  │
│  │  - Dedupe by timestamp + source                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Workers (Separate Service)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Third-Party API Sync Jobs (BullMQ)                  │  │
│  │  - Whoop: Webhook + polling fallback (15 min)       │  │
│  │  - Fitbit: Webhook + polling fallback (30 min)      │  │
│  │  - Garmin: Polling only (30 min)                    │  │
│  │  - Withings: Webhook + polling (60 min)             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Recovery Score Calculation (Daily)                  │  │
│  │  - Aggregate HRV, sleep, resting HR                 │  │
│  │  - Compare to user baseline                         │  │
│  │  - Generate readiness score                         │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Sync Strategy

**Priority Levels:**
- **HIGH**: Recovery scores, readiness (sync every 30 min)
- **MEDIUM**: Resting HR, HRV trends (sync every 2 hours)
- **LOW**: Historical data backfill (background process)
- **REAL-TIME**: Heart rate during active workout (10-second polling or stream)

**Native First Approach:**
1. **iOS**: Use HealthKit directly (no API delays)
2. **Android**: Use Health Connect / Google Fit
3. **Third-party**: Only for features not in native APIs (Whoop strain, Garmin training status)

**Auto-population Logic:**
```javascript
// When calculating readiness score
async function getReadinessScore(userId) {
  const userPrefs = await getUserPreferences(userId);
  
  if (userPrefs.prefer_wearable_data_over_manual && hasActiveWearable(userId)) {
    // Use wearable data
    const wearableData = await getLatestBiometricData(userId);
    return calculateReadinessFromWearable(wearableData);
  } else {
    // Fall back to manual entry
    return getManualReadinessEntry(userId);
  }
}
```

### Implementation Priority
1. **Phase 1**: Apple Health/HealthKit (iOS) - 3-4 weeks
2. **Phase 2**: Google Fit/Health Connect (Android) - 3-4 weeks
3. **Phase 3**: Whoop API - 2-3 weeks
4. **Phase 4**: Garmin API - 2-3 weeks
5. **Phase 5**: Fitbit, Withings - 2-3 weeks each

---

## 2. Heart Rate Zone Tracking & Cardio Analytics

### Overview
Track heart rate during workouts, analyze time in zones, and measure cardiovascular efficiency over time.

### Database Schema

```sql
-- Cardio workouts (extends base workouts table)
CREATE TABLE cardio_workouts (
    cardio_workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id),
    workout_type TEXT NOT NULL CHECK (workout_type IN (
        'long_run', 'tempo', 'intervals', 'zone2', 'easy', 'recovery', 
        'fartlek', 'hill_repeats', 'threshold', 'vo2max'
    )),
    distance_meters NUMERIC, -- null for time-based workouts
    duration_seconds INTEGER NOT NULL,
    avg_pace_seconds_per_km NUMERIC,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    elevation_gain_meters NUMERIC,
    perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
    weather_conditions TEXT,
    surface_type TEXT, -- road, trail, track, treadmill
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split data for detailed analysis
CREATE TABLE cardio_splits (
    split_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cardio_workout_id UUID NOT NULL REFERENCES cardio_workouts(cardio_workout_id),
    split_number INTEGER NOT NULL,
    distance_meters NUMERIC, -- e.g., 1000m or 1 mile
    duration_seconds INTEGER NOT NULL,
    pace_seconds_per_km NUMERIC,
    avg_heart_rate INTEGER,
    zone_distribution JSONB, -- {"zone1": 10, "zone2": 60, "zone3": 30} (percentages)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR efficiency tracking (denormalized for fast queries)
CREATE TABLE hr_efficiency_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    pace_seconds_per_km NUMERIC NOT NULL,
    avg_heart_rate INTEGER NOT NULL,
    efficiency_score NUMERIC, -- calculated: lower HR at same pace = better
    workout_type TEXT,
    distance_meters NUMERIC,
    workout_id UUID REFERENCES workouts(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_efficiency_user_date ON hr_efficiency_tracking(user_id, date DESC);
CREATE INDEX idx_hr_efficiency_pace ON hr_efficiency_tracking(user_id, pace_seconds_per_km);
```

### Key Analytics

```typescript
interface CardioAnalytics {
  // Efficiency over time
  paceHrEfficiency: {
    pace: string; // "8:00/mile"
    avgHrThen: number; // 165 bpm (8 weeks ago)
    avgHrNow: number; // 158 bpm (current)
    improvement: string; // "-7 bpm (4.2% improvement)"
  };
  
  // Zone distribution analysis
  zoneDistribution: {
    zone1: number; // % time in zone 1
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
    recommendation?: string; // "Too much time in Zone 3 during easy runs"
  };
  
  // HR recovery
  hrRecovery: {
    oneMinuteRecovery: number; // bpm drop 1 min post-exercise
    twoMinuteRecovery: number;
    trend: string; // "improving" | "stable" | "declining"
  };
  
  // Cardiac drift
  cardiacDrift: {
    startHr: number;
    endHr: number;
    driftBpm: number;
    driftPercentage: number;
    warning?: string; // "10 bpm drift suggests dehydration or fatigue"
  };
}
```

### Program Adjustment Logic

```typescript
async function analyzeCardioProgress(userId: string): Promise<ProgramAdjustment> {
  const recentWorkouts = await getRecentCardioWorkouts(userId, 6); // 6 weeks
  
  // Check for HR plateau at given pace
  const paceEfficiency = calculatePaceEfficiency(recentWorkouts);
  
  if (paceEfficiency.improvement < 2) { // Less than 2% improvement in 6 weeks
    return {
      adjustment: "increase_intensity",
      reason: "HR at given pace hasn't improved. Time to add speed work.",
      recommendation: "Add 1 interval session per week (e.g., 6x800m at 5K pace)"
    };
  }
  
  // Check for overtraining
  const hrTrend = calculateRestingHrTrend(userId, 14);
  if (hrTrend > 5) { // Resting HR elevated 5+ bpm
    return {
      adjustment: "reduce_volume",
      reason: "Elevated resting HR suggests overtraining",
      recommendation: "Reduce weekly mileage by 20% and prioritize recovery"
    };
  }
  
  return { adjustment: "maintain", reason: "Progress on track" };
}
```

---

## 3. Multi-Sport & Hybrid Athlete Programming

### Overview
Support users training for multiple sports simultaneously (e.g., marathon + strength, CrossFit, Hyrox, triathlon) with intelligent scheduling to avoid interference effects.

### Database Schema

```sql
-- Athlete profiles
CREATE TABLE athlete_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    athlete_type TEXT NOT NULL CHECK (athlete_type IN (
        'pure_strength', 'pure_endurance', 'hybrid', 'crossfit', 'hyrox', 'triathlete', 'sport_specific'
    )),
    primary_goal TEXT,
    secondary_goal TEXT,
    priority_ranking JSONB, -- {"strength": 40, "running": 60}
    weekly_time_budget_hours NUMERIC,
    sessions_per_week_by_type JSONB, -- {"strength": 3, "running": 4, "swimming": 2}
    current_training_phase TEXT CHECK (current_training_phase IN (
        'base', 'build', 'peak', 'taper', 'race', 'recovery', 'off_season'
    )),
    goal_event_date DATE,
    goal_event_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training constraints
CREATE TABLE training_constraints (
    constraint_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    constraint_type TEXT NOT NULL CHECK (constraint_type IN (
        'no_heavy_legs_after_long_runs',
        'max_daily_sessions',
        'rest_days',
        'time_of_day_preference',
        'equipment_availability'
    )),
    constraint_config JSONB NOT NULL, -- e.g., {"days": ["sunday"], "max_sessions": 1}
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    is_hard_constraint BOOLEAN DEFAULT false, -- true = cannot be violated
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-sport programs
CREATE TABLE multi_sport_programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    program_type TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    periodization_model TEXT CHECK (periodization_model IN (
        'linear', 'undulating', 'block', 'conjugate'
    )),
    strength_frequency INTEGER,
    cardio_frequency_by_type JSONB, -- {"running": 4, "swimming": 2, "cycling": 3}
    conflicts_resolved INTEGER DEFAULT 0, -- count of scheduling conflicts handled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Interference Mitigation Rules

```typescript
const INTERFERENCE_RULES = {
  // Hard rules (cannot be violated)
  hard: [
    {
      rule: "no_heavy_squats_before_intervals",
      description: "No heavy squats/deadlifts within 24h before interval running",
      minHoursBetween: 24,
      workoutTypes: ["heavy_lower", "interval_run"]
    },
    {
      rule: "no_heavy_legs_before_long_run",
      description: "No intense lower body volume before long run",
      minHoursBetween: 48,
      workoutTypes: ["heavy_lower", "long_run"]
    }
  ],
  
  // Soft rules (prefer but can violate if necessary)
  soft: [
    {
      rule: "run_before_strength_same_day",
      description: "If double session, run AM and strength PM (not reverse)",
      preferredOrder: ["cardio", "strength"]
    },
    {
      rule: "min_hours_between_high_intensity",
      description: "Minimum 6-8 hours between high-intensity sessions",
      minHoursBetween: 6,
      workoutIntensity: "high"
    },
    {
      rule: "upper_body_flexible",
      description: "Upper body can be done any time relative to running",
      flexible: true
    }
  ]
};
```

### Scheduling Algorithm

```typescript
interface SchedulingContext {
  availableDays: string[]; // ["monday", "tuesday", ...]
  availableTimeSlots: TimeSlot[]; // [{day, startTime, endTime}]
  constraints: TrainingConstraint[];
  priorityGoal: "strength" | "endurance" | "balanced";
  weeksToEvent: number;
}

async function generateHybridSchedule(context: SchedulingContext): Promise<WeeklySchedule> {
  const { priorityGoal, weeksToEvent } = context;
  
  // Calculate volume distribution based on priority and phase
  let strengthVolume = 0.5;
  let enduranceVolume = 0.5;
  
  if (priorityGoal === "endurance" && weeksToEvent <= 8) {
    enduranceVolume = 0.75;
    strengthVolume = 0.25; // Maintenance only
  } else if (priorityGoal === "strength") {
    strengthVolume = 0.65;
    enduranceVolume = 0.35;
  }
  
  // Apply taper if close to race
  if (weeksToEvent <= 4) {
    enduranceVolume *= 0.7; // 30% volume reduction
  } else if (weeksToEvent <= 2) {
    enduranceVolume *= 0.5; // 50% volume reduction
  }
  
  // Allocate sessions to days
  const schedule = allocateWorkouts(
    context.availableDays,
    strengthVolume,
    enduranceVolume,
    context.constraints
  );
  
  // Validate against interference rules
  const conflicts = detectConflicts(schedule, INTERFERENCE_RULES);
  
  if (conflicts.length > 0) {
    // Try to resolve conflicts
    return resolveConflicts(schedule, conflicts);
  }
  
  return schedule;
}
```

### Example Weekly Schedule (Marathon-Focused Hybrid)

```
Monday:
  AM: Easy run (30 min, Zone 2)
  PM: Upper body strength (45 min)

Tuesday:
  AM: Tempo run (60 min, Zone 3-4)

Wednesday:
  AM: Lower body strength (60 min, moderate intensity)
  
Thursday:
  AM: Easy run (30 min, Zone 2)

Friday:
  PM: Upper body strength (45 min)

Saturday:
  REST or Yoga

Sunday:
  AM: Long run (90-120 min, Zone 2)
```

---

## 4. Program Scheduling & Calendar View

### Overview
Interactive calendar for viewing and rescheduling workouts with drag-and-drop functionality and conflict detection.

### Database Schema

```sql
CREATE TABLE scheduled_workouts (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    workout_id UUID NOT NULL REFERENCES workouts(id),
    original_scheduled_date DATE NOT NULL,
    actual_scheduled_date DATE NOT NULL, -- updated if user moves it
    scheduled_time TEXT, -- "AM", "PM", "08:00", etc.
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'completed', 'skipped', 'rescheduled', 'cancelled'
    )),
    workout_type TEXT NOT NULL, -- strength, running, swimming, cycling, yoga, rest
    is_user_modified BOOLEAN DEFAULT false,
    conflict_warnings JSONB, -- [{"type": "heavy_legs_before_long_run", "severity": "high"}]
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_workouts_user_date ON scheduled_workouts(user_id, actual_scheduled_date);
CREATE INDEX idx_scheduled_workouts_status ON scheduled_workouts(user_id, status);
```

### Frontend Implementation (React Native)

```typescript
import { Calendar } from 'react-native-calendars';
import DraggableFlatList from 'react-native-draggable-flatlist';

interface WorkoutDay {
  date: string;
  workouts: ScheduledWorkout[];
  conflicts: Conflict[];
}

function WorkoutCalendar() {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [schedule, setSchedule] = useState<Map<string, WorkoutDay>>();
  
  const handleWorkoutDrag = async (
    workoutId: string,
    fromDate: string,
    toDate: string
  ) => {
    // Check for conflicts
    const conflicts = await checkConflicts(workoutId, toDate);
    
    if (conflicts.length > 0) {
      // Show warning modal
      Alert.alert(
        "Scheduling Conflict",
        `Warning: ${conflicts[0].description}\n\nContinue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => rescheduleWorkout(workoutId, toDate)
          },
          {
            text: "Auto-fix",
            onPress: () => autoResolveConflicts(workoutId, toDate, conflicts)
          }
        ]
      );
    } else {
      await rescheduleWorkout(workoutId, toDate);
    }
  };
  
  const rescheduleWorkout = async (workoutId: string, newDate: string) => {
    await api.put(`/workouts/${workoutId}/reschedule`, {
      new_date: newDate,
      is_user_modified: true
    });
    
    // Refresh calendar
    await fetchSchedule();
  };
  
  return (
    <View>
      <Calendar
        markedDates={getMarkedDates(schedule)}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markingType="multi-dot"
      />
      
      {selectedDate && (
        <DayWorkoutList
          date={selectedDate}
          workouts={schedule.get(selectedDate)?.workouts}
          onDrag={handleWorkoutDrag}
        />
      )}
    </View>
  );
}
```

### AI Suggestions for Rescheduling

```typescript
async function suggestReschedule(
  workoutId: string,
  reason: "travel" | "injury" | "time_conflict"
): Promise<RescheduleSuggestion[]> {
  const workout = await getWorkout(workoutId);
  const userSchedule = await getUserSchedule(workout.user_id);
  
  const suggestions = [];
  
  if (reason === "travel") {
    // Suggest bodyweight/minimal equipment version
    suggestions.push({
      type: "modify",
      description: "Convert to hotel gym version (minimal equipment)",
      newWorkout: adaptWorkoutForTravel(workout)
    });
    
    // Suggest consolidating week
    suggestions.push({
      type: "consolidate",
      description: "Combine 4 workouts into 2 full-body sessions",
      adjustedSchedule: consolidateWeek(userSchedule)
    });
  }
  
  if (workout.type === "long_run") {
    // Long runs are high priority - suggest swapping rest day
    suggestions.push({
      type: "swap",
      description: "Move long run to Saturday, make Sunday a rest day",
      newDate: findBestAlternateDay(workout, userSchedule)
    });
  }
  
  return suggestions;
}
```

---

## 5. Lock Screen Widget & Live Activity

### Overview
iOS Live Activities and lock screen widgets for hands-free workout tracking with voice commands.

### iOS Implementation (Swift)

```swift
// ActivityAttributes.swift
import ActivityKit

struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var exerciseName: String
        var currentSet: Int
        var totalSets: Int
        var currentReps: Int?
        var targetReps: Int?
        var workoutElapsedTime: TimeInterval
        var setElapsedTime: TimeInterval
        var isResting: Bool
        var restTimeRemaining: Int?
        var lastAction: String? // "Set complete", "Rest started", etc.
    }
    
    var workoutName: String
    var startTime: Date
}

// WorkoutLiveActivity.swift
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock screen UI
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(context.state.exerciseName)
                        .font(.headline)
                    Spacer()
                    Text("Set \(context.state.currentSet)/\(context.state.totalSets)")
                        .font(.caption)
                }
                
                HStack {
                    // Workout elapsed time
                    VStack(alignment: .leading) {
                        Text("Total")
                            .font(.caption2)
                        Text(formatTime(context.state.workoutElapsedTime))
                            .font(.title3)
                            .monospacedDigit()
                    }
                    
                    Spacer()
                    
                    // Set elapsed time or rest timer
                    VStack(alignment: .trailing) {
                        Text(context.state.isResting ? "Rest" : "Set")
                            .font(.caption2)
                        
                        if context.state.isResting, let restTime = context.state.restTimeRemaining {
                            Text("\(restTime)s")
                                .font(.title3)
                                .monospacedDigit()
                                .foregroundColor(.orange)
                        } else {
                            Text(formatTime(context.state.setElapsedTime))
                                .font(.title3)
                                .monospacedDigit()
                        }
                    }
                }
                
                // Voice command button
                Button(intent: VoiceCommandIntent()) {
                    HStack {
                        Image(systemName: "mic.fill")
                        Text("Voice Command")
                    }
                    .font(.caption)
                }
                .tint(.blue)
            }
            .padding()
            
        } dynamicIsland: { context in
            // Dynamic Island (iPhone 14 Pro+)
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text(context.state.exerciseName)
                            .font(.headline)
                        Text("Set \(context.state.currentSet)/\(context.state.totalSets)")
                            .font(.caption)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text(formatTime(context.state.workoutElapsedTime))
                            .font(.title3)
                            .monospacedDigit()
                        
                        Button(intent: VoiceCommandIntent()) {
                            Image(systemName: "mic.fill")
                        }
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    // Rest timer or reps
                    if context.state.isResting, let restTime = context.state.restTimeRemaining {
                        Text("Rest: \(restTime)s")
                            .font(.title2)
                            .foregroundColor(.orange)
                    }
                }
                
            } compactLeading: {
                // Compact view (leading)
                Text("\(context.state.currentSet)")
                    .font(.caption2)
            } compactTrailing: {
                // Compact view (trailing)
                Text(formatTime(context.state.workoutElapsedTime))
                    .font(.caption2)
                    .monospacedDigit()
            } minimal: {
                // Minimal view
                Image(systemName: "figure.strengthtraining.traditional")
            }
        }
    }
}
```

### React Native Integration

```typescript
// WorkoutLiveActivityManager.ts
import { NativeModules } from 'react-native';

const { WorkoutLiveActivity } = NativeModules;

class WorkoutLiveActivityManager {
  private activityId: string | null = null;
  private updateTimer: NodeJS.Timer | null = null;
  
  async startActivity(workout: Workout) {
    if (!WorkoutLiveActivity) {
      console.warn('Live Activities not supported on this device');
      return;
    }
    
    this.activityId = await WorkoutLiveActivity.startActivity({
      workoutName: workout.name,
      exerciseName: workout.exercises[0].name,
      totalSets: workout.exercises[0].sets,
      currentSet: 1,
      workoutElapsedTime: 0,
      setElapsedTime: 0,
      isResting: false
    });
    
    // Start update timer (every second)
    this.updateTimer = setInterval(() => {
      this.updateActivity();
    }, 1000);
  }
  
  async updateActivity() {
    if (!this.activityId) return;
    
    const currentState = WorkoutStateManager.getCurrentState();
    
    await WorkoutLiveActivity.updateActivity(this.activityId, {
      exerciseName: currentState.exerciseName,
      currentSet: currentState.currentSet,
      totalSets: currentState.totalSets,
      workoutElapsedTime: currentState.workoutElapsedTime,
      setElapsedTime: currentState.setElapsedTime,
      isResting: currentState.isResting,
      restTimeRemaining: currentState.restTimeRemaining
    });
  }
  
  async endActivity() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.activityId) {
      await WorkoutLiveActivity.endActivity(this.activityId);
      this.activityId = null;
    }
  }
}

export default new WorkoutLiveActivityManager();
```

### Android Implementation (Kotlin)

```kotlin
// WorkoutNotificationService.kt
class WorkoutNotificationService : Service() {
    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "workout_tracking"
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    fun updateWorkoutNotification(state: WorkoutState) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_workout)
            .setContentTitle(state.exerciseName)
            .setContentText("Set ${state.currentSet}/${state.totalSets}")
            .setSubText(formatTime(state.workoutElapsedTime))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .addAction(
                R.drawable.ic_mic,
                "Voice Command",
                createVoicePendingIntent()
            )
            .addAction(
                R.drawable.ic_pause,
                if (state.isResting) "Resume" else "Rest",
                createRestPendingIntent()
            )
            .build()
        
        startForeground(NOTIFICATION_ID, notification)
    }
}
```

---

## 6. Smart Exercise Creation & Synonym Checking

### Overview
Automatically detect duplicate exercises and properly categorize new exercises with full metadata.

### Algorithm Flow

```typescript
async function handleNewExercise(exerciseName: string, userId: string): Promise<ExerciseResult> {
  // 1. Normalize input
  const normalized = normalizeExerciseName(exerciseName);
  
  // 2. Check exact match
  const exactMatch = await db.exercise.findUnique({
    where: { name_normalized: normalized }
  });
  
  if (exactMatch) {
    return { type: 'existing', exercise: exactMatch };
  }
  
  // 3. Generate synonym variations
  const synonyms = generateSynonyms(exerciseName);
  // ["single arm dumbbell press", "one arm dumbbell press", "unilateral dumbbell press", "1 arm db press"]
  
  // 4. Fuzzy search existing exercises
  const similarExercises = await fuzzySearchExercises(exerciseName, synonyms);
  
  if (similarExercises.length > 0) {
    // Show user the matches
    return {
      type: 'similar_found',
      matches: similarExercises.map(ex => ({
        exercise: ex,
        similarity: ex.similarity_score,
        reason: ex.match_reason
      }))
    };
  }
  
  // 5. Truly new exercise - use AI to classify
  const classification = await classifyExerciseWithAI(exerciseName);
  
  return {
    type: 'new',
    classification,
    needsReview: classification.confidence < 0.8
  };
}

function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\b(db|bb)\b/g, match => match === 'db' ? 'dumbbell' : 'barbell')
    .replace(/\b1\b/g, 'one')
    .trim();
}

function generateSynonyms(exerciseName: string): string[] {
  const synonymMap = {
    'single arm': ['one arm', 'unilateral', '1 arm'],
    'dumbbell': ['db', 'dumbell'],
    'barbell': ['bb'],
    'press': ['push'],
    'row': ['pull'],
    // ... many more
  };
  
  const variations = [exerciseName.toLowerCase()];
  
  for (const [term, synonyms] of Object.entries(synonymMap)) {
    if (exerciseName.toLowerCase().includes(term)) {
      synonyms.forEach(syn => {
        variations.push(exerciseName.toLowerCase().replace(term, syn));
      });
    }
  }
  
  return variations;
}
```

### Database Schema

```sql
CREATE TABLE custom_exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID REFERENCES auth.users(id),
    is_ai_generated BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false, -- approved by admin or community
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    description TEXT,
    primary_muscle_group TEXT NOT NULL,
    secondary_muscle_groups TEXT[], -- array
    equipment_required TEXT[], -- array
    movement_pattern TEXT, -- vertical_press, horizontal_pull, squat, hinge, etc.
    is_unilateral BOOLEAN DEFAULT false,
    is_compound BOOLEAN DEFAULT true,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    form_cues TEXT[],
    injury_contraindications TEXT[],
    common_mistakes TEXT[],
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercise_synonyms (
    synonym_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES custom_exercises(exercise_id),
    synonym_text TEXT NOT NULL,
    source TEXT CHECK (source IN ('user_submitted', 'ai_generated', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(synonym_text, exercise_id)
);

CREATE INDEX idx_custom_exercises_normalized ON custom_exercises(name_normalized);
CREATE INDEX idx_exercise_synonyms_text ON exercise_synonyms(synonym_text);
```

### AI Classification Prompt

```typescript
const EXERCISE_CLASSIFICATION_PROMPT = `
Analyze this exercise and provide detailed classification:

Exercise name: "${exerciseName}"

Provide the following information:
1. Primary muscle group (one of: chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core)
2. Secondary muscle groups (array)
3. Equipment required (array: barbell, dumbbell, cable, machine, bodyweight, bands, etc.)
4. Movement pattern (squat, hinge, horizontal_press, vertical_press, horizontal_pull, vertical_pull, isolation)
5. Is this unilateral (single arm/leg)? (boolean)
6. Is this compound (multi-joint)? (boolean)
7. Difficulty level (beginner, intermediate, advanced)
8. Form cues (3-5 key points)
9. Common mistakes (3-5 items)
10. Injury contraindications (array)

Return as JSON.
`;
```

---

## 7. Equipment Brand & Attachment Tracking

### Overview
Track specific machine brands/models and attachments to account for resistance curve differences and provide personalized load recommendations.

### Database Schema

```sql
CREATE TABLE equipment_brands (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name TEXT NOT NULL UNIQUE,
    manufacturer_type TEXT CHECK (manufacturer_type IN ('commercial', 'home', 'specialty')),
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE machine_models (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES equipment_brands(brand_id),
    model_name TEXT NOT NULL,
    machine_type TEXT CHECK (machine_type IN ('plate_loaded', 'selectorized', 'cable', 'leverage')),
    exercise_compatibility TEXT[], -- ['Seated Row', 'High Row']
    unique_features JSONB, -- {"independent_arms": true, "converging_path": true}
    resistance_curve_profile TEXT, -- 'linear', 'ascending', 'descending', 'bell'
    leverage_ratio NUMERIC, -- e.g., 2.5:1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, model_name)
);

CREATE TABLE attachments (
    attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_name TEXT NOT NULL,
    manufacturer TEXT DEFAULT 'Standard',
    attachment_type TEXT CHECK (attachment_type IN ('handle', 'bar', 'rope', 'specialty')),
    grip_width TEXT CHECK (grip_width IN ('narrow', 'standard', 'wide', 'adjustable')),
    grip_angle TEXT CHECK (grip_angle IN ('neutral', 'pronated', 'supinated', 'rotating')),
    compatible_exercises TEXT[], -- exercises this attachment works for
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_gym_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gym_location TEXT NOT NULL, -- 'home', 'LA Fitness Downtown', etc.
    machine_model_id UUID REFERENCES machine_models(model_id),
    attachment_id UUID REFERENCES attachments(attachment_id),
    is_primary BOOLEAN DEFAULT false, -- equipment at usual gym
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_exercise_equipment_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id),
    machine_model_id UUID REFERENCES machine_models(model_id),
    attachment_id UUID REFERENCES attachments(attachment_id),
    felt_different BOOLEAN, -- for tracking user feedback
    user_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Flow

```typescript
interface EquipmentSelectionFlow {
  // Step 1: User starts exercise
  exerciseName: string;
  
  // Step 2: Check user's location and available equipment
  async selectEquipment() {
    const currentLocation = await getCurrentGymLocation();
    const availableEquipment = await getEquipmentAtLocation(currentLocation);
    
    // Get last used equipment for this exercise at this location
    const lastUsed = await getLastUsedEquipment(exerciseName, currentLocation);
    
    if (lastUsed) {
      return {
        machine: lastUsed.machine,
        attachment: lastUsed.attachment,
        suggested: true
      };
    }
    
    // Show selection UI
    return showEquipmentSelector(availableEquipment, exerciseName);
  }
}
```

### Load Adjustment Algorithm

```typescript
async function adjustLoadForMachine(
  exercise: string,
  baseWeight: number,
  fromMachine: MachineModel,
  toMachine: MachineModel
): Promise<LoadAdjustment> {
  
  // Compare leverage ratios
  const fromRatio = fromMachine.leverage_ratio || 1;
  const toRatio = toMachine.leverage_ratio || 1;
  
  const adjustmentFactor = fromRatio / toRatio;
  const adjustedWeight = baseWeight * adjustmentFactor;
  
  return {
    originalWeight: baseWeight,
    adjustedWeight: Math.round(adjustedWeight / 5) * 5, // Round to nearest 5
    adjustmentPercentage: ((adjustmentFactor - 1) * 100).toFixed(1),
    explanation: `${fromMachine.brand.name} has ${fromRatio}:1 leverage, ${toMachine.brand.name} has ${toRatio}:1 leverage`
  };
}
```

---

## 8. Warm-up & Cooldown Programming

### Overview
Automatically generate sport-specific warm-ups and cooldowns based on workout type, injury history, and user preferences.

### Database Schema

```sql
CREATE TABLE warmup_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_type TEXT NOT NULL, -- 'strength_upper', 'strength_lower', 'running', 'swimming', etc.
    duration_minutes INTEGER NOT NULL,
    exercises JSONB NOT NULL, -- [{"name": "Leg Swings", "duration": "30 seconds each side"}]
    intensity_progression TEXT DEFAULT 'light_to_moderate',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warmup_exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    exercise_type TEXT CHECK (exercise_type IN ('dynamic_stretch', 'activation', 'movement_prep', 'mobility')),
    target_area TEXT NOT NULL,
    duration_or_reps TEXT NOT NULL, -- "30 seconds" or "10 reps each side"
    intensity TEXT CHECK (intensity IN ('light', 'moderate')),
    video_url TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cooldown_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    exercises JSONB NOT NULL,
    focus TEXT CHECK (focus IN ('flexibility', 'recovery', 'relaxation')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cooldown_exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    exercise_type TEXT CHECK (exercise_type IN ('static_stretch', 'foam_rolling', 'breathing')),
    target_area TEXT NOT NULL,
    hold_duration TEXT NOT NULL, -- "30-60 seconds"
    intensity TEXT CHECK (intensity IN ('gentle', 'moderate', 'deep')),
    video_url TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Generation Logic

```typescript
interface WarmupGenerator {
  async generate(workout: Workout, userContext: UserContext): Promise<WarmupRoutine> {
    const { type, mainExercises, injuries } = workout;
    
    let warmup: WarmupRoutine = {
      phases: [],
      totalDuration: 0
    };
    
    // Phase 1: General cardiovascular warmup (3-5 min)
    warmup.phases.push({
      name: "General Warmup",
      duration: 5,
      exercises: [
        { name: "Light Cardio", duration: "5 minutes", intensity: "light", equipment: "bike, row, or walk" }
      ]
    });
    
    // Phase 2: Dynamic stretching (5-7 min)
    const dynamicStretches = this.selectDynamicStretches(type, mainExercises);
    warmup.phases.push({
      name: "Dynamic Stretching",
      duration: 5,
      exercises: dynamicStretches
    });
    
    // Phase 3: Movement-specific prep (3-5 min)
    const movementPrep = this.selectMovementPrep(mainExercises);
    warmup.phases.push({
      name: "Movement Prep",
      duration: 5,
      exercises: movementPrep
    });
    
    // Adjust for injuries
    if (injuries.length > 0) {
      warmup = this.addInjurySpecificMobility(warmup, injuries);
    }
    
    // Adjust for time of day
    if (userContext.timeOfDay === 'morning') {
      warmup.phases[1].duration += 3; // Extra mobility in morning
    }
    
    return warmup;
  }
  
  selectDynamicStretches(workoutType: string, exercises: Exercise[]): WarmupExercise[] {
    if (workoutType === 'strength_lower') {
      return [
        { name: "Leg Swings (Front to Back)", reps: "10 each leg" },
        { name: "Leg Swings (Side to Side)", reps: "10 each leg" },
        { name: "Walking Lunges", reps: "10 each leg" },
        { name: "Bodyweight Squats", reps: "15" },
        { name: "Hip Circles", reps: "10 each direction" }
      ];
    } else if (workoutType === 'running_long') {
      return [
        { name: "Leg Swings", reps: "10 each leg each direction" },
        { name: "High Knees", duration: "30 seconds" },
        { name: "Butt Kicks", duration: "30 seconds" },
        { name: "A-Skips", reps: "20 meters" },
        { name: "Walking Lunges", reps: "10 each leg" }
      ];
    }
    // ... more workout types
  }
}
```

---

## 9. Gym Location Detection & Equipment Defaults

### Overview
Auto-detect gym location and default to location-specific equipment preferences.

### Database Schema

```sql
CREATE TABLE user_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    location_name TEXT NOT NULL,
    location_type TEXT CHECK (location_type IN ('home', 'commercial', 'hotel', 'outdoor', 'other')),
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geofence_radius_meters INTEGER DEFAULT 100,
    is_primary BOOLEAN DEFAULT false,
    last_visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES user_locations(location_id),
    equipment_type TEXT NOT NULL, -- 'barbell', 'dumbbells', 'machines', 'cables', 'cardio'
    equipment_details JSONB, -- specific machines, weight ranges, etc.
    brand_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_equipment_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    location_id UUID NOT NULL REFERENCES user_locations(location_id),
    exercise_name TEXT NOT NULL,
    preferred_machine_id UUID REFERENCES machine_models(model_id),
    preferred_attachment_id UUID REFERENCES attachments(attachment_id),
    preferred_weight_unit TEXT CHECK (preferred_weight_unit IN ('lbs', 'kg')),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, location_id, exercise_name)
);
```

### Location Detection Logic

```typescript
class GymLocationService {
  async detectLocation(coords: Coordinates): Promise<UserLocation | null> {
    // Get all user's saved locations
    const locations = await db.userLocation.findMany({
      where: { user_id: currentUserId }
    });
    
    // Check if within geofence of any saved location
    for (const location of locations) {
      const distance = calculateDistance(coords, {
        lat: location.latitude,
        lng: location.longitude
      });
      
      if (distance <= location.geofence_radius_meters) {
        // Update last visited
        await db.userLocation.update({
          where: { location_id: location.location_id },
          data: { last_visited_at: new Date() }
        });
        
        return location;
      }
    }
    
    // New location detected
    return null;
  }
  
  async promptNewLocation(coords: Coordinates): Promise<void> {
    Alert.alert(
      "New Gym Detected",
      "Looks like you're at a new location. Would you like to save it?",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            const equipment = await showEquipmentSurvey();
            await this.saveNewLocation(coords, equipment);
          }
        }
      ]
    );
  }
}
```

---

## 10. CrossFit & Hyrox Programming

### CrossFit WOD Modification

```sql
CREATE TABLE crossfit_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    workout_description TEXT NOT NULL,
    rx_standards_male JSONB,
    rx_standards_female JSONB,
    scaled_standards JSONB,
    time_cap INTEGER, -- minutes
    category TEXT CHECK (category IN ('girl', 'hero', 'open', 'quarterfinal', 'games')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Hyrox-Specific Tables

```sql
CREATE TABLE hyrox_workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    workout_type TEXT CHECK (workout_type IN ('full_race_simulation', 'station_specific', 'hybrid_intervals', 'brick')),
    focus_area TEXT, -- 'running_endurance', 'sled_power', 'transition_speed'
    duration_estimate INTEGER, -- minutes
    stations_completed JSONB, -- track which Hyrox stations were done
    total_distance NUMERIC,
    avg_transition_time INTEGER, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Triathlon Programming

```sql
CREATE TABLE triathlon_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    race_distance TEXT CHECK (race_distance IN ('sprint', 'olympic', 'half_ironman', 'ironman')),
    race_date DATE,
    current_fitness_by_sport JSONB, -- {"swim": "beginner", "bike": "intermediate", "run": "advanced"}
    weekly_hours_available NUMERIC,
    equipment_access JSONB, -- {"pool": true, "bike": true, "trainer": true, "wetsuit": false}
    limiters TEXT[], -- weakest sports to prioritize
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE swim_workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    workout_type TEXT CHECK (workout_type IN ('technique', 'endurance', 'intervals', 'open_water')),
    total_distance_meters INTEGER NOT NULL,
    main_set_description TEXT,
    drills JSONB,
    avg_pace_per_100m INTEGER, -- seconds
    stroke_count_avg INTEGER,
    perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bike_workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    workout_type TEXT CHECK (workout_type IN ('endurance', 'threshold', 'vo2max', 'recovery')),
    indoor_or_outdoor TEXT CHECK (indoor_or_outdoor IN ('indoor', 'outdoor')),
    distance_km NUMERIC,
    elevation_gain_meters NUMERIC,
    avg_power_watts INTEGER,
    avg_heart_rate INTEGER,
    normalized_power INTEGER,
    training_stress_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brick_workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bike_duration_minutes INTEGER NOT NULL,
    bike_intensity TEXT,
    transition_time_seconds INTEGER,
    run_duration_minutes INTEGER NOT NULL,
    run_intensity TEXT,
    legs_feel_rating INTEGER CHECK (legs_feel_rating BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Additional Feature Ideas

### 12.1 Progressive Overload Tracking

Track improvements across multiple metrics, not just weight × reps.

```typescript
interface ProgressionMetrics {
  strength: {
    volumeLoad: number; // weight × reps × sets
    oneRepMax: number; // estimated or actual
    relativeStrength: number; // 1RM / bodyweight
  };
  
  running: {
    paceAtSameHR: string; // faster pace at same HR = improvement
    hrAtSamePace: number; // lower HR at same pace = improvement
    distanceAtSameIntensity: number; // longer distance = improvement
  };
  
  recovery: {
    hrvTrend: "improving" | "stable" | "declining";
    restingHrTrend: "improving" | "stable" | "declining";
    sleepQualityTrend: "improving" | "stable" | "declining";
  };
}
```

### 12.2 Deload Week Intelligence

```typescript
async function detectDeloadNeed(userId: string): Promise<DeloadRecommendation | null> {
  const recentPerformance = await getPerformanceTrend(userId, 21); // 3 weeks
  const biometrics = await getBiometricTrends(userId, 14); // 2 weeks
  const subjective = await getSubjectiveRecovery(userId, 7); // 1 week
  
  let deloadScore = 0;
  
  // Performance declining
  if (recentPerformance.volumeTrend < -5) deloadScore += 2;
  if (recentPerformance.intensityTolerance < 0.85) deloadScore += 1;
  
  // Biometrics poor
  if (biometrics.hvr.trend === "declining") deloadScore += 2;
  if (biometrics.restingHr.change > 5) deloadScore += 2;
  if (biometrics.sleepQuality < 6) deloadScore += 1;
  
  // Subjective recovery poor
  if (subjective.avgRecoveryScore < 5) deloadScore += 2;
  
  if (deloadScore >= 5) {
    return {
      recommended: true,
      urgency: deloadScore >= 7 ? "high" : "moderate",
      reason: "Multiple indicators suggest you need recovery",
      deloadProtocol: {
        volumeReduction: 40, // percent
        intensityReduction: 20,
        durationWeeks: 1
      }
    };
  }
  
  return null;
}
```

### 12.3 Nutrition Integration

Basic macro recommendations based on training load.

```sql
CREATE TABLE nutrition_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    training_type TEXT, -- 'rest', 'easy', 'moderate', 'hard'
    calories_target INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fat_g INTEGER,
    hydration_ml INTEGER,
    timing_recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);
```

---

## 13. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native)                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Voice   │ Calendar │ Workout  │ Wearable │  Profile │  │
│  │ Commands │   View   │ Tracking │  Sync    │  Settings│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│         │         │         │         │         │            │
│         └─────────┴─────────┴─────────┴─────────┘            │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Core Services Layer                       │  │
│  │  • Exercise Swap Service (with RAG)                   │  │
│  │  • Program Generation Service                         │  │
│  │  • Scheduling Service (conflict detection)            │  │
│  │  • Biometric Analysis Service                         │  │
│  │  • Injury Detection Service                           │  │
│  │  • Equipment Intelligence Service                     │  │
│  │  • Multi-Sport Programming Service                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           External Integration Layer                   │  │
│  │  • Wearable APIs (Whoop, Fitbit, Garmin)             │  │
│  │  • HealthKit / Google Fit                             │  │
│  │  • Nutrition APIs (MyFitnessPal)                      │  │
│  │  • Payment (Stripe)                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKGROUND WORKERS (Separate Service)          │
│  • Wearable data sync jobs (every 15-30 min)                │
│  • Recovery score calculations (nightly)                     │
│  • Program regeneration (when needed)                        │
│  • Analytics aggregation                                     │
│  • HR zone recalculation (weekly)                            │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase/Postgres)              │
│  • Users, workouts, exercises (existing)                     │
│  • Biometric data, wearable connections                      │
│  • Schedules, calendar events                                │
│  • Equipment, locations, preferences                         │
│  • Sport-specific data (runs, swims, bikes)                  │
│  • Time-series partitioning for biometric data               │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns**
   - Wearable sync separate from main API (avoid blocking)
   - Background workers handle expensive computations
   - Cache heavily (biometric data, equipment preferences)

2. **Scalability Considerations**
   - Biometric data grows fast (HR every 10s = lots of rows)
   - Use time-series database or table partitioning
   - Archive old workout data after 2 years (keep aggregates)

3. **Data Freshness vs Performance**
   - Real-time HR during workout: 10-second polling
   - Recovery scores: calculate once daily
   - Calendar conflicts: check on-demand when rescheduling

4. **Offline Support Critical**
   - User might start workout with poor signal
   - Queue all logs locally, sync when online
   - Cache wearable data for 48 hours
   - Download next 7 days of workouts on app open

---

## 14. Implementation Roadmap

### Phase 1: Foundation (✅ Mostly Complete)
**Timeline:** Already done
- Exercise swap with RAG
- Injury detection
- Voice commands
- Basic workout logging

### Phase 2: Wearable Integration (HIGH PRIORITY)
**Timeline:** 4-6 months
**Estimated Effort:** 12-16 weeks

#### Month 1-2: iOS HealthKit
- [ ] HealthKit integration (read permissions)
- [ ] Biometric data ingestion (HRV, sleep, HR)
- [ ] Background sync service
- [ ] Auto-populate readiness scores
- [ ] Real-time HR during workouts

#### Month 3: Android Health Connect
- [ ] Google Fit / Health Connect integration
- [ ] Parity with iOS features
- [ ] Cross-platform biometric service layer

#### Month 4: Third-Party APIs
- [ ] Whoop API integration
- [ ] Garmin Connect API
- [ ] Webhook handlers for push updates

#### Month 5-6: Analytics & UI
- [ ] HR zone calculation engine
- [ ] Biometric trends dashboard
- [ ] Recovery score algorithm
- [ ] Performance analytics

**Dependencies:**
- Mobile developer with HealthKit experience
- Backend developer for sync workers
- Privacy/compliance review (HIPAA considerations)

**Success Metrics:**
- 70% of users connect at least one wearable
- 90% of manual readiness entries replaced by auto-populate
- <30 second sync latency for recovery scores

---

### Phase 3: Multi-Sport Foundation (MEDIUM-HIGH PRIORITY)
**Timeline:** 7-9 months (after Phase 2)
**Estimated Effort:** 10-12 weeks

#### Month 7: Running Tracking
- [ ] Cardio workout data model
- [ ] Split tracking
- [ ] Pace calculation engine
- [ ] Basic running analytics

#### Month 8: Heart Rate Zone Analytics
- [ ] Zone calculation (max HR, threshold, custom)
- [ ] Time-in-zone tracking
- [ ] HR efficiency metrics
- [ ] Cardiac drift detection

#### Month 9: Hybrid Athlete Scheduling
- [ ] Athlete profile onboarding
- [ ] Interference mitigation rules engine
- [ ] Basic schedule generation for strength + running
- [ ] Conflict detection algorithm

**Dependencies:**
- Sports science consultant for training principles
- Algorithm development for scheduling

**Success Metrics:**
- Users can track running workouts with HR zones
- 80% fewer scheduling conflicts reported
- Hybrid programs generate without errors

---

### Phase 4: Advanced Scheduling (MEDIUM PRIORITY)
**Timeline:** 10-12 months
**Estimated Effort:** 8-10 weeks

#### Month 10: Calendar UI
- [ ] React Native calendar component
- [ ] Multi-week program visualization
- [ ] Color coding by workout type

#### Month 11: Drag-and-Drop
- [ ] Gesture handlers for drag-and-drop
- [ ] Conflict warnings on drop
- [ ] Auto-suggest better dates

#### Month 12: Intelligent Rescheduling
- [ ] AI suggestions for schedule adjustments
- [ ] Travel mode
- [ ] Batch rescheduling
- [ ] Program extension logic

**Dependencies:**
- UX designer for calendar interactions
- Frontend developer with gesture handling experience

**Success Metrics:**
- 60% of users use calendar view weekly
- Average 3 reschedules per user per month
- 90% of reschedules don't create conflicts

---

### Phase 5: Lock Screen & Live Activities (iOS-SPECIFIC)
**Timeline:** 13-15 months
**Estimated Effort:** 6-8 weeks

#### Month 13-14: Live Activity Implementation
- [ ] iOS ActivityKit integration
- [ ] Dynamic Island support
- [ ] Lock screen widget
- [ ] Real-time state updates

#### Month 15: Android Equivalent
- [ ] Foreground notification service
- [ ] Widget implementation
- [ ] Voice command button

**Dependencies:**
- iOS developer with ActivityKit experience
- Android developer for notifications

**Success Metrics:**
- 40% of iOS users enable Live Activity
- Average 5 voice commands per workout from lock screen

---

### Phase 6: Equipment Intelligence (LOW-MEDIUM PRIORITY)
**Timeline:** 16-18 months
**Estimated Effort:** 8-10 weeks

#### Implementation
- [ ] Equipment brand/model database (top 20 brands)
- [ ] Location-based equipment defaults
- [ ] Attachment tracking
- [ ] Load adjustment algorithm
- [ ] Basic image recognition (future)

**Dependencies:**
- Research on equipment brands and models
- ML engineer for image recognition (later)

**Success Metrics:**
- Database covers 80% of commercial gym equipment
- 50% of users log equipment preferences
- Load adjustments save 10+ seconds per exercise

---

### Phase 7: Sport-Specific Expansion (LOW-MEDIUM PRIORITY)
**Timeline:** 19-24+ months
**Estimated Effort:** Varies by sport

#### Hyrox (Priority 1) - 6 weeks
- [ ] Station-specific exercises
- [ ] Race simulation workouts
- [ ] Brick workout tracking
- [ ] Transition time optimization

#### CrossFit (Priority 2) - 8 weeks
- [ ] WOD parser
- [ ] Benchmark database
- [ ] Movement substitutions
- [ ] Skill progression tracking

#### Triathlon (Priority 3) - 10-12 weeks
- [ ] Swim workout tracking
- [ ] Bike power metrics
- [ ] Brick workouts
- [ ] Race day pacing calculator

**Dependencies:**
- Sport-specific coaches as consultants
- Athlete beta testers for each sport

**Success Metrics:**
- 15% of users identify as multi-sport athletes
- Each sport module has 1000+ active users within 3 months

---

### Phase 8: Warm-up & Cooldown (ONGOING)
**Timeline:** Can be added incrementally
**Estimated Effort:** 4-6 weeks for initial implementation

#### Implementation
- [ ] Template database (20+ workout types)
- [ ] Exercise library (100+ movements)
- [ ] Generation algorithm
- [ ] Voice-guided routines
- [ ] Injury-specific customization

**Success Metrics:**
- 60% of workouts include warm-up
- Average warm-up completion rate: 75%
- 30% reduction in reported acute injuries

---

### Phase 9: Premium Features (ONGOING)
**Timeline:** 24+ months
**Estimated Effort:** Varies significantly

#### Video Form Analysis (12-16 weeks)
- Requires ML expertise
- MediaPipe or custom model
- On-device processing

#### Advanced Equipment Profiling (6-8 weeks)
- Resistance curve mapping
- Premium feature tier

#### Nutrition Integration (8-10 weeks)
- MyFitnessPal API
- Macro calculator
- Meal timing recommendations

---

## 15. Staffing & Resource Requirements

### Core Team (Needed Throughout)
- **2 Backend Developers**: API, database, background workers
- **2 Mobile Developers**: 1 iOS, 1 Android
- **1 DevOps Engineer**: Infrastructure, deployment, monitoring
- **1 Product Manager**: Prioritization, user feedback, roadmap
- **1 Designer**: UI/UX for new features

### Specialized Roles (As Needed)
- **Sports Science Consultant** (Phases 3, 7): Training principles, periodization
- **ML Engineer** (Phase 9): Video form analysis, AI enhancements
- **Privacy/Compliance Consultant** (Phase 2): HIPAA, health data regulations

### Budget Considerations
- **API Costs**: Whoop, Fitbit, Garmin developer accounts (~$5K-10K/year)
- **Infrastructure**: Increased database storage for biometric data (+$500-1K/month)
- **ML Infrastructure**: GPU instances for form analysis (+$2K-5K/month when active)
- **Third-party Services**: Video hosting, image recognition APIs (~$1K-3K/month)

---

## 16. Risk Mitigation

### Technical Risks
1. **Biometric Data Scalability**
   - *Risk*: Database overwhelmed by HR data every 10 seconds
   - *Mitigation*: Table partitioning, time-series DB, aggressive pruning

2. **Wearable API Reliability**
   - *Risk*: Third-party APIs go down or change unexpectedly
   - *Mitigation*: Robust fallbacks, native HealthKit/Google Fit priority, monitoring

3. **Scheduling Algorithm Complexity**
   - *Risk*: Too many constraints make optimal scheduling impossible
   - *Mitigation*: Soft vs hard constraints, user override always available

### Product Risks
1. **Feature Scope Creep**
   - *Risk*: Trying to do too much, shipping nothing
   - *Mitigation*: Strict phasing, MVP for each feature, user validation

2. **User Adoption**
   - *Risk*: Users don't connect wearables or use advanced features
   - *Mitigation*: Onboarding flow, value proposition messaging, incentives

3. **Privacy Concerns**
   - *Risk*: Users hesitant to share biometric data
   - *Mitigation*: Transparency, encryption, user control, compliance certifications

---

## 17. Success Metrics by Phase

### Phase 2: Wearable Integration
- 70% wearable connection rate
- 50% reduction in manual readiness entries
- 95% user satisfaction with auto-sync

### Phase 3: Multi-Sport
- 30% of users log cardio workouts
- 15% identify as hybrid athletes
- 4.5/5 average rating for scheduling features

### Phase 4: Calendar
- 60% weekly calendar view usage
- 80% successful reschedules (no conflicts)
- 20% increase in program adherence

### Phase 5: Live Activity
- 40% Live Activity adoption (iOS)
- 10% increase in voice command usage
- 90% completion rate for workouts started via lock screen

---

## 18. Open Questions & Future Research

1. **Genetic Profiling**: Is there real value or is it gimmicky?
2. **AR/VR Form Coaching**: Apple Vision Pro integration worth it?
3. **Social Features**: How much do users want community vs privacy?
4. **AI Coach Evolution**: Move toward more conversational, less transactional?
5. **Enterprise/B2B**: Should we pursue gym partnerships or stay consumer-focused?

---

## Conclusion

This roadmap represents 24-36 months of development work. Key priorities:

1. **Wearable integration** unlocks the most value (Phase 2)
2. **Multi-sport support** opens new markets (Phase 3)
3. **Everything else** is incremental improvement

**Recommended Next Steps:**
1. Validate user demand for wearable integration (survey, interviews)
2. Hire iOS developer with HealthKit experience
3. Begin Phase 2 database schema design
4. Prototype HR zone tracking with test users

**Last Updated:** 2025-01-24  
**Next Review:** 2025-04-24  
**Owner:** Engineering & Product Teams