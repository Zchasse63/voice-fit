-- Wearables & Nutrition Ingestion Layer Migration
-- Supports Terra, WHOOP, Garmin, Apple Health, Oura integrations

-- ============================================================================
-- 1. Wearable Raw Events Table (audit log of all incoming data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wearable_raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('terra', 'whoop', 'garmin', 'apple_health', 'google_fit', 'oura')),
  event_type VARCHAR(100) NOT NULL, -- sleep, activity, workout, body, nutrition, etc.
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'duplicate')),
  error_message TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_wearable_raw_events_user_id ON public.wearable_raw_events(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_raw_events_provider ON public.wearable_raw_events(provider);
CREATE INDEX IF NOT EXISTS idx_wearable_raw_events_received ON public.wearable_raw_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_raw_events_status ON public.wearable_raw_events(processing_status);

-- RLS policies
ALTER TABLE public.wearable_raw_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wearable events"
  ON public.wearable_raw_events FOR SELECT
  USING (auth.uid()::text = user_id);

-- Service role can insert (backend ingestion)
GRANT SELECT ON public.wearable_raw_events TO authenticated;
GRANT INSERT, UPDATE ON public.wearable_raw_events TO service_role;

-- ============================================================================
-- 2. Daily Metrics Table (normalized, deduplicated metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- sleep_duration, hrv, resting_hr, strain, recovery, steps, etc.
  source VARCHAR(50) NOT NULL CHECK (source IN ('whoop', 'garmin', 'apple_health', 'google_fit', 'oura', 'terra')),
  value_numeric DECIMAL(10, 2), -- For simple numeric values
  value_json JSONB, -- For complex/structured values
  quality_score DECIMAL(3, 2), -- 0.00 to 1.00, indicates data quality/confidence
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, metric_type, source) -- One metric per user/date/type/source
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_type ON public.daily_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_source ON public.daily_metrics(source);

-- RLS policies
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily metrics"
  ON public.daily_metrics FOR SELECT
  USING (auth.uid()::text = user_id);

GRANT SELECT ON public.daily_metrics TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.daily_metrics TO service_role;

-- ============================================================================
-- 3. Daily Nutrition Summary Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('whoop', 'garmin', 'apple_health', 'google_fit', 'myfitnesspal', 'manual')),
  calories DECIMAL(7, 2),
  protein_g DECIMAL(6, 2),
  carbs_g DECIMAL(6, 2),
  fat_g DECIMAL(6, 2),
  fiber_g DECIMAL(6, 2),
  sugar_g DECIMAL(6, 2),
  sodium_mg DECIMAL(7, 2),
  water_ml DECIMAL(7, 2),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional macros, meal timing, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, source) -- One summary per user/date/source
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON public.daily_nutrition_summary(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_source ON public.daily_nutrition_summary(source);

-- RLS policies
ALTER TABLE public.daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nutrition summaries"
  ON public.daily_nutrition_summary FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own nutrition summaries"
  ON public.daily_nutrition_summary FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own nutrition summaries"
  ON public.daily_nutrition_summary FOR UPDATE
  USING (auth.uid()::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.daily_nutrition_summary TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.daily_nutrition_summary TO service_role;

-- ============================================================================
-- 4. Wearable Provider Connections Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wearable_provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('terra', 'whoop', 'garmin', 'apple_health', 'google_fit', 'oura')),
  is_active BOOLEAN DEFAULT TRUE,
  access_token_encrypted TEXT, -- Encrypted OAuth token
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_user_id TEXT, -- Provider's internal user ID
  scopes TEXT[], -- Granted permissions
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'revoked', 'expired')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider) -- One connection per user/provider
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wearable_connections_user ON public.wearable_provider_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_active ON public.wearable_provider_connections(is_active, sync_status);

-- RLS policies
ALTER TABLE public.wearable_provider_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own provider connections"
  ON public.wearable_provider_connections FOR SELECT
  USING (auth.uid()::text = user_id);

GRANT SELECT ON public.wearable_provider_connections TO authenticated;
GRANT ALL ON public.wearable_provider_connections TO service_role;

