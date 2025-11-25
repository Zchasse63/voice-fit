/**
 * Readiness Card Component
 * 
 * Displays workout readiness prediction with performance factors
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Zap, ChevronDown, ChevronUp } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

interface PerformanceFactor {
  factor: string;
  value: string | number;
  impact: "positive" | "negative" | "neutral";
}

interface ReadinessData {
  readiness_score: number;
  readiness_level: "poor" | "fair" | "good" | "excellent";
  performance_factors: PerformanceFactor[];
  recommendation: string;
}

export function ReadinessCard() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [data, setData] = useState<ReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReadiness();
    }
  }, [user?.id]);

  const loadReadiness = async () => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke("get-readiness", {
        body: { user_id: user?.id },
      });

      if (response.error) throw response.error;
      setData(response.data);
    } catch (error) {
      console.error("Error loading readiness:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case "poor":
        return colors.accent.red;
      case "fair":
        return colors.accent.orange;
      case "good":
        return colors.accent.yellow;
      case "excellent":
        return colors.accent.green;
      default:
        return colors.text.secondary;
    }
  };

  const getFactorIcon = (impact: string) => {
    switch (impact) {
      case "positive":
        return "✅";
      case "negative":
        return "⚠️";
      default:
        return "➖";
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

  if (!data) return null;

  const readinessColor = getReadinessColor(data.readiness_level);

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: readinessColor,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: tokens.spacing.md,
          backgroundColor: `${readinessColor}15`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.md, flex: 1 }}>
          <Zap color={readinessColor} size={24} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text.primary,
              }}
            >
              Workout Readiness
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginTop: 2,
              }}
            >
              {data.readiness_level.charAt(0).toUpperCase() + data.readiness_level.slice(1)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: readinessColor,
            }}
          >
            {data.readiness_score.toFixed(0)}%
          </Text>
          {isExpanded ? (
            <ChevronUp color={colors.text.secondary} size={20} />
          ) : (
            <ChevronDown color={colors.text.secondary} size={20} />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={{
            padding: tokens.spacing.md,
            gap: tokens.spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border.light,
          }}
        >
          {/* Recommendation */}
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderLeftWidth: 3,
              borderLeftColor: readinessColor,
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.md,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: readinessColor,
                fontWeight: "600",
              }}
            >
              {data.recommendation}
            </Text>
          </View>

          {/* Performance Factors */}
          <View style={{ gap: tokens.spacing.sm }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.text.secondary,
              }}
            >
              Performance Factors
            </Text>
            {data.performance_factors.map((factor, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: tokens.spacing.sm,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.xs,
                  backgroundColor: colors.background.primary,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                <Text style={{ fontSize: 14 }}>
                  {getFactorIcon(factor.impact)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text.primary,
                      fontWeight: "500",
                    }}
                  >
                    {factor.factor}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.text.secondary,
                    }}
                  >
                    {typeof factor.value === "number"
                      ? factor.value.toFixed(1)
                      : factor.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

