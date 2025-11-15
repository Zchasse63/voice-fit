# VoiceFit Keyword Extraction Quick Reference

**For developers working on chat classification, RAG selection, and AI features**

---

## 🔍 Chat Intent Classification

### Exercise Swap
```python
Keywords: ["swap", "replace", "substitute", "alternative", "instead of", "can't do", "change"]
Example: "Swap bench press" → exercise_swap
Database: exercise_substitutions table
RAG: None (direct DB lookup)
```

### Workout Logging
```python
Keywords: numbers + ["reps", "pounds", "lbs", "kg", "for", "x", "sets", "RPE"]
Example: "185 for 8" → workout_log
Database: workout_sessions, sets, exercises
RAG: Upstash "exercises" namespace (452 exercises)
```

### Question
```python
Keywords: ["how", "what", "why", "when", "should", "can", "?"]
Example: "How do I improve my bench press?" → question
Database: user_onboarding, workout_logs
RAG: Smart namespace selection (1-3 namespaces)
```

---

## 🏥 Injury Analysis Namespaces

### Always Included
- `injury-analysis` (core namespace, always searched)

### Keyword-Based Selection

| Keywords | Namespace | Priority |
|----------|-----------|----------|
| `strain, tear, pull, sprain, tendon, muscle` | `injury-management` | High |
| `prevent, chronic, recurring, always` | `injury-prevention` | Medium |
| `substitute, alternative, replace, modify` | `exercise-substitution` | Medium |
| `tight, stiff, mobility, ROM, flexibility` | `mobility-flexibility` | High |
| `heal, recover, rehab, improving` | `recovery-and-performance` | Medium |

### Sport-Specific Namespaces

| Sport Detection | Namespace | Keywords |
|----------------|-----------|----------|
| Powerlifting | `powerlifting-injuries` | squat, bench, deadlift, meet, 1RM |
| Running | `running-injuries` | run, marathon, 5k, 10k, pace |
| CrossFit | `crossfit-injuries` | wod, metcon, amrap, emom |
| Weightlifting | `weightlifting-injuries` | snatch, clean, jerk, oly |

### Multi-Injury Detection
```python
Body Parts: ["shoulder", "elbow", "wrist", "back", "hip", "knee", 
             "ankle", "hamstring", "quad", "calf", "bicep", "tricep"]
Separators: [" and ", ", ", " also ", " plus "]

Logic: If 2+ body parts + separator → split and analyze separately
```

---

## 💬 AI Coach Namespace Selection

### Priority Order (First Match Wins)

1. **Injury** (Highest Priority)
   - Keywords: `hurt, pain, injury, sore, ache, strain, tear`
   - Namespaces: `injury-analysis`, `injury-management`

2. **Technique/Form**
   - Keywords: `form, technique, depth, mobility, flexibility, range of motion`
   - Namespaces: `technique-and-form`, `mobility-flexibility`

3. **Nutrition**
   - Keywords: `protein, calories, diet, nutrition, eat, food`
   - Namespaces: `nutrition`

4. **Recovery/Deload**
   - Keywords: `deload, recovery, rest, fatigue, tired, overtraining`
   - Namespaces: `recovery-and-performance`

5. **Cardio/Running**
   - Keywords: `run, marathon, cardio, conditioning, endurance`
   - Namespaces: `cardio`, `running`

6. **Plateau**
   - Keywords: `stuck, plateau, stall, not progressing`
   - Namespaces: `plateau`, `progression`

7. **Hypertrophy**
   - Keywords: `bigger, muscle, hypertrophy, size, mass, grow`
   - Namespaces: `hypertrophy`, `muscle-building`

8. **Strength**
   - Keywords: `stronger, strength, powerlifting, 1RM, max`
   - Namespaces: `strength`, `powerlifting`

---

## 🗄️ Database Checks (Before RAG)

### Rule: Always check database FIRST, then RAG

```python
# Exercise Swap
1. exercise_substitutions (Supabase) - check for existing mappings
2. workout_logs (WatermelonDB) - get active session
3. sets (WatermelonDB) - get current exercise

# Workout Logging
1. workout_sessions (WatermelonDB) - check active session
2. sets (WatermelonDB) - get previous sets ("same weight")
3. pr_history (WatermelonDB) - check for PR
4. exercises (Supabase) - semantic search for exercise ID

# Injury Analysis
1. injury_logs (Supabase) - get history (last 10)
2. workout_logs (Supabase) - get 14-day training load
3. sets (Supabase) - get volume/intensity data
4. user_profiles (Supabase) - get sport type, experience

# AI Coach
1. user_onboarding (Supabase) - get user context
2. workout_logs (Supabase) - get recent training
3. injury_logs (Supabase) - get active injuries
4. readiness_scores (WatermelonDB) - get recent scores
```

---

## 🎯 Extracted Data Structures

### Exercise Swap
```json
{
  "message_type": "exercise_swap",
  "extracted_data": {
    "exercise_name": "bench press",
    "reason": "injury" | "pain" | "equipment" | null
  }
}
```

### Workout Logging
```json
{
  "exercise_id": "uuid",
  "exercise_name": "Barbell Bench Press",
  "weight": 225.0,
  "weight_unit": "lbs",
  "reps": 8,
  "rpe": 8,
  "confidence": 0.88
}
```

### Injury Analysis
```json
{
  "notes": "Right shoulder pain during bench press",
  "sport_type": "powerlifting",
  "injury_segments": ["Right shoulder pain..."],
  "selected_namespaces": [
    "injury-analysis",
    "injury-management",
    "powerlifting-injuries"
  ]
}
```

---

## ⚡ Performance Rules

```
✅ DO:
- Parallel namespace searches (100-200ms faster)
- Limit to 2-5 namespaces per query
- Cache session context in memory
- Stream responses immediately
- Use WatermelonDB for instant offline reads

❌ DON'T:
- Search all namespaces (too slow)
- Make sequential API calls (use parallel)
- Query database repeatedly (cache results)
- Wait for full response before streaming
- Hardcode namespace lists (use keyword matching)
```

---

## 🔧 Code Patterns

### Keyword Detection (Python)
```python
# Simple keyword check
injury_keywords = ["hurt", "pain", "injury", "sore"]
has_injury = any(kw in message.lower() for kw in injury_keywords)

# Multi-keyword with priority
if any(kw in msg for kw in swap_keywords):
    return "exercise_swap"
elif any(kw in msg for kw in injury_keywords):
    return "injury_alert"
```

### Namespace Selection (Python)
```python
def select_namespaces(query: str) -> List[str]:
    selected = ["injury-analysis"]  # Always include
    
    if any(kw in query for kw in ["strain", "tear"]):
        selected.append("injury-management")
    
    if any(kw in query for kw in ["tight", "stiff"]):
        selected.append("mobility-flexibility")
    
    return selected[:5]  # Limit to 5 max
```

### Database Check Pattern (TypeScript)
```typescript
// ALWAYS query DB before RAG
const session = await db.collections
  .get<WorkoutLog>('workout_logs')
  .query(Q.where('user_id', userId), Q.sortBy('start_time', Q.desc))
  .fetch();

if (session.length > 0) {
  // Use session context
} else {
  // Proceed with RAG only
}
```

---

## 🧪 Testing Checklist

```
Exercise Swap:
[ ] "Swap bench press" → exercise_swap, extracts "bench press"
[ ] "Can't do squats" → exercise_swap, extracts "squats"
[ ] "Replace with dumbbells" → exercise_swap, extracts reason

Workout Logging:
[ ] "185 for 8" → workout_log, parses weight+reps
[ ] "same weight" → uses previous set context
[ ] "225 lbs 5 reps RPE 9" → parses all fields

Injury Analysis:
[ ] "shoulder pain and knee ache" → detects 2 injuries
[ ] "bench press hurt shoulder" → detects powerlifting sport
[ ] Queries injury_logs BEFORE RAG call

Multi-Keyword:
[ ] "tight shoulder from bench press" → selects mobility + powerlifting namespaces
[ ] Unknown slang/misspelling → fallback classifier works
```

---

## 📚 Related Files

- `chat_classifier.py` - Main classification logic
- `injury_detection_rag_service.py` - Injury namespace selection
- `ai_coach_service.py` - AI Coach namespace selection
- `integrated_voice_parser.py` - Workout logging + RAG
- `exercise_substitution_service.ts` - Exercise swap DB queries

---

**Last Updated:** 2025-01-24  
**Full Docs:** See `KEYWORD_EXTRACTION_AND_RAG_SUMMARY.md` for comprehensive details