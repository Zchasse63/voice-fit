/**
 * SSOButton Component
 *
 * Single Sign-On button for Apple and Google authentication.
 * Follows platform-specific branding guidelines.
 */

import React from "react";
import { Pressable, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import tokens from "../../theme/tokens";

interface SSOButtonProps {
  provider: "apple" | "google";
  onPress: () => void;
  loading?: boolean;
}

export default function SSOButton({ provider, onPress, loading }: SSOButtonProps) {
  const isApple = provider === "apple";

  // Apple: Black background, white text
  // Google: White background, black text, subtle border
  const backgroundColor = isApple ? "#000000" : "#FFFFFF";
  const textColor = isApple ? "#FFFFFF" : "#000000";
  const borderWidth = isApple ? 0 : 1;
  const borderColor = "#E9ECEF";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderWidth,
          borderColor,
          opacity: loading ? 0.6 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {isApple ? (
              // Apple logo (you'll need to import actual Apple icon from lucide or use SVG)
              <Text style={{ fontSize: 20, color: textColor }}>🍎</Text>
            ) : (
              // Google logo (you'll need to use actual Google logo SVG)
              <Text style={{ fontSize: 20, color: textColor }}>G</Text>
            )}
          </View>

          {/* Text */}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
              },
            ]}
          >
            Sign in with {isApple ? "Apple" : "Google"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.lg,
    width: "100%",
    marginBottom: tokens.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginRight: tokens.spacing.md,
  },
  text: {
    textAlign: "center",
  },
});
