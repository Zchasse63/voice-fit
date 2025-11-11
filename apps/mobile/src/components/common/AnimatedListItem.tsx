/**
 * AnimatedListItem Component
 * 
 * Wrapper component that adds staggered fade-in animation to list items.
 * Uses the stagger preset from animations.ts for consistent timing.
 * 
 * Usage:
 * {items.map((item, index) => (
 *   <AnimatedListItem key={item.id} index={index}>
 *     <YourListItemComponent item={item} />
 *   </AnimatedListItem>
 * ))}
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { presets, durations, getStaggerDelay } from '../../theme/animations';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
  animationType?: 'fade' | 'slide' | 'scale';
  staggerDelay?: number; // Custom delay between items (ms)
}

export default function AnimatedListItem({
  children,
  index,
  style,
  animationType = 'fade',
  staggerDelay,
}: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const delay = getStaggerDelay(index, staggerDelay);

    if (animationType === 'fade') {
      // Simple fade in
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: durations.normal })
      );
    } else if (animationType === 'slide') {
      // Slide up + fade in
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: durations.normal })
      );
      translateY.value = withDelay(
        delay,
        withSpring(0, presets.listStagger.spring)
      );
    } else if (animationType === 'scale') {
      // Scale + fade in
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: durations.normal })
      );
      scale.value = withDelay(
        delay,
        withSpring(1, presets.listStagger.spring)
      );
    }
  }, [index, animationType, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animationType === 'slide') {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    } else if (animationType === 'scale') {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    } else {
      return {
        opacity: opacity.value,
      };
    }
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * AnimatedFlatList Component
 * 
 * Drop-in replacement for FlatList with automatic stagger animations.
 * 
 * Usage:
 * <AnimatedFlatList
 *   data={items}
 *   renderItem={({ item }) => <YourComponent item={item} />}
 *   animationType="slide"
 * />
 */

import { FlatList, FlatListProps, ListRenderItemInfo } from 'react-native';

interface AnimatedFlatListProps<T> extends FlatListProps<T> {
  animationType?: 'fade' | 'slide' | 'scale';
  staggerDelay?: number;
}

export function AnimatedFlatList<T>({
  renderItem,
  animationType = 'slide',
  staggerDelay,
  ...props
}: AnimatedFlatListProps<T>) {
  const wrappedRenderItem = (info: ListRenderItemInfo<T>) => {
    const originalContent = renderItem?.(info);

    return (
      <AnimatedListItem
        index={info.index}
        animationType={animationType}
        staggerDelay={staggerDelay}
      >
        {originalContent}
      </AnimatedListItem>
    );
  };

  return <FlatList {...props} renderItem={wrappedRenderItem} />;
}

