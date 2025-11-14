/**
 * Button Component
 *
 * Reusable button component with multiple variants, sizes, and states.
 * Follows MacroFactor design system with clean, minimal styling.
 */

import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  children: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  children,
}: ButtonProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const height = tokens.components.button.height[size];
  const borderRadius = tokens.components.button.borderRadius;

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
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
          textColor: colors.accent.blue,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.accent.blue,
          textColor: colors.accent.blue,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Get padding based on size
  const getPadding = () => {
    switch (size) {
      case "sm":
        return tokens.spacing.md;
      case "md":
        return tokens.spacing.lg;
      case "lg":
        return tokens.spacing.xl;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          paddingHorizontal: getPadding(),
          borderRadius,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          width: fullWidth ? "100%" : "auto",
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <View style={{ marginRight: tokens.spacing.sm }}>{leftIcon}</View>
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: variantStyles.textColor,
              },
            ]}
          >
            {children}
          </Text>
          {rightIcon && (
            <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
});
