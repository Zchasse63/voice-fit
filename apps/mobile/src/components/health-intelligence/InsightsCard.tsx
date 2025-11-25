/**
 * Insights Card Component
 * 
 * Displays personalized insights and recommendations
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Lightbulb, ChevronRight, AlertTriangle, TrendingUp } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

interface Insight {
  type: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  risk_factors?: any[];
}

interface InsightsData {
  insights: Insight[];
  total_insights: number;
}

export function InsightsCard() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadInsights();
    }
  }, [user?.id]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke("get-insights", {
        body: { user_id: user?.id },
      });

      if (response.error) throw response.error;
      setData(response.data);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return colors.accent.red;
      case "high":
        return colors.accent.orange;
      case "medium":
        return colors.accent.yellow;
      case "low":
        return colors.accent.green;
      default:
        return colors.text.secondary;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "injury_risk_alert":
        return AlertTriangle;
      case "high_readiness":
      case "nutrition_performance":
      case "protein_recovery":
        return TrendingUp;
      default:
        return Lightbulb;
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

  if (!data || data.insights.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text.secondary, textAlign: "center" }}>
          No insights available yet. Keep logging your data!
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: tokens.spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: tokens.spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Personalized Insights
        </Text>
        <View
          style={{
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.full,
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {data.total_insights}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.lg,
          gap: tokens.spacing.md,
        }}
      >
        {data.insights.map((insight, index) => (
          <InsightItem
            key={index}
            insight={insight}
            isExpanded={expandedIndex === index}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            colors={colors}
            getIcon={getInsightIcon}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function InsightItem({
  insight,
  isExpanded,
  onPress,
  colors,
  getIcon: getInsightIcon,
  getPriorityColor,
}: {
  insight: Insight;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
  getIcon: (type: string) => any;
  getPriorityColor: (priority: string) => string;
}) {
  const Icon = getInsightIcon(insight.type);
  const priorityColor = getPriorityColor(insight.priority);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: priorityColor,
        padding: tokens.spacing.md,
        width: 280,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
        <Icon color={priorityColor} size={20} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.text.primary,
            }}
          >
            {insight.title}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 12,
          color: colors.text.secondary,
          marginBottom: tokens.spacing.sm,
          lineHeight: 16,
        }}
        numberOfLines={isExpanded ? undefined : 2}
      >
        {insight.description}
      </Text>

      {isExpanded && (
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderLeftWidth: 3,
            borderLeftColor: priorityColor,
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.xs,
            borderRadius: tokens.borderRadius.md,
            marginTop: tokens.spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: priorityColor,
              fontWeight: "500",
            }}
          >
            💡 {insight.action}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: tokens.spacing.sm,
        }}
      >
        <View
          style={{
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: 2,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: `${priorityColor}20`,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: priorityColor,
            }}
          >
            {insight.priority.toUpperCase()}
          </Text>
        </View>
        <ChevronRight color={colors.text.secondary} size={16} />
      </View>
    </Pressable>
  );
}

