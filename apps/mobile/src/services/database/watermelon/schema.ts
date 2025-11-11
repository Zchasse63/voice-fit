/**
 * WatermelonDB Schema
 * 
 * Defines the local database schema for offline-first storage on iOS.
 * This schema mirrors the Supabase schema for seamless sync.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 6,
  tables: [
    tableSchema({
      name: 'workout_logs',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'workout_name', type: 'string', isOptional: true },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'workout_log_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string' },
        { name: 'exercise_name', type: 'string' },
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'voice_command_id', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'runs',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number' },
        { name: 'distance', type: 'number' }, // meters
        { name: 'duration', type: 'number' }, // seconds
        { name: 'pace', type: 'number' }, // minutes per mile
        { name: 'avg_speed', type: 'number' }, // mph
        { name: 'calories', type: 'number' },
        { name: 'elevation_gain', type: 'number', isOptional: true }, // meters
        { name: 'elevation_loss', type: 'number', isOptional: true }, // meters
        { name: 'grade_adjusted_pace', type: 'number', isOptional: true }, // GAP in minutes per mile
        { name: 'grade_percent', type: 'number', isOptional: true }, // average grade percentage
        { name: 'terrain_difficulty', type: 'string', isOptional: true }, // flat, rolling, moderate_uphill, etc.
        { name: 'route', type: 'string' }, // JSON string of coordinates
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'readiness_scores',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number', isIndexed: true }, // timestamp for the day
        { name: 'score', type: 'number' }, // 0-100 composite score
        { name: 'type', type: 'string' }, // 'simple' or 'detailed'
        { name: 'emoji', type: 'string', isOptional: true }, // 😊, 😐, 😓 for simple
        { name: 'sleep_quality', type: 'number', isOptional: true }, // 1-10 for detailed
        { name: 'soreness', type: 'number', isOptional: true }, // 1-10 for detailed
        { name: 'stress', type: 'number', isOptional: true }, // 1-10 for detailed
        { name: 'energy', type: 'number', isOptional: true }, // 1-10 for detailed
        { name: 'notes', type: 'string', isOptional: true }, // Phase 3: User notes for injury detection
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'pr_history',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'exercise_name', type: 'string' },
        { name: 'one_rm', type: 'number' }, // calculated 1RM
        { name: 'weight', type: 'number' }, // actual weight lifted
        { name: 'reps', type: 'number' }, // actual reps performed
        { name: 'workout_log_id', type: 'string', isOptional: true }, // reference to workout
        { name: 'achieved_at', type: 'number' }, // timestamp of PR
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'injury_logs',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'body_part', type: 'string' }, // e.g., 'lower_back', 'shoulder'
        { name: 'severity', type: 'string' }, // 'minor', 'moderate', 'severe'
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'active', 'recovering', 'resolved'
        { name: 'reported_at', type: 'number' },
        { name: 'resolved_at', type: 'number', isOptional: true },
        { name: 'last_check_in_at', type: 'number', isOptional: true }, // Phase 3: Weekly recovery check-ins
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'user_badges',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'badge_type', type: 'string' }, // 'streak_7', 'pr_milestone', etc.
        { name: 'badge_name', type: 'string' },
        { name: 'badge_description', type: 'string' },
        { name: 'earned_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'user_streaks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'streak_type', type: 'string' }, // 'workout', 'readiness_check'
        { name: 'current_count', type: 'number' },
        { name: 'longest_count', type: 'number' },
        { name: 'last_activity_date', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'text', type: 'string' },
        { name: 'sender', type: 'string' }, // 'user' or 'ai'
        { name: 'message_type', type: 'string' }, // 'workout_log', 'question', 'general', 'onboarding', 'adherence_alert'
        { name: 'data', type: 'string', isOptional: true }, // JSON string of additional data
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

