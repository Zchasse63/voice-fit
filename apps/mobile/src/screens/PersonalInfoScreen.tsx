import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

export default function PersonalInfoScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Personal Information
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: tokens.spacing.sm,
          }}
        >
          Edit name, email, and preferences (placeholder screen).
        </Text>
      </View>
    </SafeAreaView>
  );
}
