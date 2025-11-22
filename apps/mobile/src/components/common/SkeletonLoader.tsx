import React, { useEffect } from 'react';
import { ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = tokens.borderRadius.sm,
  style,
}) => {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = isDark
      ? tokens.colors.dark.overlay.shimmer
      : tokens.colors.light.border.subtle;

    return {
      opacity: opacity.value,
      backgroundColor,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};
