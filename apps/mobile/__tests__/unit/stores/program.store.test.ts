/**
 * Unit tests for program.store.ts
 * Tests program scheduling, template management, and calendar functionality
 */

import { useProgramStore } from '../../../src/store/program.store';
import { database } from '../../../src/services/database/watermelon/database';

// Mock WatermelonDB
jest.mock('../../../src/services/database/watermelon/database', () => ({
  database: {
    write: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock models
const mockProgram = {
  id: 'program-1',
  userId: 'user-1',
  name: 'Strength Program',
  description: 'Test program',
  focus: 'strength',
  startDate: Date.now(),
  endDate: Date.now() + 12 * 7 * 24 * 60 * 60 * 1000,
  currentWeek: 1,
  totalWeeks: 12,
  color: '#4A9B6F',
  isActive: true,
  status: 'active',
  synced: false,
  progressPercentage: 8,
};

const mockTemplate = {
  id: 'template-1',
  programId: 'program-1',
  name: 'Upper Body',
  description: 'Push/Pull workout',
  workoutType: 'strength',
  color: '#4A9B6F',
  estimatedDuration: 60,
  difficulty: 'intermediate',
  exercisesJson: JSON.stringify([
    { name: 'Bench Press', sets: 3, reps: 8 },
    { name: 'Pull-ups', sets: 3, reps: 10 },
  ]),
  exercises: [
    { name: 'Bench Press', sets: 3, reps: 8 },
    { name: 'Pull-ups', sets: 3, reps: 10 },
  ],
  notes: 'Focus on form',
  isTemplate: true,
  synced: false,
  exerciseCount: 2,
  totalSets: 6,
};

const mockScheduledWorkout = {
  id: 'scheduled-1',
  programId: 'program-1',
  templateId: 'template-1',
  userId: 'user-1',
  scheduledDate: Date.now(),
  weekNumber: 1,
  dayOfWeek: 1,
  position: 0,
  status: 'scheduled',
  completedWorkoutLogId: null,
  notes: '',
  synced: false,
  isCompleted: false,
  isScheduled: true,
  isSkipped: false,
  isPast: false,
  isToday: true,
  statusDisplay: 'Scheduled',
  statusColor: '#4A9B6F',
};

describe('program.store', () => {
  beforeEach(() => {
    // Reset store state
    useProgramStore.setState({
      programs: [],
      activeProgram: null,
      workoutTemplates: [],
      scheduledWorkouts: [],
      selectedDate: null,
      selectedWeek: null,
      isLoading: false,
      error: null,
    });

    // Clear mock calls
    jest.clearAllMocks();
  });

  // ============================================================================
  // PROGRAMS
  // ============================================================================

  describe('Program Management', () => {
    describe('loadPrograms', () => {
      it('should load all programs', async () => {
        const mockQuery = {
          fetch: jest.fn().mockResolvedValue([mockProgram]),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        await useProgramStore.getState().loadPrograms();

        expect(database.get).toHaveBeenCalledWith('programs');
        expect(useProgramStore.getState().programs).toHaveLength(1);
        expect(useProgramStore.getState().programs[0]).toEqual(mockProgram);
        expect(useProgramStore.getState().isLoading).toBe(false);
      });

      it('should handle errors when loading programs', async () => {
        const mockQuery = {
          fetch: jest.fn().mockRejectedValue(new Error('Database error')),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        await useProgramStore.getState().loadPrograms();

        expect(useProgramStore.getState().error).toBe('Failed to load programs');
        expect(useProgramStore.getState().isLoading).toBe(false);
      });
    });

    describe('loadActiveProgram', () => {
      it('should load the active program', async () => {
        const mockQuery = {
          fetch: jest.fn().mockResolvedValue([mockProgram]),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        await useProgramStore.getState().loadActiveProgram();

        expect(useProgramStore.getState().activeProgram).toEqual(mockProgram);
      });

      it('should set null if no active program', async () => {
        const mockQuery = {
          fetch: jest.fn().mockResolvedValue([]),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        await useProgramStore.getState().loadActiveProgram();

        expect(useProgramStore.getState().activeProgram).toBeNull();
      });
    });

    describe('createProgram', () => {
      it('should create a new program', async () => {
        const mockCreate = jest.fn((callback) => {
          const newProgram: any = {};
          callback(newProgram);
          return { ...mockProgram, ...newProgram };
        });
        const mockCollection = {
          create: mockCreate,
          query: jest.fn().mockReturnValue({
            fetch: jest.fn().mockResolvedValue([mockProgram]),
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().createProgram({
          name: 'New Program',
          description: 'Test description',
          focus: 'strength',
          startDate: new Date(),
          totalWeeks: 12,
          color: '#4A9B6F',
        });

        expect(database.write).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    describe('updateProgram', () => {
      it('should update a program', async () => {
        const mockUpdate = jest.fn();
        const mockProgramInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockProgramInstance),
          query: jest.fn().mockReturnValue({
            fetch: jest.fn().mockResolvedValue([]),
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().updateProgram('program-1', {
          name: 'Updated Name',
        });

        expect(mockCollection.find).toHaveBeenCalledWith('program-1');
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('deleteProgram', () => {
      it('should delete a program', async () => {
        const mockMarkAsDeleted = jest.fn();
        const mockProgramInstance = {
          markAsDeleted: mockMarkAsDeleted,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockProgramInstance),
          query: jest.fn().mockReturnValue({
            fetch: jest.fn().mockResolvedValue([]),
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().deleteProgram('program-1');

        expect(mockCollection.find).toHaveBeenCalledWith('program-1');
        expect(mockMarkAsDeleted).toHaveBeenCalled();
      });
    });

    describe('setActiveProgram', () => {
      it('should set a program as active', async () => {
        const mockUpdate = jest.fn();
        const mockProgramInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue({
            fetch: jest.fn()
              .mockResolvedValueOnce([mockProgramInstance, mockProgramInstance])
              .mockResolvedValueOnce([mockProgram]),
          }),
          find: jest.fn().mockResolvedValue(mockProgramInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().setActiveProgram('program-1');

        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  describe('Template Management', () => {
    describe('loadTemplates', () => {
      it('should load templates for a program', async () => {
        const mockQuery = {
          fetch: jest.fn().mockResolvedValue([mockTemplate]),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        await useProgramStore.getState().loadTemplates('program-1');

        expect(database.get).toHaveBeenCalledWith('workout_templates');
        expect(useProgramStore.getState().workoutTemplates).toHaveLength(1);
      });
    });

    describe('createTemplate', () => {
      it('should create a new template', async () => {
        const mockCreate = jest.fn((callback) => {
          const newTemplate: any = {};
          callback(newTemplate);
          return { ...mockTemplate, ...newTemplate };
        });
        const mockCollection = {
          create: mockCreate,
          query: jest.fn().mockReturnValue({
            fetch: jest.fn().mockResolvedValue([mockTemplate]),
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().createTemplate({
          programId: 'program-1',
          name: 'Upper Body',
          workoutType: 'strength',
          exercises: [{ name: 'Bench Press', sets: 3, reps: 8 }],
        });

        expect(database.write).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    describe('updateTemplate', () => {
      it('should update a template', async () => {
        const mockUpdate = jest.fn();
        const mockTemplateInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockTemplateInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().updateTemplate('template-1', {
          name: 'Updated Template',
        });

        expect(mockCollection.find).toHaveBeenCalledWith('template-1');
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('deleteTemplate', () => {
      it('should delete a template', async () => {
        const mockMarkAsDeleted = jest.fn();
        const mockTemplateInstance = {
          markAsDeleted: mockMarkAsDeleted,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockTemplateInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().deleteTemplate('template-1');

        expect(mockMarkAsDeleted).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // SCHEDULED WORKOUTS
  // ============================================================================

  describe('Scheduled Workout Management', () => {
    describe('loadScheduledWorkouts', () => {
      it('should load workouts for a date range', async () => {
        const mockQuery = {
          fetch: jest.fn().mockResolvedValue([mockScheduledWorkout]),
        };
        const mockCollection = {
          query: jest.fn().mockReturnValue(mockQuery),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        await useProgramStore.getState().loadScheduledWorkouts(startDate, endDate);

        expect(database.get).toHaveBeenCalledWith('scheduled_workouts');
        expect(useProgramStore.getState().scheduledWorkouts).toHaveLength(1);
      });
    });

    describe('scheduleWorkout', () => {
      it('should schedule a new workout', async () => {
        const mockCreate = jest.fn((callback) => {
          const newWorkout: any = {};
          callback(newWorkout);
          return { ...mockScheduledWorkout, ...newWorkout };
        });
        const mockCollection = {
          create: mockCreate,
          query: jest.fn().mockReturnValue({
            fetch: jest.fn()
              .mockResolvedValueOnce([]) // existing workouts check
              .mockResolvedValueOnce([mockScheduledWorkout]), // reload
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().scheduleWorkout({
          programId: 'program-1',
          templateId: 'template-1',
          scheduledDate: new Date(),
        });

        expect(database.write).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    describe('moveWorkout', () => {
      it('should move a workout to a new date', async () => {
        const mockUpdate = jest.fn();
        const mockWorkoutInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockWorkoutInstance),
          query: jest.fn().mockReturnValue({
            fetch: jest.fn().mockResolvedValue([]),
          }),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        const newDate = new Date();
        await useProgramStore.getState().moveWorkout('scheduled-1', newDate, 1);

        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('completeWorkout', () => {
      it('should mark a workout as completed', async () => {
        const mockUpdate = jest.fn();
        const mockWorkoutInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockWorkoutInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().completeWorkout('scheduled-1', 'log-1');

        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('skipWorkout', () => {
      it('should mark a workout as skipped', async () => {
        const mockUpdate = jest.fn();
        const mockWorkoutInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockWorkoutInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().skipWorkout('scheduled-1');

        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('rescheduleWorkout', () => {
      it('should reschedule a workout', async () => {
        const mockUpdate = jest.fn();
        const mockWorkoutInstance = {
          update: mockUpdate,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockWorkoutInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        const newDate = new Date();
        await useProgramStore.getState().rescheduleWorkout('scheduled-1', newDate);

        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('deleteScheduledWorkout', () => {
      it('should delete a scheduled workout', async () => {
        const mockMarkAsDeleted = jest.fn();
        const mockWorkoutInstance = {
          markAsDeleted: mockMarkAsDeleted,
        };
        const mockCollection = {
          find: jest.fn().mockResolvedValue(mockWorkoutInstance),
        };
        (database.get as jest.Mock).mockReturnValue(mockCollection);
        (database.write as jest.Mock).mockImplementation(async (callback) => {
          return await callback();
        });

        await useProgramStore.getState().deleteScheduledWorkout('scheduled-1');

        expect(mockMarkAsDeleted).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // CALENDAR HELPERS
  // ============================================================================

  describe('Calendar Helpers', () => {
    beforeEach(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      useProgramStore.setState({
        scheduledWorkouts: [
          { ...mockScheduledWorkout, scheduledDate: today.getTime(), weekNumber: 1 } as any,
          { ...mockScheduledWorkout, id: 'scheduled-2', scheduledDate: tomorrow.getTime(), weekNumber: 1 } as any,
          { ...mockScheduledWorkout, id: 'scheduled-3', scheduledDate: today.getTime(), weekNumber: 2 } as any,
        ],
      });
    });

    describe('setSelectedDate', () => {
      it('should set selected date', () => {
        const date = new Date();
        useProgramStore.getState().setSelectedDate(date);
        expect(useProgramStore.getState().selectedDate).toEqual(date);
      });
    });

    describe('setSelectedWeek', () => {
      it('should set selected week', () => {
        useProgramStore.getState().setSelectedWeek(2);
        expect(useProgramStore.getState().selectedWeek).toBe(2);
      });
    });

    describe('getWorkoutsForDate', () => {
      it('should return workouts for a specific date', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const workouts = useProgramStore.getState().getWorkoutsForDate(today);

        expect(workouts).toHaveLength(2);
        expect(workouts[0].id).toBe('scheduled-1');
        expect(workouts[1].id).toBe('scheduled-3');
      });

      it('should return empty array for date with no workouts', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const workouts = useProgramStore.getState().getWorkoutsForDate(futureDate);

        expect(workouts).toHaveLength(0);
      });
    });

    describe('getWorkoutsForWeek', () => {
      it('should return workouts for a specific week', () => {
        const workouts = useProgramStore.getState().getWorkoutsForWeek(1);

        expect(workouts).toHaveLength(2);
        expect(workouts[0].weekNumber).toBe(1);
        expect(workouts[1].weekNumber).toBe(1);
      });

      it('should return empty array for week with no workouts', () => {
        const workouts = useProgramStore.getState().getWorkoutsForWeek(99);

        expect(workouts).toHaveLength(0);
      });
    });

    describe('getWorkoutsForDateRange', () => {
      it('should return workouts within date range', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 2);

        const workouts = useProgramStore.getState().getWorkoutsForDateRange(today, endDate);

        expect(workouts.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // UTILITY
  // ============================================================================

  describe('Utility Functions', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        useProgramStore.setState({ error: 'Test error' });
        useProgramStore.getState().clearError();
        expect(useProgramStore.getState().error).toBeNull();
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        useProgramStore.setState({
          programs: [mockProgram as any],
          activeProgram: mockProgram as any,
          workoutTemplates: [mockTemplate as any],
          scheduledWorkouts: [mockScheduledWorkout as any],
          selectedDate: new Date(),
          selectedWeek: 1,
          error: 'Test error',
        });

        useProgramStore.getState().reset();

        const state = useProgramStore.getState();
        expect(state.programs).toEqual([]);
        expect(state.activeProgram).toBeNull();
        expect(state.workoutTemplates).toEqual([]);
        expect(state.scheduledWorkouts).toEqual([]);
        expect(state.selectedDate).toBeNull();
        expect(state.selectedWeek).toBeNull();
        expect(state.error).toBeNull();
      });
    });
  });
});
