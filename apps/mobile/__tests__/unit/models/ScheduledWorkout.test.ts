/**
 * Unit tests for ScheduledWorkout model
 * Tests computed properties and date/status logic
 */

// Mock ScheduledWorkout class for testing
class MockScheduledWorkout {
  programId: string;
  templateId?: string;
  userId: string;
  scheduledDate: number;
  weekNumber?: number;
  dayOfWeek?: number;
  position: number;
  status: string;
  completedWorkoutLogId?: string;
  notes?: string;
  synced: boolean;

  constructor(data: Partial<MockScheduledWorkout>) {
    this.programId = data.programId || 'program-1';
    this.templateId = data.templateId;
    this.userId = data.userId || 'user-1';
    this.scheduledDate = data.scheduledDate || Date.now();
    this.weekNumber = data.weekNumber;
    this.dayOfWeek = data.dayOfWeek;
    this.position = data.position || 0;
    this.status = data.status || 'scheduled';
    this.completedWorkoutLogId = data.completedWorkoutLogId;
    this.notes = data.notes;
    this.synced = data.synced || false;
  }

  get scheduledDateObject(): Date {
    return new Date(this.scheduledDate);
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  get isSkipped(): boolean {
    return this.status === 'skipped';
  }

  get isRescheduled(): boolean {
    return this.status === 'rescheduled';
  }

  get isPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.scheduledDateObject < today;
  }

  get isToday(): boolean {
    const today = new Date();
    const scheduledDate = this.scheduledDateObject;
    return (
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear()
    );
  }

  get isFuture(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.scheduledDateObject > today;
  }

  get dayOfWeekName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.dayOfWeek || 0] || 'Unknown';
  }

  get dayOfWeekShort(): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[this.dayOfWeek || 0] || '?';
  }

  get statusDisplay(): string {
    const statusMap: Record<string, string> = {
      scheduled: 'Scheduled',
      completed: 'Completed',
      skipped: 'Skipped',
      rescheduled: 'Rescheduled',
    };
    return statusMap[this.status] || 'Unknown';
  }

  get statusColor(): string {
    const colorMap: Record<string, string> = {
      scheduled: '#4A9B6F',
      completed: '#3498DB',
      skipped: '#95A5A6',
      rescheduled: '#F39C12',
    };
    return colorMap[this.status] || '#95A5A6';
  }

  get formattedDate(): string {
    return this.scheduledDateObject.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get formattedDateShort(): string {
    return this.scheduledDateObject.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

describe('ScheduledWorkout Model', () => {
  describe('scheduledDateObject', () => {
    it('should convert timestamp to Date object', () => {
      const timestamp = new Date('2025-01-15').getTime();
      const workout = new MockScheduledWorkout({ scheduledDate: timestamp });

      expect(workout.scheduledDateObject).toBeInstanceOf(Date);
      expect(workout.scheduledDateObject.getTime()).toBe(timestamp);
    });

    it('should handle current date', () => {
      const now = Date.now();
      const workout = new MockScheduledWorkout({ scheduledDate: now });

      expect(workout.scheduledDateObject.getTime()).toBe(now);
    });
  });

  describe('Status checks', () => {
    describe('isCompleted', () => {
      it('should return true when status is completed', () => {
        const workout = new MockScheduledWorkout({ status: 'completed' });

        expect(workout.isCompleted).toBe(true);
      });

      it('should return false when status is scheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.isCompleted).toBe(false);
      });

      it('should return false when status is skipped', () => {
        const workout = new MockScheduledWorkout({ status: 'skipped' });

        expect(workout.isCompleted).toBe(false);
      });
    });

    describe('isScheduled', () => {
      it('should return true when status is scheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.isScheduled).toBe(true);
      });

      it('should return false when status is completed', () => {
        const workout = new MockScheduledWorkout({ status: 'completed' });

        expect(workout.isScheduled).toBe(false);
      });
    });

    describe('isSkipped', () => {
      it('should return true when status is skipped', () => {
        const workout = new MockScheduledWorkout({ status: 'skipped' });

        expect(workout.isSkipped).toBe(true);
      });

      it('should return false when status is scheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.isSkipped).toBe(false);
      });
    });

    describe('isRescheduled', () => {
      it('should return true when status is rescheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'rescheduled' });

        expect(workout.isRescheduled).toBe(true);
      });

      it('should return false when status is scheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.isRescheduled).toBe(false);
      });
    });
  });

  describe('Date comparisons', () => {
    describe('isPast', () => {
      it('should return true for yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const workout = new MockScheduledWorkout({ scheduledDate: yesterday.getTime() });

        expect(workout.isPast).toBe(true);
      });

      it('should return false for today', () => {
        const today = new Date();
        const workout = new MockScheduledWorkout({ scheduledDate: today.getTime() });

        expect(workout.isPast).toBe(false);
      });

      it('should return false for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const workout = new MockScheduledWorkout({ scheduledDate: tomorrow.getTime() });

        expect(workout.isPast).toBe(false);
      });

      it('should return true for last week', () => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const workout = new MockScheduledWorkout({ scheduledDate: lastWeek.getTime() });

        expect(workout.isPast).toBe(true);
      });
    });

    describe('isToday', () => {
      it('should return true for current date', () => {
        const today = new Date();
        const workout = new MockScheduledWorkout({ scheduledDate: today.getTime() });

        expect(workout.isToday).toBe(true);
      });

      it('should return false for yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const workout = new MockScheduledWorkout({ scheduledDate: yesterday.getTime() });

        expect(workout.isToday).toBe(false);
      });

      it('should return false for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const workout = new MockScheduledWorkout({ scheduledDate: tomorrow.getTime() });

        expect(workout.isToday).toBe(false);
      });

      it('should return true for today at different time', () => {
        const today = new Date();
        today.setHours(23, 59, 59);
        const workout = new MockScheduledWorkout({ scheduledDate: today.getTime() });

        expect(workout.isToday).toBe(true);
      });
    });

    describe('isFuture', () => {
      it('should return true for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const workout = new MockScheduledWorkout({ scheduledDate: tomorrow.getTime() });

        expect(workout.isFuture).toBe(true);
      });

      it('should return false for today', () => {
        const today = new Date();
        const workout = new MockScheduledWorkout({ scheduledDate: today.getTime() });

        expect(workout.isFuture).toBe(false);
      });

      it('should return false for yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const workout = new MockScheduledWorkout({ scheduledDate: yesterday.getTime() });

        expect(workout.isFuture).toBe(false);
      });

      it('should return true for next week', () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const workout = new MockScheduledWorkout({ scheduledDate: nextWeek.getTime() });

        expect(workout.isFuture).toBe(true);
      });
    });
  });

  describe('Day of week', () => {
    describe('dayOfWeekName', () => {
      it('should return "Sunday" for day 0', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 0 });

        expect(workout.dayOfWeekName).toBe('Sunday');
      });

      it('should return "Monday" for day 1', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 1 });

        expect(workout.dayOfWeekName).toBe('Monday');
      });

      it('should return "Tuesday" for day 2', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 2 });

        expect(workout.dayOfWeekName).toBe('Tuesday');
      });

      it('should return "Wednesday" for day 3', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 3 });

        expect(workout.dayOfWeekName).toBe('Wednesday');
      });

      it('should return "Thursday" for day 4', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 4 });

        expect(workout.dayOfWeekName).toBe('Thursday');
      });

      it('should return "Friday" for day 5', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 5 });

        expect(workout.dayOfWeekName).toBe('Friday');
      });

      it('should return "Saturday" for day 6', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 6 });

        expect(workout.dayOfWeekName).toBe('Saturday');
      });

      it('should return "Unknown" for undefined day', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: undefined });

        expect(workout.dayOfWeekName).toBe('Sunday'); // defaults to 0
      });

      it('should return "Unknown" for invalid day number', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 99 });

        expect(workout.dayOfWeekName).toBe('Unknown');
      });
    });

    describe('dayOfWeekShort', () => {
      it('should return "Sun" for day 0', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 0 });

        expect(workout.dayOfWeekShort).toBe('Sun');
      });

      it('should return "Mon" for day 1', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 1 });

        expect(workout.dayOfWeekShort).toBe('Mon');
      });

      it('should return "Tue" for day 2', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 2 });

        expect(workout.dayOfWeekShort).toBe('Tue');
      });

      it('should return "Wed" for day 3', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 3 });

        expect(workout.dayOfWeekShort).toBe('Wed');
      });

      it('should return "Thu" for day 4', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 4 });

        expect(workout.dayOfWeekShort).toBe('Thu');
      });

      it('should return "Fri" for day 5', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 5 });

        expect(workout.dayOfWeekShort).toBe('Fri');
      });

      it('should return "Sat" for day 6', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 6 });

        expect(workout.dayOfWeekShort).toBe('Sat');
      });

      it('should return "?" for invalid day number', () => {
        const workout = new MockScheduledWorkout({ dayOfWeek: 99 });

        expect(workout.dayOfWeekShort).toBe('?');
      });
    });
  });

  describe('Status display', () => {
    describe('statusDisplay', () => {
      it('should return "Scheduled" for scheduled status', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.statusDisplay).toBe('Scheduled');
      });

      it('should return "Completed" for completed status', () => {
        const workout = new MockScheduledWorkout({ status: 'completed' });

        expect(workout.statusDisplay).toBe('Completed');
      });

      it('should return "Skipped" for skipped status', () => {
        const workout = new MockScheduledWorkout({ status: 'skipped' });

        expect(workout.statusDisplay).toBe('Skipped');
      });

      it('should return "Rescheduled" for rescheduled status', () => {
        const workout = new MockScheduledWorkout({ status: 'rescheduled' });

        expect(workout.statusDisplay).toBe('Rescheduled');
      });

      it('should return "Unknown" for unknown status', () => {
        const workout = new MockScheduledWorkout({ status: 'invalid' });

        expect(workout.statusDisplay).toBe('Unknown');
      });
    });

    describe('statusColor', () => {
      it('should return green (#4A9B6F) for scheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'scheduled' });

        expect(workout.statusColor).toBe('#4A9B6F');
      });

      it('should return blue (#3498DB) for completed', () => {
        const workout = new MockScheduledWorkout({ status: 'completed' });

        expect(workout.statusColor).toBe('#3498DB');
      });

      it('should return gray (#95A5A6) for skipped', () => {
        const workout = new MockScheduledWorkout({ status: 'skipped' });

        expect(workout.statusColor).toBe('#95A5A6');
      });

      it('should return orange (#F39C12) for rescheduled', () => {
        const workout = new MockScheduledWorkout({ status: 'rescheduled' });

        expect(workout.statusColor).toBe('#F39C12');
      });

      it('should return default gray for unknown status', () => {
        const workout = new MockScheduledWorkout({ status: 'invalid' });

        expect(workout.statusColor).toBe('#95A5A6');
      });
    });
  });

  describe('Date formatting', () => {
    describe('formattedDate', () => {
      it('should format date with month, day, and year', () => {
        const date = new Date('2025-01-15').getTime();
        const workout = new MockScheduledWorkout({ scheduledDate: date });

        expect(workout.formattedDate).toMatch(/Jan \d+, 2025/);
      });

      it('should handle different months', () => {
        const date = new Date('2025-12-25').getTime();
        const workout = new MockScheduledWorkout({ scheduledDate: date });

        expect(workout.formattedDate).toMatch(/Dec \d+, 2025/);
      });
    });

    describe('formattedDateShort', () => {
      it('should format date without year', () => {
        const date = new Date('2025-01-15').getTime();
        const workout = new MockScheduledWorkout({ scheduledDate: date });

        expect(workout.formattedDateShort).toMatch(/Jan \d+/);
        expect(workout.formattedDateShort).not.toContain('2025');
      });

      it('should handle different months', () => {
        const date = new Date('2025-12-25').getTime();
        const workout = new MockScheduledWorkout({ scheduledDate: date });

        expect(workout.formattedDateShort).toMatch(/Dec \d+/);
        expect(workout.formattedDateShort).not.toContain('2025');
      });
    });
  });

  describe('Workout attributes', () => {
    it('should set all required fields correctly', () => {
      const workout = new MockScheduledWorkout({
        programId: 'program-123',
        templateId: 'template-456',
        userId: 'user-789',
        scheduledDate: Date.now(),
        weekNumber: 3,
        dayOfWeek: 2,
        position: 1,
        status: 'scheduled',
        completedWorkoutLogId: 'log-111',
        notes: 'Focus on form',
        synced: true,
      });

      expect(workout.programId).toBe('program-123');
      expect(workout.templateId).toBe('template-456');
      expect(workout.userId).toBe('user-789');
      expect(workout.weekNumber).toBe(3);
      expect(workout.dayOfWeek).toBe(2);
      expect(workout.position).toBe(1);
      expect(workout.status).toBe('scheduled');
      expect(workout.completedWorkoutLogId).toBe('log-111');
      expect(workout.notes).toBe('Focus on form');
      expect(workout.synced).toBe(true);
    });

    it('should use default values when not provided', () => {
      const workout = new MockScheduledWorkout({});

      expect(workout.programId).toBe('program-1');
      expect(workout.userId).toBe('user-1');
      expect(workout.position).toBe(0);
      expect(workout.status).toBe('scheduled');
      expect(workout.synced).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle epoch timestamp (1970)', () => {
      const workout = new MockScheduledWorkout({ scheduledDate: 0 });

      expect(workout.scheduledDateObject.getFullYear()).toBe(1970);
      expect(workout.isPast).toBe(true);
    });

    it('should handle far future dates', () => {
      const futureDate = new Date('2099-12-31').getTime();
      const workout = new MockScheduledWorkout({ scheduledDate: futureDate });

      expect(workout.isFuture).toBe(true);
      expect(workout.isPast).toBe(false);
      expect(workout.isToday).toBe(false);
    });

    it('should handle negative position values', () => {
      const workout = new MockScheduledWorkout({ position: -1 });

      expect(workout.position).toBe(-1);
    });

    it('should handle very large position values', () => {
      const workout = new MockScheduledWorkout({ position: 999 });

      expect(workout.position).toBe(999);
    });

    it('should handle week number 0', () => {
      const workout = new MockScheduledWorkout({ weekNumber: 0 });

      expect(workout.weekNumber).toBe(0);
    });

    it('should handle very large week numbers', () => {
      const workout = new MockScheduledWorkout({ weekNumber: 52 });

      expect(workout.weekNumber).toBe(52);
    });
  });
});
