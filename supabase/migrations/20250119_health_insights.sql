-- Health Insights Table
-- Stores AI-generated health insights and trend analysis

CREATE TABLE IF NOT EXISTS public.health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insights_json JSONB NOT NULL, -- Full analysis from HealthIntelligenceService
  overall_health_score DECIMAL(5, 2) CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON public.health_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insights_created ON public.health_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_insights_score ON public.health_insights(overall_health_score);

-- RLS policies
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health insights"
  ON public.health_insights FOR SELECT
  USING (auth.uid()::text = user_id);

GRANT SELECT ON public.health_insights TO authenticated;
GRANT INSERT ON public.health_insights TO service_role;

