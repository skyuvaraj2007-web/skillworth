const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

// POST /api/auth/register - Role-based registration
router.post('/register', async (req, res) => {
  try {
    const result = await db.registerUser(req.body);
    if (!result.success) {
      return res.status(result.code || 400).json(result);
    }

    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.fullName || result.user.repFullName || result.user.companyName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: result.message,
      token,
      user: result.user
    });
  } catch (err) {
    console.error('[SkillWorth Auth] Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/auth/login - Role-aware login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await db.authenticateUser(email, password, role);
    if (!result.success) {
      return res.status(result.code || 401).json(result);
    }

    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.fullName || result.user.repFullName || result.user.companyName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Sign in successful.',
      token,
      user: result.user
    });
  } catch (err) {
    console.error('[SkillWorth Auth] Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during sign in.' });
  }
});

// GET /api/auth/me - Validate session & get current profile
router.get('/me', requireAuth, (req, res) => {
  try {
    const data = db.read();
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    let profile = null;
    if (user.role === 'LEARNER') {
      profile = data.learner_profiles.find(p => p.userId === user.id);
    } else if (user.role === 'INSTITUTION') {
      profile = data.institution_profiles.find(p => p.userId === user.id);
      if (profile) {
        const assessor = data.assessors.find(a => a.userId === user.id || a.institutionId === profile.id);
        if (assessor) {
          profile.assessor = assessor;
          profile.assessorStatus = assessor.status;
        }
      }
    } else if (user.role === 'INDUSTRY') {
      profile = data.industry_profiles.find(p => p.userId === user.id);
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage || 'en',
        ...profile
      }
    });
  } catch (err) {
    console.error('[SkillWorth Auth] Me error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving user session.' });
  }
});

// GET /api/auth/demo-users - Quick credentials for demo testing
router.get('/demo-users', (req, res) => {
  return res.json({
    success: true,
    demoAccounts: [
      {
        role: 'LEARNER',
        name: 'Arun Kumar',
        email: 'learner.demo@skillworth.org',
        password: 'SkillWorth@2026',
        subtitle: 'B.Tech CSE - 3rd Year'
      },
      {
        role: 'INSTITUTION',
        name: 'Dr. S. Meenakshi Sundaram',
        email: 'assessor.demo@skillworth.org',
        password: 'SkillWorth@2026',
        subtitle: 'Director of Assessor Accreditation'
      },
      {
        role: 'INDUSTRY',
        name: 'Karthik Narayanan (HexaCloud)',
        email: 'industry.demo@skillworth.org',
        password: 'SkillWorth@2026',
        subtitle: 'Enterprise Talent Verification'
      }
    ]
  });
});

module.exports = router;
