-- Advanced Calendar Features Migration
-- Adds support for rescheduling, conflict detection, availability windows, and AI schedule suggestions

-- ============================================================================
-- 1. Extend scheduled_workouts for rescheduling tracking
-- ============================================================================

ALTER TABLE public.scheduled_workouts 
ADD COLUMN IF NOT EXISTS rescheduled_from DATE,
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS conflict_acknowledged BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.scheduled_workouts.rescheduled_from IS 'Original scheduled date before rescheduling';
COMMENT ON COLUMN public.scheduled_workouts.reschedule_reason IS 'Optional user-provided reason for rescheduling';
COMMENT ON COLUMN public.scheduled_workouts.conflict_acknowledged IS 'User acknowledged scheduling conflict';

-- ============================================================================
-- 2. Availability Windows Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  availability_type VARCHAR(50) NOT NULL CHECK (availability_type IN ('travel', 'vacation', 'injury', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_availability_windows_user_id ON public.availability_windows(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_windows_dates ON public.availability_windows(user_id, start_date, end_date);

-- RLS policies
ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own availability windows"
  ON public.availability_windows FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own availability windows"
  ON public.availability_windows FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own availability windows"
  ON public.availability_windows FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own availability windows"
  ON public.availability_windows FOR DELETE
  USING (auth.uid()::text = user_id);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_windows TO authenticated;

-- ============================================================================
-- 3. Schedule Adjustment Suggestions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_adjustment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suggestion_type VARCHAR(100) NOT NULL CHECK (suggestion_type IN ('reschedule', 'deload', 'swap', 'skip', 'compress', 'extend')),
  affected_workout_ids UUID[] NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  metadata JSONB DEFAULT '{}'::jsonb, -- Store additional context (e.g., suggested new dates)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_user_id ON public.schedule_adjustment_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_status ON public.schedule_adjustment_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_created ON public.schedule_adjustment_suggestions(created_at);

-- RLS policies
ALTER TABLE public.schedule_adjustment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedule suggestions"
  ON public.schedule_adjustment_suggestions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own schedule suggestions"
  ON public.schedule_adjustment_suggestions FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Grant access
GRANT SELECT, UPDATE ON public.schedule_adjustment_suggestions TO authenticated;

-- Service role can insert suggestions (backend-generated)
GRANT INSERT ON public.schedule_adjustment_suggestions TO service_role;

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION public.check_schedule_conflicts(
  p_user_id UUID,
  p_date DATE,
  p_exclude_workout_id UUID DEFAULT NULL
)
RETURNS TABLE (
  workout_id UUID,
  workout_name TEXT,
  estimated_duration INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    wt.name,
    wt.estimated_duration,
    sw.status
  FROM public.scheduled_workouts sw
  LEFT JOIN public.workout_templates wt ON sw.template_id = wt.id
  WHERE sw.user_id = p_user_id
    AND sw.scheduled_date = p_date
    AND sw.status IN ('scheduled', 'rescheduled')
    AND (p_exclude_workout_id IS NULL OR sw.id != p_exclude_workout_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get availability windows for a date range
CREATE OR REPLACE FUNCTION public.get_availability_windows(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  start_date DATE,
  end_date DATE,
  availability_type VARCHAR(50),
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aw.id,
    aw.start_date,
    aw.end_date,
    aw.availability_type,
    aw.notes
  FROM public.availability_windows aw
  WHERE aw.user_id = p_user_id
    AND aw.end_date >= p_start_date
    AND aw.start_date <= p_end_date
  ORDER BY aw.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_schedule_conflicts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_availability_windows TO authenticated;

