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
import { tokens } from '../../theme/tokens';

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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
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
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <Pressable
        onPress={onCancel}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: colors.overlay.scrim,
        }}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          animatedStyle,
          {
            borderTopLeftRadius: tokens.borderRadius.xl,
            borderTopRightRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.lg,
            backgroundColor: colors.background.secondary,
          },
        ]}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            marginBottom: tokens.spacing.md,
            color: colors.text.primary,
          }}
        >
          Confirm Set
        </Text>

        {/* Exercise Data Display */}
        <View
          style={{
            borderRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.md,
            marginBottom: tokens.spacing.lg,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.accent.blue,
            }}
          >
            {data.exerciseName}
          </Text>
          <Text
            style={{
              marginTop: tokens.spacing.xs,
              fontSize: tokens.typography.fontSize.lg,
              color: colors.text.secondary,
            }}
          >
            {data.weight && `${data.weight} ${data.weightUnit || 'lbs'}`}
            {data.reps && ` × ${data.reps} reps`}
          </Text>
          {data.rpe && (
            <Text
              style={{
                marginTop: tokens.spacing.xs,
                fontSize: tokens.typography.fontSize.base,
                color: colors.text.tertiary,
              }}
            >
              RPE {data.rpe}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            columnGap: tokens.spacing.sm,
          }}
        >
          <Pressable
            onPress={onCancel}
            accessibilityLabel="Cancel"
            accessibilityHint="Cancels logging this workout set"
            accessibilityRole="button"
            testID="confirmation-cancel-button"
            style={{
              flex: 1,
              minHeight: 60,
              borderRadius: tokens.borderRadius.xl,
              padding: tokens.spacing.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background.tertiary,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            accessibilityLabel="Confirm"
            accessibilityHint="Confirms and logs this workout set"
            accessibilityRole="button"
            testID="confirmation-confirm-button"
            style={{
              flex: 1,
              minHeight: 60,
              borderRadius: tokens.borderRadius.xl,
              padding: tokens.spacing.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accent.blue,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: '#FFFFFF',
              }}
            >
              Confirm
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

