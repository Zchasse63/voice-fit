# Current Injury Data Status for Fine-Tuning

**Version:** 1.0  
**Date:** 2025-01-06  
**Purpose:** Document what injury-related data we currently have and what needs to be converted to JSONL format

---

## Question: Do We Have All Injury Data Ready?

**Answer: NO - We have the research and structured data, but NOT in JSONL training format yet.**

---

## What We Have (Structured Data)

### 1. Injury Keywords (✅ Complete - Needs Conversion)

**File:** `docs/research/injury_keywords.json`  
**Status:** Complete structured data  
**Format:** JSON (not JSONL)  
**Content:**
- Pain descriptors (sharp, dull, burning, throbbing, radiating)
- Injury types (strain, sprain, tendinitis, impingement, etc.)
- Severity modifiers (mild, moderate, severe)
- Body part synonyms (shoulder, rotator cuff, AC joint, etc.)
- Context clues (during exercise, after workout, etc.)
- Red flag symptoms (numbness, loss of function, etc.)

**What's Missing:** This is reference data, NOT training examples. We need to create 500-1,000 actual training examples using this data.

---

### 2. Exercise Substitutions (✅ Complete - In Database)

**File:** `docs/research/exercise_substitutions_processed.json`  
**Database:** Supabase `exercise_substitutions` table (165 rows)  
**Status:** Complete and seeded  
**Content:**
- 165 exercise substitution pairs
- Similarity scores (0.42-0.94)
- Reduced stress areas (shoulder, lower_back, knee, elbow, hip)
- Movement patterns
- Primary muscles
- Equipment requirements
- Difficulty levels
- Scientific notes with EMG data

**What's Missing:** Training examples that EXPLAIN these substitutions in natural language. We need ~300 examples of substitution reasoning.

---

### 3. Body Part Stress Mappings (✅ Complete - In Database)

**Database:** Supabase `exercise_body_part_stress` table (70 rows)  
**Status:** Complete and seeded  
**Content:**
- 70 exercise-body part stress mappings
- Stress intensity (1-5 scale)
- Stress type (compression, tension, shear, rotation)
- Injury mechanisms
- Form errors that increase risk
- Safety notes

**What's Missing:** Training examples that use this data to analyze injury risk.

---

### 4. AI Prompts (✅ Complete - Reference Only)

**File:** `docs/research/ai_prompts.md`  
**Status:** Complete prompt templates  
**Content:**
- System prompts for injury analysis
- Few-shot examples
- Output format specifications
- Prompt engineering best practices

**What's Missing:** This is just the template. We need 500-1,000 actual training examples.

---

### 5. Recovery Protocols (✅ Complete - Reference Only)

**File:** `docs/research/recovery_protocols.md`  
**Status:** Complete recovery guidelines  
**Content:**
- Recovery timelines by injury type
- Check-in frequency recommendations
- Escalation criteria
- Return-to-training protocols

**What's Missing:** Training examples that apply these protocols to specific scenarios.

---

### 6. Medical Disclaimers (✅ Complete - Reference Only)

**File:** `docs/research/medical_disclaimers.md`  
**Status:** Complete compliance documentation  
**Content:**
- FDA/HIPAA compliance guidelines
- Red flag symptoms requiring medical attention
- Scope limitations
- Legal disclaimer text

**What's Missing:** Training examples that identify red flags and recommend medical attention.

---

## What We DON'T Have (Training Examples)

### ❌ Injury Analysis Training Examples (0/1,000)

**What we need:**
- 400 clear injury cases
- 300 ambiguous cases (DOMS vs injury)
- 200 normal DOMS cases
- 100 red flag cases

**Current status:** ZERO training examples  
**Format needed:** JSONL with system/user/assistant messages  
**Estimated time:** 3-4 weeks to generate

**Example of what we need:**

```jsonl
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant..."}, {"role": "user", "content": "Sharp pain in shoulder during overhead press"}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.92, \"body_part\": \"shoulder\", ...}"}]}
```

---

## Can We Restructure Existing Data for Fine-Tuning?

**Short answer: NO - We need to CREATE training examples, not just restructure.**

**Why:**
- Our current data is **reference material** (keywords, substitutions, protocols)
- Fine-tuning needs **input/output pairs** showing the AI how to USE that reference material
- We have the ingredients, but we haven't cooked the meal yet

**Analogy:**
- ✅ We have a cookbook (injury keywords, protocols, substitutions)
- ❌ We don't have 1,000 examples of actual meals (training examples)

---

## What Needs to Happen

### Step 1: Generate Injury Analysis Training Data (Priority P0)

**Task:** Create 1,000 JSONL training examples for injury analysis

**Subtasks:**
1. Generate 400 clear injury cases using `injury_keywords.json` as reference
2. Generate 300 ambiguous cases (DOMS vs injury)
3. Generate 200 normal DOMS cases
4. Generate 100 red flag cases

**Output:** 4 JSONL files totaling ~1,000 examples

**Timeline:** 3-4 weeks

**Who:** Research team using prompts from `RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

---

### Step 2: Generate Exercise Substitution Explanations (Priority P2)

**Task:** Create 300 JSONL training examples explaining substitutions

**Subtasks:**
1. Use `exercise_substitutions_processed.json` as source data
2. Generate natural language explanations for each substitution
3. Include biomechanical reasoning, form cues, and use cases

**Output:** 1 JSONL file with ~300 examples

**Timeline:** 1-2 weeks

**Who:** Research team or AI-assisted generation

---

### Step 3: Merge with Existing Voice Parsing Data

**Task:** Combine all training data into single JSONL file

**Inputs:**
- ✅ `voice_training_data_final_merged.jsonl` (3,890 examples - existing)
- ⏳ Injury analysis examples (1,000 examples - to be generated)
- ⏳ Running/cardio examples (300-500 examples - Phase 2)
- ⏳ AI Coach Q&A examples (1,000 examples - Phase 2)
- ⏳ Workout insights examples (500 examples - Phase 2)
- ⏳ Exercise substitution explanations (300 examples - Phase 2)
- ⏳ Program generation examples (200 examples - Phase 3)

**Output:** Single `voicefit_unified_training_data.jsonl` file

**Timeline:** 1 day (simple concatenation)

---

### Step 4: Fine-Tune Unified Model

**Task:** Train new OpenAI GPT-4o Mini model on complete dataset

**Process:**
1. Upload merged JSONL file to OpenAI
2. Start fine-tuning job
3. Monitor training progress
4. Validate accuracy on test set
5. Deploy to production

**Timeline:** 2-3 hours training + 1 day validation

**Cost:** ~$20-30 for training

---

## Summary

### What We Have ✅

| Data Type | Status | Format | Usable for Training? |
|-----------|--------|--------|---------------------|
| Injury Keywords | ✅ Complete | JSON | ❌ Reference only |
| Exercise Substitutions | ✅ Complete | Database | ❌ Reference only |
| Body Part Stress | ✅ Complete | Database | ❌ Reference only |
| AI Prompts | ✅ Complete | Markdown | ❌ Template only |
| Recovery Protocols | ✅ Complete | Markdown | ❌ Reference only |
| Medical Disclaimers | ✅ Complete | Markdown | ❌ Reference only |
| Voice Parsing Data | ✅ Complete | JSONL | ✅ Ready! (3,890 examples) |

### What We Need ❌

| Data Type | Status | Examples Needed | Priority | Timeline |
|-----------|--------|----------------|----------|----------|
| Injury Analysis | ❌ Not started | 1,000 | P0 | 3-4 weeks |
| Running/Cardio | ❌ Not started | 300-500 | P1 | 3-6 months |
| AI Coach Q&A | ❌ Not started | 1,000 | P1 | 3-6 months |
| Workout Insights | ❌ Not started | 500 | P1 | 3-6 months |
| Substitution Explanations | ❌ Not started | 300 | P2 | 6-12 months |
| Program Generation | ❌ Not started | 200 | P3 | 6-12 months |

---

## Immediate Action Items

1. ✅ **Review research prompts** in `RESEARCH_PROMPTS_FOR_FINE_TUNING.md`
2. ⏳ **Assign to research team** with deadlines
3. ⏳ **Generate injury analysis data** (1,000 examples) - Priority P0
4. ⏳ **Quality review** each JSONL file
5. ⏳ **Merge with voice parsing data** (3,890 existing examples)
6. ⏳ **Fine-tune unified model** on ~5,000 total examples
7. ⏳ **Test and deploy** new model

---

## Questions?

**Q: Can we use the injury keywords JSON directly?**  
A: No - that's reference data. We need training examples that SHOW the AI how to use those keywords.

**Q: Can we auto-generate training data from our database?**  
A: Partially - we can use the database as source material, but we still need to create natural language input/output pairs.

**Q: How long will this take?**  
A: Phase 1 (injury analysis): 3-4 weeks. Full dataset: 6-12 months.

**Q: Can we start fine-tuning now with what we have?**  
A: Yes! We can fine-tune on voice parsing data (3,890 examples) + injury analysis data once generated (1,000 examples) = ~5,000 total examples for Phase 1.

