/**
 * SKILLNEXUS AI — AI Intelligence Layer REST Routes
 * Provides authenticated endpoints for:
 * 1. AI Skill Gap Analysis
 * 2. AI Course Recommendations
 * 3. AI Learning Path
 * 4. AI Career Recommendations
 * 5. AI Student-Opportunity Matching
 * 6. NEXUS AI Assistant (Role-Aware)
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const relationalManager = require('../db/relationalManager');

// AI Intelligence Services
const skillGapService = require('../services/ai/skillGapService');
const courseRecommendationService = require('../services/ai/courseRecommendationService');
const learningPathService = require('../services/ai/learningPathService');
const careerCopilotService = require('../services/ai/careerCopilotService');
const careerRecommendationService = require('../services/ai/careerRecommendationService');
const aiMatchingService = require('../services/ai/aiMatchingService');
const nexusAssistantService = require('../services/ai/nexusAssistantService');
const aiContextService = require('../services/ai/aiContextService');

// Helper to resolve student ID from user token
function getStudentId(req) {
  return req.user?.studentId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/ai/skill-gap — AI Skill Gap Analysis
// ─────────────────────────────────────────────────────────────────────────────
router.get('/skill-gap', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId && req.user?.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student role required for personal skill gap analysis' });
    }
    const targetRoleOverride = req.query.targetRole || null;
    const result = await skillGapService.analyzeSkillGap(studentId, targetRoleOverride);

    // Dispatch telemetry event safely
    try {
      if (typeof relationalManager.addNotification === 'function') {
        await relationalManager.addNotification('student', {
          type: 'telemetry_ai_view',
          title: 'Skill Gap Intelligence Generated',
          message: `Evaluated ${result.masteredSkills.length} mastered competencies vs ${result.priorityGaps.length} priority gaps for ${result.targetRole}.`,
          details: { targetRole: result.targetRole, readinessScore: result.readinessScore }
        });
      }
    } catch (tErr) {}

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/ai/skill-gap] Error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/ai/course-recommendations — AI Course Recommendations
// ─────────────────────────────────────────────────────────────────────────────
router.get('/course-recommendations', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId && req.user?.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student role required for course recommendations' });
    }
    const result = await courseRecommendationService.getRecommendations(studentId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/ai/course-recommendations] Error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/ai/learning-path — AI Personalized Learning Path
// ─────────────────────────────────────────────────────────────────────────────
router.get('/learning-path', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId && req.user?.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student role required for learning path generation' });
    }
    const result = await learningPathService.generateLearningPath(studentId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/ai/learning-path] Error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/ai/career-recommendations — AI Career Recommendation
// ─────────────────────────────────────────────────────────────────────────────
router.get('/career-recommendations', requireAuth, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId && req.user?.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student role required for career recommendations' });
    }
    const result = await careerRecommendationService.getCareerRecommendations(studentId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/ai/career-recommendations] Error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/ai/match/:opportunityId — AI Student–Opportunity Matching
// ─────────────────────────────────────────────────────────────────────────────
router.get('/match/:opportunityId', requireAuth, async (req, res) => {
  try {
    const studentId = req.query.studentId || getStudentId(req);
    const opportunityId = req.params.opportunityId;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required to calculate AI match' });
    }

    const result = await aiMatchingService.matchStudentToOpportunity(studentId, opportunityId, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/ai/match] Error:', err.message);
    const isForbidden = err.message.includes('Forbidden');
    const isNotFound = err.message.includes('not found');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 500).json({
      success: false,
      message: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/ai/chat & /api/ai/nexus/chat — NEXUS AI Assistant
// ─────────────────────────────────────────────────────────────────────────────
const handleChat = async (req, res) => {
  try {
    const message = req.body.message || req.body.prompt || '';
    if (req.baseUrl?.includes('career-copilot') || req.originalUrl?.includes('career-copilot')) {
      const studentId = req.user?.studentId || req.user?.id;
      const result = await careerCopilotService.processCopilotMessage(studentId, message, req.body.conversationId);
      return res.json({ success: true, data: result, reply: result.reply });
    }
    const result = await nexusAssistantService.chat(req.user, message);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/ai/chat] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/chat', requireAuth, handleChat);
router.post('/nexus/chat', requireAuth, handleChat);

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/ai/institution/skill-intelligence — Institution Cohort Intelligence
// ─────────────────────────────────────────────────────────────────────────────
router.get('/institution/skill-intelligence', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'institution' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Institution access required' });
    }
    const instId = req.user.institutionId || req.user.collegeId;
    const context = await aiContextService.getInstitutionAIContext(instId);
    res.json({ success: true, data: context });
  } catch (err) {
    console.error('[/api/ai/institution/skill-intelligence] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Career Copilot chat endpoint
router.post(['/copilot/chat', '/chat'], requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const { message, conversationId } = req.body;
    const result = await careerCopilotService.processCopilotMessage(studentId, message, conversationId);
    res.json({ success: true, data: result, reply: result.reply });
  } catch (err) {
    console.error('[/api/ai/copilot/chat] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Career Copilot conversation history
router.get('/copilot/history', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const conversationId = req.query.conversationId || null;
    const history = careerCopilotService.getConversationHistory(studentId, conversationId);
    res.json({ success: true, data: history });
  } catch (err) {
    console.error('[/api/ai/copilot/history] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Career Copilot clear conversation
router.post('/copilot/clear', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const conversationId = req.body?.conversationId || null;
    const result = careerCopilotService.clearConversationHistory(studentId, conversationId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/ai/copilot/clear] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
