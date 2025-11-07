/**
 * VolumeTrendsChart Component
 * 
 * Displays weekly training volume trends using Victory Native XL.
 * Shows 12 weeks of aggregated tonnage data with interactive tooltips.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, VolumeDataPoint } from '../../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

const VolumeTrendsChart = React.memo(function VolumeTrendsChart() {
  const { isDark } = useTheme();
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
      <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          Weekly Volume Trends
        </Text>
        <View className="h-48 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
        </View>
      </View>
    );
  }

  return (
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        Weekly Volume Trends
      </Text>
      <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Last 12 weeks of training volume
      </Text>

      {data.length === 0 ? (
        <View className="h-48 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No volume data available. Start logging workouts to see your trends!
          </Text>
        </View>
      ) : (
        <View className="h-48">
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
                  color={isDark ? '#4A9B6F' : '#2C5F3D'}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.tonnage.position}
                    r={8}
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
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
                <Text className={`text-sm font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  {formatVolume(state.y.tonnage.value)} lbs
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Week of {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stats Summary */}
      {data.length > 0 && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Average Weekly Volume
              </Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                {formatVolume(averageVolume)} lbs
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Last Week
              </Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {formatVolume(data[data.length - 1].tonnage)} lbs
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View className="flex-row items-center justify-center mt-4">
          <View className={`w-3 h-3 rounded-full mr-2 ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`} />
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Weekly Tonnage (lbs)
          </Text>
        </View>
      )}
    </View>
  );
});

export default VolumeTrendsChart;

