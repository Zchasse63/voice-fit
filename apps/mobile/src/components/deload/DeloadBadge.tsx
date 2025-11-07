/**
 * DeloadBadge Component
 * 
 * Displays a badge on Home screen when user is in a deload week.
 * Shows progress through the deload period.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Battery } from 'lucide-react-native';

interface DeloadBadgeProps {
  daysCompleted: number;
  totalDays: number;
}

export default function DeloadBadge({ daysCompleted, totalDays }: DeloadBadgeProps) {
  const { isDark } = useTheme();
  const progress = (daysCompleted / totalDays) * 100;

  return (
    <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <Battery color="#F9AC60" size={20} />
        <Text className="text-base font-bold text-orange-600 dark:text-orange-400 ml-2">
          Deload Week Active
        </Text>
      </View>

      {/* Description */}
      <Text className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Recovery week - reduced volume, maintained intensity
      </Text>

      {/* Progress Bar */}
      <View className="mb-2">
        <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
          <View
            className="h-2 rounded-full bg-orange-500"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Progress Text */}
      <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Day {daysCompleted} of {totalDays}
      </Text>
    </View>
  );
}

