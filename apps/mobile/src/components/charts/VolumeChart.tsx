/**
 * VolumeChart Component
 * 
 * Displays weekly training volume using Victory Native XL
 * Features line chart with date formatting and volume scaling
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { tokens } from '../../theme/tokens';

interface VolumeDataPoint {
  date: string; // ISO date string
  volume: number; // Total volume in lbs
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  title?: string;
}

export default function VolumeChart({ data, title = 'Weekly Volume' }: VolumeChartProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const { state, isActive } = useChartPressState({ x: 0, y: { volume: 0 } });

  // Format volume for display (e.g., 12500 -> "12.5k")
  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for Victory Native XL
  const chartData = data.map((point) => ({
    x: new Date(point.date).getTime(),
    volume: point.volume,
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
        {title}
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
            No volume data available
          </Text>
        </View>
      ) : (
        <View style={{ height: 192 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['volume']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.volume}
                  color={accentColors.green}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.volume.position}
                    r={8}
                    color={accentColors.green}
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
                    color: accentColors.green,
                  }}
                >
                  {formatVolume((state.y.volume as any).value)} lbs
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
              backgroundColor: accentColors.green,
            }}
          />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Total Volume (lbs)
          </Text>
        </View>
      )}
    </View>
  );
}

