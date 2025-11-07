"""
Pydantic models for API request/response validation
"""

from typing import Optional, Dict, Any, List
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
    previous_set: Optional[PreviousSet] = Field(None, description="Previous set for 'same weight' handling")
    auto_save: bool = Field(False, description="Automatically save high-confidence sets to database")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "Bench press, 225 pounds for 8 reps at RPE 8",
                "user_id": "user_123",
                "previous_set": {
                    "weight": 225,
                    "weight_unit": "lbs",
                    "reps": 10
                },
                "auto_save": True
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
    is_exercise_switch: bool
    edge_case_handled: bool
    total_sets_in_session: int


class VoiceParseResponse(BaseModel):
    """Response model for voice parsing endpoint"""
    success: bool
    action: str = Field(..., description="Action to take: auto_accept, needs_confirmation, needs_clarification")
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
                    "confidence": 0.92
                },
                "transcript": "Bench press, 225 pounds for 8 reps at RPE 8",
                "same_weight_detected": False,
                "session_context": {
                    "session_id": "session_user_123_1762191736",
                    "set_number": 1,
                    "is_exercise_switch": False,
                    "edge_case_handled": False,
                    "total_sets_in_session": 1
                },
                "saved": True
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
                "detail": "Transcript cannot be empty"
            }
        }

