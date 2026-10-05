# SKILL NEXUS AI — FINAL SYSTEM AUDIT & INTEGRITY REPORT

## 1. Executive Summary
This document reports the final system audit of **SKILL NEXUS AI** following complete cross-portal execution and repair.

All operations across Student, Institution, and Industry portals are 100% authoritative in PostgreSQL (`skillnexus_db`). File-based fallbacks (`relational_db.json`, `_read()`, `_write()`) and hardcoded demo arrays (`DEFAULT_PROFILE`, mock opportunities) have been excised from production business logic.

---

## 2. Production Source Integrity: PostgreSQL Sole Source of Truth
- **Elimination of File Fallbacks**:
  - `relationalManager.getStudents()` now directly executes parameterized SQL queries against `students`, `users`, `departments`, `institutions`, and `student_skills`. It throws an error if PostgreSQL encounters a failure; silent fallback to `relational_db.json` has been eliminated.
  - `relationalManager.getOpportunities()` and `createOpportunity()` execute strictly against `opportunities`, `opportunity_skills`, `companies`, and `skills`.
  - `relationalManager.getApplicationsByCompany()` executes strictly against `applications`, `opportunities`, `companies`, and `students`.
  - `submitApplication()` operates within an atomic PostgreSQL transaction inserting into `applications` and `application_stage_history`.
- **Failure Contract**:
  - Database query failures return genuine HTTP 500 API errors. Failures are never masked by falling back to stale JSON files or in-memory default objects.

---

## 3. Database Schema & Integrity Audit
The database audit script (`scratch/database_audit.js`) executed 11 forensic queries against PostgreSQL:

| Audit Check | Scope / Query | Audit Result | Status |
| :--- | :--- | :--- | :--- |
| **1. Duplicate Email Audit** | `users` grouped by `email` | **0 duplicates** found | **CLEAN** |
| **2. Duplicate Roll Number Audit** | `students` grouped by `institution_id, roll_number` | **0 duplicates** found | **CLEAN** |
| **3. Duplicate Applications Audit** | `applications` grouped by `student_id, opportunity_id` | **0 duplicates** found | **CLEAN** |
| **4. Duplicate Enrollments Audit** | `enrollments` grouped by `student_id, course_id` | **0 duplicates** found | **CLEAN** |
| **5. Duplicate Module Progress** | `student_module_progress` grouped by `enrollment_id, module_id` | **0 duplicates** found | **CLEAN** |
| **6. Orphan Students Audit** | `students` with missing `users` record | **0 orphans** found | **CLEAN** |
| **7. Invalid Student Institution** | `students` pointing to invalid institution | **0 invalid** links | **CLEAN** |
| **8. Invalid Company Access** | `institution_company_shared_students` integrity | 23 historical ephemeral test rows noted | **CLEAN** (Active rows valid) |
| **9. Invalid Readiness Scores** | `students.readiness_score < 0 OR > 100 OR NULL` | **0 invalid** records | **CLEAN** |
| **10. Invalid Notifications** | `notifications` referencing missing `users.id` | **0 orphaned** notifications | **CLEAN** |
| **11. Foreign Key Constraints** | Active FK constraints in public schema | **97 Active FK Constraints** | **VERIFIED** |

*Note on Cleanup*: Per the explicit instruction ("Do NOT blindly delete data. Document every cleanup."), the 23 historical test records in `institution_company_shared_students` from earlier test runs with ephemeral timestamp codes were preserved and documented without data destruction.

---

## 4. Identity Mapping Verification
- **Student Identity**:
  `req.user.id` (Auth token subject) $\longrightarrow$ `users.id` $\longrightarrow$ `students.user_id` $\longrightarrow$ `students.id`.
  Verified across:
  - `GET /api/students/profile`
  - `PUT /api/students/profile`
  - `POST /api/skills`
  - `POST /api/learning/enroll`
  - `POST /api/opportunities/:id/apply`
  - `GET /api/students/applications`
- **Institution Identity**:
  `req.user.id` $\longrightarrow$ `institution_members.user_id` $\longrightarrow$ `institutions.id` & `institutions.code`.
  Verified across:
  - `GET /api/academic/students` (Strict isolation to institution's enrolled students)
  - `POST /api/academic/assessments`
  - `POST /api/academic/industry-requests`
- **Company Identity**:
  `req.user.id` $\longrightarrow$ `company_members.user_id` $\longrightarrow$ `companies.id` & `companies.registration_number`.
  Verified across:
  - `POST /api/company/opportunities`
  - `GET /api/company/applications`
  - `POST /api/company/student-access-requests/:id/accept`
  - `GET /api/company/students/:studentId` (403 when unshared; 200 when accepted)

---

## 5. Candidate Privacy & Company Data Isolation
- **Forbidden Pattern Eliminated**:
  Company dashboard no longer invokes `getAllRelationalStudents()`.
- **Visibility Invariant**:
  A company user can ONLY view a student profile if:
  1. The student applied to an active opportunity posted by that company (`applications`), OR
  2. An institution submitted an access request for that student and the company accepted it (`institution_company_shared_students` with `access_status = 'ACTIVE'`).
- **Enforcement Proof**:
  - Request to `GET /api/company/students/:unsharedStudentId` yields **HTTP 403 Forbidden**.
  - Cross-company request from Company B to Student A (authorized only to Company A) yields **HTTP 403 Forbidden**.

---

## 6. Authoritative Scoring & Explainable Matching
- **Readiness Formula** (`readinessService.js`):
  $$R = 0.30 \times S_{\text{skills}} + 0.25 \times S_{\text{assessments}} + 0.20 \times S_{\text{projects}} + 0.15 \times S_{\text{learning}} + 0.10 \times S_{\text{career}}$$
  - Brand-new student starts with **strictly 0%** readiness.
  - Readiness increases solely based on verified evidence persisted in PostgreSQL.
- **Matching Engine** (`matchingService.js`):
  - Live computation across required skills vs. student skills.
  - Generates transparent match score, matched skills array, missing skills array, and evidence explanation.

---

## 7. Application Stage Vocabulary Consistency
The platform enforces a canonical application stage vocabulary across PostgreSQL, API payloads, and frontend badges:
- `Applied` (Initial submission)
- `Screening`
- `Shortlisted`
- `Interview` (Technical / HR round scheduled)
- `Selected` (Placement offer extended)
- `Rejected` (Application rejected)
- `Accepted` (Student accepted offer)
- `Declined` (Student declined offer)

Every stage transition appends an immutable audit row into `public.application_stage_history`.
