// Shared workout types
export interface WorkoutLog {
  id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Set {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance_meters?: number;
  notes?: string;
  created_at: string;
}

