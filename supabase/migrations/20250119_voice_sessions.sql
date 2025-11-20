-- Voice Session Management

CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Session type
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('workout_logging', 'program_generation', 'question', 'general')),
  
  -- Session state
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'error')),
  current_step VARCHAR(100), -- e.g., "collecting_exercises", "confirming_reps", "finalizing"
  context_data JSONB DEFAULT '{}'::jsonb, -- Session-specific context (exercises collected, etc.)
  
  -- Conversation history
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  
  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Session timeout (30 minutes of inactivity)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_expires ON public.voice_sessions(expires_at);

-- RLS policies
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions"
  ON public.voice_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own voice sessions"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own voice sessions"
  ON public.voice_sessions FOR UPDATE
  USING (auth.uid()::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.voice_sessions TO authenticated;
GRANT ALL ON public.voice_sessions TO service_role;

-- ============================================================================
-- Function to clean up expired sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_voice_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.voice_sessions
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run every hour via cron or external scheduler)
-- Note: Supabase doesn't support pg_cron by default, so this would need to be
-- triggered externally or via a scheduled function

