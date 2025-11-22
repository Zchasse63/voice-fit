/**
 * InjuryDetectionModal Component Tests
 * 
 * Tests for the injury detection modal component including:
 * - Modal display and visibility
 * - Injury information rendering
 * - Medical disclaimer display
 * - Action button functionality (Log Injury, Dismiss)
 * - Affected exercises display
 * - Severity color coding
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InjuryDetectionModal from '../../src/components/injury/InjuryDetectionModal';

// Mock theme context
jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

// Mock WorkoutAdjustmentModal
jest.mock('../../src/components/injury/WorkoutAdjustmentModal', () => {
  return jest.fn(() => null);
});

describe('InjuryDetectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnLogInjury = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockOnSubstitutionsAccepted = jest.fn();

  const mockInjuryResult = {
    injuryDetected: true,
    confidence: 0.85,
    bodyPart: 'shoulder',
    severity: 'moderate' as const,
    injuryType: 'strain',
    description: 'Shoulder pain detected',
    keywords: ['pain', 'shoulder', 'sore'],
  };

  const mockAffectedExercises = [
    { exerciseName: 'Overhead Press', sets: 3, reps: '8-10' },
    { exerciseName: 'Lateral Raises', sets: 3, reps: '12-15' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText('Potential Injury Detected')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <InjuryDetectionModal
          visible={false}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(queryByText('Potential Injury Detected')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByLabelText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      const closeButton = getByLabelText('Close modal');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Injury Information Display', () => {
    it('should display detected body part', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/shoulder/i)).toBeTruthy();
    });

    it('should display severity level', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/moderate/i)).toBeTruthy();
    });

    it('should display confidence score', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/85%/)).toBeTruthy();
    });

    it('should display detected keywords', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/pain/)).toBeTruthy();
      expect(getByText(/shoulder/)).toBeTruthy();
      expect(getByText(/sore/)).toBeTruthy();
    });
  });

  describe('Medical Disclaimer', () => {
    it('should display medical disclaimer section', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/Medical Disclaimer/i)).toBeTruthy();
    });

    it('should display disclaimer text about not being medical advice', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/not a substitute for professional medical advice/i)).toBeTruthy();
    });

    it('should display recommendation to consult healthcare provider', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/consult.*healthcare provider/i)).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should render Dismiss button', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText('Dismiss')).toBeTruthy();
    });

    it('should render Log Injury button', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText('Log Injury')).toBeTruthy();
    });

    it('should call onDismiss when Dismiss button is pressed', () => {
      const { getByLabelText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      const dismissButton = getByLabelText('Dismiss injury detection');
      fireEvent.press(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onLogInjury when Log Injury button is pressed', () => {
      const { getByLabelText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      const logButton = getByLabelText('Log injury and track recovery');
      fireEvent.press(logButton);

      expect(mockOnLogInjury).toHaveBeenCalledTimes(1);
    });
  });

  describe('Affected Exercises Display', () => {
    it('should not show affected exercises button when no exercises provided', () => {
      const { queryByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(queryByText(/View Affected Exercises/i)).toBeNull();
    });

    it('should show affected exercises button when exercises provided', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={mockAffectedExercises}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/View Affected Exercises/i)).toBeTruthy();
    });

    it('should display correct count of affected exercises', () => {
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={mockAffectedExercises}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/2 exercises/i)).toBeTruthy();
    });

    it('should use singular "exercise" for single affected exercise', () => {
      const singleExercise = [mockAffectedExercises[0]];
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mockInjuryResult}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={singleExercise}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/1 exercise/i)).toBeTruthy();
      expect(getByText(/1 exercise/i).children[0]).not.toMatch(/exercises/);
    });
  });

  describe('Severity Levels', () => {
    it('should display mild severity correctly', () => {
      const mildInjury = { ...mockInjuryResult, severity: 'mild' as const };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={mildInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/mild/i)).toBeTruthy();
    });

    it('should display moderate severity correctly', () => {
      const moderateInjury = { ...mockInjuryResult, severity: 'moderate' as const };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={moderateInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/moderate/i)).toBeTruthy();
    });

    it('should display severe severity correctly', () => {
      const severeInjury = { ...mockInjuryResult, severity: 'severe' as const };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={severeInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/severe/i)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle injury with no keywords', () => {
      const noKeywordsInjury = { ...mockInjuryResult, keywords: [] };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={noKeywordsInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText('Potential Injury Detected')).toBeTruthy();
    });

    it('should handle injury with null body part', () => {
      const nullBodyPartInjury = { ...mockInjuryResult, bodyPart: null };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={nullBodyPartInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText('Potential Injury Detected')).toBeTruthy();
    });

    it('should handle low confidence injury', () => {
      const lowConfidenceInjury = { ...mockInjuryResult, confidence: 0.45 };
      const { getByText } = render(
        <InjuryDetectionModal
          visible={true}
          onClose={mockOnClose}
          injuryResult={lowConfidenceInjury}
          onLogInjury={mockOnLogInjury}
          onDismiss={mockOnDismiss}
          affectedExercises={[]}
          onSubstitutionsAccepted={mockOnSubstitutionsAccepted}
        />
      );

      expect(getByText(/45%/)).toBeTruthy();
    });
  });
});
