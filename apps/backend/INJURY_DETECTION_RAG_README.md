# Injury Detection RAG Service

**AI-powered injury detection using Grok 4 Fast Reasoning + Upstash Search**

## Overview

The Injury Detection RAG Service provides premium-tier users with AI-powered injury analysis using:

1. **Grok 4 Fast Reasoning** - Superior reasoning for complex medical scenarios
2. **Upstash Search** - RAG retrieval from injury research knowledge base
3. **Context-Aware Analysis** - Considers user's training history, previous injuries, and recovery status

This replaces the previous OpenAI GPT-4o Mini implementation with a more powerful RAG-enhanced system.

## Architecture

```
User Notes → Namespace Selection → Upstash Search (RAG) → Grok 4 Analysis → Structured Output
                                         ↓
                                  Research Context
                                  (5 relevant docs)
```

### Components

1. **Smart Namespace Selection** - Dynamically selects 2-4 most relevant namespaces based on injury notes
2. **Parallel RAG Retrieval** - Searches multiple namespaces in parallel for fast context retrieval
3. **Grok 4 Fast Reasoning** - Analyzes injury with retrieved research context and user data
4. **Structured Output** - Returns JSON with injury assessment, recommendations, and timeline

## Namespaces Used

The service searches the following Upstash namespaces:

- `injury-analysis` - Core injury detection and diagnosis
- `injury-prevention` - Prevention strategies and risk factors
- `injury-management` - Recovery protocols and rehabilitation
- `exercise-substitution` - Safe exercise alternatives during recovery
- `mobility-flexibility` - Mobility work for injury recovery
- `recovery-and-performance` - Recovery science and optimization

## Features

### ✅ What It Does

- **Detects injuries** with high confidence from user notes
- **Classifies severity** (mild, moderate, severe)
- **Identifies body part** and injury type (strain, tendinitis, etc.)
- **Provides reasoning** - Explains the medical reasoning process
- **Red flag detection** - Identifies symptoms requiring immediate medical attention
- **Actionable recommendations** - Specific, evidence-based recovery advice
- **Exercise modifications** - Safe alternatives to maintain training
- **Recovery timeline** - Estimated time to full recovery
- **Medical referral logic** - Conservative approach when uncertain

### 🚫 What It Doesn't Do

- **Does NOT diagnose** - Provides assessments only, not medical diagnoses
- **Does NOT replace doctors** - Always recommends medical consultation for serious issues
- **Does NOT guarantee accuracy** - AI-assisted tool, not a medical device
- **Does NOT handle emergencies** - For acute injuries, seek immediate medical care

## Usage

### Basic Usage

```python
from injury_detection_rag_service import get_injury_detection_service

# Initialize service (singleton)
service = get_injury_detection_service()

# Analyze injury
analysis, metadata = service.analyze_injury(
    notes="Shoulder pain during overhead press. Sharp pain when lifting arm.",
    user_context={
        "experience_level": "intermediate",
        "recent_workouts": "Bench press, overhead press, pull-ups",
        "previous_injuries": "None",
        "recovery_week": None,
        "pain_level": 6
    }
)

# Check results
if analysis["injury_detected"]:
    print(f"Injury: {analysis['injury_type']}")
    print(f"Body Part: {analysis['body_part']}")
    print(f"Severity: {analysis['severity']}")
    print(f"Confidence: {analysis['confidence']}")
    print(f"Recommendations: {analysis['recommendations']}")
```

### API Endpoint

```bash
POST /api/injury/analyze
```

**Request:**
```json
{
  "user_id": "user-123",
  "user_tier": "premium",
  "user_notes": "Strained my shoulder during bench press",
  "recent_exercises": "Bench press, overhead press",
  "training_context": "Intermediate lifter, 3 years experience"
}
```

**Response:**
```json
{
  "injury_detected": true,
  "confidence": 0.85,
  "body_part": "shoulder",
  "injury_type": "strain",
  "severity": "moderate",
  "description": "Based on your symptoms, you may have a shoulder strain...",
  "reasoning": "Sharp pain during pressing movements combined with...",
  "red_flags": ["Pain during overhead movement"],
  "recommendations": [
    "Rest from pressing movements for 7-10 days",
    "Apply ice for 15-20 minutes, 3x daily",
    "Consider switching to floor press or neutral grip variations"
  ],
  "exercise_modifications": [
    "Replace overhead press with landmine press",
    "Use neutral grip dumbbells for pressing"
  ],
  "recovery_timeline": "2-3 weeks with proper rest and modification",
  "should_see_doctor": false
}
```

## Configuration

### Environment Variables

```bash
# Required
UPSTASH_SEARCH_REST_URL=https://your-instance.upstash.io
UPSTASH_SEARCH_REST_TOKEN=your-token
XAI_API_KEY=your-xai-api-key

# Optional (defaults shown)
GROK_MODEL_ID=grok-4-fast-reasoning  # Model to use
```

### Service Initialization

The service is a singleton - use `get_injury_detection_service()` to get the instance:

```python
from injury_detection_rag_service import get_injury_detection_service

service = get_injury_detection_service()
```

## Performance

### Latency Breakdown

Typical performance on Railway:

- **Retrieval (Upstash):** 100-200ms (parallel search across 2-4 namespaces)
- **Inference (Grok):** 800-1200ms (complex reasoning with RAG context)
- **Total:** ~1-1.5 seconds end-to-end

### Optimization Strategies

1. **Parallel namespace searches** - All Upstash queries run concurrently
2. **Smart namespace selection** - Only searches 2-4 relevant namespaces (not all 6)
3. **Grok 4 Fast** - Faster than standard Grok while maintaining quality
4. **Non-streaming for JSON** - Structured output requires non-streaming mode

## Testing

### Run Test Suite

```bash
python test_injury_rag.py
```

This runs 4 test scenarios:
1. Shoulder strain (should detect)
2. Lower back pain (should detect)
3. Knee clicking (should detect)
4. Normal DOMS (should NOT detect)

### Manual Testing

```python
from injury_detection_rag_service import InjuryDetectionRAGService

service = InjuryDetectionRAGService()

analysis, metadata = service.analyze_injury(
    notes="Your test notes here",
    user_context={
        "experience_level": "beginner",
        "recent_workouts": "N/A",
        "pain_level": 5
    }
)

print(f"Detected: {analysis['injury_detected']}")
print(f"Confidence: {analysis['confidence']:.2%}")
print(f"Latency: {metadata['total_latency_ms']:.0f}ms")
```

## Error Handling

The service handles errors gracefully:

```python
try:
    analysis, metadata = service.analyze_injury(notes="...")
except Exception as e:
    print(f"Error: {e}")
    # Service returns fallback result on API errors
```

Fallback behavior:
- Returns `injury_detected: false` with error description
- Recommends consulting medical professional
- Includes error details in logs

## Comparison: Free vs Premium

### Free Tier (Mobile App)
- **Method:** Simple keyword matching (`InjuryDetectionService.ts`)
- **Data Source:** Static `injury_keywords.json` dictionary
- **Speed:** Instant (local processing)
- **Accuracy:** Basic (keyword-based, no context)
- **Output:** Boolean detection + basic classification

### Premium Tier (This Service)
- **Method:** Grok 4 Fast Reasoning + RAG
- **Data Source:** Upstash injury research knowledge base
- **Speed:** ~1-1.5 seconds (API calls)
- **Accuracy:** High (AI reasoning + research context)
- **Output:** Detailed analysis + recommendations + recovery plan

## Medical Disclaimer

⚠️ **Important:** This service provides AI-assisted injury assessments, NOT medical diagnoses.

- **Not a medical device** - For informational purposes only
- **Not a substitute for professional medical advice**
- **Always consult a healthcare provider** for injuries
- **Seek immediate medical care** for severe or acute injuries

The service is intentionally conservative and will recommend medical consultation when uncertain or when red flags are present.

## Dependencies

```
upstash-search>=0.1.0
requests>=2.31.0
python-dotenv>=1.0.0
```

## Future Enhancements

- [ ] Add injury history tracking for better context
- [ ] Integrate with user's training load data
- [ ] Add multi-injury detection (multiple injuries in one note)
- [ ] Expand namespace coverage (sports-specific injuries)
- [ ] Add confidence calibration based on historical accuracy
- [ ] Implement follow-up question generation for ambiguous cases

## Troubleshooting

### Service fails to initialize
- Check environment variables are set correctly
- Verify Upstash and XAI API keys are valid
- Ensure network connectivity to Upstash and XAI APIs

### Low confidence scores
- User notes may be too vague
- Try adding more detail about symptoms, location, and mechanism of injury
- Include information about when it started and what makes it worse/better

### High latency (>2 seconds)
- Check network connection to Railway/Upstash/XAI
- Verify Upstash instance isn't rate-limited
- Consider using fewer namespaces (reduce context retrieval)

### JSON parsing errors
- Grok occasionally returns markdown-wrapped JSON
- Service automatically handles ```json blocks
- Check logs for raw Grok response if errors persist

## Support

For issues or questions:
1. Check the test suite output: `python test_injury_rag.py`
2. Review logs for API errors
3. Verify environment configuration
4. Check Upstash and XAI API status

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Model:** Grok 4 Fast Reasoning  
**RAG Provider:** Upstash Search