-- Runs Table for Running Activity Tracking
-- Stores GPS-tracked running sessions with route data, elevation, and workout details
-- Matches WatermelonDB schema version 11

CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time tracking
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Distance and pace
  distance DECIMAL(10, 2) NOT NULL, -- meters
  duration INTEGER NOT NULL, -- seconds
  pace DECIMAL(6, 2) NOT NULL, -- minutes per mile
  avg_speed DECIMAL(6, 2) NOT NULL, -- mph
  calories INTEGER NOT NULL,
  
  -- Elevation data (optional)
  elevation_gain DECIMAL(10, 2), -- meters
  elevation_loss DECIMAL(10, 2), -- meters
  grade_adjusted_pace DECIMAL(6, 2), -- GAP in minutes per mile
  grade_percent DECIMAL(5, 2), -- average grade percentage
  terrain_difficulty VARCHAR(50), -- 'flat', 'rolling', 'moderate_uphill', 'steep_uphill', etc.
  
  -- Route data
  route JSONB NOT NULL, -- Array of {lat, lng, timestamp, elevation, speed}
  
  -- Workout classification (optional)
  workout_type VARCHAR(50), -- 'free_run', 'custom_workout', 'scheduled_workout'
  workout_name VARCHAR(255), -- name of the workout if applicable
  
  -- Sync tracking
  synced BOOLEAN DEFAULT TRUE, -- Always true for cloud records
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_run_duration CHECK (duration > 0),
  CONSTRAINT valid_run_distance CHECK (distance > 0),
  CONSTRAINT valid_run_times CHECK (end_time > start_time)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON public.runs(user_id);

-- Index for date-based queries (e.g., "runs this week")
CREATE INDEX IF NOT EXISTS idx_runs_start_time ON public.runs(start_time DESC);

-- Composite index for user + date queries (optimal for analytics)
CREATE INDEX IF NOT EXISTS idx_runs_user_start_time ON public.runs(user_id, start_time DESC);

-- Index for workout type filtering
CREATE INDEX IF NOT EXISTS idx_runs_workout_type ON public.runs(workout_type) WHERE workout_type IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own runs
CREATE POLICY "Users can view own runs"
ON public.runs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own runs
CREATE POLICY "Users can insert own runs"
ON public.runs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own runs
CREATE POLICY "Users can update own runs"
ON public.runs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own runs
CREATE POLICY "Users can delete own runs"
ON public.runs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER runs_updated_at_trigger
BEFORE UPDATE ON public.runs
FOR EACH ROW
EXECUTE FUNCTION update_runs_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.runs IS 'GPS-tracked running sessions with route data and elevation metrics';
COMMENT ON COLUMN public.runs.route IS 'JSONB array of GPS coordinates with timestamps: [{lat, lng, timestamp, elevation, speed}]';
COMMENT ON COLUMN public.runs.grade_adjusted_pace IS 'Grade-adjusted pace (GAP) accounting for elevation changes';
COMMENT ON COLUMN public.runs.terrain_difficulty IS 'Categorization of terrain: flat, rolling, moderate_uphill, steep_uphill, etc.';
COMMENT ON COLUMN public.runs.workout_type IS 'Type of run: free_run (unstructured), custom_workout (user-created), scheduled_workout (from program)';

