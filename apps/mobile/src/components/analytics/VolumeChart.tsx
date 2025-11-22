/**
 * Volume Chart Component
 *
 * Displays weekly volume trend as a line chart with muscle group breakdown.
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { VolumeTrend as ApiVolumeTrend, VolumeByMuscle as ApiVolumeByMuscle } from '../../services/api/AnalyticsAPIClient';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

// Local interfaces to match usage, as API types seem to mismatch or are inaccessible
interface VolumeTrendData {
  weeks: {
    week_start: string;
    total_sets: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  avg_weekly_sets: number;
}

interface VolumeByMuscleData {
  sets: number;
  total_reps: number;
}

interface VolumeChartProps {
  volumeTrend: ApiVolumeTrend;
  volumeByMuscle: Record<string, ApiVolumeByMuscle>;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ volumeTrend: apiVolumeTrend, volumeByMuscle: apiVolumeByMuscle }) => {
  const { isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Cast to local types to resolve lint errors
  const volumeTrend = apiVolumeTrend as unknown as VolumeTrendData;
  const volumeByMuscle = apiVolumeByMuscle as unknown as Record<string, VolumeByMuscleData>;

  // Prepare data for chart
  const chartData = volumeTrend.weeks ? volumeTrend.weeks.map((week, index) => ({
    x: index + 1,
    y: week.total_sets,
    label: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })) : [];

  // Get trend color
  const getTrendColor = () => {
    switch (volumeTrend.trend) {
      case 'increasing':
        return tokens.colors.light.accent.green;
      case 'decreasing':
        return tokens.colors.light.accent.red;
      case 'stable':
        return tokens.colors.light.accent.blue;
      default:
        return tokens.colors.light.text.tertiary;
    }
  };

  const trendColor = getTrendColor();

  // Get trend text
  const getTrendText = () => {
    switch (volumeTrend.trend) {
      case 'increasing':
        return '↗ Increasing';
      case 'decreasing':
        return '↘ Decreasing';
      case 'stable':
        return '→ Stable';
      default:
        return 'Insufficient Data';
    }
  };

  // Sort muscle groups by sets (descending)
  const sortedMuscles = Object.entries(volumeByMuscle)
    .sort(([, a], [, b]) => b.sets - a.sets)
    .slice(0, 5); // Top 5 muscle groups

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <View
      style={{
        marginBottom: tokens.spacing.lg,
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
          Volume Trend
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: trendColor,
            }}
          >
            {getTrendText()}
          </Text>
        </View>
      </View>

      {/* Chart */}
      {chartData.length > 0 ? (
        <VictoryChart
          width={screenWidth - 48}
          height={220}
          theme={VictoryTheme.material}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
        >
          <Defs>
            <LinearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={trendColor} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={trendColor} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>
          <VictoryAxis
            tickValues={chartData.map((d) => d.x)}
            tickFormat={chartData.map((d) => d.label)}
            style={{
              axis: { stroke: colors.border.subtle },
              tickLabels: {
                fill: colors.text.tertiary,
                fontSize: 10,
                fontFamily: tokens.typography.fontFamily.system,
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: colors.border.subtle },
              tickLabels: {
                fill: colors.text.tertiary,
                fontSize: 10,
                fontFamily: tokens.typography.fontFamily.system,
              },
              grid: {
                stroke: isDark
                  ? tokens.colors.dark.border.subtle
                  : tokens.colors.light.border.subtle,
                strokeDasharray: '4,4',
              },
            }}
          />
          <VictoryArea
            data={chartData}
            style={{
              data: { fill: "url(#volumeGradient)" },
            }}
            interpolation="natural"
          />
          <VictoryLine
            data={chartData}
            style={{
              data: { stroke: trendColor, strokeWidth: 3 },
            }}
            interpolation="natural"
          />
        </VictoryChart>
      ) : (
        <View
          style={{
            padding: tokens.spacing.lg,
            borderRadius: tokens.borderRadius.xl,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            No volume data available
          </Text>
        </View>
      )}

      {/* Average Weekly Sets */}
      <View
        style={{
          marginTop: tokens.spacing.md,
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.xl,
          backgroundColor: colors.background.tertiary,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          Average Weekly Sets
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {volumeTrend.avg_weekly_sets ? volumeTrend.avg_weekly_sets.toFixed(1) : '0.0'}
        </Text>
      </View>

      {/* Top Muscle Groups */}
      {sortedMuscles.length > 0 && (
        <View style={{ marginTop: tokens.spacing.md }}>
          <Text
            style={{
              marginBottom: tokens.spacing.sm,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.secondary,
            }}
          >
            Top Muscle Groups This Week
          </Text>
          {sortedMuscles.map(([muscle, data]) => (
            <View
              key={muscle}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: tokens.spacing.sm,
                marginBottom: tokens.spacing.xs,
                borderRadius: tokens.borderRadius.xl,
                backgroundColor: colors.background.tertiary,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: tokens.typography.fontWeight.semibold,
                    textTransform: 'capitalize',
                    color: colors.text.primary,
                  }}
                >
                  {muscle}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {data.total_reps} total reps
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {data.sets}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  sets
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

