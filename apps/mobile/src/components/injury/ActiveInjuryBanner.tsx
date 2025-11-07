/**
 * ActiveInjuryBanner Component
 * 
 * Banner displayed on Home screen showing active injuries.
 * Provides quick access to injury details and recovery check-ins.
 * 
 * Phase 3: Injury Detection & Exercise Substitution
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react-native';

interface InjuryLog {
  id: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  status: 'active' | 'recovering' | 'resolved';
  reportedAt: Date;
  lastCheckInAt?: Date;
}

interface ActiveInjuryBannerProps {
  injuries: InjuryLog[];
  onInjuryPress: (injury: InjuryLog) => void;
  onCheckInPress: (injury: InjuryLog) => void;
}

export default function ActiveInjuryBanner({
  injuries,
  onInjuryPress,
  onCheckInPress,
}: ActiveInjuryBannerProps) {
  const { isDark } = useTheme();

  if (injuries.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return isDark ? '#EF4444' : '#DC2626';
      case 'moderate':
        return isDark ? '#F59E0B' : '#D97706';
      case 'mild':
        return isDark ? '#10B981' : '#059669';
      default:
        return isDark ? '#6B7280' : '#9CA3AF';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isDark ? '#EF4444' : '#DC2626';
      case 'recovering':
        return isDark ? '#F59E0B' : '#D97706';
      case 'resolved':
        return isDark ? '#10B981' : '#059669';
      default:
        return isDark ? '#6B7280' : '#9CA3AF';
    }
  };

  const getDaysInRecovery = (reportedAt: Date) => {
    const now = new Date();
    const reported = new Date(reportedAt);
    return Math.floor((now.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24));
  };

  const needsCheckIn = (injury: InjuryLog) => {
    const lastCheckIn = injury.lastCheckInAt || injury.reportedAt;
    const daysSinceCheckIn = getDaysInRecovery(new Date(lastCheckIn));
    return daysSinceCheckIn >= 7;
  };

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <AlertTriangle color={isDark ? '#F59E0B' : '#D97706'} size={20} />
        <Text
          className={`text-base font-bold ml-2 ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          Active Injuries ({injuries.length})
        </Text>
      </View>

      {/* Injury Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="space-x-3"
      >
        {injuries.map((injury) => {
          const daysInRecovery = getDaysInRecovery(injury.reportedAt);
          const requiresCheckIn = needsCheckIn(injury);

          return (
            <Pressable
              key={injury.id}
              className={`p-4 rounded-xl mr-3 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              style={{ width: 280 }}
              onPress={() => onInjuryPress(injury)}
              accessibilityLabel={`View ${injury.bodyPart} injury details`}
            >
              {/* Severity Badge */}
              <View className="flex-row justify-between items-start mb-2">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getSeverityColor(injury.severity) + '20' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: getSeverityColor(injury.severity) }}
                  >
                    {injury.severity.toUpperCase()}
                  </Text>
                </View>

                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getStatusColor(injury.status) + '20' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: getStatusColor(injury.status) }}
                  >
                    {injury.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Body Part */}
              <Text
                className={`text-lg font-bold mb-1 ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                {injury.bodyPart}
              </Text>

              {/* Description */}
              {injury.description && (
                <Text
                  className={`text-sm mb-3 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  numberOfLines={2}
                >
                  {injury.description}
                </Text>
              )}

              {/* Recovery Info */}
              <View className="flex-row items-center mb-3">
                <Clock
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                  size={14}
                />
                <Text
                  className={`text-xs ml-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Day {daysInRecovery} of recovery
                </Text>
              </View>

              {/* Check-In Button */}
              {requiresCheckIn && (
                <Pressable
                  className={`flex-row items-center justify-center p-3 rounded-lg ${
                    isDark ? 'bg-primaryDark' : 'bg-primary-500'
                  }`}
                  onPress={(e) => {
                    e.stopPropagation();
                    onCheckInPress(injury);
                  }}
                  accessibilityLabel="Weekly recovery check-in"
                >
                  <TrendingUp color="white" size={16} />
                  <Text className="text-sm font-bold text-white ml-2">
                    Weekly Check-In Due
                  </Text>
                </Pressable>
              )}

              {!requiresCheckIn && (
                <View
                  className={`flex-row items-center justify-center p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Next check-in in {7 - getDaysInRecovery(injury.lastCheckInAt || injury.reportedAt)} days
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Disclaimer */}
      <Text
        className={`text-xs mt-2 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        Tap an injury for details • Weekly check-ins track recovery progress
      </Text>
    </View>
  );
}

