/**
 * HomeScreen - Dashboard (Redesigned)
 * 
 * Main dashboard showing:
 * - Readiness check
 * - Today's workout (quick view)
 * - Quick stats (weekly volume, PRs)
 * - Recent PRs
 * - "View Full History" button → LogScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Activity,
  TrendingUp,
  Calendar,
  Trophy,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import tokens from '../theme/tokens';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';
import { SkeletonGroup } from '../components/common/SkeletonLoader';
import AnimatedListItem from '../components/common/AnimatedListItem';
import WorkoutTypeBadge from '../components/common/WorkoutTypeBadge';
import { ReadinessScoreBadge } from '../components/common/ReadinessScoreIcon';

interface WeeklyStats {
  workoutCount: number;
  totalVolume: number;
  avgRPE: number;
}

interface RecentPR {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: Date;
  prType: 'weight' | 'reps' | 'volume';
}

export default function HomeScreen({ navigation }: any) {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    workoutCount: 0,
    totalVolume: 0,
    avgRPE: 0,
  });
  const [recentPRs, setRecentPRs] = useState<RecentPR[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readinessScore, setReadinessScore] = useState<number | null>(null); // Mock readiness score

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadWeeklyStats(),
        loadRecentPRs(),
        loadTodayWorkout(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    try {
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

      // Calculate stats
      const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const setsWithRPE = sets.filter((set) => set.rpe);
      const avgRPE = setsWithRPE.length > 0
        ? setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRPE.length
        : 0;

      setWeeklyStats({
        workoutCount: workouts.length,
        totalVolume: Math.round(totalVolume),
        avgRPE: Math.round(avgRPE * 10) / 10,
      });
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const loadRecentPRs = async () => {
    try {
      // TODO: Implement PR detection logic
      // For now, show placeholder
      setRecentPRs([]);
    } catch (error) {
      console.error('Error loading recent PRs:', error);
    }
  };

  const loadTodayWorkout = async () => {
    try {
      // TODO: Load today's programmed workout
      // For now, show placeholder
      setTodayWorkout(null);
    } catch (error) {
      console.error('Error loading today workout:', error);
    }
  };

  const renderReadinessCard = () => {
    // If readiness score exists, show it with badge
    if (readinessScore !== null) {
      return (
        <TouchableOpacity
          style={styles.readinessCard}
          onPress={() => {
            // TODO: Navigate to readiness details
            console.log('Navigate to readiness details');
          }}
        >
          <View style={styles.readinessHeader}>
            <Text style={styles.readinessTitle}>Daily Readiness</Text>
          </View>
          <View style={styles.readinessScoreContainer}>
            <ReadinessScoreBadge score={readinessScore} size="large" />
          </View>
          <Text style={styles.readinessSubtitle}>
            Tap to view details
          </Text>
        </TouchableOpacity>
      );
    }

    // If no readiness score, show prompt to complete check
    return (
      <TouchableOpacity
        style={styles.readinessCard}
        onPress={() => {
          // TODO: Navigate to readiness check
          console.log('Navigate to readiness check');
          // Mock: Set a random readiness score for demo
          setReadinessScore(Math.random() * 10);
        }}
      >
        <View style={styles.readinessHeader}>
          <Activity color={tokens.colors.accent.primary} size={24} />
          <Text style={styles.readinessTitle}>Daily Readiness</Text>
        </View>
        <Text style={styles.readinessSubtitle}>
          Tap to complete your readiness check
        </Text>
        <View style={styles.readinessButton}>
          <Text style={styles.readinessButtonText}>Start Check</Text>
          <ChevronRight color={tokens.colors.text.inverse} size={20} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderTodayWorkout = () => {
    if (!todayWorkout) {
      return (
        <View style={styles.todayWorkoutCard}>
          <View style={styles.todayWorkoutHeader}>
            <Calendar color={tokens.colors.accent.primary} size={24} />
            <Text style={styles.todayWorkoutTitle}>Today's Workout</Text>
          </View>
          <Text style={styles.todayWorkoutEmpty}>
            No workout programmed for today
          </Text>
          <TouchableOpacity
            style={styles.todayWorkoutButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.todayWorkoutButtonText}>
              Start Custom Workout
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.todayWorkoutCard}
        onPress={() => navigation.navigate('Chat')}
      >
        <View style={styles.todayWorkoutHeader}>
          <Calendar color={tokens.colors.accent.primary} size={24} />
          <Text style={styles.todayWorkoutTitle}>Today's Workout</Text>
        </View>
        <View style={styles.workoutNameRow}>
          <Text style={styles.todayWorkoutName}>{todayWorkout.name}</Text>
          <WorkoutTypeBadge workoutName={todayWorkout.name} size="small" />
        </View>
        <Text style={styles.todayWorkoutDetails}>
          {todayWorkout.exercises?.length || 0} exercises
        </Text>
      </TouchableOpacity>
    );
  };

  const renderQuickStats = () => {
    return (
      <View style={styles.quickStatsContainer}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.quickStatsRow}>
          <View style={styles.statCard}>
            <TrendingUp color={tokens.colors.accent.primary} size={20} />
            <Text style={styles.statValue}>{weeklyStats.workoutCount}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <Trophy color={tokens.colors.badge.gold} size={20} />
            <Text style={styles.statValue}>
              {weeklyStats.totalVolume >= 1000
                ? `${(weeklyStats.totalVolume / 1000).toFixed(1)}k`
                : weeklyStats.totalVolume}
            </Text>
            <Text style={styles.statLabel}>lbs Volume</Text>
          </View>

          <View style={styles.statCard}>
            <Activity color={tokens.colors.accent.success} size={20} />
            <Text style={styles.statValue}>
              {weeklyStats.avgRPE > 0 ? weeklyStats.avgRPE.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg RPE</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentPRs = () => {
    if (recentPRs.length === 0) {
      return (
        <View style={styles.recentPRsContainer}>
          <Text style={styles.sectionTitle}>Recent PRs</Text>
          <View style={styles.emptyPRsCard}>
            <Trophy color={tokens.colors.text.tertiary} size={32} />
            <Text style={styles.emptyPRsText}>No PRs yet</Text>
            <Text style={styles.emptyPRsSubtext}>
              Keep training to set your first PR!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.recentPRsContainer}>
        <Text style={styles.sectionTitle}>Recent PRs</Text>
        {recentPRs.map((pr, index) => (
          <AnimatedListItem key={pr.id} index={index} animationType="slide">
            <View style={styles.prCard}>
              <Trophy color={tokens.colors.badge.gold} size={20} />
              <View style={styles.prDetails}>
                <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                <Text style={styles.prStats}>
                  {pr.weight} lbs × {pr.reps} reps
                </Text>
              </View>
              <Text style={styles.prDate}>
                {pr.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </AnimatedListItem>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Home</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // TODO: Navigate to LogScreen
            console.log('Navigate to LogScreen');
          }}
          style={styles.viewHistoryButton}
        >
          <FileText color={tokens.colors.accent.primary} size={20} />
          <Text style={styles.viewHistoryText}>View History</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <>
            <SkeletonGroup variant="workoutCard" count={1} />
            <SkeletonGroup variant="stats" count={1} />
            <SkeletonGroup variant="workoutCard" count={2} />
          </>
        ) : (
          <>
            {renderReadinessCard()}
            {renderTodayWorkout()}
            {renderQuickStats()}
            {renderRecentPRs()}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: tokens.colors.accent.primary + '20',
    borderRadius: tokens.borderRadius.md,
  },
  viewHistoryText: {
    marginLeft: 6,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.accent.primary,
  },
  content: {
    padding: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  // Readiness Card
  readinessCard: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  readinessTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing.sm,
  },
  readinessSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.md,
  },
  readinessScoreContainer: {
    alignItems: 'center',
    marginVertical: tokens.spacing.md,
  },
  readinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.accent.primary,
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.sm,
  },
  readinessButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    marginRight: 4,
  },
  // Today Workout Card
  todayWorkoutCard: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  todayWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  todayWorkoutTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing.sm,
  },
  workoutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: 4,
  },
  todayWorkoutName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  todayWorkoutDetails: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  todayWorkoutEmpty: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.md,
  },
  todayWorkoutButton: {
    backgroundColor: tokens.colors.accent.primary,
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
  },
  todayWorkoutButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
  },
  // Quick Stats
  quickStatsContainer: {
    marginBottom: tokens.spacing.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  statValue: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing.xs,
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  // Recent PRs
  recentPRsContainer: {
    marginBottom: tokens.spacing.md,
  },
  emptyPRsCard: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  emptyPRsText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
  },
  emptyPRsSubtext: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  prDetails: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  prExercise: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  prStats: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: 2,
  },
  prDate: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
});

