# SKILL NEXUS AI — DATABASE & DATA FLOW ARCHITECTURE

## 1. Executive Architectural Overview
Skill Nexus AI is an enterprise-grade Career Intelligence, Skill Development, Academia–Industry Collaboration, and Opportunity Platform. The system unites three distinct user archetypes:
1. **Students**: Learning, self-assessment, career passport generation, and job/internship application.
2. **Institutions**: Cohort performance monitoring, verified student roster administration, diagnostic assessment authoring, and candidate access dispatching.
3. **Companies (Industry)**: Opportunity publication, candidate matching, talent pipeline staging, interview scheduling, and official offer extensions.

All runtime business logic and data persistence operate strictly on **PostgreSQL 18.6** (`skillnexus_db`). All legacy file-based databases (`relational_db.json`), in-memory mock stores, and hardcoded candidate registries have been completely eradicated from runtime production execution.

---

## 2. Identity Mapping & Multi-Tenant Authorization

```
                 [ users Table (Authoritative Identity & Auth) ]
                     id (UUID), email, password_hash, role
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
      role = 'student'        role = 'institution'        role = 'company'
            │                         │                         │
            ▼                         ▼                         ▼
    [ students Table ]      [ institution_members ]      [ company_members ]
      id (UUID PK)              user_id (FK)                user_id (FK)
      user_id (FK -> users.id)  institution_id (FK)        company_id (FK)
            │                         │                         │
            ▼                         ▼                         ▼
  Student-Scoped Data:      [ institutions Table ]       [ companies Table ]
  - student_skills            id (UUID PK)                 id (UUID PK)
  - enrollments               code (String / Slug)         registration_number
  - assessment_attempts       name, tier, district         company_name, industry
  - applications
```

### Identity Invariants
1. **Never Assume `users.id = students.id`**:
   The primary key of `users` is distinct from `students.id`. Every authenticated student request maps `req.user.id` $\to$ `students.user_id` $\to$ canonical `students.id`.
2. **Institution Resolution**:
   `req.user.id` $\to$ lookup in `institution_members` joined with `institutions` $\to$ authoritative `institutions.id` and `institutions.code`.
3. **Company Resolution**:
   `req.user.id` $\to$ lookup in `company_members` joined with `companies` $\to$ authoritative `companies.id` and `companies.registration_number`.

---

## 3. Strict Multi-Tenant Data Boundaries & Isolation Matrix

| Layer / Entity | Student Portal | Academic / Institution Portal | Industry / Company Portal |
| :--- | :--- | :--- | :--- |
| **Self Profile** | Full Read/Write (`students.id`) | Read-Only (Institution Roster) | Read-Only (Authorized Candidates Only) |
| **Student Roster** | Forbidden (HTTP 403) | Scoped strictly by `institution_id` | Blocked except shared/applied candidates |
| **Assessments** | View & Submit eligible questions | Author & Publish campus assessments | View verified assessment results for candidates |
| **Course Modules** | Enroll & Track progress | Author courses & assign to cohort | Partner & Review verified competencies |
| **Opportunities** | Search & Apply with AI Match | View placement drives & drives analytics | Full CRUD on company-owned opportunities |
| **Applications** | Track own applications | Track cohort application outcomes | Manage company candidate pipeline |
| **Candidate Vault** | N/A | N/A | Strict Authorization Barrier (403 if unshared) |

---

## 4. Shared Student Model (Zero Duplicate Records)

A foundational architectural requirement is that student records are **never duplicated** across portals:
1. **Single Record of Truth**: There is exactly one row per student in `public.students`.
2. **Student Owns the Data**: When a student updates their bio, GitHub link, skills, or projects, the change is written directly to `students` and `student_skills`.
3. **Institution Sees Live Truth**: When an institution administrator opens the student roster or student details, the query joins directly to `students` and `student_skills` scoped by `students.institution_id`.
4. **Company Receives Authorized Live View**: When a company receives access to a student via:
   - Student applying directly to a company opportunity (`applications`), or
   - Institution requesting candidate access (`institution_company_access_requests`) and company accepting (`institution_company_shared_students` with `access_status = 'ACTIVE'`).
   
   The company views the live student record with sensitive fields (`password_hash`, auth tokens) stripped. No copied records exist.

---

## 5. End-to-End Workflow Data Flow Diagrams

### 5.1 Student Application & Matching Flow
```
Student Browses Opportunity
         │
         ▼
GET /api/opportunities/:id
         │
         ├──> [PostgreSQL] Query opportunities + opportunity_skills
         │
         └──> [matchingService] Live match computation
                   ├──> Match Score (0 - 100%)
                   ├──> Matched Skills Array
                   ├──> Missing Skills Array
                   └──> Explainability Evidence & Text
         │
         ▼
Student Clicks Apply
         │
         ▼
POST /api/opportunities/:id/apply
         │
         ├──> [PostgreSQL Transaction]
         │       ├── INSERT INTO applications (status = 'Applied', current_stage = 'Applied')
         │       ├── INSERT INTO application_stage_history (stage = 'Applied')
         │       └── UPDATE opportunities SET applicant_count = applicant_count + 1
         │
         ├──> [PostgreSQL Notifications]
         │       ├── Notify Student: "Application Submitted"
         │       └── Notify Company: "New Candidate Application"
         │
         ▼
HTTP 201 Created & Instant UI Sync
```

### 5.2 Institution Assessment & Multi-Language Filtering
```
Institution Creates Programming Assessment
         │
         ▼
POST /api/academic/assessments
         ├──> INSERT INTO assessments (type = 'Programming', status = 'DRAFT')
         │
POST /api/academic/assessments/:id/questions
         ├──> INSERT INTO assessment_questions (programming_language_id)
         └──> INSERT INTO question_options (is_correct)
         │
POST /api/academic/assessments/:id/publish
         └──> UPDATE assessments SET status = 'PUBLISHED'
         │
         ▼
Student Loads Assessment (Strict Question Filtering)
         │
         ├──> Query student enrollments -> course_programming_languages
         ├──> Filter assessment_questions matching enrolled languages
         └──> Deliver only eligible questions to Student
         │
         ▼
Student Submits Attempt
         │
         ▼
POST /api/assessments/institution/:id/submit
         ├──> Authoritative server-side evaluation against question_options
         ├──> INSERT INTO assessment_attempts (score, accuracy, status = 'Completed')
         ├──> INSERT INTO assessment_answers (selected_option_id, is_correct)
         └──> Synchronize readiness score via readinessService
```

### 5.3 Candidate Access Request & Pipeline Promotion
```
Institution
  │  POST /api/academic/industry-requests
  ▼
[PostgreSQL] INSERT INTO institution_company_access_requests (status = 'PENDING')
  │
  ├──> Notify Company
  ▼
Company Portal
  │  GET /api/company/student-access-requests (Sees PENDING)
  │  POST /api/company/student-access-requests/:id/accept
  ▼
[PostgreSQL]
  ├── UPDATE institution_company_access_requests SET status = 'ACCEPTED'
  ├── INSERT INTO institution_company_shared_students (access_status = 'ACTIVE')
  └── Notify Institution & Student
  │
  ▼
Company Unlocks Candidate: GET /api/company/candidates/:id (HTTP 200)
  │
  ├──> Schedule Interview: POST /api/company/interviews -> INSERT INTO interviews
  ├──> Advance Stage: UPDATE applications SET current_stage = 'Interview'
  └──> Extend Offer: POST /api/company/applications/:id/offer
            ├── UPDATE applications SET current_stage = 'Selected'
            ├── INSERT INTO application_stage_history (stage = 'Selected')
            ├── INSERT INTO notifications (recipient_id = student.user_id)
            └── INSERT INTO notifications (recipient_id = institution.user_id)
```

---

## 6. Document Upload & Download Security Architecture
- Document metadata is cataloged in `documents` / `resumes` / `projects`.
- All download endpoints (`GET /api/students/documents/:docId/download`) enforce strict ownership authentication:
  - If user is student: must match `document.student_id`.
  - If user is company: candidate must have applied to company opportunity or be authorized via `institution_company_shared_students`.
  - If unauthorized: HTTP 403 Forbidden. No document cross-tenant leakage.
