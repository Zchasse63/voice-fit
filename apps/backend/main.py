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
from monitoring_service import get_monitoring_service
from onboarding_service import OnboardingService
from program_adherence_monitor import ProgramAdherenceMonitor
from program_generation_service import ProgramGenerationService
from rag_integration_service import RAGIntegrationService, get_rag_service
from rate_limit_middleware import add_rate_limiting
from schedule_optimization_service import ScheduleOptimizationService
from health_intelligence_service import HealthIntelligenceService
from personalization_service import PersonalizationService
from warmup_cooldown_service import WarmupCooldownService
from csv_import_service import CSVImportService
from voice_session_service import VoiceSessionService
from wearables_ingestion_service import WearablesIngestionService
from user_context_builder import UserContextBuilder
from volume_tracking_service import VolumeTrackingService
from weather_service import WeatherService
from health_snapshot_service import HealthSnapshotService

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

# Add rate limiting middleware (Phase 4)
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
add_rate_limiting(app, enable=ENABLE_RATE_LIMITING)

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
rag_service: RAGIntegrationService = None
schedule_optimization_service: ScheduleOptimizationService = None
health_intelligence_service: HealthIntelligenceService = None
personalization_service: PersonalizationService = None
warmup_cooldown_service: WarmupCooldownService = None
csv_import_service: CSVImportService = None
voice_session_service: VoiceSessionService = None
wearables_ingestion_service: WearablesIngestionService = None
health_snapshot_service: HealthSnapshotService = None


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
        # Inject WarmupCooldownService for multi-sport support
        warmup_service = get_warmup_cooldown_service()
        program_generation_service = ProgramGenerationService(warmup_cooldown_service=warmup_service)

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


def get_schedule_optimization_service() -> ScheduleOptimizationService:
    """Get or create ScheduleOptimizationService instance"""
    global schedule_optimization_service
    if schedule_optimization_service is None:
        supabase = get_supabase_client()
        schedule_optimization_service = ScheduleOptimizationService(supabase)
    return schedule_optimization_service


def get_health_intelligence_service() -> HealthIntelligenceService:
    """Get or create HealthIntelligenceService instance"""
    global health_intelligence_service
    if health_intelligence_service is None:
        supabase = get_supabase_client()
        health_intelligence_service = HealthIntelligenceService(supabase)
    return health_intelligence_service


def get_personalization_service() -> PersonalizationService:
    """Get or create PersonalizationService instance"""
    global personalization_service
    if personalization_service is None:
        supabase = get_supabase_client()
        personalization_service = PersonalizationService(supabase)
    return personalization_service


def get_warmup_cooldown_service() -> WarmupCooldownService:
    """Get or create WarmupCooldownService instance"""
    global warmup_cooldown_service
    if warmup_cooldown_service is None:
        supabase = get_supabase_client()
        warmup_cooldown_service = WarmupCooldownService(supabase)
    return warmup_cooldown_service


def get_csv_import_service() -> CSVImportService:
    """Get or create CSVImportService instance"""
    global csv_import_service
    if csv_import_service is None:
        supabase = get_supabase_client()
        csv_import_service = CSVImportService(supabase)
    return csv_import_service


def get_voice_session_service() -> VoiceSessionService:
    """Get or create VoiceSessionService instance"""
    global voice_session_service
    if voice_session_service is None:
        supabase = get_supabase_client()
        voice_session_service = VoiceSessionService(supabase)
    return voice_session_service


def get_wearables_ingestion_service() -> WearablesIngestionService:
    """Get or create WearablesIngestionService instance"""
    global wearables_ingestion_service
    if wearables_ingestion_service is None:
        supabase = get_supabase_client()
        wearables_ingestion_service = WearablesIngestionService(supabase)
    return wearables_ingestion_service


def get_health_snapshot_service() -> HealthSnapshotService:
    """Get or create HealthSnapshotService instance"""
    global health_snapshot_service
    if health_snapshot_service is None:
        supabase = get_supabase_client()
        health_snapshot_service = HealthSnapshotService(supabase)
    return health_snapshot_service


def get_rag_service() -> RAGIntegrationService:
    """Get or create RAG Integration service instance"""
    global rag_service
    if rag_service is None:
        rag_service = RAGIntegrationService()
    return rag_service


def get_schedule_optimization_service() -> ScheduleOptimizationService:
    """Get ScheduleOptimizationService instance"""
    supabase = get_supabase_client()
    return ScheduleOptimizationService(supabase)


def get_health_intelligence_service() -> HealthIntelligenceService:
    """Get HealthIntelligenceService instance"""
    supabase = get_supabase_client()
    return HealthIntelligenceService(supabase)


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
        print(f"✅ Model: {os.getenv('KIMI_VOICE_MODEL_ID', 'kimi-k2-turbo-preview')}")
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
        model_id=os.getenv("KIMI_VOICE_MODEL_ID", "kimi-k2-turbo-preview"),
        supabase_connected=supabase_connected,
    )


@app.get("/api/monitoring/health")
async def monitoring_health():
    """
    Monitoring endpoint - returns system health and metrics

    Includes:
    - Rate limiting stats
    - Cache performance
    - Redis health
    - Endpoint metrics
    """
    try:
        monitoring_service = get_monitoring_service()
        health = monitoring_service.get_system_health()
        return health
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get monitoring data: {str(e)}",
        }


@app.get("/api/monitoring/summary")
async def monitoring_summary():
    """
    Human-readable monitoring summary

    Returns plain text health report
    """
    try:
        monitoring_service = get_monitoring_service()
        summary = monitoring_service.get_health_summary()
        return {"summary": summary}
    except Exception as e:
        return {"error": f"Failed to generate summary: {str(e)}"}


@app.get("/api/monitoring/alerts")
async def monitoring_alerts():
    """
    Check for active alerts

    Returns list of current system alerts
    """
    try:
        monitoring_service = get_monitoring_service()
        alerts = monitoring_service.check_alerts()
        return {
            "alerts": alerts,
            "count": len(alerts),
            "has_critical": any(a["severity"] == "critical" for a in alerts),
        }
    except Exception as e:
        return {"error": f"Failed to check alerts: {str(e)}", "alerts": [], "count": 0}


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

    Uses Kimi K2 Turbo Preview + Upstash Search for exercise matching.
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
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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

        # Invalidate user context cache after logging workout
        if result.get("saved"):
            context_builder.invalidate_cache(request.user_id)

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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    user: dict = Depends(verify_token),
):
    """
    Classify a chat message to determine user intent.

    This endpoint is used by the unified chat interface to determine how to handle
    user messages:
    - workout_log: Parse with Kimi and log to WatermelonDB
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
        # Get RAG context for classification
        rag_context = rag_service.get_rag_context(
            endpoint="/api/chat/classify",
            request_data={"message": request.message},
            user_context={},
            max_chunks=15,
            use_cache=True,
            cache_ttl=3600,
        )

        # Classify the message
        message_type, confidence, reasoning, suggested_action = classifier.classify(
            message=request.message,
            user_id=request.user_id,
            conversation_history=request.conversation_history,
            rag_context=rag_context,
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    user: dict = Depends(verify_token),
):
    """
    Extract structured onboarding data from conversational chat.

    Uses Kimi to extract:
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
        # Get RAG context for onboarding extraction
        rag_context = rag_service.get_rag_context(
            endpoint="/api/onboarding/extract",
            request_data={
                "message": request.message,
                "current_step": request.current_step,
            },
            user_context={},
            max_chunks=20,
            use_cache=True,
            cache_ttl=3600,
        )

        # Extract data from message
        extracted_data = onboarding_service.extract_onboarding_data(
            message=request.message,
            current_step=request.current_step,
            conversation_history=request.conversation_history,
            rag_context=rag_context,
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
async def onboarding_conversational(
    request: OnboardingConversationalRequest,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    rag_service: RAGIntegrationService = Depends(get_rag_service),
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
        # Get RAG context for conversational onboarding
        rag_context = rag_service.get_rag_context(
            endpoint="/api/onboarding/conversational",
            request_data={
                "current_step": request.current_step,
                "previous_answer": request.previous_answer,
            },
            user_context={},
            max_chunks=20,
            use_cache=True,
            cache_ttl=3600,
        )

        # Generate conversational response
        message = onboarding_service.generate_conversational_response(
            current_step=request.current_step,
            user_context=request.user_context,
            previous_answer=request.previous_answer,
            rag_context=rag_context,
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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

        # Get user context
        user_context = await context_builder.build_context(user_id)

        # Get RAG context for exercise swapping
        rag_context = rag_service.get_rag_context(
            endpoint="/api/chat/swap-exercise-enhanced",
            request_data={
                "exercise_name": request.exercise_name,
                "injured_body_part": request.injured_body_part,
                "reason": request.reason,
            },
            user_context=user_context,
            max_chunks=25,
            use_cache=True,
            cache_ttl=3600,
        )

        # Get exercise swap service
        swap_service = get_exercise_swap_service(supabase)

        # Get context-aware substitutes
        result = await swap_service.get_context_aware_substitutes(
            user_id=user_id,
            exercise_name=request.exercise_name,
            injured_body_part=request.injured_body_part,
            reason=request.reason,
            include_ai_ranking=ai_enabled,  # Enable AI re-ranking if flag is on
            rag_context=rag_context,
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    personalization_service: PersonalizationService = Depends(get_personalization_service),
    user: dict = Depends(verify_token),
):
    """
    AI Coach Q&A endpoint with RAG (Retrieval-Augmented Generation) and full user context.

    Features:
    - Full user context (training history, injuries, PRs, readiness, streaks, badges)
    - Smart namespace selection (classifies query to relevant knowledge areas)
    - Parallel Upstash Search (retrieves context from knowledge base)
    - Streaming Kimi responses

    Performance:
    - Perceived latency: ~2 seconds (retrieval + time to first token)
    - Total latency: ~4 seconds (full response generation)

    Premium feature - requires Premium tier.
    """

    try:
        # Build comprehensive user context
        user_context = await context_builder.build_context(request.user_id)

        # Get RAG context for running analysis
        run_data = {
            "run_type": request.run_type,
            "distance_km": request.distance_km,
            "duration_seconds": request.duration_seconds,
        }
        rag_context = rag_service.get_rag_context(
            endpoint="/api/running/analyze",
            request_data=run_data,
            user_context=user_context,
            max_chunks=30,
            use_cache=True,
            cache_ttl=1800,
        )

        # Get RAG context for workout analysis
        workout_data = {
            "exercises": [{"name": ex.exercise_name} for ex in request.sets],
            "session_id": request.session_id,
        }
        rag_context = rag_service.get_rag_context(
            endpoint="/api/workout/insights",
            request_data=workout_data,
            user_context=user_context,
            max_chunks=35,
            use_cache=True,
            cache_ttl=1800,
        )

        # Get RAG context using SmartNamespaceSelector
        rag_context = rag_service.get_rag_context(
            endpoint="/api/coach/ask",
            request_data={"question": request.question},
            user_context=user_context,
            max_chunks=30,
            use_cache=True,
            cache_ttl=1800,
        )

        # Extract preferences from user message
        user_id = user["id"]
        current_preferences = personalization_service.get_user_preferences(user_id)
        preference_updates = personalization_service.extract_preferences_from_conversation(
            user_id, request.question, current_preferences
        )

        # Call AI Coach service with user context and RAG
        result = coach_service.ask(
            question=request.question,
            conversation_history=request.conversation_history,
            user_context=user_context,
            rag_context=rag_context,
        )

        # If preferences were extracted, append notification to answer
        if preference_updates:
            high_confidence_updates = [u for u in preference_updates if u["confidence"] >= 0.8]
            if high_confidence_updates:
                update_summary = ", ".join([
                    f"{u['preference_key']}: {u['new_value']}"
                    for u in high_confidence_updates
                ])
                result["answer"] += f"\n\n✅ **Preferences Updated**: {update_summary}"

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


@app.post("/api/health/insights")
async def get_health_insights(
    user_id: str,
    health_service: HealthIntelligenceService = Depends(get_health_intelligence_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    """
    Get AI-powered health insights based on wearable data, nutrition, and training.

    Returns:
        {
            "insights": [{"type": str, "severity": str, "message": str, "recommendation": str}],
            "overall_health_score": float,
            "trends": {"sleep": str, "recovery": str, "strain": str, "nutrition": str}
        }
    """
    try:
        # Build user context
        user_context = await context_builder.build_context(user_id)

        # Analyze health trends
        analysis = health_service.analyze_health_trends(user_id, user_context, days=14)

        return analysis

    except Exception as e:
        print(f"Error getting health insights: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get health insights: {str(e)}"
        )


@app.get("/api/health/alerts/{user_id}")
async def get_health_alerts(
    user_id: str,
    health_service: HealthIntelligenceService = Depends(get_health_intelligence_service),
    user: dict = Depends(verify_token),
):
    """
    Get proactive health alerts for user.

    Returns list of alerts that should be surfaced in chat or notifications.
    """
    try:
        alerts = health_service.check_proactive_alerts(user_id)
        return {"alerts": alerts}

    except Exception as e:
        print(f"Error getting health alerts: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get health alerts: {str(e)}"
        )


# ============================================================================
# PROGRAM GENERATION ENDPOINTS - Strength & Running
# ============================================================================


@app.post("/api/program/generate/strength", response_model=ProgramGenerationResponse)
async def generate_strength_program(
    request: ProgramGenerationRequest,
    program_service: ProgramGenerationService = Depends(get_program_generation_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    personalization_service: PersonalizationService = Depends(get_personalization_service),
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

        # Get user preferences
        user_preferences = personalization_service.get_user_preferences(user_id)

        # Get RAG context using SmartNamespaceSelector
        rag_context = rag_service.get_rag_context(
            endpoint="/api/program/generate/strength",
            request_data=request.questionnaire,
            user_context=user_context,
            max_chunks=40,
            use_cache=True,
            cache_ttl=3600,
        )

        # Generate strength program with user context, RAG, and preferences
        result = program_service.generate_program(
            request.questionnaire,
            user_context,
            rag_context=rag_context,
            user_preferences=user_preferences
        )

        # Invalidate user context cache after generating program
        context_builder.invalidate_cache(user_id)

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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    personalization_service: PersonalizationService = Depends(get_personalization_service),
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

        # Get user preferences
        user_preferences = personalization_service.get_user_preferences(user_id)

        # Get RAG context using SmartNamespaceSelector
        rag_context = rag_service.get_rag_context(
            endpoint="/api/program/generate/running",
            request_data=request.questionnaire,
            user_context=user_context,
            max_chunks=40,
            use_cache=True,
            cache_ttl=3600,
        )

        # Generate running program with user context, RAG, and preferences
        result = program_service.generate_program(
            request.questionnaire,
            user_context,
            rag_context=rag_context,
            user_preferences=user_preferences
        )

        # Invalidate user context cache after generating program
        context_builder.invalidate_cache(user_id)

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
# CALENDAR & SCHEDULING ENDPOINTS - Advanced Features
# ============================================================================


@app.patch("/api/calendar/reschedule")
async def reschedule_workout(
    scheduled_workout_id: str,
    new_date: str,
    reason: Optional[str] = None,
    schedule_service: ScheduleOptimizationService = Depends(
        get_schedule_optimization_service
    ),
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Reschedule a workout to a new date with conflict detection

    Args:
        scheduled_workout_id: ID of the workout to reschedule
        new_date: New date (YYYY-MM-DD)
        reason: Optional reason for rescheduling

    Returns:
        Updated workout and conflict warnings
    """
    try:
        user_id = user.get("sub")

        # Get the workout to reschedule
        workout_result = (
            supabase.table("scheduled_workouts")
            .select("*")
            .eq("id", scheduled_workout_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not workout_result.data:
            raise HTTPException(status_code=404, detail="Workout not found")

        workout = workout_result.data
        original_date = workout["scheduled_date"]

        # Check for conflicts on new date
        conflicts = schedule_service.check_conflicts(
            user_id, new_date, exclude_workout_id=scheduled_workout_id
        )

        # Update the workout
        from datetime import datetime

        new_date_obj = datetime.strptime(new_date, "%Y-%m-%d").date()

        # Recalculate week_number and day_of_week
        program_result = (
            supabase.table("generated_programs")
            .select("start_date")
            .eq("id", workout["program_id"])
            .single()
            .execute()
        )

        if program_result.data:
            start_date = datetime.strptime(
                program_result.data["start_date"], "%Y-%m-%d"
            ).date()
            days_diff = (new_date_obj - start_date).days
            week_number = (days_diff // 7) + 1
            day_of_week = new_date_obj.weekday()
        else:
            week_number = workout["week_number"]
            day_of_week = new_date_obj.weekday()

        # Update workout
        update_data = {
            "scheduled_date": new_date,
            "week_number": week_number,
            "day_of_week": day_of_week,
            "status": "rescheduled",
            "rescheduled_from": original_date,
            "reschedule_reason": reason,
        }

        updated_result = (
            supabase.table("scheduled_workouts")
            .update(update_data)
            .eq("id", scheduled_workout_id)
            .execute()
        )

        return {
            "success": True,
            "workout": updated_result.data[0] if updated_result.data else None,
            "conflicts": conflicts,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rescheduling workout: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to reschedule workout: {str(e)}"
        )


@app.get("/api/calendar/conflicts/{user_id}")
async def get_schedule_conflicts(
    user_id: str,
    start_date: str,
    end_date: str,
    schedule_service: ScheduleOptimizationService = Depends(
        get_schedule_optimization_service
    ),
    user: dict = Depends(verify_token),
):
    """
    Get scheduling conflicts for a date range

    Args:
        user_id: User ID
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        List of dates with conflicts
    """
    try:
        from datetime import datetime, timedelta

        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        conflicts_by_date = {}
        current_date = start

        while current_date <= end:
            date_str = current_date.isoformat()
            conflict_info = schedule_service.check_conflicts(user_id, date_str)

            if conflict_info.get("has_conflict"):
                conflicts_by_date[date_str] = conflict_info

            current_date += timedelta(days=1)

        return {"conflicts": conflicts_by_date, "total_conflict_days": len(conflicts_by_date)}

    except Exception as e:
        print(f"Error getting conflicts: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get conflicts: {str(e)}"
        )


@app.post("/api/calendar/availability")
async def create_availability_window(
    user_id: str,
    start_date: str,
    end_date: str,
    availability_type: str,
    notes: Optional[str] = None,
    schedule_service: ScheduleOptimizationService = Depends(
        get_schedule_optimization_service
    ),
    user: dict = Depends(verify_token),
):
    """
    Create an availability window (travel, vacation, injury, etc.)

    Args:
        user_id: User ID
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        availability_type: Type (travel|vacation|injury|other)
        notes: Optional notes

    Returns:
        Created availability window
    """
    try:
        window = schedule_service.create_availability_window(
            user_id, start_date, end_date, availability_type, notes
        )

        return {"success": True, "availability_window": window}

    except Exception as e:
        print(f"Error creating availability window: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create availability window: {str(e)}"
        )


@app.get("/api/calendar/availability/{user_id}")
async def get_availability_windows(
    user_id: str,
    start_date: str,
    end_date: str,
    schedule_service: ScheduleOptimizationService = Depends(
        get_schedule_optimization_service
    ),
    user: dict = Depends(verify_token),
):
    """
    Get availability windows for a date range

    Args:
        user_id: User ID
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        List of availability windows
    """
    try:
        windows = schedule_service.get_availability_windows(
            user_id, start_date, end_date
        )

        return {"availability_windows": windows}

    except Exception as e:
        print(f"Error getting availability windows: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get availability windows: {str(e)}"
        )


@app.post("/api/calendar/suggest-optimizations")
async def suggest_schedule_optimizations(
    user_id: str,
    schedule_service: ScheduleOptimizationService = Depends(
        get_schedule_optimization_service
    ),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    user: dict = Depends(verify_token),
):
    """
    Generate AI-powered schedule optimization suggestions

    Args:
        user_id: User ID

    Returns:
        List of schedule suggestions
    """
    try:
        # Build user context
        user_context = await context_builder.build_context(user_id)

        # Get RAG context for scheduling best practices
        rag_context = rag_service.get_rag_context(
            endpoint="/api/calendar/suggest-optimizations",
            request_data={"user_id": user_id},
            user_context=user_context,
            max_chunks=20,
            use_cache=True,
            cache_ttl=3600,
        )

        # Generate suggestions
        suggestions = schedule_service.generate_schedule_suggestions(
            user_id, user_context, rag_context
        )

        return {"suggestions": suggestions, "count": len(suggestions)}

    except Exception as e:
        print(f"Error generating schedule suggestions: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate suggestions: {str(e)}"
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
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

        # Get RAG context for running analysis
        rag_context = rag_service.get_rag_context(
            endpoint="/api/running/analyze",
            request_data={
                "distance": run_summary["distance"],
                "duration": run_summary["duration"],
                "pace": run_summary["pace"],
                "elevation_gain": run_summary.get("elevation_gain", 0),
            },
            user_context=user_context,
            max_chunks=30,
            use_cache=True,
            cache_ttl=1800,
        )

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

        # Get AI insights with RAG context
        ai_result = coach_service.ask(
            question=prompt,
            conversation_history=None,
            user_context=user_context,
            rag_context=rag_context,
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
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

        # Get RAG context for workout analysis
        rag_context = rag_service.get_rag_context(
            endpoint="/api/workout/insights",
            request_data={
                "exercises": [
                    {"name": ex.get("exercises", {}).get("original_name", "")}
                    for ex in sets_data
                    if ex.get("exercises")
                ],
                "total_sets": total_sets,
                "avg_rpe": avg_rpe,
            },
            user_context=user_context,
            max_chunks=35,
            use_cache=True,
            cache_ttl=1800,
        )

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

        # Get AI insights with RAG context
        ai_result = coach_service.ask(
            question=prompt,
            conversation_history=None,
            user_context=user_context,
            rag_context=rag_context,
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
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
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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

        # Invalidate user context cache after logging injury
        context_builder.invalidate_cache(request.user_id)

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
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
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


# ============================================================================
# WEARABLES & NUTRITION INGESTION ENDPOINTS
# ============================================================================


@app.post("/api/wearables/ingest")
async def ingest_wearable_data(
    user_id: str,
    source: str,
    data: Dict[str, Any],
    wearables_service: WearablesIngestionService = Depends(get_wearables_ingestion_service),
    user: dict = Depends(verify_token),
):
    """
    Ingest wearable/nutrition data from various sources

    Args:
        user_id: User ID
        source: Data source (terra, whoop, garmin, apple_health, oura, myfitnesspal)
        data: Raw data from the source

    Returns:
        {
            "success": bool,
            "metrics_ingested": int,
            "duplicates_skipped": int
        }
    """
    try:
        result = await wearables_service.ingest_data(user_id, source, data)
        return result
    except Exception as e:
        print(f"Error ingesting wearable data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to ingest data: {str(e)}"
        )


@app.post("/api/wearables/webhook/terra")
async def terra_webhook(
    request: Request,
    wearables_service: WearablesIngestionService = Depends(get_wearables_ingestion_service),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Terra webhook endpoint for automatic data ingestion.

    Handles all Terra webhook types:
    - activity: Workout/exercise sessions
    - sleep: Sleep sessions
    - body: Body measurements (weight, body fat, etc.)
    - daily: Daily summary metrics
    - athlete: User profile updates
    """
    try:
        body = await request.json()
        body_bytes = await request.body()

        # Verify Terra webhook signature
        terra_signature = request.headers.get("terra-signature")
        terra_secret = os.getenv("TERRA_WEBHOOK_SECRET")

        if terra_secret and terra_signature:
            import hmac
            import hashlib

            # Terra uses HMAC-SHA256 for webhook signatures
            expected_signature = hmac.new(
                terra_secret.encode('utf-8'),
                body_bytes,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(terra_signature, expected_signature):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Terra webhook signature"
                )

        # Extract event type and user
        event_type = body.get("type")  # activity, sleep, body, daily, athlete
        user_reference = body.get("user", {}).get("user_id")

        # Get user_id from wearable_provider_connections
        connection_result = supabase.table("wearable_provider_connections").select("user_id").eq(
            "provider", "terra"
        ).eq("provider_user_id", user_reference).execute()

        if not connection_result.data:
            return {"success": False, "error": "User not found"}

        user_id = connection_result.data[0]["user_id"]

        # Route to appropriate ingestion method based on event type
        result = {"success": False}

        if event_type == "sleep":
            result = wearables_service.ingest_terra_sleep(user_id, body)
        elif event_type == "activity":
            result = wearables_service.ingest_terra_activity(user_id, body)
        elif event_type == "body":
            # Body metrics return a list, so we need to insert each one
            metrics = wearables_service.normalization_service.normalize_terra_body(body)
            inserted = []
            for metric in metrics:
                metric['user_id'] = user_id
                metric_result = supabase.table('health_metrics').insert(metric).execute()
                inserted.append(metric_result.data[0] if metric_result.data else None)
            result = {"success": True, "metrics_inserted": len(inserted)}
        elif event_type == "daily":
            # Daily summary
            summary = wearables_service.normalization_service.normalize_terra_daily(body)
            summary['user_id'] = user_id

            # Merge with existing summary
            merged = wearables_service.priority_service.merge_daily_summary(
                user_id, summary['date'], summary, 'terra'
            )

            # Upsert
            upsert_result = supabase.table('daily_summaries').upsert(merged).execute()
            result = {"success": True, "summary_id": upsert_result.data[0]['id'] if upsert_result.data else None}
        elif event_type == "nutrition":
            # Nutrition data from Terra (MyFitnessPal, Cronometer, MacroFactor, etc.)
            nutrition = wearables_service.normalization_service.normalize_terra_nutrition(body)
            nutrition['user_id'] = user_id

            # Upsert nutrition data
            nutrition_result = supabase.table('daily_nutrition_summary').upsert(nutrition).execute()
            result = {"success": True, "nutrition_id": nutrition_result.data[0]['id'] if nutrition_result.data else None}
        elif event_type == "athlete":
            # User profile update - store in metadata for now
            result = {"success": True, "message": "Athlete profile update received"}
        else:
            result = {"success": False, "error": f"Unknown event type: {event_type}"}

        return result

    except Exception as e:
        print(f"Error processing Terra webhook: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to process webhook: {str(e)}"
        )


@app.post("/api/wearables/webhook/whoop")
async def whoop_webhook(
    request: Request,
    wearables_service: WearablesIngestionService = Depends(get_wearables_ingestion_service),
    supabase: Client = Depends(get_supabase_client),
):
    """
    WHOOP webhook endpoint for automatic data ingestion.

    Handles all WHOOP webhook types:
    - recovery.updated: Recovery score and HRV data
    - sleep.updated: Sleep session data
    - workout.updated: Workout/activity data
    - cycle.updated: Daily cycle data
    """
    try:
        body = await request.json()
        body_bytes = await request.body()

        # Verify WHOOP webhook signature
        whoop_signature = request.headers.get("x-whoop-signature")
        whoop_secret = os.getenv("WHOOP_WEBHOOK_SECRET")

        if whoop_secret and whoop_signature:
            import hmac
            import hashlib

            # WHOOP uses HMAC-SHA256 for webhook signatures
            expected_signature = hmac.new(
                whoop_secret.encode('utf-8'),
                body_bytes,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(whoop_signature, expected_signature):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid WHOOP webhook signature"
                )

        # Extract event type and user
        event_type = body.get("type")  # recovery.updated, sleep.updated, workout.updated, cycle.updated
        user_reference = body.get("user_id")

        # Get user_id from wearable_provider_connections
        connection_result = supabase.table("wearable_provider_connections").select("user_id").eq(
            "provider", "whoop"
        ).eq("provider_user_id", user_reference).execute()

        if not connection_result.data:
            return {"success": False, "error": "User not found"}

        user_id = connection_result.data[0]["user_id"]

        # Route to appropriate ingestion method based on event type
        result = {"success": False}

        if event_type == "recovery.updated":
            result = wearables_service.ingest_whoop_recovery(user_id, body)
        elif event_type == "sleep.updated":
            result = wearables_service.ingest_whoop_sleep(user_id, body)
        elif event_type == "workout.updated":
            result = wearables_service.ingest_whoop_workout(user_id, body)
        elif event_type == "cycle.updated":
            # Cycle data contains daily summary
            # Extract relevant fields and store in daily_summaries
            cycle_data = body.get("data", {})
            summary = {
                'date': cycle_data.get('days', [{}])[0].get('day'),
                'strain_score': cycle_data.get('score', {}).get('strain'),
                'recovery_score': cycle_data.get('score', {}).get('recovery_score'),
                'sleep_score': cycle_data.get('score', {}).get('sleep_performance_percentage'),
                'sources': ['whoop'],
                'metadata': cycle_data
            }
            summary['user_id'] = user_id

            # Merge with existing summary
            merged = wearables_service.priority_service.merge_daily_summary(
                user_id, summary['date'], summary, 'whoop'
            )

            # Upsert
            upsert_result = supabase.table('daily_summaries').upsert(merged).execute()
            result = {"success": True, "summary_id": upsert_result.data[0]['id'] if upsert_result.data else None}
        else:
            result = {"success": False, "error": f"Unknown event type: {event_type}"}

        return result

    except Exception as e:
        print(f"Error processing WHOOP webhook: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to process webhook: {str(e)}"
        )


@app.get("/api/wearables/metrics/{user_id}")
async def get_user_metrics(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metric_type: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's health metrics from wearables.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
        metric_type: Optional metric type filter (recovery_score, hrv, resting_hr, etc.)

    Returns:
        List of health metrics
    """
    try:
        # Verify user has access (either own data or is assigned coach)
        if user["id"] != user_id:
            # Check if user is a coach assigned to this client
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("health_metrics").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)
        if metric_type:
            query = query.eq("metric_type", metric_type)

        result = query.order("date", desc=True).order("source_priority", desc=True).execute()
        return {"metrics": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch metrics: {str(e)}"
        )


@app.get("/api/wearables/sleep/{user_id}")
async def get_sleep_sessions(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's sleep sessions.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)

    Returns:
        List of sleep sessions
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("sleep_sessions").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("start_time", start_date)
        if end_date:
            query = query.lte("end_time", end_date)

        result = query.order("start_time", desc=True).execute()
        return {"sleep_sessions": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching sleep sessions: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch sleep sessions: {str(e)}"
        )


@app.get("/api/wearables/activity/{user_id}")
async def get_activity_sessions(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    activity_type: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's activity/workout sessions.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
        activity_type: Optional activity type filter

    Returns:
        List of activity sessions
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("activity_sessions").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("start_time", start_date)
        if end_date:
            query = query.lte("end_time", end_date)
        if activity_type:
            query = query.eq("activity_type", activity_type)

        result = query.order("start_time", desc=True).execute()
        return {"activity_sessions": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching activity sessions: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch activity sessions: {str(e)}"
        )


@app.get("/api/wearables/daily/{user_id}")
async def get_daily_summaries(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's daily summaries.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)

    Returns:
        List of daily summaries
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("daily_summaries").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        result = query.order("date", desc=True).execute()
        return {"daily_summaries": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching daily summaries: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch daily summaries: {str(e)}"
        )


@app.get("/api/wearables/connections/{user_id}")
async def get_wearable_connections(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's wearable provider connections.

    Args:
        user_id: User ID

    Returns:
        List of connected wearable providers
    """
    try:
        # Verify user is requesting their own connections
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        result = supabase.table("wearable_provider_connections").select(
            "provider, connected_at, last_sync_at, sync_status, metadata"
        ).eq("user_id", user_id).execute()

        return {"connections": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching connections: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch connections: {str(e)}"
        )


# ============================================================================
# Nutrition Endpoints
# ============================================================================

@app.post("/api/nutrition/manual")
async def log_nutrition_manually(
    user_id: str,
    date: str,
    calories: int,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    fiber_g: Optional[float] = None,
    sugar_g: Optional[float] = None,
    sodium_mg: Optional[int] = None,
    water_ml: Optional[int] = None,
    notes: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Manually log nutrition data for a specific date.

    Args:
        user_id: User ID
        date: Date in YYYY-MM-DD format
        calories: Total calories
        protein_g: Protein in grams
        carbs_g: Carbohydrates in grams
        fat_g: Fat in grams
        fiber_g: Fiber in grams (optional)
        sugar_g: Sugar in grams (optional)
        sodium_mg: Sodium in mg (optional)
        water_ml: Water in ml (optional)
        notes: Additional notes (optional)

    Returns:
        Created nutrition entry
    """
    try:
        # Verify user is logging their own nutrition
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        nutrition_entry = {
            "user_id": user_id,
            "date": date,
            "calories": calories,
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
            "fiber_g": fiber_g or 0,
            "sugar_g": sugar_g or 0,
            "sodium_mg": sodium_mg or 0,
            "water_ml": water_ml or 0,
            "source": "manual",
            "source_priority": 100,  # Manual entry has highest priority
            "notes": notes,
            "created_at": datetime.now().isoformat(),
        }

        # Upsert (replace if exists for this date)
        result = supabase.table("daily_nutrition_summary").upsert(nutrition_entry).execute()

        return {
            "success": True,
            "nutrition_id": result.data[0]["id"] if result.data else None,
            "entry": result.data[0] if result.data else nutrition_entry
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error logging nutrition: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log nutrition: {str(e)}")


@app.get("/api/nutrition/{user_id}")
async def get_nutrition_data(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's nutrition data for a date range.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)

    Returns:
        List of nutrition entries
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("daily_nutrition_summary").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        result = query.order("date", desc=True).execute()
        return {"nutrition_data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching nutrition data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch nutrition data: {str(e)}")


@app.delete("/api/nutrition/{user_id}/{date}")
async def delete_nutrition_entry(
    user_id: str,
    date: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Delete a nutrition entry for a specific date.

    Args:
        user_id: User ID
        date: Date in YYYY-MM-DD format

    Returns:
        Success status
    """
    try:
        # Verify user is deleting their own entry
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Only allow deletion of manual entries
        result = supabase.table("daily_nutrition_summary").delete().eq(
            "user_id", user_id
        ).eq("date", date).eq("source", "manual").execute()

        return {"success": True, "deleted": len(result.data) > 0}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting nutrition entry: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete nutrition entry: {str(e)}")


@app.post("/api/wearables/terra/callback")
async def terra_oauth_callback(
    request_data: dict,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Handle Terra OAuth callback - exchange code for token
    """
    try:
        from terra_oauth_service import TerraOAuthService

        user_id = request_data.get("user_id")
        code = request_data.get("code")

        if not user_id or not code:
            raise HTTPException(status_code=400, detail="Missing user_id or code")

        oauth_service = TerraOAuthService(supabase)
        token_data = await oauth_service.exchange_code_for_token(code, user_id)

        return token_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in Terra callback: {e}")
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


@app.post("/api/wearables/whoop/callback")
async def whoop_oauth_callback(
    request_data: dict,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Handle WHOOP OAuth callback - exchange code for token
    """
    try:
        from whoop_oauth_service import WHOOPOAuthService

        user_id = request_data.get("user_id")
        code = request_data.get("code")

        if not user_id or not code:
            raise HTTPException(status_code=400, detail="Missing user_id or code")

        oauth_service = WHOOPOAuthService(supabase)
        token_data = await oauth_service.exchange_code_for_token(code, user_id)

        return token_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in WHOOP callback: {e}")
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


@app.delete("/api/wearables/disconnect/terra")
async def disconnect_terra(
    request_data: dict,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Disconnect Terra wearable integration
    """
    try:
        user_id = request_data.get("user_id")

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        # Mark connection as inactive
        supabase.table("wearable_provider_connections").update(
            {"is_active": False}
        ).eq("user_id", user_id).eq("provider", "terra").execute()

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error disconnecting Terra: {e}")
        raise HTTPException(status_code=500, detail=f"Disconnect failed: {str(e)}")


@app.post("/api/wearables/whoop/refresh")
async def whoop_refresh_token(
    request_data: dict,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Refresh WHOOP access token
    """
    try:
        from whoop_oauth_service import WHOOPOAuthService

        user_id = request_data.get("user_id")

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        oauth_service = WHOOPOAuthService(supabase)
        new_token = await oauth_service.refresh_access_token(user_id)

        if not new_token:
            raise HTTPException(status_code=401, detail="Failed to refresh token")

        return {"access_token": new_token}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error refreshing WHOOP token: {e}")
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")


@app.post("/api/wearables/connect/{provider}")
async def initiate_wearable_connection(
    provider: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Initiate OAuth connection to a wearable provider.

    Args:
        provider: Provider name (terra, whoop, garmin, oura)
        user_id: User ID

    Returns:
        OAuth authorization URL
    """
    try:
        # Verify user is connecting their own account
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Generate OAuth URL based on provider
        # This is a simplified version - in production, implement full OAuth flow
        oauth_urls = {
            "terra": f"https://api.tryterra.co/v2/auth?user_id={user_id}",
            "whoop": f"https://api.prod.whoop.com/oauth/authorize?user_id={user_id}",
            "garmin": f"https://connect.garmin.com/oauth/authorize?user_id={user_id}",
            "oura": f"https://cloud.ouraring.com/oauth/authorize?user_id={user_id}",
        }

        if provider not in oauth_urls:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        return {
            "authorization_url": oauth_urls[provider],
            "provider": provider,
            "user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error initiating connection: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to initiate connection: {str(e)}"
        )


@app.delete("/api/wearables/disconnect/{provider}")
async def disconnect_wearable_provider(
    provider: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Disconnect a wearable provider.

    Args:
        provider: Provider name (terra, whoop, garmin, oura)
        user_id: User ID

    Returns:
        Success message
    """
    try:
        # Verify user is disconnecting their own account
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Delete connection
        result = supabase.table("wearable_provider_connections").delete().eq(
            "user_id", user_id
        ).eq("provider", provider).execute()

        return {
            "success": True,
            "message": f"Disconnected from {provider}",
            "provider": provider
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error disconnecting provider: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to disconnect provider: {str(e)}"
        )


# ============================================================================
# HEALTH SNAPSHOT ENDPOINTS
# ============================================================================


@app.get("/api/health/snapshots/{user_id}")
async def get_health_snapshots(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: Optional[int] = 30,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's health snapshots.

    Args:
        user_id: User ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
        limit: Maximum number of snapshots to return (default: 30)

    Returns:
        List of health snapshots
    """
    try:
        # Verify access (user or assigned coach)
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        query = supabase.table("health_snapshots").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        result = query.order("date", desc=True).limit(limit).execute()
        return {"snapshots": result.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching health snapshots: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch health snapshots: {str(e)}"
        )


@app.get("/api/health/snapshots/{user_id}/latest")
async def get_latest_health_snapshot(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get user's most recent health snapshot.

    Args:
        user_id: User ID

    Returns:
        Latest health snapshot
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        result = (
            supabase.table("health_snapshots")
            .select("*")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            return {"snapshot": None, "message": "No snapshots found"}

        return {"snapshot": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching latest snapshot: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch latest snapshot: {str(e)}"
        )


@app.post("/api/health/snapshots/{user_id}/generate")
async def generate_health_snapshot(
    user_id: str,
    date: Optional[str] = None,
    snapshot_service: HealthSnapshotService = Depends(get_health_snapshot_service),
    user: dict = Depends(verify_token),
):
    """
    Generate a health snapshot for a specific date.

    Args:
        user_id: User ID
        date: Date in YYYY-MM-DD format (defaults to today)

    Returns:
        Generated health snapshot
    """
    try:
        # Verify user is requesting their own snapshot
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        snapshot = await snapshot_service.generate_snapshot(user_id, date)
        return {"snapshot": snapshot, "message": "Snapshot generated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating snapshot: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate snapshot: {str(e)}"
        )


# ============================================================================
# COACH/CLIENT INVITATION ENDPOINTS
# ============================================================================


@app.post("/api/coach/invite-client")
async def invite_client(
    client_email: str,
    message: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Coach invites a client by email.

    Args:
        client_email: Email address of the client to invite
        message: Optional message to include with the invitation

    Returns:
        Invitation details including ID and expiration
    """
    try:
        coach_id = user["id"]

        # Check if user is a coach
        profile_result = supabase.table("user_profiles").select("user_type").eq(
            "user_id", coach_id
        ).execute()

        if not profile_result.data or profile_result.data[0].get("user_type") != "coach":
            raise HTTPException(status_code=403, detail="Only coaches can invite clients")

        # Check if invitation already exists
        existing = supabase.table("coach_client_invitations").select("*").eq(
            "coach_id", coach_id
        ).eq("client_email", client_email).eq("status", "pending").execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Pending invitation already exists for this client")

        # Create invitation
        invitation_data = {
            "coach_id": coach_id,
            "client_email": client_email,
            "message": message,
            "status": "pending"
        }

        result = supabase.table("coach_client_invitations").insert(invitation_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create invitation")

        invitation = result.data[0]

        # TODO: Send email notification to client

        return {
            "success": True,
            "invitation": invitation,
            "message": f"Invitation sent to {client_email}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating invitation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create invitation: {str(e)}")


@app.get("/api/coach/invitations")
async def get_coach_invitations(
    status: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Get all invitations sent by the coach.

    Args:
        status: Optional filter by status (pending, accepted, declined, expired)

    Returns:
        List of invitations
    """
    try:
        coach_id = user["id"]

        query = supabase.table("coach_client_invitations").select("*").eq("coach_id", coach_id)

        if status:
            query = query.eq("status", status)

        result = query.order("created_at", desc=True).execute()

        return {
            "success": True,
            "invitations": result.data or []
        }
    except Exception as e:
        print(f"Error fetching invitations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch invitations: {str(e)}")


@app.post("/api/client/accept-invitation")
async def accept_invitation(
    invitation_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Client accepts a coach invitation.

    Args:
        invitation_id: ID of the invitation to accept

    Returns:
        Updated invitation and created assignment
    """
    try:
        client_id = user["id"]
        client_email = user.get("email")

        # Get invitation
        invitation_result = supabase.table("coach_client_invitations").select("*").eq(
            "id", invitation_id
        ).execute()

        if not invitation_result.data:
            raise HTTPException(status_code=404, detail="Invitation not found")

        invitation = invitation_result.data[0]

        # Verify client can accept this invitation
        if invitation["client_email"] != client_email and invitation.get("client_id") != client_id:
            raise HTTPException(status_code=403, detail="This invitation is not for you")

        if invitation["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Invitation is {invitation['status']}")

        # Check if expired
        from datetime import datetime
        expires_at = datetime.fromisoformat(invitation["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(expires_at.tzinfo):
            raise HTTPException(status_code=400, detail="Invitation has expired")

        # Update invitation
        update_data = {
            "status": "accepted",
            "client_id": client_id,
            "responded_at": "now()"
        }

        result = supabase.table("coach_client_invitations").update(update_data).eq(
            "id", invitation_id
        ).execute()

        # The trigger will automatically create the client_assignment

        return {
            "success": True,
            "invitation": result.data[0] if result.data else None,
            "message": "Invitation accepted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting invitation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to accept invitation: {str(e)}")


@app.post("/api/client/decline-invitation")
async def decline_invitation(
    invitation_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Client declines a coach invitation.

    Args:
        invitation_id: ID of the invitation to decline

    Returns:
        Updated invitation
    """
    try:
        client_id = user["id"]
        client_email = user.get("email")

        # Get invitation
        invitation_result = supabase.table("coach_client_invitations").select("*").eq(
            "id", invitation_id
        ).execute()

        if not invitation_result.data:
            raise HTTPException(status_code=404, detail="Invitation not found")

        invitation = invitation_result.data[0]

        # Verify client can decline this invitation
        if invitation["client_email"] != client_email and invitation.get("client_id") != client_id:
            raise HTTPException(status_code=403, detail="This invitation is not for you")

        if invitation["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Invitation is {invitation['status']}")

        # Update invitation
        update_data = {
            "status": "declined",
            "client_id": client_id,
            "responded_at": "now()"
        }

        result = supabase.table("coach_client_invitations").update(update_data).eq(
            "id", invitation_id
        ).execute()

        return {
            "success": True,
            "invitation": result.data[0] if result.data else None,
            "message": "Invitation declined"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error declining invitation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to decline invitation: {str(e)}")


@app.delete("/api/client/revoke-coach-access")
async def revoke_coach_access(
    coach_id: str,
    reason: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Client revokes a coach's access to their data.

    Args:
        coach_id: ID of the coach to revoke access from
        reason: Optional reason for revocation

    Returns:
        Success message
    """
    try:
        client_id = user["id"]

        # Find assignment
        assignment_result = supabase.table("client_assignments").select("*").eq(
            "client_id", client_id
        ).eq("coach_id", coach_id).is_("revoked_at", "null").execute()

        if not assignment_result.data:
            raise HTTPException(status_code=404, detail="Active coach assignment not found")

        # Revoke access
        update_data = {
            "revoked_at": "now()",
            "revoked_by": client_id,
            "revocation_reason": reason
        }

        result = supabase.table("client_assignments").update(update_data).eq(
            "client_id", client_id
        ).eq("coach_id", coach_id).execute()

        return {
            "success": True,
            "message": "Coach access revoked successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking coach access: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to revoke access: {str(e)}")


# ============================================================================
# PERSONALIZATION ENDPOINTS
# ============================================================================


@app.get("/api/preferences/{user_id}")
async def get_user_preferences(
    user_id: str,
    personalization_service: PersonalizationService = Depends(get_personalization_service),
    user: dict = Depends(verify_token),
):
    """Get user preferences"""
    try:
        preferences = personalization_service.get_user_preferences(user_id)
        return preferences
    except Exception as e:
        print(f"Error fetching preferences: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch preferences: {str(e)}"
        )


@app.patch("/api/preferences/{user_id}")
async def update_user_preferences(
    user_id: str,
    updates: Dict[str, Any],
    personalization_service: PersonalizationService = Depends(get_personalization_service),
    user: dict = Depends(verify_token),
):
    """Update user preferences"""
    try:
        result = personalization_service.update_preferences(user_id, updates)
        return result
    except Exception as e:
        print(f"Error updating preferences: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update preferences: {str(e)}"
        )


@app.post("/api/preferences/extract")
async def extract_preferences_from_conversation(
    user_id: str,
    conversation_text: str,
    personalization_service: PersonalizationService = Depends(get_personalization_service),
    user: dict = Depends(verify_token),
):
    """Extract preferences from conversational text using AI"""
    try:
        result = await personalization_service.extract_preferences_from_conversation(
            user_id, conversation_text
        )
        return result
    except Exception as e:
        print(f"Error extracting preferences: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to extract preferences: {str(e)}"
        )


# ============================================================================
# WARMUP/COOLDOWN ENDPOINTS
# ============================================================================


@app.post("/api/warmup/generate")
async def generate_warmup(
    user_id: str,
    workout_focus: str,
    duration_minutes: int = 10,
    warmup_service: WarmupCooldownService = Depends(get_warmup_cooldown_service),
    user: dict = Depends(verify_token),
):
    """Generate personalized warmup based on workout and injuries"""
    try:
        result = await warmup_service.generate_warmup(
            user_id, workout_focus, duration_minutes
        )
        return result
    except Exception as e:
        print(f"Error generating warmup: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate warmup: {str(e)}"
        )


@app.post("/api/cooldown/generate")
async def generate_cooldown(
    user_id: str,
    workout_focus: str,
    duration_minutes: int = 10,
    warmup_service: WarmupCooldownService = Depends(get_warmup_cooldown_service),
    user: dict = Depends(verify_token),
):
    """Generate personalized cooldown based on workout and injuries"""
    try:
        result = await warmup_service.generate_cooldown(
            user_id, workout_focus, duration_minutes
        )
        return result
    except Exception as e:
        print(f"Error generating cooldown: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate cooldown: {str(e)}"
        )


@app.get("/api/warmup-cooldown/templates")
async def get_warmup_cooldown_templates(
    sport: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get warmup/cooldown templates"""
    try:
        query = supabase.table("warmup_cooldown_templates").select("*")
        if sport:
            query = query.eq("sport", sport)
        result = query.execute()
        return {"templates": result.data}
    except Exception as e:
        print(f"Error fetching templates: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch templates: {str(e)}"
        )


@app.post("/api/warmup-cooldown/templates")
async def create_warmup_cooldown_template(
    template_data: Dict[str, Any],
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Create custom warmup/cooldown template"""
    try:
        result = supabase.table("warmup_cooldown_templates").insert(template_data).execute()
        return {"template": result.data[0]}
    except Exception as e:
        print(f"Error creating template: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create template: {str(e)}"
        )


# ============================================================================
# CSV IMPORT ENDPOINTS (Enterprise/B2B)
# ============================================================================


@app.post("/api/csv/analyze")
async def analyze_csv_schema(
    file_name: str,
    csv_content: str,
    csv_service: CSVImportService = Depends(get_csv_import_service),
    user: dict = Depends(verify_token),
):
    """Analyze CSV schema and suggest field mappings using AI"""
    try:
        result = await csv_service.analyze_csv_schema(csv_content, file_name)
        return result
    except Exception as e:
        print(f"Error analyzing CSV: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze CSV: {str(e)}"
        )


@app.post("/api/csv/import")
async def import_csv_program(
    coach_id: str,
    csv_content: str,
    field_mapping: Dict[str, str],
    program_metadata: Dict[str, Any],
    csv_service: CSVImportService = Depends(get_csv_import_service),
    user: dict = Depends(verify_token),
):
    """Import program from CSV with AI-assisted mapping"""
    try:
        result = await csv_service.import_program(
            coach_id, csv_content, field_mapping, program_metadata
        )
        return result
    except Exception as e:
        print(f"Error importing CSV: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to import CSV: {str(e)}"
        )


@app.post("/api/csv/review")
async def review_program_quality(
    program_data: Dict[str, Any],
    csv_service: CSVImportService = Depends(get_csv_import_service),
    user: dict = Depends(verify_token),
):
    """AI-powered program quality review"""
    try:
        result = await csv_service.review_program_quality(program_data)
        return result
    except Exception as e:
        print(f"Error reviewing program: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to review program: {str(e)}"
        )


@app.post("/api/csv/publish")
async def publish_program_to_clients(
    program_id: str,
    client_ids: List[str],
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Publish imported program to selected clients"""
    try:
        # Assign program to clients
        assignments = []
        for client_id in client_ids:
            assignment = {
                "user_id": client_id,
                "program_id": program_id,
                "assigned_at": datetime.now().isoformat(),
                "status": "active"
            }
            assignments.append(assignment)

        result = supabase.table("user_programs").insert(assignments).execute()
        return {
            "success": True,
            "assignments": len(result.data),
            "program_id": program_id
        }
    except Exception as e:
        print(f"Error publishing program: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to publish program: {str(e)}"
        )


@app.get("/api/csv/imports/{coach_id}")
async def get_import_history(
    coach_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get CSV import history for a coach"""
    try:
        result = supabase.table("csv_import_history").select("*").eq(
            "coach_id", coach_id
        ).order("created_at", desc=True).execute()
        return {"imports": result.data}
    except Exception as e:
        print(f"Error fetching import history: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch import history: {str(e)}"
        )


# ============================================================================
# VOICE SESSION ENDPOINTS
# ============================================================================


@app.post("/api/sessions/create")
async def create_voice_session(
    user_id: str,
    session_type: str,
    initial_context: Optional[Dict[str, Any]] = None,
    session_service: VoiceSessionService = Depends(get_voice_session_service),
    user: dict = Depends(verify_token),
):
    """Create a new voice session"""
    try:
        result = session_service.create_session(user_id, session_type, initial_context)
        return result
    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create session: {str(e)}"
        )


@app.get("/api/sessions/{session_id}")
async def get_voice_session(
    session_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get voice session details"""
    try:
        result = supabase.table("voice_sessions").select("*").eq("id", session_id).single().execute()
        return result.data
    except Exception as e:
        print(f"Error fetching session: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch session: {str(e)}"
        )


@app.patch("/api/sessions/{session_id}")
async def update_voice_session(
    session_id: str,
    updates: Dict[str, Any],
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Update voice session (e.g., add context, mark complete)"""
    try:
        result = supabase.table("voice_sessions").update(updates).eq("id", session_id).execute()
        return result.data[0]
    except Exception as e:
        print(f"Error updating session: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update session: {str(e)}"
        )


@app.post("/api/sessions/{session_id}/end")
async def end_voice_session(
    session_id: str,
    session_service: VoiceSessionService = Depends(get_voice_session_service),
    user: dict = Depends(verify_token),
):
    """End a voice session"""
    try:
        result = session_service.end_session(session_id)
        return result
    except Exception as e:
        print(f"Error ending session: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to end session: {str(e)}"
        )


@app.get("/api/sessions/active/{user_id}")
async def get_active_sessions(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get active sessions for a user"""
    try:
        result = supabase.table("voice_sessions").select("*").eq(
            "user_id", user_id
        ).eq("status", "active").execute()
        return {"sessions": result.data}
    except Exception as e:
        print(f"Error fetching active sessions: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch active sessions: {str(e)}"
        )


# ============================================================================
# COACH-CLIENT INVITATION ENDPOINTS
# ============================================================================


@app.post("/api/invitations")
async def create_invitation(
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Create a coach-client invitation

    Coach sends invitation to client by email.
    Client must accept before coach can access their data.
    """
    try:
        coach_id = user["sub"]
        client_email = request.get("client_email")
        message = request.get("message")

        # Check if coach
        profile = supabase.table("user_profiles").select("user_type").eq(
            "user_id", coach_id
        ).single().execute()

        if not profile.data or profile.data.get("user_type") != "coach":
            raise HTTPException(status_code=403, detail="Only coaches can send invitations")

        # Create invitation
        invitation_data = {
            "coach_id": coach_id,
            "client_email": client_email,
            "status": "pending",
            "message": message,
        }

        result = supabase.table("coach_client_invitations").insert(
            invitation_data
        ).execute()

        return {"success": True, "invitation": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating invitation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create invitation: {str(e)}"
        )


@app.get("/api/invitations/sent")
async def get_sent_invitations(
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get invitations sent by coach"""
    try:
        coach_id = user["sub"]

        result = supabase.table("coach_client_invitations").select("*").eq(
            "coach_id", coach_id
        ).order("invited_at", desc=True).execute()

        return {"invitations": result.data}

    except Exception as e:
        print(f"Error fetching sent invitations: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch invitations: {str(e)}"
        )


@app.get("/api/invitations/received")
async def get_received_invitations(
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get invitations received by client"""
    try:
        user_id = user["sub"]

        # Get user email
        user_data = supabase.auth.get_user()
        user_email = user_data.user.email

        result = supabase.table("coach_client_invitations").select("*").or_(
            f"client_id.eq.{user_id},client_email.eq.{user_email}"
        ).order("invited_at", desc=True).execute()

        return {"invitations": result.data}

    except Exception as e:
        print(f"Error fetching received invitations: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch invitations: {str(e)}"
        )


@app.patch("/api/invitations/{invitation_id}")
async def update_invitation(
    invitation_id: str,
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Update invitation status (accept/decline)

    Client accepts or declines coach invitation.
    Accepting creates a client_assignment.
    """
    try:
        user_id = user["sub"]
        status = request.get("status")

        if status not in ["accepted", "declined"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        # Get invitation
        invitation = supabase.table("coach_client_invitations").select("*").eq(
            "id", invitation_id
        ).single().execute()

        if not invitation.data:
            raise HTTPException(status_code=404, detail="Invitation not found")

        # Verify user is the recipient
        user_data = supabase.auth.get_user()
        user_email = user_data.user.email

        if invitation.data["client_email"] != user_email:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Update invitation
        update_data = {
            "status": status,
            "client_id": user_id,
            "responded_at": datetime.utcnow().isoformat(),
        }

        result = supabase.table("coach_client_invitations").update(
            update_data
        ).eq("id", invitation_id).execute()

        return {"success": True, "invitation": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating invitation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update invitation: {str(e)}"
        )


@app.post("/api/assignments/{assignment_id}/revoke")
async def revoke_coach_access(
    assignment_id: str,
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Revoke coach access to client data

    Client can revoke coach access at any time.
    """
    try:
        user_id = user["sub"]
        reason = request.get("reason")

        # Get assignment
        assignment = supabase.table("client_assignments").select("*").eq(
            "id", assignment_id
        ).single().execute()

        if not assignment.data:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Verify user is the client
        if assignment.data["client_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Revoke access
        update_data = {
            "revoked_at": datetime.utcnow().isoformat(),
            "revoked_by": user_id,
            "revocation_reason": reason,
        }

        result = supabase.table("client_assignments").update(
            update_data
        ).eq("id", assignment_id).execute()

        return {"success": True, "assignment": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking access: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to revoke access: {str(e)}"
        )


# ============================================================================
# RUNNING SHOES ENDPOINTS
# ============================================================================

@app.post("/api/shoes")
async def add_shoe(
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Add a new running shoe to user's inventory"""
    try:
        user_id = user["sub"]

        # Validate required fields
        required_fields = ["brand", "model", "purchase_date"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        shoe_data = {
            "user_id": user_id,
            "brand": request["brand"],
            "model": request["model"],
            "purchase_date": request["purchase_date"],
            "replacement_threshold": request.get("replacement_threshold", 400),
            "notes": request.get("notes", ""),
            "is_active": True,
        }

        result = supabase.table("running_shoes").insert(shoe_data).execute()
        return {"success": True, "shoe": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding shoe: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add shoe: {str(e)}")


@app.get("/api/shoes")
async def list_shoes(
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """List all running shoes for the user"""
    try:
        user_id = user["sub"]

        result = supabase.table("running_shoes").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()

        return {"success": True, "shoes": result.data}

    except Exception as e:
        print(f"Error listing shoes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list shoes: {str(e)}")


@app.put("/api/shoes/{shoe_id}")
async def update_shoe(
    shoe_id: str,
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Update shoe details"""
    try:
        user_id = user["sub"]

        # Verify ownership
        shoe = supabase.table("running_shoes").select("*").eq(
            "id", shoe_id
        ).single().execute()

        if not shoe.data or shoe.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Update allowed fields
        update_data = {}
        allowed_fields = ["brand", "model", "replacement_threshold", "notes", "is_active", "retired_date"]
        for field in allowed_fields:
            if field in request:
                update_data[field] = request[field]

        result = supabase.table("running_shoes").update(update_data).eq(
            "id", shoe_id
        ).execute()

        return {"success": True, "shoe": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating shoe: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update shoe: {str(e)}")


@app.delete("/api/shoes/{shoe_id}")
async def delete_shoe(
    shoe_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Delete a running shoe"""
    try:
        user_id = user["sub"]

        # Verify ownership
        shoe = supabase.table("running_shoes").select("*").eq(
            "id", shoe_id
        ).single().execute()

        if not shoe.data or shoe.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        supabase.table("running_shoes").delete().eq("id", shoe_id).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting shoe: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete shoe: {str(e)}")


@app.get("/api/shoes/{shoe_id}/mileage")
async def get_shoe_mileage(
    shoe_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get mileage tracking for a specific shoe"""
    try:
        user_id = user["sub"]

        # Verify ownership
        shoe = supabase.table("running_shoes").select("*").eq(
            "id", shoe_id
        ).single().execute()

        if not shoe.data or shoe.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get all runs with this shoe
        runs = supabase.table("runs").select("*").eq(
            "shoe_id", shoe_id
        ).order("start_time", desc=True).execute()

        total_mileage = sum(run["distance"] / 1609.34 for run in runs.data) if runs.data else 0

        return {
            "success": True,
            "shoe_id": shoe_id,
            "total_mileage": round(total_mileage, 2),
            "run_count": len(runs.data) if runs.data else 0,
            "replacement_threshold": shoe.data["replacement_threshold"],
            "mileage_remaining": round(shoe.data["replacement_threshold"] - total_mileage, 2),
            "replacement_percentage": round((total_mileage / shoe.data["replacement_threshold"]) * 100, 1),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shoe mileage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get shoe mileage: {str(e)}")


@app.get("/api/shoes/{shoe_id}/analytics")
async def get_shoe_analytics(
    shoe_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """Get performance analytics for a specific shoe"""
    try:
        user_id = user["sub"]

        # Verify ownership
        shoe = supabase.table("running_shoes").select("*").eq(
            "id", shoe_id
        ).single().execute()

        if not shoe.data or shoe.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get all runs with this shoe
        runs = supabase.table("runs").select("*").eq(
            "shoe_id", shoe_id
        ).order("start_time", desc=True).execute()

        if not runs.data:
            return {
                "success": True,
                "shoe_id": shoe_id,
                "run_count": 0,
                "total_distance": 0,
                "total_duration": 0,
                "avg_pace": 0,
                "avg_speed": 0,
                "total_calories": 0,
            }

        total_distance = sum(run["distance"] / 1609.34 for run in runs.data)
        total_duration = sum(run["duration"] for run in runs.data)
        avg_pace = sum(run["pace"] for run in runs.data) / len(runs.data)
        avg_speed = sum(run["avg_speed"] for run in runs.data) / len(runs.data)
        total_calories = sum(run["calories"] for run in runs.data)

        return {
            "success": True,
            "shoe_id": shoe_id,
            "run_count": len(runs.data),
            "total_distance": round(total_distance, 2),
            "total_duration": total_duration,
            "avg_pace": round(avg_pace, 2),
            "avg_speed": round(avg_speed, 2),
            "total_calories": total_calories,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shoe analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get shoe analytics: {str(e)}")


# ============================================================================
# Health Intelligence Endpoints (Phase 1)
# ============================================================================

@app.get("/api/health-intelligence/correlations/{user_id}")
async def get_health_correlations(
    user_id: str,
    days: int = 30,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Discover correlations between nutrition, performance, recovery, and injuries.

    Args:
        user_id: User ID
        days: Number of days to analyze (default: 30)

    Returns:
        Discovered correlations with strength and interpretation
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        from health_intelligence_service import HealthIntelligenceService

        service = HealthIntelligenceService(supabase)
        correlations = service.discover_correlations(user_id, days=days)

        return correlations
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error discovering correlations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to discover correlations: {str(e)}")


@app.get("/api/health-intelligence/injury-risk/{user_id}")
async def predict_injury_risk(
    user_id: str,
    days: int = 30,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Predict injury risk based on training load, recovery, and historical patterns.

    Args:
        user_id: User ID
        days: Number of days to analyze (default: 30)

    Returns:
        Injury risk prediction with factors and recommendations
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        from health_intelligence_service import HealthIntelligenceService

        service = HealthIntelligenceService(supabase)
        prediction = service.predict_injury_risk(user_id, days=days)

        return prediction
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error predicting injury risk: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to predict injury risk: {str(e)}")


@app.get("/api/health-intelligence/performance/{user_id}")
async def predict_performance(
    user_id: str,
    days: int = 30,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Predict workout performance based on recovery, nutrition, and sleep.

    Args:
        user_id: User ID
        days: Number of days to analyze (default: 30)

    Returns:
        Performance prediction with readiness score and recommendations
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        from health_intelligence_service import HealthIntelligenceService

        service = HealthIntelligenceService(supabase)
        prediction = service.predict_performance(user_id, days=days)

        return prediction
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error predicting performance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to predict performance: {str(e)}")


@app.get("/api/health-intelligence/insights/{user_id}")
async def get_personalized_insights(
    user_id: str,
    days: int = 30,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Generate personalized insights and recommendations based on all health data.

    Args:
        user_id: User ID
        days: Number of days to analyze (default: 30)

    Returns:
        Personalized insights with actionable recommendations
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        from health_intelligence_service import HealthIntelligenceService

        service = HealthIntelligenceService(supabase)
        insights = service.generate_personalized_insights(user_id, days=days)

        return insights
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@app.get("/api/health-intelligence/weekly-summary/{user_id}")
async def get_weekly_summary(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Generate a weekly summary of health metrics and recommendations.

    Args:
        user_id: User ID

    Returns:
        Weekly summary with key metrics and trends
    """
    try:
        # Verify access
        if user["id"] != user_id:
            coach_check = supabase.table("client_assignments").select("id").eq(
                "coach_id", user["id"]
            ).eq("client_id", user_id).is_("revoked_at", "null").execute()

            if not coach_check.data:
                raise HTTPException(status_code=403, detail="Access denied")

        from health_intelligence_service import HealthIntelligenceService

        service = HealthIntelligenceService(supabase)
        summary = service.get_weekly_summary(user_id)

        return summary
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating weekly summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate weekly summary: {str(e)}")


# ============================================================================
# STRYD INTEGRATION ENDPOINTS
# ============================================================================


def get_stryd_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for Stryd service"""
    from stryd_service import StrydService
    return StrydService(supabase)


@app.get("/api/stryd/oauth-url")
async def get_stryd_oauth_url(
    state: str,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Get Stryd OAuth authorization URL"""
    try:
        url = service.get_oauth_url(state)
        return {"success": True, "oauth_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get OAuth URL: {str(e)}")


@app.post("/api/stryd/exchange-code")
async def exchange_stryd_code(
    code: str,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Exchange authorization code for access token"""
    try:
        result = service.exchange_code_for_token(code)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        # Store token in database
        supabase = Depends(get_supabase_client)
        supabase.table("wearable_connections").insert({
            "user_id": user["sub"],
            "provider": "stryd",
            "access_token": result.get("access_token"),
            "refresh_token": result.get("refresh_token"),
            "expires_at": result.get("expires_in"),
        }).execute()

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to exchange code: {str(e)}")


@app.get("/api/stryd/power-data")
async def get_stryd_power_data(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Fetch power data from Stryd"""
    try:
        # Get access token from database
        conn_result = supabase.table("wearable_connections").select("access_token").eq(
            "user_id", user["sub"]
        ).eq("provider", "stryd").single().execute()

        access_token = conn_result.data.get("access_token") if conn_result.data else None
        if not access_token:
            raise HTTPException(status_code=401, detail="Stryd not connected")

        result = service.get_power_data(user["sub"], access_token, start_date, end_date)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch power data: {str(e)}")


@app.get("/api/stryd/mechanics/{activity_id}")
async def analyze_stryd_mechanics(
    activity_id: str,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Analyze running mechanics from power data"""
    try:
        # Get access token
        conn_result = supabase.table("wearable_connections").select("access_token").eq(
            "user_id", user["sub"]
        ).eq("provider", "stryd").single().execute()

        access_token = conn_result.data.get("access_token") if conn_result.data else None
        if not access_token:
            raise HTTPException(status_code=401, detail="Stryd not connected")

        result = service.analyze_running_mechanics(user["sub"], activity_id, access_token)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze mechanics: {str(e)}")


@app.get("/api/stryd/shoe-correlation/{activity_id}")
async def get_shoe_power_correlation(
    activity_id: str,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Correlate power data with shoe selection"""
    try:
        result = service.correlate_with_shoe_and_surface(user["sub"], activity_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to correlate data: {str(e)}")


@app.get("/api/stryd/training-load")
async def get_stryd_training_load(
    days: int = 7,
    service = Depends(get_stryd_service),
    user: dict = Depends(verify_token),
):
    """Get training load analysis"""
    try:
        result = service.get_training_load_analysis(user["sub"], days)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze training load: {str(e)}")


# ============================================================================
# RACE DAY PLAN GENERATOR ENDPOINTS
# ============================================================================


def get_race_day_plan_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for Race Day Plan service"""
    from race_day_plan_service import RaceDayPlanService
    return RaceDayPlanService(supabase)


@app.post("/api/race-day/generate-plan")
async def generate_race_plan(
    race_name: str,
    race_type: str,
    distance_km: float,
    elevation_gain_m: int,
    weather_forecast: Optional[Dict[str, Any]] = None,
    user_pr: Optional[float] = None,
    service = Depends(get_race_day_plan_service),
    user: dict = Depends(verify_token),
):
    """Generate personalized race day plan"""
    try:
        result = service.generate_race_plan(
            user["sub"], race_name, race_type, distance_km, elevation_gain_m,
            weather_forecast, user_pr
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")


@app.post("/api/race-day/analyze-terrain")
async def analyze_terrain(
    race_name: str,
    elevation_profile: Optional[List[Dict[str, Any]]] = None,
    service = Depends(get_race_day_plan_service),
    user: dict = Depends(verify_token),
):
    """Analyze race terrain"""
    try:
        result = service.analyze_terrain(race_name, elevation_profile)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze terrain: {str(e)}")


@app.get("/api/race-day/nutrition-strategy")
async def get_nutrition_strategy(
    race_type: str,
    distance_km: float,
    weather_temp: Optional[float] = None,
    service = Depends(get_race_day_plan_service),
    user: dict = Depends(verify_token),
):
    """Get nutrition and hydration strategy"""
    try:
        result = service.get_nutrition_strategy(race_type, distance_km, weather_temp)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get strategy: {str(e)}")


# ============================================================================
# VOICE-FIRST ENHANCEMENTS ENDPOINTS
# ============================================================================


def get_voice_first_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for Voice-First service"""
    from voice_first_service import VoiceFirstService
    return VoiceFirstService(supabase)


@app.post("/api/voice/process-command")
async def process_voice_command(
    command: str,
    context: Optional[Dict[str, Any]] = None,
    service = Depends(get_voice_first_service),
    user: dict = Depends(verify_token),
):
    """Process voice command for exercise swap or modification"""
    try:
        result = service.process_voice_command(user["sub"], command, context)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process command: {str(e)}")


@app.get("/api/voice/form-cue/{exercise}")
async def get_form_cue(
    exercise: str,
    focus_area: Optional[str] = None,
    service = Depends(get_voice_first_service),
    user: dict = Depends(verify_token),
):
    """Get voice-activated form cue for an exercise"""
    try:
        result = service.get_form_cue(exercise, focus_area)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get form cue: {str(e)}")


@app.post("/api/voice/modify-program")
async def modify_program_by_voice(
    program_id: str,
    modification_request: str,
    service = Depends(get_voice_first_service),
    user: dict = Depends(verify_token),
):
    """Generate program modification based on conversational request"""
    try:
        result = service.generate_conversational_modification(
            user["sub"], program_id, modification_request
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to modify program: {str(e)}")


@app.get("/api/voice/shortcuts")
async def get_voice_shortcuts(
    service = Depends(get_voice_first_service),
    user: dict = Depends(verify_token),
):
    """Get available voice shortcuts"""
    try:
        result = service.get_voice_shortcuts()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch shortcuts: {str(e)}")


# ============================================================================
# HYBRID ATHLETE TRAINING ENDPOINTS
# ============================================================================


def get_hybrid_athlete_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for Hybrid Athlete service"""
    from hybrid_athlete_service import HybridAthleteService
    return HybridAthleteService(supabase)


@app.post("/api/hybrid-athlete/generate-program")
async def generate_hybrid_program(
    primary_goal: str,
    secondary_goal: str,
    duration_weeks: int = 12,
    service = Depends(get_hybrid_athlete_service),
    user: dict = Depends(verify_token),
):
    """Generate a hybrid athlete training program"""
    try:
        result = service.generate_hybrid_program(
            user["sub"], primary_goal, secondary_goal, duration_weeks
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate program: {str(e)}")


@app.get("/api/hybrid-athlete/interference-mitigation")
async def get_interference_mitigation(
    primary_goal: str,
    secondary_goal: str,
    service = Depends(get_hybrid_athlete_service),
    user: dict = Depends(verify_token),
):
    """Get interference mitigation strategies"""
    try:
        result = service.get_interference_mitigation(primary_goal, secondary_goal)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")


@app.get("/api/hybrid-athlete/recovery-protocol")
async def get_recovery_protocol(
    primary_goal: str,
    secondary_goal: str,
    service = Depends(get_hybrid_athlete_service),
    user: dict = Depends(verify_token),
):
    """Get recovery protocol for hybrid training"""
    try:
        result = service.get_recovery_protocol(primary_goal, secondary_goal)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch protocol: {str(e)}")


# ============================================================================
# SPORT-SPECIFIC TRAINING ENDPOINTS
# ============================================================================


def get_sport_specific_training_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for Sport-Specific Training service"""
    from sport_specific_training_service import SportSpecificTrainingService
    return SportSpecificTrainingService(supabase)


@app.post("/api/sport-training/generate-program")
async def generate_sport_program(
    sport: str,
    position: Optional[str] = None,
    season: str = "off-season",
    duration_weeks: int = 12,
    service = Depends(get_sport_specific_training_service),
    user: dict = Depends(verify_token),
):
    """Generate a sport-specific training program"""
    try:
        result = service.generate_program(
            user["sub"], sport, position, season, duration_weeks
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate program: {str(e)}")


@app.get("/api/sport-training/positions/{sport}")
async def get_sport_positions(
    sport: str,
    service = Depends(get_sport_specific_training_service),
    user: dict = Depends(verify_token),
):
    """Get position-specific variations for a sport"""
    try:
        result = service.get_position_variations(sport)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch positions: {str(e)}")


@app.get("/api/sport-training/periodization/{sport}")
async def get_sport_periodization(
    sport: str,
    duration_weeks: int = 52,
    service = Depends(get_sport_specific_training_service),
    user: dict = Depends(verify_token),
):
    """Get season periodization plan for a sport"""
    try:
        result = service.get_season_periodization(sport, duration_weeks)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch periodization: {str(e)}")


# ============================================================================
# CROSSFIT WOD MODIFICATION ENDPOINTS
# ============================================================================


def get_crossfit_wod_service(supabase: Client = Depends(get_supabase_client)):
    """Dependency injection for CrossFit WOD service"""
    from crossfit_wod_service import CrossFitWODService
    return CrossFitWODService(supabase)


@app.post("/api/crossfit/parse-wod")
async def parse_wod(
    wod_text: str,
    wod_service = Depends(get_crossfit_wod_service),
    user: dict = Depends(verify_token),
):
    """Parse CrossFit WOD text to extract structure"""
    try:
        result = wod_service.parse_wod(wod_text)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse WOD: {str(e)}")


@app.post("/api/crossfit/modify-wod")
async def modify_wod(
    wod_text: str,
    user_id: str,
    wod_service = Depends(get_crossfit_wod_service),
    user: dict = Depends(verify_token),
):
    """Generate WOD modifications based on user's injuries and limitations"""
    try:
        # Verify user can only modify their own WOD
        if user["sub"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        result = wod_service.generate_modifications(user_id, wod_text)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to modify WOD: {str(e)}")


@app.post("/api/crossfit/suggest-substitution")
async def suggest_substitution(
    movement: str,
    reason: str,
    wod_service = Depends(get_crossfit_wod_service),
    user: dict = Depends(verify_token),
):
    """Suggest exercise substitutions for a movement"""
    try:
        result = wod_service.suggest_substitutions(movement, reason)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to suggest substitutions: {str(e)}")


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
