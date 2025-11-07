# Complete AI Training Data Requirements for VoiceFit

**Version:** 1.0  
**Date:** 2025-01-06  
**Purpose:** Comprehensive analysis of ALL training data needed for unified AI model

---

## Executive Summary

After comprehensive analysis of the VoiceFit codebase and UI/UX specifications, we've identified **ALL** training data requirements for a unified AI model.

### Current State
- ✅ **Voice parsing:** 3,890 examples (fine-tuned, 95.57% accuracy)
- ❌ **Injury analysis:** Using base model (needs fine-tuning)

### Additional Data Needed

| Category | Examples Needed | Priority | Phase |
|----------|----------------|----------|-------|
| **Injury Analysis** | 500-1,000 | P0 | Phase 1 (Now) |
| **Running/Cardio Analysis** | 300-500 | P1 | Phase 2 (3-6 mo) |
| **AI Coach Q&A (Strength)** | 1,000-2,000 | P1 | Phase 2 (3-6 mo) |
| **Workout Insights (Strength)** | 500-1,000 | P1 | Phase 2 (3-6 mo) |
| **Exercise Substitution Explanations** | 300-500 | P2 | Phase 3 (6-12 mo) |
| **Program Generation** | 200-500 | P3 | Phase 3 (6-12 mo) |

**Total Estimated Examples:** 6,690-9,890 (including existing 3,890)

---

## 1. Voice Parsing (COMPLETE ✅)

**Status:** Already fine-tuned and deployed  
**Training Data:** 3,890 examples  
**Location:** `archive/fine-tuning/voice_training_data_final_merged.jsonl`  
**Accuracy:** 95.57% weight, 99.74% reps, 98.18% RPE

**Capabilities:**
- Parse natural language voice commands
- Extract exercise name, weight, reps, RPE, RIR
- Handle abbreviations (RDL, OHP, db)
- Handle "same weight" references
- Confidence scoring

**No additional data needed** - working well!

---

## 2. Injury Analysis (PRIORITY P0 - Phase 1)

**Status:** Currently using base model (needs fine-tuning)  
**Training Data Needed:** 500-1,000 examples  
**Timeline:** 3-4 weeks

### What It Needs to Do

1. **Detect injuries** from natural language descriptions
2. **Extract body parts** accurately (shoulder, knee, lower back, etc.)
3. **Classify severity** (mild, moderate, severe)
4. **Identify injury types** (strain, sprain, tendinitis, impingement, etc.)
5. **Detect red flags** requiring medical attention
6. **Distinguish** between injury and normal DOMS
7. **Recommend affected exercises** to avoid/modify
8. **Provide recovery recommendations**

### Training Data Categories

| Category | Examples | Description |
|----------|----------|-------------|
| Clear Injuries | 400 | Obvious injury indicators (sharp pain, popping, swelling) |
| Ambiguous Cases | 300 | Vague descriptions (soreness vs injury, tightness vs strain) |
| Normal DOMS | 200 | Not injuries (muscle soreness, pump, fatigue) |
| Red Flags | 100 | Serious symptoms requiring immediate medical attention |

### Example Training Data

**Input:** "sharp pain in my shoulder when I press overhead"

**Output:**
```json
{
  "injury_detected": true,
  "confidence": 0.90,
  "body_part": "shoulder",
  "severity": "moderate",
  "injury_type": "rotator_cuff_strain",
  "red_flags": ["sharp_pain", "overhead_movement"],
  "recommendations": ["rest_48_hours", "ice_therapy", "consult_pt"],
  "affected_exercises": ["Overhead Press", "Bench Press", "Dips"],
  "differential_diagnoses": ["impingement", "tendinitis"]
}
```

**Detailed Plan:** See `docs/INJURY_ANALYSIS_TRAINING_DATA_PLAN.md`

---

## 3. Running/Cardio Analysis (PRIORITY P1 - Phase 2)

**Status:** Basic GPS tracking implemented, AI features planned  
**Training Data Needed:** 300-500 examples  
**Timeline:** 3-6 months (after injury analysis)

### Current Running Features (No AI Needed)

✅ **Already Implemented:**
- GPS distance/pace/duration tracking
- Elevation gain/loss
- Route mapping
- Auto-pause detection
- Voice feedback every mile
- WatermelonDB storage

### Planned AI Features (Need Training Data)

#### 3.1 Weather-Adjusted Pace Analysis (150 examples)

**What it does:**
- Adjusts pace for temperature, wind, elevation, humidity
- Calculates "efficiency score" (0-100)
- Provides fitness progression insights

**Input:**
```json
{
  "distance": 5.12,
  "duration": 2382,
  "raw_pace": 7.75,
  "temperature": 85,
  "humidity": 72,
  "wind_speed": 12,
  "elevation_gain": 142,
  "elevation_loss": 156
}
```

**Output:**
```json
{
  "adjusted_pace": 7.32,
  "efficiency_score": 87,
  "adjustments": {
    "temperature": 0.25,
    "wind": 0.12,
    "elevation": 0.06
  },
  "insight": "Your 7:45/mi pace in 85°F heat is equivalent to 7:32/mi in ideal conditions. This is 4% faster than your expected pace - great job!",
  "recommendation": "Your fitness has improved! Try targeting 7:30 pace on your next run in similar conditions."
}
```

#### 3.2 Pace Recommendations (100 examples)

**What it does:**
- Recommends target pace based on historical data and current conditions
- Considers goal (distance, time, or pace)
- Provides reasoning

**Input:**
```json
{
  "goal_type": "distance",
  "goal_value": 5.0,
  "recent_runs": [
    {"distance": 5.0, "pace": 7.38, "temperature": 68},
    {"distance": 3.1, "pace": 7.12, "temperature": 72},
    {"distance": 5.0, "pace": 7.52, "temperature": 78}
  ],
  "current_conditions": {
    "temperature": 75,
    "wind_speed": 8,
    "elevation_profile": "moderate"
  }
}
```

**Output:**
```json
{
  "recommended_pace_min": 7.40,
  "recommended_pace_max": 7.50,
  "reasoning": "Based on your recent 5K times (avg 7:34/mi) and today's moderate conditions (75°F, 8mph wind), target 7:40-7:50/mi for a sustainable effort.",
  "confidence": 0.85
}
```

#### 3.3 Running Q&A (100 examples)

**What it does:**
- Answers user questions about running training
- Provides evidence-based advice
- Considers user's history and goals

**Examples:**
- "How do I improve my 5K time?"
- "Should I run in the heat?"
- "What's a good weekly mileage for marathon training?"
- "How often should I do speed work?"
- "Is it normal to feel sore after a long run?"

#### 3.4 Recovery Recommendations (50 examples)

**What it does:**
- Analyzes recent run frequency and intensity
- Recommends rest days or easy runs
- Prevents overtraining

**Input:**
```json
{
  "recent_runs": [
    {"date": "2025-01-06", "distance": 5.0, "intensity": "high"},
    {"date": "2025-01-05", "distance": 3.0, "intensity": "high"},
    {"date": "2025-01-04", "distance": 6.0, "intensity": "moderate"},
    {"date": "2025-01-03", "distance": 4.0, "intensity": "high"}
  ]
}
```

**Output:**
```json
{
  "recommendation": "rest_day",
  "reasoning": "You've run 4 days in a row with 3 high-intensity sessions. Your body needs recovery to adapt and prevent injury.",
  "alternative": "If you must run, do an easy 2-3 mile recovery run at conversational pace (9:00-9:30/mi)."
}
```

---

## 4. AI Coach Q&A - Strength Training (PRIORITY P1 - Phase 2)

**Status:** Planned (Tab 5 in UI/UX Spec)  
**Training Data Needed:** 1,000-2,000 examples  
**Timeline:** 3-6 months

### Capabilities

**Answer training questions:**
- Volume recommendations ("How much volume should I do for chest?")
- Deload timing ("When should I deload?")
- Plateau solutions ("Why am I not progressing on bench press?")
- Periodization concepts ("What's the difference between RPE and RIR?")
- Recovery science ("Should I train if I'm sore?")
- Form cues ("How do I improve my squat depth?")
- Progression strategies ("How do I add weight safely?")

### Training Data Categories

| Category | Examples | Description |
|----------|----------|-------------|
| Volume/Intensity | 300 | How much, how often, how hard |
| Periodization | 200 | Programming concepts, deloads, phases |
| Exercise Technique | 300 | Form cues, common mistakes |
| Recovery | 200 | Sleep, nutrition, rest days |
| Progression | 200 | Adding weight, reps, sets |
| Troubleshooting | 300 | Plateaus, pain, fatigue |
| General Knowledge | 200-500 | Exercise science, anatomy, physiology |

### Example Training Data

**User:** "How much volume should I do for chest?"

**Assistant:**
```
For hypertrophy (muscle growth), aim for 10-20 sets per week for chest, spread across 2-3 sessions.

Beginners: Start with 10-12 sets/week
Intermediate: 12-16 sets/week
Advanced: 16-20 sets/week

Example split:
- Day 1: Bench Press 4 sets, Incline DB Press 3 sets (7 sets)
- Day 2: Dips 3 sets, Cable Flyes 3 sets (6 sets)
Total: 13 sets/week

Monitor recovery - if you're not progressing or feeling beat up, reduce volume by 20%.
```

---

## 5. Workout Insights Generation (PRIORITY P1 - Phase 2)

**Status:** Planned (Home screen, Post-workout summary)  
**Training Data Needed:** 500-1,000 examples  
**Timeline:** 3-6 months

### Capabilities

**Analyze workout data and generate insights:**
- Volume warnings (too high/low)
- Deload recommendations
- PR predictions
- Form degradation alerts (RPE spike without weight increase)
- Plateau detection
- Weekly performance summaries

### Training Data Categories

| Category | Examples | Description |
|----------|----------|-------------|
| Volume Analysis | 200 | Too high, too low, optimal |
| Deload Detection | 150 | When to deload based on fatigue markers |
| PR Predictions | 150 | "You might hit 225×5 next week" |
| Form Degradation | 150 | RPE increased without weight change |
| Plateau Detection | 150 | Same weight for 3+ weeks |
| Weekly Summaries | 200 | Performance trends, recommendations |

### Example Training Data

**Input:**
```json
{
  "exercise": "Barbell Bench Press",
  "recent_sets": [
    {"date": "2025-01-06", "weight": 225, "reps": 8, "rpe": 7},
    {"date": "2025-01-03", "weight": 225, "reps": 8, "rpe": 7},
    {"date": "2024-12-30", "weight": 225, "reps": 8, "rpe": 7},
    {"date": "2024-12-27", "weight": 225, "reps": 8, "rpe": 7}
  ]
}
```

**Output:**
```json
{
  "insight_type": "plateau",
  "message": "You've hit the same weight (225 lbs × 8 reps) for 4 sessions in a row. Time to progress!",
  "recommendation": "Try 230 lbs × 8 reps next session. If you can't hit 8 reps, aim for 230 × 6-7 and build back up.",
  "confidence": 0.90
}
```

---

## 6. Exercise Substitution Explanations (PRIORITY P2 - Phase 3)

**Status:** Database-driven substitutions exist, AI explanations planned  
**Training Data Needed:** 300-500 examples  
**Timeline:** 6-12 months

### Current System (No AI)

✅ **Already Implemented:**
- 176 exercise substitution pairs with similarity scores
- Risk-aware algorithm (considers injury body parts)
- Database-driven recommendations

### Planned AI Enhancement

**What it adds:**
- Explain WHY a substitution is recommended
- Consider user's equipment, experience, injury history
- Provide form cues for new exercises
- Suggest progression pathways

### Example Training Data

**Input:**
```json
{
  "original_exercise": "Barbell Bench Press",
  "reason": "shoulder_pain",
  "user_equipment": ["dumbbells", "cables", "bands"],
  "user_experience": "intermediate"
}
```

**Output:**
```
I recommend Dumbbell Bench Press (88% similarity) because:

1. **Reduces shoulder stress:** Independent arm movement allows natural shoulder positioning, reducing impingement risk
2. **Same muscle groups:** Targets chest, triceps, and anterior deltoids
3. **Equipment available:** You have dumbbells
4. **Load recommendation:** Start with 40kg dumbbells (equivalent to ~88kg barbell load)

Form cues:
- Keep shoulder blades retracted throughout the movement
- Lower dumbbells to chest level, not below (reduces shoulder strain)
- Press in a slight arc, bringing dumbbells together at the top
- Use a neutral grip if shoulder still bothers you

Progression: Once shoulder heals, you can return to barbell bench press gradually.
```

---

## 7. Program Generation (PRIORITY P3 - Phase 3)

**Status:** Currently template-based, AI generation planned  
**Training Data Needed:** 200-500 examples  
**Timeline:** 6-12 months

### Current System (No AI)

✅ **Template-based program selection** based on:
- Experience level
- Goals
- Training frequency
- Available equipment

### Planned AI Enhancement

**What it adds:**
- Fully custom programs generated from scratch
- Periodization tailored to user's response
- Exercise selection based on preferences and history
- Auto-adjustments based on performance

### Example Training Data

**Input:**
```json
{
  "experience": "intermediate",
  "goal": "strength",
  "frequency": 4,
  "session_duration": 60,
  "equipment": ["barbell", "dumbbells", "rack", "bench"],
  "injury_history": ["lower_back_strain_6_months_ago"]
}
```

**Output:** Complete 12-week periodized program with exercise selection, sets, reps, RPE targets, deload weeks, etc.

---

## Summary: Complete Training Data Roadmap

### Phase 1: Immediate (Next 3-4 weeks)
**Goal:** Unified model for voice parsing + injury analysis

| Data Type | Examples | Status |
|-----------|----------|--------|
| Voice Parsing | 3,890 | ✅ Existing |
| Injury Analysis | 500-1,000 | ⏳ Generate |
| **TOTAL** | **4,390-4,890** | |

**Cost:** ~$20 training, ~$3/month inference  
**Timeline:** 3-4 weeks

---

### Phase 2: Medium-term (3-6 months)
**Goal:** Add AI Coach, Workout Insights, Running Analysis

| Data Type | Examples | Status |
|-----------|----------|--------|
| Voice Parsing | 3,890 | ✅ Existing |
| Injury Analysis | 500-1,000 | ✅ Phase 1 |
| AI Coach Q&A (Strength) | 1,000-2,000 | ⏳ Generate |
| Workout Insights | 500-1,000 | ⏳ Generate |
| Running/Cardio Analysis | 300-500 | ⏳ Generate |
| **TOTAL** | **6,190-8,390** | |

**Cost:** ~$30 training, ~$5/month inference  
**Timeline:** 3-6 months

---

### Phase 3: Long-term (6-12 months)
**Goal:** Add Exercise Explanations, Program Generation

| Data Type | Examples | Status |
|-----------|----------|--------|
| All Phase 2 Data | 6,190-8,390 | ✅ Phase 2 |
| Exercise Substitution Explanations | 300-500 | ⏳ Generate |
| Program Generation | 200-500 | ⏳ Generate |
| **TOTAL** | **6,690-9,390** | |

**Cost:** ~$40 training, ~$6/month inference  
**Timeline:** 6-12 months

---

## Recommendation

**Start with Phase 1 (Injury Analysis) NOW:**
1. ✅ You have all voice parsing data (3,890 examples)
2. ⏳ Generate 500-1,000 injury analysis examples (3-4 weeks)
3. ⏳ Fine-tune unified model v2.0
4. ⏳ Deploy and validate

**Then evaluate:**
- User adoption of injury features
- Demand for AI Coach and running features
- Budget for Phase 2 data generation

**You are NOT locked in** - all training data is portable to other providers!

