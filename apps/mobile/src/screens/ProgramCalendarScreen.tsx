/**
 * Program Calendar Screen
 *
 * Runna-inspired list-based calendar view for program scheduling.
 * Displays weeks with collapsible day sections and color-coded workouts.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useProgramStore } from '../store/program.store';
import { Calendar, Plus, ChevronDown, ChevronRight, Dumbbell } from 'lucide-react-native';
import ScheduledWorkout from '../services/database/watermelon/models/ScheduledWorkout';

interface DayWorkouts {
  date: Date;
  dayName: string;
  dayNumber: number;
  workouts: ScheduledWorkout[];
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: DayWorkouts[];
  isExpanded: boolean;
}

export default function ProgramCalendarScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const {
    activeProgram,
    scheduledWorkouts,
    loadActiveProgram,
    loadScheduledWorkouts,
    isLoading,
  } = useProgramStore();

  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeProgram && scheduledWorkouts.length >= 0) {
      generateWeeksData();
    }
  }, [activeProgram, scheduledWorkouts, expandedWeeks]);

  const loadData = async () => {
    await loadActiveProgram();
    // Load next 4 weeks of workouts
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 28);
    await loadScheduledWorkouts(today, endDate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generateWeeksData = () => {
    if (!activeProgram) return;

    const today = new Date();
    const currentWeek = activeProgram.currentWeek || 1;
    const totalWeeks = activeProgram.totalWeeks || 12;

    const weeksData: WeekData[] = [];

    // Generate 4 weeks starting from current week
    for (let i = 0; i < 4; i++) {
      const weekNum = currentWeek + i;
      if (weekNum > totalWeeks) break;

      // Calculate week start (Monday) and end (Sunday)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1 + i * 7); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);

      // Generate days for this week
      const days: DayWorkouts[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);

        const dayWorkouts = scheduledWorkouts.filter((w) => {
          const wDate = new Date(w.scheduledDate);
          return (
            wDate.getFullYear() === date.getFullYear() &&
            wDate.getMonth() === date.getMonth() &&
            wDate.getDate() === date.getDate()
          );
        });

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        days.push({
          date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate(),
          workouts: dayWorkouts,
          isPast: compareDate < todayDate,
          isToday: compareDate.getTime() === todayDate.getTime(),
          isFuture: compareDate > todayDate,
        });
      }

      weeksData.push({
        weekNumber: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        days,
        isExpanded: expandedWeeks.has(weekNum),
      });
    }

    setWeeks(weeksData);
  };

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const getWorkoutTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      strength: '#4A9B6F',
      cardio: '#E74C3C',
      hiit: '#F39C12',
      recovery: '#3498DB',
      flexibility: '#9B59B6',
      custom: '#95A5A6',
    };
    return colors[type || 'custom'] || '#95A5A6';
  };

  const renderWorkoutCard = (workout: ScheduledWorkout) => {
    // In a real implementation, you'd fetch the template details
    // For now, we'll use placeholder data
    const color = workout.statusColor;
    const isCompleted = workout.isCompleted;
    const isSkipped = workout.isSkipped;

    return (
      <Pressable
        key={workout.id}
        className={`mb-2 p-3 rounded-lg border-l-4 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{ borderLeftColor: color }}
        onPress={() => {
          // Navigate to workout detail
          navigation.navigate('WorkoutDetail', { workoutId: workout.id });
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              } ${isCompleted || isSkipped ? 'line-through opacity-60' : ''}`}
            >
              {workout.templateId || 'Workout'}
            </Text>
            <Text
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {workout.statusDisplay}
            </Text>
          </View>
          {isCompleted && (
            <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
          {isSkipped && (
            <View className="w-6 h-6 rounded-full bg-gray-400 items-center justify-center">
              <Text className="text-white text-xs">–</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderDayCard = (day: DayWorkouts) => {
    const hasWorkouts = day.workouts.length > 0;

    return (
      <View key={day.date.toISOString()} className="mb-4">
        <View className="flex-row items-center mb-2">
          <Text
            className={`text-sm font-bold w-12 ${
              day.isToday
                ? isDark
                  ? 'text-primaryDark'
                  : 'text-primary-500'
                : isDark
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}
          >
            {day.dayName}
          </Text>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              day.isToday
                ? isDark
                  ? 'bg-primaryDark'
                  : 'bg-primary-500'
                : isDark
                ? 'bg-gray-700'
                : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                day.isToday ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              {day.dayNumber}
            </Text>
          </View>
          {!hasWorkouts && (
            <Text
              className={`ml-3 text-sm ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Rest day
            </Text>
          )}
        </View>

        {hasWorkouts && (
          <View className="ml-12">
            {day.workouts.map((workout) => renderWorkoutCard(workout))}
          </View>
        )}
      </View>
    );
  };

  const renderWeekSection = (week: WeekData) => {
    const completedWorkouts = week.days.reduce(
      (sum, day) => sum + day.workouts.filter((w) => w.isCompleted).length,
      0
    );
    const totalWorkouts = week.days.reduce(
      (sum, day) => sum + day.workouts.length,
      0
    );

    return (
      <View key={week.weekNumber} className="mb-4">
        <Pressable
          onPress={() => toggleWeek(week.weekNumber)}
          className={`p-4 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {week.isExpanded ? (
                <ChevronDown
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              ) : (
                <ChevronRight
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              )}
              <Text
                className={`ml-2 text-base font-bold ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Week {week.weekNumber}
              </Text>
              <Text
                className={`ml-2 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {week.startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {week.endDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            {totalWorkouts > 0 && (
              <Text
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {completedWorkouts}/{totalWorkouts}
              </Text>
            )}
          </View>
        </Pressable>

        {week.isExpanded && (
          <View className="mt-3 px-4">
            {week.days.map((day) => renderDayCard(day))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Calendar size={64} color={isDark ? '#4A9B6F' : '#2C5F3D'} />
        <Text
          className={`text-xl font-bold mt-4 ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          No Active Program
        </Text>
        <Text
          className={`text-center mt-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Create a training program to start scheduling your workouts
        </Text>
        <Pressable
          onPress={() => navigation.navigate('CreateProgram')}
          className="mt-6 px-6 py-3 rounded-lg bg-primary-500"
        >
          <Text className="text-white font-semibold">Create Program</Text>
        </Pressable>
      </View>
    );
  };

  if (isLoading && !activeProgram) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
      </View>
    );
  }

  if (!activeProgram) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View
        className={`px-4 py-4 border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              className={`text-2xl font-bold ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              {activeProgram.name}
            </Text>
            <Text
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Week {activeProgram.currentWeek} of {activeProgram.totalWeeks || '?'}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('ScheduleWorkout')}
            className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View className="mt-3">
          <View
            className={`h-2 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <View
              className="h-2 rounded-full bg-primary-500"
              style={{ width: `${activeProgram.progressPercentage}%` }}
            />
          </View>
        </View>
      </View>

      {/* Calendar List */}
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4A9B6F' : '#2C5F3D'}
          />
        }
      >
        {weeks.map((week) => renderWeekSection(week))}

        {weeks.length === 0 && (
          <View className="flex-1 items-center justify-center p-8">
            <Dumbbell size={48} color={isDark ? '#4A9B6F' : '#2C5F3D'} />
            <Text
              className={`text-center mt-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              No workouts scheduled yet.{'\n'}Tap + to add your first workout.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
