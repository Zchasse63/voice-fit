/**
 * AuthContainer Component
 *
 * Container component for authentication screens.
 * Provides consistent layout with logo, title, and keyboard-aware scrolling.
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface AuthContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthContainer({
  title,
  subtitle,
  children,
}: AuthContainerProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logo,
                { backgroundColor: colors.accent.blue },
              ]}
            >
              <Text style={styles.logoText}>VF</Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                fontSize: tokens.typography.fontSize["3xl"],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              },
            ]}
          >
            {title}
          </Text>

          {/* Subtitle */}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: tokens.typography.fontSize.md,
                  color: colors.text.secondary,
                  marginTop: tokens.spacing.sm,
                  marginBottom: tokens.spacing.xl,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: tokens.spacing["2xl"],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 48,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#FFFFFF",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  content: {
    width: "100%",
  },
});
