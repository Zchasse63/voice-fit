# Parallel API Test Plan - Injury Analysis Generation

**Date:** 2025-11-07  
**Purpose:** Test Parallel Deep Research API for generating Llama 3.3 70B injury analysis training data  
**Test Size:** 50 examples (6% of full 825 example dataset)

---

## Test Overview

### What We're Testing

Using the Parallel Deep Research API to generate injury analysis training examples with:
- ✅ Reasoning chains (HOW the model reaches conclusions)
- ✅ Differential diagnosis with confidence scores
- ✅ Specific exercise modifications (avoid/substitute pairs)
- ✅ Recovery timelines with phase-based checkpoints
- ✅ Red flags requiring medical attention
- ✅ Confidence reasoning

### Why This Test

Before committing to generating all 825 injury analysis examples, we need to:
1. **Estimate actual costs** - Verify pricing across processor tiers
2. **Evaluate output quality** - Ensure examples meet Llama 3.3 70B training requirements
3. **Compare processor tiers** - Determine optimal cost/quality balance
4. **Validate approach** - Confirm Parallel API can generate the structured output we need

---

## Test Configuration

### Sample Size: 50 Examples

**Distribution across injury categories:**
- Acute injuries: 10 examples (20%)
- Chronic/overuse: 15 examples (30%)
- Tendinitis/tendinopathy: 10 examples (20%)
- False positives (DOMS): 10 examples (20%)
- Ambiguous cases: 5 examples (10%)

**This mirrors the full 825 example distribution:**
- Acute: 75 (9%)
- Chronic: 150 (18%)
- Tendinitis: 100 (12%)
- DOMS: 100 (12%)
- Ambiguous: 75 (9%)
- Multi-turn: 150 (18%)
- Other categories: 175 (21%)

### Processor Tiers to Test

| Processor | Cost/Request | 50 Examples | 825 Examples | Quality |
|-----------|-------------|-------------|--------------|---------|
| **lite** | $0.005 | **$0.25** | $4.13 | Basic |
| **base** | $0.01 | **$0.50** | $8.25 | Simple |
| **core** ⭐ | $0.025 | **$1.25** | $20.63 | Complex (RECOMMENDED) |
| **ultra** | $0.30 | $15.00 | $247.50 | Maximum detail |

**Recommendation:** Test `lite`, `base`, and `core` to compare quality vs. cost.

---

## How to Run the Test

### Prerequisites

1. **Set API key:**
```bash
export PARALLEL_API_KEY="NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3"
```

2. **Navigate to project:**
```bash
cd /Users/zach/Desktop/VoiceFit
```

### Run the Test

```bash
python3 test_parallel_injury_generation.py
```

**Interactive menu will ask:**
1. Which processor to test (lite/base/core/all)
2. Confirm cost estimate
3. Begin generation

**Expected runtime:**
- `lite`: 5-10 minutes (5-60s per request)
- `base`: 15-30 minutes (15-100s per request)
- `core`: 30-60 minutes (1-5min per request)

---

## What the Test Generates

### Output Files

For each processor tested, creates a JSON file:
```
injury_analysis_test_lite_20251107_HHMMSS.json
injury_analysis_test_base_20251107_HHMMSS.json
injury_analysis_test_core_20251107_HHMMSS.json
```

### Example Output Structure

```json
{
  "scenario": {
    "category": "acute",
    "user_input": "Sharp pain in shoulder during overhead press, felt something pop",
    "context": {
      "exercise": "overhead press",
      "severity": "severe",
      "mechanism": "sudden_pop"
    }
  },
  "training_example": {
    "user_input": "Sharp pain in shoulder during overhead press, felt something pop",
    "reasoning_chain": [
      "User reports sharp pain - indicates acute injury, not DOMS",
      "Felt 'something pop' - suggests structural damage (tendon/ligament)",
      "During overhead press - high shoulder stress position",
      "Immediate onset - rules out gradual overuse",
      "High probability of rotator cuff tear or labral injury"
    ],
    "differential_diagnosis": [
      {
        "condition": "Rotator cuff tear",
        "probability": 0.65,
        "reasoning": "Pop sensation during overhead movement is classic presentation"
      },
      {
        "condition": "Labral tear",
        "probability": 0.25,
        "reasoning": "Can also present with pop, but less common in pressing"
      },
      {
        "condition": "Shoulder impingement",
        "probability": 0.10,
        "reasoning": "Possible, but pop sensation less typical"
      }
    ],
    "primary_assessment": {
      "injury_type": "Suspected rotator cuff tear",
      "severity": "severe",
      "confidence": 0.85,
      "confidence_reasoning": "Clear mechanism (pop), acute onset, specific movement - high confidence in structural injury"
    },
    "exercise_modifications": [
      {
        "avoid": "Overhead press",
        "substitute": "Landmine press",
        "load_adjustment": "Start with 30-40% of overhead press weight",
        "sets_reps": "3 sets of 12-15 reps",
        "progression_criteria": "Pain-free for 2 weeks, then increase weight by 5-10 lbs"
      },
      {
        "avoid": "Pull-ups",
        "substitute": "Lat pulldown (neutral grip)",
        "load_adjustment": "50-60% of normal working weight",
        "sets_reps": "3 sets of 10-12 reps",
        "progression_criteria": "Full ROM pain-free, then progress to assisted pull-ups"
      }
    ],
    "recovery_timeline": {
      "total_weeks": 12,
      "phases": [
        {
          "phase_name": "Acute phase",
          "duration_weeks": 2,
          "goals": ["Reduce inflammation", "Maintain ROM", "Avoid aggravation"],
          "checkpoints": ["Pain reduced to 2/10 or less", "Can lift arm overhead without sharp pain"]
        },
        {
          "phase_name": "Rehabilitation phase",
          "duration_weeks": 6,
          "goals": ["Rebuild strength", "Restore ROM", "Progressive loading"],
          "checkpoints": ["Can perform landmine press pain-free", "Shoulder strength 70% of uninjured side"]
        },
        {
          "phase_name": "Return to training",
          "duration_weeks": 4,
          "goals": ["Return to overhead pressing", "Full strength restoration"],
          "checkpoints": ["Overhead press at 80% previous weight pain-free", "No pain during or after training"]
        }
      ]
    },
    "red_flags": [
      "Inability to lift arm at all",
      "Severe swelling or bruising",
      "Numbness or tingling down arm",
      "No improvement after 2 weeks of rest",
      "Pain worsening despite modifications"
    ]
  },
  "citations": [...],
  "processor_used": "core"
}
```

---

## Evaluation Criteria

### Quality Checklist

For each generated example, evaluate:

**✅ Reasoning Chains:**
- [ ] Shows step-by-step analysis
- [ ] References specific symptoms
- [ ] Explains HOW conclusions are reached
- [ ] Appropriate level of detail

**✅ Differential Diagnosis:**
- [ ] Multiple conditions considered
- [ ] Probability scores make sense
- [ ] Reasoning for each condition provided
- [ ] Primary diagnosis is most likely

**✅ Exercise Modifications:**
- [ ] Specific avoid/substitute pairs
- [ ] Load adjustments with percentages
- [ ] Sets/reps recommendations
- [ ] Clear progression criteria

**✅ Recovery Timeline:**
- [ ] Realistic total duration
- [ ] Clear phases with goals
- [ ] Specific checkpoints
- [ ] Progressive approach

**✅ Red Flags:**
- [ ] Medically appropriate
- [ ] Specific and actionable
- [ ] Cover serious complications

**✅ Confidence Reasoning:**
- [ ] Explains confidence level
- [ ] References available information
- [ ] Acknowledges limitations

### Processor Comparison

Compare across tiers:
- **Detail level** - How comprehensive are the examples?
- **Citation quality** - Are sources credible and relevant?
- **Reasoning depth** - How thorough is the analysis?
- **Accuracy** - Are recommendations medically sound?
- **Consistency** - Do examples follow the same structure?

---

## Cost Analysis

### Test Costs (50 examples)

| Processor | Cost | Time | Quality Expected |
|-----------|------|------|-----------------|
| lite | $0.25 | 5-10 min | Basic info, may lack detail |
| base | $0.50 | 15-30 min | Good for simple cases |
| core | $1.25 | 30-60 min | Comprehensive, recommended |
| All three | $2.00 | 50-100 min | Full comparison |

### Full Generation Costs (825 examples)

| Processor | Cost | Time | Recommendation |
|-----------|------|------|----------------|
| lite | $4.13 | 1-2 hours | ❌ Too basic |
| base | $8.25 | 3-5 hours | ⚠️ May lack detail |
| core | $20.63 | 12-18 hours | ✅ **RECOMMENDED** |
| ultra | $247.50 | 2-3 days | ❌ Overkill, too expensive |

**Recommendation:** Use `core` processor for full generation (~$20.63 total)

---

## Decision Matrix

After reviewing test results, decide:

### Option 1: Use Parallel API (RECOMMENDED if quality is good)
- **Pros:** Structured output, citations, fast generation
- **Cons:** Costs ~$20.63 for 825 examples
- **Timeline:** 12-18 hours for full generation
- **Next step:** Run full generation with `core` processor

### Option 2: Use GPT-4 for generation
- **Pros:** More control over output format
- **Cons:** More expensive (~$30-50), requires more prompting
- **Timeline:** 2-3 days for full generation
- **Next step:** Create GPT-4 generation script

### Option 3: Hybrid approach
- **Pros:** Use Parallel for research, GPT-4 for formatting
- **Cons:** More complex workflow
- **Timeline:** 2-3 days
- **Next step:** Design hybrid pipeline

---

## Next Steps

### After Test Completion:

1. **Review generated examples** (30-60 minutes)
   - Check quality against criteria
   - Compare processor tiers
   - Identify any issues

2. **Make decision** (15 minutes)
   - Choose processor tier
   - Decide on Parallel API vs. alternatives
   - Estimate full generation cost/time

3. **If proceeding with Parallel API:**
   - Modify script for full 825 examples
   - Add progress tracking and checkpointing
   - Run full generation (12-18 hours)
   - Quality assurance review
   - Format as JSONL for Llama training

4. **If NOT proceeding with Parallel API:**
   - Document reasons
   - Design alternative approach
   - Create new generation script

---

## Success Criteria

Test is successful if:
- ✅ Examples meet Llama 3.3 70B training requirements
- ✅ Reasoning chains are clear and logical
- ✅ Exercise modifications are specific and actionable
- ✅ Recovery timelines are realistic
- ✅ Cost is acceptable (~$20-25 for full generation)
- ✅ Output format is consistent and parseable

---

## Files Created

1. `test_parallel_injury_generation.py` - Test script
2. `docs/PARALLEL_API_TEST_PLAN.md` - This document
3. `injury_analysis_test_*.json` - Generated examples (after running test)

---

**Ready to run the test!** 🚀

Execute: `python3 test_parallel_injury_generation.py`

