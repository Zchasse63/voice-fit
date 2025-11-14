/**
 * ChatInput Component
 *
 * Clean chat input bar with send button.
 * Fixed at bottom of chat screen.
 */

import React from "react";
import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Send } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  loading = false,
}: ChatInputProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const handleSend = () => {
    if (value.trim() && !loading && !disabled) {
      onSend();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        editable={!disabled && !loading}
        multiline
        maxLength={1000}
        style={[
          styles.input,
          {
            flex: 1,
            fontSize: tokens.typography.fontSize.base,
            color: colors.text.primary,
            backgroundColor: colors.background.secondary,
            borderRadius: tokens.borderRadius.xl,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            maxHeight: 100,
          },
        ]}
      />

      <Pressable
        onPress={handleSend}
        disabled={!value.trim() || loading || disabled}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: value.trim() && !loading && !disabled
              ? colors.accent.blue
              : colors.background.secondary,
            opacity: pressed ? 0.8 : 1,
            marginLeft: tokens.spacing.sm,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Send
            size={20}
            color={value.trim() && !loading && !disabled ? "#FFFFFF" : colors.text.tertiary}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    // Dynamic styles applied inline
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
