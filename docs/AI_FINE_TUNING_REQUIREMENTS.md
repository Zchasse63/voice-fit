# VoiceFit Unified AI Fine-Tuning Requirements

**Version:** 2.0  
**Date:** 2025-01-06  
**Purpose:** Comprehensive specification for unified GPT-4o-mini fine-tuning covering ALL AI use cases in VoiceFit

---

## Executive Summary

VoiceFit currently uses **two separate models**:
1. **Fine-tuned model** (`ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`) - Voice command parsing only
2. **Base gpt-4o-mini** - Injury analysis (Premium feature)

**Goal:** Create a **single unified fine-tuned model** that handles all AI tasks with consistent quality and performance.

---

## Current AI Use Cases (Implemented)

### 1. Voice Command Parsing ✅ **CURRENTLY FINE-TUNED**

**Endpoint:** `POST /api/voice/parse`  
**File:** `apps/backend/integrated_voice_parser.py`  
**Current Model:** `ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`  
**Training Data:** 3,890 examples  
**Accuracy:** 95.57% weight, 99.74% reps, 98.18% RPE

**Input Examples:**
- "bench press 225 for 8"
- "RDL 315 for 5 at RPE 8"
- "db rows 80s for 12"
- "same weight for 7"
- "pull-ups for 10"

**Output Schema:**
```json
{
  "exercise_name": "Barbell Bench Press",
  "weight": 225,
  "weight_unit": "lbs",
  "reps": 8,
  "rpe": 8,
  "rir": 2,
  "confidence": 0.95
}
```

**Temperature:** 0.1 (low for consistency)  
**Max Tokens:** 500

---

### 2. Injury Analysis (Premium) ❌ **CURRENTLY USING BASE MODEL**

**Endpoint:** `POST /api/injury/analyze`  
**File:** `apps/backend/main.py` (line 312-403)  
**Current Model:** `gpt-4o-mini` (base, not fine-tuned)  
**Training Data:** None (zero-shot with prompt engineering)

**Input Examples:**
- "sharp pain in my shoulder when pressing"
- "lower back feels tight after deadlifts"
- "knee clicking during squats, no pain"
- "elbow hurts on the outside when doing curls"

**Output Schema:**
```json
{
  "injury_detected": true,
  "confidence": 0.85,
  "body_part": "shoulder",
  "severity": "moderate",
  "injury_type": "rotator_cuff_strain",
  "red_flags": ["sharp_pain", "limited_rom"],
  "recommendations": ["rest_48_hours", "ice_therapy", "consult_pt"],
  "affected_exercises": ["Bench Press", "Overhead Press"],
  "differential_diagnoses": ["impingement", "tendinitis"]
}
```

**Temperature:** 0.4 (medical classification)  
**Max Tokens:** 500

**Current Prompt:** See `docs/research/ai_prompts.md`

---

## Future AI Use Cases (Planned)

### 3. AI Coach Chat Interface 🔮 **PREMIUM FEATURE**

**Tab:** Tab 5 - AI Coach  
**Status:** Not yet implemented  
**Tier:** Premium only

**Capabilities:**
- Answer training questions using RAG knowledge base
- Analyze workout performance vs historical data
- Provide exercise form cues and technique tips
- Suggest program modifications based on readiness
- Explain periodization concepts
- Calculate deload timing
- Recommend progression strategies

**Example Queries:**
- "How much volume should I do for chest?"
- "When should I deload?"
- "Why am I not progressing on bench press?"
- "What's the difference between RPE and RIR?"
- "Should I train if I'm sore?"
- "How am I doing?" (during workout)
- "Should I increase weight?" (context-aware)

**Output Format:** Conversational text with optional structured actions

**Required Training Data:**
- Exercise science Q&A pairs
- Periodization concepts
- Volume/intensity calculations
- Deload timing logic
- Form cues for top 50 exercises
- Recovery science
- Progressive overload strategies

---

### 4. Workout Insights Generation 🔮 **PREMIUM FEATURE**

**Location:** Home screen, Post-workout summary  
**Status:** Not yet implemented  
**Tier:** Premium only

**Capabilities:**
- Volume warnings (too high/low)
- Deload recommendations
- PR predictions ("You might hit 225×5 next week")
- Form degradation alerts (RPE spike without weight increase)
- Plateau detection and suggestions
- Weekly performance summaries

**Input:** Historical workout data (JSON)  
**Output:** Natural language insights with actionable recommendations

**Example Outputs:**
- "Your volume is 5% higher than last week. Consider maintaining this level for 2 more weeks before increasing."
- "You've hit the same weight for 3 weeks. Try adding 5 lbs next session."
- "Your RPE increased from 7 to 9 without weight change. Check your recovery."

---

### 5. Exercise Substitution Suggestions 🔮 **FUTURE ENHANCEMENT**

**Current:** Database-driven with similarity scores  
**Future:** AI-enhanced with contextual reasoning

**Capabilities:**
- Explain WHY a substitution is recommended
- Consider user's equipment, experience, and injury history
- Provide form cues for new exercises
- Suggest progression pathways

**Example:**
```
User: "I can't do bench press due to shoulder pain"
AI: "I recommend Dumbbell Bench Press (88% similarity) because:
- Allows independent arm movement, reducing shoulder impingement
- Same muscle groups (chest, triceps, anterior deltoid)
- You can use a neutral grip to further reduce shoulder stress
- Start with 40kg dumbbells (equivalent to ~88kg barbell load)

Form cues:
- Keep shoulder blades retracted throughout
- Lower dumbbells to chest level, not below
- Press in a slight arc, bringing dumbbells together at top"
```

---

### 6. Program Generation (Onboarding) 🔮 **FUTURE ENHANCEMENT**

**Current:** Template-based selection  
**Future:** AI-generated custom programs

**Input:**
- Experience level (beginner/intermediate/advanced)
- Goals (strength/hypertrophy/powerlifting)
- Available equipment
- Training frequency (3-6 days/week)
- Session duration (45-90 min)
- Injury history

**Output:** Complete periodized program with exercise selection, sets, reps, RPE targets

---

## Unified Fine-Tuning Dataset Requirements

### Dataset Structure

**Format:** JSONL (JSON Lines) for OpenAI fine-tuning

```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

### Required Training Examples

| Use Case | Estimated Examples Needed | Priority |
|----------|---------------------------|----------|
| Voice Command Parsing | 3,890 (existing) | ✅ P0 |
| Injury Analysis | 500-1,000 | ✅ P0 |
| AI Coach Q&A | 1,000-2,000 | 🔮 P1 |
| Workout Insights | 500-1,000 | 🔮 P1 |
| Exercise Substitution Explanations | 300-500 | 🔮 P2 |
| Program Generation | 200-500 | 🔮 P3 |
| **TOTAL** | **6,390-9,890** | |

---

## Next Steps

### Phase 1: Immediate (P0) - Injury Analysis Fine-Tuning

**Goal:** Add injury analysis to existing voice parsing model

**Tasks:**
1. ✅ Review current injury analysis prompt (done)
2. ⏳ Generate 500-1,000 injury analysis training examples
3. ⏳ Combine with existing 3,890 voice parsing examples
4. ⏳ Fine-tune new unified model
5. ⏳ Test and validate accuracy
6. ⏳ Deploy to production

**Training Data Sources:**
- Existing injury keywords database
- Medical literature on common training injuries
- Real user examples (anonymized)
- Synthetic examples covering edge cases

**Validation Metrics:**
- Injury detection accuracy (target: >90%)
- Body part extraction accuracy (target: >95%)
- Severity classification accuracy (target: >85%)
- False positive rate (target: <5%)

---

### Phase 2: Future (P1-P3) - AI Coach & Insights

**Goal:** Add conversational AI and workout analysis capabilities

**Tasks:**
1. Define AI Coach knowledge base (exercise science, periodization)
2. Generate Q&A training examples
3. Create workout insight generation examples
4. Fine-tune expanded model
5. Implement RAG (Retrieval-Augmented Generation) for knowledge base
6. Build chat interface

---

## Technical Specifications

### Model Configuration

**Base Model:** `gpt-4o-mini-2024-07-18`  
**Fine-Tuning Method:** OpenAI Fine-Tuning API  
**Hyperparameters:**
- Learning rate: Auto (OpenAI default)
- Epochs: 3-5 (based on validation loss)
- Batch size: Auto

### Temperature Settings by Use Case

| Use Case | Temperature | Reasoning |
|----------|-------------|-----------|
| Voice Parsing | 0.1 | Consistency, structured output |
| Injury Analysis | 0.4 | Medical classification, some variability |
| AI Coach Q&A | 0.7 | Conversational, helpful tone |
| Workout Insights | 0.5 | Balance between consistency and variety |

### Output Format

**All use cases return JSON** with `response_format={"type": "json_object"}`

---

## Cost Estimation

### Fine-Tuning Costs (OpenAI Pricing)

**Training:**
- Input: $0.0030 / 1K tokens
- Output: $0.0060 / 1K tokens

**Inference (after fine-tuning):**
- Input: $0.000150 / 1K tokens (same as base)
- Output: $0.000600 / 1K tokens (same as base)

**Estimated Training Cost:**
- 6,000 examples × 200 tokens avg = 1.2M tokens
- 3 epochs = 3.6M tokens
- Cost: ~$10-20 for training

**Monthly Inference Cost (estimated):**
- 10,000 API calls/month × 300 tokens avg = 3M tokens
- Cost: ~$2-3/month

---

## Success Criteria

### Phase 1 (Injury Analysis)
- ✅ Single unified model handles both voice parsing and injury analysis
- ✅ Injury detection accuracy >90%
- ✅ No regression in voice parsing accuracy
- ✅ Response time <500ms (p95)

### Phase 2 (AI Coach)
- ✅ Conversational quality rated >4/5 by users
- ✅ Factual accuracy >95% (verified against exercise science)
- ✅ Helpful recommendations rated >4/5 by users

---

## Running/Cardio AI Features Analysis

### Current Running Features (Already Implemented)

**Basic GPS Tracking:**
- Distance, pace, duration tracking
- Elevation gain/loss
- Route mapping with GPS coordinates
- Auto-pause detection
- Voice feedback every mile

**Data Storage:**
- WatermelonDB `Run` model with fields: distance, duration, pace, avgSpeed, calories, route
- Zustand `useRunStore` for state management
- GPS service with coordinate tracking

### Planned Running Features (Phase 3 - UI UX Spec)

**Weather-Adjusted Pace Analysis:**
- Adjust pace for temperature (e.g., +14 sec/mi at 85°F vs 65°F)
- Adjust for wind speed (e.g., +18 sec/mi with 15 mph wind)
- Adjust for elevation (e.g., +12 sec/mi per 100 ft gain)
- Calculate "efficiency score" (0-100)
- Provide fitness progression insights

**AI Coach for Running:**
- Pace recommendations based on conditions
- Training plan suggestions
- Performance analysis vs historical data
- Recovery recommendations

### Do We Need Running/Cardio Training Data?

**✅ YES - For Premium Features**

| Feature | AI Required? | Training Data Needed? | Priority |
|---------|--------------|----------------------|----------|
| Basic GPS tracking | ❌ No | ❌ No | ✅ Done |
| Weather-adjusted pace | ✅ Yes | ✅ Yes | 🔮 P2 |
| Pace recommendations | ✅ Yes | ✅ Yes | 🔮 P2 |
| Training plan generation | ✅ Yes | ✅ Yes | 🔮 P3 |
| Running form analysis | ✅ Yes | ✅ Yes | 🔮 P3 |
| AI Coach (running Q&A) | ✅ Yes | ✅ Yes | 🔮 P2 |

**Recommendation:** Add running/cardio training data in **Phase 2** (after injury analysis)

### Running Training Data Requirements

**Estimated Examples Needed:** 300-500

**Categories:**

1. **Weather-Adjusted Pace Analysis (150 examples)**
   - Input: Run data (distance, pace, temperature, wind, elevation, humidity)
   - Output: Adjusted pace, efficiency score, insights
   - Example: "Your 7:45/mi pace in 85°F heat is equivalent to 7:31/mi in ideal conditions"

2. **Pace Recommendations (100 examples)**
   - Input: Historical runs, current conditions, goal (distance/time)
   - Output: Recommended target pace with reasoning
   - Example: "Based on your recent 5K times and today's weather, target 7:40-7:50/mi"

3. **Running Q&A (100 examples)**
   - Input: User questions about running training
   - Output: Evidence-based answers
   - Examples: "How do I improve my 5K time?", "Should I run in the heat?", "What's a good weekly mileage?"

4. **Recovery Recommendations (50 examples)**
   - Input: Recent run data, frequency, intensity
   - Output: Recovery advice
   - Example: "You've run 4 days in a row at high intensity. Consider a rest day or easy recovery run."

### Updated Training Data Roadmap

**Phase 1 (Immediate - 3-4 weeks):**
- ✅ Voice parsing (3,890 examples - existing)
- ⏳ Injury analysis (500-1,000 examples - NEW)
- **Total:** ~5,000-6,000 examples

**Phase 2 (3-6 months):**
- ⏳ AI Coach Q&A - Strength (1,000 examples)
- ⏳ Workout insights - Strength (500 examples)
- ⏳ Running/Cardio analysis (300-500 examples) ← **NEW**
- **Total:** ~7,000-9,000 examples

**Phase 3 (6-12 months):**
- ⏳ Exercise substitution explanations (300 examples)
- ⏳ Program generation (200 examples)
- **Total:** ~7,500-9,500 examples

## Open Questions

1. ~~**Should we include running-specific AI features?**~~ → **YES - Phase 2 (300-500 examples)**
2. **Do we need separate models for Free vs Premium tiers?** (Or use same model with tier-based prompting?)
3. **How do we handle multi-turn conversations in AI Coach?** (Context window management)
4. **Should we fine-tune on user feedback?** (Continuous learning from thumbs up/down)

---

## References

- Current fine-tuned model: `ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`
- Injury analysis prompt: `docs/research/ai_prompts.md`
- Voice parsing training data: (original 3,890 examples)
- Exercise database: 456 exercises in Supabase
- Injury keywords: `docs/research/injury_keywords.json`

