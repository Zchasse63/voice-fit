/**
 * WatermelonDB Database Instance
 *
 * Initializes the local SQLite database for offline-first storage on iOS.
 * This database syncs with Supabase when online.
 */

import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import { migrations } from "./migrations";
import WorkoutLog from "./models/WorkoutLog";
import Set from "./models/Set";
import Run from "./models/Run";
import ReadinessScore from "./models/ReadinessScore";
import PRHistory from "./models/PRHistory";
import InjuryLog from "./models/InjuryLog";
import UserBadge from "./models/UserBadge";
import UserStreak from "./models/UserStreak";
import Message from "./models/Message";
import Program from "./models/Program";
import WorkoutTemplate from "./models/WorkoutTemplate";
import ScheduledWorkout from "./models/ScheduledWorkout";

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: "VoiceFit",
  jsi: false, // JSI disabled for compatibility - can re-enable after native setup fixed
  onSetUpError: (error) => {
    console.error("[WatermelonDB] Setup error:", error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    WorkoutLog,
    Set,
    Run,
    ReadinessScore,
    PRHistory,
    InjuryLog,
    UserBadge,
    UserStreak,
    Message,
    Program,
    WorkoutTemplate,
    ScheduledWorkout,
  ],
});

console.log("[WatermelonDB] Database initialized with schema v10 (Supabase-aligned)");
