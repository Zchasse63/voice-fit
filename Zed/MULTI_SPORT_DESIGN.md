# Multi-Sport Support & Warmup/Cooldown Design Specification

## Overview
VoiceFit expands beyond strength training to support multiple sports (running, cycling, swimming, CrossFit, etc.) with sport-specific programming, warmup/cooldown routines, and unified tracking.

## Architecture

### Database Schema

**programs table** (existing - add sport_type column):
```sql
ALTER TABLE programs ADD COLUMN sport_type VARCHAR(50) DEFAULT 'strength';
-- Values: strength, running, cycling, swimming, crossfit, hybrid
```

**workouts table** (existing - add warmup/cooldown columns):
```sql
ALTER TABLE workouts 
  ADD COLUMN warmup_routine JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN cooldown_routine JSONB DEFAULT '[]'::jsonb;
```

**warmup_cooldown_templates table** (new):
```sql
CREATE TABLE warmup_cooldown_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('warmup', 'cooldown')),
  sport_type VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  exercises JSONB NOT NULL, -- [{name, duration_seconds, sets, reps, notes}]
  focus_areas TEXT[], -- ['mobility', 'activation', 'recovery', 'stretching']
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warmup_cooldown_sport ON warmup_cooldown_templates(sport_type, type);
CREATE INDEX idx_warmup_cooldown_public ON warmup_cooldown_templates(is_public) WHERE is_public = TRUE;
```

### Core Components

#### 1. WarmupCooldownService
**Location**: `apps/backend/warmup_cooldown_service.py` (already exists)

**Key Methods**:
- `generate_warmup(sport_type, workout_focus, duration_min)` - AI-generated warmup
- `generate_cooldown(sport_type, workout_intensity, duration_min)` - AI-generated cooldown
- `get_templates(sport_type, type)` - Fetch pre-built templates
- `create_template(name, type, sport_type, exercises)` - Save custom template

**AI Model**: xAI Grok-4-fast-reasoning

**Warmup Structure**:
```json
{
  "duration_minutes": 10,
  "exercises": [
    {
      "name": "Dynamic Leg Swings",
      "duration_seconds": 60,
      "sets": 2,
      "reps": 10,
      "notes": "Focus on hip mobility"
    },
    {
      "name": "Bodyweight Squats",
      "duration_seconds": 45,
      "sets": 1,
      "reps": 15,
      "notes": "Activate glutes and quads"
    }
  ],
  "focus_areas": ["mobility", "activation"],
  "instructions": "Start slow, gradually increase range of motion"
}
```

**Cooldown Structure**:
```json
{
  "duration_minutes": 8,
  "exercises": [
    {
      "name": "Quad Stretch",
      "duration_seconds": 30,
      "sets": 2,
      "reps": null,
      "notes": "Hold each side for 30 seconds"
    },
    {
      "name": "Foam Roll IT Band",
      "duration_seconds": 60,
      "sets": 1,
      "reps": null,
      "notes": "Slow, controlled movements"
    }
  ],
  "focus_areas": ["stretching", "recovery"],
  "instructions": "Hold stretches, don't bounce"
}
```

#### 2. Sport-Specific Program Generation

**ProgramGenerationService Updates**:
- Add `sport_type` parameter to `generate_program()`
- Use sport-specific RAG namespaces (running, cycling, swimming)
- Apply sport-specific periodization patterns
- Include warmup/cooldown in each workout

**Sport Types**:
- **Strength**: Barbell/dumbbell training, powerlifting, bodybuilding
- **Running**: Road running, trail running, marathon training
- **Cycling**: Road cycling, mountain biking, indoor cycling
- **Swimming**: Pool swimming, open water, triathlon
- **CrossFit**: Mixed modal training, WODs
- **Hybrid**: Combination of multiple sports

**Example Prompt Addition**:
```
Sport Type: Running
Include sport-specific warmup (dynamic stretches, activation drills) and cooldown (static stretches, foam rolling) for each workout.
```

### Integration Points

#### 1. Program Generation
**File**: `apps/backend/program_generation_service.py`

**Integration**:
- Accept `sport_type` parameter
- Call `warmup_cooldown_service.generate_warmup()` for each workout
- Call `warmup_cooldown_service.generate_cooldown()` for each workout
- Include warmup/cooldown in program JSON

**Example**:
```python
# Generate warmup for workout
warmup = warmup_cooldown_service.generate_warmup(
    sport_type=sport_type,
    workout_focus=workout.get('focus', 'general'),
    duration_min=10
)

# Add to workout
workout['warmup_routine'] = warmup['exercises']
workout['warmup_duration_min'] = warmup['duration_minutes']
```

#### 2. Scheduling
**File**: `apps/backend/schedule_optimization_service.py`

**Integration**:
- Include warmup/cooldown duration in total workout time
- Adjust conflict detection to account for warmup/cooldown
- Suggest warmup/cooldown based on workout intensity

**Example**:
```python
total_duration = (
    workout_duration_min + 
    warmup_duration_min + 
    cooldown_duration_min
)
```

#### 3. Mobile UI

**WorkoutDetailScreen Updates**:
**Location**: `apps/mobile/src/screens/WorkoutDetailScreen.tsx`

**Add Sections**:
1. **Warmup Section** (collapsible)
   - List of warmup exercises
   - Duration for each
   - Play button to start warmup timer

2. **Main Workout Section** (existing)

3. **Cooldown Section** (collapsible)
   - List of cooldown exercises
   - Duration for each
   - Play button to start cooldown timer

**New Components**:
- `WarmupCooldownSection.tsx` - Displays warmup/cooldown exercises
- `SportSelector.tsx` - Dropdown to select sport type

### API Endpoints

**Already Implemented** (`apps/backend/main.py`):
- `POST /api/warmup/generate` - Generate warmup
- `POST /api/cooldown/generate` - Generate cooldown
- `GET /api/warmup/templates` - Get warmup templates
- `GET /api/cooldown/templates` - Get cooldown templates
- `POST /api/warmup/templates` - Create custom template

**New Endpoints Needed**:
- `PATCH /api/programs/{program_id}` - Update program sport_type
- `PATCH /api/workouts/{workout_id}/warmup` - Update workout warmup
- `PATCH /api/workouts/{workout_id}/cooldown` - Update workout cooldown

### WatermelonDB Updates

**ScheduledWorkout model** (add warmup/cooldown fields):
```typescript
@field('warmup_routine') warmupRoutine!: string; // JSON string
@field('cooldown_routine') cooldownRoutine!: string; // JSON string
@field('warmup_duration_min') warmupDurationMin!: number;
@field('cooldown_duration_min') cooldownDurationMin!: number;
```

**Migration**:
```typescript
{
  toVersion: 9,
  steps: [
    addColumns({
      table: 'scheduled_workouts',
      columns: [
        { name: 'warmup_routine', type: 'string', isOptional: true },
        { name: 'cooldown_routine', type: 'string', isOptional: true },
        { name: 'warmup_duration_min', type: 'number', isOptional: true },
        { name: 'cooldown_duration_min', type: 'number', isOptional: true },
      ],
    }),
  ],
}
```

### Success Metrics

1. **Warmup/Cooldown Completion Rate**: % of workouts with completed warmup/cooldown
2. **Injury Rate**: Track injury reports before/after warmup/cooldown implementation
3. **User Satisfaction**: Survey users on warmup/cooldown quality
4. **Multi-Sport Adoption**: % of users creating programs for multiple sports

### Future Enhancements

1. **Video Demonstrations**: Add video links for warmup/cooldown exercises
2. **Adaptive Warmup**: Adjust warmup based on readiness score
3. **Sport-Specific Metrics**: Track sport-specific metrics (pace, power, etc.)
4. **Cross-Training Recommendations**: Suggest complementary sports
5. **Recovery Protocols**: Sport-specific recovery recommendations

