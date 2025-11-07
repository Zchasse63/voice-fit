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
import { Circle, useFont } from '@shopify/react-native-skia';

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
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        {title}
      </Text>

      {data.length === 0 ? (
        <View className="h-48 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No volume data available
          </Text>
        </View>
      ) : (
        <View className="h-48">
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['volume']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points, chartBounds }) => (
              <>
                <Line
                  points={points.volume}
                  color={isDark ? '#4A9B6F' : '#2C5F3D'}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.volume.position}
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
                  {formatVolume(state.y.volume.value)} lbs
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View className="flex-row items-center justify-center mt-4">
          <View className={`w-3 h-3 rounded-full mr-2 ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`} />
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Volume (lbs)
          </Text>
        </View>
      )}
    </View>
  );
}

