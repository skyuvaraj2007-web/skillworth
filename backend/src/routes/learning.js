// backend/src/routes/learning.js
/**
 * Learning routes.
 *
 * RULE: Clicking "Continue" (GET /resume) MUST NOT mutate any data.
 *       Only POST /:enrollmentId/modules/:moduleId/complete may increment progress.
 *       That endpoint is IDEMPOTENT — completing the same module twice keeps progress unchanged.
 */
const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const learningAnalyticsService = require('../services/learningAnalyticsService');

async function getEffectiveStudentId(req) {
  const cand = [req.user?.id, req.user?.studentId, req.user?.userId].filter(Boolean);
  for (const c of cand) {
    try {
      const { data: s } = await supabase
        .from('students')
        .select('id')
        .or(`id.eq.${c},user_id.eq.${c},roll_number.eq.${c}`)
        .limit(1)
        .maybeSingle();
      if (s?.id) return s.id;
    } catch {}
  }
  if (req.user?.email) {
    try {
      const { data: u } = await supabase
        .from('users')
        .select('id, students(id)')
        .ilike('email', req.user.email)
        .limit(1)
        .maybeSingle();
      if (u?.students?.[0]?.id) return u.students[0].id;
    } catch {}
  }
  return req.user?.studentId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning — list courses / enrollments for the authenticated student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const institutionId = req.user?.institutionId || req.user?.collegeId;

    const courses = await relationalManager.getCourses(institutionId || null);
    const enrollments = await relationalManager.getEnrollments(studentId);

    res.json({ success: true, data: { courses, enrollments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/skills — list skills published by student's institution with eligibility
// ─────────────────────────────────────────────────────────────────────────────
router.get('/skills', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const student = await relationalManager.getStudentById(studentId);

    const instId = student?.institutionId || student?.institution_id || student?.collegeId || req.user?.institutionId || req.user?.collegeId || 'TN010';
    const result = await relationalManager.getInstitutionSkills(instId, 'PUBLISHED');

    // Enrich each skill with the student's eligibility status
    const enriched = await Promise.all((result.skills || []).map(async (skill) => {
      const eligibility = student ? await relationalManager.checkStudentSkillEligibility(student, skill) : { isEligible: true, status: 'ELIGIBLE' };
      return {
        ...skill,
        eligibilityStatus: eligibility.status,
        isEligible: eligibility.isEligible,
        existingEnrollment: eligibility.existingEnrollment
      };
    }));

    res.json({ success: true, data: enriched, totalCount: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/skills/:id — full skill details + detailed real-time eligibility breakdown
// ─────────────────────────────────────────────────────────────────────────────
router.get('/skills/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const student = await relationalManager.getStudentById(studentId);
    const skill = await relationalManager.getSkillById(req.params.id);

    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    const eligibility = student
      ? await relationalManager.checkStudentSkillEligibility(student, skill)
      : { isEligible: true, status: 'ELIGIBLE', breakdown: [], reasons: [] };

    res.json({
      success: true,
      data: {
        ...skill,
        eligibility
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/skills/:id/enroll — enroll student in skill (Open/Approval/Waitlist)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skills/:id/enroll', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const student = await relationalManager.getStudentById(studentId);
    const skill = await relationalManager.getSkillById(req.params.id);

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    const result = await relationalManager.enrollStudentInSkill(student, skill, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/skills/:id/assess — submit skill assessment & compute benchmark/certificate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skills/:id/assess', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const student = await relationalManager.getStudentById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    const result = await relationalManager.submitSkillAssessment(studentId, req.params.id, req.body);
    res.json({
      success: true,
      message: result.isCertified
        ? `Congratulations! You earned ${result.benchmark} certification with score ${result.score}%.`
        : `Assessment completed with score ${result.score}%. Benchmark: ${result.benchmark}.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/skills/:id/lessons/complete — complete a module lesson
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skills/:id/lessons/complete', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.completeSkillLesson(studentId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Lesson completed successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/skills/:id/practice — record practice attempt telemetry
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skills/:id/practice', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.recordSkillPractice(studentId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Practice activity recorded successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/skills/:id/project — submit practical capstone project
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skills/:id/project', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.submitSkillProject(studentId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Project submitted successfully and evidence recorded',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/skills/:id/progress — get student progress & evidence
// ─────────────────────────────────────────────────────────────────────────────
router.get('/skills/:id/progress', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.getStudentSkillIntelligence(studentId, req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/my-skill-intelligence — get all enrolled skills intelligence
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-skill-intelligence', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.getAllStudentSkillIntelligence(studentId);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/my-skills — student enrolled / in-progress / completed / certified skills
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-skills', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const enrollments = await relationalManager.getEnrollments(studentId);
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/enroll — enroll student in a course (starts at 0% progress)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enroll', requireAuth, async (req, res) => {
  try {
    const { courseId, totalModules, courseTitle } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });

    const studentId = await getEffectiveStudentId(req);
    const student = await relationalManager.getStudentById(studentId);
    let course = relationalManager.getCourseById
      ? await relationalManager.getCourseById(courseId)
      : null;

    if (!course) {
      course = { courseId, title: courseTitle, totalModules: totalModules ? parseInt(totalModules, 10) : undefined };
    } else if (totalModules) {
      course = { ...course, totalModules: parseInt(totalModules, 10) };
    }

    const existing = await relationalManager.getEnrollments(studentId);
    const alreadyEnrolled = (existing || []).some(e => e.courseId === courseId || e.course_id === courseId);
    if (alreadyEnrolled) {
      return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
    }

    const enrollment = await relationalManager.enrollCourse(student || { studentId }, course || { courseId });

    res.status(201).json({
      success: true,
      message: 'Course enrollment successful',
      data: enrollment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/:enrollmentId/resume — Return current module context ONLY.
//   NO DATA MUTATION. Clicking "Continue" calls this. Progress does NOT change.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/resume', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const enrollments = await relationalManager.getEnrollments(studentId);
    const enrollment = (enrollments || []).find(e =>
      e.id === req.params.id ||
      e.enrollmentId === req.params.id ||
      e.enrollment_id === req.params.id ||
      e.courseId === req.params.id ||
      e.course_id === req.params.id ||
      e.courseCode === req.params.id ||
      e.course_code === req.params.id
    );

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({
      success: true,
      message: 'Resume context retrieved. No progress changed.',
      data: {
        enrollmentId: enrollment.id || enrollment.enrollmentId || enrollment.enrollment_id,
        courseId: enrollment.courseId || enrollment.course_id,
        courseTitle: enrollment.courseTitle || enrollment.course_title,
        currentModule: enrollment.currentModule || 'Module 1',
        completedModules: enrollment.completedModules || 0,
        totalModules: enrollment.totalModules || 1,
        completedModuleIds: Array.isArray(enrollment.completedModuleIds) ? enrollment.completedModuleIds : [],
        progress: enrollment.progress || 0,
        status: enrollment.status || 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/:enrollmentId/modules/:moduleId/complete
//   IDEMPOTENT: completing the same moduleId twice keeps progress unchanged.
//   Validates: enrollment exists & belongs to authenticated student.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/modules/:moduleId/complete', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const { id: enrollmentId, moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({ success: false, message: 'moduleId is required' });
    }

    // Verify ownership
    const enrollments = await relationalManager.getEnrollments(studentId);
    const ownEnrollment = (enrollments || []).find(e =>
      e.id === enrollmentId ||
      e.enrollmentId === enrollmentId ||
      e.enrollment_id === enrollmentId ||
      e.courseId === enrollmentId ||
      e.course_id === enrollmentId ||
      e.courseCode === enrollmentId ||
      e.course_code === enrollmentId
    );
    if (!ownEnrollment) {
      return res.status(403).json({ success: false, message: 'Enrollment not found or does not belong to this student' });
    }

    // Idempotent advance — relationalManager checks completedModuleIds
    const effectiveEnrollmentId = ownEnrollment.id || ownEnrollment.enrollmentId || ownEnrollment.enrollment_id || enrollmentId;
    const updated = await relationalManager.advanceModule(effectiveEnrollmentId, moduleId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Enrollment not found in database' });
    }

    res.json({
      success: true,
      message: updated.alreadyCompleted
        ? 'Module already completed — progress unchanged (idempotent).'
        : `Module "${moduleId}" marked complete.`,
      data: {
        enrollmentId,
        moduleId,
        alreadyCompleted: Boolean(updated.alreadyCompleted),
        completedModules: updated.completedModules,
        totalModules: updated.totalModules,
        progress: updated.progress,
        progressPercentage: updated.progress,
        completionPercentage: updated.progress,
        status: updated.status,
        completedModuleIds: updated.completedModuleIds || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/:id/discontinue — Student discontinues an active course
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/discontinue', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authenticated student identification required.' });
    }
    const { id: enrollmentOrCourseId } = req.params;
    const { reason = null } = req.body;

    const result = await relationalManager.discontinueCourse(studentId, enrollmentOrCourseId, reason);
    res.json(result);
  } catch (err) {
    console.error('[POST /api/learning/:id/discontinue] Error:', err.message);
    const status = err.message.includes('not found') ? 404 : (err.message.includes('unauthorized') || err.message.includes('not belong') ? 403 : 500);
    res.status(status).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED: PUT/POST /:id/progress — kept for backwards compat, now requires
// a moduleId in the request body and is fully idempotent.
// Clients should migrate to POST /:id/modules/:moduleId/complete.
// ─────────────────────────────────────────────────────────────────────────────
const handleProgressUpdate = async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const enrollmentId = req.params.id;
    const moduleId = req.body?.moduleId || null;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'moduleId is required. Use POST /:enrollmentId/modules/:moduleId/complete to mark a specific module complete.'
      });
    }

    // Verify ownership
    const enrollments = await relationalManager.getEnrollments(studentId);
    const ownEnrollment = (enrollments || []).find(e =>
      e.id === enrollmentId ||
      e.enrollmentId === enrollmentId ||
      e.enrollment_id === enrollmentId
    );
    if (!ownEnrollment) {
      return res.status(403).json({ success: false, message: 'Enrollment not found or does not belong to this student' });
    }

    const updated = await relationalManager.advanceModule(enrollmentId, moduleId);
    if (!updated) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    res.json({
      success: true,
      message: updated.alreadyCompleted
        ? 'Module already completed — progress unchanged (idempotent).'
        : `Module "${moduleId}" marked complete.`,
      data: {
        enrollmentId,
        moduleId,
        alreadyCompleted: Boolean(updated.alreadyCompleted),
        completedCount: updated.completedModules,
        completedModules: updated.completedModules,
        totalModules: updated.totalModules,
        completionPercentage: updated.progress,
        progress: updated.progress,
        status: updated.status,
        completedModuleIds: updated.completedModuleIds || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.put('/:id/progress', requireAuth, handleProgressUpdate);
router.post('/:id/progress', requireAuth, handleProgressUpdate);

// ─────────────────────────────────────────────────────────────────────────────
// SELF-ASSESSED SKILLS API
// ─────────────────────────────────────────────────────────────────────────────
router.get('/self-assessments', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const list = await relationalManager.getStudentSelfAssessments(studentId);
    res.json({ success: true, data: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/self-assessments', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const saved = await relationalManager.saveStudentSelfAssessment(studentId, req.body);
    res.status(201).json({ success: true, message: 'Self-assessment recorded successfully.', data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/self-assessments/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const saved = await relationalManager.saveStudentSelfAssessment(studentId, { ...req.body, id: req.params.id });
    res.json({ success: true, message: 'Self-assessment updated successfully.', data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/self-assessments/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await relationalManager.deleteStudentSelfAssessment(studentId, req.params.id);
    res.json({ success: true, message: 'Self-assessment deleted successfully.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING OVERVIEW, QUIZZES, PROJECTS, CERTIFICATIONS, ACTIVITY & INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentLearningOverview(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/quizzes', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentQuizzes(studentId);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/quizzes/submit', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.submitStudentQuiz(studentId, req.body);
    res.status(201).json({ success: true, message: 'Quiz submitted successfully.', data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/projects', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentProjects(studentId);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/certifications', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentCertifications(studentId);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/activity', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentLearningActivities(studentId);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/intelligence', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentLearningIntelligence(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/skill-gap', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentSkillGapIntelligence(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/my-courses — Student's Assigned + Enrolled Courses
// Returns courses with "Assigned by: [Academician Name]" and real progress
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-courses', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);

    // Resolve actual student UUID
    let stuUuid = studentId;
    if (studentId) {
      const { data: stu } = await supabase
        .from('students')
        .select('id')
        .or(`user_id.eq.${studentId},id.eq.${studentId},roll_number.eq.${studentId}`)
        .limit(1)
        .maybeSingle();
      if (stu?.id) stuUuid = stu.id;
    }

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id, status, progress_percentage, enrolled_at, completed_at,
        courses (
          id, title, description, category, difficulty, duration_weeks,
          thumbnail_url, status, is_deleted,
          course_modules (
            id, lessons
          )
        )
      `)
      .eq('student_id', stuUuid)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    const courses = (enrollments || []).filter(e => e.courses && !e.courses.is_deleted).map(e => {
      const c = e.courses;
      const modules = c.course_modules || [];
      const totalLessons = modules.reduce((acc, m) => acc + ((m.lessons || []).length), 0) || 1;
      const completedLessons = (e.student_lesson_progress || []).filter(slp => slp.status === 'Completed').length;
      const computedProgress = totalLessons > 0
        ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
        : (e.progress_percentage || 0);

      const statusLabel = e.status === 'Completed' || computedProgress === 100 ? 'Completed'
        : computedProgress > 0 ? 'In Progress'
        : 'Not Started';

      const ap = e.academician_profiles;
      const assignedBy = ap?.full_name ? {
        name: ap.full_name,
        facultyId: ap.faculty_id,
        designation: ap.designation || 'Faculty'
      } : null;

      return {
        enrollmentId: e.id,
        courseId: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        durationWeeks: c.duration_weeks,
        thumbnailUrl: c.thumbnail_url,
        progress: computedProgress,
        completedLessons,
        totalLessons,
        status: statusLabel,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        isAssigned: !!ap?.full_name,
        assignedBy
      };
    });

    return res.json({ success: true, data: courses });
  } catch (err) {
    console.error('[GET /api/learning/my-courses] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/my-courses/:courseId — Course Detail with Modules/Lessons + Progress
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-courses/:courseId', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const { courseId } = req.params;

    let stuUuid = studentId;
    if (studentId) {
      const { data: stu } = await supabase
        .from('students')
        .select('id')
        .or(`user_id.eq.${studentId},id.eq.${studentId}`)
        .limit(1)
        .maybeSingle();
      if (stu?.id) stuUuid = stu.id;
    }

    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, academician_profiles(full_name, designation)')
      .eq('student_id', stuUuid)
      .eq('course_id', courseId)
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    }

    // Get course with modules
    const { data: course } = await supabase
      .from('courses')
      .select('*, course_modules(*)')
      .eq('id', courseId)
      .limit(1)
      .maybeSingle();

    if (!course || course.is_deleted) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Get completed lessons for this enrollment
    const { data: completedRows } = await supabase
      .from('student_lesson_progress')
      .select('lesson_id')
      .eq('enrollment_id', enrollment.id)
      .eq('status', 'Completed');

    const completedLessonIds = new Set((completedRows || []).map(r => r.lesson_id));

    const rawModules = course.course_modules || [];
    rawModules.sort((a, b) => (a.module_number || 1) - (b.module_number || 1));

    const modules = rawModules.map(cm => {
      const lessons = (cm.lessons || []).map((l, idx) => {
        const lid = l.id || l.lesson_id || `${cm.id}_lesson_${idx + 1}`;
        return {
          ...l,
          id: lid,
          isCompleted: completedLessonIds.has(lid)
        };
      });
      return {
        id: cm.id,
        title: cm.title,
        description: cm.description,
        orderIndex: cm.module_number || 1,
        duration: cm.duration_text || '2 Hours',
        lessons,
        completedCount: lessons.filter(l => l.isCompleted).length,
        totalCount: lessons.length
      };
    });

    const totalLessons = modules.reduce((acc, m) => acc + m.totalCount, 0);
    const completedLessons = modules.reduce((acc, m) => acc + m.completedCount, 0);
    const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    return res.json({
      success: true,
      data: {
        enrollmentId: enrollment.id,
        courseId: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        learningObjectives: course.learning_objectives,
        thumbnailUrl: course.thumbnail_url,
        progress,
        completedLessons,
        totalLessons,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        assignedBy: enrollment.academician_profiles?.full_name ? {
          name: enrollment.academician_profiles.full_name,
          designation: enrollment.academician_profiles.designation || 'Faculty'
        } : null,
        modules
      }
    });
  } catch (err) {
    console.error('[GET /api/learning/my-courses/:courseId] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/my-courses/:courseId/lessons/:lessonId/complete
// Mark a specific lesson as completed (idempotent)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/my-courses/:courseId/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const { courseId, lessonId } = req.params;
    const { moduleId, timeSpentSeconds = 0 } = req.body;

    let stuUuid = studentId;
    const { data: stu } = await supabase
      .from('students')
      .select('id')
      .or(`user_id.eq.${studentId},id.eq.${studentId}`)
      .limit(1)
      .maybeSingle();
    if (stu?.id) stuUuid = stu.id;

    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', stuUuid)
      .eq('course_id', courseId)
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }
    const enrollmentId = enrollment.id;

    // Record lesson completion (idempotent upsert)
    await supabase.from('student_lesson_progress').upsert({
      enrollment_id: enrollmentId,
      course_id: courseId,
      student_id: stuUuid,
      module_id: moduleId || null,
      lesson_id: lessonId,
      status: 'Completed',
      completed_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      time_spent_seconds: timeSpentSeconds,
      updated_at: new Date().toISOString()
    }, { onConflict: 'enrollment_id,lesson_id' });

    // Recalculate progress
    const { data: courseModules } = await supabase
      .from('course_modules')
      .select('lessons')
      .eq('course_id', courseId);

    const totalLessons = (courseModules || []).reduce((acc, cm) => acc + ((cm.lessons || []).length), 0) || 1;

    const { count: completedCount } = await supabase
      .from('student_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'Completed');

    const completedLessons = completedCount || 0;
    const newProgress = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
    const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';

    // Update enrollment progress
    await supabase.from('enrollments').update({
      progress_percentage: newProgress,
      status: newStatus,
      completed_at: newStatus === 'Completed' ? new Date().toISOString() : null
    }).eq('id', enrollmentId);

    return res.json({
      success: true,
      message: 'Lesson marked as completed',
      data: { progress: newProgress, completedLessons, totalLessons, status: newStatus }
    });
  } catch (err) {
    console.error('[POST /api/learning/my-courses/:courseId/lessons/:lessonId/complete] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/assigned-skill-tests — Only Tests Assigned to This Student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/assigned-skill-tests', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);

    let stuUuid = studentId;
    const { data: stu } = await supabase
      .from('students')
      .select('id')
      .or(`user_id.eq.${studentId},id.eq.${studentId}`)
      .limit(1)
      .maybeSingle();
    if (stu?.id) stuUuid = stu.id;

    const { data: targets, error } = await supabase
      .from('assessment_targets')
      .select(`
        status, assigned_at,
        assessments (
          id, title, description, domain, difficulty, duration_minutes,
          passing_score, total_marks, is_deleted, is_active,
          assessment_questions (id),
          academician_profiles (full_name, designation)
        )
      `)
      .eq('student_id', stuUuid)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    const tests = [];
    for (const t of (targets || [])) {
      const a = t.assessments;
      if (!a || a.is_deleted || !a.is_active) continue;

      const { data: attempts } = await supabase
        .from('assessment_attempts')
        .select('id, status, score')
        .eq('student_id', stuUuid)
        .eq('assessment_id', a.id)
        .order('started_at', { ascending: false });

      const latestAttempt = attempts?.[0];
      const completedAttempts = (attempts || []).filter(at => at.status === 'Completed');
      const bestScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map(at => Number(at.score) || 0)) : null;

      const ap = a.academician_profiles;
      tests.push({
        id: a.id,
        title: a.title,
        description: a.description,
        domain: a.domain,
        difficulty: a.difficulty,
        durationMinutes: a.duration_minutes,
        passingScore: a.passing_score,
        totalMarks: a.total_marks,
        questionCount: a.assessment_questions ? a.assessment_questions.length : 0,
        targetStatus: t.status,
        dueDate: null,
        myAttemptId: latestAttempt?.id || null,
        myAttemptStatus: latestAttempt?.status || null,
        myBestScore: bestScore,
        status: latestAttempt?.status === 'Completed' ? 'Completed'
          : latestAttempt?.status === 'In Progress' ? 'In Progress'
          : 'Pending',
        assignedBy: ap?.full_name ? {
          name: ap.full_name,
          designation: ap.designation || 'Faculty'
        } : null
      });
    }

    return res.json({ success: true, data: tests });
  } catch (err) {
    console.error('[GET /api/learning/assigned-skill-tests] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT COURSE PROGRESS & LEARNING ANALYTICS (DATABASE-FIRST POSTGRESQL)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/learning/student/courses (and /courses) — List enrolled courses with real database progress
router.get(['/student/courses', '/courses'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const courses = await learningAnalyticsService.getStudentCoursesAndProgress(studentId);
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learning/student/course-progress (and /course-progress)
router.get(['/student/course-progress', '/course-progress'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const courses = await learningAnalyticsService.getStudentCoursesAndProgress(studentId);
    const totalEnrolled = courses.length;
    const completed = courses.filter(c => c.progressPercentage >= 100).length;
    const inProgress = courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length;
    const overallProgress = totalEnrolled > 0
      ? Math.round(courses.reduce((sum, c) => sum + c.progressPercentage, 0) / totalEnrolled)
      : 0;

    res.json({
      success: true,
      data: {
        totalEnrolled,
        completed,
        inProgress,
        overallProgress,
        courses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/learning/student/courses/:courseId/enroll (and /courses/:courseId/enroll)
router.post(['/student/courses/:courseId/enroll', '/courses/:courseId/enroll'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await learningAnalyticsService.enrollStudentInCourse(studentId, req.params.courseId);
    res.status(result.alreadyEnrolled ? 200 : 201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/learning/student/courses/:courseId/modules/:moduleId/complete (and /courses/:courseId/modules/:moduleId/complete)
router.post(['/student/courses/:courseId/modules/:moduleId/complete', '/courses/:courseId/modules/:moduleId/complete'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const result = await learningAnalyticsService.completeModule(studentId, req.params.courseId, req.params.moduleId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/learning/student/learning-analytics (and /learning-analytics)
router.get(['/student/learning-analytics', '/learning-analytics'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const analytics = await learningAnalyticsService.getStudentLearningAnalytics(studentId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learning/student/adaptive-recommendations (and /adaptive-recommendations)
router.get(['/student/adaptive-recommendations', '/adaptive-recommendations'], requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const recommendations = await learningAnalyticsService.getAdaptiveRecommendations(studentId);
    res.json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

