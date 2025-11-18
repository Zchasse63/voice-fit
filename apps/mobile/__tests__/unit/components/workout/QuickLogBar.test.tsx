import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import QuickLogBar from '../../../../src/components/workout/QuickLogBar';

// Simple theme mock so useTheme works without ThemeProvider
jest.mock('../../../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', isDark: false, setTheme: jest.fn() }),
}));

// Mock workout store selector-based hook
const startWorkoutMock = jest.fn();
const addSetMock = jest.fn();

jest.mock('../../../../src/store/workout.store', () => ({
  useWorkoutStore: jest.fn(),
}));

// Mock analytics so we do not hit Amplitude
jest.mock('../../../../src/services/analytics/AnalyticsService', () => ({
  AnalyticsService: {
    logEvent: jest.fn(),
  },
}));

describe('QuickLogBar', () => {
  const { useWorkoutStore }: any = require('../../../../src/store/workout.store');
  let alertSpy: jest.SpyInstance;

  const baseDraft = {
    exerciseName: 'Bench Press',
    weight: 185,
    reps: 8,
    rpe: 7,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useWorkoutStore.mockImplementation((selector: any) =>
      selector({
        activeWorkout: null,
        startWorkout: startWorkoutMock,
        addSet: addSetMock,
      }),
    );

    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    if (alertSpy) {
      alertSpy.mockRestore();
    }
  });

  it('logs a set via workout store and calls onLogged', () => {
    const onLogged = jest.fn();
    const { getByText } = render(<QuickLogBar draft={baseDraft} onLogged={onLogged} />);

    fireEvent.press(getByText('Accept & Log Set'));

    expect(startWorkoutMock).toHaveBeenCalledWith('Quick Log Workout');
    expect(addSetMock).toHaveBeenCalledWith({
      exerciseName: 'Bench Press',
      weight: 185,
      reps: 8,
      rpe: 7,
      loggingMethod: 'quick_log',
    });
    expect(onLogged).toHaveBeenCalled();
  });

  it('shows validation alert when weight or reps missing', () => {
    const { getByText } = render(
      <QuickLogBar
        draft={{
          exerciseName: 'Squat',
          weight: undefined,
          reps: undefined,
        }}
      />,
    );

    fireEvent.press(getByText('Accept & Log Set'));

    expect(Alert.alert).toHaveBeenCalled();
    expect(addSetMock).not.toHaveBeenCalled();
  });
});

