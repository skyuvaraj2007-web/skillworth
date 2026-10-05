// backend/src/services/readinessService.js
/**
 * Centralized readiness calculation service.
 * Implements the frozen formula:
 * R = round(0.30*SkillVerification + 0.25*DiagnosticAssessments + 0.20*ProjectProofs + 0.15*LearningProgress + 0.10*CareerCompleteness)
 *
 * INVARIANTS:
 * - A brand-new student with NO evidence MUST return readinessScore = 0.
 * - There is NO artificial floor. Math.max(1, ...) is PROHIBITED.
 * - No component may produce NaN, Infinity, null, or undefined.
 * - Empty arrays contribute 0 to their component, never NaN.
 */
const relationalManager = require('../db/relationalManager');

// Multipliers
const VERIFIED    = 1.0;
const PENDING     = 0.7;
const UNVERIFIED  = 0.4;

const LEVEL_MAP = {
  BEGINNER:     25,
  INTERMEDIATE: 50,
  ADVANCED:     75,
  EXPERT:       100
};

// ──────────────────────────────────────────────────────────────────────────────
// Component calculators — each must return a finite number in [0, 100]
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Skill verification score — only verified/pending/unverified skills count.
 * Self-assessed skills are UNVERIFIED (multiplier 0.4).
 */
function calculateSkillVerification(student) {
  const skills = Array.isArray(student.skills) ? student.skills : [];
  if (skills.length === 0) return 0;

  const total = skills.reduce((sum, sk) => {
    const levelScore = LEVEL_MAP[(String(sk.level || '')).toUpperCase()] || 0;
    const mult = sk.verified ? VERIFIED : (sk.pending ? PENDING : UNVERIFIED);
    return sum + levelScore * mult;
  }, 0);

  const avg = total / skills.length;
  return isFinite(avg) ? avg : 0;
}

/**
 * Diagnostic assessments score — weighted by domain (40/30/30).
 */
function calculateDiagnosticAssessments(student) {
  const assessments = Array.isArray(student.assessments) ? student.assessments : [];
  if (assessments.length === 0) return 0;

  const domainWeights = {
    'Programming & Data Structures': 0.4,
    'Logical & Algorithmic Reasoning': 0.3,
    'Quantitative Aptitude': 0.3
  };

  let weightedSum = 0;
  let weightTotal = 0;

  assessments.forEach(a => {
    const weight = domainWeights[a.domain] || 0.33; // equal weight for unknown domains
    weightedSum += (Number(a.score) || 0) * weight;
    weightTotal += weight;
  });

  if (weightTotal === 0) return 0;
  const result = weightedSum / weightTotal;
  return isFinite(result) ? result : 0;
}

/**
 * Project proofs — percentage of projects that are validated/proven.
 * A draft project contributes 0.
 */
function calculateProjectProofs(student) {
  const projects = Array.isArray(student.projects) ? student.projects : [];
  if (projects.length === 0) return 0;

  const proven = projects.filter(p =>
    p.proofVerified === true ||
    p.status === 'validated' ||
    p.status === 'Validated' ||
    p.status === 'completed' ||
    p.status === 'Completed'
  ).length;

  const result = (proven / projects.length) * 100;
  return isFinite(result) ? result : 0;
}

/**
 * Learning progress — average completion percentage across enrolled courses.
 */
function calculateLearningProgress(student) {
  const courses = Array.isArray(student.courses) ? student.courses : [];
  if (courses.length === 0) return 0;

  const total = courses.reduce((s, c) => {
    const val = c.progress !== undefined ? c.progress : (c.progress_percentage !== undefined ? c.progress_percentage : c.progressPercentage);
    return s + (Number(val) || 0);
  }, 0);
  const result = total / courses.length;
  return isFinite(result) ? result : 0;
}

/**
 * Career completeness — presence of bio, verified resume, github, target role.
 */
function calculateCareerCompleteness(student) {
  // If student hasn't completed questionnaire / profile setup, completeness is 0
  if (!student.hasCompletedQuestionnaire && !student.skillProfile) {
    return 0;
  }
  let score = 0;
  if (student.bio) score += 25;
  if (student.resumeVerified) score += 25;
  if (student.github || student.githubUrl) score += 25;
  if (Array.isArray(student.preferredRoles) && student.preferredRoles.length > 0) score += 25;
  return score; // out of 100
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate readiness from an already-fetched/constructed student object.
 * Synchronous. No floor. Returns full breakdown.
 *
 * @returns {{
 *   skillVerification: number,
 *   assessmentScore: number,
 *   projectProofScore: number,
 *   learningProgress: number,
 *   careerCompleteness: number,
 *   readinessScore: number
 * }}
 */
function calculateReadinessFromStudent(student) {
  const skillVerification   = calculateSkillVerification(student);
  const assessmentScore     = calculateDiagnosticAssessments(student);
  const projectProofScore   = calculateProjectProofs(student);
  const learningProgress    = calculateLearningProgress(student);
  const careerCompleteness  = calculateCareerCompleteness(student);

  const raw =
    0.30 * skillVerification  +
    0.25 * assessmentScore    +
    0.20 * projectProofScore  +
    0.15 * learningProgress   +
    0.10 * careerCompleteness;

  // Guard: NaN, Infinity, negative → 0
  const readinessScore = isFinite(raw) && raw > 0 ? Math.round(raw) : 0;

  return {
    skillVerification:  Math.round(isFinite(skillVerification)  ? skillVerification  : 0),
    assessmentScore:    Math.round(isFinite(assessmentScore)    ? assessmentScore    : 0),
    projectProofScore:  Math.round(isFinite(projectProofScore)  ? projectProofScore  : 0),
    learningProgress:   Math.round(isFinite(learningProgress)   ? learningProgress   : 0),
    careerCompleteness: Math.round(isFinite(careerCompleteness) ? careerCompleteness : 0),
    readinessScore
  };
}

/**
 * Async variant: fetch student from DB then compute numeric score.
 */
async function calculateReadiness(studentId) {
  const student = await relationalManager.getStudentById(studentId);
  if (!student) throw new Error('Student not found');
  const breakdown = calculateReadinessFromStudent(student);
  return breakdown.readinessScore;
}

/**
 * Async variant: fetch student from DB then compute full mathematical breakdown object.
 */
async function calculateReadinessBreakdown(studentId) {
  const student = await relationalManager.getStudentById(studentId);
  if (!student) throw new Error('Student not found');
  return calculateReadinessFromStudent(student);
}

module.exports = {
  calculateReadiness,
  calculateReadinessBreakdown,
  calculateReadinessFromStudent,
  calculateSkillVerification,
  calculateDiagnosticAssessments,
  calculateProjectProofs,
  calculateLearningProgress,
  calculateCareerCompleteness,
  getReadiness: async (studentId) => {
    return await calculateReadiness(studentId);
  }
};
