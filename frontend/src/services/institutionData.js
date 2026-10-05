/**
 * SKILLNEXUS AI — Institution Intelligence Data Service
 * Single source of truth for Academic Workspace:
 * - Comprehensive Student Records (Academic, Skills, Learning, Career)
 * - Company Intelligence & Directory
 * - Company Opportunities (Jobs, Internships, Projects, Hackathons)
 * - Student–Company Matching Engine
 * - Skill Gap Diagnostics (Campus vs Industry)
 * - Course & Training Recommendations (Closed-Loop)
 * - Placement Pipeline & Recruitment Funnels
 * - Institution Analytics & Alerts
 */

const STORAGE_KEYS = {
  OPPORTUNITIES: 'nexus_institution_opportunities',
  COURSES: 'nexus_institution_courses',
  ALERTS: 'nexus_institution_alerts',
  STUDENTS: 'nexus_institution_students_ext'
};

// ─── 1. EXTENDED STUDENT INTELLIGENCE DATABASE ───────────────────────────────
export const INITIAL_INSTITUTION_STUDENTS = [];

// ─── 2. COMPANY DIRECTORY ───────────────────────────────────────────────────
export const COMPANY_DIRECTORY = [];

// ─── 3. COMPANY OPPORTUNITIES ───────────────────────────────────────────────
export const INITIAL_OPPORTUNITIES = [];

// ─── 4. SKILL GAP DIAGNOSTIC MATRIX ─────────────────────────────────────────
export const SKILL_GAP_MATRIX = [];

// ─── 5. INSTITUTION TRAINING PROGRAMS ───────────────────────────────────────
export const INITIAL_TRAINING_PROGRAMS = [];

// ─── 6. PLACEMENT FUNNELS ───────────────────────────────────────────────────
export const PLACEMENT_FUNNELS = [];

// ─── 7. INSTITUTION ALERTS ──────────────────────────────────────────────────
export const INITIAL_INSTITUTION_ALERTS = [];

// ─── HELPER FUNCTIONS & REACTIVE LOCALSTORAGE ACCESSORS ───────────────────────

export function getInstitutionStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && !s.studentId?.startsWith('STU-TN010'));
      }
    }
  } catch (e) {
    console.error('Failed to load institution students', e);
  }
  return INITIAL_INSTITUTION_STUDENTS;
}

export function saveInstitutionStudents(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('nexus_institution_students_changed', { detail: list }));
  } catch (e) {
    console.error('Failed to save institution students', e);
  }
}

export function getInstitutionOpportunities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(o => o && !o.id?.startsWith('opp_'));
      }
    }
  } catch (e) {
    console.error('Failed to load opportunities', e);
  }
  return INITIAL_OPPORTUNITIES;
}

export function saveInstitutionOpportunities(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('nexus_institution_opportunities_changed', { detail: list }));
  } catch (e) {
    console.error('Failed to save opportunities', e);
  }
}

export function approveAndPublishOpportunity(oppId) {
  const list = getInstitutionOpportunities().map(opp => {
    if (opp.id === oppId) {
      return {
        ...opp,
        status: 'Published to Campus',
        approvedByInstitution: true,
        publishedAt: new Date().toISOString().split('T')[0]
      };
    }
    return opp;
  });
  saveInstitutionOpportunities(list);
  return list;
}

export function getInstitutionCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && !c.id?.startsWith('prog_'));
      }
    }
  } catch (e) {
    console.error('Failed to load institution courses', e);
  }
  return INITIAL_TRAINING_PROGRAMS;
}

export function saveInstitutionCourses(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('nexus_institution_courses_changed', { detail: list }));
  } catch (e) {
    console.error('Failed to save courses', e);
  }
}

export function enrollCohortInCourse(courseId) {
  const list = getInstitutionCourses().map(c => {
    if (c.id === courseId) {
      return {
        ...c,
        status: 'Active (Cohort Enrolled)',
        enrolledStudents: c.targetStudentCount
      };
    }
    return c;
  });
  saveInstitutionCourses(list);
  return list;
}

export function getInstitutionAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => a && !a.id?.startsWith('alt_'));
      }
    }
  } catch (e) {
    console.error('Failed to load alerts', e);
  }
  return INITIAL_INSTITUTION_ALERTS;
}

// ─── 8. STUDENT-COMPANY MATCHING ENGINE ───────────────────────────────────────
export function calculateStudentCompanyMatch(student, job) {
  if (!student || !job) return { score: 70, status: 'Strong', matched: [], missing: [], rationale: '' };

  const studentSkills = (student.registeredSkills || []).map(s => s.toLowerCase());
  const required = (job.requiredSkills || []).map(s => s.toLowerCase());

  const matched = [];
  const missing = [];

  required.forEach(req => {
    const isFound = studentSkills.some(stk => stk.includes(req) || req.includes(stk));
    if (isFound) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  });

  const skillCoverage = required.length > 0 ? (matched.length / required.length) * 60 : 40;
  const readinessContribution = ((student.careerReadinessScore || 75) / 100) * 40;
  const totalScore = Math.min(99, Math.round(skillCoverage + readinessContribution));

  let status = '🔴 Gap';
  let badgeColor = 'var(--cyber-rose)';
  if (totalScore >= 90) {
    status = '🟢 Excellent';
    badgeColor = 'var(--cyber-emerald)';
  } else if (totalScore >= 78) {
    status = '🟢 Strong';
    badgeColor = 'var(--cyber-cyan)';
  } else if (totalScore >= 65) {
    status = '🟡 Potential';
    badgeColor = 'var(--cyber-amber)';
  }

  const rationale = `${student.name} matches ${matched.length} of ${required.length} required skills (${matched.join(', ')}). Academic CGPA of ${student.cgpa} and verified readiness of ${student.careerReadinessScore}% provide strong competency backing. Missing skills: ${missing.length > 0 ? missing.join(', ') : 'None'}.`;

  return {
    score: totalScore,
    status,
    badgeColor,
    matched,
    missing,
    rationale,
    readiness: student.careerReadinessScore || 75
  };
}
