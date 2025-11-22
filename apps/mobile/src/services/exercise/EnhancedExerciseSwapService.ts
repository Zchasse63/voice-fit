import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../database/supabase.client';

// Types for the enhanced swap API
export interface ExerciseSubstitute {
  exercise: string;
  similarity_score: number;
  reasoning: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty?: string;
  movement_pattern?: string;
}

export interface ContextBadge {
  type: 'injury' | 'equipment' | 'program' | 'preference' | 'ai_ranked';
  label: string;
  detail?: string;
}

export interface EnhancedSwapResponse {
  original_exercise: string;
  substitutes: ExerciseSubstitute[];
  context_applied: {
    injuries_considered: string[];
    equipment_available: string[];
    equipment_unavailable: string[];
    program_context?: string;
    user_preferences: string[];
  };
  metadata: {
    db_results: number;
    rag_results: number;
    ai_reranked: boolean;
    processing_time_ms: number;
    feature_flags: {
      enhanced_swap_enabled: boolean;
      ai_reranking_enabled: boolean;
    };
  };
  reasoning?: string;
}

export interface SwapRequestContext {
  userId: string;
  injuries?: string[];
  equipmentAvailable?: string[];
  equipmentUnavailable?: string[];
  programContext?: string;
  userPreferences?: string[];
  useAIRanking?: boolean;
}

interface CachedSwap {
  request: {
    exercise: string;
    context: SwapRequestContext;
  };
  response: EnhancedSwapResponse;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'enhanced_swap_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class EnhancedExerciseSwapService {
  private static instance: EnhancedExerciseSwapService;
  private apiBaseUrl: string;

  private constructor() {
    // Use environment variable or default to localhost
    this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  }

  public static getInstance(): EnhancedExerciseSwapService {
    if (!EnhancedExerciseSwapService.instance) {
      EnhancedExerciseSwapService.instance = new EnhancedExerciseSwapService();
    }
    return EnhancedExerciseSwapService.instance;
  }

  /**
   * Get exercise substitutions with enhanced context awareness
   */
  async getEnhancedSubstitutions(
    exercise: string,
    context: SwapRequestContext
  ): Promise<EnhancedSwapResponse> {
    try {
      // Check cache first
      const cached = await this.getCachedSwap(exercise, context);
      if (cached) {
        console.log('✅ Returning cached swap result');
        return cached;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      // Make API call
      const response = await fetch(`${this.apiBaseUrl}/api/chat/swap-exercise-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          exercise,
          user_id: context.userId,
          injuries: context.injuries || [],
          equipment_available: context.equipmentAvailable || [],
          equipment_unavailable: context.equipmentUnavailable || [],
          program_context: context.programContext,
          user_preferences: context.userPreferences || [],
          use_ai_ranking: context.useAIRanking || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: EnhancedSwapResponse = await response.json();

      // Cache the result
      await this.cacheSwap(exercise, context, data);

      return data;
    } catch (error) {
      console.error('❌ Enhanced swap error:', error);
      throw error;
    }
  }

  /**
   * Generate context badges for UI display
   */
  generateContextBadges(response: EnhancedSwapResponse): ContextBadge[] {
    const badges: ContextBadge[] = [];

    // Injury badges
    if (response.context_applied.injuries_considered.length > 0) {
      badges.push({
        type: 'injury',
        label: `${response.context_applied.injuries_considered.length} injury filter${
          response.context_applied.injuries_considered.length > 1 ? 's' : ''
        }`,
        detail: response.context_applied.injuries_considered.join(', '),
      });
    }

    // Equipment badges
    if (response.context_applied.equipment_unavailable.length > 0) {
      badges.push({
        type: 'equipment',
        label: `Avoiding ${response.context_applied.equipment_unavailable.length} equipment`,
        detail: response.context_applied.equipment_unavailable.join(', '),
      });
    }

    if (response.context_applied.equipment_available.length > 0) {
      badges.push({
        type: 'equipment',
        label: `Using ${response.context_applied.equipment_available.length} available`,
        detail: response.context_applied.equipment_available.join(', '),
      });
    }

    // Program badge
    if (response.context_applied.program_context) {
      badges.push({
        type: 'program',
        label: response.context_applied.program_context,
      });
    }

    // Preferences badge
    if (response.context_applied.user_preferences.length > 0) {
      badges.push({
        type: 'preference',
        label: `${response.context_applied.user_preferences.length} preference${
          response.context_applied.user_preferences.length > 1 ? 's' : ''
        }`,
        detail: response.context_applied.user_preferences.join(', '),
      });
    }

    // AI ranking badge
    if (response.metadata.ai_reranked) {
      badges.push({
        type: 'ai_ranked',
        label: '🤖 AI Re-ranked',
        detail: 'Personalized with AI reasoning',
      });
    }

    return badges;
  }

  /**
   * Check if swap is cached and still valid
   */
  private async getCachedSwap(
    exercise: string,
    context: SwapRequestContext
  ): Promise<EnhancedSwapResponse | null> {
    try {
      const cacheKey = this.getCacheKey(exercise, context);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        return null;
      }

      const cached: CachedSwap = JSON.parse(cachedData);
      const age = Date.now() - cached.timestamp;

      // Check if cache is still valid (24 hours)
      if (age > CACHE_DURATION_MS) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cached.response;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache swap result for 24 hours
   */
  private async cacheSwap(
    exercise: string,
    context: SwapRequestContext,
    response: EnhancedSwapResponse
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(exercise, context);
      const cached: CachedSwap = {
        request: { exercise, context },
        response,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.warn('Cache write error:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Generate cache key based on exercise and context
   */
  private getCacheKey(exercise: string, context: SwapRequestContext): string {
    const normalizedExercise = exercise.toLowerCase().trim();
    const contextHash = JSON.stringify({
      injuries: context.injuries?.sort() || [],
      equipAvail: context.equipmentAvailable?.sort() || [],
      equipUnavail: context.equipmentUnavailable?.sort() || [],
      program: context.programContext || '',
      prefs: context.userPreferences?.sort() || [],
      aiRank: context.useAIRanking || false,
    });

    return `${CACHE_KEY_PREFIX}${normalizedExercise}_${this.hashString(contextHash)}`;
  }

  /**
   * Simple string hash for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all cached swaps
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️ Cleared ${cacheKeys.length} cached swaps`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ count: number; oldestAge: number | null }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      if (cacheKeys.length === 0) {
        return { count: 0, oldestAge: null };
      }

      const items = await AsyncStorage.multiGet(cacheKeys);
      let oldestTimestamp = Date.now();

      for (const [_, value] of items) {
        if (value) {
          const cached: CachedSwap = JSON.parse(value);
          oldestTimestamp = Math.min(oldestTimestamp, cached.timestamp);
        }
      }

      return {
        count: cacheKeys.length,
        oldestAge: Date.now() - oldestTimestamp,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { count: 0, oldestAge: null };
    }
  }

  /**
   * Fallback to legacy swap endpoint if enhanced fails
   */
  async getLegacySubstitutions(
    exercise: string,
    userId: string
  ): Promise<{ substitutes: string[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/chat/swap-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          exercise,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Legacy swap error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedSwapService = EnhancedExerciseSwapService.getInstance();
