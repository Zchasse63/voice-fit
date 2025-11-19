import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { database } from '../../services/database/watermelon/database';
import WorkoutLog from '../../services/database/watermelon/models/WorkoutLog';
import { Q } from '@nozbe/watermelondb';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasWorkout: boolean;
  workoutCount: number;
}

export default function CalendarView() {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadWorkoutDates();
  }, [currentDate]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, workoutDates]);

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
              accessibilityLabel={`${day.date.toLocaleDateString()}, ${
                day.hasWorkout
                  ? `${day.workoutCount} workout${day.workoutCount > 1 ? 's' : ''}`
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
        }}
      >
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
          Workout completed
        </Text>
      </View>
    </View>
  );
}

