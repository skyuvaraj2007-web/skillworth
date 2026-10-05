const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

// GET /api/assessments - List published assessment protocols
router.get('/', (req, res) => {
  try {
    const list = db.getAssessments();
    return res.json({ success: true, assessments: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assessments.' });
  }
});

// GET /api/assessments/:id - Assessment details with questions
router.get('/:id', (req, res) => {
  try {
    const assessment = db.getAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment protocol not found.' });
    return res.json({ success: true, assessment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving assessment.' });
  }
});

// POST /api/assessments/attempt - Submit candidate responses
router.post('/attempt', requireAuth, async (req, res) => {
  try {
    const { assessmentId, answers, practicalTaskSnippet, practicalDemonstrationNotes } = req.body;
    if (!assessmentId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Valid assessmentId and answers array are required.' });
    }

    const learnerName = req.user.name || 'Candidate';
    const learnerId = req.user.profileId || req.user.id;

    const result = await db.submitAssessmentAttempt({
      assessmentId,
      learnerId,
      learnerName,
      answers,
      practicalTaskSnippet,
      practicalDemonstrationNotes
    });

    return res.json({
      success: true,
      message: result.credential ? 'Assessment completed and Credential issued!' : 'Assessment attempt submitted.',
      result: result.result,
      credential: result.credential
    });
  } catch (err) {
    console.error('[SkillWorth Assessment] Attempt error:', err);
    return res.status(500).json({ success: false, message: 'Error evaluating assessment attempt.' });
  }
});

module.exports = router;
