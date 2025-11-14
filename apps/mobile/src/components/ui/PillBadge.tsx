/**
 * PillBadge Component
 *
 * Pill-shaped badge component inspired by MacroFactor's "2488 / 2468" style.
 * Used for displaying compact information with selective color emphasis.
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface PillBadgeProps {
  text: string;
  variant?: "primary" | "secondary" | "outlined";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export default function PillBadge({
  text,
  variant = "primary",
  size = "md",
  style,
}: PillBadgeProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.accent.blue,
          borderWidth: 0,
          textColor: "#FFFFFF",
        };
      case "secondary":
        return {
          backgroundColor: colors.background.secondary,
          borderWidth: 0,
          textColor: colors.text.primary,
        };
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border.medium,
          textColor: colors.text.primary,
        };
    }
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
          fontSize: tokens.typography.fontSize.xs,
        };
      case "md":
        return {
          paddingHorizontal: tokens.components.pill.paddingHorizontal,
          paddingVertical: tokens.components.pill.paddingVertical,
          fontSize: tokens.typography.fontSize.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.pill,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          borderRadius: tokens.components.pill.borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeStyles.fontSize,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: variantStyles.textColor,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
  },
  text: {
    textAlign: "center",
  },
});
