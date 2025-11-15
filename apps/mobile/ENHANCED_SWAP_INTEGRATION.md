# Enhanced Exercise Swap - Mobile Integration

## Overview

The Enhanced Exercise Swap feature brings context-aware exercise substitutions to the VoiceFit mobile app. This integration includes:

- **Service Layer**: API client for enhanced swap endpoint
- **UI Components**: Rich card component with context badges and AI reasoning
- **React Hooks**: Easy-to-use hooks for state management
- **Offline Caching**: 24-hour cache for swap results
- **Feature Detection**: Automatic fallback to legacy endpoints

## Architecture

```
apps/mobile/src/
├── services/exercise/
│   └── EnhancedExerciseSwapService.ts    # Core service with caching
├── components/chat/
│   └── EnhancedExerciseSwapCard.tsx      # UI component with badges
├── hooks/
│   └── useEnhancedExerciseSwap.ts        # React hook for state management
└── screens/
    └── ExerciseSwapExample.tsx           # Demo/reference implementation
```

## Quick Start

### 1. Basic Usage with Hook

```typescript
import { useEnhancedExerciseSwap } from '../hooks/useEnhancedExerciseSwap';
import { EnhancedExerciseSwapCard } from '../components/chat/EnhancedExerciseSwapCard';

function MyComponent() {
  const { 
    loading, 
    response, 
    contextBadges, 
    getSubstitutions 
  } = useEnhancedExerciseSwap({
    useAIRanking: false, // Set to true for premium users
  });

  const handleSwap = async () => {
    await getSubstitutions('Barbell Back Squat', {
      injuries: ['knee pain'],
      equipmentUnavailable: ['barbell'],
    });
  };

  return (
    <View>
      {loading && <ActivityIndicator />}
      
      {response && (
        <EnhancedExerciseSwapCard
          response={response}
          contextBadges={contextBadges}
          onSubstituteSelect={(sub) => {
            console.log('Selected:', sub.exercise);
          }}
        />
      )}
    </View>
  );
}
```

### 2. Direct Service Usage (Advanced)

```typescript
import { enhancedSwapService } from '../services/exercise/EnhancedExerciseSwapService';

// Get substitutions
const result = await enhancedSwapService.getEnhancedSubstitutions(
  'Barbell Back Squat',
  {
    userId: user.id,
    injuries: ['knee pain'],
    equipmentUnavailable: ['barbell'],
    useAIRanking: true,
  }
);

// Generate UI badges
const badges = enhancedSwapService.generateContextBadges(result);

// Manage cache
await enhancedSwapService.clearCache();
const stats = await enhancedSwapService.getCacheStats();
```

## Features

### Context-Aware Substitutions

The enhanced swap considers multiple context factors:

```typescript
interface SwapRequestContext {
  userId: string;
  injuries?: string[];               // e.g., ['knee pain', 'lower back']
  equipmentAvailable?: string[];     // e.g., ['dumbbells', 'resistance bands']
  equipmentUnavailable?: string[];   // e.g., ['barbell', 'squat rack']
  programContext?: string;           // e.g., 'powerlifting', 'hypertrophy'
  userPreferences?: string[];        // e.g., ['low impact', 'bodyweight']
  useAIRanking?: boolean;            // Premium feature
}
```

### Context Badges

Visual indicators show what context was applied:

- **🩹 Injury Badge**: Shows injury filters applied
- **🏋️ Equipment Badge**: Shows equipment constraints
- **📋 Program Badge**: Shows program context
- **⭐ Preference Badge**: Shows user preferences
- **🤖 AI Ranked Badge**: Indicates AI re-ranking was used

### AI Re-Ranking (Premium)

When enabled, Grok 4 Fast Reasoning provides:
- Personalized substitute ordering
- Natural language reasoning for each substitute
- Context-aware explanations

```typescript
const { getSubstitutions } = useEnhancedExerciseSwap({
  useAIRanking: true, // Enable for premium users
});
```

### Offline Caching

Swap results are cached for 24 hours:

```typescript
// Cache is automatic - same request returns cached result
await getSubstitutions('Bench Press', { injuries: ['shoulder'] });
await getSubstitutions('Bench Press', { injuries: ['shoulder'] }); // ✅ Cached

// Different context = new request
await getSubstitutions('Bench Press', { injuries: ['elbow'] }); // 🆕 New API call

// Manual cache management
await clearCache();
const { count, oldestAge } = await getCacheStats();
```

**Cache Key Generation:**
- Based on exercise name + context hash
- Normalized to handle case/whitespace variations
- Separate cache entries for different contexts

### Fallback Strategy

Automatic fallback to legacy endpoint:

```typescript
try {
  // Try enhanced endpoint first
  await getSubstitutions(exercise, context);
} catch (error) {
  // Manual fallback if needed
  await getLegacySubstitutions(exercise);
}
```

## UI Components

### EnhancedExerciseSwapCard

Full-featured card with:
- Collapsible substitute details
- Match percentage scores
- Difficulty badges
- Muscle groups and equipment tags
- AI reasoning (when available)
- Debug mode for development

**Props:**

```typescript
interface EnhancedExerciseSwapCardProps {
  response: EnhancedSwapResponse;
  onSubstituteSelect: (substitute: ExerciseSubstitute) => void;
  contextBadges: ContextBadge[];
  showDebugInfo?: boolean;
}
```

**Features:**
- Tap to expand substitute details
- Toggle AI reasoning section
- Visual difficulty indicators
- Horizontal scrolling context badges

## Response Structure

```typescript
interface EnhancedSwapResponse {
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
  reasoning?: string; // Present when AI re-ranked
}
```

## Configuration

### API Base URL

Set in `apps/mobile/src/services/api/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
};
```

### Feature Flags

Backend controls feature availability:
- `enhanced_swap_enabled`: Enhanced endpoint availability
- `ai_reranking_enabled`: AI re-ranking availability

Frontend checks these flags in response metadata.

## Integration Points

### Chat Screen Integration

```typescript
// In your chat message handler
if (message.type === 'exercise_swap_request') {
  const { exercise, context } = parseMessage(message);
  
  await getSubstitutions(exercise, {
    injuries: context.injuries,
    equipmentUnavailable: context.unavailableEquipment,
    useAIRanking: user.isPremium,
  });
}
```

### Workout Logging Integration

```typescript
// When user selects a substitute
const handleSubstituteSelect = (substitute: ExerciseSubstitute) => {
  // Update workout log with new exercise
  workoutService.swapExercise({
    originalExercise: response.original_exercise,
    newExercise: substitute.exercise,
    reason: substitute.reasoning,
  });
  
  // Continue with workout logging
  navigation.navigate('WorkoutLog', {
    exercise: substitute.exercise,
  });
};
```

### Context Gathering

```typescript
// Gather context from various sources
const context: SwapRequestContext = {
  userId: user.id,
  
  // From injury store
  injuries: injuryStore.getActiveInjuries().map(i => i.name),
  
  // From equipment preferences
  equipmentUnavailable: equipmentStore.getUnavailable(),
  equipmentAvailable: equipmentStore.getAvailable(),
  
  // From current program
  programContext: programStore.getCurrentProgram()?.type,
  
  // From user preferences
  userPreferences: userStore.getExercisePreferences(),
  
  // Based on subscription tier
  useAIRanking: user.subscriptionTier === 'premium',
};
```

## Performance

### Latency Expectations

| Scenario | Expected Time |
|----------|--------------|
| Cache hit | < 10ms |
| DB-only (simple swap) | 100-200ms |
| DB + RAG (complex swap) | 200-300ms |
| With AI re-ranking | 300-500ms |

### Optimization Tips

1. **Preload Context**: Gather user context once, reuse for multiple swaps
2. **Batch Requests**: If swapping multiple exercises, consider parallel requests
3. **Cache Warming**: Pre-fetch common swaps during idle time
4. **Progressive Loading**: Show DB results immediately, append RAG results when ready

## Testing

### Unit Tests

```typescript
describe('EnhancedExerciseSwapService', () => {
  it('should cache results for 24 hours', async () => {
    const service = EnhancedExerciseSwapService.getInstance();
    
    // First call - hits API
    await service.getEnhancedSubstitutions('Bench Press', context);
    
    // Second call - from cache
    const result = await service.getEnhancedSubstitutions('Bench Press', context);
    
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('useEnhancedExerciseSwap', () => {
  it('should handle error gracefully', async () => {
    const { result } = renderHook(() => useEnhancedExerciseSwap());
    
    await act(async () => {
      await result.current.getSubstitutions('Invalid Exercise', {});
    });
    
    expect(result.current.error).toBeDefined();
    expect(result.current.response).toBeNull();
  });
});
```

## Troubleshooting

### Common Issues

**1. "No active session" error**
- Ensure user is authenticated before calling swap service
- Check Supabase session is valid

**2. Cache not working**
- Verify AsyncStorage permissions
- Check cache key generation (different contexts = different cache)

**3. Context badges not showing**
- Ensure `autoGenerateBadges: true` in hook options
- Verify response contains context_applied data

**4. AI reasoning not appearing**
- Check `useAIRanking` is set to true
- Verify user has premium subscription
- Confirm backend feature flag is enabled

### Debug Mode

Enable debug info to see:
- DB vs RAG result counts
- Processing times
- Feature flag states
- AI re-ranking status

```typescript
<EnhancedExerciseSwapCard
  response={response}
  contextBadges={contextBadges}
  onSubstituteSelect={handleSelect}
  showDebugInfo={true} // Enable debug mode
/>
```

## Migration Guide

### From Legacy Swap

**Before:**
```typescript
const response = await fetch('/api/chat/swap-exercise', {
  method: 'POST',
  body: JSON.stringify({ exercise, user_id }),
});
const { substitutes } = await response.json();
```

**After:**
```typescript
const { getSubstitutions, response } = useEnhancedExerciseSwap();
await getSubstitutions(exercise, { 
  injuries: userInjuries 
});
// response.substitutes contains enhanced results
```

## Next Steps

### Phase 1 Complete ✅
- [x] Service layer with caching
- [x] UI components with badges
- [x] React hooks for state management
- [x] Example screen

### Phase 2 (Recommended)
- [ ] Integrate with injury store for automatic context
- [ ] Add to main chat interface
- [ ] Implement workout log integration
- [ ] Add analytics tracking
- [ ] E2E tests on device

### Phase 3 (Future)
- [ ] Video previews for substitutes
- [ ] Exercise library deep links
- [ ] Save favorite substitutions
- [ ] Swap history tracking
- [ ] Offline-first mode

## Resources

- **Backend Docs**: `apps/backend/ENHANCED_CONTEXT_AWARE_IMPLEMENTATION.md`
- **API Endpoint**: `/api/chat/swap-exercise-enhanced`
- **Example Screen**: `apps/mobile/src/screens/ExerciseSwapExample.tsx`
- **Service**: `apps/mobile/src/services/exercise/EnhancedExerciseSwapService.ts`

## Support

For issues or questions:
1. Check debug mode output
2. Review backend logs in Railway
3. Verify feature flags are enabled
4. Test with legacy endpoint as comparison

---

**Last Updated**: Phase 1 Day 3 - Mobile Integration Complete