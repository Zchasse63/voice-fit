/**
 * PRHistoryChart Component
 * 
 * Displays PR history and predictions using Victory Native XL.
 * Shows historical 1RM data with linear regression predictions for 4, 8, and 12 weeks ahead.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, PRDataPoint, PRPrediction } from '../../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

interface PRHistoryChartProps {
  exerciseId: string;
  exerciseName: string;
}

const PRHistoryChart = React.memo(function PRHistoryChart({ exerciseId, exerciseName }: PRHistoryChartProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  const [historicalData, setHistoricalData] = useState<PRDataPoint[]>([]);
  const [predictions, setPredictions] = useState<PRPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state, isActive } = useChartPressState({ x: 0, y: { oneRM: 0 } });

  useEffect(() => {
    loadPRHistory();
  }, [user, exerciseId]);

  const loadPRHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const prHistory = await chartDataService.getPRHistory(user.id, exerciseId);
      setHistoricalData(prHistory);

      // Calculate predictions
      const futurePRs = chartDataService.predictFuturePRs(prHistory);
      setPredictions(futurePRs);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load PR history:', error);
      setIsLoading(false);
    }
  };

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform historical data for Victory Native XL
  const historicalChartData = useMemo(() => {
    return historicalData.map((point) => ({
      x: new Date(point.date).getTime(),
      oneRM: point.estimated1RM,
    }));
  }, [historicalData]);

  // Transform prediction data for Victory Native XL
  const predictionChartData = useMemo(() => {
    return predictions.map((point) => ({
      x: new Date(point.date).getTime(),
      oneRM: point.estimated1RM,
    }));
  }, [predictions]);

  // Calculate PR improvement
  const prImprovement = useMemo(() => {
    if (historicalData.length < 2) return null;
    const first = historicalData[0].estimated1RM;
    const last = historicalData[historicalData.length - 1].estimated1RM;
    const improvement = last - first;
    const percentage = ((improvement / first) * 100).toFixed(1);
    return { improvement, percentage };
  }, [historicalData]);

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
          PR History & Predictions
        </Text>
        <View
          style={{
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={accentColors.blue} />
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
        PR History & Predictions
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          marginBottom: tokens.spacing.md,
          color: colors.text.secondary,
        }}
      >
        {exerciseName}
      </Text>

      {historicalData.length === 0 ? (
        <View
          style={{
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}
          >
            No PR data available for this exercise. Keep training to set your first PR!
          </Text>
        </View>
      ) : historicalData.length < 3 ? (
        <View
          style={{
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Need at least 3 PRs to generate predictions. Keep training!
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing.xs,
              color: colors.text.tertiary,
            }}
          >
            Current PRs: {historicalData.length}
          </Text>
        </View>
      ) : (
        <View style={{ height: 256 }}>
          <CartesianChart
            data={[...historicalChartData, ...predictionChartData]}
            xKey="x"
            yKeys={['oneRM']}
            domainPadding={{ left: 20, right: 20, top: 30, bottom: 20 }}
          >
            {({ points }) => (
              <>
                {/* Historical PRs - Solid Line */}
                <Line
                  points={points.oneRM.slice(0, historicalChartData.length)}
                  color={accentColors.blue}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />

                {/* Predictions - Dashed Line */}
                {predictionChartData.length > 0 && (
                  <Line
                    points={points.oneRM.slice(historicalChartData.length - 1)}
                    color={accentColors.green}
                    strokeWidth={3}
                    curveType="natural"
                    animate={{ type: 'timing', duration: 300 }}
                  />
                )}

                {/* Interactive Circle */}
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.oneRM.position}
                    r={8}
                    color={accentColors.blue}
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
                    color: accentColors.blue,
                  }}
                >
                  {Math.round(state.y.oneRM.value)} lbs
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* PR Improvement Stats */}
      {prImprovement && (
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
                Total Improvement
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: accentColors.blue,
                }}
              >
                +{prImprovement.improvement} lbs
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                Percentage Gain
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: accentColors.green,
                }}
              >
                +{prImprovement.percentage}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Prediction Summary */}
      {predictions.length > 0 && (
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
              fontWeight: tokens.typography.fontWeight.semibold,
              color: accentColors.green,
            }}
          >
            📈 Predicted 1RM in 12 weeks
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              marginTop: tokens.spacing.xs,
              color: accentColors.green,
            }}
          >
            {predictions[2].estimated1RM} lbs
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing.xs,
              color: colors.text.secondary,
            }}
          >
            Based on your current progression rate
          </Text>
        </View>
      )}

      {/* Legend */}
      {historicalData.length > 0 && (
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
                backgroundColor: accentColors.blue,
              }}
            />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.secondary,
              }}
            >
              Historical PRs
            </Text>
          </View>
          {predictions.length > 0 && (
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
                Predictions
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default PRHistoryChart;

