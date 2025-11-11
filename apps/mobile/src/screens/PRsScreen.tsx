import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Trophy, TrendingUp, Award } from 'lucide-react-native';
import PRProgressionChart from '../components/charts/PRProgressionChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SyncStatus from '../components/common/SyncStatus';
import { database } from '../services/database/watermelon/database';
import Set from '../services/database/watermelon/models/Set';
import PRHistory from '../services/database/watermelon/models/PRHistory';
import { Q } from '@nozbe/watermelondb';
import { useAuthStore } from '../store/auth.store';

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

const ITEMS_PER_PAGE = 20;

export default function PRsScreen() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [progression, setProgression] = useState<ProgressionPoint[]>([]);
  const [metrics, setMetrics] = useState(fitnessMetrics);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, [user?.id]);

  const loadProgressData = async (loadMore = false) => {
    if (!user?.id) return;

    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPage(0);
        setPRs([]);
      }
      setError(null);

      const currentPage = loadMore ? page + 1 : 0;

      // Get PRs from pr_history table with pagination
      const prRecords = await database
        .get<PRHistory>('pr_history')
        .query(
          Q.where('user_id', user.id),
          Q.sortBy('achieved_at', Q.desc),
          Q.skip(currentPage * ITEMS_PER_PAGE),
          Q.take(ITEMS_PER_PAGE)
        )
        .fetch();

      // Check if we have more data
      if (prRecords.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      // Convert PR records to PersonalRecord format
      const personalRecords: PersonalRecord[] = prRecords.map((pr) => ({
        id: pr.id,
        exercise: pr.exerciseName,
        weight: pr.weight,
        reps: pr.reps,
        date: new Date(pr.achievedAt),
        improvement: 'PR!', // Could calculate from previous PR if needed
      }));

      // Append to existing PRs if loading more, otherwise replace
      if (loadMore) {
        setPRs([...prs, ...personalRecords]);
        setPage(currentPage);
      } else {
        setPRs(personalRecords);
      }

      // Calculate metrics (only on initial load, not when loading more)
      if (!loadMore) {
        // Get total count from database
        const totalCount = await database
          .get<PRHistory>('pr_history')
          .query(Q.where('user_id', user.id))
          .fetchCount();

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const prsThisMonth = await database
          .get<PRHistory>('pr_history')
          .query(
            Q.where('user_id', user.id),
            Q.where('achieved_at', Q.gte(oneMonthAgo.getTime()))
          )
          .fetchCount();

        // Get unique exercise count
        const allPRs = await database
          .get<PRHistory>('pr_history')
          .query(Q.where('user_id', user.id))
          .fetch();
        const uniqueExercises = new Set(allPRs.map((pr) => pr.exerciseName)).size;

        setMetrics([
          { label: 'Total PRs', value: totalCount.toString(), icon: Trophy },
          { label: 'This Month', value: prsThisMonth.toString(), icon: TrendingUp },
          { label: 'Exercises', value: uniqueExercises.toString(), icon: Award },
        ]);
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError('Failed to load progress data. Please try again.');
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadProgressData(true);
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

        {/* Load More Button */}
        {hasMore && prs.length > 0 && (
          <Pressable
            onPress={handleLoadMore}
            disabled={isLoadingMore}
            className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} items-center`}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={isDark ? '#4ADE80' : '#16A34A'} />
            ) : (
              <Text className={`text-base font-semibold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                Load More PRs
              </Text>
            )}
          </Pressable>
        )}

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

