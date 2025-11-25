import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { database } from "../services/database/watermelon/database";
import WorkoutLog from "../services/database/watermelon/models/WorkoutLog";
import Set from "../services/database/watermelon/models/Set";
import Run from "../services/database/watermelon/models/Run";
import { useAuthStore } from "../store/auth.store";
import { Q } from "@nozbe/watermelondb";

type JournalEntry = {
  id: string;
  title: string;
  type: "run" | "strength";
  summary: string;
  subtitle: string;
  timestamp: Date;
};

export default function JournalScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [workouts, runs] = await Promise.all([
          database.get<WorkoutLog>("workout_logs").query(Q.where("user_id", user.id), Q.sortBy("start_time", Q.desc), Q.take(20)).fetch(),
          database.get<Run>("runs").query(Q.where("user_id", user.id), Q.sortBy("start_time", Q.desc), Q.take(20)).fetch(),
        ]);

        const workoutEntries: JournalEntry[] = [];
        for (const w of workouts) {
          const sets = await database.get<Set>("sets").query(Q.where("workout_log_id", w.id)).fetch();
          const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          workoutEntries.push({
            id: w.id,
            title: w.workoutName || "Workout",
            type: "strength",
            summary: `Sets: ${sets.length} • Vol: ${Math.round(volume)} lbs`,
            subtitle: w.startTime.toLocaleString(),
            timestamp: w.startTime,
          });
        }

        const runEntries: JournalEntry[] = runs.map((r) => ({
          id: r.id,
          title: "Run",
          type: "run",
          summary: `${metersToMiles(r.distance)} mi • ${secondsToPace(r.pace)} /mi • ${secondsToHMS(r.duration)}`,
          subtitle: r.startTime.toLocaleString(),
          timestamp: r.startTime,
        }));

        const combined = [...workoutEntries, ...runEntries].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        setEntries(combined);
      } catch (e) {
        console.error("Failed to load journal", e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View
        style={{
          padding: tokens.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Journal
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Completed workouts and runs
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent.blue} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                // Navigate to detail (run or workout)
                if (item.type === "run") {
                  navigation?.navigate?.("Splits", { runId: item.id });
                } else {
                  navigation?.navigate?.("ProgramLog", { entryId: item.id });
                }
              }}
              style={({ pressed }) => ({
                padding: tokens.spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border.light,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                {item.summary}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                  marginTop: 4,
                }}
              >
                {item.subtitle}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function metersToMiles(m: number) {
  return (m * 0.000621371).toFixed(2);
}

function secondsToPace(pace: number) {
  if (!isFinite(pace) || pace <= 0) return "--:--";
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function secondsToHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
