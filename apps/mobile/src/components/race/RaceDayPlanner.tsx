/**
 * Race Day Planner Component
 * 
 * Generates personalized race day strategies
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from "react-native";
import { Flag, Zap, Droplet, Utensils, TrendingUp } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const RACE_TYPES = [
  { value: "5k", label: "5K", icon: "🏃" },
  { value: "half_marathon", label: "Half Marathon", icon: "🏃‍♂️" },
  { value: "marathon", label: "Marathon", icon: "🏃‍♀️" },
  { value: "triathlon", label: "Triathlon", icon: "🏊" },
  { value: "ultra", label: "Ultra", icon: "⛰️" },
];

interface RacePlan {
  pacing_strategy?: any;
  nutrition_plan?: any;
  hydration_strategy?: any;
  pre_race_prep?: any;
  mental_strategy?: any;
}

export function RaceDayPlanner() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [raceName, setRaceName] = useState("");
  const [raceType, setRaceType] = useState<string | null>(null);
  const [distance, setDistance] = useState("");
  const [elevation, setElevation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [racePlan, setRacePlan] = useState<RacePlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pacing");

  const handleGeneratePlan = async () => {
    if (!raceName || !raceType || !distance || !user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/race-day/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          race_name: raceName,
          race_type: raceType,
          distance_km: parseFloat(distance),
          elevation_gain_m: parseInt(elevation) || 0,
          weather_forecast: temperature ? { temp: parseFloat(temperature) } : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      const result = await response.json();
      setRacePlan(result.data.plan);
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (racePlan) {
    return (
      <View style={{ gap: tokens.spacing.lg }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: "white",
              marginBottom: tokens.spacing.xs,
            }}
          >
            🏁 {raceName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {distance} km • {raceType.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.lg }}
        >
          {[
            { key: "pacing", label: "Pacing", icon: "⏱️" },
            { key: "nutrition", label: "Nutrition", icon: "🍎" },
            { key: "hydration", label: "Hydration", icon: "💧" },
            { key: "prep", label: "Prep", icon: "✅" },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => ({
                backgroundColor:
                  activeTab === tab.key ? colors.accent.blue : colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: activeTab === tab.key ? "white" : colors.text.primary,
                }}
              >
                {tab.icon} {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        <View
          style={{
            backgroundColor: colors.background.secondary,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.md,
            marginHorizontal: tokens.spacing.lg,
          }}
        >
          {activeTab === "pacing" && racePlan.pacing_strategy && (
            <PlanSection title="Pacing Strategy" data={racePlan.pacing_strategy} colors={colors} />
          )}
          {activeTab === "nutrition" && racePlan.nutrition_plan && (
            <PlanSection title="Nutrition Plan" data={racePlan.nutrition_plan} colors={colors} />
          )}
          {activeTab === "hydration" && racePlan.hydration_strategy && (
            <PlanSection title="Hydration Strategy" data={racePlan.hydration_strategy} colors={colors} />
          )}
          {activeTab === "prep" && racePlan.pre_race_prep && (
            <PlanSection title="Pre-Race Prep" data={racePlan.pre_race_prep} colors={colors} />
          )}
        </View>

        {/* Reset Button */}
        <Pressable
          onPress={() => setRacePlan(null)}
          style={({ pressed }) => ({
            backgroundColor: colors.background.secondary,
            borderRadius: tokens.borderRadius.lg,
            paddingVertical: tokens.spacing.md,
            marginHorizontal: tokens.spacing.lg,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 14,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Create Another Plan
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: tokens.spacing.md }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.lg,
        }}
      >
        <Flag color={colors.accent.blue} size={24} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Race Day Planner
        </Text>
      </View>

      {/* Form */}
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginHorizontal: tokens.spacing.lg,
          gap: tokens.spacing.md,
        }}
      >
        {/* Race Name */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: colors.text.secondary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            Race Name
          </Text>
          <TextInput
            placeholder="e.g., Boston Marathon"
            value={raceName}
            onChangeText={setRaceName}
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: tokens.borderRadius.md,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.primary,
            }}
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Race Type */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: colors.text.secondary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            Race Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: tokens.spacing.sm }}
          >
            {RACE_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setRaceType(type.value)}
                style={({ pressed }) => ({
                  backgroundColor:
                    raceType === type.value ? colors.accent.blue : colors.background.primary,
                  borderRadius: tokens.borderRadius.md,
                  borderWidth: raceType === type.value ? 0 : 1,
                  borderColor: colors.border.primary,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: raceType === type.value ? "white" : colors.text.primary,
                  }}
                >
                  {type.icon} {type.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Distance & Elevation */}
        <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Distance (km)
            </Text>
            <TextInput
              placeholder="42.2"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: tokens.borderRadius.md,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                color: colors.text.primary,
                borderWidth: 1,
                borderColor: colors.border.primary,
              }}
              placeholderTextColor={colors.text.secondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Elevation (m)
            </Text>
            <TextInput
              placeholder="500"
              value={elevation}
              onChangeText={setElevation}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: tokens.borderRadius.md,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                color: colors.text.primary,
                borderWidth: 1,
                borderColor: colors.border.primary,
              }}
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>

        {/* Temperature */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: colors.text.secondary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            Expected Temperature (°C)
          </Text>
          <TextInput
            placeholder="15"
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: tokens.borderRadius.md,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.primary,
            }}
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Generate Button */}
        <Pressable
          onPress={handleGeneratePlan}
          disabled={isLoading || !raceName || !raceType || !distance}
          style={({ pressed }) => ({
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.lg,
            paddingVertical: tokens.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: tokens.spacing.sm,
            opacity: pressed ? 0.8 : isLoading ? 0.5 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Zap color="white" size={20} />
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Generate Plan
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function PlanSection({ title, data, colors }: any) {
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.primary,
          marginBottom: tokens.spacing.sm,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.text.secondary,
          lineHeight: 18,
        }}
      >
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </Text>
    </View>
  );
}

