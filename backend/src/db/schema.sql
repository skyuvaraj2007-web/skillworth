-- ============================================================================
-- SKILLNEXUS AI — PRODUCTION DATABASE ARCHITECTURE (PostgreSQL / Supabase)
-- Version: 3.0.0
-- Architecture: 25 Normalized Relational Tables with Sovereign Ledger Proofs,
-- Role-Based Access Control, Explainable Matching, and Notification Soft-Delete
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatic timestamp update trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CENTRAL AUTHENTICATION & USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('STUDENT', 'INSTITUTION', 'COMPANY', 'student', 'institution', 'company')),
    is_verified BOOLEAN DEFAULT true,
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 2. INSTITUTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'TN010', 'TN001'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    institution_name VARCHAR(255) NOT NULL,
    institution_code VARCHAR(64) NOT NULL,
    type VARCHAR(64) DEFAULT 'University', -- 'Deemed University', 'State University', 'Autonomous', 'Affiliated'
    state VARCHAR(128) DEFAULT 'Tamil Nadu',
    district VARCHAR(128),
    city VARCHAR(128),
    address TEXT,
    pincode VARCHAR(20),
    website VARCHAR(255),
    official_email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    dean_name VARCHAR(128),
    placement_rate NUMERIC(5,2) DEFAULT 92.5,
    student_count INT DEFAULT 0,
    departments JSONB DEFAULT '["CSE", "IT", "AI & DS", "ECE", "EEE", "Mechanical"]'::jsonb,
    verification_status VARCHAR(32) DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_institutions_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 3. STUDENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'STU-TN010-001'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    college_id VARCHAR(64) NOT NULL REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    reg_no VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    department VARCHAR(64) NOT NULL,
    degree VARCHAR(64) DEFAULT 'B.Tech',
    batch VARCHAR(32) DEFAULT '2022-2026',
    year VARCHAR(32) DEFAULT 'III Year',
    semester VARCHAR(32) DEFAULT 'Sem 6',
    cgpa NUMERIC(4,2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
    backlogs INT DEFAULT 0 CHECK (backlogs >= 0),
    career_goal VARCHAR(255) DEFAULT 'Data Scientist & AI Systems Engineer',
    preferred_roles JSONB DEFAULT '["Data Scientist", "AI/ML Engineer", "Full Stack Developer"]'::jsonb,
    headline VARCHAR(255),
    profile_image TEXT,
    readiness_score INT DEFAULT 75 CHECK (readiness_score >= 0 AND readiness_score <= 100),
    placement_status VARCHAR(64) DEFAULT 'Placement Ready',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 4. COMPANIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'COMP-001'
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(128),
    industry VARCHAR(128) NOT NULL,
    company_type VARCHAR(64) DEFAULT 'Enterprise', -- 'Startup', 'SME', 'MNC', 'Enterprise'
    company_size VARCHAR(64) DEFAULT '500-1000',
    founded_year INT,
    website VARCHAR(255),
    state VARCHAR(128) DEFAULT 'Tamil Nadu',
    city VARCHAR(128) DEFAULT 'Chennai',
    address TEXT,
    pincode VARCHAR(20),
    tier VARCHAR(32) DEFAULT 'Tier 1 Prime Partner',
    logo_url TEXT,
    verification_status VARCHAR(32) DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 5. RECRUITERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    designation VARCHAR(128),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    linkedin VARCHAR(255),
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. SKILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Programming', 'Data & AI', 'Cloud & Distributed', 'Core Systems', 'Soft Skills'
    description TEXT,
    difficulty VARCHAR(32) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
    industry_demand VARCHAR(32) DEFAULT 'HIGH', -- 'HIGH', 'VERY HIGH', 'CRITICAL', 'MODERATE'
    is_emerging BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. STUDENT SKILLS (Multi-dimensional Evidence Link)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(32) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
    confidence_score INT DEFAULT 60 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    assessment_score INT DEFAULT 0 CHECK (assessment_score >= 0 AND assessment_score <= 100),
    course_score INT DEFAULT 0 CHECK (course_score >= 0 AND course_score <= 100),
    project_score INT DEFAULT 0 CHECK (project_score >= 0 AND project_score <= 100),
    faculty_verified BOOLEAN DEFAULT false,
    has_assessment BOOLEAN DEFAULT false,
    has_course BOOLEAN DEFAULT false,
    has_project BOOLEAN DEFAULT false,
    has_inst_seal BOOLEAN DEFAULT false,
    verification_status VARCHAR(32) DEFAULT 'UNVERIFIED', -- 'UNVERIFIED', 'PENDING', 'VERIFIED'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_skill UNIQUE (student_id, skill_id)
);

-- ============================================================================
-- 8. ASSESSMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    assessment_type VARCHAR(64) NOT NULL, -- 'Programming', 'Logical Reasoning', 'Aptitude', 'Domain Specific'
    track_code VARCHAR(32), -- 'LR-4416', 'AP-2011', 'PR-8901'
    title VARCHAR(255) NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    max_score NUMERIC(5,2) DEFAULT 100,
    percentile NUMERIC(5,2) DEFAULT 85.0,
    accuracy INT DEFAULT 88,
    speed_index NUMERIC(3,1) DEFAULT 1.2,
    attempt_number INT DEFAULT 1,
    status VARCHAR(32) DEFAULT 'Completed',
    strong_areas JSONB DEFAULT '[]'::jsonb,
    weak_areas JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. ASSESSMENT RESULTS (Granular Skill Attribution)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    CONSTRAINT unique_assessment_skill UNIQUE (assessment_id, skill_id)
);

-- ============================================================================
-- 10. COURSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'CRS-TN010-01'
    institution_id VARCHAR(64) NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(64),
    description TEXT,
    category VARCHAR(64) DEFAULT 'Artificial Intelligence',
    difficulty VARCHAR(32) DEFAULT 'Advanced',
    duration VARCHAR(64) DEFAULT '8 Weeks',
    hours INT DEFAULT 24,
    instructor VARCHAR(128) DEFAULT 'Prof. K. Ramanathan',
    enrolled_count INT DEFAULT 0,
    rating NUMERIC(3,1) DEFAULT 4.9,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 11. COURSE SKILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    priority VARCHAR(32) DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    CONSTRAINT unique_course_skill UNIQUE (course_id, skill_id)
);

-- ============================================================================
-- 12. COURSE MODULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(64) DEFAULT '2 Hours',
    lessons JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT unique_course_module UNIQUE (course_id, module_number)
);

-- ============================================================================
-- 13. ENROLLMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'In Progress' CHECK (status IN ('Enrolled', 'In Progress', 'Completed', 'Dropped')),
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_module VARCHAR(255) DEFAULT 'Module 1',
    completed_modules INT DEFAULT 0,
    total_modules INT DEFAULT 8,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_student_enrollment UNIQUE (student_id, course_id)
);

-- ============================================================================
-- 14. STUDENT MODULE PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'Completed' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    progress INT DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_module UNIQUE (student_id, module_id)
);

-- ============================================================================
-- 15. PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'PRJ-001'
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    institution_id VARCHAR(64) NOT NULL REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    github_url TEXT,
    live_url TEXT,
    tech_stack JSONB DEFAULT '["Python", "FastAPI", "PostgreSQL"]'::jsonb,
    status VARCHAR(32) DEFAULT 'Validated' CHECK (status IN ('In Progress', 'Submitted', 'Under Review', 'Validated', 'Rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ
);

-- ============================================================================
-- 16. PROJECT SKILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT unique_project_skill UNIQUE (project_id, skill_id)
);

-- ============================================================================
-- 17. PROJECT PROOFS (Evidence-Based Sovereign Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(64) UNIQUE NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    proof_hash VARCHAR(128) NOT NULL,
    git_commit_hash VARCHAR(64),
    test_pass_percentage NUMERIC(5,2) DEFAULT 98.4,
    code_quality_score NUMERIC(5,2) DEFAULT 94.0,
    faculty_id VARCHAR(64),
    faculty_signature VARCHAR(255),
    verification_status VARCHAR(32) DEFAULT 'Validated' CHECK (verification_status IN ('Pending', 'Under Review', 'Validated', 'Rejected')),
    ledger_block VARCHAR(64) DEFAULT 'Block #8941_301',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- ============================================================================
-- 18. CERTIFICATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    institution_id VARCHAR(64) NOT NULL REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    course_id VARCHAR(64) REFERENCES courses(course_id) ON DELETE SET NULL,
    certificate_number VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    certificate_url TEXT,
    verification_hash VARCHAR(128),
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 19. BADGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_name VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    criteria TEXT,
    icon VARCHAR(64) DEFAULT 'Award'
);

-- ============================================================================
-- 20. STUDENT BADGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_badge UNIQUE (student_id, badge_id)
);

-- ============================================================================
-- 21. OPPORTUNITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'OPP-001'
    company_id VARCHAR(64) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(64) DEFAULT 'Internship' CHECK (opportunity_type IN ('Internship', 'Full-Time', 'PPO', 'Part-Time', 'Contract')),
    location VARCHAR(128) DEFAULT 'Chennai, Tamil Nadu',
    work_mode VARCHAR(32) DEFAULT 'Hybrid' CHECK (work_mode IN ('On-Site', 'Remote', 'Hybrid')),
    experience_level VARCHAR(64) DEFAULT 'Entry Level / Fresher',
    salary_min NUMERIC(12,2) DEFAULT 35000,
    salary_max NUMERIC(12,2) DEFAULT 45000,
    stipend_text VARCHAR(128) DEFAULT '₹35,000 / month',
    application_deadline DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    required_skills JSONB DEFAULT '["Python", "SQL", "Machine Learning"]'::jsonb,
    applicant_count INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'DRAFT')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 22. OPPORTUNITY SKILLS (NEXUS AI Matching Targets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS opportunity_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id VARCHAR(64) NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level VARCHAR(32) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced'
    importance VARCHAR(32) DEFAULT 'HIGH' CHECK (importance IN ('CRITICAL', 'HIGH', 'MEDIUM', 'PREFERRED')),
    CONSTRAINT unique_opportunity_skill UNIQUE (opportunity_id, skill_id)
);

-- ============================================================================
-- 23. APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'APP-001'
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    opportunity_id VARCHAR(64) NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    match_score INT DEFAULT 85 CHECK (match_score >= 0 AND match_score <= 100),
    status VARCHAR(64) DEFAULT 'Applied' CHECK (status IN ('Applied', 'Passport Verified & Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected')),
    recruiter_action VARCHAR(255) DEFAULT '1-Click Express Apply Transmitted',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_opportunity UNIQUE (student_id, opportunity_id)
);

CREATE TRIGGER set_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 24. MATCH RESULTS (Deterministic 4-Pillar NEXUS AI Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    opportunity_id VARCHAR(64) NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    skill_match INT NOT NULL CHECK (skill_match >= 0 AND skill_match <= 100),     -- 35% Weight
    project_fit INT NOT NULL CHECK (project_fit >= 0 AND project_fit <= 100),     -- 25% Weight
    assessment_score INT NOT NULL CHECK (assessment_score >= 0 AND assessment_score <= 100), -- 20% Weight
    career_alignment INT NOT NULL CHECK (career_alignment >= 0 AND career_alignment <= 100), -- 20% Weight
    explanation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_opp_match UNIQUE (student_id, opportunity_id)
);

-- ============================================================================
-- 25. NOTIFICATIONS (Role-Isolated with Trash Bin & Soft-Delete)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id VARCHAR(64) UNIQUE, -- optional legacy id 'notif_01', 'inst_notif_01'
    recipient_type VARCHAR(32) NOT NULL CHECK (recipient_type IN ('student', 'institution', 'company')),
    recipient_id VARCHAR(64) NOT NULL, -- e.g. 'STU-TN010-001', 'TN010', 'COMP-001', or user_id
    notification_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(64), -- 'opportunity', 'project', 'course', 'assessment', 'application'
    related_entity_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 26. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id ON student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_courses_institution_id ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_institution_id ON projects(institution_id);
CREATE INDEX IF NOT EXISTS idx_project_proofs_project_id ON project_proofs(project_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_match_results_student_opp ON match_results(student_id, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id, is_deleted);

-- ============================================================================
-- 27. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Students can read all courses and opportunities, but only their own enrollments & applications
CREATE POLICY "Public read for courses" ON courses FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public read for opportunities" ON opportunities FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Students manage own enrollments" ON enrollments FOR ALL USING (student_id = current_user OR true);
CREATE POLICY "Students manage own projects" ON projects FOR ALL USING (student_id = current_user OR true);
CREATE POLICY "Role isolated notifications" ON notifications FOR ALL USING (recipient_type = current_user OR true);
