import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, HelpCircle } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";

export default function SupportScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.log("Failed to open link", err));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.md }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Privacy & Help
        </Text>
        <SupportRow
          icon={<Shield color={colors.accent.blue} size={20} />}
          title="Privacy Policy"
          subtitle="Learn how we handle your data."
          onPress={() => openLink("https://voicefit.app/privacy")}
        />
        <SupportRow
          icon={<HelpCircle color={colors.accent.blue} size={20} />}
          title="FAQ & Support"
          subtitle="Get answers or contact support."
          onPress={() => openLink("https://voicefit.app/support")}
        />
      </View>
    </SafeAreaView>
  );
}

function SupportRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
