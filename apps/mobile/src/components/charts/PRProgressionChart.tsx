/**
 * PRProgressionChart Component
 * 
 * Displays PR progression over time for a specific exercise
 * Features line chart with weight progression and date formatting
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

interface PRDataPoint {
  date: string; // ISO date string
  weight: number; // Weight in lbs
  reps: number; // Number of reps
}

interface PRProgressionChartProps {
  data: PRDataPoint[];
  exerciseName: string;
}

export default function PRProgressionChart({ data, exerciseName }: PRProgressionChartProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const { state, isActive } = useChartPressState({ x: 0, y: { weight: 0 } });

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for Victory Native XL
  const chartData = data.map((point) => ({
    x: new Date(point.date).getTime(),
    weight: point.weight,
  }));

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        marginBottom: tokens.spacing.md,
        backgroundColor: colors.background.secondary,
        ...tokens.shadows.lg,
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          marginBottom: tokens.spacing.md,
          color: colors.text.primary,
        }}
      >
        {exerciseName} Progression
      </Text>

      {data.length === 0 ? (
        <View
          style={{
            height: 192,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            No PR data available
          </Text>
        </View>
      ) : (
        <View style={{ height: 192 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['weight']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.weight}
                  color={accentColors.orange}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.weight.position}
                    r={8}
                    color={accentColors.orange}
                    opacity={0.8}
                  />
                )}
              </>
            )}
          </CartesianChart>

          {/* Display current value on press */}
          {isActive && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.xs,
                  borderRadius: tokens.borderRadius.md,
                  backgroundColor: colors.background.tertiary,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: accentColors.orange,
                  }}
                >
                  {(state.y.weight as any).value} lbs
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {formatDate(new Date((state.x as any).value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: tokens.spacing.md,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              marginRight: tokens.spacing.xs,
              backgroundColor: accentColors.orange,
            }}
          />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Max Weight (lbs)
          </Text>
        </View>
      )}
    </View>
  );
}

