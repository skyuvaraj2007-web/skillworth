# SKILL NEXUS AI — PHASE 3 THREE-PORTAL CURRENT STATE AUDIT REPORT

**Date of Audit:** 2026-09-06  
**Environment:** Windows / PostgreSQL 17 / Express / React (Vite)  
**Author:** Antigravity AI  

---

## 1. Executive Summary

SkillNexus AI connects **Students**, **Institutions**, and **Industries** across a shared lifecycle. This audit evaluates the current implementation of all three portals against the requirements of a unified, PostgreSQL-backed academia-industry collaboration system.

Currently:
- PostgreSQL connection pool is initialized and contains **53 baseline tables**.
- Unified dual-engine `relationalManager.js` handles data persistence across PostgreSQL and relational store fallback.
- The **Student Portal** contains working features for registration, profiling, course enrollment, module progression (idempotent, read-only Continue), skill management ("My Skills"), assessment submissions, and application tracking.
- The **Institution Portal** contains roster management, department management, student lists, readiness tracking, course catalog, and basic placement tracking.
- The **Industry/Company Portal** contains company profile, opportunities, candidate matches, applications, interviews, talent pools, and analytics.

However, several critical cross-portal collaboration relationships and workflows are either missing or partially decoupled:
1. **Institution $\to$ Industry Student Access Request Workflow**: No formal request/approval entity exists in PostgreSQL or backend routes.
2. **Authorized Student View in Industry**: Industry currently views all applicants or talent pool entries; it lacks an explicit "Authorized Students" view gated by accepted access requests.
3. **Institution Assessment Tests**: Assessments currently exist primarily as a static/student-diagnostic track (`/api/assessments`), lacking an institution-managed assessment test engine supporting Logical Reasoning, Aptitude, and multi-language Programming with course-language eligibility.
4. **Programming Language Normalization & Course-Language Mapping**: No normalized `programming_languages` or `course_programming_languages` tables exist yet.
5. **Cross-Portal Event Notifications**: Cross-portal triggers (such as Institution requesting access, Company accepting/rejecting, or Company creating an internship) are not fully broadcasting bidirectional notifications across all three portals.

---

## 2. Existing Portal Functionality Matrix

### 2.1 Student Portal
- **Authentication:** Local JWT authentication and Google OAuth 2.0 Identity Services (`google_id`, `auth_provider`) with auto-onboarding and account linking.
- **Home / Dashboard:** Consumes `/api/students/stats` and local profile. Authoritative 0 values for brand-new accounts (0 skills, 0 courses, 0 projects, 0 readiness).
- **My Skills:** Consumes `/api/skills` and `/api/student/skills`. Supports manual skill additions (Self-Assessed), canonical levels (Beginner, Intermediate, Advanced, Expert), and verification attestation upon passing assessments.
- **Skill Assessment:** Consumes `/api/assessments` with server-side validation and question sanitization. Passing ($\ge 70\%$) attests verified skills directly into student records and recalculates readiness.
- **Learning & Courses:** Consumes `/api/learning`. "Continue" is strictly read-only (`GET /api/learning/:id/resume`), and module completion (`POST /api/learning/:id/modules/:moduleId/complete`) is explicit and idempotent.
- **Opportunities & Applications:** Students can view listings and apply (`POST /api/opportunities/:id/apply` or `/api/internships/:id/apply`). Applications are tracked with explicit stages (`Submitted`, `Screening`, `Shortlisted`, `Interview`, `Selected`, `Rejected`).
- **Profile:** Managed via `GET /api/students/profile` and `PUT /api/students/profile` with live calculation of `courseCompletionPercentage` and `readinessScore`.

### 2.2 Institution Portal
- **Console / Telemetry:** Displays student counts, average readiness, and regional benchmarks for the authenticated institution.
- **Student Roster & Import:** Full CSV template download, preview, upsert, and invitation workflow (`/api/academic/roster/import`, `/api/academic/template/download`) with activation tokens.
- **Department Management:** Add/list academic departments scoped by `institution_id`.
- **Student Details & Readiness:** Inspects student records, verified skills, and readiness scores scoped strictly by `req.institutionId`.
- **Course Management:** Institution course creation and student enrollment management.
- **Industry Collaboration (Current):** Displays company directory and company opportunities, but lacks the formal student access request flow.

### 2.3 Industry / Company Portal
- **Dashboard & Overview:** Summarizes postings, applicants, and candidate matches for `req.companyId`.
- **Opportunities Management:** Post, edit, and close internships, apprenticeships, and jobs.
- **Candidate Matching:** AI-driven explainable matching comparing candidate skills against opportunity criteria.
- **Applications & Talent Pools:** Review incoming student applications, advance stages, schedule interviews, and assign to talent pools.
- **Colleges & Partnerships:** View colleges, but lacks the formal student access authorization approval dashboard.

---

## 3. Database Entities & Schema Audit

### 3.1 Existing Relevant Tables (Public Schema - 53 Tables)
- **Users & Auth:** `users` (with `id`, `email`, `password_hash`, `role`, `full_name`, `google_id`, `auth_provider`, `account_status`, `email_verified`, `is_active`), `roles`, `user_roles`, `user_sessions`.
- **Institutions:** `institutions`, `departments`, `institution_members`, `roster_imports`.
- **Students & Skills:** `students`, `skills`, `skill_categories`, `student_skills`, `skill_evidence`.
- **Assessments:** `assessments`, `assessment_questions`, `question_options`, `assessment_attempts`, `assessment_answers`, `assessment_results`, `proctor_events`.
- **Learning:** `courses`, `course_modules`, `course_skills`, `enrollments`, `student_module_progress`.
- **Projects & Credentials:** `projects`, `project_skills`, `project_proofs`, `certificates`, `badges`, `student_badges`, `digital_passports`.
- **Company & Talent:** `companies`, `company_members`, `company_institution_partnerships`, `talent_pools`, `talent_pool_candidates`.
- **Opportunities & Applications:** `opportunities`, `opportunity_skills`, `placement_drives`, `placement_drive_departments`, `placement_drive_opportunities`, `applications`, `application_stage_history`, `interviews`.
- **Collaboration & System:** `conversations`, `conversation_participants`, `messages`, `notifications`, `audit_logs`, `match_results`.

### 3.2 Missing or Incomplete Relational Entities
1. **Student Access Requests:**
   - Need `institution_company_access_requests` table:
     - `id UUID PRIMARY KEY`
     - `institution_id UUID / VARCHAR NOT NULL`
     - `company_id UUID / VARCHAR NOT NULL`
     - `requested_by_user_id UUID / VARCHAR`
     - `status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))`
     - `message TEXT`
     - `requested_at TIMESTAMPTZ DEFAULT NOW()`
     - `responded_at TIMESTAMPTZ`
     - `responded_by_user_id UUID / VARCHAR`
     - `created_at TIMESTAMPTZ DEFAULT NOW()`
     - `updated_at TIMESTAMPTZ DEFAULT NOW()`
2. **Authorized Shared Students Junction:**
   - Need `institution_company_shared_students` table:
     - `id UUID PRIMARY KEY`
     - `request_id UUID / VARCHAR REFERENCES institution_company_access_requests(id) ON DELETE CASCADE`
     - `institution_id UUID / VARCHAR NOT NULL`
     - `company_id UUID / VARCHAR NOT NULL`
     - `student_id UUID / VARCHAR NOT NULL`
     - `access_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (access_status IN ('ACTIVE', 'REVOKED'))`
     - `shared_at TIMESTAMPTZ DEFAULT NOW()`
     - `revoked_at TIMESTAMPTZ`
     - `created_at TIMESTAMPTZ DEFAULT NOW()`
     - `updated_at TIMESTAMPTZ DEFAULT NOW()`
     - `CONSTRAINT uq_company_student_share UNIQUE (company_id, student_id)`
3. **Multi-Language Programming Support:**
   - Need `programming_languages` table:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `code VARCHAR(50) UNIQUE NOT NULL` (e.g., 'python', 'java', 'cpp', 'javascript', 'typescript', 'csharp', 'go', 'rust', 'sql')
     - `name VARCHAR(100) NOT NULL` (e.g., 'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'C#', 'Go', 'Rust', 'SQL')
     - `category VARCHAR(50) DEFAULT 'General'`
     - `is_active BOOLEAN DEFAULT true`
4. **Course to Programming Language Mapping:**
   - Need `course_programming_languages` junction:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `course_id UUID / VARCHAR NOT NULL`
     - `programming_language_id UUID / VARCHAR NOT NULL`
     - `CONSTRAINT uq_course_prog_lang UNIQUE (course_id, programming_language_id)`
5. **Assessment Structure Additions:**
   - `assessments` table needs `institution_id` column to support institution-created tests, and `assessment_type` (`LOGICAL`, `APTITUDE`, `PROGRAMMING`).
   - `assessment_questions` table needs `programming_language_id` (nullable, used when `question_type = 'PROGRAMMING'`).

---

## 4. Frontend & API Gaps Analysis

| Feature Area | Current Status | Gap / Required Correction |
| :--- | :--- | :--- |
| **Institution Assessment Management** | Missing Dedicated View | Need an Institution page/tab for "Assessment Tests" (Logical, Aptitude, Programming) with question creator, language selector for programming questions, and publish workflow. |
| **Course $\to$ Language Mapping** | Implicit in skill tags | Need explicit database mapping linking enrolled courses to allowed programming languages for dynamic question filtering during programming tests. |
| **Institution Student Access Request** | UI missing in Console | Need "Send Student Access Request" modal/tab in Institution Console under Industry Collaboration with pending/accepted/rejected lists. |
| **Industry Student Access Requests** | Missing in Industry Portal | Need Industry Portal tab for "Student Access Requests" with review, candidate count, and Accept / Reject actions. |
| **Industry Authorized Students View** | Filtered by Applications | Need dedicated "Authorized Students" view in Industry Portal showing only students shared through accepted access requests. |
| **Student Development Timeline** | Static in some views | Need continuous development timeline computed from actual DB events (assessments taken, courses enrolled, modules completed, certificates earned, applications, interviews, offers). |
| **Company Offerings $\to$ Institution** | Partial | When a company posts an opportunity, course, or training, partner institutions must see it under Industry Opportunities / Learning Programs with one-click enrollment recommendation. |
| **Interview & Offer Lifecycle** | Applications have stage | Complete company offer generation endpoint with student and institution notification and placement outcome updates. |

---

## 5. Security, Multi-Tenant Isolation & Authoritativeness Audit

1. **Tenant Integrity:**
   - `academic.js` strictly verifies `req.institutionId` via `verifyInstitution`.
   - `company.js` strictly verifies `req.companyId` via `verifyCompany`.
   - `studentRoutes.js` strictly verifies `req.user.studentId` via `requireAuth`.
   - Industry access to student details (`/api/company/students/:id`) must enforce check against `institution_company_shared_students` (returns 403 if unshared).
2. **Readiness Engine Invariants:**
   - Authoritative calculation in `readinessService.js` contains no `Math.max(1, readiness)` floors and returns strictly 0 for zero evidence.
3. **Course Progression Invariants:**
   - Read-only `Continue` endpoint in `learning.js` preserves course progress.
   - Module completion is explicit, validates enrollment, and is idempotent.

---

## 6. Actionable Implementation Roadmap

1. **Database Migration (`backend/src/db/migrations/001_three_portal_integration.sql`):**
   - Create `institution_company_access_requests` and `institution_company_shared_students`.
   - Create `programming_languages` and `course_programming_languages`.
   - Add `institution_id`, `assessment_type`, and `status` to `assessments`.
   - Add `programming_language_id` and `marks` to `assessment_questions`.
2. **Backend Engine Extensions (`relationalManager.js` & Routes):**
   - Implement access request APIs (`/api/academic/industry-requests`, `/api/company/student-access-requests`).
   - Implement authorized student fetching and development timeline generator (`/api/company/students`, `/api/company/students/:id/development`).
   - Implement institution assessment test management APIs (`/api/academic/assessments`, questions, publish).
   - Implement student assessment eligibility filter based on enrolled course languages.
   - Implement company offerings sync, interview scheduling, and offer creation APIs with persisted notifications.
3. **Frontend Implementation & Wiring:**
   - Add Institution "Assessment Tests" view in `InstitutionConsole.jsx` with question management modal and language selector.
   - Add Institution "Student Access Request" interface under Industry Collaboration.
   - Add Industry "Student Access Requests" and "Authorized Students" view in `IndustryPortal.jsx`.
   - Wire student continuous development timeline from live API.
4. **Verification & Regression Testing:**
   - Write comprehensive test suite `tests/verify_three_portal_integration.js`.
   - Run existing suites (`verify_account_mapping.js`, `verify_portal_fixes.js`, `verify_my_skills.js`, `final_system_verification.js`).
   - Execute browser verification via browser subagent.
   - Generate `PHASE_3_THREE_PORTAL_INTEGRATION_FINAL_REPORT.md`.
