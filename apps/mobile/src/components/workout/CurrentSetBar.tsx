import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkoutStore } from "../../store/workout.store";
import { useTheme } from "../../theme/ThemeContext";
import { tokens } from "../../theme/tokens";

interface CurrentSetBarProps {
  onOpenWorkout?: () => void;
}

export default function CurrentSetBar({ onOpenWorkout }: CurrentSetBarProps) {
  const insets = useSafeAreaInsets();
  const { activeWorkout, sets } = useWorkoutStore();
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  if (!activeWorkout) {
    return null;
  }

  const lastSet = sets[sets.length - 1];

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Math.max(insets.bottom, tokens.spacing.md),
        paddingTop: tokens.spacing.sm,
        paddingHorizontal: tokens.spacing.md,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
      }}
    >
      <Pressable
        onPress={onOpenWorkout}
        style={({ pressed }) => ({
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border.light,
          padding: tokens.spacing.md,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text
          style={{
            color: colors.text.secondary,
            fontSize: tokens.typography.fontSize.xs,
            marginBottom: 4,
          }}
        >
          Workout in progress
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: tokens.typography.fontWeight.semibold,
                fontSize: tokens.typography.fontSize.base,
              }}
            >
              {activeWorkout.name}
            </Text>
            {lastSet && (
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: tokens.typography.fontSize.sm,
                  marginTop: 4,
                }}
              >
                {lastSet.exerciseName} • {lastSet.reps} reps @ {lastSet.weight} • RPE {lastSet.rpe ?? "—"}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
            {["-", "+"].map((symbol) => (
              <Pressable
                key={symbol}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: tokens.borderRadius.full,
                  backgroundColor: colors.background.primary,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
                onPress={() => {
                  // Placeholder: increment/decrement last set weight
                  console.log(`${symbol} adjust set`);
                }}
              >
                <Text style={{ color: colors.text.primary, fontSize: 18 }}>{symbol}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </View>
  );
}
