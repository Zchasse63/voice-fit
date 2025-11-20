import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView } from "react-native";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { useProgramStore } from "../store/program.store";
import { database } from "../services/database/watermelon/database";
import WorkoutLog from "../services/database/watermelon/models/WorkoutLog";
import Set from "../services/database/watermelon/models/Set";
import ScheduledWorkout from "../services/database/watermelon/models/ScheduledWorkout";
import { Q } from "@nozbe/watermelondb";
import LogOverlay from "../components/LogOverlay";
import VolumeChart from "../components/charts/VolumeChart";

type ProgramLogScreenProps = { navigation: any; route: any };

type WorkoutSummary = { id: string; name: string; date: Date; sets: number; volume: number };

type DayPlan = { date: Date; label: string; isToday: boolean; workouts: ScheduledWorkout[] };

export default function ProgramLogScreen({ navigation, route }: ProgramLogScreenProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { activeProgram, scheduledWorkouts, loadActiveProgram, loadScheduledWorkouts } =
    useProgramStore();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const initialDate = route?.params?.date ? new Date(route.params.date) : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const shiftWeek = (weeks: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + weeks * 7);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await loadActiveProgram();

        const start = new Date(selectedDate);
        const day = start.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        await loadScheduledWorkouts(start, end);
        await loadHistory();
      } catch (error) {
        console.error("Failed to load program/log data", error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [selectedDate]);

  const loadHistory = async () => {
    const workoutLogs = await database
      .get<WorkoutLog>("workout_logs")
      .query(Q.sortBy("start_time", Q.desc), Q.take(20))
      .fetch();

    const summaries: WorkoutSummary[] = await Promise.all(
      workoutLogs.map(async (workout) => {
        const sets = await database
          .get<Set>("sets")
          .query(Q.where("workout_log_id", workout.id))
          .fetch();
        const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        return {
          id: workout.id,
          name: workout.workoutName || "Workout",
          date: workout.startTime,
          sets: sets.length,
          volume: Math.round(volume),
        };
      }),
    );

    setRecentWorkouts(summaries);
  };

  const weekDays: DayPlan[] = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const days: DayPlan[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();
      const workouts = scheduledWorkouts.filter((w) => {
        const wDate = w.scheduledDateObject;
        return (
          wDate.getFullYear() === date.getFullYear() &&
          wDate.getMonth() === date.getMonth() &&
          wDate.getDate() === date.getDate()
        );
      });
      days.push({
        date,
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isToday,
        workouts,
      });
    }
    return days;
  }, [selectedDate, scheduledWorkouts]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent.blue} />
      </View>
    );
  }

  const headerTitle = activeProgram?.name ?? "Program & Log";
  const subtitle = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.lg,
          paddingTop: tokens.spacing.md,
          paddingBottom: tokens.spacing.xl,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: tokens.spacing.lg,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ padding: tokens.spacing.sm, marginRight: tokens.spacing.sm }}
          >
            <ArrowLeft color={colors.accent.blue} size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {headerTitle}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {subtitle}
            </Text>
          </View>
          <Calendar color={colors.accent.blue} size={22} />
        </View>

        <View
          style={{
            marginBottom: tokens.spacing.lg,
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.lg,
            backgroundColor: colors.background.secondary,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: tokens.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.secondary,
              }}
            >
              This Week
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() => shiftWeek(-1)}
                style={{ padding: tokens.spacing.xs, marginRight: tokens.spacing.xs }}
              >
                <ChevronLeft color={colors.text.secondary} size={18} />
              </Pressable>
              <Pressable
                onPress={() => shiftWeek(1)}
                style={{ padding: tokens.spacing.xs, marginLeft: tokens.spacing.xs }}
              >
                <ChevronRight color={colors.text.secondary} size={18} />
              </Pressable>
            </View>
          </View>

          {!activeProgram && (
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              No active program yet. Once you start a plan, your weekly schedule will appear here.
            </Text>
          )}

          {weekDays.map((day) => (
            <View
              key={day.date.toISOString()}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}
            >
              <View style={{ width: 96 }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: day.isToday
                      ? tokens.typography.fontWeight.semibold
                      : tokens.typography.fontWeight.regular,
                    color: day.isToday ? colors.accent.blue : colors.text.secondary,
                  }}
                >
                  {day.label}
                </Text>
              </View>
              {day.workouts.length === 0 ? (
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  Rest day
                </Text>
              ) : (
                <View style={{ flex: 1 }}>
                  {day.workouts.map((w) => (
                    <View
                      key={w.id}
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginRight: 8,
                          backgroundColor: w.statusColor,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: tokens.typography.fontSize.sm,
                          color: colors.text.primary,
                        }}
                      >
                        {w.statusDisplay}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.secondary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Recent Workouts
          </Text>
          {recentWorkouts.length === 0 ? (
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.tertiary,
              }}
            >
              No workouts logged yet. Start a workout from Home or Coach.
            </Text>
          ) : (
            recentWorkouts.map((workout) => (
              <Pressable
                key={workout.id}
                onPress={() => setSelectedWorkoutId(workout.id)}
                style={({ pressed }) => [
                  {
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.light,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {workout.name}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {workout.date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {workout.sets} sets
                  {" · "}
                  {workout.volume.toLocaleString()} lbs
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {recentWorkouts.length > 0 && (
          <View style={{ marginTop: tokens.spacing.lg }}>
            <VolumeChart
              data={recentWorkouts
                .slice()
                .reverse()
                .map((w) => ({
                  date: w.date.toISOString(),
                  volume: w.volume,
                }))}
              title="Recent Volume Trend"
            />
          </View>
        )}
      </ScrollView>

      <LogOverlay
        visible={!!selectedWorkoutId}
        workoutLogId={selectedWorkoutId ?? undefined}
        onClose={() => setSelectedWorkoutId(null)}
      />
    </SafeAreaView>
  );
}

