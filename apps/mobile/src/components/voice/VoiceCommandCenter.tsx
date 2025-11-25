/**
 * Voice Command Center Component
 * 
 * Displays available voice commands and processes voice input
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Mic, Volume2, ChevronRight, Lightbulb } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface VoiceShortcut {
  command: string;
  action: string;
}

interface VoiceShortcuts {
  exercise_swaps: VoiceShortcut[];
  form_cues: VoiceShortcut[];
  workout_control: VoiceShortcut[];
  program_modifications: VoiceShortcut[];
}

export function VoiceCommandCenter() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<VoiceShortcuts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadShortcuts();
    }
  }, [user?.id]);

  const loadShortcuts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/voice/shortcuts", {
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load shortcuts");
      const result = await response.json();
      setShortcuts(result.data.shortcuts);
    } catch (error) {
      console.error("Error loading shortcuts:", error);
    } finally {
      setIsLoading(false);
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

  if (!shortcuts) {
    return null;
  }

  const categories = [
    { key: "exercise_swaps", label: "Exercise Swaps", icon: "🔄" },
    { key: "form_cues", label: "Form Cues", icon: "💪" },
    { key: "workout_control", label: "Workout Control", icon: "⏱️" },
    { key: "program_modifications", label: "Program Mods", icon: "📋" },
  ];

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
        <Mic color={colors.accent.blue} size={24} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Voice Commands
        </Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.lg,
          gap: tokens.spacing.sm,
        }}
      >
        {categories.map((category) => (
          <Pressable
            key={category.key}
            onPress={() =>
              setExpandedCategory(
                expandedCategory === category.key ? null : category.key
              )
            }
            style={({ pressed }) => ({
              backgroundColor:
                expandedCategory === category.key
                  ? colors.accent.blue
                  : colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              borderWidth: expandedCategory === category.key ? 0 : 1,
              borderColor: colors.border.primary,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 16, marginBottom: 2 }}>{category.icon}</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color:
                  expandedCategory === category.key
                    ? "white"
                    : colors.text.primary,
              }}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Expanded Category */}
      {expandedCategory && shortcuts && (
        <View
          style={{
            backgroundColor: colors.background.secondary,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.md,
            marginHorizontal: tokens.spacing.lg,
            gap: tokens.spacing.sm,
          }}
        >
          {shortcuts[expandedCategory as keyof VoiceShortcuts]?.map(
            (shortcut, index) => (
              <VoiceShortcutItem
                key={index}
                command={shortcut.command}
                action={shortcut.action}
                colors={colors}
              />
            )
          )}
        </View>
      )}

      {/* Tips */}
      <View
        style={{
          backgroundColor: colors.accent.green + "10",
          borderLeftWidth: 4,
          borderLeftColor: colors.accent.green,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginHorizontal: tokens.spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
          <Lightbulb color={colors.accent.green} size={16} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.accent.green,
            }}
          >
            Pro Tip
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            color: colors.text.secondary,
            lineHeight: 16,
          }}
        >
          Say "Hey Siri, ask VoiceFit to [command]" to use voice commands hands-free during workouts.
        </Text>
      </View>
    </View>
  );
}

function VoiceShortcutItem({
  command,
  action,
  colors,
}: {
  command: string;
  action: string;
  colors: any;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: tokens.borderRadius.md,
        padding: tokens.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.accent.blue,
            marginBottom: 2,
          }}
        >
          "{command}"
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.text.secondary,
          }}
        >
          {action}
        </Text>
      </View>
      <Volume2 color={colors.text.secondary} size={16} />
    </View>
  );
}

