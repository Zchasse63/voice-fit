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

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <View
      style={{
        marginBottom: tokens.spacing.md,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: tokens.spacing.xs,
        }}
      >
        <AlertTriangle
          color={isDark ? tokens.colors.dark.accent.orange : tokens.colors.light.accent.orange}
          size={20}
        />
        <Text
          style={{
            marginLeft: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Active Injuries ({injuries.length})
        </Text>
      </View>

      {/* Injury Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ columnGap: tokens.spacing.sm }}
      >
        {injuries.map((injury) => {
          const daysInRecovery = getDaysInRecovery(injury.reportedAt);
          const requiresCheckIn = needsCheckIn(injury);

          return (
            <Pressable
              key={injury.id}
              onPress={() => onInjuryPress(injury)}
              accessibilityLabel={`View ${injury.bodyPart} injury details`}
              style={{
                width: 280,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.xl,
                marginRight: tokens.spacing.sm,
                backgroundColor: colors.background.secondary,
              }}
            >
              {/* Severity Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: 999,
                    backgroundColor: `${getSeverityColor(injury.severity)}20`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: getSeverityColor(injury.severity),
                    }}
                  >
                    {injury.severity.toUpperCase()}
                  </Text>
                </View>

                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: 999,
                    backgroundColor: `${getStatusColor(injury.status)}20`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: getStatusColor(injury.status),
                    }}
                  >
                    {injury.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Body Part */}
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginBottom: 2,
                  color: colors.text.primary,
                }}
              >
                {injury.bodyPart}
              </Text>

              {/* Description */}
              {injury.description && (
                <Text
                  numberOfLines={2}
                  style={{
                    marginBottom: tokens.spacing.sm,
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  {injury.description}
                </Text>
              )}

              {/* Recovery Info */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.sm,
                }}
              >
                <Clock
                  color={isDark ? tokens.colors.dark.text.tertiary : tokens.colors.light.text.tertiary}
                  size={14}
                />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  Day {daysInRecovery} of recovery
                </Text>
              </View>

              {/* Check-In Button */}
              {requiresCheckIn ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onCheckInPress(injury);
                  }}
                  accessibilityLabel="Weekly recovery check-in"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor: isDark
                      ? tokens.colors.dark.accent.green
                      : tokens.colors.light.accent.green,
                  }}
                >
                  <TrendingUp color={tokens.colors.shared.static.white} size={16} />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: tokens.colors.shared.static.white,
                    }}
                  >
                    Weekly Check-In Due
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor: colors.background.tertiary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}
                  >
                    Next check-in in{' '}
                    {7 - getDaysInRecovery(injury.lastCheckInAt || injury.reportedAt)} days
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Disclaimer */}
      <Text
        style={{
          marginTop: tokens.spacing.xs,
          fontSize: tokens.typography.fontSize.xs,
          color: colors.text.tertiary,
        }}
      >
        Tap an injury for details • Weekly check-ins track recovery progress
      </Text>
    </View>
  );
}

