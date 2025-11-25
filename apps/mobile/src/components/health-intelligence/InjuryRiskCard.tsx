/**
 * Injury Risk Card Component
 * 
 * Displays injury risk prediction with factors and recommendations
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

interface RiskFactor {
  factor: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
}

interface InjuryRiskData {
  injury_risk_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  risk_factors: RiskFactor[];
}

export function InjuryRiskCard() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [data, setData] = useState<InjuryRiskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadInjuryRisk();
    }
  }, [user?.id]);

  const loadInjuryRisk = async () => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke("get-injury-risk", {
        body: { user_id: user?.id },
      });

      if (response.error) throw response.error;
      setData(response.data);
    } catch (error) {
      console.error("Error loading injury risk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return colors.accent.green;
      case "moderate":
        return colors.accent.yellow;
      case "high":
        return colors.accent.orange;
      case "critical":
        return colors.accent.red;
      default:
        return colors.text.secondary;
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

  const riskColor = getRiskColor(data.risk_level);

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: riskColor,
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
          backgroundColor: `${riskColor}15`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.md, flex: 1 }}>
          <AlertTriangle color={riskColor} size={24} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text.primary,
              }}
            >
              Injury Risk
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginTop: 2,
              }}
            >
              {data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1)} Risk
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: riskColor,
            }}
          >
            {data.injury_risk_score.toFixed(0)}%
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
          {data.risk_factors.map((factor, index) => (
            <View key={index}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text.primary,
                  }}
                >
                  {factor.factor}
                </Text>
                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: 2,
                    borderRadius: tokens.borderRadius.md,
                    backgroundColor:
                      factor.severity === "critical"
                        ? colors.accent.red + "20"
                        : factor.severity === "high"
                          ? colors.accent.orange + "20"
                          : colors.accent.yellow + "20",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color:
                        factor.severity === "critical"
                          ? colors.accent.red
                          : factor.severity === "high"
                            ? colors.accent.orange
                            : colors.accent.yellow,
                    }}
                  >
                    {factor.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text.secondary,
                  marginBottom: tokens.spacing.xs,
                }}
              >
                {factor.description}
              </Text>
              <View
                style={{
                  backgroundColor: colors.background.primary,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.accent.blue,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.xs,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.accent.blue,
                    fontWeight: "500",
                  }}
                >
                  💡 {factor.recommendation}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

