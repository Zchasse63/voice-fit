/**
 * Unified Animation Constants
 * 
 * Centralized animation configurations for React Native Reanimated.
 * Ensures consistent timing, easing, and spring physics across the app.
 * 
 * Usage:
 * import { springConfigs, timingConfigs, durations } from '../theme/animations';
 * 
 * scale.value = withSpring(1, springConfigs.gentle);
 * opacity.value = withTiming(1, timingConfigs.normal);
 */

import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// ============================================================================
// DURATIONS (milliseconds)
// ============================================================================

export const durations = {
  instant: 0,
  fastest: 100,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const easings = {
  // Standard easings
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  
  // Cubic easings (smoother)
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),
  
  // Bezier easings (custom curves)
  bezier: Easing.bezier(0.25, 0.1, 0.25, 1), // Material Design standard
  
  // Bounce
  bounce: Easing.bounce,
  
  // Elastic
  elastic: Easing.elastic(1),
} as const;

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

/**
 * Spring physics configurations for natural motion.
 * Higher damping = less bouncy, higher stiffness = faster response
 */
export const springConfigs = {
  /**
   * Gentle spring - Subtle, smooth motion
   * Use for: Subtle UI feedback, gentle transitions
   */
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  } as WithSpringConfig,
  
  /**
   * Default spring - Balanced motion
   * Use for: Most UI animations, button presses
   */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } as WithSpringConfig,
  
  /**
   * Bouncy spring - Playful, energetic motion
   * Use for: Success animations, celebrations, badge unlocks
   */
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1,
  } as WithSpringConfig,
  
  /**
   * Snappy spring - Quick, responsive motion
   * Use for: Modal appearances, quick transitions
   */
  snappy: {
    damping: 18,
    stiffness: 250,
    mass: 0.8,
  } as WithSpringConfig,
  
  /**
   * Wobbly spring - Very bouncy motion
   * Use for: Attention-grabbing animations, errors
   */
  wobbly: {
    damping: 8,
    stiffness: 120,
    mass: 1.2,
  } as WithSpringConfig,
  
  /**
   * Stiff spring - Minimal bounce, fast
   * Use for: Precise movements, drag-and-drop
   */
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  } as WithSpringConfig,
} as const;

// ============================================================================
// TIMING CONFIGURATIONS
// ============================================================================

/**
 * Timing configurations for linear/eased animations.
 * Use when you need precise control over animation curves.
 */
export const timingConfigs = {
  /**
   * Fast timing - Quick transitions
   * Use for: Micro-interactions, hover effects
   */
  fast: {
    duration: durations.fast,
    easing: easings.easeOut,
  } as WithTimingConfig,
  
  /**
   * Normal timing - Standard transitions
   * Use for: Most animations, screen transitions
   */
  normal: {
    duration: durations.normal,
    easing: easings.easeInOut,
  } as WithTimingConfig,
  
  /**
   * Slow timing - Deliberate transitions
   * Use for: Important state changes, onboarding
   */
  slow: {
    duration: durations.slow,
    easing: easings.easeInOut,
  } as WithTimingConfig,
  
  /**
   * Linear timing - Constant speed
   * Use for: Loading spinners, progress bars
   */
  linear: {
    duration: durations.normal,
    easing: easings.linear,
  } as WithTimingConfig,
  
  /**
   * Fade in timing - Smooth appearance
   * Use for: Fading in content, modals
   */
  fadeIn: {
    duration: durations.normal,
    easing: easings.easeOut,
  } as WithTimingConfig,
  
  /**
   * Fade out timing - Smooth disappearance
   * Use for: Fading out content, dismissing modals
   */
  fadeOut: {
    duration: durations.fast,
    easing: easings.easeIn,
  } as WithTimingConfig,
  
  /**
   * Slide in timing - Smooth entrance
   * Use for: Bottom sheets, side panels
   */
  slideIn: {
    duration: durations.normal,
    easing: easings.cubicOut,
  } as WithTimingConfig,
  
  /**
   * Slide out timing - Smooth exit
   * Use for: Dismissing sheets, panels
   */
  slideOut: {
    duration: durations.fast,
    easing: easings.cubicIn,
  } as WithTimingConfig,
} as const;

// ============================================================================
// PRESET ANIMATIONS
// ============================================================================

/**
 * Common animation presets for specific use cases.
 * These combine timing/spring configs with common patterns.
 */
export const presets = {
  /**
   * Button press animation
   * Scale down slightly on press, spring back on release
   */
  buttonPress: {
    scaleDown: 0.95,
    spring: springConfigs.default,
  },
  
  /**
   * Success checkmark animation
   * Bouncy entrance with fade
   */
  successCheckmark: {
    scaleSpring: springConfigs.bouncy,
    fadeIn: timingConfigs.fadeIn,
    fadeOut: timingConfigs.fadeOut,
    holdDuration: 1500,
  },
  
  /**
   * Modal animation
   * Slide up from bottom with fade
   */
  modal: {
    slideDistance: 500,
    slideIn: timingConfigs.slideIn,
    slideOut: timingConfigs.slideOut,
    fadeIn: timingConfigs.fadeIn,
    fadeOut: timingConfigs.fadeOut,
  },
  
  /**
   * Skeleton shimmer animation
   * Continuous shimmer effect for loading states
   */
  shimmer: {
    duration: 1500,
    easing: easings.linear,
  },
  
  /**
   * Badge unlock animation
   * Bouncy scale with rotation
   */
  badgeUnlock: {
    scaleSpring: springConfigs.bouncy,
    rotateDuration: 1000,
    fadeIn: timingConfigs.fadeIn,
    fadeOut: timingConfigs.fadeOut,
  },
  
  /**
   * List item stagger animation
   * Delay between each item appearing
   */
  listStagger: {
    itemDelay: 50,
    fadeIn: timingConfigs.fadeIn,
    slideDistance: 20,
  },
  
  /**
   * Pull to refresh animation
   * Smooth pull-down indicator
   */
  pullToRefresh: {
    spring: springConfigs.gentle,
    threshold: 80,
  },
  
  /**
   * Swipe gesture animation
   * Smooth swipe-to-delete or swipe-to-action
   */
  swipeGesture: {
    spring: springConfigs.snappy,
    threshold: 100,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate stagger delay for list animations
 * @param index - Item index in list
 * @param baseDelay - Base delay between items (default: 50ms)
 * @returns Delay in milliseconds
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

/**
 * Get interpolated value for shimmer effect
 * @param progress - Animated value (0 to 1)
 * @returns Interpolated position for shimmer
 */
export const getShimmerTranslateX = (progress: number, width: number): number => {
  'worklet';
  return progress * width * 2 - width;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  durations,
  easings,
  springConfigs,
  timingConfigs,
  presets,
  getStaggerDelay,
  getShimmerTranslateX,
};

