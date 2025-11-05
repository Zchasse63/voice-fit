/**
 * WatermelonDB Database Instance
 * 
 * Initializes the local SQLite database for offline-first storage on iOS.
 * This database syncs with Supabase when online.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import WorkoutLog from './models/WorkoutLog';
import Set from './models/Set';

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'VoiceFit',
  jsi: true, // Use JSI for better performance (iOS only)
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [WorkoutLog, Set],
});

console.log('[WatermelonDB] Database initialized');

