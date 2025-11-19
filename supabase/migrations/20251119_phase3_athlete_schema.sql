-- Add sport-specific fields to user_profiles table

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS primary_sport TEXT DEFAULT 'general_fitness',
ADD COLUMN IF NOT EXISTS sport_level TEXT DEFAULT 'recreational', -- recreational, competitive, elite
ADD COLUMN IF NOT EXISTS season_status TEXT DEFAULT 'off_season'; -- off_season, pre_season, in_season, post_season

COMMENT ON COLUMN user_profiles.primary_sport IS 'Primary sport of the user (e.g., running, basketball, powerlifting)';
COMMENT ON COLUMN user_profiles.sport_level IS 'Competition level of the user';
COMMENT ON COLUMN user_profiles.season_status IS 'Current season status for periodization';
