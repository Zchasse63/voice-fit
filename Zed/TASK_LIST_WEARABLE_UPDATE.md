# Task List Update - Wearable Integration

**Date:** 2025-11-19  
**Purpose:** Document task list updates to include comprehensive wearable integration work

---

## Summary of Changes

Based on comprehensive wearable API research (Terra, WHOOP, Apple Health, Garmin, Oura), we've added **23 new tasks** to properly implement the wearable integration.

---

## New Tasks Added

### P1 - Wearables Integration (18 new tasks)

#### Database Schema (7 tasks)
1. ✅ **Create wearable database schema migrations**
   - Create 5 new tables in single migration file
   - File: `supabase/migrations/20250120_wearable_schema.sql`

2. ✅ **Create health_metrics table**
   - Time-series health data (recovery, HRV, resting HR, SpO2)
   - Source tracking and priority system

3. ✅ **Create sleep_sessions table**
   - Sleep stages breakdown (light, deep, REM, awake)
   - Quality metrics and physiological data

4. ✅ **Create activity_sessions table**
   - Workout tracking with HR zones, GPS, strain scores

5. ✅ **Create daily_summaries table**
   - Aggregated daily metrics from multiple sources

6. ✅ **Create wearable_connections table**
   - OAuth tokens, sync status, provider credentials (encrypted)

7. ✅ **Add RLS policies for wearable tables**
   - Users can only access their own wearable data

#### Backend Services (3 tasks)
8. ✅ **Create DataNormalizationService**
   - File: `apps/backend/data_normalization_service.py`
   - Normalize Terra, WHOOP, Garmin formats to our schema

9. ✅ **Create DataPriorityService**
   - File: `apps/backend/data_priority_service.py`
   - Handle conflicts using priority rules (WHOOP=100, Oura=95, etc.)

10. ✅ **Update WearablesIngestionService for new schema**
    - File: `apps/backend/wearables_ingestion_service.py`
    - Use new tables and normalization/priority services

#### Webhook Handlers (2 tasks)
11. ✅ **Terra - Implement complete webhook handler**
    - Handle: activity, sleep, body, daily, athlete events
    - Map to new schema tables

12. ✅ **WHOOP - Implement complete webhook handler**
    - Handle: recovery, sleep, workout, cycle data
    - Map to new schema tables

#### API Endpoints (1 task)
13. ✅ **Create wearable API endpoints**
    - GET `/api/wearables/connect/{provider}`
    - GET `/api/wearables/callback/{provider}`
    - POST `/api/wearables/disconnect/{provider}`
    - GET `/api/health/metrics`
    - GET `/api/health/sleep`
    - GET `/api/health/activity`
    - GET `/api/health/daily`

#### iOS Integration (2 tasks)
14. ✅ **iOS - Implement HealthKit background sync**
    - File: `apps/mobile/src/services/HealthKitService.ts`
    - Background sync to Supabase using new schema

15. ✅ **iOS - Create HealthKit permission flow**
    - Granular permissions for each data type

#### AI Integration (1 task)
16. ✅ **Update UserContextBuilder for wearable data**
    - File: `apps/backend/user_context_builder.py`
    - Fetch and format wearable data for AI context

#### Testing (2 tasks)
17. ✅ **Create test_data_normalization.py**
    - File: `apps/backend/test_data_normalization.py`
    - Test normalizing different wearable formats

18. ✅ **Create test_data_priority.py**
    - File: `apps/backend/test_data_priority.py`
    - Test priority resolution for conflicting data

---

### P5 - Web Dashboard (5 new tasks)

#### Wearable Data Visualization (5 tasks)
19. ✅ **Update HealthInsights component for new schema**
    - File: `apps/web/src/components/HealthInsights.tsx`
    - Fetch from new tables: health_metrics, sleep_sessions, daily_summaries

20. ✅ **Create SleepChart component**
    - File: `apps/web/src/components/SleepChart.tsx`
    - Visualize sleep stages and quality over time (Recharts)

21. ✅ **Create RecoveryTrend component**
    - File: `apps/web/src/components/RecoveryTrend.tsx`
    - Show recovery score trends with HRV correlation

22. ✅ **Create WearableConnectionStatus component**
    - File: `apps/web/src/components/WearableConnectionStatus.tsx`
    - Show connected wearables, last sync, connection health

23. ✅ **Update Analytics component for wearable data**
    - File: `apps/web/src/components/Analytics.tsx`
    - Add recovery trends, sleep quality, strain to analytics

---

## Implementation Order

### Phase 1: Database Foundation (Tasks 1-7)
**Priority:** CRITICAL - Blocking all other wearable work  
**Estimated Time:** 2-3 hours

1. Create migration file with all 5 tables
2. Add RLS policies
3. Run migration on dev environment
4. Verify tables created correctly

### Phase 2: Backend Services (Tasks 8-10)
**Priority:** HIGH - Required for data ingestion  
**Estimated Time:** 4-6 hours

1. Create DataNormalizationService
2. Create DataPriorityService
3. Update WearablesIngestionService

### Phase 3: Webhook Handlers (Tasks 11-12)
**Priority:** HIGH - Core integration  
**Estimated Time:** 4-6 hours

1. Implement Terra webhook handler
2. Implement WHOOP webhook handler
3. Test with mock payloads

### Phase 4: API Endpoints (Task 13)
**Priority:** HIGH - Required for frontend  
**Estimated Time:** 2-3 hours

1. Create all 7 endpoints
2. Add authentication/authorization
3. Test endpoints

### Phase 5: iOS Integration (Tasks 14-15)
**Priority:** MEDIUM - Native data source  
**Estimated Time:** 3-4 hours

1. Implement HealthKit background sync
2. Create permission flow
3. Test on device

### Phase 6: AI Integration (Task 16)
**Priority:** MEDIUM - Enhances AI coach  
**Estimated Time:** 2-3 hours

1. Update UserContextBuilder
2. Add wearable data to AI prompts
3. Test AI responses

### Phase 7: Testing (Tasks 17-18)
**Priority:** MEDIUM - Quality assurance  
**Estimated Time:** 2-3 hours

1. Create normalization tests
2. Create priority tests
3. Run full test suite

### Phase 8: Web Dashboard (Tasks 19-23)
**Priority:** MEDIUM - User-facing features  
**Estimated Time:** 6-8 hours

1. Update HealthInsights component
2. Create visualization components
3. Update Analytics component
4. Test in browser

---

## Total Effort Estimate

- **Database:** 2-3 hours
- **Backend:** 12-15 hours
- **iOS:** 3-4 hours
- **Testing:** 2-3 hours
- **Web Dashboard:** 6-8 hours

**Total:** 25-33 hours (3-4 days of focused work)

---

## Dependencies

### External Dependencies
- **Terra API Account** - Need to register and get API keys
- **WHOOP Developer Account** - Need to register (if doing direct integration)
- **Supabase** - Database must be accessible

### Internal Dependencies
- Database migration must complete before backend work
- Backend services must exist before webhook handlers
- API endpoints must exist before frontend work
- All backend work must complete before iOS integration

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All 5 tables created in database
- ✅ RLS policies active and tested
- ✅ Can manually insert/query data

### Phase 2 Complete When:
- ✅ Can normalize Terra webhook payload
- ✅ Can normalize WHOOP webhook payload
- ✅ Priority resolution works correctly
- ✅ Unit tests pass

### Phase 3 Complete When:
- ✅ Terra webhooks successfully ingested
- ✅ WHOOP webhooks successfully ingested
- ✅ Data appears in correct tables
- ✅ Signature verification works

### Phase 4 Complete When:
- ✅ All 7 endpoints functional
- ✅ Authentication working
- ✅ Can query health data via API

### Phase 5 Complete When:
- ✅ HealthKit permissions requested
- ✅ Background sync working
- ✅ Data syncing to Supabase
- ✅ Tested on physical device

### Phase 6 Complete When:
- ✅ AI coach can access wearable data
- ✅ AI responses include health insights
- ✅ Context builder tests pass

### Phase 7 Complete When:
- ✅ All tests written
- ✅ All tests passing
- ✅ Code coverage >80%

### Phase 8 Complete When:
- ✅ Health insights displaying correctly
- ✅ Charts rendering with real data
- ✅ Connection status accurate
- ✅ Analytics include wearable metrics

---

## Next Steps

1. ✅ **Review this update** with team
2. ⏭️ **Start Phase 1** - Create database migration
3. ⏭️ **Continue autonomous execution** through all phases

---

## Related Documentation

- **Research Summary:** `Zed/WEARABLE_API_RESEARCH_SUMMARY.md`
- **Full Research:** [Download Link](https://pub-b70cb36a6853407fa468c5d6dec16633.r2.dev/192701/generic/file_upload/request/c8b8a1cf93b6c72b7c35186c6dc95b79)
- **Task List:** View with `view_tasklist` tool

