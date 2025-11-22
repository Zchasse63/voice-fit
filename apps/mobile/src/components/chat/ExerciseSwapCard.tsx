/**
 * ExerciseSwapCard
 *
 * Tappable card for exercise substitutes in chat interface.
 * Shows exercise name, similarity score, reasoning, and tap-to-select.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

export interface ExerciseSwapData {
  id: string;
  substitute_name: string;
  similarity_score: number;
  why_recommended: string;
  subtitle: string;
  movement_pattern: string;
  primary_muscles: string;
  equipment_required: string;
  difficulty_level: string;
  reduced_stress_area?: string;
  notes?: string;
}

interface ExerciseSwapCardProps {
  exercise: ExerciseSwapData;
  onSelect: (exercise: ExerciseSwapData) => void;
  disabled?: boolean;
}

export default function ExerciseSwapCard({
  exercise,
  onSelect,
  disabled = false,
}: ExerciseSwapCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const handlePress = () => {
    if (!disabled) {
      onSelect(exercise);
    }
  };

  return (
    <Pressable
      style={({ pressed }: any) => [
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Select ${exercise.substitute_name}`}
      accessibilityHint="Tap to swap to this exercise"
    >
      {/* Header: Exercise Name + Similarity */}
      <View style={styles.header}>
        <Text
          style={[
            styles.exerciseName,
            { color: colors.text.primary },
          ]}
          numberOfLines={1}
        >
          {exercise.substitute_name}
        </Text>
        <View
          style={[
            styles.similarityBadge,
            {
              backgroundColor: colors.accent.blue + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.similarityText,
              { color: colors.accent.blue },
            ]}
          >
            {Math.round(exercise.similarity_score * 100)}%
          </Text>
        </View>
      </View>

      {/* Why Recommended */}
      <Text
        style={[
          styles.whyRecommended,
          { color: colors.text.secondary },
        ]}
        numberOfLines={2}
      >
        {exercise.why_recommended}
      </Text>

      {/* Subtitle (Movement Pattern + Equipment) */}
      {exercise.subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: colors.text.tertiary },
          ]}
          numberOfLines={1}
        >
          {exercise.subtitle}
        </Text>
      )}

      {/* Select Button */}
      <View
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.accent.blue,
          },
        ]}
      >
        <Text
          style={[
            styles.selectButtonText,
            { color: colors.text.inverse },
          ]}
        >
          Use This
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  similarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  similarityText: {
    fontSize: 13,
    fontWeight: "600",
  },
  whyRecommended: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
