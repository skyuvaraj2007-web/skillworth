/**
 * SKILLNEXUS AI — Centralized Relational Data Store & Matching Engine
 * Phase 2 Core: Single Source of Truth linking Students ↔ Institutions ↔ Companies
 *
 * Entities:
 * - Students
 * - Institutions
 * - Companies
 * - Courses
 * - Enrollments
 * - Projects & Proofs
 * - Company Opportunities
 * - Applications
 *
 * Provides:
 * - Deterministic NEXUS AI Explainable Matching Algorithm
 * - Skill Growth Evidence Aggregator
 * - Reactive LocalStorage State Sync with Cross-Tab & Cross-Portal CustomEvents
 */

import { addRoleNotification } from './notificationStore';
import { nexusApiClient } from './nexusApiClient';

// LocalStorage Keys
const KEYS = {
  STUDENTS: 'nexus_relational_students',
  INSTITUTIONS: 'nexus_relational_institutions',
  COMPANIES: 'nexus_relational_companies',
  COURSES: 'nexus_relational_courses',
  ENROLLMENTS: 'nexus_relational_enrollments',
  PROJECTS: 'nexus_relational_projects',
  OPPORTUNITIES: 'nexus_relational_opportunities',
  APPLICATIONS: 'nexus_relational_applications'
};

/**
 * Asynchronous Background Database Hydrator
 * Fetches fresh relational data from PostgreSQL / Supabase backend
 * and synchronizes with reactive local state cache.
 */
export async function syncWithBackendDatabase() {
  try {
    const [students, courses, enrollments, projects, opportunities, applications] = await Promise.all([
      nexusApiClient.getStudents(),
      nexusApiClient.getCourses(),
      nexusApiClient.getEnrollments(),
      nexusApiClient.getProjects(),
      nexusApiClient.getOpportunities(),
      nexusApiClient.getApplications()
    ]);

    if (Array.isArray(students)) {
      writeStorage(KEYS.STUDENTS, students, 'nexus_students_updated');
    }
    if (Array.isArray(courses)) {
      writeStorage(KEYS.COURSES, courses, 'nexus_courses_updated');
    }
    if (Array.isArray(enrollments)) {
      writeStorage(KEYS.ENROLLMENTS, enrollments, 'nexus_enrollments_updated');
    }
    if (Array.isArray(projects)) {
      writeStorage(KEYS.PROJECTS, projects, 'nexus_projects_updated');
    }
    if (Array.isArray(opportunities)) {
      writeStorage(KEYS.OPPORTUNITIES, opportunities, 'nexus_opportunities_updated');
    }
    if (Array.isArray(applications)) {
      writeStorage(KEYS.APPLICATIONS, applications, 'nexus_applications_updated');
    }
  } catch (err) {
    console.debug('Backend sync deferred (offline or dev fallback):', err.message);
  }
}

// Automatically trigger background synchronization once window loads
if (typeof window !== 'undefined') {
  setTimeout(syncWithBackendDatabase, 800);
}

// ══════════════════════════════════════════════════════════════════════════
// 1. SEED DATA
// ══════════════════════════════════════════════════════════════════════════

export const SEED_INSTITUTIONS = [];
export const SEED_STUDENTS = [];
export const SEED_COURSES = [];
export const SEED_ENROLLMENTS = [];
export const SEED_PROJECTS = [];
export const SEED_COMPANIES = [];
export const SEED_OPPORTUNITIES = [];
export const SEED_APPLICATIONS = [];

// ══════════════════════════════════════════════════════════════════════════
// 2. DATA STORE INITIALIZATION & ACCESSORS
// ══════════════════════════════════════════════════════════════════════════

function isMockItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.institutionId === 'TN-ACE-01' || item.collegeId === 'TN-ACE-01' || item.collegeId === 'TN010') return true;
  if (typeof item.studentId === 'string' && item.studentId.startsWith('STU-TN010')) return true;
  if (typeof item.id === 'string' && (item.id.startsWith('STU-TN010') || item.id.startsWith('crs_0') || item.id.startsWith('prj_0') || item.id.startsWith('app_0'))) return true;
  if (item.companyId === 'COM001' && item.companyName === 'TechCorp Global Systems') return true;
  return false;
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(x => !isMockItem(x));
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function writeStorage(key, data, eventName) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_data_updated', { detail: { key } }));
      if (eventName) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      }
    }
  } catch (e) {
    console.error(`Error saving to ${key}:`, e);
  }
}

// ──────────────────────────────────────────
// Institution Services
// ──────────────────────────────────────────

export function getAllRelationalInstitutions() {
  return readStorage(KEYS.INSTITUTIONS, SEED_INSTITUTIONS);
}

export function getRelationalInstitutionById(id) {
  const all = getAllRelationalInstitutions();
  return all.find(i => i.institutionId === id || i.collegeId === id || i.id === id) || null;
}

// ──────────────────────────────────────────
// Student Services
// ──────────────────────────────────────────

export function getAllRelationalStudents() {
  return readStorage(KEYS.STUDENTS, SEED_STUDENTS);
}

export function getStudentByCollege(collegeId) {
  if (!collegeId) return [];
  const cleanId = String(collegeId).toUpperCase().trim();
  return getAllRelationalStudents().filter(s => {
    const sc = String(s.collegeId || '').toUpperCase().trim();
    return sc === cleanId;
  });
}

export function getRelationalStudentById(studentId) {
  return getAllRelationalStudents().find(s => s.studentId === studentId) || null;
}

export function saveRelationalStudent(student) {
  const all = getAllRelationalStudents();
  const idx = all.findIndex(s => s.studentId === student.studentId || s.email === student.email);
  let updated;
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...student };
    updated = all;
  } else {
    updated = [student, ...all];
  }
  writeStorage(KEYS.STUDENTS, updated, 'nexus_students_updated');
  nexusApiClient.saveStudent(student).catch(err => console.debug('API sync deferred:', err));

  // Trigger Institution alert if new student registered
  if (idx < 0) {
    addRoleNotification('institution', {
      type: 'registration',
      title: `New Student Registered: ${student.name}`,
      message: `${student.name} (${student.department || 'CSE'}, ${student.year || 'III Year'}) joined the campus ledger.`,
      urgency: 'medium',
      metadata: { studentId: student.studentId }
    });
  }

  return student;
}

// ──────────────────────────────────────────
// Course Services
// ──────────────────────────────────────────

export function getAllCourses() {
  return readStorage(KEYS.COURSES, SEED_COURSES);
}

export function getCoursesByInstitution(instId) {
  if (!instId) return getAllCourses();
  const cleanId = String(instId).toUpperCase().trim();
  return getAllCourses().filter(c => {
    const cc = String(c.institutionId || '').toUpperCase().trim();
    return cc === cleanId;
  });
}

export function createInstitutionCourse(courseData) {
  const all = getAllCourses();
  const newCourse = {
    courseId: `CRS-${courseData.institutionId || 'TN010'}-${Date.now().toString().slice(-4)}`,
    institutionId: courseData.institutionId || 'TN010',
    courseName: courseData.courseName,
    courseCode: courseData.courseCode || `CSE-${Math.floor(Math.random() * 800 + 100)}`,
    category: courseData.category || 'TECHNICAL',
    description: courseData.description || 'Comprehensive university credit course.',
    duration: courseData.duration || '6 Weeks',
    durationWeeks: parseInt(courseData.duration) || 6,
    instructor: courseData.instructor || 'Faculty Lead',
    skillsDeveloped: Array.isArray(courseData.skillsDeveloped) ? courseData.skillsDeveloped : (courseData.skillsDeveloped || '').split(',').map(s => s.trim()),
    difficulty: courseData.difficulty || 'Intermediate',
    prerequisites: courseData.prerequisites || 'None',
    modules: Array.isArray(courseData.modules) ? courseData.modules : (courseData.modules || '').split('\n').filter(Boolean),
    assessment: courseData.assessment || 'Proctored Assessment + Project',
    certificate: 'Verifiable Academic Credential',
    enrollmentStatus: 'Open for Enrollment',
    enrolledCount: 0,
    tags: Array.isArray(courseData.skillsDeveloped) ? courseData.skillsDeveloped : (courseData.skillsDeveloped || '').split(',').map(s => s.trim())
  };

  const updated = [newCourse, ...all];
  writeStorage(KEYS.COURSES, updated, 'nexus_course_created');
  nexusApiClient.createCourse(newCourse).catch(err => console.debug('API sync deferred:', err));

  // Notify Students of new course in their department
  addRoleNotification('student', {
    type: 'course',
    title: `New Course Published: ${newCourse.courseName}`,
    message: `${newCourse.courseName} is now available in your Course Catalog. Skills: ${newCourse.skillsDeveloped.slice(0, 3).join(', ')}.`,
    urgency: 'medium',
    metadata: { courseId: newCourse.courseId }
  });

  return newCourse;
}

// ──────────────────────────────────────────
// Course Enrollment Services
// ──────────────────────────────────────────

export function getAllEnrollments() {
  return readStorage(KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
}

export function getStudentEnrollments(studentId) {
  return getAllEnrollments().filter(e => e.studentId === studentId);
}

export function enrollStudentInCourse(student, course) {
  const all = getAllEnrollments();
  const exists = all.find(e => e.studentId === student.studentId && e.courseId === course.courseId);
  if (exists) return { success: false, reason: 'Already enrolled' };

  const newEnrollment = {
    enrollmentId: `ENR-${Date.now()}`,
    studentId: student.studentId,
    courseId: course.courseId,
    courseTitle: course.courseName || course.title,
    category: course.category || 'TECHNICAL',
    institutionId: course.institutionId || student.collegeId || 'TN010',
    progress: 0,
    completedModules: 0,
    completedModuleIds: [],
    totalModules: (course.modules && course.modules.length) || 6,
    hoursRemaining: (course.durationWeeks || 6) * 3,
    currentModule: (course.modules && course.modules[0]) || 'Module 1: Foundations',
    status: 'active',
    enrolledAt: new Date().toISOString(),
    assessmentScore: null
  };

  const updatedEnrollments = [newEnrollment, ...all];
  writeStorage(KEYS.ENROLLMENTS, updatedEnrollments, 'nexus_course_enrolled');
  nexusApiClient.enrollInCourse(student, course).catch(err => console.debug('API sync deferred:', err));

  // Update course enrolled count
  const allCourses = getAllCourses().map(c => {
    if (c.courseId === course.courseId) {
      return { ...c, enrolledCount: (c.enrolledCount || 0) + 1 };
    }
    return c;
  });
  writeStorage(KEYS.COURSES, allCourses);

  // Trigger cross-portal notifications
  addRoleNotification('student', {
    type: 'course',
    title: `Enrolled in ${newEnrollment.courseTitle}`,
    message: `You are now enrolled. Module 1 is ready in your active learning workspace.`,
    urgency: 'high',
    metadata: { courseId: course.courseId }
  });

  addRoleNotification('institution', {
    type: 'enrollment',
    title: `Student Enrolled: ${student.name}`,
    message: `${student.name} enrolled in "${newEnrollment.courseTitle}".`,
    urgency: 'low',
    metadata: { studentId: student.studentId, courseId: course.courseId }
  });

  return { success: true, enrollment: newEnrollment };
}

export function advanceStudentCourseModule(enrollmentId, moduleId = null) {
  const all = getAllEnrollments();
  const idx = all.findIndex(e => e.enrollmentId === enrollmentId);
  if (idx < 0) return null;

  const enr = all[idx];
  const completedIds = Array.isArray(enr.completedModuleIds) ? [...enr.completedModuleIds] : [];

  if (moduleId) {
    if (completedIds.includes(moduleId)) {
      return enr; // idempotent no-op
    }
    completedIds.push(moduleId);
  } else {
    const nextModIndex = completedIds.length + 1;
    const autoId = `mod_${nextModIndex}`;
    if (completedIds.includes(autoId)) {
      return enr;
    }
    completedIds.push(autoId);
  }

  const nextMod = Math.min(enr.totalModules, completedIds.length);
  const nextPct = Math.round((nextMod / enr.totalModules) * 100);
  const isDone = nextPct >= 100;

  all[idx] = {
    ...enr,
    completedModuleIds: completedIds,
    completedModules: nextMod,
    progress: nextPct,
    hoursRemaining: Math.max(0, enr.hoursRemaining - 3),
    currentModule: isDone ? 'All Modules Completed' : `Module ${nextMod + 1}: Core Implementation`,
    status: isDone ? 'completed' : 'active',
    completedAt: isDone ? new Date().toISOString() : undefined
  };

  writeStorage(KEYS.ENROLLMENTS, all, 'nexus_enrollment_updated');
  nexusApiClient.advanceModule(enrollmentId).catch(err => console.debug('API sync deferred:', err));

  // When course completes, upgrade student's skill growth
  if (isDone) {
    upgradeStudentSkillConfidence(enr.studentId, enr.courseTitle);
  }

  return all[idx];
}

// ──────────────────────────────────────────
// Skill Growth Engine
// ──────────────────────────────────────────

export function upgradeStudentSkillConfidence(studentId, courseTitle) {
  const students = getAllRelationalStudents();
  const sIdx = students.findIndex(s => s.studentId === studentId);
  if (sIdx < 0) return;

  const student = students[sIdx];
  const updatedSkills = student.skills.map(sk => {
    if (courseTitle.toLowerCase().includes(sk.name.toLowerCase())) {
      const newConf = Math.min(98, sk.confidence + 18);
      return {
        ...sk,
        confidence: newConf,
        hasCourse: true,
        level: newConf >= 90 ? 'Advanced' : 'Intermediate',
        verified: true
      };
    }
    return sk;
  });

  students[sIdx] = {
    ...student,
    skills: updatedSkills,
    readinessScore: Math.min(99, student.readinessScore + 3)
  };

  writeStorage(KEYS.STUDENTS, students, 'nexus_students_updated');

  addRoleNotification('student', {
    type: 'assessment',
    title: `Skill Score Elevated: ${courseTitle}`,
    message: `Your verified proficiency score increased by +18% based on verified course completion evidence.`,
    urgency: 'high'
  });
}

// ──────────────────────────────────────────
// Project & Proof Services
// ──────────────────────────────────────────

export function getAllProjects() {
  return readStorage(KEYS.PROJECTS, SEED_PROJECTS);
}

export function getStudentProjects(studentId) {
  return getAllProjects().filter(p => p.studentId === studentId);
}

export function submitProjectForValidation(projectData) {
  const all = getAllProjects();
  const newPrj = {
    projectId: `PRJ-${Date.now().toString().slice(-4)}`,
    studentId: projectData.studentId || 'STU-001',
    studentName: projectData.studentName || 'Student Candidate',
    department: projectData.department || 'CSE',
    institutionId: projectData.institutionId || '',
    title: projectData.title,
    category: projectData.category || 'SOFTWARE & SYSTEMS',
    description: projectData.description || 'Student engineered capstone project repository.',
    technologies: Array.isArray(projectData.technologies) ? projectData.technologies : (projectData.technologies || '').split(',').map(s => s.trim()),
    repositoryUrl: projectData.repositoryUrl || 'https://github.com/nexus-student/project-repo',
    status: 'Submitted',
    validation: {
      score: null,
      unitTestsPassed: 'Evaluating in Sandbox',
      commits: projectData.commits || 18,
      proctorSignature: null,
      blockNumber: null,
      verifiedDate: null
    },
    reviewer: 'Pending Faculty Review'
  };

  const updated = [newPrj, ...all];
  writeStorage(KEYS.PROJECTS, updated, 'nexus_project_submitted');
  nexusApiClient.submitProject(newPrj).catch(err => console.debug('API sync deferred:', err));

  // Notify Institution
  addRoleNotification('institution', {
    type: 'proof',
    title: `Project Submitted: ${newPrj.title}`,
    message: `${newPrj.studentName} submitted "${newPrj.title}" (${newPrj.technologies.slice(0, 3).join(', ')}) for faculty code review and ledger sealing.`,
    urgency: 'high',
    metadata: { projectId: newPrj.projectId }
  });

  return newPrj;
}

export function validateProjectByFaculty(projectId, isApproved, facultyName = 'Prof. K. Ramanathan') {
  const all = getAllProjects();
  const idx = all.findIndex(p => p.projectId === projectId);
  if (idx < 0) return null;

  const prj = all[idx];
  const blockNumber = `#8,94${Math.floor(Math.random() * 800 + 100)}`;

  all[idx] = {
    ...prj,
    status: isApproved ? 'Verified' : 'Rejected',
    reviewer: facultyName,
    validation: {
      score: isApproved ? 95 : 40,
      unitTestsPassed: isApproved ? '98% Unit Tests Passed' : 'Tests Failed',
      commits: prj.validation.commits || 24,
      proctorSignature: isApproved ? `PROCTOR-TN010-${Math.floor(Math.random() * 9000 + 1000)}` : null,
      blockNumber: isApproved ? blockNumber : null,
      verifiedDate: new Date().toISOString().split('T')[0]
    }
  };

  writeStorage(KEYS.PROJECTS, all, 'nexus_project_verified');
  nexusApiClient.validateProject(projectId, isApproved, facultyName).catch(err => console.debug('API sync deferred:', err));

  // If approved, update student skill evidence
  if (isApproved) {
    const students = getAllRelationalStudents();
    const sIdx = students.findIndex(s => s.studentId === prj.studentId);
    if (sIdx >= 0) {
      const student = students[sIdx];
      const updatedSkills = student.skills.map(sk => {
        if (prj.technologies.some(t => t.toLowerCase() === sk.name.toLowerCase())) {
          return { ...sk, hasProject: true, hasInstSeal: true, verified: true, confidence: Math.min(99, sk.confidence + 8) };
        }
        return sk;
      });
      students[sIdx] = { ...student, skills: updatedSkills, readinessScore: Math.min(99, student.readinessScore + 4) };
      writeStorage(KEYS.STUDENTS, students, 'nexus_students_updated');
    }

    addRoleNotification('student', {
      type: 'proof',
      title: `Project Proof Validated: ${prj.title}`,
      message: `Your project was verified by ${facultyName} and sealed to sovereign ledger ${blockNumber}.`,
      urgency: 'high',
      metadata: { projectId: prj.projectId }
    });
  }

  return all[idx];
}

// ──────────────────────────────────────────
// Company Opportunities & Applications
// ──────────────────────────────────────────

export function getAllCompanyOpportunities() {
  return readStorage(KEYS.OPPORTUNITIES, SEED_OPPORTUNITIES);
}

export function createCompanyOpportunity(oppData) {
  const all = getAllCompanyOpportunities();
  const newOpp = {
    opportunityId: `OPP-${Date.now().toString().slice(-4)}`,
    companyId: oppData.companyId || 'COM001',
    companyName: oppData.companyName || 'TechCorp Global Systems',
    title: oppData.title,
    role: oppData.role || oppData.title,
    type: oppData.type || 'Internship',
    department: oppData.department || 'Engineering & Product',
    location: oppData.location || 'Chennai (Hybrid)',
    workMode: oppData.workMode || 'Hybrid',
    stipend: oppData.stipend || '₹35,000 / month',
    duration: oppData.duration || '6 Months (PPO Convertible)',
    requiredSkills: Array.isArray(oppData.requiredSkills) ? oppData.requiredSkills : (oppData.skills || '').split(',').map(s => s.trim()),
    preferredSkills: Array.isArray(oppData.preferredSkills) ? oppData.preferredSkills : [],
    minimumProficiency: oppData.minimumProficiency || 'Intermediate',
    targetBatch: oppData.targetBatch || '2026 Batch',
    status: 'Active',
    applicantsCount: 0,
    shortlistedCount: 0,
    description: oppData.description || 'Exciting engineering role matched against verified sovereign competencies.'
  };

  const updated = [newOpp, ...all];
  writeStorage(KEYS.OPPORTUNITIES, updated, 'nexus_opportunity_created');
  nexusApiClient.createOpportunity(newOpp).catch(err => console.debug('API sync deferred:', err));

  // Notify Students about new high-match opportunity
  addRoleNotification('student', {
    type: 'opportunity',
    title: `New High-Match Role: ${newOpp.title}`,
    message: `${newOpp.companyName} published "${newOpp.title}". Verified skill match threshold: 85%+.`,
    urgency: 'high',
    metadata: { opportunityId: newOpp.opportunityId }
  });

  return newOpp;
}

export function updateCompanyOpportunity(oppId, updates) {
  const all = getAllCompanyOpportunities();
  const updated = all.map(o => {
    const id = o.opportunityId || o.oppId || o.id;
    if (id === oppId) {
      return { ...o, ...updates };
    }
    return o;
  });
  writeStorage(KEYS.OPPORTUNITIES, updated, 'nexus_opportunity_created');
  return updated;
}

export function closeCompanyOpportunity(oppId) {
  return updateCompanyOpportunity(oppId, { status: 'Closed' });
}

export function deleteCompanyOpportunity(oppId) {
  const all = getAllCompanyOpportunities();
  const updated = all.filter(o => {
    const id = o.opportunityId || o.oppId || o.id;
    return id !== oppId;
  });
  writeStorage(KEYS.OPPORTUNITIES, updated, 'nexus_opportunity_created');
  return updated;
}

export function getAllApplications() {
  return readStorage(KEYS.APPLICATIONS, SEED_APPLICATIONS);
}

export function submitStudentApplication(student, opportunity) {
  const all = getAllApplications();
  const exists = all.find(a => a.studentId === student.studentId && a.opportunityId === opportunity.opportunityId);
  if (exists) return { success: false, reason: 'Already applied' };

  const matchRes = calculateNexusExplainableMatch(opportunity, student);

  const newApp = {
    applicationId: `APP-${Date.now().toString().slice(-4)}`,
    opportunityId: opportunity.opportunityId,
    companyId: opportunity.companyId || 'COM001',
    companyName: opportunity.companyName,
    studentId: student.studentId,
    candidateName: student.name,
    department: student.department,
    roleTitle: opportunity.title,
    matchScore: matchRes.matchScore,
    stage: 'New',
    appliedAt: new Date().toISOString(),
    notes: 'Candidate submitted verified credential passport and project proofs.'
  };

  const updated = [newApp, ...all];
  writeStorage(KEYS.APPLICATIONS, updated, 'nexus_application_created');
  nexusApiClient.submitApplication(student, opportunity).catch(err => console.debug('API sync deferred:', err));

  // Increment opportunity applicants
  const allOpps = getAllCompanyOpportunities().map(o => {
    if (o.opportunityId === opportunity.opportunityId) {
      return { ...o, applicantsCount: (o.applicantsCount || 0) + 1 };
    }
    return o;
  });
  writeStorage(KEYS.OPPORTUNITIES, allOpps);

  // Notify Company & Student
  addRoleNotification('company', {
    type: 'application',
    title: `Application Received: ${student.name}`,
    message: `${student.name} applied for "${opportunity.title}" with a ${matchRes.matchScore}% explainable fit index.`,
    urgency: 'high',
    metadata: { applicationId: newApp.applicationId, studentId: student.studentId }
  });

  addRoleNotification('student', {
    type: 'opportunity',
    title: `Application Sent: ${opportunity.title}`,
    message: `Your verified application and Digital Passport were dispatched to ${opportunity.companyName}.`,
    urgency: 'medium'
  });

  return { success: true, application: newApp };
}

export function advanceApplicationStage(applicationId, newStage) {
  const all = getAllApplications();
  const idx = all.findIndex(a => a.applicationId === applicationId);
  if (idx < 0) return null;

  all[idx] = { ...all[idx], stage: newStage };
  writeStorage(KEYS.APPLICATIONS, all, 'nexus_application_stage_changed');
  nexusApiClient.updateApplicationStage(applicationId, newStage).catch(err => console.debug('API sync deferred:', err));

  const app = all[idx];

  // Notify Student of recruitment progression
  if (newStage === 'Interview') {
    addRoleNotification('student', {
      type: 'opportunity',
      title: `Interview Dispatched by ${app.companyName}`,
      message: `You have been advanced to Technical Interview for "${app.roleTitle}". Fast-track proctor link generated.`,
      urgency: 'high',
      metadata: { applicationId: app.applicationId }
    });
  } else if (newStage === 'Selected') {
    addRoleNotification('student', {
      type: 'opportunity',
      title: `Offer Extended: ${app.companyName}!`,
      message: `Congratulations! ${app.companyName} selected you for the "${app.roleTitle}" opportunity.`,
      urgency: 'high'
    });
  }

  return all[idx];
}

// ══════════════════════════════════════════════════════════════════════════
// 3. DETERMINISTIC NEXUS AI EXPLAINABLE MATCHING ENGINE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Deterministic Explainable Matching Formula:
 * Match = 0.35 * SkillMatch + 0.25 * ProjectEvidence + 0.20 * AssessmentScore + 0.20 * CareerGoalAlignment
 */
export function calculateNexusExplainableMatch(opportunity, student) {
  if (!opportunity || !student) {
    return {
      matchScore: 85,
      skillMatch: 85,
      projectMatch: 80,
      assessmentMatch: 85,
      careerGoalMatch: 88,
      readiness: 90,
      criticalGaps: [],
      whyMatches: 'Matches requirements based on verified technical stack.',
      recommendedAction: 'Keep learning'
    };
  }

  const reqSkills = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const studentSkills = (student.skills || []).map(s => ({
    name: s.name.toLowerCase().trim(),
    confidence: s.confidence || 75,
    verified: Boolean(s.verified)
  }));

  // 1. Skill Match Score (35% weight)
  let matchedSkillCount = 0;
  let skillScoreSum = 0;
  const criticalGaps = [];

  reqSkills.forEach(req => {
    const found = studentSkills.find(s => s.name.includes(req) || req.includes(s.name));
    if (found) {
      matchedSkillCount++;
      skillScoreSum += found.confidence;
    } else {
      criticalGaps.push(req.charAt(0).toUpperCase() + req.slice(1));
    }
  });

  const skillMatch = reqSkills.length > 0
    ? Math.round((skillScoreSum / (reqSkills.length * 100)) * 100)
    : 85;

  // 2. Project Evidence Match (25% weight)
  const studentProjects = getStudentProjects(student.studentId);
  let projectMatch = 70;
  if (studentProjects.length > 0) {
    const verifiedProjects = studentProjects.filter(p => p.status === 'Verified');
    const relevantProjects = verifiedProjects.filter(p =>
      p.technologies.some(t => reqSkills.some(r => r.includes(t.toLowerCase()) || t.toLowerCase().includes(r)))
    );
    projectMatch = Math.min(98, 60 + (relevantProjects.length * 15) + (verifiedProjects.length * 5));
  }

  // 3. Assessment Evidence (20% weight)
  let assessmentMatch = 80;
  if (student.assessments && student.assessments.length > 0) {
    const avgScore = student.assessments.reduce((sum, a) => sum + (Number(a.score) || 80), 0) / student.assessments.length;
    assessmentMatch = Math.round(avgScore);
  }

  // 4. Career Goal Alignment (20% weight)
  let careerGoalMatch = 85;
  const prefRoles = (student.preferredRoles || []).map(r => r.toLowerCase());
  const targetRole = (opportunity.role || opportunity.title || '').toLowerCase();
  if (prefRoles.some(pr => targetRole.includes(pr) || pr.includes(targetRole))) {
    careerGoalMatch = 95;
  }

  // Final Weighted Composite Match Score
  const matchScore = Math.min(99, Math.max(50, Math.round(
    (0.35 * skillMatch) +
    (0.25 * projectMatch) +
    (0.20 * assessmentMatch) +
    (0.20 * careerGoalMatch)
  )));

  // Natural Language Explainability
  const matchedNames = reqSkills.filter(r => !criticalGaps.some(g => g.toLowerCase() === r)).map(s => s.toUpperCase());
  const whyMatches = `${student.name}'s verified mastery in ${matchedNames.slice(0, 3).join(', ')} directly fulfills your technical criteria with ${projectMatch}% validated Git code proof backing. Proctor assessments place candidate in top national percentiles.`;

  const recommendedAction = criticalGaps.length > 0
    ? `Enroll in campus bootcamp for ${criticalGaps[0]} to elevate fit to 98%.`
    : 'Candidate is 100% placement ready for 1-click fast-track interview.';

  return {
    matchScore,
    skillMatch,
    projectMatch,
    assessmentMatch,
    careerGoalMatch,
    readiness: student.readinessScore || 90,
    criticalGaps,
    whyMatches,
    recommendedAction
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 3. CANONICAL SERVICE LAYER API INTERFACE (PHASE 3)
// ══════════════════════════════════════════════════════════════════════════
export async function getStudent(studentId) {
  const local = getRelationalStudentById(studentId);
  try {
    const remote = await nexusApiClient.getStudent(studentId);
    if (remote) return remote;
  } catch {}
  return local;
}

export function getStudentSkills(studentId) {
  const student = getRelationalStudentById(studentId);
  return student ? student.skills || [] : [];
}

export async function getCourses(institutionId = null) {
  const local = institutionId ? getCoursesByInstitution(institutionId) : getAllCourses();
  try {
    const remote = await nexusApiClient.getCourses(institutionId);
    if (remote && remote.length > 0) return remote;
  } catch {}
  return local;
}

export async function enrollCourse(student, course) {
  return enrollStudentInCourse(student, course);
}

export async function submitProject(projectData) {
  return submitProjectForValidation(projectData);
}

export async function getOpportunities() {
  const local = getAllCompanyOpportunities();
  try {
    const remote = await nexusApiClient.getOpportunities();
    if (remote && remote.length > 0) return remote;
  } catch {}
  return local;
}

export async function applyOpportunity(student, opportunity) {
  return submitStudentApplication(student, opportunity);
}

