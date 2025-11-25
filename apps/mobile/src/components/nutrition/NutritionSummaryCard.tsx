/**
 * Nutrition Summary Card
 * 
 * Displays daily nutrition totals: calories, macros, and hydration
 */

import React from "react";
import { View, Text } from "react-native";
import { Apple } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";

interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  water_ml: number;
}

interface NutritionSummaryCardProps {
  nutrition?: NutritionData;
  isLoading?: boolean;
}

export function NutritionSummaryCard({
  nutrition,
  isLoading = false,
}: NutritionSummaryCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  if (isLoading) {
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
        <Text style={{ color: colors.text.secondary }}>Loading nutrition data...</Text>
      </View>
    );
  }

  if (!nutrition) {
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
        <Text style={{ color: colors.text.secondary }}>No nutrition data available</Text>
      </View>
    );
  }

  const macroPercentages = {
    protein: Math.round((nutrition.protein_g * 4) / nutrition.calories * 100) || 0,
    carbs: Math.round((nutrition.carbs_g * 4) / nutrition.calories * 100) || 0,
    fat: Math.round((nutrition.fat_g * 9) / nutrition.calories * 100) || 0,
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
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: tokens.spacing.md }}>
        <Apple size={24} color={colors.accent.green} style={{ marginRight: tokens.spacing.sm }} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Daily Nutrition
        </Text>
      </View>

      {/* Calories */}
      <View style={{ marginBottom: tokens.spacing.md }}>
        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
          Calories
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {Math.round(nutrition.calories)} kcal
        </Text>
      </View>

      {/* Macros */}
      <View style={{ marginBottom: tokens.spacing.md }}>
        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary, marginBottom: tokens.spacing.sm }}>
          Macronutrients
        </Text>
        <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
              Protein
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.blue,
              }}
            >
              {Math.round(nutrition.protein_g)}g ({macroPercentages.protein}%)
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
              Carbs
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.yellow,
              }}
            >
              {Math.round(nutrition.carbs_g)}g ({macroPercentages.carbs}%)
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
              Fat
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.orange,
              }}
            >
              {Math.round(nutrition.fat_g)}g ({macroPercentages.fat}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Hydration */}
      <View>
        <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
          Hydration
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.accent.blue,
          }}
        >
          {Math.round(nutrition.water_ml / 1000 * 10) / 10}L
        </Text>
      </View>
    </View>
  );
}

