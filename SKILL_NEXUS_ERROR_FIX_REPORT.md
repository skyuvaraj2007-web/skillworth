# SKILL NEXUS AI — ERROR FIX & REGRESSION REPORT

## 1. Executive Summary
This document provides a defect-by-defect autopsy of every architectural defect, database bug, and API contract issue discovered and repaired during the full system restoration of **SKILL NEXUS AI**.

---

## 2. Comprehensive Defect Autopsy & Resolution Ledger

### Defect 1: File Database Fallback in `getStudents()` and Data Layer
- **Root Cause**: `relationalManager.getStudents()` fell back to reading and merging with `relational_db.json`. When PostgreSQL queries succeeded, stale legacy records from the JSON file were still concatenated, causing fake student metrics and data leaks.
- **Backend/Database Fix**: Completely eliminated `_read()` and `relational_db.json` merging from `getStudents()`. The method now exclusively queries PostgreSQL tables: `students`, `users`, `departments`, `institutions`, and joins `student_skills`. If PostgreSQL fails, it raises a genuine error.
- **API Contract**: Returns canonical PostgreSQL student representations only.
- **Frontend Impact**: `InstitutionStudentRoster.jsx` and `IndustryPortal.jsx` receive genuine database records.
- **Verification**: Verified via `verify_portal_fixes.js` and `verify_institution_roster.js` (43/43 PASS).

---

### Defect 2: Fake Hardcoded Opportunities in Frontend & Database Disconnect
- **Root Cause**: `frontend/src/pages/Opportunities.jsx` contained a hardcoded static array of dummy opportunities (`opp_01`, `opp_02`, `opp_03`), bypassing backend endpoints. Furthermore, `relationalManager.getOpportunities()` in backend queried non-existent column `c.city` on table `companies` instead of `c.headquarters`.
- **Backend/Database Fix**:
  - Corrected column query in `relationalManager.getOpportunities()` to select `c.headquarters` and `c.state`.
  - Re-implemented `relationalManager.createOpportunity()` to insert into PostgreSQL `opportunities` and `opportunity_skills` joined with company UUID and skill IDs.
  - Linked `matchingService.matchStudentToOpportunity()` to live-compute match scores, matched skills, and missing skills.
- **API Contract**: Added `GET /api/opportunities/:id` returning opportunity detail bundled with explainable match breakdown.
- **Frontend Fix**: Refactored `Opportunities.jsx` to fetch live data from `GET /api/opportunities`, bind to `matchingService` match scores, and submit applications via `POST /api/opportunities/:id/apply` with auth bearer tokens.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 6 & Phase 7.

---

### Defect 3: Student Profile Persistence Missing Snake_Case Attributes
- **Root Cause**: `PUT /api/students/profile` in `studentRoutes.js` only checked camelCase fields (`github`, `githubUrl`), ignoring snake_case parameters sent by REST clients or database representations (`github_url`, `linkedin_url`, `resume_url`, `target_career_role`, `graduation_year`, `placement_status`).
- **Backend/Database Fix**: Updated `PUT /api/students/profile` parameter resolver to accept both camelCase and snake_case variants and persist them directly to `students` table via parameterized SQL UPDATE.
- **API Contract**: Consistent bidirectionally.
- **Frontend Fix**: `MyProfile.jsx` binds to both naming conventions and renders persisted values accurately after save, page refresh, and logout/login cycles.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 3.

---

### Defect 4: Course Creation Violating PostgreSQL Status Check Constraint
- **Root Cause**: `createCourse()` in `relationalManager.js` attempted to insert status `'PUBLISHED'` into `courses`. PostgreSQL table constraint `courses_status_check` strictly allows `['ACTIVE', 'DRAFT', 'ARCHIVED']`. This caused PostgreSQL insert failures and fallback to JSON.
- **Backend/Database Fix**: Updated `createCourse()` to insert status `'ACTIVE'` and inserted corresponding `course_modules` with valid `module_number`.
- **API Contract**: Returns PostgreSQL-generated course UUID and module list.
- **Frontend Fix**: `MyLearning.jsx` and course enrollment pipelines immediately resolve the new course ID.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 4.

---

### Defect 5: Company Candidate Endpoint 404 Fallback
- **Root Cause**: `company.js` defined `GET /api/company/students/:studentId`, but frontend and tests requested `GET /api/company/candidates/:id`. The unmatched route fell through to company details route `GET /api/company/:id` where ID was `'candidates'`, resulting in a 404 error instead of evaluating candidate authorization.
- **Backend/Database Fix**: Added route alias `router.get(['/students/:studentId', '/candidates/:studentId'], ...)` enforcing strict access verification via `isStudentSharedWithCompany()`. Unshared candidates yield HTTP 403 Forbidden; authorized candidates return HTTP 200 with sanitized profile data.
- **API Contract**: Standardized `/api/company/candidates/:id` and `/api/company/students/:id`.
- **Frontend Fix**: `IndustryPortal.jsx` accesses candidate details cleanly through the authorized route.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 6.

---

### Defect 6: Assessment Option Evaluation & Scoring NaN
- **Root Cause**:
  1. `addAssessmentQuestion()` hardcoded `Boolean(opt.isCorrect)`, which evaluated to `false` when options were passed as string arrays with a separate `correctAnswer` attribute.
  2. `submitInstitutionAssessmentAttempt()` looked for column `score_percentage` on `assessment_attempts`, but the PostgreSQL column is named `score`.
- **Backend/Database Fix**:
  - `addAssessmentQuestion()` now evaluates `isCorrect` by comparing option text against `questionData.correctAnswer` and `correctOptionIndex` as well as `opt.isCorrect`.
  - `submitInstitutionAssessmentAttempt()` computes marks deterministically, inserts into `assessment_attempts` (`score`, `accuracy`, `percentile`), and logs individual answers into `assessment_answers`.
- **API Contract**: Returns valid percentage and impact on student readiness score.
- **Frontend Fix**: Assessment summary cards display verified score without NaN.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 5 (100% score verified).

---

### Defect 7: Notification Dispatch Missing Targeted Student & Institution User ID
- **Root Cause**: `addNotification()` in `relationalManager.js` fell back to `SELECT id FROM users WHERE role = 'student' LIMIT 1` when `userId` was omitted. When a company extended an offer to a newly created student, the notification was delivered to the default student (`arun.kumar@cit.edu`) rather than the target student.
- **Backend/Database Fix**: Enhanced `addNotification()` to inspect `notifData.studentId` or `notifData.details?.studentId` and query `students.user_id` to resolve the exact recipient user UUID in PostgreSQL before any role fallback. Also added resolution for `institutionId` via `institution_members`.
- **API Contract**: Real-time cross-portal notification delivery persisted in PostgreSQL `notifications` table.
- **Frontend Fix**: Student notification bell immediately reflects incoming interview schedules and offer letters.
- **Verification**: Verified via `verify_cross_portal_live_workflow.js` Phase 7.

---

## 3. Summary of Files Changed Across System

### Backend Core & Data Layer
- `backend/src/db/relationalManager.js`:
  - Removed file fallback in `getStudents()`, `getApplicationsByCompany()`, `getOpportunities()`.
  - Fixed PostgreSQL company column (`headquarters`).
  - Added PostgreSQL persistence for `createCourse()` with check constraint `'ACTIVE'`.
  - Added option text matching in `addAssessmentQuestion()`.
  - Added targeted recipient resolution in `addNotification()`.
  - Added stage history insertion in `createOffer()`.
- `backend/src/routes/studentRoutes.js`:
  - Supported snake_case and camelCase in `PUT /api/students/profile`.
  - Fixed document download route to scope by authenticated student.
- `backend/src/routes/skills.js`:
  - Added support for `skillName` and `proficiency` aliases in `POST /api/skills`.
- `backend/src/routes/opportunities.js`:
  - Added `GET /api/opportunities/:id` with `matchingService` integration.
- `backend/src/routes/company.js`:
  - Added `/candidates/:studentId` alias with strict authorization check (HTTP 403 when unshared).

### Frontend Services & Components
- `frontend/src/services/profileStore.js`:
  - Replaced hardcoded `DEFAULT_PROFILE` with pure `EMPTY_PROFILE` zero-state.
- `frontend/src/pages/MyProfile.jsx`:
  - Integrated `PUT /api/students/profile` with real persistence.
- `frontend/src/pages/Opportunities.jsx`:
  - Removed static array; wired to `GET /api/opportunities` and `POST /api/opportunities/:id/apply`.
- `frontend/src/pages/IndustryPortal.jsx`:
  - Removed `getAllRelationalStudents()` global leak; wired to company candidate endpoints.
- `frontend/src/components/institution/InstitutionStudentDetails.jsx`:
  - Removed mock fallback; wired to live student API.

### Verification Suites Added & Verified
- `backend/tests/verify_cross_portal_live_workflow.js`: **20 / 20 PASSED**
- `scratch/database_audit.js`: **11 / 11 PASSED** (97 active FKs, 0 duplicate emails/apps/enrollments, 0 orphan students).
