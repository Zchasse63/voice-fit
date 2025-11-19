/**
 * VolumeTrendsChart Component
 * 
 * Displays weekly training volume trends using Victory Native XL.
 * Shows 12 weeks of aggregated tonnage data with interactive tooltips.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, VolumeDataPoint } from '../../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

const VolumeTrendsChart = React.memo(function VolumeTrendsChart() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<VolumeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state, isActive } = useChartPressState({ x: 0, y: { tonnage: 0 } });

  useEffect(() => {
    loadVolumeData();
  }, [user]);

  const loadVolumeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const volumeData = await chartDataService.getVolumeTrends(user.id);
      setData(volumeData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load volume trends:', error);
      setIsLoading(false);
    }
  };

  // Format volume for display (e.g., 12500 -> "12.5k")
  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return Math.round(volume).toString();
  };

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for Victory Native XL
  const chartData = useMemo(() => {
    return data.map((point) => ({
      x: new Date(point.week).getTime(),
      tonnage: point.tonnage,
    }));
  }, [data]);

  // Calculate average weekly volume
  const averageVolume = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, point) => sum + point.tonnage, 0);
    return Math.round(total / data.length);
  }, [data]);

  if (isLoading) {
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
            marginBottom: tokens.spacing.sm,
            color: colors.text.primary,
          }}
        >
          Weekly Volume Trends
        </Text>
        <View
          style={{
            height: 192,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={accentColors.green} />
        </View>
      </View>
    );
  }

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
          marginBottom: tokens.spacing.xs,
          color: colors.text.primary,
        }}
      >
        Weekly Volume Trends
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          marginBottom: tokens.spacing.md,
          color: colors.text.secondary,
        }}
      >
        Last 12 weeks of training volume
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
            No volume data available. Start logging workouts to see your trends!
          </Text>
        </View>
      ) : (
        <View style={{ height: 192 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['tonnage']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.tonnage}
                  color={accentColors.green}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.tonnage.position}
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
                  {formatVolume(state.y.tonnage.value)} lbs
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  Week of {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stats Summary */}
      {data.length > 0 && (
        <View
          style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                Average Weekly Volume
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: accentColors.green,
                }}
              >
                {formatVolume(averageVolume)} lbs
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                Last Week
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {formatVolume(data[data.length - 1].tonnage)} lbs
              </Text>
            </View>
          </View>
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
            Total Weekly Tonnage (lbs)
          </Text>
        </View>
      )}
    </View>
  );
});

export default VolumeTrendsChart;

