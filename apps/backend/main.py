"""
FastAPI application for Voice Fit voice parsing API
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import jwt  # PHASE 7 TASK 7.4: JWT authentication
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import (
    OpenAI,  # Phase 3: AI injury analysis (DEPRECATED - now using Grok + RAG)
)

from supabase import Client, create_client

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_coach_service import AICoachService
from badge_service import BadgeService
from chat_classifier import ChatClassifier
from deload_recommendation_service import DeloadRecommendationService
from exercise_matching_service import ExerciseMatchingService
from exercise_swap_service import ExerciseSwapService, get_exercise_swap_service
from fatigue_monitoring_service import FatigueMonitoringService
from feature_flags import get_feature_flags
from gap_calculator import GAPCalculator
from injury_detection_rag_service import get_injury_detection_service
from injury_models import (
    ActiveInjuryResponse,
    ExerciseExplanationResponse,
    ExerciseSubstitution,
    ExerciseSubstitutionRequest,
    ExerciseSubstitutionResponse,
    ExplanationContext,
    ExplanationSections,
    InjuryAnalyzeRequest,
    InjuryAnalyzeResponse,
    InjuryCheckInRequest,
    InjuryLogRequest,
    InjuryLogResponse,
    RecoveryCheckInResponse,
)
from integrated_voice_parser import IntegratedVoiceParser
from models import (
    AdherenceCheckInRequest,
    AdherenceCheckInResponse,
    AdherenceReportResponse,
    BadgeUnlockRequest,
    BadgeUnlockResponse,
    ChatClassifyRequest,
    ChatClassifyResponse,
    CoachQuestionRequest,
    CoachQuestionResponse,
    DeloadRecommendationResponse,
    EndSessionResponse,
    ErrorResponse,
    ExerciseCreateOrMatchRequest,
    ExerciseCreateOrMatchResponse,
    ExerciseSwapRequest,
    ExerciseSwapResponse,
    FatigueAnalyticsResponse,
    HealthCheckResponse,
    OnboardingConversationalRequest,
    OnboardingConversationalResponse,
    OnboardingExtractRequest,
    OnboardingExtractResponse,
    ProgramGenerationRequest,
    ProgramGenerationResponse,
    RunningAnalyzeRequest,
    RunningAnalyzeResponse,
    RunningParseRequest,
    RunningParseResponse,
    SessionSummaryResponse,
    VoiceLogRequest,
    VoiceLogResponse,
    VoiceParseRequest,
    VoiceParseResponse,
    VolumeAnalyticsResponse,
    WorkoutInsightsRequest,
    WorkoutInsightsResponse,
)
from onboarding_service import OnboardingService
from program_adherence_monitor import ProgramAdherenceMonitor
from program_generation_service import ProgramGenerationService
from user_context_builder import UserContextBuilder
from volume_tracking_service import VolumeTrackingService
from weather_service import WeatherService

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Voice Fit - Voice Parsing API",
    description="API for parsing voice commands into structured workout data using fine-tuned GPT-4o-mini",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# PHASE 7 TASK 7.5: CORS middleware - configured for production
# For development, allow localhost. For production, allow all origins for mobile app.
# Mobile apps don't send Origin headers, so we need to allow all origins.
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = (
    ALLOWED_ORIGINS_STR.split(",") if ALLOWED_ORIGINS_STR != "*" else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Allow all for mobile app compatibility
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # All needed methods
    allow_headers=["Content-Type", "Authorization"],  # Only needed headers
)

# Global variables
supabase_client: Client = None
voice_parser: IntegratedVoiceParser = None
badge_service: BadgeService = None
ai_coach_service: AICoachService = None
program_generation_service: ProgramGenerationService = None
user_context_builder: UserContextBuilder = None
chat_classifier: ChatClassifier = None
onboarding_service: OnboardingService = None
exercise_matching_service: ExerciseMatchingService = None


def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    global supabase_client

    if supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500, detail="Supabase configuration missing"
            )

        supabase_client = create_client(supabase_url, supabase_key)

    return supabase_client


def get_badge_service() -> BadgeService:
    """Get or create BadgeService instance"""
    global badge_service

    if badge_service is None:
        supabase = get_supabase_client()
        badge_service = BadgeService(supabase)

    return badge_service


def get_voice_parser() -> IntegratedVoiceParser:
    """Get or create voice parser instance"""
    global voice_parser

    if voice_parser is None:
        supabase = get_supabase_client()
        voice_parser = IntegratedVoiceParser(supabase_client=supabase)

    return voice_parser


def get_ai_coach_service() -> AICoachService:
    """Get or create AI Coach service instance"""
    global ai_coach_service

    if ai_coach_service is None:
        ai_coach_service = AICoachService()

    return ai_coach_service


def get_program_generation_service() -> ProgramGenerationService:
    """Get or create Program Generation service instance"""
    global program_generation_service

    if program_generation_service is None:
        program_generation_service = ProgramGenerationService()

    return program_generation_service


def get_user_context_builder() -> UserContextBuilder:
    """Get or create UserContextBuilder instance"""
    global user_context_builder

    if user_context_builder is None:
        supabase = get_supabase_client()
        user_context_builder = UserContextBuilder(supabase)

    return user_context_builder


def get_volume_tracking_service() -> VolumeTrackingService:
    """Get VolumeTrackingService instance"""
    supabase = get_supabase_client()
    return VolumeTrackingService(supabase)


def get_fatigue_monitoring_service() -> FatigueMonitoringService:
    """Get FatigueMonitoringService instance"""
    supabase = get_supabase_client()
    return FatigueMonitoringService(supabase)


def get_deload_recommendation_service() -> DeloadRecommendationService:
    """Get DeloadRecommendationService instance"""
    supabase = get_supabase_client()
    fatigue_service = get_fatigue_monitoring_service()
    volume_service = get_volume_tracking_service()
    return DeloadRecommendationService(supabase, fatigue_service, volume_service)


def get_adherence_monitor() -> ProgramAdherenceMonitor:
    """Get ProgramAdherenceMonitor instance"""
    supabase = get_supabase_client()
    return ProgramAdherenceMonitor(supabase)


def get_chat_classifier() -> ChatClassifier:
    """Get or create ChatClassifier instance"""
    global chat_classifier
    if chat_classifier is None:
        chat_classifier = ChatClassifier()
    return chat_classifier


def get_onboarding_service() -> OnboardingService:
    """Get or create OnboardingService instance"""
    global onboarding_service
    if onboarding_service is None:
        onboarding_service = OnboardingService()
    return onboarding_service


def get_exercise_matching_service() -> ExerciseMatchingService:
    """Get or create ExerciseMatchingService instance"""
    global exercise_matching_service
    if exercise_matching_service is None:
        exercise_matching_service = ExerciseMatchingService()
    return exercise_matching_service


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
            detail="Missing authorization header. Include 'Authorization: Bearer <token>'",
        )

    try:
        # Extract token from "Bearer <token>" format
        token = authorization.replace("Bearer ", "")

        # Decode and verify JWT
        payload = jwt.decode(
            token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
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
        supabase.table("exercises").select("id").limit(1).execute()
        supabase_connected = True
    except Exception as e:
        print(f"Supabase health check failed: {e}")

    return HealthCheckResponse(
        status="healthy" if supabase_connected else "degraded",
        version="2.0.0",
        model_id=os.getenv("VOICE_MODEL_ID", "not_configured"),
        supabase_connected=supabase_connected,
    )


@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """
    Global OPTIONS handler for CORS preflight requests.
    Returns 200 OK with CORS headers for any path.
    """
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        },
    )


@app.post("/api/voice/parse", response_model=VoiceParseResponse)
async def parse_voice_command(
    request: VoiceParseRequest,
    parser: IntegratedVoiceParser = Depends(get_voice_parser),
    user: dict = Depends(verify_token),
):
    """
    Parse a voice command into structured workout data.

    Uses fine-tuned Llama 3.3 70B model + Upstash Search for exercise matching.
    """
    try:
        result = parser.parse_and_log_set(
            transcript=request.transcript,
            user_id=request.user_id,
            auto_save=request.auto_save,
        )

        return VoiceParseResponse(**result)

    except Exception as e:
        print(f"Error parsing voice command: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to parse voice command: {str(e)}"
        )


@app.post("/api/voice/log", response_model=VoiceLogResponse)
async def log_voice_workout(
    request: VoiceLogRequest,
    parser: IntegratedVoiceParser = Depends(get_voice_parser),
    user: dict = Depends(verify_token),
):
    """
    Log a voice workout - parse voice input and save to database.

    This endpoint parses the voice input and automatically saves the set to the database.
    Returns the created set IDs and parsed data.
    """
    try:
        # Parse the voice input with auto_save enabled
        result = parser.parse_and_log_set(
            transcript=request.voice_input,
            user_id=request.user_id,
            auto_save=True,  # Always save when using /api/voice/log
        )

        # Extract set IDs if saved
        set_ids = []
        if result.get("saved") and result.get("set_id"):
            # The parser returns set_id when a set is successfully saved
            set_ids = [str(result.get("set_id"))]

        # Create parsed data object
        parsed_data = result.get("data", {})

        return VoiceLogResponse(
            success=result.get("success", False),
            workout_log_id=request.workout_id,
            set_ids=set_ids,
            parsed_data=parsed_data,
            message=result.get("message", "Voice input processed"),
        )

    except Exception as e:
        print(f"Error logging voice workout: {e}")
        return VoiceLogResponse(
            success=False,
            error=f"Failed to log voice workout: {str(e)}",
        )


@app.get("/api/session/{user_id}/summary", response_model=SessionSummaryResponse)
async def get_session_summary(
    user_id: str, parser: IntegratedVoiceParser = Depends(get_voice_parser)
):
    """Get current session summary for a user."""
    try:
        summary = parser.get_session_summary(user_id)
        return SessionSummaryResponse(**summary)
    except Exception as e:
        print(f"Error getting session summary: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get session summary: {str(e)}"
        )


@app.post("/api/session/{user_id}/end", response_model=EndSessionResponse)
async def end_session(
    user_id: str, parser: IntegratedVoiceParser = Depends(get_voice_parser)
):
    """End the current workout session for a user."""
    try:
        final_summary = parser.end_session(user_id)

        if "error" in final_summary:
            raise HTTPException(status_code=404, detail=final_summary["error"])

        return EndSessionResponse(**final_summary)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


# ============================================================================
# CHAT ENDPOINTS (UI Redesign)
# ============================================================================


@app.post("/api/chat/classify", response_model=ChatClassifyResponse)
async def classify_chat_message(
    request: ChatClassifyRequest,
    classifier: ChatClassifier = Depends(get_chat_classifier),
    user: dict = Depends(verify_token),
):
    """
    Classify a chat message to determine user intent.

    This endpoint is used by the unified chat interface to determine how to handle
    user messages:
    - workout_log: Parse with Llama and log to WatermelonDB
    - question: Route to AI Coach
    - onboarding: Continue onboarding flow
    - general: Acknowledge or provide general response

    Args:
        request: ChatClassifyRequest with message and user_id
        classifier: ChatClassifier service (injected)
        user: Authenticated user (injected)

    Returns:
        ChatClassifyResponse with message_type, confidence, reasoning, and suggested_action
    """
    try:
        # Classify the message
        message_type, confidence, reasoning, suggested_action = classifier.classify(
            message=request.message,
            user_id=request.user_id,
            conversation_history=request.conversation_history,
        )

        return ChatClassifyResponse(
            message_type=message_type,
            confidence=confidence,
            reasoning=reasoning,
            suggested_action=suggested_action,
        )

    except Exception as e:
        print(f"Error classifying chat message: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to classify message: {str(e)}"
        )


# ============================================================================
# ONBOARDING ENDPOINT (UI Redesign)
# ============================================================================


@app.post("/api/onboarding/extract", response_model=OnboardingExtractResponse)
async def extract_onboarding_data(
    request: OnboardingExtractRequest,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    user: dict = Depends(verify_token),
):
    """
    Extract structured onboarding data from conversational chat.

    Uses fine-tuned Llama 3.3 70B to extract:
    - Experience level (beginner, intermediate, advanced)
    - Training goals (strength, hypertrophy, endurance, etc.)
    - Available equipment (barbell, dumbbells, machines, etc.)
    - Training frequency (days per week)
    - Injury history (current injuries, past injuries)

    Args:
        request: OnboardingExtractRequest with message, current_step, and conversation_history
        onboarding_service: OnboardingService instance (injected)
        user: Authenticated user (injected)

    Returns:
        OnboardingExtractResponse with extracted data and next_step
    """
    try:
        # Extract data from message
        extracted_data = onboarding_service.extract_onboarding_data(
            message=request.message,
            current_step=request.current_step,
            conversation_history=request.conversation_history,
        )

        return OnboardingExtractResponse(**extracted_data)

    except Exception as e:
        print(f"Error extracting onboarding data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to extract onboarding data: {str(e)}"
        )


@app.post(
    "/api/onboarding/conversational", response_model=OnboardingConversationalResponse
)
async def generate_conversational_response(
    request: OnboardingConversationalRequest,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    user: dict = Depends(verify_token),
):
    """
    Generate personalized, conversational onboarding responses.

    Uses PersonalityEngine with Grok 4 Fast Reasoning to create natural,
    engaging conversations that adapt to the user's experience level.

    Features:
    - Acknowledges user's previous answer with specific details
    - Adapts tone based on experience level (beginner/intermediate/advanced)
    - References user's goals, injuries, and context
    - Feels like talking to a real coach, not filling out a form

    Args:
        request: OnboardingConversationalRequest with current_step, user_context, and previous_answer
        onboarding_service: OnboardingService instance (injected)
        user: Authenticated user (injected)

    Returns:
        OnboardingConversationalResponse with personalized message
    """
    try:
        # Generate conversational response
        message = onboarding_service.generate_conversational_response(
            current_step=request.current_step,
            user_context=request.user_context,
            previous_answer=request.previous_answer,
        )

        return OnboardingConversationalResponse(message=message)

    except Exception as e:
        print(f"Error generating conversational response: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate conversational response: {str(e)}",
        )


@app.post("/api/chat/swap-exercise", response_model=ExerciseSwapResponse)
async def swap_exercise_via_chat(
    request: ExerciseSwapRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Handle exercise swap request from chat interface.

    Returns top 3-5 exercise substitutes formatted for interactive chat display.
    Each substitute includes:
    - Exercise name and similarity score
    - Why it's recommended (scientific reasoning)
    - Reduced stress areas (if applicable)
    - Quick action data for one-tap selection

    Args:
        request: ExerciseSwapRequest with exercise_name and optional reason/injured_body_part
        supabase: Supabase client (injected)
        user: Authenticated user (injected)

    Returns:
        ExerciseSwapResponse with original_exercise, substitutes list, and swap instructions
    """
    try:
        exercise_name = request.exercise_name
        injured_body_part = request.injured_body_part
        reason = request.reason
        min_similarity = 0.70  # Higher threshold for chat recommendations
        max_results = 3 if not request.show_more else 5

        # Query exercise substitutions
        query = (
            supabase.table("exercise_substitutions")
            .select("*")
            .eq("exercise_name", exercise_name)
            .gte("similarity_score", min_similarity)
            .order("similarity_score", desc=True)
        )

        # If injured body part specified, filter by reduced stress
        if injured_body_part:
            query = query.eq("reduced_stress_area", injured_body_part)

        result = query.limit(max_results).execute()

        if not result.data:
            # No substitutes found - return empty response
            return ExerciseSwapResponse(
                original_exercise=exercise_name,
                substitutes=[],
                total_found=0,
                reason_for_swap=reason,
                message=f"I couldn't find substitutes for {exercise_name}. Let me suggest some alternatives based on the movement pattern.",
            )

        # Format substitutes for chat display
        substitutes = []
        for row in result.data:
            # Build "why recommended" text
            why_recommended = f"{int(row['similarity_score'] * 100)}% similar"
            if row.get("reduced_stress_area"):
                why_recommended += f" • Reduces {row['reduced_stress_area']} stress"
            if reason and "pain" in reason.lower():
                why_recommended += " • Better for recovery"

            # Build subtitle with key info
            subtitle = row.get("movement_pattern", "")
            if row.get("equipment_required"):
                subtitle += f" • {row['equipment_required']}"

            substitutes.append(
                {
                    "id": row["id"],
                    "substitute_name": row["substitute_name"],
                    "similarity_score": row["similarity_score"],
                    "why_recommended": why_recommended,
                    "subtitle": subtitle,
                    "movement_pattern": row.get("movement_pattern", ""),
                    "primary_muscles": row.get("primary_muscles", ""),
                    "equipment_required": row.get("equipment_required", ""),
                    "difficulty_level": row.get("difficulty_level", ""),
                    "reduced_stress_area": row.get("reduced_stress_area", ""),
                    "notes": row.get("notes", ""),
                }
            )

        # Build contextual message
        if injured_body_part:
            message = f"Here are {len(substitutes)} alternatives that reduce stress on your {injured_body_part}:"
        elif reason:
            message = f"Here are {len(substitutes)} alternatives to {exercise_name}:"
        else:
            message = (
                f"Here are {len(substitutes)} similar exercises to {exercise_name}:"
            )

        return ExerciseSwapResponse(
            original_exercise=exercise_name,
            substitutes=substitutes,
            total_found=len(result.data),
            reason_for_swap=reason,
            injured_body_part=injured_body_part,
            message=message,
            show_more_available=(len(result.data) > 3 and not request.show_more),
        )

    except Exception as e:
        print(f"Error handling exercise swap: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to get exercise substitutes: {str(e)}"
        )


@app.post("/api/chat/swap-exercise-enhanced", response_model=ExerciseSwapResponse)
async def swap_exercise_enhanced(
    request: ExerciseSwapRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Context-aware exercise swap with RAG fuzzy matching + AI re-ranking.

    This enhanced endpoint leverages:
    1. User context (equipment, program, injuries, session)
    2. RAG fuzzy matching (handles typos, synonyms)
    3. Database filtering (equipment, injury, difficulty)
    4. AI re-ranking (Grok 4 for personalization - premium feature)

    Feature flag controlled for gradual rollout.

    Args:
        request: ExerciseSwapRequest with exercise_name and optional filters
        supabase: Supabase client (injected)
        user: Authenticated user (injected)

    Returns:
        ExerciseSwapResponse with personalized substitutes and context metadata
    """
    try:
        user_id = user["id"]

        # Check if enhanced swap is enabled for this user
        feature_flags = get_feature_flags(supabase)

        # Get user context for premium check
        user_context = {"subscription_tier": user.get("subscription_tier", "free")}

        if not feature_flags.is_enabled(
            "enhanced_exercise_swap", user_id, user_context
        ):
            # Feature not enabled - route to legacy endpoint
            return await swap_exercise_via_chat(request, supabase, user)

        # Check if AI re-ranking is enabled
        ai_enabled = feature_flags.is_enabled("ai_reranking", user_id, user_context)

        # Get exercise swap service
        swap_service = get_exercise_swap_service(supabase)

        # Get context-aware substitutes
        result = await swap_service.get_context_aware_substitutes(
            user_id=user_id,
            exercise_name=request.exercise_name,
            injured_body_part=request.injured_body_part,
            reason=request.reason,
            include_ai_ranking=ai_enabled,  # Enable AI re-ranking if flag is on
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail="Failed to get substitutes")

        # Format response
        return ExerciseSwapResponse(
            original_exercise=result["original_exercise"],
            substitutes=result["substitutes"],
            total_found=result["total_found"],
            reason_for_swap=request.reason,
            injured_body_part=request.injured_body_part,
            message=result["message"],
            show_more_available=result["total_found"] > 3 and not request.show_more,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in enhanced exercise swap: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to get exercise substitutes: {str(e)}"
        )


# ============================================================================
# AI COACH ENDPOINT
# ============================================================================


@app.post("/api/coach/ask", response_model=CoachQuestionResponse)
async def coach_ask(
    request: CoachQuestionRequest,
    coach_service: AICoachService = Depends(get_ai_coach_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    AI Coach Q&A endpoint with RAG (Retrieval-Augmented Generation) and full user context.

    Features:
    - Full user context (training history, injuries, PRs, readiness, streaks, badges)
    - Smart namespace selection (classifies query to relevant knowledge areas)
    - Parallel Upstash Search (retrieves context from knowledge base)
    - Streaming Llama 3.3 70B responses (fine-tuned model)

    Performance:
    - Perceived latency: ~2 seconds (retrieval + time to first token)
    - Total latency: ~4 seconds (full response generation)

    Premium feature - requires Premium tier.
    """

    try:
        # Build comprehensive user context
        user_context = await context_builder.build_context(request.user_id)

        # Call AI Coach service with user context
        result = coach_service.ask(
            question=request.question,
            conversation_history=request.conversation_history,
            user_context=user_context,
        )

        return CoachQuestionResponse(
            answer=result["answer"],
            confidence=result["confidence"],
            sources=result["sources"],
            latency_ms=result["latency_ms"],
        )

    except Exception as e:
        print(f"Error in AI Coach: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get AI Coach response: {str(e)}"
        )


# ============================================================================
# PROGRAM GENERATION ENDPOINTS - Strength & Running
# ============================================================================


@app.post("/api/program/generate/strength", response_model=ProgramGenerationResponse)
async def generate_strength_program(
    request: ProgramGenerationRequest,
    program_service: ProgramGenerationService = Depends(get_program_generation_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    AI-powered custom STRENGTH program generation with RAG and full user context.

    Features:
    - Full user context (training history, injuries, PRs, readiness, preferences)
    - Phase 1 optimized Upstash Search (77% token reduction, 4.4x better diversity)
    - GPT-4.1 with improved prompting for high-quality programs
    - Evidence-based programming using knowledge base
    - Deduplication and similarity filtering
    - Intelligent periodization with deload weeks
    - Exercise variation and progression

    Performance:
    - Cost: ~$0.27 per program (vs $119 baseline)
    - Generation time: ~2 minutes for complete 12-week program
    - Quality: 6-8 exercises per workout, intelligent periodization

    Premium feature - requires Premium tier.
    """

    try:
        # Extract user_id from questionnaire
        user_id = request.questionnaire.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="user_id is required in questionnaire"
            )

        # Build comprehensive user context
        user_context = await context_builder.build_context(user_id)

        # Generate strength program with user context
        result = program_service.generate_program(request.questionnaire, user_context)

        return ProgramGenerationResponse(
            program=result["program"],
            cost=result["cost"],
            stats=result["stats"],
            generation_time_seconds=result["generation_time_seconds"],
        )

    except Exception as e:
        print(f"Error generating strength program: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate strength program: {str(e)}"
        )


@app.post("/api/program/generate/running", response_model=ProgramGenerationResponse)
async def generate_running_program(
    request: ProgramGenerationRequest,
    program_service: ProgramGenerationService = Depends(get_program_generation_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    AI-powered custom RUNNING program generation with RAG and full user context.

    Features:
    - Full user context (running history, PRs, readiness, preferences)
    - Phase 1 optimized Upstash Search for running knowledge
    - GPT-4.1 with running-specific prompting
    - Evidence-based running programming
    - Progressive mileage increases (10% rule)
    - Periodization with easy/hard weeks
    - Injury prevention focus

    Performance:
    - Cost: ~$0.27 per program
    - Generation time: ~2 minutes for complete 12-week program
    - Quality: Balanced easy/hard runs, proper recovery, race-specific training

    Premium feature - requires Premium tier.
    """

    try:
        # Extract user_id from questionnaire
        user_id = request.questionnaire.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="user_id is required in questionnaire"
            )

        # Build comprehensive user context
        user_context = await context_builder.build_context(user_id)

        # Modify questionnaire to indicate running program
        running_questionnaire = request.questionnaire.copy()
        running_questionnaire["program_type"] = "running"
        running_questionnaire["primary_goal"] = running_questionnaire.get(
            "primary_goal", "endurance"
        )

        # Generate running program with user context
        # Note: This uses the same service but with running-specific questionnaire
        # In the future, we can create a separate RunningProgramGenerationService
        result = program_service.generate_program(running_questionnaire, user_context)

        return ProgramGenerationResponse(
            program=result["program"],
            cost=result["cost"],
            stats=result["stats"],
            generation_time_seconds=result["generation_time_seconds"],
        )

    except Exception as e:
        print(f"Error generating running program: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate running program: {str(e)}"
        )


# Legacy endpoint - redirects to strength program generation
@app.post("/api/program/generate", response_model=ProgramGenerationResponse)
async def generate_program_legacy(
    request: ProgramGenerationRequest,
    program_service: ProgramGenerationService = Depends(get_program_generation_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    Legacy endpoint - redirects to strength program generation.
    Use /api/program/generate/strength or /api/program/generate/running instead.
    """
    # Default to strength program for backward compatibility
    return await generate_strength_program(
        request, program_service, context_builder, user
    )


# ============================================================================
# RUNNING ENDPOINTS - Weather & GAP Integration
# ============================================================================


@app.post("/api/running/parse", response_model=RunningParseResponse)
async def parse_running_workout(
    request: RunningParseRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Parse and log a running workout with weather and GAP calculation.

    Features:
    - Fetches weather data for run location/time
    - Calculates grade-adjusted pace (GAP) from elevation
    - Saves to runs table with complete data
    - Returns formatted confirmation with weather and GAP
    """
    try:
        # Calculate pace
        distance_km = (
            request.distance
            if request.distance_unit == "km"
            else request.distance * 1.60934
        )
        duration_minutes = request.duration_seconds / 60
        pace_min_per_km = duration_minutes / distance_km if distance_km > 0 else 0

        # Fetch weather data if location provided
        weather_data = None
        if request.latitude is not None and request.longitude is not None:
            try:
                weather_service = WeatherService()
                weather_data = weather_service.get_weather_for_run(
                    latitude=request.latitude,
                    longitude=request.longitude,
                    timestamp=None,  # Current time
                )
            except Exception as e:
                print(f"Weather fetch failed: {e}")
                # Continue without weather data

        # Calculate GAP if elevation data provided
        gap_data = None
        gap_value = None
        gap_formatted = None

        if request.elevation_gain > 0 or request.elevation_loss > 0:
            gap_data = GAPCalculator.calculate_gap(
                actual_pace=pace_min_per_km,
                elevation_gain=request.elevation_gain,
                elevation_loss=request.elevation_loss,
                distance=distance_km,
                pace_unit="min_per_km",
            )
            gap_value = gap_data["gap"]
            gap_formatted = GAPCalculator.format_pace(gap_value, "min_per_km")

        # Save to runs table
        run_data = {
            "user_id": request.user_id,
            "start_time": datetime.utcnow().isoformat(),
            "end_time": (
                datetime.utcnow() + timedelta(seconds=request.duration_seconds)
            ).isoformat(),
            "distance": distance_km,
            "duration": request.duration_seconds,
            "pace": pace_min_per_km,
            "avg_speed": (distance_km / (request.duration_seconds / 3600))
            if request.duration_seconds > 0
            else 0,
            "calories": int(distance_km * 100),  # Rough estimate
            "route": request.route,
            "weather_data": weather_data,
            "elevation_gain": request.elevation_gain,
            "elevation_loss": request.elevation_loss,
            "grade_adjusted_pace": gap_value,
            "notes": request.notes,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase.table("runs").insert(run_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save run")

        run_id = result.data[0]["id"]

        # Format pace
        pace_formatted = GAPCalculator.format_pace(pace_min_per_km, "min_per_km")

        # Build confirmation message
        distance_str = f"{request.distance} {request.distance_unit}"
        duration_str = (
            f"{request.duration_seconds // 60}:{request.duration_seconds % 60:02d}"
        )

        message = f"Run logged! {distance_str} in {duration_str} ({pace_formatted} pace"

        if gap_formatted:
            message += f", {gap_formatted} GAP"

        if weather_data:
            temp = weather_data.get("temperature_f", 0)
            conditions = weather_data.get("conditions", "")
            message += f"). {conditions}, {temp}°F."
        else:
            message += ")."

        return RunningParseResponse(
            success=True,
            run_id=run_id,
            pace=pace_min_per_km,
            pace_formatted=pace_formatted,
            gap=gap_value,
            gap_formatted=gap_formatted,
            weather_data=weather_data,
            elevation_data=gap_data,
            message=message,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing running workout: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to parse running workout: {str(e)}"
        )


@app.post("/api/running/analyze", response_model=RunningAnalyzeResponse)
async def analyze_running_workout(
    request: RunningAnalyzeRequest,
    supabase: Client = Depends(get_supabase_client),
    coach_service: AICoachService = Depends(get_ai_coach_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    Analyze a completed run with weather/elevation adjustments.

    Features:
    - Analyzes pace vs GAP (elevation impact)
    - Weather impact on performance
    - AI-powered insights and recommendations
    - Comparison to recent similar runs
    """
    try:
        # Fetch run from database
        run_result = (
            supabase.table("runs")
            .select("*")
            .eq("id", request.run_id)
            .single()
            .execute()
        )

        if not run_result.data:
            raise HTTPException(status_code=404, detail="Run not found")

        run_data = run_result.data

        # Build run summary
        run_summary = {
            "distance": run_data.get("distance", 0),
            "duration": run_data.get("duration", 0),
            "pace": run_data.get("pace", 0),
            "gap": run_data.get("grade_adjusted_pace"),
            "elevation_gain": run_data.get("elevation_gain", 0),
            "elevation_loss": run_data.get("elevation_loss", 0),
        }

        # Analyze weather impact
        weather_data = run_data.get("weather_data", {})
        weather_impact = {}

        if weather_data:
            weather_service = WeatherService()
            weather_impact = weather_service.analyze_weather_impact(weather_data)

        # Analyze elevation/GAP
        elevation_analysis = {}

        if (
            run_data.get("elevation_gain", 0) > 0
            or run_data.get("elevation_loss", 0) > 0
        ):
            elevation_analysis = GAPCalculator.calculate_gap_from_run_data(run_data)

        # Get user context for AI insights
        user_context = await context_builder.build_context(request.user_id)

        # Build AI prompt for performance insights
        prompt = f"""Analyze this running workout and provide performance insights:

Run Data:
- Distance: {run_summary["distance"]:.2f} km
- Duration: {run_summary["duration"] // 60}:{run_summary["duration"] % 60:02d}
- Pace: {GAPCalculator.format_pace(run_summary["pace"], "min_per_km")}
"""

        if run_summary.get("gap"):
            prompt += f"- Grade-Adjusted Pace: {GAPCalculator.format_pace(run_summary['gap'], 'min_per_km')}\n"
            prompt += f"- Elevation Gain: {run_summary['elevation_gain']:.0f}m\n"
            prompt += f"- Terrain: {elevation_analysis.get('difficulty', 'flat')}\n"

        if weather_data:
            prompt += f"\nWeather Conditions:\n"
            prompt += f"- Temperature: {weather_data.get('temperature_f', 0):.0f}°F\n"
            prompt += f"- Humidity: {weather_data.get('humidity', 0)}%\n"
            prompt += f"- Conditions: {weather_data.get('conditions', 'Clear')}\n"

            if weather_impact:
                prompt += f"- Estimated pace impact: {weather_impact.get('estimated_pace_slowdown_percent', 0):.1f}%\n"

        prompt += "\nProvide brief insights on:\n1. Performance quality\n2. Weather/elevation impact\n3. Training recommendations"

        # Get AI insights
        ai_result = coach_service.ask(
            question=prompt, conversation_history=None, user_context=user_context
        )

        performance_insights = ai_result.get("answer", "Great run!")

        # Build recommendations
        recommendations = []

        if weather_impact:
            recommendations.extend(weather_impact.get("recommendations", []))

        if elevation_analysis.get("difficulty") in [
            "steep_uphill",
            "very_steep_uphill",
        ]:
            recommendations.append("Excellent hill work - builds strength and power")

        # Fetch recent runs for comparison
        recent_runs_result = (
            supabase.table("runs")
            .select("*")
            .eq("user_id", request.user_id)
            .neq("id", request.run_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        comparison_to_recent_runs = None

        if recent_runs_result.data and len(recent_runs_result.data) > 0:
            recent_runs = recent_runs_result.data
            avg_pace = sum(r.get("pace", 0) for r in recent_runs) / len(recent_runs)
            avg_gap = sum(
                r.get("grade_adjusted_pace", 0)
                for r in recent_runs
                if r.get("grade_adjusted_pace")
            ) / max(1, len([r for r in recent_runs if r.get("grade_adjusted_pace")]))

            comparison_to_recent_runs = {
                "recent_runs_count": len(recent_runs),
                "avg_pace_recent": avg_pace,
                "avg_gap_recent": avg_gap,
                "pace_vs_avg": run_summary["pace"] - avg_pace,
                "gap_vs_avg": (run_summary.get("gap", 0) - avg_gap)
                if run_summary.get("gap")
                else None,
            }

        return RunningAnalyzeResponse(
            run_summary=run_summary,
            weather_impact=weather_impact,
            elevation_analysis=elevation_analysis,
            performance_insights=performance_insights,
            recommendations=recommendations,
            comparison_to_recent_runs=comparison_to_recent_runs,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze run: {str(e)}")


# ============================================================================
# WORKOUT INSIGHTS ENDPOINT - Post-Workout Analysis
# ============================================================================


@app.post("/api/workout/insights", response_model=WorkoutInsightsResponse)
async def get_workout_insights(
    request: WorkoutInsightsRequest,
    supabase: Client = Depends(get_supabase_client),
    coach_service: AICoachService = Depends(get_ai_coach_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    Analyze a completed workout with AI-powered insights.

    Features:
    - Volume analysis by muscle group
    - Intensity and RPE trend analysis
    - Muscle group balance assessment
    - Fatigue indicators and recovery recommendations
    - AI-powered insights and recommendations
    - Comparison to recent workouts
    """
    try:
        # Fetch workout from database
        workout_result = (
            supabase.table("workouts")
            .select("*")
            .eq("id", request.workout_id)
            .single()
            .execute()
        )

        if not workout_result.data:
            raise HTTPException(status_code=404, detail="Workout not found")

        workout_data = workout_result.data

        # Fetch workout exercises/sets
        sets_result = (
            supabase.table("workout_logs")
            .select("*, exercises(*)")
            .eq("workout_id", request.workout_id)
            .execute()
        )

        sets_data = sets_result.data if sets_result.data else []

        # Build workout summary
        total_sets = len(sets_data)
        unique_exercises = len(
            set(s["exercise_id"] for s in sets_data if s.get("exercise_id"))
        )

        # Calculate duration
        start_time = datetime.fromisoformat(
            workout_data["start_time"].replace("Z", "+00:00")
        )
        end_time = datetime.fromisoformat(
            workout_data["end_time"].replace("Z", "+00:00")
        )
        duration_minutes = int((end_time - start_time).total_seconds() / 60)

        # Calculate average RPE
        rpe_values = [s["rpe"] for s in sets_data if s.get("rpe")]
        avg_rpe = sum(rpe_values) / len(rpe_values) if rpe_values else 0

        workout_summary = {
            "total_sets": total_sets,
            "total_exercises": unique_exercises,
            "duration_minutes": duration_minutes,
            "avg_rpe": round(avg_rpe, 1),
        }

        # Volume analysis by muscle group
        volume_by_muscle = {}
        for set_data in sets_data:
            exercise = set_data.get("exercises")
            if not exercise:
                continue

            primary_muscle = exercise.get("primary_muscle_group", "unknown")

            if primary_muscle not in volume_by_muscle:
                volume_by_muscle[primary_muscle] = {"sets": 0, "total_reps": 0}

            volume_by_muscle[primary_muscle]["sets"] += 1
            volume_by_muscle[primary_muscle]["total_reps"] += set_data.get("reps", 0)

        # Intensity analysis
        high_intensity_sets = len([s for s in sets_data if s.get("rpe", 0) >= 8])
        working_sets = len([s for s in sets_data if s.get("rpe", 0) >= 6])
        warmup_sets = total_sets - working_sets

        intensity_analysis = {
            "avg_rpe": round(avg_rpe, 1),
            "high_intensity_sets": high_intensity_sets,
            "working_sets": working_sets,
            "warmup_sets": warmup_sets,
        }

        # Muscle group balance
        push_muscles = ["chest", "shoulders", "triceps"]
        pull_muscles = ["back", "biceps"]

        push_sets = sum(
            volume_by_muscle.get(m, {}).get("sets", 0) for m in push_muscles
        )
        pull_sets = sum(
            volume_by_muscle.get(m, {}).get("sets", 0) for m in pull_muscles
        )

        push_pull_ratio = push_sets / pull_sets if pull_sets > 0 else 0
        balanced = 0.7 <= push_pull_ratio <= 1.3

        muscle_group_balance = {
            "push_pull_ratio": round(push_pull_ratio, 2),
            "push_sets": push_sets,
            "pull_sets": pull_sets,
            "balanced": balanced,
        }

        # Fatigue indicators
        high_rpe_percentage = (
            (high_intensity_sets / total_sets * 100) if total_sets > 0 else 0
        )

        if high_rpe_percentage > 50:
            fatigue_level = "high"
            recovery_rec = "48-72 hours"
        elif high_rpe_percentage > 30:
            fatigue_level = "moderate"
            recovery_rec = "24-48 hours"
        else:
            fatigue_level = "low"
            recovery_rec = "24 hours"

        fatigue_indicators = {
            "high_rpe_percentage": round(high_rpe_percentage, 0),
            "estimated_fatigue_level": fatigue_level,
            "recovery_recommendation": recovery_rec,
        }

        # Get user context for AI insights
        user_context = await context_builder.build_context(request.user_id)

        # Build AI prompt for performance insights
        prompt = f"""Analyze this strength training workout and provide performance insights:

Workout Summary:
- Total Sets: {total_sets}
- Exercises: {unique_exercises}
- Duration: {duration_minutes} minutes
- Average RPE: {avg_rpe:.1f}

Volume by Muscle Group:
"""

        for muscle, data in volume_by_muscle.items():
            prompt += f"- {muscle.title()}: {data['sets']} sets, {data['total_reps']} total reps\n"

        prompt += f"""
Intensity Analysis:
- High Intensity Sets (RPE 8+): {high_intensity_sets}
- Working Sets (RPE 6+): {working_sets}
- Warmup Sets: {warmup_sets}

Muscle Group Balance:
- Push/Pull Ratio: {push_pull_ratio:.2f} ({"Balanced" if balanced else "Imbalanced"})
- Push Sets: {push_sets}
- Pull Sets: {pull_sets}

Fatigue Level: {fatigue_level}

Provide brief insights on:
1. Workout quality and effectiveness
2. Volume and intensity appropriateness
3. Muscle group balance
4. Recovery recommendations
"""

        # Get AI insights
        ai_result = coach_service.ask(
            question=prompt, conversation_history=None, user_context=user_context
        )

        performance_insights = ai_result.get("answer", "Great workout!")

        # Build recommendations
        recommendations = []

        if not balanced:
            if push_pull_ratio > 1.3:
                recommendations.append(
                    "Consider adding more pulling exercises to balance push/pull ratio"
                )
            else:
                recommendations.append(
                    "Consider adding more pushing exercises to balance push/pull ratio"
                )

        if high_rpe_percentage > 50:
            recommendations.append(
                "High intensity session - ensure adequate recovery before next workout"
            )

        if duration_minutes > 90:
            recommendations.append(
                "Long workout duration - consider splitting into two sessions for better recovery"
            )

        # Fetch recent workouts for comparison
        recent_workouts_result = (
            supabase.table("workouts")
            .select("id, start_time, end_time")
            .eq("user_id", request.user_id)
            .neq("id", request.workout_id)
            .order("start_time", desc=True)
            .limit(5)
            .execute()
        )

        comparison_to_recent_workouts = None

        if recent_workouts_result.data and len(recent_workouts_result.data) > 0:
            recent_workouts = recent_workouts_result.data

            # Calculate average sets from recent workouts
            total_recent_sets = 0
            for rw in recent_workouts:
                rw_sets = (
                    supabase.table("workout_logs")
                    .select("id", count="exact")
                    .eq("workout_id", rw["id"])
                    .execute()
                )
                total_recent_sets += rw_sets.count if rw_sets.count else 0

            avg_recent_sets = (
                total_recent_sets / len(recent_workouts) if recent_workouts else 0
            )

            comparison_to_recent_workouts = {
                "recent_workouts_count": len(recent_workouts),
                "avg_sets_recent": round(avg_recent_sets, 1),
                "sets_vs_avg": total_sets - avg_recent_sets,
            }

        return WorkoutInsightsResponse(
            workout_summary=workout_summary,
            volume_analysis=volume_by_muscle,
            intensity_analysis=intensity_analysis,
            muscle_group_balance=muscle_group_balance,
            fatigue_indicators=fatigue_indicators,
            performance_insights=performance_insights,
            recommendations=recommendations,
            comparison_to_recent_workouts=comparison_to_recent_workouts,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing workout: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze workout: {str(e)}"
        )


# ============================================================================
# ANALYTICS ENDPOINTS - Volume, Fatigue, Deload
# ============================================================================


@app.get("/api/analytics/volume/{user_id}", response_model=VolumeAnalyticsResponse)
async def get_volume_analytics(
    user_id: str,
    volume_service: VolumeTrackingService = Depends(get_volume_tracking_service),
    user: dict = Depends(verify_token),
):
    """
    Get volume analytics for a user.

    Returns:
    - Weekly volume by muscle group
    - Monthly volume by muscle group
    - Volume trend over 4 weeks

    Premium feature.
    """
    try:
        # Get weekly volume
        weekly_volume = volume_service.get_weekly_volume(user_id)

        # Get monthly volume
        monthly_volume = volume_service.get_monthly_volume(user_id)

        # Get volume trend
        volume_trend = volume_service.get_volume_trend(user_id, weeks=4)

        return VolumeAnalyticsResponse(
            weekly_volume=weekly_volume,
            monthly_volume=monthly_volume,
            volume_trend=volume_trend,
        )

    except Exception as e:
        print(f"Error getting volume analytics: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get volume analytics: {str(e)}"
        )


@app.get("/api/analytics/fatigue/{user_id}", response_model=FatigueAnalyticsResponse)
async def get_fatigue_analytics(
    user_id: str,
    fatigue_service: FatigueMonitoringService = Depends(get_fatigue_monitoring_service),
    user: dict = Depends(verify_token),
):
    """
    Get fatigue analytics for a user.

    Returns:
    - Current fatigue assessment
    - Fatigue history over 4 weeks
    - Recovery recommendations

    Premium feature.
    """
    try:
        # Get current fatigue
        current_fatigue = fatigue_service.assess_fatigue(user_id, days=7)

        # Get fatigue history
        fatigue_history = fatigue_service.get_fatigue_history(user_id, weeks=4)

        return FatigueAnalyticsResponse(
            current_fatigue=current_fatigue, fatigue_history=fatigue_history
        )

    except Exception as e:
        print(f"Error getting fatigue analytics: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get fatigue analytics: {str(e)}"
        )


@app.get("/api/analytics/deload/{user_id}", response_model=DeloadRecommendationResponse)
async def get_deload_recommendation(
    user_id: str,
    program_id: Optional[str] = None,
    deload_service: DeloadRecommendationService = Depends(
        get_deload_recommendation_service
    ),
    user: dict = Depends(verify_token),
):
    """
    Get deload recommendation for a user.

    Checks for:
    - Programmed deloads (built into program, automatic)
    - Auto-regulation deloads (fatigue-based, requires approval)

    Returns recommendation with confidence level and specific instructions.

    Premium feature.
    """
    try:
        recommendation = deload_service.check_deload_needed(user_id, program_id)

        return DeloadRecommendationResponse(
            deload_needed=recommendation["deload_needed"],
            deload_type=recommendation.get("deload_type"),
            reason=recommendation["reason"],
            confidence=recommendation["confidence"],
            requires_approval=recommendation["requires_approval"],
            indicators=recommendation.get("indicators", {}),
            recommendation=recommendation.get("recommendation"),
        )

    except Exception as e:
        print(f"Error getting deload recommendation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get deload recommendation: {str(e)}"
        )


# ============================================================================
# INJURY LOGGING ENDPOINTS
# ============================================================================


@app.post("/api/injury/confidence-feedback")
async def record_injury_confidence_feedback(
    request: dict,
    user: dict = Depends(verify_token),
):
    """
    Record feedback on injury prediction accuracy for confidence calibration.

    This endpoint allows users or the system to report whether an injury prediction
    was accurate, helping to calibrate future confidence scores.

    Request body:
    {
        "predicted_confidence": 0.85,
        "was_accurate": true,
        "injury_id": "optional-injury-id",
        "notes": "optional feedback notes"
    }
    """
    try:
        from injury_detection_rag_service import record_confidence_feedback

        predicted_confidence = request.get("predicted_confidence")
        was_accurate = request.get("was_accurate")

        if predicted_confidence is None or was_accurate is None:
            raise HTTPException(
                status_code=400,
                detail="predicted_confidence and was_accurate are required",
            )

        # Record the feedback and get calibrated score
        calibrated_confidence = record_confidence_feedback(
            predicted_confidence=float(predicted_confidence),
            was_accurate=bool(was_accurate),
        )

        return {
            "success": True,
            "message": "Confidence feedback recorded",
            "calibrated_confidence": calibrated_confidence,
            "feedback_recorded": {
                "predicted": predicted_confidence,
                "accurate": was_accurate,
            },
        }

    except Exception as e:
        print(f"Error recording confidence feedback: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record confidence feedback: {str(e)}",
        )


@app.post("/api/injury/analyze", response_model=InjuryAnalyzeResponse)
async def analyze_injury(
    request: InjuryAnalyzeRequest,
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    AI-powered injury analysis with RAG (Premium tier only).

    Uses Grok 4 Fast Reasoning + Upstash Search to analyze user notes and detect potential injuries.
    RAG retrieves relevant research from injury knowledge base for evidence-based analysis.

    Enhanced features:
    - Injury history tracking for better context
    - Training load data integration for overtraining detection
    - Multi-injury detection (multiple injuries in one note)
    - Sports-specific injury analysis
    - Confidence calibration based on historical accuracy
    - Follow-up question generation for ambiguous cases

    Premium feature - requires tier validation.
    """

    # Validate Premium tier
    if request.user_tier.lower() != "premium":
        raise HTTPException(
            status_code=403,
            detail="AI injury analysis is a Premium feature. Upgrade to access this functionality.",
        )

    try:
        # Build comprehensive user context
        user_context_str = await context_builder.build_context(request.user_id)

        # Build user context dict for RAG service with recent exercises for sport detection
        user_context_dict = {
            "experience_level": request.training_context
            if request.training_context
            else "unknown",
            "recent_exercises": request.recent_exercises
            if request.recent_exercises
            else [],
            "recent_workouts": request.recent_exercises
            if request.recent_exercises
            else "N/A",
            "previous_injuries": "Check user history",
            "recovery_week": None,
            "pain_level": None,
        }

        # Initialize RAG service with Supabase client for injury history and training load
        injury_service = get_injury_detection_service(supabase)

        # Analyze injury with RAG (Grok + Upstash) + enhanced features
        # This now includes: injury history, training load, multi-injury detection,
        # sport-specific namespaces, and follow-up questions
        analysis_result, metadata = await injury_service.analyze_injury(
            notes=request.user_notes,
            user_id=request.user_id,
            user_context=user_context_dict,
        )

        # Check if multiple injuries were detected
        if metadata.get("multiple_injuries_detected", False):
            # Handle multiple injuries - return first one with a note
            injuries_list = analysis_result.get("injuries", [])
            if injuries_list:
                primary_injury = injuries_list[0]
                analysis_json = {
                    "injury_detected": primary_injury.get("injury_detected", False),
                    "confidence": primary_injury.get("confidence", 0.0),
                    "body_part": primary_injury.get("body_part"),
                    "severity": primary_injury.get("severity"),
                    "injury_type": primary_injury.get("injury_type"),
                    "description": primary_injury.get("description", "")
                    + f"\n\nNote: {len(injuries_list)} distinct injuries detected. Showing primary injury.",
                    "red_flags": primary_injury.get("red_flags", []),
                    "recommendations": primary_injury.get("recommendations", []),
                    "requires_medical_attention": primary_injury.get(
                        "should_see_doctor", False
                    ),
                    "differential_diagnoses": [],
                    "follow_up_questions": primary_injury.get(
                        "follow_up_questions", []
                    ),
                    "metadata": {
                        **metadata,
                        "all_injuries": injuries_list,
                    },
                }
            else:
                # Fallback if no injuries in list
                analysis_json = {
                    "injury_detected": False,
                    "confidence": 0.0,
                    "body_part": None,
                    "severity": None,
                    "injury_type": None,
                    "description": "Error processing multiple injuries",
                    "red_flags": [],
                    "recommendations": [],
                    "requires_medical_attention": False,
                    "differential_diagnoses": [],
                    "follow_up_questions": [],
                    "metadata": metadata,
                }
        else:
            # Single injury - standard response
            analysis_json = {
                "injury_detected": analysis_result.get("injury_detected", False),
                "confidence": analysis_result.get("confidence", 0.0),
                "body_part": analysis_result.get("body_part"),
                "severity": analysis_result.get("severity"),
                "injury_type": analysis_result.get("injury_type"),
                "description": analysis_result.get("description", ""),
                "red_flags": analysis_result.get("red_flags", []),
                "recommendations": analysis_result.get("recommendations", []),
                "requires_medical_attention": analysis_result.get(
                    "should_see_doctor", False
                ),
                "differential_diagnoses": [],
                "follow_up_questions": analysis_result.get("follow_up_questions", []),
                "metadata": {
                    **metadata,
                    "related_to_previous_injury": analysis_result.get(
                        "related_to_previous_injury", False
                    ),
                    "overtraining_indicator": analysis_result.get(
                        "overtraining_indicator", False
                    ),
                },
            }

        return InjuryAnalyzeResponse(**analysis_json)

    except Exception as e:
        print(f"Error analyzing injury: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze injury: {str(e)}"
        )


@app.post("/api/injury/log", response_model=InjuryLogResponse)
async def log_injury(
    request: InjuryLogRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
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
            "updated_at": now,
        }

        result = supabase.table("injury_logs").insert(injury_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create injury log")

        injury_log = result.data[0]

        return InjuryLogResponse(
            id=injury_log["id"],
            user_id=injury_log["user_id"],
            body_part=injury_log["body_part"],
            severity=injury_log["severity"],
            description=injury_log.get("description"),
            status=injury_log["status"],
            reported_at=injury_log["reported_at"],
            resolved_at=injury_log.get("resolved_at"),
            last_check_in_at=injury_log.get("last_check_in_at"),
            created_at=injury_log["created_at"],
            updated_at=injury_log["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error logging injury: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log injury: {str(e)}")


@app.get("/api/injury/active/{user_id}", response_model=ActiveInjuryResponse)
async def get_active_injuries(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get all active (unresolved) injuries for a user.

    Returns injuries with status 'active' or 'recovering', sorted by reported date.
    Also identifies injuries that need weekly check-in (7+ days since last check-in).
    """

    try:
        # Query active injuries from Supabase
        result = (
            supabase.table("injury_logs")
            .select("*")
            .eq("user_id", user_id)
            .in_("status", ["active", "recovering"])
            .order("reported_at", desc=True)
            .execute()
        )

        injuries = []
        needs_check_in = []

        for injury_data in result.data:
            injury = InjuryLogResponse(
                id=injury_data["id"],
                user_id=injury_data["user_id"],
                body_part=injury_data["body_part"],
                severity=injury_data["severity"],
                description=injury_data.get("description"),
                status=injury_data["status"],
                reported_at=injury_data["reported_at"],
                resolved_at=injury_data.get("resolved_at"),
                last_check_in_at=injury_data.get("last_check_in_at"),
                created_at=injury_data["created_at"],
                updated_at=injury_data["updated_at"],
            )
            injuries.append(injury)

            # Check if needs weekly check-in (7+ days)
            last_check_in = (
                injury_data.get("last_check_in_at") or injury_data["reported_at"]
            )
            # Handle timestamps with varying microsecond precision
            last_check_in_str = last_check_in.replace("Z", "+00:00")
            # Pad microseconds to 6 digits if needed
            if "+" in last_check_in_str and "." in last_check_in_str:
                parts = last_check_in_str.split(".")
                microseconds = parts[1].split("+")[0]
                if len(microseconds) < 6:
                    microseconds = microseconds.ljust(6, "0")
                    last_check_in_str = (
                        f"{parts[0]}.{microseconds}+{parts[1].split('+')[1]}"
                    )
            last_check_in_date = datetime.fromisoformat(last_check_in_str)
            now_aware = datetime.now(last_check_in_date.tzinfo)
            days_since_check_in = (now_aware - last_check_in_date).days

            if days_since_check_in >= 7:
                needs_check_in.append(injury_data["id"])

        return ActiveInjuryResponse(
            injuries=injuries, count=len(injuries), needs_check_in=needs_check_in
        )

    except Exception as e:
        print(f"Error getting active injuries: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get active injuries: {str(e)}"
        )


@app.post("/api/injury/{injury_id}/check-in", response_model=RecoveryCheckInResponse)
async def injury_check_in(
    injury_id: str,
    request: InjuryCheckInRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Process a weekly recovery check-in for an injury.

    Calculates recovery progress, updates injury status, and provides recommendations.
    Based on evidence-based recovery protocols from recovery_protocols.md.
    """

    try:
        # Get injury from Supabase
        try:
            injury_result = (
                supabase.table("injury_logs")
                .select("*")
                .eq("id", injury_id)
                .single()
                .execute()
            )

            if not injury_result.data:
                raise HTTPException(status_code=404, detail="Injury not found")

            injury_data = injury_result.data
        except Exception as e:
            # Supabase raises exception when no rows found with .single()
            if "0 rows" in str(e) or "PGRST116" in str(e):
                raise HTTPException(status_code=404, detail="Injury not found")
            raise

        # Calculate days in recovery
        reported_at = datetime.fromisoformat(
            injury_data["reported_at"].replace("Z", "+00:00")
        )
        now_aware = datetime.now(reported_at.tzinfo)
        days_in_recovery = (now_aware - reported_at).days

        # Calculate progress score (simplified version of RecoveryCheckInService logic)
        initial_pain = (
            9
            if injury_data["severity"] == "severe"
            else (7 if injury_data["severity"] == "moderate" else 5)
        )
        pain_reduction = max(0, (initial_pain - request.pain_level) / initial_pain)
        rom_improvement = (
            1.0
            if request.rom_quality == "better"
            else (0.5 if request.rom_quality == "same" else 0.0)
        )
        activity_tolerance = (
            1.0
            if request.activity_tolerance == "improving"
            else (0.5 if request.activity_tolerance == "plateau" else 0.0)
        )

        expected_recovery_days = (
            60
            if injury_data["severity"] == "severe"
            else (21 if injury_data["severity"] == "moderate" else 7)
        )
        time_progress = min(1.0, days_in_recovery / expected_recovery_days)

        progress_score = (
            pain_reduction * 0.4
            + rom_improvement * 0.3
            + activity_tolerance * 0.2
            + time_progress * 0.1
        )

        # Determine recovery status
        if (
            request.pain_level <= 1
            and request.rom_quality == "better"
            and request.activity_tolerance == "improving"
        ):
            status = "resolved"
        elif (
            request.rom_quality == "worse" or request.activity_tolerance == "declining"
        ):
            status = "worsening"
        elif progress_score < 0.3 and days_in_recovery >= 14:
            status = "plateau"
        else:
            status = "improving"

        # Check if medical attention required
        requires_medical_attention = (
            request.pain_level >= 8
            or status == "worsening"
            or (status == "plateau" and days_in_recovery >= 21)
            or (
                injury_data["severity"] == "severe"
                and days_in_recovery >= 14
                and status != "improving"
            )
            or (
                injury_data["severity"] == "moderate"
                and days_in_recovery >= 28
                and status != "improving"
            )
        )

        # Generate recommendation
        if requires_medical_attention:
            recommendation = "Your symptoms suggest you should consult a healthcare provider (physician, physical therapist, or sports medicine specialist) for proper evaluation."
        elif status == "resolved":
            recommendation = "Great progress! Your injury appears to be resolved. You can gradually return to full training. Monitor for any symptom recurrence."
        elif status == "improving":
            recommendation = "You're making good progress! Continue your current recovery approach and gradually increase activity as tolerated."
        elif status == "plateau":
            recommendation = "Your recovery has plateaued. Consider consulting a physical therapist for guidance on progression strategies."
        else:
            recommendation = "Your symptoms are worsening. Reduce activity level and consult a healthcare provider if symptoms don't improve within 48 hours."

        # Update injury in Supabase
        now = datetime.utcnow().isoformat()
        update_data = {"last_check_in_at": now, "updated_at": now}

        if status == "resolved":
            update_data["status"] = "resolved"
            update_data["resolved_at"] = now
        elif status == "improving":
            update_data["status"] = "recovering"

        updated_result = (
            supabase.table("injury_logs")
            .update(update_data)
            .eq("id", injury_id)
            .execute()
        )

        updated_injury_data = updated_result.data[0]

        updated_injury = InjuryLogResponse(
            id=updated_injury_data["id"],
            user_id=updated_injury_data["user_id"],
            body_part=updated_injury_data["body_part"],
            severity=updated_injury_data["severity"],
            description=updated_injury_data.get("description"),
            status=updated_injury_data["status"],
            reported_at=updated_injury_data["reported_at"],
            resolved_at=updated_injury_data.get("resolved_at"),
            last_check_in_at=updated_injury_data.get("last_check_in_at"),
            created_at=updated_injury_data["created_at"],
            updated_at=updated_injury_data["updated_at"],
        )

        return RecoveryCheckInResponse(
            progress_score=progress_score,
            status=status,
            recommendation=recommendation,
            requires_medical_attention=requires_medical_attention,
            days_in_recovery=days_in_recovery,
            updated_injury=updated_injury,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing check-in: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process check-in: {str(e)}"
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
    user: dict = Depends(verify_token),
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
        query = (
            supabase.table("exercise_substitutions")
            .select("*")
            .eq("exercise_name", exercise_name)
            .gte("similarity_score", min_similarity_score)
            .order("similarity_score", desc=True)
        )

        # Filter by injured body part (reduced stress area)
        if injured_body_part and injured_body_part != "none":
            query = query.eq("reduced_stress_area", injured_body_part)

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
                    "injured_body_part": injured_body_part,
                    "min_similarity": min_similarity_score,
                },
            )

        # Convert to ExerciseSubstitution models
        substitutes = [
            ExerciseSubstitution(
                id=row["id"],
                exercise_name=row["exercise_name"],
                substitute_name=row["substitute_name"],
                similarity_score=row["similarity_score"],
                reduced_stress_area=row["reduced_stress_area"],
                movement_pattern=row["movement_pattern"],
                primary_muscles=row["primary_muscles"],
                equipment_required=row["equipment_required"],
                difficulty_level=row["difficulty_level"],
                notes=row["notes"],
            )
            for row in result.data
        ]

        return ExerciseSubstitutionResponse(
            original_exercise=exercise_name,
            substitutes=substitutes,
            total_found=len(substitutes),
            filters_applied={
                "injured_body_part": injured_body_part,
                "min_similarity": min_similarity_score,
            },
        )

    except Exception as e:
        print(f"Error fetching exercise substitutes: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch exercise substitutes: {str(e)}"
        )


@app.get(
    "/api/exercises/substitutes/risk-aware", response_model=ExerciseSubstitutionResponse
)
async def get_risk_aware_substitutes(
    exercise_name: str,
    injured_body_part: str,
    min_similarity_score: Optional[float] = 0.60,
    max_results: Optional[int] = 5,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
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
        subs_result = (
            supabase.table("exercise_substitutions")
            .select("*")
            .eq("exercise_name", exercise_name)
            .gte("similarity_score", min_similarity_score)
            .order("similarity_score", desc=True)
            .execute()
        )

        if not subs_result.data:
            return ExerciseSubstitutionResponse(
                original_exercise=exercise_name,
                substitutes=[],
                total_found=0,
                filters_applied={
                    "injured_body_part": injured_body_part,
                    "min_similarity": min_similarity_score,
                    "risk_aware": True,
                },
            )

        # Step 2: Get stress data for all substitute exercises
        substitute_names = [row["substitute_name"] for row in subs_result.data]
        stress_result = (
            supabase.table("exercise_body_part_stress")
            .select("exercise_name, stress_intensity")
            .in_("exercise_name", substitute_names)
            .eq("body_part", injured_body_part)
            .execute()
        )

        # Step 3: Build stress intensity map
        stress_map = {}
        if stress_result.data:
            for row in stress_result.data:
                stress_map[row["exercise_name"]] = row["stress_intensity"]

        # Step 4: Enrich substitutions with stress data
        enriched_subs = []
        for row in subs_result.data:
            sub = ExerciseSubstitution(
                id=row["id"],
                exercise_name=row["exercise_name"],
                substitute_name=row["substitute_name"],
                similarity_score=row["similarity_score"],
                reduced_stress_area=row["reduced_stress_area"],
                movement_pattern=row["movement_pattern"],
                primary_muscles=row["primary_muscles"],
                equipment_required=row["equipment_required"],
                difficulty_level=row["difficulty_level"],
                notes=row["notes"],
            )
            stress_on_injured_part = stress_map.get(row["substitute_name"])
            enriched_subs.append(
                {**sub.dict(), "stress_on_injured_part": stress_on_injured_part}
            )

        # Step 5: Sort by stress (lowest first), then similarity (highest first)
        def sort_key(item):
            stress = item["stress_on_injured_part"]
            similarity = item["similarity_score"]

            # Prioritize exercises with no stress data (likely safer)
            if stress is None:
                return (
                    0,
                    -similarity,
                )  # 0 = highest priority, negative similarity for descending
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
                "injured_body_part": injured_body_part,
                "min_similarity": min_similarity_score,
                "risk_aware": True,
            },
        )

    except Exception as e:
        print(f"Error fetching risk-aware substitutes: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch risk-aware substitutes: {str(e)}"
        )


@app.get(
    "/api/exercises/substitutes/explain", response_model=ExerciseExplanationResponse
)
async def get_exercise_explanation(
    exercise_name: str,
    substitute_name: str,
    injured_body_part: Optional[str] = None,
    injury_type: Optional[str] = None,
    recovery_week: Optional[int] = None,
    pain_level: Optional[int] = None,
    experience_level: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
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
        result = (
            supabase.table("exercise_substitutions")
            .select("*")
            .eq("exercise_name", exercise_name)
            .eq("substitute_name", substitute_name)
            .limit(1)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No substitution found for {exercise_name} → {substitute_name}",
            )

        sub_data = result.data[0]

        # Format explanation using helper functions
        context = {
            "injured_body_part": injured_body_part,
            "injury_type": injury_type,
            "recovery_week": recovery_week,
            "pain_level": pain_level,
            "experience_level": experience_level,
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
            similarity_score=sub_data["similarity_score"],
            reduced_stress_area=sub_data["reduced_stress_area"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating explanation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate explanation: {str(e)}"
        )


def format_explanation_sections(sub_data: dict, context: dict) -> dict:
    """Format explanation sections from database data"""
    sections = {}

    # 1. Why Recommended
    why_text = f"**Why {sub_data['substitute_name']} is recommended:**\n\n"

    if context.get("injured_body_part") and sub_data["reduced_stress_area"] != "none":
        body_part_name = format_body_part_name(context["injured_body_part"])
        why_text += f"✅ **Reduces {body_part_name} Stress**\n"
        why_text += f"This exercise is specifically designed to reduce stress on your {body_part_name.lower()}, making it ideal for your recovery.\n\n"

    why_text += f"🎯 **Similar Movement Pattern**\n"
    why_text += f'Maintains the same "{format_movement_pattern(sub_data["movement_pattern"])}" pattern as {sub_data["exercise_name"]}, '
    why_text += f"so you won't lose the training stimulus.\n\n"

    muscles = format_muscle_list(sub_data["primary_muscles"])
    why_text += f"💪 **Targets Same Muscles**\n"
    why_text += f"Works: {muscles}\n"

    sections["why_recommended"] = why_text

    # 2. Scientific Evidence
    sci_text = "**📊 Scientific Evidence:**\n\n"
    notes = sub_data.get("notes", "No additional scientific notes available.")
    note_parts = [part.strip() for part in notes.split(";") if part.strip()]

    if note_parts:
        for note in note_parts:
            sci_text += f"• {note}\n"
    else:
        sci_text += notes + "\n"

    sections["scientific_evidence"] = sci_text

    # 3. Similarity Score
    score = sub_data["similarity_score"]
    percentage = round(score * 100)

    if score >= 0.85:
        rating = "Excellent"
        description = (
            "This is a highly similar exercise - you won't lose any training gains!"
        )
    elif score >= 0.75:
        rating = "Very Good"
        description = "This is a very similar exercise with minimal differences."
    elif score >= 0.65:
        rating = "Good"
        description = (
            "This is a good alternative that maintains most of the training stimulus."
        )
    else:
        rating = "Moderate"
        description = (
            "This alternative has some differences but still provides similar benefits."
        )

    sim_text = f"**⭐ Similarity Score: {percentage}% ({rating})**\n\n"
    sim_text += description + "\n"

    sections["similarity_score"] = sim_text

    # 4. How to Use
    how_text = "**🎯 How to Use:**\n\n"
    how_text += f"**Equipment:** {format_equipment(sub_data['equipment_required'])}\n"
    how_text += f"**Difficulty:** {format_difficulty(sub_data['difficulty_level'])}\n\n"

    if context.get("experience_level"):
        how_text += get_experience_guidance(context["experience_level"]) + "\n\n"

    how_text += "**Execution Tips:**\n"
    how_text += "• Focus on controlled movement throughout the full range of motion\n"
    how_text += "• Maintain proper form over heavy weight\n"
    how_text += "• Start with lighter weight to learn the movement pattern\n"

    sections["how_to_use"] = how_text

    # 5. Recovery Context (if applicable)
    if context.get("injured_body_part"):
        body_part_name = format_body_part_name(context["injured_body_part"])
        rec_text = f"**⚠️ For Your {body_part_name} Recovery:**\n\n"

        if context.get("recovery_week") is not None:
            rec_text += (
                get_recovery_week_guidance(
                    context["recovery_week"], context.get("pain_level")
                )
                + "\n\n"
            )

        if context.get("pain_level") is not None:
            rec_text += get_pain_level_guidance(context["pain_level"]) + "\n\n"

        rec_text += "**⚠️ Stop Immediately If You Feel:**\n"
        rec_text += "• Sharp pain (vs dull muscle fatigue)\n"
        rec_text += f"• Clicking or popping in the {body_part_name.lower()}\n"
        rec_text += "• Pain that persists after the set\n"
        rec_text += "• Numbness or tingling\n"

        sections["recovery_context"] = rec_text

    return sections


def combine_explanation_sections(sections: dict) -> str:
    """Combine all sections into full explanation"""
    explanation = ""

    explanation += sections["why_recommended"] + "\n\n"
    explanation += sections["scientific_evidence"] + "\n\n"
    explanation += sections["similarity_score"] + "\n\n"
    explanation += sections["how_to_use"]

    if "recovery_context" in sections:
        explanation += "\n\n" + sections["recovery_context"]

    return explanation


def format_body_part_name(body_part: str) -> str:
    """Format body part name for display"""
    names = {
        "shoulder": "Shoulder",
        "lower_back": "Lower Back",
        "knee": "Knee",
        "elbow": "Elbow",
        "hip": "Hip",
        "ankle": "Ankle",
        "wrist": "Wrist",
        "core": "Core",
        "hamstrings": "Hamstrings",
    }
    return names.get(body_part, body_part)


def format_movement_pattern(pattern: str) -> str:
    """Format movement pattern for display"""
    patterns = {
        "horizontal_push": "Horizontal Push",
        "vertical_push": "Vertical Push",
        "horizontal_pull": "Horizontal Pull",
        "vertical_pull": "Vertical Pull",
        "squat": "Squat",
        "hinge": "Hip Hinge",
        "lunge": "Lunge",
        "carry": "Loaded Carry",
        "rotation": "Rotation",
    }
    return patterns.get(pattern, pattern)


def format_muscle_list(muscles: str) -> str:
    """Format muscle list for display"""
    return ", ".join([m.strip().replace("_", " ").title() for m in muscles.split(",")])


def format_equipment(equipment: str) -> str:
    """Format equipment name for display"""
    equipment_names = {
        "barbell": "Barbell",
        "dumbbell": "Dumbbells",
        "bodyweight": "Bodyweight (no equipment)",
        "machine": "Machine",
        "cable": "Cable Machine",
        "kettlebell": "Kettlebell",
        "resistance_band": "Resistance Bands",
    }
    return equipment_names.get(equipment, equipment)


def format_difficulty(difficulty: str) -> str:
    """Format difficulty level for display"""
    levels = {
        "beginner": "Beginner-friendly",
        "intermediate": "Intermediate",
        "intermediate-advanced": "Intermediate to Advanced",
        "advanced": "Advanced",
    }
    return levels.get(difficulty, difficulty)


def get_experience_guidance(experience_level: str) -> str:
    """Get experience-specific guidance"""
    if experience_level == "beginner":
        return "**For Beginners:** Take extra time to learn proper form. Consider working with a trainer for the first few sessions."
    elif experience_level == "intermediate":
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
        content={"detail": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500, content={"detail": "Internal server error", "error": str(exc)}
    )


# ============================================================================
# EXERCISE CREATION & MATCHING ENDPOINTS
# ============================================================================


@app.post(
    "/api/exercises/create-or-match", response_model=ExerciseCreateOrMatchResponse
)
async def create_or_match_exercise(
    request: ExerciseCreateOrMatchRequest,
    matching_service: ExerciseMatchingService = Depends(get_exercise_matching_service),
    user: dict = Depends(verify_token),
):
    """
    Smart exercise creation and matching with synonym checking.

    Features:
    - Exact match checking against existing exercises
    - Fuzzy matching with configurable threshold
    - Automatic synonym generation (rule-based or LLM-powered)
    - Auto-creation of new exercises if no match found
    - Full metadata extraction (movement pattern, equipment, etc.)

    Args:
        request: Exercise creation/matching request with exercise name and options

    Returns:
        Detailed match information or newly created exercise details
    """
    try:
        result = matching_service.match_or_create_with_details(
            exercise_name=request.exercise_name,
            auto_create=request.auto_create,
            use_llm_synonyms=request.use_llm_synonyms,
            fuzzy_threshold=request.fuzzy_threshold,
        )

        return ExerciseCreateOrMatchResponse(**result)

    except Exception as e:
        print(f"❌ Error in exercise create/match: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to match or create exercise: {str(e)}"
        )


# ============================================================================
# BADGE ENDPOINTS
# ============================================================================


@app.post("/api/badges/unlock", response_model=BadgeUnlockResponse)
async def unlock_badge(
    request: BadgeUnlockRequest,
    badge_service: BadgeService = Depends(get_badge_service),
    user: dict = Depends(verify_token),
):
    """
    Unlock a badge for a user
    """
    try:
        result = await badge_service.unlock_badge(
            user_id=request.user_id,
            badge_id=request.badge_id,
        )
        return result
    except Exception as e:
        print(f"❌ Error unlocking badge: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unlock badge: {str(e)}")


@app.get("/api/badges/{user_id}")
async def get_user_badges(
    user_id: str,
    badge_service: BadgeService = Depends(get_badge_service),
    user: dict = Depends(verify_token),
):
    """
    Get all badges earned by a user

    Returns:
    - List of earned badges with metadata
    - Sorted by most recently earned first
    """
    try:
        badges = await badge_service.get_user_badges(user_id)

        return {"user_id": user_id, "total_badges": len(badges), "badges": badges}

    except Exception as e:
        print(f"Error fetching badges: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")


@app.get("/api/badges/{user_id}/progress")
async def get_badge_progress(
    user_id: str,
    badge_service: BadgeService = Depends(get_badge_service),
    user: dict = Depends(verify_token),
):
    """
    Get progress toward all unearned badges

    Returns:
    - Dictionary with badge_type as key
    - Progress info (current, required, percentage) as value
    - Only includes badges not yet earned
    """
    try:
        progress = await badge_service.get_badge_progress(user_id)

        # Sort by percentage (closest to unlocking first)
        sorted_progress = dict(
            sorted(progress.items(), key=lambda x: x[1]["percentage"], reverse=True)
        )

        return {
            "user_id": user_id,
            "total_unearned": len(sorted_progress),
            "progress": sorted_progress,
        }

    except Exception as e:
        print(f"Error fetching badge progress: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch badge progress: {str(e)}"
        )


@app.post("/api/badges/{user_id}/check-workout")
async def check_workout_badges(
    user_id: str,
    badge_service: BadgeService = Depends(get_badge_service),
    user: dict = Depends(verify_token),
):
    """
    Check for newly earned workout-related badges

    Should be called after workout completion

    Returns:
    - List of newly earned badge types
    """
    try:
        newly_earned = await badge_service.check_workout_badges(user_id)

        # Get full badge details
        badge_details = []
        for badge_type in newly_earned:
            badge_def = badge_service.get_badge_definition(badge_type)
            if badge_def:
                badge_details.append(
                    {
                        "badge_type": badge_type,
                        "badge_name": badge_def.badge_name,
                        "badge_description": badge_def.badge_description,
                        "category": badge_def.category,
                    }
                )

        return {
            "user_id": user_id,
            "newly_earned_count": len(newly_earned),
            "newly_earned": badge_details,
        }

    except Exception as e:
        print(f"Error checking workout badges: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to check workout badges: {str(e)}"
        )


@app.post("/api/badges/{user_id}/check-pr")
async def check_pr_badges(
    user_id: str,
    badge_service: BadgeService = Depends(get_badge_service),
    user: dict = Depends(verify_token),
):
    """
    Check for newly earned PR-related badges

    Should be called after PR detection

    Returns:
    - List of newly earned badge types
    """
    try:
        newly_earned = await badge_service.check_pr_badges(user_id)

        # Get full badge details
        badge_details = []
        for badge_type in newly_earned:
            badge_def = badge_service.get_badge_definition(badge_type)
            if badge_def:
                badge_details.append(
                    {
                        "badge_type": badge_type,
                        "badge_name": badge_def.badge_name,
                        "badge_description": badge_def.badge_description,
                        "category": badge_def.category,
                    }
                )

        return {
            "user_id": user_id,
            "newly_earned_count": len(newly_earned),
            "newly_earned": badge_details,
        }

    except Exception as e:
        print(f"Error checking PR badges: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to check PR badges: {str(e)}"
        )


@app.post("/api/badges/unlock", response_model=BadgeUnlockResponse)
async def unlock_badge(
    request: BadgeUnlockRequest,
    badge_service: BadgeService = Depends(get_badge_service),
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Manually unlock a badge for a user.

    This endpoint is used by the mobile app to unlock badges when milestones are reached.
    It checks if the badge is already unlocked before creating a new record.

    Args:
        request: BadgeUnlockRequest with user_id and badge_type
        badge_service: BadgeService instance (injected)
        supabase: Supabase client (injected)
        user: Authenticated user (injected)

    Returns:
        BadgeUnlockResponse with success status, message, and badge details
    """
    try:
        # Get badge definition
        badge_def = badge_service.get_badge_definition(request.badge_type)

        if not badge_def:
            raise HTTPException(
                status_code=404, detail=f"Badge type '{request.badge_type}' not found"
            )

        # Check if badge is already unlocked
        existing_badges = await badge_service.get_user_badges(request.user_id)
        already_unlocked = any(
            b["badge_type"] == request.badge_type for b in existing_badges
        )

        if already_unlocked:
            return BadgeUnlockResponse(
                success=True,
                message=f"Badge already unlocked: {badge_def.badge_name}",
                badge={
                    "badge_type": request.badge_type,
                    "badge_name": badge_def.badge_name,
                    "badge_description": badge_def.badge_description,
                    "category": badge_def.category,
                },
                already_unlocked=True,
            )

        # Unlock the badge
        now = datetime.utcnow().isoformat()

        result = (
            supabase.table("user_badges")
            .insert(
                {
                    "user_id": request.user_id,
                    "badge_type": request.badge_type,
                    "badge_name": badge_def.badge_name,
                    "badge_description": badge_def.badge_description,
                    "earned_at": now,
                }
            )
            .execute()
        )

        return BadgeUnlockResponse(
            success=True,
            message=f"Badge unlocked: {badge_def.badge_name}",
            badge={
                "badge_type": request.badge_type,
                "badge_name": badge_def.badge_name,
                "badge_description": badge_def.badge_description,
                "category": badge_def.category,
                "earned_at": now,
            },
            already_unlocked=False,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unlocking badge: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unlock badge: {str(e)}")


# ============================================================================
# ADHERENCE MONITORING ENDPOINTS
# ============================================================================


@app.get("/api/adherence/report/{user_id}", response_model=AdherenceReportResponse)
async def get_adherence_report(
    user_id: str,
    adherence_monitor: ProgramAdherenceMonitor = Depends(get_adherence_monitor),
    user: dict = Depends(verify_token),
):
    """
    Get weekly adherence report for a user.

    Checks user's adherence to their custom program and detects imbalances.

    Premium feature - requires Premium tier.

    Returns:
    - Adherence data (actual vs target volume)
    - Flags (created, updated, resolved, alerts)
    - Imbalance risks (quad/ham, push/pull)
    - Whether user needs to take action
    """
    try:
        report = adherence_monitor.run_weekly_check(user_id)
        return AdherenceReportResponse(**report)

    except Exception as e:
        print(f"Error generating adherence report: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate adherence report: {str(e)}"
        )


@app.post("/api/adherence/check-in", response_model=AdherenceCheckInResponse)
async def adherence_check_in(
    request: AdherenceCheckInRequest,
    adherence_monitor: ProgramAdherenceMonitor = Depends(get_adherence_monitor),
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Process user's response to adherence alert.

    Two-stage monitoring system:
    1. Stage 1 (Week 1): Silent monitoring - flag muscle groups below target
    2. Stage 2 (Week 2): If still below target after 7 days, send alert

    User responses:
    - injury: Create injury log and adjust program
    - time_constraint: Create gradual adjustment plan
    - equipment: Suggest equipment substitutions
    - motivation: Create gradual adjustment plan
    - fine: Dismiss flag
    - change_program: Suggest program regeneration

    Premium feature - requires Premium tier.
    """
    try:
        # Get the flag
        flag_result = (
            supabase.table("program_adherence_flags")
            .select("*")
            .eq("id", request.flag_id)
            .eq("user_id", request.user_id)
            .single()
            .execute()
        )

        if not flag_result.data:
            raise HTTPException(status_code=404, detail="Flag not found")

        flag = flag_result.data
        muscle_group = flag["muscle_group"]
        target_sets = flag["target_weekly_sets"]
        actual_sets = flag["actual_weekly_sets"]

        # Handle different response types
        adjustment_plan = None
        plan_created = False
        message = ""

        if request.response_type == "injury":
            # Create injury log (if injury_details provided)
            if request.injury_details:
                injury_data = {
                    "user_id": request.user_id,
                    "body_part": request.injury_details.get("body_part", muscle_group),
                    "severity": request.injury_details.get("severity", "moderate"),
                    "pain_level": request.injury_details.get("pain_level", 5),
                    "status": "active",
                    "reported_at": datetime.now().isoformat(),
                }
                supabase.table("injury_logs").insert(injury_data).execute()

            message = f"I've logged your {muscle_group} injury. I'll adjust your program to work around it."

            # Update flag to dismissed
            supabase.table("program_adherence_flags").update(
                {"status": "dismissed", "dismissed_at": datetime.now().isoformat()}
            ).eq("id", request.flag_id).execute()

        elif request.response_type in ["time_constraint", "motivation"]:
            # Create gradual adjustment plan
            plan = adherence_monitor.create_adjustment_plan(
                user_id=request.user_id,
                muscle_group=muscle_group,
                current_sets=actual_sets,
                target_sets=target_sets,
                duration_weeks=4,
            )

            if plan:
                adjustment_plan = {
                    "muscle_group": muscle_group,
                    "current_weekly_sets": actual_sets,
                    "target_weekly_sets": target_sets,
                    "weekly_increment": plan["weekly_increment"],
                    "duration_weeks": plan["duration_weeks"],
                    "weekly_targets": [
                        actual_sets + (plan["weekly_increment"] * (i + 1))
                        for i in range(plan["duration_weeks"])
                    ],
                }
                plan_created = True
                message = f"I've created a gradual 4-week plan to get your {muscle_group} volume back on track. Week 1: {adjustment_plan['weekly_targets'][0]} sets, Week 2: {adjustment_plan['weekly_targets'][1]} sets, Week 3: {adjustment_plan['weekly_targets'][2]} sets, Week 4: {adjustment_plan['weekly_targets'][3]} sets."

            # Update flag to resolved
            supabase.table("program_adherence_flags").update(
                {"status": "resolved", "resolved_at": datetime.now().isoformat()}
            ).eq("id", request.flag_id).execute()

        elif request.response_type == "fine":
            message = f"Got it! I'll keep monitoring your {muscle_group} volume."

            # Update flag to dismissed
            supabase.table("program_adherence_flags").update(
                {"status": "dismissed", "dismissed_at": datetime.now().isoformat()}
            ).eq("id", request.flag_id).execute()

        elif request.response_type == "change_program":
            message = "I understand you want to change your program. Head to the Program Generation screen to create a new custom program."

            # Update flag to dismissed
            supabase.table("program_adherence_flags").update(
                {"status": "dismissed", "dismissed_at": datetime.now().isoformat()}
            ).eq("id", request.flag_id).execute()

        else:
            message = f"Thanks for the feedback! I'll adjust your {muscle_group} recommendations."

        # Save check-in response
        check_in_data = {
            "user_id": request.user_id,
            "flag_id": request.flag_id,
            "response_type": request.response_type,
            "injury_details": request.injury_details,
            "adjustment_plan": adjustment_plan,
            "user_accepted": True,
        }
        supabase.table("adherence_check_in_responses").insert(check_in_data).execute()

        return AdherenceCheckInResponse(
            success=True,
            message=message,
            adjustment_plan=adjustment_plan,
            plan_created=plan_created,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing adherence check-in: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process check-in: {str(e)}"
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
        log_level="info",
    )
