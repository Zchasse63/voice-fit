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
import { tokens } from '../../theme/tokens';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
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
      <View
        style={{
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.lg,
          marginBottom: tokens.spacing.md,
          backgroundColor: colors.background.secondary,
          ...tokens.shadows.lg,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            marginBottom: tokens.spacing.sm,
            color: colors.text.primary,
          }}
        >
          Muscle Group Balance
        </Text>
        <View
          style={{
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={accentColors.green} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        marginBottom: tokens.spacing.md,
        backgroundColor: colors.background.secondary,
        ...tokens.shadows.lg,
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          marginBottom: tokens.spacing.xs,
          color: colors.text.primary,
        }}
      >
        Muscle Group Balance
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          marginBottom: tokens.spacing.md,
          color: colors.text.secondary,
        }}
      >
        Last 4 weeks of training distribution
      </Text>

      {data.length === 0 ? (
        <View
          style={{
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}
          >
            No muscle group data available. Start logging workouts to see your balance!
          </Text>
        </View>
      ) : (
        <View style={{ rowGap: tokens.spacing.sm }}>
          {data.map((muscleGroup, index) => {
            const color = MUSCLE_COLORS[muscleGroup.muscleGroup as keyof typeof MUSCLE_COLORS] || MUSCLE_COLORS.Other;
            const isUnderTrained = muscleGroup.percentage < 10 && muscleGroup.percentage > 0;

            return (
              <View key={index} style={{ rowGap: tokens.spacing.xs }}>
                {/* Muscle Group Label */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: colors.text.primary,
                    }}
                  >
                    {muscleGroup.muscleGroup}
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    {muscleGroup.percentage.toFixed(1)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View
                  style={{
                    height: 12,
                    borderRadius: tokens.borderRadius.full,
                    overflow: 'hidden',
                    backgroundColor: colors.background.tertiary,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      borderRadius: tokens.borderRadius.full,
                      width: `${muscleGroup.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </View>

                {/* Volume Info */}
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {Math.round(muscleGroup.volume).toLocaleString()} lbs total volume
                </Text>

                {/* Warning for under-trained */}
                {isUnderTrained && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: tokens.spacing.xs }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: accentColors.orange,
                      }}
                    >
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
        <View
          style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: accentColors.orange,
            }}
          >
            ⚠️ Training Imbalance Detected
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing.xs,
              color: colors.text.secondary,
            }}
          >
            {underTrainedGroups.map((g) => g.muscleGroup).join(', ')}{' '}
            {underTrainedGroups.length === 1 ? 'is' : 'are'} receiving less than 10% of your total
            training volume. Consider adding more exercises for balanced development.
          </Text>
        </View>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <View
          style={{
            marginTop: tokens.spacing.lg,
            paddingTop: tokens.spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              marginBottom: tokens.spacing.xs,
              color: colors.text.secondary,
            }}
          >
            Muscle Groups
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: tokens.spacing.sm,
              rowGap: tokens.spacing.xs,
            }}
          >
            {data.map((muscleGroup, index) => {
              const color = MUSCLE_COLORS[muscleGroup.muscleGroup as keyof typeof MUSCLE_COLORS] || MUSCLE_COLORS.Other;
              return (
                <View
                  key={index}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 9999,
                      marginRight: tokens.spacing.xs,
                      backgroundColor: color,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}
                  >
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
        <View
          style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: accentColors.green,
            }}
          >
            ✓ Well-Balanced Training
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing.xs,
              color: colors.text.secondary,
            }}
          >
            Your training volume is well-distributed across muscle groups. Keep up the great work!
          </Text>
        </View>
      )}
    </View>
  );
});

export default MuscleBalanceChart;

