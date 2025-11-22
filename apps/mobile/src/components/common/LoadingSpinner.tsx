/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator with optional message
 * Uses theme-aware colors for light and dark modes
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = 'Loading...',
  size = 'large',
  fullScreen = false
}: LoadingSpinnerProps) {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const containerStyle = fullScreen
    ? {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.primary,
      }
    : {
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.lg,
      };

  return (
    <View style={containerStyle as any}>
      <ActivityIndicator
        size={size}
        color={colors.accent.blue}
      />
      {message && (
        <Text
          style={{
            marginTop: tokens.spacing.sm,
            fontSize: tokens.typography.fontSize.base,
            color: colors.text.secondary,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

