/**
 * SKILLNEXUS AI — Relational REST API Routes
 * Single Source of Truth linking Students ↔ Institutions ↔ Companies
 */

const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');

// ══════════════════════════════════════════════════════════════════════════
// 0. GLOBAL REAL-TIME SEARCH (PostgreSQL Authoritative)
// ══════════════════════════════════════════════════════════════════════════
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const searchData = await relationalManager.searchEntities(q, { page, limit });
    res.json({ success: true, ...searchData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 1. INSTITUTIONS
// ══════════════════════════════════════════════════════════════════════════
router.get('/institutions', async (req, res) => {
  try {
    const { state } = req.query;
    const list = await relationalManager.getInstitutions(state ? { state } : {});
    res.json({ success: true, count: list.length, data: list, institutions: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/institutions/:id', async (req, res) => {
  try {
    const inst = await relationalManager.getInstitutionById(req.params.id);
    if (!inst) return res.status(404).json({ success: false, message: 'Institution not found' });
    res.json({ success: true, data: inst });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 2. STUDENTS
// ══════════════════════════════════════════════════════════════════════════
router.get('/students', async (req, res) => {
  try {
    const { collegeId } = req.query;
    const students = await relationalManager.getStudents(collegeId);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    const student = await relationalManager.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const saved = await relationalManager.saveStudent(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. COURSES & ENROLLMENTS
// ══════════════════════════════════════════════════════════════════════════
router.get('/courses', async (req, res) => {
  try {
    const { institutionId } = req.query;
    const courses = await relationalManager.getCourses(institutionId);
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const created = await relationalManager.createCourse(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/enrollments', async (req, res) => {
  try {
    const { studentId } = req.query;
    const enrollments = await relationalManager.getEnrollments(studentId);
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/enrollments', async (req, res) => {
  try {
    const { student, course } = req.body;
    if (!student || !course) return res.status(400).json({ success: false, message: 'Student and course required' });
    const enr = await relationalManager.enrollCourse(student, course);
    res.status(201).json({ success: true, data: enr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/enrollments/advance/:id', async (req, res) => {
  try {
    const updated = await relationalManager.advanceModule(req.params.id, req.body?.moduleId);
    if (!updated) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 4. PROJECTS & PROOFS (Sovereign Ledger)
// ══════════════════════════════════════════════════════════════════════════
router.get('/projects', async (req, res) => {
  try {
    const { studentId } = req.query;
    const projects = await relationalManager.getProjects(studentId);
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/projects/submit', async (req, res) => {
  try {
    const project = await relationalManager.submitProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/projects/validate/:id', async (req, res) => {
  try {
    const { isApproved = true, facultyName = 'Prof. K. Ramanathan' } = req.body;
    const validated = await relationalManager.validateProject(req.params.id, isApproved, facultyName);
    if (!validated) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: validated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/companies', async (req, res) => {
  try {
    const companies = await relationalManager.getCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 5. OPPORTUNITIES & APPLICATIONS
// ══════════════════════════════════════════════════════════════════════════
router.get('/opportunities', async (req, res) => {
  try {
    const opps = await relationalManager.getOpportunities();
    res.json({ success: true, data: opps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/opportunities', async (req, res) => {
  try {
    const created = await relationalManager.createOpportunity(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const { studentId, companyId, opportunityId } = req.query;
    const apps = await relationalManager.getApplications({ studentId, companyId, opportunityId });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/applications/apply', async (req, res) => {
  try {
    const { student, opportunity } = req.body;
    if (!student || !opportunity) return res.status(400).json({ success: false, message: 'Student and opportunity required' });
    const app = await relationalManager.submitApplication(student, opportunity);
    res.status(201).json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/applications/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'New stage required' });
    const updated = await relationalManager.updateApplicationStage(req.params.id, stage);
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 6. NOTIFICATIONS & TRASH BIN
// ══════════════════════════════════════════════════════════════════════════
router.get('/notifications', async (req, res) => {
  try {
    const role = req.query.role || 'student';
    const isTrash = req.query.trash === 'true';
    const list = await relationalManager.getNotifications(role, isTrash);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications/:role', async (req, res) => {
  try {
    const isTrash = req.query.trash === 'true';
    const list = await relationalManager.getNotifications(req.params.role, isTrash);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications/:role', async (req, res) => {
  try {
    const created = await relationalManager.addNotification(req.params.role, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const updated = await relationalManager.markNotificationRead(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/read-all/:role', async (req, res) => {
  try {
    await relationalManager.markAllNotificationsRead(req.params.role);
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const deleted = await relationalManager.softDeleteNotification(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications/:id/restore', async (req, res) => {
  try {
    const restored = await relationalManager.restoreNotification(req.params.id);
    res.json({ success: true, data: restored });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/notifications/trash/:role', async (req, res) => {
  try {
    await relationalManager.emptyTrash(req.params.role);
    res.json({ success: true, message: 'Trash emptied' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 7. CAMPUS ↔ INDUSTRY SKILL GAP INTELLIGENCE & TELEMETRY (Phase 4C & 4E)
// ══════════════════════════════════════════════════════════════════════════
router.get('/analytics/skill-gap/:collegeId', async (req, res) => {
  try {
    const analytics = await relationalManager.getCampusSkillGapAnalytics(req.params.collegeId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/institutions/:id/telemetry', async (req, res) => {
  try {
    const telemetry = await relationalManager.getInstitutionTelemetry(req.params.id);
    res.json({ success: true, data: telemetry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 8. CROSS-PORTAL CAREER INTELLIGENCE (Readiness & Matching)
// ══════════════════════════════════════════════════════════════════════════
router.get('/readiness/:studentId', async (req, res) => {
  try {
    const readinessService = require('../services/readinessService');
    const score = await readinessService.calculateReadiness(req.params.studentId);
    res.json({ success: true, data: { studentId: req.params.studentId, readinessScore: score } });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

router.get('/match/:studentId/:opportunityId', async (req, res) => {
  try {
    const matchingService = require('../services/matchingService');
    const result = await matchingService.matchStudentToOpportunity(req.params.studentId, req.params.opportunityId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

router.get('/match-company/:companyId/:studentId', async (req, res) => {
  try {
    const matchingService = require('../services/matchingService');
    const result = await matchingService.matchCompanyToCandidate(req.params.companyId, req.params.studentId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 9. RECENT ECOSYSTEM ACTIVITY STREAM (Section 20 & 21 Database-Backed)
// ══════════════════════════════════════════════════════════════════════════
router.get('/ecosystem-activity', async (req, res) => {
  try {
    const activities = [];

    // 1. Opportunities created by industry
    try {
      const oppRes = await relationalManager.query(
        `SELECT o.id, o.title, o.created_at, COALESCE(c.company_name, 'SBT TECH Innovations') as company_name
         FROM opportunities o
         LEFT JOIN companies c ON c.id = o.company_id
         ORDER BY o.created_at DESC LIMIT 4`
      );
      (oppRes.rows || []).forEach(r => {
        activities.push({
          id: `opp-${r.id}`,
          type: 'opportunity',
          role: 'industry',
          actor: r.company_name,
          action: 'created requirement',
          target: r.title,
          timestamp: r.created_at
        });
      });
    } catch (e) {}

    // 2. Skills published by institution
    try {
      const skillRes = await relationalManager.query(
        `SELECT sk.id, sk.name, sk.created_at
         FROM skills sk
         WHERE sk.name ILIKE '%React%' OR sk.name ILIKE '%State%' OR sk.name ILIKE '%Architecture%'
         ORDER BY sk.created_at DESC LIMIT 4`
      );
      (skillRes.rows || []).forEach(r => {
        activities.push({
          id: `skill-${r.id}`,
          type: 'skill_published',
          role: 'institution',
          actor: 'ABC Engineering College',
          action: 'published skill program',
          target: r.name,
          timestamp: r.created_at
        });
      });
    } catch (e) {}

    // 3. Enrollments by students
    try {
      const enrRes = await relationalManager.query(
        `SELECT e.id, e.enrolled_at, s.full_name, COALESCE(c.title, 'Advanced React.js & State Architecture') as course_title
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN courses c ON c.id = e.course_id
         ORDER BY e.enrolled_at DESC LIMIT 4`
      );
      (enrRes.rows || []).forEach(r => {
        activities.push({
          id: `enr-${r.id}`,
          type: 'enrollment',
          role: 'student',
          actor: r.full_name,
          action: 'enrolled in program',
          target: r.course_title,
          timestamp: r.enrolled_at
        });
      });
    } catch (e) {}

    // 4. Activities / Assessments assigned by academician
    try {
      const asmtRes = await relationalManager.query(
        `SELECT a.id, a.title, a.created_at
         FROM assessments a
         WHERE a.title ILIKE '%React%' OR a.title ILIKE '%Project%'
         ORDER BY a.created_at DESC LIMIT 4`
      );
      (asmtRes.rows || []).forEach(r => {
        activities.push({
          id: `asmt-${r.id}`,
          type: 'activity_assigned',
          role: 'academician',
          actor: 'Dr. Ramesh Sundaram',
          action: 'assigned project activity',
          target: r.title,
          timestamp: r.created_at
        });
      });
    } catch (e) {}

    // 5. Shortlists by industry
    try {
      const slRes = await relationalManager.query(
        `SELECT cs.id, cs.created_at, s.full_name, o.title as opp_title, COALESCE(c.company_name, 'SBT TECH Innovations') as company_name
         FROM candidate_shortlists cs
         JOIN students s ON s.id = cs.student_id
         JOIN opportunities o ON o.id = cs.opportunity_id
         LEFT JOIN companies c ON c.id = cs.company_id
         ORDER BY cs.created_at DESC LIMIT 4`
      );
      (slRes.rows || []).forEach(r => {
        activities.push({
          id: `sl-${r.id}`,
          type: 'shortlist',
          role: 'industry',
          actor: r.company_name,
          action: 'shortlisted candidate',
          target: `${r.full_name} (${r.opp_title})`,
          timestamp: r.created_at
        });
      });
    } catch (e) {}

    // Sort descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: activities.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

