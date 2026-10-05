# SKILL NEXUS AI — DASHBOARD DATA LINEAGE

## 1. Scope & Lineage Guarantee
This document details the exact end-to-end data lineage for every metric, card, table, and graph across the Student, Institution, and Industry portals. 

For each component, the lineage follows:
$$\text{PostgreSQL Query} \longrightarrow \text{Backend Transformation} \longrightarrow \text{API Contract} \longrightarrow \text{Frontend State \& Rendered UI}$$

---

## 2. Student Portal Data Lineage

### 2.1 Student Home — Metric Cards & Readiness Gauge
- **UI Element**: Readiness Gauge (Circular indicator displaying percentage), "Verified Skills", "Projects Completed", "Courses Completed", "Active Applications".
- **PostgreSQL Queries**:
  ```sql
  -- 1. Student Identity & Readiness
  SELECT s.id, s.readiness_score, s.cgpa, s.target_career_role, s.bio, s.placement_status
  FROM students s WHERE s.user_id = $1;

  -- 2. Verified Skills
  SELECT count(*) AS verified_count
  FROM student_skills
  WHERE student_id = $1 AND verification_status = 'VERIFIED';

  -- 3. Completed Projects & Proofs
  SELECT count(*) AS projects_count
  FROM projects p
  WHERE p.student_id = $1 AND p.verification_status = 'VERIFIED';

  -- 4. Course Enrollments & Progress
  SELECT count(*) AS enrolled_count,
         count(*) FILTER (WHERE status = 'Completed') AS completed_count
  FROM enrollments
  WHERE student_id = $1;

  -- 5. Applications
  SELECT count(*) AS app_count
  FROM applications
  WHERE student_id = $1;
  ```
- **Backend Service Transformation** (`readinessService.js`):
  ```javascript
  // Weighted single authoritative readiness formula
  readiness = (
    skillVerification * 0.30 +
    diagnosticScore * 0.25 +
    projectProofScore * 0.20 +
    learningProgress * 0.15 +
    careerCompleteness * 0.10
  );
  ```
- **API Payload** (`GET /api/profile` & `GET /api/nexus/readiness/:studentId`):
  ```json
  {
    "success": true,
    "data": {
      "skillsVerified": 7,
      "projectsCompleted": 2,
      "coursesCompleted": 1,
      "careerReadiness": 31,
      "readinessBreakdown": {
        "skillVerification": 30,
        "diagnosticScore": 25,
        "projectProofScore": 20,
        "learningProgress": 15,
        "careerCompleteness": 10
      }
    }
  }
  ```
- **Frontend State**: `profileStore.js` $\to$ `StudentDashboard.jsx` lines 180–220:
  - `<ReadinessRing value={stats.careerReadiness} />`
  - `<StatCard title="Verified Skills" value={stats.skillsVerified} />`

### 2.2 Student Profile — Detailed Fields
- **UI Element**: Profile header, Bio paragraph, Social Links (GitHub, LinkedIn, Resume PDF), Academic Status, Skills List.
- **PostgreSQL Query**:
  ```sql
  SELECT s.id, s.full_name, s.roll_number, s.phone_number, s.bio, s.cgpa,
         s.batch, s.graduation_year, s.target_career_role, s.placement_status,
         s.github_url, s.linkedin_url, s.resume_url, d.name AS department_name
  FROM students s
  JOIN users u ON s.user_id = u.id
  LEFT JOIN departments d ON s.department_id = d.id
  WHERE s.id = $1;
  ```
- **API Payload** (`GET /api/students/profile`):
  ```json
  {
    "success": true,
    "data": {
      "id": "22022994-9d39-4f23-bbfe-6beea41dd678",
      "fullName": "Arun Kumar",
      "email": "arun.kumar@cit.edu",
      "bio": "Aspiring Full Stack Engineer passionate about distributed systems.",
      "githubUrl": "https://github.com/arunkumar",
      "linkedinUrl": "https://linkedin.com/in/arunkumar",
      "resumeUrl": "https://storage.skillnexus.ai/resumes/arun.pdf",
      "targetCareerRole": "Full Stack Engineer",
      "skills": [...]
    }
  }
  ```
- **Frontend State**: `MyProfile.jsx` binds directly to `profile.fullName`, `profile.githubUrl`, `profile.bio`. Mutated exclusively via `PUT /api/students/profile`.

### 2.3 Opportunities Page & Explainable Match Radar
- **UI Element**: Opportunity cards, match percentage badges, matched skills tags, missing skills tags, "Apply" button.
- **PostgreSQL Query**:
  ```sql
  SELECT o.id, o.title, o.opportunity_type, o.work_mode, o.location,
         o.stipend_text, o.min_cgpa, o.deadline, o.status,
         c.company_name, c.logo_url,
         json_agg(json_build_object(
           'name', s.name,
           'requiredLevel', os.required_level,
           'importance', os.importance
         )) AS required_skills
  FROM opportunities o
  JOIN companies c ON o.company_id = c.id
  LEFT JOIN opportunity_skills os ON o.id = os.opportunity_id
  LEFT JOIN skills s ON os.skill_id = s.id
  WHERE o.status = 'ACTIVE'
  GROUP BY o.id, c.company_name, c.logo_url;
  ```
- **Backend Service Transformation** (`matchingService.js`):
  ```javascript
  const match = matchStudentToOpportunity(studentId, opp.id);
  // Calculates matched skills, missing skills, and weighted cosine similarity score
  ```
- **API Payload** (`GET /api/opportunities`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e22a4901-381c-4fe8-8b9a-7a5441d8b671",
        "title": "Full Stack Systems Engineer Intern",
        "company": "TechCorp Global Systems",
        "matchScore": 85,
        "matchedSkills": ["Python", "SQL", "React"],
        "missingSkills": ["Docker"],
        "explanation": "Student matches 3 of 4 required skills."
      }
    ]
  }
  ```
- **Frontend State**: `Opportunities.jsx` renders `<OpportunityCard matchScore={opp.matchScore} ... />`.

---

## 3. Academic / Institution Portal Data Lineage

### 3.1 Institution Dashboard Overview
- **UI Element**: "Total Students Enrolled", "Active Verified Courses", "Cohort Avg Readiness", "Active Placement Drives".
- **PostgreSQL Queries**:
  ```sql
  -- Cohort count & Avg Readiness
  SELECT count(*) AS total_students,
         coalesce(round(avg(s.readiness_score)), 0) AS avg_readiness
  FROM students s
  WHERE s.institution_id = $1;

  -- Active Courses
  SELECT count(*) AS total_courses
  FROM courses c
  WHERE c.institution_id = $1 AND c.status = 'ACTIVE';

  -- Active Placement Drives
  SELECT count(*) AS active_drives
  FROM placement_drives pd
  WHERE pd.institution_id = $1 AND pd.status = 'ACTIVE';
  ```
- **API Payload** (`GET /api/academic/dashboard`):
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 55,
      "totalCourses": 3,
      "averageReadiness": 7,
      "activePlacementDrives": 2
    }
  }
  ```
- **Frontend State**: `AcademicPortal.jsx` displays top-level KPIs.

### 3.2 Institution Student Roster Table
- **UI Element**: Student search, filtering by department, student rows (Roll Number, Name, Department, CGPA, Verified Skills, Readiness, Placement Status).
- **PostgreSQL Query**:
  ```sql
  SELECT s.id, s.roll_number AS "rollNumber", s.full_name AS "name",
         d.name AS "department", s.cgpa, s.readiness_score AS "readinessScore",
         s.placement_status AS "placementStatus",
         coalesce(count(ss.id) FILTER (WHERE ss.verification_status = 'VERIFIED'), 0) AS "verifiedSkillsCount"
  FROM students s
  JOIN users u ON s.user_id = u.id
  LEFT JOIN departments d ON s.department_id = d.id
  LEFT JOIN student_skills ss ON s.id = ss.student_id
  WHERE s.institution_id = $1
  GROUP BY s.id, s.roll_number, s.full_name, d.name, s.cgpa, s.readiness_score, s.placement_status
  ORDER BY s.full_name ASC;
  ```
- **API Payload** (`GET /api/academic/students`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "STU-TN010-001",
        "name": "Ananya Iyer",
        "department": "Computer Science & Engineering",
        "cgpa": "9.10",
        "readinessScore": 78,
        "placementStatus": "Placed"
      }
    ]
  }
  ```
- **Frontend State**: `InstitutionStudentRoster.jsx` renders DataTable rows directly mapped from `student.rollNumber` and `student.readinessScore`.

---

## 4. Industry / Company Portal Data Lineage

### 4.1 Company Dashboard KPIs & Talent Pool
- **UI Element**: "Active Postings", "Total Applications Received", "Shortlisted Candidates", "Scheduled Interviews".
- **PostgreSQL Queries**:
  ```sql
  -- 1. Opportunities posted by company
  SELECT count(*) AS active_postings
  FROM opportunities
  WHERE company_id = $1 AND status = 'ACTIVE';

  -- 2. Applications submitted to company's opportunities
  SELECT count(*) AS total_applications,
         count(*) FILTER (WHERE a.current_stage IN ('Shortlisted', 'Interview', 'Selected')) AS active_candidates
  FROM applications a
  JOIN opportunities o ON a.opportunity_id = o.id
  WHERE o.company_id = $1;

  -- 3. Scheduled interviews
  SELECT count(*) AS total_interviews
  FROM interviews iv
  JOIN applications a ON iv.application_id = a.id
  JOIN opportunities o ON a.opportunity_id = o.id
  WHERE o.company_id = $1 AND iv.status = 'Scheduled';
  ```
- **API Payload** (`GET /api/company/dashboard`):
  ```json
  {
    "success": true,
    "data": {
      "activePostings": 9,
      "totalApplications": 20,
      "shortlistedCandidates": 12,
      "scheduledInterviews": 4
    }
  }
  ```

### 4.2 Candidate Access & Development Timeline
- **UI Element**: Candidate Profile Modal, Chronological Development Timeline (Skill additions, assessment attempts, course module completions, interview invitations, offer letters).
- **PostgreSQL Aggregation Query**:
  ```sql
  -- Strictly checks authorization first
  SELECT 1 FROM institution_company_shared_students
  WHERE company_id = $1 AND student_id = $2 AND access_status = 'ACTIVE'
  UNION
  SELECT 1 FROM applications a
  JOIN opportunities o ON a.opportunity_id = o.id
  WHERE o.company_id = $1 AND a.student_id = $2;
  ```
  If authorized, executes union across:
  - `student_skills` (skill claimed and verified dates)
  - `assessment_attempts` (attempt dates and scores)
  - `student_module_progress` (module completed timestamps)
  - `applications` & `application_stage_history` (application progression)
  - `interviews` (scheduled times and feedback)
- **API Payload** (`GET /api/company/students/:id/development`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "EVT-01",
        "type": "skill_verified",
        "title": "Python Skill Verified",
        "timestamp": "2026-09-06T18:30:00Z"
      },
      {
        "id": "EVT-02",
        "type": "assessment_completed",
        "title": "Programming Diagnostics Passed (100%)",
        "timestamp": "2026-09-06T19:15:00Z"
      }
    ]
  }
  ```
- **Frontend State**: `CandidateTimeline.jsx` renders historical nodes sorted strictly by `event.timestamp`. No mock dates ("2 days ago") are hardcoded.
