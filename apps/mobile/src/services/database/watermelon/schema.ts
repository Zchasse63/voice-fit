/**
 * WatermelonDB Schema
 *
 * Defines the local database schema for offline-first storage on iOS.
 * This schema mirrors the Supabase schema for seamless sync.
 */

import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 11,
  tables: [
    tableSchema({
      name: "workout_logs",
      columns: [
        { name: "user_id", type: "string" },
        { name: "exercise_id", type: "string" }, // REQUIRED - matches Supabase
        { name: "workout_date", type: "number" }, // REQUIRED - timestamp for the date
        { name: "set_number", type: "number" }, // REQUIRED - which set in the workout
        { name: "reps_completed", type: "number" }, // REQUIRED - reps performed
        { name: "weight_used", type: "number", isOptional: true }, // weight in lbs/kg
        { name: "rpe", type: "number", isOptional: true }, // rate of perceived exertion
        { name: "program_exercise_id", type: "string", isOptional: true }, // link to program
        { name: "voice_command_id", type: "string", isOptional: true }, // voice logging reference
        { name: "workout_id", type: "string", isOptional: true }, // parent workout session
        { name: "was_prescribed", type: "boolean", isOptional: true }, // from program
        { name: "was_completed", type: "boolean", isOptional: true }, // completion status
        { name: "notes", type: "string", isOptional: true }, // user notes
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "sets",
      columns: [
        { name: "workout_log_id", type: "string", isIndexed: true },
        { name: "exercise_id", type: "string" },
        { name: "exercise_name", type: "string" },
        { name: "weight", type: "number" },
        { name: "reps", type: "number" },
        { name: "rpe", type: "number", isOptional: true },
        { name: "voice_command_id", type: "string", isOptional: true },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "runs",
      columns: [
        { name: "user_id", type: "string" },
        { name: "start_time", type: "number" },
        { name: "end_time", type: "number" },
        { name: "distance", type: "number" }, // meters
        { name: "duration", type: "number" }, // seconds
        { name: "pace", type: "number" }, // minutes per mile
        { name: "avg_speed", type: "number" }, // mph
        { name: "calories", type: "number" },
        { name: "elevation_gain", type: "number", isOptional: true }, // meters
        { name: "elevation_loss", type: "number", isOptional: true }, // meters
        { name: "grade_adjusted_pace", type: "number", isOptional: true }, // GAP in minutes per mile
        { name: "grade_percent", type: "number", isOptional: true }, // average grade percentage
        { name: "terrain_difficulty", type: "string", isOptional: true }, // flat, rolling, moderate_uphill, etc.
        { name: "route", type: "string" }, // JSON string of coordinates
        { name: "workout_type", type: "string", isOptional: true }, // 'free_run', 'custom_workout', 'scheduled_workout'
        { name: "workout_name", type: "string", isOptional: true }, // name of the workout if applicable
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "readiness_scores",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "date", type: "number", isIndexed: true }, // timestamp for the day
        { name: "score", type: "number" }, // 0-100 composite score
        { name: "type", type: "string" }, // 'simple' or 'detailed'
        { name: "emoji", type: "string", isOptional: true }, // 😊, 😐, 😓 for simple
        { name: "sleep_quality", type: "number", isOptional: true }, // 1-10 for detailed
        { name: "soreness", type: "number", isOptional: true }, // 1-10 for detailed
        { name: "stress", type: "number", isOptional: true }, // 1-10 for detailed
        { name: "energy", type: "number", isOptional: true }, // 1-10 for detailed
        { name: "notes", type: "string", isOptional: true }, // Phase 3: User notes for injury detection
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "pr_history",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "exercise_id", type: "string", isIndexed: true },
        { name: "exercise_name", type: "string" },
        { name: "one_rm", type: "number" }, // calculated 1RM
        { name: "weight", type: "number" }, // actual weight lifted
        { name: "reps", type: "number" }, // actual reps performed
        { name: "workout_log_id", type: "string", isOptional: true }, // reference to workout
        { name: "achieved_at", type: "number" }, // timestamp of PR
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "injury_logs",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "body_part", type: "string" }, // e.g., 'lower_back', 'shoulder'
        { name: "severity", type: "string" }, // 'minor', 'moderate', 'severe'
        { name: "description", type: "string", isOptional: true },
        { name: "status", type: "string" }, // 'active', 'recovering', 'resolved'
        { name: "reported_at", type: "number" },
        { name: "resolved_at", type: "number", isOptional: true },
        { name: "last_check_in_at", type: "number", isOptional: true }, // Phase 3: Weekly recovery check-ins
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "user_badges",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "badge_type", type: "string" }, // 'streak_7', 'pr_milestone', etc.
        { name: "badge_name", type: "string" },
        { name: "badge_description", type: "string" },
        { name: "earned_at", type: "number" },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "user_streaks",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "streak_type", type: "string" }, // 'workout', 'readiness_check'
        { name: "current_count", type: "number" },
        { name: "longest_count", type: "number" },
        { name: "last_activity_date", type: "number" },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "messages",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "text", type: "string" },
        { name: "sender", type: "string" }, // 'user' or 'ai'
        { name: "message_type", type: "string" }, // 'workout_log', 'question', 'general', 'onboarding', 'adherence_alert'
        { name: "data", type: "string", isOptional: true }, // JSON string of additional data
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "programs",
      columns: [
        { name: "user_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "focus", type: "string", isOptional: true }, // 'strength', 'hypertrophy', 'endurance', etc.
        { name: "start_date", type: "number", isOptional: true },
        { name: "end_date", type: "number", isOptional: true },
        { name: "current_week", type: "number" },
        { name: "total_weeks", type: "number", isOptional: true },
        { name: "color", type: "string" }, // hex color
        { name: "is_active", type: "boolean" },
        { name: "status", type: "string" }, // 'active', 'completed', 'paused'
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "workout_templates",
      columns: [
        { name: "program_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "workout_type", type: "string", isOptional: true }, // 'strength', 'cardio', 'hiit', 'recovery', 'custom'
        { name: "color", type: "string" }, // hex color
        { name: "estimated_duration", type: "number", isOptional: true }, // minutes
        { name: "difficulty", type: "string", isOptional: true }, // 'beginner', 'intermediate', 'advanced'
        { name: "exercises", type: "string" }, // JSON string of exercise definitions
        { name: "notes", type: "string", isOptional: true },
        { name: "is_template", type: "boolean" },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "scheduled_workouts",
      columns: [
        { name: "program_id", type: "string", isIndexed: true },
        { name: "template_id", type: "string", isOptional: true },
        { name: "user_id", type: "string", isIndexed: true },
        { name: "scheduled_date", type: "number", isIndexed: true }, // timestamp
        { name: "week_number", type: "number", isOptional: true },
        { name: "day_of_week", type: "number", isOptional: true }, // 0-6
        { name: "position", type: "number" }, // ordering on same day
        { name: "status", type: "string" }, // 'scheduled', 'completed', 'skipped', 'rescheduled'
        { name: "completed_workout_log_id", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "rescheduled_from", type: "number", isOptional: true }, // timestamp of original date
        { name: "reschedule_reason", type: "string", isOptional: true },
        { name: "conflict_acknowledged", type: "boolean", isOptional: true },
        { name: "warmup_routine", type: "string", isOptional: true },
        { name: "cooldown_routine", type: "string", isOptional: true },
        { name: "warmup_duration_min", type: "number", isOptional: true },
        { name: "cooldown_duration_min", type: "number", isOptional: true },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
