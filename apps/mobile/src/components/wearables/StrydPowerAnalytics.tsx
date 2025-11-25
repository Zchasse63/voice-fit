/**
 * Stryd Power Analytics Component
 * 
 * Displays running power metrics and mechanics analysis
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Zap, TrendingUp, Activity, AlertCircle } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface PowerMetrics {
  power_avg?: number;
  power_max?: number;
  cadence_avg?: number;
  ground_contact_time?: number;
  vertical_oscillation?: number;
  leg_spring_stiffness?: number;
  efficiency?: number;
}

interface TrainingLoad {
  total_power_load: number;
  avg_power: number;
  max_power: number;
  training_load_trend: string;
  activities_count: number;
}

export function StrydPowerAnalytics() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [trainingLoad, setTrainingLoad] = useState<TrainingLoad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    if (user?.id) {
      loadTrainingLoad();
    }
  }, [user?.id, selectedPeriod]);

  const loadTrainingLoad = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stryd/training-load?days=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load training load");
      const result = await response.json();
      setTrainingLoad(result.data.data);
    } catch (error) {
      console.error("Error loading training load:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          justifyContent: "center",
          alignItems: "center",
          height: 120,
        }}
      >
        <ActivityIndicator size="small" color={colors.accent.blue} />
      </View>
    );
  }

  if (!trainingLoad) {
    return null;
  }

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.lg,
        }}
      >
        <Zap color={colors.accent.blue} size={24} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Power Analytics
        </Text>
      </View>

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.lg,
          gap: tokens.spacing.sm,
        }}
      >
        {[7, 14, 30].map((days) => (
          <Pressable
            key={days}
            onPress={() => setSelectedPeriod(days)}
            style={({ pressed }) => ({
              backgroundColor:
                selectedPeriod === days ? colors.accent.blue : colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              borderWidth: selectedPeriod === days ? 0 : 1,
              borderColor: colors.border.primary,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: selectedPeriod === days ? "white" : colors.text.primary,
              }}
            >
              {days}d
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Main Metrics */}
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginHorizontal: tokens.spacing.lg,
          gap: tokens.spacing.md,
        }}
      >
        {/* Average Power */}
        <MetricCard
          label="Average Power"
          value={`${Math.round(trainingLoad.avg_power)} W`}
          icon="⚡"
          colors={colors}
        />

        {/* Max Power */}
        <MetricCard
          label="Max Power"
          value={`${Math.round(trainingLoad.max_power)} W`}
          icon="🔥"
          colors={colors}
        />

        {/* Total Power Load */}
        <MetricCard
          label="Total Power Load"
          value={`${Math.round(trainingLoad.total_power_load)} kJ`}
          icon="📊"
          colors={colors}
        />

        {/* Training Load Trend */}
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm }}>
            <TrendingUp
              color={
                trainingLoad.training_load_trend === "Increasing"
                  ? colors.accent.orange
                  : colors.accent.green
              }
              size={16}
            />
            <View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.text.secondary,
                  marginBottom: 2,
                }}
              >
                Training Load Trend
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.text.primary,
                }}
              >
                {trainingLoad.training_load_trend}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: colors.text.secondary,
            }}
          >
            {trainingLoad.activities_count} runs
          </Text>
        </View>
      </View>

      {/* Insights */}
      <View
        style={{
          backgroundColor: colors.accent.blue + "10",
          borderLeftWidth: 4,
          borderLeftColor: colors.accent.blue,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginHorizontal: tokens.spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
          <AlertCircle color={colors.accent.blue} size={16} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.accent.blue,
            }}
          >
            Power Insights
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            color: colors.text.secondary,
            lineHeight: 16,
          }}
        >
          {trainingLoad.training_load_trend === "Increasing"
            ? "Your training load is increasing. Monitor recovery and ensure adequate rest days."
            : "Your training load is stable. Consider increasing intensity for continued progress."}
        </Text>
      </View>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  colors: any;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: tokens.borderRadius.md,
        padding: tokens.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <View>
          <Text
            style={{
              fontSize: 11,
              color: colors.text.secondary,
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text.primary,
            }}
          >
            {value}
          </Text>
        </View>
      </View>
      <Activity color={colors.text.secondary} size={16} />
    </View>
  );
}

