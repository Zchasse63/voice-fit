import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, RotateCcw } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

// Placeholder data until real plan data is wired
const SAMPLE_WEEK = [
  { id: "mon", day: "Mon", title: "Intervals", distance: "4 mi", status: "planned" },
  { id: "tue", day: "Tue", title: "Strength", distance: "--", status: "planned" },
  { id: "wed", day: "Wed", title: "Easy Run", distance: "3 mi", status: "planned" },
  { id: "thu", day: "Thu", title: "Tempo", distance: "5 mi", status: "planned" },
  { id: "fri", day: "Fri", title: "Rest Day", distance: "--", status: "rest" },
  { id: "sat", day: "Sat", title: "Long Run", distance: "8 mi", status: "planned" },
  { id: "sun", day: "Sun", title: "Mobility", distance: "--", status: "planned" },
];

export default function TrainingCalendarScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <CalendarDays color={colors.accent.blue} size={20} style={{ marginRight: tokens.spacing.sm }} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Training Calendar
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => ({
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.full,
            backgroundColor: colors.background.secondary,
            opacity: pressed ? 0.85 : 1,
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.spacing.xs,
          })}
          onPress={() => {
            // Reset to default plan placeholder
            console.log("Reset training calendar");
          }}
        >
          <RotateCcw color={colors.text.secondary} size={18} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: tokens.typography.fontWeight.semibold,
            }}
          >
            Reset
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={SAMPLE_WEEK}
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
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.tertiary,
                  marginBottom: 2,
                }}
              >
                {item.day}
              </Text>
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
                  marginTop: 2,
                }}
              >
                {item.distance}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => ({
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.full,
                backgroundColor:
                  item.status === "rest"
                    ? colors.background.primary
                    : colors.accent.blue + "20",
                opacity: pressed ? 0.85 : 1,
              })}
              onPress={() => {
                // Placeholder: open workout edit dialog
                console.log("Open workout for", item.title);
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: item.status === "rest" ? colors.text.secondary : colors.accent.blue,
                }}
              >
                Edit
              </Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
