# Injury Analysis Training Data Generation Plan

**Version:** 1.0  
**Date:** 2025-01-06  
**Purpose:** Detailed plan for generating 500-1,000 high-quality injury analysis training examples

---

## Overview

We need to create training examples that teach the model to:
1. Detect injuries from natural language descriptions
2. Extract body parts accurately
3. Classify severity (mild, moderate, severe)
4. Identify injury types (strain, sprain, tendinitis, etc.)
5. Detect red flags requiring medical attention
6. Distinguish between injury and normal DOMS
7. Recommend affected exercises
8. Provide appropriate recovery recommendations

---

## Training Data Structure

### Format: JSONL (JSON Lines)

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are a sports medicine AI assistant specializing in strength training injury analysis..."
    },
    {
      "role": "user",
      "content": "Analyze the following injury report: \"sharp pain in my shoulder when pressing\""
    },
    {
      "role": "assistant",
      "content": "{\"injury_detected\": true, \"confidence\": 0.85, \"body_part\": \"shoulder\", ...}"
    }
  ]
}
```

---

## Data Categories & Distribution

### Category 1: Clear Injuries (40% - 400 examples)

**Characteristics:**
- Obvious injury indicators (sharp pain, popping, swelling)
- High confidence (0.80-0.95)
- Clear body part identification
- Specific injury types

**Examples:**

**1.1 Shoulder Injuries (80 examples)**
- Rotator cuff strain
- Impingement
- AC joint pain
- Labral issues

```
User: "sharp stabbing pain in my shoulder when I press overhead"
Assistant: {
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

**1.2 Lower Back Injuries (80 examples)**
- Lumbar strain
- Disc issues
- Spinal erector strain

**1.3 Knee Injuries (80 examples)**
- Patellar tendinitis
- MCL/ACL strain
- Meniscus issues

**1.4 Elbow Injuries (60 examples)**
- Golfer's elbow (medial epicondylitis)
- Tennis elbow (lateral epicondylitis)
- Triceps tendinitis

**1.5 Hip Injuries (40 examples)**
- Hip flexor strain
- Adductor strain
- Labral issues

**1.6 Ankle/Wrist/Other (60 examples)**
- Ankle sprains
- Wrist strain
- Hamstring pulls
- Core strains

---

### Category 2: Ambiguous Cases (30% - 300 examples)

**Characteristics:**
- Vague descriptions
- Medium confidence (0.60-0.79)
- Could be injury or DOMS
- Requires context

**Examples:**

```
User: "my shoulder feels off after benching yesterday"
Assistant: {
  "injury_detected": true,
  "confidence": 0.65,
  "body_part": "shoulder",
  "severity": "mild",
  "injury_type": "muscle_strain",
  "red_flags": [],
  "recommendations": ["monitor_symptoms", "reduce_load_20_percent", "assess_in_48_hours"],
  "affected_exercises": ["Bench Press", "Overhead Press"],
  "differential_diagnoses": ["doms", "minor_strain", "fatigue"]
}
```

**Subcategories:**
- Soreness vs. injury (100 examples)
- Tightness vs. strain (80 examples)
- Clicking/popping without pain (60 examples)
- Fatigue vs. overtraining (60 examples)

---

### Category 3: Normal Training Responses (20% - 200 examples)

**Characteristics:**
- No injury detected
- DOMS, normal soreness, pump
- Low confidence for injury (0.10-0.30)

**Examples:**

```
User: "my chest is sore from yesterday's workout"
Assistant: {
  "injury_detected": false,
  "confidence": 0.15,
  "body_part": "chest",
  "severity": "none",
  "injury_type": "doms",
  "red_flags": [],
  "recommendations": ["continue_training", "adequate_recovery"],
  "affected_exercises": [],
  "differential_diagnoses": ["normal_doms"]
}
```

**Subcategories:**
- DOMS descriptions (80 examples)
- Muscle pump/tightness (60 examples)
- General fatigue (40 examples)
- Positive training responses (20 examples)

---

### Category 4: Red Flag Cases (10% - 100 examples)

**Characteristics:**
- Serious symptoms requiring immediate medical attention
- Very high confidence (0.90-0.99)
- Urgent recommendations

**Examples:**

```
User: "I felt a pop in my knee during squats and now I can't put weight on it"
Assistant: {
  "injury_detected": true,
  "confidence": 0.95,
  "body_part": "knee",
  "severity": "severe",
  "injury_type": "ligament_tear",
  "red_flags": ["popping_sound", "inability_to_bear_weight", "acute_onset"],
  "recommendations": ["seek_immediate_medical_attention", "ice_elevation", "no_weight_bearing"],
  "affected_exercises": ["All lower body exercises"],
  "differential_diagnoses": ["acl_tear", "mcl_tear", "meniscus_tear"]
}
```

**Red Flag Indicators:**
- Popping/tearing sounds
- Inability to bear weight
- Severe swelling
- Numbness/tingling
- Loss of range of motion
- Severe pain (8-10/10)

---

## Data Generation Methods

### Method 1: Template-Based Generation (50% - 500 examples)

**Process:**
1. Create templates for each injury type
2. Vary language, severity, context
3. Ensure diverse phrasing

**Template Example:**
```
[severity_descriptor] [pain_type] in my [body_part] when [activity]
```

**Variations:**
- Severity: "sharp", "dull", "aching", "stabbing", "throbbing"
- Pain type: "pain", "discomfort", "soreness", "tightness"
- Body part: "shoulder", "lower back", "knee", "elbow"
- Activity: "pressing", "squatting", "deadlifting", "pulling"

### Method 2: Real-World Examples (20% - 200 examples)

**Sources:**
- Reddit r/fitness injury posts
- Bodybuilding.com forums
- Physical therapy case studies
- Sports medicine literature

**Process:**
1. Collect real injury descriptions
2. Anonymize and clean
3. Create expert-labeled outputs
4. Validate with medical knowledge

### Method 3: Synthetic Generation with GPT-4 (30% - 300 examples)

**Process:**
1. Use GPT-4 to generate diverse injury descriptions
2. Use GPT-4 to generate expert responses
3. Human review and validation
4. Ensure medical accuracy

**Prompt for GPT-4:**
```
Generate 10 realistic injury descriptions from strength training athletes.
Include a mix of:
- Clear injuries (shoulder, knee, back, elbow)
- Ambiguous cases (soreness vs injury)
- Normal training responses (DOMS)
- Red flag cases (severe injuries)

For each, provide the injury description and the expert analysis in JSON format.
```

---

## Quality Assurance

### Validation Criteria

1. **Medical Accuracy** (Critical)
   - All injury classifications reviewed by PT/sports medicine professional
   - Red flags align with medical guidelines
   - Recommendations are safe and appropriate

2. **Consistency** (High Priority)
   - Similar descriptions get similar outputs
   - Severity classifications are consistent
   - Confidence scores are calibrated

3. **Coverage** (High Priority)
   - All major body parts covered
   - All common injury types included
   - Edge cases represented

4. **Diversity** (Medium Priority)
   - Varied language and phrasing
   - Different experience levels (beginner to advanced)
   - Multiple injury mechanisms

### Review Process

1. **Automated Checks:**
   - JSON schema validation
   - Confidence score ranges (0.0-1.0)
   - Required fields present
   - Body part in valid list

2. **Expert Review:**
   - Medical professional reviews 100% of examples
   - Flags any inaccurate classifications
   - Validates red flag criteria

3. **Test Set:**
   - Hold out 20% for validation
   - Measure accuracy on unseen examples
   - Iterate based on results

---

## Implementation Timeline

### Week 1: Template Creation & Initial Generation
- Day 1-2: Create templates for all injury types
- Day 3-4: Generate 300 template-based examples
- Day 5: Review and validate

### Week 2: Real-World & Synthetic Data
- Day 1-2: Collect and clean real-world examples (200)
- Day 3-4: Generate synthetic examples with GPT-4 (300)
- Day 5: Review and validate

### Week 3: Quality Assurance & Refinement
- Day 1-2: Expert medical review
- Day 3-4: Revisions based on feedback
- Day 5: Final validation and formatting

### Week 4: Fine-Tuning & Testing
- Day 1-2: Combine with voice parsing data (3,890 examples)
- Day 3: Submit fine-tuning job to OpenAI
- Day 4-5: Test and validate new model

---

## Example Training Data Samples

### Sample 1: Clear Shoulder Injury
```jsonl
{"messages": [{"role": "system", "content": "You are a sports medicine AI assistant specializing in strength training injury analysis. Your role is to analyze user-reported symptoms and classify potential injuries with high accuracy."}, {"role": "user", "content": "Analyze the following injury report: \"I have sharp pain in my right shoulder when I press overhead. It started during my last workout and hasn't improved in 3 days.\""}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.88, \"body_part\": \"shoulder\", \"severity\": \"moderate\", \"injury_type\": \"rotator_cuff_strain\", \"red_flags\": [\"sharp_pain\", \"persistent_symptoms\"], \"recommendations\": [\"rest_48_hours\", \"ice_therapy\", \"consult_pt_if_no_improvement\"], \"affected_exercises\": [\"Overhead Press\", \"Bench Press\", \"Incline Press\", \"Dips\"], \"differential_diagnoses\": [\"impingement\", \"tendinitis\", \"rotator_cuff_strain\"]}"}]}
```

### Sample 2: Ambiguous Case
```jsonl
{"messages": [{"role": "system", "content": "You are a sports medicine AI assistant specializing in strength training injury analysis. Your role is to analyze user-reported symptoms and classify potential injuries with high accuracy."}, {"role": "user", "content": "Analyze the following injury report: \"My lower back feels tight after deadlifts yesterday. It's not painful, just stiff.\""}, {"role": "assistant", "content": "{\"injury_detected\": true, \"confidence\": 0.62, \"body_part\": \"lower_back\", \"severity\": \"mild\", \"injury_type\": \"muscle_tightness\", \"red_flags\": [], \"recommendations\": [\"monitor_symptoms\", \"light_stretching\", \"reduce_load_if_worsens\"], \"affected_exercises\": [\"Deadlift\", \"Squat\", \"Romanian Deadlift\"], \"differential_diagnoses\": [\"doms\", \"minor_strain\", \"muscle_tightness\"]}"}]}
```

### Sample 3: Normal DOMS
```jsonl
{"messages": [{"role": "system", "content": "You are a sports medicine AI assistant specializing in strength training injury analysis. Your role is to analyze user-reported symptoms and classify potential injuries with high accuracy."}, {"role": "user", "content": "Analyze the following injury report: \"My quads are super sore from leg day. Can barely walk down stairs lol\""}, {"role": "assistant", "content": "{\"injury_detected\": false, \"confidence\": 0.12, \"body_part\": \"quadriceps\", \"severity\": \"none\", \"injury_type\": \"doms\", \"red_flags\": [], \"recommendations\": [\"continue_training\", \"adequate_recovery\", \"light_activity_helps\"], \"affected_exercises\": [], \"differential_diagnoses\": [\"normal_doms\"]}"}]}
```

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Begin template creation (Week 1)
3. ⏳ Generate initial 500 examples
4. ⏳ Expert medical review
5. ⏳ Combine with voice parsing data
6. ⏳ Submit fine-tuning job
7. ⏳ Test and deploy unified model

---

## Resources Needed

- **Medical Expert:** PT or sports medicine professional for validation (10-15 hours)
- **GPT-4 API Credits:** ~$50 for synthetic generation
- **Fine-Tuning Credits:** ~$20 for OpenAI fine-tuning
- **Development Time:** 3-4 weeks (1 developer)

**Total Estimated Cost:** $70-100 + development time

