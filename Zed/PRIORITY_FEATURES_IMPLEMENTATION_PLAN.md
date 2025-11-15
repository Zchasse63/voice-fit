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

#### Android Foreground Notification

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

### Sprint 2 Breakdown

**Week 4: iOS Native Implementation**
- [ ] Create WorkoutActivityAttributes.swift
- [ ] Implement Live Activity widget
- [ ] Build Dynamic Island UI
- [ ] Test on iPhone 14 Pro (Dynamic Island)
- [ ] Test on iPhone 12 (standard Live Activity)

**Week 5: React Native Bridge**
- [ ] Create iOS native module bridge
- [ ] Implement LiveActivityManager.ts
- [ ] Connect to WorkoutStateManager
- [ ] Handle app lifecycle (background, terminated)
- [ ] Test state persistence

**Week 6: Android & Polish**
- [ ] Implement Android foreground notification
- [ ] Match iOS feature parity
- [ ] Handle voice command deep link
- [ ] E2E testing on both platforms
- [ ] Beta test with 30 users

### Success Criteria (Sprint 2)

✅ Live Activity appears on lock screen within 2 seconds of workout start  
✅ Timers update in real-time (every second)  
✅ Voice button works from lock screen  
✅ Dynamic Island shows workout info (iPhone 14 Pro+)  
✅ Activity persists across app backgrounds  
✅ Android notification matches iOS functionality  
✅ 90% of beta users rate experience 4+/5

---

## Feature 3: Program Scheduling & Calendar View

**Timeline:** Weeks 7-9 (Sprint 3)  
**Priority:** HIGH  
**Complexity:** High  
**Team:** 2 Mobile Devs + 1 Backend Dev

### Goals

1. Visual calendar showing all scheduled workouts
2. Drag-and-drop rescheduling
3. Conflict detection (e.g., heavy legs before long run)
4. Multi-week program visualization
5. Travel mode for schedule adjustments

### Technical Specifications

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