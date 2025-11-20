import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

type JournalEntry = {
  id: string;
  title: string;
  type: "run" | "strength";
  summary: string;
  subtitle: string;
  timestamp: string;
};

const SAMPLE_JOURNAL: JournalEntry[] = [
  {
    id: "1",
    title: "Upper Body",
    type: "strength",
    summary: "Sets: 12 • Vol: 14.3k lbs • RPE 7",
    subtitle: "Today, 7:15 AM",
    timestamp: "2025-11-20T12:15:00Z",
  },
  {
    id: "2",
    title: "Easy Run",
    type: "run",
    summary: "3.2 mi • 8:42/mi • 27m",
    subtitle: "Yesterday",
    timestamp: "2025-11-19T11:00:00Z",
  },
];

export default function JournalScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Journal
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Completed workouts and runs
        </Text>
      </View>

      <FlatList
        data={SAMPLE_JOURNAL}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              // Navigate to detail (run or workout)
              console.log("Open journal entry", item.id);
            }}
            style={({ pressed }) => ({
              padding: tokens.spacing.md,
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border.light,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {item.summary}
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                marginTop: 4,
              }}
            >
              {item.subtitle}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
