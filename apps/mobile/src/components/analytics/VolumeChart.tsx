/**
 * Volume Chart Component
 *
 * Displays weekly volume trend as a line chart with muscle group breakdown.
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { VolumeTrend, VolumeByMuscle } from '../../services/api/AnalyticsAPIClient';
import { useTheme } from '../../hooks/useTheme';

interface VolumeChartProps {
  volumeTrend: VolumeTrend;
  volumeByMuscle: Record<string, VolumeByMuscle>;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ volumeTrend, volumeByMuscle }) => {
  const { isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Prepare data for chart
  const chartData = volumeTrend.weeks.map((week, index) => ({
    x: index + 1,
    y: week.total_sets,
    label: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Get trend color
  const getTrendColor = () => {
    switch (volumeTrend.trend) {
      case 'increasing':
        return '#10b981'; // green
      case 'decreasing':
        return '#ef4444'; // red
      case 'stable':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

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

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Volume Trend
        </Text>
        <View className="flex-row items-center">
          <Text
            className="text-sm font-semibold"
            style={{ color: getTrendColor() }}
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
            style={{
              axis: { stroke: isDark ? '#4b5563' : '#d1d5db' },
              tickLabels: { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 },
              grid: { stroke: isDark ? '#374151' : '#e5e7eb', strokeDasharray: '4,4' },
            }}
          />
          <VictoryLine
            data={chartData}
            style={{
              data: { stroke: getTrendColor(), strokeWidth: 3 },
            }}
            interpolation="natural"
          />
        </VictoryChart>
      ) : (
        <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No volume data available
          </Text>
        </View>
      )}

      {/* Average Weekly Sets */}
      <View className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Average Weekly Sets
        </Text>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {volumeTrend.avg_weekly_sets.toFixed(1)}
        </Text>
      </View>

      {/* Top Muscle Groups */}
      {sortedMuscles.length > 0 && (
        <View className="mt-4">
          <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Top Muscle Groups This Week
          </Text>
          {sortedMuscles.map(([muscle, data]) => (
            <View
              key={muscle}
              className={`flex-row justify-between items-center p-3 mb-2 rounded-xl ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <View className="flex-1">
                <Text className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {muscle}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {data.total_reps} total reps
                </Text>
              </View>
              <View className="items-end">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {data.sets}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

