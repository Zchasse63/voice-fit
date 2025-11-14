/**
 * Card Component
 *
 * Reusable card container component with multiple variants and padding options.
 * Follows MacroFactor design system with clean, minimal styling.
 */

import React from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface CardProps {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({
  variant = "default",
  padding = "md",
  onPress,
  children,
  style,
}: CardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  // Get padding value
  const getPaddingValue = () => {
    switch (padding) {
      case "none":
        return 0;
      case "sm":
        return tokens.spacing.sm;
      case "md":
        return tokens.spacing.md;
      case "lg":
        return tokens.spacing.lg;
    }
  };

  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: colors.background.secondary,
        };
      case "elevated":
        return {
          backgroundColor: colors.background.secondary,
          ...tokens.shadows.md,
        };
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border.light,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingValue = getPaddingValue();

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [
        styles.card,
        {
          borderRadius: tokens.components.card.borderRadius,
          padding: paddingValue,
          opacity: onPress && pressed ? 0.8 : 1,
        },
        variantStyles,
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    // Dynamic styles applied inline
  },
});
