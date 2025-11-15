# Injury Detection RAG Service

**AI-powered injury detection using Grok 4 Fast Reasoning + Upstash Search with Enhanced Features**

## Overview

The Injury Detection RAG Service provides premium-tier users with AI-powered injury analysis using:

1. **Grok 4 Fast Reasoning** - Superior reasoning for complex medical scenarios
2. **Upstash Search** - RAG retrieval from injury research knowledge base
3. **Context-Aware Analysis** - Considers user's training history, previous injuries, and recovery status
4. **Enhanced Features** - Multi-injury detection, training load analysis, confidence calibration, and more

This replaces the previous OpenAI GPT-4o Mini implementation with a more powerful RAG-enhanced system.

## Architecture

```
User Notes → Multi-Injury Detection → Sport Detection → Namespace Selection
                      ↓                       ↓                  ↓
              Injury History ← → Training Load ← → Upstash Search (RAG)
                      ↓                       ↓                  ↓
                 Grok 4 Fast Reasoning (with all context)
                      ↓                       ↓                  ↓
              Confidence Calibration ← → Follow-up Questions
                                    ↓
                          Structured Output
```

### Components

1. **Multi-Injury Detection** - Detects and analyzes multiple distinct injuries in one note
2. **Sport Type Detection** - Identifies user's sport (powerlifting, Olympic lifting, running, CrossFit, bodybuilding)
3. **Smart Namespace Selection** - Dynamically selects 2-5 most relevant namespaces including sport-specific ones
4. **Injury History Tracking** - Fetches and considers user's previous injuries from Supabase
5. **Training Load Integration** - Analyzes recent training volume for overtraining detection
6. **Parallel RAG Retrieval** - Searches multiple namespaces in parallel for fast context retrieval
7. **Grok 4 Fast Reasoning** - Analyzes injury with retrieved research context and comprehensive user data
8. **Confidence Calibration** - Adjusts confidence scores based on historical accuracy
9. **Follow-up Question Generation** - Generates clarifying questions for ambiguous cases
10. **Structured Output** - Returns JSON with injury assessment, recommendations, and timeline

## Namespaces Used

The service searches from the following Upstash namespaces (expanded coverage):

**Core Injury Namespaces:**
- `injury-analysis` - Core injury detection and diagnosis
- `injury-prevention` - Prevention strategies and risk factors
- `injury-management` - Recovery protocols and rehabilitation
- `exercise-substitution` - Safe exercise alternatives during recovery
- `mobility-flexibility` - Mobility work for injury recovery
- `recovery-and-performance` - Recovery science and optimization

**Sport-Specific Namespaces (NEW):**
- `powerlifting-injuries` - Powerlifting-specific injury patterns (squat, bench, deadlift)
- `olympic-lifting-injuries` - Olympic lifting injury patterns (snatch, clean & jerk)
- `running-injuries` - Running and endurance sport injuries
- `crossfit-injuries` - CrossFit-specific injury patterns
- `bodybuilding-injuries` - Bodybuilding and hypertrophy training injuries

The service automatically selects the most relevant namespaces based on injury notes and detected sport type.

## Enhanced Features

### ✅ NEW: Multi-Injury Detection

Detects and analyzes multiple distinct injuries in a single note:

```python
# Example: User reports multiple injuries
notes = "My shoulder hurts during bench press and my knee is clicking during squats"

analysis, metadata = await service.analyze_injury(
    notes=notes,
    user_id="user-123"
)

# Returns
if metadata["multiple_injuries_detected"]:
    print(f"Found {metadata['injury_count']} injuries")
    for injury in analysis["injuries"]:
        print(f"- {injury['body_part']}: {injury['injury_type']}")
```

### ✅ NEW: Injury History Tracking

Fetches user's previous injuries from Supabase for better context:

```python
# Service automatically fetches injury history
analysis, metadata = await service.analyze_injury(
    notes="Shoulder pain again",
    user_id="user-123"  # Required for history lookup
)

# Analysis considers:
# - Previous similar injuries
# - Recovery patterns
# - Chronic vs. acute issues
# - Related injuries

if analysis["related_to_previous_injury"]:
    print("This may be related to a previous injury")
```

### ✅ NEW: Training Load Integration

Analyzes recent training volume for overtraining detection:

```python
# Service automatically fetches 14-day training load
analysis, metadata = await service.analyze_injury(
    notes="Lower back pain, feeling fatigued",
    user_id="user-123"
)

# Analysis includes:
# - Total volume (kg)
# - Average RPE
# - Workout frequency
# - Volume per session
# - Overtraining indicators

if analysis["overtraining_indicator"]:
    print("Warning: Training load may be contributing to injury")
```

### ✅ NEW: Sports-Specific Analysis

Automatically detects sport type and uses sport-specific injury research:

```python
# Service detects sport from recent exercises
user_context = {
    "recent_exercises": ["Squat", "Bench Press", "Deadlift"]
}

analysis, metadata = await service.analyze_injury(
    notes="Hip pain during squats",
    user_id="user-123",
    user_context=user_context
)

# Sport detected: powerlifting
# Searches: injury-analysis, injury-management, powerlifting-injuries
print(f"Sport detected: {metadata['sport_type']}")
print(f"Namespaces: {metadata['namespaces_searched']}")
```

**Sport Detection Logic:**
- **Powerlifting:** 2+ of (squat, bench press, deadlift)
- **Olympic Lifting:** snatch, clean, jerk
- **Running:** "run" or "running" in exercises
- **CrossFit:** box jump, muscle up, thruster, wall ball, burpee
- **Bodybuilding:** 3+ isolation exercises (curl, fly, extension, raise)

### ✅ NEW: Confidence Calibration

Tracks prediction accuracy over time and calibrates confidence scores:

```python
from injury_detection_rag_service import record_confidence_feedback

# Record feedback when outcome is known
calibrated_score = record_confidence_feedback(
    predicted_confidence=0.85,
    was_accurate=True  # True if prediction was correct
)

# Future predictions automatically use calibrated scoring
# - If model is overconfident: reduces scores
# - If model is underconfident: increases scores
# - Keeps history of last 100 predictions
```

**API Endpoint for Feedback:**
```bash
POST /api/injury/confidence-feedback
```

```json
{
  "predicted_confidence": 0.85,
  "was_accurate": true,
  "injury_id": "optional-injury-id",
  "notes": "User confirmed it was a rotator cuff strain"
}
```

### ✅ NEW: Follow-up Question Generation

Generates clarifying questions for ambiguous or low-confidence cases:

```python
analysis, metadata = await service.analyze_injury(
    notes="Shoulder hurts",  # Vague description
    user_id="user-123"
)

# Returns follow-up questions
if analysis["follow_up_questions"]:
    print("Please provide more information:")
    for question in analysis["follow_up_questions"]:
        print(f"- {question}")

# Example output:
# - Is the pain sharp and stabbing, or dull and achy?
# - When do you feel the pain? (e.g., during exercise, after, at rest)
# - On a scale of 1-10, how would you rate the pain intensity?
```

**Question Generation Logic:**
- Low confidence (<0.6) → asks clarifying questions
- Missing pain characteristics → asks about pain type
- Missing timing → asks when pain occurs
- Missing severity → asks for pain scale
- Missing functional impact → asks about limitations
- Limits to top 3 most important questions

## Full Feature List

### Core Features
- ✅ Detects injuries with high confidence from user notes
- ✅ Classifies severity (mild, moderate, severe)
- ✅ Identifies body part and injury type (strain, tendinitis, etc.)
- ✅ Provides reasoning - Explains the medical reasoning process
- ✅ Red flag detection - Identifies symptoms requiring immediate medical attention
- ✅ Actionable recommendations - Specific, evidence-based recovery advice
- ✅ Exercise modifications - Safe alternatives to maintain training
- ✅ Recovery timeline - Estimated time to full recovery
- ✅ Medical referral logic - Conservative approach when uncertain

### Enhanced Features (NEW)
- ✅ **Multi-injury detection** - Analyzes multiple injuries in one note
- ✅ **Injury history tracking** - Considers previous injuries for context
- ✅ **Training load integration** - Detects overtraining patterns
- ✅ **Sports-specific analysis** - Uses sport-specific injury research
- ✅ **Confidence calibration** - Learns from historical accuracy
- ✅ **Follow-up questions** - Generates clarifying questions for ambiguous cases
- ✅ **Related injury detection** - Identifies if current injury relates to previous ones
- ✅ **Overtraining indicators** - Flags potential volume/fatigue issues

### What It Still Doesn't Do
- 🚫 **Does NOT diagnose** - Provides assessments only, not medical diagnoses
- 🚫 **Does NOT replace doctors** - Always recommends medical consultation for serious issues
- 🚫 **Does NOT guarantee accuracy** - AI-assisted tool, not a medical device
- 🚫 **Does NOT handle emergencies** - For acute injuries, seek immediate medical care

## Usage Examples

### Basic Usage

```python
from injury_detection_rag_service import get_injury_detection_service
from supabase import create_client

# Initialize Supabase client
supabase = create_client(url, key)

# Initialize service with Supabase for enhanced features
service = get_injury_detection_service(supabase)

# Analyze injury with all enhanced features
analysis, metadata = await service.analyze_injury(
    notes="Shoulder pain during overhead press. Sharp pain when lifting arm.",
    user_id="user-123",  # Required for history and training load
    user_context={
        "experience_level": "intermediate",
        "recent_exercises": ["Bench press", "Overhead press", "Pull-ups"],
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
    
    # Check enhanced features
    if analysis.get("related_to_previous_injury"):
        print("⚠️ Related to previous injury")
    
    if analysis.get("overtraining_indicator"):
        print("⚠️ Overtraining detected")
    
    if analysis.get("follow_up_questions"):
        print("\nPlease clarify:")
        for q in analysis["follow_up_questions"]:
            print(f"- {q}")

# Check metadata
print(f"\nAnalysis metadata:")
print(f"Sport detected: {metadata.get('sport_type', 'Unknown')}")
print(f"Injury history available: {metadata['injury_history_available']}")
print(f"Training load available: {metadata['training_load_available']}")
print(f"Multiple injuries: {metadata['multiple_injuries_detected']}")
print(f"Total latency: {metadata['total_latency_ms']}ms")
```

### Multi-Injury Example

```python
# Analyze multiple injuries in one note
notes = """
My left shoulder is sore from bench press yesterday and my right knee 
is clicking during squats. Also have some lower back tightness.
"""

analysis, metadata = await service.analyze_injury(
    notes=notes,
    user_id="user-123"
)

if metadata["multiple_injuries_detected"]:
    print(f"Detected {metadata['injury_count']} distinct injuries:")
    
    for idx, injury in enumerate(analysis["injuries"], 1):
        print(f"\nInjury {idx}:")
        print(f"  Body Part: {injury['body_part']}")
        print(f"  Type: {injury['injury_type']}")
        print(f"  Severity: {injury['severity']}")
        print(f"  Confidence: {injury['confidence']:.2%}")
        print(f"  Recommendations: {injury['recommendations'][:2]}")
```

### Training Load Analysis Example

```python
# Analyze injury with training load context
analysis, metadata = await service.analyze_injury(
    notes="Lower back pain, feeling really fatigued",
    user_id="user-123"
)

# Check if training load contributed
if metadata["training_load_available"]:
    print("Training load analysis included")
    
if analysis.get("overtraining_indicator"):
    print("⚠️ High training volume may be contributing to injury")
    print("Consider a deload week")
```

## API Endpoint

### Analyze Injury (Enhanced)

```bash
POST /api/injury/analyze
```

**Request:**
```json
{
  "user_id": "user-123",
  "user_tier": "premium",
  "user_notes": "Shoulder pain during overhead press. Sharp pain when lifting arm above head.",
  "recent_exercises": ["Bench press", "Overhead press", "Pull-ups"],
  "training_context": "Intermediate lifter, 3 years experience"
}
```

**Response (Single Injury):**
```json
{
  "injury_detected": true,
  "confidence": 0.87,
  "body_part": "shoulder",
  "injury_type": "rotator cuff strain",
  "severity": "moderate",
  "description": "Based on your symptoms and training history, you likely have a rotator cuff strain...",
  "reasoning": "Sharp pain during overhead movements combined with recent high pressing volume...",
  "red_flags": ["Sharp pain during overhead movement", "Limited range of motion"],
  "recommendations": [
    "Rest from overhead pressing for 10-14 days",
    "Apply ice for 15-20 minutes, 3x daily for first 48 hours",
    "Perform gentle shoulder mobility exercises",
    "Consider consulting a physical therapist if pain persists"
  ],
  "exercise_modifications": [
    "Replace overhead press with landmine press (reduced shoulder stress)",
    "Use neutral grip dumbbells for pressing movements",
    "Focus on horizontal pressing (bench, floor press) initially"
  ],
  "recovery_timeline": "2-4 weeks with proper rest and gradual return to training",
  "requires_medical_attention": false,
  "follow_up_questions": [
    "Have you experienced this type of shoulder pain before?",
    "On a scale of 1-10, how would you rate the pain intensity during overhead movements?"
  ],
  "metadata": {
    "multiple_injuries_detected": false,
    "injury_count": 1,
    "namespaces_searched": ["injury-analysis", "injury-management", "powerlifting-injuries"],
    "sources_used": ["injury-analysis", "injury-management", "powerlifting-injuries"],
    "retrieval_latency_ms": 145.23,
    "inference_latency_ms": 982.45,
    "total_latency_ms": 1127.68,
    "model_used": "grok-4-fast-reasoning",
    "rag_enabled": true,
    "sport_type": "powerlifting",
    "injury_history_available": true,
    "training_load_available": true,
    "related_to_previous_injury": false,
    "overtraining_indicator": false
  }
}
```

**Response (Multiple Injuries):**
```json
{
  "injury_detected": true,
  "confidence": 0.82,
  "body_part": "shoulder",
  "injury_type": "strain",
  "severity": "moderate",
  "description": "Primary injury: Shoulder strain from pressing movements.\n\nNote: 3 distinct injuries detected. Showing primary injury.",
  "recommendations": ["Rest from pressing", "Ice therapy", "Gentle mobility work"],
  "metadata": {
    "multiple_injuries_detected": true,
    "injury_count": 3,
    "all_injuries": [
      {
        "body_part": "shoulder",
        "injury_type": "strain",
        "severity": "moderate",
        "confidence": 0.82
      },
      {
        "body_part": "knee",
        "injury_type": "patellar tracking issue",
        "severity": "mild",
        "confidence": 0.75
      },
      {
        "body_part": "lower_back",
        "injury_type": "muscle tightness",
        "severity": "mild",
        "confidence": 0.68
      }
    ]
  }
}
```

### Record Confidence Feedback

```bash
POST /api/injury/confidence-feedback
```

**Request:**
```json
{
  "predicted_confidence": 0.85,
  "was_accurate": true,
  "injury_id": "injury-456",
  "notes": "User confirmed diagnosis with physical therapist"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confidence feedback recorded",
  "calibrated_confidence": 0.83,
  "feedback_recorded": {
    "predicted": 0.85,
    "accurate": true
  }
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

The service is a singleton with optional Supabase client for enhanced features:

```python
from injury_detection_rag_service import get_injury_detection_service
from supabase import create_client

# With Supabase (enables injury history and training load)
supabase = create_client(url, key)
service = get_injury_detection_service(supabase)

# Without Supabase (basic features only)
service = get_injury_detection_service()
```

## Performance

### Latency Breakdown

Typical performance on Railway:

**Single Injury:**
- **Retrieval (Upstash):** 100-200ms (parallel search across 2-5 namespaces)
- **Inference (Grok):** 800-1200ms (complex reasoning with RAG context)
- **Total:** ~1-1.5 seconds end-to-end

**Multiple Injuries (3 injuries):**
- **Retrieval (Upstash):** 150-300ms per injury (parallelized)
- **Inference (Grok):** 900-1300ms per injury
- **Total:** ~3-4 seconds for 3 injuries

**With Enhanced Features:**
- **Injury history fetch:** +50-100ms
- **Training load fetch:** +100-200ms
- **Total overhead:** ~150-300ms

### Optimization Strategies

1. **Parallel namespace searches** - All Upstash queries run concurrently
2. **Smart namespace selection** - Only searches 2-5 relevant namespaces (not all 11)
3. **Sport-specific targeting** - Adds only relevant sport namespace
4. **Grok 4 Fast** - Faster than standard Grok while maintaining quality
5. **Non-streaming for JSON** - Structured output requires non-streaming mode
6. **Database query optimization** - Single queries with proper indexing
7. **Parallel injury analysis** - Multiple injuries analyzed concurrently

## Testing

### Run Enhanced Test Suite

```bash
python test_injury_rag.py
```

This tests:
1. Single injury detection
2. Multi-injury detection
3. Sport type detection
4. Training load integration
5. Follow-up question generation
6. Confidence calibration

### Manual Testing with Enhanced Features

```python
from injury_detection_rag_service import InjuryDetectionRAGService
from supabase import create_client

# Initialize with Supabase
supabase = create_client(url, key)
service = InjuryDetectionRAGService(supabase)

# Test multi-injury detection
analysis, metadata = await service.analyze_injury(
    notes="Shoulder pain and knee clicking",
    user_id="test-user-123",
    user_context={
        "experience_level": "intermediate",
        "recent_exercises": ["Squat", "Bench", "Deadlift"],
        "pain_level": 6
    }
)

print(f"Multiple injuries: {metadata['multiple_injuries_detected']}")
print(f"Injury count: {metadata['injury_count']}")
print(f"Sport detected: {metadata.get('sport_type', 'None')}")
print(f"Training load available: {metadata['training_load_available']}")
print(f"Confidence: {analysis['confidence']:.2%}")
print(f"Follow-up questions: {len(analysis.get('follow_up_questions', []))}")
```

## Error Handling

The service handles errors gracefully with enhanced features:

```python
try:
    analysis, metadata = await service.analyze_injury(
        notes="...",
        user_id="user-123"
    )
except Exception as e:
    print(f"Error: {e}")
    # Service returns fallback result on API errors
```

Fallback behavior:
- Returns `injury_detected: false` with error description
- Recommends consulting medical professional
- Includes error details in logs
- Continues even if injury history or training load unavailable

## Comparison: Free vs Premium

### Free Tier (Mobile App)
- **Method:** Simple keyword matching (`InjuryDetectionService.ts`)
- **Data Source:** Static `injury_keywords.json` dictionary
- **Speed:** Instant (local processing)
- **Accuracy:** Basic (keyword-based, no context)
- **Output:** Boolean detection + basic classification
- **Features:** Single injury detection only

### Premium Tier (This Service)
- **Method:** Grok 4 Fast Reasoning + RAG + Enhanced Features
- **Data Source:** Upstash injury research knowledge base + Supabase user data
- **Speed:** ~1-1.5 seconds (API calls) + database queries
- **Accuracy:** High (AI reasoning + research context + user history)
- **Output:** Detailed analysis + recommendations + recovery plan
- **Features:** 
  - Multi-injury detection
  - Injury history tracking
  - Training load analysis
  - Sports-specific insights
  - Confidence calibration
  - Follow-up question generation

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
supabase>=2.0.0  # Required for enhanced features
```

## Future Enhancements Status

- ✅ **COMPLETED:** Add injury history tracking for better context
- ✅ **COMPLETED:** Integrate with user's training load data
- ✅ **COMPLETED:** Add multi-injury detection (multiple injuries in one note)
- ✅ **COMPLETED:** Expand namespace coverage (sports-specific injuries)
- ✅ **COMPLETED:** Add confidence calibration based on historical accuracy
- ✅ **COMPLETED:** Implement follow-up question generation for ambiguous cases

### Next Potential Enhancements

- [ ] Real-time injury risk prediction during workout logging
- [ ] Personalized recovery protocol generation based on user response patterns
- [ ] Integration with wearable data (HRV, sleep quality) for injury prediction
- [ ] Collaborative filtering from anonymized injury recovery data
- [ ] Progressive image analysis for swelling/bruising assessment
- [ ] Integration with exercise substitution recommendations in real-time

## Troubleshooting

### Service fails to initialize
- Check environment variables are set correctly
- Verify Upstash and XAI API keys are valid
- Ensure network connectivity to Upstash and XAI APIs
- Verify Supabase client configuration (if using enhanced features)

### Low confidence scores
- User notes may be too vague
- Try adding more detail about symptoms, location, and mechanism of injury
- Include information about when it started and what makes it worse/better
- Answer follow-up questions if provided

### High latency (>3 seconds)
- Check network connection to Railway/Upstash/XAI/Supabase
- Verify Upstash instance isn't rate-limited
- Consider using fewer namespaces (reduce context retrieval)
- Check if multiple injuries are being analyzed (increases latency)
- Verify database queries are indexed properly

### JSON parsing errors
- Grok occasionally returns markdown-wrapped JSON
- Service automatically handles ```json blocks
- Check logs for raw Grok response if errors persist

### Enhanced features not working
- Verify `user_id` is provided in request
- Check Supabase client is passed to service initialization
- Ensure user has permission to access Supabase tables
- Verify `injury_logs`, `workout_logs`, and `sets` tables exist

## Support

For issues or questions:
1. Check the test suite output: `python test_injury_rag.py`
2. Review logs for API errors
3. Verify environment configuration
4. Check Upstash, XAI, and Supabase API status
5. Test with simple single-injury notes first

---

**Version:** 2.0.0  
**Last Updated:** January 2025  
**Model:** Grok 4 Fast Reasoning  
**RAG Provider:** Upstash Search  
**Database:** Supabase (for enhanced features)  
**Status:** ✅ All Future Enhancements Implemented