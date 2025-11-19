/**
 * StatsView Component
 *
 * Displays comprehensive analytics charts for the training stats surface
 * (used alongside the main Program & Log / analytics experiences).
 * Shows Volume Trends, Muscle Balance, and Readiness Trend charts.
 * Optimized with lazy loading for better performance.
 */

import React, { Suspense } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../hooks/useTheme';

// Lazy load chart components for better performance
const VolumeTrendsChart = React.lazy(() => import('../charts/VolumeTrendsChart'));
const MuscleBalanceChart = React.lazy(() => import('../charts/MuscleBalanceChart'));
const ReadinessTrendChart = React.lazy(() => import('../readiness/ReadinessTrendChart'));

// Loading fallback component
const ChartLoader = () => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <View
      style={{
        height: 256,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator
        size="large"
        color={isDark ? tokens.colors.dark.accent.green : tokens.colors.light.accent.green}
      />
    </View>
  );
};

const StatsView = React.memo(function StatsView() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: tokens.spacing.lg }}
    >
      <View>
        {/* Volume Trends Chart */}
        <Suspense fallback={<ChartLoader />}>
          <VolumeTrendsChart />
        </Suspense>

        {/* Muscle Balance Chart */}
        <Suspense fallback={<ChartLoader />}>
          <MuscleBalanceChart />
        </Suspense>

        {/* Readiness Trend Chart */}
        <Suspense fallback={<ChartLoader />}>
          <ReadinessTrendChart />
        </Suspense>
      </View>
    </ScrollView>
  );
});

export default StatsView;

