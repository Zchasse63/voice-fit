/**
 * StatsView Component
 *
 * Displays comprehensive analytics charts for the Stats tab in LogScreen.
 * Shows Volume Trends, Muscle Balance, and Readiness Trend charts.
 * Optimized with lazy loading for better performance.
 */

import React, { Suspense } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';

// Lazy load chart components for better performance
const VolumeTrendsChart = React.lazy(() => import('../charts/VolumeTrendsChart'));
const MuscleBalanceChart = React.lazy(() => import('../charts/MuscleBalanceChart'));
const ReadinessTrendChart = React.lazy(() => import('../readiness/ReadinessTrendChart'));

// Loading fallback component
const ChartLoader = () => (
  <View className="h-64 items-center justify-center">
    <ActivityIndicator size="large" color="#4A9B6F" />
  </View>
);

const StatsView = React.memo(function StatsView() {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="space-y-6 pb-6">
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

