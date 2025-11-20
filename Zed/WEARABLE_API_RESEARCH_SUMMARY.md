# Wearable API Integration Research - Executive Summary

**Date:** 2025-11-19  
**Purpose:** Comprehensive analysis of wearable APIs for VoiceFit integration  
**Full Report:** [Download Here](https://pub-b70cb36a6853407fa468c5d6dec16633.r2.dev/192701/generic/file_upload/request/c8b8a1cf93b6c72b7c35186c6dc95b79)

---

## Key Findings

### 1. Recommended Integration Strategy

**PRIMARY: Terra API** (Unified Aggregator)
- ✅ Single integration for 20+ wearables
- ✅ Normalized data format
- ✅ Webhook support
- ✅ Supports: WHOOP, Oura, Fitbit, Garmin, Apple Health, Polar, Suunto, and more
- 💰 Cost: $99/month for 100 users, $299/month for 500 users

**SECONDARY: Direct WHOOP Integration**
- ✅ Most accurate recovery/HRV data
- ✅ Free API for developers
- ⚠️ Users need WHOOP membership ($30/month)

**NATIVE: Apple HealthKit**
- ✅ Free, native iOS framework
- ✅ Real-time sync on device
- ✅ Aggregates all iOS health data

---

## 2. Data Categories We Can Access

### Recovery & Readiness
- **Recovery Score** (0-100%) - WHOOP, Oura
- **Readiness Score** (0-100%) - Oura, Garmin Body Battery
- **HRV** (Heart Rate Variability) - All devices
- **Resting Heart Rate** - All devices
- **Respiratory Rate** - WHOOP, Oura, Garmin
- **Skin Temperature** - WHOOP, Oura
- **Blood Oxygen (SpO2)** - WHOOP, Garmin, Apple Watch

### Sleep Data
- **Total Sleep Duration** - All devices
- **Sleep Stages:**
  - Light Sleep
  - Deep Sleep (SWS)
  - REM Sleep
  - Awake Time
- **Sleep Score** (0-100%) - WHOOP, Oura, Garmin
- **Sleep Efficiency** (%) - All devices
- **Sleep Latency** (time to fall asleep) - WHOOP, Oura

### Activity & Workouts
- **Workout Type** - All devices
- **Duration, Distance, Calories** - All devices
- **Heart Rate Zones** - All devices
- **Strain Score** (0-21) - WHOOP
- **GPS Route Data** - Garmin, Apple Watch, Polar
- **Steps, Active Minutes** - All devices

### Body Metrics
- **Weight** - Smart scales via Terra
- **Body Fat %** - Smart scales
- **BMI** - Calculated
- **Body Temperature** - WHOOP, Oura

---

## 3. Required Database Schema

### New Tables Needed:

1. **`health_metrics`** - Time-series health data
   - recovery_score, hrv, resting_hr, spo2, etc.
   - Source tracking (whoop, oura, garmin, apple_health)
   - Priority system for conflicting data

2. **`sleep_sessions`** - Detailed sleep tracking
   - Sleep stages breakdown
   - Sleep quality metrics
   - Physiological data during sleep

3. **`activity_sessions`** - Workout/activity tracking
   - Activity type, duration, distance
   - Heart rate zones
   - GPS route data
   - Strain/effort scores

4. **`daily_summaries`** - Aggregated daily metrics
   - Recovery, readiness, strain
   - Steps, calories, active minutes
   - Sleep summary from previous night

5. **`wearable_connections`** - OAuth tokens & sync status
   - Provider credentials (encrypted)
   - Last sync timestamp
   - Active/inactive status

---

## 4. Data Priority Rules

When multiple sources provide the same metric:

1. **WHOOP** (Priority: 100) - Recovery, HRV, Strain
2. **Oura** (Priority: 95) - Sleep Quality
3. **Garmin** (Priority: 80) - Activity/Workout Data
4. **Polar** (Priority: 75) - HR Accuracy
5. **Apple Health** (Priority: 60) - Aggregator/Fallback
6. **Fitbit** (Priority: 50) - Consumer Grade
7. **Manual Entry** (Priority: 40) - User Input

---

## 5. Implementation Checklist

### Phase 1: Database & Backend
- [ ] Create 5 new database tables
- [ ] Add RLS policies for health data
- [ ] Create `WearablesIngestionService`
- [ ] Create `DataNormalizationService`
- [ ] Create `DataPriorityService`

### Phase 2: Terra Integration
- [ ] Register Terra API account
- [ ] Implement Terra webhook receiver
- [ ] Implement signature verification
- [ ] Handle all webhook types (activity, sleep, body, daily)
- [ ] Map Terra data to our schema

### Phase 3: WHOOP Integration (Optional Premium)
- [ ] Register WHOOP developer account
- [ ] Implement OAuth 2.0 flow
- [ ] Implement WHOOP webhook receiver
- [ ] Map WHOOP data to our schema

### Phase 4: Apple HealthKit (iOS App)
- [ ] Request HealthKit permissions
- [ ] Implement background sync
- [ ] Sync to Supabase
- [ ] Handle permission granularity

### Phase 5: API Endpoints
- [ ] POST `/api/webhooks/terra`
- [ ] POST `/api/webhooks/whoop`
- [ ] GET `/api/wearables/connect/{provider}`
- [ ] GET `/api/wearables/callback/{provider}`
- [ ] POST `/api/wearables/disconnect/{provider}`
- [ ] GET `/api/health/metrics`

### Phase 6: UI Integration
- [ ] Wearable connection flow
- [ ] Health metrics dashboard
- [ ] Recovery/readiness display
- [ ] Sleep analysis charts
- [ ] Activity history

---

## 6. Cost Analysis

### Terra API
- Free: 5 users
- Starter: $99/month (100 users)
- Growth: $299/month (500 users)
- **Recommendation:** Start with Starter plan

### WHOOP API
- Free for developers
- Users need WHOOP membership ($30/month)

### Apple HealthKit
- Free (native iOS)

### Garmin Health API
- Free (requires approval)

**Total Estimated Cost:** $99-299/month for Terra + $0 for others

---

## 7. Next Steps

1. **Review this research** with team
2. **Decide on integration priority:**
   - Option A: Terra only (fastest, covers most users)
   - Option B: Terra + WHOOP (best for serious athletes)
   - Option C: Terra + WHOOP + native HealthKit (comprehensive)
3. **Create database migrations** for 5 new tables
4. **Implement Terra webhook** as MVP
5. **Add health metrics to AI coach** context

---

## Full Documentation

📄 **Complete 18,000+ character research document:**  
[Download Wearable API Research](https://pub-b70cb36a6853407fa468c5d6dec16633.r2.dev/192701/generic/file_upload/request/c8b8a1cf93b6c72b7c35186c6dc95b79)

Includes:
- Detailed API documentation links
- Complete data field mappings
- SQL schema definitions
- Webhook implementation guides
- Code examples
- Testing strategies

