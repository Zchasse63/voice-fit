/**
 * Analytics Screen
 * 
 * Displays volume tracking, fatigue monitoring, and deload recommendations.
 * Premium feature only.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import AnalyticsAPIClient, {
  VolumeAnalytics,
  FatigueAnalytics,
  DeloadRecommendation,
} from '../services/api/AnalyticsAPIClient';
import { VolumeChart } from '../components/analytics/VolumeChart';
import { FatigueChart } from '../components/analytics/FatigueChart';
import { DeloadCard } from '../components/analytics/DeloadCard';

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const { user, token } = useAuth();

  const [volumeAnalytics, setVolumeAnalytics] = useState<VolumeAnalytics | null>(null);
  const [fatigueAnalytics, setFatigueAnalytics] = useState<FatigueAnalytics | null>(null);
  const [deloadRecommendation, setDeloadRecommendation] = useState<DeloadRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async (isRefresh = false) => {
    if (!user || !token) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all analytics data in parallel
      const [volume, fatigue, deload] = await Promise.all([
        AnalyticsAPIClient.getVolumeAnalytics(user.id, token),
        AnalyticsAPIClient.getFatigueAnalytics(user.id, token),
        AnalyticsAPIClient.getDeloadRecommendation(user.id, token),
      ]);

      setVolumeAnalytics(volume);
      setFatigueAnalytics(fatigue);
      setDeloadRecommendation(deload);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, [user, token]);

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  // Handle deload approval
  const handleDeloadApprove = async () => {
    // TODO: Implement deload approval API call
    console.log('Deload approved');
    // Refresh analytics after approval
    await fetchAnalytics(true);
  };

  // Handle deload dismiss
  const handleDeloadDismiss = () => {
    // TODO: Implement deload dismiss logic
    console.log('Deload dismissed');
  };

  // Loading state
  if (isLoading && !volumeAnalytics) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !volumeAnalytics) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className={`text-center text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Failed to load analytics
          </Text>
          <Text className={`text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Analytics
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track your volume, fatigue, and recovery
          </Text>
        </View>

        {/* Deload Recommendation */}
        {deloadRecommendation && (
          <DeloadCard
            deloadRecommendation={deloadRecommendation}
            onApprove={handleDeloadApprove}
            onDismiss={handleDeloadDismiss}
          />
        )}

        {/* Fatigue Chart */}
        {fatigueAnalytics && (
          <FatigueChart
            fatigueHistory={fatigueAnalytics.fatigue_history}
            currentFatigue={fatigueAnalytics.current_fatigue}
          />
        )}

        {/* Volume Chart */}
        {volumeAnalytics && (
          <VolumeChart
            volumeTrend={volumeAnalytics.volume_trend}
            volumeByMuscle={volumeAnalytics.weekly_volume.volume_by_muscle}
          />
        )}

        {/* Weekly Summary */}
        {volumeAnalytics && (
          <View className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              This Week
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Workouts
              </Text>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {volumeAnalytics.weekly_volume.total_workouts}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Sets
              </Text>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {volumeAnalytics.weekly_volume.total_sets}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Muscle Groups Trained
              </Text>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Object.keys(volumeAnalytics.weekly_volume.volume_by_muscle).length}
              </Text>
            </View>
          </View>
        )}

        {/* Monthly Summary */}
        {volumeAnalytics && (
          <View className={`mt-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              This Month
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Workouts
              </Text>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {volumeAnalytics.monthly_volume.total_workouts}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Sets
              </Text>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {volumeAnalytics.monthly_volume.total_sets}
              </Text>
            </View>
          </View>
        )}

        {/* Premium Badge */}
        <View className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
          <Text className="text-white text-center font-semibold">
            ✨ Premium Analytics
          </Text>
          <Text className="text-white text-center text-xs mt-1 opacity-80">
            Advanced insights to optimize your training
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

