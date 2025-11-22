-- Messages Table for Chat History
-- Stores user-AI chat messages for persistence and cloud sync
-- Matches WatermelonDB schema version 11

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('workout_log', 'question', 'general', 'onboarding', 'adherence_alert')),
  data JSONB DEFAULT NULL, -- Additional message data (e.g., workout details, context)
  synced BOOLEAN DEFAULT TRUE, -- Always true for cloud records
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON public.messages(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own messages
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Comments
COMMENT ON TABLE public.messages IS 'Chat messages between users and AI coach';
COMMENT ON COLUMN public.messages.sender IS 'Message sender: user or ai';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message for classification and routing';
COMMENT ON COLUMN public.messages.data IS 'Additional structured data (workout details, context, etc.)';
COMMENT ON COLUMN public.messages.synced IS 'Sync status flag (always true for cloud records)';

