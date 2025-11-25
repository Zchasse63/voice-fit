/**
 * Nutrition Screen
 * 
 * Displays daily nutrition summary and 7-day trends
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { NutritionSummaryCard } from "../components/nutrition/NutritionSummaryCard";
import { NutritionTrendsChart } from "../components/nutrition/NutritionTrendsChart";
import { ManualNutritionEntry } from "../components/nutrition/ManualNutritionEntry";

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

export function NutritionScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [todayNutrition, setTodayNutrition] = useState<NutritionData | null>(null);
  const [sevenDayNutrition, setSevenDayNutrition] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNutritionData();
    }
  }, [user?.id]);

  const loadNutritionData = async () => {
    try {
      setIsLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Fetch today's nutrition
      const { data: todayData } = await supabase
        .from("daily_nutrition_summary")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (todayData) {
        setTodayNutrition({
          calories: todayData.calories || 0,
          protein_g: todayData.protein_g || 0,
          carbs_g: todayData.carbs_g || 0,
          fat_g: todayData.fat_g || 0,
          fiber_g: todayData.fiber_g || 0,
          sugar_g: todayData.sugar_g || 0,
          sodium_mg: todayData.sodium_mg || 0,
          water_ml: todayData.water_ml || 0,
        });
      }

      // Fetch 7-day nutrition
      const { data: sevenDayData } = await supabase
        .from("daily_nutrition_summary")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", sevenDaysAgo)
        .lte("date", today)
        .order("date", { ascending: false });

      if (sevenDayData) {
        setSevenDayNutrition(
          sevenDayData.map((d) => ({
            date: d.date,
            calories: d.calories || 0,
            protein_g: d.protein_g || 0,
            carbs_g: d.carbs_g || 0,
            fat_g: d.fat_g || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading nutrition data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Nutrition
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              marginTop: tokens.spacing.xs,
            }}
          >
            Daily intake from Apple Health
          </Text>
        </View>
        <Pressable
          onPress={() => setShowManualEntry(true)}
          style={({ pressed }) => ({
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.lg,
            backgroundColor: colors.accent.blue,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Plus color="white" size={24} />
        </Pressable>
      </View>

      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.accent.blue} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: tokens.spacing.lg,
            paddingBottom: tokens.spacing.xl,
          }}
        >
          {/* Today's Nutrition */}
          <NutritionSummaryCard nutrition={todayNutrition || undefined} />

          {/* 7-Day Trends */}
          {sevenDayNutrition.length > 0 && (
            <NutritionTrendsChart data={sevenDayNutrition} />
          )}

          {/* Sync Status */}
          <View
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Nutrition data syncs automatically from Apple Health every 30 minutes.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Manual Nutrition Entry Modal */}
      <ManualNutritionEntry
        visible={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSuccess={loadNutritionData}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}

