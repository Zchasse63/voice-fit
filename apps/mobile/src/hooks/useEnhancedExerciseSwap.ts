import { useState, useCallback } from 'react';
import {
  enhancedSwapService,
  EnhancedSwapResponse,
  SwapRequestContext,
  ContextBadge,
} from '../services/exercise/EnhancedExerciseSwapService';
import { useAuthStore } from '../store/auth.store';

interface UseEnhancedExerciseSwapOptions {
  autoGenerateBadges?: boolean;
  enableCache?: boolean;
  useAIRanking?: boolean;
}

interface UseEnhancedExerciseSwapReturn {
  // State
  loading: boolean;
  error: Error | null;
  response: EnhancedSwapResponse | null;
  contextBadges: ContextBadge[];

  // Methods
  getSubstitutions: (exercise: string, context?: Partial<SwapRequestContext>) => Promise<void>;
  getLegacySubstitutions: (exercise: string) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<{ count: number; oldestAge: number | null }>;
  reset: () => void;
}

export const useEnhancedExerciseSwap = (
  options: UseEnhancedExerciseSwapOptions = {}
): UseEnhancedExerciseSwapReturn => {
  const {
    autoGenerateBadges = true,
    useAIRanking = false,
  } = options;
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<EnhancedSwapResponse | null>(null);
  const [contextBadges, setContextBadges] = useState<ContextBadge[]>([]);

  /**
   * Get enhanced substitutions with context
   */
  const getSubstitutions = useCallback(
    async (exercise: string, contextOverrides: Partial<SwapRequestContext> = {}) => {
      if (!user?.id) {
        setError(new Error('User not authenticated'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build context
        const context: SwapRequestContext = {
          userId: user.id,
          injuries: contextOverrides.injuries,
          equipmentAvailable: contextOverrides.equipmentAvailable,
          equipmentUnavailable: contextOverrides.equipmentUnavailable,
          programContext: contextOverrides.programContext,
          userPreferences: contextOverrides.userPreferences,
          useAIRanking: contextOverrides.useAIRanking ?? useAIRanking,
        };

        // Get substitutions
        const result = await enhancedSwapService.getEnhancedSubstitutions(
          exercise,
          context
        );

        setResponse(result);

        // Generate badges if enabled
        if (autoGenerateBadges) {
          const badges = enhancedSwapService.generateContextBadges(result);
          setContextBadges(badges);
        }

        console.log('✅ Enhanced swap successful:', {
          exercise,
          substitutes: result.substitutes.length,
          aiReranked: result.metadata.ai_reranked,
          processingTime: result.metadata.processing_time_ms,
        });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('❌ Enhanced swap failed:', errorObj);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, useAIRanking, autoGenerateBadges]
  );

  /**
   * Fallback to legacy swap endpoint
   */
  const getLegacySubstitutions = useCallback(
    async (exercise: string) => {
      if (!user?.id) {
        setError(new Error('User not authenticated'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await enhancedSwapService.getLegacySubstitutions(
          exercise,
          user.id
        );

        // Convert to enhanced format for consistency
        const enhancedResult: EnhancedSwapResponse = {
          original_exercise: exercise,
          substitutes: result.substitutes.map((sub) => ({
            exercise: sub,
            similarity_score: 0.8,
            reasoning: 'Legacy substitution',
            muscle_groups: [],
            equipment: [],
          })),
          context_applied: {
            injuries_considered: [],
            equipment_available: [],
            equipment_unavailable: [],
            user_preferences: [],
          },
          metadata: {
            db_results: result.substitutes.length,
            rag_results: 0,
            ai_reranked: false,
            processing_time_ms: 0,
            feature_flags: {
              enhanced_swap_enabled: false,
              ai_reranking_enabled: false,
            },
          },
        };

        setResponse(enhancedResult);
        setContextBadges([]);

        console.log('✅ Legacy swap successful:', {
          exercise,
          substitutes: result.substitutes.length,
        });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('❌ Legacy swap failed:', errorObj);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Clear all cached swaps
   */
  const clearCache = useCallback(async () => {
    try {
      await enhancedSwapService.clearCache();
      console.log('🗑️ Cache cleared');
    } catch (err) {
      console.error('❌ Cache clear failed:', err);
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    return await enhancedSwapService.getCacheStats();
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResponse(null);
    setContextBadges([]);
  }, []);

  return {
    loading,
    error,
    response,
    contextBadges,
    getSubstitutions,
    getLegacySubstitutions,
    clearCache,
    getCacheStats,
    reset,
  };
};

/**
 * Helper hook to gather user context for swaps
 */
export const useSwapContext = () => {
  // TODO: Integrate with injury store, equipment store, program store
  // For now, return empty context that can be overridden

  const getDefaultContext = useCallback((): Partial<SwapRequestContext> => {
    return {
      injuries: [], // TODO: Get from injury store
      equipmentAvailable: [], // TODO: Get from equipment preferences
      equipmentUnavailable: [], // TODO: Get from equipment preferences
      programContext: undefined, // TODO: Get from current program
      userPreferences: [], // TODO: Get from user preferences
    };
  }, []);

  return {
    getDefaultContext,
  };
};
