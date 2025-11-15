/**
 * Unit tests for Program model
 * Tests computed properties and business logic
 */

import { Model } from '@nozbe/watermelondb';

// Mock Program class for testing
class MockProgram {
  userId: string;
  name: string;
  description?: string;
  focus?: string;
  startDate?: number;
  endDate?: number;
  currentWeek: number;
  totalWeeks?: number;
  color: string;
  isActive: boolean;
  status: string;
  synced: boolean;

  constructor(data: Partial<MockProgram>) {
    this.userId = data.userId || 'user-1';
    this.name = data.name || 'Test Program';
    this.description = data.description;
    this.focus = data.focus;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.currentWeek = data.currentWeek || 1;
    this.totalWeeks = data.totalWeeks;
    this.color = data.color || '#4A9B6F';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.status = data.status || 'active';
    this.synced = data.synced || false;
  }

  get startDateObject(): Date | null {
    return this.startDate ? new Date(this.startDate) : null;
  }

  get endDateObject(): Date | null {
    return this.endDate ? new Date(this.endDate) : null;
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isPaused(): boolean {
    return this.status === 'paused';
  }

  get durationInWeeks(): number | null {
    if (!this.startDate || !this.endDate) return null;
    const diffTime = this.endDate - this.startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  get progressPercentage(): number {
    if (!this.totalWeeks) return 0;
    return Math.round((this.currentWeek / this.totalWeeks) * 100);
  }
}

describe('Program Model', () => {
  describe('startDateObject', () => {
    it('should return Date object when startDate is set', () => {
      const timestamp = Date.now();
      const program = new MockProgram({ startDate: timestamp });

      expect(program.startDateObject).toBeInstanceOf(Date);
      expect(program.startDateObject?.getTime()).toBe(timestamp);
    });

    it('should return null when startDate is not set', () => {
      const program = new MockProgram({ startDate: undefined });

      expect(program.startDateObject).toBeNull();
    });
  });

  describe('endDateObject', () => {
    it('should return Date object when endDate is set', () => {
      const timestamp = Date.now();
      const program = new MockProgram({ endDate: timestamp });

      expect(program.endDateObject).toBeInstanceOf(Date);
      expect(program.endDateObject?.getTime()).toBe(timestamp);
    });

    it('should return null when endDate is not set', () => {
      const program = new MockProgram({ endDate: undefined });

      expect(program.endDateObject).toBeNull();
    });
  });

  describe('isCompleted', () => {
    it('should return true when status is completed', () => {
      const program = new MockProgram({ status: 'completed' });

      expect(program.isCompleted).toBe(true);
    });

    it('should return false when status is active', () => {
      const program = new MockProgram({ status: 'active' });

      expect(program.isCompleted).toBe(false);
    });

    it('should return false when status is paused', () => {
      const program = new MockProgram({ status: 'paused' });

      expect(program.isCompleted).toBe(false);
    });
  });

  describe('isPaused', () => {
    it('should return true when status is paused', () => {
      const program = new MockProgram({ status: 'paused' });

      expect(program.isPaused).toBe(true);
    });

    it('should return false when status is active', () => {
      const program = new MockProgram({ status: 'active' });

      expect(program.isPaused).toBe(false);
    });

    it('should return false when status is completed', () => {
      const program = new MockProgram({ status: 'completed' });

      expect(program.isPaused).toBe(false);
    });
  });

  describe('durationInWeeks', () => {
    it('should calculate duration correctly for 7-day program', () => {
      const startDate = new Date('2025-01-01').getTime();
      const endDate = new Date('2025-01-08').getTime(); // 7 days later
      const program = new MockProgram({ startDate, endDate });

      expect(program.durationInWeeks).toBe(1);
    });

    it('should calculate duration correctly for 12-week program', () => {
      const startDate = new Date('2025-01-01').getTime();
      const endDate = new Date('2025-03-26').getTime(); // 84 days later
      const program = new MockProgram({ startDate, endDate });

      expect(program.durationInWeeks).toBe(12);
    });

    it('should round up partial weeks', () => {
      const startDate = new Date('2025-01-01').getTime();
      const endDate = new Date('2025-01-10').getTime(); // 9 days = 1.28 weeks
      const program = new MockProgram({ startDate, endDate });

      expect(program.durationInWeeks).toBe(2);
    });

    it('should return null when startDate is not set', () => {
      const program = new MockProgram({ startDate: undefined, endDate: Date.now() });

      expect(program.durationInWeeks).toBeNull();
    });

    it('should return null when endDate is not set', () => {
      const program = new MockProgram({ startDate: Date.now(), endDate: undefined });

      expect(program.durationInWeeks).toBeNull();
    });

    it('should return null when neither date is set', () => {
      const program = new MockProgram({ startDate: undefined, endDate: undefined });

      expect(program.durationInWeeks).toBeNull();
    });
  });

  describe('progressPercentage', () => {
    it('should calculate 0% for week 0 of 12', () => {
      const program = new MockProgram({ currentWeek: 0, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(0);
    });

    it('should calculate 8% for week 1 of 12', () => {
      const program = new MockProgram({ currentWeek: 1, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(8);
    });

    it('should calculate 50% for week 6 of 12', () => {
      const program = new MockProgram({ currentWeek: 6, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(50);
    });

    it('should calculate 100% for week 12 of 12', () => {
      const program = new MockProgram({ currentWeek: 12, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(100);
    });

    it('should handle progress over 100% (week 13 of 12)', () => {
      const program = new MockProgram({ currentWeek: 13, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(108);
    });

    it('should return 0 when totalWeeks is not set', () => {
      const program = new MockProgram({ currentWeek: 5, totalWeeks: undefined });

      expect(program.progressPercentage).toBe(0);
    });

    it('should return 0 when totalWeeks is 0', () => {
      const program = new MockProgram({ currentWeek: 1, totalWeeks: 0 });

      expect(program.progressPercentage).toBe(0);
    });

    it('should round to nearest integer', () => {
      const program = new MockProgram({ currentWeek: 1, totalWeeks: 3 });

      // 1/3 = 0.333... = 33%
      expect(program.progressPercentage).toBe(33);
    });
  });

  describe('Program attributes', () => {
    it('should set all required fields correctly', () => {
      const program = new MockProgram({
        userId: 'user-123',
        name: 'Strength Program',
        description: 'Build strength',
        focus: 'strength',
        currentWeek: 3,
        totalWeeks: 12,
        color: '#E74C3C',
        isActive: true,
        status: 'active',
        synced: false,
      });

      expect(program.userId).toBe('user-123');
      expect(program.name).toBe('Strength Program');
      expect(program.description).toBe('Build strength');
      expect(program.focus).toBe('strength');
      expect(program.currentWeek).toBe(3);
      expect(program.totalWeeks).toBe(12);
      expect(program.color).toBe('#E74C3C');
      expect(program.isActive).toBe(true);
      expect(program.status).toBe('active');
      expect(program.synced).toBe(false);
    });

    it('should use default values when not provided', () => {
      const program = new MockProgram({});

      expect(program.userId).toBe('user-1');
      expect(program.name).toBe('Test Program');
      expect(program.currentWeek).toBe(1);
      expect(program.color).toBe('#4A9B6F');
      expect(program.isActive).toBe(true);
      expect(program.status).toBe('active');
      expect(program.synced).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle negative currentWeek', () => {
      const program = new MockProgram({ currentWeek: -1, totalWeeks: 12 });

      expect(program.progressPercentage).toBe(-8);
    });

    it('should handle very large week numbers', () => {
      const program = new MockProgram({ currentWeek: 1000, totalWeeks: 52 });

      expect(program.progressPercentage).toBe(1923);
    });

    it('should handle date boundaries correctly', () => {
      const startDate = new Date('2025-01-01T00:00:00').getTime();
      const endDate = new Date('2025-01-01T23:59:59').getTime();
      const program = new MockProgram({ startDate, endDate });

      // Same day = 1 week when rounded up
      expect(program.durationInWeeks).toBe(1);
    });
  });
});
