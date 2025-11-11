/**
 * Fatigue Chart Component
 *
 * Displays fatigue history as a line chart with current fatigue indicators.
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import { FatigueHistory, CurrentFatigue } from '../../services/api/AnalyticsAPIClient';
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
        return '#10b981'; // green
      case 'moderate':
        return '#f59e0b'; // yellow
      case 'high':
        return '#f97316'; // orange
      case 'very_high':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
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
        return '#10b981'; // green
      case 'reduce_volume':
        return '#f59e0b'; // yellow
      case 'deload':
        return '#f97316'; // orange
      case 'rest':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  // Get indicator status color
  const getIndicatorColor = (indicator: string, value: string) => {
    if (indicator === 'readiness_trend') {
      if (value === 'improving') return '#10b981';
      if (value === 'declining') return '#ef4444';
      return '#f59e0b';
    }
    if (indicator === 'rpe_trend') {
      if (value === 'decreasing') return '#10b981';
      if (value === 'increasing') return '#ef4444';
      return '#f59e0b';
    }
    if (indicator === 'volume_status') {
      if (value === 'normal') return '#10b981';
      if (value === 'very_high') return '#ef4444';
      return '#f59e0b';
    }
    if (indicator === 'sleep_quality') {
      if (value === 'good') return '#10b981';
      if (value === 'poor') return '#ef4444';
      return '#f59e0b';
    }
    if (indicator === 'soreness_level') {
      if (value === 'low') return '#10b981';
      if (value === 'high') return '#ef4444';
      return '#f59e0b';
    }
    return '#6b7280';
  };

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Fatigue Trend
        </Text>
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">
            {getFatigueLevelEmoji(currentFatigue.fatigue_level)}
          </Text>
          <Text
            className="text-sm font-semibold capitalize"
            style={{ color: getFatigueLevelColor(currentFatigue.fatigue_level) }}
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
              axis: { stroke: isDark ? '#4b5563' : '#d1d5db' },
              tickLabels: { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 },
            }}
          />
          <VictoryAxis
            dependentAxis
            domain={[0, 100]}
            style={{
              axis: { stroke: isDark ? '#4b5563' : '#d1d5db' },
              tickLabels: { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 },
              grid: { stroke: isDark ? '#374151' : '#e5e7eb', strokeDasharray: '4,4' },
            }}
          />
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: getFatigueLevelColor(currentFatigue.fatigue_level) + '30',
                stroke: getFatigueLevelColor(currentFatigue.fatigue_level),
                strokeWidth: 3,
              },
            }}
            interpolation="natural"
          />
        </VictoryChart>
      ) : (
        <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No fatigue data available
          </Text>
        </View>
      )}

      {/* Current Fatigue Score */}
      <View className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Current Fatigue Score
        </Text>
        <Text
          className="text-2xl font-bold"
          style={{ color: getFatigueLevelColor(currentFatigue.fatigue_level) }}
        >
          {currentFatigue.fatigue_score.toFixed(0)}/100
        </Text>
      </View>

      {/* Recovery Recommendation */}
      <View
        className="mt-4 p-4 rounded-xl"
        style={{ backgroundColor: getRecoveryColor(currentFatigue.recovery_recommendation) + '20' }}
      >
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Recovery Recommendation
        </Text>
        <Text
          className="text-lg font-bold"
          style={{ color: getRecoveryColor(currentFatigue.recovery_recommendation) }}
        >
          {getRecoveryText(currentFatigue.recovery_recommendation)}
        </Text>
        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Estimated recovery: {currentFatigue.days_until_recovery} day{currentFatigue.days_until_recovery !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Fatigue Indicators */}
      <View className="mt-4">
        <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Fatigue Indicators
        </Text>
        
        {/* Readiness Trend */}
        <View className={`flex-row justify-between items-center p-3 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Readiness Trend</Text>
          <Text
            className="font-semibold capitalize"
            style={{ color: getIndicatorColor('readiness_trend', currentFatigue.indicators.readiness_trend) }}
          >
            {currentFatigue.indicators.readiness_trend}
          </Text>
        </View>

        {/* RPE Trend */}
        <View className={`flex-row justify-between items-center p-3 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>RPE Trend</Text>
          <Text
            className="font-semibold capitalize"
            style={{ color: getIndicatorColor('rpe_trend', currentFatigue.indicators.rpe_trend) }}
          >
            {currentFatigue.indicators.rpe_trend}
          </Text>
        </View>

        {/* Volume Status */}
        <View className={`flex-row justify-between items-center p-3 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Volume Status</Text>
          <Text
            className="font-semibold capitalize"
            style={{ color: getIndicatorColor('volume_status', currentFatigue.indicators.volume_status) }}
          >
            {currentFatigue.indicators.volume_status.replace('_', ' ')}
          </Text>
        </View>

        {/* Sleep Quality */}
        <View className={`flex-row justify-between items-center p-3 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Sleep Quality</Text>
          <Text
            className="font-semibold capitalize"
            style={{ color: getIndicatorColor('sleep_quality', currentFatigue.indicators.sleep_quality) }}
          >
            {currentFatigue.indicators.sleep_quality}
          </Text>
        </View>

        {/* Soreness Level */}
        <View className={`flex-row justify-between items-center p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Soreness Level</Text>
          <Text
            className="font-semibold capitalize"
            style={{ color: getIndicatorColor('soreness_level', currentFatigue.indicators.soreness_level) }}
          >
            {currentFatigue.indicators.soreness_level}
          </Text>
        </View>
      </View>
    </View>
  );
};

