import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, RotateCcw, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { useProgramStore } from "../store/program.store";

export default function TrainingCalendarScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const {
    loadActiveProgram,
    loadScheduledWorkouts,
    loadTemplates,
    scheduledWorkouts,
    activeProgram,
    workoutTemplates
  } = useProgramStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await loadActiveProgram();

        // Load templates if we have an active program
        const currentProgram = useProgramStore.getState().activeProgram;
        if (currentProgram) {
          await loadTemplates(currentProgram.id);
        }

        const start = startOfWeek(selectedDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        await loadScheduledWorkouts(start, end);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [selectedDate]);

  const getWorkoutName = (workout: any) => {
    if (!workout.templateId) return "Workout";
    const template = workoutTemplates.find((t: any) => t.id === workout.templateId);
    return template?.name || "Workout";
  };

  const days = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(start);
      date.setDate(start.getDate() + idx);
      const label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const workouts = scheduledWorkouts.filter((w) => {
        const d = w.scheduledDateObject;
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
        );
      });
      return {
        id: date.toISOString(),
        day: label,
        workouts,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  }, [selectedDate, scheduledWorkouts, workoutTemplates]);

  const title = activeProgram?.name ?? "Training Calendar";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ padding: tokens.spacing.sm, marginRight: tokens.spacing.sm, marginLeft: -tokens.spacing.sm }}
            >
              <ArrowLeft color={colors.text.primary} size={24} />
            </Pressable>
            <CalendarDays color={colors.accent.blue} size={20} style={{ marginRight: tokens.spacing.sm }} />
            <View>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
              >
                Week of {startOfWeek(selectedDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => ({
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.full,
              backgroundColor: colors.background.secondary,
              opacity: pressed ? 0.85 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.spacing.xs,
            })}
            onPress={() => setSelectedDate(new Date())}
          >
            <RotateCcw color={colors.text.secondary} size={18} />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              Reset
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: tokens.spacing.sm, gap: 8 }}>
          <Pressable
            onPress={() => setSelectedDate((d) => shiftWeek(d, -1))}
            style={{ padding: tokens.spacing.sm }}
          >
            <ChevronLeft color={colors.text.secondary} size={20} />
          </Pressable>
          <Text style={{ color: colors.text.primary, fontSize: tokens.typography.fontSize.base }}>
            {weekRangeLabel(selectedDate)}
          </Text>
          <Pressable
            onPress={() => setSelectedDate((d) => shiftWeek(d, 1))}
            style={{ padding: tokens.spacing.sm }}
          >
            <ChevronRight color={colors.text.secondary} size={20} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent.blue} />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}
          renderItem={({ item }) => (
            <View
              style={{
                padding: tokens.spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border.light,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: item.isToday ? colors.accent.blue : colors.text.tertiary,
                    marginBottom: 2,
                  }}
                >
                  {item.day}
                </Text>
                {item.workouts.length === 0 ? (
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    Rest / Unscheduled
                  </Text>
                ) : (
                  item.workouts.map((w) => (
                    <Text
                      key={w.id}
                      style={{
                        fontSize: tokens.typography.fontSize.base,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: colors.text.primary,
                      }}
                    >
                      {getWorkoutName(w)}
                    </Text>
                  ))
                )}
              </View>
              <Pressable
                style={({ pressed }) => ({
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  borderRadius: tokens.borderRadius.full,
                  backgroundColor: colors.background.primary,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  opacity: pressed ? 0.85 : 1,
                })}
                onPress={() => {
                  // TODO: open workout edit/reschedule
                  console.log("Open workout edit for", item.day);
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  Edit
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function shiftWeek(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta * 7);
  return d;
}

function weekRangeLabel(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
