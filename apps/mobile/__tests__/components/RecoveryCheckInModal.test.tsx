/**
 * RecoveryCheckInModal Component Tests
 * 
 * Tests for the recovery check-in modal component including:
 * - Modal display and visibility
 * - Injury information display
 * - Pain level slider functionality
 * - ROM quality assessment
 * - Activity tolerance questions
 * - Recovery status buttons (Feeling Better, Still Injured, Getting Worse)
 * - Loading states
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecoveryCheckInModal from '../../src/components/injury/RecoveryCheckInModal';

// Mock theme context
jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

// Mock Slider component
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn((props) => {
    return React.createElement(View, {
      testID: 'slider',
      onValueChange: props.onValueChange,
      value: props.value,
    });
  });
});

describe('RecoveryCheckInModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const mockInjury = {
    id: 'injury-123',
    bodyPart: 'shoulder',
    severity: 'moderate',
    description: 'Shoulder strain from overhead press',
    reportedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Recovery Check-In/i)).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <RecoveryCheckInModal
          visible={false}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(queryByText(/Recovery Check-In/i)).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = getByLabelText('Close modal');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Injury Information Display', () => {
    it('should display injured body part', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/shoulder/i)).toBeTruthy();
    });

    it('should display injury severity', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/moderate/i)).toBeTruthy();
    });

    it('should display injury description if provided', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/overhead press/i)).toBeTruthy();
    });

    it('should calculate and display days in recovery', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      // Should show "Day X of recovery"
      expect(getByText(/Day \d+ of recovery/i)).toBeTruthy();
    });
  });

  describe('Pain Level Assessment', () => {
    it('should display pain level slider', () => {
      const { getByTestId } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByTestId('slider')).toBeTruthy();
    });

    it('should display pain level label', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Pain Level/i)).toBeTruthy();
    });

    it('should display current pain level value', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      // Default pain level should be 5
      expect(getByText(/5\/10/)).toBeTruthy();
    });
  });

  describe('ROM Quality Assessment', () => {
    it('should display ROM quality question', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Range of Motion/i)).toBeTruthy();
    });

    it('should display ROM quality options', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Better/i)).toBeTruthy();
      expect(getByText(/Same/i)).toBeTruthy();
      expect(getByText(/Worse/i)).toBeTruthy();
    });
  });

  describe('Activity Tolerance Assessment', () => {
    it('should display activity tolerance question', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Activity Tolerance/i)).toBeTruthy();
    });

    it('should display activity tolerance options', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Better/i)).toBeTruthy();
      expect(getByText(/Same/i)).toBeTruthy();
      expect(getByText(/Worse/i)).toBeTruthy();
    });
  });

  describe('Recovery Status Buttons', () => {
    it('should display Feeling Better button', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Feeling Better/i)).toBeTruthy();
    });

    it('should display Still Injured button', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Still Injured/i)).toBeTruthy();
    });

    it('should display Getting Worse button', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Getting Worse/i)).toBeTruthy();
    });

    it('should call onSubmit with "improving" status when Feeling Better is pressed', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const feelingBetterButton = getByLabelText(/Feeling better/i);
      fireEvent.press(feelingBetterButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'improving',
          })
        );
      });
    });

    it('should call onSubmit with "stable" status when Still Injured is pressed', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const stillInjuredButton = getByLabelText(/Still injured/i);
      fireEvent.press(stillInjuredButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'stable',
          })
        );
      });
    });

    it('should call onSubmit with "worsening" status when Getting Worse is pressed', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const gettingWorseButton = getByLabelText(/Getting worse/i);
      fireEvent.press(gettingWorseButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'worsening',
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when submitting', async () => {
      const slowOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const { getByLabelText, queryByTestId } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={slowOnSubmit}
        />
      );

      const feelingBetterButton = getByLabelText(/Feeling better/i);
      fireEvent.press(feelingBetterButton);

      // Should show loading indicator
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle injury with no description', () => {
      const injuryNoDescription = { ...mockInjury, description: undefined };
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={injuryNoDescription}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Recovery Check-In/i)).toBeTruthy();
    });

    it('should handle injury reported today', () => {
      const todayInjury = { ...mockInjury, reportedAt: new Date() };
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={todayInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/Day 0 of recovery/i)).toBeTruthy();
    });

    it('should handle severe injury', () => {
      const severeInjury = { ...mockInjury, severity: 'severe' };
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={severeInjury}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText(/severe/i)).toBeTruthy();
    });

    it('should handle mild injury', () => {
      const mildInjury = { ...mockInjury, severity: 'mild' };
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mildInjury}
          onSubmit=Human: {mockOnSubmit}
        />
      );

      expect(getByText(/mild/i)).toBeTruthy();
    });
  });

  describe('Data Submission', () => {
    it('should include pain level in submission data', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const feelingBetterButton = getByLabelText(/Feeling better/i);
      fireEvent.press(feelingBetterButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            painLevel: expect.any(Number),
          })
        );
      });
    });

    it('should include ROM quality in submission data', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const feelingBetterButton = getByLabelText(/Feeling better/i);
      fireEvent.press(feelingBetterButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            romQuality: expect.any(String),
          })
        );
      });
    });

    it('should include activity tolerance in submission data', async () => {
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      const feelingBetterButton = getByLabelText(/Feeling better/i);
      fireEvent.press(feelingBetterButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            activityTolerance: expect.any(String),
          })
        );
      });
    });
  });
});
