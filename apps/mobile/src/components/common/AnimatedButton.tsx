/**
 * AnimatedButton Component
 * 
 * Reusable button with press animations using React Native Reanimated.
 * Provides tactile feedback with scale animation on press.
 * 
 * Usage:
 * <AnimatedButton onPress={handlePress} style={styles.button}>
 *   <Text>Press Me</Text>
 * </AnimatedButton>
 */

import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleAmount?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

export default function AnimatedButton({
  onPress,
  children,
  style,
  disabled = false,
  scaleAmount = 0.95,
  springConfig = { damping: 15, stiffness: 150 },
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(scaleAmount, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

