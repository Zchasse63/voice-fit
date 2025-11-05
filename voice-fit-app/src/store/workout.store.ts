import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  addSet: (set: Omit<Set, 'id' | 'timestamp'>) => void;
  removeSet: (setId: string) => void;
  completeWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  clearError: () => void;
}

// Generate UUID for web compatibility
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
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
        set({
          activeWorkout: {
            id: generateUUID(),
            name,
            startTime: new Date(),
          },
          sets: [],
          error: null,
        });
      },

      addSet: (newSet) => {
        set((state) => ({
          sets: [
            ...state.sets,
            {
              ...newSet,
              id: generateUUID(),
              timestamp: new Date(),
            },
          ],
        }));
      },

      removeSet: (setId) => {
        set((state) => ({
          sets: state.sets.filter((s) => s.id !== setId),
        }));
      },

      completeWorkout: async () => {
        const { activeWorkout, sets } = get();
        if (!activeWorkout) {
          set({ error: 'No active workout to complete' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // TODO: Save to Supabase (Phase 3)
          console.log('Saving workout:', {
            workout: activeWorkout,
            sets,
            endTime: new Date(),
          });

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));

          set({
            activeWorkout: null,
            sets: [],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save workout';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      cancelWorkout: () => {
        set({
          activeWorkout: null,
          sets: [],
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'WorkoutStore' }
  )
);

