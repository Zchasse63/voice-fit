/**
 * TypeScript types for VoiceFit Web Dashboard
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserType = "free" | "premium" | "coach";

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface CoachProfile {
  coach_id: string;
  organization_id: string;
  bio: string | null;
  specialties: string[] | null;
  certifications: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ClientAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  assigned_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  notes: string | null;
}

// ============================================================================
// WORKOUT TYPES
// ============================================================================

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  workout_type: string;
  exercises: Exercise[];
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
  notes: string | null;
}

// ============================================================================
// HEALTH METRICS TYPES
// ============================================================================

export interface HealthMetric {
  id: string;
  user_id: string;
  date: string;
  metric_type: string;
  value_numeric: number | null;
  value_text: string | null;
  source: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface VoiceSession {
  id: string;
  user_id: string;
  session_type: "planning" | "check_in" | "general";
  status: "active" | "completed" | "timeout";
  context: Record<string, any> | null;
  conversation_history: ChatMessage[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalWorkouts: number;
  completedWorkouts: number;
  currentStreak: number;
  weeklyProgress: number;
}

export interface HealthSnapshot {
  recovery: number | null;
  hrv: number | null;
  restingHR: number | null;
  sleep: number | null;
  readiness: number | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

