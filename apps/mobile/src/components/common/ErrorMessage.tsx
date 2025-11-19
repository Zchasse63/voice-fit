/**
 * ErrorMessage Component
 * 
 * User-friendly error display with retry option
 * Uses theme-aware colors for light and dark modes
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  message,
  onRetry,
  fullScreen = false
}: ErrorMessageProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const containerStyle = fullScreen
    ? {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: colors.background.primary,
      }
    : {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      };

  return (
    <View style={containerStyle}>
      <AlertCircle
        color={isDark ? '#F87171' : '#DC2626'} 
        size={48} 
      />
      <Text
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: tokens.typography.fontSize.base,
          color: colors.text.secondary,
        }}
      >
        {message}
      </Text>

      {onRetry && (
        <Pressable
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            minHeight: 60,
            borderRadius: tokens.borderRadius.xl,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent.blue,
          }}
          onPress={onRetry}
          accessibilityLabel="Retry"
          accessibilityHint="Attempts to reload the data"
          accessibilityRole="button"
        >
          <RefreshCw color="white" size={20} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.bold,
              color: '#FFFFFF',
            }}
          >
            Try Again
          </Text>
        </Pressable>
      )}
    </View>
  );
}

