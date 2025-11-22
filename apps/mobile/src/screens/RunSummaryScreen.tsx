import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { database } from "../services/database/watermelon/database";
import Run from "../services/database/watermelon/models/Run";
import { Q } from "@nozbe/watermelondb";
import { useAuthStore } from "../store/auth.store";

export default function RunSummaryScreen({ route, navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const user = useAuthStore((s) => s.user);
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const runId = route?.params?.runId;
        let found: Run | null = null;
        if (runId) {
          found = await database.get<Run>("runs").find(runId);
        } else {
          const latest = await database
            .get<Run>("runs")
            .query(Q.where("user_id", user.id), Q.sortBy("start_time", Q.desc), Q.take(1))
            .fetch();
          found = latest[0] || null;
        }
        setRun(found);
      } catch (e) {
        console.error("Failed to load run summary", e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [route?.params?.runId, user?.id]);

  const distanceMiles = run ? metersToMiles(run.distance) : "--";
  const pace = run ? secondsToPace(run.pace) : "--:--";
  const duration = run ? secondsToHMS(run.duration) : "--:--";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Run Summary
        </Text>
        <Text style={{ color: colors.text.secondary, marginTop: 4 }}>
          {run?.startTime?.toLocaleString() || "Latest run"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent.blue} />
        </View>
      ) : !run ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.text.secondary }}>No run found.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.md }}>
          <StatCard label="Distance" value={`${distanceMiles} mi`} />
          <StatCard label="Duration" value={duration} />
          <StatCard label="Pace" value={`${pace} /mi`} />
          <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
            <Pressable
              onPress={() => navigation?.navigate?.("Splits", { runId: run.id })}
              style={({ pressed }) => ({
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border.light,
                backgroundColor: colors.background.secondary,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: colors.text.primary, fontWeight: tokens.typography.fontWeight.semibold }}>
                View splits
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation?.navigate?.("Chat", { intent: "weekly-digest" })}
              style={({ pressed }) => ({
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.accent.blue,
                opacity: pressed ? 0.85 : 1,
                alignItems: "center",
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: tokens.typography.fontWeight.bold }}>
                Send to Coach
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
      }}
    >
      <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>{label}</Text>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
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
