/**
 * ExerciseSubstitutionService
 *
 * Provides exercise substitution recommendations based on:
 * - Injured body part (shoulder, lower_back, knee, elbow, hip)
 * - Current workout exercises
 * - Similarity scores (0.0-1.0)
 * - Movement patterns and equipment availability
 *
 * Data source: Comprehensive Exercise Substitution Mapping Database
 * 250+ scientifically-backed alternatives with EMG studies and biomechanical analysis
 */

import { supabase } from '../database/supabase.client';

// Types
export interface ExerciseSubstitution {
  id: string;
  exercise_name: string;
  substitute_name: string;
  similarity_score: number; // 0.0-1.0
  reduced_stress_area: 'shoulder' | 'lower_back' | 'knee' | 'elbow' | 'hip' | 'none';
  movement_pattern: string;
  primary_muscles: string; // Comma-separated
  equipment_required: string;
  difficulty_level: 'beginner' | 'intermediate' | 'intermediate-advanced' | 'advanced';
  notes: string;
}

export interface ExerciseBodyPartStress {
  id: string;
  exercise_name: string;
  body_part: string;
  stress_intensity: number; // 1-5 (1=low, 5=high)
  stress_type: string;
  injury_mechanism: string;
  form_errors_increase_risk: string[];
  notes: string | null;
}

export interface SubstitutionQuery {
  exercise_name: string;
  injured_body_part?: string; // Filter by reduced_stress_area
  min_similarity_score?: number; // Default: 0.60 (moderately similar)
  max_results?: number; // Default: 5
  equipment_filter?: string[]; // Filter by available equipment
  difficulty_filter?: string[]; // Filter by difficulty level
}

export interface SubstitutionResult {
  original_exercise: string;
  substitutes: ExerciseSubstitution[];
  total_found: number;
  filters_applied: {
    injured_body_part?: string;
    min_similarity: number;
    equipment?: string[];
    difficulty?: string[];
  };
}

const normalizeExerciseName = (name: string): string => name.trim().toLowerCase();

// Static, rule-based substitutions for common exercises and injury patterns.
// This supports free-tier users without relying on AI endpoints or schema changes.
const STATIC_SUBSTITUTIONS: Record<string, Record<string, ExerciseSubstitution[]>> = {
  shoulder: {
    'overhead press': [
      {
        id: 'static-shoulder-overhead-1',
        exercise_name: 'Overhead Press',
        substitute_name: 'Landmine Press',
        similarity_score: 0.85,
        reduced_stress_area: 'shoulder',
        movement_pattern: 'vertical_push',
        primary_muscles: 'deltoids, triceps',
        equipment_required: 'barbell, landmine',
        difficulty_level: 'intermediate',
        notes:
          'Landmine press keeps the shoulder in a safer scapular plane and reduces end-range overhead stress.',
      },
    ],
  },
  lower_back: {
    'barbell back squat': [
      {
        id: 'static-lb-squat-1',
        exercise_name: 'Barbell Back Squat',
        substitute_name: 'Goblet Squat',
        similarity_score: 0.8,
        reduced_stress_area: 'lower_back',
        movement_pattern: 'squat',
        primary_muscles: 'quadriceps, glutes',
        equipment_required: 'dumbbell, kettlebell',
        difficulty_level: 'beginner',
        notes:
          'Goblet squat keeps load closer to the center of mass and reduces shear stress on the lower back.',
      },
    ],
    deadlift: [
      {
        id: 'static-lb-deadlift-1',
        exercise_name: 'Deadlift',
        substitute_name: 'Trap Bar Deadlift from Blocks',
        similarity_score: 0.8,
        reduced_stress_area: 'lower_back',
        movement_pattern: 'hinge',
        primary_muscles: 'glutes, hamstrings',
        equipment_required: 'trap bar',
        difficulty_level: 'intermediate',
        notes:
          'Elevating the bar and using a trap bar reduces torso forward lean and lumbar loading.',
      },
    ],
  },
  knee: {
    'barbell back squat': [
      {
        id: 'static-knee-squat-1',
        exercise_name: 'Barbell Back Squat',
        substitute_name: 'Box Squat',
        similarity_score: 0.78,
        reduced_stress_area: 'knee',
        movement_pattern: 'squat',
        primary_muscles: 'quadriceps, glutes',
        equipment_required: 'barbell, box',
        difficulty_level: 'intermediate',
        notes:
          'Box squats limit knee flexion depth and help control forward knee travel, reducing patellofemoral stress.',
      },
    ],
  },
};

const getStaticSubstitutions = (
  exerciseName: string,
  injuredBodyPart?: string,
): ExerciseSubstitution[] => {
  if (!injuredBodyPart) return [];
  const bodyKey = injuredBodyPart.toLowerCase();
  const byBodyPart = STATIC_SUBSTITUTIONS[bodyKey];
  if (!byBodyPart) return [];
  const normalized = normalizeExerciseName(exerciseName);
  return byBodyPart[normalized] || [];
};

class ExerciseSubstitutionService {
  /**
   * Get exercise substitutions for a specific exercise
   *
   * @param query - Substitution query parameters
   * @returns Substitution results with filtered alternatives
   */
  async getSubstitutions(query: SubstitutionQuery): Promise<SubstitutionResult> {
    const {
      exercise_name,
      injured_body_part,
      min_similarity_score = 0.60, // Moderately similar threshold
      max_results = 5,
      equipment_filter,
      difficulty_filter,
    } = query;

    try {
      // Build Supabase query
      let supabaseQuery = supabase
        .from('exercise_substitutions')
        .select('*')
        .eq('exercise_name', exercise_name)
        .gte('similarity_score', min_similarity_score)
        .order('similarity_score', { ascending: false });

      // Filter by injured body part (reduced stress area)
      if (injured_body_part && injured_body_part !== 'none') {
        supabaseQuery = supabaseQuery.eq('reduced_stress_area', injured_body_part);
      }

      // Filter by equipment
      if (equipment_filter && equipment_filter.length > 0) {
        supabaseQuery = supabaseQuery.in('equipment_required', equipment_filter);
      }

      // Filter by difficulty
      if (difficulty_filter && difficulty_filter.length > 0) {
        supabaseQuery = supabaseQuery.in('difficulty_level', difficulty_filter);
      }

      // Limit results
      supabaseQuery = supabaseQuery.limit(max_results);

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('[ExerciseSubstitutionService] Error fetching substitutions:', error);
        const fallback = getStaticSubstitutions(exercise_name, injured_body_part);
        if (fallback.length > 0) {
          return {
            original_exercise: exercise_name,
            substitutes: fallback,
            total_found: fallback.length,
            filters_applied: {
              injured_body_part,
              min_similarity: min_similarity_score,
              equipment: equipment_filter,
              difficulty: difficulty_filter,
            },
          };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        const fallback = getStaticSubstitutions(exercise_name, injured_body_part);
        if (fallback.length > 0) {
          return {
            original_exercise: exercise_name,
            substitutes: fallback,
            total_found: fallback.length,
            filters_applied: {
              injured_body_part,
              min_similarity: min_similarity_score,
              equipment: equipment_filter,
              difficulty: difficulty_filter,
            },
          };
        }
      }

      return {
        original_exercise: exercise_name,
        substitutes: data || [],
        total_found: data?.length || 0,
        filters_applied: {
          injured_body_part,
          min_similarity: min_similarity_score,
          equipment: equipment_filter,
          difficulty: difficulty_filter,
        },
      };
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getSubstitutions error:', error);
      const fallback = getStaticSubstitutions(exercise_name, injured_body_part);
      if (fallback.length > 0) {
        return {
          original_exercise: exercise_name,
          substitutes: fallback,
          total_found: fallback.length,
          filters_applied: {
            injured_body_part,
            min_similarity: min_similarity_score,
            equipment: equipment_filter,
            difficulty: difficulty_filter,
          },
        };
      }
      throw error;
    }
  }

  /**
   * Get substitutions for multiple exercises in a workout
   *
   * @param exercise_names - Array of exercise names from workout
   * @param injured_body_part - Body part to protect
   * @param min_similarity_score - Minimum similarity threshold
   * @returns Map of exercise name to substitution results
   */
  async getWorkoutSubstitutions(
    exercise_names: string[],
    injured_body_part?: string,
    min_similarity_score: number = 0.60
  ): Promise<Map<string, SubstitutionResult>> {
    const results = new Map<string, SubstitutionResult>();

    try {
      // Fetch substitutions for all exercises in parallel
      const promises = exercise_names.map(exercise_name =>
        this.getSubstitutions({
          exercise_name,
          injured_body_part,
          min_similarity_score,
          max_results: 5,
        })
      );

      const substitutionResults = await Promise.all(promises);

      // Map results by exercise name
      substitutionResults.forEach(result => {
        results.set(result.original_exercise, result);
      });

      return results;
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getWorkoutSubstitutions error:', error);
      throw error;
    }
  }

  /**
   * Get best substitute for an exercise (highest similarity score)
   *
   * @param exercise_name - Exercise to substitute
   * @param injured_body_part - Body part to protect
   * @returns Best substitute or null if none found
   */
  async getBestSubstitute(
    exercise_name: string,
    injured_body_part?: string
  ): Promise<ExerciseSubstitution | null> {
    try {
      const result = await this.getSubstitutions({
        exercise_name,
        injured_body_part,
        min_similarity_score: 0.60,
        max_results: 1,
      });

      return result.substitutes.length > 0 ? result.substitutes[0] : null;
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getBestSubstitute error:', error);
      return null;
    }
  }

  /**
   * Get all exercises that have substitutions available
   *
   * @returns Array of unique exercise names
   */
  async getAvailableExercises(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_substitutions')
        .select('exercise_name')
        .order('exercise_name');

      if (error) {
        console.error('[ExerciseSubstitutionService] Error fetching available exercises:', error);
        throw error;
      }

      // Get unique exercise names
      const uniqueExercises = [...new Set(data?.map(row => row.exercise_name) || [])];
      return uniqueExercises;
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getAvailableExercises error:', error);
      throw error;
    }
  }

  /**
   * Get substitutions by movement pattern
   * Useful for finding alternatives that maintain similar movement mechanics
   *
   * @param movement_pattern - Movement pattern (squat, hinge, horizontal_push, etc.)
   * @param injured_body_part - Body part to protect
   * @param min_similarity_score - Minimum similarity threshold
   * @returns Array of substitutions matching the movement pattern
   */
  async getSubstitutionsByMovementPattern(
    movement_pattern: string,
    injured_body_part?: string,
    min_similarity_score: number = 0.60
  ): Promise<ExerciseSubstitution[]> {
    try {
      let query = supabase
        .from('exercise_substitutions')
        .select('*')
        .eq('movement_pattern', movement_pattern)
        .gte('similarity_score', min_similarity_score)
        .order('similarity_score', { ascending: false });

      if (injured_body_part && injured_body_part !== 'none') {
        query = query.eq('reduced_stress_area', injured_body_part);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ExerciseSubstitutionService] Error fetching by movement pattern:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getSubstitutionsByMovementPattern error:', error);
      throw error;
    }
  }

  /**
   * Get injury-safe alternatives for a specific body part
   * Returns all exercises that reduce stress on the specified area
   *
   * @param injured_body_part - Body part to protect
   * @param min_similarity_score - Minimum similarity threshold
   * @returns Array of injury-safe substitutions
   */
  async getInjurySafeAlternatives(
    injured_body_part: string,
    min_similarity_score: number = 0.60
  ): Promise<ExerciseSubstitution[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_substitutions')
        .select('*')
        .eq('reduced_stress_area', injured_body_part)
        .gte('similarity_score', min_similarity_score)
        .order('similarity_score', { ascending: false });

      if (error) {
        console.error('[ExerciseSubstitutionService] Error fetching injury-safe alternatives:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getInjurySafeAlternatives error:', error);
      throw error;
    }
  }

  /**
   * Check if an exercise has substitutions available
   *
   * @param exercise_name - Exercise to check
   * @returns True if substitutions exist
   */
  async hasSubstitutions(exercise_name: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('exercise_substitutions')
        .select('id')
        .eq('exercise_name', exercise_name)
        .limit(1);

      if (error) {
        console.error('[ExerciseSubstitutionService] Error checking substitutions:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('[ExerciseSubstitutionService] hasSubstitutions error:', error);
      return false;
    }
  }

  /**
   * Get body part stress data for an exercise
   *
   * @param exercise_name - Exercise to query
   * @returns Array of body part stress mappings
   */
  async getExerciseStressData(exercise_name: string): Promise<ExerciseBodyPartStress[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_body_part_stress')
        .select('*')
        .eq('exercise_name', exercise_name)
        .order('stress_intensity', { ascending: false });

      if (error) {
        console.error('[ExerciseSubstitutionService] Error fetching stress data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getExerciseStressData error:', error);
      throw error;
    }
  }

  /**
   * Get risk-aware substitutions that minimize stress on injured body part
   * Combines substitution data with body part stress intensity
   *
   * @param exercise_name - Original exercise
   * @param injured_body_part - Body part to protect
   * @param min_similarity_score - Minimum similarity threshold (default: 0.60)
   * @param max_results - Maximum results to return (default: 5)
   * @returns Substitutions sorted by: 1) lowest stress on injured part, 2) highest similarity
   */
  async getRiskAwareSubstitutions(
    exercise_name: string,
    injured_body_part: string,
    min_similarity_score: number = 0.60,
    max_results: number = 5
  ): Promise<Array<ExerciseSubstitution & { stress_on_injured_part: number | null }>> {
    try {
      // Step 1: Get all substitutions for the exercise
      const { data: substitutions, error: subError } = await supabase
        .from('exercise_substitutions')
        .select('*')
        .eq('exercise_name', exercise_name)
        .gte('similarity_score', min_similarity_score)
        .order('similarity_score', { ascending: false });

      if (subError) {
        console.error('[ExerciseSubstitutionService] Error fetching substitutions:', subError);
        throw subError;
      }

      if (!substitutions || substitutions.length === 0) {
        return [];
      }

      // Step 2: Get stress data for all substitute exercises
      const substituteNames = substitutions.map(s => s.substitute_name);
      const { data: stressData, error: stressError } = await supabase
        .from('exercise_body_part_stress')
        .select('*')
        .in('exercise_name', substituteNames)
        .eq('body_part', injured_body_part);

      if (stressError) {
        console.error('[ExerciseSubstitutionService] Error fetching stress data:', stressError);
        // Continue without stress data rather than failing
      }

      // Step 3: Map stress intensity to each substitution
      const stressMap = new Map<string, number>();
      if (stressData) {
        stressData.forEach(stress => {
          stressMap.set(stress.exercise_name, stress.stress_intensity);
        });
      }

      // Step 4: Combine data and add stress_on_injured_part field
      const enrichedSubstitutions = substitutions.map(sub => ({
        ...sub,
        stress_on_injured_part: stressMap.get(sub.substitute_name) || null,
      }));

      // Step 5: Sort by stress (lowest first), then similarity (highest first)
      enrichedSubstitutions.sort((a, b) => {
        // Prioritize exercises with no stress data (likely safer)
        if (a.stress_on_injured_part === null && b.stress_on_injured_part !== null) return -1;
        if (a.stress_on_injured_part !== null && b.stress_on_injured_part === null) return 1;

        // If both have stress data, sort by stress intensity (lower is better)
        if (a.stress_on_injured_part !== null && b.stress_on_injured_part !== null) {
          if (a.stress_on_injured_part !== b.stress_on_injured_part) {
            return a.stress_on_injured_part - b.stress_on_injured_part;
          }
        }

        // If stress is equal (or both null), sort by similarity (higher is better)
        return b.similarity_score - a.similarity_score;
      });

      // Step 6: Return top results
      return enrichedSubstitutions.slice(0, max_results);
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getRiskAwareSubstitutions error:', error);
      throw error;
    }
  }

  /**
   * Get risk-aware substitutions for an entire workout
   * Batch version of getRiskAwareSubstitutions
   *
   * @param exercise_names - Array of exercises in the workout
   * @param injured_body_part - Body part to protect
   * @param min_similarity_score - Minimum similarity threshold (default: 0.60)
   * @returns Map of exercise name to risk-aware substitutions
   */
  async getRiskAwareWorkoutSubstitutions(
    exercise_names: string[],
    injured_body_part: string,
    min_similarity_score: number = 0.60
  ): Promise<Map<string, Array<ExerciseSubstitution & { stress_on_injured_part: number | null }>>> {
    try {
      const results = new Map<string, Array<ExerciseSubstitution & { stress_on_injured_part: number | null }>>();

      // Process each exercise in parallel
      const promises = exercise_names.map(async (exercise_name) => {
        const substitutions = await this.getRiskAwareSubstitutions(
          exercise_name,
          injured_body_part,
          min_similarity_score,
          5 // Max 5 substitutions per exercise
        );
        return { exercise_name, substitutions };
      });

      const allResults = await Promise.all(promises);

      // Build results map
      allResults.forEach(({ exercise_name, substitutions }) => {
        if (substitutions.length > 0) {
          results.set(exercise_name, substitutions);
        }
      });

      return results;
    } catch (error) {
      console.error('[ExerciseSubstitutionService] getRiskAwareWorkoutSubstitutions error:', error);
      throw error;
    }
  }
}

export default new ExerciseSubstitutionService();

