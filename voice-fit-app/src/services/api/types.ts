/**
 * API Types for Voice Fit
 * 
 * Type definitions for API requests and responses.
 * These match the FastAPI backend models.
 */

/**
 * Workout context for voice parsing
 */
export interface WorkoutContext {
  current_exercise_id?: string;
  last_weight?: number;
  last_reps?: number;
  workout_id?: string;
}

/**
 * Request to parse a voice command
 */
export interface VoiceParseRequest {
  transcript: string;
  workout_context?: WorkoutContext;
  user_id?: string;
}

/**
 * Response from voice parsing
 */
export interface VoiceParseResponse {
  exercise_id: string;
  exercise_name: string;
  weight?: number;
  weight_unit?: string;
  reps?: number;
  sets?: number;
  rpe?: number;
  rir?: number;
  tempo?: string;
  rest_seconds?: number;
  notes?: string;
  confidence: number;
  requires_confirmation: boolean;
  model_used: string;
  latency_ms: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  model: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  detail: string;
}

