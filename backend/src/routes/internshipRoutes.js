const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');

function normalizeSkill(s) {
  return String(s || '').trim().toLowerCase().replace(/[\.\-_]/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/internships/recommendations — Matching & Recommendations with Gap Analysis
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const studentId = req.query.student_id || req.user?.studentId || req.user?.id;
    const { location, domain, minMatch = 0, search } = req.query;

    let student = await relationalManager.getStudentById(studentId);
    if (!student && req.user?.email) {
      const all = await relationalManager.getStudents();
      student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
    }

    const studentSkills = Array.isArray(student?.skills) 
      ? student.skills.map(s => typeof s === 'string' ? s : s.name)
      : [];

    const normStudentSkills = studentSkills.map(normalizeSkill);

    let opportunities = await relationalManager.getOpportunities();

    // Map each opportunity with calculated skill-match score and gap analysis
    let scored = opportunities.map(opp => {
      const requiredSkills = Array.isArray(opp.skillsMatrix)
        ? opp.skillsMatrix.map(s => typeof s === 'string' ? s : s.name)
        : (Array.isArray(opp.requiredSkills) ? opp.requiredSkills : ['Software Engineering', 'Problem Solving']);

      const matchedSkills = [];
      const missingSkills = [];

      requiredSkills.forEach(reqSkill => {
        const normReq = normalizeSkill(reqSkill);
        const isMatched = normStudentSkills.some(s => s.includes(normReq) || normReq.includes(s));
        if (isMatched) {
          matchedSkills.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
        }
      });

      const totalReq = Math.max(1, requiredSkills.length);
      const calculatedMatchScore = Math.min(100, Math.round((matchedSkills.length / totalReq) * 100));

      return {
        ...opp,
        matchScore: calculatedMatchScore,
        matchedSkills,
        missingSkills,
        gapAnalysis: {
          matchPercentage: calculatedMatchScore,
          matchedCount: matchedSkills.length,
          missingCount: missingSkills.length,
          totalRequired: totalReq,
          summary: missingSkills.length === 0
            ? '100% Skill Fit! Candidate meets or exceeds all technical requirements.'
            : `Missing ${missingSkills.length} requirement(s): ${missingSkills.join(', ')}.`
        }
      };
    });

    // Apply domain/type filter
    if (domain && domain !== 'all') {
      scored = scored.filter(o =>
        (o.domain || o.type || o.department || '').toLowerCase().includes(domain.toLowerCase())
      );
    }

    // Apply location/modality filter
    if (location && location !== 'all') {
      scored = scored.filter(o =>
        (o.location || '').toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply text search
    if (search) {
      const q = search.toLowerCase();
      scored = scored.filter(o =>
        (o.title || '').toLowerCase().includes(q) ||
        (o.company || o.companyName || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
      );
    }

    // Apply minimum match threshold
    if (Number(minMatch) > 0) {
      scored = scored.filter(o => o.matchScore >= Number(minMatch));
    }

    // Sort descending by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Fetch student's applied opportunity IDs
    let appliedIds = [];
    if (studentId) {
      const apps = await relationalManager.getApplications({ studentId });
      appliedIds = (apps || []).map(a => a.opportunityId || a.opportunity_id);
    }

    res.json({
      success: true,
      data: scored,
      appliedIds,
      meta: {
        totalOpportunities: scored.length,
        topMatchScore: scored[0]?.matchScore || 0,
        studentSkillsCount: studentSkills.length
      }
    });
  } catch (err) {
    console.error('Error in /api/internships/recommendations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/internships — General listing
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const opportunities = await relationalManager.getOpportunities();
    res.json({ success: true, data: opportunities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/internships/:id — Details
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const opp = await relationalManager.getOpportunityById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, message: 'Internship not found' });
    res.json({ success: true, data: opp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/internships/:id/apply — Apply to internship
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const opp = await relationalManager.getOpportunityById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Internship listing not found' });
    }

    const studentId = req.user?.studentId || req.user?.id;
    let student = await relationalManager.getStudentById(studentId);
    if (!student && req.user?.email) {
      const all = await relationalManager.getStudents();
      student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
    }

    // Submit application with initial status "Submitted"
    const application = await relationalManager.submitApplication(
      student || { studentId, name: req.user?.name || 'Student' },
      opp
    );

    res.status(201).json({
      success: true,
      message: `Application submitted successfully to ${opp.company || opp.companyName || 'the organization'}. Initial status: Submitted.`,
      data: application
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
