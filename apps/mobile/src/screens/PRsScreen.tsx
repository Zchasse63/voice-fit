import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Trophy, TrendingUp, Award } from 'lucide-react-native';
import PRProgressionChart from '../components/charts/PRProgressionChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SyncStatus from '../components/common/SyncStatus';
import { database } from '../services/database/watermelon/database';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';

interface PersonalRecord {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  date: Date;
  improvement: string;
}

interface ProgressionPoint {
  date: string;
  weight: number;
  reps: number;
}

const fitnessMetrics = [
  { label: 'Total PRs', value: '0', icon: Trophy },
  { label: 'This Month', value: '0', icon: TrendingUp },
  { label: 'Streak', value: '0 weeks', icon: Award },
];

export default function PRsScreen() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [progression, setProgression] = useState<ProgressionPoint[]>([]);
  const [metrics, setMetrics] = useState(fitnessMetrics);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all sets from database
      const allSets = await database.get<Set>('sets').query().fetch();

      if (allSets.length === 0) {
        setIsLoading(false);
        return;
      }

      // Group sets by exercise
      const setsByExercise = new Map<string, Set[]>();
      allSets.forEach((set) => {
        const exerciseName = set.exerciseName;
        if (!setsByExercise.has(exerciseName)) {
          setsByExercise.set(exerciseName, []);
        }
        setsByExercise.get(exerciseName)!.push(set);
      });

      // Calculate PRs for each exercise (max weight for each rep range)
      const personalRecords: PersonalRecord[] = [];

      setsByExercise.forEach((sets, exerciseName) => {
        // Find max weight for this exercise
        let maxSet = sets[0];
        sets.forEach((set) => {
          if (set.weight > maxSet.weight) {
            maxSet = set;
          }
        });

        // Calculate improvement (compare to second best)
        const sortedSets = [...sets].sort((a, b) => b.weight - a.weight);
        const improvement = sortedSets.length > 1
          ? `+${maxSet.weight - sortedSets[1].weight} lbs`
          : 'New PR!';

        personalRecords.push({
          id: maxSet.id,
          exercise: exerciseName,
          weight: maxSet.weight,
          reps: maxSet.reps,
          date: maxSet.createdAt,
          improvement,
        });
      });

      // Sort PRs by date (most recent first)
      personalRecords.sort((a, b) => b.date.getTime() - a.date.getTime());
      setPRs(personalRecords);

      // Calculate metrics
      const totalPRs = personalRecords.length;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const prsThisMonth = personalRecords.filter((pr) => pr.date >= oneMonthAgo).length;

      setMetrics([
        { label: 'Total PRs', value: totalPRs.toString(), icon: Trophy },
        { label: 'This Month', value: prsThisMonth.toString(), icon: TrendingUp },
        { label: 'Exercises', value: setsByExercise.size.toString(), icon: Award },
      ]);

      // Get progression for first exercise (if any)
      if (personalRecords.length > 0) {
        const firstExercise = personalRecords[0].exercise;
        const exerciseSets = setsByExercise.get(firstExercise) || [];

        // Sort by date and create progression points
        const progressionPoints: ProgressionPoint[] = exerciseSets
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((set) => ({
            date: set.createdAt.toISOString().split('T')[0],
            weight: set.weight,
            reps: set.reps,
          }));

        setProgression(progressionPoints);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError('Failed to load progress data. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your progress..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadProgressData} fullScreen />;
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              Personal Records
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your best lifts and progression
            </Text>
          </View>
          <SyncStatus />
        </View>

        {/* Fitness Metrics */}
        <View className="mt-6 flex-row justify-between">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <View
                key={index}
                className={`flex-1 p-4 rounded-xl mx-1 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <Icon color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <Text className={`text-2xl font-bold mt-2 ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  {metric.value}
                </Text>
                <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {metric.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* PR List */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Recent PRs
          </Text>

          {prs.length > 0 ? (
            prs.map((pr) => (
              <View key={pr.id} className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {pr.exercise}
                    </Text>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {pr.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-2xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                      {pr.weight}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {pr.reps} reps
                    </Text>
                    <Text className="text-xs text-green-600 mt-1">
                      {pr.improvement}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No PRs yet. Complete workouts to track your personal records!
              </Text>
            </View>
          )}
        </View>

        {/* Progress Chart */}
        {progression.length > 0 && prs.length > 0 && (
          <View className="mt-6">
            <PRProgressionChart data={progression} exerciseName={prs[0].exercise} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

