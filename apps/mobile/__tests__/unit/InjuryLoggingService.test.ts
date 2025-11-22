/**
 * Unit Tests for InjuryLoggingService
 * 
 * Tests CRUD operations, WatermelonDB storage, and business logic
 * for injury logging and recovery tracking.
 */

import { InjuryLoggingService } from '../../src/services/injury/InjuryLoggingService';
import { database } from '../../src/services/database/watermelon/database';

// Mock WatermelonDB
jest.mock('../../src/services/database/watermelon/database', () => ({
  database: {
    get: jest.fn(),
    write: jest.fn(),
  },
}));

describe('InjuryLoggingService', () => {
  let mockCollection: any;
  let mockInjury: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock injury object
    mockInjury = {
      id: 'injury-123',
      userId: 'user-456',
      bodyPart: 'shoulder',
      severity: 'mild',
      description: 'Sore from overhead press',
      status: 'active',
      reportedAt: new Date('2025-01-01'),
      resolvedAt: null,
      lastCheckInAt: null,
      synced: false,
      update: jest.fn(),
      markAsDeleted: jest.fn(),
    };

    // Mock collection
    mockCollection = {
      create: jest.fn(),
      find: jest.fn(),
      query: jest.fn(() => ({
        fetch: jest.fn(),
      })),
    };

    (database.get as jest.Mock).mockReturnValue(mockCollection);
  });

  describe('createInjuryLog', () => {
    it('should create a new injury log with all fields', async () => {
      const params = {
        userId: 'user-456',
        bodyPart: 'shoulder',
        severity: 'mild' as const,
        description: 'Sore from overhead press',
        status: 'active' as const,
      };

      mockCollection.create.mockImplementation((callback: any) => {
        const injury = { ...mockInjury };
        callback(injury);
        return Promise.resolve(injury);
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.createInjuryLog(params);

      expect(database.get).toHaveBeenCalledWith('injury_logs');
      expect(database.write).toHaveBeenCalled();
      expect(result.userId).toBe('user-456');
      expect(result.bodyPart).toBe('shoulder');
      expect(result.severity).toBe('mild');
      expect(result.status).toBe('active');
    });

    it('should create injury with default status "active"', async () => {
      const params = {
        userId: 'user-456',
        bodyPart: 'knee',
        severity: 'moderate' as const,
      };

      mockCollection.create.mockImplementation((callback: any) => {
        const injury = { ...mockInjury, status: 'active' };
        callback(injury);
        return Promise.resolve(injury);
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.createInjuryLog(params);

      expect(result.status).toBe('active');
    });

    it('should set synced to false for new injuries', async () => {
      const params = {
        userId: 'user-456',
        bodyPart: 'lower_back',
        severity: 'severe' as const,
      };

      mockCollection.create.mockImplementation((callback: any) => {
        const injury = { ...mockInjury, synced: false };
        callback(injury);
        return Promise.resolve(injury);
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.createInjuryLog(params);

      expect(result.synced).toBe(false);
    });
  });

  describe('getActiveInjuries', () => {
    it('should return active and recovering injuries', async () => {
      const mockActiveInjuries = [
        { ...mockInjury, status: 'active' },
        { ...mockInjury, id: 'injury-124', status: 'recovering' },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockActiveInjuries),
      });

      const result = await InjuryLoggingService.getActiveInjuries('user-456');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('active');
      expect(result[1].status).toBe('recovering');
    });

    it('should not return resolved injuries', async () => {
      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      });

      const result = await InjuryLoggingService.getActiveInjuries('user-456');

      expect(result).toHaveLength(0);
    });

    it('should sort injuries by reported_at descending', async () => {
      const mockInjuries = [
        { ...mockInjury, reportedAt: new Date('2025-01-01') },
        { ...mockInjury, id: 'injury-124', reportedAt: new Date('2025-01-05') },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockInjuries),
      });

      const result = await InjuryLoggingService.getActiveInjuries('user-456');

      expect(result).toHaveLength(2);
    });
  });

  describe('getAllInjuries', () => {
    it('should return all injuries including resolved', async () => {
      const mockAllInjuries = [
        { ...mockInjury, status: 'active' },
        { ...mockInjury, id: 'injury-124', status: 'resolved' },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockAllInjuries),
      });

      const result = await InjuryLoggingService.getAllInjuries('user-456');

      expect(result).toHaveLength(2);
    });
  });

  describe('getInjuryById', () => {
    it('should return injury when found', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      const result = await InjuryLoggingService.getInjuryById('injury-123');

      expect(result).toEqual(mockInjury);
      expect(mockCollection.find).toHaveBeenCalledWith('injury-123');
    });

    it('should return null when injury not found', async () => {
      mockCollection.find.mockRejectedValue(new Error('Not found'));

      const result = await InjuryLoggingService.getInjuryById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateInjuryStatus', () => {
    it('should update injury status', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);
      
      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({ ...mockInjury, status: 'recovering' });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.updateInjuryStatus('injury-123', {
        status: 'recovering',
      });

      expect(result?.status).toBe('recovering');
      expect(mockInjury.update).toHaveBeenCalled();
    });

    it('should set resolvedAt when provided', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);
      const resolvedDate = new Date('2025-01-15');

      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({ ...mockInjury, resolvedAt: resolvedDate });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.updateInjuryStatus('injury-123', {
        status: 'resolved',
        resolvedAt: resolvedDate,
      });

      expect(result?.resolvedAt).toEqual(resolvedDate);
    });

    it('should set synced to false when updating', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({ ...mockInjury, synced: false });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.updateInjuryStatus('injury-123', {
        status: 'recovering',
      });

      expect(result?.synced).toBe(false);
    });

    it('should return null when injury not found', async () => {
      mockCollection.find.mockRejectedValue(new Error('Not found'));

      const result = await InjuryLoggingService.updateInjuryStatus('invalid-id', {
        status: 'resolved',
      });

      expect(result).toBeNull();
    });
  });

  describe('resolveInjury', () => {
    it('should mark injury as resolved with timestamp', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({ 
          ...mockInjury, 
          status: 'resolved',
          resolvedAt: expect.any(Date),
        });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.resolveInjury('injury-123');

      expect(result?.status).toBe('resolved');
      expect(result?.resolvedAt).toBeDefined();
    });
  });

  describe('updateLastCheckIn', () => {
    it('should update last check-in timestamp', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({
          ...mockInjury,
          lastCheckInAt: expect.any(Date),
        });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.updateLastCheckIn('injury-123');

      expect(result?.lastCheckInAt).toBeDefined();
      expect(mockInjury.update).toHaveBeenCalled();
    });

    it('should set synced to false when updating check-in', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      mockInjury.update.mockImplementation((callback: any) => {
        callback(mockInjury);
        return Promise.resolve({ ...mockInjury, synced: false });
      });

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.updateLastCheckIn('injury-123');

      expect(result?.synced).toBe(false);
    });

    it('should return null when injury not found', async () => {
      mockCollection.find.mockRejectedValue(new Error('Not found'));

      const result = await InjuryLoggingService.updateLastCheckIn('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getInjuriesNeedingCheckIn', () => {
    it('should return injuries needing check-in (7+ days)', async () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

      const mockActiveInjuries = [
        {
          ...mockInjury,
          reportedAt: eightDaysAgo,
          lastCheckInAt: null,
        },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockActiveInjuries),
      });

      const result = await InjuryLoggingService.getInjuriesNeedingCheckIn('user-456');

      expect(result).toHaveLength(1);
    });

    it('should not return injuries checked in recently', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const mockActiveInjuries = [
        {
          ...mockInjury,
          reportedAt: new Date('2025-01-01'),
          lastCheckInAt: twoDaysAgo,
        },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockActiveInjuries),
      });

      const result = await InjuryLoggingService.getInjuriesNeedingCheckIn('user-456');

      expect(result).toHaveLength(0);
    });

    it('should use reportedAt when lastCheckInAt is null', async () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

      const mockActiveInjuries = [
        {
          ...mockInjury,
          reportedAt: eightDaysAgo,
          lastCheckInAt: null,
        },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockActiveInjuries),
      });

      const result = await InjuryLoggingService.getInjuriesNeedingCheckIn('user-456');

      expect(result).toHaveLength(1);
    });
  });

  describe('deleteInjury', () => {
    it('should mark injury as deleted', async () => {
      mockCollection.find.mockResolvedValue(mockInjury);

      (database.write as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback();
      });

      const result = await InjuryLoggingService.deleteInjury('injury-123');

      expect(result).toBe(true);
      expect(mockInjury.markAsDeleted).toHaveBeenCalled();
    });

    it('should return false when injury not found', async () => {
      mockCollection.find.mockRejectedValue(new Error('Not found'));

      const result = await InjuryLoggingService.deleteInjury('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('getInjuryCountBySeverity', () => {
    it('should count injuries by severity', async () => {
      const mockAllInjuries = [
        { ...mockInjury, severity: 'mild' },
        { ...mockInjury, id: 'injury-124', severity: 'mild' },
        { ...mockInjury, id: 'injury-125', severity: 'moderate' },
        { ...mockInjury, id: 'injury-126', severity: 'severe' },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockAllInjuries),
      });

      const result = await InjuryLoggingService.getInjuryCountBySeverity('user-456');

      expect(result.mild).toBe(2);
      expect(result.moderate).toBe(1);
      expect(result.severe).toBe(1);
    });

    it('should return zero counts when no injuries', async () => {
      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      });

      const result = await InjuryLoggingService.getInjuryCountBySeverity('user-456');

      expect(result.mild).toBe(0);
      expect(result.moderate).toBe(0);
      expect(result.severe).toBe(0);
    });
  });

  describe('getInjuryCountByBodyPart', () => {
    it('should count injuries by body part', async () => {
      const mockAllInjuries = [
        { ...mockInjury, bodyPart: 'shoulder' },
        { ...mockInjury, id: 'injury-124', bodyPart: 'shoulder' },
        { ...mockInjury, id: 'injury-125', bodyPart: 'knee' },
        { ...mockInjury, id: 'injury-126', bodyPart: 'lower_back' },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockAllInjuries),
      });

      const result = await InjuryLoggingService.getInjuryCountByBodyPart('user-456');

      expect(result.shoulder).toBe(2);
      expect(result.knee).toBe(1);
      expect(result.lower_back).toBe(1);
    });

    it('should return empty object when no injuries', async () => {
      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      });

      const result = await InjuryLoggingService.getInjuryCountByBodyPart('user-456');

      expect(result).toEqual({});
    });
  });

  describe('getAverageRecoveryTime', () => {
    it('should calculate average recovery time in days', async () => {
      const reportedDate = new Date('2025-01-01');
      const resolvedDate = new Date('2025-01-15'); // 14 days later

      const mockResolvedInjuries = [
        {
          ...mockInjury,
          status: 'resolved',
          reportedAt: reportedDate,
          resolvedAt: resolvedDate,
        },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockResolvedInjuries),
      });

      const result = await InjuryLoggingService.getAverageRecoveryTime('user-456');

      expect(result).toBe(14);
    });

    it('should return null when no resolved injuries', async () => {
      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      });

      const result = await InjuryLoggingService.getAverageRecoveryTime('user-456');

      expect(result).toBeNull();
    });

    it('should calculate average across multiple injuries', async () => {
      const mockResolvedInjuries = [
        {
          ...mockInjury,
          status: 'resolved',
          reportedAt: new Date('2025-01-01'),
          resolvedAt: new Date('2025-01-08'), // 7 days
        },
        {
          ...mockInjury,
          id: 'injury-124',
          status: 'resolved',
          reportedAt: new Date('2025-01-01'),
          resolvedAt: new Date('2025-01-22'), // 21 days
        },
      ];

      mockCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockResolvedInjuries),
      });

      const result = await InjuryLoggingService.getAverageRecoveryTime('user-456');

      expect(result).toBe(14); // (7 + 21) / 2 = 14
    });
  });
});
