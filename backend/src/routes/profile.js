const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let user = null;
    if (userId) {
      user = await relationalManager.getUserById(userId);
    }
    if (!user && req.user?.email) {
      user = await relationalManager.getUserByEmail(req.user.email);
    }
    if (!user && req.user) {
      user = req.user;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.studentId || 'usr_student_01';
    const {
      name,
      phone,
      college,
      degree,
      gradYear,
      careerTarget,
      bio,
      techStackMatrix,
      companionPreferences
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (college !== undefined) updates.college = college;
    if (degree !== undefined) updates.degree = degree;
    if (gradYear !== undefined) updates.gradYear = gradYear;
    if (careerTarget !== undefined) updates.careerTarget = careerTarget;
    if (bio !== undefined) updates.bio = bio;
    if (techStackMatrix !== undefined) updates.techStackMatrix = techStackMatrix;
    if (companionPreferences !== undefined) updates.companionPreferences = companionPreferences;

    let updatedUser = await relationalManager.updateUser(userId, updates);
    if (!updatedUser && db && typeof db.updateUser === 'function') {
      updatedUser = db.updateUser(userId, updates);
    }

    res.json({
      success: true,
      message: 'Profile settings and career radar saved successfully.',
      data: updatedUser || req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
