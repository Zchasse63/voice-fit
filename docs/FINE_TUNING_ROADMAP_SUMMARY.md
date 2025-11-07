# VoiceFit AI Fine-Tuning Roadmap - Executive Summary

**Version:** 1.0  
**Date:** 2025-01-06  
**Purpose:** High-level roadmap for generating all training data and fine-tuning unified AI model

---

## Current Status

### ✅ What We Have

**Voice Parsing Model (COMPLETE)**
- 3,890 training examples
- 95.57% accuracy on weight parsing
- 99.74% accuracy on reps parsing
- 98.18% accuracy on RPE parsing
- Model ID: `ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`
- Location: `archive/fine-tuning/voice_training_data_final_merged.jsonl`

**Research & Reference Data (COMPLETE)**
- Injury keywords dictionary
- 165 exercise substitutions (in database)
- 70 body part stress mappings (in database)
- AI prompt templates
- Recovery protocols
- Medical disclaimers

### ❌ What We Need

**Training Examples (NOT STARTED)**
- 0/1,000 injury analysis examples
- 0/500 running/cardio examples
- 0/1,000 AI coach Q&A examples
- 0/500 workout insights examples
- 0/300 substitution explanations
- 0/200 program generation examples

**Total Needed:** 3,500+ new training examples

---

## The Plan: 3 Phases

### Phase 1: Immediate (Next 3-4 Weeks)

**Goal:** Unified model for voice parsing + injury analysis

**Training Data:**
- ✅ Voice parsing: 3,890 examples (existing)
- ⏳ Injury analysis: 1,000 examples (to generate)
- **Total:** ~5,000 examples

**Deliverables:**
1. 4 JSONL files for injury analysis (1,000 examples total)
2. Merged training file combining voice + injury data
3. Fine-tuned unified model v2.0
4. Validation and deployment

**Cost:** ~$25 training, ~$5/month inference  
**Timeline:** 3-4 weeks

---

### Phase 2: Medium-Term (3-6 Months)

**Goal:** Add AI Coach, Workout Insights, Running Analysis

**Training Data:**
- ✅ Voice parsing: 3,890 examples (existing)
- ✅ Injury analysis: 1,000 examples (from Phase 1)
- ⏳ Running/cardio: 400 examples (to generate)
- ⏳ AI Coach Q&A: 1,000 examples (to generate)
- ⏳ Workout insights: 500 examples (to generate)
- **Total:** ~7,000 examples

**Deliverables:**
1. 10+ JSONL files for new use cases
2. Merged training file
3. Fine-tuned unified model v3.0
4. Validation and deployment

**Cost:** ~$35 training, ~$8/month inference  
**Timeline:** 3-6 months

---

### Phase 3: Long-Term (6-12 Months)

**Goal:** Complete AI system with program generation

**Training Data:**
- ✅ All Phase 1 & 2 data: ~7,000 examples
- ⏳ Exercise substitution explanations: 300 examples
- ⏳ Program generation: 200 examples
- **Total:** ~7,500 examples

**Deliverables:**
1. Complete training dataset
2. Fine-tuned unified model v4.0 (final)
3. Full AI feature set deployed

**Cost:** ~$40 training, ~$10/month inference  
**Timeline:** 6-12 months

---

## Research Prompts Provided

### Document: `RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

**Contains:**
1. **Exact research prompts** for each use case
2. **Required output formats** (JSONL with examples)
3. **Quality control checklists**
4. **File naming conventions**
5. **Example training data** for each category

**Total Research Prompts:** 19 separate prompts covering:
- Injury analysis (4 prompts, 1,000 examples)
- Running/cardio (3 prompts, 400 examples)
- AI Coach Q&A (4 prompts, 1,000 examples)
- Workout insights (5 prompts, 500 examples)
- Exercise substitutions (1 prompt, 300 examples)
- Program generation (2 prompts, 200 examples)

---

## Key Insights

### 1. We Can't Just "Restructure" Existing Data

**Why:**
- Current data is **reference material** (keywords, protocols, substitutions)
- Fine-tuning needs **input/output pairs** showing AI how to USE that material
- We have the cookbook, but we need to create the recipes

**Example:**
- ❌ Can't use: `{"pain_descriptors": ["sharp", "shooting", "stabbing"]}`
- ✅ Need: `{"user": "Sharp pain in shoulder", "assistant": "{\"injury_detected\": true, ...}"}`

### 2. Single Large File Required

**OpenAI Fine-Tuning Constraint:**
- Cannot upload multiple files
- Cannot retrain incrementally
- Must merge ALL training data into ONE JSONL file

**Solution:**
- Generate all training data as separate JSONL files
- Concatenate into single file before upload
- Each line is one complete training example

### 3. Quality Over Quantity

**Best Practices:**
- 1,000 high-quality examples > 5,000 mediocre examples
- Diverse scenarios (beginner, intermediate, advanced)
- Edge cases and ambiguous situations
- Natural language variations
- Consistent output format

---

## Immediate Next Steps

### For You (Project Owner)

1. ✅ **Review research prompts** in `RESEARCH_PROMPTS_FOR_FINE_TUNING.md`
2. ⏳ **Assign to research team** with clear deadlines
3. ⏳ **Set up quality review process** for incoming JSONL files
4. ⏳ **Decide on Phase 1 timeline** (3-4 weeks realistic?)

### For Research Team

1. ⏳ **Read research prompts document** thoroughly
2. ⏳ **Generate injury analysis data** (Priority P0):
   - `injury_analysis_clear_cases.jsonl` (400 examples)
   - `injury_analysis_ambiguous_cases.jsonl` (300 examples)
   - `injury_analysis_normal_doms.jsonl` (200 examples)
   - `injury_analysis_red_flags.jsonl` (100 examples)
3. ⏳ **Submit for quality review** as each file is completed
4. ⏳ **Iterate based on feedback**

### For Development Team (Me)

1. ✅ **Create merge script** to combine JSONL files
2. ✅ **Set up validation pipeline** to check JSONL format
3. ⏳ **Prepare fine-tuning pipeline** for OpenAI upload
4. ⏳ **Create test suite** for model validation

---

## Success Metrics

### Phase 1 Success Criteria

**Injury Analysis Accuracy:**
- 90%+ accuracy on body part detection
- 85%+ accuracy on severity classification
- 95%+ accuracy on red flag detection
- 80%+ accuracy on affected exercise recommendations

**Voice Parsing Accuracy (Maintain):**
- 95%+ accuracy on weight parsing
- 99%+ accuracy on reps parsing
- 98%+ accuracy on RPE parsing

**No Regression:**
- New injury analysis features don't hurt voice parsing performance
- Model size stays under OpenAI limits
- Inference latency < 2 seconds

---

## Cost Breakdown

### Training Costs (One-Time)

| Phase | Examples | Training Cost | Timeline |
|-------|----------|---------------|----------|
| Phase 1 | ~5,000 | $25 | 3-4 weeks |
| Phase 2 | ~7,000 | $35 | 3-6 months |
| Phase 3 | ~7,500 | $40 | 6-12 months |

### Inference Costs (Monthly)

| Phase | Features | Monthly Cost | Per-User Cost |
|-------|----------|--------------|---------------|
| Phase 1 | Voice + Injury | $5 | $0.05 |
| Phase 2 | + Coach + Insights | $8 | $0.08 |
| Phase 3 | + Programs | $10 | $0.10 |

**Assumptions:**
- 100 active users
- 10 AI calls per user per day
- GPT-4o Mini pricing

---

## Risk Mitigation

### Risk 1: Training Data Quality

**Risk:** Low-quality training data leads to poor model performance

**Mitigation:**
- Detailed research prompts with examples
- Quality review process for each JSONL file
- Test on validation set before deployment
- Iterative improvement based on feedback

### Risk 2: Model Regression

**Risk:** Adding new features hurts existing voice parsing accuracy

**Mitigation:**
- Maintain existing 3,890 voice parsing examples in training set
- Test voice parsing accuracy after each fine-tune
- Roll back if accuracy drops below 95%

### Risk 3: Timeline Slippage

**Risk:** Research team takes longer than expected

**Mitigation:**
- Start with Phase 1 only (injury analysis)
- Can deploy Phase 1 model while Phase 2 data is being generated
- Incremental value delivery

### Risk 4: Cost Overruns

**Risk:** Fine-tuning costs more than expected

**Mitigation:**
- Start with smaller dataset (500 examples) to test
- Monitor costs closely
- Can reduce example count if needed

---

## Questions & Answers

**Q: Can we start fine-tuning now?**  
A: No - we need to generate injury analysis training data first (1,000 examples).

**Q: How long will Phase 1 take?**  
A: 3-4 weeks to generate data + 1 week to fine-tune and validate = ~1 month total.

**Q: Can we do this in parallel with app development?**  
A: Yes! Research team generates data while dev team continues building features.

**Q: What if we want to add more features later?**  
A: We'll need to regenerate the entire training file and fine-tune again. That's why we're planning in phases.

**Q: Can we use a different AI provider?**  
A: Yes - all training data is in standard JSONL format, portable to Claude, Gemini, Mistral, etc.

---

## Documents Created

1. ✅ **`RESEARCH_PROMPTS_FOR_FINE_TUNING.md`** - Detailed research prompts and output formats
2. ✅ **`CURRENT_INJURY_DATA_STATUS.md`** - What we have vs. what we need
3. ✅ **`FINE_TUNING_ROADMAP_SUMMARY.md`** - This document (executive summary)

**All documents are in `docs/` directory and ready for review.**

---

## Ready to Proceed?

**Next Action:** Review research prompts document and assign to research team with deadlines.

**Timeline:**
- Week 1-2: Generate clear injury cases (400 examples)
- Week 2-3: Generate ambiguous cases (300 examples)
- Week 3-4: Generate DOMS and red flag cases (300 examples)
- Week 4: Quality review and merge
- Week 5: Fine-tune and validate
- Week 6: Deploy to production

**Let's build the best AI-powered fitness app! 💪🚀**

