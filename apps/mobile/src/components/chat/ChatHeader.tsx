/**
 * ChatHeader Component
 *
 * Single clean header for chat screen.
 * Back arrow, title, and optional profile avatar/actions.
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Avatar } from "../profile";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface ChatHeaderProps {
  title: string;
  onBack: () => void;
  onAvatarPress?: () => void;
  onWorkoutLogPress?: () => void;
}

export default function ChatHeader({
  title,
  onBack,
  onAvatarPress,
  onWorkoutLogPress,
}: ChatHeaderProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        },
      ]}
    >
      {/* Back Button */}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <ArrowLeft color={colors.accent.blue} size={24} />
      </Pressable>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          },
        ]}
      >
        {title}
      </Text>

      {/* Right Side */}
      {onAvatarPress && (
        <Pressable onPress={onAvatarPress}>
          <Avatar size="sm" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.md,
  },
  backButton: {
    padding: tokens.spacing.sm,
    marginRight: tokens.spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
});
