/**
 * ErrorMessage Component
 *
 * Displays error, warning, or info messages in authentication flows.
 * Clean, minimal design with appropriate color coding.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertCircle, AlertTriangle, Info } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface ErrorMessageProps {
  message: string;
  type?: "error" | "warning" | "info";
}

export default function ErrorMessage({
  message,
  type = "error",
}: ErrorMessageProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  // Get color based on type
  const getColor = () => {
    switch (type) {
      case "error":
        return colors.accent.red;
      case "warning":
        return colors.accent.orange;
      case "info":
        return colors.accent.blue;
    }
  };

  // Get icon based on type
  const getIcon = () => {
    const color = getColor();
    const size = 16;

    switch (type) {
      case "error":
        return <AlertCircle size={size} color={color} />;
      case "warning":
        return <AlertTriangle size={size} color={color} />;
      case "info":
        return <Info size={size} color={color} />;
    }
  };

  const color = getColor();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${color}15`, // 15% opacity
          borderLeftWidth: 3,
          borderLeftColor: color,
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.sm,
          marginBottom: tokens.spacing.md,
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text
        style={[
          styles.message,
          {
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.primary,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: tokens.spacing.sm,
  },
  message: {
    flex: 1,
    lineHeight: tokens.typography.lineHeight.normal * tokens.typography.fontSize.sm,
  },
});
