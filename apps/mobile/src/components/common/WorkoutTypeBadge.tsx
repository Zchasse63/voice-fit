/**
 * WorkoutTypeBadge Component
 * 
 * Displays a colored badge with icon and label for workout type (Push/Pull/Legs/etc).
 * Used in workout cards to quickly identify workout category.
 * 
 * Usage:
 * <WorkoutTypeBadge workoutName="Push Day" />
 * <WorkoutTypeBadge workoutName="Leg Day" size="small" />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getWorkoutTypeIcon } from '../../utils/workoutTypeIcons';
import tokens from '../../theme/tokens';

interface WorkoutTypeBadgeProps {
  workoutName: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function WorkoutTypeBadge({
  workoutName,
  size = 'medium',
  showLabel = true,
  style,
}: WorkoutTypeBadgeProps) {
  const { Icon, color, label } = getWorkoutTypeIcon(workoutName);

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 14,
      fontSize: tokens.typography.fontSize.xs,
      padding: 4,
      gap: 4,
    },
    medium: {
      iconSize: 16,
      fontSize: tokens.typography.fontSize.sm,
      padding: 6,
      gap: 6,
    },
    large: {
      iconSize: 20,
      fontSize: tokens.typography.fontSize.base,
      padding: 8,
      gap: 8,
    },
  };

  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${color}15`, // 15% opacity
          borderColor: color,
          paddingHorizontal: config.padding * 1.5,
          paddingVertical: config.padding,
          gap: config.gap,
        },
        style,
      ]}
    >
      <Icon color={color} size={config.iconSize} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: color,
              fontSize: config.fontSize,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
  },
  label: {
    fontFamily: tokens.typography.fontFamily.system,
    fontWeight: '600',
  },
});

