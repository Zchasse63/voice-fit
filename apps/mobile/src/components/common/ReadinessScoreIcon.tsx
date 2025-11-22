/**
 * ReadinessScoreIcon Component
 * 
 * Displays a color-coded battery icon based on readiness score (0-10).
 * Used in HomeScreen readiness card and other readiness displays.
 * 
 * Color Coding:
 * - Green (8-10): Excellent readiness
 * - Yellow (6-8): Moderate readiness
 * - Red (<6): Low readiness
 * 
 * Usage:
 * <ReadinessScoreIcon score={8.5} size={24} />
 * <ReadinessScoreIcon score={5.2} size={32} showLabel />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from 'lucide-react-native';
import tokens from '../../theme/tokens';

interface ReadinessScoreIconProps {
  score: number; // 0-10 scale
  size?: number;
  showLabel?: boolean;
  showScore?: boolean;
  style?: ViewStyle;
}

export default function ReadinessScoreIcon({
  score,
  size = 24,
  showLabel = false,
  showScore = false,
  style,
}: ReadinessScoreIconProps) {
  // Determine color and icon based on score
  const getReadinessData = (score: number) => {
    if (score >= 8) {
      return {
        Icon: BatteryFull,
        color: tokens.colors.accent.success, // Green
        label: 'Excellent',
        bgColor: `${tokens.colors.accent.success}15`,
      };
    } else if (score >= 6) {
      return {
        Icon: BatteryMedium,
        color: tokens.colors.accent.warning, // Yellow
        label: 'Moderate',
        bgColor: `${tokens.colors.accent.warning}15`,
      };
    } else if (score >= 4) {
      return {
        Icon: BatteryLow,
        color: tokens.colors.accent.error, // Red
        label: 'Low',
        bgColor: `${tokens.colors.accent.error}15`,
      };
    } else {
      return {
        Icon: BatteryWarning,
        color: tokens.colors.accent.error, // Red
        label: 'Very Low',
        bgColor: `${tokens.colors.accent.error}15`,
      };
    }
  };

  const { Icon, color, label, bgColor } = getReadinessData(score);

  if (!showLabel && !showScore) {
    // Icon only
    return <Icon color={color} size={size} style={style} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <Icon color={color} size={size} />
      {showScore && (
        <Text style={[styles.score, { color }]}>
          {score.toFixed(1)}
        </Text>
      )}
      {showLabel && (
        <Text style={[styles.label, { color }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

/**
 * ReadinessScoreBadge Component
 * 
 * Full badge with icon, score, and label.
 * Used for prominent readiness displays.
 * 
 * Usage:
 * <ReadinessScoreBadge score={8.5} />
 */

interface ReadinessScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function ReadinessScoreBadge({
  score,
  size = 'medium',
  style,
}: ReadinessScoreBadgeProps) {
  const sizeConfig = {
    small: {
      iconSize: 20,
      fontSize: tokens.typography.fontSize.sm,
      padding: 8,
    },
    medium: {
      iconSize: 24,
      fontSize: tokens.typography.fontSize.base,
      padding: 12,
    },
    large: {
      iconSize: 32,
      fontSize: tokens.typography.fontSize.lg,
      padding: 16,
    },
  };

  const config = sizeConfig[size];

  const getReadinessData = (score: number) => {
    if (score >= 8) {
      return {
        Icon: BatteryFull,
        color: tokens.colors.accent.success,
        label: 'Excellent',
        bgColor: `${tokens.colors.accent.success}15`,
      };
    } else if (score >= 6) {
      return {
        Icon: BatteryMedium,
        color: tokens.colors.accent.warning,
        label: 'Moderate',
        bgColor: `${tokens.colors.accent.warning}15`,
      };
    } else if (score >= 4) {
      return {
        Icon: BatteryLow,
        color: tokens.colors.accent.error,
        label: 'Low',
        bgColor: `${tokens.colors.accent.error}15`,
      };
    } else {
      return {
        Icon: BatteryWarning,
        color: tokens.colors.accent.error,
        label: 'Very Low',
        bgColor: `${tokens.colors.accent.error}15`,
      };
    }
  };

  const { Icon, color, label, bgColor } = getReadinessData(score);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          padding: config.padding,
        },
        style,
      ]}
    >
      <Icon color={color} size={config.iconSize} />
      <View style={styles.badgeText}>
        <Text style={[styles.badgeScore, { color, fontSize: config.fontSize }]}>
          {score.toFixed(1)}
        </Text>
        <Text style={[styles.badgeLabel, { color, fontSize: config.fontSize * 0.75 }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.borderRadius.md,
  },
  score: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  label: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: tokens.borderRadius.lg,
  },
  badgeText: {
    flexDirection: 'column',
  },
  badgeScore: {
    fontFamily: tokens.typography.fontFamily.system,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  badgeLabel: {
    fontFamily: tokens.typography.fontFamily.system,
    fontWeight: tokens.typography.fontWeight.medium,
  },
});

