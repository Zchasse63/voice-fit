import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useWorkoutStore } from '../store/workout.store';
import { useTheme } from '../theme/ThemeContext';
import { Dumbbell, TrendingUp, Calendar, BookOpen, Settings, BarChart2 } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SyncStatus from '../components/common/SyncStatus';
import CalendarView from '../components/calendar/CalendarView';
import ReadinessCheckCard from '../components/readiness/ReadinessCheckCard';
import ActiveInjuryBanner from '../components/injury/ActiveInjuryBanner';
import RecoveryCheckInModal from '../components/injury/RecoveryCheckInModal';
import ExerciseLibraryScreen from './ExerciseLibraryScreen';
import AnalyticsScreen from './AnalyticsScreen';
import InjuryLoggingService from '../services/injury/InjuryLoggingService';
import InjuryLog from '../services/database/watermelon/models/InjuryLog';
import SettingsScreen from './SettingsScreen';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  const [weeklyStats, setWeeklyStats] = useState({ workoutCount: 0, totalVolume: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Injury tracking state
  const [activeInjuries, setActiveInjuries] = useState<InjuryLog[]>([]);
  const [injuriesNeedingCheckIn, setInjuriesNeedingCheckIn] = useState<InjuryLog[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [currentCheckInInjury, setCurrentCheckInInjury] = useState<InjuryLog | null>(null);

  useEffect(() => {
    loadWeeklyStats();
    loadActiveInjuries();
  }, []);

  const loadWeeklyStats = async () => {
    try {
      setIsLoading(true);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get workouts from last 7 days
      const workouts = await database
        .get<WorkoutLog>('workout_logs')
        .query(Q.where('start_time', Q.gte(oneWeekAgo.getTime())))
        .fetch();

      // Get all sets from those workouts
      const workoutIds = workouts.map((w) => w.id);
      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', Q.oneOf(workoutIds)))
        .fetch();

      // Calculate total volume (weight * reps)
      const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

      setWeeklyStats({
        workoutCount: workouts.length,
        totalVolume: Math.round(totalVolume),
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
      setIsLoading(false);
    }
  };

  const loadActiveInjuries = async () => {
    try {
      // Get active injuries
      const injuries = await InjuryLoggingService.getActiveInjuries();
      setActiveInjuries(injuries);

      // Check which injuries need weekly check-in (7+ days since last check-in)
      const needingCheckIn = await InjuryLoggingService.getInjuriesNeedingCheckIn();
      setInjuriesNeedingCheckIn(needingCheckIn);

      // Auto-show check-in modal if any injuries need check-in
      if (needingCheckIn.length > 0) {
        setCurrentCheckInInjury(needingCheckIn[0]);
        setShowCheckInModal(true);
      }
    } catch (error) {
      console.error('Failed to load active injuries:', error);
    }
  };

  const handleCheckInComplete = async () => {
    setShowCheckInModal(false);
    setCurrentCheckInInjury(null);

    // Reload injuries after check-in
    await loadActiveInjuries();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your workout data..." fullScreen />;
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              Welcome back, {user?.name || 'Athlete'}!
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <SyncStatus />
        </View>

        {/* Active Workout Card */}
        {activeWorkout && (
          <View className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-warning-dark' : 'bg-warning-light'}`}>
            <Text className="text-lg font-bold text-white">Active Workout</Text>
            <Text className="text-base text-white mt-1">
              {activeWorkout.name}
            </Text>
            <Text className="text-sm text-white/80 mt-1">
              Started {formatTime(activeWorkout.startTime)}
            </Text>
          </View>
        )}

        {/* Active Injury Banner */}
        {activeInjuries.length > 0 && (
          <View className="mt-6">
            <ActiveInjuryBanner
              injuries={activeInjuries.map(injury => ({
                id: injury.id,
                bodyPart: injury.bodyPart,
                severity: injury.severity as 'mild' | 'moderate' | 'severe',
                description: injury.description,
                status: injury.status as 'active' | 'recovering' | 'resolved',
                reportedAt: injury.reportedAt,
                lastCheckInAt: injury.lastCheckInAt,
              }))}
              onCheckInPress={(injuryId) => {
                const injury = activeInjuries.find(inj => inj.id === injuryId);
                if (injury) {
                  setCurrentCheckInInjury(injury);
                  setShowCheckInModal(true);
                }
              }}
            />
          </View>
        )}

        {/* Readiness Check Card */}
        <View className="mt-6">
          <ReadinessCheckCard />
        </View>

        {/* Quick Actions */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Quick Actions
          </Text>

          <Pressable
            className={`flex-row items-center p-4 rounded-xl mb-3 active:opacity-80 min-h-[60px] ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}
            onPress={() => startWorkout('Quick Workout')}
            accessibilityLabel="Start Workout"
            accessibilityHint="Begins a new workout session"
            accessibilityRole="button"
          >
            <Dumbbell color="white" size={24} />
            <Text className="text-base font-body-semibold text-white ml-3">
              Start Workout
            </Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center p-4 rounded-xl mb-3 active:opacity-80 min-h-[60px] ${isDark ? 'bg-info-dark' : 'bg-info-light'}`}
            onPress={() => setShowAnalytics(true)}
            accessibilityLabel="View Analytics"
            accessibilityHint="View volume, fatigue, and deload analytics"
            accessibilityRole="button"
          >
            <BarChart2 color="white" size={24} />
            <Text className="text-base font-body-semibold text-white ml-3">
              View Analytics
            </Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center p-4 rounded-xl mb-3 active:opacity-80 min-h-[60px] ${isDark ? 'bg-warning-dark' : 'bg-warning-light'}`}
            accessibilityLabel="Today's Program"
            accessibilityHint="View today's workout program"
            accessibilityRole="button"
          >
            <Calendar color="white" size={24} />
            <Text className="text-base font-body-semibold text-white ml-3">
              Today's Program
            </Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center p-4 rounded-xl mb-3 active:opacity-80 min-h-[60px] ${isDark ? 'bg-accent-600' : 'bg-accent-500'}`}
            onPress={() => setShowExerciseLibrary(true)}
            accessibilityLabel="Exercise Library"
            accessibilityHint="Browse exercise library"
            accessibilityRole="button"
          >
            <BookOpen color="white" size={24} />
            <Text className="text-base font-body-semibold text-white ml-3">
              Exercise Library
            </Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center p-4 rounded-xl active:opacity-80 min-h-[60px] ${isDark ? 'bg-gray-600' : 'bg-gray-700'}`}
            onPress={() => setShowSettings(true)}
            accessibilityLabel="Settings"
            accessibilityHint="Open settings"
            accessibilityRole="button"
          >
            <Settings color="white" size={24} />
            <Text className="text-base font-body-semibold text-white ml-3">
              Settings
            </Text>
          </Pressable>
        </View>

        {/* Stats Summary */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            This Week
          </Text>
          <View className="flex-row justify-between">
            <View className={`flex-1 p-4 rounded-xl mr-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                {weeklyStats.workoutCount}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Workouts</Text>
            </View>
            <View className={`flex-1 p-4 rounded-xl ml-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                {weeklyStats.totalVolume >= 1000
                  ? `${(weeklyStats.totalVolume / 1000).toFixed(1)}k`
                  : weeklyStats.totalVolume}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>lbs Volume</Text>
            </View>
          </View>
        </View>

        {/* Calendar View */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Training Calendar
          </Text>
          <CalendarView />
        </View>
      </View>

      {/* Exercise Library Modal */}
      <Modal
        visible={showExerciseLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseLibrary(false)}
      >
        <ExerciseLibraryScreen />
        <Pressable
          className={`absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          onPress={() => setShowExerciseLibrary(false)}
          accessibilityLabel="Close Exercise Library"
          accessibilityRole="button"
        >
          <Text className={`text-2xl ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>×</Text>
        </Pressable>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <AnalyticsScreen />
        <Pressable
          className={`absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          onPress={() => setShowAnalytics(false)}
          accessibilityLabel="Close Analytics"
          accessibilityRole="button"
        >
          <Text className={`text-2xl ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>×</Text>
        </Pressable>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen />
        <Pressable
          className={`absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          onPress={() => setShowSettings(false)}
          accessibilityLabel="Close Settings"
          accessibilityRole="button"
        >
          <Text className={`text-2xl ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>×</Text>
        </Pressable>
      </Modal>

      {/* Recovery Check-In Modal */}
      {currentCheckInInjury && (
        <RecoveryCheckInModal
          visible={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          injury={{
            id: currentCheckInInjury.id,
            bodyPart: currentCheckInInjury.bodyPart,
            severity: currentCheckInInjury.severity as 'mild' | 'moderate' | 'severe',
            description: currentCheckInInjury.description,
            status: currentCheckInInjury.status as 'active' | 'recovering' | 'resolved',
            reportedAt: currentCheckInInjury.reportedAt,
            lastCheckInAt: currentCheckInInjury.lastCheckInAt,
          }}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
    </ScrollView>
  );
}

