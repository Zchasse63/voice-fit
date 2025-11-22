import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { Trophy, TrendingUp, Award } from 'lucide-react-native';
import PRProgressionChart from '../components/charts/PRProgressionChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SyncStatus from '../components/common/SyncStatus';
import { database } from '../services/database/watermelon/database';
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

const fitnessMetrics = [
  { label: 'Total PRs', value: '0', icon: Trophy },
  { label: 'This Month', value: '0', icon: TrendingUp },
  { label: 'Streak', value: '0 weeks', icon: Award },
];

const ITEMS_PER_PAGE = 20;

export default function PRsScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [progression] = useState<any[]>([]);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ padding: tokens.spacing.lg }}
    >
      <View>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              Personal Records
            </Text>
            <Text
              style={{
                marginTop: tokens.spacing.xs,
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Your best lifts and progression
            </Text>
          </View>
          <SyncStatus />
        </View>

        {/* Fitness Metrics */}
        <View
          style={{
            marginTop: tokens.spacing.lg,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <View
                key={index}
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  marginHorizontal: 4,
                  backgroundColor: colors.background.secondary,
                }}
              >
                <Icon color={colors.accent.blue} size={20} />
                <Text
                  style={{
                    marginTop: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {metric.value}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {metric.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* PR List */}
        <View style={{ marginTop: tokens.spacing.xl }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Recent PRs
          </Text>

          {prs.length > 0 ? (
            prs.map((pr) => (
              <View
                key={pr.id}
                style={{
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  marginBottom: tokens.spacing.xs,
                  backgroundColor: colors.background.secondary,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: colors.text.primary,
                      }}
                    >
                      {pr.exercise}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: tokens.typography.fontSize.xs,
                        color: colors.text.secondary,
                      }}
                    >
                      {pr.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.md,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.accent.blue,
                      }}
                    >
                      {pr.weight}
                    </Text>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: colors.text.secondary,
                      }}
                    >
                      {pr.reps} reps
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: tokens.typography.fontSize.xs,
                        color: colors.accent.green,
                      }}
                    >
                      {pr.improvement}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
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
            style={{
              marginTop: tokens.spacing.md,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              alignItems: 'center',
              backgroundColor: colors.background.secondary,
            }}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={colors.accent.green} />
            ) : (
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.accent.blue,
                }}
              >
                Load More PRs
              </Text>
            )}
          </Pressable>
        )}

        {/* Progress Chart */}
        {progression.length > 0 && prs.length > 0 && (
          <View style={{ marginTop: tokens.spacing.lg }}>
            <PRProgressionChart data={progression} exerciseName={prs[0].exercise} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

