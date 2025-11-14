/**
 * Input Component
 *
 * Reusable input field component with validation, error states, and password toggle.
 * Follows MacroFactor design system with clean, minimal styling.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

interface InputProps {
  type?: "text" | "email" | "password" | "number";
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
}

export default function Input({
  type = "text",
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  autoCapitalize,
  autoComplete,
}: InputProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  // Get keyboard type based on input type
  const getKeyboardType = (): TextInputProps["keyboardType"] => {
    switch (type) {
      case "email":
        return "email-address";
      case "number":
        return "number-pad";
      default:
        return "default";
    }
  };

  // Get auto-capitalize behavior
  const getAutoCapitalize = (): TextInputProps["autoCapitalize"] => {
    if (autoCapitalize) return autoCapitalize;
    if (type === "email") return "none";
    return "sentences";
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: tokens.spacing.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            height: tokens.components.input.height,
            borderRadius: tokens.components.input.borderRadius,
            borderWidth: tokens.components.input.borderWidth,
            borderColor: error
              ? colors.accent.red
              : isFocused
              ? colors.accent.blue
              : colors.border.light,
            backgroundColor: colors.background.primary,
            paddingHorizontal: tokens.spacing.md,
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={{ marginRight: tokens.spacing.sm }}>{leftIcon}</View>
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={getKeyboardType()}
          autoCapitalize={getAutoCapitalize()}
          autoComplete={autoComplete}
          autoCorrect={type !== "email"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          style={[
            styles.input,
            {
              fontSize: tokens.typography.fontSize.base,
              color: colors.text.primary,
            },
          ]}
        />

        {/* Password Toggle */}
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconButton}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.text.tertiary} />
            ) : (
              <Eye size={20} color={colors.text.tertiary} />
            )}
          </Pressable>
        )}

        {/* Right Icon */}
        {rightIcon && !isPassword && (
          <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>
        )}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              fontSize: tokens.typography.fontSize.xs,
              color: error ? colors.accent.red : colors.text.tertiary,
              marginTop: tokens.spacing.xs,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    // Dynamic styles applied inline
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: "100%",
  },
  iconButton: {
    padding: tokens.spacing.xs,
  },
  helperText: {
    // Dynamic styles applied inline
  },
});
