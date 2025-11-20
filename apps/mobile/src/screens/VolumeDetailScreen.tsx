/**
 * VolumeDetailScreen
 * 
 * Full-screen detail view for training volume trends.
 * Includes time range selector, stats summary, and full-size chart.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { useAuthStore } from '../store/auth.store';
import { chartDataService, VolumeDataPoint } from '../services/charts/ChartDataService';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All';

export default function VolumeDetailScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  
  const [data, setData] = useState<VolumeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('3M');
  const { state, isActive } = useChartPressState({ x: 0, y: { tonnage: 0 } });

  useEffect(() => {
    loadVolumeData();
  }, [user, selectedRange]);

  const loadVolumeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const volumeData = await chartDataService.getVolumeTrends(user.id);
      setData(volumeData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load volume trends:', error);
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
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'All':
        return data;
    }
    
    return data.filter(point => new Date(point.week) >= cutoffDate);
  }, [data, selectedRange]);

  // Transform data for Victory Native XL
  const chartData = useMemo(() => {
    return filteredData.map((point) => ({
      x: new Date(point.week).getTime(),
      tonnage: point.tonnage,
    }));
  }, [filteredData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { average: 0, total: 0, peak: 0, trend: 0 };
    
    const total = filteredData.reduce((sum, point) => sum + point.tonnage, 0);
    const average = Math.round(total / filteredData.length);
    const peak = Math.max(...filteredData.map(p => p.tonnage));
    
    // Calculate trend (compare first half to second half)
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midpoint);
    const secondHalf = filteredData.slice(midpoint);
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.tonnage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.tonnage, 0) / secondHalf.length;
    const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return { average, total, peak, trend };
  }, [filteredData]);

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return Math.round(volume).toString();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'All'];

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
          Volume Trends
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.md }}>
        {/* Time Range Selector */}
        <View
          style={{
            flexDirection: 'row',
            gap: tokens.spacing.xs,
            marginBottom: tokens.spacing.lg,
          }}
        >
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

        {/* Stats Summary */}
        {!isLoading && filteredData.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              gap: tokens.spacing.sm,
              marginBottom: tokens.spacing.lg,
            }}
          >
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
                  color: accentColors.green,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {formatVolume(stats.average)} lbs
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
              No data available for this time range
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
                yKeys={['tonnage']}
                domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              >
                {({ points }) => (
                  <>
                    <Line
                      points={points.tonnage}
                      color={accentColors.green}
                      strokeWidth={3}
                      curveType="natural"
                      animate={{ type: 'timing', duration: 300 }}
                    />
                    {isActive && (
                      <Circle
                        cx={state.x.position}
                        cy={state.y.tonnage.position}
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
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                  }}
                >
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
                      {formatVolume(state.y.tonnage.value)} lbs
                    </Text>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: colors.text.secondary,
                      }}
                    >
                      Week of {formatDate(new Date(state.x.value).toISOString())}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Insights Section */}
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
                  ? `📈 Your volume is trending up ${stats.trend.toFixed(1)}%! Great progress on progressive overload.`
                  : stats.trend <= -5
                  ? `📉 Your volume has decreased ${Math.abs(stats.trend).toFixed(1)}%. Consider if you need a deload or if you're recovering from an injury.`
                  : `📊 Your volume is stable. This is good for maintaining strength while focusing on other aspects of training.`}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.primary,
                  lineHeight: 20,
                  marginTop: tokens.spacing.sm,
                }}
              >
                💪 Peak week: {formatVolume(stats.peak)} lbs
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

