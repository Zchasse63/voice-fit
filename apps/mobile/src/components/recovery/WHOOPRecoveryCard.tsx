/**
 * WHOOP Recovery Card
 * 
 * Displays WHOOP recovery score with HRV, resting HR, and strain data
 */

import React from "react";
import { View, Text } from "react-native";
import { TrendingUp, Heart, Zap } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";

interface WHOOPRecoveryData {
  recovery_score: number;
  hrv_avg: number;
  resting_hr: number;
  strain_score: number;
  sleep_quality: number;
  date: string;
}

interface WHOOPRecoveryCardProps {
  data: WHOOPRecoveryData;
  previousData?: WHOOPRecoveryData;
}

export function WHOOPRecoveryCard({
  data,
  previousData,
}: WHOOPRecoveryCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const getRecoveryColor = (score: number) => {
    if (score >= 80) return colors.status.success;
    if (score >= 60) return colors.accent.yellow;
    return colors.status.error;
  };

  const getRecoveryLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Low";
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    return current > previous ? "↑" : current < previous ? "↓" : "→";
  };

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: tokens.spacing.md,
        }}
      >
        <Zap
          size={20}
          color={getRecoveryColor(data.recovery_score)}
          style={{ marginRight: tokens.spacing.sm }}
        />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Recovery Status
        </Text>
      </View>

      {/* Main Recovery Score */}
      <View
        style={{
          backgroundColor: getRecoveryColor(data.recovery_score) + "15",
          borderRadius: tokens.borderRadius.md,
          padding: tokens.spacing.md,
          marginBottom: tokens.spacing.md,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.xs,
          }}
        >
          Recovery Score
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: getRecoveryColor(data.recovery_score),
            }}
          >
            {data.recovery_score}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              marginLeft: tokens.spacing.xs,
            }}
          >
            / 100
          </Text>
        </View>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: getRecoveryColor(data.recovery_score),
            marginTop: tokens.spacing.xs,
            fontWeight: tokens.typography.fontWeight.semibold,
          }}
        >
          {getRecoveryLabel(data.recovery_score)}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={{ gap: tokens.spacing.sm }}>
        {/* HRV */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: tokens.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Heart size={16} color={colors.accent.blue} style={{ marginRight: tokens.spacing.xs }} />
            <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
              HRV
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: tokens.typography.fontWeight.semibold,
                fontSize: tokens.typography.fontSize.sm,
              }}
            >
              {data.hrv_avg.toFixed(0)} ms
            </Text>
            {previousData && (
              <Text
                style={{
                  color: colors.text.tertiary,
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xs,
                }}
              >
                {getTrendIcon(data.hrv_avg, previousData.hrv_avg)}
              </Text>
            )}
          </View>
        </View>

        {/* Resting HR */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: tokens.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Heart size={16} color={colors.accent.red} style={{ marginRight: tokens.spacing.xs }} />
            <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
              Resting HR
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: tokens.typography.fontWeight.semibold,
                fontSize: tokens.typography.fontSize.sm,
              }}
            >
              {data.resting_hr} bpm
            </Text>
            {previousData && (
              <Text
                style={{
                  color: colors.text.tertiary,
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xs,
                }}
              >
                {getTrendIcon(data.resting_hr, previousData.resting_hr)}
              </Text>
            )}
          </View>
        </View>

        {/* Strain Score */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: tokens.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TrendingUp size={16} color={colors.accent.orange} style={{ marginRight: tokens.spacing.xs }} />
            <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
              Strain Score
            </Text>
          </View>
          <Text
            style={{
              color: colors.text.primary,
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.sm,
            }}
          >
            {data.strain_score.toFixed(1)}
          </Text>
        </View>

        {/* Sleep Quality */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: tokens.spacing.sm,
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
            Sleep Quality
          </Text>
          <Text
            style={{
              color: colors.text.primary,
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.sm,
            }}
          >
            {data.sleep_quality}%
          </Text>
        </View>
      </View>
    </View>
  );
}

