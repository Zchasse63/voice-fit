import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Calendar } from 'lucide-react-native';
import VolumeChart from '../components/charts/VolumeChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SyncStatus from '../components/common/SyncStatus';
import WorkoutDetailScreen from './WorkoutDetailScreen';
import StatsView from '../components/stats/StatsView';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';

interface WorkoutWithStats {
  id: string;
  name: string;
  date: Date;
  sets: number;
  volume: number;
}

interface VolumeDataPoint {
  date: string;
  volume: number;
}

type ViewMode = 'list' | 'calendar' | 'stats';

export default function LogScreen() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutWithStats[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all workouts from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const workoutLogs = await database
        .get<WorkoutLog>('workout_logs')
        .query(
          Q.where('start_time', Q.gte(thirtyDaysAgo.getTime())),
          Q.sortBy('start_time', Q.desc)
        )
        .fetch();

      // Calculate stats for each workout
      const workoutsWithStats: WorkoutWithStats[] = await Promise.all(
        workoutLogs.map(async (workout) => {
          const sets = await database
            .get<Set>('sets')
            .query(Q.where('workout_log_id', workout.id))
            .fetch();

          const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

          return {
            id: workout.id,
            name: workout.workoutName,
            date: workout.startTime,
            sets: sets.length,
            volume: Math.round(volume),
          };
        })
      );

      setWorkouts(workoutsWithStats);

      // Calculate volume data for chart (group by day)
      const volumeByDay = new Map<string, number>();
      workoutsWithStats.forEach((workout) => {
        const dateKey = workout.date.toISOString().split('T')[0];
        volumeByDay.set(dateKey, (volumeByDay.get(dateKey) || 0) + workout.volume);
      });

      const volumeDataPoints: VolumeDataPoint[] = Array.from(volumeByDay.entries())
        .map(([date, volume]) => ({ date, volume }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setVolumeData(volumeDataPoints);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load workout history:', err);
      setError('Failed to load workout history. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading workout history..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadWorkoutHistory} fullScreen />;
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <ScrollView>
        <View className="p-6">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                Workout Log
              </Text>
              <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Your training history
              </Text>
            </View>
            <SyncStatus />
          </View>

          {/* Segment Control */}
          <View className={`mt-6 p-1 rounded-xl flex-row ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <Pressable
              className={`flex-1 py-2 px-4 rounded-lg ${viewMode === 'list' ? (isDark ? 'bg-primaryDark' : 'bg-primary-500') : ''}`}
              onPress={() => setViewMode('list')}
              accessibilityLabel="List view"
              accessibilityRole="button"
            >
              <Text className={`text-center font-semibold ${viewMode === 'list' ? 'text-white' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                List
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-2 px-4 rounded-lg ${viewMode === 'calendar' ? (isDark ? 'bg-primaryDark' : 'bg-primary-500') : ''}`}
              onPress={() => setViewMode('calendar')}
              accessibilityLabel="Calendar view"
              accessibilityRole="button"
            >
              <Text className={`text-center font-semibold ${viewMode === 'calendar' ? 'text-white' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                Calendar
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-2 px-4 rounded-lg ${viewMode === 'stats' ? (isDark ? 'bg-primaryDark' : 'bg-primary-500') : ''}`}
              onPress={() => setViewMode('stats')}
              accessibilityLabel="Stats view"
              accessibilityRole="button"
            >
              <Text className={`text-center font-semibold ${viewMode === 'stats' ? 'text-white' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                Stats
              </Text>
            </Pressable>
          </View>

          {/* Conditional View Rendering */}
          <View className="mt-6">
            {viewMode === 'list' && (
              <>
                {/* Volume Chart */}
                <View className="mb-6">
                  {volumeData.length > 0 ? (
                    <VolumeChart data={volumeData} title="Weekly Volume" />
                  ) : (
                    <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No workout data yet. Complete your first workout to see your volume chart!
                      </Text>
                    </View>
                  )}
                </View>

                {/* Workout List */}
                <View>
                  <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Recent Workouts
                  </Text>

                  {workouts.length > 0 ? (
                    workouts.map((workout) => (
                      <Pressable
                        key={workout.id}
                        className={`p-4 rounded-xl mb-3 active:opacity-80 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                        onPress={() => setSelectedWorkoutId(workout.id)}
                        accessibilityLabel={`View ${workout.name} details`}
                        accessibilityRole="button"
                      >
                        <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {workout.name}
                        </Text>
                        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {workout.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                        <View className="flex-row mt-2">
                          <Text className={`text-sm mr-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {workout.sets} sets
                          </Text>
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {workout.volume.toLocaleString()} lbs
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  ) : (
                    <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No workouts yet. Start your first workout to see it here!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {viewMode === 'calendar' && (
              <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <View className="flex-row items-center mb-3">
                  <Calendar color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                  <Text className={`text-lg font-bold ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    November 2025
                  </Text>
                </View>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Calendar view coming in Phase 6
                </Text>
              </View>
            )}

            {viewMode === 'stats' && <StatsView />}
          </View>
        </View>
      </ScrollView>


      {/* Workout Detail Modal */}
      <Modal
        visible={selectedWorkoutId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedWorkoutId(null)}
      >
        {selectedWorkoutId && (
          <WorkoutDetailScreen
            workoutId={selectedWorkoutId}
            onBack={() => setSelectedWorkoutId(null)}
          />
        )}
      </Modal>
    </View>
  );
}

