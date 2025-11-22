/**
 * Workout Type Icon Utility
 * 
 * Maps workout types (Push/Pull/Legs/Upper/Lower/Full Body) to icons and colors.
 * Used for workout type badges in workout cards.
 * 
 * Based on research-backed icon mappings from REFINED_ICON_MAPPING.md
 */

import {
  ArrowUp,
  ArrowDown,
  Zap,
  Dumbbell,
  User,
  Activity,
} from 'lucide-react-native';
import tokens from '../theme/tokens';

export interface WorkoutTypeData {
  Icon: any;
  color: string;
  label: string;
  category: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'cardio' | 'general';
}

/**
 * Get workout type icon, color, and label based on workout name or type
 * 
 * @param workoutName - Name or type of the workout
 * @returns WorkoutTypeData with Icon component, color, label, and category
 * 
 * @example
 * const { Icon, color, label } = getWorkoutTypeIcon('Push Day');
 * <Icon color={color} size={16} />
 * <Text>{label}</Text> // "Push"
 */
export const getWorkoutTypeIcon = (workoutName: string): WorkoutTypeData => {
  const name = workoutName.toLowerCase();

  // PUSH - Chest, Shoulders, Triceps
  if (
    name.includes('push') ||
    name.includes('chest') ||
    name.includes('shoulder') ||
    name.includes('tricep') ||
    name.includes('bench') ||
    name.includes('press') ||
    name.includes('overhead')
  ) {
    return {
      Icon: ArrowUp,
      color: tokens.colors.accent.primary, // Orange
      label: 'Push',
      category: 'push',
    };
  }

  // PULL - Back, Biceps
  if (
    name.includes('pull') ||
    name.includes('back') ||
    name.includes('bicep') ||
    name.includes('row') ||
    name.includes('lat') ||
    name.includes('curl') ||
    name.includes('deadlift')
  ) {
    return {
      Icon: ArrowDown,
      color: tokens.colors.accent.success, // Green
      label: 'Pull',
      category: 'pull',
    };
  }

  // LEGS - Quads, Hamstrings, Glutes, Calves
  if (
    name.includes('leg') ||
    name.includes('squat') ||
    name.includes('lunge') ||
    name.includes('quad') ||
    name.includes('hamstring') ||
    name.includes('glute') ||
    name.includes('calf') ||
    name.includes('rdl')
  ) {
    return {
      Icon: Zap,
      color: '#FFD700', // Gold
      label: 'Legs',
      category: 'legs',
    };
  }

  // UPPER BODY
  if (name.includes('upper')) {
    return {
      Icon: Dumbbell,
      color: tokens.colors.accent.info, // Blue
      label: 'Upper',
      category: 'upper',
    };
  }

  // LOWER BODY
  if (name.includes('lower')) {
    return {
      Icon: Zap,
      color: '#FFD700', // Gold (same as legs)
      label: 'Lower',
      category: 'lower',
    };
  }

  // FULL BODY
  if (name.includes('full') || name.includes('total')) {
    return {
      Icon: User,
      color: '#9333EA', // Purple
      label: 'Full Body',
      category: 'full',
    };
  }

  // CARDIO
  if (
    name.includes('cardio') ||
    name.includes('run') ||
    name.includes('bike') ||
    name.includes('swim') ||
    name.includes('hiit') ||
    name.includes('conditioning')
  ) {
    return {
      Icon: Activity,
      color: tokens.colors.accent.error, // Red
      label: 'Cardio',
      category: 'cardio',
    };
  }

  // DEFAULT - General workout
  return {
    Icon: Dumbbell,
    color: tokens.colors.text.secondary,
    label: 'Workout',
    category: 'general',
  };
};

/**
 * Get workout type badge component
 * 
 * @param workoutName - Name or type of the workout
 * @param size - Icon size (default: 16)
 * @returns JSX element with icon and label
 * 
 * @example
 * import { getWorkoutTypeBadge } from '../utils/workoutTypeIcons';
 * 
 * <View style={styles.badgeContainer}>
 *   {getWorkoutTypeBadge('Push Day', 18)}
 * </View>
 */
export const getWorkoutTypeBadge = (workoutName: string, _size: number = 16) => {
  const { Icon, color, label } = getWorkoutTypeIcon(workoutName);
  
  return {
    Icon,
    color,
    label,
  };
};

/**
 * Workout type color palette
 * Used for consistent color coding across the app
 */
export const workoutTypeColors = {
  push: tokens.colors.accent.primary, // Orange
  pull: tokens.colors.accent.success, // Green
  legs: '#FFD700', // Gold
  upper: tokens.colors.accent.info, // Blue
  lower: '#FFD700', // Gold
  full: '#9333EA', // Purple
  cardio: tokens.colors.accent.error, // Red
  general: tokens.colors.text.secondary, // Gray
};

/**
 * Workout type labels
 * Used for consistent labeling across the app
 */
export const workoutTypeLabels = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full Body',
  cardio: 'Cardio',
  general: 'Workout',
};

