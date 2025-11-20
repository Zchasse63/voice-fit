-- Wearable Detailed Schema Extension
-- Adds detailed sleep_sessions and activity_sessions tables
-- Extends existing wearables schema with granular data storage

-- ============================================================================
-- 1. Health Metrics Table (Extended time-series data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'recovery_score', 'hrv', 'resting_hr', 'spo2', 'respiratory_rate', 'skin_temp', etc.
  value_numeric DECIMAL(10, 2),
  value_text TEXT,
  source TEXT NOT NULL, -- 'whoop', 'terra', 'apple_health', 'garmin', 'oura'
  source_priority INTEGER DEFAULT 50, -- Higher = more trusted (WHOOP=100, Oura=95, Garmin=80, Apple=60)
  metadata JSONB DEFAULT '{}'::jsonb, -- Device-specific extra data
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, metric_type, source)
);

CREATE INDEX idx_health_metrics_user_date ON public.health_metrics(user_id, date DESC);
CREATE INDEX idx_health_metrics_type ON public.health_metrics(metric_type);
CREATE INDEX idx_health_metrics_source ON public.health_metrics(source);
CREATE INDEX idx_health_metrics_recorded ON public.health_metrics(recorded_at DESC);

-- RLS policies
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health metrics"
  ON public.health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view assigned clients health metrics"
  ON public.health_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_assignments
      WHERE coach_id = auth.uid()
        AND client_id = health_metrics.user_id
        AND revoked_at IS NULL
    )
  );

GRANT SELECT ON public.health_metrics TO authenticated;
GRANT ALL ON public.health_metrics TO service_role;

-- ============================================================================
-- 2. Sleep Sessions Table (Detailed sleep tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_duration_minutes INTEGER,
  
  -- Sleep stages (minutes)
  light_sleep_minutes INTEGER,
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  
  -- Sleep quality metrics
  sleep_score DECIMAL(5, 2), -- 0-100
  sleep_efficiency DECIMAL(5, 2), -- Percentage
  latency_minutes INTEGER, -- Time to fall asleep
  
  -- Physiological metrics during sleep
  avg_heart_rate DECIMAL(6, 2),
  avg_hrv DECIMAL(6, 2),
  avg_respiratory_rate DECIMAL(5, 2),
  avg_spo2 DECIMAL(5, 2),
  temperature_deviation DECIMAL(4, 2),
  
  -- Source tracking
  source TEXT NOT NULL, -- 'whoop', 'oura', 'garmin', 'apple_health', 'terra'
  source_id TEXT, -- External ID from source
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sleep_duration CHECK (total_duration_minutes >= 0),
  CONSTRAINT valid_sleep_times CHECK (end_time > start_time)
);

CREATE INDEX idx_sleep_sessions_user_time ON public.sleep_sessions(user_id, start_time DESC);
CREATE INDEX idx_sleep_sessions_source ON public.sleep_sessions(source);
CREATE INDEX idx_sleep_sessions_date ON public.sleep_sessions(user_id, DATE(start_time) DESC);

-- RLS policies
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep sessions"
  ON public.sleep_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view assigned clients sleep sessions"
  ON public.sleep_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_assignments
      WHERE coach_id = auth.uid()
        AND client_id = sleep_sessions.user_id
        AND revoked_at IS NULL
    )
  );

GRANT SELECT ON public.sleep_sessions TO authenticated;
GRANT ALL ON public.sleep_sessions TO service_role;

-- ============================================================================
-- 3. Activity Sessions Table (Detailed workout/activity tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  
  -- Activity details
  activity_type TEXT, -- 'running', 'cycling', 'strength', 'swimming', etc.
  distance_meters DECIMAL(10, 2),
  calories_burned INTEGER,
  
  -- Heart rate data
  avg_heart_rate DECIMAL(6, 2),
  max_heart_rate DECIMAL(6, 2),
  hr_zone_1_minutes INTEGER, -- Very light
  hr_zone_2_minutes INTEGER, -- Light
  hr_zone_3_minutes INTEGER, -- Moderate
  hr_zone_4_minutes INTEGER, -- Hard
  hr_zone_5_minutes INTEGER, -- Maximum
  
  -- Strain/effort
  strain_score DECIMAL(5, 2), -- WHOOP-style strain (0-21)
  perceived_exertion INTEGER, -- RPE 1-10
  
  -- GPS data
  route_data JSONB, -- Array of {lat, lng, timestamp, elevation}
  
  -- Source tracking
  source TEXT NOT NULL,
  source_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_activity_duration CHECK (duration_minutes >= 0),
  CONSTRAINT valid_activity_times CHECK (end_time > start_time)
);

CREATE INDEX idx_activity_sessions_user_time ON public.activity_sessions(user_id, start_time DESC);
CREATE INDEX idx_activity_sessions_type ON public.activity_sessions(activity_type);
CREATE INDEX idx_activity_sessions_source ON public.activity_sessions(source);
CREATE INDEX idx_activity_sessions_date ON public.activity_sessions(user_id, DATE(start_time) DESC);

-- RLS policies
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity sessions"
  ON public.activity_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view assigned clients activity sessions"
  ON public.activity_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_assignments
      WHERE coach_id = auth.uid()
        AND client_id = activity_sessions.user_id
        AND revoked_at IS NULL
    )
  );

GRANT SELECT ON public.activity_sessions TO authenticated;
GRANT ALL ON public.activity_sessions TO service_role;

-- ============================================================================
-- 4. Daily Summaries Table (Aggregated daily metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Recovery/Readiness
  recovery_score DECIMAL(5, 2), -- WHOOP recovery or Oura readiness (0-100)
  readiness_score DECIMAL(5, 2), -- Oura readiness (0-100)

  -- Activity summary
  steps INTEGER,
  active_minutes INTEGER,
  calories_total INTEGER,
  calories_active INTEGER,
  distance_meters DECIMAL(10, 2),

  -- Heart metrics
  resting_heart_rate DECIMAL(6, 2),
  avg_hrv DECIMAL(6, 2),

  -- Sleep summary (from previous night)
  sleep_score DECIMAL(5, 2),
  sleep_duration_minutes INTEGER,

  -- Strain/Stress
  strain_score DECIMAL(5, 2), -- WHOOP strain (0-21)
  stress_score DECIMAL(5, 2), -- Garmin stress (0-100)

  -- Body metrics
  weight_kg DECIMAL(6, 2),
  body_fat_percentage DECIMAL(5, 2),
  body_temperature DECIMAL(5, 2),

  -- Source tracking (can be composite from multiple sources)
  sources TEXT[], -- Array of sources that contributed
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);
CREATE INDEX idx_daily_summaries_recovery ON public.daily_summaries(recovery_score) WHERE recovery_score IS NOT NULL;

-- RLS policies
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily summaries"
  ON public.daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view assigned clients daily summaries"
  ON public.daily_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_assignments
      WHERE coach_id = auth.uid()
        AND client_id = daily_summaries.user_id
        AND revoked_at IS NULL
    )
  );

GRANT SELECT ON public.daily_summaries TO authenticated;
GRANT ALL ON public.daily_summaries TO service_role;

-- ============================================================================
-- 5. Source Priority Configuration
-- ============================================================================

-- Create a function to get source priority
CREATE OR REPLACE FUNCTION get_source_priority(source_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE source_name
    WHEN 'whoop' THEN 100
    WHEN 'oura' THEN 95
    WHEN 'garmin' THEN 80
    WHEN 'polar' THEN 75
    WHEN 'apple_health' THEN 60
    WHEN 'terra' THEN 55
    WHEN 'fitbit' THEN 50
    WHEN 'manual' THEN 40
    ELSE 30
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to get latest metric value with priority
CREATE OR REPLACE FUNCTION get_latest_metric(
  p_user_id UUID,
  p_metric_type TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(value DECIMAL, source TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hm.value_numeric,
    hm.source
  FROM public.health_metrics hm
  WHERE hm.user_id = p_user_id
    AND hm.metric_type = p_metric_type
    AND hm.date = p_date
  ORDER BY hm.source_priority DESC, hm.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_metric(UUID, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_priority(TEXT) TO authenticated;

