/**
 * PRProgressionChart Component
 * 
 * Displays PR progression over time for a specific exercise
 * Features line chart with weight progression and date formatting
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

interface PRDataPoint {
  date: string; // ISO date string
  weight: number; // Weight in lbs
  reps: number; // Number of reps
}

interface PRProgressionChartProps {
  data: PRDataPoint[];
  exerciseName: string;
}

export default function PRProgressionChart({ data, exerciseName }: PRProgressionChartProps) {
  const { isDark } = useTheme();
  const { state, isActive } = useChartPressState({ x: 0, y: { weight: 0 } });

  // Format date for display (e.g., "2025-11-03" -> "Nov 3")
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for Victory Native XL
  const chartData = data.map((point) => ({
    x: new Date(point.date).getTime(),
    weight: point.weight,
  }));

  return (
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        {exerciseName} Progression
      </Text>

      {data.length === 0 ? (
        <View className="h-48 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No PR data available
          </Text>
        </View>
      ) : (
        <View className="h-48">
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['weight']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.weight}
                  color={isDark ? '#F9AC60' : '#DD7B57'}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.weight.position}
                    r={8}
                    color={isDark ? '#F9AC60' : '#DD7B57'}
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
                <Text className={`text-sm font-bold ${isDark ? 'text-secondaryDark' : 'text-secondary-500'}`}>
                  {state.y.weight.value} lbs
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
          <View className={`w-3 h-3 rounded-full mr-2 ${isDark ? 'bg-secondaryDark' : 'bg-secondary-500'}`} />
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Max Weight (lbs)
          </Text>
        </View>
      )}
    </View>
  );
}

