"""
Pydantic models for injury detection and management API endpoints
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, validator

# Request Models


class InjuryAnalyzeRequest(BaseModel):
    """Request model for AI injury analysis (Premium tier)"""

    user_id: str = Field(
        ..., description="User ID for injury history and training load lookup"
    )
    user_notes: str = Field(..., description="User's notes from readiness check-in")
    user_tier: str = Field(..., description="User tier: 'free' or 'premium'")
    recent_exercises: Optional[List[str]] = Field(
        default=None, description="Recent exercises performed"
    )
    training_context: Optional[str] = Field(
        default=None, description="Additional training context"
    )


class SeverityEnum(str, Enum):
    """Injury severity levels"""

    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class StatusEnum(str, Enum):
    """Injury status values"""

    active = "active"
    recovering = "recovering"
    resolved = "resolved"


class InjuryLogRequest(BaseModel):
    """Request model for creating an injury log"""

    user_id: str = Field(..., description="User ID")
    body_part: str = Field(
        ..., description="Injured body part (e.g., 'shoulder', 'lower_back')"
    )
    severity: SeverityEnum = Field(
        ..., description="Severity: 'mild', 'moderate', or 'severe'"
    )
    description: Optional[str] = Field(default=None, description="Injury description")
    status: Optional[StatusEnum] = Field(
        default=StatusEnum.active,
        description="Status: 'active', 'recovering', or 'resolved'",
    )


class InjuryCheckInRequest(BaseModel):
    """Request model for weekly recovery check-in"""

    pain_level: int = Field(..., ge=0, le=10, description="Pain level on 0-10 scale")
    rom_quality: str = Field(
        ..., description="Range of motion: 'better', 'same', or 'worse'"
    )
    activity_tolerance: str = Field(
        ..., description="Activity tolerance: 'improving', 'plateau', or 'declining'"
    )
    new_symptoms: Optional[str] = Field(default=None, description="Any new symptoms")


# Response Models


class InjuryAnalyzeResponse(BaseModel):
    """Response model for AI injury analysis"""

    injury_detected: bool = Field(..., description="Whether an injury was detected")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score (0.0-1.0)"
    )
    body_part: Optional[str] = Field(default=None, description="Detected body part")
    severity: Optional[str] = Field(
        default=None, description="Severity: 'mild', 'moderate', or 'severe'"
    )
    injury_type: Optional[str] = Field(
        default=None, description="Type of injury (e.g., 'strain', 'sprain')"
    )
    description: str = Field(
        ..., description="Human-readable description of the injury"
    )
    red_flags: List[str] = Field(
        default_factory=list,
        description="Red flag symptoms requiring medical attention",
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Recovery recommendations"
    )
    requires_medical_attention: bool = Field(
        ..., description="Whether immediate medical attention is required"
    )
    differential_diagnoses: List[str] = Field(
        default_factory=list, description="Possible diagnoses"
    )
    follow_up_questions: List[str] = Field(
        default_factory=list, description="Follow-up questions for ambiguous cases"
    )
    metadata: Optional[dict] = Field(
        default=None,
        description="Analysis metadata including latencies, sources, multi-injury info",
    )


class InjuryLogResponse(BaseModel):
    """Response model for injury log creation"""

    id: str = Field(..., description="Injury log ID")
    user_id: str = Field(..., description="User ID")
    body_part: str = Field(..., description="Injured body part")
    severity: str = Field(..., description="Severity level")
    description: Optional[str] = Field(default=None, description="Injury description")
    status: str = Field(..., description="Current status")
    reported_at: datetime = Field(..., description="When injury was reported")
    resolved_at: Optional[datetime] = Field(
        default=None, description="When injury was resolved"
    )
    last_check_in_at: Optional[datetime] = Field(
        default=None, description="Last check-in timestamp"
    )
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record update timestamp")


class ActiveInjuryResponse(BaseModel):
    """Response model for active injuries query"""

    injuries: List[InjuryLogResponse] = Field(
        ..., description="List of active injuries"
    )
    count: int = Field(..., description="Total count of active injuries")
    needs_check_in: List[str] = Field(
        default_factory=list, description="Injury IDs that need weekly check-in"
    )


class RecoveryCheckInResponse(BaseModel):
    """Response model for recovery check-in"""

    progress_score: float = Field(
        ..., ge=0.0, le=1.0, description="Recovery progress score (0.0-1.0)"
    )
    status: str = Field(
        ...,
        description="Recovery status: 'improving', 'plateau', 'worsening', or 'resolved'",
    )
    recommendation: str = Field(
        ..., description="Recommendation based on recovery status"
    )
    requires_medical_attention: bool = Field(
        ..., description="Whether medical consultation is recommended"
    )
    days_in_recovery: int = Field(
        ..., description="Number of days since injury was reported"
    )
    updated_injury: InjuryLogResponse = Field(..., description="Updated injury log")


# ============================================================================
# Exercise Substitution Models
# ============================================================================


class ExerciseSubstitutionRequest(BaseModel):
    """Request model for exercise substitution query"""

    exercise_name: str = Field(
        ..., description="Name of the exercise to find substitutes for"
    )
    injured_body_part: Optional[str] = Field(
        None, description="Body part to protect: shoulder, lower_back, knee, elbow, hip"
    )
    min_similarity_score: Optional[float] = Field(
        0.60, ge=0.0, le=1.0, description="Minimum similarity threshold (0.0-1.0)"
    )
    max_results: Optional[int] = Field(
        5, ge=1, le=20, description="Maximum number of substitutes to return"
    )
    equipment_filter: Optional[List[str]] = Field(
        None, description="Filter by available equipment"
    )
    difficulty_filter: Optional[List[str]] = Field(
        None, description="Filter by difficulty level"
    )


class ExerciseSubstitution(BaseModel):
    """Model for a single exercise substitution"""

    id: str = Field(..., description="Unique substitution ID")
    exercise_name: str = Field(..., description="Original exercise name")
    substitute_name: str = Field(..., description="Substitute exercise name")
    similarity_score: float = Field(
        ..., ge=0.0, le=1.0, description="Similarity score (0.0-1.0)"
    )
    reduced_stress_area: str = Field(..., description="Body part with reduced stress")
    movement_pattern: str = Field(..., description="Movement pattern category")
    primary_muscles: str = Field(
        ..., description="Primary muscles worked (comma-separated)"
    )
    equipment_required: str = Field(..., description="Equipment needed")
    difficulty_level: str = Field(..., description="Difficulty level")
    notes: str = Field(..., description="Scientific notes and EMG data")


class ExerciseSubstitutionResponse(BaseModel):
    """Response model for exercise substitution query"""

    original_exercise: str = Field(..., description="Original exercise queried")
    substitutes: List[ExerciseSubstitution] = Field(
        ..., description="List of substitute exercises"
    )
    total_found: int = Field(..., description="Total number of substitutes found")
    filters_applied: dict = Field(
        ..., description="Filters that were applied to the query"
    )


# ============================================================================
# Exercise Substitution Explanation Models
# ============================================================================


class ExplanationContext(BaseModel):
    """Context for generating personalized explanations"""

    injured_body_part: Optional[str] = Field(None, description="Injured body part")
    injury_type: Optional[str] = Field(None, description="Type of injury")
    recovery_week: Optional[int] = Field(None, description="Week number in recovery")
    pain_level: Optional[int] = Field(
        None, ge=0, le=10, description="Current pain level (0-10)"
    )
    experience_level: Optional[str] = Field(
        None, description="User experience level: beginner, intermediate, advanced"
    )


class ExplanationSections(BaseModel):
    """Individual sections of the explanation"""

    why_recommended: str = Field(
        ..., description="Why this substitution is recommended"
    )
    scientific_evidence: str = Field(
        ..., description="Scientific evidence from research"
    )
    similarity_score: str = Field(..., description="Similarity score explanation")
    how_to_use: str = Field(..., description="How to use this exercise")
    recovery_context: Optional[str] = Field(
        None, description="Recovery-specific guidance"
    )


class ExerciseExplanationResponse(BaseModel):
    """Response model for exercise substitution explanation"""

    exercise_name: str = Field(..., description="Original exercise name")
    substitute_name: str = Field(..., description="Substitute exercise name")
    explanation: str = Field(..., description="Full formatted explanation")
    sections: ExplanationSections = Field(
        ..., description="Individual explanation sections"
    )
    similarity_score: float = Field(..., description="Similarity score (0.0-1.0)")
    reduced_stress_area: str = Field(..., description="Body part with reduced stress")
