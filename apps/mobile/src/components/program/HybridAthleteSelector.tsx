/**
 * Hybrid Athlete Selector Component
 * 
 * Allows users to balance strength and endurance training
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Zap, TrendingUp, Wind } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const GOAL_OPTIONS = [
  {
    value: "strength",
    label: "Strength",
    icon: "💪",
    description: "Build muscle & power",
  },
  {
    value: "endurance",
    label: "Endurance",
    icon: "🏃",
    description: "Build aerobic capacity",
  },
];

const HYBRID_PROFILES = [
  {
    primary: "strength",
    secondary: "endurance",
    name: "Powerlifter + Cardio",
    description: "Add cardiovascular fitness to strength training",
    icon: "🏋️",
  },
  {
    primary: "endurance",
    secondary: "strength",
    name: "Runner + Strength",
    description: "Add strength training to marathon training",
    icon: "🏃",
  },
  {
    primary: "strength",
    secondary: "endurance",
    name: "CrossFit Athlete",
    description: "Balance strength, power, and conditioning",
    icon: "⚡",
  },
  {
    primary: "endurance",
    secondary: "strength",
    name: "Triathlete",
    description: "Combine endurance with functional strength",
    icon: "🏊",
  },
];

interface HybridAthleteProps {
  onProgramGenerated?: (program: any) => void;
}

export function HybridAthleteSelector({ onProgramGenerated }: HybridAthleteProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectProfile = (profile: any) => {
    setSelectedProfile(profile.name);
    setPrimaryGoal(profile.primary);
    setSecondaryGoal(profile.secondary);
  };

  const handleGenerateProgram = async () => {
    if (!primaryGoal || !secondaryGoal || !user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/hybrid-athlete/generate-program", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          primary_goal: primaryGoal,
          secondary_goal: secondaryGoal,
          duration_weeks: 12,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate program");
      const result = await response.json();
      onProgramGenerated?.(result.data);
    } catch (error) {
      console.error("Error generating program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      {/* Hybrid Profiles */}
      <View>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: tokens.spacing.md,
          }}
        >
          Choose Your Profile
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: tokens.spacing.sm }}
        >
          {HYBRID_PROFILES.map((profile) => (
            <Pressable
              key={profile.name}
              onPress={() => handleSelectProfile(profile)}
              style={({ pressed }) => ({
                backgroundColor:
                  selectedProfile === profile.name
                    ? colors.accent.blue
                    : colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: selectedProfile === profile.name ? 0 : 1,
                borderColor: colors.border.primary,
                padding: tokens.spacing.md,
                width: 140,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{profile.icon}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color:
                    selectedProfile === profile.name
                      ? "white"
                      : colors.text.primary,
                  marginBottom: 4,
                }}
              >
                {profile.name}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color:
                    selectedProfile === profile.name
                      ? "rgba(255,255,255,0.8)"
                      : colors.text.secondary,
                  lineHeight: 14,
                }}
              >
                {profile.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Custom Goal Selection */}
      {!selectedProfile && (
        <View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.md,
            }}
          >
            Or Select Custom Goals
          </Text>

          {/* Primary Goal */}
          <View style={{ marginBottom: tokens.spacing.md }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.text.secondary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Primary Goal
            </Text>
            <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
              {GOAL_OPTIONS.map((goal) => (
                <Pressable
                  key={goal.value}
                  onPress={() => setPrimaryGoal(goal.value)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor:
                      primaryGoal === goal.value
                        ? colors.accent.blue
                        : colors.background.secondary,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: primaryGoal === goal.value ? 0 : 1,
                    borderColor: colors.border.primary,
                    padding: tokens.spacing.md,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{goal.icon}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        primaryGoal === goal.value
                          ? "white"
                          : colors.text.primary,
                    }}
                  >
                    {goal.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Secondary Goal */}
          {primaryGoal && (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: colors.text.secondary,
                  marginBottom: tokens.spacing.sm,
                }}
              >
                Secondary Goal
              </Text>
              <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
                {GOAL_OPTIONS.filter((g) => g.value !== primaryGoal).map((goal) => (
                  <Pressable
                    key={goal.value}
                    onPress={() => setSecondaryGoal(goal.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor:
                        secondaryGoal === goal.value
                          ? colors.accent.green
                          : colors.background.secondary,
                      borderRadius: tokens.borderRadius.lg,
                      borderWidth: secondaryGoal === goal.value ? 0 : 1,
                      borderColor: colors.border.primary,
                      padding: tokens.spacing.md,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{goal.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color:
                          secondaryGoal === goal.value
                            ? "white"
                            : colors.text.primary,
                      }}
                    >
                      {goal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Generate Button */}
      {primaryGoal && secondaryGoal && (
        <Pressable
          onPress={handleGenerateProgram}
          disabled={isLoading}
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
                Generate Program
              </Text>
            </>
          )}
        </Pressable>
      )}

      {/* Info Card */}
      <View
        style={{
          backgroundColor: colors.accent.blue + "10",
          borderLeftWidth: 4,
          borderLeftColor: colors.accent.blue,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.accent.blue,
            marginBottom: tokens.spacing.xs,
          }}
        >
          💡 Hybrid Training Benefits
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.text.secondary,
            lineHeight: 16,
          }}
        >
          Balanced training improves overall fitness, reduces injury risk, and prevents
          plateaus. Our AI optimizes recovery and workout sequencing to minimize
          interference between strength and endurance training.
        </Text>
      </View>
    </View>
  );
}

