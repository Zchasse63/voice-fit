/**
 * ChatBubble Component
 *
 * iOS Messages-style chat bubble for user and AI messages.
 * Blue for user, gray for AI, with proper spacing and timestamps.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  status?: "sending" | "sent" | "error";
}

export default function ChatBubble({
  message,
  isUser,
  timestamp,
  status,
}: ChatBubbleProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const bubbleColor = isUser
    ? colors.chat.userBubble
    : colors.chat.aiBubble;
  const textColor = isUser ? colors.chat.userText : colors.chat.aiText;

  const formatTime = () => {
    if (!timestamp) return "";
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          alignItems: isUser ? "flex-end" : "flex-start",
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderRadius: tokens.components.chat.bubbleBorderRadius,
            maxWidth: tokens.components.chat.bubbleMaxWidth,
            paddingHorizontal: tokens.components.chat.bubblePadding.horizontal,
            paddingVertical: tokens.components.chat.bubblePadding.vertical,
            borderTopRightRadius: isUser ? 4 : tokens.components.chat.bubbleBorderRadius,
            borderTopLeftRadius: isUser ? tokens.components.chat.bubbleBorderRadius : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              color: textColor,
              fontSize: tokens.typography.fontSize.base,
            },
          ]}
        >
          {message}
        </Text>
      </View>

      {timestamp && (
        <Text
          style={[
            styles.timestamp,
            {
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.tertiary,
              marginTop: tokens.spacing.xs,
              alignSelf: isUser ? "flex-end" : "flex-start",
            },
          ]}
        >
          {formatTime()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  bubble: {
    // Dynamic styles applied inline
  },
  message: {
    lineHeight: tokens.typography.lineHeight.normal * tokens.typography.fontSize.base,
  },
  timestamp: {
    // Dynamic styles applied inline
  },
});
