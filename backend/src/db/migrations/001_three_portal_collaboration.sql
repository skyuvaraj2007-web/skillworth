-- ============================================================================
-- SKILL NEXUS AI: 001_three_portal_collaboration.sql
-- Additive migration for Three-Portal Unified Collaboration System
-- Preserves all existing tables, rows, and schema constraints.
-- ============================================================================

-- 1. Student Access Requests from Institution to Industry
CREATE TABLE IF NOT EXISTS institution_company_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    requested_by_user_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    message TEXT,
    student_count INT DEFAULT 0,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    responded_by_user_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ic_requests_inst ON institution_company_access_requests(institution_id);
CREATE INDEX IF NOT EXISTS idx_ic_requests_comp ON institution_company_access_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_ic_requests_status ON institution_company_access_requests(status);

-- 2. Authorized Shared Students Junction (Company-scoped access)
CREATE TABLE IF NOT EXISTS institution_company_shared_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES institution_company_access_requests(id) ON DELETE CASCADE,
    institution_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    access_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (access_status IN ('ACTIVE', 'REVOKED')),
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_student_share UNIQUE (company_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_students_comp ON institution_company_shared_students(company_id);
CREATE INDEX IF NOT EXISTS idx_shared_students_stu ON institution_company_shared_students(student_id);

-- 3. Normalized Programming Languages
CREATE TABLE IF NOT EXISTS programming_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial programming languages if not already present
INSERT INTO programming_languages (code, name, category) VALUES
    ('python', 'Python', 'General & AI'),
    ('java', 'Java', 'Enterprise & Backend'),
    ('c', 'C', 'Systems & Embedded'),
    ('cpp', 'C++', 'Systems & Competitive'),
    ('javascript', 'JavaScript', 'Web & Full Stack'),
    ('typescript', 'TypeScript', 'Web & Full Stack'),
    ('csharp', 'C#', 'Enterprise & Game Dev'),
    ('go', 'Go', 'Cloud & Microservices'),
    ('rust', 'Rust', 'Systems & High-Performance'),
    ('php', 'PHP', 'Web Development'),
    ('sql', 'SQL', 'Database & Analytics')
ON CONFLICT (code) DO NOTHING;

-- 4. Course to Programming Language Junction
CREATE TABLE IF NOT EXISTS course_programming_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(64) NOT NULL,
    programming_language_id UUID REFERENCES programming_languages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_course_prog_lang UNIQUE (course_id, programming_language_id)
);

CREATE INDEX IF NOT EXISTS idx_course_prog_lang_course ON course_programming_languages(course_id);

-- 5. Additive Assessment & Question Columns
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS institution_id VARCHAR(64);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(32) DEFAULT 'LOGICAL';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'PUBLISHED';

ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS programming_language_id UUID REFERENCES programming_languages(id) ON DELETE SET NULL;
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS marks INT DEFAULT 10;
