/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator with optional message
 * Uses theme-aware colors for light and dark modes
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

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
  const { isDark } = useTheme();

  const containerClass = fullScreen
    ? `flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-background-light'}`
    : 'items-center justify-center p-8';

  return (
    <View className={containerClass}>
      <ActivityIndicator 
        size={size} 
        color={isDark ? '#4A9B6F' : '#2C5F3D'} 
      />
      {message && (
        <Text className={`text-base mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </Text>
      )}
    </View>
  );
}

