/**
 * Sport Training Selector Component
 * 
 * Allows users to select sport and generate sport-specific training programs
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Zap, ChevronRight } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const SPORTS = [
  { name: "Basketball", icon: "🏀", positions: ["Guard", "Forward", "Center"] },
  { name: "Soccer", icon: "⚽", positions: ["Goalkeeper", "Defender", "Midfielder", "Forward"] },
  { name: "Baseball", icon: "⚾", positions: ["Pitcher", "Catcher", "Infielder", "Outfielder"] },
  { name: "Football", icon: "🏈", positions: ["QB", "RB", "WR", "OL", "DL", "LB", "DB"] },
  { name: "Tennis", icon: "🎾", positions: ["Baseline", "Serve-and-Volley"] },
  { name: "Volleyball", icon: "🏐", positions: ["Setter", "Hitter", "Libero"] },
  { name: "Ice Hockey", icon: "🏒", positions: ["Forward", "Defenseman", "Goalie"] },
  { name: "Swimming", icon: "🏊", positions: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"] },
];

const SEASONS = [
  { value: "off-season", label: "Off-Season", description: "Build strength & power" },
  { value: "pre-season", label: "Pre-Season", description: "Sport-specific conditioning" },
  { value: "in-season", label: "In-Season", description: "Maintenance & injury prevention" },
];

interface SportTrainingSelectorProps {
  onProgramGenerated?: (program: any) => void;
}

export function SportTrainingSelector({ onProgramGenerated }: SportTrainingSelectorProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState("off-season");
  const [isLoading, setIsLoading] = useState(false);

  const currentSport = SPORTS.find((s) => s.name === selectedSport);

  const handleGenerateProgram = async () => {
    if (!selectedSport || !user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/sport-training/generate-program", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          sport: selectedSport,
          position: selectedPosition,
          season: selectedSeason,
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
      {/* Sport Selection */}
      <View>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: tokens.spacing.md,
          }}
        >
          Select Your Sport
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: tokens.spacing.sm }}
        >
          {SPORTS.map((sport) => (
            <Pressable
              key={sport.name}
              onPress={() => {
                setSelectedSport(sport.name);
                setSelectedPosition(null);
              }}
              style={({ pressed }) => ({
                backgroundColor:
                  selectedSport === sport.name
                    ? colors.accent.blue
                    : colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderWidth: selectedSport === sport.name ? 0 : 1,
                borderColor: colors.border.primary,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 24,
                  marginBottom: 4,
                }}
              >
                {sport.icon}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color:
                    selectedSport === sport.name
                      ? "white"
                      : colors.text.primary,
                }}
              >
                {sport.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Position Selection */}
      {currentSport && (
        <View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.md,
            }}
          >
            Select Position (Optional)
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing.sm }}>
            {currentSport.positions.map((position) => (
              <Pressable
                key={position}
                onPress={() => setSelectedPosition(position)}
                style={({ pressed }) => ({
                  backgroundColor:
                    selectedPosition === position
                      ? colors.accent.green
                      : colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.xs,
                  borderWidth: selectedPosition === position ? 0 : 1,
                  borderColor: colors.border.primary,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color:
                      selectedPosition === position
                        ? "white"
                        : colors.text.primary,
                  }}
                >
                  {position}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Season Selection */}
      {selectedSport && (
        <View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.md,
            }}
          >
            Training Season
          </Text>
          <View style={{ gap: tokens.spacing.sm }}>
            {SEASONS.map((season) => (
              <Pressable
                key={season.value}
                onPress={() => setSelectedSeason(season.value)}
                style={({ pressed }) => ({
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.lg,
                  borderWidth: 2,
                  borderColor:
                    selectedSeason === season.value
                      ? colors.accent.blue
                      : colors.border.primary,
                  padding: tokens.spacing.md,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text.primary,
                  }}
                >
                  {season.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.text.secondary,
                    marginTop: 4,
                  }}
                >
                  {season.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Generate Button */}
      {selectedSport && (
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
              <ChevronRight color="white" size={20} />
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

