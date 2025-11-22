/**
 * ReadinessTrendChart Component
 *
 * Displays 7-day readiness trend using Victory Native XL (Premium feature).
 * Shows readiness score progression over time with interactive tooltips and 7-day average.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, ReadinessDataPoint } from '../../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

const ReadinessTrendChart = React.memo(function ReadinessTrendChart() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<ReadinessDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state, isActive } = useChartPressState({ x: 0, y: { score: 0 } });

  useEffect(() => {
    loadReadinessTrend();
  }, [user]);

  const loadReadinessTrend = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const readinessData = await chartDataService.getReadinessTrend(user.id);
      setData(readinessData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load readiness trend:', error);
      setIsLoading(false);
    }
  };

  // Calculate 7-day average
  const averageScore = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, point) => sum + point.compositeScore, 0);
    return Math.round(total / data.length);
  }, [data]);

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for Victory Native XL
  const chartData = useMemo(() => {
    return data.map((point) => ({
      x: new Date(point.date).getTime(),
      score: point.compositeScore,
    }));
  }, [data]);

  // Determine readiness status color (score-based, using token accent colors)
  const getStatusColor = (score: number) => {
    if (score >= 70) return accentColors.green; // Good
    if (score >= 50) return accentColors.orange; // Moderate
    return accentColors.red; // Low
  };

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
          7-Day Readiness Trend
        </Text>
        <View
          style={{
            height: 192,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="small" color={accentColors.green} />
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
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          7-Day Readiness Trend
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: accentColors.blue,
            }}
          >
            {averageScore}%
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Average
          </Text>
        </View>
      </View>

      {/* Chart */}
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
            No readiness data yet. Check in daily to see your trend!
          </Text>
        </View>
      ) : (
        <View style={{ height: 192 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['score']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.score}
                  color={getStatusColor(averageScore)}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={(state.x as any).position}
                    cy={(state.y.score as any).position}
                    r={8}
                    color={getStatusColor((state.y.score as any).value)}
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
                    color: getStatusColor((state.y.score as any).value),
                  }}
                >
                  {Math.round((state.y.score as any).value)}% Readiness
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

      {/* 7-Day Average Summary */}
      {data.length > 0 && (
        <View
          style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: accentColors.blue,
            }}
          >
            7-Day Average: {averageScore}%
          </Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: tokens.spacing.xs }}>
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
              Good (70+)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: tokens.spacing.xs }}>
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
              Moderate (50-69)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: tokens.spacing.xs }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 9999,
                marginRight: tokens.spacing.xs,
                backgroundColor: accentColors.red,
              }}
            />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.secondary,
              }}
            >
              Low (&lt;50)
            </Text>
          </View>
        </View>
      )}

      {/* Premium Badge */}
      <View
        style={{
          marginTop: tokens.spacing.md,
          paddingTop: tokens.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            textAlign: 'center',
            color: colors.text.tertiary,
          }}
        >
          ⭐ Premium Feature
        </Text>
      </View>
    </View>
  );
});

export default ReadinessTrendChart;

