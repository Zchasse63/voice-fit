import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Clock, Dumbbell } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';

interface WorkoutDetailScreenProps {
  workoutId: string;
  onBack: () => void;
}

interface SetWithExercise {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe: number;
}

interface ExerciseGroup {
  exerciseName: string;
  sets: SetWithExercise[];
  totalVolume: number;
}

export default function WorkoutDetailScreen({ workoutId, onBack }: WorkoutDetailScreenProps) {
  const { isDark } = useTheme();
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkoutDetails();
  }, [workoutId]);

  const loadWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const workoutLog = await database
        .get<WorkoutLog>('workout_logs')
        .find(workoutId);

      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', workoutId))
        .fetch();

      // Group sets by exercise
      const groupMap = new Map<string, SetWithExercise[]>();
      sets.forEach((set) => {
        const exerciseName = set.exerciseName;
        if (!groupMap.has(exerciseName)) {
          groupMap.set(exerciseName, []);
        }
        groupMap.get(exerciseName)!.push({
          id: set.id,
          exerciseName: set.exerciseName,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
        });
      });

      // Calculate total volume for each exercise
      const groups: ExerciseGroup[] = Array.from(groupMap.entries()).map(([exerciseName, sets]) => {
        const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        return {
          exerciseName,
          sets,
          totalVolume,
        };
      });

      setWorkout(workoutLog);
      setExerciseGroups(groups);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load workout details:', err);
      setError('Failed to load workout details. Please try again.');
      setIsLoading(false);
    }
  };

  const formatDuration = (startTime: Date, endTime: Date): string => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading workout..." fullScreen />;
  }

  if (error || !workout) {
    return (
      <ErrorMessage
        message={error || 'Workout not found'}
        onRetry={loadWorkoutDetails}
        fullScreen
      />
    );
  }

  const totalSets = exerciseGroups.reduce((sum, group) => sum + group.sets.length, 0);
  const totalVolume = exerciseGroups.reduce((sum, group) => sum + group.totalVolume, 0);

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={onBack}
            className="mr-4 active:opacity-60"
            accessibilityLabel="Go Back"
            accessibilityRole="button"
          >
            <ArrowLeft color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
          </Pressable>
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              {workout.workoutName}
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {workout.startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="flex-row mb-6">
          <View className={`flex-1 p-4 rounded-xl mr-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row items-center mb-2">
              <Clock color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
              <Text className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Duration
              </Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatDuration(workout.startTime, workout.endTime)}
            </Text>
          </View>

          <View className={`flex-1 p-4 rounded-xl ml-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row items-center mb-2">
              <Dumbbell color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
              <Text className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Volume
              </Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}k`
                : totalVolume} lbs
            </Text>
          </View>
        </View>

        {/* Exercise Groups */}
        <View>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Exercises ({exerciseGroups.length})
          </Text>

          {exerciseGroups.map((group, groupIndex) => (
            <View
              key={groupIndex}
              className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {group.exerciseName}
              </Text>

              {/* Sets Table Header */}
              <View className="flex-row mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Text className={`flex-1 text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Set
                </Text>
                <Text className={`flex-1 text-xs font-bold text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Weight
                </Text>
                <Text className={`flex-1 text-xs font-bold text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Reps
                </Text>
                <Text className={`flex-1 text-xs font-bold text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  RPE
                </Text>
                <Text className={`flex-1 text-xs font-bold text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Volume
                </Text>
              </View>

              {/* Sets Rows */}
              {group.sets.map((set, setIndex) => (
                <View key={set.id} className="flex-row py-2">
                  <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {setIndex + 1}
                  </Text>
                  <Text className={`flex-1 text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {set.weight} lbs
                  </Text>
                  <Text className={`flex-1 text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {set.reps}
                  </Text>
                  <Text className={`flex-1 text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {set.rpe || '-'}
                  </Text>
                  <Text className={`flex-1 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {set.weight * set.reps}
                  </Text>
                </View>
              ))}

              {/* Exercise Summary */}
              <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Text className={`flex-1 text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Total
                </Text>
                <Text className={`flex-1 text-sm font-bold text-right ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  {group.sets.length} sets • {group.totalVolume} lbs
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Workout Summary */}
        <View className={`p-4 rounded-xl mt-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Workout Summary
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Exercises
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {exerciseGroups.length}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Sets
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {totalSets}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Volume
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              {totalVolume.toLocaleString()} lbs
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

