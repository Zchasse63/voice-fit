-- Enterprise/B2B Dashboard Schema

-- ============================================================================
-- 1. Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  organization_type VARCHAR(50) DEFAULT 'gym' CHECK (organization_type IN ('gym', 'studio', 'team', 'enterprise')),
  
  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  max_coaches INTEGER DEFAULT 5,
  max_clients INTEGER DEFAULT 50,
  
  -- Settings
  branding_logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- RLS policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they belong to (via coach_profiles or client_assignments)
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.coach_profiles WHERE user_id = auth.uid()::text
      UNION
      SELECT organization_id FROM public.client_assignments WHERE client_user_id = auth.uid()::text
    )
  );

GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

-- ============================================================================
-- 2. Coach Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- Links to user_profiles
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Coach info
  display_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'coach' CHECK (role IN ('owner', 'admin', 'coach')),
  
  -- Specializations
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[], -- strength, endurance, nutrition, etc.
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON public.coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_org ON public.coach_profiles(organization_id);

-- RLS policies
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own profile"
  ON public.coach_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Coaches can view profiles in their organization"
  ON public.coach_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.coach_profiles WHERE user_id = auth.uid()::text
    )
  );

GRANT SELECT ON public.coach_profiles TO authenticated;
GRANT ALL ON public.coach_profiles TO service_role;

-- ============================================================================
-- 3. Client Assignments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL, -- Links to user_profiles
  coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Notes
  coach_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_user_id, organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON public.client_assignments(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_coach ON public.client_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_org ON public.client_assignments(organization_id);

-- RLS policies
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own assignments"
  ON public.client_assignments FOR SELECT
  USING (auth.uid()::text = client_user_id);

CREATE POLICY "Coaches can view assignments in their organization"
  ON public.client_assignments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.coach_profiles WHERE user_id = auth.uid()::text
    )
  );

GRANT SELECT ON public.client_assignments TO authenticated;
GRANT ALL ON public.client_assignments TO service_role;

-- ============================================================================
-- 4. CSV Import Jobs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.csv_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Import details
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER,
  total_rows INTEGER,
  
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'validating', 'importing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0,
  
  -- Schema mapping (AI-assisted)
  detected_schema JSONB, -- AI-detected column mappings
  user_confirmed_schema JSONB, -- User-confirmed mappings
  
  -- Quality review (AI-generated)
  quality_review JSONB, -- AI analysis of program quality
  
  -- Results
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_csv_import_jobs_coach ON public.csv_import_jobs(coach_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_jobs_org ON public.csv_import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_jobs_status ON public.csv_import_jobs(status);

-- RLS policies
ALTER TABLE public.csv_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own import jobs"
  ON public.csv_import_jobs FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()::text
    )
  );

GRANT SELECT ON public.csv_import_jobs TO authenticated;
GRANT ALL ON public.csv_import_jobs TO service_role;

