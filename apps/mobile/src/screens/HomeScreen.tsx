import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "../store/auth.store";
import { useWorkoutStore } from "../store/workout.store";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import {
  Dumbbell,
  Activity,
  Zap,
  Target,
  Clock,
  Award,
} from "lucide-react-native";
import {
  MetricCard,
  TimelineItem,
  StatsOverview,
} from "../components/dashboard";
import { database } from "../services/database/watermelon/database";
import WorkoutLog from "../services/database/watermelon/models/WorkoutLog";
import Set from "../services/database/watermelon/models/Set";
import { Q } from "@nozbe/watermelondb";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const user = useAuthStore((state) => state.user);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  const [weeklyStats, setWeeklyStats] = useState({
    workoutCount: 0,
    totalVolume: 0,
    totalSets: 0,
    totalTime: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([loadWeeklyStats(), loadRecentWorkouts()]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const workouts = await database
        .get<WorkoutLog>("workout_logs")
        .query(Q.where("start_time", Q.gte(oneWeekAgo.getTime())))
        .fetch();

      const workoutIds = workouts.map((w) => w.id);
      const sets = await database
        .get<Set>("sets")
        .query(Q.where("workout_log_id", Q.oneOf(workoutIds)))
        .fetch();

      const totalVolume = sets.reduce(
        (sum, set) => sum + set.weight * set.reps,
        0,
      );
      const totalTime = workouts.reduce((sum, workout) => {
        if (workout.endTime) {
          const duration =
            workout.endTime.getTime() - workout.startTime.getTime();
          return sum + duration;
        }
        return sum;
      }, 0);

      setWeeklyStats({
        workoutCount: workouts.length,
        totalVolume: Math.round(totalVolume),
        totalSets: sets.length,
        totalTime: Math.round(totalTime / 60000), // Convert to minutes
      });
    } catch (error) {
      console.error("Failed to load weekly stats:", error);
    }
  };

  const loadRecentWorkouts = async () => {
    try {
      const workouts = await database
        .get<WorkoutLog>("workout_logs")
        .query(Q.sortBy("start_time", Q.desc), Q.take(5))
        .fetch();

      setRecentWorkouts(workouts);
    } catch (error) {
      console.error("Failed to load recent workouts:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "In progress";
    const minutes = Math.floor((endTime - startTime) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
      }}
    >
      <View style={{ padding: tokens.spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize["3xl"],
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            {getCurrentGreeting()}, {user?.name?.split(" ")[0] || "Athlete"}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Active Workout Banner */}
        {activeWorkout && (
          <Pressable
            style={{
              backgroundColor: colors.accent.orange,
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing.lg,
              marginBottom: tokens.spacing.xl,
              ...tokens.shadows.md,
            }}
            onPress={() => {
              // Navigate to workout in progress
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: "white",
                    opacity: 0.9,
                    marginBottom: 4,
                  }}
                >
                  WORKOUT IN PROGRESS
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: "white",
                  }}
                >
                  {activeWorkout.name}
                </Text>
              </View>
              <Activity color="white" size={32} strokeWidth={2.5} />
            </View>
          </Pressable>
        )}

        {/* Weekly Stats Overview */}
        <StatsOverview
          title="This Week"
          variant="row"
          stats={[
            {
              label: "Workouts",
              value: weeklyStats.workoutCount,
              color: colors.accent.blue,
            },
            {
              label: "Total Volume",
              value:
                weeklyStats.totalVolume >= 1000
                  ? `${(weeklyStats.totalVolume / 1000).toFixed(1)}k`
                  : weeklyStats.totalVolume,
              unit: "lbs",
              color: colors.accent.green,
            },
            {
              label: "Total Sets",
              value: weeklyStats.totalSets,
              color: colors.accent.purple,
            },
            {
              label: "Training Time",
              value: weeklyStats.totalTime,
              unit: "min",
              color: colors.accent.coral,
            },
          ]}
        />

        {/* Quick Action - Start Workout */}
        <Pressable
          style={{
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.lg,
            marginTop: tokens.spacing.xl,
            marginBottom: tokens.spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            ...tokens.shadows.md,
          }}
          onPress={() => startWorkout("Quick Workout")}
          accessibilityLabel="Start Workout"
          accessibilityRole="button"
        >
          <Dumbbell color="white" size={24} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: "white",
              marginLeft: tokens.spacing.md,
            }}
          >
            Start Workout
          </Text>
        </Pressable>

        {/* Metric Cards Grid */}
        <View
          style={{
            flexDirection: "row",
            gap: tokens.spacing.md,
            marginBottom: tokens.spacing.xl,
          }}
        >
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Weekly Goal"
              value="4/5"
              subtitle="workouts"
              icon={Target}
              iconColor={colors.accent.green}
              trend="up"
              trendValue="+1"
              variant="compact"
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Streak"
              value="12"
              subtitle="days"
              icon={Zap}
              iconColor={colors.accent.orange}
              variant="compact"
            />
          </View>
        </View>

        {/* Today's Program Card */}
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.md,
            }}
          >
            Today's Program
          </Text>
          <Pressable
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing.lg,
              ...tokens.shadows.sm,
            }}
            onPress={() => {
              // Navigate to today's program
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: tokens.spacing.sm,
              }}
            >
              <Dumbbell color={colors.accent.blue} size={20} />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                  marginLeft: tokens.spacing.sm,
                }}
              >
                Push Day
              </Text>
            </View>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Chest, Shoulders, Triceps
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock color={colors.text.tertiary} size={16} />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.tertiary,
                  marginLeft: 4,
                }}
              >
                Estimated 1h 15m • 6 exercises
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Recent Activity Timeline */}
        {recentWorkouts.length > 0 && (
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              }}
            >
              Recent Activity
            </Text>
            <View
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.md,
                ...tokens.shadows.sm,
              }}
            >
              {recentWorkouts.map((workout, index) => (
                <TimelineItem
                  key={workout.id}
                  title={workout.workoutName || "Workout"}
                  subtitle={formatDuration(
                    workout.startTime.getTime(),
                    workout.endTime?.getTime(),
                  )}
                  time={formatDate(workout.startTime.getTime())}
                  icon={Dumbbell}
                  iconColor={colors.accent.blue}
                  iconBackgroundColor={colors.accent.blue + "20"}
                  isLast={index === recentWorkouts.length - 1}
                  onPress={() => {
                    // Navigate to workout detail
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Personal Records */}
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: tokens.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              Personal Records
            </Text>
            <Pressable
              onPress={() => {
                // Navigate to PRs screen
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.accent.blue,
                }}
              >
                View All
              </Text>
            </Pressable>
          </View>
          <MetricCard
            title="Recent PR"
            value="225 lbs"
            subtitle="Bench Press • 3 days ago"
            icon={Award}
            iconColor={colors.accent.coral}
            trend="up"
            trendValue="+10 lbs"
            onPress={() => {
              // Navigate to PRs
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
