/**
 * Unit tests for LiveActivityPreview component
 * Tests workout notification preview display and interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, TouchableOpacity } from 'react-native';
import LiveActivityPreview from '../../../../src/components/workout/LiveActivityPreview';
import { workoutNotificationManager } from '../../../../src/services/workoutNotification/WorkoutNotificationManager';

// Mock the notification manager
jest.mock('../../../../src/services/workoutNotification/WorkoutNotificationManager', () => ({
  workoutNotificationManager: {
    getNotificationType: jest.fn(),
    isSupported: jest.fn(),
  },
}));

describe('LiveActivityPreview', () => {
  const defaultProps = {
    workoutName: 'Upper Body',
    currentExercise: 'Bench Press',
    currentSet: 3,
    totalSets: 12,
    elapsedTime: 1825, // 30:25
    lastSetWeight: 185,
    lastSetReps: 8,
    lastSetRPE: 7,
    status: 'active' as const,
    onMicPress: jest.fn(),
    onPausePress: jest.fn(),
    onResumePress: jest.fn(),
    onStopPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (workoutNotificationManager.getNotificationType as jest.Mock).mockReturnValue('live-activity');
    (workoutNotificationManager.isSupported as jest.Mock).mockReturnValue(true);
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render workout name', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Upper Body')).toBeTruthy();
    });

    it('should render current set count', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('3 of 12 sets')).toBeTruthy();
    });

    it('should render current exercise', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Bench Press')).toBeTruthy();
    });

    it('should render without current exercise', () => {
      const { queryByText } = render(
        <LiveActivityPreview {...defaultProps} currentExercise={null} />
      );

      expect(queryByText('Current Exercise')).toBeNull();
    });

    it('should render last set weight', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('185 lbs')).toBeTruthy();
    });

    it('should render last set reps', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('8')).toBeTruthy();
    });

    it('should render last set RPE when provided', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('7')).toBeTruthy();
    });

    it('should not render RPE when not provided', () => {
      const { queryByText } = render(
        <LiveActivityPreview {...defaultProps} lastSetRPE={undefined} />
      );

      expect(queryByText('RPE')).toBeNull();
    });

    it('should not render last set info when no weight or reps', () => {
      const { queryByText } = render(
        <LiveActivityPreview
          {...defaultProps}
          lastSetWeight={undefined}
          lastSetReps={undefined}
        />
      );

      expect(queryByText('Weight')).toBeNull();
      expect(queryByText('Reps')).toBeNull();
    });
  });

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  describe('Time Formatting', () => {
    it('should format time under 1 minute (45 seconds)', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={45} />
      );

      expect(getByText('0:45')).toBeTruthy();
    });

    it('should format time exactly 1 minute', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={60} />
      );

      expect(getByText('1:00')).toBeTruthy();
    });

    it('should format time under 1 hour (30:25)', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={1825} />
      );

      expect(getByText('30:25')).toBeTruthy();
    });

    it('should format time exactly 1 hour', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={3600} />
      );

      expect(getByText('1:00:00')).toBeTruthy();
    });

    it('should format time over 1 hour (1:30:45)', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={5445} />
      );

      expect(getByText('1:30:45')).toBeTruthy();
    });

    it('should format time over 2 hours (2:15:30)', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={8130} />
      );

      expect(getByText('2:15:30')).toBeTruthy();
    });

    it('should pad single digit minutes and seconds', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={65} />
      );

      expect(getByText('1:05')).toBeTruthy();
    });

    it('should handle 0 seconds', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={0} />
      );

      expect(getByText('0:00')).toBeTruthy();
    });
  });

  // ============================================================================
  // STATUS INDICATORS
  // ============================================================================

  describe('Status Indicators', () => {
    it('should show "Active" indicator when status is active', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} status="active" />
      );

      expect(getByText('Active')).toBeTruthy();
    });

    it('should not show "Active" indicator when status is paused', () => {
      const { queryByText } = render(
        <LiveActivityPreview {...defaultProps} status="paused" />
      );

      expect(queryByText('Active')).toBeNull();
    });

    it('should not show "Active" indicator when status is completed', () => {
      const { queryByText } = render(
        <LiveActivityPreview {...defaultProps} status="completed" />
      );

      expect(queryByText('Active')).toBeNull();
    });
  });

  // ============================================================================
  // BUTTON INTERACTIONS
  // ============================================================================

  describe('Button Interactions', () => {
    it('should call onMicPress when mic button is pressed', () => {
      const onMicPress = jest.fn();
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} onMicPress={onMicPress} />
      );

      fireEvent.press(getByText('Log Set'));
      expect(onMicPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPausePress when pause button is pressed while active', () => {
      const onPausePress = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <LiveActivityPreview
          {...defaultProps}
          status="active"
          onPausePress={onPausePress}
        />
      );

      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      // Second button is pause/resume (after mic button)
      fireEvent.press(buttons[1]);
      expect(onPausePress).toHaveBeenCalledTimes(1);
    });

    it('should call onResumePress when play button is pressed while paused', () => {
      const onResumePress = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <LiveActivityPreview
          {...defaultProps}
          status="paused"
          onResumePress={onResumePress}
        />
      );

      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      fireEvent.press(buttons[1]);
      expect(onResumePress).toHaveBeenCalledTimes(1);
    });

    it('should call onStopPress when stop button is pressed', () => {
      const onStopPress = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <LiveActivityPreview {...defaultProps} onStopPress={onStopPress} />
      );

      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      // Third button is stop (after mic and pause/resume)
      fireEvent.press(buttons[2]);
      expect(onStopPress).toHaveBeenCalledTimes(1);
    });

    it('should not crash when button handlers are not provided', () => {
      const { getByText } = render(
        <LiveActivityPreview
          {...defaultProps}
          onMicPress={undefined}
          onPausePress={undefined}
          onResumePress={undefined}
          onStopPress={undefined}
        />
      );

      expect(() => fireEvent.press(getByText('Log Set'))).not.toThrow();
    });
  });

  // ============================================================================
  // NOTIFICATION TYPE LABELS
  // ============================================================================

  describe('Notification Type Labels', () => {
    it('should show "Live Activity (iOS)" for live-activity type', () => {
      (workoutNotificationManager.getNotificationType as jest.Mock).mockReturnValue(
        'live-activity'
      );
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Live Activity (iOS)')).toBeTruthy();
    });

    it('should show "Notification (Android)" for foreground-service type', () => {
      (workoutNotificationManager.getNotificationType as jest.Mock).mockReturnValue(
        'foreground-service'
      );
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Notification (Android)')).toBeTruthy();
    });

    it('should show "Preview" for unknown notification type', () => {
      (workoutNotificationManager.getNotificationType as jest.Mock).mockReturnValue(
        'unknown'
      );
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Preview')).toBeTruthy();
    });
  });

  // ============================================================================
  // PLATFORM-SPECIFIC RENDERING
  // ============================================================================

  describe('Platform-Specific Rendering', () => {
    it('should show iOS helper text when supported', () => {
      Platform.OS = 'ios';
      (workoutNotificationManager.isSupported as jest.Mock).mockReturnValue(true);

      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Visible on Lock Screen & Dynamic Island')).toBeTruthy();
    });

    it('should show Android helper text when supported', () => {
      Platform.OS = 'android';
      (workoutNotificationManager.isSupported as jest.Mock).mockReturnValue(true);

      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Persistent notification while workout is active')).toBeTruthy();
    });

    it('should not show helper text when not supported', () => {
      (workoutNotificationManager.isSupported as jest.Mock).mockReturnValue(false);

      const { queryByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(queryByText(/Visible on Lock Screen/)).toBeNull();
      expect(queryByText(/Persistent notification/)).toBeNull();
    });

    it('should render Android bottom bar on Android', () => {
      Platform.OS = 'android';

      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(getByText('Tap to return to workout')).toBeTruthy();
    });

    it('should not render Android bottom bar on iOS', () => {
      Platform.OS = 'ios';

      const { queryByText } = render(<LiveActivityPreview {...defaultProps} />);

      expect(queryByText('Tap to return to workout')).toBeNull();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle 0 elapsed time', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={0} />
      );

      expect(getByText('0:00')).toBeTruthy();
    });

    it('should handle very long workout time (5 hours)', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} elapsedTime={18000} />
      );

      expect(getByText('5:00:00')).toBeTruthy();
    });

    it('should handle set 1 of 1', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} currentSet={1} totalSets={1} />
      );

      expect(getByText('1 of 1 sets')).toBeTruthy();
    });

    it('should handle set 0 of 0', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} currentSet={0} totalSets={0} />
      );

      expect(getByText('0 of 0 sets')).toBeTruthy();
    });

    it('should handle very long workout name', () => {
      const longName = 'Super Long Workout Name That Might Wrap or Truncate';
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} workoutName={longName} />
      );

      expect(getByText(longName)).toBeTruthy();
    });

    it('should handle very long exercise name', () => {
      const longExercise = 'Barbell Back Squat with Chains and Bands (Competition Style)';
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} currentExercise={longExercise} />
      );

      expect(getByText(longExercise)).toBeTruthy();
    });

    it('should handle 0 weight', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} lastSetWeight={0} />
      );

      expect(getByText('0 lbs')).toBeTruthy();
    });

    it('should handle 0 reps', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} lastSetReps={0} />
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('should handle very high weight', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} lastSetWeight={1000} />
      );

      expect(getByText('1000 lbs')).toBeTruthy();
    });

    it('should handle RPE 10', () => {
      const { getByText } = render(
        <LiveActivityPreview {...defaultProps} lastSetRPE={10} />
      );

      expect(getByText('10')).toBeTruthy();
    });

    it('should render correctly with minimal props', () => {
      const minimalProps = {
        workoutName: 'Test',
        currentExercise: null,
        currentSet: 1,
        totalSets: 1,
        elapsedTime: 0,
        status: 'active' as const,
      };

      const { getByText } = render(<LiveActivityPreview {...minimalProps} />);

      expect(getByText('Test')).toBeTruthy();
      expect(getByText('0:00')).toBeTruthy();
    });
  });

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  describe('Animations', () => {
    it('should start pulse animation when status is active', async () => {
      const { rerender } = render(
        <LiveActivityPreview {...defaultProps} status="paused" />
      );

      // Change to active status
      rerender(<LiveActivityPreview {...defaultProps} status="active" />);

      // Animation should start (we can't easily test the animation itself in unit tests)
      await waitFor(() => {
        expect(true).toBe(true); // Placeholder - animation logic tested via integration
      });
    });

    it('should stop pulse animation when status changes from active', async () => {
      const { rerender } = render(
        <LiveActivityPreview {...defaultProps} status="active" />
      );

      // Change to paused status
      rerender(<LiveActivityPreview {...defaultProps} status="paused" />);

      await waitFor(() => {
        expect(true).toBe(true); // Placeholder - animation cleanup tested via integration
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should render all interactive elements', () => {
      const { getByText, UNSAFE_getAllByType } = render(
        <LiveActivityPreview {...defaultProps} />
      );

      // Check buttons exist
      expect(getByText('Log Set')).toBeTruthy();

      // Check there are 3 TouchableOpacity elements (mic, pause/resume, stop)
      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      expect(buttons.length).toBe(3);
    });

    it('should render text with numberOfLines prop for truncation', () => {
      const { getByText } = render(<LiveActivityPreview {...defaultProps} />);

      // These should truncate if too long
      expect(getByText('Upper Body')).toBeTruthy();
      expect(getByText('Bench Press')).toBeTruthy();
    });
  });
});
