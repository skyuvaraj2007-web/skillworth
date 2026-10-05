/**
 * Career Readiness Routes — Phase 2
 * 
 * Endpoints for retrieving evidence-based Career Readiness scores,
 * component breakdowns, grounded improvement recommendations, and score history.
 */
const express = require('express');
const router = express.Router();
const careerReadinessService = require('../services/careerReadinessService');
const { requireAuth } = require('../middleware/auth');
const skillGraphService = require('../services/skillGraphService');
const pg = require('../db');

/**
 * Resolve student entity securely from JWT
 */
async function resolveAuthStudent(req) {
  const studentIdentifier = req.user?.studentId || req.user?.id;
  let stu = await skillGraphService.resolveStudent(studentIdentifier);
  if (!stu && req.user?.email) {
    const res = await pg.query(
      `SELECT s.* FROM students s JOIN users u ON u.id = s.user_id WHERE u.email = $1 LIMIT 1`,
      [req.user.email]
    );
    stu = res.rows[0] || null;
  }
  return stu;
}

/**
 * GET /api/career-readiness/me
 * Authenticated student's Career Readiness
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const student = await resolveAuthStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const readiness = await careerReadinessService.getCareerReadiness(student.id);
    return res.json({
      success: true,
      data: readiness
    });
  } catch (err) {
    console.error('Error in GET /api/career-readiness/me:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve career readiness score' });
  }
});

/**
 * GET /api/career-readiness/history
 * Authenticated student's historical score timeline
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const student = await resolveAuthStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const history = await careerReadinessService.getCareerReadinessHistory(student.id);
    return res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('Error in GET /api/career-readiness/history:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve career readiness history' });
  }
});

/**
 * POST /api/career-readiness/recalculate
 * Explicit recalculation of authenticated student's score
 */
router.post('/recalculate', requireAuth, async (req, res) => {
  try {
    const student = await resolveAuthStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const readiness = await careerReadinessService.calculateCareerReadiness(student.id);
    return res.json({
      success: true,
      message: 'Career readiness recalculated successfully from verified evidence',
      data: readiness
    });
  } catch (err) {
    console.error('Error in POST /api/career-readiness/recalculate:', err);
    return res.status(500).json({ success: false, message: 'Failed to recalculate career readiness' });
  }
});

/**
 * GET /api/career-readiness/student/:id
 * Authorized institution / faculty access to student readiness
 */
router.get('/student/:id', requireAuth, async (req, res) => {
  try {
    const requestedStudentId = req.params.id;
    const callerRole = req.user?.role;

    // Student can only access their own record
    if (callerRole === 'student') {
      const myStudent = await resolveAuthStudent(req);
      if (!myStudent || myStudent.id !== requestedStudentId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access another student\'s readiness data' });
      }
    } else if (callerRole === 'institution' || callerRole === 'academician' || callerRole === 'faculty') {
      const targetStudent = await skillGraphService.resolveStudent(requestedStudentId);
      if (!targetStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      // Verify institution matches
      const callerInstId = req.user?.institutionId || req.user?.institution_id;
      if (callerInstId && targetStudent.institution_id !== callerInstId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Student belongs to another institution' });
      }
    } else if (callerRole === 'industry') {
      return res.status(403).json({ success: false, message: 'Forbidden: Industry cannot access unauthorized candidate information' });
    } else if (callerRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }

    const readiness = await careerReadinessService.getCareerReadiness(requestedStudentId);
    return res.json({
      success: true,
      data: readiness
    });
  } catch (err) {
    console.error('Error in GET /api/career-readiness/student/:id:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student career readiness' });
  }
});

module.exports = router;
