import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { database } from '../../services/database/watermelon/database';
import ScheduledWorkout from '../../services/database/watermelon/models/ScheduledWorkout';
import { Q } from '@nozbe/watermelondb';
import CalendarService, { type ConflictInfo } from '../../services/calendar/CalendarService';
import ConflictWarningModal from './ConflictWarningModal';
import { useAuthStore } from '../../store/auth.store';
import { tokens } from '../../theme/tokens';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasWorkout: boolean;
  workoutCount: number;
  hasConflict?: boolean;
}

interface DraggingWorkout {
  id: string;
  name: string;
  originalDate: Date;
}

export default function CalendarView() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Map<string, number>>(new Map());
  const [conflictDates, setConflictDates] = useState<Set<string>>(new Set());
  const [draggingWorkout, setDraggingWorkout] = useState<DraggingWorkout | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingReschedule, setPendingReschedule] = useState<{
    workoutId: string;
    newDate: string;
    conflicts: ConflictInfo;
  } | null>(null);

  // CalendarService is exported as a singleton
  const calendarService = CalendarService;

  useEffect(() => {
    loadWorkoutDates();
    loadConflicts();
  }, [currentDate]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, workoutDates, conflictDates]);

  const loadWorkoutDates = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const workouts = await database
        .get<ScheduledWorkout>('scheduled_workouts')
        .query(
          Q.where('scheduled_date', Q.gte(startOfMonth.getTime())),
          Q.where('scheduled_date', Q.lte(endOfMonth.getTime())),
          Q.where('status', Q.oneOf(['scheduled', 'rescheduled']))
        )
        .fetch();

      const dateMap = new Map<string, number>();
      workouts.forEach((workout) => {
        const dateKey = new Date(workout.scheduledDate).toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      });

      setWorkoutDates(dateMap);
    } catch (error) {
      console.error('Failed to load workout dates:', error);
    }
  };

  const loadConflicts = async () => {
    if (!user?.id) return;

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const conflicts = await calendarService.getConflictsForRange(
        user.id,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );

      const conflictSet = new Set<string>();
      Object.entries(conflicts).forEach(([date, info]: [string, any]) => {
        if ((info as any).has_conflict) {
          conflictSet.add(date);
        }
      });

      setConflictDates(conflictSet);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const days: CalendarDay[] = [];

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: false,
        hasWorkout: workoutDates.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        hasConflict: conflictDates.has(dateKey),
      });
    }

    // Add current month's days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: true,
        hasWorkout: workoutDates.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        hasConflict: conflictDates.has(dateKey),
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: false,
        hasWorkout: workoutDates.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        hasConflict: conflictDates.has(dateKey),
      });
    }

    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  // Drag-and-drop handlers
  const handleLongPress = async (date: Date) => {
    if (!user?.id) return;

    // Find workouts on this date
    const workouts = await database
      .get<ScheduledWorkout>('scheduled_workouts')
      .query(
        Q.where('scheduled_date', Q.eq(date.getTime())),
        Q.where('status', Q.oneOf(['scheduled', 'rescheduled']))
      )
      .fetch();

    if (workouts.length === 0) return;

    // For simplicity, drag the first workout (could show picker for multiple)
    const workout = workouts[0];
    setDraggingWorkout({
      id: workout.id,
      name: workout.notes || 'Workout',
      originalDate: new Date(workout.scheduledDate),
    });
  };

  const handleDrop = async (targetDate: Date) => {
    if (!draggingWorkout || !user?.id) {
      setDraggingWorkout(null);
      return;
    }

    const newDateKey = targetDate.toISOString().split('T')[0];

    // Check for conflicts
    const conflicts = await calendarService.checkConflicts(user.id, newDateKey, draggingWorkout.id);

    if (conflicts.has_conflict) {
      // Show conflict modal
      setPendingReschedule({
        workoutId: draggingWorkout.id,
        newDate: newDateKey,
        conflicts,
      });
      setShowConflictModal(true);
      setDraggingWorkout(null);
    } else {
      // No conflicts, proceed with reschedule
      await performReschedule(draggingWorkout.id, newDateKey);
      setDraggingWorkout(null);
    }
  };

  const performReschedule = async (workoutId: string, newDate: string) => {
    try {
      await calendarService.rescheduleWorkout(workoutId, newDate);

      // Refresh calendar data
      await loadWorkoutDates();
      await loadConflicts();

      Alert.alert('Success', 'Workout rescheduled successfully');
    } catch (error) {
      console.error('Failed to reschedule workout:', error);
      Alert.alert('Error', 'Failed to reschedule workout. Please try again.');
    }
  };

  const handleConflictProceed = async () => {
    if (!pendingReschedule) return;

    await performReschedule(pendingReschedule.workoutId, pendingReschedule.newDate);
    setShowConflictModal(false);
    setPendingReschedule(null);
  };

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setPendingReschedule(null);
  };

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.xl,
        backgroundColor: colors.background.secondary,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing.md,
        }}
      >
        <Pressable
          onPress={goToPreviousMonth}
          accessibilityLabel="Previous Month"
          accessibilityRole="button"
          style={{
            padding: tokens.spacing.sm,
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft
            color={isDark ? tokens.colors.dark.accent.green : tokens.colors.light.accent.green}
            size={24}
          />
        </Pressable>

        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <Pressable
          onPress={goToNextMonth}
          accessibilityLabel="Next Month"
          accessibilityRole="button"
          style={{
            padding: tokens.spacing.sm,
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight
            color={isDark ? tokens.colors.dark.accent.green : tokens.colors.light.accent.green}
            size={24}
          />
        </Pressable>
      </View>

      {/* Day Names */}
      <View
        style={{
          flexDirection: 'row',
          marginBottom: tokens.spacing.xs,
        }}
      >
        {dayNames.map((day) => (
          <View
            key={day}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.secondary,
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendarDays.map((day, index) => {
          const today = isToday(day.date);
          const selected = isSelected(day.date);

          const baseDayTextColor = !day.isCurrentMonth
            ? colors.text.tertiary
            : today
            ? isDark
              ? tokens.colors.dark.accent.green
              : tokens.colors.light.accent.green
            : colors.text.primary;

          return (
            <Pressable
              key={index}
              onPress={() => {
                if (draggingWorkout) {
                  handleDrop(day.date);
                } else {
                  setSelectedDate(day.date);
                }
              }}
              onLongPress={() => day.hasWorkout && handleLongPress(day.date)}
              accessibilityLabel={`${day.date.toLocaleDateString()}, ${
                day.hasWorkout
                  ? `${day.workoutCount} workout${day.workoutCount > 1 ? 's' : ''}`
                  : 'No workouts'
              }${day.hasConflict ? ', has conflict' : ''}`}
              accessibilityRole="button"
              style={{
                width: '14.28%',
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
                backgroundColor: selected
                  ? isDark
                    ? `${tokens.colors.dark.accent.green}20`
                    : `${tokens.colors.light.accent.green}20`
                  : draggingWorkout
                  ? `${colors.accent.blue}10`
                  : 'transparent',
                borderWidth: draggingWorkout ? 2 : 0,
                borderColor: draggingWorkout ? colors.accent.blue : 'transparent',
                borderStyle: 'dashed',
              }}
            >
              <View style={{ alignItems: 'center', position: 'relative' }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: baseDayTextColor,
                    fontWeight: today
                      ? tokens.typography.fontWeight.bold
                      : tokens.typography.fontWeight.regular,
                  }}
                >
                  {day.date.getDate()}
                </Text>
                {day.hasWorkout && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      marginTop: 4,
                      backgroundColor: isDark
                        ? tokens.colors.dark.accent.green
                        : tokens.colors.light.accent.green,
                    }}
                  />
                )}
                {day.hasConflict && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: tokens.colors.light.accent.orange,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle color="#FFFFFF" size={8} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          marginTop: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              marginRight: tokens.spacing.xs,
              backgroundColor: isDark
                ? tokens.colors.dark.accent.green
                : tokens.colors.light.accent.green,
            }}
          />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Scheduled
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              marginRight: tokens.spacing.xs,
              backgroundColor: tokens.colors.light.accent.orange,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle color="#FFFFFF" size={8} />
          </View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Conflict
          </Text>
        </View>
      </View>

      {/* Dragging Indicator */}
      {draggingWorkout && (
        <View
          style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.md,
            backgroundColor: `${colors.accent.blue}20`,
            borderRadius: tokens.borderRadius.md,
            borderWidth: 1,
            borderColor: colors.accent.blue,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.primary,
              textAlign: 'center',
            }}
          >
            📍 Dragging: {draggingWorkout.name}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Tap a date to reschedule
          </Text>
        </View>
      )}

      {/* Conflict Warning Modal */}
      {pendingReschedule && (
        <ConflictWarningModal
          visible={showConflictModal}
          onClose={handleConflictCancel}
          onProceed={handleConflictProceed}
          conflicts={pendingReschedule.conflicts}
          targetDate={pendingReschedule.newDate}
        />
      )}
    </View>
  );
}

