/**
 * MuscleBalanceChart Component
 * 
 * Displays muscle group balance using a horizontal bar chart.
 * Shows percentage distribution of training volume across muscle groups.
 * Includes warnings for under-trained muscle groups (<10% of total volume).
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { chartDataService, MuscleGroupData } from '../../services/charts/ChartDataService';

// Color palette for muscle groups
const MUSCLE_COLORS = {
  Chest: '#3B82F6',    // Blue
  Back: '#10B981',     // Green
  Legs: '#F59E0B',     // Amber
  Shoulders: '#8B5CF6', // Purple
  Arms: '#EF4444',     // Red
  Core: '#06B6D4',     // Cyan
  Other: '#6B7280',    // Gray
};

const MuscleBalanceChart = React.memo(function MuscleBalanceChart() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<MuscleGroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMuscleBalanceData();
  }, [user]);

  const loadMuscleBalanceData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const muscleData = await chartDataService.getMuscleBalance(user.id);
      setData(muscleData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load muscle balance:', error);
      setIsLoading(false);
    }
  };

  // Check for imbalances (muscle groups with <10% of total volume)
  const hasImbalance = useMemo(() => {
    return data.some((d) => d.percentage < 10 && d.percentage > 0);
  }, [data]);

  // Get under-trained muscle groups
  const underTrainedGroups = useMemo(() => {
    return data.filter((d) => d.percentage < 10 && d.percentage > 0);
  }, [data]);

  if (isLoading) {
    return (
      <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          Muscle Group Balance
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
        Muscle Group Balance
      </Text>
      <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Last 4 weeks of training distribution
      </Text>

      {data.length === 0 ? (
        <View className="h-64 items-center justify-center">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No muscle group data available. Start logging workouts to see your balance!
          </Text>
        </View>
      ) : (
        <View className="space-y-3">
          {data.map((muscleGroup, index) => {
            const color = MUSCLE_COLORS[muscleGroup.muscleGroup as keyof typeof MUSCLE_COLORS] || MUSCLE_COLORS.Other;
            const isUnderTrained = muscleGroup.percentage < 10 && muscleGroup.percentage > 0;

            return (
              <View key={index} className="space-y-1">
                {/* Muscle Group Label */}
                <View className="flex-row justify-between items-center">
                  <Text className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {muscleGroup.muscleGroup}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {muscleGroup.percentage.toFixed(1)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${muscleGroup.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </View>

                {/* Volume Info */}
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {Math.round(muscleGroup.volume).toLocaleString()} lbs total volume
                </Text>

                {/* Warning for under-trained */}
                {isUnderTrained && (
                  <View className="flex-row items-center mt-1">
                    <Text className="text-xs text-yellow-600">
                      ⚠️ Under-trained
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Imbalance Warning */}
      {hasImbalance && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
          <Text className={`text-sm font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
            ⚠️ Training Imbalance Detected
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
            {underTrainedGroups.map((g) => g.muscleGroup).join(', ')} {underTrainedGroups.length === 1 ? 'is' : 'are'} receiving less than 10% of your total training volume. Consider adding more exercises for balanced development.
          </Text>
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View className="mt-4 pt-4 border-t border-gray-700">
          <Text className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Muscle Groups
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {data.map((muscleGroup, index) => {
              const color = MUSCLE_COLORS[muscleGroup.muscleGroup as keyof typeof MUSCLE_COLORS] || MUSCLE_COLORS.Other;
              return (
                <View key={index} className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: color }}
                  />
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {muscleGroup.muscleGroup}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {data.length > 0 && !hasImbalance && (
        <View className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
          <Text className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-800'}`}>
            ✓ Well-Balanced Training
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            Your training volume is well-distributed across muscle groups. Keep up the great work!
          </Text>
        </View>
      )}
    </View>
  );
});

export default MuscleBalanceChart;

