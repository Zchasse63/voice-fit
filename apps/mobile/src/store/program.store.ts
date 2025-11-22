/**
 * Program Store
 *
 * Zustand store for managing training programs, workout templates, and scheduled workouts.
 * Handles the calendar view, scheduling, drag-and-drop, and program management.
 */

import { create } from 'zustand';
import { database } from '../services/database/watermelon/database';
import Program from '../services/database/watermelon/models/Program';
import WorkoutTemplate from '../services/database/watermelon/models/WorkoutTemplate';
import ScheduledWorkout from '../services/database/watermelon/models/ScheduledWorkout';
import { Q } from '@nozbe/watermelondb';

interface ProgramState {
  // State
  programs: Program[];
  activeProgram: Program | null;
  workoutTemplates: WorkoutTemplate[];
  scheduledWorkouts: ScheduledWorkout[];
  selectedDate: Date | null;
  selectedWeek: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Programs
  loadPrograms: () => Promise<void>;
  loadActiveProgram: () => Promise<void>;
  createProgram: (data: {
    name: string;
    description?: string;
    focus?: string;
    startDate?: Date;
    totalWeeks?: number;
    color?: string;
  }) => Promise<Program>;
  updateProgram: (programId: string, updates: Partial<Program>) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  setActiveProgram: (programId: string) => Promise<void>;

  // Actions - Templates
  loadTemplates: (programId: string) => Promise<void>;
  createTemplate: (data: {
    programId: string;
    name: string;
    description?: string;
    workoutType?: string;
    color?: string;
    estimatedDuration?: number;
    difficulty?: string;
    exercises: any[];
    notes?: string;
  }) => Promise<WorkoutTemplate>;
  updateTemplate: (templateId: string, updates: Partial<WorkoutTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  // Actions - Scheduled Workouts
  loadScheduledWorkouts: (startDate: Date, endDate: Date) => Promise<void>;
  loadScheduledWorkoutsByWeek: (programId: string, weekNumber: number) => Promise<void>;
  scheduleWorkout: (data: {
    programId: string;
    templateId: string;
    scheduledDate: Date;
    notes?: string;
  }) => Promise<ScheduledWorkout>;
  updateScheduledWorkout: (workoutId: string, updates: Partial<ScheduledWorkout>) => Promise<void>;
  moveWorkout: (workoutId: string, newDate: Date, newPosition?: number) => Promise<void>;
  completeWorkout: (workoutId: string, workoutLogId?: string) => Promise<void>;
  skipWorkout: (workoutId: string) => Promise<void>;
  rescheduleWorkout: (workoutId: string, newDate: Date) => Promise<void>;
  deleteScheduledWorkout: (workoutId: string) => Promise<void>;

  // Actions - Calendar View
  setSelectedDate: (date: Date | null) => void;
  setSelectedWeek: (weekNumber: number | null) => void;
  getWorkoutsForDate: (date: Date) => ScheduledWorkout[];
  getWorkoutsForWeek: (weekNumber: number) => ScheduledWorkout[];
  getWorkoutsForDateRange: (startDate: Date, endDate: Date) => ScheduledWorkout[];

  // Actions - Utility
  clearError: () => void;
  reset: () => void;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  // Initial State
  programs: [],
  activeProgram: null,
  workoutTemplates: [],
  scheduledWorkouts: [],
  selectedDate: null,
  selectedWeek: null,
  isLoading: false,
  error: null,

  // ============================================================================
  // PROGRAMS
  // ============================================================================

  loadPrograms: async () => {
    try {
      set({ isLoading: true, error: null });
      const programs = await database
        .get<Program>('programs')
        .query(Q.sortBy('created_at', Q.desc))
        .fetch();
      set({ programs, isLoading: false });
    } catch (error) {
      console.error('Failed to load programs:', error);
      set({ error: 'Failed to load programs', isLoading: false });
    }
  },

  loadActiveProgram: async () => {
    try {
      const activePrograms = await database
        .get<Program>('programs')
        .query(Q.where('is_active', true), Q.take(1))
        .fetch();
      set({ activeProgram: activePrograms[0] || null });
    } catch (error) {
      console.error('Failed to load active program:', error);
      set({ error: 'Failed to load active program' });
    }
  },

  createProgram: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const program = await database.write(async () => {
        return await database.get<Program>('programs').create((newProgram) => {
          newProgram.userId = 'current-user-id'; // TODO: Get from auth store
          newProgram.name = data.name;
          newProgram.description = data.description || '';
          newProgram.focus = data.focus || 'strength';
          newProgram.startDate = data.startDate?.getTime();
          newProgram.endDate = data.startDate && data.totalWeeks
            ? new Date(data.startDate.getTime() + data.totalWeeks * 7 * 24 * 60 * 60 * 1000).getTime()
            : undefined;
          newProgram.currentWeek = 1;
          newProgram.totalWeeks = data.totalWeeks;
          newProgram.color = data.color || '#4A9B6F';
          newProgram.isActive = true;
          newProgram.status = 'active';
          newProgram.synced = false;
        });
      });

      await get().loadPrograms();
      set({ isLoading: false });
      return program;
    } catch (error) {
      console.error('Failed to create program:', error);
      set({ error: 'Failed to create program', isLoading: false });
      throw error;
    }
  },

  updateProgram: async (programId, updates) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const program = await database.get<Program>('programs').find(programId);
        await program.update((p) => {
          Object.assign(p, updates);
          p.synced = false;
        });
      });
      await get().loadPrograms();
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to update program:', error);
      set({ error: 'Failed to update program', isLoading: false });
    }
  },

  deleteProgram: async (programId) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const program = await database.get<Program>('programs').find(programId);
        await program.markAsDeleted();
      });
      await get().loadPrograms();
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to delete program:', error);
      set({ error: 'Failed to delete program', isLoading: false });
    }
  },

  setActiveProgram: async (programId) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        // Deactivate all programs
        const allPrograms = await database.get<Program>('programs').query().fetch();
        for (const program of allPrograms) {
          await program.update((p) => {
            p.isActive = false;
            p.synced = false;
          });
        }

        // Activate selected program
        const program = await database.get<Program>('programs').find(programId);
        await program.update((p) => {
          p.isActive = true;
          p.synced = false;
        });
      });
      await get().loadActiveProgram();
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to set active program:', error);
      set({ error: 'Failed to set active program', isLoading: false });
    }
  },

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  loadTemplates: async (programId) => {
    try {
      set({ isLoading: true, error: null });
      const templates = await database
        .get<WorkoutTemplate>('workout_templates')
        .query(
          Q.where('program_id', programId),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      set({ workoutTemplates: templates, isLoading: false });
    } catch (error) {
      console.error('Failed to load templates:', error);
      set({ error: 'Failed to load templates', isLoading: false });
    }
  },

  createTemplate: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const template = await database.write(async () => {
        return await database.get<WorkoutTemplate>('workout_templates').create((newTemplate) => {
          newTemplate.programId = data.programId;
          newTemplate.name = data.name;
          newTemplate.description = data.description || '';
          newTemplate.workoutType = data.workoutType || 'custom';
          newTemplate.color = data.color || '#4A9B6F';
          newTemplate.estimatedDuration = data.estimatedDuration;
          newTemplate.difficulty = data.difficulty || 'intermediate';
          newTemplate.exercisesJson = JSON.stringify(data.exercises);
          newTemplate.notes = data.notes || '';
          newTemplate.isTemplate = true;
          newTemplate.synced = false;
        });
      });

      await get().loadTemplates(data.programId);
      set({ isLoading: false });
      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      set({ error: 'Failed to create template', isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (templateId, updates) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const template = await database.get<WorkoutTemplate>('workout_templates').find(templateId);
        await template.update((t) => {
          Object.assign(t, updates);
          t.synced = false;
        });
      });
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to update template:', error);
      set({ error: 'Failed to update template', isLoading: false });
    }
  },

  deleteTemplate: async (templateId) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const template = await database.get<WorkoutTemplate>('workout_templates').find(templateId);
        await template.markAsDeleted();
      });
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to delete template:', error);
      set({ error: 'Failed to delete template', isLoading: false });
    }
  },

  // ============================================================================
  // SCHEDULED WORKOUTS
  // ============================================================================

  loadScheduledWorkouts: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      const workouts = await database
        .get<ScheduledWorkout>('scheduled_workouts')
        .query(
          Q.where('scheduled_date', Q.gte(startDate.getTime())),
          Q.where('scheduled_date', Q.lte(endDate.getTime())),
          Q.sortBy('scheduled_date', Q.asc),
          Q.sortBy('position', Q.asc)
        )
        .fetch();
      set({ scheduledWorkouts: workouts, isLoading: false });
    } catch (error) {
      console.error('Failed to load scheduled workouts:', error);
      set({ error: 'Failed to load scheduled workouts', isLoading: false });
    }
  },

  loadScheduledWorkoutsByWeek: async (programId, weekNumber) => {
    try {
      set({ isLoading: true, error: null });
      const workouts = await database
        .get<ScheduledWorkout>('scheduled_workouts')
        .query(
          Q.where('program_id', programId),
          Q.where('week_number', weekNumber),
          Q.sortBy('scheduled_date', Q.asc),
          Q.sortBy('position', Q.asc)
        )
        .fetch();
      set({ scheduledWorkouts: workouts, isLoading: false });
    } catch (error) {
      console.error('Failed to load scheduled workouts:', error);
      set({ error: 'Failed to load scheduled workouts', isLoading: false });
    }
  },

  scheduleWorkout: async (data) => {
    try {
      set({ isLoading: true, error: null });

      // Calculate position for the new workout on this date
      const existingWorkouts = await database
        .get<ScheduledWorkout>('scheduled_workouts')
        .query(
          Q.where('scheduled_date', data.scheduledDate.getTime())
        )
        .fetch();
      const maxPosition = existingWorkouts.reduce((max, w) => Math.max(max, w.position), -1);

      const workout = await database.write(async () => {
        return await database.get<ScheduledWorkout>('scheduled_workouts').create((newWorkout) => {
          newWorkout.programId = data.programId;
          newWorkout.templateId = data.templateId;
          newWorkout.userId = 'current-user-id'; // TODO: Get from auth store
          newWorkout.scheduledDate = data.scheduledDate.getTime();
          newWorkout.position = maxPosition + 1;
          newWorkout.status = 'scheduled';
          newWorkout.notes = data.notes || '';
          newWorkout.synced = false;
        });
      });

      // Reload workouts to get updated list
      const startDate = new Date(data.scheduledDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(data.scheduledDate);
      endDate.setDate(endDate.getDate() + 7);
      await get().loadScheduledWorkouts(startDate, endDate);

      set({ isLoading: false });
      return workout;
    } catch (error) {
      console.error('Failed to schedule workout:', error);
      set({ error: 'Failed to schedule workout', isLoading: false });
      throw error;
    }
  },

  updateScheduledWorkout: async (workoutId, updates) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);
        await workout.update((w) => {
          Object.assign(w, updates);
          w.synced = false;
        });
      });
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to update scheduled workout:', error);
      set({ error: 'Failed to update scheduled workout', isLoading: false });
    }
  },

  moveWorkout: async (workoutId, newDate, newPosition) => {
    try {
      set({ isLoading: true, error: null });

      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);

        // If position not provided, calculate it
        let finalPosition = newPosition;
        if (finalPosition === undefined) {
          const existingWorkouts = await database
            .get<ScheduledWorkout>('scheduled_workouts')
            .query(
              Q.where('scheduled_date', newDate.getTime()),
              Q.where('id', Q.notEq(workoutId))
            )
            .fetch();
          finalPosition = existingWorkouts.reduce((max, w) => Math.max(max, w.position), -1) + 1;
        }

        await workout.update((w) => {
          w.scheduledDate = newDate.getTime();
          w.position = finalPosition!;
          w.synced = false;
        });
      });

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to move workout:', error);
      set({ error: 'Failed to move workout', isLoading: false });
    }
  },

  completeWorkout: async (workoutId, workoutLogId) => {
    try {
      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);
        await workout.update((w) => {
          w.status = 'completed';
          w.completedWorkoutLogId = workoutLogId;
          w.synced = false;
        });
      });
    } catch (error) {
      console.error('Failed to complete workout:', error);
      set({ error: 'Failed to complete workout' });
    }
  },

  skipWorkout: async (workoutId) => {
    try {
      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);
        await workout.update((w) => {
          w.status = 'skipped';
          w.synced = false;
        });
      });
    } catch (error) {
      console.error('Failed to skip workout:', error);
      set({ error: 'Failed to skip workout' });
    }
  },

  rescheduleWorkout: async (workoutId, newDate) => {
    try {
      set({ isLoading: true, error: null });

      // Import CalendarService dynamically to avoid circular dependencies
      const CalendarService = (await import('../services/calendar/CalendarService')).default;

      // Get user ID (TODO: from auth store)
      const userId = 'current-user-id';

      // Check for conflicts on the new date
      await CalendarService.checkConflicts(
        userId,
        newDate.toISOString().split('T')[0],
        workoutId
      );

      // Update local database
      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);
        const originalDate = new Date(workout.scheduledDate).toISOString().split('T')[0];

        await workout.update((w) => {
          w.scheduledDate = newDate.getTime();
          w.status = 'rescheduled';
          w.synced = false;
          // Store original date in notes if not already rescheduled
          if (w.status !== 'rescheduled') {
            w.notes = `Originally scheduled for ${originalDate}. ${w.notes || ''}`.trim();
          }
        });
      });

      set({ isLoading: false });

      // TODO: Handle conflict info for UI if needed
      // conflicts can be used to show warnings to the user
    } catch (error) {
      console.error('Failed to reschedule workout:', error);
      set({ error: 'Failed to reschedule workout', isLoading: false });
      throw error;
    }
  },

  deleteScheduledWorkout: async (workoutId) => {
    try {
      set({ isLoading: true, error: null });
      await database.write(async () => {
        const workout = await database.get<ScheduledWorkout>('scheduled_workouts').find(workoutId);
        await workout.markAsDeleted();
      });
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to delete scheduled workout:', error);
      set({ error: 'Failed to delete scheduled workout', isLoading: false });
    }
  },

  // ============================================================================
  // CALENDAR VIEW
  // ============================================================================

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setSelectedWeek: (weekNumber) => {
    set({ selectedWeek: weekNumber });
  },

  getWorkoutsForDate: (date) => {
    const dateTimestamp = new Date(date).setHours(0, 0, 0, 0);
    return get().scheduledWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.scheduledDate).setHours(0, 0, 0, 0);
      return workoutDate === dateTimestamp;
    });
  },

  getWorkoutsForWeek: (weekNumber) => {
    return get().scheduledWorkouts.filter(
      (workout) => workout.weekNumber === weekNumber
    );
  },

  getWorkoutsForDateRange: (startDate, endDate) => {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    return get().scheduledWorkouts.filter(
      (workout) =>
        workout.scheduledDate >= startTimestamp &&
        workout.scheduledDate <= endTimestamp
    );
  },

  // ============================================================================
  // UTILITY
  // ============================================================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      programs: [],
      activeProgram: null,
      workoutTemplates: [],
      scheduledWorkouts: [],
      selectedDate: null,
      selectedWeek: null,
      isLoading: false,
      error: null,
    });
  },
}));
