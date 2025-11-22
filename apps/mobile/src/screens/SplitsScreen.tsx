import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";

type Split = {
  id: string;
  label: string;
  pace: string;
  delta: string;
  distance: string;
};

const SAMPLE_SPLITS: Split[] = [
  { id: "1", label: "1", pace: "7:47/mi", delta: "+0:12", distance: "1.00 mi" },
  { id: "2", label: "2", pace: "7:35/mi", delta: "+0:31", distance: "1.00 mi" },
  { id: "3", label: "3", pace: "7:04/mi", delta: "-0:08", distance: "1.00 mi" },
];

export default function SplitsScreen() {
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
          Splits
        </Text>
      </View>
      <FlatList
        data={SAMPLE_SPLITS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}
        renderItem={({ item }) => (
          <View
            style={{
              padding: tokens.spacing.md,
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border.light,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.primary,
                  fontWeight: tokens.typography.fontWeight.semibold,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                {item.distance}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: colors.text.primary,
                  fontWeight: tokens.typography.fontWeight.semibold,
                }}
              >
                {item.pace}
              </Text>
              <Text
                style={{
                  color: item.delta.startsWith("-")
                    ? colors.accent.green
                    : colors.accent.coral,
                  marginTop: 4,
                }}
              >
                {item.delta}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
