/**
 * Avatar Component
 *
 * User avatar component with edit capability.
 * Supports different sizes and optional edit overlay with camera icon.
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Camera } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface AvatarProps {
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
  name?: string;
  editable?: boolean;
  onPress?: () => void;
}

export default function Avatar({
  size = "md",
  imageUrl,
  name,
  editable = false,
  onPress,
}: AvatarProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  // Get size dimensions
  const getSize = () => {
    return tokens.components.avatar.sizes[size];
  };

  const avatarSize = getSize();
  const fontSize = avatarSize / 2.5;

  // Get initials from name
  const getInitials = () => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const Wrapper = onPress || editable ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          opacity: pressed && onPress ? 0.8 : 1,
        },
      ]}
    >
      {/* Avatar Circle */}
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: colors.accent.blue,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                fontWeight: tokens.typography.fontWeight.bold,
                color: "#FFFFFF",
              },
            ]}
          >
            {getInitials()}
          </Text>
        )}
      </View>

      {/* Edit Overlay (Camera Icon) */}
      {editable && (
        <View
          style={[
            styles.editOverlay,
            {
              width: avatarSize * 0.35,
              height: avatarSize * 0.35,
              borderRadius: (avatarSize * 0.35) / 2,
              backgroundColor: colors.accent.blue,
              borderWidth: 3,
              borderColor: colors.background.primary,
            },
          ]}
        >
          <Camera color="#FFFFFF" size={avatarSize * 0.2} />
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  initials: {
    textAlign: "center",
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
