# Advanced Personalization Design Specification

## Overview
VoiceFit's advanced personalization system learns user preferences through both explicit settings and conversational interactions, enabling highly tailored workout programs and coaching experiences.

## Architecture

### Database Schema

**user_preferences table** (already implemented):
- Workout preferences (duration, days, time, frequency)
- Equipment preferences (available, preferred)
- Exercise preferences (favorites, dislikes, restrictions)
- Training style (rep ranges, rest periods, supersets, dropsets)
- Recovery preferences (deload frequency, rest days)
- Nutrition preferences (dietary restrictions, targets)
- Communication preferences (coaching style, feedback frequency)

**conversational_preference_updates table** (already implemented):
- Tracks preference changes from chat/voice
- Stores conversation context and confidence scores
- Audit trail for AI-extracted preferences

### Core Components

#### 1. PersonalizationService
**Location**: `apps/backend/personalization_service.py`

**Key Methods**:
- `get_user_preferences(user_id)` - Retrieve preferences with defaults
- `update_preference(user_id, key, value, source)` - Update single preference
- `extract_preferences_from_conversation(user_id, message, current_prefs)` - AI extraction
- `_log_conversational_update()` - Audit trail for conversational updates

**AI Model**: xAI Grok-4-fast-reasoning

**Confidence Thresholds**:
- ≥0.8: Auto-apply preference update
- 0.5-0.8: Suggest to user for confirmation
- <0.5: Ignore (too uncertain)

#### 2. Preference Extraction Patterns

**Common Patterns**:
```
"I only have 30 minutes" → preferred_workout_duration_min: 30
"I can't do overhead press" → disliked_exercises: add "overhead_press"
"I prefer morning workouts" → preferred_workout_time: "morning"
"I want to train 5 days a week" → max_workouts_per_week: 5
"I don't have a barbell" → available_equipment: remove "barbell"
"I love deadlifts" → favorite_exercises: add "deadlift"
```

**AI Prompt Structure**:
- Current preferences context
- User message
- Pattern examples
- JSON response format with confidence scores

### Integration Points

#### 1. Program Generation
**File**: `apps/backend/program_generation_service.py`

**Integration**:
- Fetch user preferences before generating program
- Filter exercises based on available_equipment
- Exclude disliked_exercises
- Prioritize favorite_exercises
- Apply preferred_rep_ranges and rest_periods
- Respect max_workouts_per_week and preferred_workout_days

**Example**:
```python
preferences = personalization_service.get_user_preferences(user_id)
available_equipment = preferences.get("available_equipment", [])
disliked_exercises = preferences.get("disliked_exercises", [])

# Filter exercise pool
exercises = [ex for ex in all_exercises 
             if ex.equipment in available_equipment 
             and ex.name not in disliked_exercises]
```

#### 2. Chat Integration
**File**: `apps/backend/ai_coach_service.py`

**Integration**:
- Extract preferences from every user message
- Apply high-confidence updates automatically
- Notify user of preference changes
- Include preferences in UserContextBuilder

**Flow**:
1. User sends message
2. PersonalizationService.extract_preferences_from_conversation()
3. Auto-apply updates with confidence ≥0.8
4. Log to conversational_preference_updates table
5. Include in chat response: "Got it! I've updated your preferences..."

#### 3. UserContextBuilder
**File**: `apps/backend/user_context_builder.py`

**Add Section**:
```
**User Preferences:**
- Workout Duration: 45 minutes
- Training Days: Mon, Wed, Fri, Sat
- Available Equipment: barbell, dumbbells, bench, pull-up bar
- Disliked Exercises: overhead press (shoulder mobility)
- Coaching Style: motivational
```

### Mobile UI

#### PreferencesScreen
**Location**: `apps/mobile/src/screens/PreferencesScreen.tsx`

**Sections**:
1. **Workout Preferences**
   - Duration slider (15-120 min)
   - Days per week selector
   - Preferred time (morning/afternoon/evening/flexible)

2. **Equipment**
   - Multi-select checkboxes
   - Common equipment + custom add

3. **Exercise Preferences**
   - Favorite exercises (searchable multi-select)
   - Disliked exercises (searchable multi-select)
   - Exercise restrictions (exercise + reason)

4. **Training Style**
   - Rep range preferences (strength/hypertrophy/endurance)
   - Rest period preferences
   - Supersets/dropsets toggles

5. **Recovery**
   - Deload frequency
   - Rest days per week

6. **Communication**
   - Coaching style (motivational/technical/balanced/concise)
   - Feedback frequency (minimal/moderate/frequent)

**Features**:
- Real-time save (debounced)
- Conversational updates badge ("Updated from chat")
- Reset to defaults button

### API Endpoints

**Already Implemented**:
- `GET /api/preferences/{user_id}` - Get preferences
- `PATCH /api/preferences/{user_id}` - Update preferences
- `POST /api/preferences/extract` - Extract from conversation

### Testing Strategy

**Unit Tests** (`test_personalization.py`):
- ✅ Preference retrieval
- ✅ Preference updates
- ✅ AI extraction
- ✅ Validation
- ✅ Default preferences

**Integration Tests**:
- Chat → preference extraction → program generation
- UI update → database → program regeneration
- Conversational update audit trail

### Success Metrics

1. **Preference Capture Rate**: % of users with >5 preferences set
2. **Conversational Extraction Accuracy**: % of AI-extracted preferences confirmed by users
3. **Program Satisfaction**: User ratings after preference-based programs
4. **Preference Stability**: % of preferences unchanged after 30 days

### Future Enhancements

1. **Preference Learning**: ML model to predict preferences from behavior
2. **Preference Conflicts**: Detect and resolve conflicting preferences
3. **Preference Recommendations**: Suggest preferences based on similar users
4. **Preference History**: Track preference changes over time
5. **Preference Export/Import**: Share preferences across devices

