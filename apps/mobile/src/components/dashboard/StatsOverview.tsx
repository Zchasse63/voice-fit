import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

interface StatsOverviewProps {
  stats: StatItem[];
  title?: string;
  variant?: 'grid' | 'row';
}

export default function StatsOverview({
  stats,
  title,
  variant = 'grid',
}: StatsOverviewProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  if (variant === 'row') {
    return (
      <View>
        {title && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.md,
            }}
          >
            {title}
          </Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: tokens.spacing.md }}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.lg,
                minWidth: 140,
                ...tokens.shadows.sm,
                borderWidth: tokens.borders.primary.width,
                borderColor: isDark ? tokens.borders.primary.colorDark : tokens.borders.primary.colorLight,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginBottom: tokens.spacing.xs,
                }}
              >
                {stat.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: stat.color || colors.text.primary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {stat.value}
                </Text>
                {stat.unit && (
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.tertiary,
                      marginLeft: tokens.spacing.xs,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {stat.unit}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Grid variant
  return (
    <View>
      {title && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: tokens.spacing.md,
          }}
        >
          {title}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.md,
        }}
      >
        {stats.map((stat, index) => (
          <View
            key={index}
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing.lg,
              flex: 1,
              minWidth: '45%',
              ...tokens.shadows.sm,
              borderWidth: tokens.borders.primary.width,
              borderColor: isDark ? tokens.borders.primary.colorDark : tokens.borders.primary.colorLight,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              {stat.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize['2xl'],
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: stat.color || colors.text.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {stat.value}
              </Text>
              {stat.unit && (
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.tertiary,
                    marginLeft: tokens.spacing.xs,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {stat.unit}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
