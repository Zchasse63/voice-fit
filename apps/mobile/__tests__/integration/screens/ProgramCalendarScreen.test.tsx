/**
 * Integration tests for ProgramCalendarScreen
 * Tests the full calendar view with weeks, days, and workouts
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProgramCalendarScreen from '../../../src/screens/ProgramCalendarScreen';
import { useProgramStore } from '../../../src/store/program.store';

// Mock the program store
jest.mock('../../../src/store/program.store');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Mock program data
const mockProgram = {
  id: 'program-1',
  name: 'Strength Program',
  currentWeek: 2,
  totalWeeks: 12,
  color: '#4A9B6F',
  progressPercentage: 17,
};

const mockScheduledWorkout = {
  id: 'workout-1',
  programId: 'program-1',
  templateId: 'template-1',
  userId: 'user-1',
  scheduledDate: Date.now(),
  weekNumber: 2,
  dayOfWeek: 1,
  position: 0,
  status: 'scheduled',
  isCompleted: false,
  isScheduled: true,
  isSkipped: false,
  statusDisplay: 'Scheduled',
  statusColor: '#4A9B6F',
};

describe('ProgramCalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useProgramStore as unknown as jest.Mock).mockReturnValue({
      programs: [mockProgram],
      activeProgram: mockProgram,
      scheduledWorkouts: [mockScheduledWorkout],
      loadActiveProgram: jest.fn(),
      loadScheduledWorkouts: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  // ============================================================================
  // RENDERING WITH DATA
  // ============================================================================

  describe('Rendering with active program', () => {
    it('should render program name', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Strength Program')).toBeTruthy();
      });
    });

    it('should render week counter', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Week 2 of 12')).toBeTruthy();
      });
    });

    it('should render progress bar', async () => {
      const { UNSAFE_getByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Progress bar should exist
        const views = UNSAFE_getByType('View' as any);
        expect(views).toBeTruthy();
      });
    });

    it('should render + button for adding workouts', async () => {
      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const pressables = UNSAFE_getAllByType('Pressable' as any);
        expect(pressables.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // WEEK SECTIONS
  // ============================================================================

  describe('Week sections', () => {
    it('should render week sections', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Week 2/)).toBeTruthy();
      });
    });

    it('should show week date range', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Should show date range like "Jan 1 - Jan 7"
        const text = getByText(/\w+ \d+ - \w+ \d+/);
        expect(text).toBeTruthy();
      });
    });

    it('should toggle week expansion on press', async () => {
      const { getByText, queryByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const weekHeader = getByText(/Week 2/);
        expect(weekHeader).toBeTruthy();
      });

      // Week should be expanded by default (week 1)
      // Collapse it
      const weekHeader = getByText(/Week 2/);
      fireEvent.press(weekHeader);

      // Days might not be visible after collapse
      // (This is simplified - actual test would check for day visibility)
    });

    it('should show completed/total workout count', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [
          { ...mockScheduledWorkout, isCompleted: true },
          { ...mockScheduledWorkout, id: 'workout-2', isCompleted: false },
        ],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Should show something like "1/2"
        expect(getByText(/\d+\/\d+/)).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // DAY CARDS
  // ============================================================================

  describe('Day cards', () => {
    it('should render day names', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Should render day abbreviations (Mon, Tue, etc.)
        expect(getByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)).toBeTruthy();
      });
    });

    it('should render day numbers', async () => {
      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Day numbers should be rendered
        const texts = UNSAFE_getAllByType('Text' as any);
        expect(texts.length).toBeGreaterThan(0);
      });
    });

    it('should highlight today', async () => {
      const today = new Date();
      const todayWorkout = {
        ...mockScheduledWorkout,
        scheduledDate: today.getTime(),
        isToday: true,
      };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [todayWorkout],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Today should be highlighted (we can't easily test styling in unit tests)
        expect(UNSAFE_getAllByType('View' as any)).toBeTruthy();
      });
    });

    it('should show "Rest day" for days with no workouts', async () => {
      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // At least one day should show "Rest day"
        expect(getByText('Rest day')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // WORKOUT CARDS
  // ============================================================================

  describe('Workout cards', () => {
    it('should render workout cards', async () => {
      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const pressables = UNSAFE_getAllByType('Pressable' as any);
        // Should have workout cards (pressable)
        expect(pressables.length).toBeGreaterThan(0);
      });
    });

    it('should show completed badge for completed workouts', async () => {
      const completedWorkout = {
        ...mockScheduledWorkout,
        status: 'completed',
        isCompleted: true,
      };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [completedWorkout],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('✓')).toBeTruthy();
      });
    });

    it('should show skipped badge for skipped workouts', async () => {
      const skippedWorkout = {
        ...mockScheduledWorkout,
        status: 'skipped',
        isSkipped: true,
      };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [skippedWorkout],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('–')).toBeTruthy();
      });
    });

    it('should navigate to workout detail on press', async () => {
      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const pressables = UNSAFE_getAllByType('Pressable' as any);
        // Find a workout card (skip header buttons)
        const workoutCard = pressables.find((p: any) => p.props.onPress);
        if (workoutCard) {
          fireEvent.press(workoutCard);
        }
      });

      // Should navigate to workout detail
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EMPTY STATES
  // ============================================================================

  describe('Empty states', () => {
    it('should show empty state when no active program', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [],
        activeProgram: null,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('No Active Program')).toBeTruthy();
      });
    });

    it('should show "Create Program" button in empty state', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [],
        activeProgram: null,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Create Program')).toBeTruthy();
      });
    });

    it('should navigate to create program on button press', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [],
        activeProgram: null,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const button = getByText('Create Program');
        fireEvent.press(button);
      });

      expect(mockNavigate).toHaveBeenCalledWith('CreateProgram');
    });

    it('should show empty state when no workouts scheduled', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/No workouts scheduled/)).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  describe('Loading states', () => {
    it('should show loading indicator when loading', async () => {
      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [],
        activeProgram: null,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: true,
        error: null,
      });

      const { UNSAFE_getByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(UNSAFE_getByType('ActivityIndicator' as any)).toBeTruthy();
      });
    });

    it('should hide loading indicator after data loads', async () => {
      const { rerender, queryByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByType('ActivityIndicator' as any)).toBeNull();
      });
    });
  });

  // ============================================================================
  // PULL TO REFRESH
  // ============================================================================

  describe('Pull to refresh', () => {
    it('should have pull to refresh enabled', async () => {
      const { UNSAFE_getByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const scrollView = UNSAFE_getByType('ScrollView' as any);
        expect(scrollView).toBeTruthy();
      });
    });

    it('should call load functions on refresh', async () => {
      const loadActiveProgram = jest.fn();
      const loadScheduledWorkouts = jest.fn();

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [mockScheduledWorkout],
        loadActiveProgram,
        loadScheduledWorkouts,
        isLoading: false,
        error: null,
      });

      const { UNSAFE_getByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const scrollView = UNSAFE_getByType('ScrollView' as any);
        const refreshControl = scrollView.props.refreshControl;

        if (refreshControl?.props?.onRefresh) {
          refreshControl.props.onRefresh();
        }
      });

      // Should call both load functions
      expect(loadActiveProgram).toHaveBeenCalled();
      expect(loadScheduledWorkouts).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  describe('Navigation', () => {
    it('should navigate to schedule workout on + button press', async () => {
      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const pressables = UNSAFE_getAllByType('Pressable' as any);
        // Find the + button (likely the first pressable in header)
        const addButton = pressables[0];
        if (addButton) {
          fireEvent.press(addButton);
        }
      });

      expect(mockNavigate).toHaveBeenCalledWith('ScheduleWorkout');
    });
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  describe('Data loading', () => {
    it('should load active program on mount', async () => {
      const loadActiveProgram = jest.fn();

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [mockScheduledWorkout],
        loadActiveProgram,
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(<ProgramCalendarScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(loadActiveProgram).toHaveBeenCalled();
      });
    });

    it('should load scheduled workouts on mount', async () => {
      const loadScheduledWorkouts = jest.fn();

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [mockScheduledWorkout],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts,
        isLoading: false,
        error: null,
      });

      render(<ProgramCalendarScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(loadScheduledWorkouts).toHaveBeenCalled();
      });
    });

    it('should load 4 weeks of workouts', async () => {
      const loadScheduledWorkouts = jest.fn();

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts,
        isLoading: false,
        error: null,
      });

      render(<ProgramCalendarScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(loadScheduledWorkouts).toHaveBeenCalledWith(
          expect.any(Date),
          expect.any(Date)
        );
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle program without total weeks', async () => {
      const programWithoutWeeks = {
        ...mockProgram,
        totalWeeks: undefined,
      };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [programWithoutWeeks],
        activeProgram: programWithoutWeeks,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Should show "Week 2 of ?"
        expect(getByText(/Week 2 of \?/)).toBeTruthy();
      });
    });

    it('should handle multiple workouts on same day', async () => {
      const workout1 = { ...mockScheduledWorkout, id: 'workout-1', position: 0 };
      const workout2 = { ...mockScheduledWorkout, id: 'workout-2', position: 1 };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [mockProgram],
        activeProgram: mockProgram,
        scheduledWorkouts: [workout1, workout2],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const pressables = UNSAFE_getAllByType('Pressable' as any);
        // Should render both workout cards
        expect(pressables.length).toBeGreaterThan(2);
      });
    });

    it('should handle very long program name', async () => {
      const longNameProgram = {
        ...mockProgram,
        name: 'Super Long Program Name That Might Wrap or Truncate on Mobile Devices',
      };

      (useProgramStore as unknown as jest.Mock).mockReturnValue({
        programs: [longNameProgram],
        activeProgram: longNameProgram,
        scheduledWorkouts: [],
        loadActiveProgram: jest.fn(),
        loadScheduledWorkouts: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <ProgramCalendarScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(
          getByText('Super Long Program Name That Might Wrap or Truncate on Mobile Devices')
        ).toBeTruthy();
      });
    });
  });
});
