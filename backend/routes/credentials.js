const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

// GET /api/credentials/verify/:credentialId - Public & Industry Verification
router.get('/verify/:credentialId', (req, res) => {
  try {
    const { credentialId } = req.params;
    const result = db.verifyCredential(credentialId);
    if (!result.valid) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[SkillWorth Credentials] Verify error:', err);
    return res.status(500).json({ success: false, valid: false, message: 'Verification lookup failed.' });
  }
});

// GET /api/credentials/my - Learner's authenticated credentials
router.get('/my', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const list = db.getUserCredentials(learnerId);
    return res.json({ success: true, credentials: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching credentials.' });
  }
});

module.exports = router;
