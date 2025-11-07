/**
 * WatermelonDB Migrations
 * 
 * Defines database migrations for schema version upgrades.
 * Each migration step handles upgrading from one version to the next.
 */

import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration from v1 to v2 (already applied - added runs table)
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'runs',
          columns: [
            { name: 'user_id', type: 'string' },
            { name: 'start_time', type: 'number' },
            { name: 'end_time', type: 'number' },
            { name: 'distance', type: 'number' },
            { name: 'duration', type: 'number' },
            { name: 'pace', type: 'number' },
            { name: 'avg_speed', type: 'number' },
            { name: 'calories', type: 'number' },
            { name: 'route', type: 'string' },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    // Migration from v2 to v3 (Phase 1 - Training Programs)
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'readiness_scores',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'date', type: 'number', isIndexed: true },
            { name: 'score', type: 'number' },
            { name: 'type', type: 'string' },
            { name: 'emoji', type: 'string', isOptional: true },
            { name: 'sleep_quality', type: 'number', isOptional: true },
            { name: 'soreness', type: 'number', isOptional: true },
            { name: 'stress', type: 'number', isOptional: true },
            { name: 'energy', type: 'number', isOptional: true },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'pr_history',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'exercise_id', type: 'string', isIndexed: true },
            { name: 'exercise_name', type: 'string' },
            { name: 'one_rm', type: 'number' },
            { name: 'weight', type: 'number' },
            { name: 'reps', type: 'number' },
            { name: 'workout_log_id', type: 'string', isOptional: true },
            { name: 'achieved_at', type: 'number' },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'injury_logs',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'body_part', type: 'string' },
            { name: 'severity', type: 'string' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'reported_at', type: 'number' },
            { name: 'resolved_at', type: 'number', isOptional: true },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'user_badges',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'badge_type', type: 'string' },
            { name: 'badge_name', type: 'string' },
            { name: 'badge_description', type: 'string' },
            { name: 'earned_at', type: 'number' },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'user_streaks',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'streak_type', type: 'string' },
            { name: 'current_count', type: 'number' },
            { name: 'longest_count', type: 'number' },
            { name: 'last_activity_date', type: 'number' },
            { name: 'synced', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
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
          table: 'readiness_scores',
          columns: [
            { name: 'notes', type: 'string', isOptional: true },
          ],
        }),
        // Add 'last_check_in_at' field to injury_logs for weekly recovery check-ins
        addColumns({
          table: 'injury_logs',
          columns: [
            { name: 'last_check_in_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});

