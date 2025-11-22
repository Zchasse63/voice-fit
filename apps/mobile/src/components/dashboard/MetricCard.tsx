import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  variant?: 'default' | 'compact';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  trendValue,
  onPress,
  variant = 'default',
}: MetricCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const borderColor = isDark ? tokens.borders.primary.colorDark : tokens.borders.primary.colorLight;

  const getTrendColor = () => {
    if (!trend) return colors.text.secondary;
    switch (trend) {
      case 'up':
        return colors.accent.green;
      case 'down':
        return colors.accent.coral;
      default:
        return colors.text.secondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return '';
    return trend === 'up' ? '↑' : '↓';
  };

  const content = (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: variant === 'compact' ? tokens.spacing.md : tokens.spacing.lg,
        height: variant === 'compact' ? 140 : 120,
        ...tokens.shadows.md,
        borderWidth: tokens.borders.primary.width,
        borderColor,
      }}
    >
      {/* Header with Icon and Chevron */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: tokens.typography.fontWeight.semibold,
              marginBottom: tokens.spacing.xs,
            }}
          >
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
          {Icon && (
            <Icon
              color={iconColor || colors.accent.blue}
              size={20}
              strokeWidth={2}
            />
          )}
          {onPress && <ChevronRight size={20} color={colors.text.tertiary} />}
        </View>
      </View>

      {/* Value */}
      <Text
        style={{
          fontSize: variant === 'compact' ? tokens.typography.fontSize.xl : tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: tokens.spacing.xs,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>

      {/* Subtitle or Trend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
        {trendValue && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: getTrendColor(),
            }}
          >
            {getTrendIcon()} {trendValue}
          </Text>
        )}
        {subtitle && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.tertiary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
