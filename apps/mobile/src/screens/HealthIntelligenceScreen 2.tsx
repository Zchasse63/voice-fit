/**
 * Health Intelligence Screen
 * 
 * Displays AI-discovered correlations between nutrition, performance, recovery, and injuries
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

interface Correlation {
  correlation: number;
  sample_size: number;
  insight: string;
}

interface CorrelationData {
  nutrition_recovery: Correlation;
  nutrition_performance: Correlation;
  sleep_recovery: Correlation;
  training_recovery: Correlation;
  protein_recovery: Correlation;
  carbs_performance: Correlation;
}

export function HealthIntelligenceScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [correlations, setCorrelations] = useState<CorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user?.id) {
      loadCorrelations();
    }
  }, [user?.id, days]);

  const loadCorrelations = async () => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke("get-correlations", {
        body: { user_id: user?.id, days },
      });

      if (response.error) throw response.error;

      setCorrelations(response.data?.correlations);
    } catch (error) {
      console.error("Error loading correlations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs < 0.3) return colors.text.secondary;
    if (abs < 0.7) return colors.accent.orange;
    return colors.accent.green;
  };

  const getCorrelationIcon = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs < 0.3) return AlertCircle;
    return CheckCircle;
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
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Health Intelligence
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: tokens.spacing.xs,
          }}
        >
          AI-discovered correlations in your health data
        </Text>
      </View>

      {/* Time Period Selector */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          gap: tokens.spacing.sm,
        }}
      >
        {[7, 14, 30, 60].map((d) => (
          <Pressable
            key={d}
            onPress={() => setDays(d)}
            style={({ pressed }) => ({
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.lg,
              backgroundColor:
                days === d ? colors.accent.blue : colors.background.secondary,
              opacity: pressed ? 0.8 : 1,
              borderWidth: 1,
              borderColor: colors.border.light,
            })}
          >
            <Text
              style={{
                color: days === d ? "white" : colors.text.primary,
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {d}d
            </Text>
          </Pressable>
        ))}
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
      ) : correlations ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: tokens.spacing.lg,
            paddingBottom: tokens.spacing.xl,
            gap: tokens.spacing.md,
          }}
        >
          {/* Nutrition & Recovery */}
          <CorrelationCard
            title="Nutrition & Recovery"
            correlation={correlations.nutrition_recovery}
            colors={colors}
          />

          {/* Nutrition & Performance */}
          <CorrelationCard
            title="Nutrition & Performance"
            correlation={correlations.nutrition_performance}
            colors={colors}
          />

          {/* Sleep & Recovery */}
          <CorrelationCard
            title="Sleep & Recovery"
            correlation={correlations.sleep_recovery}
            colors={colors}
          />

          {/* Training & Recovery */}
          <CorrelationCard
            title="Training Volume & Recovery"
            correlation={correlations.training_recovery}
            colors={colors}
          />

          {/* Protein & Recovery */}
          <CorrelationCard
            title="Protein Intake & Recovery"
            correlation={correlations.protein_recovery}
            colors={colors}
          />

          {/* Carbs & Performance */}
          <CorrelationCard
            title="Carb Intake & Performance"
            correlation={correlations.carbs_performance}
            colors={colors}
          />
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: tokens.spacing.lg,
          }}
        >
          <Text style={{ color: colors.text.secondary, textAlign: "center" }}>
            Not enough data to analyze. Keep logging your workouts, nutrition, and recovery data.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function CorrelationCard({
  title,
  correlation,
  colors,
}: {
  title: string;
  correlation: Correlation;
  colors: any;
}) {
  const abs = Math.abs(correlation.correlation);
  const Icon = abs < 0.3 ? AlertCircle : TrendingUp;
  const iconColor =
    abs < 0.3 ? colors.text.secondary : abs < 0.7 ? colors.accent.orange : colors.accent.green;

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: colors.border.light,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text.primary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            {correlation.insight}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.text.secondary,
            }}
          >
            Sample size: {correlation.sample_size} days
          </Text>
        </View>
        <View style={{ alignItems: "center", marginLeft: tokens.spacing.md }}>
          <Icon color={iconColor} size={24} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: iconColor,
              marginTop: tokens.spacing.xs,
            }}
          >
            {correlation.correlation.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

