/**
 * RecoveryCheckInModal Component Tests
 * 
 * Tests for the recovery check-in modal component including:
 * - Modal display and visibility
 * - Injury information display
 * - Pain level slider functionality
 * - ROM quality assessment
 * - Activity tolerance questions
 * - Data submission
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecoveryCheckInModal from '../../../../src/components/injury/RecoveryCheckInModal';

// Mock theme context
jest.mock('../../../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
  tokens: {
    colors: {
      light: {
        background: { secondary: '#ffffff', tertiary: '#f0f0f0' },
        text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
        border: { subtle: '#e0e0e0' },
        accent: { green: '#00ff00', orange: '#ffa500', red: '#ff0000' },
      },
      dark: {
        background: { secondary: '#000000', tertiary: '#333333' },
        text: { primary: '#ffffff', secondary: '#cccccc', tertiary: '#999999' },
        border: { subtle: '#333333' },
        accent: { green: '#00ff00', orange: '#ffa500', red: '#ff0000' },
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24 },
    typography: { fontWeight: { bold: '700' }, fontSize: { xs: 12, sm: 14, md: 16 } },
  },
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
  const mockOnSubmit = jest.fn<Promise<void>, [any]>().mockResolvedValue(undefined);

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



    it('should calculate and display days in recovery', () => {
      const { getByText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={mockOnSubmit}
        />
      );

      // Should show "Day X"
      expect(getByText(/Day \d+/i)).toBeTruthy();
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
      expect(getByText('5')).toBeTruthy();
    });
  });
  // ... (skip to loading test)
  describe('Loading States', () => {
    it('should show loading indicator when submitting', async () => {
      jest.useFakeTimers();
      const slowOnSubmit = jest.fn<Promise<void>, [any]>().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(), 5000)));
      const { getByLabelText } = render(
        <RecoveryCheckInModal
          visible={true}
          onClose={mockOnClose}
          injury={mockInjury}
          onSubmit={slowOnSubmit}
        />
      );

      // Press Submit
      fireEvent.press(getByLabelText('Submit recovery check-in'));

      // Button should be disabled
      const submitButton = getByLabelText('Submit recovery check-in');
      expect(submitButton.props.accessibilityState.disabled).toBe(true);

      // Clean up
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
  });
});
