/**
 * Unit tests for ReadinessService trend helper
 */

import { calculateReadinessTrend } from '../../src/services/readiness/ReadinessService';

// Mock WatermelonDB database to avoid native module requirement in Jest
jest.mock('../../src/services/database/watermelon/database', () => ({
  database: {
    get: jest.fn(),
    write: jest.fn(),
  },
}));

interface TestPoint {
  date: Date;
  score: number;
}

const makePoint = (daysAgo: number, score: number): TestPoint => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return { date: d, score };
};

describe('calculateReadinessTrend', () => {
  it('returns null for empty input', () => {
    expect(calculateReadinessTrend([])).toBeNull();
  });

  it('returns stable for single value', () => {
    const result = calculateReadinessTrend([makePoint(0, 70)]);
    expect(result).not.toBeNull();
    expect(result?.averageScore).toBe(70);
    expect(result?.direction).toBe('stable');
    expect(result?.change).toBe(0);
  });

  it('detects improving trend when recent scores are higher', () => {
    const points = [
      makePoint(6, 50),
      makePoint(5, 52),
      makePoint(4, 53),
      makePoint(3, 60),
      makePoint(2, 65),
      makePoint(1, 68),
      makePoint(0, 70),
    ];

    const result = calculateReadinessTrend(points);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('improving');
    expect(result!.change).toBeGreaterThan(0);
  });

  it('detects declining trend when recent scores are lower', () => {
    const points = [
      makePoint(6, 75),
      makePoint(5, 74),
      makePoint(4, 73),
      makePoint(3, 65),
      makePoint(2, 60),
      makePoint(1, 55),
      makePoint(0, 52),
    ];

    const result = calculateReadinessTrend(points);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('declining');
    expect(result!.change).toBeLessThan(0);
  });

  it('treats small changes as stable', () => {
    const points = [
      makePoint(3, 70),
      makePoint(2, 71),
      makePoint(1, 69),
      makePoint(0, 70),
    ];

    const result = calculateReadinessTrend(points);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('stable');
  });
});

