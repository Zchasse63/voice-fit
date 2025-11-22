import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
  RunStatsCard,
} from "../components/dashboard";
import { VolumeDataPoint, ReadinessDataPoint } from "../services/charts/ChartDataService";
import AnalyticsAPIClient, { FatigueAnalytics } from "../services/api/AnalyticsAPIClient";
import { supabaseAnalyticsService } from "../services/analytics/SupabaseAnalyticsService";
import { runAnalyticsService, WeeklyRunStats } from "../services/analytics/RunAnalyticsService";
import CurrentSetBar from "../components/workout/CurrentSetBar";
import { ScalePressable } from "../components/common/ScalePressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SyncStatus from "../components/sync/SyncStatus";

export default function HomeScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const user = useAuthStore((state) => state.user);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const insets = useSafeAreaInsets();

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
  const [refreshing, setRefreshing] = useState(false);

  // Run analytics state
  const [runStats, setRunStats] = useState<WeeklyRunStats>({
    totalDistance: 0,
    totalDuration: 0,
    runCount: 0,
    avgPace: 0,
    totalCalories: 0,
  });

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when screen becomes active (navigating back from other screens)
  useFocusEffect(
    useCallback(() => {
      console.log('📊 HomeScreen focused - refreshing analytics data');
      loadDashboardData();
    }, [user?.id])
  );

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadAnalyticsData()
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadAnalyticsData = async () => {
    if (!user?.id) {
      setAnalyticsLoading(false);
      return;
    }

    try {
      setAnalyticsLoading(true);

      const [volume, readiness, prs, weekly, runs] = await Promise.all([
        supabaseAnalyticsService.getDailyVolume(user.id),
        supabaseAnalyticsService.getReadinessTrend(user.id),
        supabaseAnalyticsService.getPRCount(user.id),
        supabaseAnalyticsService.getWeeklyStats(user.id),
        runAnalyticsService.getWeeklyRunStats(user.id),
      ]);

      setVolumeData(volume);
      setReadinessData(readiness);
      setPrCount(prs);
      setRunStats(runs);

      setWeeklyStats({
        workoutCount: weekly.workoutCount,
        totalVolume: weekly.totalVolume,
        totalSets: weekly.totalSets,
        totalTime: weekly.totalTime,
      });

      // Fetch fatigue analytics from backend API (separately as it's a different service)
      try {
        const fatigue = await AnalyticsAPIClient.getFatigueAnalytics(user.id);
        setFatigueData(fatigue);
      } catch (error) {
        console.log("Fatigue analytics not available:", error);
      }

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
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colors.background.primary,
        }}
        contentContainerStyle={{ paddingTop: insets.top + tokens.spacing.md, paddingBottom: tokens.spacing["2xl"] * 2 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text.secondary}
            colors={[colors.text.secondary]}
          />
        }
      >
        <View style={{ padding: tokens.spacing.lg }}>
          {/* Hero Header */}
          <View style={{ marginBottom: tokens.spacing.xl }}>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize["3xl"],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  {getCurrentGreeting()},
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize["3xl"],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.blue,
                  }}
                >
                  {user?.name?.split(" ")[0] || "Athlete"}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginTop: tokens.spacing.sm,
                  }}
                >
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>

                {/* Sync Status */}
                <View style={{ marginTop: tokens.spacing.md }}>
                  <SyncStatus />
                </View>
              </View>

              <ScalePressable
                onPress={() => navigation.navigate("Profile")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: tokens.borderRadius.full,
                  backgroundColor: colors.background.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  ...tokens.shadows.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.blue,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </Text>
              </ScalePressable>
            </View>
          </View>

          {/* Active Workout Banner */}
          {activeWorkout && (
            <ScalePressable
              style={{
                backgroundColor: colors.accent.orange,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.lg,
                marginBottom: tokens.spacing.xl,
                ...tokens.shadows.md,
              }}
              onPress={() => navigation.navigate("ProgramLog")}
              haptic="medium"
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.lg,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: "#FFFFFF",
                      marginBottom: 4,
                    }}
                  >
                    Workout in Progress
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: tokens.typography.fontSize.sm }}>
                    Tap to resume your session
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.borderRadius.full,
                  }}
                >
                  <Dumbbell color="#FFFFFF" size={24} />
                </View>
              </View>
            </ScalePressable>
          )}

          {/* Daily Check-in & Weekly Digest Buttons */}
          <View style={{ flexDirection: 'row', gap: tokens.spacing.md, marginBottom: tokens.spacing.xl }}>
            <ScalePressable
              onPress={() => navigation.navigate("Chat", { intent: "check-in" })}
              haptic="light"
              style={{
                flex: 1,
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border.light,
                ...tokens.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.xs }}>
                <Activity size={20} color={colors.accent.blue} style={{ marginRight: tokens.spacing.xs }} />
                <Text style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: colors.text.primary }}>
                  Daily Check-in
                </Text>
              </View>
              <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                Log sleep, energy & status
              </Text>
            </ScalePressable>

            <ScalePressable
              onPress={() => navigation.navigate("Chat", { intent: "weekly-digest" })}
              haptic="light"
              style={{
                flex: 1,
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border.light,
                ...tokens.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.xs }}>
                <Award size={20} color={colors.accent.purple} style={{ marginRight: tokens.spacing.xs }} />
                <Text style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: colors.text.primary }}>
                  Weekly Digest
                </Text>
              </View>
              <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                Review trends & progress
              </Text>
            </ScalePressable>
          </View>

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

          {/* Run Stats */}
          <RunStatsCard
            totalDistance={runStats.totalDistance}
            runCount={runStats.runCount}
            avgPace={runStats.avgPace}
            totalCalories={runStats.totalCalories}
            loading={analyticsLoading}
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
              <ScalePressable
                onPress={() => {
                  // TODO: Navigate to AnalyticsScreen when ready
                  console.log('Navigate to Analytics');
                }}
                haptic="light"
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
              </ScalePressable>
            </View>

            {/* 2x2 Grid */}
            <View style={{ gap: tokens.spacing.md }}>
              {/* Row 1 */}
              <View style={{ flexDirection: "row", gap: tokens.spacing.md }}>
                {/* Volume Trend Card (Top-Left) */}
                <View style={{ flex: 1 }}>
                  <ScalePressable
                    onPress={() => navigation.navigate('VolumeDetail')}
                    haptic="light"
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
                        borderColor: colors.border.subtle,
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
                          <Text style={{ fontSize: tokens.typography.fontSize["2xl"], fontWeight: tokens.typography.fontWeight.bold, color: colors.accent.blue, fontVariant: ["tabular-nums"] }}>
                            {Math.round(volumeData.slice(-7).reduce((sum, d) => sum + d.tonnage, 0) / 1000)}k lbs
                          </Text>
                        ) : (
                          <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                            No data
                          </Text>
                        )}
                      </View>
                    </View>
                  </ScalePressable>
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
                  <ScalePressable
                    onPress={() => navigation.navigate('RecoveryDetail')}
                    haptic="light"
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
                        borderColor: colors.border.subtle,
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
                          <Text style={{ fontSize: tokens.typography.fontSize["2xl"], fontWeight: tokens.typography.fontWeight.bold, color: colors.accent.green, fontVariant: ["tabular-nums"] }}>
                            {Math.round(readinessData[readinessData.length - 1].compositeScore)}%
                          </Text>
                        ) : (
                          <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                            No data
                          </Text>
                        )}
                      </View>
                    </View>
                  </ScalePressable>
                </View>

                {/* Fatigue Score Card (Bottom-Right) */}
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Fatigue Score"
                    value={fatigueData?.current_fatigue?.fatigue_score?.toFixed(1) || '--'}
                    subtitle={
                      fatigueData?.current_fatigue?.fatigue_score
                        ? fatigueData.current_fatigue.fatigue_score < 4 ? 'Low'
                          : fatigueData.current_fatigue.fatigue_score < 7 ? 'Moderate'
                            : 'High'
                        : 'No data'
                    }
                    icon={Activity}
                    iconColor={
                      fatigueData?.current_fatigue?.fatigue_score
                        ? fatigueData.current_fatigue.fatigue_score < 4 ? colors.accent.green
                          : fatigueData.current_fatigue.fatigue_score < 7 ? colors.accent.orange
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
          <ScalePressable
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
            haptic="success"
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
          </ScalePressable>


        </View>
      </ScrollView>
      <CurrentSetBar onOpenWorkout={() => navigation.navigate("ProgramLog")} />
    </View>
  );
}
