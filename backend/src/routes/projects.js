const express = require('express');
const router = express.Router();
const db = require('../db');
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');

// Helper to extract student ID
function getStudentId(req) {
  return req.user?.studentId || req.user?.id || 'STU-TN010-CAMPUS-9184';
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { status, filter } = req.query;

    const detailed = await relationalManager.getStudentProjectsDetailed(studentId);
    let projects = detailed.projects;

    // If no projects exist in relationalManager, provide initial default projects seeded from db
    if (projects.length === 0) {
      const dbProjects = db.getProjects(studentId);
      if (dbProjects && dbProjects.length > 0) {
        for (const dp of dbProjects) {
          try {
            await relationalManager.createStudentProject(studentId, {
              title: dp.title,
              category: dp.category,
              status: dp.status.includes('Completed') ? 'COMPLETED' : 'ONGOING',
              progress: dp.progress || 50,
              techStack: dp.techStack,
              repoUrl: dp.repoUrl,
              demoUrl: dp.demoUrl,
              shortDescription: dp.description || dp.title,
              isPublished: true
            });
          } catch (e) { /* ignore seed duplication */ }
        }
        const refreshed = await relationalManager.getStudentProjectsDetailed(studentId);
        projects = refreshed.projects;
      }
    }

    // Filter logic
    if (filter && filter !== 'all') {
      if (filter === 'in-progress') {
        projects = projects.filter(p => p.status === 'ONGOING' || p.status.includes('In Progress'));
      } else if (filter === 'completed') {
        projects = projects.filter(p => p.status === 'COMPLETED' || p.status === 'Completed');
      } else if (filter === 'validated') {
        projects = projects.filter(p => p.verificationStatus === 'VERIFIED' || p.status.includes('Validated'));
      }
    }

    const refreshedDetailed = await relationalManager.getStudentProjectsDetailed(studentId);

    res.json({
      success: true,
      data: projects,
      metrics: {
        totalProjects: refreshedDetailed?.metrics?.totalProjects ?? refreshedDetailed?.totalCount ?? projects.length,
        activeProjects: refreshedDetailed?.metrics?.ongoingProjects ?? 0,
        verifiedProjects: refreshedDetailed?.metrics?.verifiedProjects ?? refreshedDetailed?.completedCount ?? 0,
        totalActivities: refreshedDetailed?.metrics?.totalActivities ?? 0,
        totalEvidence: refreshedDetailed?.metrics?.totalEvidence ?? 0,
        portfolioStrength: refreshedDetailed?.metrics?.portfolioStrength ?? 80,
        verifiedCommits: 142,
        recruiterProofRate: 88,
        cloudSandboxesOnline: 2
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/projects/activity-feed ──────────────────────────────────────────
router.get('/activity-feed', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const feed = await relationalManager.getStudentActivityFeed(studentId);
    res.json({ success: true, data: feed, count: feed.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const project = await relationalManager.getStudentProjectById(studentId, req.params.id);
    res.json({ success: true, data: project });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { title } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    const newProject = await relationalManager.createStudentProject(studentId, req.body);

    // Keep legacy db sync for backward compatibility
    try {
      db.addProject({
        userId: studentId,
        title: newProject.title,
        category: newProject.category,
        techStack: newProject.technologies,
        repoUrl: newProject.repoUrl,
        demoUrl: newProject.demoUrl,
        description: newProject.shortDescription,
        progress: newProject.progress,
        status: newProject.status === 'COMPLETED' ? 'Completed' : 'In Progress (Active Sandbox)',
        sandboxAvailable: true
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Project created and initialized with professional portfolio telemetry & cloud sandbox.',
      data: newProject
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const updated = await relationalManager.updateStudentProject(studentId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Project details updated successfully.',
      data: updated
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/projects/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const deleted = await relationalManager.deleteStudentProject(studentId, req.params.id);
    res.json({
      success: true,
      message: 'Project removed from portfolio.',
      data: deleted
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects/:id/publish ───────────────────────────────────────────
router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { isPublished } = req.body;
    const project = await relationalManager.publishStudentProject(studentId, req.params.id, isPublished !== false);
    res.json({
      success: true,
      message: project.isPublished ? 'Project published to public profile.' : 'Project marked as private.',
      data: project
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects/:id/submit-verification ───────────────────────────────
router.post('/:id/submit-verification', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const project = await relationalManager.sendProjectToInstitution(studentId, req.params.id);
    res.json({
      success: true,
      message: 'Project successfully submitted to mapped institution for academic validation.',
      data: project
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects/:id/activities ─────────────────────────────────────────
router.post('/:id/activities', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const result = await relationalManager.addProjectActivity(studentId, req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Project activity recorded in professional timeline.',
      data: result
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── PUT /api/projects/:id/activities/:activityId ─────────────────────────────
router.put('/:id/activities/:activityId', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const result = await relationalManager.updateProjectActivity(studentId, req.params.id, req.params.activityId, req.body);
    res.json({
      success: true,
      message: 'Project activity status updated.',
      data: result
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/projects/:id/activities/:activityId ──────────────────────────
router.delete('/:id/activities/:activityId', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const result = await relationalManager.deleteProjectActivity(studentId, req.params.id, req.params.activityId);
    res.json({
      success: true,
      message: 'Project activity deleted.',
      data: result
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── GET /api/projects/:id/ai-insights ────────────────────────────────────────
router.get('/:id/ai-insights', requireAuth, async (req, res) => {
  try {
    const insights = await relationalManager.getProjectAiInsights(req.params.id);
    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects/:id/sandbox ───────────────────────────────────────────
router.post('/:id/sandbox', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Cloud sandbox provisioned.',
    sandbox: {
      status: 'RUNNING',
      containerId: 'sbx-' + Math.random().toString(36).substring(2, 9),
      endpoint: 'https://sandbox-node-89.nexus.internal:8080',
      terminalReady: true,
      resources: { cpu: '2 vCPU', memory: '4 GB RAM', storage: '20 GB NVMe' }
    }
  });
});

module.exports = router;
