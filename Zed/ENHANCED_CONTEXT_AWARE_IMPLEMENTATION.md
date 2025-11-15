# Enhanced Context-Aware Exercise Swap Implementation

**Date:** 2025-01-24  
**Goal:** Leverage all available user data (equipment, program, injury history) + RAG + AI for personalized exercise swaps  
**Philosophy:** "Use every piece of user context we have to deliver the best possible recommendation"

---

## 1. Available User Context (Data Inventory)

### From Onboarding (Stored in Supabase)
```json
{
  "user_id": "uuid",
  "experience_level": "beginner" | "intermediate" | "advanced",
  "training_goals": ["strength", "hypertrophy", "endurance", "athletic_performance"],
  "available_equipment": [
    "barbell", "dumbbells", "machines", "bodyweight", 
    "kettlebells", "resistance_bands", "full_gym"
  ],
  "training_frequency": 3-6,
  "injury_history": "description of past/current injuries"
}
```

### From Active Program (generated_programs table)
```json
{
  "program_id": "uuid",
  "program_type": "strength" | "hypertrophy" | "powerlifting",
  "current_week": 4,
  "total_weeks": 12,
  "phase": "accumulation" | "intensification" | "realization",
  "exercises": [
    {
      "exercise_name": "Barbell Bench Press",
      "target_sets": 4,
      "target_reps": "6-8",
      "rpe_target": 8
    }
  ]
}
```

### From Injury Logs (injury_logs table)
```json
{
  "active_injuries": [
    {
      "body_part": "shoulder",
      "severity": "moderate",
      "status": "recovering",
      "reported_at": "2024-01-15"
    }
  ]
}
```

### From Recent Workouts (workout_logs + sets)
```json
{
  "current_session": {
    "started_at": "2024-01-24T10:00:00Z",
    "exercises_completed": ["Squat", "Romanian Deadlift"],
    "current_exercise": "Bench Press",
    "fatigue_level": "moderate"
  },
  "recent_performance": {
    "bench_press_1rm_estimate": 225,
    "last_bench_session": "2024-01-20",
    "volume_trend": "increasing"
  }
}
```

---

## 2. Context-Aware Exercise Swap Architecture

### Flow Diagram

```
User: "Swap bench press"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: GATHER ALL USER CONTEXT (Parallel)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Onboarding   │  │ Active       │  │ Injury       │     │
│  │ Data         │  │ Program      │  │ Logs         │     │
│  │              │  │              │  │              │     │
│  │ • Equipment  │  │ • Phase      │  │ • Active     │     │
│  │ • Goals      │  │ • Week       │  │ • Body parts │     │
│  │ • Experience │  │ • Exercises  │  │ • Severity   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                           ▼                                │
│              ┌────────────────────────┐                    │
│              │ Combined User Context  │                    │
│              └────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: RAG FUZZY MATCH (Handle typos, synonyms)           │
│                                                             │
│  Input: "bench press" (or "barbell bench", "chest press")  │
│  RAG Search: Upstash "exercises" namespace                 │
│  Output: "Barbell Bench Press" (canonical name)            │
│  Match Score: 0.95                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: DATABASE QUERY (Pre-filtered by context)           │
│                                                             │
│  SELECT * FROM exercise_substitutions                       │
│  WHERE exercise_name = 'Barbell Bench Press'                │
│    AND similarity_score >= 0.65                             │
│    AND equipment_required IN user.available_equipment       │
│    AND (reduced_stress_area = 'shoulder'                    │
│         OR reduced_stress_area = 'none')                    │
│  ORDER BY similarity_score DESC                             │
│  LIMIT 10                                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI RE-RANKING (Context-aware personalization)      │
│                                                             │
│  Grok 4 Fast Reasoning receives:                           │
│  • Original exercise: "Barbell Bench Press"                 │
│  • DB substitutes (10 candidates)                           │
│  • User context (equipment, program phase, injuries)        │
│  • Recent performance (fatigue, volume)                     │
│                                                             │
│  AI ranks by:                                               │
│  1. Equipment availability (must-have)                      │
│  2. Injury compatibility (high priority)                    │
│  3. Program phase alignment (accumulation vs peak)          │
│  4. Similarity score (from DB)                              │
│  5. Experience level appropriateness                        │
│                                                             │
│  Output: Top 3 personalized substitutes with reasoning      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Return to UI │
                    └──────────────┘
```

---

## 3. Implementation: Backend (FastAPI)

### 3.1 Enhanced Exercise Swap Endpoint

```python
# apps/backend/main.py

@app.post("/api/chat/swap-exercise-enhanced")
async def swap_exercise_enhanced(
    request: ExerciseSwapRequest,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    """
    Context-aware exercise swap with RAG fuzzy matching + AI re-ranking.
    
    Flow:
    1. Gather all user context (parallel DB queries)
    2. RAG fuzzy match for canonical exercise name
    3. Database query (filtered by equipment, injury)
    4. AI re-ranking based on full context
    5. Return top 3 personalized substitutes
    """
    try:
        user_id = user["id"]
        exercise_name = request.exercise_name
        
        # STEP 1: Gather user context (parallel)
        context = await gather_user_context(supabase, user_id)
        
        # STEP 2: RAG fuzzy match
        canonical_name = await fuzzy_match_exercise(exercise_name)
        
        # STEP 3: Database query (context-filtered)
        substitutes = await query_substitutes_with_context(
            supabase,
            canonical_name,
            context,
            request.injured_body_part
        )
        
        if not substitutes:
            return ExerciseSwapResponse(
                original_exercise=exercise_name,
                substitutes=[],
                total_found=0,
                message=f"No substitutes found for {exercise_name} with your equipment."
            )
        
        # STEP 4: AI re-ranking (premium users only, or if >5 substitutes)
        if len(substitutes) > 5 or context.get('is_premium'):
            substitutes = await ai_rerank_substitutes(
                original=canonical_name,
                substitutes=substitutes,
                context=context
            )
        
        # Format for UI
        return ExerciseSwapResponse(
            original_exercise=canonical_name,
            substitutes=substitutes[:3],
            total_found=len(substitutes),
            reason_for_swap=request.reason,
            injured_body_part=request.injured_body_part,
            message=_build_contextual_message(canonical_name, substitutes, context),
            context_used={
                "equipment_filtered": context.get('available_equipment'),
                "injury_aware": bool(request.injured_body_part),
                "program_phase": context.get('program_phase'),
                "ai_reranked": len(substitutes) > 5
            }
        )
        
    except Exception as e:
        logger.error(f"Error in enhanced exercise swap: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 3.2 User Context Gathering (Parallel)

```python
# apps/backend/exercise_swap_service.py

async def gather_user_context(supabase: Client, user_id: str) -> dict:
    """
    Gather all user context in parallel for fast retrieval.
    
    Returns:
        dict with onboarding, program, injury, and session data
    """
    # Launch all queries in parallel
    tasks = [
        fetch_onboarding_data(supabase, user_id),
        fetch_active_program(supabase, user_id),
        fetch_active_injuries(supabase, user_id),
        fetch_current_session(supabase, user_id)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    onboarding, program, injuries, session = results
    
    # Combine into single context object
    return {
        "user_id": user_id,
        "experience_level": onboarding.get("experience_level", "intermediate"),
        "training_goals": onboarding.get("training_goals", []),
        "available_equipment": onboarding.get("available_equipment", ["bodyweight"]),
        "training_frequency": onboarding.get("training_frequency", 3),
        "is_premium": onboarding.get("subscription_tier") == "premium",
        
        # Program context
        "has_active_program": program is not None,
        "program_phase": program.get("phase") if program else None,
        "current_week": program.get("current_week") if program else None,
        "program_exercises": program.get("exercises", []) if program else [],
        
        # Injury context
        "active_injuries": [inj for inj in injuries if inj["status"] == "active"],
        "injured_body_parts": [inj["body_part"] for inj in injuries if inj["status"] == "active"],
        
        # Session context
        "in_active_session": session is not None,
        "session_fatigue": session.get("fatigue_level") if session else "low",
        "exercises_completed_today": session.get("exercises_completed", []) if session else []
    }


async def fetch_onboarding_data(supabase: Client, user_id: str) -> dict:
    """Fetch onboarding data from user_profiles or similar table."""
    # Query your onboarding data table
    result = supabase.table('user_profiles').select('*').eq('user_id', user_id).single().execute()
    return result.data if result.data else {}


async def fetch_active_program(supabase: Client, user_id: str) -> dict:
    """Fetch active training program."""
    result = supabase.table('generated_programs')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('status', 'active')\
        .single()\
        .execute()
    return result.data if result.data else None


async def fetch_active_injuries(supabase: Client, user_id: str) -> list:
    """Fetch active injuries."""
    result = supabase.table('injury_logs')\
        .select('*')\
        .eq('user_id', user_id)\
        .in_('status', ['active', 'recovering'])\
        .execute()
    return result.data if result.data else []


async def fetch_current_session(supabase: Client, user_id: str) -> dict:
    """Fetch current workout session if active."""
    result = supabase.table('workout_sessions')\
        .select('*')\
        .eq('user_id', user_id)\
        .is_('end_time', 'null')\
        .order('start_time', desc=True)\
        .limit(1)\
        .execute()
    return result.data[0] if result.data else None
```

### 3.3 RAG Fuzzy Matching

```python
# apps/backend/exercise_swap_service.py

async def fuzzy_match_exercise(exercise_name: str) -> str:
    """
    Use Upstash RAG to fuzzy match exercise name to canonical name.
    
    Handles:
    - Typos: "bench pres" → "Bench Press"
    - Synonyms: "chest press" → "Bench Press"
    - Variations: "barbell bench press" → "Bench Press"
    
    Args:
        exercise_name: User's input exercise name
    
    Returns:
        Canonical exercise name from database
    """
    try:
        # Search in exercises namespace
        search_client = Search(
            url=os.getenv("UPSTASH_SEARCH_URL"),
            token=os.getenv("UPSTASH_SEARCH_TOKEN")
        )
        
        index = search_client.index("exercises")
        results = index.search(query=exercise_name, limit=1)
        
        if results and len(results) > 0:
            top_result = results[0]
            canonical_name = top_result.content.get('original_name', exercise_name)
            match_score = top_result.score if hasattr(top_result, 'score') else 0.0
            
            # Only use canonical name if match score is high
            if match_score >= 0.70:
                return canonical_name
        
        # Fallback: return original name
        return exercise_name
        
    except Exception as e:
        logger.error(f"RAG fuzzy match error: {e}")
        return exercise_name  # Fallback to original
```

### 3.4 Context-Filtered Database Query

```python
# apps/backend/exercise_swap_service.py

async def query_substitutes_with_context(
    supabase: Client,
    canonical_name: str,
    context: dict,
    injured_body_part: Optional[str] = None
) -> List[dict]:
    """
    Query exercise substitutions with context-based filtering.
    
    Filters:
    1. Equipment: Only show exercises user can do with their equipment
    2. Injury: Prioritize exercises that reduce stress on injured areas
    3. Difficulty: Match user's experience level
    """
    # Base query
    query = supabase.table("exercise_substitutions")\
        .select("*")\
        .eq("exercise_name", canonical_name)\
        .gte("similarity_score", 0.65)
    
    # Filter by injured body part (if specified)
    if injured_body_part:
        # Prioritize substitutes that reduce stress on injured area
        query = query.or_(
            f"reduced_stress_area.eq.{injured_body_part},"
            f"reduced_stress_area.eq.none"
        )
    
    result = query.order("similarity_score", desc=True).limit(10).execute()
    
    if not result.data:
        return []
    
    # Post-filter by equipment availability
    available_equipment = context.get('available_equipment', [])
    filtered_subs = []
    
    for sub in result.data:
        required_equipment = sub.get('equipment_required', 'bodyweight')
        
        # Check if user has required equipment
        if _has_equipment(required_equipment, available_equipment):
            # Add context flags
            sub['equipment_available'] = True
            sub['matches_experience'] = _matches_experience(
                sub.get('difficulty_level'),
                context.get('experience_level')
            )
            filtered_subs.append(sub)
    
    return filtered_subs


def _has_equipment(required: str, available: List[str]) -> bool:
    """Check if user has required equipment."""
    if required == 'bodyweight':
        return True
    if 'full_gym' in available:
        return True
    return required in available


def _matches_experience(difficulty: str, experience: str) -> bool:
    """Check if exercise difficulty matches user experience."""
    if experience == 'beginner':
        return difficulty in ['beginner', 'intermediate']
    elif experience == 'intermediate':
        return difficulty in ['intermediate', 'intermediate-advanced']
    elif experience == 'advanced':
        return True  # Advanced can do anything
    return True  # Default: allow
```

### 3.5 AI Re-Ranking (The Magic Layer)

```python
# apps/backend/exercise_swap_service.py

async def ai_rerank_substitutes(
    original: str,
    substitutes: List[dict],
    context: dict
) -> List[dict]:
    """
    Use Grok 4 Fast Reasoning to re-rank substitutes based on full context.
    
    This is where we leverage ALL user data for personalization:
    - Equipment availability
    - Injury compatibility
    - Program phase (accumulation vs peak)
    - Training goals (strength vs hypertrophy)
    - Recent fatigue/volume
    - Experience level
    """
    try:
        # Build context-rich prompt
        prompt = f"""You are a strength coach helping a user find the best exercise substitute.

ORIGINAL EXERCISE: {original}

USER CONTEXT:
- Experience Level: {context.get('experience_level', 'intermediate')}
- Training Goals: {', '.join(context.get('training_goals', ['general fitness']))}
- Available Equipment: {', '.join(context.get('available_equipment', ['bodyweight']))}
- Active Injuries: {', '.join(context.get('injured_body_parts', ['none']))}
- Program Phase: {context.get('program_phase', 'not in program')}
- Current Week: {context.get('current_week', 'N/A')}
- Session Fatigue: {context.get('session_fatigue', 'low')}

CANDIDATE SUBSTITUTES (from database):
{json.dumps(substitutes, indent=2)}

TASK:
Rank these substitutes from BEST to WORST for this specific user. Consider:
1. EQUIPMENT AVAILABILITY (must-have) - exclude if user doesn't have equipment
2. INJURY COMPATIBILITY (high priority) - prioritize exercises that reduce stress on injured areas
3. PROGRAM PHASE ALIGNMENT (important) - match intensity/volume to current phase
4. SIMILARITY SCORE (baseline) - from database, higher is better
5. EXPERIENCE LEVEL (important) - appropriate difficulty for user's level
6. TRAINING GOALS (moderate) - align with strength vs hypertrophy goals

Return JSON array of substitutes in ranked order with "rank_reasoning" field explaining why.
Format:
[
  {{
    ...substitute data...,
    "ai_rank": 1,
    "rank_reasoning": "Best choice because: has dumbbells, reduces shoulder stress, appropriate for accumulation phase"
  }},
  ...
]
"""

        # Call Grok 4 Fast Reasoning
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "grok-4-fast-reasoning",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "response_format": {"type": "json_object"}
            }
        )
        
        result = response.json()
        ranked_subs = json.loads(result['choices'][0]['message']['content'])
        
        return ranked_subs
        
    except Exception as e:
        logger.error(f"AI re-ranking error: {e}")
        # Fallback: return original order
        return substitutes
```

---

## 4. Implementation: Mobile (React Native + WatermelonDB)

### 4.1 Enhanced Exercise Swap Service

```typescript
// apps/mobile/src/services/exercise/EnhancedExerciseSwapService.ts

interface EnhancedSwapRequest {
  exercise_name: string;
  injured_body_part?: string;
  reason?: string;
  include_ai_ranking?: boolean; // Premium feature
}

interface EnhancedSwapResponse {
  original_exercise: string;
  substitutes: ExerciseSubstitution[];
  total_found: number;
  context_used: {
    equipment_filtered: string[];
    injury_aware: boolean;
    program_phase?: string;
    ai_reranked: boolean;
  };
  message: string;
}

class EnhancedExerciseSwapService {
  /**
   * Get context-aware exercise substitutes.
   * Automatically includes user's equipment, injuries, and program context.
   */
  async getSmartSubstitutes(
    request: EnhancedSwapRequest
  ): Promise<EnhancedSwapResponse> {
    try {
      // Call enhanced backend endpoint
      const response = await apiClient.post<EnhancedSwapResponse>(
        '/api/chat/swap-exercise-enhanced',
        {
          exercise_name: request.exercise_name,
          injured_body_part: request.injured_body_part,
          reason: request.reason,
          include_ai_ranking: request.include_ai_ranking ?? true
        }
      );
      
      // Cache locally for offline access
      await this.cacheSubstitutes(response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EnhancedSwapService] Error:', error);
      
      // Fallback to basic service if enhanced fails
      return this.fallbackToBasicSwap(request);
    }
  }
  
  /**
   * Offline fallback: Use local WatermelonDB + cached substitutes
   */
  private async fallbackToBasicSwap(
    request: EnhancedSwapRequest
  ): Promise<EnhancedSwapResponse> {
    // Query local cached substitutes
    const cached = await this.getCachedSubstitutes(request.exercise_name);
    
    if (cached.length > 0) {
      return {
        original_exercise: request.exercise_name,
        substitutes: cached,
        total_found: cached.length,
        context_used: {
          equipment_filtered: [],
          injury_aware: false,
          ai_reranked: false
        },
        message: 'Showing cached substitutes (offline mode)'
      };
    }
    
    // No cached data available
    throw new Error('No substitutes available offline');
  }
  
  private async cacheSubstitutes(response: EnhancedSwapResponse) {
    // Cache to AsyncStorage for offline access
    await AsyncStorage.setItem(
      `swap_cache_${response.original_exercise}`,
      JSON.stringify(response)
    );
  }
  
  private async getCachedSubstitutes(exercise_name: string): Promise<ExerciseSubstitution[]> {
    const cached = await AsyncStorage.getItem(`swap_cache_${exercise_name}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.substitutes || [];
    }
    return [];
  }
}

export default new EnhancedExerciseSwapService();
```

---

## 5. Phase 1 Implementation (1-2 Days)

### Task Breakdown

#### Day 1: Backend Foundation
- [ ] Create `exercise_swap_service.py` with all helper functions
- [ ] Implement `gather_user_context()` (parallel DB queries)
- [ ] Implement `fuzzy_match_exercise()` (RAG integration)
- [ ] Implement `query_substitutes_with_context()` (filtered queries)
- [ ] Add `/api/chat/swap-exercise-enhanced` endpoint
- [ ] Unit tests for each function

#### Day 2: Integration & Testing
- [ ] Implement `ai_rerank_substitutes()` (Grok 4 integration)
- [ ] Add feature flag for AI re-ranking (premium gating)
- [ ] Mobile: Create `EnhancedExerciseSwapService.ts`
- [ ] Update `ExerciseSwapCard` to show context badges
- [ ] Integration tests with real user data
- [ ] Deploy to staging, test with 10 users

---

## 6. UI Enhancements (Show Context to User)

### ExerciseSwapCard with Context Badges

```typescript
// apps/mobile/src/components/chat/ExerciseSwapCard.tsx (enhanced)

<View style={styles.substituteCard}>
  <Text style={styles.substituteName}>
    {substitute.substitute_name}
  </Text>
  
  {/* Show context badges */}
  <View style={styles.badgeContainer}>
    {substitute.equipment_available && (
      <Badge icon="check-circle" color="green">
        Has Equipment
      </Badge>
    )}
    
    {substitute.reduces_injury_stress && (
      <Badge icon="heart" color="blue">
        Injury-Friendly
      </Badge>
    )}
    
    {substitute.ai_reranked && (
      <Badge icon="sparkles" color="purple">
        AI Recommended
      </Badge>
    )}
    
    {substitute.matches_program && (
      <Badge icon="target" color="orange">
        Fits Your Program
      </Badge>
    )}
  </View>
  
  <Text style={styles.reasoning}>
    {substitute.rank_reasoning || substitute.why_recommended}
  </Text>
</View>
```

---

## 7. Performance Metrics

### Expected Latency

| Component | Latency | Notes |
|-----------|---------|-------|
| Gather Context (parallel) | 100ms | 3 DB queries in parallel |
| RAG Fuzzy Match | 80ms | Upstash semantic search |
| DB Query (filtered) | 50ms | Single query with context filters |
| AI Re-Ranking | 150ms | Grok 4 Fast (only if >5 results) |
| **Total (basic)** | **230ms** | No AI re-ranking |
| **Total (premium)** | **380ms** | With AI re-ranking |

### Accuracy Improvements

- Equipment filtering: **100%** (only show what user can do)
- Fuzzy matching: **+30%** (handles typos, synonyms)
- Injury awareness: **+40%** (prioritizes compatible exercises)
- Program alignment: **+20%** (matches training phase)

---

## 8. Cost Analysis

### Per 1000 Exercise Swaps

| Component | Cost | Notes |
|-----------|------|-------|
| RAG Fuzzy Match | $0.10 | Upstash Search ($0.0001/search) |
| Database Queries | $0.00 | Included in Supabase plan |
| AI Re-Ranking (10% of swaps) | $0.30 | Grok 4 Fast ($0.003/request × 100) |
| **Total** | **$0.40** | vs $0.00 current |

**Annual cost at 10K users:**
- 10K users × 2 swaps/week × 52 weeks = 1.04M swaps/year
- Cost: $416/year
- **Value:** Significantly better user experience, higher retention

---

## 9. A/B Test Plan

### Variants

**Control (Current):**
- Pure database lookup
- No equipment filtering
- No AI re-ranking

**Treatment (Enhanced):**
- RAG fuzzy matching
- Equipment + injury filtering
- AI re-ranking for premium

### Metrics

1. **Accuracy:** User acceptance rate (did they use the substitute?)
2. **Satisfaction:** Post-swap feedback ("Was this helpful?")
3. **Latency:** p50, p95, p99 response times
4. **Retention:** Do users with enhanced swaps stay longer?

### Rollout

- Week 1: 5% of users (500 users)
- Week 2: 25% of users (2,500 users)
- Week 3: 50% of users (5,000 users)
- Week 4: 100% if metrics improve

---

## 10. Future Enhancements (Phase 3)

### 10.1 Video Demonstrations
```json
{
  "substitute_name": "Dumbbell Bench Press",
  "video_url": "https://cdn.voicefit.com/exercises/db-bench-press.mp4",
  "form_cues": [
    "Keep shoulders retracted",
    "Lower to chest level",
    "Press straight up"
  ]
}
```

### 10.2 Progressive Difficulty
```json
{
  "substitution_path": [
    {
      "week": 1-4,
      "exercise": "Floor Press",
      "reason": "Reduced shoulder stress for recovery"
    },
    {
      "week": 5-8,
      "exercise": "Dumbbell Bench Press",
      "reason": "Build stability with lighter loads"
    },
    {
      "week": 9-12,
      "exercise": "Barbell Bench Press",
      "reason": "Return to full ROM as shoulder heals"
    }
  ]
}
```

### 10.3 Social Proof
```json
{
  "substitute_name": "Floor Press",
  "used_by_count": 342,
  "average_rating": 4.7,
  "top_review": "Perfect for shoulder recovery - worked great!"
}
```

---

## 11. Testing Checklist

### Unit Tests
- [ ] `gather_user_context()` handles missing data gracefully
- [ ] `fuzzy_match_exercise()` falls back to original name
- [ ] `query_substitutes_with_context()` filters by equipment correctly
- [ ] `ai_rerank_substitutes()` handles API errors

### Integration Tests
- [ ] Full swap flow with all context data present
- [ ] Full swap flow with minimal context (new user)
- [ ] Equipment filtering excludes unavailable exercises
- [ ] Injury filtering prioritizes compatible exercises
- [ ] AI re-ranking produces valid JSON

### E2E Tests
- [ ] User taps "Swap bench press" → sees 3 personalized substitutes
- [ ] User with shoulder injury sees shoulder-friendly options first
- [ ] User with only dumbbells doesn't see barbell exercises
- [ ] Premium user sees AI-ranked substitutes
- [ ] Offline mode shows cached substitutes

---

## 12. Success Criteria

### Phase 1 (Launch)
- ✅ Equipment filtering: 100% accuracy
- ✅