/**
 * SKILLNEXUS AI — Student Data Store & Institution Linking Service
 * Single source of truth for student records, college mapping, and institution roster queries.
 */

import { getCollegeById } from './collegeDirectory';

const STORAGE_KEY = 'nexus_students';

// Initial realistic student seed across key Tamil Nadu colleges
// Production empty state: students created only through real user registration
const INITIAL_STUDENTS = [];

/**
 * Load all students from storage (or seed if uninitialized).
 */
export function getAllStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading students from storage:', e);
    return INITIAL_STUDENTS;
  }
}

/**
 * Get students registered strictly under a specific institution's collegeId.
 * Guarantees institution data isolation: Institution A never sees Institution B students.
 */
export function getStudentsByCollegeId(collegeId) {
  if (!collegeId) return [];
  const all = getAllStudents();
  const targetId = collegeId.toUpperCase().trim();

  return all.filter(s => {
    if (!s.collegeId) return false;
    const sId = s.collegeId.toUpperCase().trim();
    if (sId === targetId) return true;

    // Backward-compatible alias matching for demo institutions
    if ((targetId === 'TN010' || targetId === 'TN-DEEM-0001') && (sId === 'TN010' || sId === 'TN-DEEM-0001')) return true;
    if ((targetId === 'TN001' || targetId === 'TN-UNIV-0002') && (sId === 'TN001' || sId === 'TN-UNIV-0002')) return true;
    if ((targetId === 'TN030' || targetId === 'TN-ENG-0007') && (sId === 'TN030' || sId === 'TN-ENG-0007')) return true;
    if ((targetId === 'TN020' || targetId === 'TN-DEEM-0003') && (sId === 'TN020' || sId === 'TN-DEEM-0003')) return true;
    if ((targetId === 'TN051' || targetId === 'TN-ENG-0003') && (sId === 'TN051' || sId === 'TN-ENG-0003')) return true;

    return false;
  });
}

/**
 * Get a single student by ID.
 */
export function getStudentById(studentId) {
  const all = getAllStudents();
  return all.find(s => s.studentId === studentId) || null;
}

/**
 * Register a new student into the directory.
 * Automatically resolves college information from the college directory.
 */
export function registerStudent(studentData) {
  const all = getAllStudents();

  // Resolve official college
  const college = getCollegeById(studentData.collegeId);
  const officialCollegeName = college ? college.collegeName : (studentData.collegeName || 'Tamil Nadu Institution');

  // Compute clean studentId if not provided
  const idPrefix = studentData.collegeId ? `STU-${studentData.collegeId}` : 'STU-TN';
  const newStudentId = studentData.studentId || `${idPrefix}-${(all.length + 101).toString().padStart(3, '0')}`;

  const newStudent = {
    studentId: newStudentId,
    name: studentData.name || studentData.fullName || 'Student',
    email: studentData.email,
    collegeId: studentData.collegeId,
    collegeName: officialCollegeName,
    department: studentData.department || studentData.degree || 'CSE',
    year: studentData.year || 'III Year',
    status: 'Active',
    skills: studentData.skills && studentData.skills.length ? studentData.skills : [],
    learningProgress: studentData.learningProgress || 0,
    assessments: studentData.assessments || {},
    projects: studentData.projects || [],
    verifiedSkills: studentData.verifiedSkills || [],
    hasCompletedQuestionnaire: false,
    registeredAt: new Date().toISOString(),
    avatar: studentData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentData.name || 'nexus')}`
  };

  const updated = [newStudent, ...all];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving new student:', e);
  }

  // Dispatch live update event for real-time reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_students_updated', {
      detail: { student: newStudent, collegeId: newStudent.collegeId }
    }));
  }

  return newStudent;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT & CREDENTIAL STORE (Learning Page)
// ─────────────────────────────────────────────────────────────────────────────

const ENROLLMENT_KEY = 'nexus_enrollments';
const CREDENTIAL_KEY = 'nexus_credentials';

/** Return all enrollments for a student (by email or studentId) */
export function getEnrollments(identifier) {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(e => e.studentId === identifier || e.email === identifier);
  } catch { return []; }
}

/** Enroll a student in a course. Prevents duplicates. Returns { ok, enrollment }. */
export function enrollCourse(studentId, email, course) {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const dup = all.find(e => (e.studentId === studentId || e.email === email) && e.courseId === course.courseId);
    if (dup) return { ok: false, reason: 'already_enrolled', enrollment: dup };

    const enrollment = {
      enrollmentId: `ENR-${Date.now()}`,
      studentId,
      email,
      courseId: course.courseId,
      courseTitle: course.title,
      category: course.category,
      collegeId: course.collegeId,
      progress: 0,
      completedModules: 0,
      totalModules: course.totalModules || 12,
      hoursRemaining: course.durationWeeks ? course.durationWeeks * 3 : 24,
      currentModule: `Module 1: ${course.module1 || 'Introduction'}`,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };

    all.unshift(enrollment);
    localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('nexus_enrollment_updated', { detail: enrollment }));
    return { ok: true, enrollment };
  } catch (e) {
    console.error('enrollCourse error:', e);
    return { ok: false, reason: 'error' };
  }
}

/** Advance one module for an enrollment */
export function advanceModule(enrollmentId) {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(e => e.enrollmentId === enrollmentId);
    if (idx === -1) return null;

    const e = all[idx];
    const newMod = Math.min(e.totalModules, e.completedModules + 1);
    const newPct = Math.round((newMod / e.totalModules) * 100);
    all[idx] = {
      ...e,
      completedModules: newMod,
      progress: newPct,
      hoursRemaining: Math.max(0, e.hoursRemaining - 2),
      currentModule: `Module ${newMod + 1}: Lesson ${newMod + 1}`,
      status: newPct >= 100 ? 'completed' : 'active',
      completedAt: newPct >= 100 ? new Date().toISOString() : undefined
    };

    localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(all));

    // Auto-issue credential on completion
    if (newPct >= 100) {
      issueCredential(e.studentId, e.email, all[idx]);
    }

    window.dispatchEvent(new CustomEvent('nexus_enrollment_updated', { detail: all[idx] }));
    return all[idx];
  } catch { return null; }
}

/** Issue a credential when a course completes */
export function issueCredential(studentId, email, enrollment) {
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const dup = all.find(c => c.courseId === enrollment.courseId && (c.studentId === studentId || c.email === email));
    if (dup) return dup;

    const cred = {
      credentialId: `NX-${Math.random().toString(36).slice(2,6).toUpperCase()}-${enrollment.category?.slice(0,3) || 'GEN'}`,
      studentId,
      email,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      category: enrollment.category,
      issuedAt: new Date().toISOString(),
      type: 'Certificate',
      level: 'Intermediate',
      score: Math.floor(Math.random() * 20 + 75) + '%',
      badgeUrl: null
    };

    all.unshift(cred);
    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('nexus_credential_issued', { detail: cred }));
    return cred;
  } catch { return null; }
}

/** Get all credentials for a student */
export function getCredentials(identifier) {
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(c => c.studentId === identifier || c.email === identifier);
  } catch { return []; }
}

export function seedDemoEnrollments() {
  // Demo seed disabled - live database is single source of truth
  return;
}
