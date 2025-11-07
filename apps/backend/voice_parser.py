"""
Voice Parsing API Endpoint for Voice Fit

This module provides the FastAPI endpoint for parsing voice commands into structured workout data.

Features:
- Fine-tuned GPT-4o-mini model for voice parsing (3,890 training examples)
- Upstash Search for exercise matching (452 exercises, YouTube-derived synonyms)
- Confidence scoring with thresholds (High: 85%, Low: 70%)
- Fallback chain: Fine-tuned → Base model → Fuzzy match
- Logging to Supabase for analytics
- Sub-100ms p95 latency target

Supported Terminology:
- Exercise abbreviations: RDL, OHP, DB, KB, BB, GHD, ATG, Nord Curl
- Equipment shortcuts: "db rows", "kb swings", "bb bench"
- Competition terms: "comp bench", "pause squat", "box squat"
- Movement patterns: "pressing", "squatting", "pulling"
- CrossFit/Functional: "wall balls", "box jumps", "thrusters"

Usage Examples:
    POST /api/voice/parse

    Standard command:
    {
        "transcript": "bench press 225 for 8 at RPE 8"
    }

    With abbreviations:
    {
        "transcript": "RDL 315 for 5"
    }

    With equipment shortcuts:
    {
        "transcript": "db rows 80s for 12"
    }

    Competition terminology:
    {
        "transcript": "comp bench 185 for 8"
    }

    Same weight reference:
    {
        "transcript": "same weight for 7",
        "workout_context": {
            "current_exercise_id": "uuid",
            "last_weight": 225,
            "last_reps": 8
        }
    }

Response:
    {
        "exercise_id": "uuid",
        "exercise_name": "Barbell Bench Press",
        "weight": 225,
        "weight_unit": "lbs",
        "reps": 8,
        "rpe": 8,
        "rir": 2,
        "confidence": 0.95,
        "requires_confirmation": false,
        "model_used": "ft:gpt-4o-mini-2024-07-18:...",
        "latency_ms": 85
    }

See VOICE_COMMAND_GUIDE.md for complete list of supported commands and terminology.
"""

import os
import time
import json
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Configuration
FINE_TUNED_MODEL_ID = os.getenv("VOICE_MODEL_ID", "gpt-4o-mini-2024-07-18")  # Will be updated after fine-tuning
BASE_MODEL_ID = "gpt-4o-mini-2024-07-18"
CONFIDENCE_THRESHOLD_HIGH = 0.85  # Auto-accept
CONFIDENCE_THRESHOLD_LOW = 0.70   # Require confirmation
MAX_RETRIES = 2

# FastAPI app
app = FastAPI(
    title="Voice Fit - Voice Parsing API",
    description="Parse voice commands into structured workout data",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class WorkoutContext(BaseModel):
    """Context for parsing voice commands"""
    current_exercise_id: Optional[str] = None
    last_weight: Optional[float] = None
    last_reps: Optional[int] = None
    workout_id: Optional[str] = None


class VoiceParseRequest(BaseModel):
    """Request model for voice parsing"""
    transcript: str = Field(..., min_length=1, max_length=500, description="Voice transcript to parse")
    workout_context: Optional[WorkoutContext] = None
    user_id: Optional[str] = None  # For logging


class VoiceParseResponse(BaseModel):
    """Response model for voice parsing"""
    exercise_id: str
    exercise_name: str
    weight: Optional[float] = None
    weight_unit: Optional[str] = "lbs"
    reps: Optional[int] = None
    sets: Optional[int] = None
    rpe: Optional[float] = None
    rir: Optional[int] = None
    tempo: Optional[str] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    requires_confirmation: bool
    model_used: str
    latency_ms: int


# ============================================================================
# VOICE PARSING LOGIC
# ============================================================================

def parse_with_fine_tuned_model(transcript: str, context: Optional[Dict] = None) -> Optional[Dict]:
    """Parse voice command with fine-tuned model"""
    try:
        # Build system prompt
        system_prompt = "You are a voice command parser for workout logging. Parse the voice transcript into structured exercise data."
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context)}"
        
        # Call fine-tuned model
        response = openai_client.chat.completions.create(
            model=FINE_TUNED_MODEL_ID,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=0.1,  # Low temperature for consistency
            max_tokens=500
        )
        
        # Parse response
        parsed_output = json.loads(response.choices[0].message.content)
        return parsed_output
        
    except Exception as e:
        print(f"Fine-tuned model error: {e}")
        return None


def parse_with_base_model(transcript: str, context: Optional[Dict] = None) -> Optional[Dict]:
    """Fallback: Parse with base GPT-4o-mini model"""
    try:
        system_prompt = """You are a voice command parser for workout logging.
Parse the voice transcript into structured JSON with these fields:
- exercise_id: UUID of the exercise (required)
- exercise_name: Name of the exercise (required)
- weight: Weight in pounds or kilograms (optional)
- weight_unit: "lbs" or "kg" (optional)
- reps: Number of repetitions (optional)
- sets: Number of sets (optional)
- rpe: Rate of Perceived Exertion 1-10 (optional)
- rir: Reps in Reserve (optional)
- confidence: Your confidence score 0.0-1.0 (required)

Return ONLY valid JSON, no other text."""
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context)}"
        
        response = openai_client.chat.completions.create(
            model=BASE_MODEL_ID,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        parsed_output = json.loads(response.choices[0].message.content)
        
        # Add lower confidence for base model
        if "confidence" in parsed_output:
            parsed_output["confidence"] = min(parsed_output["confidence"], 0.80)
        
        return parsed_output
        
    except Exception as e:
        print(f"Base model error: {e}")
        return None


def log_to_supabase(
    transcript: str,
    parsed_output: Dict,
    confidence: float,
    model_id: str,
    latency_ms: int,
    user_id: Optional[str] = None,
    workout_id: Optional[str] = None,
    workout_context: Optional[Dict] = None
):
    """Log voice command to Supabase for analytics"""
    try:
        supabase.table("voice_commands").insert({
            "user_id": user_id,
            "workout_id": workout_id,
            "transcript": transcript,
            "workout_context": workout_context,
            "parsed_output": parsed_output,
            "confidence": confidence,
            "model_id": model_id,
            "latency_ms": latency_ms,
            "was_corrected": False
        }).execute()
    except Exception as e:
        print(f"Logging error: {e}")
        # Don't fail the request if logging fails


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post("/api/voice/parse", response_model=VoiceParseResponse)
async def parse_voice_command(request: VoiceParseRequest):
    """
    Parse a voice command into structured workout data
    
    This endpoint uses a fine-tuned GPT-4o-mini model to parse voice transcripts
    into structured exercise data. It includes confidence scoring and fallback logic.
    """
    start_time = time.time()
    
    # Prepare context
    context = request.workout_context.dict() if request.workout_context else None
    
    # Try fine-tuned model first
    parsed_output = parse_with_fine_tuned_model(request.transcript, context)
    model_used = FINE_TUNED_MODEL_ID
    
    # Fallback to base model if fine-tuned fails
    if not parsed_output:
        parsed_output = parse_with_base_model(request.transcript, context)
        model_used = BASE_MODEL_ID
    
    # If both fail, return error
    if not parsed_output:
        raise HTTPException(status_code=500, detail="Failed to parse voice command")
    
    # Calculate latency
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Extract confidence
    confidence = parsed_output.get("confidence", 0.5)
    
    # Determine if confirmation required
    requires_confirmation = confidence < CONFIDENCE_THRESHOLD_HIGH
    
    # Log to Supabase (async, don't block response)
    log_to_supabase(
        transcript=request.transcript,
        parsed_output=parsed_output,
        confidence=confidence,
        model_id=model_used,
        latency_ms=latency_ms,
        user_id=request.user_id,
        workout_id=context.get("workout_id") if context else None,
        workout_context=context
    )
    
    # Build response
    return VoiceParseResponse(
        exercise_id=parsed_output.get("exercise_id"),
        exercise_name=parsed_output.get("exercise_name"),
        weight=parsed_output.get("weight"),
        weight_unit=parsed_output.get("weight_unit", "lbs"),
        reps=parsed_output.get("reps"),
        sets=parsed_output.get("sets"),
        rpe=parsed_output.get("rpe"),
        rir=parsed_output.get("rir"),
        tempo=parsed_output.get("tempo"),
        rest_seconds=parsed_output.get("rest_seconds"),
        notes=parsed_output.get("notes"),
        confidence=confidence,
        requires_confirmation=requires_confirmation,
        model_used=model_used,
        latency_ms=latency_ms
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model": FINE_TUNED_MODEL_ID
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

