# Critical Next Steps - VoiceFit Feature Implementation

**Date**: 2025-11-24  
**Priority**: 🔴 **MUST DO FIRST** - These block all functionality

---

## 1. Apply Database Migrations (30 minutes)

### Verify Current State
```bash
cd supabase
npx supabase db pull
```

### Apply All Migrations
```bash
npx supabase db push
```

### Verify Tables Exist
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'wearable_provider_connections',
  'daily_metrics',
  'daily_nutrition_summary',
  'csv_import_jobs',
  'coach_profiles',
  'running_shoes'
);
```

**Expected Result**: All 6 tables should exist

---

## 2. Create Missing Database Tables (2-3 hours)

### Tables Referenced in Code But Missing Migrations

Create `supabase/migrations/20250125_missing_tables.sql`:

```sql
-- Stryd Power Data
CREATE TABLE IF NOT EXISTS public.stryd_power_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  date DATE NOT NULL,
  power_avg INTEGER,
  power_max INTEGER,
  ground_contact_time INTEGER, -- milliseconds
  vertical_oscillation DECIMAL(4,2), -- cm
  leg_spring_stiffness DECIMAL(6,2), -- kN/m
  cadence_avg INTEGER,
  efficiency DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hybrid Athlete Programs
CREATE TABLE IF NOT EXISTS public.hybrid_athlete_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('strength', 'endurance')),
  secondary_goal TEXT NOT NULL CHECK (secondary_goal IN ('strength', 'endurance')),
  program_structure JSONB NOT NULL,
  interference_mitigation JSONB,
  recovery_protocol JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race Day Plans
CREATE TABLE IF NOT EXISTS public.race_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_name TEXT NOT NULL,
  race_type TEXT NOT NULL,
  distance_km DECIMAL(6,2),
  elevation_gain_m INTEGER,
  race_date DATE,
  pacing_strategy JSONB,
  nutrition_plan JSONB,
  hydration_strategy JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sport-Specific Programs
CREATE TABLE IF NOT EXISTS public.sport_specific_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  position TEXT,
  season TEXT CHECK (season IN ('off-season', 'pre-season', 'in-season')),
  program_structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CrossFit WODs
CREATE TABLE IF NOT EXISTS public.crossfit_wods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wod_name TEXT,
  wod_text TEXT NOT NULL,
  parsed_movements JSONB,
  scaling_levels JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice Command History
CREATE TABLE IF NOT EXISTS public.voice_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  command_type TEXT,
  action_taken TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Intelligence Insights
CREATE TABLE IF NOT EXISTS public.health_intelligence_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  action_items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stryd_user_date ON public.stryd_power_data(user_id, date DESC);
CREATE INDEX idx_hybrid_programs_user ON public.hybrid_athlete_programs(user_id);
CREATE INDEX idx_race_plans_user ON public.race_day_plans(user_id, race_date DESC);
CREATE INDEX idx_sport_programs_user ON public.sport_specific_programs(user_id);
CREATE INDEX idx_wods_user ON public.crossfit_wods(user_id, created_at DESC);
CREATE INDEX idx_voice_commands_user ON public.voice_command_history(user_id, created_at DESC);
CREATE INDEX idx_insights_user ON public.health_intelligence_insights(user_id, priority, created_at DESC);

-- RLS Policies
ALTER TABLE public.stryd_power_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hybrid_athlete_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_specific_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crossfit_wods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_intelligence_insights ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON public.stryd_power_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON public.stryd_power_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own programs" ON public.hybrid_athlete_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own programs" ON public.hybrid_athlete_programs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plans" ON public.race_day_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.race_day_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sport programs" ON public.sport_specific_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sport programs" ON public.sport_specific_programs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wods" ON public.crossfit_wods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wods" ON public.crossfit_wods FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own commands" ON public.voice_command_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own commands" ON public.voice_command_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON public.health_intelligence_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.health_intelligence_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Apply Migration
```bash
npx supabase db push
```

---

## 3. Fix Authentication in Mobile Components (3-4 hours)

### Problem
All mobile components use `userId` instead of JWT token:
```typescript
// ❌ WRONG
fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${userId}` }
})
```

### Solution
Create centralized API client:

**File**: `apps/mobile/src/config/api.ts`
```typescript
import { useAuthStore } from '../store/auth.store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://voicefit.railway.app';

export const getAuthHeaders = () => {
  const { session } = useAuthStore.getState();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
};
```

### Components to Fix (13 total)

1. `apps/mobile/src/components/wearables/WHOOPConnectionCard.tsx`
2. `apps/mobile/src/components/wearables/TerraConnectionCard.tsx`
3. `apps/mobile/src/components/wearables/StrydPowerAnalytics.tsx`
4. `apps/mobile/src/components/nutrition/ManualNutritionEntry.tsx`
5. `apps/mobile/src/components/health-intelligence/CorrelationsCard.tsx`
6. `apps/mobile/src/components/health-intelligence/InjuryRiskCard.tsx`
7. `apps/mobile/src/components/health-intelligence/ReadinessCard.tsx`
8. `apps/mobile/src/components/health-intelligence/InsightsCard.tsx`
9. `apps/mobile/src/components/workout/WODModificationCard.tsx`
10. `apps/mobile/src/components/program/SportTrainingSelector.tsx`
11. `apps/mobile/src/components/program/HybridAthleteSelector.tsx`
12. `apps/mobile/src/components/voice/VoiceCommandCenter.tsx`
13. `apps/mobile/src/components/race/RaceDayPlanner.tsx`

### Example Fix

**Before**:
```typescript
const response = await fetch('/api/wearables/whoop/auth-url', {
  headers: { Authorization: `Bearer ${userId}` }
});
```

**After**:
```typescript
import { apiClient } from '../../config/api';

const data = await apiClient.get('/api/wearables/whoop/auth-url');
```

---

## 4. Add Error Handling to All Components (4-6 hours)

### Standard Pattern

```typescript
import { useState } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../../config/api';

export function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await apiClient.get('/api/endpoint');
      setData(result);

    } catch (err: any) {
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {isLoading && <ActivityIndicator />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {data && <Text>{JSON.stringify(data)}</Text>}
    </View>
  );
}
```

### Apply to All 13 Components

---

## 5. Register External API Accounts (2-3 hours)

### WHOOP Developer Account

1. Go to https://developer.whoop.com
2. Sign up for developer account
3. Create new application
4. Set redirect URI: `voicefit://whoop-callback`
5. Copy `CLIENT_ID` and `CLIENT_SECRET`
6. Configure webhook URL: `https://voicefit.railway.app/api/webhooks/whoop`

### Terra Developer Account

1. Go to https://dashboard.tryterra.co
2. Sign up for account
3. Create new project
4. Copy `DEV_ID` and `API_KEY`
5. Configure webhook URL: `https://voicefit.railway.app/api/webhooks/terra`
6. Enable data types: Activity, Sleep, Nutrition, Body

### Stryd Developer Account

1. Go to https://www.stryd.com/developers
2. Request developer access
3. Create application
4. Set redirect URI: `voicefit://stryd-callback`
5. Copy `CLIENT_ID` and `CLIENT_SECRET`

---

## 6. Update Environment Variables (15 minutes)

### Backend `.env`

```bash
# Add to apps/backend/.env

# WHOOP
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
WHOOP_REDIRECT_URI=voicefit://whoop-callback

# Terra
TERRA_DEV_ID=your_terra_dev_id
TERRA_API_KEY=your_terra_api_key
TERRA_WEBHOOK_SECRET=your_webhook_secret

# Stryd
STRYD_CLIENT_ID=your_stryd_client_id
STRYD_CLIENT_SECRET=your_stryd_client_secret
STRYD_REDIRECT_URI=voicefit://stryd-callback
```

### Mobile `.env`

```bash
# Add to apps/mobile/.env
EXPO_PUBLIC_API_URL=https://voicefit.railway.app
```

### Railway Deployment

```bash
# Set in Railway dashboard or CLI
railway variables set WHOOP_CLIENT_ID=...
railway variables set WHOOP_CLIENT_SECRET=...
railway variables set TERRA_DEV_ID=...
railway variables set TERRA_API_KEY=...
railway variables set STRYD_CLIENT_ID=...
railway variables set STRYD_CLIENT_SECRET=...
```

---

## Summary Checklist

- [ ] Apply database migrations (`npx supabase db push`)
- [ ] Create missing tables migration
- [ ] Create `apps/mobile/src/config/api.ts`
- [ ] Fix authentication in 13 mobile components
- [ ] Add error handling to 13 mobile components
- [ ] Register WHOOP developer account
- [ ] Register Terra developer account
- [ ] Register Stryd developer account
- [ ] Update backend `.env` file
- [ ] Update mobile `.env` file
- [ ] Deploy environment variables to Railway

**Estimated Time**: 14-20 hours
**Result**: All features functional with proper authentication and error handling

---

**Next**: See `COMPREHENSIVE_FEATURE_AUDIT.md` for Phase 2-5 action items


