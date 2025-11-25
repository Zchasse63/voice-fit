import React from "react";
import { View, Text, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

export default function NotificationSettingsScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const [workoutReminders, setWorkoutReminders] = React.useState(true);
  const [checkIn, setCheckIn] = React.useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ padding: tokens.spacing.lg, flexDirection: "row", alignItems: "center" }}>
        <Bell color={colors.accent.blue} size={22} style={{ marginRight: tokens.spacing.sm }} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Notifications
        </Text>
      </View>
      <View style={{ paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.lg }}>
        <SettingRow
          label="Workout reminders"
          description="Get nudges to start or resume your session."
          value={workoutReminders}
          onValueChange={setWorkoutReminders}
        />
        <SettingRow
          label="Daily check-in"
          description="Morning prompt for sleep/energy."
          value={checkIn}
          onValueChange={setCheckIn}
        />
      </View>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  return (
    <View
      style={{
        padding: tokens.spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, paddingRight: tokens.spacing.md }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
