import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { database } from "../services/database/watermelon/database";
import Run from "../services/database/watermelon/models/Run";
import { Q } from "@nozbe/watermelondb";
import { useAuthStore } from "../store/auth.store";
import { supabase } from "../services/database/supabase";
import { ChevronDown } from "lucide-react-native";

export default function RunSummaryScreen({ route, navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const user = useAuthStore((s) => s.user);
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [shoes, setShoes] = useState<any[]>([]);
  const [selectedShoe, setSelectedShoe] = useState<string | null>(null);
  const [showShoeModal, setShowShoeModal] = useState(false);

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

        // Load shoes
        const { data: shoesData } = await supabase
          .from("running_shoes")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        setShoes(shoesData || []);
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

          {/* Shoe Selector */}
          <View>
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 4 }}>
              Running Shoe
            </Text>
            <Pressable
              onPress={() => setShowShoeModal(true)}
              style={({ pressed }) => ({
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border.light,
                backgroundColor: colors.background.secondary,
                opacity: pressed ? 0.9 : 1,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <Text style={{ color: colors.text.primary }}>
                {selectedShoe
                  ? shoes.find((s) => s.id === selectedShoe)
                    ? `${shoes.find((s) => s.id === selectedShoe).brand} ${shoes.find((s) => s.id === selectedShoe).model}`
                    : "Select a shoe"
                  : "Select a shoe"}
              </Text>
              <ChevronDown color={colors.text.secondary} size={20} />
            </Pressable>
          </View>

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

      {/* Shoe Selection Modal */}
      <Modal visible={showShoeModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderTopLeftRadius: tokens.borderRadius.xl,
              borderTopRightRadius: tokens.borderRadius.xl,
              maxHeight: "80%",
            }}
          >
            <View style={{ padding: tokens.spacing.lg }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: tokens.spacing.md,
                }}
              >
                Select Shoe
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: tokens.spacing.lg,
                paddingBottom: tokens.spacing.lg,
                gap: tokens.spacing.sm,
              }}
            >
              {shoes.map((shoe) => (
                <Pressable
                  key={shoe.id}
                  onPress={async () => {
                    setSelectedShoe(shoe.id);
                    // Update run with shoe_id in Supabase
                    if (run?.id) {
                      await supabase
                        .from("runs")
                        .update({ shoe_id: shoe.id })
                        .eq("id", run.id);
                    }
                    setShowShoeModal(false);
                  }}
                  style={({ pressed }) => ({
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor:
                      selectedShoe === shoe.id
                        ? colors.accent.blue
                        : colors.background.secondary,
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                  })}
                >
                  <Text
                    style={{
                      color:
                        selectedShoe === shoe.id
                          ? "white"
                          : colors.text.primary,
                      fontWeight: "600",
                    }}
                  >
                    {shoe.brand} {shoe.model}
                  </Text>
                  <Text
                    style={{
                      color:
                        selectedShoe === shoe.id
                          ? "rgba(255, 255, 255, 0.7)"
                          : colors.text.secondary,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {shoe.total_mileage} / {shoe.replacement_threshold} mi
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
