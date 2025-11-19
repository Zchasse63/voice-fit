/**
 * Fatigue Chart Component
 *
 * Displays fatigue history as a line chart with current fatigue indicators.
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import { FatigueHistory, CurrentFatigue } from '../../services/api/AnalyticsAPIClient';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../hooks/useTheme';

interface FatigueChartProps {
  fatigueHistory: FatigueHistory;
  currentFatigue: CurrentFatigue;
}

export const FatigueChart: React.FC<FatigueChartProps> = ({ fatigueHistory, currentFatigue }) => {
  const { isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Prepare data for chart
  const chartData = fatigueHistory.weeks.map((week, index) => ({
    x: index + 1,
    y: week.fatigue_score,
    label: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Get fatigue level color
  const getFatigueLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return accentColors.green;
      case 'moderate':
        return accentColors.orange;
      case 'high':
        return accentColors.orange;
      case 'very_high':
        return accentColors.red;
      default:
        return colors.text.tertiary;
    }
  };

  // Get fatigue level emoji
  const getFatigueLevelEmoji = (level: string) => {
    switch (level) {
      case 'low':
        return '😊';
      case 'moderate':
        return '😐';
      case 'high':
        return '😓';
      case 'very_high':
        return '😵';
      default:
        return '❓';
    }
  };

  // Get recovery recommendation text
  const getRecoveryText = (recommendation: string) => {
    switch (recommendation) {
      case 'continue':
        return 'Continue Training';
      case 'reduce_volume':
        return 'Reduce Volume';
      case 'deload':
        return 'Take Deload Week';
      case 'rest':
        return 'Take Rest Day';
      default:
        return 'Unknown';
    }
  };

  // Get recovery recommendation color
  const getRecoveryColor = (recommendation: string) => {
    switch (recommendation) {
      case 'continue':
        return accentColors.green;
      case 'reduce_volume':
        return accentColors.orange;
      case 'deload':
        return accentColors.orange;
      case 'rest':
        return accentColors.red;
      default:
        return colors.text.tertiary;
    }
  };

  // Get indicator status color
  const getIndicatorColor = (indicator: string, value: string) => {
    if (indicator === 'readiness_trend') {
      if (value === 'improving') return accentColors.green;
      if (value === 'declining') return accentColors.red;
      return accentColors.orange;
    }
    if (indicator === 'rpe_trend') {
      if (value === 'decreasing') return accentColors.green;
      if (value === 'increasing') return accentColors.red;
      return accentColors.orange;
    }
    if (indicator === 'volume_status') {
      if (value === 'normal') return accentColors.green;
      if (value === 'very_high') return accentColors.red;
      return accentColors.orange;
    }
    if (indicator === 'sleep_quality') {
      if (value === 'good') return accentColors.green;
      if (value === 'poor') return accentColors.red;
      return accentColors.orange;
    }
    if (indicator === 'soreness_level') {
      if (value === 'low') return accentColors.green;
      if (value === 'high') return accentColors.red;
      return accentColors.orange;
    }
    return colors.text.tertiary;
  };

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;

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
          Fatigue Trend
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, marginRight: tokens.spacing.xs }}>
            {getFatigueLevelEmoji(currentFatigue.fatigue_level)}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getFatigueLevelColor(currentFatigue.fatigue_level),
            }}
          >
            {currentFatigue.fatigue_level}
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
          <VictoryAxis
            tickValues={chartData.map((d) => d.x)}
            tickFormat={chartData.map((d) => d.label)}
            style={{
              axis: { stroke: colors.border.subtle },
              tickLabels: {
                fill: colors.text.tertiary,
                fontSize: 10,
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            domain={[0, 100]}
            style={{
              axis: { stroke: colors.border.subtle },
              tickLabels: {
                fill: colors.text.tertiary,
                fontSize: 10,
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
              data: {
                fill: `${getFatigueLevelColor(currentFatigue.fatigue_level)}30`,
                stroke: getFatigueLevelColor(currentFatigue.fatigue_level),
                strokeWidth: 3,
              },
            }}
            interpolation="natural"
          />
        </VictoryChart>
      ) : (
        <View
          style={{
            padding: tokens.spacing.lg,
            borderRadius: tokens.borderRadius['2xl'],
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
            No fatigue data available
          </Text>
        </View>
      )}

      {/* Current Fatigue Score */}
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
          Current Fatigue Score
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: getFatigueLevelColor(currentFatigue.fatigue_level),
          }}
        >
          {currentFatigue.fatigue_score.toFixed(0)}/100
        </Text>
      </View>

      {/* Recovery Recommendation */}
      <View
        style={{
          marginTop: tokens.spacing.md,
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.xl,
          backgroundColor: `${getRecoveryColor(currentFatigue.recovery_recommendation)}20`,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          Recovery Recommendation
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: getRecoveryColor(currentFatigue.recovery_recommendation),
          }}
        >
          {getRecoveryText(currentFatigue.recovery_recommendation)}
        </Text>
        <Text
          style={{
            marginTop: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.secondary,
          }}
        >
          Estimated recovery: {currentFatigue.days_until_recovery} day
          {currentFatigue.days_until_recovery !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Fatigue Indicators */}
      <View style={{ marginTop: tokens.spacing.md }}>
        <Text
          style={{
            marginBottom: tokens.spacing.sm,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.secondary,
          }}
        >
          Fatigue Indicators
        </Text>

        {/* Readiness Trend */}
        <View
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
          <Text
            style={{
              color: colors.text.primary,
            }}
          >
            Readiness Trend
          </Text>
          <Text
            style={{
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getIndicatorColor(
                'readiness_trend',
                currentFatigue.indicators.readiness_trend,
              ),
            }}
          >
            {currentFatigue.indicators.readiness_trend}
          </Text>
        </View>

        {/* RPE Trend */}
        <View
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
          <Text
            style={{
              color: colors.text.primary,
            }}
          >
            RPE Trend
          </Text>
          <Text
            style={{
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getIndicatorColor('rpe_trend', currentFatigue.indicators.rpe_trend),
            }}
          >
            {currentFatigue.indicators.rpe_trend}
          </Text>
        </View>

        {/* Volume Status */}
        <View
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
          <Text
            style={{
              color: colors.text.primary,
            }}
          >
            Volume Status
          </Text>
          <Text
            style={{
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getIndicatorColor(
                'volume_status',
                currentFatigue.indicators.volume_status,
              ),
            }}
          >
            {currentFatigue.indicators.volume_status.replace('_', ' ')}
          </Text>
        </View>

        {/* Sleep Quality */}
        <View
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
          <Text
            style={{
              color: colors.text.primary,
            }}
          >
            Sleep Quality
          </Text>
          <Text
            style={{
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getIndicatorColor(
                'sleep_quality',
                currentFatigue.indicators.sleep_quality,
              ),
            }}
          >
            {currentFatigue.indicators.sleep_quality}
          </Text>
        </View>

        {/* Soreness Level */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.xl,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              color: colors.text.primary,
            }}
          >
            Soreness Level
          </Text>
          <Text
            style={{
              fontWeight: tokens.typography.fontWeight.semibold,
              textTransform: 'capitalize',
              color: getIndicatorColor(
                'soreness_level',
                currentFatigue.indicators.soreness_level,
              ),
            }}
          >
            {currentFatigue.indicators.soreness_level}
          </Text>
        </View>
      </View>
    </View>
  );
};

