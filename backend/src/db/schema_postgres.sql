-- ============================================================================
-- SKILL NEXUS AI — PRODUCTION POSTGRESQL DATABASE ARCHITECTURE (PostgreSQL 16+)
-- Version: 1.3.0 (Phase 2.1 Frozen Architecture Implementation)
-- Total Active Tables: Exactly 52 Tables
-- Planned Future Extensions (Excluded in Phase 2.1):
--   - academic_batches
--   - advanced_tracks
--   - track_modules
--   - mock_interviews
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & PREREQUISITES
-- ============================================================================
-- Note: gen_random_uuid() is built into PostgreSQL core natively since v13.
-- pgcrypto can be enabled if cryptographic hashing functions are needed in SQL.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatic timestamp update trigger function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DOMAIN A: AUTHENTICATION & RBAC (Tables 1 - 4)
-- ============================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 2. roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. user_roles (M:N Junction)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

-- 4. user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- DOMAIN B: INSTITUTION & ACADEMIC MASTER (Tables 5 - 9)
-- ============================================================================

-- 5. institutions
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'TN010', 'AU-CEG-01'
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) DEFAULT 'Tamil Nadu' NOT NULL,
    zone VARCHAR(50),
    tier INT CHECK (tier BETWEEN 1 AND 4),
    nirf_rank INT,
    naac_grade VARCHAR(10),
    is_autonomous BOOLEAN DEFAULT true NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    website_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER trg_institutions_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6. departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. 'CSE', 'ECE', 'AI & DS'
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_departments_inst_code UNIQUE (institution_id, code),
    CONSTRAINT uq_departments_inst_id UNIQUE (id, institution_id) -- Needed for compound tenant FK
);

-- 7. institution_members (M:N Staff Junction)
CREATE TABLE IF NOT EXISTS institution_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    member_role VARCHAR(50) NOT NULL CHECK (member_role IN ('INSTITUTION_ADMIN', 'DEAN', 'HOD', 'FACULTY', 'PLACEMENT_OFFICER')),
    designation VARCHAR(150),
    is_active BOOLEAN DEFAULT true NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_institution_members UNIQUE (institution_id, user_id)
);

-- 8. curricula (Syllabus versioning per department)
CREATE TABLE IF NOT EXISTS curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL, -- e.g. '2024-2025'
    version_code VARCHAR(50) NOT NULL,  -- e.g. 'CSE-2024-V1'
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_curricula_dept_year_ver UNIQUE (department_id, academic_year, version_code)
);

-- ============================================================================
-- DOMAIN D: SKILLS & CATEGORIES (Tables 11 - 12, defined before curriculum_skills)
-- ============================================================================

-- 12. skill_categories
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE RESTRICT,
    description TEXT,
    difficulty VARCHAR(32) DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) NOT NULL,
    industry_demand VARCHAR(32) DEFAULT 'HIGH' CHECK (industry_demand IN ('HIGH', 'VERY HIGH', 'CRITICAL', 'MODERATE')) NOT NULL,
    is_emerging BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. curriculum_skills (M:N Junction)
CREATE TABLE IF NOT EXISTS curriculum_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level VARCHAR(32) DEFAULT 'Intermediate' CHECK (required_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) NOT NULL,
    importance VARCHAR(32) DEFAULT 'HIGH' CHECK (importance IN ('CRITICAL', 'HIGH', 'MEDIUM', 'PREFERRED')) NOT NULL,
    CONSTRAINT uq_curriculum_skills UNIQUE (curriculum_id, skill_id)
);

-- ============================================================================
-- DOMAIN C: STUDENT MASTER (Table 10)
-- ============================================================================

-- 10. students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    roll_number VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    cgpa NUMERIC(4,2) CHECK (cgpa BETWEEN 0.00 AND 10.00),
    batch VARCHAR(32) DEFAULT '2022-2026' NOT NULL,
    graduation_year INT NOT NULL,
    readiness_score INT DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100) NOT NULL,
    placement_status VARCHAR(64) DEFAULT 'Seeking Placement' NOT NULL,
    target_career_role VARCHAR(150),
    bio TEXT,
    resume_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_students_inst_roll UNIQUE (institution_id, roll_number),
    -- Strict compound tenant isolation: ensures student's department belongs to their institution
    CONSTRAINT fk_student_dept_institution FOREIGN KEY (department_id, institution_id)
        REFERENCES departments(id, institution_id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 13. student_skills (M:N Junction)
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    self_rating INT CHECK (self_rating BETWEEN 1 AND 5),
    claimed_level VARCHAR(32) DEFAULT 'Beginner' CHECK (claimed_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) NOT NULL,
    verified_level VARCHAR(32) DEFAULT 'None' CHECK (verified_level IN ('None', 'Beginner', 'Intermediate', 'Advanced', 'Expert')) NOT NULL,
    confidence_score INT DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100) NOT NULL,
    verification_status VARCHAR(32) DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')) NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_skills UNIQUE (student_id, skill_id)
);

-- ============================================================================
-- DOMAIN E: ASSESSMENT ENGINE (Tables 15 - 20)
-- ============================================================================

-- 15. assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'LR-4416', 'PR-8901'
    title VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    duration_minutes INT DEFAULT 25 NOT NULL,
    passing_score INT DEFAULT 70 NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'Adaptive' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 16. assessment_questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    explanation TEXT,
    difficulty VARCHAR(32) DEFAULT 'Medium' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. question_options
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false NOT NULL,
    option_order INT NOT NULL,
    CONSTRAINT uq_question_options_order UNIQUE (question_id, option_order)
);

-- 18. assessment_attempts (Immutable Append-Only Operational Record)
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ,
    time_taken_seconds INT,
    score INT CHECK (score BETWEEN 0 AND 100),
    accuracy INT CHECK (accuracy BETWEEN 0 AND 100),
    speed_index NUMERIC(3,1) DEFAULT 1.0,
    percentile NUMERIC(5,2) DEFAULT 85.0,
    proctor_hash VARCHAR(128),
    status VARCHAR(32) DEFAULT 'Completed' CHECK (status IN ('IN_PROGRESS', 'Completed', 'ABANDONED')) NOT NULL
);

-- 19. assessment_answers (Immutable Answer Audit Log)
CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    CONSTRAINT uq_attempt_question_answer UNIQUE (attempt_id, question_id)
);

-- 20. proctor_events (Anti-Cheat Event Audit Log)
CREATE TABLE IF NOT EXISTS proctor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('TAB_SWITCH', 'BLUR', 'WINDOW_RESIZE', 'COPY_PASTE')),
    occurred_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- DOMAIN H: COMPANY & INDUSTRY (Tables 33 - 37)
-- ============================================================================

-- 33. companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(128) UNIQUE,
    industry VARCHAR(128) NOT NULL,
    company_type VARCHAR(64) DEFAULT 'Enterprise' NOT NULL,
    company_size VARCHAR(64) DEFAULT '500-1000' NOT NULL,
    founded_year INT,
    website_url VARCHAR(255),
    headquarters VARCHAR(128) DEFAULT 'Chennai' NOT NULL,
    state VARCHAR(128) DEFAULT 'Tamil Nadu' NOT NULL,
    tier VARCHAR(32) DEFAULT 'Tier 1 Prime Partner' NOT NULL,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 34. company_members (M:N Recruiter Staff Junction)
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    linkedin_url VARCHAR(255),
    permissions JSONB DEFAULT '{"can_post_jobs": true, "can_shortlist": true}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_company_members UNIQUE (company_id, user_id)
);

-- 35. talent_pools
CREATE TABLE IF NOT EXISTS talent_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_company_talent_pool_name UNIQUE (company_id, name)
);

-- 36. talent_pool_candidates (M:N Junction)
CREATE TABLE IF NOT EXISTS talent_pool_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_pool_id UUID NOT NULL REFERENCES talent_pools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_pool_candidate UNIQUE (talent_pool_id, student_id)
);

-- 37. company_institution_partnerships (M:N MoUs)
CREATE TABLE IF NOT EXISTS company_institution_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    partnership_tier VARCHAR(50) DEFAULT 'Prime Hiring Partner' NOT NULL,
    mou_signed_date DATE,
    status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_company_institution_mou UNIQUE (company_id, institution_id)
);

-- ============================================================================
-- DOMAIN F: LEARNING & COURSES (Tables 21 - 25)
-- ============================================================================

-- 21. courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(64) UNIQUE NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'Intermediate' NOT NULL,
    duration_weeks INT DEFAULT 8 NOT NULL,
    hours INT DEFAULT 24 NOT NULL,
    instructor_name VARCHAR(150),
    rating NUMERIC(3,1) DEFAULT 4.8,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER trg_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 22. course_modules
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_text VARCHAR(64) DEFAULT '3 Hours',
    lessons JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT uq_course_modules_order UNIQUE (course_id, module_number)
);

-- 23. course_skills (M:N Junction)
CREATE TABLE IF NOT EXISTS course_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    priority VARCHAR(32) DEFAULT 'HIGH' NOT NULL,
    imparted_level VARCHAR(32) DEFAULT 'Intermediate' NOT NULL,
    CONSTRAINT uq_course_skills UNIQUE (course_id, skill_id)
);

-- 24. enrollments (M:N Course Registration)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'In Progress' CHECK (status IN ('Enrolled', 'In Progress', 'Completed', 'Dropped')) NOT NULL,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100) NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_student_course_enrollment UNIQUE (student_id, course_id)
);

-- 25. student_module_progress (Authoritative Source of Truth for Lessons)
CREATE TABLE IF NOT EXISTS student_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'Completed' CHECK (status IN ('Not Started', 'In Progress', 'Completed')) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_enrollment_module_progress UNIQUE (enrollment_id, module_id)
);

-- ============================================================================
-- DOMAIN G: PROJECTS & CREDENTIALS (Tables 26 - 32)
-- ============================================================================

-- 26. projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    github_url TEXT,
    live_url TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'Validated' CHECK (status IN ('In Progress', 'Submitted', 'Under Review', 'Validated', 'Rejected')) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    validated_at TIMESTAMPTZ
);

-- 27. project_skills (M:N Junction)
CREATE TABLE IF NOT EXISTS project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT uq_project_skills UNIQUE (project_id, skill_id)
);

-- 28. project_proofs (1:N Immutable Submission History & Sovereign Ledger)
CREATE TABLE IF NOT EXISTS project_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    submission_version INT NOT NULL DEFAULT 1,
    proof_hash VARCHAR(128) NOT NULL,
    git_commit_hash VARCHAR(64),
    test_pass_percentage NUMERIC(5,2) DEFAULT 98.0 NOT NULL,
    code_quality_score NUMERIC(5,2) DEFAULT 94.0 NOT NULL,
    submitted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    verification_status VARCHAR(32) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Under Review', 'Validated', 'Rejected')) NOT NULL,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    faculty_signature VARCHAR(255),
    feedback_notes TEXT,
    ledger_block VARCHAR(64) DEFAULT 'Block #8941_301' NOT NULL,
    is_current_active_proof BOOLEAN DEFAULT true NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_at TIMESTAMPTZ,
    CONSTRAINT uq_project_submission_version UNIQUE (project_id, submission_version)
);

-- Partial Unique Index: Guarantees maximum one current active proof per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_proofs_active ON project_proofs(project_id) WHERE is_current_active_proof = true;

-- 29. digital_passports
CREATE TABLE IF NOT EXISTS digital_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    passport_uuid VARCHAR(64) UNIQUE NOT NULL,
    qr_hash VARCHAR(128) NOT NULL,
    is_public BOOLEAN DEFAULT true NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 30. badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_name VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    criteria TEXT,
    icon VARCHAR(64) DEFAULT 'Award' NOT NULL
);

-- 31. student_badges (M:N Junction)
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_badge UNIQUE (student_id, badge_id)
);

-- 32. certificates (Immutable Academic Record)
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    certificate_number VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    certificate_url TEXT,
    verification_hash VARCHAR(128),
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. skill_evidence (Type-Safe Multi-Proof Links with Explicit FKs)
CREATE TABLE IF NOT EXISTS skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_skill_id UUID NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
    evidence_type VARCHAR(32) NOT NULL CHECK (evidence_type IN ('ASSESSMENT', 'PROJECT', 'CERTIFICATE', 'GITHUB', 'FACULTY_VERIFY')),
    
    -- Explicit Relational References
    assessment_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
    faculty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- External URL / Hash Evidence
    proof_url TEXT,
    proof_hash VARCHAR(128),
    
    -- Verification Lifecycle
    verification_status VARCHAR(32) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VALIDATED', 'REJECTED')) NOT NULL,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    faculty_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Table-Level Referential Check Constraint
    CONSTRAINT chk_evidence_references CHECK (
        (evidence_type = 'ASSESSMENT' AND assessment_attempt_id IS NOT NULL) OR
        (evidence_type = 'PROJECT' AND project_id IS NOT NULL) OR
        (evidence_type = 'CERTIFICATE' AND certificate_id IS NOT NULL) OR
        (evidence_type = 'GITHUB' AND proof_url IS NOT NULL) OR
        (evidence_type = 'FACULTY_VERIFY' AND faculty_user_id IS NOT NULL)
    )
);

-- ============================================================================
-- DOMAIN I: OPPORTUNITIES & PLACEMENT (Tables 38 - 42)
-- ============================================================================

-- 38. opportunities (Open Market Corporate Requisitions)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    opportunity_type VARCHAR(64) DEFAULT 'Internship' CHECK (opportunity_type IN ('Internship', 'Full-Time', 'PPO', 'Apprenticeship')) NOT NULL,
    work_mode VARCHAR(32) DEFAULT 'Hybrid' CHECK (work_mode IN ('On-Site', 'Remote', 'Hybrid')) NOT NULL,
    location VARCHAR(128) DEFAULT 'Chennai' NOT NULL,
    salary_min NUMERIC(12,2) DEFAULT 35000,
    salary_max NUMERIC(12,2) DEFAULT 45000,
    stipend_text VARCHAR(128) DEFAULT '₹35,000 / month',
    min_cgpa NUMERIC(4,2) DEFAULT 7.50 NOT NULL,
    min_readiness_score INT DEFAULT 70 NOT NULL,
    deadline DATE NOT NULL,
    applicant_count INT DEFAULT 0 NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'DRAFT')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 39. opportunity_skills (M:N Junction)
CREATE TABLE IF NOT EXISTS opportunity_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level VARCHAR(32) DEFAULT 'Intermediate' NOT NULL,
    importance VARCHAR(32) DEFAULT 'HIGH' CHECK (importance IN ('CRITICAL', 'HIGH', 'MEDIUM', 'PREFERRED')) NOT NULL,
    weight INT DEFAULT 25 NOT NULL,
    CONSTRAINT uq_opportunity_skills UNIQUE (opportunity_id, skill_id)
);

-- 40. placement_drives (On-Campus Recruitment Drives)
CREATE TABLE IF NOT EXISTS placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    drive_date DATE NOT NULL,
    venue VARCHAR(255) DEFAULT 'Campus Placement Center' NOT NULL,
    target_graduation_year INT DEFAULT 2026 NOT NULL,
    default_min_cgpa NUMERIC(4,2) DEFAULT 8.00 NOT NULL,
    default_max_backlogs INT DEFAULT 0 NOT NULL,
    status VARCHAR(32) DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 41. placement_drive_departments (1NF Normalized Department Eligibility)
CREATE TABLE IF NOT EXISTS placement_drive_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    min_cgpa_override NUMERIC(4,2),
    max_backlogs_override INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_drive_department_eligibility UNIQUE (placement_drive_id, department_id)
);

-- 42. placement_drive_opportunities (M:N Campus Job Quota Junction)
CREATE TABLE IF NOT EXISTS placement_drive_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE RESTRICT,
    allocated_openings INT DEFAULT 10 NOT NULL,
    custom_eligibility_note TEXT,
    CONSTRAINT uq_drive_opportunity UNIQUE (placement_drive_id, opportunity_id)
);

-- ============================================================================
-- DOMAIN J: APPLICATIONS & ATS (Tables 43 - 45)
-- ============================================================================

-- 43. applications (Historical Candidate Applications)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE RESTRICT,
    placement_drive_id UUID REFERENCES placement_drives(id) ON DELETE SET NULL,
    resume_url TEXT NOT NULL,
    cover_note TEXT,
    match_score INT DEFAULT 85 CHECK (match_score BETWEEN 0 AND 100) NOT NULL,
    current_stage VARCHAR(64) DEFAULT 'Applied' CHECK (current_stage IN ('Applied', 'Screened', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected')) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_opportunity_application UNIQUE (student_id, opportunity_id)
);

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 44. application_stage_history (Immutable Append-Only Audit Trail)
CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage VARCHAR(64) NOT NULL,
    changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    duration_in_previous_stage_minutes INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 45. interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_number INT DEFAULT 1 NOT NULL,
    round_type VARCHAR(50) NOT NULL CHECK (round_type IN ('Aptitude', 'Technical', 'HR', 'Executive')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    interviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    meeting_link TEXT,
    feedback TEXT,
    score INT CHECK (score BETWEEN 0 AND 100),
    status VARCHAR(32) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- DOMAIN K: MESSAGING & NOTIFICATIONS (Tables 46 - 49)
-- ============================================================================

-- 46. conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 47. conversation_participants (M:N Junction)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
);

-- 48. messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 49. notifications (Role-Isolated with Trash Recovery)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(32) NOT NULL CHECK (recipient_type IN ('student', 'institution', 'company')),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(64),
    related_entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- DOMAIN L: AI MATCHING & ANALYTICS (Tables 50 - 51)
-- ============================================================================

-- 50. match_results (Cached Deterministic 4-Factor AI Matching)
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    skill_match INT NOT NULL CHECK (skill_match BETWEEN 0 AND 100),         -- 35% Weight
    project_fit INT NOT NULL CHECK (project_fit BETWEEN 0 AND 100),         -- 25% Weight
    assessment_score INT NOT NULL CHECK (assessment_score BETWEEN 0 AND 100),-- 20% Weight
    career_alignment INT NOT NULL CHECK (career_alignment BETWEEN 0 AND 100),-- 20% Weight
    algorithm_version VARCHAR(32) DEFAULT 'v3.2_deterministic' NOT NULL,
    explanation JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_opportunity_match UNIQUE (student_id, opportunity_id)
);

-- 51. assessment_results (Granular Skill Attribution from Assessments)
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    CONSTRAINT uq_attempt_skill_result UNIQUE (attempt_id, skill_id)
);

-- ============================================================================
-- DOMAIN M: AUDIT & SECURITY (Table 52)
-- ============================================================================

-- 52. audit_logs (Permanent Immutable Compliance Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- HIGH-PERFORMANCE SEARCH & FOREIGN KEY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON user_sessions(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_district ON institutions(district);
CREATE INDEX IF NOT EXISTS idx_departments_inst ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_members_user ON institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_inst_members_dept ON institution_members(department_id);
CREATE INDEX IF NOT EXISTS idx_curricula_dept ON curricula(department_id);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_students_readiness ON students(readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);

CREATE INDEX IF NOT EXISTS idx_student_skills_lookup ON student_skills(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_parent ON skill_evidence(student_skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_attempt ON skill_evidence(assessment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_project ON skill_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_cert ON skill_evidence(certificate_id);

CREATE INDEX IF NOT EXISTS idx_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_attempt ON proctor_events(attempt_id);

CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_pools_company ON talent_pools(company_id);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_inst ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_enrollment ON student_module_progress(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_project_proofs_project ON project_proofs(project_id, is_current_active_proof);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_drives_institution ON placement_drives(institution_id);
CREATE INDEX IF NOT EXISTS idx_drives_date ON placement_drives(drive_date);
CREATE INDEX IF NOT EXISTS idx_drive_dept_lookup ON placement_drive_departments(placement_drive_id, department_id);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opp ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_stage_history_app ON application_stage_history(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_app ON interviews(application_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, is_deleted);
CREATE INDEX IF NOT EXISTS idx_match_student_opp ON match_results(student_id, opportunity_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at);
