# Research Prompts for AI Fine-Tuning Data Collection

**Version:** 1.0  
**Date:** 2025-01-06  
**Purpose:** Comprehensive research prompts and output formats for generating training data across all VoiceFit AI use cases

---

## Overview

This document provides **exact research prompts** and **required output formats** for generating training data for VoiceFit's unified AI model. All research outputs must be in **JSONL format** (JSON Lines) to be merged into a single training file.

### Current Status

✅ **Voice Parsing**: 3,890 examples (complete)  
⏳ **Injury Analysis**: 0 examples (need 500-1,000)  
⏳ **Running/Cardio Analysis**: 0 examples (need 300-500)  
⏳ **AI Coach Q&A (Strength)**: 0 examples (need 1,000-2,000)  
⏳ **Workout Insights**: 0 examples (need 500-1,000)  
⏳ **Exercise Substitution Explanations**: 0 examples (need 300-500)  
⏳ **Program Generation**: 0 examples (need 200-500)

**Total Needed:** 2,500-5,500 new examples

---

## Standard JSONL Format

**ALL research outputs must follow this exact format:**

```jsonl
{"messages": [{"role": "system", "content": "SYSTEM_PROMPT"}, {"role": "user", "content": "USER_INPUT"}, {"role": "assistant", "content": "EXPECTED_OUTPUT"}]}
```

**Rules:**
- One JSON object per line (no pretty printing)
- Each line is a complete training example
- `system` message defines the AI's role and output format
- `user` message is the natural language input
- `assistant` message is the expected structured JSON output

---

## 1. Injury Analysis Training Data

### Research Prompt 1.1: Clear Injury Cases (400 examples needed)

**Prompt for Researcher:**

```
Generate 400 realistic injury descriptions from strength training athletes with clear injury indicators. Include:

1. **Acute injuries** (50 examples):
   - Sharp pain during specific exercises
   - Sudden onset during workout
   - Clear mechanism of injury
   - Examples: "Sharp pain in shoulder during overhead press", "Felt a pop in my knee during squats"

2. **Chronic/overuse injuries** (150 examples):
   - Gradual onset over weeks
   - Pain that worsens with specific movements
   - Examples: "Elbow has been hurting for 3 weeks, worse with curls", "Lower back aches after deadlifts"

3. **Tendinitis/tendinopathy** (100 examples):
   - Pain at tendon insertion points
   - Worse with loading, better with rest
   - Examples: "Achilles tendon pain when running", "Tennis elbow from too many pull-ups"

4. **Impingement/joint issues** (100 examples):
   - Pain with specific ROM
   - Clicking, catching, or grinding
   - Examples: "Shoulder clicks and hurts overhead", "Hip pinches in bottom of squat"

For each example, provide:
- Natural language injury description (as user would say it)
- Body part (shoulder, knee, lower_back, elbow, hip, ankle, wrist, neck, hamstrings)
- Severity (mild, moderate, severe)
- Injury type (strain, sprain, tendinitis, impingement, etc.)
- Red flags (if any): sharp_pain, numbness, swelling, loss_of_function, etc.
- Affected exercises (list 3-5 exercises that stress this area)
- Recovery recommendations (rest_24_hours, ice_therapy, consult_pt, etc.)
```

**Required Output Format:**

Save as `injury_analysis_clear_cases.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant for VoiceFit. Analyze user-reported pain/discomfort and provide structured injury assessment. Output must be valid JSON with fields: injury_detected (boolean), confidence (0-1), body_part (string), severity (mild/moderate/severe), injury_type (string), red_flags (array), affected_exercises (array), recommendations (array)."}, {"role": "user", "content": "Sharp pain in my right shoulder when I do overhead press. Started today during my workout."}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.92, \"body_part\": \"shoulder\", \"severity\": \"moderate\", \"injury_type\": \"rotator_cuff_strain\", \"red_flags\": [\"sharp_pain\", \"overhead_movement\"], \"affected_exercises\": [\"Overhead Press\", \"Bench Press\", \"Dips\", \"Lateral Raises\", \"Incline Press\"], \"recommendations\": [\"rest_48_hours\", \"ice_therapy\", \"avoid_overhead_movements\", \"consult_pt_if_persists\"], \"differential_diagnoses\": [\"impingement\", \"AC_joint_sprain\"]}"}]}
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant for VoiceFit. Analyze user-reported pain/discomfort and provide structured injury assessment. Output must be valid JSON with fields: injury_detected (boolean), confidence (0-1), body_part (string), severity (mild/moderate/severe), injury_type (string), red_flags (array), affected_exercises (array), recommendations (array)."}, {"role": "user", "content": "My lower back has been aching for 2 weeks. Gets worse after deadlifts and bent-over rows."}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.88, \"body_part\": \"lower_back\", \"severity\": \"moderate\", \"injury_type\": \"lumbar_strain\", \"red_flags\": [\"chronic_pain\", \"exercise_specific\"], \"affected_exercises\": [\"Deadlift\", \"Barbell Row\", \"Good Mornings\", \"Romanian Deadlift\", \"Squat\"], \"recommendations\": [\"rest_72_hours\", \"reduce_load_50_percent\", \"focus_on_form\", \"core_strengthening\", \"consult_pt\"], \"differential_diagnoses\": [\"disc_herniation\", \"facet_joint_irritation\"]}"}]}
```

### Research Prompt 1.2: Ambiguous Cases (300 examples needed)

**Prompt for Researcher:**

```
Generate 300 ambiguous injury descriptions where it's unclear if it's an injury or normal training soreness (DOMS). Include:

1. **Borderline DOMS vs injury** (150 examples):
   - Soreness that could be normal or concerning
   - Examples: "Shoulders feel tight and sore", "Legs are really sore 2 days after squats"

2. **Vague descriptions** (100 examples):
   - Non-specific pain locations
   - Unclear severity
   - Examples: "Something doesn't feel right in my back", "My knee feels weird"

3. **Multiple body parts** (50 examples):
   - Generalized soreness
   - Examples: "Everything hurts after leg day", "Sore all over"

For each, the AI should express LOWER confidence (0.4-0.7) and recommend monitoring.
```

**Required Output Format:**

Save as `injury_analysis_ambiguous_cases.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant for VoiceFit. Analyze user-reported pain/discomfort and provide structured injury assessment. Output must be valid JSON with fields: injury_detected (boolean), confidence (0-1), body_part (string), severity (mild/moderate/severe), injury_type (string), red_flags (array), affected_exercises (array), recommendations (array)."}, {"role": "user", "content": "My shoulders feel tight and sore after yesterday's workout."}, {"role": "assistant", "content": "{\"injury_detected\": false, \"confidence\": 0.55, \"body_part\": \"shoulder\", \"severity\": \"mild\", \"injury_type\": \"likely_DOMS\", \"red_flags\": [], \"affected_exercises\": [], \"recommendations\": [\"monitor_48_hours\", \"light_stretching\", \"adequate_rest\", \"seek_help_if_worsens\"], \"differential_diagnoses\": [\"normal_DOMS\", \"mild_strain\"]}"}]}
```

### Research Prompt 1.3: Normal DOMS (200 examples needed)

**Prompt for Researcher:**

```
Generate 200 descriptions of normal delayed onset muscle soreness (DOMS) that should NOT be flagged as injuries. Include:

1. **Post-workout soreness** (100 examples):
   - 24-72 hours after training
   - Bilateral, symmetrical
   - Improves with movement
   - Examples: "Quads are sore 2 days after leg day", "Chest feels tight after bench press yesterday"

2. **First-time exercise soreness** (50 examples):
   - New exercise or increased volume
   - Examples: "First time doing Bulgarian split squats, glutes are killing me"

3. **Returning from break** (50 examples):
   - Soreness after time off
   - Examples: "Took 2 weeks off, everything is sore now"

AI should confidently identify these as NOT injuries.
```

**Required Output Format:**

Save as `injury_analysis_normal_doms.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant for VoiceFit. Analyze user-reported pain/discomfort and provide structured injury assessment. Output must be valid JSON with fields: injury_detected (boolean), confidence (0-1), body_part (string), severity (mild/moderate/severe), injury_type (string), red_flags (array), affected_exercises (array), recommendations (array)."}, {"role": "user", "content": "My quads are super sore 2 days after leg day. Both legs equally sore."}, {"role": "assistant", "content": "{\"injury_detected\": false, \"confidence\": 0.95, \"body_part\": \"quadriceps\", \"severity\": \"mild\", \"injury_type\": \"normal_DOMS\", \"red_flags\": [], \"affected_exercises\": [], \"recommendations\": [\"continue_training\", \"light_activity\", \"adequate_protein\", \"hydration\"], \"differential_diagnoses\": []}"}]}
```

### Research Prompt 1.4: Red Flag Cases (100 examples needed)

**Prompt for Researcher:**

```
Generate 100 injury descriptions with RED FLAGS requiring immediate medical attention. Include:

1. **Neurological symptoms** (30 examples):
   - Numbness, tingling, weakness
   - Examples: "Numbness down my arm after bench press", "Can't feel my toes after deadlifts"

2. **Severe acute injuries** (30 examples):
   - Heard/felt a pop or tear
   - Immediate severe pain
   - Loss of function
   - Examples: "Heard a pop in my knee during squats, can't walk", "Felt something tear in my shoulder"

3. **Systemic symptoms** (20 examples):
   - Fever, night sweats, unexplained weight loss
   - Examples: "Back pain with fever", "Shoulder pain and feeling feverish"

4. **Cardiovascular symptoms** (20 examples):
   - Chest pain, shortness of breath, dizziness
   - Examples: "Chest pain during workout", "Dizzy and short of breath"

AI should flag these with HIGH confidence and recommend IMMEDIATE medical attention.
```

**Required Output Format:**

Save as `injury_analysis_red_flags.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an AI injury analysis assistant for VoiceFit. Analyze user-reported pain/discomfort and provide structured injury assessment. Output must be valid JSON with fields: injury_detected (boolean), confidence (0-1), body_part (string), severity (mild/moderate/severe), injury_type (string), red_flags (array), affected_exercises (array), recommendations (array)."}, {"role": "user", "content": "I felt a pop in my knee during squats and now I can't put weight on it. It's swelling up fast."}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.98, \"body_part\": \"knee\", \"severity\": \"severe\", \"injury_type\": \"ligament_tear_suspected\", \"red_flags\": [\"audible_pop\", \"immediate_severe_pain\", \"loss_of_function\", \"rapid_swelling\"], \"affected_exercises\": [\"ALL_LOWER_BODY\"], \"recommendations\": [\"SEEK_IMMEDIATE_MEDICAL_ATTENTION\", \"do_not_continue_training\", \"ice_and_elevate\", \"avoid_weight_bearing\"], \"differential_diagnoses\": [\"ACL_tear\", \"MCL_tear\", \"meniscus_tear\"]}"}]}
```

---

## 2. Running/Cardio Analysis Training Data

### Research Prompt 2.1: Weather-Adjusted Pace Analysis (150 examples needed)

**Prompt for Researcher:**

```
Generate 150 running workout scenarios with weather conditions and pace analysis. Include:

1. **Hot/humid conditions** (50 examples):
   - Temperature 75-95°F, humidity 60-90%
   - Slower pace expected
   - Examples: "5 mile run, 8:30/mile pace, 85°F, 75% humidity"

2. **Cold conditions** (30 examples):
   - Temperature 20-40°F
   - Examples: "3 mile run, 7:45/mile pace, 32°F, windy"

3. **Ideal conditions** (40 examples):
   - Temperature 50-65°F, low humidity
   - Examples: "6 mile run, 7:30/mile pace, 58°F, sunny"

4. **Elevation/terrain** (30 examples):
   - Hills, trails, altitude
   - Examples: "4 mile trail run, 9:15/mile pace, 1200ft elevation gain"

For each, provide analysis of whether pace was appropriate given conditions.
```

**Required Output Format:**

Save as `running_weather_pace_analysis.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are a running performance analyst for VoiceFit. Analyze running workouts considering weather, terrain, and elevation. Provide pace assessment and recommendations. Output must be valid JSON with fields: pace_assessment (excellent/good/fair/poor), weather_impact (string), effort_level (easy/moderate/hard), recommendations (array), adjusted_pace_range (object)."}, {"role": "user", "content": "I ran 5 miles at 8:30/mile pace. It was 85°F with 75% humidity. My usual easy pace is 8:00/mile."}, {"role": "assistant", "content": "{\"pace_assessment\": \"excellent\", \"weather_impact\": \"Hot and humid conditions typically slow pace by 20-30 seconds per mile. Your 8:30 pace in these conditions is equivalent to 8:00-8:10 in ideal weather.\", \"effort_level\": \"moderate\", \"recommendations\": [\"hydrate_well\", \"run_early_morning\", \"reduce_pace_in_heat\", \"monitor_heart_rate\"], \"adjusted_pace_range\": {\"min\": \"8:20\", \"max\": \"9:00\", \"ideal\": \"8:30\"}, \"performance_notes\": \"Excellent pacing discipline in challenging conditions. Heat adaptation is progressing well.\"}"}]}
```

---

## 3. AI Coach Q&A (Strength Training)

### Research Prompt 3.1: Exercise Form Questions (300 examples needed)

**Prompt for Researcher:**

```
Generate 300 common questions about strength training exercise form, technique, and execution. Include:

1. **Squat questions** (60 examples):
   - Depth, knee tracking, bar position
   - Examples: "How deep should I squat?", "Should my knees go past my toes?"

2. **Deadlift questions** (60 examples):
   - Back position, grip, setup
   - Examples: "Is my back supposed to be completely straight?", "Conventional or sumo?"

3. **Bench press questions** (40 examples):
   - Grip width, elbow position, arch
   - Examples: "How wide should my grip be?", "Should I arch my back?"

4. **Overhead press questions** (30 examples):
5. **Row questions** (30 examples):
6. **Accessory exercise questions** (80 examples):
   - Curls, triceps, lateral raises, etc.

Provide detailed, evidence-based answers with cues and common mistakes.
```

**Required Output Format:**

Save as `ai_coach_form_questions.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an expert strength training coach for VoiceFit. Answer questions about exercise form, technique, programming, and training principles. Provide evidence-based, practical advice."}, {"role": "user", "content": "How deep should I squat? I've heard different things."}, {"role": "assistant", "content": "Squat depth depends on your goals and mobility:\n\n**Powerlifting:** Hip crease below top of knee (\"parallel\" or deeper)\n**General strength:** Parallel is sufficient for most people\n**Olympic lifting:** Full depth (\"ass to grass\") required\n\n**Key points:**\n- Deeper squats activate glutes more (EMG studies show 25% more activation below parallel)\n- Only go as deep as you can maintain neutral spine\n- If your lower back rounds (\"butt wink\"), that's your depth limit\n- Ankle and hip mobility often limit depth - work on these\n\n**Recommendation:** Aim for parallel (hip crease at knee level) as a minimum. Go deeper if you have the mobility and can maintain form. Quality > depth."}]}
```

### Research Prompt 3.2: Programming Questions (300 examples needed)

**Prompt for Researcher:**

```
Generate 300 questions about training programming, periodization, and workout structure. Include:

1. **Volume/frequency questions** (80 examples):
   - "How many sets per muscle group per week?"
   - "Can I train chest twice a week?"

2. **Progression questions** (80 examples):
   - "When should I add weight?"
   - "How do I break through a plateau?"

3. **Deload questions** (40 examples):
   - "When should I deload?"
   - "How much should I reduce volume?"

4. **Exercise selection** (60 examples):
   - "What's the best chest exercise?"
   - "Do I need to do isolation work?"

5. **Recovery questions** (40 examples):
   - "How much rest between sets?"
   - "Can I train with soreness?"
```

**Required Output Format:**

Save as `ai_coach_programming_questions.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an expert strength training coach for VoiceFit. Answer questions about exercise form, technique, programming, and training principles. Provide evidence-based, practical advice."}, {"role": "user", "content": "How many sets per muscle group should I do per week?"}, {"role": "assistant", "content": "Research-backed volume recommendations:\n\n**Beginners (0-1 year):**\n- 10-15 sets per muscle group per week\n- Focus on compound movements\n- 2-3 sessions per week\n\n**Intermediate (1-3 years):**\n- 15-20 sets per muscle group per week\n- Mix of compound and isolation\n- 2-4 sessions per week\n\n**Advanced (3+ years):**\n- 20-25+ sets per muscle group per week\n- Higher frequency often beneficial\n- 3-6 sessions per week\n\n**Key principles:**\n- Start at lower end and add volume gradually\n- More isn't always better - recovery matters\n- Track performance - if lifts stall, you may be overdoing it\n- Larger muscles (back, legs) can handle more volume\n- Smaller muscles (biceps, calves) need less\n\n**Your current program:** [Would analyze user's actual program here]"}]}
```

### Research Prompt 3.3: Nutrition/Recovery Questions (200 examples needed)

**Prompt for Researcher:**

```
Generate 200 questions about nutrition, recovery, and lifestyle factors for strength training. Include:

1. **Protein questions** (60 examples):
   - "How much protein do I need?"
   - "Does timing matter?"

2. **Pre/post-workout nutrition** (40 examples):
   - "What should I eat before training?"
   - "Do I need a post-workout shake?"

3. **Sleep/recovery** (50 examples):
   - "How much sleep do I need?"
   - "What if I can't sleep 8 hours?"

4. **Supplements** (50 examples):
   - "Do I need creatine?"
   - "What supplements actually work?"
```

**Required Output Format:**

Save as `ai_coach_nutrition_recovery.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an expert strength training coach for VoiceFit. Answer questions about exercise form, technique, programming, and training principles. Provide evidence-based, practical advice."}, {"role": "user", "content": "How much protein do I need to build muscle?"}, {"role": "assistant", "content": "Evidence-based protein recommendations for muscle growth:\n\n**General guideline:** 0.7-1.0g per pound of bodyweight (1.6-2.2g/kg)\n\n**Examples:**\n- 150 lb person: 105-150g protein/day\n- 180 lb person: 126-180g protein/day\n- 200 lb person: 140-200g protein/day\n\n**Key research findings:**\n- More than 0.8g/lb shows minimal additional benefit (2018 meta-analysis)\n- Spread across 3-4 meals is optimal\n- 20-40g per meal maximizes muscle protein synthesis\n- Timing is less important than total daily intake\n\n**Practical tips:**\n- Aim for 0.8g/lb as a sweet spot\n- Don't stress about hitting exact numbers daily\n- Whole foods > supplements when possible\n- If cutting, go higher (1.0g/lb) to preserve muscle\n\n**Your stats:** [Would personalize based on user data]"}]}
```

### Research Prompt 3.4: Injury Prevention Questions (200 examples needed)

**Prompt for Researcher:**

```
Generate 200 questions about injury prevention, mobility, and prehab. Include:

1. **Warm-up questions** (50 examples):
   - "Do I need to warm up?"
   - "How long should I warm up?"

2. **Mobility/flexibility** (60 examples):
   - "Should I stretch before lifting?"
   - "How do I improve hip mobility?"

3. **Common pain questions** (60 examples):
   - "My shoulder clicks during bench press, is that bad?"
   - "Lower back tight after deadlifts, normal?"

4. **Prehab exercises** (30 examples):
   - "What exercises prevent shoulder injuries?"
   - "How do I strengthen my rotator cuff?"
```

**Required Output Format:**

Save as `ai_coach_injury_prevention.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an expert strength training coach for VoiceFit. Answer questions about exercise form, technique, programming, and training principles. Provide evidence-based, practical advice."}, {"role": "user", "content": "My shoulder clicks during bench press. Is that bad?"}, {"role": "assistant", "content": "Shoulder clicking during bench press - here's what you need to know:\n\n**Painless clicking:**\n- Usually harmless (cavitation - gas bubbles in joint)\n- Common in healthy shoulders\n- No action needed if no pain\n\n**Clicking WITH pain:**\n- Could indicate impingement\n- Labral issues\n- Rotator cuff problems\n- **Action:** Reduce weight, check form, see PT if persists\n\n**Form checks:**\n1. Are you retracting scapulae (shoulder blades back and down)?\n2. Is your grip width appropriate (forearms vertical at bottom)?\n3. Are elbows flaring too wide (should be ~45° from body)?\n4. Is bar path correct (slight arc, not straight up/down)?\n\n**Recommendations:**\n- Film your bench press from the side\n- Add rotator cuff work (face pulls, band pull-aparts)\n- Ensure proper warm-up\n- If pain develops, stop and assess\n\n**When to worry:** Pain, loss of strength, clicking gets worse, swelling"}]}
```

---

## 4. Workout Insights Training Data

### Research Prompt 4.1: Volume Analysis (200 examples needed)

**Prompt for Researcher:**

```
Generate 200 workout history scenarios for volume analysis. Include:

1. **Too much volume** (70 examples):
   - Excessive sets/reps
   - Performance declining
   - Examples: "30 sets for chest this week, lifts going down"

2. **Too little volume** (70 examples):
   - Minimal sets
   - Not progressing
   - Examples: "Only 6 sets for back per week, no progress in 2 months"

3. **Optimal volume** (60 examples):
   - Balanced programming
   - Steady progress
   - Examples: "15 sets for legs, adding 5lbs every 2 weeks"

Provide analysis and recommendations.
```

**Required Output Format:**

Save as `workout_insights_volume_analysis.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are a workout analysis AI for VoiceFit. Analyze training volume, frequency, intensity, and progression. Provide insights and recommendations. Output must be valid JSON with fields: insight_type (string), severity (low/medium/high), analysis (string), recommendations (array), metrics (object)."}, {"role": "user", "content": "Analyze my chest training: Week 1: 28 sets, Week 2: 32 sets, Week 3: 30 sets. My bench press went from 225x5 to 225x3 over these 3 weeks."}, {"role": "assistant", "content": "{\"insight_type\": \"excessive_volume\", \"severity\": \"high\", \"analysis\": \"Your chest volume (28-32 sets/week) is significantly above recommended ranges (15-20 sets for intermediate lifters). The declining performance (5 reps to 3 reps at same weight) indicates you're not recovering adequately. This is a classic sign of overtraining a muscle group.\", \"recommendations\": [\"reduce_volume_to_18_sets\", \"take_deload_week\", \"increase_rest_between_sessions\", \"monitor_recovery_markers\"], \"metrics\": {\"current_volume\": 30, \"recommended_volume\": 18, \"volume_change\": \"-40%\", \"performance_trend\": \"declining\"}, \"action_items\": [\"Cut chest volume by 40% next week\", \"Take a deload (50% volume, 70% intensity)\", \"Space chest sessions 72+ hours apart\", \"Track sleep and stress levels\"]}"}]}
```

### Research Prompt 4.2: Deload Detection (150 examples needed)

**Prompt for Researcher:**

```
Generate 150 scenarios where deload is needed or not needed. Include:

1. **Needs deload** (80 examples):
   - Fatigue markers: RPE increasing, weights decreasing, sleep issues
   - Examples: "RPE 9 for weights that used to be RPE 7, feeling beat up"

2. **Doesn't need deload** (70 examples):
   - Still progressing, recovering well
   - Examples: "Adding weight every week, feeling strong"

Provide deload recommendations when needed.
```

**Required Output Format:**

Save as `workout_insights_deload_detection.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are a workout analysis AI for VoiceFit. Analyze training volume, frequency, intensity, and progression. Provide insights and recommendations. Output must be valid JSON with fields: insight_type (string), severity (low/medium/high), analysis (string), recommendations (array), metrics (object)."}, {"role": "user", "content": "Last 4 weeks: Squat 315x5 RPE 7, 320x5 RPE 7.5, 320x4 RPE 8.5, 315x3 RPE 9. Sleep has been poor, feeling run down."}, {"role": "assistant", "content": "{\"insight_type\": \"deload_needed\", \"severity\": \"high\", \"analysis\": \"Clear fatigue accumulation: RPE increasing dramatically (7→9) while performance declining (5 reps→3 reps at lower weight). Combined with poor sleep, this indicates you need a deload week immediately.\", \"recommendations\": [\"take_deload_week_now\", \"reduce_volume_50_percent\", \"reduce_intensity_to_70_percent\", \"prioritize_sleep_recovery\"], \"metrics\": {\"rpe_trend\": \"increasing\", \"performance_trend\": \"declining\", \"fatigue_score\": 8.5}, \"deload_protocol\": {\"duration\": \"1_week\", \"volume_reduction\": \"50%\", \"intensity_reduction\": \"30%\", \"example_workout\": \"Squat: 3 sets x 5 reps @ 225 lbs (70% of 315)\"}, \"expected_outcome\": \"After deload, you should feel refreshed and be able to hit 320x5 at RPE 7-7.5 again.\"}"}]}
```

### Research Prompt 4.3: PR Predictions (150 examples needed)

**Prompt for Researcher:**

```
Generate 150 progression scenarios for PR predictions. Include:

1. **Linear progression** (60 examples):
   - Steady weekly increases
   - Examples: "Bench: 185x5, 190x5, 195x5, 200x5 over 4 weeks"

2. **Stalled progression** (50 examples):
   - Same weight for 3+ weeks
   - Examples: "Deadlift stuck at 405x3 for 5 weeks"

3. **Rapid progression** (40 examples):
   - Beginner gains
   - Examples: "Squat went from 135x5 to 185x5 in 6 weeks"

Predict next achievable PR based on trend.
```

**Required Output Format:**

Save as `workout_insights_pr_predictions.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are a workout analysis AI for VoiceFit. Analyze training volume, frequency, intensity, and progression. Provide insights and recommendations. Output must be valid JSON with fields: insight_type (string), severity (low/medium/high), analysis (string), recommendations (array), metrics (object)."}, {"role": "user", "content": "My bench press progression: Week 1: 185x5, Week 2: 190x5, Week 3: 195x5, Week 4: 200x5. All at RPE 7-8."}, {"role": "assistant", "content": "{\"insight_type\": \"pr_prediction\", \"severity\": \"low\", \"analysis\": \"Excellent linear progression! You're adding 5 lbs per week consistently at moderate RPE (7-8). This is sustainable intermediate-level progress.\", \"recommendations\": [\"continue_current_program\", \"attempt_205x5_next_week\", \"consider_210x3_in_2_weeks\"], \"metrics\": {\"weekly_increase\": \"5_lbs\", \"progression_rate\": \"2.7%_per_week\", \"consistency_score\": 9.5}, \"predictions\": {\"next_week\": {\"weight\": 205, \"reps\": 5, \"confidence\": 0.92}, \"2_weeks\": {\"weight\": 210, \"reps\": 3-5, \"confidence\": 0.85}, \"1_month\": {\"weight\": 215-220, \"reps\": 5, \"confidence\": 0.75}}, \"milestone_prediction\": \"At this rate, you'll hit 225x5 (2 plates) in approximately 5-6 weeks. Keep up the great work!\"}"}]}
```

---

## 5. Exercise Substitution Explanations

### Research Prompt 5.1: Substitution Reasoning (300 examples needed)

**Prompt for Researcher:**

```
Generate 300 exercise substitution scenarios with detailed explanations. Use the exercise_substitutions data we already have in the database. For each substitution pair:

1. Explain WHY it's a good substitute
2. Explain biomechanical similarities
3. Explain differences
4. Provide form cues for the substitute
5. Explain when to use each variation

Examples from our database:
- Barbell Bench Press → Dumbbell Bench Press (shoulder stress reduction)
- Conventional Deadlift → Trap Bar Deadlift (lower back protection)
- Pull-ups → Lat Pulldown (scalable resistance)

Include substitutions for:
- Injury modifications (150 examples)
- Equipment limitations (80 examples)
- Skill level adjustments (70 examples)
```

**Required Output Format:**

Save as `exercise_substitution_explanations.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are an exercise substitution expert for VoiceFit. Explain why exercises are good substitutes, biomechanical similarities/differences, and provide form cues. Be detailed and educational."}, {"role": "user", "content": "Why is dumbbell bench press a good substitute for barbell bench press when I have shoulder pain?"}, {"role": "assistant", "content": "Dumbbell bench press is an excellent substitute for barbell bench press with shoulder pain for several reasons:\n\n**Biomechanical Advantages:**\n1. **Greater ROM**: Dumbbells allow you to descend below chest level, reducing shoulder impingement at the top of the movement\n2. **Independent arm movement**: Each arm moves naturally, reducing stress on the shoulder joint\n3. **Neutral grip option**: You can rotate to a neutral grip (palms facing), which is more shoulder-friendly\n4. **Natural scapular movement**: Shoulder blades can move more freely vs. being pinned to the bench with a barbell\n\n**Muscle Activation:**\n- EMG studies show 13-25% HIGHER pec activation with dumbbells\n- Similar anterior deltoid and triceps activation\n- Increased stabilizer muscle recruitment\n\n**Form Cues:**\n1. Retract shoulder blades (back and down)\n2. Keep elbows at 45° angle from body\n3. Lower dumbbells to chest level or slightly below\n4. Press up and slightly together (don't bang dumbbells)\n5. Maintain wrist alignment over elbows\n\n**Load Adjustment:**\n- Expect to use ~40-45% of your barbell weight per dumbbell\n- Example: 225 lb barbell = ~45-50 lb dumbbells per hand\n\n**When to Use:**\n- Shoulder pain/impingement\n- Correcting strength imbalances\n- Hypertrophy focus (higher pec activation)\n- Limited barbell access"}]}
```

---

## 6. Program Generation

### Research Prompt 6.1: Beginner Programs (100 examples needed)

**Prompt for Researcher:**

```
Generate 100 complete beginner strength training programs (12 weeks each). Include:

1. **Linear progression programs** (40 examples):
   - 3-4 days per week
   - Full body or upper/lower splits
   - Focus on compound movements

2. **Bodyweight programs** (30 examples):
   - Minimal equipment
   - Progressive calisthenics

3. **Specialized beginner programs** (30 examples):
   - Women-specific
   - Older adults (50+)
   - Limited mobility

For each program, provide:
- 12-week periodization
- Exercise selection with sets/reps/RPE
- Progression scheme
- Deload weeks
- Exercise substitutions
```

**Required Output Format:**

Save as `program_generation_beginner.jsonl`:

```jsonl
{"messages": [{"role": "system", "content": "You are a program design expert for VoiceFit. Generate complete, periodized strength training programs based on user goals, experience level, and constraints. Output must be valid JSON with complete 12-week program structure."}, {"role": "user", "content": "Create a 12-week beginner strength program for a 25-year-old male, 3 days per week, full gym access, goal is general strength and muscle gain."}, {"role": "assistant", "content": "{\"program_name\": \"Beginner Full Body Strength - 12 Week Linear Progression\", \"duration_weeks\": 12, \"frequency\": 3, \"split_type\": \"full_body\", \"goal\": \"strength_and_hypertrophy\", \"experience_level\": \"beginner\", \"weeks\": [{\"week\": 1, \"phase\": \"adaptation\", \"workouts\": [{\"day\": \"A\", \"exercises\": [{\"name\": \"Barbell Back Squat\", \"sets\": 3, \"reps\": 8, \"rpe\": 6, \"rest_seconds\": 180, \"notes\": \"Focus on form, depth to parallel\"}, {\"name\": \"Barbell Bench Press\", \"sets\": 3, \"reps\": 8, \"rpe\": 6, \"rest_seconds\": 180}, {\"name\": \"Barbell Row\", \"sets\": 3, \"reps\": 8, \"rpe\": 6, \"rest_seconds\": 120}, {\"name\": \"Overhead Press\", \"sets\": 2, \"reps\": 8, \"rpe\": 6, \"rest_seconds\": 120}, {\"name\": \"Romanian Deadlift\", \"sets\": 2, \"reps\": 10, \"rpe\": 6, \"rest_seconds\": 120}]}, {\"day\": \"B\", \"exercises\": [{\"name\": \"Conventional Deadlift\", \"sets\": 3, \"reps\": 5, \"rpe\": 6, \"rest_seconds\": 240}, {\"name\": \"Incline Dumbbell Press\", \"sets\": 3, \"reps\": 10, \"rpe\": 6, \"rest_seconds\": 120}, {\"name\": \"Pull-ups (Assisted if needed)\", \"sets\": 3, \"reps\": \"AMRAP\", \"rpe\": 7, \"rest_seconds\": 120}, {\"name\": \"Dumbbell Shoulder Press\", \"sets\": 2, \"reps\": 10, \"rpe\": 6, \"rest_seconds\": 90}, {\"name\": \"Leg Press\", \"sets\": 2, \"reps\": 12, \"rpe\": 6, \"rest_seconds\": 120}]}]}, {\"week\": 4, \"phase\": \"deload\", \"volume_reduction\": 0.5, \"intensity_reduction\": 0.3, \"notes\": \"Deload week - reduce volume by 50%, intensity by 30%\"}], \"progression_scheme\": {\"type\": \"linear\", \"weight_increase\": \"5_lbs_upper_10_lbs_lower\", \"trigger\": \"when_all_sets_completed_at_target_rpe\"}, \"deload_schedule\": [4, 8, 12], \"notes\": \"Add 5 lbs to upper body lifts and 10 lbs to lower body lifts when you complete all sets at target RPE. Deload every 4 weeks.\"}"}]}
```

---

## Summary: Complete Research Deliverables

### File Naming Convention

All files must be named exactly as specified and saved in JSONL format:

1. `injury_analysis_clear_cases.jsonl` (400 examples)
2. `injury_analysis_ambiguous_cases.jsonl` (300 examples)
3. `injury_analysis_normal_doms.jsonl` (200 examples)
4. `injury_analysis_red_flags.jsonl` (100 examples)
5. `running_weather_pace_analysis.jsonl` (150 examples)
6. `running_interval_analysis.jsonl` (150 examples) - *See extended doc*
7. `running_recovery_recommendations.jsonl` (100 examples) - *See extended doc*
8. `ai_coach_form_questions.jsonl` (300 examples)
9. `ai_coach_programming_questions.jsonl` (300 examples)
10. `ai_coach_nutrition_recovery.jsonl` (200 examples)
11. `ai_coach_injury_prevention.jsonl` (200 examples)
12. `workout_insights_volume_analysis.jsonl` (200 examples)
13. `workout_insights_deload_detection.jsonl` (150 examples)
14. `workout_insights_pr_predictions.jsonl` (150 examples)
15. `workout_insights_form_degradation.jsonl` (100 examples) - *See extended doc*
16. `workout_insights_plateau_detection.jsonl` (100 examples) - *See extended doc*
17. `exercise_substitution_explanations.jsonl` (300 examples)
18. `program_generation_beginner.jsonl` (100 examples)
19. `program_generation_intermediate.jsonl` (100 examples) - *See extended doc*

**Total Examples Needed:** ~3,500-4,000 new examples

---

## Quality Control Checklist

For each JSONL file, verify:

- [ ] One JSON object per line (no pretty printing)
- [ ] Each line is valid JSON
- [ ] System message is consistent across all examples
- [ ] User messages are natural, varied language
- [ ] Assistant messages are valid JSON matching the specified schema
- [ ] No duplicate examples
- [ ] Examples cover the full range of scenarios described
- [ ] File is saved with exact name specified above

---

## Next Steps

1. **Distribute research prompts** to research team
2. **Set deadlines** for each deliverable
3. **Quality review** each JSONL file as it's completed
4. **Merge all files** into single training dataset
5. **Combine with existing voice parsing data** (3,890 examples)
6. **Fine-tune unified model** on complete dataset
7. **Test and validate** accuracy across all use cases
8. **Deploy to production**

---

## Contact for Questions

If researchers have questions about:
- Output format
- Example quality
- Edge cases
- Technical issues

Please provide examples and we'll clarify the requirements.

