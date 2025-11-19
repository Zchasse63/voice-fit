-- Create warmup_templates table
CREATE TABLE IF NOT EXISTS public.warmup_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    workout_type TEXT NOT NULL, -- e.g., 'upper_body', 'lower_body', 'full_body', 'cardio'
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cooldown_templates table
CREATE TABLE IF NOT EXISTS public.cooldown_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    workout_type TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nutrition_logs table
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    items JSONB DEFAULT '[]'::jsonb,
    total_calories INTEGER DEFAULT 0,
    protein_g INTEGER DEFAULT 0,
    carbs_g INTEGER DEFAULT 0,
    fats_g INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.warmup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooldown_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Policies for warmup_templates (Public Read)
CREATE POLICY "Allow public read access for warmup_templates"
ON public.warmup_templates FOR SELECT
USING (true);

-- Policies for cooldown_templates (Public Read)
CREATE POLICY "Allow public read access for cooldown_templates"
ON public.cooldown_templates FOR SELECT
USING (true);

-- Policies for nutrition_logs (User specific)
CREATE POLICY "Users can view their own nutrition logs"
ON public.nutrition_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
ON public.nutrition_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
ON public.nutrition_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
ON public.nutrition_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warmup_templates_workout_type ON public.warmup_templates(workout_type);
CREATE INDEX IF NOT EXISTS idx_cooldown_templates_workout_type ON public.cooldown_templates(workout_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, log_date);

-- Insert some default warmups
INSERT INTO public.warmup_templates (name, workout_type, exercises, duration_minutes) VALUES
('General Upper Body Warmup', 'upper_body', '[
    {"name": "Arm Circles", "duration": "30s", "notes": "Forward and backward"},
    {"name": "Band Pull-Aparts", "reps": 15, "notes": "Squeeze shoulder blades"},
    {"name": "Push-ups", "reps": 10, "notes": "Explosive"},
    {"name": "Thoracic Rotations", "reps": 10, "notes": "Each side"}
]'::jsonb, 5),
('General Lower Body Warmup', 'lower_body', '[
    {"name": "Leg Swings", "reps": 15, "notes": "Front/back and side/side"},
    {"name": "Bodyweight Squats", "reps": 15, "notes": "Deep range of motion"},
    {"name": "Glute Bridges", "reps": 15, "notes": "Squeeze at top"},
    {"name": "Walking Lunges", "reps": 10, "notes": "Each leg"}
]'::jsonb, 5),
('Full Body Activation', 'full_body', '[
    {"name": "Jumping Jacks", "duration": "60s", "notes": "Get heart rate up"},
    {"name": "Inchworms", "reps": 5, "notes": "Walk out to plank"},
    {"name": "World''s Greatest Stretch", "reps": 5, "notes": "Each side"},
    {"name": "Squat Jumps", "reps": 10, "notes": "Soft landing"}
]'::jsonb, 6);

-- Insert some default cooldowns
INSERT INTO public.cooldown_templates (name, workout_type, exercises, duration_minutes) VALUES
('Upper Body Stretch', 'upper_body', '[
    {"name": "Doorway Pec Stretch", "duration": "30s", "notes": "Each side"},
    {"name": "Triceps Overhead Stretch", "duration": "30s", "notes": "Each side"},
    {"name": "Child''s Pose", "duration": "60s", "notes": "Relax into it"}
]'::jsonb, 5),
('Lower Body Stretch', 'lower_body', '[
    {"name": "Standing Quad Stretch", "duration": "30s", "notes": "Each leg"},
    {"name": "Hamstring Stretch", "duration": "30s", "notes": "Seated or standing"},
    {"name": "Pigeon Pose", "duration": "45s", "notes": "Each side"}
]'::jsonb, 5);
