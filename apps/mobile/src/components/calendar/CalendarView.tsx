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

  return (
    <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={goToPreviousMonth}
          className="p-3 min-w-[48px] min-h-[48px] items-center justify-center active:opacity-60"
          accessibilityLabel="Previous Month"
          accessibilityRole="button"
        >
          <ChevronLeft color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
        </Pressable>

        <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <Pressable
          onPress={goToNextMonth}
          className="p-3 min-w-[48px] min-h-[48px] items-center justify-center active:opacity-60"
          accessibilityLabel="Next Month"
          accessibilityRole="button"
        >
          <ChevronRight color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
        </Pressable>
      </View>

      {/* Day Names */}
      <View className="flex-row mb-2">
        {dayNames.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {calendarDays.map((day, index) => {
          const today = isToday(day.date);
          const selected = isSelected(day.date);

          return (
            <Pressable
              key={index}
              onPress={() => setSelectedDate(day.date)}
              className={`w-[14.28%] aspect-square items-center justify-center mb-1 ${
                selected
                  ? isDark
                    ? 'bg-primaryDark/20'
                    : 'bg-primary-500/20'
                  : ''
              }`}
              accessibilityLabel={`${day.date.toLocaleDateString()}, ${
                day.hasWorkout ? `${day.workoutCount} workout${day.workoutCount > 1 ? 's' : ''}` : 'No workouts'
              }`}
              accessibilityRole="button"
            >
              <View className="items-center">
                <Text
                  className={`text-sm ${
                    !day.isCurrentMonth
                      ? isDark
                        ? 'text-gray-600'
                        : 'text-gray-400'
                      : today
                      ? isDark
                        ? 'text-primaryDark font-bold'
                        : 'text-primary-500 font-bold'
                      : isDark
                      ? 'text-gray-200'
                      : 'text-gray-800'
                  }`}
                >
                  {day.date.getDate()}
                </Text>
                {day.hasWorkout && (
                  <View
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isDark ? 'bg-primaryDark' : 'bg-primary-500'
                    }`}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <View className={`w-2 h-2 rounded-full mr-2 ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`} />
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Workout completed
        </Text>
      </View>
    </View>
  );
}

