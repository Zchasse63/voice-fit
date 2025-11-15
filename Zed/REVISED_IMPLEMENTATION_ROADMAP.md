# Revised Implementation Roadmap: Context-Aware AI Features

**Date:** 2025-01-24  
**Philosophy:** "Leverage every piece of user data (equipment, program, injury history, RAG, AI) for the best possible experience"  
**Timeline:** 2-3 weeks for complete implementation

---

## Executive Summary

This roadmap prioritizes context-aware features that combine:
1. **User Data** (equipment, program, injury history, goals)
2. **RAG** (semantic search, knowledge retrieval)
3. **AI** (Grok 4 Fast Reasoning for personalization)

**Key Changes from Original Plan:**
- ❌ Removed "basic" implementations without context
- ✅ All features are context-aware from Day 1
- ✅ Equipment filtering mandatory (not optional)
- ✅ Program alignment built-in
- ✅ AI re-ranking default for premium users

---

## Core Philosophy

### "Context First, Always"

Every recommendation must consider:
1. **Equipment Availability** → Only suggest exercises user can actually do
2. **Active Injuries** → Prioritize compatible movements
3. **Current Program** → Align with training phase (accumulation vs peak)
4. **Training Goals** → Match strength vs hypertrophy vs endurance
5. **Experience Level** → Appropriate difficulty
6. **Recent Performance** → Account for fatigue/volume

**No more generic recommendations.** Everything is personalized.

---

## Phase 1: Foundation & Context-Aware Exercise Swaps (Days 1-3)

### Goal
Implement fully context-aware exercise swap system with RAG fuzzy matching, equipment filtering, and AI re-ranking.

### Day 1: Backend Context Infrastructure

**Morning (4 hours):**
- [ ] Create `apps/backend/exercise_swap_service.py`
- [ ] Implement `gather_user_context()` function
  - Parallel queries: onboarding, program, injuries, session
  - Returns unified context object
  - Handle missing data gracefully
- [ ] Write unit tests for context gathering
- [ ] Add caching layer (Redis or in-memory) for frequently accessed context

**Afternoon (4 hours):**
- [ ] Implement `fuzzy_match_exercise()` with Upstash RAG
  - Semantic search in "exercises" namespace
  - Handles typos, synonyms, colloquial names
  - Fallback to original name if match score < 0.70
- [ ] Implement `query_substitutes_with_context()`
  - Equipment filtering (mandatory)
  - Injury-aware filtering (if applicable)
  - Difficulty matching (experience level)
  - Returns top 10 candidates
- [ ] Write unit tests for RAG + DB query flow

### Day 2: AI Re-Ranking & Premium Features

**Morning (4 hours):**
- [ ] Implement `ai_rerank_substitutes()` with Grok 4 Fast
  - Context-rich prompt with all user data
  - Ranking logic: equipment > injury > program > similarity > goals
  - Returns top 3 with reasoning
- [ ] Add feature flag system for gradual rollout
  - `feature_enhanced_swap_enabled: true/false`
  - Per-user override capability
- [ ] Premium gating logic (AI re-ranking for premium users)

**Afternoon (4 hours):**
- [ ] Create new endpoint `/api/chat/swap-exercise-enhanced`
  - Uses full context-aware flow
  - Returns structured response with context metadata
- [ ] Update existing `/api/chat/swap-exercise` to route to enhanced version
  - Backward compatible
  - Feature flag controlled
- [ ] Integration tests with real user data
- [ ] Performance testing (target: <250ms basic, <400ms with AI)

### Day 3: Mobile Integration & UI Polish

**Morning (4 hours):**
- [ ] Create `apps/mobile/src/services/exercise/EnhancedExerciseSwapService.ts`
  - Calls enhanced backend endpoint
  - Offline fallback to cached substitutes
  - AsyncStorage caching for 24 hours
- [ ] Update `ExerciseSwapCard.tsx` component
  - Show context badges (equipment, injury-friendly, AI-recommended)
  - Display `rank_reasoning` from AI
  - Improved visual hierarchy

**Afternoon (4 hours):**
- [ ] Update `ChatScreen.tsx` to use enhanced service
- [ ] Add loading states and error handling
- [ ] Implement offline mode with graceful degradation
- [ ] E2E tests on simulator/device
- [ ] Deploy to staging, test with 5 beta users

**Deliverable:** Fully context-aware exercise swap system live on staging

---

## Phase 2: Database-Backed Sessions & Parallel Retrieval (Days 4-6)

### Goal
Eliminate in-memory session losses and optimize context retrieval with parallel queries.

### Day 4: Session Persistence

**Morning (4 hours):**
- [ ] Create `workout_sessions` table in Supabase (if not exists)
  - Columns: id, user_id, started_at, last_exercise, last_weight, last_reps, last_rpe, status
- [ ] Update `IntegratedVoiceParser` class
  - Add `_persist_session_to_db()` method (async, non-blocking)
  - Add `_restore_session_from_db()` method (cache miss recovery)
  - Modify `_get_or_create_session()` to check DB after cache miss
- [ ] Write migration script for existing sessions

**Afternoon (4 hours):**
- [ ] Mobile: Update `WorkoutSessionService.ts`
  - Use WatermelonDB for active sessions
  - Sync to Supabase in background
  - Query local first, fall back to Supabase
- [ ] Add session cleanup job (mark old sessions as complete after 24 hours)
- [ ] Unit tests for session persistence and recovery
- [ ] Integration tests: server restart scenario

### Day 5: Parallel Context Retrieval

**Morning (4 hours):**
- [ ] Refactor injury analysis to use parallel DB + RAG
  - Replace sequential queries with `asyncio.gather()`
  - DB queries + RAG search + sport detection in parallel
  - Combine results after all complete
- [ ] Refactor AI Coach service to use parallel retrieval
  - Same pattern as injury analysis
- [ ] Performance benchmarking (before/after comparison)

**Afternoon (4 hours):**
- [ ] Add smart routing logic to `chat_classifier.py`
  - Sequential: exercise swap (DB depends on RAG)
  - Parallel: injury analysis, AI coach (independent)
  - RAG-only: onboarding, general questions
- [ ] Update all endpoints to use new routing
- [ ] Integration tests for parallel flows
- [ ] Performance tests (target: 30% latency reduction)

### Day 6: Cross-Session Lookback

**Morning (4 hours):**
- [ ] Add "same as last workout" support
  - Query previous workout from DB (not just current session)
  - "Same weight as last Monday's bench press"
  - Parse date/exercise references with Kimi K2
- [ ] Update voice parsing prompt to handle lookback phrases
  - "same as last week"
  - "what did I use last time"
  - "my usual weight for squats"

**Afternoon (4 hours):**
- [ ] Mobile UI for quick lookback
  - "Use last workout's weight" button
  - Show previous performance in logging screen
- [ ] E2E tests for cross-session lookback
- [ ] Deploy to staging
- [ ] Monitor cache hit rates and latency

**Deliverable:** Sessions persist across restarts, 30% faster context retrieval

---

## Phase 3: Program-Aware & Equipment-First Features (Days 7-10)

### Goal
Deep integration with user's active program and equipment inventory.

### Day 7: Program Context Integration

**Morning (4 hours):**
- [ ] Enhance exercise swap to consider program phase
  - Accumulation: Higher volume substitutes
  - Intensification: Moderate volume, higher intensity
  - Realization: Peak-specific alternatives
- [ ] Add program exercise detection
  - Check if swapped exercise is in user's program
  - Offer to update program if user accepts swap
- [ ] API endpoint: `/api/program/update-exercise`
  - Replace exercise in program
  - Maintain set/rep scheme

**Afternoon (4 hours):**
- [ ] Mobile: Program integration
  - Show warning if swapping programmed exercise
  - "This will update your 12-week program. Continue?"
  - Save program modifications to WatermelonDB + Supabase
- [ ] Add program timeline view
  - Show upcoming weeks with swapped exercises
  - Visual indicator for modified exercises

### Day 8: Equipment Inventory Management

**Morning (4 hours):**
- [ ] Create user equipment profile in Supabase
  - Table: `user_equipment` (user_id, equipment_type, added_at)
  - API: `POST /api/user/equipment/add`
  - API: `DELETE /api/user/equipment/remove`
- [ ] Mobile UI: Equipment management screen
  - List of common equipment with checkboxes
  - "Add custom equipment" input
  - Sync to Supabase

**Afternoon (4 hours):**
- [ ] Update all exercise recommendations to respect equipment
  - Exercise swap: filter by equipment (already done)
  - Program generation: use available equipment
  - AI Coach: suggest exercises user can do
- [ ] Add equipment-based search
  - "Show me all chest exercises with dumbbells"
  - Filter exercise library by equipment

### Day 9: Smart Progression Suggestions

**Morning (4 hours):**
- [ ] Implement progressive substitution paths
  - Injury recovery: easier → moderate → full exercise
  - Skill building: simpler → complex variations
  - Store in `substitution_progressions` table
- [ ] AI generates multi-week swap plans
  - Week 1-4: Floor Press (reduced ROM)
  - Week 5-8: DB Bench Press (stability)
  - Week 9-12: Return to Barbell Bench Press

**Afternoon (4 hours):**
- [ ] Mobile: Show progression timeline
  - "You're on Week 2 of 4 with Floor Press"
  - Progress bar, upcoming milestones
  - Option to advance early if feeling good
- [ ] Notifications for progression updates
  - "Ready to progress to DB Bench Press?"

### Day 10: Testing & Refinement

**All Day (8 hours):**
- [ ] Comprehensive E2E testing
  - New user with minimal equipment
  - Intermediate user with home gym
  - Advanced user with full gym access
  - User with active shoulder injury
  - User in Week 10 of program (peak phase)
- [ ] Performance testing under load
  - Simulate 100 concurrent users
  - Monitor latency, error rates
  - Optimize slow queries
- [ ] UI/UX polish
  - Loading states, error messages
  - Accessibility (screen reader support)
  - Animations and transitions
- [ ] Documentation updates
  - User-facing help docs
  - API documentation
  - Internal developer guides

**Deliverable:** Fully integrated, program-aware, equipment-first experience

---

## Phase 4: Production Rollout & Monitoring (Days 11-15)

### Day 11-12: Staging Validation

- [ ] Deploy all features to staging
- [ ] Beta test with 25 users (mix of experience levels)
- [ ] Collect feedback via in-app surveys
- [ ] Monitor performance metrics
  - Latency (p50, p95, p99)
  - Error rates
  - Feature usage (how many use enhanced swap?)
- [ ] Bug fixes and refinements

### Day 13: Gradual Production Rollout

**Morning:**
- [ ] Deploy to production with feature flags OFF
- [ ] Smoke tests in production (health checks)
- [ ] Enable enhanced swap for 5% of users
- [ ] Monitor for 2 hours

**Afternoon:**
- [ ] If metrics look good, increase to 25%
- [ ] Monitor for 4 hours
- [ ] Check error logs, user feedback
- [ ] Increase to 50% if stable

### Day 14: Full Rollout

**Morning:**
- [ ] Enable for 100% of users
- [ ] Monitor closely for first 4 hours
- [ ] Real-time alerts for errors or latency spikes

**Afternoon:**
- [ ] Performance optimization based on production data
- [ ] Database query optimization (add indexes if needed)
- [ ] Cache tuning (TTL adjustments)

### Day 15: Analytics & Iteration

**All Day:**
- [ ] Set up analytics dashboards
  - Swap acceptance rate
  - Equipment filter effectiveness
  - AI re-ranking usage (premium vs free)
  - Session persistence success rate
- [ ] A/B test analysis
  - Compare enhanced vs legacy swap
  - User satisfaction scores
  - Retention metrics
- [ ] Plan Phase 5 features based on data
- [ ] Document learnings and share with team

**Deliverable:** Fully rolled out, monitored, and optimized system in production

---

## Success Metrics

### Primary KPIs

| Metric | Baseline (Current) | Target (Phase 4) | Measurement |
|--------|-------------------|------------------|-------------|
| **Swap Acceptance Rate** | 60% | 85%+ | % of swaps user actually uses |
| **Equipment Match Rate** | N/A | 100% | % of suggestions user has equipment for |
| **Session Loss Rate** | 15% | <1% | % of sessions lost on restart |
| **Average Latency (swap)** | 60ms | <250ms | p95 response time |
| **User Satisfaction** | 3.8/5 | 4.5+/5 | Post-swap feedback |

### Secondary KPIs

- **RAG Match Accuracy:** 95%+ fuzzy matches resolve correctly
- **Context Retrieval Time:** <100ms for parallel queries
- **AI Re-Ranking Usage:** 40%+ of premium users opt-in
- **Offline Functionality:** 90%+ of swaps work offline (cached)
- **Program Integration:** 60%+ of swaps auto-update program

---

## Risk Mitigation

### High Risk Items

1. **AI Re-Ranking Latency**
   - Risk: Grok 4 API slow or unavailable
   - Mitigation: Timeout after 500ms, fall back to DB ranking
   - Monitoring: Track API latency, set alerts at >300ms

2. **Equipment Data Quality**
   - Risk: Users don't set equipment correctly
   - Mitigation: Smart defaults based on common gym setups
   - Monitoring: Track "no substitutes found" rate

3. **Database Performance**
   - Risk: Parallel queries overwhelm Supabase
   - Mitigation: Connection pooling, query optimization, caching
   - Monitoring: Database connection pool usage

4. **Session Persistence Failures**
   - Risk: DB writes fail silently
   - Mitigation: Retry logic, dead letter queue for failed writes
   - Monitoring: Track persistence success rate

### Medium Risk Items

5. **Mobile Offline Sync**
   - Risk: WatermelonDB conflicts with Supabase
   - Mitigation: Conflict resolution strategy (last-write-wins)
   - Monitoring: Track sync errors

6. **RAG Search Quality**
   - Risk: Upstash returns irrelevant results
   - Mitigation: Confidence threshold (0.70), fallback to exact match
   - Monitoring: Track match scores distribution

---

## Dependencies

### External Services
- Upstash Search (RAG): $29/month → $99/month (increased usage)
- Grok 4 Fast Reasoning: ~$400/year for AI re-ranking
- Supabase: Current plan sufficient, monitor query counts

### Internal Dependencies
- User onboarding must be complete (equipment, goals, experience)
- Active program system must be functional
- Injury logging must be in place

### Infrastructure
- Railway: Sufficient for current scale, monitor memory usage
- CDN (if adding video demos in future)

---

## Cost Breakdown

### Monthly Costs (at 10K users)

| Item | Current | New | Increase |
|------|---------|-----|----------|
| Upstash Search | $29 | $99 | +$70 |
| Grok 4 API | $0 | $35 | +$35 |
| Supabase | $25 | $25 | $0 |
| Railway | $20 | $20 | $0 |
| **Total** | **$74** | **$179** | **+$105/mo** |

**Annual Increase:** ~$1,260  
**Cost per user:** $0.01/month  
**Justification:** Massive UX improvement, higher retention, premium feature differentiation

---

## Post-Phase 4: Future Enhancements

### Phase 5: Social & Community Features (Weeks 4-6)
- [ ] "Most popular substitutes" based on community data
- [ ] User reviews/ratings for substitutes
- [ ] Share successful swap strategies
- [ ] Coach/trainer recommendations

### Phase 6: Advanced Personalization (Weeks 7-8)
- [ ] ML model for swap prediction (what will user prefer?)
- [ ] Biometric integration (heart rate, recovery metrics)
- [ ] Video form analysis (flag substitutes if form is poor)
- [ ] Voice command swaps ("Swap bench for floor press")

### Phase 7: Multi-Sport Expansion (Weeks 9-12)
- [ ] Running-specific substitutions (injury-aware routes)
- [ ] CrossFit WOD modifications
- [ ] Sport-specific training (basketball, soccer, etc.)
- [ ] Hybrid athlete programs (strength + cardio)

---

## Team Communication

### Daily Standups (15 min)
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

### Weekly Demos (Friday, 30 min)
- Demo new features to team
- Collect feedback
- Adjust roadmap if needed

### Documentation
- Update `IMPLEMENTATION_PROGRESS.md` daily
- Add to `TESTING_CHECKLIST.md` for each feature
- Keep `KEYWORD_EXTRACTION_AND_RAG_SUMMARY.md` current

---

## Conclusion

This revised roadmap prioritizes **context-aware features from Day 1**. Every recommendation leverages:
- User's equipment (mandatory filtering)
- Active injuries (priority ranking)
- Current program (phase-aligned)
- Training goals (strength vs hypertrophy)
- RAG (fuzzy matching, knowledge retrieval)
- AI (personalized re-ranking)

**Timeline:** 15 days (3 weeks)  
**Cost:** +$105/month ($1,260/year)  
**Impact:** 25% increase in user satisfaction, 40% reduction in "not helpful" feedback

**Next Step:** Begin Day 1 implementation - create `exercise_swap_service.py` and implement context gathering.

---

**Last Updated:** 2025-01-24  
**Status:** Ready to implement  
**Approved by:** [Pending team review]