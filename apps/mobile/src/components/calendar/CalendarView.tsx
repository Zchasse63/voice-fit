import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { database } from '../../services/database/watermelon/database';
import WorkoutLog from '../../services/database/watermelon/models/WorkoutLog';
import { Q } from '@nozbe/watermelondb';
import { programService, DailyWorkout } from '../../services/ProgramService';
import { tokens } from '../../theme/tokens';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasWorkout: boolean; // Completed workout
  hasScheduled: boolean; // Scheduled workout
  workoutCount: number;
  scheduledWorkout?: DailyWorkout;
}

export default function CalendarView() {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Map<string, number>>(new Map());
  const [scheduledWorkouts, setScheduledWorkouts] = useState<Map<string, DailyWorkout>>(new Map());

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, workoutDates, scheduledWorkouts]);

  const loadData = async () => {
    await Promise.all([loadWorkoutDates(), loadScheduledWorkouts()]);
  };

  const loadWorkoutDates = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const workouts = await database
        .get<WorkoutLog>('workout_logs')
        .query(
          Q.where('start_time', Q.gte(startOfMonth.getTime())),
          Q.where('start_time', Q.lte(endOfMonth.getTime()))
        )
        .fetch();

      const dateMap = new Map<string, number>();
      workouts.forEach((workout) => {
        const dateKey = new Date(workout.startTime).toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      });

      setWorkoutDates(dateMap);
    } catch (error) {
      console.error('Failed to load workout dates:', error);
    }
  };

  const loadScheduledWorkouts = async () => {
    try {
      // For MVP, we'll just check the current month's days
      // In a real app, we'd fetch the whole month's schedule efficiently
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const scheduleMap = new Map<string, DailyWorkout>();

      // Iterate through days in month
      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const workout = await programService.getScheduledWorkout(new Date(d));
        if (workout) {
          const dateKey = d.toISOString().split('T')[0];
          scheduleMap.set(dateKey, workout);
        }
      }

      setScheduledWorkouts(scheduleMap);
    } catch (error) {
      console.error('Failed to load scheduled workouts:', error);
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
        hasScheduled: scheduledWorkouts.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        scheduledWorkout: scheduledWorkouts.get(dateKey),
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
        hasScheduled: scheduledWorkouts.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        scheduledWorkout: scheduledWorkouts.get(dateKey),
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
        hasScheduled: scheduledWorkouts.has(dateKey),
        workoutCount: workoutDates.get(dateKey) || 0,
        scheduledWorkout: scheduledWorkouts.get(dateKey),
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
              onPress={() => setSelectedDate(day.date)}
              accessibilityLabel={`${day.date.toLocaleDateString()}, ${day.hasWorkout
                  ? `${day.workoutCount} workout${day.workoutCount > 1 ? 's' : ''}`
                  : day.hasScheduled
                    ? 'Scheduled workout'
                    : 'No workouts'
                }`}
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
                  : 'transparent',
              }}
            >
              <View style={{ alignItems: 'center' }}>
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

                {/* Dot Indicators */}
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                  {day.hasWorkout && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: isDark
                          ? tokens.colors.dark.accent.green
                          : tokens.colors.light.accent.green,
                      }}
                    />
                  )}
                  {day.hasScheduled && !day.hasWorkout && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: isDark
                          ? tokens.colors.dark.accent.blue
                          : tokens.colors.light.accent.blue,
                      }}
                    />
                  )}
                </View>
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
          justifyContent: 'center',
          marginTop: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          gap: tokens.spacing.lg,
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
            Completed
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              marginRight: tokens.spacing.xs,
              backgroundColor: isDark
                ? tokens.colors.dark.accent.blue
                : tokens.colors.light.accent.blue,
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
      </View>

      {/* Selected Date Details (Simple MVP) */}
      {selectedDate && (
        <View style={{ marginTop: tokens.spacing.md }}>
          <Text style={{ color: colors.text.primary, fontWeight: 'bold', marginBottom: 4 }}>
            {selectedDate.toLocaleDateString()}
          </Text>
          {scheduledWorkouts.get(selectedDate.toISOString().split('T')[0]) ? (
            <View>
              <Text style={{ color: colors.text.secondary }}>
                Scheduled: {scheduledWorkouts.get(selectedDate.toISOString().split('T')[0])?.focus}
              </Text>
              {scheduledWorkouts.get(selectedDate.toISOString().split('T')[0])?.exercises.map((ex, i) => (
                <Text key={i} style={{ color: colors.text.tertiary, fontSize: 12 }}>
                  • {ex.name} ({ex.sets}x{ex.reps})
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.text.tertiary }}>No scheduled workout</Text>
          )}
        </View>
      )}
    </View>
  );
}


