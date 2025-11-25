-- ============================================================================
-- Migration: Running Shoes Tracking Schema
-- Date: 2025-01-24
-- Description: Add schema for running shoe tracking and analytics
-- ============================================================================

-- ============================================================================
-- CREATE RUNNING_SHOES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.running_shoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Shoe details
  brand VARCHAR(100) NOT NULL, -- e.g., "Nike", "Hoka", "Brooks"
  model VARCHAR(100) NOT NULL, -- e.g., "Pegasus 40", "Clifton 9"
  purchase_date DATE NOT NULL,
  
  -- Mileage tracking
  total_mileage DECIMAL(10, 2) DEFAULT 0, -- miles
  replacement_threshold DECIMAL(10, 2) DEFAULT 400, -- miles (typical shoe lifespan)
  
  -- Status
  is_active BOOLEAN DEFAULT true, -- retired shoes marked inactive
  retired_date DATE, -- when shoe was retired
  
  -- User notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD SHOE_ID TO RUNS TABLE
-- ============================================================================

ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS shoe_id UUID REFERENCES public.running_shoes(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_running_shoes_user_id ON public.running_shoes(user_id);
CREATE INDEX IF NOT EXISTS idx_running_shoes_is_active ON public.running_shoes(is_active);
CREATE INDEX IF NOT EXISTS idx_runs_shoe_id ON public.runs(shoe_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.running_shoes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own shoes
CREATE POLICY "Users can view own shoes"
ON public.running_shoes FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own shoes
CREATE POLICY "Users can insert own shoes"
ON public.running_shoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shoes
CREATE POLICY "Users can update own shoes"
ON public.running_shoes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shoes
CREATE POLICY "Users can delete own shoes"
ON public.running_shoes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.running_shoes IS 'Running shoe inventory with mileage tracking';
COMMENT ON COLUMN public.running_shoes.total_mileage IS 'Cumulative mileage on this shoe';
COMMENT ON COLUMN public.running_shoes.replacement_threshold IS 'Recommended replacement mileage (typically 300-500 miles)';
COMMENT ON COLUMN public.running_shoes.is_active IS 'Whether shoe is currently in use';

