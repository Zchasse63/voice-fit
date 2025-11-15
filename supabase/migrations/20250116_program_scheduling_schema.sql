-- ============================================================================
-- Migration: Program Scheduling & Calendar Schema
-- Date: 2025-01-16
-- Description: Add schema for Runna-inspired program scheduling and calendar
--
-- NEW FEATURES:
-- 1. Workout templates (reusable workout definitions)
-- 2. Scheduled workouts (workout instances on specific dates)
-- 3. Color coding and categorization
-- 4. Drag-and-drop ordering support
-- ============================================================================

-- ============================================================================
-- PART 1: ENHANCE EXISTING TABLES
-- ============================================================================

-- Add scheduling-related columns to generated_programs if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='generated_programs' AND column_name='start_date') THEN
        ALTER TABLE public.generated_programs
        ADD COLUMN start_date DATE,
        ADD COLUMN end_date DATE,
        ADD COLUMN current_week INTEGER DEFAULT 1,
        ADD COLUMN total_weeks INTEGER,
        ADD COLUMN color VARCHAR(7) DEFAULT '#4A9B6F',
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================================================
-- PART 2: WORKOUT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.generated_programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workout_type VARCHAR(50), -- 'strength', 'cardio', 'hiit', 'recovery', 'custom'
    color VARCHAR(7) DEFAULT '#4A9B6F', -- Hex color for visual coding
    estimated_duration INTEGER, -- minutes
    difficulty VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    exercises JSONB DEFAULT '[]'::jsonb, -- Array of exercise definitions
    notes TEXT,
    is_template BOOLEAN DEFAULT true, -- true for reusable templates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workout_templates
CREATE INDEX IF NOT EXISTS idx_workout_templates_program_id ON public.workout_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_workout_type ON public.workout_templates(workout_type);

-- ============================================================================
-- PART 3: SCHEDULED WORKOUTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.generated_programs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    scheduled_date DATE NOT NULL,
    week_number INTEGER, -- Which week of the program
    day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    position INTEGER DEFAULT 0, -- For ordering multiple workouts on same day
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'skipped', 'rescheduled'
    completed_workout_log_id UUID, -- Reference to actual workout_logs when completed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scheduled_workouts
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_program_id ON public.scheduled_workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON public.scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON public.scheduled_workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_status ON public.scheduled_workouts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_week ON public.scheduled_workouts(program_id, week_number);

-- Composite index for calendar queries
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_calendar
    ON public.scheduled_workouts(user_id, scheduled_date, position);

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_templates
CREATE POLICY "Users can view templates from their programs"
ON public.workout_templates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.generated_programs
        WHERE generated_programs.id = workout_templates.program_id
        AND generated_programs.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert templates for their programs"
ON public.workout_templates FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.generated_programs
        WHERE generated_programs.id = workout_templates.program_id
        AND generated_programs.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own templates"
ON public.workout_templates FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.generated_programs
        WHERE generated_programs.id = workout_templates.program_id
        AND generated_programs.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own templates"
ON public.workout_templates FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.generated_programs
        WHERE generated_programs.id = workout_templates.program_id
        AND generated_programs.user_id = auth.uid()
    )
);

-- RLS Policies for scheduled_workouts
CREATE POLICY "Users can view their own scheduled workouts"
ON public.scheduled_workouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled workouts"
ON public.scheduled_workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled workouts"
ON public.scheduled_workouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled workouts"
ON public.scheduled_workouts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 5: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_workout_templates_updated_at ON public.workout_templates;
CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_workouts_updated_at ON public.scheduled_workouts;
CREATE TRIGGER update_scheduled_workouts_updated_at
    BEFORE UPDATE ON public.scheduled_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set week_number and day_of_week
CREATE OR REPLACE FUNCTION set_scheduled_workout_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Set day_of_week (0-6, Sunday-Saturday)
    NEW.day_of_week = EXTRACT(DOW FROM NEW.scheduled_date);

    -- Calculate week_number based on program start_date
    IF NEW.program_id IS NOT NULL THEN
        SELECT
            CASE
                WHEN start_date IS NOT NULL THEN
                    CEIL((NEW.scheduled_date - start_date + 1) / 7.0)
                ELSE
                    NULL
            END
        INTO NEW.week_number
        FROM public.generated_programs
        WHERE id = NEW.program_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate metadata
DROP TRIGGER IF EXISTS set_scheduled_workout_metadata_trigger ON public.scheduled_workouts;
CREATE TRIGGER set_scheduled_workout_metadata_trigger
    BEFORE INSERT OR UPDATE OF scheduled_date, program_id ON public.scheduled_workouts
    FOR EACH ROW
    EXECUTE FUNCTION set_scheduled_workout_metadata();

-- ============================================================================
-- PART 6: HELPER VIEWS
-- ============================================================================

-- View for calendar display with workout details
CREATE OR REPLACE VIEW public.calendar_workouts AS
SELECT
    sw.id,
    sw.program_id,
    sw.user_id,
    sw.scheduled_date,
    sw.week_number,
    sw.day_of_week,
    sw.position,
    sw.status,
    sw.notes,
    wt.name AS workout_name,
    wt.description AS workout_description,
    wt.workout_type,
    wt.color,
    wt.estimated_duration,
    wt.difficulty,
    wt.exercises,
    gp.name AS program_name,
    gp.color AS program_color
FROM public.scheduled_workouts sw
LEFT JOIN public.workout_templates wt ON sw.template_id = wt.id
LEFT JOIN public.generated_programs gp ON sw.program_id = gp.id;

-- Grant access to the view
GRANT SELECT ON public.calendar_workouts TO authenticated;

-- ============================================================================
-- PART 7: SEED DATA (OPTIONAL WORKOUT TYPES)
-- ============================================================================

-- Create a reference table for workout type colors (optional)
CREATE TABLE IF NOT EXISTS public.workout_type_colors (
    workout_type VARCHAR(50) PRIMARY KEY,
    color VARCHAR(7) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Insert default workout type colors
INSERT INTO public.workout_type_colors (workout_type, color, display_name, description) VALUES
    ('strength', '#4A9B6F', 'Strength Training', 'Resistance and weight training'),
    ('cardio', '#E74C3C', 'Cardio', 'Cardiovascular endurance training'),
    ('hiit', '#F39C12', 'HIIT', 'High-intensity interval training'),
    ('recovery', '#3498DB', 'Recovery', 'Active recovery and mobility'),
    ('flexibility', '#9B59B6', 'Flexibility', 'Stretching and yoga'),
    ('custom', '#95A5A6', 'Custom', 'Custom workout type')
ON CONFLICT (workout_type) DO NOTHING;

-- Make workout type colors readable by all authenticated users
ALTER TABLE public.workout_type_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workout type colors"
ON public.workout_type_colors FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify:
-- SELECT * FROM public.workout_templates LIMIT 5;
-- SELECT * FROM public.scheduled_workouts LIMIT 5;
-- SELECT * FROM public.calendar_workouts LIMIT 10;
-- SELECT * FROM public.workout_type_colors;
