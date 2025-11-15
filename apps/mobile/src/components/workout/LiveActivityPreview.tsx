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
    <View className="mx-4 mb-4">
      {/* Header label */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-500 font-medium">
          {getNotificationLabel()}
        </Text>
        {status === 'active' && (
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            <Text className="text-xs text-green-600 font-medium">Active</Text>
          </View>
        )}
      </View>

      {/* Live Activity Card */}
      <View
        className={`rounded-3xl overflow-hidden shadow-lg ${
          Platform.OS === 'ios'
            ? 'bg-white/90 backdrop-blur-xl'
            : 'bg-white'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Dynamic Island Style Bar (iOS) */}
        {Platform.OS === 'ios' && (
          <View className="bg-gradient-to-r from-orange-500 to-red-500 h-1" />
        )}

        <View className="p-4">
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="bg-orange-100 p-2 rounded-xl mr-3">
                <Dumbbell size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                  {workoutName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {currentSet} of {totalSets} sets
                </Text>
              </View>
            </View>

            {/* Timer */}
            <View className="bg-gray-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-semibold text-gray-900 font-mono">
                {formatTime(elapsedTime)}
              </Text>
            </View>
          </View>

          {/* Current Exercise */}
          {currentExercise && (
            <View className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl mb-3">
              <Text className="text-xs text-gray-500 mb-1">Current Exercise</Text>
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {currentExercise}
              </Text>
            </View>
          )}

          {/* Last Set Info */}
          {(lastSetWeight || lastSetReps) && (
            <View className="flex-row items-center space-x-2 mb-3">
              <View className="flex-1 bg-blue-50 p-2.5 rounded-lg">
                <Text className="text-xs text-gray-500">Weight</Text>
                <Text className="text-sm font-bold text-gray-900">
                  {lastSetWeight} lbs
                </Text>
              </View>
              <View className="flex-1 bg-green-50 p-2.5 rounded-lg">
                <Text className="text-xs text-gray-500">Reps</Text>
                <Text className="text-sm font-bold text-gray-900">
                  {lastSetReps}
                </Text>
              </View>
              {lastSetRPE && (
                <View className="flex-1 bg-purple-50 p-2.5 rounded-lg">
                  <Text className="text-xs text-gray-500">RPE</Text>
                  <Text className="text-sm font-bold text-gray-900">
                    {lastSetRPE}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row items-center space-x-2">
            {/* Microphone Button */}
            <TouchableOpacity
              onPress={onMicPress}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [{ scale: status === 'active' ? pulseAnim : 1 }],
                }}
              >
                <Mic size={20} color="white" />
              </Animated.View>
              <Text className="text-white font-semibold ml-2">Log Set</Text>
            </TouchableOpacity>

            {/* Pause/Resume Button */}
            <TouchableOpacity
              onPress={status === 'active' ? onPausePress : onResumePress}
              className="bg-gray-100 p-3 rounded-xl"
              activeOpacity={0.7}
            >
              {status === 'active' ? (
                <Pause size={20} color="#374151" />
              ) : (
                <Play size={20} color="#374151" />
              )}
            </TouchableOpacity>

            {/* Stop Button */}
            <TouchableOpacity
              onPress={onStopPress}
              className="bg-red-50 p-3 rounded-xl"
              activeOpacity={0.7}
            >
              <StopCircle size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Android Material Design Bottom Bar */}
        {Platform.OS === 'android' && (
          <View className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <Text className="text-xs text-gray-500 text-center">
              Tap to return to workout
            </Text>
          </View>
        )}
      </View>

      {/* Helper Text */}
      {workoutNotificationManager.isSupported() && (
        <Text className="text-xs text-gray-400 text-center mt-2">
          {Platform.OS === 'ios'
            ? 'Visible on Lock Screen & Dynamic Island'
            : 'Persistent notification while workout is active'}
        </Text>
      )}
    </View>
  );
};

export default LiveActivityPreview;
