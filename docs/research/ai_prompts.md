# AI Prompt Templates for Injury Analysis

**Version:** 1.0  
**Model:** OpenAI GPT-4o Mini  
**Purpose:** Premium tier AI-powered injury analysis from user notes  
**Based on:** Perplexity research Query 3.1 - GPT-4 Prompt Engineering Best Practices

---

## Overview

This document provides production-ready prompt templates for GPT-4o Mini to analyze injury descriptions from strength training athletes. The prompts are optimized for:

- **Consistency**: Temperature 0.3-0.5 for medical classification
- **Structured Output**: JSON schema with validation
- **Few-shot Learning**: 5 examples for injury classification
- **Safety**: Red flag detection and medical disclaimers
- **Edge Cases**: Vague descriptions, multiple injuries, non-injury text

---

## Optimal Configuration

### Model Parameters

```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.4,
  "max_tokens": 500,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

**Rationale:**
- **Temperature 0.3-0.5**: Balances consistency with nuanced medical interpretation
- **Max tokens 500**: Sufficient for structured JSON response with explanations
- **Top_p 1.0**: Standard setting for medical classification tasks

---

## Production Prompt Template

### System Message

```
You are a sports medicine AI assistant specializing in strength training injury analysis. Your role is to analyze user-reported symptoms and classify potential injuries with high accuracy.

CRITICAL RULES:
1. Output ONLY valid JSON matching the exact schema provided
2. Be conservative - when uncertain, indicate lower confidence
3. Detect red flags requiring immediate medical attention
4. Distinguish between normal training soreness (DOMS) and actual injury
5. Never provide definitive diagnoses - only assessments and recommendations

SCOPE LIMITATIONS:
- You assess musculoskeletal training-related issues only
- You do NOT diagnose medical conditions
- You do NOT replace professional medical evaluation
- You recommend medical consultation for serious concerns
```

### User Message Template

```
Analyze the following injury report from a strength training athlete and provide a structured assessment.

USER INPUT:
"{user_notes}"

CONTEXT:
- User tier: {tier} (Free/Premium)
- Recent exercises: {recent_exercises}
- Training history: {training_context}

OUTPUT REQUIREMENTS:
Return a JSON object with this exact structure:

{
  "injury_detected": boolean,
  "confidence": number (0.0-1.0),
  "body_part": string or null,
  "severity": "mild" | "moderate" | "severe" | null,
  "injury_type": string or null,
  "description": string,
  "red_flags": string[],
  "recommendations": string[],
  "requires_medical_attention": boolean,
  "differential_diagnoses": string[]
}

CLASSIFICATION GUIDELINES:

**Injury Detection:**
- TRUE if: specific pain, functional limitation, acute onset, persistent symptoms, objective signs (swelling, bruising)
- FALSE if: generalized soreness, DOMS language, positive training context, temporary discomfort

**Confidence Scoring:**
- 0.9-1.0: Clear injury indicators with multiple confirming factors
- 0.7-0.8: Likely injury with some ambiguity
- 0.5-0.6: Uncertain, could be injury or normal training response
- 0.3-0.4: Likely normal training sensation
- 0.0-0.2: Clearly not an injury (DOMS, fatigue, hyperbole)

**Severity Classification:**
- MILD: Minor discomfort, full function, no swelling, resolves quickly
- MODERATE: Noticeable pain, some functional limitation, may have swelling
- SEVERE: Significant pain, major functional limitation, objective signs, requires immediate attention

**Red Flags (require immediate medical attention):**
- Severe pain (8-10/10)
- Inability to bear weight
- Visible deformity
- Severe swelling within hours
- Numbness or tingling
- Loss of pulse or circulation
- Suspected fracture
- Joint instability or dislocation
- Chest pain or difficulty breathing

EXAMPLES:

Example 1 - Clear Injury:
Input: "Sharp pain in my shoulder during bench press, felt a pop, can't lift my arm above shoulder height, some swelling"
Output:
{
  "injury_detected": true,
  "confidence": 0.95,
  "body_part": "shoulder",
  "severity": "moderate",
  "injury_type": "possible rotator cuff strain or tear",
  "description": "Acute shoulder injury with sudden onset during pressing movement, accompanied by audible/palpable pop, significant functional limitation, and swelling",
  "red_flags": ["sudden onset with pop", "significant functional limitation", "swelling"],
  "recommendations": [
    "Cease all overhead and pressing movements immediately",
    "Apply ice for 15-20 minutes every 2-3 hours",
    "Consult sports medicine physician or orthopedist within 24-48 hours",
    "Avoid movements that reproduce pain",
    "Consider imaging (MRI) if symptoms persist beyond 1 week"
  ],
  "requires_medical_attention": true,
  "differential_diagnoses": [
    "Rotator cuff strain (partial tear)",
    "Supraspinatus tendon injury",
    "AC joint sprain",
    "Shoulder impingement with acute inflammation"
  ]
}

Example 2 - Normal DOMS:
Input: "My quads are absolutely destroyed from yesterday's squats, can barely walk downstairs, love that feeling"
Output:
{
  "injury_detected": false,
  "confidence": 0.95,
  "body_part": null,
  "severity": null,
  "injury_type": null,
  "description": "Normal delayed-onset muscle soreness (DOMS) following intense quadriceps training, positive training context, expected timeline",
  "red_flags": [],
  "recommendations": [
    "Continue light activity to promote blood flow",
    "Adequate hydration and nutrition for recovery",
    "Foam rolling and gentle stretching may provide relief",
    "Symptoms should peak at 24-48 hours and resolve within 3-5 days",
    "If pain worsens or persists beyond 5 days, reassess"
  ],
  "requires_medical_attention": false,
  "differential_diagnoses": []
}

Example 3 - Moderate Injury:
Input: "Dull aching in my lower back after heavy deadlifts, started yesterday, pain when bending forward, no swelling"
Output:
{
  "injury_detected": true,
  "confidence": 0.75,
  "body_part": "lower back",
  "severity": "mild",
  "injury_type": "possible lumbar muscle strain",
  "description": "Subacute lower back pain following heavy deadlifts with movement-specific pain pattern, no objective signs of severe injury",
  "red_flags": [],
  "recommendations": [
    "Avoid heavy spinal loading (deadlifts, squats) for 5-7 days",
    "Gentle mobility work and stretching within pain-free range",
    "Apply heat after 48 hours to promote blood flow",
    "Focus on core stability exercises",
    "If pain persists beyond 1 week or worsens, consult healthcare provider",
    "Monitor for radiating pain, numbness, or tingling (red flags)"
  ],
  "requires_medical_attention": false,
  "differential_diagnoses": [
    "Lumbar paraspinal muscle strain",
    "Facet joint irritation",
    "Mild disc irritation (if pain radiates)"
  ]
}

Example 4 - Ambiguous Case:
Input: "My knee feels tight and a bit uncomfortable during squats, started this week"
Output:
{
  "injury_detected": true,
  "confidence": 0.55,
  "body_part": "knee",
  "severity": "mild",
  "injury_type": "possible patellar tracking dysfunction or IT band tightness",
  "description": "Mild knee discomfort with gradual onset during squatting movements, lacks clear injury indicators but warrants monitoring",
  "red_flags": [],
  "recommendations": [
    "Assess squat form and depth - may be technique-related",
    "Reduce training volume by 20-30% temporarily",
    "Incorporate knee mobility and IT band stretching",
    "Foam roll quadriceps and IT band",
    "Monitor for worsening symptoms or swelling",
    "If symptoms persist beyond 2 weeks, consult physical therapist"
  ],
  "requires_medical_attention": false,
  "differential_diagnoses": [
    "IT band tightness",
    "Patellar tracking dysfunction",
    "Quadriceps tightness limiting mobility",
    "Early-stage patellar tendinitis"
  ]
}

Example 5 - Multiple Injuries:
Input: "Sharp pain in right shoulder and dull ache in lower back, both from today's workout"
Output:
{
  "injury_detected": true,
  "confidence": 0.80,
  "body_part": "shoulder (primary), lower back (secondary)",
  "severity": "moderate",
  "injury_type": "acute shoulder injury with concurrent lower back strain",
  "description": "Multiple injury sites with different pain characteristics - shoulder shows acute injury pattern, lower back shows strain pattern",
  "red_flags": ["sharp pain in shoulder"],
  "recommendations": [
    "Prioritize shoulder assessment - more acute presentation",
    "Cease all pressing and overhead movements",
    "Avoid heavy spinal loading for lower back",
    "Apply ice to shoulder for 15-20 minutes every 2-3 hours",
    "Consult healthcare provider for shoulder evaluation within 48 hours",
    "Monitor both areas for worsening symptoms",
    "Consider whether compensation patterns may have contributed to multiple injuries"
  ],
  "requires_medical_attention": true,
  "differential_diagnoses": [
    "Shoulder: rotator cuff strain, AC joint sprain, impingement",
    "Lower back: lumbar muscle strain, facet joint irritation"
  ]
}

Now analyze the user input and provide your assessment.
```

---

## Validation Strategy

### 4-Layer Validation

1. **Structural Validation**: Verify JSON schema compliance
2. **Clinical Consistency**: Check that severity matches description
3. **Safety Validation**: Ensure red flags trigger medical attention flag
4. **Domain-Specific**: Verify body parts and injury types are anatomically valid

### Example Validation Code (Python)

```python
def validate_injury_analysis(response: dict) -> tuple[bool, list[str]]:
    """Validate AI injury analysis response."""
    errors = []
    
    # Structural validation
    required_fields = [
        "injury_detected", "confidence", "body_part", "severity",
        "injury_type", "description", "red_flags", "recommendations",
        "requires_medical_attention", "differential_diagnoses"
    ]
    for field in required_fields:
        if field not in response:
            errors.append(f"Missing required field: {field}")
    
    # Clinical consistency
    if response.get("severity") == "severe" and not response.get("requires_medical_attention"):
        errors.append("Severe injuries must require medical attention")
    
    if response.get("red_flags") and not response.get("requires_medical_attention"):
        errors.append("Red flags present but medical attention not required")
    
    # Confidence validation
    confidence = response.get("confidence", 0)
    if not (0.0 <= confidence <= 1.0):
        errors.append(f"Confidence must be 0.0-1.0, got {confidence}")
    
    return len(errors) == 0, errors
```

---

## Edge Case Handling

### Vague Descriptions
- Lower confidence score (0.3-0.5)
- Request more specific information in recommendations
- Provide general guidance

### Non-Injury Text
- Set `injury_detected: false`
- High confidence (0.9+)
- Empty differential diagnoses

### Hyperbolic Language
- Filter out expressions like "killed it", "destroyed", "crushed"
- Focus on functional limitations and objective signs

---

## Cost Optimization

- **Input tokens**: ~400-600 per request (with few-shot examples)
- **Output tokens**: ~200-300 per response
- **Estimated cost**: $0.0003-0.0005 per analysis (GPT-4o Mini pricing)
- **Daily limit recommendation**: 100 analyses per user to prevent abuse

---

## References

Based on Perplexity research findings:
- Temperature 0.3-0.5 optimal for medical classification tasks
- Few-shot learning significantly improves accuracy for domain-specific tasks
- Structured JSON output with schema validation reduces parsing errors
- Red flag detection critical for safety in medical AI applications

