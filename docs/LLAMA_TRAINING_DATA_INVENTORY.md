# Llama 3.3 70B Training Data Inventory

**Date:** 2025-11-07  
**Purpose:** Complete inventory of existing and needed training data

---

## Quick Summary

| Data Source | Examples | Status | Location |
|-------------|----------|--------|----------|
| **EXISTING DATA** | | | |
| Voice Parsing | 3,890 | ✅ HAVE | `archive/fine-tuning/voice_training_data_final_merged.jsonl` |
| Knowledge Base | ~150 | ✅ HAVE | Supabase `knowledge_base` table (23 chunks) |
| **NEW DATA NEEDED** | | | |
| Injury Analysis | 825 | ❌ NEED | Prompt ready: `docs/LLAMA_3.3_INJURY_TRAINING_PROMPT_REFINED.md` |
| AI Coach Q&A | 1,000 | ❌ NEED | Prompt not created |
| Running/Cardio | 400 | ❌ NEED | Prompt not created |
| **TOTAL** | **~6,265** | | |

---

## Detailed Inventory

### ✅ **1. Voice Parsing Training Data (3,890 examples)**

**Location:** `archive/fine-tuning/voice_training_data_final_merged.jsonl`

**Format:**
```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are a voice command parser for workout logging..."
    },
    {
      "role": "user",
      "content": "bench press 225 for 8 at RPE 8"
    },
    {
      "role": "assistant",
      "content": "{\"exercise_id\": \"...\", \"exercise_name\": \"Barbell Bench Press\", \"weight\": 225, \"reps\": 8, \"rpe\": 8, \"confidence\": 0.95}"
    }
  ]
}
```

**Coverage:**
- Standard commands: "bench press 225 for 8"
- Abbreviations: "RDL 315 for 5", "db rows 80s for 12"
- RPE/RIR: "at RPE 8", "2 reps in reserve"
- Equipment shortcuts: "comp bench", "db", "bb"
- Context references: "same weight for 7"
- YouTube terminology: 40 examples

**Quality Metrics:**
- 95.57% accuracy on weight parsing
- 99.74% accuracy on reps parsing
- 98.18% accuracy on RPE parsing

**Migration Work Needed:**
- Convert OpenAI JSONL → Llama 3.3 format
- Optionally add reasoning chains
- Validate accuracy after conversion

---

### ✅ **2. Knowledge Base Chunks (23 chunks → ~150 training examples)**

**Location:** Supabase `knowledge_base` table

**Breakdown by Category:**

#### **MVQ (Minimum Viable Questionnaire) - 7 chunks**
- User onboarding questions
- Goal assessment
- Equipment availability
- Experience level classification
- Training frequency preferences

**Conversion:** Each chunk → 5-10 Q&A examples = **~50 examples**

---

#### **Experience Classification - 4 chunks**
- Beginner classification (0-1 year)
- Intermediate classification (1-3 years)
- Advanced classification (3+ years)
- Elite classification (5+ years)

**Conversion:** Each chunk → 10-15 examples = **~50 examples**

---

#### **Decision Trees - 4 chunks**
- Program selection logic
- Volume/frequency recommendations
- Exercise selection algorithms
- Progression strategies

**Conversion:** Each chunk → 5-10 examples = **~30 examples**

---

#### **Equipment Substitutions - 3 chunks**
- Squat pattern alternatives
- Bench/push pattern alternatives
- Deadlift/hip hinge alternatives

**Conversion:** Each chunk → 3-5 examples = **~12 examples**

---

#### **Injury Modifications - 3 chunks**
- Shoulder injury modifications
- Lower back injury modifications
- Knee injury modifications

**Conversion:** Each chunk → 3-5 examples = **~12 examples**

---

#### **Customization Examples - 2 chunks**
- Beginner hypertrophy (home gym, dumbbells only)
- Intermediate powerlifting (full gym, 16-week meet prep)

**Conversion:** Each chunk → 2-3 examples = **~5 examples**

---

**Total from Knowledge Base:** ~150 examples

**Extraction Work Needed:**
- Query all chunks from Supabase
- Convert each chunk into Q&A format
- Create multi-turn conversations for complex topics
- Validate coverage

---

### ❌ **3. Injury Analysis Training Data (825 examples)**

**Status:** Prompt created, examples NOT generated  
**Location:** `docs/LLAMA_3.3_INJURY_TRAINING_PROMPT_REFINED.md`

**Distribution:**
- Acute injuries: 75 examples
- Chronic/overuse: 150 examples
- Tendinitis: 100 examples
- Impingement: 75 examples
- False positives (DOMS): 100 examples
- Ambiguous cases: 75 examples
- Multi-turn conversations: 150 examples
- Red flag scenarios: 50 examples
- Context-dependent: 50 examples

**Key Features:**
- Reasoning chains (shows HOW model reaches conclusions)
- Confidence reasoning (justifies confidence levels)
- Differential diagnoses with probabilities
- Exercise modifications with specifics (load%, sets/reps)
- Recovery timeline validation (checkpoints at days 3, 7, weeks 2-4)
- Escalation triggers (when to see doctor)
- Load management details (volume reductions with percentages)

**Generation Work Needed:**
- Use Claude/GPT-4 to generate examples in batches
- Quality assurance review for each batch
- Ensure all required fields present
- Validate reasoning chain quality

**Estimated Time:** 2-3 weeks

---

### ❌ **4. AI Coach Q&A Training Data (800-1,200 examples)**

**Status:** NOT STARTED - Need to create research prompt

**Proposed Coverage:**

#### **Programming Questions (300 examples)**
- "How many sets should I do for chest?"
- "Should I train to failure?"
- "What's the difference between hypertrophy and strength training?"
- "How do I know when to deload?"

#### **Technique Questions (200 examples)**
- "How deep should I squat?"
- "What's proper bench press form?"
- "Should my elbows flare on overhead press?"
- "How do I engage my lats on deadlift?"

#### **Nutrition Questions (150 examples)**
- "How much protein do I need?"
- "Should I eat before or after training?"
- "What's a good pre-workout meal?"
- "Do I need supplements?"

#### **Recovery Questions (150 examples)**
- "How much sleep do I need?"
- "Should I train when sore?"
- "What's active recovery?"
- "How do I reduce muscle soreness?"

#### **Motivation & Mindset (100 examples)**
- "I'm not seeing progress, what should I do?"
- "How do I stay consistent?"
- "Is it normal to plateau?"
- "How do I overcome gym anxiety?"

#### **Multi-Turn Conversations (100 examples)**
- Progressive questioning
- Context-dependent follow-ups
- Clarifying questions

**Total:** ~1,000 examples

**Work Needed:**
- Create comprehensive research prompt
- Generate examples in batches
- Include context-dependent responses (beginner vs. advanced)
- Quality assurance

**Estimated Time:** 2-3 weeks

---

### ❌ **5. Running/Cardio Training Data (300-500 examples)**

**Status:** NOT STARTED - Need to create research prompt

**Proposed Coverage:**

#### **Voice Parsing (150 examples)**
- "5 mile run at 8:30 pace"
- "30 minute easy run"
- "400 meter repeats, 6 times at 1:30"
- "Tempo run 4 miles at 7:45 pace"

#### **Running Advice (150 examples)**
- "How do I improve my 5K time?"
- "What's a good weekly mileage for beginners?"
- "Should I do speed work?"
- "How do I prevent shin splints?"

#### **Cardio Programming (100 examples)**
- "How much cardio should I do while strength training?"
- "What's the best cardio for fat loss?"
- "Should I do HIIT or steady state?"
- "How do I balance running and lifting?"

#### **Pace/Distance Calculations (50 examples)**
- Convert pace to speed
- Calculate splits
- Estimate race times
- Zone-based training

**Total:** ~450 examples

**Work Needed:**
- Create research prompt
- Generate examples
- Include pace calculations and conversions
- Quality assurance

**Estimated Time:** 1-2 weeks

---

## Migration Strategy

### **Phase 1: Extract & Convert Existing Data (1-2 weeks)**
1. Extract 3,890 voice parsing examples
2. Extract 23 knowledge base chunks
3. Convert to Llama 3.3 format
4. Validate format correctness

**Output:** ~4,040 examples ready for training

---

### **Phase 2: Generate Injury Analysis Data (2-3 weeks)**
1. Use refined prompt to generate 825 examples
2. Quality assurance review
3. Format as JSONL

**Output:** 825 injury analysis examples

---

### **Phase 3: Generate AI Coach Data (2-3 weeks)**
1. Create research prompt
2. Generate 1,000 examples
3. Quality assurance review
4. Format as JSONL

**Output:** 1,000 AI coach examples

---

### **Phase 4: Generate Running/Cardio Data (1-2 weeks)**
1. Create research prompt
2. Generate 400 examples
3. Quality assurance review
4. Format as JSONL

**Output:** 400 running/cardio examples

---

### **Phase 5: Merge & Train (1-2 weeks)**
1. Merge all JSONL files
2. Validate complete dataset
3. Upload to fine-tuning platform
4. Train Llama 3.3 70B
5. Evaluate performance

**Output:** Fine-tuned Llama 3.3 70B model

---

## Total Timeline: 8-12 weeks

**Critical Path:**
1. Phase 1 (existing data) - 1-2 weeks
2. Phase 2 (injury analysis) - 2-3 weeks
3. Phase 3 (AI coach) - 2-3 weeks
4. Phase 4 (running/cardio) - 1-2 weeks
5. Phase 5 (merge & train) - 1-2 weeks

**Can be parallelized:**
- Phases 2, 3, 4 can be done simultaneously if multiple people working

---

## Cost Estimate

**Training Cost:**
- 6,265 examples × 1,200 tokens avg × 3 epochs = 22.6M tokens
- Llama 3.3 70B fine-tuning: ~$0.0008 per 1K tokens
- **Total: ~$18-25**

**Generation Cost (using Claude/GPT-4 to generate examples):**
- 2,225 new examples × 1,500 tokens avg = 3.3M tokens
- GPT-4 generation: ~$0.03 per 1K tokens
- **Total: ~$100**

**Grand Total: ~$120-130**

---

**Status: INVENTORY COMPLETE** ✅

