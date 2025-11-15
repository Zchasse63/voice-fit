# Priority Features Implementation Plan

**Date:** 2025-01-24  
**Status:** Ready for Implementation  
**Timeline:** 6-9 weeks (3 features across 3 sprints)  
**Team Size:** 2-3 developers

---

## Table of Contents

1. [Implementation Order & Rationale](#implementation-order--rationale)
2. [Feature 1: Smart Exercise Creation & Synonym Checking](#feature-1-smart-exercise-creation--synonym-checking)
3. [Feature 2: Lock Screen Widget & Live Activity](#feature-2-lock-screen-widget--live-activity)
4. [Feature 3: Program Scheduling & Calendar View](#feature-3-program-scheduling--calendar-view)
5. [Resource Requirements](#resource-requirements)
6. [Risk Assessment](#risk-assessment)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)

---

## Implementation Order & Rationale

### Recommended Order

**1. Smart Exercise Creation & Synonym Checking (Sprint 1: Weeks 1-3)**  
**2. Lock Screen Widget & Live Activity (Sprint 2: Weeks 4-6)**  
**3. Program Scheduling & Calendar View (Sprint 3: Weeks 7-9)**

### Why This Order?

#### Feature 1 First: Smart Exercise Creation
✅ **Foundation for other features** - Calendar needs clean exercise data  
✅ **Lowest risk** - Backend-focused, no complex UI  
✅ **Immediate user value** - Improves exercise logging now  
✅ **No dependencies** - Can start immediately  
✅ **Database improvements** - Benefits all future features  

#### Feature 2 Second: Lock Screen Widget
✅ **Medium complexity** - iOS-specific, well-documented APIs  
✅ **High user engagement** - Visible impact, drives retention  
✅ **Can work in parallel** - While Feature 1 is in testing  
✅ **iOS 16+ requirement** - Limits testing scope  

#### Feature 3 Third: Calendar View
✅ **Most complex** - Requires drag-and-drop, conflict detection  
✅ **Builds on Feature 1** - Needs clean exercise data  
✅ **Can reuse Live Activity patterns** - Workout state management  
✅ **Longest development time** - Most UI work  

---

## Feature 1: Smart Exercise Creation & Synonym Checking

**Timeline:** Weeks 1-3 (Sprint 1)  
**Priority:** HIGH  
**Complexity:** Medium  
**Team:** 1 Backend Dev + 1 Mobile Dev

### Goals

1. Prevent duplicate exercise entries
2. Automatically detect synonyms (e.g., "DB Press" = "Dumbbell Press")
3. AI-classify new exercises with proper metadata
4. Improve data quality for all users

### Technical Specifications

#### Backend Components

**1. Normalization Service**
```typescript
// apps/backend/services/exercise/ExerciseNormalizationService.ts

class ExerciseNormalizationService {
  normalize(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\b(db|dumbbell)\b/gi, 'dumbbell')
      .replace(/\b(bb|barbell)\b/gi, 'barbell')
      .replace(/\b1\b/g, 'one')
      .replace(/\bsingle arm\b/g, 'single-arm')
      .replace(/\s+/g, ' '); // Collapse spaces
  }
  
  generateSynonyms(name: string): string[] {
    const synonymMap = {
      'single arm': ['one arm', 'unilateral', '1 arm'],
      'dumbbell': ['db', 'dumbell'],
      'barbell': ['bb'],
      'press': ['push'],
      'row': ['pull'],
      // ... expand with 50+ common substitutions
    };
    
    const variations: string[] = [name.toLowerCase()];
    
    Object.entries(synonymMap).forEach(([term, synonyms]) => {
      if (name.toLowerCase().includes(term)) {
        synonyms.forEach(syn => {
          variations.push(name.toLowerCase().replace(term, syn));
        });
      }
    });
    
    return variations;
  }
}
```

**2. Fuzzy Matching Service**
```typescript
// apps/backend/services/exercise/FuzzyMatchService.ts

import Fuse from 'fuse.js';

class FuzzyMatchService {
  async findSimilarExercises(
    searchTerm: string,
    threshold: number = 0.7
  ): Promise<SimilarExercise[]> {
    // Get all exercises from DB
    const allExercises = await db.exercises.findMany();
    
    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(allExercises, {
      keys: ['name', 'normalized_name'],
      threshold: 1 - threshold, // Fuse uses inverse (0 = exact match)
      includeScore: true
    });
    
    const results = fuse.search(searchTerm);
    
    return results.map(result => ({
      exercise: result.item,
      similarity: 1 - (result.score || 0),
      matchReason: this.explainMatch(searchTerm, result.item.name)
    }));
  }
  
  private explainMatch(input: string, match: string): string {
    // Simple explanation logic
    if (input.toLowerCase() === match.toLowerCase()) {
      return 'Exact match (case insensitive)';
    }
    
    const inputWords = input.toLowerCase().split(' ');
    const matchWords = match.toLowerCase().split(' ');
    const commonWords = inputWords.filter(w => matchWords.includes(w));
    
    if (commonWords.length === inputWords.length) {
      return 'All words match';
    }
    
    return `${commonWords.length}/${inputWords.length} words match`;
  }
}
```

**3. AI Classification Service**
```typescript
// apps/backend/services/exercise/ExerciseClassificationService.ts

class ExerciseClassificationService {
  async classifyExercise(exerciseName: string): Promise<ExerciseMetadata> {
    const prompt = `
Analyze this exercise and provide detailed classification:

Exercise name: "${exerciseName}"

Provide the following as JSON:
{
  "primary_muscle_group": "one of: chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core",
  "secondary_muscle_groups": ["array of secondary muscles"],
  "equipment_required": ["barbell", "dumbbell", "cable", etc.],
  "movement_pattern": "squat|hinge|horizontal_press|vertical_press|horizontal_pull|vertical_pull|isolation",
  "is_unilateral": boolean,
  "is_compound": boolean,
  "difficulty_level": "beginner|intermediate|advanced",
  "form_cues": ["3-5 key coaching points"],
  "common_mistakes": ["3-5 common errors"],
  "injury_contraindications": ["injuries that should avoid this"],
  "confidence": 0.0 to 1.0
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

**4. Main Exercise Creation Flow**
```typescript
// apps/backend/routes/exercises.ts

router.post('/api/exercises/create', async (req, res) => {
  const { name, user_id } = req.body;
  
  // 1. Normalize
  const normalized = normalizationService.normalize(name);
  
  // 2. Check exact match
  const exactMatch = await db.exercises.findFirst({
    where: { normalized_name: normalized }
  });
  
  if (exactMatch) {
    return res.json({
      type: 'existing',
      exercise: exactMatch,
      message: 'Exercise already exists'
    });
  }
  
  // 3. Generate synonyms and fuzzy search
  const synonyms = normalizationService.generateSynonyms(name);
  const similar = await fuzzyMatchService.findSimilarExercises(name);
  
  if (similar.length > 0 && similar[0].similarity > 0.85) {
    return res.json({
      type: 'similar_found',
      matches: similar,
      message: 'Did you mean one of these?'
    });
  }
  
  // 4. AI classify
  const metadata = await classificationService.classifyExercise(name);
  
  if (metadata.confidence < 0.8) {
    // Flag for admin review
    return res.json({
      type: 'needs_review',
      metadata,
      message: 'AI confidence low. Requires manual review.'
    });
  }
  
  // 5. Create exercise
  const newExercise = await db.custom_exercises.create({
    data: {
      name,
      normalized_name: normalized,
      created_by_user_id: user_id,
      is_ai_generated: false,
      is_validated: false,
      ...metadata
    }
  });
  
  // 6. Create synonym entries
  await db.exercise_synonyms.createMany({
    data: synonyms.map(syn => ({
      exercise_id: newExercise.id,
      synonym_text: syn,
      source: 'ai_generated'
    }))
  });
  
  return res.json({
    type: 'created',
    exercise: newExercise,
    message: 'Exercise created successfully'
  });
});
```

#### Database Schema

```sql
-- Custom exercises table
CREATE TABLE custom_exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    created_by_user_id UUID REFERENCES auth.users(id),
    is_ai_generated BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false,
    
    -- Metadata
    primary_muscle_group TEXT NOT NULL,
    secondary_muscle_groups TEXT[],
    equipment_required TEXT[],
    movement_pattern TEXT,
    is_unilateral BOOLEAN DEFAULT false,
    is_compound BOOLEAN DEFAULT true,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Guidance
    form_cues TEXT[],
    common_mistakes TEXT[],
    injury_contraindications TEXT[],
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_exercises_normalized ON custom_exercises(normalized_name);
CREATE INDEX idx_custom_exercises_user ON custom_exercises(created_by_user_id);

-- Exercise synonyms
CREATE TABLE exercise_synonyms (
    synonym_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES custom_exercises(exercise_id) ON DELETE CASCADE,
    synonym_text TEXT NOT NULL,
    source TEXT CHECK (source IN ('user_submitted', 'ai_generated', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(synonym_text, exercise_id)
);

CREATE INDEX idx_exercise_synonyms_text ON exercise_synonyms(synonym_text);
```

#### Mobile UI Flow

**Component: ExerciseCreationModal**
```typescript
// apps/mobile/src/components/exercise/ExerciseCreationModal.tsx

interface ExerciseCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

export const ExerciseCreationModal: React.FC<ExerciseCreationModalProps> = ({
  visible,
  onClose,
  onExerciseCreated
}) => {
  const [exerciseName, setExerciseName] = useState('');
  const [step, setStep] = useState<'input' | 'checking' | 'similar' | 'confirm'>('input');
  const [similarExercises, setSimilarExercises] = useState<SimilarExercise[]>([]);
  const [newExerciseMetadata, setNewExerciseMetadata] = useState<ExerciseMetadata | null>(null);
  
  const handleCreate = async () => {
    setStep('checking');
    
    const response = await api.post('/api/exercises/create', {
      name: exerciseName
    });
    
    if (response.data.type === 'existing') {
      Alert.alert(
        'Exercise Exists',
        `"${response.data.exercise.name}" already exists in the database.`,
        [
          { text: 'Use This', onPress: () => onExerciseCreated(response.data.exercise) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else if (response.data.type === 'similar_found') {
      setSimilarExercises(response.data.matches);
      setStep('similar');
    } else if (response.data.type === 'created') {
      setNewExerciseMetadata(response.data.exercise);
      setStep('confirm');
    } else if (response.data.type === 'needs_review') {
      Alert.alert(
        'Needs Review',
        'AI confidence is low. Exercise will be created but requires admin approval.',
        [
          { text: 'OK', onPress: () => onExerciseCreated(response.data.exercise) }
        ]
      );
    }
  };
  
  return (
    <Modal visible={visible} animationType="slide">
      {step === 'input' && (
        <View>
          <Text>Create New Exercise</Text>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="Exercise name (e.g., Dumbbell Press)"
          />
          <Button title="Create" onPress={handleCreate} />
        </View>
      )}
      
      {step === 'similar' && (
        <View>
          <Text>Did you mean one of these?</Text>
          <FlatList
            data={similarExercises}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onExerciseCreated(item.exercise)}>
                <View style={styles.similarItem}>
                  <Text>{item.exercise.name}</Text>
                  <Text style={styles.matchScore}>
                    {Math.round(item.similarity * 100)}% match
                  </Text>
                  <Text style={styles.matchReason}>{item.matchReason}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <Button
            title="No, create new exercise"
            onPress={() => setStep('confirm')}
          />
        </View>
      )}
      
      {step === 'confirm' && newExerciseMetadata && (
        <View>
          <Text>Exercise Created!</Text>
          <Text>Name: {newExerciseMetadata.name}</Text>
          <Text>Primary Muscle: {newExerciseMetadata.primary_muscle_group}</Text>
          <Text>Equipment: {newExerciseMetadata.equipment_required.join(', ')}</Text>
          <Button title="Done" onPress={() => onExerciseCreated(newExerciseMetadata)} />
        </View>
      )}
    </Modal>
  );
};
```

### Sprint 1 Breakdown

**Week 1: Backend Foundation**
- [ ] Create database tables (custom_exercises, exercise_synonyms)
- [ ] Implement ExerciseNormalizationService
- [ ] Implement FuzzyMatchService (with Fuse.js)
- [ ] Write unit tests for normalization & fuzzy matching

**Week 2: AI Classification & API**
- [ ] Implement ExerciseClassificationService (GPT-4)
- [ ] Create POST /api/exercises/create endpoint
- [ ] Build synonym generation logic
- [ ] Integration tests for full creation flow

**Week 3: Mobile UI & Testing**
- [ ] Build ExerciseCreationModal component
- [ ] Integrate with workout logging flow
- [ ] E2E testing (create, detect duplicates, select similar)
- [ ] Beta test with 20 users

### Success Criteria (Sprint 1)

✅ 95% duplicate detection rate (measured via manual testing)  
✅ AI classification confidence >0.8 for 90% of common exercises  
✅ <3 seconds average response time for exercise creation  
✅ Zero false positives (marking unique exercises as duplicates)  
✅ Users can create custom exercises successfully 100% of the time

---

## Feature 2: Lock Screen Widget & Live Activity

**Timeline:** Weeks 4-6 (Sprint 2)  
**Priority:** HIGH  
**Complexity:** Medium-High  
**Team:** 2 Mobile Devs (1 iOS native, 1 React Native)

### Goals

1. Real-time workout tracking on iOS lock screen
2. Voice command button accessible without unlocking phone
3. Dynamic Island integration (iPhone 14 Pro+)
4. Android equivalent via foreground notification

### Technical Specifications

#### iOS Live Activity (Native Swift)

**1. Activity Attributes Definition**
```swift
// ios/WorkoutLiveActivity/WorkoutActivityAttributes.swift

import ActivityKit

struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Current exercise info
        var exerciseName: String
        var currentSet: Int
        var totalSets: Int
        var currentReps: Int?
        var targetReps: Int?
        
        // Timers
        var workoutElapsedTime: TimeInterval
        var setElapsedTime: TimeInterval
        
        // Rest period
        var isResting: Bool
        var restTimeRemaining: Int?
        
        // Performance
        var lastActionDescription: String?
        
        // Computed
        var workoutDurationFormatted: String {
            formatTime(workoutElapsedTime)
        }
        
        var setDurationFormatted: String {
            formatTime(setElapsedTime)
        }
    }
    
    // Static data (doesn't change during workout)
    var workoutName: String
    var workoutStartTime: Date
    var totalExercises: Int
}
```

**2. Live Activity UI**
```swift
// ios/WorkoutLiveActivity/WorkoutLiveActivity.swift

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen / Banner UI
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "figure.strengthtraining.traditional")
                        .foregroundColor(.blue)
                    Text(context.state.exerciseName)
                        .font(.headline)
                        .lineLimit(1)
                    Spacer()
                    Text("Set \(context.state.currentSet)/\(context.state.totalSets)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Timers
                HStack(spacing: 20) {
                    // Total workout time
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Workout")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(context.state.workoutDurationFormatted)
                            .font(.title3)
                            .monospacedDigit()
                            .fontWeight(.semibold)
                    }
                    
                    Divider()
                        .frame(height: 30)
                    
                    // Current set/rest timer
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.isResting ? "Rest" : "Set")
                            .font(.caption2)
                            .foregroundColor(context.state.isResting ? .orange : .secondary)
                        
                        if context.state.isResting, let restTime = context.state.restTimeRemaining {
                            Text("\(restTime)s")
                                .font(.title3)
                                .monospacedDigit()
                                .fontWeight(.semibold)
                                .foregroundColor(.orange)
                        } else {
                            Text(context.state.setDurationFormatted)
                                .font(.title3)
                                .monospacedDigit()
                                .fontWeight(.semibold)
                        }
                    }
                    
                    Spacer()
                }
                
                // Voice command button
                Link(destination: URL(string: "voicefit://voice-command")!) {
                    HStack {
                        Image(systemName: "mic.fill")
                        Text("Voice Command")
                    }
                    .font(.caption)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
            .padding()
            
        } dynamicIsland: { context in
            // Dynamic Island implementation
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
                        Text(context.state.workoutDurationFormatted)
                            .font(.title3)
                            .monospacedDigit()
                        
                        Link(destination: URL(string: "voicefit://voice-command")!) {
                            Image(systemName: "mic.fill")
                                .font(.title3)
                        }
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    if context.state.isResting, let restTime = context.state.restTimeRemaining {
                        VStack {
                            Text("Rest")
                                .font(.caption)
                            Text("\(restTime)s")
                                .font(.title)
                                .monospacedDigit()
                                .foregroundColor(.orange)
                        }
                    }
                }
                
            } compactLeading: {
                Image(systemName: "figure.strengthtraining.traditional")
            } compactTrailing: {
                Text(context.state.workoutDurationFormatted)
                    .font(.caption2)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "figure.strengthtraining.traditional")
            }
        }
    }
}
```

**3. React Native Bridge**
```typescript
// apps/mobile/src/services/LiveActivityManager.ts

import { NativeModules, Platform } from 'react-native';

const { WorkoutLiveActivity } = NativeModules;

interface WorkoutState {
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  currentReps?: number;
  targetReps?: number;
  workoutElapsedTime: number;
  setElapsedTime: number;
  isResting: boolean;
  restTimeRemaining?: number;
}

class LiveActivityManager {
  private activityId: string | null = null;
  private updateInterval: NodeJS.Timer | null = null;
  
  async startActivity(workoutName: string, totalExercises: number) {
    if (Platform.OS !== 'ios') {
      console.warn('Live Activities only supported on iOS');
      return;
    }
    
    try {
      this.activityId = await WorkoutLiveActivity.startActivity({
        workoutName,
        workoutStartTime: new Date().toISOString(),
        totalExercises
      });
      
      // Start update loop (every second)
      this.updateInterval = setInterval(() => {
        this.syncState();
      }, 1000);
      
      console.log('Live Activity started:', this.activityId);
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
    }
  }
  
  async updateActivity(state: WorkoutState) {
    if (!this.activityId) return;
    
    try {
      await WorkoutLiveActivity.updateActivity(this.activityId, {
        ...state,
        lastActionDescription: this.getLastAction(state)
      });
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }
  
  async endActivity() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.activityId) {
      try {
        await WorkoutLiveActivity.endActivity(this.activityId);
        this.activityId = null;
        console.log('Live Activity ended');
      } catch (error) {
        console.error('Failed to end Live Activity:', error);
      }
    }
  }
  
  private syncState() {
    const currentState = WorkoutStateManager.getCurrentState();
    this.updateActivity(currentState);
  }
  
  private getLastAction(state: WorkoutState): string {
    if (state.isResting) {
      return 'Resting';
    }
    return `Set ${state.currentSet} in progress`;
  }
}

export default new LiveActivityManager();
```

#### Data Models

```typescript
// apps/mobile/src/types/schedule.ts

interface WeekSchedule {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  totalDistance: number;
  totalTime: string;
  completed: number;
  total: number;
  distanceCompleted: number;
  distanceTotal: number;
  days: DaySchedule[];
}

interface DaySchedule {
  date: Date;
  dayOfWeek: string; // "MON", "TUE", etc.
  dayNumber: number; // 10, 11, etc.
  workouts: ScheduledWorkout[];
}

interface ScheduledWorkout {
  id: string;
  name: string;
  workoutType: 'strength' | 'running' | 'swimming' | 'cycling' | 'rest';
  distance?: string; // "3.5mi", "10mi"
  duration?: string; // "25m - 35m", "1h35m"
  completed: boolean;
  color: string; // Color bar on left
  details?: string; // "Taper Intervals • 5mi"
  conflictWarnings?: ConflictWarning[];
  originalDate?: Date; // If rescheduled
  isUserModified: boolean;
}
```

#### Backend: Scheduling Service

```kotlin
// android/app/src/main/java/com/voicefit/WorkoutNotificationService.kt

class WorkoutNotificationService : Service() {
    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "workout_tracking"
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        
        val notification = createWorkoutNotification(
            exerciseName = intent?.getStringExtra("exerciseName") ?: "",
            currentSet = intent?.getIntExtra("currentSet", 1) ?: 1,
            totalSets = intent?.getIntExtra("totalSets", 3) ?: 3,
            elapsedTime = intent?.getLongExtra("elapsedTime", 0) ?: 0
        )
        
        startForeground(NOTIFICATION_ID, notification)
        
        return START_STICKY
    }
    
    private fun createWorkoutNotification(
        exerciseName: String,
        currentSet: Int,
        totalSets: Int,
        elapsedTime: Long
    ): Notification {
        val voiceIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                action = "VOICE_COMMAND"
            },
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_workout)
            .setContentTitle(exerciseName)
            .setContentText("Set $currentSet/$totalSets")
            .setSubText(formatTime(elapsedTime))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .addAction(
                R.drawable.ic_mic,
                "Voice Command",
                voiceIntent
            )
            .build()
    }
    
    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Workout Tracking",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Shows current workout progress"
            setShowBadge(false)
        }
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
}
```

### Sprint 3 Breakdown (Updated for List-Based Design)

**Week 7: Backend & Data Layer**
- [ ] Create/update scheduled_workouts table schema
- [ ] Implement conflict detection algorithm
- [ ] Build reschedule API endpoint (POST /api/schedule/reschedule)
- [ ] Add week summary calculations
- [ ] Create reset week functionality
- [ ] Unit tests for scheduling service

**Week 8: Mobile UI Components**
- [ ] Build TrainingCalendar screen shell
- [ ] Implement WeekSection component
- [ ] Build DayRow with workout cards
- [ ] Implement Week Overview Modal
- [ ] Add color coding system (strength=blue, running=green, etc.)
- [ ] Style components to match design

**Week 9: Drag-and-Drop & Polish**
- [ ] Implement drag-and-drop with React Native Gesture Handler
- [ ] Add haptic feedback on long-press
- [ ] Build drop target detection logic
- [ ] Show conflict warnings when dropping
- [ ] Implement "+Add" workout functionality
- [ ] Add "Reset" button per week
- [ ] E2E testing (drag, drop, conflicts)
- [ ] Beta test with 25 users
</text>

<old_text line=875>
### Success Criteria (Sprint 2)

✅ Live Activity appears on lock screen within 2 seconds of workout start  
✅ Timers update in real-time (every second)  
✅ Voice button works from lock screen  
✅ Dynamic Island shows workout info (iPhone 14 Pro+)  
✅ Activity persists across app backgrounds  
✅ Android notification matches iOS functionality  
✅ 90% of beta users rate experience 4+/5

### Success Criteria (Sprint 2)

✅ Live Activity appears on lock screen within 2 seconds of workout start  
✅ Timers update in real-time (every second)  
✅ Voice button works from lock screen  
✅ Dynamic Island shows workout info (iPhone 14 Pro+)  
✅ Activity persists across app backgrounds  
✅ Android notification matches iOS functionality  
✅ 90% of beta users rate experience 4+/5

### Design Notes (Based on Runna Reference)

**Visual Elements to Include:**
- ✅ **Color bars** on left edge of workout cards (different colors per workout type)
- ✅ **Week badges** ("WEEK 9" in black rounded rectangle)
- ✅ **Completion checkmarks** (black circle with white checkmark)
- ✅ **Day labels** (SAT 8, SUN 9, etc. in left column)
- ✅ **"+Add" buttons** (gray with plus icon) for empty days
- ✅ **Reset button** (refresh icon + "Reset" text) per week
- ✅ **Week totals** ("Total: 5.4 mi / 21.6 mi") below week badge
- ✅ **Multiple workouts per day** (stacked horizontally if needed)
- ✅ **Drag indicators** (subtle visual cue when long-pressing)

**Color Scheme:**
- Red/Orange: Tempo/Hard runs
- Yellow/Green: Easy runs
- Blue: Strength workouts
- Gray: Rest days
- Purple: Long runs

**Interactions:**
- Long-press (300ms) to initiate drag
- Drag up/down to move between days
- Drop on target day
- Tap workout card to view/edit details
- Tap "+Add" to create new workout
- Tap "Reset" to restore original schedule

---

## Feature 3: Program Scheduling & Calendar View

**Timeline:** Weeks 7-9 (Sprint 3)  
**Priority:** HIGH  
**Complexity:** Medium (Simplified from original plan)  
**Team:** 2 Mobile Devs + 1 Backend Dev

**Design Reference:** Runna app's list-based training calendar (NOT a traditional calendar grid)

### Goals

1. **List-based training schedule** (vertical, organized by week - similar to Runna)
2. **Calendar icon** in top-right navigation opens training view
3. **Drag-and-drop** rescheduling within and across days
4. **Week overview modal** showing quick summary
5. **Multi-week sections** with weekly totals
6. **Conflict detection** (e.g., heavy legs before long run)
7. **"+Add" buttons** for empty days
8. **Reset button** per week to restore original schedule

### Design Philosophy (Based on Runna)

**Why List-Based vs Traditional Calendar Grid:**
- ✅ **Mobile-optimized** - Easier to read/interact on phones
- ✅ **More context** - See workout details without drilling down
- ✅ **Better for training** - Focus on progression, not just dates
- ✅ **Simpler implementation** - No complex grid layout logic
- ✅ **Native feel** - Vertical scroll feels natural on mobile

### UI Flow

```
Activities Tab (or Home)
    └─> Calendar Icon (top right) 
        └─> Training Calendar Screen
            ├─> Week Overview Modal (optional quick view)
            └─> Full Training Schedule
                ├─> Week Sections (WEEK 9, WEEK 10, etc.)
                ├─> Daily Workout Cards
                ├─> Drag to rearrange
                ├─> Tap to view/edit
                └─> "+ Add" for new workouts
```

### Technical Specifications

#### Mobile Components

**1. Training Calendar Screen**
```typescript
// apps/mobile/src/screens/TrainingCalendar.tsx

interface TrainingCalendarProps {
  initialWeek?: number;
}

export const TrainingCalendar: React.FC<TrainingCalendarProps> = ({ initialWeek }) => {
  const [weeks, setWeeks] = useState<WeekSchedule[]>([]);
  const [showOverview, setShowOverview] = useState(false);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Training calendar</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Scrollable Week Sections */}
      <ScrollView>
        {weeks.map(week => (
          <WeekSection
            key={week.weekNumber}
            week={week}
            onWorkoutDrag={handleWorkoutDrag}
            onAddWorkout={handleAddWorkout}
            onReset={handleResetWeek}
          />
        ))}
      </ScrollView>
      
      {/* Week Overview Modal */}
      <WeekOverviewModal
        visible={showOverview}
        week={currentWeek}
        onClose={() => setShowOverview(false)}
      />
    </View>
  );
};
```

**2. Week Section Component**
```typescript
// apps/mobile/src/components/schedule/WeekSection.tsx

interface WeekSectionProps {
  week: WeekSchedule;
  onWorkoutDrag: (workoutId: string, newDate: Date) => void;
  onAddWorkout: (date: Date) => void;
  onReset: (weekNumber: number) => void;
}

export const WeekSection: React.FC<WeekSectionProps> = ({
  week,
  onWorkoutDrag,
  onAddWorkout,
  onReset
}) => {
  return (
    <View style={styles.weekContainer}>
      {/* Week Header */}
      <View style={styles.weekHeader}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekNumber}>WEEK {week.weekNumber}</Text>
        </View>
        <View style={styles.weekSummary}>
          <Text style={styles.weekTotal}>
            Total: {week.totalDistance} mi / {week.totalTime}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onReset(week.weekNumber)}>
          <Icon name="refresh" size={20} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      
      {/* Days List */}
      {week.days.map(day => (
        <DayRow
          key={day.date.toISOString()}
          day={day}
          onWorkoutDrag={onWorkoutDrag}
          onAddWorkout={onAddWorkout}
        />
      ))}
    </View>
  );
};
```

**3. Day Row with Drag-and-Drop**
```typescript
// apps/mobile/src/components/schedule/DayRow.tsx

import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DayRowProps {
  day: DaySchedule;
  onWorkoutDrag: (workoutId: string, newDate: Date) => void;
  onAddWorkout: (date: Date) => void;
}

export const DayRow: React.FC<DayRowProps> = ({ day, onWorkoutDrag, onAddWorkout }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  return (
    <View style={styles.dayRow}>
      {/* Day Label */}
      <View style={styles.dayLabel}>
        <Text style={styles.dayName}>{day.dayOfWeek}</Text>
        <Text style={styles.dayNumber}>{day.dayNumber}</Text>
      </View>
      
      {/* Workout Cards (can have multiple per day) */}
      <View style={styles.workoutsContainer}>
        {day.workouts.length > 0 ? (
          day.workouts.map(workout => (
            <DraggableWorkoutCard
              key={workout.id}
              workout={workout}
              onDrag={onWorkoutDrag}
            />
          ))
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddWorkout(day.date)}
          >
            <Icon name="add" size={16} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

**4. Draggable Workout Card**
```typescript
// apps/mobile/src/components/schedule/DraggableWorkoutCard.tsx

interface DraggableWorkoutCardProps {
  workout: ScheduledWorkout;
  onDrag: (workoutId: string, newDate: Date) => void;
}

export const DraggableWorkoutCard: React.FC<DraggableWorkoutCardProps> = ({
  workout,
  onDrag
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  
  const gesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.05);
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onEnd(() => {
      isDragging.value = false;
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
    });
  
  const panGesture = Gesture.Pan()
    .enabled(isDragging.value)
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      // Calculate which day the workout was dropped on
      const newDate = calculateDropTarget(event.absoluteY);
      if (newDate) {
        onDrag(workout.id, newDate);
      }
      translateY.value = withSpring(0);
    });
  
  const composed = Gesture.Race(gesture, panGesture);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: isDragging.value ? 0.8 : 1,
    zIndex: isDragging.value ? 999 : 1
  }));
  
  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.workoutCard, animatedStyle]}>
        {/* Color Bar (left side) */}
        <View style={[styles.colorBar, { backgroundColor: workout.color }]} />
        
        {/* Workout Info */}
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.workoutDetails}>
            {workout.distance} • {workout.duration}
          </Text>
        </View>
        
        {/* Completion Checkmark */}
        {workout.completed && (
          <View style={styles.checkmark}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};
```

**5. Week Overview Modal (Popup)**
```typescript
// apps/mobile/src/components/schedule/WeekOverviewModal.tsx

interface WeekOverviewModalProps {
  visible: boolean;
  week: WeekSchedule;
  onClose: () => void;
}

export const WeekOverviewModal: React.FC<WeekOverviewModalProps> = ({
  visible,
  week,
  onClose
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Week {week.weekNumber} Overview</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} />
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(week.completed / week.total) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Workouts: {week.completed}/{week.total}
          </Text>
          <Text style={styles.distanceText}>
            Distance: {week.distanceCompleted}/{week.distanceTotal}mi
          </Text>
        </View>
        
        {/* Workout List */}
        <ScrollView style={styles.workoutList}>
          {week.days.map(day => (
            day.workouts.map(workout => (
              <WorkoutSummaryCard
                key={workout.id}
                workout={workout}
                day={day}
              />
            ))
          ))}
        </ScrollView>
        
        {/* View Full Week Button */}
        <TouchableOpacity
          style={styles.fullWeekButton}
          onPress={() => {
            onClose();
            navigation.navigate('TrainingCalendar', { week: week.weekNumber });
          }}
        >
          <Text style={styles.fullWeekButtonText}>View full week</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
```

#### Backend: Scheduling Service

```typescript
// apps/backend/services/scheduling/SchedulingService.ts

interface ScheduledWorkout {
  schedule_id: string;
  user_id: string;
  workout_id: string;
  original_scheduled_date: Date;
  actual_scheduled_date: Date;
  scheduled_time: 'AM' | 'PM' | string;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  workout_type: string;
  is_user_modified: boolean;
  conflict_warnings: ConflictWarning[];
}

interface ConflictWarning {
  type: 'heavy_legs_before_long_run' | 'insufficient_recovery' | 'volume_spike';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

class SchedulingService {
  async rescheduleWorkout(
    scheduleId: string,
    newDate: Date
  ): Promise<{ success: boolean; conflicts: ConflictWarning[] }> {
    // 1. Get workout being moved
    const workout = await db.scheduled_workouts.findUnique({
      where: { schedule_id: scheduleId },
      include: { workout: true }
    });
    
    // 2. Check conflicts on new date
    const conflicts = await this.detectConflicts(
      workout.user_id,
      newDate,
      workout.workout_