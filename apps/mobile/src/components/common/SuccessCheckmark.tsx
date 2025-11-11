/**
 * SuccessCheckmark Component
 * 
 * Animated success checkmark with scale and fade animations.
 * Uses React Native Reanimated for smooth 60fps animations.
 * 
 * Usage:
 * <SuccessCheckmark 
 *   visible={showSuccess} 
 *   onComplete={() => setShowSuccess(false)}
 *   message="Workout logged successfully!"
 * />
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { CheckCircle } from 'lucide-react-native';
import tokens from '../../theme/tokens';

interface SuccessCheckmarkProps {
  visible: boolean;
  onComplete?: () => void;
  message?: string;
  size?: number;
  duration?: number;
}

export default function SuccessCheckmark({
  visible,
  onComplete,
  message = 'Success!',
  size = 48,
  duration = 2000,
}: SuccessCheckmarkProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.value = 0;
      opacity.value = 0;

      // Animate in with bounce
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );

      // Fade in, hold, then fade out
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(duration - 500, withTiming(0, { duration: 300 }))
      );

      // Call onComplete after animation finishes
      if (onComplete) {
        setTimeout(onComplete, duration);
      }
    } else {
      // Immediately hide when visible becomes false
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, duration, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.iconContainer}>
          <CheckCircle 
            color={tokens.colors.accent.success} 
            size={size} 
            fill={tokens.colors.accent.success}
            fillOpacity={0.2}
          />
        </View>
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: tokens.spacing.sm,
  },
  message: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.accent.success,
    textAlign: 'center',
  },
});

