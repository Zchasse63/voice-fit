# VoiceFit Comprehensive Task List
# Complete Roadmap for All Incomplete Features

**Date:** 2025-11-24  
**Purpose:** Actionable task list for all partially-implemented and planned features  
**Sources:** FEATURE_IMPLEMENTATION_STATUS.md + FUTURE_PLANS.md

---

## 📊 Executive Summary

**Total Parent Tasks:** 18  
**Total Estimated Time:** 95-135 weeks (19-27 months)  
**Immediate Focus (Tier 1):** 3 features, 26-36 days

### Recommended Execution Order:
1. **START HERE:** B2B Enterprise Dashboard (70% complete, 8-12 days)
2. **THEN:** WHOOP Integration (80% complete, 9-13 days)
3. **THEN:** Terra API Integration (80% complete, 4-6 days)
4. **THEN:** Apple Health Nutrition (75% complete, 9-11 days)

### Prerequisites & Blockers:
- **Terra API:** Need to register account and get credentials (TERRA_API_KEY, TERRA_WEBHOOK_SECRET, TERRA_DEV_ID)
- **WHOOP:** Need WHOOP developer account and OAuth app registration
- **Live Activity:** Requires Xcode and physical iOS 16.1+ device for testing
- **Android Foreground Service:** Requires Android Studio and physical Android device
---

## 🎯 TIER 1: Resume Immediately (High ROI, Nearly Complete)

### 1. B2B Enterprise Dashboard - 70% Complete
**Priority:** HIGHEST  
**Business Impact:** Direct B2B revenue stream  
**Total Time:** 8-12 days  
**Dependencies:** None - all infrastructure in place

#### Subtasks:
- [ ] Build schema mapping UI component (2-3 days)
  - Display AI-detected column mappings with confidence scores
  - Allow manual override/correction of mappings
  - Visual preview of detected schema
  - Validation before proceeding to import
  
- [ ] Add program preview screen (1-2 days)
  - Show parsed program structure before publishing
  - Display exercises, sets, reps, progression
  - Allow final edits before assigning to clients
  
- [ ] Implement bulk client assignment UI (1 day)
  - Multi-select client picker
  - Assign program to multiple clients at once
  - Set start dates for each client
  
- [ ] Add Excel/Google Sheets parsing (2-3 days)
  - Integrate xlsx parsing library
  - Support Google Sheets API import
  - Handle multiple sheet tabs
  - Preserve formatting and formulas where relevant
  
- [ ] Testing and polish (2-3 days)
  - End-to-end testing with real CSV/Excel files
  - Error handling for malformed files
  - Loading states and progress indicators
  - User feedback and success messages

**Files to Modify:**
- `apps/web-dashboard/src/components/coach/CSVImport.tsx`
- `apps/web-dashboard/src/components/coach/SchemaMappingUI.tsx` (new)
- `apps/web-dashboard/src/components/coach/ProgramPreview.tsx` (new)
- `apps/web-dashboard/src/components/coach/BulkClientAssignment.tsx` (new)
- `apps/backend/csv_import_service.py`

---

### 2. WHOOP Integration - 80% Complete
**Priority:** HIGH  
**Business Impact:** Premium feature, competitive differentiator  
**Total Time:** 9-13 days  
**Dependencies:** WHOOP developer account (1 day to register)

#### Subtasks:
- [ ] Register WHOOP developer account and create OAuth app (1 day)
  - Sign up at https://developer.whoop.com
  - Create OAuth 2.0 application
  - Get client ID and client secret
  - Register webhook URL
  - Add credentials to environment variables
  
- [ ] Build OAuth flow in mobile app (2-3 days)
  - Implement OAuth 2.0 authorization code flow
  - Handle redirect URI and token exchange
  - Store access token and refresh token securely
  - Implement token refresh logic
  
- [ ] Add WHOOP connection UI in WearablesScreen (1-2 days)
  - "Connect WHOOP" button with branding
  - Connection status indicator
  - Last sync timestamp
  - Disconnect functionality
  
- [ ] Create recovery score visualization (2-3 days)
  - Recovery score chart (7-day trend)
  - HRV and resting HR trends
  - Strain score visualization
  - Sleep quality metrics
  
- [ ] Integrate recovery data into workout recommendations (3-4 days)
  - Modify AI context to include recovery score
  - Adjust workout intensity based on recovery
  - Suggest rest days when recovery < 60%
  - Display recovery-based recommendations in chat

**Files to Modify:**
- `apps/mobile/src/screens/WearablesScreen.tsx` (new)
- `apps/mobile/src/services/wearables/WHOOPOAuthService.ts` (new)
- `apps/mobile/src/components/wearables/RecoveryChart.tsx` (new)
- `apps/backend/user_context_builder.py`
- `apps/backend/main.py` (OAuth endpoints)

---

### 3. Terra API Integration - 80% Complete
**Priority:** HIGH
**Business Impact:** Single API for 8+ wearables (Garmin, Fitbit, Oura, Polar, etc.)
**Total Time:** 4-6 days
**Dependencies:** Terra API account (15 min to register)

#### Subtasks:
- [ ] Register Terra API account and get credentials (15 min)
  - Sign up at https://tryterra.co/
  - Create developer account
  - Get API key, webhook secret, and dev ID
  - Add to environment variables:
    - `TERRA_API_KEY`
    - `TERRA_WEBHOOK_SECRET`
    - `TERRA_DEV_ID`

- [ ] Implement Terra OAuth connection flow (2-3 days)
  - Build OAuth widget for Terra connection
  - Handle OAuth callback and token exchange
  - Store Terra user tokens in database
  - Add Terra connection UI to WearablesScreen
  - Display connection status and last sync time

- [ ] Test webhook integration (1 day)
  - Use Terra dashboard to send test webhooks
  - Verify activity, sleep, body, daily webhooks
  - Confirm data appears in database correctly
  - Test signature verification
  - Verify priority-based data merging (Terra = 55, WHOOP = 100)

- [ ] Add Terra provider icons and branding (1 day)
  - Add Terra logo to WearableConnectionStatus component
  - Display connected providers (Garmin, Fitbit, Oura, etc.)
  - Show which wearable is providing data through Terra
  - Update UI to show Terra as aggregator

- [ ] Documentation and testing (1 day)
  - Document Terra setup process
  - Add Terra to WEARABLE_IMPLEMENTATION_PROGRESS.md
  - Test with multiple wearable providers
  - Verify data normalization

**Files to Modify:**
- `apps/mobile/src/screens/WearablesScreen.tsx`
- `apps/mobile/src/services/wearables/TerraOAuthService.ts` (new)
- `apps/web/src/components/WearableConnectionStatus.tsx`
- `apps/backend/main.py` (Terra OAuth endpoints)
- `Zed/WEARABLE_IMPLEMENTATION_PROGRESS.md`

**Backend Already Complete:**
- ✅ Terra webhook endpoint (`/api/wearables/webhook/terra`)
- ✅ Webhook signature verification
- ✅ Data normalization service
- ✅ Database schema for wearable connections

---

### 4. Apple Health Nutrition Integration - 75% Complete
**Priority:** MEDIUM-HIGH
**Business Impact:** Completes Phase 5.1 primary goal, foundation for AI insights
**Total Time:** 9-11 days
**Dependencies:** None - HealthKit API supports nutrition data

#### Subtasks:
- [ ] Add nutrition data permissions to HealthKit (1 day)
  - Request dietary energy (calories)
  - Request macronutrients (protein, carbs, fat)
  - Request micronutrients (fiber, sugar, sodium)
  - Request water intake
  - Update Info.plist with nutrition permissions

- [ ] Implement nutrition data fetching methods (2 days)
  - `fetchDietaryEnergy()` - Daily calorie intake
  - `fetchMacronutrients()` - Protein, carbs, fat
  - `fetchWaterIntake()` - Hydration tracking
  - `fetchMicronutrients()` - Fiber, sugar, sodium
  - Aggregate daily nutrition totals
  - Handle multiple nutrition apps (MyFitnessPal, Cronometer, MacroFactor)

- [ ] Update backend to handle nutrition data (1 day)
  - Add nutrition fields to daily_nutrition_summary table
  - Update wearables ingestion endpoint
  - Store nutrition data with source priority
  - Handle duplicate entries from multiple apps

- [ ] Build nutrition summary UI in ProfileScreen (2-3 days)
  - Daily nutrition card (calories, protein, carbs, fat)
  - 7-day nutrition trends chart
  - Macro breakdown visualization (pie chart or bar chart)
  - Hydration tracking display
  - Sync status indicator

- [ ] Add basic nutrition-to-performance insights (3-4 days)
  - Low carbs + scheduled long run → Suggest carb-up
  - High protein intake → "Recovery should be good"
  - Calorie deficit + hard training → Flag under-recovery
  - Integrate nutrition context into AI recommendations
  - Display nutrition-based insights in chat

**Files to Modify:**
- `apps/mobile/src/services/healthkit/HealthKitService.ts`
- `apps/mobile/src/screens/ProfileScreen.tsx`
- `apps/mobile/src/components/nutrition/NutritionSummary.tsx` (new)
- `apps/backend/wearables_ingestion_service.py`
- `apps/backend/user_context_builder.py`

**Infrastructure Already Complete:**
- ✅ HealthKit service with background sync
- ✅ Backend ingestion endpoint
- ✅ Data normalization service
- ✅ Database schema for nutrition data

---

## 🎯 TIER 2: Complete After Tier 1 (Medium ROI, Moderate Effort)

### 5. Live Activity Native Implementation - 40% Complete
**Priority:** MEDIUM-LOW
**Business Impact:** Nice-to-have, in-app preview works for now
**Total Time:** 12-17 days
**Dependencies:** Xcode, physical iOS 16.1+ device, Android Studio, physical Android device

#### Subtasks:
- [ ] Implement LiveActivityModule.swift (3-4 days)
  - Implement ActivityKit integration
  - Create bridge methods for React Native
  - Handle Live Activity lifecycle (start, update, end)
  - Implement real-time updates from workout store
  - Test on physical iOS device

- [ ] Test on physical iOS device (1-2 days)
  - Verify Live Activity appears on lock screen
  - Test real-time updates during workout
  - Verify Dynamic Island integration (iPhone 14 Pro+)
  - Test battery impact

- [ ] Implement Android ForegroundService in Kotlin (3-4 days)
  - Create ForegroundService module
  - Implement notification channel setup
  - Handle service lifecycle management
  - Create notification UI with workout stats
  - Implement real-time updates

- [ ] Test on physical Android device (1-2 days)
  - Verify foreground service notification
  - Test real-time updates during workout
  - Verify notification actions (pause, stop)
  - Test battery impact

- [ ] Connect to workout store for real-time updates (2 days)
  - Subscribe to workout store changes
  - Push updates to Live Activity/Foreground Service
  - Handle workout state transitions
  - Optimize update frequency for battery

- [ ] Polish and error handling (2-3 days)
  - Handle unsupported devices gracefully
  - Add error messages for iOS < 16.1
  - Implement fallback to in-app preview
  - Add user settings to enable/disable
  - Documentation and testing

**Files to Modify:**
- `apps/mobile/ios/LiveActivityModule.swift`
- `apps/mobile/android/app/src/main/java/com/voicefit/ForegroundServiceModule.kt` (new)
- `apps/mobile/src/services/liveActivity/LiveActivityModule.ts`
- `apps/mobile/src/services/foregroundService/ForegroundServiceModule.ts`

**Scaffolding Already Complete:**
- ✅ Swift Live Activity widgets (UI defined)
- ✅ React Native service layer with mock implementation
- ✅ LiveActivityPreview component
- ✅ Unified WorkoutNotificationManager

---

### 6. Running Shoe Tracking & Analytics - 0% Complete
**Priority:** MEDIUM-HIGH
**Business Impact:** Differentiator vs Strava, potential affiliate revenue
**Total Time:** 6-8 weeks
**Dependencies:** None

#### Subtasks:
- [ ] Database schema and migrations (1 week)
  - Create running_shoes table
  - Add shoe_id to runs table
  - Create indexes for performance
  - Write migration scripts
  - Test schema changes

- [ ] Backend API endpoints (1 week)
  - POST /api/shoes - Add new shoe
  - GET /api/shoes - List user's shoes
  - PUT /api/shoes/:id - Update shoe details
  - DELETE /api/shoes/:id - Retire shoe
  - GET /api/shoes/:id/analytics - Shoe performance analytics
  - GET /api/shoes/:id/mileage - Mileage tracking

- [ ] Mobile UI - Shoe management (1-2 weeks)
  - Shoe library screen (list all shoes)
  - Add shoe form (brand, model, purchase date)
  - Shoe detail screen (mileage, stats, analytics)
  - Shoe picker during run logging
  - Default shoe selection
  - Retirement workflow

- [ ] Mileage tracking and alerts (1 week)
  - Automatic mileage accumulation
  - Configurable replacement thresholds
  - Push notifications for replacement alerts
  - Visual progress indicators
  - Mileage history chart

- [ ] Performance correlation analytics (2-3 weeks)
  - Calculate HR at pace by shoe
  - Calculate RPE by shoe
  - Calculate pace consistency by shoe
  - Analyze performance degradation over mileage
  - Generate AI-powered insights
  - Shoe comparison analytics

- [ ] UI for analytics and insights (1 week)
  - Performance charts by shoe
  - Shoe comparison view
  - AI insights display
  - Workout type recommendations
  - Replacement recommendations

**Files to Create:**
- `supabase/migrations/20250124_running_shoes.sql`
- `apps/backend/main.py` (shoe endpoints)
- `apps/mobile/src/screens/ShoesScreen.tsx`
- `apps/mobile/src/components/shoes/ShoeCard.tsx`
- `apps/mobile/src/components/shoes/ShoeAnalytics.tsx`
- `apps/mobile/src/services/database/watermelon/models/RunningShoe.ts`

---

### 7. Running/Cardio Voice Coaching System - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Extends voice-first features to cardio
**Total Time:** 8-10 weeks
**Dependencies:** GPS tracking, text-to-speech integration

#### Subtasks:
- [ ] GPS tracking and pace calculation (2 weeks)
  - Implement GPS location tracking
  - Calculate current pace, average pace
  - Calculate distance and projected finish time
  - Handle GPS accuracy and smoothing

- [ ] Text-to-speech integration (1 week)
  - Integrate TTS library (iOS and Android)
  - Voice synthesis for coaching cues
  - Configurable voice settings
  - Test voice quality and clarity

- [ ] Interval-aware pace coaching (2-3 weeks)
  - Detect interval workouts from schedule
  - Calculate target pace for each interval
  - Generate real-time pace feedback
  - "You're at 6:40, pick it up to 6:30"
  - "You're at 6:20, ease back to 6:30"

- [ ] Distance alerts and summaries (1 week)
  - Configurable distance alerts (0.25, 0.5, 1 mile)
  - Current pace announcement
  - Average pace and projected finish
  - Interval summaries

- [ ] Auto-pause logic (1 week)
  - Detect full stops (GPS velocity = 0)
  - Auto-pause on stops (configurable)
  - Do NOT pause during walking intervals
  - Resume on movement detection

- [ ] Settings and configuration (1 week)
  - Toggle voice feedback on/off
  - Toggle auto-pause on/off
  - Configure distance alert frequency
  - Configure verbosity level
  - Test all settings combinations

- [ ] Testing and polish (1-2 weeks)
  - Test on real runs (outdoor testing required)
  - Verify GPS accuracy
  - Test voice coaching quality
  - Battery impact testing
  - User feedback and iteration

**Files to Create:**
- `apps/mobile/src/services/gps/GPSTrackingService.ts`
- `apps/mobile/src/services/voice/VoiceCoachingService.ts`
- `apps/mobile/src/components/run/VoiceCoachingSettings.tsx`
- `apps/mobile/src/store/voiceCoaching.store.ts`

---

## 🎯 TIER 3: Planned Features (Lower Priority, Longer Timeline)

### 8. Nutrition Integration - Terra API & Manual Entry - 0% Complete
**Priority:** LOW (defer until Apple Health nutrition is complete)
**Business Impact:** Cross-platform nutrition support
**Total Time:** 3-4 weeks
**Dependencies:** Terra API account, Apple Health nutrition complete

#### Subtasks:
- [ ] Terra nutrition API integration (2 weeks)
  - Depends on: Terra API Integration (Task #3)
  - Implement nutrition webhook handling
  - Parse meal-level nutrition data
  - Historical data backfill
  - Test with MyFitnessPal and Cronometer

- [ ] Manual nutrition entry UI (1-2 weeks)
  - Simple nutrition logging form
  - Quick macro presets (high protein, carb refeed)
  - Daily nutrition summary
  - Edit and delete entries

- [ ] Testing and polish (1 week)
  - End-to-end testing
  - Data validation
  - Error handling
  - User feedback

**Recommendation:** Defer until Apple Health nutrition (Task #4) is complete and validated with users.

---

### 9. AI Health Intelligence Engine - 0% Complete
**Priority:** MEDIUM-HIGH (long-term strategic value)
**Business Impact:** Premium feature, competitive moat
**Total Time:** 12-18 weeks
**Dependencies:** Nutrition data, wearable data, 8-12 weeks of user data

**See:** `Zed/AI_HEALTH_INTELLIGENCE_ENGINE.md` for full technical spec (895 lines)

#### High-Level Phases:
- [ ] Phase 1: Data pipeline and correlation discovery (4-6 weeks)
- [ ] Phase 2: Predictive models (injury risk, performance) (4-6 weeks)
- [ ] Phase 3: Personalized insights and recommendations (4-6 weeks)

**Recommendation:** Start after Tier 1 and Tier 2 features are complete and user base has sufficient data.

---

### 10. Video Form Analysis - 0% Complete
**Priority:** LOW
**Business Impact:** Unique feature, high development cost
**Total Time:** 10-12 weeks
**Dependencies:** ML expertise, large dataset of exercise videos

#### Subtasks:
- [ ] Research and select pose estimation library (1 week)
  - Evaluate MediaPipe, OpenPose, PoseNet
  - Test accuracy and performance
  - Choose library for implementation

- [ ] Implement pose estimation (3-4 weeks)
  - Integrate pose estimation library
  - Detect joint angles and bar path
  - Calculate tempo and range of motion
  - On-device processing for privacy

- [ ] Train custom ML model for form analysis (4-6 weeks)
  - Collect and annotate exercise video dataset
  - Train model to detect form issues
  - Validate model accuracy
  - Optimize for mobile deployment

- [ ] Build video recording and analysis UI (2-3 weeks)
  - Camera integration (front/side view)
  - Real-time pose overlay
  - Form score display
  - Issue detection and recommendations

- [ ] Testing and iteration (1-2 weeks)
  - Test with real users
  - Validate form detection accuracy
  - Iterate on model and UI
  - Performance optimization

**Recommendation:** Defer until core features are complete and user base is established.

---

### 11. Warm-up & Cooldown Programming - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Improves workout quality, reduces injury risk
**Total Time:** 4-6 weeks
**Dependencies:** Exercise video library, voice system integration

#### Subtasks:
- [ ] Create warm-up/cooldown template database (1-2 weeks)
  - Define templates by workout type (strength lower, upper, running, CrossFit)
  - Create exercise library for warm-ups (dynamic stretches, mobility)
  - Create exercise library for cooldowns (static stretches, foam rolling)
  - Add injury-specific mobility additions

- [ ] Dynamic warm-up generation logic (1-2 weeks)
  - Implement template selection based on workout type
  - Add time-of-day adjustments (longer warm-up in morning)
  - Add injury-specific additions
  - Progressive intensity warm-ups for high-intensity workouts

- [ ] Cooldown generation logic (1 week)
  - Static stretching recommendations
  - Target muscles worked during session
  - Foam rolling protocols
  - Recovery breathing exercises

- [ ] Voice-guided warm-up/cooldown (1-2 weeks)
  - Integrate with voice coaching system
  - Voice guidance for each exercise
  - Timer announcements
  - Transition cues

- [ ] UI and testing (1 week)
  - Warm-up/cooldown display in workout screen
  - Skip/modify warm-up option
  - Save custom warm-up preferences
  - Testing and user feedback

---

### 12. CrossFit WOD Modifications - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Expands market to CrossFit athletes
**Total Time:** 8-10 weeks
**Dependencies:** CrossFit exercise database, domain expertise

#### Subtasks:
- [ ] WOD parsing engine (2-3 weeks)
  - Parse CrossFit WOD text format
  - Convert to structured data
  - Handle AMRAP, EMOM, For Time, Tabata formats
  - Detect exercises, reps, weights, time domains

- [ ] Exercise taxonomy and substitution logic (2-3 weeks)
  - Categorize exercises (push/pull/squat/hinge/carry)
  - Build substitution database
  - Maintain workout stimulus (time domain, energy systems)
  - Equipment-based substitutions

- [ ] WOD modification UI (2-3 weeks)
  - Display original WOD
  - Show modified WOD with reasoning
  - Allow manual adjustments
  - Save custom modifications
  - Track performance on modified WODs

- [ ] Testing with real WODs (1-2 weeks)
  - Test with CrossFit Open workouts
  - Test with benchmark WODs (Fran, Murph, etc.)
  - Validate stimulus equivalence
  - User feedback and iteration

---

### 13. Sport-Specific Training Programs - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Expands market to sport athletes
**Total Time:** 12-16 weeks per sport
**Dependencies:** Sport coaches, athlete testing data

#### Subtasks (per sport):
- [ ] Research sport-specific requirements (2 weeks)
  - Identify key physical attributes (vertical jump, lateral quickness, etc.)
  - Research injury prevention protocols
  - Study periodization models (off-season, in-season)
  - Consult with sport-specific coaches

- [ ] Build sport-specific exercise database (3-4 weeks)
  - Curate exercises for sport
  - Add position-specific variations
  - Include transfer drills (strength → sport movement)
  - Add sport-specific metrics tracking

- [ ] Create program templates (3-4 weeks)
  - Off-season programs (strength and power focus)
  - Pre-season programs (sport-specific conditioning)
  - In-season programs (maintenance and recovery)
  - Position-specific variations

- [ ] Implement program generation logic (2-3 weeks)
  - Select exercises based on sport and position
  - Adjust volume based on season
  - Include injury prevention work
  - Periodization logic

- [ ] Testing and validation (2-3 weeks)
  - Test with real athletes
  - Validate program effectiveness
  - Iterate based on feedback
  - Partner with sport coaches for validation

**Priority Sports (in order):**
1. Basketball (12-16 weeks)
2. Soccer (12-16 weeks)
3. Baseball/Softball (12-16 weeks)
4. Football (12-16 weeks)
5. Tennis, Volleyball, MMA/Boxing, Cycling, Swimming, Track & Field (12-16 weeks each)

---

### 14. Hybrid Athlete Programs (Strength + Cardio) - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Serves growing hybrid athlete market
**Total Time:** 10-12 weeks
**Dependencies:** Sports science research, running/cycling coach partnerships

#### Subtasks:
- [ ] Research concurrent training strategies (2 weeks)
  - Study interference effect mitigation
  - Research optimal training schedules
  - Identify nutrition requirements
  - Study recovery protocols

- [ ] Build concurrent training scheduler (3-4 weeks)
  - Space high-intensity sessions 6+ hours apart
  - Balance strength and cardio volume
  - Implement fatigue monitoring
  - Race-specific periodization (taper strength before marathon)

- [ ] Nutrition calculator for dual goals (2 weeks)
  - Calculate protein requirements (1.8g/kg bodyweight)
  - Adjust calories for concurrent training
  - Carb cycling recommendations
  - Hydration and electrolyte guidance

- [ ] Integration with running/cycling apps (2-3 weeks)
  - Strava integration for cardio tracking
  - Garmin integration for structured workouts
  - Sync cardio volume to adjust strength training

- [ ] Testing and validation (1-2 weeks)
  - Test with hybrid athletes
  - Validate interference mitigation
  - Track performance in both domains
  - User feedback and iteration

---

### 15. Community & Social Features - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Viral growth potential, increased engagement
**Total Time:** 16-20 weeks
**Dependencies:** Content moderation, privacy policies, scaling infrastructure

#### Subtasks:
- [ ] Most Popular Substitutes (3-4 weeks)
  - Track substitute acceptance rates
  - Display "92% of users chose this substitute"
  - Surface trending substitutes
  - Community-validated alternatives

- [ ] User Reviews & Ratings (3-4 weeks)
  - Rate substitutes 1-5 stars
  - Write short reviews
  - Filter substitutes by rating
  - Flag poor substitutes for review

- [ ] Share Successful Strategies (4-6 weeks)
  - Share injury recovery timelines
  - Export program modifications
  - Social proof ("127 users recovered with this swap")
  - Privacy controls

- [ ] Coach/Trainer Recommendations (3-4 weeks)
  - Verified coach profiles
  - Coach-recommended substitutes
  - Trainer specialties
  - Premium: Direct coach messaging

- [ ] Content moderation and safety (3-4 weeks)
  - Implement content moderation system
  - User reporting and blocking
  - Privacy controls
  - Terms of service and community guidelines

---

### 16. Voice-First Enhancements - 0% Complete
**Priority:** MEDIUM
**Business Impact:** Differentiator, hands-free experience
**Total Time:** 8-10 weeks
**Dependencies:** Siri/Google Assistant integration

#### Subtasks:
- [ ] Voice Command Swaps (3-4 weeks)
  - "Hey VoiceFit, swap bench press for floor press"
  - Voice confirmation before applying swap
  - Hands-free workout modifications
  - Integration with Siri/Google Assistant

- [ ] Conversational Program Modifications (3-4 weeks)
  - "My shoulder hurts, can you modify this week's workouts?"
  - AI walks through each exercise, suggests swaps
  - Voice feedback during workout
  - Real-time coaching cues

- [ ] Voice-Activated Form Cues (2-3 weeks)
  - "VoiceFit, watch my squat form"
  - Real-time verbal cues during set
  - "Push your knees out" at the right moment
  - Hands-free form coaching

---

### 17. Race Day Plan Generator - 0% Complete
**Priority:** MEDIUM-HIGH
**Business Impact:** Premium feature, high user value
**Total Time:** 12-16 weeks
**Dependencies:** Race database API, weather API, 8-12 weeks of training data

**See:** FUTURE_PLANS.md lines 861-997 for full specification

#### Subtasks:
- [ ] Race database API integration (2-3 weeks)
  - Research race APIs (RunSignUp, Active.com, UltraSignup)
  - Implement race search and selection
  - Display race details (date, location, distance, elevation)
  - Manual race entry fallback

- [ ] Weather API integration (1 week)
  - Integrate OpenWeather or Weather.com API
  - Fetch race day forecast
  - Calculate heat index and humidity impact
  - Wind conditions and direction

- [ ] Terrain analysis (2-3 weeks)
  - Parse GPX/TCX files for elevation profile
  - Calculate hills/flats distribution
  - Identify technical sections
  - Aid station locations

- [ ] AI pacing model (4-6 weeks)
  - Train model on historical performance data
  - Generate mile-by-mile target splits
  - Terrain-adjusted pacing
  - Negative split strategy recommendations

- [ ] Nutrition/hydration recommendations (2 weeks)
  - Pre-race meal timing
  - During-race fueling schedule
  - Hydration strategy based on weather
  - Aid station utilization plan

- [ ] Race day plan UI (2-3 weeks)
  - Display pacing strategy
  - Show nutrition/hydration plan
  - Terrain-specific tactics
  - Weather-adjusted expectations
  - Race day checklist

- [ ] Post-race analysis (1-2 weeks)
  - Compare actual vs planned performance
  - Analyze splits and effort distribution
  - Generate insights for future races
  - Update AI model with race data

---

### 18. Stryd Integration - 0% Complete
**Priority:** LOW
**Business Impact:** Niche feature for serious runners
**Total Time:** 4-6 weeks
**Dependencies:** Stryd API access

#### Subtasks:
- [ ] Stryd API integration (2-3 weeks)
  - Register Stryd developer account
  - Implement OAuth flow
  - Fetch running power data
  - Fetch cadence and form power
  - Sync historical data

- [ ] Data correlation and analytics (2-3 weeks)
  - Correlate power with shoe selection
  - Correlate power with surface type
  - Analyze interval vs steady-state sessions
  - Correlate with injury history and recovery

- [ ] UI for Stryd data (1 week)
  - Display running power metrics
  - Power-based pacing recommendations
  - Form power trends
  - Integration with AI Health Intelligence

---

## 📋 Summary by Priority Tier

### TIER 1: Resume Immediately (26-36 days total)
1. ✅ B2B Enterprise Dashboard (8-12 days)
2. ✅ WHOOP Integration (9-13 days)
3. ✅ Terra API Integration (4-6 days)
4. ✅ Apple Health Nutrition (9-11 days)

### TIER 2: Complete After Tier 1 (26-41 weeks total)
5. Live Activity Native Implementation (12-17 days)
6. Running Shoe Tracking & Analytics (6-8 weeks)
7. Running/Cardio Voice Coaching System (8-10 weeks)

### TIER 3: Planned Features (95-135 weeks total)
8. Nutrition Integration - Terra API & Manual Entry (3-4 weeks)
9. AI Health Intelligence Engine (12-18 weeks)
10. Video Form Analysis (10-12 weeks)
11. Warm-up & Cooldown Programming (4-6 weeks)
12. CrossFit WOD Modifications (8-10 weeks)
13. Sport-Specific Training Programs (12-16 weeks per sport)
14. Hybrid Athlete Programs (10-12 weeks)
15. Community & Social Features (16-20 weeks)
16. Voice-First Enhancements (8-10 weeks)
17. Race Day Plan Generator (12-16 weeks)
18. Stryd Integration (4-6 weeks)

---

## 🚀 Recommended Next Steps

### Week 1-2: B2B Enterprise Dashboard
- Build schema mapping UI
- Add program preview
- Implement bulk client assignment
- Add Excel/Google Sheets support
- **Deliverable:** Coaches can upload and assign programs to clients

### Week 3-4: WHOOP Integration
- Register WHOOP developer account
- Build OAuth flow
- Add recovery visualization
- Integrate with workout recommendations
- **Deliverable:** Users can connect WHOOP and see recovery-based recommendations

### Week 5: Terra API Integration
- Register Terra account
- Implement OAuth flow
- Test webhooks
- Add provider icons
- **Deliverable:** Users can connect Garmin, Fitbit, Oura, Polar via single integration

### Week 6-7: Apple Health Nutrition
- Add nutrition permissions
- Implement nutrition fetching
- Build nutrition summary UI
- Add nutrition-to-performance insights
- **Deliverable:** Users see nutrition data from MyFitnessPal/Cronometer in VoiceFit

### Week 8: Testing & Polish
- End-to-end testing of all Tier 1 features
- Bug fixes and performance optimization
- Documentation updates
- User acceptance testing
- **Deliverable:** All Tier 1 features production-ready

---

**Last Updated:** 2025-11-24
**Next Review:** After completing Tier 1 features
**Owner:** Development Team


