import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "../store/auth.store";
import { useWorkoutStore } from "../store/workout.store";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import {
  Dumbbell,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react-native";
import {
  MetricCard,
  StatsOverview,
  HealthSnapshotCard,
} from "../components/dashboard";
import { database } from "../services/database/watermelon/database";
import WorkoutLog from "../services/database/watermelon/models/WorkoutLog";
import Set from "../services/database/watermelon/models/Set";
import { Q } from "@nozbe/watermelondb";
import { VolumeDataPoint, ReadinessDataPoint } from "../services/charts/ChartDataService";
import AnalyticsAPIClient, { FatigueAnalytics } from "../services/api/AnalyticsAPIClient";
import { supabaseAnalyticsService } from "../services/analytics/SupabaseAnalyticsService";

export default function HomeScreen({ navigation }: any) {
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

  // Analytics state
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [readinessData, setReadinessData] = useState<ReadinessDataPoint[]>([]);
  const [fatigueData, setFatigueData] = useState<FatigueAnalytics | null>(null);
  const [prCount, setPrCount] = useState<number>(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadWeeklyStats(),
        loadAnalyticsData()
      ]);
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

  const loadAnalyticsData = async () => {
    if (!user?.id) {
      setAnalyticsLoading(false);
      return;
    }

    try {
      setAnalyticsLoading(true);

      // Fetch volume trends from Supabase (last 12 weeks)
      const volume = await supabaseAnalyticsService.getVolumeTrends(user.id);
      console.log('Volume data loaded:', volume.length, 'weeks');
      setVolumeData(volume);

      // Fetch readiness trends from Supabase (last 7 days)
      const readiness = await supabaseAnalyticsService.getReadinessTrend(user.id);
      console.log('Readiness data loaded:', readiness.length, 'days');
      setReadinessData(readiness);

      // Fetch fatigue analytics from backend API
      try {
        const fatigue = await AnalyticsAPIClient.getFatigueAnalytics(user.id);
        setFatigueData(fatigue);
      } catch (error) {
        console.log("Fatigue analytics not available:", error);
        // Don't fail the whole load if fatigue data isn't available
      }

      // Count PRs from Supabase (last 30 days)
      const prCount = await supabaseAnalyticsService.getPRCount(user.id);
      console.log('PR count loaded:', prCount);
      setPrCount(prCount);

    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setAnalyticsLoading(false);
    }
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
        {/* Header with Avatar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: tokens.spacing.xl,
          }}
        >
          <View style={{ flex: 1 }}>
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

          {/* Avatar Button */}
          <Pressable
            onPress={() => navigation.navigate("Profile")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.accent.blue,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: "white",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "?"}
              </Text>
            </View>
          </Pressable>
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

        {/* Health Snapshot Card */}
        <HealthSnapshotCard
          onPress={() => {
            // TODO: Navigate to health snapshot details screen
            console.log('Navigate to health snapshot details');
          }}
        />

        {/* Insights & Analytics Grid */}
        <View style={{ marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.xl }}>
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
              Insights & Analytics
            </Text>
            <Pressable
              onPress={() => {
                // TODO: Navigate to AnalyticsScreen when ready
                console.log('Navigate to Analytics');
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

          {/* 2x2 Grid */}
          <View style={{ gap: tokens.spacing.md }}>
            {/* Row 1 */}
            <View style={{ flexDirection: "row", gap: tokens.spacing.md }}>
              {/* Volume Trend Card (Top-Left) */}
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => navigation.navigate('VolumeDetail')}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: tokens.borderRadius.lg,
                      padding: tokens.spacing.md,
                      height: 140,
                      ...tokens.shadows.md,
                      borderWidth: 1,
                      borderColor: colors.border.primary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: colors.text.secondary,
                            marginBottom: tokens.spacing.xs,
                            fontWeight: tokens.typography.fontWeight.semibold,
                          }}
                        >
                          Volume Trend
                        </Text>
                        <Text
                          style={{
                            fontSize: tokens.typography.fontSize.xs,
                            color: colors.text.tertiary,
                            marginBottom: tokens.spacing.sm,
                          }}
                        >
                          Last 7 Days
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.text.tertiary} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      {analyticsLoading ? (
                        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                          Loading...
                        </Text>
                      ) : volumeData.length > 0 ? (
                        <Text style={{ fontSize: tokens.typography.fontSize.xxl, fontWeight: tokens.typography.fontWeight.bold, color: colors.accent.blue }}>
                          {Math.round(volumeData.slice(-7).reduce((sum, d) => sum + d.tonnage, 0) / 1000)}k lbs
                        </Text>
                      ) : (
                        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                          No data
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* PRs This Month Card (Top-Right) */}
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="PRs This Month"
                  value={prCount}
                  subtitle="New Records"
                  icon={Award}
                  iconColor={colors.accent.coral}
                  variant="compact"
                  onPress={() => {
                    // TODO: Navigate to PRs screen when ready
                    console.log('Navigate to PRs screen');
                  }}
                />
              </View>
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: "row", gap: tokens.spacing.md }}>
              {/* Readiness Card (Bottom-Left) */}
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => navigation.navigate('RecoveryDetail')}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: tokens.borderRadius.lg,
                      padding: tokens.spacing.md,
                      height: 140,
                      ...tokens.shadows.md,
                      borderWidth: 1,
                      borderColor: colors.border.primary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: colors.text.secondary,
                            marginBottom: tokens.spacing.xs,
                            fontWeight: tokens.typography.fontWeight.semibold,
                          }}
                        >
                          Readiness
                        </Text>
                        <Text
                          style={{
                            fontSize: tokens.typography.fontSize.xs,
                            color: colors.text.tertiary,
                            marginBottom: tokens.spacing.sm,
                          }}
                        >
                          Last 7 Days
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.text.tertiary} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      {analyticsLoading ? (
                        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                          Loading...
                        </Text>
                      ) : readinessData.length > 0 ? (
                        <Text style={{ fontSize: tokens.typography.fontSize.xxl, fontWeight: tokens.typography.fontWeight.bold, color: colors.accent.green }}>
                          {Math.round(readinessData[readinessData.length - 1].compositeScore)}%
                        </Text>
                      ) : (
                        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                          No data
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Fatigue Score Card (Bottom-Right) */}
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Fatigue Score"
                  value={fatigueData?.current_fatigue_score?.toFixed(1) || '--'}
                  subtitle={
                    fatigueData?.current_fatigue_score
                      ? fatigueData.current_fatigue_score < 4 ? 'Low'
                        : fatigueData.current_fatigue_score < 7 ? 'Moderate'
                        : 'High'
                      : 'No data'
                  }
                  icon={Activity}
                  iconColor={
                    fatigueData?.current_fatigue_score
                      ? fatigueData.current_fatigue_score < 4 ? colors.accent.green
                        : fatigueData.current_fatigue_score < 7 ? colors.accent.orange
                        : colors.accent.coral
                      : colors.text.tertiary
                  }
                  variant="compact"
                  onPress={() => navigation.navigate('RecoveryDetail')}
                />
              </View>
            </View>
          </View>
        </View>

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


      </View>
    </ScrollView>
  );
}
