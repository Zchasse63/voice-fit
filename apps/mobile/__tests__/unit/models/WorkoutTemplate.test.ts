/**
 * Unit tests for WorkoutTemplate model
 * Tests computed properties and JSON parsing logic
 */

// Mock WorkoutTemplate class for testing
interface Exercise {
  id?: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  rest?: number;
  notes?: string;
}

class MockWorkoutTemplate {
  programId: string;
  name: string;
  description?: string;
  workoutType?: string;
  color: string;
  estimatedDuration?: number;
  difficulty?: string;
  exercisesJson: string;
  notes?: string;
  isTemplate: boolean;
  synced: boolean;

  constructor(data: Partial<MockWorkoutTemplate>) {
    this.programId = data.programId || 'program-1';
    this.name = data.name || 'Test Workout';
    this.description = data.description;
    this.workoutType = data.workoutType;
    this.color = data.color || '#4A9B6F';
    this.estimatedDuration = data.estimatedDuration;
    this.difficulty = data.difficulty;
    this.exercisesJson = data.exercisesJson || '[]';
    this.notes = data.notes;
    this.isTemplate = data.isTemplate !== undefined ? data.isTemplate : true;
    this.synced = data.synced || false;
  }

  get exercises(): Exercise[] {
    try {
      return JSON.parse(this.exercisesJson) as Exercise[];
    } catch (error) {
      console.error('Failed to parse exercises JSON:', error);
      return [];
    }
  }

  get exerciseCount(): number {
    return this.exercises.length;
  }

  get totalSets(): number {
    return this.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  }

  get workoutTypeDisplay(): string {
    const typeMap: Record<string, string> = {
      strength: 'Strength Training',
      cardio: 'Cardio',
      hiit: 'HIIT',
      recovery: 'Recovery',
      flexibility: 'Flexibility',
      custom: 'Custom',
    };
    return typeMap[this.workoutType || 'custom'] || 'Custom';
  }

  get difficultyDisplay(): string {
    const difficultyMap: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return difficultyMap[this.difficulty || ''] || '';
  }

  get estimatedDurationDisplay(): string {
    if (!this.estimatedDuration) return 'Not set';
    const hours = Math.floor(this.estimatedDuration / 60);
    const minutes = this.estimatedDuration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

describe('WorkoutTemplate Model', () => {
  describe('exercises (JSON parsing)', () => {
    it('should parse valid exercise JSON correctly', () => {
      const exercisesData = [
        { name: 'Bench Press', sets: 3, reps: 8 },
        { name: 'Squats', sets: 4, reps: 10 },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.exercises).toEqual(exercisesData);
      expect(template.exercises).toHaveLength(2);
    });

    it('should return empty array for empty JSON array', () => {
      const template = new MockWorkoutTemplate({ exercisesJson: '[]' });

      expect(template.exercises).toEqual([]);
      expect(template.exercises).toHaveLength(0);
    });

    it('should return empty array for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const template = new MockWorkoutTemplate({ exercisesJson: 'invalid json' });

      expect(template.exercises).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return empty array for malformed JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const template = new MockWorkoutTemplate({ exercisesJson: '{broken}' });

      expect(template.exercises).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle exercises with optional fields', () => {
      const exercisesData = [
        { name: 'Deadlift', sets: 3, reps: 5, weight: 225, rpe: 8 },
        { name: 'Plank', sets: 3, rest: 60, notes: 'Hold for time' },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.exercises[0].weight).toBe(225);
      expect(template.exercises[0].rpe).toBe(8);
      expect(template.exercises[1].rest).toBe(60);
      expect(template.exercises[1].notes).toBe('Hold for time');
    });
  });

  describe('exerciseCount', () => {
    it('should return 0 for empty exercise list', () => {
      const template = new MockWorkoutTemplate({ exercisesJson: '[]' });

      expect(template.exerciseCount).toBe(0);
    });

    it('should return correct count for single exercise', () => {
      const exercisesData = [{ name: 'Push-ups', sets: 3, reps: 10 }];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.exerciseCount).toBe(1);
    });

    it('should return correct count for multiple exercises', () => {
      const exercisesData = [
        { name: 'Squats', sets: 4, reps: 8 },
        { name: 'Lunges', sets: 3, reps: 12 },
        { name: 'Leg Press', sets: 3, reps: 10 },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.exerciseCount).toBe(3);
    });
  });

  describe('totalSets', () => {
    it('should return 0 for empty exercise list', () => {
      const template = new MockWorkoutTemplate({ exercisesJson: '[]' });

      expect(template.totalSets).toBe(0);
    });

    it('should sum sets correctly for single exercise', () => {
      const exercisesData = [{ name: 'Bench Press', sets: 4, reps: 8 }];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(4);
    });

    it('should sum sets correctly for multiple exercises', () => {
      const exercisesData = [
        { name: 'Squats', sets: 4, reps: 8 },
        { name: 'Lunges', sets: 3, reps: 12 },
        { name: 'Calf Raises', sets: 3, reps: 15 },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(10);
    });

    it('should handle exercises without sets field (default to 0)', () => {
      const exercisesData = [
        { name: 'Warm-up', reps: 10 },
        { name: 'Stretching' },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(0);
    });

    it('should handle mix of exercises with and without sets', () => {
      const exercisesData = [
        { name: 'Bench Press', sets: 4, reps: 8 },
        { name: 'Warm-up', reps: 10 },
        { name: 'Pull-ups', sets: 3, reps: 8 },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(7);
    });
  });

  describe('workoutTypeDisplay', () => {
    it('should return "Strength Training" for strength type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'strength' });

      expect(template.workoutTypeDisplay).toBe('Strength Training');
    });

    it('should return "Cardio" for cardio type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'cardio' });

      expect(template.workoutTypeDisplay).toBe('Cardio');
    });

    it('should return "HIIT" for hiit type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'hiit' });

      expect(template.workoutTypeDisplay).toBe('HIIT');
    });

    it('should return "Recovery" for recovery type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'recovery' });

      expect(template.workoutTypeDisplay).toBe('Recovery');
    });

    it('should return "Flexibility" for flexibility type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'flexibility' });

      expect(template.workoutTypeDisplay).toBe('Flexibility');
    });

    it('should return "Custom" for custom type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'custom' });

      expect(template.workoutTypeDisplay).toBe('Custom');
    });

    it('should return "Custom" for undefined type', () => {
      const template = new MockWorkoutTemplate({ workoutType: undefined });

      expect(template.workoutTypeDisplay).toBe('Custom');
    });

    it('should return "Custom" for unknown type', () => {
      const template = new MockWorkoutTemplate({ workoutType: 'unknown' });

      expect(template.workoutTypeDisplay).toBe('Custom');
    });
  });

  describe('difficultyDisplay', () => {
    it('should return "Beginner" for beginner difficulty', () => {
      const template = new MockWorkoutTemplate({ difficulty: 'beginner' });

      expect(template.difficultyDisplay).toBe('Beginner');
    });

    it('should return "Intermediate" for intermediate difficulty', () => {
      const template = new MockWorkoutTemplate({ difficulty: 'intermediate' });

      expect(template.difficultyDisplay).toBe('Intermediate');
    });

    it('should return "Advanced" for advanced difficulty', () => {
      const template = new MockWorkoutTemplate({ difficulty: 'advanced' });

      expect(template.difficultyDisplay).toBe('Advanced');
    });

    it('should return empty string for undefined difficulty', () => {
      const template = new MockWorkoutTemplate({ difficulty: undefined });

      expect(template.difficultyDisplay).toBe('');
    });

    it('should return empty string for unknown difficulty', () => {
      const template = new MockWorkoutTemplate({ difficulty: 'unknown' });

      expect(template.difficultyDisplay).toBe('');
    });
  });

  describe('estimatedDurationDisplay', () => {
    it('should return "Not set" when duration is undefined', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: undefined });

      expect(template.estimatedDurationDisplay).toBe('Not set');
    });

    it('should return "Not set" when duration is 0', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 0 });

      expect(template.estimatedDurationDisplay).toBe('Not set');
    });

    it('should format minutes only for durations under 60', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 45 });

      expect(template.estimatedDurationDisplay).toBe('45m');
    });

    it('should format hours and minutes for exactly 60 minutes', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 60 });

      expect(template.estimatedDurationDisplay).toBe('1h 0m');
    });

    it('should format hours and minutes for duration over 60', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 90 });

      expect(template.estimatedDurationDisplay).toBe('1h 30m');
    });

    it('should format hours and minutes for 2 hours', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 120 });

      expect(template.estimatedDurationDisplay).toBe('2h 0m');
    });

    it('should format hours and minutes for 2.5 hours', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 150 });

      expect(template.estimatedDurationDisplay).toBe('2h 30m');
    });

    it('should handle very short durations', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 1 });

      expect(template.estimatedDurationDisplay).toBe('1m');
    });

    it('should handle very long durations', () => {
      const template = new MockWorkoutTemplate({ estimatedDuration: 300 });

      expect(template.estimatedDurationDisplay).toBe('5h 0m');
    });
  });

  describe('Template attributes', () => {
    it('should set all required fields correctly', () => {
      const template = new MockWorkoutTemplate({
        programId: 'program-123',
        name: 'Upper Body Power',
        description: 'Heavy compound lifts',
        workoutType: 'strength',
        color: '#E74C3C',
        estimatedDuration: 75,
        difficulty: 'advanced',
        notes: 'Focus on form',
        isTemplate: true,
        synced: false,
      });

      expect(template.programId).toBe('program-123');
      expect(template.name).toBe('Upper Body Power');
      expect(template.description).toBe('Heavy compound lifts');
      expect(template.workoutType).toBe('strength');
      expect(template.color).toBe('#E74C3C');
      expect(template.estimatedDuration).toBe(75);
      expect(template.difficulty).toBe('advanced');
      expect(template.notes).toBe('Focus on form');
      expect(template.isTemplate).toBe(true);
      expect(template.synced).toBe(false);
    });

    it('should use default values when not provided', () => {
      const template = new MockWorkoutTemplate({});

      expect(template.programId).toBe('program-1');
      expect(template.name).toBe('Test Workout');
      expect(template.color).toBe('#4A9B6F');
      expect(template.exercisesJson).toBe('[]');
      expect(template.isTemplate).toBe(true);
      expect(template.synced).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large exercise lists', () => {
      const exercises = Array.from({ length: 20 }, (_, i) => ({
        name: `Exercise ${i + 1}`,
        sets: 3,
        reps: 10,
      }));
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercises),
      });

      expect(template.exerciseCount).toBe(20);
      expect(template.totalSets).toBe(60);
    });

    it('should handle exercises with zero sets', () => {
      const exercisesData = [
        { name: 'Warm-up', sets: 0, reps: 10 },
        { name: 'Stretch', sets: 0 },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(0);
    });

    it('should handle exercises with negative sets (data corruption)', () => {
      const exercisesData = [{ name: 'Test', sets: -3, reps: 10 }];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(-3);
    });

    it('should handle null exercise fields gracefully', () => {
      const exercisesData = [
        { name: 'Test', sets: null as any, reps: null as any },
      ];
      const template = new MockWorkoutTemplate({
        exercisesJson: JSON.stringify(exercisesData),
      });

      expect(template.totalSets).toBe(0);
    });
  });
});
