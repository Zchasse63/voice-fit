# VoiceFit - Future To-Do List

**Last Updated:** 2025-11-06

This document tracks future enhancements and AI fine-tuning work that will be completed AFTER the current phase (injury detection system) is fully tested and deployed.

---

## 🚀 **Phase 7: AI-Enhanced Exercise Substitution Explanations (Premium Feature)**

**Status:** Not Started  
**Priority:** Medium  
**Estimated Time:** Part of comprehensive AI fine-tuning (3-6 months)  
**Dependencies:** Comprehensive AI fine-tuning must be complete

### **Overview**
Add AI-powered personalized explanations for exercise substitutions as a Premium tier feature. Free users will see database-driven explanations; Premium users get AI-enhanced personalized explanations based on their injury type, recovery timeline, pain level, and experience level.

### **Tasks**

#### 1. Generate Training Data (300 examples)
- [ ] Use research prompts 13-15 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`
- [ ] Generate 300 training examples of personalized substitution explanations
- [ ] Format as JSONL for fine-tuning
- [ ] Include variety of:
  - Injury types (shoulder, knee, lower back, elbow, hip)
  - Recovery timelines (week 1, week 4, week 8, etc.)
  - Pain levels (1-10 scale)
  - Experience levels (beginner, intermediate, advanced)
  - Substitution scenarios (strength, hypertrophy, endurance)

**Example Training Data Format:**
```jsonl
{"messages": [{"role": "system", "content": "You are an AI exercise substitution expert for VoiceFit. Generate personalized explanations for why a specific exercise substitution is recommended based on the user's injury, recovery timeline, and experience level."}, {"role": "user", "content": "Exercise: Barbell Bench Press\nSubstitute: Dumbbell Bench Press\nInjury: Rotator cuff strain (shoulder)\nRecovery Week: 2\nPain Level: 3/10\nExperience: Intermediate\nSimilarity Score: 0.88\nNotes: EMG shows 13-25% higher pec activation with dumbbells; greater ROM; independent arm movement corrects imbalances"}, {"role": "assistant", "content": "I recommend Dumbbell Bench Press as your substitute for Barbell Bench Press. Here's why this is perfect for your rotator cuff recovery:\n\n**Why This Works for Your Shoulder**\nDumbbells let your shoulder move naturally through its full range of motion, which is crucial for rotator cuff healing. Unlike the barbell which locks your shoulders into a fixed path, dumbbells allow your injured shoulder to find its comfortable position throughout the movement. This reduces impingement risk by 30-40%.\n\n**You Won't Lose Strength**\nThis substitute has a 0.88 similarity score (out of 1.0), meaning it works nearly the same muscles. In fact, EMG studies show dumbbells actually activate your chest 13-25% MORE than barbells, so you might even see better gains!\n\n**Starting Point for Week 2 Recovery**\nSince you're 2 weeks into recovery with a pain level of 3/10:\n- Start with 40-50% of your normal barbell weight (so if you bench 225 lbs, use 45-50 lb dumbbells)\n- Do 3 sets of 8-10 reps\n- Stop if pain exceeds 3/10\n- Focus on slow, controlled movement\n\n**Progression**\n- Week 3-4: Increase to 60-70% if pain-free\n- Week 5-6: Increase to 80-90% if full ROM is pain-free\n- Week 7+: Consider returning to barbell if cleared by your recovery check-ins\n\n**Red Flags**\nStop immediately if you feel:\n- Sharp pain (vs dull muscle fatigue)\n- Clicking or popping in the shoulder\n- Pain that persists after the set\n\nYour shoulder will thank you for this switch! 💪"}]}
```

#### 2. Backend Implementation
- [ ] Create `POST /api/exercises/substitutes/explain-ai` endpoint
- [ ] Input parameters:
  - `exercise_name` (string)
  - `substitute_name` (string)
  - `injured_body_part` (string)
  - `injury_type` (string)
  - `recovery_week` (number)
  - `pain_level` (number, 0-10)
  - `experience_level` (string: beginner/intermediate/advanced)
  - `user_id` (string, for Premium verification)
- [ ] Use fine-tuned GPT-4o Mini model
- [ ] Return personalized explanation with:
  - Why this substitution works for their specific injury
  - Scientific evidence (formatted for user-friendly reading)
  - Starting point recommendations based on recovery timeline
  - Progression plan (week-by-week)
  - Red flags to watch for

#### 3. Premium Tier Gating
- [ ] Verify Premium subscription before allowing access
- [ ] Free users see database-driven explanations only
- [ ] Premium users get AI-enhanced explanations
- [ ] Add feature flag for testing/rollout

#### 4. Frontend Integration
- [ ] Update `WorkoutAdjustmentModal.tsx` to show "Get AI Explanation" button for Premium users
- [ ] Show "Upgrade to Premium" prompt for Free users
- [ ] Display AI-generated explanation in modal or expandable section
- [ ] Add loading state while AI generates explanation

#### 5. Testing
- [ ] Test AI explanation quality across different scenarios
- [ ] Verify personalization (different recovery weeks, pain levels, experience)
- [ ] Test Premium tier enforcement
- [ ] Monitor API costs and latency
- [ ] Collect user feedback on explanation quality

---

## 🤖 **Phase 8: Comprehensive AI Fine-Tuning**

**Status:** Not Started  
**Priority:** High  
**Estimated Time:** 3-6 months (data generation) + 3-6 hours (fine-tuning)  
**Dependencies:** Research team to generate training data

### **Overview**
Complete comprehensive AI fine-tuning covering ALL 6 use cases in a single fine-tuning effort. This replaces the current voice-only fine-tuned model with a comprehensive model that handles voice parsing, injury analysis, running/cardio, AI coach Q&A, workout insights, exercise substitutions, and program generation.

**Total Training Examples:** 6,690-9,890 examples in single JSONL file

### **Why One Large File?**
OpenAI fine-tuning requires a single JSONL file. We cannot retrain or add multiple JSON files. All training data must be merged into one comprehensive file before fine-tuning.

---

### **Step 1: Consolidate Existing Voice Parsing Data**

- [ ] Copy existing 3,890 voice parsing examples from `archive/fine-tuning/voice_training_data_final_merged.jsonl`
- [ ] Verify format correctness (JSONL with messages array)
- [ ] Current accuracy: 95.57% on voice parsing
- [ ] Keep all existing examples to maintain voice parsing performance

---

### **Step 2: Generate Injury Analysis Training Data (500 examples)**

**Research Prompts:** Use prompts 1-6 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 1.1:** Clear injury cases (400 examples)
  - Acute injuries (50)
  - Chronic/overuse injuries (150)
  - Tendinitis/tendinopathy (100)
  - Impingement/joint issues (100)

- [ ] **Prompt 1.2:** Ambiguous cases (100 examples)
  - DOMS vs injury (40)
  - Mild discomfort (30)
  - Vague descriptions (30)

- [ ] **Prompt 2:** Severity classification (covered in 1.1-1.2)

- [ ] **Prompt 3:** Differential diagnosis (covered in 1.1-1.2)

- [ ] **Prompt 4:** Recovery protocols (covered in 1.1-1.2)

- [ ] **Prompt 5:** Red flag detection (covered in 1.1-1.2)

- [ ] **Prompt 6:** Medical disclaimers (covered in 1.1-1.2)

**Output:** `injury_analysis_training_data.jsonl` (500 examples)

---

### **Step 3: Generate Running/Cardio Training Data (300-500 examples)**

**Research Prompts:** Use prompts 7-9 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 7:** Pace/distance parsing (150-200 examples)
  - "Ran 5 miles at 8:30 pace"
  - "Did a 10k in 52 minutes"
  - "Easy 3 mile recovery run"

- [ ] **Prompt 8:** Training zones (100-150 examples)
  - "Tempo run at threshold pace"
  - "Easy aerobic run"
  - "Interval training 400m repeats"

- [ ] **Prompt 9:** Run type classification (50-150 examples)
  - Long run, tempo, intervals, recovery, fartlek, etc.

**Output:** `running_cardio_training_data.jsonl` (300-500 examples)

---

### **Step 4: Generate AI Coach Q&A Training Data (800-1,200 examples)**

**Research Prompts:** Use prompts 10-12 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 10:** Form cues (300-400 examples)
  - "How do I fix my squat depth?"
  - "My bench press feels awkward"
  - "Deadlift form check"

- [ ] **Prompt 11:** Programming advice (300-400 examples)
  - "Should I train chest twice a week?"
  - "How do I break through a plateau?"
  - "What's the best rep range for hypertrophy?"

- [ ] **Prompt 12:** Nutrition guidance (200-400 examples)
  - "How much protein do I need?"
  - "Should I eat before or after workout?"
  - "What are good pre-workout meals?"

**Output:** `ai_coach_training_data.jsonl` (800-1,200 examples)

---

### **Step 5: Generate Workout Insights Training Data (400-600 examples)**

**Research Prompts:** Use prompt 16 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 16:** Post-workout analysis (400-600 examples)
  - Analyze workout performance
  - Identify trends (volume, intensity, RPE)
  - Provide recommendations for next session
  - Detect overtraining or undertraining

**Output:** `workout_insights_training_data.jsonl` (400-600 examples)

---

### **Step 6: Generate Exercise Substitution Training Data (300 examples)**

**Research Prompts:** Use prompts 13-15 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 13:** Substitution explanations (150 examples)
  - Why this substitute is recommended
  - Scientific evidence
  - Similarity score explanation

- [ ] **Prompt 14:** Injury-specific substitutions (100 examples)
  - Shoulder injury substitutions
  - Lower back injury substitutions
  - Knee injury substitutions

- [ ] **Prompt 15:** Personalized recommendations (50 examples)
  - Based on recovery timeline
  - Based on pain level
  - Based on experience level

**Output:** `exercise_substitution_training_data.jsonl` (300 examples)

---

### **Step 7: Generate Program Generation Training Data (500-1,000 examples)**

**Research Prompts:** Use prompts 17-19 from `docs/RESEARCH_PROMPTS_FOR_FINE_TUNING.md`

- [ ] **Prompt 17:** Periodization schemes (200-400 examples)
  - Linear periodization
  - Undulating periodization
  - Block periodization
  - Conjugate method

- [ ] **Prompt 18:** Exercise selection (200-400 examples)
  - Based on goals (strength, hypertrophy, endurance)
  - Based on equipment availability
  - Based on experience level
  - Based on injury history

- [ ] **Prompt 19:** Progression schemes (100-200 examples)
  - Progressive overload strategies
  - Deload protocols
  - Auto-regulation

**Output:** `program_generation_training_data.jsonl` (500-1,000 examples)

---

### **Step 8: Merge All Training Data**

- [ ] Combine all JSONL files into single comprehensive file:
  - `voice_training_data_final_merged.jsonl` (3,890 examples)
  - `injury_analysis_training_data.jsonl` (500 examples)
  - `running_cardio_training_data.jsonl` (300-500 examples)
  - `ai_coach_training_data.jsonl` (800-1,200 examples)
  - `workout_insights_training_data.jsonl` (400-600 examples)
  - `exercise_substitution_training_data.jsonl` (300 examples)
  - `program_generation_training_data.jsonl` (500-1,000 examples)

- [ ] **Total:** 6,690-9,890 examples

- [ ] Save as: `comprehensive_training_data_v1.jsonl`

---

### **Step 9: Validate Training Data**

- [ ] Run format validation:
  - Each line is valid JSON
  - Each example has `messages` array
  - Each message has `role` and `content`
  - System message is consistent

- [ ] Check token counts:
  - Ensure no examples exceed token limits
  - Calculate total tokens for cost estimation

- [ ] Detect duplicates:
  - Remove exact duplicates
  - Flag near-duplicates for review

- [ ] Quality sampling:
  - Manually review 50-100 random examples
  - Verify accuracy and formatting

- [ ] Distribution analysis:
  - Verify balanced distribution across use cases
  - Check for edge cases and variety

---

### **Step 10: Upload to OpenAI**

- [ ] Upload `comprehensive_training_data_v1.jsonl` to OpenAI
- [ ] Verify file upload successful
- [ ] Note file ID for fine-tuning job

---

### **Step 11: Create Fine-Tuning Job**

- [ ] Create fine-tuning job with:
  - Base model: `gpt-4o-mini-2024-07-18`
  - Training file: `comprehensive_training_data_v1.jsonl`
  - Validation split: 10%
  - Epochs: 3-5 (adjust based on validation loss)

- [ ] Note job ID for monitoring

---

### **Step 12: Monitor Fine-Tuning Progress**

- [ ] Monitor job status (queued → running → succeeded)
- [ ] Track training metrics:
  - Training loss
  - Validation loss
  - Token accuracy

- [ ] Estimated time: 3-6 hours for ~7,000-10,000 examples

---

### **Step 13: Test Fine-Tuned Model**

Test across ALL 6 use cases:

- [ ] **Voice Parsing:** Verify 95%+ accuracy maintained
- [ ] **Injury Analysis:** Test clear cases, ambiguous cases, red flags
- [ ] **Running/Cardio:** Test pace parsing, zone classification, run types
- [ ] **AI Coach:** Test form cues, programming advice, nutrition guidance
- [ ] **Workout Insights:** Test post-workout analysis and recommendations
- [ ] **Exercise Substitutions:** Test personalized explanations
- [ ] **Program Generation:** Test periodization, exercise selection, progression

---

### **Step 14: Update Backend**

- [ ] Update all AI endpoints to use new fine-tuned model ID:
  - `POST /api/voice/parse` (voice parsing)
  - `POST /api/injury/analyze` (injury analysis)
  - `POST /api/running/parse` (running/cardio parsing)
  - `POST /api/coach/ask` (AI coach Q&A)
  - `POST /api/workout/insights` (workout analysis)
  - `POST /api/exercises/substitutes/explain-ai` (substitution explanations)
  - `POST /api/program/generate` (program generation)

- [ ] Update environment variables:
  - `OPENAI_FINE_TUNED_MODEL_ID=ft:gpt-4o-mini-2024-07-18:personal:voicefit-comprehensive-v1:XXXXXX`

---

### **Step 15: Deploy and Monitor**

- [ ] Deploy to production
- [ ] Monitor accuracy metrics across all use cases
- [ ] Track API costs (fine-tuned model pricing)
- [ ] Collect user feedback
- [ ] Monitor error rates and edge cases
- [ ] Plan for v2 fine-tuning if needed (add more examples, fix issues)

---

## 📊 **Summary**

### **Phase 7: AI-Enhanced Substitution Explanations**
- **Training Data:** 300 examples
- **Endpoints:** 1 new endpoint (`POST /api/exercises/substitutes/explain-ai`)
- **Features:** Premium-only personalized explanations
- **Timeline:** Part of Phase 8 comprehensive fine-tuning

### **Phase 8: Comprehensive AI Fine-Tuning**
- **Training Data:** 6,690-9,890 examples (single JSONL file)
- **Use Cases:** 6 (voice, injury, running, coach, insights, substitutions, programs)
- **Endpoints:** 7 AI endpoints updated
- **Timeline:** 3-6 months (data generation) + 3-6 hours (fine-tuning)
- **Cost:** ~$50-150 for fine-tuning (based on token count)

---

## 🎯 **Next Steps**

1. **Complete current phase testing** (Phase 6)
2. **Build database-driven explanations** (Phase 7 - Free tier)
3. **Hand off to research team** for training data generation
4. **Wait for 6,690-9,890 training examples** to be generated
5. **Merge all data into single JSONL file**
6. **Fine-tune comprehensive model**
7. **Deploy and monitor**

---

**End of Future To-Do List**

