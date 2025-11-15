import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { database } from "../services/database/watermelon/database";
import WorkoutLog from "../services/database/watermelon/models/WorkoutLog";
import Set from "../services/database/watermelon/models/Set";
import { useAuthStore } from "./auth.store";
import { syncService } from "../services/sync/SyncService";
import { workoutNotificationManager } from "../services/workoutNotification/WorkoutNotificationManager";

interface Set {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  timestamp: Date;
}

interface ActiveWorkout {
  id: string;
  name: string;
  startTime: Date;
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  sets: Set[];
  isLoading: boolean;
  error: string | null;
  startWorkout: (name: string) => void;
  addSet: (set: Omit<Set, "id" | "timestamp">) => void;
  removeSet: (setId: string) => void;
  completeWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  clearError: () => void;
}

// Generate UUID for web compatibility
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useWorkoutStore = create<WorkoutState>()(
  devtools(
    (set, get) => ({
      activeWorkout: null,
      sets: [],
      isLoading: false,
      error: null,

      startWorkout: (name) => {
        const workoutId = generateUUID();
        set({
          activeWorkout: {
            id: workoutId,
            name,
            startTime: new Date(),
          },
          sets: [],
          error: null,
        });

        // Start workout notification (Live Activity on iOS, Foreground Service on Android)
        workoutNotificationManager.start(name, workoutId).catch((error) => {
          console.error("Failed to start workout notification:", error);
        });
      },

      addSet: (newSet) => {
        set((state) => {
          const updatedSets = [
            ...state.sets,
            {
              ...newSet,
              id: generateUUID(),
              timestamp: new Date(),
            },
          ];

          // Update workout notification with latest set
          workoutNotificationManager
            .updateLastSet(newSet.weight, newSet.reps, newSet.rpe)
            .catch((error) => {
              console.error("Failed to update workout notification:", error);
            });

          // Update exercise and set counts
          const currentExercise = newSet.exerciseName;
          const exerciseSets = updatedSets.filter(
            (s) => s.exerciseName === currentExercise,
          );
          workoutNotificationManager
            .updateCurrentExercise(
              currentExercise,
              exerciseSets.length,
              updatedSets.length,
            )
            .catch((error) => {
              console.error("Failed to update current exercise:", error);
            });

          return { sets: updatedSets };
        });
      },

      removeSet: (setId) => {
        set((state) => ({
          sets: state.sets.filter((s) => s.id !== setId),
        }));
      },

      completeWorkout: async () => {
        const { activeWorkout, sets } = get();
        if (!activeWorkout) {
          set({ error: "No active workout to complete" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Get current user ID
          const userId = useAuthStore.getState().user?.id;
          if (!userId) {
            throw new Error("User not authenticated");
          }

          // Save to WatermelonDB (offline-first)
          await database.write(async () => {
            // Create workout log
            const workoutLog = await database.collections
              .get<WorkoutLog>("workout_logs")
              .create((workout) => {
                workout.userId = userId;
                workout.workoutName = activeWorkout.name;
                workout.startTime = activeWorkout.startTime;
                workout.endTime = new Date();
                workout.synced = false; // Mark for sync
              });

            // Create sets
            for (const set of sets) {
              await database.collections.get<Set>("sets").create((s) => {
                s.workoutLogId = workoutLog.id;
                s.exerciseId = generateUUID(); // Generate exercise ID
                s.exerciseName = set.exerciseName;
                s.weight = set.weight;
                s.reps = set.reps;
                s.rpe = set.rpe || 0;
                s.synced = false; // Mark for sync
              });
            }
          });

          console.log("✅ Workout saved to WatermelonDB");

          // Trigger background sync
          syncService.syncNow(userId).catch((error) => {
            console.error("⚠️ Sync failed (will retry):", error);
          });

          // End workout notification
          await workoutNotificationManager
            .end({
              status: "completed",
              totalSets: sets.length,
            })
            .catch((error) => {
              console.error("Failed to end workout notification:", error);
            });

          set({
            activeWorkout: null,
            sets: [],
            isLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save workout";
          console.error("❌ Failed to save workout:", error);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      cancelWorkout: () => {
        // End workout notification
        workoutNotificationManager
          .end({
            status: "completed",
          })
          .catch((error) => {
            console.error("Failed to end workout notification:", error);
          });

        set({
          activeWorkout: null,
          sets: [],
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    { name: "WorkoutStore" },
  ),
);
