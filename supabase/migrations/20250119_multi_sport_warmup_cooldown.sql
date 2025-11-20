-- Multi-Sport Support & Warmup/Cooldown Template System

-- ============================================================================
-- 1. Sport Types Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sport_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('strength', 'endurance', 'hybrid', 'skill', 'recovery')),
  typical_duration_min INTEGER DEFAULT 60,
  intensity_profile VARCHAR(50) DEFAULT 'moderate' CHECK (intensity_profile IN ('low', 'moderate', 'high', 'variable')),
  equipment_required TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common sports
INSERT INTO public.sport_types (sport_name, category, typical_duration_min, intensity_profile, equipment_required)
VALUES
  ('strength_training', 'strength', 60, 'high', ARRAY['barbell', 'dumbbells', 'bench']),
  ('running', 'endurance', 45, 'moderate', ARRAY[]::TEXT[]),
  ('cycling', 'endurance', 60, 'moderate', ARRAY['bike']),
  ('swimming', 'endurance', 45, 'moderate', ARRAY['pool']),
  ('crossfit', 'hybrid', 60, 'high', ARRAY['barbell', 'dumbbells', 'box', 'rower']),
  ('yoga', 'recovery', 60, 'low', ARRAY['mat']),
  ('pilates', 'recovery', 45, 'low', ARRAY['mat']),
  ('rock_climbing', 'skill', 90, 'variable', ARRAY['climbing_wall']),
  ('martial_arts', 'skill', 60, 'high', ARRAY[]::TEXT[]),
  ('rowing', 'endurance', 45, 'high', ARRAY['rower'])
ON CONFLICT (sport_name) DO NOTHING;

-- ============================================================================
-- 2. Warmup/Cooldown Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.warmup_cooldown_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('warmup', 'cooldown')),
  sport_type VARCHAR(100), -- NULL = universal template
  workout_focus VARCHAR(100), -- e.g., "upper_body", "lower_body", "full_body", "cardio"
  
  -- Template content
  phases JSONB NOT NULL, -- Array of phases with exercises/movements
  total_duration_min INTEGER DEFAULT 10,
  
  -- Personalization triggers
  injury_adaptations JSONB DEFAULT '{}'::jsonb, -- {"knee": ["skip_jumping", "add_knee_circles"], ...}
  mobility_requirements TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["hip_mobility", "shoulder_mobility"]
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warmup_cooldown_sport ON public.warmup_cooldown_templates(sport_type);
CREATE INDEX IF NOT EXISTS idx_warmup_cooldown_type ON public.warmup_cooldown_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_warmup_cooldown_focus ON public.warmup_cooldown_templates(workout_focus);

-- RLS policies
ALTER TABLE public.warmup_cooldown_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view warmup/cooldown templates"
  ON public.warmup_cooldown_templates FOR SELECT
  USING (TRUE);

GRANT SELECT ON public.warmup_cooldown_templates TO authenticated;
GRANT ALL ON public.warmup_cooldown_templates TO service_role;

-- ============================================================================
-- 3. User Sport Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sport_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sport_name VARCHAR(100) NOT NULL,
  
  -- Proficiency
  skill_level VARCHAR(50) DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  years_experience DECIMAL(4, 1) DEFAULT 0,
  
  -- Training frequency
  sessions_per_week INTEGER DEFAULT 3,
  avg_session_duration_min INTEGER DEFAULT 60,
  
  -- Goals for this sport
  sport_goals TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["improve_endurance", "build_strength", "compete"]
  
  -- Equipment access
  available_equipment TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Preferences
  preferred_training_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  preferred_time_of_day VARCHAR(20) DEFAULT 'flexible',
  
  -- Metadata
  is_primary_sport BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, sport_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_user_id ON public.user_sport_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_sport ON public.user_sport_profiles(sport_name);
CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_primary ON public.user_sport_profiles(is_primary_sport);

-- RLS policies
ALTER TABLE public.user_sport_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sport profiles"
  ON public.user_sport_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sport profiles"
  ON public.user_sport_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sport profiles"
  ON public.user_sport_profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_sport_profiles TO authenticated;
GRANT ALL ON public.user_sport_profiles TO service_role;

-- ============================================================================
-- 4. Seed Default Warmup/Cooldown Templates
-- ============================================================================

-- Universal warmup template
INSERT INTO public.warmup_cooldown_templates (
  template_name,
  template_type,
  sport_type,
  workout_focus,
  phases,
  total_duration_min,
  is_default
)
VALUES (
  'Universal Dynamic Warmup',
  'warmup',
  NULL,
  'full_body',
  '[
    {
      "phase_name": "General Activation",
      "duration_min": 3,
      "movements": [
        {"name": "Light cardio", "duration_sec": 180, "notes": "Jog, bike, or row"}
      ]
    },
    {
      "phase_name": "Dynamic Stretching",
      "duration_min": 5,
      "movements": [
        {"name": "Leg swings", "reps": 10, "sets": 2},
        {"name": "Arm circles", "reps": 10, "sets": 2},
        {"name": "Hip circles", "reps": 10, "sets": 2},
        {"name": "Torso twists", "reps": 10, "sets": 2}
      ]
    },
    {
      "phase_name": "Movement Prep",
      "duration_min": 2,
      "movements": [
        {"name": "Bodyweight squats", "reps": 10},
        {"name": "Push-ups", "reps": 5},
        {"name": "Lunges", "reps": 10}
      ]
    }
  ]'::jsonb,
  10,
  TRUE
)
ON CONFLICT DO NOTHING;

-- Universal cooldown template
INSERT INTO public.warmup_cooldown_templates (
  template_name,
  template_type,
  sport_type,
  workout_focus,
  phases,
  total_duration_min,
  is_default
)
VALUES (
  'Universal Static Cooldown',
  'cooldown',
  NULL,
  'full_body',
  '[
    {
      "phase_name": "Active Recovery",
      "duration_min": 3,
      "movements": [
        {"name": "Light walk or easy movement", "duration_sec": 180}
      ]
    },
    {
      "phase_name": "Static Stretching",
      "duration_min": 7,
      "movements": [
        {"name": "Hamstring stretch", "duration_sec": 30, "sets": 2},
        {"name": "Quad stretch", "duration_sec": 30, "sets": 2},
        {"name": "Chest stretch", "duration_sec": 30, "sets": 2},
        {"name": "Shoulder stretch", "duration_sec": 30, "sets": 2},
        {"name": "Hip flexor stretch", "duration_sec": 30, "sets": 2}
      ]
    }
  ]'::jsonb,
  10,
  TRUE
)
ON CONFLICT DO NOTHING;

