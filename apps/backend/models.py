"""
Pydantic models for API request/response validation
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PreviousSet(BaseModel):
    """Previous set data for context"""

    exercise_id: Optional[str] = None
    exercise_name: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "lbs"
    reps: Optional[int] = None
    rpe: Optional[int] = None


class VoiceParseRequest(BaseModel):
    """Request model for voice parsing endpoint"""

    transcript: str = Field(..., description="Voice transcript to parse", min_length=1)
    user_id: str = Field(..., description="User ID for session management")
    previous_set: Optional[PreviousSet] = Field(
        None, description="Previous set for 'same weight' handling"
    )
    auto_save: bool = Field(
        False, description="Automatically save high-confidence sets to database"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "Bench press, 225 pounds for 8 reps at RPE 8",
                "user_id": "user_123",
                "previous_set": {"weight": 225, "weight_unit": "lbs", "reps": 10},
                "auto_save": True,
            }
        }


class ParsedWorkoutData(BaseModel):
    """Parsed workout data"""

    exercise_id: Optional[str] = None
    exercise_name: Optional[str] = None
    exercise_match_score: Optional[float] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "lbs"
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rpe: Optional[int] = None
    rir: Optional[int] = None
    tempo: Optional[str] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    confidence: Optional[float] = None


class SessionContext(BaseModel):
    """Session context information"""

    session_id: str
    set_number: int
    is_exercise_switch: Optional[bool] = False
    edge_case_handled: Optional[bool] = False
    total_sets_in_session: int


class VoiceParseResponse(BaseModel):
    """Response model for voice parsing endpoint"""

    success: bool
    action: str = Field(
        ...,
        description="Action to take: auto_accept, needs_confirmation, needs_clarification",
    )
    confidence: float
    data: ParsedWorkoutData
    transcript: str
    same_weight_detected: bool = False
    session_context: Optional[SessionContext] = None
    edge_case: Optional[str] = None
    message: Optional[str] = None
    saved: Optional[bool] = None
    save_error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "action": "auto_accept",
                "confidence": 0.92,
                "data": {
                    "exercise_id": "bench-press-uuid",
                    "exercise_name": "Bench Press",
                    "exercise_match_score": 95.0,
                    "weight": 225,
                    "weight_unit": "lbs",
                    "reps": 8,
                    "rpe": 8,
                    "confidence": 0.92,
                },
                "transcript": "Bench press, 225 pounds for 8 reps at RPE 8",
                "same_weight_detected": False,
                "session_context": {
                    "session_id": "session_user_123_1762191736",
                    "set_number": 1,
                    "is_exercise_switch": False,
                    "edge_case_handled": False,
                    "total_sets_in_session": 1,
                },
                "saved": True,
            }
        }


class SessionSummaryResponse(BaseModel):
    """Response model for session summary endpoint"""

    session_id: str
    started_at: str
    total_sets: int
    current_exercise: Optional[Dict[str, Any]] = None
    exercises_count: int


class EndSessionResponse(BaseModel):
    """Response model for end session endpoint"""

    session_id: str
    user_id: str
    started_at: str
    ended_at: str
    total_sets: int
    exercises_count: int
    exercises: List[Dict[str, Any]]


class VoiceLogRequest(BaseModel):
    """Request model for voice logging endpoint"""

    voice_input: str = Field(
        ..., description="Voice input to parse and log", min_length=1
    )
    user_id: str = Field(..., description="User ID")
    workout_id: Optional[str] = Field(
        None, description="Workout log ID to associate sets with"
    )
    timestamp: Optional[str] = Field(None, description="Timestamp of the voice input")

    class Config:
        json_schema_extra = {
            "example": {
                "voice_input": "Bench press 185 for 8 reps",
                "user_id": "user_123",
                "workout_id": "workout_456",
            }
        }


class VoiceLogResponse(BaseModel):
    """Response model for voice logging endpoint"""

    success: bool
    workout_log_id: Optional[str] = None
    set_ids: Optional[List[str]] = None
    parsed_data: Optional[ParsedWorkoutData] = None
    message: Optional[str] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "workout_log_id": "workout_456",
                "set_ids": ["set_789", "set_790"],
                "parsed_data": {
                    "exercise_name": "Bench Press",
                    "weight": 185,
                    "reps": 8,
                },
                "message": "Successfully logged workout",
            }
        }


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""

    status: str
    version: str
    model_id: str
    supabase_connected: bool


class ErrorResponse(BaseModel):
    """Error response model"""

    success: bool = False
    error: str
    detail: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Invalid request",
                "detail": "Transcript cannot be empty",
            }
        }


class CoachQuestionRequest(BaseModel):
    """Request model for AI Coach endpoint"""

    user_id: str = Field(..., description="User ID for personalized context")
    question: str = Field(
        ..., description="User's question to the AI Coach", min_length=1, max_length=500
    )
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        None, description="Previous conversation messages"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "question": "How do I get bigger arms?",
                "conversation_history": [
                    {"role": "user", "content": "What's the best rep range?"},
                    {
                        "role": "assistant",
                        "content": "6-12 reps is optimal for hypertrophy.",
                    },
                ],
            }
        }


class CoachQuestionResponse(BaseModel):
    """Response model for AI Coach endpoint"""

    answer: str = Field(..., description="AI Coach's response")
    confidence: float = Field(
        ..., description="Confidence score (0.0-1.0)", ge=0.0, le=1.0
    )
    sources: List[str] = Field(
        default_factory=list, description="Knowledge base sources used"
    )
    latency_ms: int = Field(..., description="Total response latency in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "To build bigger arms, focus on both biceps and triceps with 12-20 sets per week...",
                "confidence": 0.92,
                "sources": ["hypertrophy", "strength-training"],
                "latency_ms": 2058,
            }
        }


class ProgramGenerationRequest(BaseModel):
    """Request model for program generation endpoint"""

    questionnaire: Dict[str, Any] = Field(
        ..., description="User's training questionnaire data"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "questionnaire": {
                    "primary_goal": "strength",
                    "secondary_goals": ["hypertrophy"],
                    "training_experience": "advanced",
                    "training_age_years": 6,
                    "weekly_frequency": 5,
                    "session_duration": 90,
                    "program_duration": 12,
                    "current_lifts": {
                        "squat": {"weight": 405, "reps": 5},
                        "bench": {"weight": 315, "reps": 5},
                        "deadlift": {"weight": 495, "reps": 5},
                        "overhead_press": {"weight": 185, "reps": 5},
                    },
                    "body_part_emphasis": {
                        "back": "high",
                        "legs": "high",
                        "chest": "medium",
                        "shoulders": "medium",
                        "arms": "low",
                    },
                    "recovery_capacity": "high",
                    "preferences": {
                        "training_split": "upper_lower",
                        "periodization": "block",
                        "deload_frequency": "every_4_weeks",
                    },
                }
            }
        }


class ProgramGenerationResponse(BaseModel):
    """Response model for program generation endpoint"""

    program: Dict[str, Any] = Field(
        ..., description="Complete 12-week training program"
    )
    cost: Dict[str, Any] = Field(..., description="Cost breakdown for generation")
    stats: Dict[str, Any] = Field(
        ..., description="Optimization statistics (int or float values)"
    )
    generation_time_seconds: float = Field(
        ..., description="Time taken to generate program"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "program": {
                    "program_name": "Advanced Upper/Lower Strength Block",
                    "total_weeks": 12,
                    "weeks": [],
                },
                "cost": {
                    "input_tokens": 24992,
                    "output_tokens": 21058,
                    "input_cost": 0.062,
                    "output_cost": 0.211,
                    "total_cost": 0.273,
                },
                "stats": {
                    "total_retrieved": 105,
                    "filtered_by_similarity": 31,
                    "duplicates_removed": 10,
                    "final_unique_chunks": 64,
                },
                "generation_time_seconds": 121.8,
            }
        }


class RunningParseRequest(BaseModel):
    """Request model for running workout parsing endpoint"""

    user_id: str = Field(..., description="User ID")
    distance: float = Field(..., description="Distance in kilometers or miles", gt=0)
    distance_unit: str = Field("km", description="Distance unit: 'km' or 'miles'")
    duration_seconds: int = Field(..., description="Duration in seconds", gt=0)
    latitude: Optional[float] = Field(
        None, description="Starting latitude for weather data"
    )
    longitude: Optional[float] = Field(
        None, description="Starting longitude for weather data"
    )
    elevation_gain: Optional[float] = Field(0, description="Elevation gain in meters")
    elevation_loss: Optional[float] = Field(0, description="Elevation loss in meters")
    route: Optional[List[Dict[str, Any]]] = Field(None, description="GPS route data")
    notes: Optional[str] = Field(None, description="Run notes")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "distance": 5.0,
                "distance_unit": "km",
                "duration_seconds": 1800,
                "latitude": 37.7749,
                "longitude": -122.4194,
                "elevation_gain": 150,
                "elevation_loss": 145,
                "notes": "Morning run, felt great",
            }
        }


class RunningParseResponse(BaseModel):
    """Response model for running workout parsing endpoint"""

    success: bool
    run_id: str = Field(..., description="Created run ID")
    pace: float = Field(..., description="Pace in min/km or min/mile")
    pace_formatted: str = Field(..., description="Formatted pace (e.g., '5:30/km')")
    gap: Optional[float] = Field(None, description="Grade-adjusted pace")
    gap_formatted: Optional[str] = Field(None, description="Formatted GAP")
    weather_data: Optional[Dict[str, Any]] = Field(
        None, description="Weather conditions"
    )
    elevation_data: Optional[Dict[str, Any]] = Field(
        None, description="Elevation and GAP data"
    )
    message: str = Field(..., description="Confirmation message")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "run_id": "run_uuid_123",
                "pace": 5.5,
                "pace_formatted": "5:30/km",
                "gap": 5.2,
                "gap_formatted": "5:12/km",
                "weather_data": {
                    "temperature_f": 72.5,
                    "humidity": 65,
                    "conditions": "Clear",
                },
                "elevation_data": {
                    "elevation_gain": 150,
                    "grade_percent": 2.3,
                    "difficulty": "moderate_uphill",
                },
                "message": "Run logged! 5.0 km in 30:00 (5:30/km pace, 5:12/km GAP). Clear skies, 72°F.",
            }
        }


class RunningAnalyzeRequest(BaseModel):
    """Request model for running analysis endpoint"""

    user_id: str = Field(..., description="User ID")
    run_id: str = Field(..., description="Run ID to analyze")

    class Config:
        json_schema_extra = {
            "example": {"user_id": "user_123", "run_id": "run_uuid_123"}
        }


class RunningAnalyzeResponse(BaseModel):
    """Response model for running analysis endpoint"""

    run_summary: Dict[str, Any] = Field(..., description="Run summary data")
    weather_impact: Dict[str, Any] = Field(..., description="Weather impact analysis")
    elevation_analysis: Dict[str, Any] = Field(
        ..., description="Elevation and GAP analysis"
    )
    performance_insights: str = Field(
        ..., description="AI-generated performance insights"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Training recommendations"
    )
    comparison_to_recent_runs: Optional[Dict[str, Any]] = Field(
        None, description="Comparison to recent similar runs"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "run_summary": {
                    "distance": 5.0,
                    "duration": 1800,
                    "pace": 5.5,
                    "gap": 5.2,
                },
                "weather_impact": {
                    "temperature_impact": "moderate",
                    "overall_difficulty": "moderate",
                    "estimated_pace_slowdown_percent": 3.5,
                },
                "elevation_analysis": {
                    "grade_percent": 2.3,
                    "difficulty": "moderate_uphill",
                    "adjustment_percent": 7.5,
                },
                "performance_insights": "Great effort on this hilly run! Your GAP of 5:12/km shows...",
                "recommendations": [
                    "Consider hydration for warmer runs",
                    "Your uphill running is improving",
                ],
            }
        }


class WorkoutInsightsRequest(BaseModel):
    """Request model for workout insights endpoint"""

    user_id: str = Field(..., description="User ID")
    workout_id: str = Field(..., description="Workout ID to analyze")

    class Config:
        json_schema_extra = {
            "example": {"user_id": "user_123", "workout_id": "workout_uuid_123"}
        }


class VolumeAnalyticsResponse(BaseModel):
    """Response model for volume analytics endpoint"""

    weekly_volume: Dict[str, Any] = Field(..., description="Current week volume data")
    monthly_volume: Dict[str, Any] = Field(..., description="Current month volume data")
    volume_trend: Dict[str, Any] = Field(
        ..., description="Volume trend over multiple weeks"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "weekly_volume": {
                    "week_start": "2024-01-15",
                    "week_end": "2024-01-21",
                    "total_sets": 120,
                    "total_workouts": 5,
                    "volume_by_muscle": {
                        "chest": {"sets": 24, "total_reps": 192, "volume_load": 45600}
                    },
                },
                "monthly_volume": {
                    "month": "2024-01",
                    "total_sets": 480,
                    "total_workouts": 20,
                },
                "volume_trend": {"trend": "increasing", "avg_weekly_sets": 118.5},
            }
        }


class FatigueAnalyticsResponse(BaseModel):
    """Response model for fatigue analytics endpoint"""

    current_fatigue: Dict[str, Any] = Field(
        ..., description="Current fatigue assessment"
    )
    fatigue_history: Dict[str, Any] = Field(
        ..., description="Fatigue history over multiple weeks"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "current_fatigue": {
                    "fatigue_level": "moderate",
                    "fatigue_score": 45.0,
                    "recovery_recommendation": "continue",
                    "days_until_recovery": 2,
                },
                "fatigue_history": {
                    "weeks": [
                        {
                            "week_start": "2024-01-01",
                            "fatigue_level": "low",
                            "fatigue_score": 20.0,
                        }
                    ]
                },
            }
        }


class DeloadRecommendationResponse(BaseModel):
    """Response model for deload recommendation endpoint"""

    deload_needed: bool = Field(..., description="Whether deload is needed")
    deload_type: Optional[str] = Field(
        None, description="Type of deload: programmed or auto_regulation"
    )
    reason: str = Field(..., description="Reason for recommendation")
    confidence: str = Field(..., description="Confidence level: high, medium, low")
    requires_approval: bool = Field(
        ..., description="Whether user approval is required"
    )
    indicators: Dict[str, Any] = Field(..., description="Fatigue and volume indicators")
    recommendation: Optional[str] = Field(
        None, description="Specific deload recommendation"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "deload_needed": True,
                "deload_type": "auto_regulation",
                "reason": "High fatigue detected (75/100) after 4 weeks of training",
                "confidence": "high",
                "requires_approval": True,
                "indicators": {
                    "fatigue_level": "high",
                    "fatigue_score": 75.0,
                    "weeks_since_deload": 4,
                },
                "recommendation": "Take a moderate deload: 50% volume reduction, maintain intensity",
            }
        }


class WorkoutInsightsResponse(BaseModel):
    """Response model for workout insights endpoint"""

    workout_summary: Dict[str, Any] = Field(..., description="Workout summary data")
    volume_analysis: Dict[str, Any] = Field(
        ..., description="Volume analysis by muscle group"
    )
    intensity_analysis: Dict[str, Any] = Field(
        ..., description="Intensity and RPE analysis"
    )
    muscle_group_balance: Dict[str, Any] = Field(
        ..., description="Muscle group balance assessment"
    )
    fatigue_indicators: Dict[str, Any] = Field(
        ..., description="Fatigue and recovery indicators"
    )
    performance_insights: str = Field(
        ..., description="AI-generated performance insights"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Training recommendations"
    )
    comparison_to_recent_workouts: Optional[Dict[str, Any]] = Field(
        None, description="Comparison to recent similar workouts"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "workout_summary": {
                    "total_sets": 24,
                    "total_exercises": 6,
                    "duration_minutes": 75,
                    "avg_rpe": 7.5,
                },
                "volume_analysis": {
                    "chest": {"sets": 8, "total_reps": 64},
                    "back": {"sets": 8, "total_reps": 72},
                    "shoulders": {"sets": 4, "total_reps": 36},
                },
                "intensity_analysis": {
                    "avg_rpe": 7.5,
                    "high_intensity_sets": 8,
                    "working_sets": 20,
                    "warmup_sets": 4,
                },
                "muscle_group_balance": {
                    "push_pull_ratio": 1.0,
                    "upper_lower_ratio": 2.0,
                    "balanced": True,
                },
                "fatigue_indicators": {
                    "high_rpe_percentage": 33,
                    "estimated_fatigue_level": "moderate",
                    "recovery_recommendation": "24-48 hours",
                },
                "performance_insights": "Excellent push/pull balance today! Your RPE management was spot-on...",
                "recommendations": [
                    "Consider adding leg work to balance upper/lower split",
                    "Your chest volume is on track with your program",
                ],
            }
        }


class AdherenceCheckInRequest(BaseModel):
    """Request model for adherence check-in endpoint"""

    user_id: str = Field(..., description="User ID")
    flag_id: str = Field(..., description="Flag ID to respond to")
    response_type: str = Field(
        ...,
        description="Response type: injury, time_constraint, equipment, motivation, fine, change_program",
    )
    injury_details: Optional[Dict[str, Any]] = Field(
        None, description="Injury details if response_type is 'injury'"
    )
    details: Optional[str] = Field(
        None, description="Additional details about the response"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "flag_id": "flag_456",
                "response_type": "motivation",
                "details": "Been feeling unmotivated lately, need to get back on track",
            }
        }


class AdherenceCheckInResponse(BaseModel):
    """Response model for adherence check-in endpoint"""

    success: bool
    message: str = Field(..., description="Response message")
    adjustment_plan: Optional[Dict[str, Any]] = Field(
        None, description="Suggested adjustment plan"
    )
    plan_created: bool = Field(False, description="Whether adjustment plan was created")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Thanks for the feedback! I've created a gradual 4-week plan to get you back on track.",
                "adjustment_plan": {
                    "muscle_group": "chest",
                    "current_weekly_sets": 10,
                    "target_weekly_sets": 16,
                    "weekly_increment": 2,
                    "duration_weeks": 4,
                    "weekly_targets": [12, 14, 16, 16],
                },
                "plan_created": True,
            }
        }


class AdherenceReportResponse(BaseModel):
    """Response model for adherence report endpoint"""

    user_id: str
    check_date: str
    adherence: Dict[str, Any] = Field(
        ..., description="Adherence data (actual vs target volume)"
    )
    flags: Dict[str, Any] = Field(
        ..., description="Flag status (created, updated, resolved, alerts)"
    )
    imbalance_risks: List[Dict[str, Any]] = Field(
        default_factory=list, description="Detected imbalance risks"
    )
    needs_user_action: bool = Field(
        ..., description="Whether user needs to take action"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "check_date": "2025-01-11T12:00:00Z",
                "adherence": {
                    "actual_volume": {"chest": 10, "back": 18, "legs": 20},
                    "target_volume": {"chest": 16, "back": 18, "legs": 20},
                    "variance": {"chest": -37.5, "back": 0.0, "legs": 0.0},
                },
                "flags": {
                    "created": [],
                    "updated": [],
                    "resolved": [],
                    "alerts_to_send": [
                        {
                            "muscle_group": "chest",
                            "priority": "high",
                            "target_weekly_sets": 16,
                            "actual_weekly_sets": 10,
                            "variance_percentage": -37.5,
                        }
                    ],
                },
                "imbalance_risks": [],
                "needs_user_action": True,
            }
        }


# ============================================================================
# CHAT CLASSIFICATION MODELS (UI Redesign)
# ============================================================================


class ChatClassifyRequest(BaseModel):
    """Request model for chat message classification"""

    message: str = Field(..., description="User's chat message", min_length=1)
    user_id: str = Field(..., description="User ID for context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        None, description="Recent conversation history for context"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "185 for 8",
                "user_id": "user_123",
                "conversation_history": [
                    {"role": "ai", "content": "Great! What exercise are you doing?"},
                    {"role": "user", "content": "Bench press"},
                ],
            }
        }


class ChatClassifyResponse(BaseModel):
    """Response model for chat message classification"""

    message_type: str = Field(
        ...,
        description="Classified message type: workout_log, exercise_swap, question, general, onboarding",
    )
    confidence: float = Field(..., description="Classification confidence (0.0-1.0)")
    reasoning: Optional[str] = Field(None, description="Explanation of classification")
    suggested_action: Optional[str] = Field(
        None, description="Suggested next action for the UI"
    )
    extracted_data: Optional[Dict[str, Any]] = Field(
        None, description="Extracted data (e.g., exercise name for swaps)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message_type": "workout_log",
                "confidence": 0.92,
                "reasoning": "User is logging weight and reps",
                "suggested_action": "parse_with_kimi",
                "extracted_data": None,
            }
        }


class ExerciseSwapRequest(BaseModel):
    """Request model for exercise swap from chat"""

    exercise_name: str = Field(..., description="Name of exercise to swap")
    reason: Optional[str] = Field(
        None, description="Reason for swap (e.g., 'shoulder pain', 'no equipment')"
    )
    injured_body_part: Optional[str] = Field(
        None, description="Injured body part to avoid stress on"
    )
    show_more: Optional[bool] = Field(False, description="Show more than 3 results")

    class Config:
        json_schema_extra = {
            "example": {
                "exercise_name": "Bench Press",
                "reason": "shoulder pain",
                "injured_body_part": "shoulder",
                "show_more": False,
            }
        }


class ExerciseSwapResponse(BaseModel):
    """Response model for exercise swap from chat"""

    original_exercise: str = Field(..., description="Original exercise being swapped")
    substitutes: List[Dict[str, Any]] = Field(
        ..., description="List of substitute exercises with details"
    )
    total_found: int = Field(..., description="Total substitutes found")
    reason_for_swap: Optional[str] = Field(None, description="Reason for swap")
    injured_body_part: Optional[str] = Field(
        None, description="Body part being protected"
    )
    message: str = Field(..., description="Contextual message to display")
    show_more_available: Optional[bool] = Field(
        False, description="Whether more results are available"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "original_exercise": "Bench Press",
                "substitutes": [
                    {
                        "id": "1",
                        "substitute_name": "Floor Press",
                        "similarity_score": 0.92,
                        "why_recommended": "92% similar • Reduces shoulder stress",
                        "subtitle": "Horizontal Press • Barbell",
                        "movement_pattern": "Horizontal Press",
                        "primary_muscles": "Chest, Triceps, Shoulders",
                        "equipment_required": "Barbell",
                        "difficulty_level": "Intermediate",
                        "reduced_stress_area": "shoulder",
                        "notes": "EMG studies show similar chest activation",
                    }
                ],
                "total_found": 5,
                "reason_for_swap": "shoulder pain",
                "injured_body_part": "shoulder",
                "message": "Here are 3 alternatives that reduce stress on your shoulder:",
                "show_more_available": True,
            }
        }


# ============================================================================
# ONBOARDING MODELS
# ============================================================================


class OnboardingExtractRequest(BaseModel):
    """Request model for onboarding data extraction endpoint"""

    message: str = Field(..., description="User's message", min_length=1)
    current_step: str = Field(..., description="Current onboarding step")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        None, description="Previous conversation messages"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "I've been lifting for about 2 years, mostly focusing on getting stronger",
                "current_step": "experience_level",
                "conversation_history": [
                    {
                        "role": "assistant",
                        "content": "Welcome! Let's get started. How long have you been training?",
                    },
                    {"role": "user", "content": "I've been lifting for about 2 years"},
                ],
            }
        }


class OnboardingExtractResponse(BaseModel):
    """Response model for onboarding data extraction endpoint"""

    experience_level: Optional[str] = None
    training_goals: Optional[List[str]] = None
    available_equipment: Optional[List[str]] = None
    training_frequency: Optional[int] = None
    injury_history: Optional[str] = None
    next_step: str

    class Config:
        json_schema_extra = {
            "example": {
                "experience_level": "intermediate",
                "training_goals": ["strength", "hypertrophy"],
                "available_equipment": None,
                "training_frequency": None,
                "injury_history": None,
                "next_step": "available_equipment",
            }
        }


class OnboardingConversationalRequest(BaseModel):
    """Request model for generating conversational onboarding responses"""

    current_step: str = Field(..., description="Current onboarding step")
    user_context: Dict[str, Any] = Field(
        ..., description="User's context (experience_level, goals, etc.)"
    )
    previous_answer: Optional[str] = Field(
        None, description="User's previous response to acknowledge"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "current_step": "training_goals",
                "user_context": {
                    "experience_level": "intermediate",
                    "user_name": "John",
                },
                "previous_answer": "I've been lifting for about 2 years",
            }
        }


class OnboardingConversationalResponse(BaseModel):
    """Response model for conversational onboarding responses"""

    message: str = Field(..., description="Personalized conversational response")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Nice! Two years is that sweet spot where you know the basics but there's still tons of room to grow. What are you mainly trying to achieve right now - get stronger, build muscle, or maybe both?"
            }
        }


# ============================================================================
# BADGE MODELS
# ============================================================================


class BadgeUnlockRequest(BaseModel):
    """Request model for badge unlock endpoint"""

    user_id: str = Field(..., description="User ID")
    badge_type: str = Field(
        ..., description="Badge type to unlock (e.g., 'workout_count_10', 'pr_count_5')"
    )

    class Config:
        json_schema_extra = {
            "example": {"user_id": "user_123", "badge_type": "workout_count_10"}
        }


class BadgeUnlockResponse(BaseModel):
    """Response model for badge unlock endpoint"""

    success: bool
    message: str
    badge: Optional[Dict[str, Any]] = None
    already_unlocked: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Badge unlocked: 10 Workouts",
                "badge": {
                    "badge_type": "workout_count_10",
                    "badge_name": "10 Workouts",
                    "badge_description": "Complete 10 workouts",
                    "earned_at": "2025-11-11T10:30:00Z",
                },
                "already_unlocked": False,
            }
        }


# ============================================================================
# EXERCISE CREATION & MATCHING MODELS
# ============================================================================


class ExerciseCreateOrMatchRequest(BaseModel):
    """Request model for exercise creation or matching endpoint"""

    exercise_name: str = Field(
        ...,
        description="Exercise name to match or create",
        min_length=1,
        max_length=200,
    )
    auto_create: bool = Field(
        True,
        description="If True, create exercise if no match found. If False, return None.",
    )
    use_llm_synonyms: bool = Field(
        False, description="Use LLM-based synonym generation for better matching"
    )
    fuzzy_threshold: float = Field(
        0.80, description="Minimum fuzzy match score (0.0-1.0)", ge=0.0, le=1.0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "exercise_name": "DB Flat Bench",
                "auto_create": True,
                "use_llm_synonyms": False,
                "fuzzy_threshold": 0.80,
            }
        }


class ExerciseCreateOrMatchResponse(BaseModel):
    """Response model for exercise creation or matching endpoint"""

    success: bool = Field(..., description="Whether operation succeeded")
    exercise_id: Optional[str] = Field(
        None, description="Matched or created exercise ID"
    )
    exercise_name: str = Field(..., description="Original or normalized exercise name")
    matched_name: Optional[str] = Field(
        None,
        description="Name of the matched exercise (if found via fuzzy/semantic match)",
    )
    match_type: Optional[str] = Field(
        None, description="Type of match: exact, fuzzy, semantic, created, none"
    )
    match_score: Optional[float] = Field(
        None, description="Match confidence score (0.0-1.0)", ge=0.0, le=1.0
    )
    synonyms: List[str] = Field(
        default_factory=list, description="Generated synonyms for the exercise"
    )
    created: bool = Field(False, description="Whether a new exercise was created")
    message: str = Field(..., description="Human-readable message about the result")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata (movement pattern, equipment, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "exercise_id": "abc-123-def",
                "exercise_name": "DB Flat Bench",
                "matched_name": "Dumbbell Bench Press",
                "match_type": "fuzzy",
                "match_score": 0.85,
                "synonyms": [
                    "db bench",
                    "dumbbell bench",
                    "flat bench",
                    "db flat bench press",
                ],
                "created": False,
                "message": "Matched to existing exercise: Dumbbell Bench Press (85% similarity)",
                "metadata": {
                    "movement_pattern": "horizontal_push",
                    "primary_equipment": "dumbbell",
                    "category": "strength",
                },
            }
        }
