/**
 * Analytics Screen
 * 
 * Displays volume tracking, fatigue monitoring, and deload recommendations.
 * Premium feature only.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.accent.blue} />
          <Text
            style={{
              marginTop: tokens.spacing.sm,
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !volumeAnalytics) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: tokens.spacing.lg,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Failed to load analytics
          </Text>
          <Text
            style={{
              marginTop: tokens.spacing.xs,
              textAlign: 'center',
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: tokens.spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.blue}
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: tokens.spacing.lg }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Analytics
          </Text>
          <Text
            style={{
              marginTop: tokens.spacing.xs,
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
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
          <View
            style={{
              marginTop: tokens.spacing.lg,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.xl,
              backgroundColor: colors.background.secondary,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.md,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              This Week
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Total Workouts
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {volumeAnalytics.weekly_volume.total_workouts}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Total Sets
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {volumeAnalytics.weekly_volume.total_sets}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Muscle Groups Trained
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {Object.keys(volumeAnalytics.weekly_volume.volume_by_muscle).length}
              </Text>
            </View>
          </View>
        )}

        {/* Monthly Summary */}
        {volumeAnalytics && (
          <View
            style={{
              marginTop: tokens.spacing.md,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.xl,
              backgroundColor: colors.background.secondary,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.md,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              This Month
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Total Workouts
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {volumeAnalytics.monthly_volume.total_workouts}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Total Sets
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {volumeAnalytics.monthly_volume.total_sets}
              </Text>
            </View>
          </View>
        )}

        {/* Premium Badge */}
        <View
          style={{
            marginTop: tokens.spacing.lg,
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.xl,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            ✨ Premium Analytics
          </Text>
          <Text
            style={{
              marginTop: tokens.spacing.xs,
              textAlign: 'center',
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Advanced insights to optimize your training
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

