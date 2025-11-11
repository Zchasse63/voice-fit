# Llama 3.3 70B Fine-Tuning - Updated Implementation Plan

**Last Updated:** 2025-01-07  
**Status:** Ready to Execute  
**Target:** Complete before MVP launch

---

## 🎯 **Key Decisions Made**

1. **Fine-tuning Provider:** Nebius (confirmed)
2. **Deployment Strategy:** 100% traffic to Llama 3.3 70B (no GPT-4o Mini fallback)
3. **RAG Pipeline:** Upstash Search for full knowledge base RAG (not just exercise matching)
4. **Running/Cardio Scope:** EXPANDED - Match strength training knowledge depth
5. **Program Generation:** Custom programs for Premium users (strength + running)
6. **Research Format:** All Perplexity prompts must be in correct format before starting

---

## 📊 **Updated Training Data Estimates**

| Category | Original Estimate | Updated Estimate | Notes |
|----------|------------------|------------------|-------|
| Voice Parsing Enhancement | 3,890 | 3,890 | Add reasoning chains |
| Strength Knowledge Base Q&A | 5,000-10,000 | 5,000-10,000 | Convert existing chunks |
| **Running Knowledge Base Q&A** | **0** | **2,000-4,000** | **NEW - Match strength depth** |
| Injury Analysis | 825 | 825 | Existing prompt ready |
| AI Coach Q&A (Strength) | 500-1,000 | 500-1,000 | Form, programming, training |
| **Running Parsing & Analysis** | **300-500** | **500-800** | **EXPANDED - Weather + GAP** |
| **Running Program Generation** | **0** | **300-500** | **NEW - 5K/10K/half/marathon** |
| **Strength Program Generation** | **0** | **500-1,000** | **NEW - Premium custom programs** |
| Multi-Turn Conversations | 200-300 | 300-500 | Strength + running |
| Context-Dependent Decisions | 200-300 | 300-500 | Strength + running |
| Production Validation Set | 500-1,000 | 500-1,000 | Validation only |
| **TOTAL TRAINING EXAMPLES** | **~11,665-17,215** | **~15,815-25,515** | **+36-48% increase** |

---

## 💰 **Updated Cost Estimates**

### Perplexity Research Costs (@ $0.037/request)

| Category | Examples | Cost |
|----------|----------|------|
| Voice parsing enhancement | 3,890 | $144 |
| Strength knowledge Q&A | 5,000-10,000 | $185-370 |
| **Running knowledge Q&A** | **2,000-4,000** | **$74-148** |
| Injury analysis | 825 | $30.53 |
| AI Coach Q&A (strength) | 500-1,000 | $18.50-37 |
| **Running parsing & analysis** | **500-800** | **$18.50-29.60** |
| **Running program generation** | **300-500** | **$11.10-18.50** |
| **Strength program generation** | **500-1,000** | **$18.50-37** |
| Multi-turn conversations | 300-500 | $11.10-18.50 |
| Context-dependent decisions | 300-500 | $11.10-18.50 |
| **TOTAL PERPLEXITY RESEARCH** | **~15,815-25,515** | **$522-851** |

### Additional Costs

- **Nebius Fine-Tuning:** $200-500 (estimate - need to confirm pricing)
- **Apple WeatherKit API:** $0.50/1,000 calls (minimal cost)
- **Upstash Search:** Existing plan should cover expanded usage

**GRAND TOTAL:** $722-1,351

---

## ⏱️ **Updated Timeline**

| Phase | Duration | Notes |
|-------|----------|-------|
| **PRIORITY 1: Kick Off Research** | **1-2 days** | **Create all prompts, start all Perplexity queries** |
| **PRIORITY 2: Database & Backend** | **2-3 weeks** | **Parallel with research** |
| - Database schema updates | 3-5 days | New tables for programs, weather, volume |
| - Upstash Search RAG expansion | 3-5 days | Index knowledge base chunks |
| - FastAPI backend enhancements | 1-2 weeks | New endpoints, context builder |
| - Weather & elevation integration | 3-5 days | Apple WeatherKit, GAP calculation |
| **Research Completion** | **3-6 weeks** | **Perplexity generates all training data** |
| **PRIORITY 3: Merge & Fine-Tune** | **1 week** | **After research complete** |
| - Merge and format data | 2-3 days | Convert to Llama format |
| - Fine-tune on Nebius | 6-12 hours | Training time |
| **PRIORITY 4: Test & Deploy** | **2-3 weeks** | **After fine-tuning complete** |
| - Comprehensive testing | 1 week | All use cases |
| - Backend integration | 3-5 days | Update all endpoints |
| - Staging deployment | 2-3 days | End-to-end testing |
| - Production deployment | 1 day | 100% traffic |
| - Monitoring | 1 week | Performance validation |
| - Documentation | 3-5 days | Guides and handoff |

**TOTAL TIMELINE:** 8-13 weeks

---

## 🚀 **Priority 1: Kick Off All Perplexity Research (IMMEDIATE)**

### Critical Path - Start ASAP

**Goal:** Create comprehensive research prompt library and start all Perplexity queries to maximize parallel processing.

### Research Categories (10 total)

1. **Voice Parsing Enhancement** (3,890 examples)
   - Add reasoning chains and confidence reasoning to existing data
   - 4 batches: 1-1000, 1001-2000, 2001-3000, 3001-3890

2. **Strength Knowledge Base Q&A** (5,000-10,000 examples)
   - Convert 543 structured chunks → ~1,500-2,000 Q&A
   - Convert 1,402 podcast transcripts → ~3,500-8,000 Q&A
   - Add expert attribution (Nippard, Mind Pump, KOT, etc.)

3. **Running Knowledge Base Q&A** (2,000-4,000 examples) **NEW**
   - Research Runner.ai, Runna, TrainAsONE competitors
   - Research running training principles (periodization, base building, speed work, tempo, long runs, intervals, VO2max)
   - Research running terminology (cadence, foot strike, gait, pronation, supination)
   - Research weather impact (humidity, dew point, temperature, wind, precipitation)
   - Research grade-adjusted pace algorithms (Strava GAP, Runna elevation)
   - Research training zones (heart rate, pace, RPE, lactate threshold, polarized training)
   - Research program design (5K/10K/half/marathon plans, mileage progression)
   - Research injury prevention (shin splints, runner's knee, IT band, plantar fasciitis, Achilles)
   - Research recovery protocols (recovery runs, easy pace, deload weeks, taper, cross-training)
   - Convert all research into Q&A format with reasoning chains

4. **Injury Analysis** (825 examples)
   - Use existing prompt from `docs/LLAMA_3.3_INJURY_TRAINING_PROMPT_REFINED.md`
   - 8 categories: acute (75), chronic (150), tendinitis (100), impingement (75), DOMS (100), ambiguous (75), multi-turn (150), context-dependent (100)

5. **AI Coach Q&A - Strength** (500-1,000 examples)
   - Form cues (150-300)
   - Programming advice (200-400)
   - Training questions (150-300)

6. **Running Parsing & Analysis** (500-800 examples) **EXPANDED**
   - Pace/distance parsing (100-150)
   - Training zone classification (100-150)
   - Run type identification (100-150)
   - **Weather-adjusted performance analysis (100-150)** - "Great run considering 85°F and 70% humidity"
   - **Grade-adjusted pace examples (100-150)** - Calculate equivalent flat pace from elevation
   - **Running workout insights (100-150)** - Post-run analysis with weather/elevation context

7. **Running Program Generation** (300-500 examples) **NEW**
   - 5K training programs (75-125)
   - 10K training programs (75-125)
   - Half marathon programs (75-125)
   - Marathon programs (75-125)

8. **Strength Program Generation** (500-1,000 examples) **NEW**
   - Hypertrophy programs (150-300)
   - Strength/powerlifting programs (150-300)
   - General fitness programs (100-200)
   - Beginner programs (100-200)

9. **Multi-Turn Conversations** (300-500 examples)
   - Injury assessment (100-150)
   - Strength program design (80-120)
   - Running program design (60-100)
   - Form coaching (60-130)

10. **Context-Dependent Decisions** (300-500 examples)
    - Injury examples (100-150)
    - Strength programming (100-150)
    - Running programming (100-200)

### Action Items

- [ ] Create comprehensive research prompt library (all 10 categories)
- [ ] Verify all prompts are in correct Perplexity format
- [ ] Start all Perplexity queries in parallel
- [ ] Monitor progress and quality
- [ ] Save all results to JSONL files

---

## 🔧 **Priority 2: Database Schema & Backend (Parallel with Research)**

### Phase 2.1: Database Schema Updates

**New Tables:**

1. **user_profiles**
   - user_id, experience_level, training_age, tier, goals[], age, weight, height, preferences (JSON)

2. **user_programs** (strength)
   - id, user_id, program_name, program_type, current_week, total_weeks, deload_weeks[], is_active, program_data (JSON)

3. **running_programs** **NEW**
   - id, user_id, race_goal (5K/10K/half/marathon), current_week, total_weeks, peak_mileage, taper_start_week, is_active, program_data (JSON)

4. **weekly_volume_tracking**
   - id, user_id, week_start_date, total_sets, total_volume_lbs, **total_running_miles**, exercises_performed[], avg_rpe

5. **program_templates** (strength)
   - id, name, description, duration_weeks, difficulty, program_type (hypertrophy/strength/powerlifting/general), program_structure (JSON)

6. **running_program_templates** **NEW**
   - id, name, race_distance, duration_weeks, weekly_mileage_range, program_structure (JSON)

**Updated Tables:**

- **runs** - Add: weather_data (JSON), elevation_gain, elevation_loss, grade_adjusted_pace

### Phase 2.2: Expand Upstash Search to Full RAG Pipeline

**Current:** Exercise matching only (452 exercises)  
**Target:** Full knowledge base RAG (strength + running)

**Implementation:**
- Index all strength training knowledge chunks
- Index all running knowledge chunks
- Create KnowledgeBaseRAGService.ts for semantic retrieval
- Integrate with UserContextBuilder for Llama context injection

### Phase 2.3: FastAPI Backend Enhancements

**New Endpoints:**

1. `POST /api/coach/ask` - AI Coach Q&A with Upstash Search RAG
2. `POST /api/running/parse` - Running parsing with weather + GAP
3. `POST /api/running/analyze` - Post-run analysis with weather/elevation
4. `POST /api/workout/insights` - Post-workout analysis for strength
5. `POST /api/program/generate/strength` - Custom strength programs (Premium)
6. `POST /api/program/generate/running` - Custom running programs (Premium)

**Updated Endpoints:**

- `POST /api/injury/analyze` - Inject full user context
- `POST /api/voice/parse` - Already has context

### Phase 2.4: Weather & Elevation Integration

**Apple WeatherKit Integration:**
- Fetch historical weather data (temperature, humidity, dew point, wind)
- Store weather_data JSON in runs table
- Use in running performance analysis

**Grade-Adjusted Pace:**
- Calculate from elevation gain/loss (Apple Health or GPS)
- Store grade_adjusted_pace in runs table
- Use in running insights and comparisons

---

## 📦 **Priority 3: Merge Training Data & Fine-Tune (After Research Complete)**

### Phase 3.1: Merge and Format

1. Load all 10 JSONL files
2. Convert to Llama 3.3 70B format (special tokens)
3. Merge into single file
4. Shuffle for good distribution
5. Validate format and quality
6. Split train/validation (90/10)
7. Save final files

### Phase 3.2: Fine-Tune on Nebius

1. Research Nebius fine-tuning API
2. Create account and API key
3. Upload training data
4. Configure hyperparameters
5. Start fine-tuning job
6. Monitor progress (6-12 hours)
7. Get API endpoint for hosted model

---

## ✅ **Priority 4: Test & Deploy (After Fine-Tuning Complete)**

### Phase 4.1: Comprehensive Testing

- Voice parsing accuracy
- Injury analysis quality
- AI Coach Q&A (strength + running)
- Running parsing accuracy
- Weather-adjusted performance analysis
- Grade-adjusted pace analysis
- Strength program generation
- Running program generation
- Multi-turn conversations
- Context-dependent decisions
- Knowledge base Q&A with RAG
- Measure latency and cost

### Phase 4.2: Backend Integration

- Update environment variables (NEBIUS_MODEL_ID, NEBIUS_API_KEY)
- Create Nebius client wrapper
- Update all AI endpoints to use Llama 3.3 70B
- Deploy to staging
- Run end-to-end tests
- Deploy to production (100% traffic)
- Monitor performance (1 week)

### Phase 4.3: Documentation

- Update LLAMA_COMPLETE_DATA_INVENTORY.md
- Update LLAMA_DATA_GAP_ANALYSIS.md
- Create LLAMA_FINE_TUNING_RESULTS.md
- Update API documentation
- Update database schema documentation
- Create LLAMA_DEPLOYMENT_GUIDE.md
- Create LLAMA_MAINTENANCE_GUIDE.md

---

## 🎯 **Next Steps**

1. **Review and approve this plan**
2. **Start PRIORITY 1: Create research prompt library**
3. **Kick off all Perplexity research queries**
4. **Begin PRIORITY 2: Database schema updates (parallel)**

---

**Ready to execute?** 🚀

