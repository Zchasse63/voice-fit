# Llama 3.3 70B Injury Detection Training Data Generation Prompt (REFINED)

Generate 825 realistic strength training injury scenarios with multi-input reasoning, contextual decision-making, and confidence calibration.

**CRITICAL: Llama 3.3 70B Training Requirements**
- Include explicit reasoning chains (show HOW the model reaches conclusions)
- Provide full user context (workout history, recovery data, program phase)
- Add differential diagnosis with confidence rankings
- Include edge cases, false positives, and confidence calibration
- Add escalation triggers and recovery timeline validation
- Format for combined parsing + coaching model architecture
- Reference user history explicitly in reasoning
- Provide specific exercise modifications with load/volume/progression criteria

---

## Scenario Distribution (825 Total Examples):

### 1. Acute Injuries - Clear Action Required (75 examples)
**Characteristics:**
- Sharp, sudden pain during specific movement
- Clear mechanism of injury (felt pop, sudden twinge)
- Requires immediate modification
- High confidence assessment (0.85-0.95)

**Examples:**
- "Sharp pain in shoulder during overhead press, felt something pop"
- "Knee buckled during heavy squat, sharp pain on inside"
- "Sudden burning in lower back halfway through deadlift set"

### 2. Chronic/Overuse - Modification Needed (150 examples)
**Characteristics:**
- Gradual onset over 2-4 weeks
- Pain pattern correlates with specific exercises
- Moderate confidence (0.70-0.85)
- Requires load management, not complete cessation

**Examples:**
- "Elbow has been achy for 3 weeks, worse after curls and tricep work"
- "Lower back stiff every morning, especially after heavy squat days"
- "Shoulder hurts during bench press, started 2 weeks ago gradually"

### 3. Tendinitis/Tendinopathy (100 examples)
**Characteristics:**
- Pain at specific tendon insertion points
- Worse with loading, better after warmup, worse next day
- Clear load-pain relationship
- Confidence: 0.75-0.90

**Examples:**
- "Achilles tendon pain when running, fine during warm-up but worse next day"
- "Pain on outside of elbow during pull-ups, especially last few reps"
- "Patellar tendon hurts during squats, particularly in bottom position"

### 4. Impingement/Joint Issues (75 examples)
**Characteristics:**
- Pain at specific ranges of motion
- Mechanical symptoms (clicking, catching, grinding)
- Position-dependent
- Confidence: 0.70-0.85

**Examples:**
- "Shoulder clicks and catches when pressing overhead"
- "Hip pinches at bottom of squat, feels like something blocking"
- "Knee grinds during leg extensions, doesn't hurt but feels weird"

### 5. False Positives - Normal Training Soreness (100 examples)
**Purpose:** Prevent over-cautious recommendations
**Characteristics:**
- DOMS (24-72 hours post-workout)
- Bilateral symptoms
- Dull ache, not sharp pain
- No specific injury mechanism
- Confidence: 0.80-0.95 (high confidence it's NOT an injury)

**Examples:**
- "My legs are really sore 2 days after squats"
- "Chest feels tight and achy day after bench press"
- "Glutes are killing me after deadlifts yesterday"

### 6. Ambiguous Cases - Low Confidence (75 examples)
**Purpose:** Teach model when to request more information
**Characteristics:**
- Vague descriptions
- Insufficient context
- Multiple possible causes
- Confidence: 0.30-0.50

**Examples:**
- "My knee hurts sometimes"
- "I have some shoulder pain"
- "My back feels weird"

### 7. Multi-Turn Conversations (150 examples)
**Purpose:** Teach model to handle clarifying questions and follow-ups
**Characteristics:**
- 2-5 message exchanges
- Progressive information gathering
- Confidence increases with more data
- Shows how to ask targeted questions

**Examples:**
- User: "My shoulder hurts" → Assistant: "Sharp or dull?" → User: "Sharp when overhead" → Assessment
- User: "Knee pain" → Assistant: "During what movement?" → User: "Squats, inside of knee" → Assessment

### 8. Red Flag Scenarios (50 examples)
**Purpose:** Teach immediate medical referral
**Characteristics:**
- Severe injuries requiring urgent care
- Loss of function
- Neurological symptoms
- Rapid swelling
- Confidence: 0.90-0.98 (high confidence medical care needed)

**Examples:**
- "Felt pop in knee, can't walk, swelling rapidly"
- "Sharp pain down leg, numbness in foot after deadlift"
- "Shoulder dislocated during bench press, can't move arm"

### 9. Context-Dependent Decisions (50 examples)
**Purpose:** Same injury, different recommendations based on user context
**Characteristics:**
- Identical symptoms
- Different user contexts (competition vs. recreational, beginner vs. advanced)
- Different recommendations based on goals/timeline

**Examples:**
- Competitive powerlifter 2 weeks from meet vs. recreational lifter
- Beginner with poor form vs. advanced lifter with overuse
- High-stress job + poor sleep vs. optimal recovery conditions

---

## Required Output Format (Enhanced JSON with All Refinements):

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "intermediate",
      "age": 28,
      "training_goal": "strength",
      "competition_timeline": null,
      "injury_history": []
    },
    "user_history": [
      {"date": "2025-11-01", "exercise": "overhead_press", "weight": 135, "sets": 3, "reps": 8, "rpe": 7, "notes": "felt good"},
      {"date": "2025-11-03", "exercise": "bench_press", "weight": 225, "sets": 5, "reps": 5, "rpe": 8, "notes": "heavy but manageable"},
      {"date": "2025-11-05", "exercise": "overhead_press", "weight": 140, "sets": 3, "reps": 8, "rpe": 9, "notes": "struggled on last set"}
    ],
    "recovery_data": {
      "sleep_avg_7days": 7.2,
      "sleep_quality": "good",
      "soreness_baseline": 3,
      "stress_level": "moderate",
      "training_frequency": "4x_per_week"
    },
    "current_program": {
      "name": "5/3/1",
      "phase": "strength",
      "week": 3,
      "total_weeks": 4,
      "volume_trend": "increasing",
      "deload_scheduled": "week_4"
    },
    "weekly_volume": {
      "chest_sets": 12,
      "shoulder_sets": 9,
      "back_sets": 15,
      "legs_sets": 18
    }
  },
  "user_input": "Sharp pain in my right shoulder when I do overhead press. Started today during my workout.",
  "output": {
    "reasoning_chain": [
      "User reports acute onset sharp pain during overhead press - classic mechanism for shoulder injury",
      "User's workout log shows overhead press weight increased from 135→140 lbs over 2 weeks (3.7% increase)",
      "RPE jumped from 7 to 9 in same period, indicating insufficient recovery between sessions",
      "No prior shoulder injuries in user history - suggests acute overload, not chronic issue",
      "Weekly shoulder volume is 9 sets + 12 sets chest = 21 sets pressing - moderate-high for intermediate",
      "User is in week 3 of 4-week block with increasing volume - peak fatigue period",
      "Sharp pain + overhead movement + progressive overload = high probability rotator cuff strain or impingement",
      "No mention of numbness, weakness, or night pain (rules out severe injury/nerve involvement)",
      "Pain is movement-specific, not constant (suggests musculoskeletal not inflammatory)",
      "User's sleep (7.2 hrs) and stress (moderate) are adequate but not optimal for current training load"
    ],
    "assessment": {
      "injury_detected": true,
      "confidence": 0.92,
      "confidence_reasoning": "Clear mechanism (overhead pressing), classic presentation (sharp pain), corroborating training history (progressive overload + RPE spike), no confounding factors, consistent with rotator cuff strain pattern",
      "body_part": "shoulder",
      "body_part_specific": "anterior_deltoid_rotator_cuff",
      "severity": "moderate",
      "severity_reasoning": "Sharp pain indicates tissue irritation but no mechanical symptoms (clicking/catching), no loss of function, no neurological signs - likely Grade 1-2 strain",
      "injury_type": "rotator_cuff_strain",
      "injury_subtype": "supraspinatus_or_infraspinatus",
      "contributing_factors": [
        "progressive_overload_too_aggressive",
        "insufficient_recovery_between_sessions",
        "peak_fatigue_in_training_block",
        "high_pressing_volume"
      ]
    },
    "red_flags": {
      "present": ["sharp_pain", "overhead_movement_specific", "acute_onset"],
      "absent": ["numbness", "weakness", "night_pain", "swelling", "loss_of_ROM", "clicking_or_catching"],
      "escalation_triggers": [
        "Pain persists >72 hours despite rest",
        "Develops weakness in shoulder",
        "Night pain begins (wakes from sleep)",
        "Pain increases despite following recommendations",
        "Numbness or tingling develops",
        "Loss of range of motion"
      ]
    },
    "differential_diagnoses": [
      {
        "condition": "rotator_cuff_strain",
        "probability": 0.50,
        "distinguishing_features": "Sharp pain with overhead movement, no clicking, acute onset with overload",
        "confidence_reasoning": "Most common presentation matching all symptoms"
      },
      {
        "condition": "subacromial_impingement",
        "probability": 0.35,
        "distinguishing_features": "Would expect painful arc 60-120 degrees, may have clicking",
        "confidence_reasoning": "Similar presentation but usually more chronic onset"
      },
      {
        "condition": "AC_joint_sprain",
        "probability": 0.10,
        "distinguishing_features": "Pain would be more lateral/superior, worse with cross-body movements",
        "confidence_reasoning": "Less likely given pain location and movement pattern"
      },
      {
        "condition": "biceps_tendinitis",
        "probability": 0.05,
        "distinguishing_features": "Pain would be anterior shoulder, worse with supination/curling",
        "confidence_reasoning": "Unlikely given overhead press mechanism"
      }
    ],
    "affected_exercises": {
      "avoid_completely": [
        {"exercise": "overhead_press", "rationale": "Primary pain-causing movement"},
        {"exercise": "behind_the_neck_press", "rationale": "Extreme shoulder external rotation"},
        {"exercise": "handstand_pushups", "rationale": "Overhead pressing under load"}
      ],
      "modify_significantly": [
        {
          "exercise": "bench_press",
          "modification": "reduce_ROM_by_2_inches",
          "load_adjustment": "80%",
          "rationale": "Limits shoulder extension to pain-free range"
        },
        {
          "exercise": "incline_press",
          "modification": "reduce_incline_to_15_degrees",
          "load_adjustment": "70%",
          "rationale": "Reduces shoulder flexion demand"
        },
        {
          "exercise": "dips",
          "modification": "reduce_depth_or_skip",
          "load_adjustment": "bodyweight_only",
          "rationale": "High shoulder stress in bottom position"
        }
      ],
      "proceed_with_caution": [
        {
          "exercise": "lateral_raises",
          "modification": "stop_at_shoulder_height",
          "load_adjustment": "50%",
          "pain_threshold": "stop_if_pain_>2/10",
          "rationale": "Moderate rotator cuff involvement"
        },
        {
          "exercise": "front_raises",
          "modification": "reduce_ROM_to_90_degrees",
          "load_adjustment": "50%",
          "pain_threshold": "stop_if_pain_>2/10",
          "rationale": "Anterior deltoid involvement"
        }
      ],
      "safe_to_continue": [
        {"exercise": "barbell_rows", "rationale": "No overhead component"},
        {"exercise": "pullups", "rationale": "Pulling movement, minimal rotator cuff stress"},
        {"exercise": "squats", "rationale": "Lower body, no shoulder involvement"},
        {"exercise": "deadlifts", "rationale": "Lower body, minimal shoulder involvement"},
        {"exercise": "bicep_curls", "rationale": "Isolated arm movement"},
        {"exercise": "tricep_pushdowns", "rationale": "Elbow extension, no shoulder stress"}
      ]
    },
    "load_management": {
      "current_volume": {
        "chest_sets_per_week": 12,
        "shoulder_sets_per_week": 9,
        "total_pressing_sets": 21
      },
      "recommended_volume": {
        "chest_sets_per_week": 8,
        "shoulder_sets_per_week": 4,
        "total_pressing_sets": 12,
        "reduction_percentage": "43%"
      },
      "reduction_rationale": "Reduce pressing volume by ~40% to allow tissue recovery while maintaining training stimulus",
      "progression_plan": {
        "week_1": "12 sets total (43% reduction)",
        "week_2": "15 sets total if pain <3/10",
        "week_3": "18 sets total if pain <2/10",
        "week_4": "return to 21 sets if pain-free",
        "progression_criteria": "Add 2-3 sets per week only if pain remains below threshold"
      }
    },
    "recommendations": {
      "immediate_action": [
        {
          "action": "rest_overhead_pressing",
          "duration": "48-72 hours",
          "specifics": "No overhead press, military press, or handstand pushups",
          "rationale": "Allow acute inflammation to subside before reintroducing load"
        },
        {
          "action": "ice_therapy",
          "protocol": "15 minutes every 3-4 hours for first 48 hours",
          "application": "Ice pack on anterior/lateral shoulder",
          "rationale": "Reduce inflammation and pain in acute phase"
        },
        {
          "action": "NSAIDs",
          "details": "Ibuprofen 400mg every 6-8 hours as needed (max 1200mg/day)",
          "duration": "2-3 days maximum",
          "rationale": "Pain and inflammation management in acute phase"
        },
        {
          "action": "gentle_ROM_exercises",
          "protocol": "Pendulum swings, wall slides, 2x daily",
          "rationale": "Maintain mobility without loading injured tissue"
        }
      ],
      "training_modifications": [
        {
          "action": "substitute_overhead_press",
          "replacement": "landmine_press",
          "load": "50% of normal overhead press weight",
          "sets_reps": "3x8 instead of 3x5",
          "progression_criteria": "Pain <3/10 during and 24 hours after workout",
          "rationale": "Maintains pressing pattern with reduced shoulder stress (more neutral grip, less overhead ROM)"
        },
        {
          "action": "modify_bench_press",
          "modification": "reduce_ROM_by_2_inches (use board or towel on chest)",
          "load": "80% of normal weight",
          "sets_reps": "maintain current 5x5",
          "progression_criteria": "Pain <2/10 during and after workout",
          "rationale": "Limits shoulder extension to pain-free range while maintaining pressing strength"
        },
        {
          "action": "add_rotator_cuff_work",
          "exercises": ["external_rotations", "band_pull_aparts", "face_pulls"],
          "load": "light resistance bands",
          "sets_reps": "3x15-20, 2x per week",
          "rationale": "Strengthen rotator cuff to prevent recurrence"
        }
      ],
      "recovery_protocol": [
        {
          "phase": "days_1-3",
          "focus": "rest and inflammation management",
          "activities": ["ice therapy", "gentle ROM exercises", "no loading", "NSAIDs as needed"],
          "expected_outcome": "Pain reduces from 7/10 to 4/10 or less",
          "escalation_if": "Pain remains >6/10 or increases"
        },
        {
          "phase": "days_4-7",
          "focus": "gradual return to loading",
          "activities": [
            "50% load on modified movements (landmine press, reduced ROM bench)",
            "monitor pain response during and 24 hours after",
            "continue ROM exercises",
            "progress if pain <3/10"
          ],
          "expected_outcome": "Pain <3/10 with modified movements",
          "escalation_if": "Pain >4/10 with modified movements"
        },
        {
          "phase": "week_2",
          "focus": "increase load and volume",
          "activities": [
            "increase to 70% load on modified movements",
            "add 2-3 sets to weekly volume if pain <3/10",
            "maintain below RPE 7 for all pressing"
          ],
          "expected_outcome": "Pain <2/10, able to complete modified workouts",
          "escalation_if": "Pain increases or plateaus >3/10"
        },
        {
          "phase": "week_3+",
          "focus": "return to normal training",
          "activities": [
            "gradually increase ROM on bench press (remove board/towel)",
            "reintroduce overhead press at 60% weight",
            "progress 5-10% per week if pain-free",
            "maintain rotator cuff accessory work"
          ],
          "expected_outcome": "Pain-free training at 90%+ normal loads",
          "escalation_if": "Pain returns when increasing load or ROM"
        }
      ],
      "recovery_timeline_validation": {
        "day_3_checkpoint": {
          "expected": "Pain reduced to 4/10 or less at rest, 5/10 with movement",
          "if_improved": "Proceed to modified training phase (days 4-7)",
          "if_not_improved": "Continue rest, ice, NSAIDs for 3 more days, then reassess",
          "if_worse": "Escalate to PT consultation - possible more severe injury"
        },
        "day_7_checkpoint": {
          "expected": "Pain <3/10 with modified movements (landmine press, reduced ROM bench)",
          "if_improved": "Proceed to week 2 protocol (increase load to 70%)",
          "if_not_improved": "Medical evaluation required - not responding to conservative treatment",
          "if_worse": "Immediate PT/MD consultation - possible structural damage"
        },
        "week_2_checkpoint": {
          "expected": "Pain <2/10 with 70% loads, able to complete all modified workouts",
          "if_improved": "Proceed to week 3+ protocol (return to normal training)",
          "if_not_improved": "Extend modified training 1-2 more weeks, consider PT evaluation",
          "if_worse": "Medical evaluation required"
        },
        "week_4_checkpoint": {
          "expected": "Pain-free or <1/10 with normal training loads and ROM",
          "if_improved": "Return to full training, maintain rotator cuff accessory work",
          "if_not_improved": "PT evaluation required - chronic issue developing",
          "if_worse": "Medical evaluation required"
        }
      },
      "medical_consultation": {
        "urgency": "consult_if_no_improvement_72_hours",
        "specialist": "physical_therapist_or_sports_medicine_physician",
        "red_flags_requiring_immediate_visit": [
          "Develops weakness in shoulder (can't lift arm)",
          "Night pain (wakes from sleep)",
          "No improvement after 1 week of conservative treatment",
          "Pain increases despite rest",
          "Numbness or tingling develops",
          "Visible deformity or swelling"
        ],
        "what_to_expect": "PT will assess ROM, strength, special tests (Neer's, Hawkins-Kennedy) to confirm diagnosis and provide targeted rehab exercises"
      }
    },
    "exercise_substitution_library": {
      "overhead_press": [
        {
          "substitute": "landmine_press",
          "load_reduction": "50%",
          "use_case": "shoulder_pain_rotator_cuff",
          "rationale": "Neutral grip, reduced overhead ROM, less shoulder stress"
        },
        {
          "substitute": "seated_dumbbell_press",
          "load_reduction": "30%",
          "use_case": "mild_shoulder_discomfort",
          "rationale": "Independent arm movement, can adjust ROM per side"
        },
        {
          "substitute": "push_press",
          "load_reduction": "20%",
          "use_case": "lower_back_pain_not_shoulder",
          "rationale": "Leg drive reduces shoulder load"
        }
      ],
      "bench_press": [
        {
          "substitute": "floor_press",
          "load_reduction": "10%",
          "use_case": "shoulder_pain_in_bottom_position",
          "rationale": "Limits ROM, reduces shoulder extension"
        },
        {
          "substitute": "close_grip_bench",
          "load_reduction": "20%",
          "use_case": "shoulder_pain_wide_grip",
          "rationale": "Reduces shoulder abduction and external rotation"
        },
        {
          "substitute": "dumbbell_press",
          "load_reduction": "15%",
          "use_case": "shoulder_pain_barbell_specific",
          "rationale": "More natural movement path, independent arms"
        }
      ]
    },
    "response_to_user": "I've detected a likely rotator cuff strain in your right shoulder based on the sharp pain during overhead pressing. This is consistent with your recent training progression - you increased weight from 135 to 140 lbs and your RPE jumped from 7 to 9 over the last 2 weeks, indicating you were pushing too hard without adequate recovery.\n\n**Here's your recovery plan:**\n\n**Immediate (Next 48-72 hours):**\n- Stop overhead pressing completely\n- Ice your shoulder 15 mins every 3-4 hours\n- Ibuprofen 400mg every 6-8 hours if needed (max 1200mg/day)\n- Do gentle pendulum swings and wall slides 2x daily to maintain mobility\n\n**Modified Training (Starting Day 4):**\n- Replace overhead press with landmine press at 50% weight (3x8)\n- Reduce bench press ROM by 2 inches (use board/towel), use 80% weight\n- Add rotator cuff work: band external rotations, face pulls (3x15-20, 2x/week)\n- Continue squats, deadlifts, rows - these are safe\n\n**Volume Reduction:**\n- Cut your pressing volume from 21 sets/week to 12 sets/week (43% reduction)\n- This gives your shoulder time to recover while maintaining strength\n\n**Recovery Timeline:**\n- **Day 3 check:** Pain should drop to 4/10 or less. If not, extend rest 3 more days.\n- **Day 7 check:** Pain should be <3/10 with modified movements. If not, see a PT.\n- **Week 2:** Increase to 70% load if pain <3/10. Add 2-3 sets if tolerated.\n- **Week 3+:** Gradually return to normal training if pain-free.\n\n**See a PT/doctor if:**\n- Pain doesn't improve in 72 hours\n- You develop weakness (can't lift arm)\n- Night pain begins (wakes you from sleep)\n- Pain increases despite following this plan\n\n**Why this happened:**\nYou're in week 3 of your 5/3/1 block (peak fatigue), increased weight too aggressively (3.7% jump), and your RPE spike shows insufficient recovery. Your 21 sets/week of pressing is moderate-high for an intermediate lifter, especially with suboptimal sleep (7.2 hrs).\n\n**Good news:** This is likely a Grade 1-2 strain and should resolve in 2-4 weeks with proper management. You caught it early!\n\nWant me to log today's workout and track your recovery progress?"
  }
}
```

---

## Example 2: False Positive (DOMS) - Critical for Preventing Over-Caution

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "beginner",
      "age": 24,
      "training_goal": "general_fitness",
      "competition_timeline": null,
      "injury_history": []
    },
    "user_history": [
      {"date": "2025-10-20", "exercise": "squat", "weight": 185, "sets": 3, "reps": 10, "rpe": 7, "notes": "last squat session"},
      {"date": "2025-11-04", "exercise": "squat", "weight": 185, "sets": 5, "reps": 5, "rpe": 8, "notes": "first squat day in 2 weeks"}
    ],
    "recovery_data": {
      "sleep_avg_7days": 8.1,
      "sleep_quality": "excellent",
      "soreness_baseline": 2,
      "stress_level": "low",
      "training_frequency": "3x_per_week"
    },
    "current_program": {
      "name": "starting_strength",
      "phase": "novice_linear_progression",
      "week": 4,
      "total_weeks": 12,
      "volume_trend": "stable",
      "deload_scheduled": null
    },
    "weekly_volume": {
      "legs_sets": 9
    }
  },
  "user_input": "My legs are really sore 2 days after squats. Both quads and glutes are killing me. Is this an injury?",
  "output": {
    "reasoning_chain": [
      "User reports soreness 48 hours post-workout - classic DOMS timeline (24-72 hours)",
      "User's workout log shows 2-week gap between squat sessions - expected DOMS with return to training",
      "User describes 'soreness' and 'killing me' not 'sharp pain' or 'stabbing' - key linguistic distinction",
      "Bilateral symptoms (both legs, quads AND glutes) - DOMS is typically bilateral, injuries are usually unilateral",
      "No mention of: sharp pain, specific injury mechanism, clicking, weakness, loss of function",
      "User is beginner (24 years old, 4 weeks into program) - more susceptible to DOMS",
      "Sleep is excellent (8.1 hrs), stress is low, recovery conditions are optimal",
      "No prior injury history, no red flags present",
      "Soreness in multiple muscle groups (quads + glutes) after compound movement = classic DOMS pattern"
    ],
    "assessment": {
      "injury_detected": false,
      "confidence": 0.94,
      "confidence_reasoning": "Classic DOMS presentation: 48-hour timeline, bilateral symptoms, dull ache not sharp pain, 2-week training gap, no injury mechanism, no red flags, beginner trainee, excellent recovery conditions",
      "condition": "delayed_onset_muscle_soreness",
      "severity": "normal_training_response",
      "severity_reasoning": "Moderate-high DOMS intensity is expected after 2-week break from squats, especially in beginner. This is adaptive response, not pathological."
    },
    "red_flags": {
      "present": [],
      "absent": ["sharp_pain", "unilateral_symptoms", "weakness", "loss_of_function", "clicking", "swelling", "specific_injury_mechanism"],
      "escalation_triggers": [
        "Soreness persists >5 days without improvement",
        "Develops sharp pain in specific location",
        "Develops weakness or loss of function",
        "Swelling appears",
        "Pain worsens instead of improving"
      ]
    },
    "differential_diagnoses": [
      {
        "condition": "DOMS",
        "probability": 0.94,
        "distinguishing_features": "Bilateral, dull ache, 48-hour onset, follows training gap, no injury mechanism",
        "confidence_reasoning": "All features consistent with DOMS"
      },
      {
        "condition": "muscle_strain",
        "probability": 0.04,
        "distinguishing_features": "Would expect unilateral, sharp pain, specific injury moment, loss of function",
        "confidence_reasoning": "No features consistent with strain"
      },
      {
        "condition": "rhabdomyolysis",
        "probability": 0.02,
        "distinguishing_features": "Would expect extreme pain, dark urine, weakness, nausea",
        "confidence_reasoning": "Extremely unlikely, no red flags present"
      }
    ],
    "affected_exercises": {
      "avoid_completely": [],
      "modify_significantly": [],
      "proceed_with_caution": [],
      "safe_to_continue": [
        {"exercise": "squats", "modification": "none_needed", "rationale": "DOMS is not an injury, continue training"},
        {"exercise": "deadlifts", "modification": "none_needed", "rationale": "Safe to continue"},
        {"exercise": "all_exercises", "modification": "none_needed", "rationale": "DOMS does not require training modification"}
      ]
    },
    "load_management": {
      "current_volume": {
        "legs_sets_per_week": 9
      },
      "recommended_volume": {
        "legs_sets_per_week": 9,
        "reduction_percentage": "0%"
      },
      "reduction_rationale": "No volume reduction needed - DOMS is normal training response, not injury",
      "progression_plan": {
        "continue_as_planned": true,
        "note": "DOMS will decrease with training consistency"
      }
    },
    "recommendations": {
      "immediate_action": [
        {
          "action": "continue_training_as_planned",
          "rationale": "DOMS is not an injury and does not require rest. Light activity actually helps recovery."
        },
        {
          "action": "light_cardio_or_walking",
          "protocol": "10-20 minutes easy walking or cycling",
          "rationale": "Increases blood flow to sore muscles, aids recovery"
        },
        {
          "action": "foam_rolling",
          "protocol": "5-10 minutes on quads and glutes",
          "rationale": "May provide temporary relief, aids recovery"
        },
        {
          "action": "adequate_protein",
          "protocol": "1.6-2.2g per kg bodyweight",
          "rationale": "Supports muscle repair and adaptation"
        }
      ],
      "training_modifications": [
        {
          "action": "no_modifications_needed",
          "rationale": "DOMS is normal training response. Continue your program as written."
        },
        {
          "action": "warm_up_thoroughly",
          "protocol": "5-10 minutes light cardio + dynamic stretching before squats",
          "rationale": "May reduce DOMS sensation during workout"
        }
      ],
      "recovery_protocol": [
        {
          "phase": "days_1-3",
          "focus": "active recovery",
          "activities": ["light walking", "foam rolling", "adequate protein", "continue training"],
          "expected_outcome": "Soreness peaks day 2-3, then gradually improves"
        },
        {
          "phase": "days_4-5",
          "focus": "return to baseline",
          "activities": ["continue normal training"],
          "expected_outcome": "Soreness resolves to baseline levels"
        }
      ],
      "recovery_timeline_validation": {
        "day_3_checkpoint": {
          "expected": "Soreness peaks but begins to improve",
          "if_improved": "Normal DOMS pattern, continue training",
          "if_not_improved": "Still normal if improving by day 5",
          "if_worse": "Escalate if develops sharp pain or weakness"
        },
        "day_5_checkpoint": {
          "expected": "Soreness mostly resolved",
          "if_improved": "Normal DOMS resolution, continue training",
          "if_not_improved": "Consider evaluation if still severe soreness >5 days",
          "if_worse": "Medical evaluation if pain increasing or new symptoms"
        }
      },
      "medical_consultation": {
        "urgency": "not_needed_unless_red_flags",
        "specialist": null,
        "red_flags_requiring_visit": [
          "Soreness persists >7 days without improvement",
          "Develops sharp pain",
          "Develops weakness",
          "Dark/brown urine (sign of rhabdomyolysis)",
          "Extreme pain that prevents daily activities"
        ]
      }
    },
    "education": {
      "what_is_DOMS": "Delayed Onset Muscle Soreness (DOMS) is muscle soreness that peaks 24-72 hours after exercise, especially after new movements or returning from a break. It's caused by microscopic muscle damage and inflammation - this is NORMAL and part of the adaptation process.",
      "DOMS_vs_injury": "DOMS is bilateral (both sides), dull ache, improves with movement. Injury is usually unilateral (one side), sharp pain, worsens with movement.",
      "how_to_prevent": "DOMS decreases with training consistency. Gradual progression and avoiding long training gaps reduces severity.",
      "should_you_train": "YES! Training through DOMS is safe and actually helps recovery. The soreness will improve as you warm up."
    },
    "response_to_user": "**Good news - this is just DOMS (Delayed Onset Muscle Soreness), not an injury!**\n\nHere's why I'm confident:\n- ✅ Soreness started 48 hours after your workout (classic DOMS timeline)\n- ✅ You took a 2-week break from squats (DOMS is worse after breaks)\n- ✅ Both legs are sore (DOMS is bilateral, injuries are usually one-sided)\n- ✅ You describe it as 'soreness' not 'sharp pain'\n- ✅ No injury mechanism (no pop, twinge, or specific moment)\n\n**What is DOMS?**\nIt's muscle soreness from microscopic muscle damage - this is NORMAL and how you get stronger. It peaks 24-72 hours after exercise and then improves.\n\n**What to do:**\n- ✅ **Continue training as planned** - DOMS is not an injury!\n- ✅ **Light activity helps** - 10-20 min walking or easy cycling\n- ✅ **Foam roll** - 5-10 mins on quads and glutes\n- ✅ **Eat enough protein** - 1.6-2.2g per kg bodyweight\n- ✅ **Warm up well** - 5-10 mins before your next squat session\n\n**Timeline:**\n- Days 1-3: Soreness peaks then starts improving\n- Days 4-5: Mostly resolved\n\n**DOMS vs. Injury:**\n- DOMS = Both sides, dull ache, improves with movement\n- Injury = One side, sharp pain, worsens with movement\n\n**Good news:** DOMS will decrease as you train consistently. This is your body adapting!\n\n**Only see a doctor if:** Soreness lasts >7 days, develops sharp pain, weakness, or dark urine.\n\nKeep training! 💪"
  }
}
```

## Example 3: Ambiguous Case - Low Confidence, Request More Information

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "unknown",
      "age": null,
      "training_goal": "unknown",
      "competition_timeline": null,
      "injury_history": []
    },
    "user_history": [],
    "recovery_data": {},
    "current_program": {},
    "weekly_volume": {}
  },
  "user_input": "My knee hurts sometimes",
  "output": {
    "reasoning_chain": [
      "Extremely vague description - 'hurts sometimes' lacks all specificity",
      "No information about: onset, severity, specific movements, frequency, progression",
      "No user history available - cannot assess training load or patterns",
      "No context about when pain occurs - during training? Daily activities? At rest?",
      "Multiple potential causes: patellofemoral pain, meniscus issue, tendinitis, DOMS, or even referred pain",
      "Cannot differentiate between injury and normal soreness without more data",
      "Insufficient information to make any confident assessment - need clarifying questions"
    ],
    "assessment": {
      "injury_detected": "unclear",
      "confidence": 0.35,
      "confidence_reasoning": "Insufficient information for diagnosis. Need: onset timeline, pain quality, specific movements, severity, progression. Cannot distinguish between DOMS, overuse injury, acute injury, or chronic condition.",
      "condition": "insufficient_data",
      "severity": "unknown"
    },
    "red_flags": {
      "present": [],
      "absent": [],
      "cannot_assess": ["all_red_flags"],
      "escalation_triggers": ["Cannot assess without more information"]
    },
    "clarifying_questions": {
      "priority_high": [
        {
          "question": "When did the knee pain start?",
          "rationale": "Establishes acute vs. chronic, helps identify mechanism",
          "follow_up_based_on_answer": {
            "today_or_this_week": "Ask about specific injury moment",
            "weeks_or_months_ago": "Ask about progression and pattern"
          }
        },
        {
          "question": "Is it a sharp pain or a dull ache?",
          "rationale": "Sharp suggests acute injury/structural issue, dull suggests overuse/DOMS",
          "follow_up_based_on_answer": {
            "sharp": "Ask about specific location and movements that cause it",
            "dull": "Ask about training history and volume"
          }
        },
        {
          "question": "Does it hurt during specific exercises like squats, running, or stairs?",
          "rationale": "Identifies movement patterns and potential structures involved",
          "follow_up_based_on_answer": {
            "squats": "Ask about depth, load, and exact location",
            "running": "Ask about distance, surface, and progression",
            "stairs": "Ask if going up or down, suggests patellofemoral pain"
          }
        }
      ],
      "priority_medium": [
        {
          "question": "On a scale of 1-10, how bad is the pain?",
          "rationale": "Establishes severity and urgency"
        },
        {
          "question": "Is there any swelling, clicking, or locking?",
          "rationale": "Mechanical symptoms suggest structural issue (meniscus, ligament)"
        },
        {
          "question": "Did you recently increase your training volume or intensity?",
          "rationale": "Helps identify overuse vs. acute injury"
        }
      ],
      "priority_low": [
        {
          "question": "Does it hurt at rest or only during activity?",
          "rationale": "Rest pain suggests more severe injury or inflammation"
        },
        {
          "question": "Have you had knee injuries before?",
          "rationale": "Prior injury increases risk of recurrence"
        }
      ]
    },
    "response_to_user": "I need more information to help you properly. Knee pain can have many causes, and I want to give you accurate advice.\n\n**Please tell me:**\n\n**Most important:**\n1. **When did this start?** (Today? This week? Months ago?)\n2. **What does it feel like?** (Sharp pain? Dull ache? Burning?)\n3. **When does it hurt?** (During squats? Running? Stairs? All the time?)\n\n**Also helpful:**\n4. **How bad is it?** (1-10 scale)\n5. **Any clicking, swelling, or locking?**\n6. **Did you recently increase your training?**\n\nOnce I know these details, I can determine if this is:\n- Normal training soreness (DOMS)\n- An overuse injury that needs modification\n- Something that requires medical attention\n\nThe more specific you are, the better I can help! 👍"
  }
}
```

---

## Example 4: Multi-Turn Conversation - Progressive Information Gathering

```jsonl
{
  "conversation_history": [
    {
      "role": "user",
      "content": "My shoulder hurts",
      "timestamp": "2025-11-07T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I can help with that. Can you describe the pain? Is it sharp or a dull ache?",
      "timestamp": "2025-11-07T10:00:05Z",
      "reasoning": "Initial query too vague, need pain quality to differentiate acute injury vs. overuse"
    },
    {
      "role": "user",
      "content": "Sharp when I lift my arm overhead",
      "timestamp": "2025-11-07T10:00:30Z"
    },
    {
      "role": "assistant",
      "content": "Sharp pain with overhead movement is important. When did this start?",
      "timestamp": "2025-11-07T10:00:35Z",
      "reasoning": "Sharp + overhead = likely rotator cuff issue, need onset to determine acute vs. chronic"
    },
    {
      "role": "user",
      "content": "During my workout today, doing overhead press",
      "timestamp": "2025-11-07T10:01:00Z"
    },
    {
      "role": "assistant",
      "content": "Got it. Did you feel a pop or sudden twinge, or did it come on gradually during the set?",
      "timestamp": "2025-11-07T10:01:05Z",
      "reasoning": "Acute onset today, need mechanism to assess severity (pop = more severe)"
    },
    {
      "role": "user",
      "content": "No pop, just started hurting halfway through my second set",
      "timestamp": "2025-11-07T10:01:30Z"
    }
  ],
  "context": {
    "user_profile": {
      "experience_level": "intermediate",
      "age": 30,
      "training_goal": "strength",
      "competition_timeline": null,
      "injury_history": []
    },
    "user_history": [
      {"date": "2025-11-05", "exercise": "overhead_press", "weight": 155, "sets": 3, "reps": 5, "rpe": 8}
    ],
    "recovery_data": {
      "sleep_avg_7days": 6.8,
      "soreness_baseline": 4,
      "stress_level": "high"
    },
    "current_program": {
      "phase": "strength",
      "week": 4,
      "volume_trend": "increasing"
    }
  },
  "final_assessment": {
    "reasoning_chain": [
      "User reports sharp pain with overhead movement - classic rotator cuff presentation",
      "Pain started mid-set (not sudden pop) - suggests overload/fatigue, not acute tear",
      "Recent workout shows 155 lbs overhead press at RPE 8 - moderate-heavy load",
      "User has suboptimal recovery: 6.8 hrs sleep, high stress, soreness baseline 4/10",
      "Week 4 of strength phase with increasing volume - peak fatigue period",
      "No pop or sudden mechanism - likely Grade 1 strain, not rupture",
      "Multi-turn conversation revealed: sharp pain + overhead + acute onset + no pop = rotator cuff strain with good prognosis"
    ],
    "assessment": {
      "injury_detected": true,
      "confidence": 0.88,
      "confidence_reasoning": "Clear mechanism (overhead pressing), sharp pain, acute onset, no severe red flags (no pop), corroborating context (suboptimal recovery, peak fatigue). Confidence slightly lower than if we had full training history.",
      "body_part": "shoulder",
      "body_part_specific": "rotator_cuff",
      "severity": "mild_to_moderate",
      "severity_reasoning": "Sharp pain but no pop, no loss of function, acute onset suggests Grade 1 strain",
      "injury_type": "rotator_cuff_strain",
      "contributing_factors": [
        "suboptimal_sleep_6.8_hours",
        "high_stress_level",
        "peak_fatigue_week_4",
        "increasing_volume_trend"
      ]
    },
    "conversation_effectiveness": {
      "questions_asked": 4,
      "information_gained": [
        "pain_quality_sharp",
        "movement_pattern_overhead",
        "onset_acute_today",
        "mechanism_gradual_not_sudden"
      ],
      "confidence_progression": [
        {"after_question_1": 0.40, "reasoning": "Know it's shoulder pain, nothing else"},
        {"after_question_2": 0.65, "reasoning": "Sharp + overhead = likely rotator cuff"},
        {"after_question_3": 0.80, "reasoning": "Acute onset today = recent injury"},
        {"after_question_4": 0.88, "reasoning": "No pop = less severe, gradual onset = overload"}
      ]
    },
    "recommendations": {
      "immediate_action": [
        {
          "action": "stop_overhead_pressing_today",
          "rationale": "Acute injury, need to prevent worsening"
        },
        {
          "action": "ice_therapy",
          "protocol": "15 minutes now, then every 3-4 hours for 48 hours"
        },
        {
          "action": "NSAIDs_if_needed",
          "details": "Ibuprofen 400mg"
        }
      ],
      "training_modifications": [
        {
          "action": "rest_overhead_pressing_48_hours",
          "then": "substitute with landmine press at 50% weight"
        }
      ],
      "recovery_timeline": "2-3 weeks with proper management",
      "medical_consultation": {
        "urgency": "consult_if_no_improvement_72_hours"
      }
    },
    "response_to_user": "Based on our conversation, I've identified a likely rotator cuff strain in your shoulder. Here's what happened:\n\n**The Issue:**\n- Sharp pain during overhead press (classic rotator cuff pattern)\n- Started mid-set without a pop (suggests overload, not tear)\n- You're in week 4 of increasing volume with suboptimal recovery (6.8 hrs sleep, high stress)\n\n**Immediate Plan:**\n- Stop overhead pressing for today\n- Ice your shoulder 15 mins now, then every 3-4 hours\n- Ibuprofen 400mg if needed\n\n**Next Steps:**\n- Rest overhead pressing for 48 hours\n- Then substitute with landmine press at 50% weight\n- Should resolve in 2-3 weeks\n\n**See a PT if:** No improvement in 72 hours or pain worsens.\n\n**Root cause:** Your recovery isn't keeping up with your training volume. Focus on getting 7.5+ hours of sleep and managing stress.\n\nWant me to log this and track your recovery?"
  }
}
```

---

## Example 5: Red Flag Scenario - Immediate Medical Referral

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "advanced",
      "age": 26,
      "training_goal": "powerlifting",
      "competition_timeline": "3_weeks",
      "injury_history": []
    },
    "user_history": [
      {"date": "2025-11-07", "exercise": "squat", "weight": 405, "sets": 1, "reps": 3, "rpe": 9, "notes": "felt great until rep 3"}
    ],
    "recovery_data": {
      "sleep_avg_7days": 7.5,
      "stress_level": "moderate"
    },
    "current_program": {
      "name": "peaking_program",
      "phase": "competition_prep",
      "week": 9,
      "total_weeks": 12
    }
  },
  "user_input": "Felt a loud pop in my knee during my third rep of squats. Can't put weight on it now. It's swelling up fast and feels unstable.",
  "output": {
    "reasoning_chain": [
      "CRITICAL RED FLAGS: loud pop + immediate loss of function + rapid swelling + instability",
      "Pop during loaded squat = high probability ligament rupture (ACL, MCL, or meniscus tear)",
      "Cannot bear weight = severe injury, not minor strain",
      "Rapid swelling = acute hemarthrosis (bleeding into joint) = structural damage",
      "Instability = ligament compromise",
      "This is NOT a training injury to manage conservatively - requires immediate medical evaluation",
      "User is 3 weeks from competition but injury severity takes absolute priority"
    ],
    "assessment": {
      "injury_detected": true,
      "confidence": 0.96,
      "confidence_reasoning": "Multiple severe red flags (pop, loss of function, rapid swelling, instability) = high confidence in severe structural injury. Classic presentation of ACL/MCL rupture or severe meniscus tear.",
      "body_part": "knee",
      "body_part_specific": "ligament_or_meniscus",
      "severity": "severe",
      "severity_reasoning": "Pop + loss of function + rapid swelling + instability = Grade 3 ligament sprain (complete rupture) or severe meniscus tear. Requires imaging and orthopedic evaluation.",
      "injury_type": "suspected_ligament_rupture_or_meniscus_tear",
      "injury_subtype": "likely_ACL_MCL_or_meniscus",
      "urgent_medical_attention_required": true
    },
    "red_flags": {
      "present": [
        "loud_audible_pop",
        "immediate_loss_of_function",
        "rapid_swelling",
        "mechanical_instability",
        "cannot_bear_weight"
      ],
      "absent": [],
      "severity": "CRITICAL - Multiple severe red flags present"
    },
    "differential_diagnoses": [
      {
        "condition": "ACL_rupture",
        "probability": 0.45,
        "distinguishing_features": "Pop, immediate swelling, instability, non-contact mechanism",
        "confidence_reasoning": "Classic ACL tear presentation"
      },
      {
        "condition": "MCL_rupture",
        "probability": 0.25,
        "distinguishing_features": "Pop, swelling, instability, pain on medial knee",
        "confidence_reasoning": "Common with valgus stress during squat"
      },
      {
        "condition": "meniscus_tear",
        "probability": 0.20,
        "distinguishing_features": "Pop, swelling, locking or catching",
        "confidence_reasoning": "Can occur with twisting under load"
      },
      {
        "condition": "combined_injury",
        "probability": 0.10,
        "distinguishing_features": "Multiple structures damaged (ACL + meniscus, etc.)",
        "confidence_reasoning": "Severe mechanism can damage multiple structures"
      }
    ],
    "affected_exercises": {
      "avoid_completely": ["ALL_LOWER_BODY_EXERCISES"],
      "training_status": "STOP_ALL_TRAINING_IMMEDIATELY"
    },
    "recommendations": {
      "immediate_action": [
        {
          "action": "STOP_TRAINING_IMMEDIATELY",
          "urgency": "CRITICAL",
          "rationale": "Severe injury - continuing could cause additional damage"
        },
        {
          "action": "DO_NOT_WALK_ON_LEG",
          "urgency": "CRITICAL",
          "rationale": "Weight-bearing with ligament rupture can cause further damage"
        },
        {
          "action": "RICE_protocol",
          "protocol": "Rest, Ice (20 mins every 2 hours), Compression (wrap knee), Elevation (above heart)",
          "urgency": "IMMEDIATE",
          "rationale": "Reduce swelling and pain while awaiting medical care"
        },
        {
          "action": "SEEK_IMMEDIATE_MEDICAL_EVALUATION",
          "urgency": "URGENT - Within 24 hours",
          "where": "Orthopedic urgent care, ER, or sports medicine physician",
          "rationale": "Suspected ligament rupture requires imaging (MRI) and specialist evaluation"
        }
      ],
      "medical_consultation": {
        "urgency": "IMMEDIATE - Within 24 hours",
        "specialist": "orthopedic_surgeon_or_sports_medicine",
        "required_imaging": "MRI to assess ligament and meniscus integrity",
        "what_to_expect": "Physical exam (Lachman test, drawer test), likely MRI, discussion of surgical vs. conservative treatment",
        "do_not_delay": "Early diagnosis and treatment improves outcomes"
      },
      "competition_implications": {
        "can_compete_in_3_weeks": "NO - Absolutely not",
        "realistic_timeline": "6-12 months if ACL rupture requiring surgery, 6-8 weeks if isolated MCL Grade 2",
        "priority": "Long-term health over competition",
        "message": "I know you have a competition in 3 weeks, but this injury takes absolute priority. Competing on a ruptured ligament could end your lifting career."
      }
    },
    "response_to_user": "🚨 **STOP TRAINING IMMEDIATELY - This is a serious injury** 🚨\n\nBased on what you've described, you likely have a **ligament rupture (ACL or MCL) or severe meniscus tear**. This is NOT something you can train through.\n\n**RED FLAGS:**\n- ✅ Loud pop during squat\n- ✅ Can't bear weight\n- ✅ Rapid swelling\n- ✅ Knee feels unstable\n\n**DO THIS NOW:**\n1. **STOP ALL TRAINING** - Do not try to \"walk it off\"\n2. **DO NOT put weight on your leg**\n3. **RICE:** Rest, Ice (20 mins every 2 hours), Compression (wrap it), Elevation (above heart)\n4. **GET MEDICAL CARE WITHIN 24 HOURS:**\n   - Go to orthopedic urgent care, ER, or sports medicine doctor\n   - You need an MRI to assess ligament/meniscus damage\n   - Do NOT delay - early treatment improves outcomes\n\n**About Your Competition (3 weeks):**\nI know this is devastating, but you **cannot compete**. Competing on a ruptured ligament could:\n- Cause permanent damage\n- Require more extensive surgery\n- End your lifting career\n\n**Realistic Timeline:**\n- If ACL rupture: 6-12 months (surgery + rehab)\n- If MCL Grade 2: 6-8 weeks (conservative treatment)\n- If meniscus tear: Varies (4-6 months if surgical)\n\n**Your long-term health is more important than one competition.** Get proper medical care now, follow the rehab protocol, and you'll come back stronger.\n\n**Do NOT:**\n- Try to train through this\n- Wait to see if it gets better\n- Attempt to compete\n\nGet to a doctor TODAY. This is serious. 🏥"
  }
}
```

## Example 6: Context-Dependent Decisions - Same Injury, Different Recommendations

### Scenario A: Competitive Powerlifter 2 Weeks from Meet

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "advanced",
      "age": 28,
      "training_goal": "powerlifting_competition",
      "competition_timeline": "2_weeks",
      "injury_history": ["minor_lower_back_strain_6_months_ago"]
    },
    "user_history": [
      {"date": "2025-11-05", "exercise": "deadlift", "weight": 495, "sets": 1, "reps": 3, "rpe": 9},
      {"date": "2025-11-07", "exercise": "deadlift", "weight": 505, "sets": 1, "reps": 1, "rpe": 10, "notes": "lower back tight after"}
    ],
    "current_program": {
      "name": "peaking_program",
      "phase": "competition_taper",
      "week": 10,
      "total_weeks": 12
    }
  },
  "user_input": "Lower back feels tight and achy after deadlifts today. Not sharp pain, just tight. Competition is in 2 weeks.",
  "output": {
    "assessment": {
      "injury_detected": true,
      "confidence": 0.78,
      "severity": "mild",
      "injury_type": "lower_back_muscle_tightness_or_mild_strain"
    },
    "recommendations": {
      "approach": "aggressive_but_calculated",
      "rationale": "Competition in 2 weeks requires balancing injury management with performance readiness. More aggressive timeline than recreational lifter.",
      "immediate_action": [
        {
          "action": "reduce_deadlift_volume_not_intensity",
          "protocol": "Singles at 90-95% instead of triples, reduce total sets",
          "rationale": "Maintain neural readiness for competition while reducing tissue stress"
        },
        {
          "action": "aggressive_recovery_protocol",
          "protocol": "Ice/heat contrast, massage, NSAIDs if needed, extra sleep",
          "rationale": "Accelerate recovery within 2-week window"
        }
      ],
      "training_modifications": [
        {
          "week_1": "Reduce deadlift to 1-2 singles at 90%, focus on technique",
          "week_2": "Openers only (80-85%), full taper",
          "competition_day": "Proceed as planned if pain <3/10"
        }
      ],
      "risk_assessment": {
        "risk_of_competing": "moderate",
        "potential_consequences": "May aggravate to Grade 2 strain, could impact performance",
        "mitigation": "Aggressive recovery, reduced volume, monitor daily",
        "decision": "Proceed with caution - competition is priority but monitor closely"
      }
    },
    "response_to_user": "With your competition in 2 weeks, we need to balance recovery with staying sharp. Here's the plan:\n\n**Week 1 (This Week):**\n- Reduce deadlifts to 1-2 singles at 90% (no triples)\n- Focus on perfect technique, not grinding reps\n- Aggressive recovery: ice/heat, massage, extra sleep\n\n**Week 2 (Competition Week):**\n- Openers only (80-85%)\n- Full taper protocol\n\n**Competition Day:**\n- Proceed if pain <3/10\n- Warm up thoroughly\n- You've got this!\n\n**Risk:** Moderate. Could aggravate to Grade 2 strain, but manageable with this protocol.\n\nYou've trained too hard to pull out now. Let's get you to the platform safely! 💪"
  }
}
```

### Scenario B: Recreational Lifter, No Time Pressure

```jsonl
{
  "context": {
    "user_profile": {
      "experience_level": "intermediate",
      "age": 28,
      "training_goal": "general_strength_and_fitness",
      "competition_timeline": null,
      "injury_history": ["minor_lower_back_strain_6_months_ago"]
    },
    "user_history": [
      {"date": "2025-11-05", "exercise": "deadlift", "weight": 315, "sets": 3, "reps": 5, "rpe": 8},
      {"date": "2025-11-07", "exercise": "deadlift", "weight": 325, "sets": 3, "reps": 5, "rpe": 9, "notes": "lower back tight after"}
    ],
    "current_program": {
      "name": "general_strength",
      "phase": "hypertrophy",
      "week": 4
    }
  },
  "user_input": "Lower back feels tight and achy after deadlifts today. Not sharp pain, just tight.",
  "output": {
    "assessment": {
      "injury_detected": true,
      "confidence": 0.78,
      "severity": "mild",
      "injury_type": "lower_back_muscle_tightness_or_mild_strain"
    },
    "recommendations": {
      "approach": "conservative_and_preventive",
      "rationale": "No competition pressure - prioritize long-term health and injury prevention over short-term performance",
      "immediate_action": [
        {
          "action": "rest_deadlifts_7_days",
          "rationale": "Allow full recovery without time pressure"
        },
        {
          "action": "substitute_with_RDLs_or_trap_bar",
          "protocol": "50-60% normal weight, focus on form",
          "rationale": "Maintain training stimulus with reduced spinal load"
        }
      ],
      "training_modifications": [
        {
          "week_1": "No conventional deadlifts, substitute RDLs at 50%",
          "week_2": "Reintroduce deadlifts at 70% if pain-free",
          "week_3": "Progress to 85% if no issues",
          "week_4": "Return to normal programming"
        }
      ],
      "risk_assessment": {
        "risk_of_continuing": "low with modifications",
        "potential_consequences": "Could develop chronic lower back issues if pushed too hard",
        "mitigation": "Conservative approach, longer timeline, focus on form",
        "decision": "Prioritize long-term health - no rush to return to heavy deadlifts"
      },
      "form_assessment": {
        "note": "RPE jumped from 8 to 9 with only 10 lb increase - suggests form breakdown or fatigue",
        "recommendation": "Film your deadlifts, check for rounding, consider form coaching"
      }
    },
    "response_to_user": "Since you're training for general fitness (no competition), let's take a conservative approach to prevent this from becoming chronic:\n\n**Week 1:**\n- No conventional deadlifts\n- Substitute Romanian deadlifts at 50% weight (focus on form)\n- Or use trap bar deadlifts (less spinal stress)\n\n**Week 2:**\n- Reintroduce deadlifts at 70% if pain-free\n- Film your sets - check for lower back rounding\n\n**Week 3-4:**\n- Gradually progress back to normal\n\n**Why conservative?**\n- Your RPE jumped from 8→9 with only 10 lbs - suggests form breakdown\n- You had a lower back strain 6 months ago - don't want this to become chronic\n- No competition = no rush!\n\n**Long-term:**\n- Consider getting a form check\n- Add core work (planks, dead bugs, bird dogs)\n- Focus on quality over weight\n\nYour back will thank you! 💪"
  }
}
```

---

## Key Training Data Enhancements Summary

### 1. **Reasoning Chains (ALL Examples)**
Every example includes explicit step-by-step reasoning showing HOW the model reaches its conclusion.

### 2. **Confidence Reasoning (ALL Examples)**
Every assessment includes WHY the model has that confidence level.

### 3. **Escalation Triggers (ALL Examples)**
Every example specifies WHEN to escalate to medical care.

### 4. **Recovery Timeline Validation (ALL Examples)**
Checkpoints at days 3, 7, week 2, week 4 with expected outcomes and escalation criteria.

### 5. **Exercise Modification Specifics (ALL Examples)**
Not just "avoid X" but "replace X with Y at Z% load, progress if pain <N/10"

### 6. **Load Management Details (ALL Examples)**
Specific volume reductions with percentages and progression plans.

### 7. **User History Integration (ALL Examples)**
Reasoning chains explicitly reference user's workout history, recovery data, and program context.

### 8. **Differential Diagnoses with Probabilities (ALL Examples)**
Multiple possible conditions with likelihood percentages and distinguishing features.

### 9. **False Positive Training (100 Examples)**
Extensive DOMS vs. injury distinction to prevent over-cautious recommendations.

### 10. **Multi-Turn Conversation Handling (150 Examples)**
Shows how to gather information progressively and increase confidence with more data.

### 11. **Red Flag Recognition (50 Examples)**
Teaches immediate medical referral for severe injuries.

### 12. **Context-Dependent Recommendations (50 Examples)**
Same injury, different advice based on user goals and timeline.

---

## Training Data Generation Instructions

### For Each of the 825 Examples, Include:

**Required Fields:**
- ✅ Full user context (profile, history, recovery, program, volume)
- ✅ Explicit reasoning chain (5-10 steps)
- ✅ Confidence score + reasoning
- ✅ Differential diagnoses with probabilities
- ✅ Red flags (present, absent, escalation triggers)
- ✅ Affected exercises (avoid, modify, caution, safe)
- ✅ Load management (current, recommended, progression)
- ✅ Recovery protocol with timeline validation
- ✅ Medical consultation criteria
- ✅ Exercise substitution library references
- ✅ User-friendly response text

**Quality Checks:**
- ✅ Reasoning chain references user history explicitly
- ✅ Confidence reasoning explains WHY that confidence level
- ✅ Escalation triggers are specific and actionable
- ✅ Exercise modifications include load%, sets/reps, progression criteria
- ✅ Recovery timeline has checkpoints with expected outcomes
- ✅ Response to user is conversational and actionable

---

## Estimated Training Cost

**Total Examples:** 825
**Average Tokens per Example:** 1,200 tokens
**Training Epochs:** 3
**Total Tokens:** 825 × 1,200 × 3 = 2,970,000 tokens

**Cost (Llama 3.3 70B fine-tuning):** ~$8.30

---

## Next Steps

1. **Generate examples in batches:**
   - Batch 1: Acute injuries (75 examples)
   - Batch 2: Chronic/overuse (150 examples)
   - Batch 3: Tendinitis (100 examples)
   - Batch 4: Impingement (75 examples)
   - Batch 5: False positives/DOMS (100 examples)
   - Batch 6: Ambiguous cases (75 examples)
   - Batch 7: Multi-turn conversations (150 examples)
   - Batch 8: Red flags (50 examples)
   - Batch 9: Context-dependent (50 examples)

2. **Quality assurance:**
   - Verify all required fields present
   - Check reasoning chain quality
   - Validate confidence calibration
   - Ensure exercise modifications are specific

3. **Format for training:**
   - Convert to JSONL format
   - Validate JSON structure
   - Upload to fine-tuning platform

4. **Train model:**
   - 3 epochs recommended
   - Monitor loss curves
   - Validate on held-out test set

---

**This refined prompt is ready for production use with Llama 3.3 70B!** 🚀

