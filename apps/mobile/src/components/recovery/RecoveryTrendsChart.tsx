/**
 * Recovery Trends Chart
 * 
 * Displays 7-day recovery, HRV, and strain trends
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";

interface TrendDataPoint {
  date: string;
  recovery_score: number;
  hrv_avg: number;
  strain_score: number;
}

interface RecoveryTrendsChartProps {
  data: TrendDataPoint[];
}

export function RecoveryTrendsChart({ data }: RecoveryTrendsChartProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.status.success;
    if (score >= 60) return colors.accent.yellow;
    return colors.status.error;
  };

  const getBarHeight = (value: number, max: number) => {
    return (value / max) * 100;
  };

  const maxRecovery = Math.max(...data.map((d) => d.recovery_score), 100);
  const maxHRV = Math.max(...data.map((d) => d.hrv_avg), 50);
  const maxStrain = Math.max(...data.map((d) => d.strain_score), 100);

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: colors.border.light,
        marginBottom: tokens.spacing.md,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: tokens.spacing.md,
        }}
      >
        7-Day Trends
      </Text>

      {/* Recovery Score Chart */}
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          Recovery Score
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 100, gap: tokens.spacing.xs }}>
          {data.map((point, idx) => (
            <View key={idx} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  height: getBarHeight(point.recovery_score, maxRecovery),
                  backgroundColor: getScoreColor(point.recovery_score),
                  borderRadius: tokens.borderRadius.sm,
                  marginBottom: tokens.spacing.xs,
                }}
              />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {new Date(point.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* HRV Chart */}
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          HRV (Heart Rate Variability)
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: tokens.spacing.xs }}>
          {data.map((point, idx) => (
            <View key={idx} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  height: getBarHeight(point.hrv_avg, maxHRV),
                  backgroundColor: colors.accent.blue,
                  borderRadius: tokens.borderRadius.sm,
                  marginBottom: tokens.spacing.xs,
                }}
              />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {new Date(point.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Strain Score Chart */}
      <View>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          Strain Score
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: tokens.spacing.xs }}>
          {data.map((point, idx) => (
            <View key={idx} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  height: getBarHeight(point.strain_score, maxStrain),
                  backgroundColor: colors.accent.orange,
                  borderRadius: tokens.borderRadius.sm,
                  marginBottom: tokens.spacing.xs,
                }}
              />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {new Date(point.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

