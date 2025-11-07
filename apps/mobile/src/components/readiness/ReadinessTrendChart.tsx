/**
 * ReadinessTrendChart Component
 *
 * Displays 7-day readiness trend using Victory Native XL (Premium feature).
 * Shows readiness score progression over time with interactive tooltips and 7-day average.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, ReadinessDataPoint } from '../../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

const ReadinessTrendChart = React.memo(function ReadinessTrendChart() {
  const { isDark } = useTheme();
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

  // Determine readiness status color (score-based, not theme-based)
  const getStatusColor = (score: number) => {
    if (score >= 70) return '#4A9B6F'; // Green - Good
    if (score >= 50) return '#F9AC60'; // Orange - Moderate
    return '#FF6B6B'; // Red - Low
  };

  if (isLoading) {
    return (
      <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          7-Day Readiness Trend
        </Text>
        <View className="h-48 items-center justify-center">
          <ActivityIndicator size="small" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
        </View>
      </View>
    );
  }

  return (
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          7-Day Readiness Trend
        </Text>
        <View className="items-end">
          <Text className={`text-2xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
            {averageScore}%
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Average
          </Text>
        </View>
      </View>

      {/* Chart */}
      {data.length === 0 ? (
        <View className="h-48 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No readiness data yet. Check in daily to see your trend!
          </Text>
        </View>
      ) : (
        <View className="h-48">
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
                    cx={state.x.position}
                    cy={state.y.score.position}
                    r={8}
                    color={getStatusColor(state.y.score.value)}
                    opacity={0.8}
                  />
                )}
              </>
            )}
          </CartesianChart>

          {/* Display current value on press */}
          {isActive && (
            <View className="absolute top-0 left-0 right-0 items-center">
              <View className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text className={`text-sm font-bold`} style={{ color: getStatusColor(state.y.score.value) }}>
                  {Math.round(state.y.score.value)}% Readiness
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 7-Day Average Summary */}
      {data.length > 0 && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
          <Text className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
            7-Day Average: {averageScore}%
          </Text>
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View className="flex-row items-center justify-center mt-4 space-x-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-1 bg-[#2C5F3D]" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Good (70+)
            </Text>
          </View>
          <View className="flex-row items-center ml-3">
            <View className="w-3 h-3 rounded-full mr-1 bg-[#DD7B57]" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Moderate (50-69)
            </Text>
          </View>
          <View className="flex-row items-center ml-3">
            <View className="w-3 h-3 rounded-full mr-1 bg-[#DC2626]" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Low (&lt;50)
            </Text>
          </View>
        </View>
      )}

      {/* Premium Badge */}
      <View className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          ⭐ Premium Feature
        </Text>
      </View>
    </View>
  );
});

export default ReadinessTrendChart;

