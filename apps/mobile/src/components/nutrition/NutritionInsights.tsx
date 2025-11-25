/**
 * Nutrition Insights
 * 
 * Displays AI-powered insights connecting nutrition to performance
 */

import React from "react";
import { View, Text } from "react-native";
import { AlertCircle, TrendingUp, Zap } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";

interface NutritionInsight {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  icon: any;
}

interface NutritionInsightsProps {
  nutrition?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  scheduledWorkout?: {
    type: string;
    duration_minutes: number;
  };
}

export function NutritionInsights({
  nutrition,
  scheduledWorkout,
}: NutritionInsightsProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  if (!nutrition) {
    return null;
  }

  const insights: NutritionInsight[] = [];

  // Low carbs + scheduled long run
  if (
    nutrition.carbs_g < 150 &&
    scheduledWorkout?.type === "run" &&
    scheduledWorkout?.duration_minutes > 45
  ) {
    insights.push({
      type: "warning",
      title: "Low Carbs for Long Run",
      description:
        "Consider increasing carb intake before your scheduled run to maintain energy levels.",
      icon: AlertCircle,
    });
  }

  // High protein intake
  if (nutrition.protein_g > 150) {
    insights.push({
      type: "success",
      title: "Excellent Protein Intake",
      description:
        "Your protein intake supports muscle recovery and adaptation from training.",
      icon: TrendingUp,
    });
  }

  // Calorie deficit + hard training
  if (nutrition.calories < 1800 && scheduledWorkout?.type === "strength") {
    insights.push({
      type: "warning",
      title: "Potential Under-Recovery",
      description:
        "Low calorie intake combined with strength training may impact recovery. Consider eating more.",
      icon: AlertCircle,
    });
  }

  // Balanced macros
  const totalCalories = nutrition.protein_g * 4 + nutrition.carbs_g * 4 + nutrition.fat_g * 9;
  if (totalCalories > 0) {
    const proteinPercent = (nutrition.protein_g * 4) / totalCalories;
    const carbPercent = (nutrition.carbs_g * 4) / totalCalories;
    const fatPercent = (nutrition.fat_g * 9) / totalCalories;

    if (
      proteinPercent > 0.25 &&
      carbPercent > 0.4 &&
      fatPercent > 0.2 &&
      fatPercent < 0.35
    ) {
      insights.push({
        type: "success",
        title: "Balanced Macros",
        description:
          "Your macro distribution supports both performance and recovery.",
        icon: Zap,
      });
    }
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: tokens.spacing.md }}>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: tokens.spacing.md,
        }}
      >
        Nutrition Insights
      </Text>

      {insights.map((insight, idx) => {
        const bgColor =
          insight.type === "warning"
            ? colors.state.warning
            : insight.type === "success"
              ? colors.state.success
              : colors.state.info;

        const textColor =
          insight.type === "warning"
            ? colors.accent.orange
            : insight.type === "success"
              ? colors.accent.green
              : colors.accent.blue;

        return (
          <View
            key={idx}
            style={{
              backgroundColor: bgColor,
              borderRadius: tokens.borderRadius.md,
              padding: tokens.spacing.md,
              marginBottom: tokens.spacing.sm,
              flexDirection: "row",
              gap: tokens.spacing.md,
            }}
          >
            <insight.icon size={20} color={textColor} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: textColor,
                  marginBottom: tokens.spacing.xs,
                }}
              >
                {insight.title}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                {insight.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

