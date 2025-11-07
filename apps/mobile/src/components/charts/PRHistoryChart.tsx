/**
 * PRHistoryChart Component
 * 
 * Displays PR history and predictions using Victory Native XL.
 * Shows historical 1RM data with linear regression predictions for 4, 8, and 12 weeks ahead.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
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
      <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          PR History & Predictions
        </Text>
        <View className="h-64 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
        </View>
      </View>
    );
  }

  return (
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        PR History & Predictions
      </Text>
      <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {exerciseName}
      </Text>

      {historicalData.length === 0 ? (
        <View className="h-64 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No PR data available for this exercise. Keep training to set your first PR!
          </Text>
        </View>
      ) : historicalData.length < 3 ? (
        <View className="h-64 items-center justify-center">
          <Text className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Need at least 3 PRs to generate predictions. Keep training!
          </Text>
          <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Current PRs: {historicalData.length}
          </Text>
        </View>
      ) : (
        <View className="h-64">
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
                  color={isDark ? '#3B82F6' : '#2563EB'}
                  strokeWidth={3}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />

                {/* Predictions - Dashed Line */}
                {predictionChartData.length > 0 && (
                  <Line
                    points={points.oneRM.slice(historicalChartData.length - 1)}
                    color={isDark ? '#10B981' : '#059669'}
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
                    color={isDark ? '#3B82F6' : '#2563EB'}
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
                <Text className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {Math.round(state.y.oneRM.value)} lbs
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(new Date(state.x.value).toISOString())}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* PR Improvement Stats */}
      {prImprovement && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Improvement
              </Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                +{prImprovement.improvement} lbs
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Percentage Gain
              </Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                +{prImprovement.percentage}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Prediction Summary */}
      {predictions.length > 0 && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
          <Text className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-800'}`}>
            📈 Predicted 1RM in 12 weeks
          </Text>
          <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            {predictions[2].estimated1RM} lbs
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            Based on your current progression rate
          </Text>
        </View>
      )}

      {/* Legend */}
      {historicalData.length > 0 && (
        <View className="flex-row items-center justify-center mt-4 space-x-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Historical PRs
            </Text>
          </View>
          {predictions.length > 0 && (
            <View className="flex-row items-center ml-4">
              <View className="w-3 h-3 rounded-full mr-2 bg-green-500" />
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

