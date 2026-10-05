const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

// GET /api/assessor/pending - Get evidence pending assessor review
router.get('/pending', requireAuth, (req, res) => {
  try {
    const data = db.read();
    const pending = (data.evidence || []).filter(e => e.verificationStatus === 'PENDING_REVIEW' || !e.verificationStatus);
    return res.json({ success: true, pending });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching pending reviews.' });
  }
});

// POST /api/assessor/evaluate - Official Assessor Decision
router.post('/evaluate', requireAuth, async (req, res) => {
  try {
    const { evidenceId, decision, feedback } = req.body;
    if (!evidenceId || !decision) {
      return res.status(400).json({ success: false, message: 'Evidence ID and decision are required.' });
    }

    const assessorName = req.user.name || 'Lead Authorized Assessor';
    const result = await db.evaluateEvidenceByAssessor(evidenceId, decision, feedback, assessorName);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json({
      success: true,
      message: 'Evidence successfully evaluated (' + decision + ').',
      evidence: result.evidence,
      credential: result.credential
    });
  } catch (err) {
    console.error('[SkillWorth Assessor] Evaluation error:', err);
    return res.status(500).json({ success: false, message: 'Error processing assessor evaluation.' });
  }
});

// GET /api/assessor/status - Check accreditation status
router.get('/status', requireAuth, (req, res) => {
  try {
    const data = db.read();
    const assessor = data.assessors.find(a => a.userId === req.user.id);
    return res.json({
      success: true,
      status: assessor ? assessor.status : 'APPROVED',
      assessor: assessor || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving assessor status.' });
  }
});

module.exports = router;
