-- User Preferences Table
-- Stores structured user preferences for advanced personalization

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Workout preferences
  preferred_workout_duration_min INTEGER DEFAULT 60,
  preferred_workout_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Mon, 7=Sun
  preferred_workout_time VARCHAR(20) DEFAULT 'morning' CHECK (preferred_workout_time IN ('morning', 'afternoon', 'evening', 'flexible')),
  max_workouts_per_week INTEGER DEFAULT 4,
  
  -- Equipment preferences
  available_equipment TEXT[] DEFAULT ARRAY['barbell', 'dumbbells', 'bench'],
  preferred_equipment TEXT[] DEFAULT ARRAY['barbell'],
  
  -- Exercise preferences
  favorite_exercises TEXT[] DEFAULT ARRAY[]::TEXT[],
  disliked_exercises TEXT[] DEFAULT ARRAY[]::TEXT[],
  exercise_restrictions JSONB DEFAULT '{}'::jsonb, -- {"squat": "knee_pain", "overhead_press": "shoulder_mobility"}
  
  -- Training style preferences
  preferred_rep_ranges JSONB DEFAULT '{"strength": [3,5], "hypertrophy": [8,12], "endurance": [15,20]}'::jsonb,
  preferred_rest_periods JSONB DEFAULT '{"compound": 180, "isolation": 90}'::jsonb, -- seconds
  prefers_supersets BOOLEAN DEFAULT FALSE,
  prefers_dropsets BOOLEAN DEFAULT FALSE,
  
  -- Recovery preferences
  preferred_deload_frequency INTEGER DEFAULT 4, -- Every N weeks
  preferred_rest_days_per_week INTEGER DEFAULT 3,
  
  -- Nutrition preferences
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[], -- vegetarian, vegan, gluten_free, etc.
  calorie_target INTEGER,
  protein_target_g INTEGER,
  
  -- Communication preferences
  coaching_style VARCHAR(50) DEFAULT 'balanced' CHECK (coaching_style IN ('motivational', 'technical', 'balanced', 'concise')),
  feedback_frequency VARCHAR(50) DEFAULT 'moderate' CHECK (feedback_frequency IN ('minimal', 'moderate', 'frequent')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid()::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- ============================================================================
-- Conversational Preference Updates Table
-- Tracks preference changes made through conversation
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversational_preference_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preference_key VARCHAR(100) NOT NULL, -- e.g., "preferred_workout_duration_min"
  old_value JSONB,
  new_value JSONB NOT NULL,
  update_source VARCHAR(50) DEFAULT 'chat' CHECK (update_source IN ('chat', 'voice', 'ui', 'system')),
  conversation_context TEXT, -- The user's message that triggered the update
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  applied BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conv_pref_updates_user_id ON public.conversational_preference_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_pref_updates_created ON public.conversational_preference_updates(created_at DESC);

-- RLS policies
ALTER TABLE public.conversational_preference_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preference updates"
  ON public.conversational_preference_updates FOR SELECT
  USING (auth.uid()::text = user_id);

GRANT SELECT ON public.conversational_preference_updates TO authenticated;
GRANT INSERT ON public.conversational_preference_updates TO service_role;

