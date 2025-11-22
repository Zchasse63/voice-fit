import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Watch } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

export default function WearablesScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ padding: tokens.spacing.lg, flexDirection: "row", alignItems: "center" }}>
        <Watch color={colors.accent.blue} size={22} style={{ marginRight: tokens.spacing.sm }} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Wearables
        </Text>
      </View>
      <View style={{ paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.md }}>
        <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
          Connect and manage devices (placeholder).
        </Text>
        <Pressable
          style={({ pressed }) => ({
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.lg,
            backgroundColor: colors.background.secondary,
            borderWidth: 1,
            borderColor: colors.border.light,
            opacity: pressed ? 0.85 : 1,
          })}
          onPress={() => console.log("Add wearable")}
        >
          <Text
            style={{
              color: colors.accent.blue,
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.base,
            }}
          >
            Add Device
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
