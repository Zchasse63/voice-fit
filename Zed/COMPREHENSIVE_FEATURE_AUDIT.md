# Comprehensive Feature Audit - VoiceFit Implementation

**Date**: 2025-11-24  
**Scope**: All TIER 1, TIER 2, and TIER 3 features implemented in this session  
**Purpose**: Identify gaps, missing integrations, and next steps for production readiness

---

## Executive Summary

This audit reviews all features implemented across three tiers:
- **TIER 1** (4 features): B2B Enterprise Dashboard, WHOOP Integration, Terra API Integration, Apple Health Nutrition
- **TIER 2** (2 features): Live Activity Native Implementation, Running Shoe Tracking
- **TIER 3** (9 features): Nutrition Integration, AI Health Intelligence Engine, Warm-up/Cooldown, CrossFit WODs, Sport-Specific Training, Hybrid Athlete Programs, Voice-First Enhancements, Race Day Plan Generator, Stryd Integration

**Key Findings**:
- ✅ **Backend Services**: All 9 services created with proper structure
- ✅ **API Endpoints**: 40+ endpoints added to main.py with authentication
- ✅ **Mobile Components**: 9 React Native components created
- ✅ **Supabase Edge Functions**: 11 serverless functions created
- ⚠️ **Database Schema**: Multiple tables referenced but NOT created in migrations
- ⚠️ **Frontend Integration**: Components created but NOT integrated into existing screens
- ⚠️ **API Connectivity**: Mobile components call endpoints but response formats may not match
- ⚠️ **External APIs**: All require credentials (WHOOP, Terra, Stryd) - currently using mock data

---

## Audit Methodology

For each feature, I analyzed:
1. **Implementation Completeness** - Missing code, placeholders, error handling
2. **Integration Requirements** - Connections to existing screens/components
3. **External Dependencies** - API credentials, OAuth configs, webhooks
4. **Database Schema** - Missing tables, migrations, RLS policies
5. **Frontend-Backend Connectivity** - API call patterns, response formats
6. **RAG/Knowledge Base** - Documentation and domain knowledge needed
7. **Testing & Validation** - Mock data requirements, end-to-end flows
8. **Next Steps** - Prioritized action items (Critical/Important/Nice-to-have)

---

## Feature-by-Feature Analysis

### TIER 1: B2B Enterprise Dashboard

#### 1.1 Implementation Completeness

**Backend Service**: `apps/backend/csv_import_service.py`
- ✅ Created with AI-powered schema mapping
- ✅ Excel/CSV parsing with `xlsx` library
- ✅ Program quality review using Grok API
- ✅ Bulk client assignment logic
- ⚠️ **Missing**: Actual file upload handling (expects pre-parsed data)
- ⚠️ **Missing**: Progress tracking for long-running imports
- ⚠️ **Missing**: Rollback mechanism for failed imports

**API Endpoints**: `apps/backend/main.py`
- ✅ POST `/api/csv/parse` - Parse uploaded file
- ✅ POST `/api/csv/map-schema` - AI schema mapping
- ✅ POST `/api/csv/review` - Program quality review
- ✅ POST `/api/csv/import` - Execute import
- ⚠️ **Missing**: File upload endpoint (multipart/form-data)
- ⚠️ **Missing**: GET `/api/csv/jobs/{job_id}` - Check import status
- ⚠️ **Missing**: GET `/api/csv/jobs` - List import history

**Mobile Components**: None created (web-only feature)

**Web Dashboard**: 
- ⚠️ **NOT IMPLEMENTED** - No React components created
- ⚠️ **Missing**: File upload UI
- ⚠️ **Missing**: Schema mapping interface
- ⚠️ **Missing**: Program preview table
- ⚠️ **Missing**: Client assignment UI

#### 1.2 Integration Requirements

**Database Tables Required**:
- ✅ `csv_import_jobs` - Defined in migration `20250119_enterprise_dashboard.sql`
- ✅ `coach_profiles` - Defined in migration
- ✅ `organizations` - Defined in migration
- ✅ `client_assignments` - Defined in migration
- ⚠️ **Status**: Migration exists but may not be applied to Supabase

**Missing Integrations**:
- ❌ No web dashboard UI components
- ❌ No navigation routes for coach dashboard
- ❌ No authentication flow for coaches vs clients
- ❌ No real-time progress updates during import

#### 1.3 External Dependencies

**None** - This feature is self-contained

#### 1.4 Database Schema Gaps

**Migration File**: `supabase/migrations/20250119_enterprise_dashboard.sql`
- ✅ Comprehensive schema defined
- ⚠️ **Action Required**: Verify migration has been applied to Supabase
- ⚠️ **Action Required**: Test RLS policies for coach/client access

**Tables to Verify**:
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('csv_import_jobs', 'coach_profiles', 'organizations', 'client_assignments');
```

#### 1.5 Frontend-Backend Connectivity

**N/A** - No frontend components created yet

#### 1.6 RAG/Knowledge Base Preparation

**Not Applicable** - This feature doesn't use RAG

#### 1.7 Testing & Validation Needs

**Backend Testing**:
- ✅ Can test with mock CSV data
- ⚠️ Need sample Excel files with various schemas
- ⚠️ Need to test AI schema mapping accuracy

**Integration Testing**:
- ❌ Cannot test end-to-end without web UI
- ❌ Cannot test file upload without multipart endpoint

#### 1.8 Next Steps Prioritization

**CRITICAL** (Blocks Functionality):
1. Apply database migration to Supabase (5 min)
2. Create file upload endpoint with multipart/form-data (30 min)
3. Build basic web dashboard UI (4-6 hours)

**IMPORTANT** (Needed for Production):
4. Add import progress tracking (1-2 hours)
5. Build schema mapping UI component (2-3 hours)
6. Add rollback mechanism for failed imports (1-2 hours)
7. Create coach authentication flow (2-3 hours)

**NICE-TO-HAVE** (Polish):
8. Real-time progress updates via WebSocket (2-3 hours)
9. Import history dashboard (1-2 hours)
10. Export functionality for corrected data (1 hour)

**Estimated Total Effort**: 15-22 hours

---

### TIER 1: WHOOP Integration

#### 2.1 Implementation Completeness

**Backend Service**: `apps/backend/whoop_oauth_service.py`
- ✅ OAuth 2.0 authorization flow
- ✅ Token exchange and refresh
- ✅ User profile fetching
- ✅ Recovery, sleep, and strain data retrieval
- ⚠️ **Missing**: Error handling for expired tokens
- ⚠️ **Missing**: Automatic token refresh before API calls
- ⚠️ **Missing**: Rate limiting for WHOOP API

**API Endpoints**: `apps/backend/main.py`
- ✅ GET `/api/wearables/whoop/auth-url` - Get OAuth URL
- ✅ POST `/api/wearables/whoop/callback` - Handle OAuth callback
- ✅ GET `/api/wearables/whoop/profile` - Get user profile
- ✅ GET `/api/wearables/whoop/recovery` - Get recovery data
- ✅ GET `/api/wearables/whoop/sleep` - Get sleep data
- ✅ GET `/api/wearables/whoop/strain` - Get strain data
- ✅ POST `/api/wearables/whoop/refresh` - Refresh access token
- ✅ POST `/api/webhooks/whoop` - Webhook handler
- ⚠️ **Missing**: GET `/api/wearables/whoop/disconnect` - Revoke connection

**Mobile Components**: `apps/mobile/src/components/wearables/WHOOPConnectionCard.tsx`
- ✅ Connection status display
- ✅ Connect/Disconnect buttons
- ✅ Last sync timestamp
- ✅ Recovery score visualization
- ⚠️ **Missing**: OAuth redirect handling in React Native
- ⚠️ **Missing**: Deep link configuration for callback

**Supabase Edge Functions**: None (webhook handled in FastAPI)

#### 2.2 Integration Requirements

**Existing Screen Integration**:
- ✅ `WearablesScreen.tsx` - Already imports and uses `WHOOPConnectionCard`
- ✅ Component properly integrated with user authentication
- ⚠️ **Missing**: Recovery data visualization on `RecoveryDetailScreen`
- ⚠️ **Missing**: Sleep data on `HomeScreen` health snapshot

**Database Tables Required**:
- ✅ `wearable_provider_connections` - Defined in `20250119_wearables_nutrition_ingestion.sql`
- ✅ `daily_metrics` - Defined in migration
- ✅ `wearable_raw_events` - Defined in migration
- ⚠️ **Status**: Migration exists but may not be applied

**Missing Integrations**:
- ❌ Recovery score not displayed on `HomeScreen`
- ❌ Sleep quality not integrated into readiness calculation
- ❌ Strain data not used in workout recommendations

#### 2.3 External Dependencies

**WHOOP API Credentials**:
- ❌ `WHOOP_CLIENT_ID` - Not set
- ❌ `WHOOP_CLIENT_SECRET` - Not set
- ❌ `WHOOP_REDIRECT_URI` - Needs to be `voicefit://whoop-callback`
- ❌ **Action Required**: Register app at https://developer.whoop.com
- ❌ **Action Required**: Configure OAuth redirect URI
- ❌ **Action Required**: Set up webhook endpoint URL

**Webhook Configuration**:
- ❌ Webhook URL: `https://voicefit.railway.app/api/webhooks/whoop`
- ❌ Webhook secret for HMAC verification
- ⚠️ **Note**: Webhook signature verification not implemented

#### 2.4 Database Schema Gaps

**Migration File**: `supabase/migrations/20250119_wearables_nutrition_ingestion.sql`
- ✅ Comprehensive wearables schema
- ⚠️ **Action Required**: Verify migration applied
- ⚠️ **Action Required**: Test RLS policies

**Tables to Verify**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('wearable_provider_connections', 'daily_metrics', 'wearable_raw_events');
```

#### 2.5 Frontend-Backend Connectivity

**API Call Pattern**:
```typescript
// WHOOPConnectionCard.tsx calls:
fetch('/api/wearables/whoop/auth-url', { headers: { Authorization: `Bearer ${userId}` } })
```

**Issues**:
- ⚠️ **Incorrect Auth**: Using `userId` as Bearer token instead of Supabase JWT
- ⚠️ **Missing Base URL**: Should use `process.env.EXPO_PUBLIC_API_URL`
- ⚠️ **No Error Handling**: Network errors not caught
- ⚠️ **No Loading States**: User feedback missing

**Required Fix**:
```typescript
import { useAuthStore } from '../../store/auth.store';
const { session } = useAuthStore();
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://voicefit.railway.app';

fetch(`${API_BASE}/api/wearables/whoop/auth-url`, {
  headers: { Authorization: `Bearer ${session?.access_token}` }
})
```

#### 2.6 RAG/Knowledge Base Preparation

**Not Applicable** - This feature doesn't use RAG

#### 2.7 Testing & Validation Needs

**Cannot Test Without**:
- ❌ WHOOP developer account
- ❌ WHOOP API credentials
- ❌ Real WHOOP device with data

**Can Test With Mock Data**:
- ✅ OAuth flow (can mock token exchange)
- ✅ Data normalization logic
- ✅ UI components with sample data

**Mock Data Requirements**:
```json
{
  "recovery": { "score": 85, "hrv": 65, "resting_hr": 52 },
  "sleep": { "duration_hours": 7.5, "quality_score": 88 },
  "strain": { "score": 12.5, "calories": 2400 }
}
```

#### 2.8 Next Steps Prioritization

**CRITICAL** (Blocks Functionality):
1. Fix authentication in mobile component (30 min)
2. Apply wearables migration to Supabase (5 min)
3. Register WHOOP developer account (1 hour)
4. Configure OAuth redirect URI in React Native (1 hour)

**IMPORTANT** (Needed for Production):
5. Implement deep linking for OAuth callback (2-3 hours)
6. Add automatic token refresh (1-2 hours)
7. Integrate recovery data into `RecoveryDetailScreen` (2 hours)
8. Add webhook signature verification (1 hour)

**NICE-TO-HAVE** (Polish):
9. Add disconnect functionality (30 min)
10. Show historical recovery trends (2 hours)
11. Add rate limiting for WHOOP API (1 hour)

**Estimated Total Effort**: 11-15 hours

---

### TIER 1: Terra API Integration

#### 3.1 Implementation Completeness

**Backend Service**: `apps/backend/terra_oauth_service.py`
- ✅ Widget session creation for multi-device OAuth
- ✅ Token exchange
- ✅ User info retrieval
- ✅ Deauthentication
- ⚠️ **Missing**: Support for all 8+ devices (Garmin, Fitbit, Oura, etc.)
- ⚠️ **Missing**: Device-specific data fetching methods
- ⚠️ **Missing**: Webhook signature verification (HMAC-SHA256)

**Data Normalization**: `apps/backend/data_normalization_service.py`
- ✅ `normalize_terra_nutrition()` method added
- ✅ Nutrition data normalization
- ⚠️ **Missing**: Activity data normalization
- ⚠️ **Missing**: Sleep data normalization
- ⚠️ **Missing**: Body metrics normalization

**API Endpoints**: `apps/backend/main.py`
- ✅ POST `/api/wearables/terra/widget-session` - Get widget URL
- ✅ POST `/api/wearables/terra/callback` - Handle OAuth callback
- ✅ GET `/api/wearables/terra/user-info` - Get user info
- ✅ POST `/api/wearables/terra/deauth` - Disconnect device
- ✅ POST `/api/webhooks/terra` - Webhook handler
- ⚠️ **Missing**: GET `/api/wearables/terra/devices` - List connected devices
- ⚠️ **Missing**: GET `/api/wearables/terra/activity` - Fetch activity data
- ⚠️ **Missing**: GET `/api/wearables/terra/sleep` - Fetch sleep data

**Mobile Components**: `apps/mobile/src/components/wearables/TerraConnectionCard.tsx`
- ✅ Connection status display
- ✅ Connect/Disconnect buttons
- ✅ Last sync timestamp
- ✅ Multi-device support indicator
- ⚠️ **Missing**: Device selection UI (Garmin, Fitbit, Oura, etc.)
- ⚠️ **Missing**: Terra widget integration (opens in WebView)

**Supabase Edge Functions**: None (webhook handled in FastAPI)

#### 3.2 Integration Requirements

**Existing Screen Integration**:
- ✅ `WearablesScreen.tsx` - Already imports and uses `TerraConnectionCard`
- ⚠️ **Missing**: Activity data on `HomeScreen`
- ⚠️ **Missing**: Sleep data on `RecoveryDetailScreen`
- ⚠️ **Missing**: Nutrition data on `NutritionScreen`

**Database Tables Required**:
- ✅ `wearable_provider_connections` - Shared with WHOOP
- ✅ `daily_metrics` - Shared table
- ✅ `daily_nutrition_summary` - For nutrition data
- ⚠️ **Status**: Migration exists but may not be applied

**Missing Integrations**:
- ❌ Terra nutrition data not displayed on `NutritionScreen`
- ❌ Terra activity data not used in training load calculations
- ❌ Terra sleep data not integrated into readiness score

#### 3.3 External Dependencies

**Terra API Credentials**:
- ❌ `TERRA_DEV_ID` - Not set
- ❌ `TERRA_API_KEY` - Not set
- ❌ `TERRA_WEBHOOK_SECRET` - Not set
- ❌ **Action Required**: Register at https://dashboard.tryterra.co
- ❌ **Action Required**: Configure webhook URL
- ❌ **Action Required**: Enable data types (activity, sleep, nutrition, body)

**Webhook Configuration**:
- ❌ Webhook URL: `https://voicefit.railway.app/api/webhooks/terra`
- ❌ Webhook secret for HMAC-SHA256 verification
- ⚠️ **Note**: Signature verification partially implemented but not tested

**Supported Devices** (Terra Widget):
- Garmin, Fitbit, Oura, Apple Health, Google Fit, Polar, Suunto, Wahoo

#### 3.4 Database Schema Gaps

**Same as WHOOP** - Uses shared wearables schema

#### 3.5 Frontend-Backend Connectivity

**API Call Pattern**:
```typescript
// TerraConnectionCard.tsx
fetch('/api/wearables/terra/widget-session', {
  method: 'POST',
  headers: { Authorization: `Bearer ${userId}` }
})
```

**Issues**:
- ⚠️ **Same auth issues as WHOOP** - Using userId instead of JWT
- ⚠️ **Missing Base URL**
- ⚠️ **No WebView Integration** - Terra widget needs to open in WebView
- ⚠️ **No Deep Link Handling** - Callback after device connection

**Required Implementation**:
```typescript
import { WebView } from 'react-native-webview';

// Open Terra widget in WebView
<WebView
  source={{ uri: widgetUrl }}
  onNavigationStateChange={(navState) => {
    if (navState.url.includes('voicefit://terra-callback')) {
      // Handle callback
    }
  }}
/>
```

#### 3.6 RAG/Knowledge Base Preparation

**Not Applicable** - This feature doesn't use RAG

#### 3.7 Testing & Validation Needs

**Cannot Test Without**:
- ❌ Terra developer account
- ❌ Terra API credentials
- ❌ Real wearable device (Garmin, Fitbit, etc.)

**Can Test With Mock Data**:
- ✅ Webhook payload processing
- ✅ Data normalization logic
- ✅ UI components

**Mock Data Requirements**:
```json
{
  "type": "activity",
  "user": { "user_id": "terra_user_123" },
  "data": {
    "distance_meters": 5000,
    "duration_seconds": 1800,
    "calories": 350,
    "avg_hr": 145
  }
}
```

#### 3.8 Next Steps Prioritization

**CRITICAL** (Blocks Functionality):
1. Fix authentication in mobile component (30 min)
2. Register Terra developer account (1 hour)
3. Implement Terra widget WebView integration (2-3 hours)
4. Configure deep linking for callback (1 hour)

**IMPORTANT** (Needed for Production):
5. Add device selection UI (2 hours)
6. Implement activity data normalization (2-3 hours)
7. Implement sleep data normalization (2-3 hours)
8. Integrate nutrition data into `NutritionScreen` (2 hours)
9. Add webhook signature verification (1 hour)

**NICE-TO-HAVE** (Polish):
10. Show connected devices list (1-2 hours)
11. Add per-device sync status (1 hour)
12. Historical data sync on first connection (3-4 hours)

**Estimated Total Effort**: 18-25 hours

---

### TIER 1: Apple Health Nutrition Integration

#### 4.1 Implementation Completeness

**Backend Service**: Uses existing `data_normalization_service.py`
- ✅ Nutrition data normalization from Terra (Apple Health via Terra)
- ⚠️ **Missing**: Direct Apple Health integration (HealthKit)
- ⚠️ **Missing**: Manual nutrition entry API

**API Endpoints**: `apps/backend/main.py`
- ✅ POST `/api/webhooks/terra` - Handles Apple Health data via Terra
- ⚠️ **Missing**: POST `/api/nutrition/manual-entry` - Manual logging
- ⚠️ **Missing**: GET `/api/nutrition/daily-summary` - Get daily nutrition
- ⚠️ **Missing**: GET `/api/nutrition/insights` - Nutrition-to-performance insights

**Mobile Components**: `apps/mobile/src/components/nutrition/ManualNutritionEntry.tsx`
- ✅ Manual entry form (calories, protein, carbs, fat)
- ✅ Meal type selection (breakfast, lunch, dinner, snack)
- ✅ Date picker
- ⚠️ **Missing**: Food search/autocomplete
- ⚠️ **Missing**: Barcode scanner integration
- ⚠️ **Missing**: Macro calculator

**Supabase Edge Functions**: `supabase/functions/log-nutrition/index.ts`
- ✅ Manual nutrition logging
- ✅ Validation logic
- ⚠️ **Missing**: Duplicate detection
- ⚠️ **Missing**: Meal photo upload support

#### 4.2 Integration Requirements

**Existing Screen Integration**:
- ✅ `NutritionScreen.tsx` - Imports `ManualNutritionEntry`
- ⚠️ **Missing**: Display of daily nutrition summary
- ⚠️ **Missing**: Historical nutrition trends
- ⚠️ **Missing**: Nutrition-to-performance correlation display

**Database Tables Required**:
- ✅ `daily_nutrition_summary` - Defined in wearables migration
- ⚠️ **Status**: Migration may not be applied

**Missing Integrations**:
- ❌ Nutrition data not shown on `HomeScreen`
- ❌ Nutrition insights not integrated into AI Health Intelligence
- ❌ No correlation with workout performance

#### 4.3 External Dependencies

**Apple Health (via Terra)**:
- ✅ Already covered by Terra API integration
- ⚠️ **Note**: Requires user to connect Apple Health via Terra widget

**Direct HealthKit Integration** (Future):
- ❌ Would require native iOS module
- ❌ Would need HealthKit permissions in Info.plist
- ❌ Not implemented in current version

#### 4.4 Database Schema Gaps

**Same as Terra** - Uses `daily_nutrition_summary` table

#### 4.5 Frontend-Backend Connectivity

**API Call Pattern**:
```typescript
// ManualNutritionEntry.tsx
fetch('/api/nutrition/manual-entry', {
  method: 'POST',
  body: JSON.stringify({ calories, protein, carbs, fat })
})
```

**Issues**:
- ⚠️ **Endpoint doesn't exist** - Need to create it
- ⚠️ **Missing auth header**
- ⚠️ **No error handling**

**Required Implementation**:
```python
# In main.py
@app.post("/api/nutrition/manual-entry")
async def log_nutrition_manual(
    request: dict,
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token),
):
    # Insert into daily_nutrition_summary
    pass
```

#### 4.6 RAG/Knowledge Base Preparation

**Nutrition Guidelines to Ingest**:
- Macro ratios for different training goals (strength, endurance, hybrid)
- Nutrient timing recommendations (pre/post workout)
- Hydration guidelines based on training intensity
- Recovery nutrition protocols

**Sources**:
- ISSN Position Stands
- ACSM Nutrition Guidelines
- Sports Nutrition textbooks

#### 4.7 Testing & Validation Needs

**Can Test Immediately**:
- ✅ Manual entry UI component
- ✅ Form validation
- ✅ Data normalization logic

**Cannot Test Without**:
- ❌ Apple Health data (requires real device)
- ❌ Terra API credentials

#### 4.8 Next Steps Prioritization

**CRITICAL** (Blocks Functionality):
1. Create manual nutrition entry API endpoint (1 hour)
2. Fix authentication in mobile component (30 min)
3. Apply database migration (5 min)

**IMPORTANT** (Needed for Production):
4. Add daily nutrition summary endpoint (1 hour)
5. Display nutrition data on `NutritionScreen` (2 hours)
6. Integrate nutrition into AI Health Intelligence (2-3 hours)
7. Add nutrition-to-performance insights (3-4 hours)

**NICE-TO-HAVE** (Polish):
8. Food search/autocomplete (4-6 hours)
9. Barcode scanner (3-4 hours)
10. Meal photo upload (2-3 hours)
11. Macro calculator (1-2 hours)

**Estimated Total Effort**: 19-30 hours

---

## TIER 2 & TIER 3 Features - Summary Analysis

Due to the extensive scope, I'll provide a condensed analysis for the remaining 11 features:

### TIER 2: Live Activity Native Implementation

**Status**: ⚠️ **NOT IMPLEMENTED**
- ❌ No Swift UI components created
- ❌ No React Native bridge module
- ❌ No ActivityKit integration
- **Effort Required**: 20-30 hours (requires native iOS development)

### TIER 2: Running Shoe Tracking & Analytics

**Status**: ✅ **PARTIALLY COMPLETE**
- ✅ Database schema exists (`20250124_running_shoes.sql`)
- ✅ `shoe_id` column added to `runs` table
- ❌ No backend API endpoints
- ❌ No mobile UI components
- **Effort Required**: 8-12 hours

### TIER 3: AI Health Intelligence Engine

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `health_intelligence_service.py`
- ✅ API endpoints: correlations, injury risk, readiness, insights
- ✅ Mobile components: `CorrelationsCard`, `InjuryRiskCard`, `ReadinessCard`, `InsightsCard`
- ⚠️ Components NOT integrated into screens
- ⚠️ No database tables for storing insights
- **Effort Required**: 6-10 hours (integration only)

### TIER 3: Warm-up & Cooldown Programming

**Status**: ✅ **BACKEND COMPLETE, FRONTEND MISSING**
- ✅ Backend service: `warmup_cooldown_service.py`
- ✅ API endpoints exist
- ✅ Mobile component: `WarmupCooldownSection.tsx`
- ⚠️ Component NOT integrated into `RunScreen` or workout screens
- **Effort Required**: 4-6 hours

### TIER 3: CrossFit WOD Modifications

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `crossfit_wod_service.py`
- ✅ API endpoints: parse WOD, generate modifications
- ✅ Mobile component: `WODModificationCard.tsx`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No dedicated CrossFit screen
- **Effort Required**: 6-8 hours

### TIER 3: Sport-Specific Training Programs

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `sport_specific_training_service.py`
- ✅ API endpoints: generate program, get positions, get periodization
- ✅ Mobile component: `SportTrainingSelector.tsx`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No program display/tracking UI
- **Effort Required**: 8-12 hours

### TIER 3: Hybrid Athlete Programs

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `hybrid_athlete_service.py`
- ✅ API endpoints: generate program, interference mitigation, recovery protocol
- ✅ Mobile component: `HybridAthleteSelector.tsx`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No program display UI
- **Effort Required**: 8-12 hours

### TIER 3: Voice-First Enhancements

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `voice_first_service.py`
- ✅ API endpoints: process command, form cues, modify program
- ✅ Mobile component: `VoiceCommandCenter.tsx`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No Siri/Google Assistant integration
- **Effort Required**: 12-16 hours

### TIER 3: Race Day Plan Generator

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `race_day_plan_service.py`
- ✅ API endpoints: generate plan, analyze terrain, nutrition strategy
- ✅ Mobile component: `RaceDayPlanner.tsx`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No race calendar/tracking
- **Effort Required**: 8-12 hours

### TIER 3: Stryd Integration

**Status**: ✅ **BACKEND COMPLETE, FRONTEND PARTIAL**
- ✅ Backend service: `stryd_service.py`
- ✅ API endpoints: OAuth, power data, mechanics analysis
- ✅ Mobile component: `StrydPowerAnalytics.tsx`
- ✅ Supabase Edge Function: `stryd-webhook/index.ts`
- ⚠️ Component NOT integrated into any screen
- ⚠️ No database tables for power data
- **Effort Required**: 10-14 hours

---

## Cross-Cutting Concerns

### Database Schema Status

**Migration Files Exist** (15 total):
- ✅ `20250115_enable_rls_critical_tables.sql`
- ✅ `20250116_program_scheduling_schema.sql`
- ✅ `20250119_enterprise_dashboard.sql`
- ✅ `20250119_wearables_nutrition_ingestion.sql`
- ✅ `20250124_running_shoes.sql`
- ✅ `20251120013213_health_snapshots.sql`
- ✅ `20251121_messages_table.sql`
- ✅ `20251121_runs_table.sql`
- ... and 7 more

**Critical Action Required**:
```bash
# Verify which migrations have been applied
cd supabase
npx supabase db pull

# Apply missing migrations
npx supabase db push
```

**Missing Tables** (Referenced in code but no migration):
- ❌ `stryd_power_data` - For Stryd running power metrics
- ❌ `hybrid_athlete_programs` - For hybrid training programs
- ❌ `race_day_plans` - For race strategy plans
- ❌ `sport_specific_programs` - For sport training programs
- ❌ `crossfit_wods` - For WOD history
- ❌ `voice_command_history` - For voice command analytics
- ❌ `health_intelligence_insights` - For storing AI insights

**Action Required**: Create migrations for missing tables (2-4 hours)

### Authentication & Authorization

**Current Pattern**:
```python
# Backend (main.py)
async def verify_token(authorization: str = Header(None)) -> dict:
    # Verifies Supabase JWT
    pass
```

**Issues in Mobile Components**:
- ⚠️ Most components use `userId` instead of JWT token
- ⚠️ Missing `useAuthStore` import
- ⚠️ No error handling for 401 responses

**Required Fix** (applies to ALL mobile components):
```typescript
import { useAuthStore } from '../../store/auth.store';

const { session } = useAuthStore();
const headers = {
  'Authorization': `Bearer ${session?.access_token}`,
  'Content-Type': 'application/json'
};
```

**Affected Components** (11 total):
- WHOOPConnectionCard, TerraConnectionCard, ManualNutritionEntry
- CorrelationsCard, InjuryRiskCard, ReadinessCard, InsightsCard
- WODModificationCard, SportTrainingSelector, HybridAthleteSelector
- VoiceCommandCenter, RaceDayPlanner, StrydPowerAnalytics

**Effort**: 3-4 hours to fix all components

### API Base URL Configuration

**Current Issue**: Hardcoded or missing base URLs

**Required Fix**:
```typescript
// Create apps/mobile/src/config/api.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://voicefit.railway.app';
```

**Update all components** to import and use `API_BASE_URL`

**Effort**: 1-2 hours

### Error Handling & User Feedback

**Missing Across All Components**:
- ❌ No try-catch blocks around fetch calls
- ❌ No loading states during API calls
- ❌ No error messages displayed to user
- ❌ No retry logic for failed requests

**Required Pattern**:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setIsLoading(true);
  setError(null);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
  // Handle success
} catch (err) {
  setError(err.message);
  Alert.alert('Error', err.message);
} finally {
  setIsLoading(false);
}
```

**Effort**: 4-6 hours to add to all components

### TypeScript Type Safety

**Missing Type Definitions**:
- ❌ No interfaces for API responses
- ❌ No types for component props
- ❌ Using `any` in many places

**Required**:
```typescript
// Create apps/mobile/src/types/api.ts
export interface WHOOPRecoveryData {
  score: number;
  hrv: number;
  resting_hr: number;
}

export interface TerraActivityData {
  distance_meters: number;
  duration_seconds: number;
  calories: number;
}
```

**Effort**: 3-4 hours

---

## External API Dependencies Summary

### Required Developer Accounts

| Service | Purpose | Registration URL | Status |
|---------|---------|-----------------|--------|
| **WHOOP** | Recovery/sleep/strain data | https://developer.whoop.com | ❌ Not registered |
| **Terra** | Multi-wearable integration | https://dashboard.tryterra.co | ❌ Not registered |
| **Stryd** | Running power metrics | https://www.stryd.com/developers | ❌ Not registered |

### Required Environment Variables

**Backend** (`apps/backend/.env`):
```bash
# Existing
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
XAI_API_KEY=...
UPSTASH_SEARCH_REST_URL=...
UPSTASH_SEARCH_REST_TOKEN=...

# NEW - WHOOP Integration
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
WHOOP_REDIRECT_URI=voicefit://whoop-callback

# NEW - Terra Integration
TERRA_DEV_ID=...
TERRA_API_KEY=...
TERRA_WEBHOOK_SECRET=...

# NEW - Stryd Integration
STRYD_CLIENT_ID=...
STRYD_CLIENT_SECRET=...
STRYD_REDIRECT_URI=voicefit://stryd-callback
```

**Mobile** (`apps/mobile/.env`):
```bash
EXPO_PUBLIC_API_URL=https://voicefit.railway.app
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Webhook Configuration

**Required Webhook URLs**:
- WHOOP: `https://voicefit.railway.app/api/webhooks/whoop`
- Terra: `https://voicefit.railway.app/api/webhooks/terra`
- Stryd: `https://voicefit.railway.app/api/webhooks/stryd`

**Security**:
- ⚠️ HMAC-SHA256 signature verification partially implemented
- ⚠️ Need to test with real webhook payloads
- ⚠️ Need to handle replay attacks

---

## RAG/Knowledge Base Preparation

### Domain Knowledge to Ingest

**Nutrition Guidelines**:
- ISSN Position Stands (protein, carbs, hydration)
- ACSM Nutrition Guidelines
- Nutrient timing research
- Recovery nutrition protocols

**Sport-Specific Training**:
- Basketball: Position-specific drills, conditioning protocols
- Soccer: Periodization models, position demands
- Baseball: Throwing mechanics, rotational power
- Football: Position-specific strength standards
- Tennis: Court movement patterns, energy systems
- Volleyball: Jump training, shoulder health
- Ice Hockey: Skating mechanics, anaerobic capacity
- Swimming: Stroke technique, periodization

**Running Mechanics**:
- Stryd power metrics interpretation
- Ground contact time norms
- Vertical oscillation standards
- Leg spring stiffness research
- Cadence optimization

**CrossFit**:
- WOD movement standards
- Scaling guidelines
- Common substitutions
- Injury prevention

**Hybrid Training**:
- Concurrent training research
- Interference effect mitigation
- Recovery protocols
- Periodization models

**Race Day Planning**:
- Pacing strategies by distance
- Nutrition timing protocols
- Hydration guidelines
- Mental preparation techniques

### API Documentation to Study

- **WHOOP API**: https://developer.whoop.com/docs
- **Terra API**: https://docs.tryterra.co
- **Stryd API**: https://developers.stryd.com

### Estimated Effort

- Research and document: 20-30 hours
- Ingest into Upstash: 4-6 hours
- Test RAG queries: 2-3 hours
- **Total**: 26-39 hours

---

## Prioritized Action Plan

### Phase 1: Critical Fixes (Blocks All Functionality) - 8-12 hours

**Priority**: 🔴 **CRITICAL** - Must complete before any feature can work

1. **Apply Database Migrations** (30 min)
   ```bash
   cd supabase
   npx supabase db push
   ```
   - Verify all 15 migrations applied
   - Check RLS policies enabled

2. **Create Missing Database Tables** (2-3 hours)
   - `stryd_power_data`
   - `hybrid_athlete_programs`
   - `race_day_plans`
   - `sport_specific_programs`
   - `crossfit_wods`
   - `voice_command_history`
   - `health_intelligence_insights`

3. **Fix Authentication in ALL Mobile Components** (3-4 hours)
   - Update 13 components to use `useAuthStore`
   - Replace `userId` with JWT token
   - Add proper Authorization headers

4. **Configure API Base URL** (1 hour)
   - Create `apps/mobile/src/config/api.ts`
   - Update all components to use centralized config
   - Set environment variables

5. **Add Error Handling to ALL Components** (4-6 hours)
   - Add try-catch blocks
   - Add loading states
   - Add error messages
   - Add retry logic

**Deliverable**: All components can make authenticated API calls with proper error handling

---

### Phase 2: External API Setup (Enables Wearable Features) - 4-6 hours

**Priority**: 🟠 **HIGH** - Required for WHOOP, Terra, Stryd features

1. **Register Developer Accounts** (2-3 hours)
   - WHOOP: https://developer.whoop.com
   - Terra: https://dashboard.tryterra.co
   - Stryd: https://www.stryd.com/developers

2. **Configure OAuth & Webhooks** (2-3 hours)
   - Set redirect URIs: `voicefit://whoop-callback`, `voicefit://terra-callback`, `voicefit://stryd-callback`
   - Configure webhook URLs
   - Get API credentials
   - Update environment variables

**Deliverable**: Can test wearable integrations with real devices

---

### Phase 3: Frontend Integration (Makes Features Visible) - 20-30 hours

**Priority**: 🟡 **MEDIUM** - Required for users to access features

**3.1 Integrate AI Health Intelligence** (6-8 hours)
- Add `CorrelationsCard` to `HomeScreen`
- Add `InjuryRiskCard` to `RecoveryDetailScreen`
- Add `ReadinessCard` to `RecoveryDetailScreen`
- Add `InsightsCard` to `HomeScreen`
- Wire up API calls
- Test with mock data

**3.2 Integrate Wearable Data** (4-6 hours)
- Display WHOOP recovery on `RecoveryDetailScreen`
- Display Terra nutrition on `NutritionScreen`
- Display Stryd power on new `RunAnalyticsScreen`
- Add data refresh logic

**3.3 Create New Screens** (10-16 hours)
- `CrossFitScreen` - For WOD modifications
- `ProgramBuilderScreen` - For sport-specific & hybrid programs
- `RacePlanningScreen` - For race day plans
- `VoiceCommandsScreen` - For voice shortcuts
- `RunAnalyticsScreen` - For Stryd power data

**Deliverable**: All features accessible from app navigation

---

### Phase 4: Backend Enhancements (Production Readiness) - 15-20 hours

**Priority**: 🟢 **IMPORTANT** - Needed for production

**4.1 Complete Missing Endpoints** (6-8 hours)
- POST `/api/nutrition/manual-entry`
- GET `/api/nutrition/daily-summary`
- GET `/api/nutrition/insights`
- GET `/api/shoes/list`
- POST `/api/shoes/add`
- PUT `/api/shoes/update-mileage`
- GET `/api/wearables/terra/devices`
- GET `/api/wearables/whoop/disconnect`

**4.2 Add Data Normalization** (4-6 hours)
- Terra activity data normalization
- Terra sleep data normalization
- Terra body metrics normalization
- Stryd power data normalization

**4.3 Implement Webhook Security** (2-3 hours)
- HMAC-SHA256 signature verification for all webhooks
- Replay attack prevention
- Rate limiting

**4.4 Add Automatic Token Refresh** (3-4 hours)
- WHOOP token refresh before expiry
- Terra token refresh
- Stryd token refresh

**Deliverable**: Production-ready backend with security & reliability

---

### Phase 5: Polish & Testing (User Experience) - 15-25 hours

**Priority**: 🔵 **NICE-TO-HAVE** - Improves UX

**5.1 Add Advanced UI Features** (8-12 hours)
- Food search/autocomplete for nutrition
- Barcode scanner
- Meal photo upload
- Historical data charts
- Device selection UI for Terra

**5.2 Add TypeScript Types** (3-4 hours)
- Create interface definitions for all API responses
- Add prop types to all components
- Remove `any` types

**5.3 End-to-End Testing** (4-9 hours)
- Test OAuth flows with real devices
- Test webhook processing
- Test data normalization
- Test UI components with real data

**Deliverable**: Polished, type-safe, well-tested features

---

## Effort Summary by Category

| Category | Critical | High | Medium | Important | Nice-to-Have | **Total** |
|----------|----------|------|--------|-----------|--------------|-----------|
| **Database** | 2.5h | - | - | - | - | **2.5h** |
| **Authentication** | 3-4h | - | - | - | - | **3-4h** |
| **Error Handling** | 4-6h | - | - | - | - | **4-6h** |
| **External APIs** | - | 4-6h | - | - | - | **4-6h** |
| **Frontend Integration** | - | - | 20-30h | - | - | **20-30h** |
| **Backend Endpoints** | - | - | - | 15-20h | - | **15-20h** |
| **Polish & Testing** | - | - | - | - | 15-25h | **15-25h** |
| **RAG Knowledge Base** | - | - | - | 26-39h | - | **26-39h** |
| **TOTAL** | **9.5-12.5h** | **4-6h** | **20-30h** | **41-59h** | **15-25h** | **90-132.5h** |

---

## Recommended Execution Order

### Week 1: Foundation (Critical + High Priority)
**Goal**: Make all features functional with proper auth and error handling

1. Apply database migrations (30 min)
2. Create missing tables (2-3 hours)
3. Fix authentication in components (3-4 hours)
4. Add error handling (4-6 hours)
5. Register external API accounts (2-3 hours)
6. Configure OAuth & webhooks (2-3 hours)

**Total**: 14-19.5 hours (~2-3 days)

### Week 2: Integration (Medium Priority)
**Goal**: Make features visible and accessible in the app

1. Integrate AI Health Intelligence (6-8 hours)
2. Integrate wearable data displays (4-6 hours)
3. Create new screens (10-16 hours)

**Total**: 20-30 hours (~3-4 days)

### Week 3-4: Production Readiness (Important Priority)
**Goal**: Backend enhancements and RAG knowledge base

1. Complete missing endpoints (6-8 hours)
2. Add data normalization (4-6 hours)
3. Implement webhook security (2-3 hours)
4. Add token refresh (3-4 hours)
5. RAG knowledge base preparation (26-39 hours)

**Total**: 41-60 hours (~5-8 days)

### Week 5: Polish (Nice-to-Have)
**Goal**: Advanced features and testing

1. Advanced UI features (8-12 hours)
2. TypeScript types (3-4 hours)
3. End-to-end testing (4-9 hours)

**Total**: 15-25 hours (~2-3 days)

---

## Blockers & Dependencies

### Cannot Proceed Without

1. **Database Migrations Applied** - Blocks ALL features
2. **Authentication Fixed** - Blocks ALL API calls
3. **External API Credentials** - Blocks WHOOP, Terra, Stryd testing

### Can Proceed With Mock Data

- AI Health Intelligence (correlations, insights)
- CrossFit WOD modifications
- Sport-specific programs
- Hybrid athlete programs
- Race day planning
- Voice commands

### Requires Native Development

- Live Activity (Swift/ActivityKit) - 20-30 hours
- Direct HealthKit integration - 10-15 hours
- Siri Shortcuts - 8-12 hours

---

## Risk Assessment

### High Risk

- **Database Schema Gaps**: Missing tables will cause runtime errors
- **Authentication Issues**: All API calls will fail with 401
- **Missing Environment Variables**: Features will crash without credentials

### Medium Risk

- **Webhook Security**: Vulnerable to replay attacks without HMAC verification
- **Token Expiry**: Users will be logged out without auto-refresh
- **Type Safety**: Runtime errors from incorrect data shapes

### Low Risk

- **Missing UI Polish**: Features work but UX is suboptimal
- **Incomplete RAG**: AI responses less accurate but functional
- **Missing Tests**: Bugs may slip through but can be fixed

---

## Conclusion

**Current State**:
- ✅ **Backend**: 90% complete (services, endpoints, logic)
- ⚠️ **Frontend**: 40% complete (components created but not integrated)
- ❌ **Database**: 60% complete (migrations exist but not applied, missing tables)
- ❌ **External APIs**: 0% complete (no credentials configured)
- ❌ **Integration**: 20% complete (components not wired to screens)

**To Reach Production**:
- **Minimum Viable**: 14-20 hours (Phase 1 + Phase 2)
- **Feature Complete**: 34-50 hours (Phase 1 + Phase 2 + Phase 3)
- **Production Ready**: 75-109 hours (Phase 1-4)
- **Fully Polished**: 90-134 hours (All phases)

**Recommended Path**:
1. Start with Phase 1 (Critical) - 1-2 days
2. Complete Phase 2 (External APIs) - 1 day
3. Tackle Phase 3 (Integration) - 3-4 days
4. Defer Phase 4 (RAG) and Phase 5 (Polish) to post-MVP

**Next Immediate Steps**:
1. Run `npx supabase db push` to apply migrations
2. Create missing database tables
3. Fix authentication in mobile components
4. Register WHOOP, Terra, Stryd developer accounts

---

**End of Audit**


