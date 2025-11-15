# Keyword Extraction and RAG Summary for VoiceFit AI Features

**Date:** 2025-01-24  
**Purpose:** Document keyword extraction patterns, smart namespace selection, and RAG context retrieval for all AI-powered features

---

## Overview

VoiceFit uses intelligent keyword extraction and smart namespace selection to route user communications to the most relevant RAG (Retrieval-Augmented Generation) knowledge bases. This document details:

1. What keywords we extract from user input
2. How the smart namespace selector works
3. What information gets sent to each RAG system
4. Database queries that support context retrieval

---

## 1. Exercise Swap Feature

### Classification Keywords (High Priority)
Detected via `chat_classifier.py` → triggers `exercise_swap` intent

**Primary Keywords:**
- `swap`
- `replace`
- `substitute`
- `alternative`
- `instead of`
- `can't do` / `cant do`
- `change`

**Example Phrases:**
- "Swap bench press"
- "Replace deadlift with something else"
- "Give me alternative to squat"
- "Can't do bench press"
- "What else can I do instead of overhead press"

### Extracted Information
```json
{
  "message_type": "exercise_swap",
  "confidence": 0.7-1.0,
  "extracted_data": {
    "exercise_name": "bench press",
    "reason": "injury" | "pain" | "equipment" | null
  }
}
```

### RAG / Database Context
**Source:** Supabase `exercise_substitutions` table (NOT Upstash RAG)

**Query Filters:**
1. `exercise_name` (exact match or fuzzy match)
2. `injured_body_part` (if reason includes injury/pain)
3. `similarity_score >= 0.60` (minimum threshold)
4. `reduced_stress_area` matches injured body part
5. Returns top 3 substitutes sorted by similarity score

**Context Retrieved:**
- Original exercise name
- Substitute exercise name + metadata
- Similarity score (0.60-1.0)
- Movement pattern (e.g., horizontal_push)
- Primary muscles (EMG-backed)
- Equipment required
- Difficulty level
- Reduced stress area (shoulder, lower_back, knee, elbow, hip)
- Scientific notes

**WatermelonDB Check (TODO):**
- Current workout session
- Exercise in active program
- User's equipment availability

---

## 2. Workout Logging (Voice Parsing)

### Classification Keywords
Detected via `chat_classifier.py` → triggers `workout_log` intent

**Primary Indicators:**
- **Numbers:** Any digits (weights, reps, sets)
- **Workout Terms:** reps, pounds, lbs, kg, kilos, for, x, sets, RPE, RIR

**Example Phrases:**
- "185 for 8"
- "bench press 225 pounds 5 reps"
- "same weight for 10"
- "135 lbs for 12 reps RPE 8"

### Extracted Information (via Kimi K2 Turbo Preview)
```json
{
  "exercise_id": "uuid",
  "exercise_name": "Barbell Bench Press",
  "exercise_match_score": 0.92,
  "weight": 225.0,
  "weight_unit": "lbs",
  "reps": 8,
  "rpe": 8,
  "rir": 2,
  "confidence": 0.88
}
```

### RAG Context (Upstash Search)
**Namespace:** `exercises` (452 exercises)

**Semantic Search Query:** User's spoken exercise name (e.g., "bench press")

**Context Retrieved:**
- Exercise ID (UUID)
- Canonical exercise name
- Match score (semantic similarity)
- Exercise metadata (muscle groups, equipment, movement pattern)

**Session Context (Not RAG):**
- Current exercise in session
- Previous sets (for "same weight" reference)
- Set number (for PR detection)
- Session ID

**Database Queries:**
1. Fetch current workout session (`workout_sessions` table)
2. Fetch previous sets in session (`sets` table + `exercises` join)
3. Check for personal records (`sets` historical data)

**WatermelonDB Check:**
- Active workout session
- Exercise history
- Personal records

---

## 3. Injury Analysis (Premium Feature)

### Classification Keywords
Detected via `injury_detection_rag_service.py` → triggers multi-namespace RAG search

#### 3.1 Core Injury Keywords
**Namespace Selected:** `injury-analysis` (always included)

**Keywords:**
- hurt, pain, injury, sore, ache, strain, tear

#### 3.2 Injury Type Keywords
**Namespace Selected:** `injury-management`

**Keywords:**
- strain, tear, pull, sprain, tendon, muscle

#### 3.3 Prevention Keywords
**Namespace Selected:** `injury-prevention`

**Keywords:**
- prevent, keep, recurring, chronic, always

#### 3.4 Exercise Modification Keywords
**Namespace Selected:** `exercise-substitution`

**Keywords:**
- substitute, alternative, replace, modify, can't do

#### 3.5 Mobility/Flexibility Keywords
**Namespace Selected:** `mobility-flexibility`

**Keywords:**
- tight, stiff, mobility, range of motion, rom, flexibility

#### 3.6 Recovery Keywords
**Namespace Selected:** `recovery-and-performance`

**Keywords:**
- heal, recover, rehab, getting better, improving

#### 3.7 Sport Type Detection
**Sport-Specific Namespaces:** `{sport}-injuries` (e.g., `powerlifting-injuries`, `running-injuries`)

**Powerlifting Keywords:**
- squat, bench, deadlift, powerlifting, meet, 1rm, max

**Running Keywords:**
- run, marathon, half marathon, 5k, 10k, pace, distance

**CrossFit Keywords:**
- crossfit, wod, metcon, amrap, emom

**Weightlifting Keywords:**
- snatch, clean, jerk, weightlifting, oly lifting

#### 3.8 Multiple Injury Detection
**Body Part Keywords:**
- shoulder, elbow, wrist, back, hip, knee, ankle
- hamstring, quad, calf, bicep, tricep, chest, neck

**Separators (splits notes into segments):**
- " and ", ", ", " also ", " plus "

**Logic:**
If 2+ body parts detected + separator → analyze each injury segment separately

### Extracted Information
```json
{
  "notes": "Right shoulder pain during bench press and left knee tightness",
  "sport_type": "powerlifting",
  "injury_segments": [
    "Right shoulder pain during bench press",
    "left knee tightness"
  ],
  "selected_namespaces": [
    "injury-analysis",
    "injury-management",
    "mobility-flexibility",
    "powerlifting-injuries"
  ]
}
```

### RAG Context (Grok 4 Fast Reasoning + Upstash Search)
**Namespaces Searched:** 2-5 most relevant (selected via keyword matching)

**For Each Namespace:**
1. Semantic search with user's injury notes
2. Top 5 results per namespace (total ~10-25 context chunks)

**Context Retrieved from RAG:**
- Injury descriptions and mechanisms
- Recovery protocols and timelines
- Exercise modifications
- Sport-specific injury patterns
- Mobility exercises
- Scientific evidence (EMG studies, biomechanics)

### Database Context (Fetched from Supabase)
**1. Injury History Query:**
```sql
SELECT * FROM injury_logs
WHERE user_id = '{user_id}'
ORDER BY created_at DESC
LIMIT 10
```

**Retrieved:**
- Past injuries (body part, severity, type)
- Injury dates and durations
- Recovery timelines
- Recurring patterns

**2. Training Load Query:**
```sql
SELECT w.workout_date, w.workout_type, w.duration_minutes,
       s.exercise_id, e.name, s.weight, s.reps, s.rpe
FROM workout_logs w
JOIN sets s ON s.workout_id = w.id
JOIN exercises e ON e.id = s.exercise_id
WHERE w.user_id = '{user_id}'
  AND w.workout_date >= NOW() - INTERVAL '14 days'
ORDER BY w.workout_date DESC
```

**Retrieved:**
- Recent workout volume (14 days)
- Exercise frequency
- Weight progression
- RPE trends (fatigue indicators)
- Training volume spikes (injury risk factor)

**3. User Profile Context:**
- Experience level (beginner, intermediate, advanced)
- Training goals
- Equipment availability
- Injury preferences (conservative vs aggressive)

### Follow-Up Question Generation
**Triggered When:**
- Low confidence (<0.65)
- Ambiguous injury description
- Missing critical info (severity, onset, pain type)

**Example Follow-Ups:**
- "When did you first notice the pain?"
- "Is the pain sharp or dull?"
- "Does it hurt during the movement or after?"
- "On a scale of 1-10, how severe is the pain?"

### Confidence Calibration
**Historical Tracking:** `calibration_history.json`

**Factors:**
- Namespace match quality
- RAG context relevance
- User feedback (was analysis helpful?)
- Prediction accuracy over time

---

## 4. AI Coach Questions

### Classification Keywords
Detected via `ai_coach_service.py` → triggers smart namespace selection

#### 4.1 Injury Questions (Highest Priority)
**Namespaces Selected:** `injury-analysis`, `injury-management` (top 2)

**Keywords:**
- hurt, pain, injury, sore, ache, strain, tear

#### 4.2 Technique/Form Questions
**Namespaces Selected:** `technique-and-form` related

**Keywords:**
- form, technique, depth, mobility, flexibility, range of motion

#### 4.3 Nutrition Questions
**Namespaces Selected:** `nutrition` related

**Keywords:**
- protein, calories, diet, nutrition, eat, food

#### 4.4 Recovery/Deload Questions
**Namespaces Selected:** `recovery` related

**Keywords:**
- deload, recovery, rest, fatigue, tired, overtraining

#### 4.5 Cardio/Running Questions
**Namespaces Selected:** `cardio`, `running` related

**Keywords:**
- run, marathon, cardio, conditioning, endurance

#### 4.6 Plateau Questions
**Namespaces Selected:** `plateau`, `progression` related

**Keywords:**
- stuck, plateau, stall, not progressing

#### 4.7 Hypertrophy Questions
**Namespaces Selected:** `hypertrophy`, `muscle-building` related

**Keywords:**
- bigger, muscle, hypertrophy, size, mass, grow

#### 4.8 Strength Questions
**Namespaces Selected:** `strength`, `powerlifting` related

**Keywords:**
- stronger, strength, powerlifting, 1rm, max

### Extracted Information
```json
{
  "question": "How can I fix my squat depth?",
  "selected_namespaces": ["technique-and-form", "mobility-flexibility"],
  "user_context": {
    "experience_level": "intermediate",
    "training_goal": "strength",
    "recent_workouts": [...]
  }
}
```

### RAG Context (Grok 4 Fast Reasoning + Upstash Parallel Search)
**Namespaces Searched:** 1-3 most relevant (smart selection)

**For Each Namespace:**
1. Parallel semantic search (reduces latency)
2. Top 5-10 results per namespace
3. Streaming response (reduces perceived latency)

**Context Retrieved:**
- Relevant knowledge base articles
- Exercise techniques
- Program design principles
- Scientific studies
- Expert recommendations

**User Context (Not RAG):**
- Onboarding data (goals, experience, equipment)
- Recent workout history
- Current program (if any)
- Personality preferences (tone, detail level)

---

## 5. Smart Namespace Selection Strategy

### Selection Logic
1. **Keyword Matching:** Scan user input for category keywords
2. **Priority Ordering:** Higher priority categories selected first (injury > technique > strength)
3. **Namespace Limit:** Return 1-5 most relevant (balance context vs. latency)
4. **Default Fallback:** If no keywords match, use general fitness namespace

### Performance Optimizations
- **Parallel Search:** Query multiple namespaces simultaneously
- **Result Limits:** 5-10 chunks per namespace (max ~50 total)
- **Caching:** Frequently accessed namespace mappings cached
- **Streaming:** Start response generation while retrieving context

---

## 6. Database Checks Before RAG (Per Your Rules)

### Always Check First (Database Rules)
Before sending to RAG, verify existing data:

1. **Exercise Swap:**
   - Check `exercise_substitutions` table for existing mappings
   - Query `workout_logs` and `sets` for current workout session
   - Check WatermelonDB for offline workout data

2. **Workout Logging:**
   - Query `exercises` table for exercise ID (before RAG exercise search)
   - Check `workout_sessions` for active session
   - Query `sets` for previous sets in session (for "same weight" reference)

3. **Injury Analysis:**
   - Query `injury_logs` for user's injury history (BEFORE RAG)
   - Query `workout_logs` + `sets` for training load (14-day window)
   - Query `user_profiles` for sport type, experience level

4. **AI Coach:**
   - Query `user_onboarding` for user context
   - Query recent `workout_logs` for training context
   - Check `injury_logs` for relevant injury history

### Semantic Search - Not Just Exact Matches
- Exercise names: "bench press" → "barbell bench press", "db bench", "floor press"
- Injuries: "shoulder pain" → "rotator cuff", "impingement", "anterior deltoid strain"
- Body parts: "knee" → "patella", "meniscus", "patellar tendon", "ACL"

---

## 7. Summary Table

| Feature | Classification Method | Primary Keywords | RAG Source | Database Tables | Context Limit |
|---------|----------------------|------------------|------------|-----------------|---------------|
| **Exercise Swap** | Grok 4 Fast | swap, replace, substitute | Supabase `exercise_substitutions` | exercises, workout_logs, sets | Top 3 |
| **Workout Logging** | Grok 4 Fast | numbers, reps, lbs, kg | Upstash `exercises` (452) | workout_sessions, sets, exercises | Top 1 match |
| **Injury Analysis** | Keyword-based | strain, pain, tear, chronic | Upstash multi-namespace (2-5) | injury_logs, workout_logs, sets | 5 per namespace |
| **AI Coach** | Keyword-based | injury, form, nutrition, etc. | Upstash smart selection (1-3) | user_onboarding, workout_logs | 5-10 per namespace |

---

## 8. Next Steps & Improvements

### Planned Enhancements
1. **Context Window Expansion:** Increase RAG context from 5→10 chunks for complex queries
2. **User Feedback Loop:** Track which substitutes users accept (improve similarity scoring)
3. **Equipment Filtering:** Filter exercise swaps by user's available equipment
4. **Voice Command Swap:** "Swap bench press for floor press" → direct voice swap
5. **Multi-Language Support:** Keyword detection in Spanish, French, German
6. **Workout Plan Context:** Consider current training block when suggesting swaps

### Testing Priorities
1. Test semantic search with misspellings and slang
2. Verify multi-injury detection with complex notes
3. Validate sport detection across different training styles
4. Ensure WatermelonDB queries match Supabase structure

---

**Last Updated:** 2025-01-24  
**Related Docs:**
- `INTERACTIVE_EXERCISE_SWAP_COMPLETE.md`
- `INJURY_DETECTION_ENHANCEMENTS_SUMMARY.md`
- `VOICE_COMMAND_GUIDE.md`
