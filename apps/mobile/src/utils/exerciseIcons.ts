/**
 * Exercise Icon Utility
 * 
 * Maps exercise names to appropriate Lucide icons based on muscle groups.
 * Uses research-backed icon mappings from REFINED_ICON_MAPPING.md
 * 
 * Key Changes from Original:
 * - Arms: Now uses BicepsFlexed (discovered in Lucide library!)
 * - Back: Changed to TrendingUp (pulling motion) instead of Activity
 * - Shoulders: Changed to Triangle (deltoid shape)
 * - Legs: Changed to Zap (explosive power) instead of Footprints
 * - Walking: Now uses Footprints (moved from legs)
 * - Core: Changed to Target (bullseye)
 * - New Categories: Cycling, Swimming, Stretching, Bodyweight
 */

import { 
  Dumbbell, 
  TrendingUp, 
  Triangle, 
  Zap, 
  Target,
  Activity,
  Footprints,
  Heart,
  Wind,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import tokens from '../theme/tokens';

// Type-safe icon imports (Bike and Waves may need verification)
// Note: If these don't exist in your version of lucide-react-native, 
// they'll fall back to the default icon
let Bike: LucideIcon;
let Waves: LucideIcon;
let BicepsFlexed: LucideIcon;

try {
  // @ts-ignore - Dynamic import for icons that may not exist in all versions
  const lucide = require('lucide-react-native');
  Bike = lucide.Bike || Activity;
  Waves = lucide.Waves || Activity;
  BicepsFlexed = lucide.BicepsFlexed || Zap;
} catch {
  // Fallback if imports fail
  Bike = Activity;
  Waves = Activity;
  BicepsFlexed = Zap;
}

export interface ExerciseIconData {
  Icon: LucideIcon;
  color: string;
  category: string;
}

/**
 * Get the appropriate icon for an exercise based on its name
 * @param exerciseName - The name of the exercise
 * @returns Icon component, color, and category
 */
export const getExerciseIcon = (exerciseName: string): ExerciseIconData => {
  const name = exerciseName.toLowerCase();
  
  // CHEST - Dumbbell (orange)
  if (
    name.includes('bench') || 
    name.includes('press') && (name.includes('chest') || name.includes('incline') || name.includes('decline')) ||
    name.includes('fly') || 
    name.includes('flye') ||
    name.includes('push') && !name.includes('pull') ||
    name.includes('dip') && !name.includes('hip') ||
    name.includes('chest')
  ) {
    return { 
      Icon: Dumbbell, 
      color: tokens.colors.accent.primary,
      category: 'Chest'
    };
  }
  
  // BACK - TrendingUp (green) - REFINED from Activity
  if (
    name.includes('row') || 
    name.includes('pull') && !name.includes('push') ||
    name.includes('lat') ||
    name.includes('deadlift') ||
    name.includes('back') ||
    name.includes('chin') && name.includes('up')
  ) {
    return { 
      Icon: TrendingUp, 
      color: tokens.colors.accent.success,
      category: 'Back'
    };
  }
  
  // SHOULDERS - Triangle (yellow) - NEW
  if (
    name.includes('shoulder') || 
    name.includes('overhead') && name.includes('press') ||
    name.includes('raise') && (name.includes('lateral') || name.includes('front') || name.includes('rear')) ||
    name.includes('delt') ||
    name.includes('shrug')
  ) {
    return { 
      Icon: Triangle, 
      color: tokens.colors.accent.warning,
      category: 'Shoulders'
    };
  }
  
  // ARMS - BicepsFlexed (red) - NEW DISCOVERY!
  if (
    name.includes('curl') || 
    name.includes('tricep') ||
    name.includes('bicep') ||
    name.includes('skullcrusher') ||
    name.includes('hammer') && name.includes('curl') ||
    name.includes('arm') && !name.includes('forearm')
  ) {
    return { 
      Icon: BicepsFlexed, 
      color: tokens.colors.accent.error,
      category: 'Arms'
    };
  }
  
  // LEGS - Zap (gold) - REFINED from Footprints
  if (
    name.includes('squat') || 
    name.includes('leg') && !name.includes('deadlift') ||
    name.includes('lunge') ||
    name.includes('calf') ||
    name.includes('glute') ||
    name.includes('quad') ||
    name.includes('hamstring') ||
    name.includes('hip') && (name.includes('thrust') || name.includes('abduction'))
  ) {
    return { 
      Icon: Zap, 
      color: tokens.colors.badge.gold,
      category: 'Legs'
    };
  }
  
  // CORE - Target (silver) - REFINED from Circle
  if (
    name.includes('plank') || 
    name.includes('crunch') ||
    name.includes('ab') && !name.includes('cable') ||
    name.includes('core') ||
    name.includes('twist') ||
    name.includes('sit') && name.includes('up') ||
    name.includes('leg') && name.includes('raise') && !name.includes('lateral')
  ) {
    return { 
      Icon: Target, 
      color: tokens.colors.badge.silver,
      category: 'Core'
    };
  }
  
  // RUNNING - Activity (orange)
  if (
    name.includes('run') || 
    name.includes('sprint') ||
    name.includes('jog') ||
    name.includes('treadmill')
  ) {
    return { 
      Icon: Activity, 
      color: tokens.colors.accent.primary,
      category: 'Running'
    };
  }
  
  // CYCLING - Bike (green) - NEW CATEGORY
  if (
    name.includes('bike') || 
    name.includes('cycle') ||
    name.includes('cycling') ||
    name.includes('spin')
  ) {
    return { 
      Icon: Bike, 
      color: tokens.colors.accent.success,
      category: 'Cycling'
    };
  }
  
  // WALKING - Footprints (yellow) - MOVED from legs
  if (
    name.includes('walk') || 
    name.includes('hike') ||
    name.includes('hiking') ||
    name.includes('ruck')
  ) {
    return { 
      Icon: Footprints, 
      color: tokens.colors.accent.warning,
      category: 'Walking'
    };
  }
  
  // SWIMMING - Waves (blue) - NEW CATEGORY
  if (
    name.includes('swim')
  ) {
    return { 
      Icon: Waves, 
      color: tokens.colors.accent.info,
      category: 'Swimming'
    };
  }
  
  // GENERAL CARDIO - Heart (red)
  if (
    name.includes('cardio') || 
    name.includes('hiit') ||
    name.includes('elliptical') ||
    name.includes('rowing') && !name.includes('row') ||
    name.includes('jump') && (name.includes('rope') || name.includes('jack'))
  ) {
    return { 
      Icon: Heart, 
      color: tokens.colors.accent.error,
      category: 'Cardio'
    };
  }
  
  // STRETCHING - Wind (blue) - NEW CATEGORY
  if (
    name.includes('stretch') || 
    name.includes('yoga') ||
    name.includes('mobility') ||
    name.includes('foam') && name.includes('roll')
  ) {
    return { 
      Icon: Wind, 
      color: tokens.colors.accent.info,
      category: 'Flexibility'
    };
  }
  
  // BODYWEIGHT - User (gray) - NEW CATEGORY
  if (
    name.includes('bodyweight') || 
    name.includes('calisthenics')
  ) {
    return { 
      Icon: User, 
      color: tokens.colors.text.secondary,
      category: 'Bodyweight'
    };
  }
  
  // DEFAULT FALLBACK - Dumbbell (gray)
  return { 
    Icon: Dumbbell, 
    color: tokens.colors.text.secondary,
    category: 'General'
  };
};

/**
 * Get a simplified icon for workout type badges (Push/Pull/Legs)
 * @param workoutType - The type of workout
 * @returns Icon component and color
 */
export const getWorkoutTypeIcon = (workoutType: string): { Icon: LucideIcon; color: string } => {
  const type = workoutType.toLowerCase();
  
  if (type.includes('push') || type.includes('chest')) {
    return { Icon: Dumbbell, color: tokens.colors.badge.gold };
  }
  
  if (type.includes('pull') || type.includes('back')) {
    return { Icon: TrendingUp, color: tokens.colors.badge.silver };
  }
  
  if (type.includes('leg')) {
    return { Icon: Zap, color: tokens.colors.badge.bronze };
  }
  
  if (type.includes('cardio') || type.includes('run')) {
    return { Icon: Activity, color: tokens.colors.accent.error };
  }
  
  if (type.includes('full') || type.includes('total')) {
    return { Icon: User, color: tokens.colors.accent.primary };
  }
  
  return { Icon: Dumbbell, color: tokens.colors.text.secondary };
};

