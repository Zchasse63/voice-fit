/**
 * RecoveryDetailScreen
 * 
 * Full-screen detail view for recovery and readiness trends.
 * Includes readiness chart, fatigue analytics, and AI recommendations.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { useAuthStore } from '../store/auth.store';
import { chartDataService, ReadinessDataPoint } from '../services/charts/ChartDataService';
import AnalyticsAPIClient, { FatigueAnalytics } from '../services/api/AnalyticsAPIClient';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

type TimeRange = '1W' | '1M' | '3M' | 'All';

export default function RecoveryDetailScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  
  const [readinessData, setReadinessData] = useState<ReadinessDataPoint[]>([]);
  const [fatigueData, setFatigueData] = useState<FatigueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const { state, isActive } = useChartPressState({ x: 0, y: { compositeScore: 0 } });

  useEffect(() => {
    loadRecoveryData();
  }, [user, selectedRange]);

  const loadRecoveryData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch readiness trends
      const readiness = await chartDataService.getReadinessTrend(user.id);
      setReadinessData(readiness);

      // Fetch fatigue analytics
      try {
        const fatigue = await AnalyticsAPIClient.getFatigueAnalytics(user.id);
        setFatigueData(fatigue);
      } catch (error) {
        console.log('Fatigue analytics not available:', error);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load recovery data:', error);
      setIsLoading(false);
    }
  };

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedRange) {
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'All':
        return readinessData;
    }
    
    return readinessData.filter(point => new Date(point.date) >= cutoffDate);
  }, [readinessData, selectedRange]);

  // Transform data for Victory Native XL
  const chartData = useMemo(() => {
    return filteredData.map((point) => ({
      x: new Date(point.date).getTime(),
      compositeScore: point.compositeScore,
    }));
  }, [filteredData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { average: 0, current: 0, trend: 0 };
    
    const average = Math.round(
      filteredData.reduce((sum, point) => sum + point.compositeScore, 0) / filteredData.length
    );
    const current = Math.round(filteredData[filteredData.length - 1].compositeScore);
    
    // Calculate trend
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midpoint);
    const secondHalf = filteredData.slice(midpoint);
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.compositeScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.compositeScore, 0) / secondHalf.length;
    const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return { average, current, trend };
  }, [filteredData]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return accentColors.green;
    if (score >= 60) return accentColors.orange;
    return accentColors.coral;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const timeRanges: TimeRange[] = ['1W', '1M', '3M', 'All'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginRight: tokens.spacing.sm,
          })}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Recovery & Readiness
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.md }}>
        {/* Time Range Selector */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.xs, marginBottom: tokens.spacing.lg }}>
          {timeRanges.map((range) => (
            <Pressable
              key={range}
              onPress={() => setSelectedRange(range)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: tokens.spacing.sm,
                paddingHorizontal: tokens.spacing.xs,
                borderRadius: tokens.borderRadius.full,
                backgroundColor: selectedRange === range ? colors.text.primary : 'transparent',
                borderWidth: 1,
                borderColor: colors.border.primary,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: selectedRange === range ? colors.background.primary : colors.text.primary,
                  textAlign: 'center',
                }}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Current Score Card */}
        {!isLoading && filteredData.length > 0 && (
          <View
            style={{
              padding: tokens.spacing.lg,
              borderRadius: tokens.borderRadius.lg,
              backgroundColor: colors.background.secondary,
              ...tokens.shadows.sm,
              marginBottom: tokens.spacing.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: tokens.typography.fontSize.sm, color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
              Current Readiness
            </Text>
            <Text
              style={{
                fontSize: 64,
                fontWeight: tokens.typography.fontWeight.bold,
                color: getScoreColor(stats.current),
              }}
            >
              {stats.current}%
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.md,
                color: colors.text.secondary,
                marginTop: tokens.spacing.xs,
              }}
            >
              {getScoreLabel(stats.current)}
            </Text>
          </View>
        )}

        {/* Stats Summary */}
        {!isLoading && filteredData.length > 0 && (
          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
            <View
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
                ...tokens.shadows.sm,
              }}
            >
              <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                Average
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: getScoreColor(stats.average),
                  marginTop: tokens.spacing.xs,
                }}
              >
                {stats.average}%
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
                ...tokens.shadows.sm,
              }}
            >
              <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                Trend
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: stats.trend >= 0 ? accentColors.green : accentColors.coral,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {/* Chart */}
        {isLoading ? (
          <View
            style={{
              height: 300,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              ...tokens.shadows.sm,
            }}
          >
            <ActivityIndicator size="large" color={accentColors.green} />
          </View>
        ) : filteredData.length === 0 ? (
          <View
            style={{
              height: 300,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              ...tokens.shadows.sm,
            }}
          >
            <Text style={{ fontSize: tokens.typography.fontSize.sm, color: colors.text.secondary }}>
              No readiness data available
            </Text>
          </View>
        ) : (
          <View
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              backgroundColor: colors.background.secondary,
              ...tokens.shadows.sm,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <View style={{ height: 300 }}>
              <CartesianChart
                data={chartData}
                xKey="x"
                yKeys={['compositeScore']}
                domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              >
                {({ points }) => (
                  <>
                    <Line
                      points={points.compositeScore}
                      color={accentColors.green}
                      strokeWidth={3}
                      curveType="natural"
                      animate={{ type: 'timing', duration: 300 }}
                    />
                    {isActive && (
                      <Circle
                        cx={state.x.position}
                        cy={state.y.compositeScore.position}
                        r={8}
                        color={accentColors.green}
                        opacity={0.8}
                      />
                    )}
                  </>
                )}
              </CartesianChart>

              {/* Tooltip */}
              {isActive && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
                  <View
                    style={{
                      paddingHorizontal: tokens.spacing.sm,
                      paddingVertical: tokens.spacing.xs,
                      borderRadius: tokens.borderRadius.md,
                      backgroundColor: colors.background.tertiary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: accentColors.green,
                      }}
                    >
                      {Math.round((state.y.compositeScore.value as any) as number)}%
                    </Text>
                    <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                      {formatDate(new Date((state.x.value as any) as number).toISOString())}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Fatigue Score Section */}
        {fatigueData && (
          <View style={{ marginBottom: tokens.spacing.lg }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              }}
            >
              Fatigue Analysis
            </Text>
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
                ...tokens.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                <View>
                  <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                    Current Fatigue
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xxl,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginTop: tokens.spacing.xs,
                    }}
                  >
                    {fatigueData.current_fatigue?.fatigue_score?.toFixed(1) || '--'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.secondary }}>
                    Status
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.md,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color:
                        (fatigueData.current_fatigue?.fatigue_score || 0) < 4
                          ? accentColors.green
                          : (fatigueData.current_fatigue?.fatigue_score || 0) < 7
                          ? accentColors.orange
                          : accentColors.coral,
                      marginTop: tokens.spacing.xs,
                    }}
                  >
                    {(fatigueData.current_fatigue?.fatigue_score || 0) < 4
                      ? 'Low'
                      : (fatigueData.current_fatigue?.fatigue_score || 0) < 7
                      ? 'Moderate'
                      : 'High'}
                  </Text>
                </View>
              </View>
              {fatigueData.recommendation && (
                <View
                  style={{
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.borderRadius.md,
                    backgroundColor: colors.background.tertiary,
                  }}
                >
                  <Text style={{ fontSize: tokens.typography.fontSize.sm, color: colors.text.primary, lineHeight: 20 }}>
                    💡 {fatigueData.recommendation}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Insights */}
        {!isLoading && filteredData.length > 0 && (
          <View>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              }}
            >
              Insights
            </Text>
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
                ...tokens.shadows.sm,
              }}
            >
              <Text style={{ fontSize: tokens.typography.fontSize.sm, color: colors.text.primary, lineHeight: 20 }}>
                {stats.trend >= 5
                  ? `📈 Your readiness is improving! Up ${stats.trend.toFixed(1)}% over this period. Keep up the good recovery habits.`
                  : stats.trend <= -5
                  ? `📉 Your readiness has decreased ${Math.abs(stats.trend).toFixed(1)}%. Consider prioritizing sleep and recovery.`
                  : `📊 Your readiness is stable. Maintain your current recovery routine.`}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.primary,
                  lineHeight: 20,
                  marginTop: tokens.spacing.sm,
                }}
              >
                {stats.current >= 80
                  ? `✅ You're well-recovered and ready for intense training.`
                  : stats.current >= 60
                  ? `⚠️ Moderate readiness. Consider a lighter training day.`
                  : `🛑 Low readiness. Prioritize rest and recovery today.`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

