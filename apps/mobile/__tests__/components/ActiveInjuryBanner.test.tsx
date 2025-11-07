/**
 * ActiveInjuryBanner Component Tests
 * 
 * Tests for the active injury banner component including:
 * - Banner display and visibility
 * - Multiple injuries display
 * - Days in recovery calculation
 * - Check-in button functionality
 * - Severity color coding
 * - Injury status display
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActiveInjuryBanner from '../../src/components/injury/ActiveInjuryBanner';

// Mock theme context
jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('ActiveInjuryBanner', () => {
  const mockOnCheckInPress = jest.fn();

  const mockInjuries = [
    {
      id: 'injury-1',
      bodyPart: 'shoulder',
      severity: 'moderate' as const,
      description: 'Shoulder strain',
      status: 'active' as const,
      reportedAt: new Date('2025-01-01'),
      lastCheckInAt: undefined,
    },
    {
      id: 'injury-2',
      bodyPart: 'lower_back',
      severity: 'mild' as const,
      description: 'Lower back tightness',
      status: 'recovering' as const,
      reportedAt: new Date('2024-12-25'),
      lastCheckInAt: new Date('2025-01-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Banner Display', () => {
    it('should render when injuries are provided', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Active Injuries/i)).toBeTruthy();
    });

    it('should not render when no injuries provided', () => {
      const { queryByText } = render(
        <ActiveInjuryBanner
          injuries={[]}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(queryByText(/Active Injuries/i)).toBeNull();
    });

    it('should display injury count in header', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/2/)).toBeTruthy();
    });

    it('should display singular "injury" for single injury', () => {
      const singleInjury = [mockInjuries[0]];
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={singleInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/1 Active Injury/i)).toBeTruthy();
    });

    it('should display plural "injuries" for multiple injuries', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/2 Active Injuries/i)).toBeTruthy();
    });
  });

  describe('Injury Information Display', () => {
    it('should display all injury body parts', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/shoulder/i)).toBeTruthy();
      expect(getByText(/lower back/i)).toBeTruthy();
    });

    it('should display injury severity', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/moderate/i)).toBeTruthy();
      expect(getByText(/mild/i)).toBeTruthy();
    });

    it('should display injury status', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/active/i)).toBeTruthy();
      expect(getByText(/recovering/i)).toBeTruthy();
    });

    it('should display injury description if provided', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Shoulder strain/i)).toBeTruthy();
      expect(getByText(/Lower back tightness/i)).toBeTruthy();
    });
  });

  describe('Days in Recovery Calculation', () => {
    it('should calculate and display days in recovery', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      // Should show "Day X of recovery" for each injury
      expect(getByText(/Day \d+ of recovery/i)).toBeTruthy();
    });

    it('should show Day 0 for injury reported today', () => {
      const todayInjury = [{
        ...mockInjuries[0],
        reportedAt: new Date(),
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={todayInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Day 0 of recovery/i)).toBeTruthy();
    });

    it('should calculate correct days for old injury', () => {
      const oldInjury = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={oldInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Day 14 of recovery/i)).toBeTruthy();
    });
  });

  describe('Check-In Button', () => {
    it('should display check-in button for injuries needing check-in', () => {
      const injuryNeedingCheckIn = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastCheckInAt: undefined,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={injuryNeedingCheckIn}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Weekly Check-In Due/i)).toBeTruthy();
    });

    it('should not display check-in button for recent injuries', () => {
      const recentInjury = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        lastCheckInAt: undefined,
      }];

      const { queryByText } = render(
        <ActiveInjuryBanner
          injuries={recentInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(queryByText(/Weekly Check-In Due/i)).toBeNull();
    });

    it('should call onCheckInPress with injury when check-in button is pressed', () => {
      const injuryNeedingCheckIn = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastCheckInAt: undefined,
      }];

      const { getByLabelText } = render(
        <ActiveInjuryBanner
          injuries={injuryNeedingCheckIn}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      const checkInButton = getByLabelText(/Weekly recovery check-in/i);
      fireEvent.press(checkInButton);

      expect(mockOnCheckInPress).toHaveBeenCalledTimes(1);
      expect(mockOnCheckInPress).toHaveBeenCalledWith(injuryNeedingCheckIn[0]);
    });

    it('should display check-in button when last check-in was 7+ days ago', () => {
      const injuryWithOldCheckIn = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        lastCheckInAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={injuryWithOldCheckIn}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/Weekly Check-In Due/i)).toBeTruthy();
    });

    it('should not display check-in button when last check-in was recent', () => {
      const injuryWithRecentCheckIn = [{
        ...mockInjuries[0],
        reportedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        lastCheckInAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      }];

      const { queryByText } = render(
        <ActiveInjuryBanner
          injuries={injuryWithRecentCheckIn}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(queryByText(/Weekly Check-In Due/i)).toBeNull();
    });
  });

  describe('Severity Color Coding', () => {
    it('should render mild severity injury', () => {
      const mildInjury = [{
        ...mockInjuries[0],
        severity: 'mild' as const,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mildInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/mild/i)).toBeTruthy();
    });

    it('should render moderate severity injury', () => {
      const moderateInjury = [{
        ...mockInjuries[0],
        severity: 'moderate' as const,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={moderateInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/moderate/i)).toBeTruthy();
    });

    it('should render severe severity injury', () => {
      const severeInjury = [{
        ...mockInjuries[0],
        severity: 'severe' as const,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={severeInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/severe/i)).toBeTruthy();
    });
  });

  describe('Multiple Injuries', () => {
    it('should display all injuries in scrollable list', () => {
      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={mockInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      // Both injuries should be visible
      expect(getByText(/shoulder/i)).toBeTruthy();
      expect(getByText(/lower back/i)).toBeTruthy();
    });

    it('should handle 3+ injuries', () => {
      const manyInjuries = [
        ...mockInjuries,
        {
          id: 'injury-3',
          bodyPart: 'knee',
          severity: 'severe' as const,
          description: 'Knee pain',
          status: 'active' as const,
          reportedAt: new Date('2024-12-20'),
          lastCheckInAt: undefined,
        },
      ];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={manyInjuries}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/3 Active Injuries/i)).toBeTruthy();
      expect(getByText(/shoulder/i)).toBeTruthy();
      expect(getByText(/lower back/i)).toBeTruthy();
      expect(getByText(/knee/i)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle injury with no description', () => {
      const noDescriptionInjury = [{
        ...mockInjuries[0],
        description: undefined,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={noDescriptionInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/shoulder/i)).toBeTruthy();
    });

    it('should handle resolved status', () => {
      const resolvedInjury = [{
        ...mockInjuries[0],
        status: 'resolved' as const,
      }];

      const { getByText } = render(
        <ActiveInjuryBanner
          injuries={resolvedInjury}
          onCheckInPress={mockOnCheckInPress}
        />
      );

      expect(getByText(/resolved/i)).toBeTruthy();
    });
  });
});

