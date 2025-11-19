/**
 * DeloadBadge Component
 * 
 * Displays a badge on Home screen when user is in a deload week.
 * Shows progress through the deload period.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Battery } from 'lucide-react-native';

interface DeloadBadgeProps {
  daysCompleted: number;
  totalDays: number;
}

export default function DeloadBadge({ daysCompleted, totalDays }: DeloadBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const progress = (daysCompleted / totalDays) * 100;

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        marginBottom: tokens.spacing.md,
        backgroundColor: colors.backgroundSoft.warningAlt,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: tokens.spacing.xs,
        }}
      >
        <Battery color={colors.accent.orange} size={20} />
        <Text
          style={{
            marginLeft: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.accent.orange,
          }}
        >
          Deload Week Active
        </Text>
      </View>

      {/* Description */}
      <Text
        style={{
          marginBottom: tokens.spacing.sm,
          fontSize: tokens.typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        Recovery week - reduced volume, maintained intensity
      </Text>

      {/* Progress Bar */}
      <View
        style={{
          marginBottom: tokens.spacing.xs,
        }}
      >
        <View
          style={{
            height: 8,
            borderRadius: tokens.borderRadius.full,
            backgroundColor: isDark ? '#374151' : '#D1D5DB',
          }}
        >
          <View
            style={{
              height: 8,
              borderRadius: tokens.borderRadius.full,
              backgroundColor: colors.accent.orange,
              width: `${progress}%`,
            }}
          />
        </View>
      </View>

      {/* Progress Text */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.xs,
          color: colors.text.tertiary,
        }}
      >
        Day {daysCompleted} of {totalDays}
      </Text>
    </View>
  );
}

