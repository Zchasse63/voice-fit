/**
 * ConfirmationSheet Component
 * 
 * Animated bottom sheet for confirming voice-logged sets.
 * Features slide-in animation from bottom using Reanimated 3.x
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface ConfirmationSheetProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  data: {
    exerciseName: string;
    weight?: number;
    weightUnit?: string;
    reps?: number;
    rpe?: number;
  };
}

export default function ConfirmationSheet({
  visible,
  onConfirm,
  onCancel,
  data,
}: ConfirmationSheetProps) {
  const { isDark } = useTheme();
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      translateY.value = withTiming(500, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 justify-end" pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable 
        className="absolute inset-0 bg-black/50"
        onPress={onCancel}
      />

      {/* Sheet */}
      <Animated.View
        style={animatedStyle}
        className={`rounded-t-3xl p-lg shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      >
        <Text className={`text-xl font-heading mb-md ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          Confirm Set
        </Text>

        {/* Exercise Data Display */}
        <View className={`rounded-xl p-md mb-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Text className={`text-2xl font-heading ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
            {data.exerciseName}
          </Text>
          <Text className={`text-lg font-body mt-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {data.weight && `${data.weight} ${data.weightUnit || 'lbs'}`}
            {data.reps && ` × ${data.reps} reps`}
          </Text>
          {data.rpe && (
            <Text className={`text-base font-body mt-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              RPE {data.rpe}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-md">
          <Pressable
            className={`flex-1 p-md rounded-xl items-center active:opacity-80 min-h-[60px] ${
              isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
            onPress={onCancel}
            accessibilityLabel="Cancel"
            accessibilityHint="Cancels logging this workout set"
            accessibilityRole="button"
            testID="confirmation-cancel-button"
          >
            <Text className={`text-base font-heading ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 p-md rounded-xl items-center active:opacity-80 min-h-[60px] ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}
            onPress={onConfirm}
            accessibilityLabel="Confirm"
            accessibilityHint="Confirms and logs this workout set"
            accessibilityRole="button"
            testID="confirmation-confirm-button"
          >
            <Text className="text-base font-heading text-white">Confirm</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

