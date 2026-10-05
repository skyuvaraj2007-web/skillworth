const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const careerCopilotService = require('../services/ai/careerCopilotService');

// POST /api/career-copilot/chat
router.post(['/chat', '/'], requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const message = req.body?.message || req.body?.prompt || '';
    const conversationId = req.body?.conversationId || null;
    const result = await careerCopilotService.processCopilotMessage(studentId, message, conversationId);
    res.json({ success: true, data: result, reply: result.reply });
  } catch (err) {
    console.error('[/api/career-copilot/chat] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/career-copilot/history
router.get(['/history', '/copilot/history'], requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const conversationId = req.query.conversationId || null;
    const history = careerCopilotService.getConversationHistory(studentId, conversationId);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/career-copilot/clear
router.post(['/clear', '/copilot/clear'], requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const conversationId = req.body?.conversationId || null;
    const result = careerCopilotService.clearConversationHistory(studentId, conversationId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
