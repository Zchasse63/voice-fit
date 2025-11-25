import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useTokens } from '../../hooks/useTokens';
import { supabase } from '../../services/database/supabase';

interface ShoeAnalyticsProps {
  shoeId: string;
}

interface Analytics {
  run_count: number;
  total_distance: number;
  total_duration: number;
  avg_pace: number;
  avg_speed: number;
  total_calories: number;
}

export default function ShoeAnalytics({ shoeId }: ShoeAnalyticsProps) {
  const colors = useColors();
  const tokens = useTokens();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [shoeId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('runs')
        .select('distance, duration, pace, avg_speed, calories')
        .eq('shoe_id', shoeId);

      if (error) throw error;

      if (!data || data.length === 0) {
        setAnalytics({
          run_count: 0,
          total_distance: 0,
          total_duration: 0,
          avg_pace: 0,
          avg_speed: 0,
          total_calories: 0,
        });
        return;
      }

      const totalDistance = data.reduce((sum, run) => sum + (run.distance / 1609.34), 0);
      const totalDuration = data.reduce((sum, run) => sum + run.duration, 0);
      const avgPace = data.reduce((sum, run) => sum + run.pace, 0) / data.length;
      const avgSpeed = data.reduce((sum, run) => sum + run.avg_speed, 0) / data.length;
      const totalCalories = data.reduce((sum, run) => sum + run.calories, 0);

      setAnalytics({
        run_count: data.length,
        total_distance: Math.round(totalDistance * 100) / 100,
        total_duration: totalDuration,
        avg_pace: Math.round(avgPace * 100) / 100,
        avg_speed: Math.round(avgSpeed * 100) / 100,
        total_calories: totalCalories,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <ActivityIndicator color={colors.accent.blue} size="small" />;
  }

  if (!analytics) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text.primary,
        }}
      >
        Performance Analytics
      </Text>

      {/* Stats Grid */}
      <View style={{ gap: tokens.spacing.sm }}>
        {/* Row 1 */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Runs
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {analytics.run_count}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Distance
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {analytics.total_distance} mi
            </Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Duration
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {formatDuration(analytics.total_duration)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Avg Pace
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {analytics.avg_pace} /mi
            </Text>
          </View>
        </View>

        {/* Row 3 */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Avg Speed
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {analytics.avg_speed} mph
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 4,
              }}
            >
              Calories
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {analytics.total_calories}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

