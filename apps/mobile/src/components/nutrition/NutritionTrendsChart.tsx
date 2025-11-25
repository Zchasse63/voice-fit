/**
 * Nutrition Trends Chart
 * 
 * Displays 7-day nutrition trends for calories and macros
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";

interface DailyNutrition {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface NutritionTrendsChartProps {
  data: DailyNutrition[];
  isLoading?: boolean;
}

export function NutritionTrendsChart({
  data,
  isLoading = false,
}: NutritionTrendsChartProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginBottom: tokens.spacing.md,
        }}
      >
        <Text style={{ color: colors.text.secondary }}>Loading trends...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate max calorie for scaling
  const maxCalories = Math.max(...data.map(d => d.calories), 2500);
  const barHeight = 100;

  // Get day of week labels
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
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
        7-Day Nutrition Trends
      </Text>

      {/* Calorie Chart */}
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          Daily Calories
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: tokens.spacing.sm, paddingRight: tokens.spacing.md }}>
            {data.map((day, idx) => {
              const barHeightPercent = (day.calories / maxCalories) * barHeight;
              return (
                <View key={idx} style={{ alignItems: "center", gap: tokens.spacing.xs }}>
                  <View
                    style={{
                      width: 30,
                      height: barHeightPercent,
                      backgroundColor: colors.accent.blue,
                      borderRadius: tokens.borderRadius.sm,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}
                  >
                    {Math.round(day.calories)}
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    {getDayLabel(day.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Macro Breakdown */}
      <View>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          Average Macros (7 days)
        </Text>
        <View style={{ flexDirection: "row", gap: tokens.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Protein
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.blue,
              }}
            >
              {Math.round(data.reduce((sum, d) => sum + d.protein_g, 0) / data.length)}g
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Carbs
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.yellow,
              }}
            >
              {Math.round(data.reduce((sum, d) => sum + d.carbs_g, 0) / data.length)}g
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Fat
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.orange,
              }}
            >
              {Math.round(data.reduce((sum, d) => sum + d.fat_g, 0) / data.length)}g
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

