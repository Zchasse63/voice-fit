-- Migration: Coach-Client Invitation System
-- Description: Add invitation-based access model for coach-client relationships
-- Date: 2025-01-19

-- ============================================================================
-- 1. Create coach_client_invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS coach_client_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_coach_client_invitations_coach_id ON coach_client_invitations(coach_id);
CREATE INDEX idx_coach_client_invitations_client_email ON coach_client_invitations(client_email);
CREATE INDEX idx_coach_client_invitations_client_id ON coach_client_invitations(client_id);
CREATE INDEX idx_coach_client_invitations_status ON coach_client_invitations(status);

-- ============================================================================
-- 2. Update client_assignments table
-- ============================================================================

-- Add revocation tracking columns
ALTER TABLE client_assignments
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

-- Add invitation reference
ALTER TABLE client_assignments
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES coach_client_invitations(id);

-- Index for revoked assignments
CREATE INDEX idx_client_assignments_revoked_at ON client_assignments(revoked_at);

-- ============================================================================
-- 3. Update user_profiles table
-- ============================================================================

-- Add user_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN user_type TEXT NOT NULL DEFAULT 'free' CHECK (user_type IN ('free', 'premium', 'coach'));
    END IF;
END $$;

-- Index for user_type
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on coach_client_invitations
ALTER TABLE coach_client_invitations ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own invitations
CREATE POLICY "Coaches can view their own invitations"
ON coach_client_invitations
FOR SELECT
USING (auth.uid() = coach_id);

-- Coaches can create invitations
CREATE POLICY "Coaches can create invitations"
ON coach_client_invitations
FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own invitations
CREATE POLICY "Coaches can update their own invitations"
ON coach_client_invitations
FOR UPDATE
USING (auth.uid() = coach_id);

-- Clients can view invitations sent to them
CREATE POLICY "Clients can view invitations sent to them"
ON coach_client_invitations
FOR SELECT
USING (
    auth.uid() = client_id 
    OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) = client_email
);

-- Clients can update invitations sent to them (accept/decline)
CREATE POLICY "Clients can update invitations sent to them"
ON coach_client_invitations
FOR UPDATE
USING (
    auth.uid() = client_id 
    OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) = client_email
);

-- Update client_assignments RLS policies
-- Coaches can only access non-revoked assignments
DROP POLICY IF EXISTS "Coaches can view their clients" ON client_assignments;
CREATE POLICY "Coaches can view their active clients"
ON client_assignments
FOR SELECT
USING (auth.uid() = coach_id AND revoked_at IS NULL);

-- Clients can view their coach assignments
CREATE POLICY "Clients can view their coach assignments"
ON client_assignments
FOR SELECT
USING (auth.uid() = client_id);

-- Clients can revoke coach access
CREATE POLICY "Clients can revoke coach access"
ON client_assignments
FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE coach_client_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- Function to create client assignment when invitation is accepted
CREATE OR REPLACE FUNCTION create_assignment_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO client_assignments (coach_id, client_id, invitation_id, notes)
        VALUES (NEW.coach_id, NEW.client_id, NEW.id, NEW.message)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to create assignment on invitation acceptance
DROP TRIGGER IF EXISTS trigger_create_assignment_on_accept ON coach_client_invitations;
CREATE TRIGGER trigger_create_assignment_on_accept
AFTER UPDATE ON coach_client_invitations
FOR EACH ROW
EXECUTE FUNCTION create_assignment_on_accept();

-- ============================================================================
-- 6. Comments
-- ============================================================================

COMMENT ON TABLE coach_client_invitations IS 'Invitation-based access model for coach-client relationships';
COMMENT ON COLUMN coach_client_invitations.status IS 'Invitation status: pending, accepted, declined, expired';
COMMENT ON COLUMN client_assignments.revoked_at IS 'Timestamp when client revoked coach access';
COMMENT ON COLUMN client_assignments.revoked_by IS 'User who revoked the access (should be client_id)';
COMMENT ON COLUMN user_profiles.user_type IS 'User subscription type: free, premium, coach';

