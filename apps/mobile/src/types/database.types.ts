// Generated types for Supabase database
// This is a placeholder - will be generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          start_time: string
          end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          start_time: string
          end_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          start_time?: string
          end_time?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_name: string
          weight: number
          reps: number
          rpe: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_name: string
          weight: number
          reps: number
          rpe?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_name?: string
          weight?: number
          reps?: number
          rpe?: number | null
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

