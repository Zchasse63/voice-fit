# Llama 3.3 70B Fine-Tuning Master Plan

**Version:** 1.0  
**Date:** 2025-11-07  
**Purpose:** Complete roadmap for migrating from GPT-4o Mini to Llama 3.3 70B with all existing and new training data

---

## Executive Summary

**Current State:**
- ✅ GPT-4o Mini fine-tuned model in production (`ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`)
- ✅ 3,890 voice parsing training examples (95.57% accuracy)
- ✅ ~23 knowledge base chunks in Supabase (program generation, injury modifications, equipment substitutions)
- ❌ NO injury analysis training data (currently using base model)
- ❌ NO AI coach training data
- ❌ NO running/cardio training data

**Goal:**
- Create unified Llama 3.3 70B model handling ALL AI use cases
- Preserve existing voice parsing performance (3,890 examples)
- Add comprehensive injury analysis (825 examples)
- Add AI coach, running, and other features
- Total: ~6,000-7,000 training examples

**Estimated Cost:** ~$18-25 for complete training

---

## Data Inventory

### ✅ **Existing Data We Have**

#### 1. Voice Parsing Training Data (3,890 examples)
**Location:** `archive/fine-tuning/voice_training_data_final_merged.jsonl`  
**Format:** OpenAI JSONL (system/user/assistant messages)  
**Quality:** Production-ready, 95.57% accuracy  
**Status:** READY TO MIGRATE

**What it does:**
- Parses voice commands like "bench press 225 for 8 at RPE 8"
- Extracts exercise name, weight, reps, RPE, RIR
- Handles abbreviations (RDL, OHP, db)
- Handles "same weight" references

**Migration needed:**
- Convert OpenAI format → Llama 3.3 format
- Enhance with reasoning chains (optional but recommended)
- Test accuracy after migration

---

#### 2. Knowledge Base Chunks (23 entries in Supabase)
**Location:** Supabase `knowledge_base` table  
**Categories:**
- MVQ (Minimum Viable Questionnaire): 7 chunks
- Experience classification: 4 chunks
- Decision trees: 4 chunks
- Equipment substitutions: 3 chunks
- Injury modifications: 3 chunks
- Customization examples: 2 chunks

**What it does:**
- Provides structured knowledge for program generation
- Exercise substitution rules
- Injury modification guidelines
- User classification logic

**Migration needed:**
- Extract from Supabase
- Convert to training examples (Q&A format)
- Estimate: ~100-200 training examples from these chunks

---

### ❌ **New Data We Need to Create**

#### 3. Injury Analysis Training Data (825 examples)
**Status:** Prompt created, examples NOT generated  
**Location:** `docs/LLAMA_3.3_INJURY_TRAINING_PROMPT_REFINED.md`  
**Priority:** P0 - CRITICAL

**What it does:**
- Analyzes user injury reports
- Provides differential diagnoses
- Recommends exercise modifications
- Escalates to medical care when needed

**Work needed:**
- Generate 825 examples using the refined prompt
- Quality assurance review
- Format as JSONL

---

#### 4. AI Coach Q&A Training Data (800-1,200 examples)
**Status:** NOT STARTED  
**Priority:** P1 - HIGH

**What it does:**
- Answers training questions
- Provides programming advice
- Explains exercise technique
- Nutrition guidance

**Work needed:**
- Create research prompt
- Generate examples
- Format as JSONL

---

#### 5. Running/Cardio Training Data (300-500 examples)
**Status:** NOT STARTED  
**Priority:** P2 - MEDIUM

**What it does:**
- Parses running commands ("5 mile run at 8:30 pace")
- Provides running advice
- Cardio programming

**Work needed:**
- Create research prompt
- Generate examples
- Format as JSONL

---

## High-Level Plan Outline

### **CATEGORY 1: Data Extraction & Migration**
**Purpose:** Extract and convert existing GPT-4o Mini training data for Llama 3.3 70B

**Tasks:**
- Extract 3,890 voice parsing examples from `archive/fine-tuning/voice_training_data_final_merged.jsonl`
- Convert OpenAI JSONL format → Llama 3.3 format (Hugging Face or provider-specific)
- Optionally enhance with reasoning chains for better Llama performance

**Deliverables:**
- `voice_parsing_llama_format.jsonl` (3,890 examples)
- Conversion script (Python)
- Format validation

---

### **CATEGORY 2: Knowledge Base Extraction**
**Purpose:** Convert Supabase knowledge base chunks into training examples

**Tasks:**
- Query all 23 chunks from Supabase `knowledge_base` table
- Convert each chunk into Q&A training examples
- Create multi-turn conversations for complex topics (program generation, injury modifications)

**Deliverables:**
- `knowledge_base_training.jsonl` (~100-200 examples)
- Extraction script (Python)

---

### **CATEGORY 3: Injury Analysis Training Data Generation**
**Purpose:** Generate 825 comprehensive injury analysis examples

**Tasks:**
- Use `docs/LLAMA_3.3_INJURY_TRAINING_PROMPT_REFINED.md` to generate examples
- Generate in batches (75-150 examples per batch)
- Quality assurance review for each batch
- Ensure reasoning chains, confidence calibration, and escalation triggers are present

**Deliverables:**
- `injury_analysis_training.jsonl` (825 examples)
- Generation script (uses Claude/GPT-4 to generate examples)
- QA checklist

---

### **CATEGORY 4: AI Coach Training Data Generation**
**Purpose:** Create comprehensive AI coach Q&A dataset

**Tasks:**
- Create research prompt for AI coach examples
- Generate examples covering: programming, technique, nutrition, recovery, motivation
- Include multi-turn conversations
- Include context-dependent responses (beginner vs. advanced)

**Deliverables:**
- `ai_coach_training.jsonl` (800-1,200 examples)
- Research prompt document
- Generation script

---

### **CATEGORY 5: Running/Cardio Training Data Generation**
**Purpose:** Add running and cardio capabilities

**Tasks:**
- Create research prompt for running/cardio examples
- Generate voice parsing examples ("5 mile run at 8:30 pace")
- Generate running advice examples (training plans, injury prevention)
- Include pace calculations, distance conversions

**Deliverables:**
- `running_cardio_training.jsonl` (300-500 examples)
- Research prompt document
- Generation script

---

### **CATEGORY 6: Data Merging & Quality Assurance**
**Purpose:** Combine all training data and validate quality

**Tasks:**
- Merge all JSONL files into single comprehensive dataset
- Validate JSON format correctness
- Check for duplicates
- Verify distribution across categories
- Sample testing (manual review of random examples)

**Deliverables:**
- `voicefit_llama_training_complete.jsonl` (~6,000-7,000 examples)
- Validation report
- Distribution analysis

---

### **CATEGORY 7: Model Training & Evaluation**
**Purpose:** Fine-tune Llama 3.3 70B and validate performance

**Tasks:**
- Upload training data to fine-tuning platform (Hugging Face, Together AI, or Fireworks AI)
- Configure training parameters (epochs, learning rate, batch size)
- Monitor training progress
- Evaluate on held-out test set
- Compare performance to GPT-4o Mini baseline

**Deliverables:**
- Fine-tuned Llama 3.3 70B model
- Training metrics report
- Performance comparison (Llama vs. GPT-4o Mini)
- Cost analysis

---

### **CATEGORY 8: Integration & Deployment**
**Purpose:** Integrate fine-tuned model into VoiceFit backend

**Tasks:**
- Update backend to support Llama 3.3 70B API
- Update all AI endpoints to use new model
- A/B testing (Llama vs. GPT-4o Mini)
- Monitor latency and accuracy in production
- Gradual rollout (10% → 50% → 100%)

**Deliverables:**
- Updated backend code
- A/B testing results
- Production monitoring dashboard
- Rollback plan

---

## Summary of Work Required

| Category | Examples | Status | Priority | Estimated Time |
|----------|----------|--------|----------|----------------|
| 1. Voice Parsing (existing) | 3,890 | ✅ Have data | P0 | 2-4 hours (conversion) |
| 2. Knowledge Base (existing) | ~150 | ✅ Have data | P1 | 4-8 hours (extraction) |
| 3. Injury Analysis (new) | 825 | ❌ Need to generate | P0 | 2-3 weeks |
| 4. AI Coach (new) | 1,000 | ❌ Need to generate | P1 | 2-3 weeks |
| 5. Running/Cardio (new) | 400 | ❌ Need to generate | P2 | 1-2 weeks |
| 6. Data Merging & QA | N/A | ❌ Not started | P0 | 1 week |
| 7. Model Training | N/A | ❌ Not started | P0 | 1-2 days |
| 8. Integration & Deployment | N/A | ❌ Not started | P0 | 1-2 weeks |
| **TOTAL** | **~6,265** | | | **8-12 weeks** |

---

## Next Steps

1. ✅ **Review this master plan** - Confirm approach and priorities
2. ⏳ **Deep dive on Category 1** - Voice parsing data extraction and conversion
3. ⏳ **Deep dive on Category 2** - Knowledge base extraction
4. ⏳ **Deep dive on Category 3** - Injury analysis generation (already have prompt)
5. ⏳ **Create research prompts** - For Categories 4 & 5
6. ⏳ **Execute in phases** - Start with P0 items, then P1, then P2

---

**Status: READY FOR DETAILED PLANNING** ✅

