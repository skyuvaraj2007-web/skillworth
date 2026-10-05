/**
 * SKILL NEXUS AI — Skill Graph 2.0 Routes
 * Provides evidence-backed Skill Graph 2.0 endpoints with multi-tenant RBAC isolation.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const skillGraphService = require('../services/skillGraphService');

// GET /api/skill-graph/me — Authenticated student's complete Skill Graph 2.0
router.get('/me', requireAuth, async (req, res) => {
  try {
    const studentIdentifier = req.user?.studentId || req.user?.id;
    const result = await skillGraphService.buildStudentSkillGraph(studentIdentifier);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/skill-graph/student/:id — Role-scoped access (Institution / Faculty / Recruiter)
router.get('/student/:id', requireAuth, async (req, res) => {
  try {
    const targetStudentId = req.params.id;
    const result = await skillGraphService.getSkillGraphForStudent(targetStudentId, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/skill-graph/sync — Synchronize / rebuild graph from latest database evidence
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const targetStudentId = req.body?.studentId || req.user?.studentId || req.user?.id;
    const result = await skillGraphService.buildStudentSkillGraph(targetStudentId);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/skill-graph/evidence — Record a verified skill evidence link
router.post('/evidence', requireAuth, async (req, res) => {
  try {
    const { studentId, skillId, evidenceType, evidenceId, title, score, confidence, metadata } = req.body;
    const resolvedStudentId = studentId || req.user?.studentId || req.user?.id;

    const result = await skillGraphService.recordSkillEvidence({
      studentId: resolvedStudentId,
      skillId,
      evidenceType,
      evidenceId,
      title,
      score,
      confidence,
      metadata
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
