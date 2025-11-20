/**
 * WatermelonDB Migrations
 *
 * Defines database migrations for schema version upgrades.
 * Each migration step handles upgrading from one version to the next.
 */

import {
  schemaMigrations,
  createTable,
  addColumns,
} from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    // Migration from v1 to v2 (already applied - added runs table)
    {
      toVersion: 2,
      steps: [
        createTable({
          name: "runs",
          columns: [
            { name: "user_id", type: "string" },
            { name: "start_time", type: "number" },
            { name: "end_time", type: "number" },
            { name: "distance", type: "number" },
            { name: "duration", type: "number" },
            { name: "pace", type: "number" },
            { name: "avg_speed", type: "number" },
            { name: "calories", type: "number" },
            { name: "route", type: "string" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    // Migration from v2 to v3 (Phase 1 - Training Programs)
    {
      toVersion: 3,
      steps: [
        createTable({
          name: "readiness_scores",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "date", type: "number", isIndexed: true },
            { name: "score", type: "number" },
            { name: "type", type: "string" },
            { name: "emoji", type: "string", isOptional: true },
            { name: "sleep_quality", type: "number", isOptional: true },
            { name: "soreness", type: "number", isOptional: true },
            { name: "stress", type: "number", isOptional: true },
            { name: "energy", type: "number", isOptional: true },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "pr_history",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "exercise_id", type: "string", isIndexed: true },
            { name: "exercise_name", type: "string" },
            { name: "one_rm", type: "number" },
            { name: "weight", type: "number" },
            { name: "reps", type: "number" },
            { name: "workout_log_id", type: "string", isOptional: true },
            { name: "achieved_at", type: "number" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "injury_logs",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "body_part", type: "string" },
            { name: "severity", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "status", type: "string" },
            { name: "reported_at", type: "number" },
            { name: "resolved_at", type: "number", isOptional: true },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "user_badges",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "badge_type", type: "string" },
            { name: "badge_name", type: "string" },
            { name: "badge_description", type: "string" },
            { name: "earned_at", type: "number" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "user_streaks",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "streak_type", type: "string" },
            { name: "current_count", type: "number" },
            { name: "longest_count", type: "number" },
            { name: "last_activity_date", type: "number" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    // Migration from v3 to v4 (Phase 3 - Injury Detection & Exercise Substitution)
    {
      toVersion: 4,
      steps: [
        // Add 'notes' field to readiness_scores for injury detection
        addColumns({
          table: "readiness_scores",
          columns: [{ name: "notes", type: "string", isOptional: true }],
        }),
        // Add 'last_check_in_at' field to injury_logs for weekly recovery check-ins
        addColumns({
          table: "injury_logs",
          columns: [
            { name: "last_check_in_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    // Migration from v4 to v5 (Weather Integration - Elevation & GAP)
    {
      toVersion: 5,
      steps: [
        // Add elevation and GAP fields to runs table
        addColumns({
          table: "runs",
          columns: [
            { name: "elevation_gain", type: "number", isOptional: true },
            { name: "elevation_loss", type: "number", isOptional: true },
            { name: "grade_adjusted_pace", type: "number", isOptional: true },
            { name: "grade_percent", type: "number", isOptional: true },
            { name: "terrain_difficulty", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    // Migration from v5 to v6 (UI Redesign - Chat Messages)
    {
      toVersion: 6,
      steps: [
        // Add messages table for unified chat interface
        createTable({
          name: "messages",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "text", type: "string" },
            { name: "sender", type: "string" },
            { name: "message_type", type: "string" },
            { name: "data", type: "string", isOptional: true },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    // Migration from v6 to v7 (Phase 1 Sprint 3 - Program Scheduling & Calendar)
    {
      toVersion: 7,
      steps: [
        // Add programs table
        createTable({
          name: "programs",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "focus", type: "string", isOptional: true },
            { name: "start_date", type: "number", isOptional: true },
            { name: "end_date", type: "number", isOptional: true },
            { name: "current_week", type: "number" },
            { name: "total_weeks", type: "number", isOptional: true },
            { name: "color", type: "string" },
            { name: "is_active", type: "boolean" },
            { name: "status", type: "string" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        // Add workout_templates table
        createTable({
          name: "workout_templates",
          columns: [
            { name: "program_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "workout_type", type: "string", isOptional: true },
            { name: "color", type: "string" },
            { name: "estimated_duration", type: "number", isOptional: true },
            { name: "difficulty", type: "string", isOptional: true },
            { name: "exercises", type: "string" },
            { name: "notes", type: "string", isOptional: true },
            { name: "is_template", type: "boolean" },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        // Add scheduled_workouts table
        createTable({
          name: "scheduled_workouts",
          columns: [
            { name: "program_id", type: "string", isIndexed: true },
            { name: "template_id", type: "string", isOptional: true },
            { name: "user_id", type: "string", isIndexed: true },
            { name: "scheduled_date", type: "number", isIndexed: true },
            { name: "week_number", type: "number", isOptional: true },
            { name: "day_of_week", type: "number", isOptional: true },
            { name: "position", type: "number" },
            { name: "status", type: "string" },
            {
              name: "completed_workout_log_id",
              type: "string",
              isOptional: true,
            },
            { name: "notes", type: "string", isOptional: true },
            { name: "synced", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    // Migration from v7 to v8 (Advanced Calendar Features)
    {
      toVersion: 8,
      steps: [
        addColumns({
          table: "scheduled_workouts",
          columns: [
            { name: "rescheduled_from", type: "number", isOptional: true },
            { name: "reschedule_reason", type: "string", isOptional: true },
            { name: "conflict_acknowledged", type: "boolean", isOptional: true },
          ],
        }),
      ],
    },
    // Migration from v8 to v9 (Multi-Sport Support & Warmup/Cooldown)
    {
      toVersion: 9,
      steps: [
        addColumns({
          table: "scheduled_workouts",
          columns: [
            { name: "warmup_routine", type: "string", isOptional: true },
            { name: "cooldown_routine", type: "string", isOptional: true },
            { name: "warmup_duration_min", type: "number", isOptional: true },
            { name: "cooldown_duration_min", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "workout_logs",
          columns: [
            { name: "warmup_routine", type: "string", isOptional: true },
            { name: "cooldown_routine", type: "string", isOptional: true },
            { name: "warmup_duration_min", type: "number", isOptional: true },
            { name: "cooldown_duration_min", type: "number", isOptional: true },
          ],
        }),
      ],
    },
  ],
});
