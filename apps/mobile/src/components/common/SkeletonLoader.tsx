/**
 * SkeletonLoader Component
 * 
 * Animated skeleton loading placeholder with shimmer effect.
 * Provides better UX than spinners by showing content structure while loading.
 * 
 * Usage:
 * <SkeletonLoader width={200} height={20} borderRadius={8} />
 * <SkeletonLoader variant="text" />
 * <SkeletonLoader variant="circle" size={48} />
 * <SkeletonLoader variant="card" />
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import tokens from '../../theme/tokens';
import { presets } from '../../theme/animations';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'avatar';
  size?: number; // For circle/avatar variants
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = tokens.borderRadius.sm,
  variant = 'rect',
  size = 48,
  style,
}: SkeletonLoaderProps) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    // Start shimmer animation
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: presets.shimmer.duration,
        easing: presets.shimmer.easing,
      }),
      -1, // Infinite
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Get dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'text':
        return {
          width: width,
          height: 16,
          borderRadius: tokens.borderRadius.sm,
        };
      case 'circle':
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'avatar':
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'card':
        return {
          width: width,
          height: 120,
          borderRadius: tokens.borderRadius.lg,
        };
      case 'rect':
      default:
        return {
          width: width,
          height: height,
          borderRadius: borderRadius,
        };
    }
  };

  const dimensions = getDimensions();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
        },
        style,
      ]}
    >
      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

/**
 * SkeletonGroup Component
 * 
 * Renders multiple skeleton loaders in common patterns.
 * 
 * Usage:
 * <SkeletonGroup variant="chatMessage" count={3} />
 * <SkeletonGroup variant="workoutCard" count={2} />
 */

interface SkeletonGroupProps {
  variant: 'chatMessage' | 'workoutCard' | 'listItem' | 'stats';
  count?: number;
  style?: ViewStyle;
}

export function SkeletonGroup({
  variant,
  count = 1,
  style,
}: SkeletonGroupProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'chatMessage':
        return (
          <View style={styles.chatMessageSkeleton}>
            <SkeletonLoader variant="avatar" size={32} />
            <View style={styles.chatMessageContent}>
              <SkeletonLoader variant="text" width="60%" height={14} />
              <SkeletonLoader variant="text" width="80%" height={14} style={{ marginTop: 8 }} />
              <SkeletonLoader variant="text" width="40%" height={14} style={{ marginTop: 8 }} />
            </View>
          </View>
        );
      
      case 'workoutCard':
        return (
          <View style={styles.workoutCardSkeleton}>
            <View style={styles.workoutCardHeader}>
              <SkeletonLoader variant="text" width={120} height={20} />
              <SkeletonLoader variant="circle" size={24} />
            </View>
            <SkeletonLoader variant="text" width="100%" height={16} style={{ marginTop: 12 }} />
            <SkeletonLoader variant="text" width="80%" height={16} style={{ marginTop: 8 }} />
            <SkeletonLoader variant="text" width="60%" height={16} style={{ marginTop: 8 }} />
          </View>
        );
      
      case 'listItem':
        return (
          <View style={styles.listItemSkeleton}>
            <SkeletonLoader variant="circle" size={40} />
            <View style={styles.listItemContent}>
              <SkeletonLoader variant="text" width="70%" height={16} />
              <SkeletonLoader variant="text" width="50%" height={14} style={{ marginTop: 6 }} />
            </View>
          </View>
        );
      
      case 'stats':
        return (
          <View style={styles.statsSkeleton}>
            <SkeletonLoader variant="rect" width={80} height={60} />
            <SkeletonLoader variant="rect" width={80} height={60} />
            <SkeletonLoader variant="rect" width={80} height={60} />
          </View>
        );
      
      default:
        return <SkeletonLoader />;
    }
  };

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: tokens.spacing.md }}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.tertiary,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.5,
  },
  
  // Chat message skeleton
  chatMessageSkeleton: {
    flexDirection: 'row',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
  },
  chatMessageContent: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  
  // Workout card skeleton
  workoutCardSkeleton: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // List item skeleton
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  
  // Stats skeleton
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: tokens.spacing.md,
  },
});

