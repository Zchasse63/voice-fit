"""
FastAPI application for Voice Fit voice parsing API
"""

import os
import sys
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import jwt  # PHASE 7 TASK 7.4: JWT authentication
from supabase import create_client, Client
from openai import OpenAI  # Phase 3: AI injury analysis
import json
from datetime import datetime

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrated_voice_parser import IntegratedVoiceParser
from api.models import (
    VoiceParseRequest,
    VoiceParseResponse,
    SessionSummaryResponse,
    EndSessionResponse,
    HealthCheckResponse,
    ErrorResponse
)
from injury_models import (
    InjuryAnalyzeRequest,
    InjuryAnalyzeResponse,
    InjuryLogRequest,
    InjuryLogResponse,
    ActiveInjuryResponse,
    InjuryCheckInRequest,
    RecoveryCheckInResponse,
    ExerciseSubstitutionRequest,
    ExerciseSubstitution,
    ExerciseSubstitutionResponse,
    ExplanationContext,
    ExplanationSections,
    ExerciseExplanationResponse
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Voice Fit - Voice Parsing API",
    description="API for parsing voice commands into structured workout data using fine-tuned GPT-4o-mini",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# PHASE 7 TASK 7.5: CORS middleware - configured for production
# For development, allow localhost. For production, restrict to iOS app domain.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Restrict to specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization"],  # Only needed headers
)

# Global variables
supabase_client: Client = None
voice_parser: IntegratedVoiceParser = None


def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    global supabase_client
    
    if supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase configuration missing"
            )
        
        supabase_client = create_client(supabase_url, supabase_key)
    
    return supabase_client


def get_voice_parser() -> IntegratedVoiceParser:
    """Get or create voice parser instance"""
    global voice_parser
    
    if voice_parser is None:
        supabase = get_supabase_client()
        voice_parser = IntegratedVoiceParser(supabase_client=supabase)
    
    return voice_parser


# PHASE 7 TASK 7.4: Authentication middleware
# Set to False for development, True for production
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


async def verify_token(authorization: str = Header(None)) -> dict:
    """
    Verify Supabase JWT token

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        Decoded JWT payload with user info

    Raises:
        HTTPException: If token is missing or invalid
    """
    # Skip auth check if not required (development mode)
    if not REQUIRE_AUTH:
        return {"sub": "dev_user", "email": "dev@example.com"}

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header. Include 'Authorization: Bearer <token>'"
        )

    try:
        # Extract token from "Bearer <token>" format
        token = authorization.replace("Bearer ", "")

        # Decode and verify JWT
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Voice Fit API...")
    
    # Initialize Supabase client
    try:
        get_supabase_client()
        print("✅ Supabase connected")
    except Exception as e:
        print(f"⚠️  Supabase connection failed: {e}")
    
    # Initialize voice parser
    try:
        get_voice_parser()
        print("✅ Voice parser initialized")
        print(f"✅ Model: {os.getenv('VOICE_MODEL_ID')}")
    except Exception as e:
        print(f"⚠️  Voice parser initialization failed: {e}")
    
    print("✅ Voice Fit API ready!")


@app.get("/", response_model=HealthCheckResponse)
async def root():
    """Root endpoint - health check"""
    return await health_check()


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    
    # Check Supabase connection
    supabase_connected = False
    try:
        supabase = get_supabase_client()
        # Try a simple query
        supabase.table('exercises').select('id').limit(1).execute()
        supabase_connected = True
    except Exception as e:
        print(f"Supabase health check failed: {e}")
    
    return HealthCheckResponse(
        status="healthy" if supabase_connected else "degraded",
        version="2.0.0",
        model_id=os.getenv("VOICE_MODEL_ID", "not_configured"),
        supabase_connected=supabase_connected
    )


@app.post("/api/voice/parse", response_model=VoiceParseResponse)
async def parse_voice_command(
    request: VoiceParseRequest,
    parser: IntegratedVoiceParser = Depends(get_voice_parser),
    user: dict = Depends(verify_token)  # PHASE 7 TASK 7.4: Require authentication
):
    """
    Parse a voice command into structured workout data.
    
    This endpoint:
    1. Parses the voice transcript using the fine-tuned model
    2. Handles "same weight" references with session context
    3. Fuzzy matches exercise names to database IDs
    4. Detects edge cases and provides smart defaults
    5. Optionally auto-saves high-confidence sets
    
    Returns:
    - action: "auto_accept" (≥85% confidence), "needs_confirmation" (≥70%), or "needs_clarification" (<70%)
    - parsed data with exercise, weight, reps, RPE, etc.
    - session context (set number, exercise switches, etc.)
    """
    
    try:
        # Convert previous_set to dict if provided
        previous_set_dict = None
        if request.previous_set:
            previous_set_dict = request.previous_set.model_dump()
        
        # Parse voice command
        result = parser.parse_and_log_set(
            transcript=request.transcript,
            user_id=request.user_id,
            auto_save=request.auto_save
        )
        
        # Convert to response model
        return VoiceParseResponse(**result)
    
    except Exception as e:
        print(f"Error parsing voice command: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse voice command: {str(e)}"
        )


@app.get("/api/session/{user_id}/summary", response_model=SessionSummaryResponse)
async def get_session_summary(
    user_id: str,
    parser: IntegratedVoiceParser = Depends(get_voice_parser)
):
    """
    Get current session summary for a user.
    
    Returns:
    - session_id
    - started_at timestamp
    - total_sets in session
    - current_exercise
    - exercises_count
    """
    
    try:
        summary = parser.get_session_summary(user_id)
        return SessionSummaryResponse(**summary)
    
    except Exception as e:
        print(f"Error getting session summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session summary: {str(e)}"
        )


@app.post("/api/session/{user_id}/end", response_model=EndSessionResponse)
async def end_session(
    user_id: str,
    parser: IntegratedVoiceParser = Depends(get_voice_parser)
):
    """
    End the current workout session for a user.
    
    Returns:
    - Complete session summary with statistics
    - Per-exercise summaries (sets, reps, avg weight, avg RPE)
    """
    
    try:
        final_summary = parser.end_session(user_id)
        
        if 'error' in final_summary:
            raise HTTPException(
                status_code=404,
                detail=final_summary['error']
            )
        
        return EndSessionResponse(**final_summary)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error ending session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to end session: {str(e)}"
        )


# ============================================================================
# PHASE 3: INJURY DETECTION & MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/injury/analyze", response_model=InjuryAnalyzeResponse)
async def analyze_injury(
    request: InjuryAnalyzeRequest,
    user: dict = Depends(verify_token)
):
    """
    AI-powered injury analysis (Premium tier only).

    Uses OpenAI GPT-4o Mini to analyze user notes and detect potential injuries.
    Returns structured injury assessment with recommendations.

    Premium feature - requires tier validation.
    """

    # Validate Premium tier
    if request.user_tier.lower() != 'premium':
        raise HTTPException(
            status_code=403,
            detail="AI injury analysis is a Premium feature. Upgrade to access this functionality."
        )

    try:
        # Initialize OpenAI client
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Load AI prompt template from research
        # For now, using inline prompt - in production, load from ai_prompts.md
        system_message = """You are a sports medicine AI assistant specializing in strength training injury analysis. Your role is to analyze user-reported symptoms and classify potential injuries with high accuracy.

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
- You recommend medical consultation for serious concerns"""

        user_message = f"""Analyze the following injury report from a strength training athlete and provide a structured assessment.

USER INPUT:
"{request.user_notes}"

CONTEXT:
- User tier: {request.user_tier}
- Recent exercises: {request.recent_exercises or 'Not provided'}
- Training history: {request.training_context or 'Not provided'}

OUTPUT REQUIREMENTS:
Return a JSON object with this exact structure:
{{
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
}}

Now analyze the user input and provide your assessment."""

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        # Parse response
        analysis = json.loads(response.choices[0].message.content)

        return InjuryAnalyzeResponse(**analysis)

    except Exception as e:
        print(f"Error analyzing injury: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze injury: {str(e)}"
        )


@app.post("/api/injury/log", response_model=InjuryLogResponse)
async def log_injury(
    request: InjuryLogRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Create a new injury log in Supabase.

    Saves injury information to the database for tracking and recovery monitoring.
    """

    try:
        # Create injury log in Supabase
        now = datetime.utcnow().isoformat()

        injury_data = {
            "user_id": request.user_id,
            "body_part": request.body_part,
            "severity": request.severity,
            "description": request.description,
            "status": request.status or "active",
            "reported_at": now,
            "created_at": now,
            "updated_at": now
        }

        result = supabase.table('injury_logs').insert(injury_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create injury log")

        injury_log = result.data[0]

        return InjuryLogResponse(
            id=injury_log['id'],
            user_id=injury_log['user_id'],
            body_part=injury_log['body_part'],
            severity=injury_log['severity'],
            description=injury_log.get('description'),
            status=injury_log['status'],
            reported_at=injury_log['reported_at'],
            resolved_at=injury_log.get('resolved_at'),
            last_check_in_at=injury_log.get('last_check_in_at'),
            created_at=injury_log['created_at'],
            updated_at=injury_log['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error logging injury: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log injury: {str(e)}"
        )


@app.get("/api/injury/active/{user_id}", response_model=ActiveInjuryResponse)
async def get_active_injuries(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Get all active (unresolved) injuries for a user.

    Returns injuries with status 'active' or 'recovering', sorted by reported date.
    Also identifies injuries that need weekly check-in (7+ days since last check-in).
    """

    try:
        # Query active injuries from Supabase
        result = supabase.table('injury_logs')\
            .select('*')\
            .eq('user_id', user_id)\
            .in_('status', ['active', 'recovering'])\
            .order('reported_at', desc=True)\
            .execute()

        injuries = []
        needs_check_in = []

        for injury_data in result.data:
            injury = InjuryLogResponse(
                id=injury_data['id'],
                user_id=injury_data['user_id'],
                body_part=injury_data['body_part'],
                severity=injury_data['severity'],
                description=injury_data.get('description'),
                status=injury_data['status'],
                reported_at=injury_data['reported_at'],
                resolved_at=injury_data.get('resolved_at'),
                last_check_in_at=injury_data.get('last_check_in_at'),
                created_at=injury_data['created_at'],
                updated_at=injury_data['updated_at']
            )
            injuries.append(injury)

            # Check if needs weekly check-in (7+ days)
            last_check_in = injury_data.get('last_check_in_at') or injury_data['reported_at']
            # Handle timestamps with varying microsecond precision
            last_check_in_str = last_check_in.replace('Z', '+00:00')
            # Pad microseconds to 6 digits if needed
            if '+' in last_check_in_str and '.' in last_check_in_str:
                parts = last_check_in_str.split('.')
                microseconds = parts[1].split('+')[0]
                if len(microseconds) < 6:
                    microseconds = microseconds.ljust(6, '0')
                    last_check_in_str = f"{parts[0]}.{microseconds}+{parts[1].split('+')[1]}"
            last_check_in_date = datetime.fromisoformat(last_check_in_str)
            now_aware = datetime.now(last_check_in_date.tzinfo)
            days_since_check_in = (now_aware - last_check_in_date).days

            if days_since_check_in >= 7:
                needs_check_in.append(injury_data['id'])

        return ActiveInjuryResponse(
            injuries=injuries,
            count=len(injuries),
            needs_check_in=needs_check_in
        )

    except Exception as e:
        print(f"Error getting active injuries: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active injuries: {str(e)}"
        )


@app.post("/api/injury/{injury_id}/check-in", response_model=RecoveryCheckInResponse)
async def injury_check_in(
    injury_id: str,
    request: InjuryCheckInRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Process a weekly recovery check-in for an injury.

    Calculates recovery progress, updates injury status, and provides recommendations.
    Based on evidence-based recovery protocols from recovery_protocols.md.
    """

    try:
        # Get injury from Supabase
        try:
            injury_result = supabase.table('injury_logs')\
                .select('*')\
                .eq('id', injury_id)\
                .single()\
                .execute()

            if not injury_result.data:
                raise HTTPException(status_code=404, detail="Injury not found")

            injury_data = injury_result.data
        except Exception as e:
            # Supabase raises exception when no rows found with .single()
            if "0 rows" in str(e) or "PGRST116" in str(e):
                raise HTTPException(status_code=404, detail="Injury not found")
            raise

        # Calculate days in recovery
        reported_at = datetime.fromisoformat(injury_data['reported_at'].replace('Z', '+00:00'))
        now_aware = datetime.now(reported_at.tzinfo)
        days_in_recovery = (now_aware - reported_at).days

        # Calculate progress score (simplified version of RecoveryCheckInService logic)
        initial_pain = 9 if injury_data['severity'] == 'severe' else (7 if injury_data['severity'] == 'moderate' else 5)
        pain_reduction = max(0, (initial_pain - request.pain_level) / initial_pain)
        rom_improvement = 1.0 if request.rom_quality == 'better' else (0.5 if request.rom_quality == 'same' else 0.0)
        activity_tolerance = 1.0 if request.activity_tolerance == 'improving' else (0.5 if request.activity_tolerance == 'plateau' else 0.0)

        expected_recovery_days = 60 if injury_data['severity'] == 'severe' else (21 if injury_data['severity'] == 'moderate' else 7)
        time_progress = min(1.0, days_in_recovery / expected_recovery_days)

        progress_score = (
            pain_reduction * 0.4 +
            rom_improvement * 0.3 +
            activity_tolerance * 0.2 +
            time_progress * 0.1
        )

        # Determine recovery status
        if request.pain_level <= 1 and request.rom_quality == 'better' and request.activity_tolerance == 'improving':
            status = 'resolved'
        elif request.rom_quality == 'worse' or request.activity_tolerance == 'declining':
            status = 'worsening'
        elif progress_score < 0.3 and days_in_recovery >= 14:
            status = 'plateau'
        else:
            status = 'improving'

        # Check if medical attention required
        requires_medical_attention = (
            request.pain_level >= 8 or
            status == 'worsening' or
            (status == 'plateau' and days_in_recovery >= 21) or
            (injury_data['severity'] == 'severe' and days_in_recovery >= 14 and status != 'improving') or
            (injury_data['severity'] == 'moderate' and days_in_recovery >= 28 and status != 'improving')
        )

        # Generate recommendation
        if requires_medical_attention:
            recommendation = "Your symptoms suggest you should consult a healthcare provider (physician, physical therapist, or sports medicine specialist) for proper evaluation."
        elif status == 'resolved':
            recommendation = "Great progress! Your injury appears to be resolved. You can gradually return to full training. Monitor for any symptom recurrence."
        elif status == 'improving':
            recommendation = "You're making good progress! Continue your current recovery approach and gradually increase activity as tolerated."
        elif status == 'plateau':
            recommendation = "Your recovery has plateaued. Consider consulting a physical therapist for guidance on progression strategies."
        else:
            recommendation = "Your symptoms are worsening. Reduce activity level and consult a healthcare provider if symptoms don't improve within 48 hours."

        # Update injury in Supabase
        now = datetime.utcnow().isoformat()
        update_data = {
            "last_check_in_at": now,
            "updated_at": now
        }

        if status == 'resolved':
            update_data["status"] = "resolved"
            update_data["resolved_at"] = now
        elif status == 'improving':
            update_data["status"] = "recovering"

        updated_result = supabase.table('injury_logs')\
            .update(update_data)\
            .eq('id', injury_id)\
            .execute()

        updated_injury_data = updated_result.data[0]

        updated_injury = InjuryLogResponse(
            id=updated_injury_data['id'],
            user_id=updated_injury_data['user_id'],
            body_part=updated_injury_data['body_part'],
            severity=updated_injury_data['severity'],
            description=updated_injury_data.get('description'),
            status=updated_injury_data['status'],
            reported_at=updated_injury_data['reported_at'],
            resolved_at=updated_injury_data.get('resolved_at'),
            last_check_in_at=updated_injury_data.get('last_check_in_at'),
            created_at=updated_injury_data['created_at'],
            updated_at=updated_injury_data['updated_at']
        )

        return RecoveryCheckInResponse(
            progress_score=progress_score,
            status=status,
            recommendation=recommendation,
            requires_medical_attention=requires_medical_attention,
            days_in_recovery=days_in_recovery,
            updated_injury=updated_injury
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing check-in: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process check-in: {str(e)}"
        )


# ============================================================================
# Exercise Substitution Endpoints
# ============================================================================

@app.get("/api/exercises/substitutes", response_model=ExerciseSubstitutionResponse)
async def get_exercise_substitutes(
    exercise_name: str,
    injured_body_part: Optional[str] = None,
    min_similarity_score: Optional[float] = 0.60,
    max_results: Optional[int] = 5,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Get exercise substitutions for a specific exercise.

    Returns scientifically-backed exercise alternatives based on:
    - Similarity scores (0.0-1.0) from EMG studies and biomechanical analysis
    - Injured body part (reduces stress on shoulder, lower_back, knee, elbow, hip)
    - Movement patterns and muscle activation

    Data source: 250+ exercise substitutions from comprehensive research database.

    Query Parameters:
    - exercise_name: Name of the exercise to find substitutes for (required)
    - injured_body_part: Body part to protect (optional: shoulder, lower_back, knee, elbow, hip)
    - min_similarity_score: Minimum similarity threshold 0.0-1.0 (default: 0.60)
    - max_results: Maximum number of substitutes to return (default: 5, max: 20)

    Returns:
    - original_exercise: The exercise queried
    - substitutes: List of substitute exercises with similarity scores and notes
    - total_found: Number of substitutes found
    - filters_applied: Filters that were applied
    """
    try:
        # Build Supabase query
        query = supabase.table('exercise_substitutions') \
            .select('*') \
            .eq('exercise_name', exercise_name) \
            .gte('similarity_score', min_similarity_score) \
            .order('similarity_score', desc=True)

        # Filter by injured body part (reduced stress area)
        if injured_body_part and injured_body_part != 'none':
            query = query.eq('reduced_stress_area', injured_body_part)

        # Limit results
        query = query.limit(max_results)

        # Execute query
        result = query.execute()

        if not result.data:
            # No substitutes found
            return ExerciseSubstitutionResponse(
                original_exercise=exercise_name,
                substitutes=[],
                total_found=0,
                filters_applied={
                    'injured_body_part': injured_body_part,
                    'min_similarity': min_similarity_score,
                }
            )

        # Convert to ExerciseSubstitution models
        substitutes = [
            ExerciseSubstitution(
                id=row['id'],
                exercise_name=row['exercise_name'],
                substitute_name=row['substitute_name'],
                similarity_score=row['similarity_score'],
                reduced_stress_area=row['reduced_stress_area'],
                movement_pattern=row['movement_pattern'],
                primary_muscles=row['primary_muscles'],
                equipment_required=row['equipment_required'],
                difficulty_level=row['difficulty_level'],
                notes=row['notes']
            )
            for row in result.data
        ]

        return ExerciseSubstitutionResponse(
            original_exercise=exercise_name,
            substitutes=substitutes,
            total_found=len(substitutes),
            filters_applied={
                'injured_body_part': injured_body_part,
                'min_similarity': min_similarity_score,
            }
        )

    except Exception as e:
        print(f"Error fetching exercise substitutes: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch exercise substitutes: {str(e)}"
        )


@app.get("/api/exercises/substitutes/risk-aware", response_model=ExerciseSubstitutionResponse)
async def get_risk_aware_substitutes(
    exercise_name: str,
    injured_body_part: str,
    min_similarity_score: Optional[float] = 0.60,
    max_results: Optional[int] = 5,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Get risk-aware exercise substitutions that minimize stress on injured body part.

    This endpoint combines:
    1. Exercise substitution data (similarity scores, movement patterns)
    2. Body part stress intensity data (1-5 scale)

    Returns substitutes sorted by:
    1. Lowest stress on injured body part (prioritized)
    2. Highest similarity score (secondary)

    Query Parameters:
    - exercise_name: Name of the exercise to find substitutes for (required)
    - injured_body_part: Body part to protect (required: shoulder, lower_back, knee, elbow, hip, ankle, core)
    - min_similarity_score: Minimum similarity threshold 0.0-1.0 (default: 0.60)
    - max_results: Maximum number of substitutes to return (default: 5, max: 20)

    Returns:
    - Substitutes with stress_on_injured_part field (1-5 or null if no data)
    - Sorted by stress intensity (lower is safer), then similarity (higher is better)
    """
    try:
        # Step 1: Get all substitutions for the exercise
        subs_result = supabase.table('exercise_substitutions') \
            .select('*') \
            .eq('exercise_name', exercise_name) \
            .gte('similarity_score', min_similarity_score) \
            .order('similarity_score', desc=True) \
            .execute()

        if not subs_result.data:
            return ExerciseSubstitutionResponse(
                original_exercise=exercise_name,
                substitutes=[],
                total_found=0,
                filters_applied={
                    'injured_body_part': injured_body_part,
                    'min_similarity': min_similarity_score,
                    'risk_aware': True,
                }
            )

        # Step 2: Get stress data for all substitute exercises
        substitute_names = [row['substitute_name'] for row in subs_result.data]
        stress_result = supabase.table('exercise_body_part_stress') \
            .select('exercise_name, stress_intensity') \
            .in_('exercise_name', substitute_names) \
            .eq('body_part', injured_body_part) \
            .execute()

        # Step 3: Build stress intensity map
        stress_map = {}
        if stress_result.data:
            for row in stress_result.data:
                stress_map[row['exercise_name']] = row['stress_intensity']

        # Step 4: Enrich substitutions with stress data
        enriched_subs = []
        for row in subs_result.data:
            sub = ExerciseSubstitution(
                id=row['id'],
                exercise_name=row['exercise_name'],
                substitute_name=row['substitute_name'],
                similarity_score=row['similarity_score'],
                reduced_stress_area=row['reduced_stress_area'],
                movement_pattern=row['movement_pattern'],
                primary_muscles=row['primary_muscles'],
                equipment_required=row['equipment_required'],
                difficulty_level=row['difficulty_level'],
                notes=row['notes']
            )
            stress_on_injured_part = stress_map.get(row['substitute_name'])
            enriched_subs.append({
                **sub.dict(),
                'stress_on_injured_part': stress_on_injured_part
            })

        # Step 5: Sort by stress (lowest first), then similarity (highest first)
        def sort_key(item):
            stress = item['stress_on_injured_part']
            similarity = item['similarity_score']

            # Prioritize exercises with no stress data (likely safer)
            if stress is None:
                return (0, -similarity)  # 0 = highest priority, negative similarity for descending
            else:
                return (stress, -similarity)  # Lower stress = higher priority

        enriched_subs.sort(key=sort_key)

        # Step 6: Limit results
        enriched_subs = enriched_subs[:max_results]

        return ExerciseSubstitutionResponse(
            original_exercise=exercise_name,
            substitutes=enriched_subs,
            total_found=len(enriched_subs),
            filters_applied={
                'injured_body_part': injured_body_part,
                'min_similarity': min_similarity_score,
                'risk_aware': True,
            }
        )

    except Exception as e:
        print(f"Error fetching risk-aware substitutes: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch risk-aware substitutes: {str(e)}"
        )


@app.get("/api/exercises/substitutes/explain", response_model=ExerciseExplanationResponse)
async def get_exercise_explanation(
    exercise_name: str,
    substitute_name: str,
    injured_body_part: Optional[str] = None,
    injury_type: Optional[str] = None,
    recovery_week: Optional[int] = None,
    pain_level: Optional[int] = None,
    experience_level: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    """
    Get a user-friendly explanation for why a specific exercise substitution is recommended.

    This endpoint formats database-driven explanations (no AI needed) with:
    - Why this substitution is recommended (injury-specific context)
    - Scientific evidence from EMG studies and biomechanical research
    - Similarity score explanation
    - How to use the exercise (equipment, difficulty, execution tips)
    - Recovery context (injury-specific guidance based on recovery timeline)

    Query Parameters:
    - exercise_name: Original exercise name (required)
    - substitute_name: Substitute exercise name (required)
    - injured_body_part: Body part to protect (optional)
    - injury_type: Type of injury (optional)
    - recovery_week: Week number in recovery (optional)
    - pain_level: Current pain level 0-10 (optional)
    - experience_level: User experience level: beginner, intermediate, advanced (optional)

    Returns:
    - Full formatted explanation with sections
    - Similarity score and reduced stress area
    """
    try:
        # Fetch the substitution from database
        result = supabase.table('exercise_substitutions') \
            .select('*') \
            .eq('exercise_name', exercise_name) \
            .eq('substitute_name', substitute_name) \
            .limit(1) \
            .execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No substitution found for {exercise_name} → {substitute_name}"
            )

        sub_data = result.data[0]

        # Format explanation using helper functions
        context = {
            'injured_body_part': injured_body_part,
            'injury_type': injury_type,
            'recovery_week': recovery_week,
            'pain_level': pain_level,
            'experience_level': experience_level,
        }

        # Build explanation sections
        sections = format_explanation_sections(sub_data, context)

        # Combine sections into full explanation
        full_explanation = combine_explanation_sections(sections)

        return ExerciseExplanationResponse(
            exercise_name=exercise_name,
            substitute_name=substitute_name,
            explanation=full_explanation,
            sections=ExplanationSections(**sections),
            similarity_score=sub_data['similarity_score'],
            reduced_stress_area=sub_data['reduced_stress_area']
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating explanation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanation: {str(e)}"
        )


def format_explanation_sections(sub_data: dict, context: dict) -> dict:
    """Format explanation sections from database data"""
    sections = {}

    # 1. Why Recommended
    why_text = f"**Why {sub_data['substitute_name']} is recommended:**\n\n"

    if context.get('injured_body_part') and sub_data['reduced_stress_area'] != 'none':
        body_part_name = format_body_part_name(context['injured_body_part'])
        why_text += f"✅ **Reduces {body_part_name} Stress**\n"
        why_text += f"This exercise is specifically designed to reduce stress on your {body_part_name.lower()}, making it ideal for your recovery.\n\n"

    why_text += f"🎯 **Similar Movement Pattern**\n"
    why_text += f"Maintains the same \"{format_movement_pattern(sub_data['movement_pattern'])}\" pattern as {sub_data['exercise_name']}, "
    why_text += f"so you won't lose the training stimulus.\n\n"

    muscles = format_muscle_list(sub_data['primary_muscles'])
    why_text += f"💪 **Targets Same Muscles**\n"
    why_text += f"Works: {muscles}\n"

    sections['why_recommended'] = why_text

    # 2. Scientific Evidence
    sci_text = "**📊 Scientific Evidence:**\n\n"
    notes = sub_data.get('notes', 'No additional scientific notes available.')
    note_parts = [part.strip() for part in notes.split(';') if part.strip()]

    if note_parts:
        for note in note_parts:
            sci_text += f"• {note}\n"
    else:
        sci_text += notes + "\n"

    sections['scientific_evidence'] = sci_text

    # 3. Similarity Score
    score = sub_data['similarity_score']
    percentage = round(score * 100)

    if score >= 0.85:
        rating = 'Excellent'
        description = "This is a highly similar exercise - you won't lose any training gains!"
    elif score >= 0.75:
        rating = 'Very Good'
        description = "This is a very similar exercise with minimal differences."
    elif score >= 0.65:
        rating = 'Good'
        description = "This is a good alternative that maintains most of the training stimulus."
    else:
        rating = 'Moderate'
        description = "This alternative has some differences but still provides similar benefits."

    sim_text = f"**⭐ Similarity Score: {percentage}% ({rating})**\n\n"
    sim_text += description + "\n"

    sections['similarity_score'] = sim_text

    # 4. How to Use
    how_text = "**🎯 How to Use:**\n\n"
    how_text += f"**Equipment:** {format_equipment(sub_data['equipment_required'])}\n"
    how_text += f"**Difficulty:** {format_difficulty(sub_data['difficulty_level'])}\n\n"

    if context.get('experience_level'):
        how_text += get_experience_guidance(context['experience_level']) + "\n\n"

    how_text += "**Execution Tips:**\n"
    how_text += "• Focus on controlled movement throughout the full range of motion\n"
    how_text += "• Maintain proper form over heavy weight\n"
    how_text += "• Start with lighter weight to learn the movement pattern\n"

    sections['how_to_use'] = how_text

    # 5. Recovery Context (if applicable)
    if context.get('injured_body_part'):
        body_part_name = format_body_part_name(context['injured_body_part'])
        rec_text = f"**⚠️ For Your {body_part_name} Recovery:**\n\n"

        if context.get('recovery_week') is not None:
            rec_text += get_recovery_week_guidance(context['recovery_week'], context.get('pain_level')) + "\n\n"

        if context.get('pain_level') is not None:
            rec_text += get_pain_level_guidance(context['pain_level']) + "\n\n"

        rec_text += "**⚠️ Stop Immediately If You Feel:**\n"
        rec_text += "• Sharp pain (vs dull muscle fatigue)\n"
        rec_text += f"• Clicking or popping in the {body_part_name.lower()}\n"
        rec_text += "• Pain that persists after the set\n"
        rec_text += "• Numbness or tingling\n"

        sections['recovery_context'] = rec_text

    return sections


def combine_explanation_sections(sections: dict) -> str:
    """Combine all sections into full explanation"""
    explanation = ""

    explanation += sections['why_recommended'] + "\n\n"
    explanation += sections['scientific_evidence'] + "\n\n"
    explanation += sections['similarity_score'] + "\n\n"
    explanation += sections['how_to_use']

    if 'recovery_context' in sections:
        explanation += "\n\n" + sections['recovery_context']

    return explanation


def format_body_part_name(body_part: str) -> str:
    """Format body part name for display"""
    names = {
        'shoulder': 'Shoulder',
        'lower_back': 'Lower Back',
        'knee': 'Knee',
        'elbow': 'Elbow',
        'hip': 'Hip',
        'ankle': 'Ankle',
        'wrist': 'Wrist',
        'core': 'Core',
        'hamstrings': 'Hamstrings',
    }
    return names.get(body_part, body_part)


def format_movement_pattern(pattern: str) -> str:
    """Format movement pattern for display"""
    patterns = {
        'horizontal_push': 'Horizontal Push',
        'vertical_push': 'Vertical Push',
        'horizontal_pull': 'Horizontal Pull',
        'vertical_pull': 'Vertical Pull',
        'squat': 'Squat',
        'hinge': 'Hip Hinge',
        'lunge': 'Lunge',
        'carry': 'Loaded Carry',
        'rotation': 'Rotation',
    }
    return patterns.get(pattern, pattern)


def format_muscle_list(muscles: str) -> str:
    """Format muscle list for display"""
    return ', '.join([
        m.strip().replace('_', ' ').title()
        for m in muscles.split(',')
    ])


def format_equipment(equipment: str) -> str:
    """Format equipment name for display"""
    equipment_names = {
        'barbell': 'Barbell',
        'dumbbell': 'Dumbbells',
        'bodyweight': 'Bodyweight (no equipment)',
        'machine': 'Machine',
        'cable': 'Cable Machine',
        'kettlebell': 'Kettlebell',
        'resistance_band': 'Resistance Bands',
    }
    return equipment_names.get(equipment, equipment)


def format_difficulty(difficulty: str) -> str:
    """Format difficulty level for display"""
    levels = {
        'beginner': 'Beginner-friendly',
        'intermediate': 'Intermediate',
        'intermediate-advanced': 'Intermediate to Advanced',
        'advanced': 'Advanced',
    }
    return levels.get(difficulty, difficulty)


def get_experience_guidance(experience_level: str) -> str:
    """Get experience-specific guidance"""
    if experience_level == 'beginner':
        return "**For Beginners:** Take extra time to learn proper form. Consider working with a trainer for the first few sessions."
    elif experience_level == 'intermediate':
        return "**For Intermediate Lifters:** You should be able to transition to this exercise smoothly. Focus on maintaining the same rep ranges."
    else:
        return "**For Advanced Lifters:** You can likely match or exceed your previous training intensity with this substitute."


def get_recovery_week_guidance(recovery_week: int, pain_level: Optional[int]) -> str:
    """Get recovery week-specific guidance"""
    if recovery_week <= 2:
        return f"**Week {recovery_week} Recovery:** Start with 40-50% of your normal weight. Focus on pain-free movement and building confidence."
    elif recovery_week <= 4:
        return f"**Week {recovery_week} Recovery:** Increase to 60-70% of normal weight if pain-free. Gradually increase volume."
    elif recovery_week <= 6:
        return f"**Week {recovery_week} Recovery:** Progress to 80-90% of normal weight if full ROM is pain-free. Monitor for any setbacks."
    else:
        return f"**Week {recovery_week}+ Recovery:** You should be close to full capacity. Continue monitoring and adjust as needed."


def get_pain_level_guidance(pain_level: int) -> str:
    """Get pain level-specific guidance"""
    if pain_level == 0:
        return "**Pain Level 0/10:** Great! You can progress normally while staying cautious."
    elif pain_level <= 2:
        return f"**Pain Level {pain_level}/10:** Mild discomfort is okay, but don't push through sharp pain."
    elif pain_level <= 4:
        return f"**Pain Level {pain_level}/10:** Reduce weight and volume. Focus on quality movement."
    elif pain_level <= 6:
        return f"**Pain Level {pain_level}/10:** Consider taking a rest day or reducing intensity significantly."
    else:
        return f"**Pain Level {pain_level}/10:** This is too high. Rest and consult a healthcare professional if pain persists."


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 80)
    print("VOICE FIT API - DEVELOPMENT SERVER")
    print("=" * 80)
    print()
    print("Starting server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Alternative docs: http://localhost:8000/redoc")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 80)
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

