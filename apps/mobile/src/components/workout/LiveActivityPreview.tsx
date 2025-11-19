/**
 * Live Activity Preview Component
 *
 * Displays an in-app preview of what users see on their lock screen (iOS)
 * or notification tray (Android) during active workouts.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Mic, Pause, Play, StopCircle, Dumbbell } from 'lucide-react-native';
import { workoutNotificationManager } from '../../services/workoutNotification/WorkoutNotificationManager';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface LiveActivityPreviewProps {
  workoutName: string;
  currentExercise: string | null;
  currentSet: number;
  totalSets: number;
  elapsedTime: number;
  lastSetWeight?: number;
  lastSetReps?: number;
  lastSetRPE?: number;
  status: 'active' | 'paused' | 'completed';
  onMicPress?: () => void;
  onPausePress?: () => void;
  onResumePress?: () => void;
  onStopPress?: () => void;
}

export const LiveActivityPreview: React.FC<LiveActivityPreviewProps> = ({
  workoutName,
  currentExercise,
  currentSet,
  totalSets,
  elapsedTime,
  lastSetWeight,
  lastSetReps,
  lastSetRPE,
  status,
  onMicPress,
  onPausePress,
  onResumePress,
  onStopPress,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const [pulseAnim] = useState(new Animated.Value(1));
  const notificationType = workoutNotificationManager.getNotificationType();

  // Pulse animation for recording indicator
  useEffect(() => {
    if (status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim]);

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get notification type label
  const getNotificationLabel = (): string => {
    if (notificationType === 'live-activity') {
      return 'Live Activity (iOS)';
    } else if (notificationType === 'foreground-service') {
      return 'Notification (Android)';
    }
    return 'Preview';
  };

  return (
    <View
      style={{
        marginHorizontal: tokens.spacing.lg,
        marginBottom: tokens.spacing.lg,
      }}
    >
      {/* Header label */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing.xs,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.tertiary,
            fontWeight: tokens.typography.fontWeight.medium,
          }}
        >
          {getNotificationLabel()}
        </Text>
        {status === 'active' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: tokens.spacing.xs,
                backgroundColor: colors.accent.green,
              }}
            />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.accent.green,
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Active
            </Text>
          </View>
        )}
      </View>

      {/* Live Activity Card */}
      <View
        style={{
          borderRadius: tokens.borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: colors.background.secondary,
          ...tokens.shadows.lg,
        }}
      >
        {/* Dynamic Island Style Bar (iOS) */}
        {Platform.OS === 'ios' && (
          <View
            style={{
              height: 4,
              backgroundColor: colors.accent.orange,
            }}
          />
        )}

        <View
          style={{
            padding: tokens.spacing.md,
          }}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.sm,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <View
                style={{
                  padding: tokens.spacing.xs,
                  borderRadius: tokens.borderRadius.md,
                  marginRight: tokens.spacing.sm,
                  backgroundColor: colors.backgroundSoft.warningAlt,
                }}
              >
                <Dumbbell size={20} color={colors.accent.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {workoutName}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {currentSet} of {totalSets} sets
                </Text>
              </View>
            </View>

            {/* Timer */}
            <View
              style={{
                paddingHorizontal: tokens.spacing.sm,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: colors.background.tertiary,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {formatTime(elapsedTime)}
              </Text>
            </View>
          </View>

          {/* Current Exercise */}
          {currentExercise && (
            <View
              style={{
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.sm,
                backgroundColor: colors.backgroundSoft.warning,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                  marginBottom: 2,
                }}
              >
                Current Exercise
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {currentExercise}
              </Text>
            </View>
          )}

          {/* Last Set Info */}
          {(lastSetWeight || lastSetReps) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: tokens.spacing.sm,
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: tokens.spacing.sm,
                  borderRadius: tokens.borderRadius.md,
                  marginRight: tokens.spacing.xs,
                  backgroundColor: colors.background.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Weight
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {lastSetWeight} lbs
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: tokens.spacing.sm,
                  borderRadius: tokens.borderRadius.md,
                  marginRight: tokens.spacing.xs,
                  backgroundColor: colors.background.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Reps
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {lastSetReps}
                </Text>
              </View>
              {lastSetRPE && (
                <View
                  style={{
                    flex: 1,
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.borderRadius.md,
                    backgroundColor: colors.background.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    RPE
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {lastSetRPE}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: tokens.spacing.xs,
            }}
          >
            {/* Microphone Button */}
            <TouchableOpacity
              onPress={onMicPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent.orange,
              }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: status === 'active' ? pulseAnim : 1 }],
                }}
              >
                <Mic size={20} color="#FFFFFF" />
              </Animated.View>
              <Text
                style={{
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: '#FFFFFF',
                }}
              >
                Log Set
              </Text>
            </TouchableOpacity>

            {/* Pause/Resume Button */}
            <TouchableOpacity
              onPress={status === 'active' ? onPausePress : onResumePress}
              activeOpacity={0.7}
              style={{
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: colors.background.tertiary,
              }}
            >
              {status === 'active' ? (
                <Pause size={20} color={colors.text.primary} />
              ) : (
                <Play size={20} color={colors.text.primary} />
              )}
            </TouchableOpacity>

            {/* Stop Button */}
            <TouchableOpacity
              onPress={onStopPress}
              activeOpacity={0.7}
              style={{
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: colors.backgroundSoft.danger,
              }}
            >
              <StopCircle size={20} color={colors.accent.red} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Android Material Design Bottom Bar */}
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: colors.background.secondary,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
                textAlign: 'center',
              }}
            >
              Tap to return to workout
            </Text>
          </View>
        )}
      </View>

      {/* Helper Text */}
      {workoutNotificationManager.isSupported() && (
        <Text
          style={{
            marginTop: tokens.spacing.sm,
            fontSize: tokens.typography.fontSize.xs,
            textAlign: 'center',
            color: colors.text.tertiary,
          }}
        >
          {Platform.OS === 'ios'
            ? 'Visible on Lock Screen & Dynamic Island'
            : 'Persistent notification while workout is active'}
        </Text>
      )}
    </View>
  );
};

export default LiveActivityPreview;
