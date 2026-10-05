-- ====================================================================
-- SKILLWORTH PLATFORM — SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'LEARNER' CHECK (role IN ('LEARNER', 'INSTITUTION', 'INDUSTRY', 'ADMIN')),
  preferred_language TEXT DEFAULT 'en',
  profile_id TEXT,
  name TEXT,
  phone TEXT,
  verification_status TEXT DEFAULT 'ACTIVE',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  competencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUALIFICATION PACKS (RPL / NSQF)
CREATE TABLE IF NOT EXISTS public.rpl_qualification_packs (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  nsqf_level INTEGER NOT NULL,
  version TEXT DEFAULT '1.0',
  description TEXT,
  competencies JSONB DEFAULT '[]'::jsonb,
  assessment_criteria JSONB DEFAULT '[]'::jsonb,
  evidence_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ASSESSMENT CENTRES
CREATE TABLE IF NOT EXISTS public.rpl_assessment_centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  supported_sectors JSONB DEFAULT '[]'::jsonb,
  supported_occupations JSONB DEFAULT '[]'::jsonb,
  capacity INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  contact_name TEXT,
  contact_phone TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RPL APPLICATIONS
CREATE TABLE IF NOT EXISTS public.rpl_applications (
  id TEXT PRIMARY KEY,
  application_number TEXT UNIQUE NOT NULL,
  candidate_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_name TEXT,
  candidate_email TEXT,
  qualification_pack_code TEXT NOT NULL,
  occupation TEXT NOT NULL,
  nsqf_level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  assigned_assessor_id TEXT,
  assigned_assessor_name TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  assessment_centre_id TEXT REFERENCES public.rpl_assessment_centres(id) ON DELETE SET NULL,
  timeline JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RPL EVIDENCE
CREATE TABLE IF NOT EXISTS public.rpl_evidence (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES public.rpl_applications(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_url TEXT,
  file_name TEXT,
  evidence_type TEXT DEFAULT 'DOCUMENT',
  verified BOOLEAN DEFAULT FALSE,
  competency_code TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RPL ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.rpl_assessments (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES public.rpl_applications(id) ON DELETE SET NULL,
  worker_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  occupation TEXT NOT NULL,
  qualification_pack_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  score NUMERIC DEFAULT 0,
  competency_matrix JSONB DEFAULT '[]'::jsonb,
  decision TEXT,
  decision_notes TEXT,
  assessor_id TEXT,
  assessor_name TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RPL CREDENTIALS / PASSPORTS
CREATE TABLE IF NOT EXISTS public.rpl_credentials (
  id TEXT PRIMARY KEY,
  credential_id TEXT UNIQUE NOT NULL,
  candidate_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  qualification_pack_code TEXT NOT NULL,
  occupation TEXT NOT NULL,
  nsqf_level INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  grade TEXT DEFAULT 'A',
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  qr_code_url TEXT,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RPL CONSISTENCY AUDITS
CREATE TABLE IF NOT EXISTS public.rpl_consistency_audits (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  assessor_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ai_baseline_score NUMERIC NOT NULL,
  assessor_score NUMERIC NOT NULL,
  variance_percentage NUMERIC NOT NULL,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_qualification_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_assessment_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpl_consistency_audits ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (Admin bypass for server operations)
CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on applications" ON public.rpl_applications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on evidence" ON public.rpl_evidence FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on assessments" ON public.rpl_assessments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on credentials" ON public.rpl_credentials FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on notifications" ON public.notifications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on centres" ON public.rpl_assessment_centres FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on QPs" ON public.rpl_qualification_packs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on skills" ON public.skills FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
CREATE POLICY "Service role full access on audits" ON public.rpl_consistency_audits FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- Public / Authenticated Read for Public Catalogues & Verification
CREATE POLICY "Public read for skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read for qualification packs" ON public.rpl_qualification_packs FOR SELECT USING (true);
CREATE POLICY "Public read for assessment centres" ON public.rpl_assessment_centres FOR SELECT USING (active = true);
CREATE POLICY "Public verification of credentials" ON public.rpl_credentials FOR SELECT USING (true);

-- User-Specific Policies
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Learners can view own applications" ON public.rpl_applications FOR SELECT USING (auth.uid()::text = candidate_id);
CREATE POLICY "Learners can create own applications" ON public.rpl_applications FOR INSERT WITH CHECK (auth.uid()::text = candidate_id);
CREATE POLICY "Learners can view own evidence" ON public.rpl_evidence FOR SELECT USING (auth.uid()::text = worker_id);
CREATE POLICY "Learners can upload evidence" ON public.rpl_evidence FOR INSERT WITH CHECK (auth.uid()::text = worker_id);
CREATE POLICY "Learners can view own notifications" ON public.notifications FOR SELECT USING (auth.uid()::text = user_id);
