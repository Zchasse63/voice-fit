/**
 * ErrorMessage Component
 * 
 * User-friendly error display with retry option
 * Uses theme-aware colors for light and dark modes
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
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

  const containerClass = fullScreen
    ? `flex-1 items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`
    : 'items-center justify-center p-6';

  return (
    <View className={containerClass}>
      <AlertCircle 
        color={isDark ? '#F87171' : '#DC2626'} 
        size={48} 
      />
      <Text className={`text-base text-center mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {message}
      </Text>
      
      {onRetry && (
        <Pressable
          className={`flex-row items-center mt-6 px-6 py-3 rounded-xl min-h-[60px] ${
            isDark ? 'bg-primaryDark' : 'bg-primary-500'
          }`}
          onPress={onRetry}
          accessibilityLabel="Retry"
          accessibilityHint="Attempts to reload the data"
          accessibilityRole="button"
        >
          <RefreshCw color="white" size={20} />
          <Text className="text-base font-bold text-white ml-2">
            Try Again
          </Text>
        </Pressable>
      )}
    </View>
  );
}

