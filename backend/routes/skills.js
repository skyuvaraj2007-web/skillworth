const express = require('express');
const router = express.Router();
const db = require('../database/skillworthDatabase');

// GET /api/skills - List available skills & competencies
router.get('/', (req, res) => {
  try {
    const data = db.read();
    return res.json({
      success: true,
      skills: data.skills || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve skills list.' });
  }
});

// GET /api/skills/:id
router.get('/:id', (req, res) => {
  try {
    const data = db.read();
    const skill = (data.skills || []).find(s => s.id === req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill domain not found.' });
    return res.json({ success: true, skill });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving skill details.' });
  }
});

module.exports = router;
