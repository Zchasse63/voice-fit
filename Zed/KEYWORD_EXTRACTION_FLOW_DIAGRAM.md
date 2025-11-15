# Keyword Extraction and RAG Pipeline Flow Diagram

**Visual representation of how user input flows through classification, namespace selection, RAG retrieval, and response generation**

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                     │
│  "Swap bench press" | "185 for 8" | "Right shoulder pain when pressing" │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 1: INTENT CLASSIFICATION                        │
│                     (Grok 4 Fast Reasoning)                             │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ ChatClassifier.classify()                                   │       │
│  │ - Extracts keywords: swap, replace, pain, reps, etc.       │       │
│  │ - Returns: message_type, confidence, extracted_data         │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
        │ exercise_swap │  │ workout_log  │  │ injury_alert │
        └───────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: DATABASE CHECK FIRST                         │
│                   (Before any RAG calls)                                │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ Query Supabase/WatermelonDB:                                │       │
│  │ • exercise_substitutions table (for swaps)                  │       │
│  │ • workout_sessions, sets (for current workout)              │       │
│  │ • injury_logs (for injury history)                          │       │
│  │ • workout_logs (for training load)                          │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 3: SMART NAMESPACE SELECTION                    │
│                    (Keyword-based routing)                              │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ select_relevant_namespaces() / classify_query()             │       │
│  │ - Scans input for keywords                                  │       │
│  │ - Matches to namespace categories                           │       │
│  │ - Returns 1-5 most relevant namespaces                      │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 4: RAG CONTEXT RETRIEVAL                        │
│                    (Upstash Semantic Search)                            │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ For each selected namespace:                                │       │
│  │ 1. Semantic search with user query                          │       │
│  │ 2. Retrieve top 5-10 context chunks                         │       │
│  │ 3. Parallel retrieval (reduces latency)                     │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 5: AI RESPONSE GENERATION                       │
│                    (Grok 4 / Kimi K2 with context)                      │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ Combine:                                                     │       │
│  │ • RAG context chunks                                         │       │
│  │ • Database query results                                     │       │
│  │ • User profile/preferences                                   │       │
│  │ • Personality engine tone                                    │       │
│  │                                                              │       │
│  │ Generate streaming response                                  │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  USER OUTPUT  │
                            └───────────────┘
```

---

## 2. Exercise Swap Flow (Detailed)

```
USER: "Swap bench press"
        │
        ▼
┌────────────────────────────────────────┐
│ ChatClassifier                         │
│ Keywords: "swap" detected              │
│ Returns: exercise_swap intent          │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Extract exercise_name: "bench press"   │
│ Extract reason: null (not mentioned)   │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ DATABASE CHECK (Supabase)              │
│ Query: exercise_substitutions          │
│ WHERE exercise_name = 'bench press'    │
│ AND similarity_score >= 0.60           │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ RESULTS (Top 3)                        │
│ 1. Dumbbell Bench Press (0.92)         │
│ 2. Floor Press (0.88)                  │
│ 3. Push-ups (0.75)                     │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Render ExerciseSwapCard UI             │
│ User taps "Use This" → Update workout  │
└────────────────────────────────────────┘
```

---

## 3. Workout Logging Flow (Detailed)

```
USER: "185 for 8" (voice input)
        │
        ▼
┌────────────────────────────────────────┐
│ ChatClassifier                         │
│ Keywords: numbers + workout terms      │
│ Returns: workout_log intent            │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ DATABASE CHECK (WatermelonDB)          │
│ Query: workout_sessions (active)       │
│ Get current exercise in session        │
│ Get previous sets for "same weight"    │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Session Context Retrieved:             │
│ • Current exercise: Bench Press        │
│ • Previous set: 185 lbs × 10           │
│ • Set number: 2                        │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ RAG: Upstash "exercises" namespace     │
│ Semantic search: "bench press"         │
│ Returns: exercise_id, canonical_name   │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Kimi K2 Turbo Preview Parsing          │
│ Input: "185 for 8" + session context   │
│ Output: {                              │
│   exercise_id: "uuid-123",             │
│   weight: 185, unit: "lbs",            │
│   reps: 8, confidence: 0.95            │
│ }                                      │
└────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Auto-save to WatermelonDB              │
│ Display confirmation: "Set 2: 185×8"   │
└────────────────────────────────────────┘
```

---

## 4. Injury Analysis Flow (Detailed)

```
USER: "Right shoulder pain during bench press and left knee tightness"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Multi-Injury Detection                                      │
│ Separators: " and " detected                                │
│ Body parts: ["shoulder", "knee"] detected                   │
│ Split into segments:                                        │
│  1. "Right shoulder pain during bench press"                │
│  2. "left knee tightness"                                   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Sport Type Detection                                        │
│ Keywords: "bench press" → powerlifting                      │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE CHECK (Supabase)                                   │
│ 1. injury_logs: Get injury history (last 10)                │
│ 2. workout_logs + sets: Get 14-day training load            │
│ 3. user_profiles: Get experience level, preferences         │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Keyword-Based Namespace Selection                           │
│                                                             │
│ Keywords Matched:                                           │
│ • "pain" → injury-analysis ✓                                │
│ • "tight" → mobility-flexibility ✓                          │
│ • "bench press" → powerlifting-injuries ✓                   │
│                                                             │
│ Selected Namespaces:                                        │
│ 1. injury-analysis                                          │
│ 2. injury-management                                        │
│ 3. mobility-flexibility                                     │
│ 4. powerlifting-injuries                                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Parallel RAG Retrieval (Upstash Search)                     │
│                                                             │
│ For each namespace (parallel):                              │
│ • Query: "shoulder pain bench press" (segment 1)            │
│ • Query: "knee tightness" (segment 2)                       │
│ • Top 5 results per namespace × 4 namespaces = 20 chunks    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Context Assembled:                                          │
│ • RAG: 20 injury knowledge chunks                           │
│ • Database: Injury history (2 past shoulder issues)         │
│ • Database: Training load (volume spike detected)           │
│ • User: Intermediate experience, conservative preferences   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Grok 4 Fast Reasoning Analysis                              │
│ Analyzes each injury segment separately:                    │
│                                                             │
│ Injury 1: Right shoulder pain                               │
│ • Severity: Moderate (7/10 confidence)                      │
│ • Likely cause: Rotator cuff impingement                    │
│ • Recommendation: Reduce pressing volume 30%, add mobility  │
│                                                             │
│ Injury 2: Left knee tightness                               │
│ • Severity: Minor (8/10 confidence)                         │
│ • Likely cause: Tight hip flexors limiting ROM              │
│ • Recommendation: Daily stretching, foam rolling            │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Generate Follow-Up Questions (if low confidence)            │
│ "When did the shoulder pain first start?"                   │
│ "Is it sharp or dull pain?"                                 │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Confidence Calibration & Feedback Loop                      │
│ Save to calibration_history.json for future improvements    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. AI Coach Question Flow (Detailed)

```
USER: "How can I fix my squat depth?"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ ChatClassifier                                              │
│ Keywords: "fix", "squat", "depth" detected                  │
│ Returns: question intent                                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE CHECK (Supabase)                                   │
│ • user_onboarding: Get training goals, experience           │
│ • workout_logs: Get recent squat sessions                   │
│ • injury_logs: Check for mobility restrictions              │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Smart Namespace Selection (AI Coach Service)                │
│                                                             │
│ Keywords Matched:                                           │
│ • "depth" → technique-and-form ✓                            │
│ • "squat" → strength ✓                                      │
│ • Implicit: mobility likely needed                          │
│                                                             │
│ Selected Namespaces:                                        │
│ 1. technique-and-form                                       │
│ 2. mobility-flexibility                                     │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Parallel RAG Retrieval (Upstash Search)                     │
│ Namespace 1: technique-and-form (10 chunks)                 │
│ Namespace 2: mobility-flexibility (10 chunks)               │
│ Total: 20 context chunks                                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Context Assembled:                                          │
│ • RAG: Squat depth techniques, mobility drills              │
│ • Database: User is intermediate lifter                     │
│ • Database: Recent squat: 225×5 (RPE 8)                     │
│ • Database: No active injuries                              │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Grok 4 Fast Reasoning (Streaming Response)                  │
│ Generates personalized answer:                              │
│ • Assesses likely causes (ankle/hip mobility)               │
│ • Recommends specific drills                                │
│ • Suggests box squats for practice                          │
│ • Uses personality engine tone (friendly, concise)          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Stream response to user (reduces perceived latency)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Keyword → Namespace Mapping Matrix

```
┌──────────────────────┬────────────────────────────────────────────────────┐
│ KEYWORD CATEGORY     │ NAMESPACES SELECTED                                │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Injury Keywords      │ injury-analysis, injury-management                 │
│ (pain, hurt, strain) │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Prevention Keywords  │ injury-prevention                                  │
│ (prevent, chronic)   │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Swap Keywords        │ exercise-substitution                              │
│ (swap, replace)      │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Mobility Keywords    │ mobility-flexibility                               │
│ (tight, stiff, ROM)  │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Recovery Keywords    │ recovery-and-performance                           │
│ (heal, rehab)        │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Sport: Powerlifting  │ powerlifting-injuries                              │
│ (squat, bench, DL)   │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Sport: Running       │ running-injuries                                   │
│ (marathon, pace)     │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Technique Keywords   │ technique-and-form                                 │
│ (form, depth)        │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Nutrition Keywords   │ nutrition                                          │
│ (protein, calories)  │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Strength Keywords    │ strength, powerlifting                             │
│ (1RM, max, stronger) │                                                    │
├──────────────────────┼────────────────────────────────────────────────────┤
│ Hypertrophy Keywords │ hypertrophy, muscle-building                       │
│ (bigger, size, mass) │                                                    │
└──────────────────────┴────────────────────────────────────────────────────┘
```

---

## 7. Database Tables Queried Per Feature

```
┌──────────────────┬─────────────────────────────────────────────────────┐
│ FEATURE          │ DATABASE TABLES CHECKED (Before RAG)                │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Exercise Swap    │ • exercise_substitutions (Supabase)                 │
│                  │ • workout_logs (WatermelonDB - active session)      │
│                  │ • sets (WatermelonDB - current exercise)            │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Workout Logging  │ • exercises (Supabase - for RAG search)             │
│                  │ • workout_sessions (WatermelonDB - active)          │
│                  │ • sets (WatermelonDB - previous sets)               │
│                  │ • pr_history (WatermelonDB - PR detection)          │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Injury Analysis  │ • injury_logs (Supabase - history)                  │
│                  │ • workout_logs (Supabase - 14-day load)             │
│                  │ • sets (Supabase - volume/intensity)                │
│                  │ • user_profiles (Supabase - experience, sport)      │
├──────────────────┼─────────────────────────────────────────────────────┤
│ AI Coach         │ • user_onboarding (Supabase - context)              │
│                  │ • workout_logs (Supabase - recent training)         │
│                  │ • injury_logs (Supabase - active injuries)          │
│                  │ • readiness_scores (WatermelonDB - recent scores)   │
└──────────────────┴─────────────────────────────────────────────────────┘
```

---

## 8. Performance Optimizations

```
┌───────────────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION STRATEGIES                            │
└───────────────────────────────────────────────────────────────────────┘

1. PARALLEL RETRIEVAL
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │Namespace1│  │Namespace2│  │Namespace3│  ← Search simultaneously
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              Merge results (100-200ms faster)

2. SMART NAMESPACE LIMITING
   • Injury query: 2-5 namespaces (not all 15)
   • Coach query: 1-3 namespaces (focused search)
   • Result: 50-70% fewer API calls

3. STREAMING RESPONSES
   Start → Retrieve → Stream → Complete
   (User sees response immediately as it's generated)

4. DATABASE CACHING
   • WatermelonDB: Offline-first, instant reads
   • Supabase: Connection pooling for repeated queries
   • Session context: In-memory cache (no DB hit)

5. RESULT LIMITS
   • 5-10 chunks per namespace (balance quality vs. speed)
   • Total context: ~10-50 chunks max
   • Prevents token bloat and latency
```

---

## 9. Fallback Logic

```
┌─────────────────────────────────────────────────────────────┐
│ Primary Path: Grok 4 Fast Reasoning Classification          │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
              [API Error?]
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Fallback Path: Rule-Based Classification                    │
│ • Simple keyword matching (local, instant)                  │
│ • Lower confidence scores (0.6-0.7 vs 0.8-0.95)             │
│ • No extracted_data (basic intent only)                     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
              [Still fails?]
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Ultimate Fallback: "general" intent                         │
│ • Always succeeds (no external calls)                       │
│ • Prompts user for clarification                            │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2025-01-24  
**Related Docs:**
- `KEYWORD_EXTRACTION_AND_RAG_SUMMARY.md` (detailed keyword list)
- `INTERACTIVE_EXERCISE_SWAP_COMPLETE.md` (swap feature implementation)
- `INJURY_DETECTION_ENHANCEMENTS_SUMMARY.md` (injury RAG system)