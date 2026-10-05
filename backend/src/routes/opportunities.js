const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');

// GET /api/opportunities
router.get('/', requireAuth, async (req, res) => {
  const { type, minMatch = 0, search, modality } = req.query;
  let opportunities = await relationalManager.getOpportunities();

  if (type && type !== 'all') {
    opportunities = opportunities.filter(o => (o.type || '').toLowerCase().includes(type.toLowerCase()));
  }
  if (Number(minMatch) > 0) {
    opportunities = opportunities.filter(o => (o.matchScore || 0) >= Number(minMatch));
  }
  if (modality) {
    opportunities = opportunities.filter(o => (o.location || '').toLowerCase().includes(modality.toLowerCase()));
  }
  if (search) {
    const q = search.toLowerCase();
    opportunities = opportunities.filter(o =>
      (o.title || '').toLowerCase().includes(q) ||
      (o.company || o.companyName || '').toLowerCase().includes(q) ||
      (o.skillsMatrix || []).some(s => (s.name || '').toLowerCase().includes(q))
    );
  }

  const studentId = req.user?.studentId || req.user?.id;
  const matchingService = require('../services/matchingService');

  // Compute live match scores for student via Feature 2 OpportunityMatchingEngine
  if (studentId) {
    const opportunityMatchingEngine = require('../services/ai/opportunityMatchingEngine');
    const studentSkillAggregator = require('../services/ai/studentSkillAggregator');
    let preloadedContext = null;
    try {
      const studentData = await studentSkillAggregator.aggregateStudentSkills(studentId);
      const fullStudent = await relationalManager.getStudentById(studentId);
      preloadedContext = { studentData, fullStudent };
    } catch (e) {
      console.warn('[Opportunities] preloadedContext notice:', e.message);
    }

    opportunities = await Promise.all(opportunities.map(async (opp) => {
      try {
        const match = await opportunityMatchingEngine.matchStudentToOpportunity(studentId, opp, preloadedContext);
        return {
          ...opp,
          matchScore: match.matchScore,
          matchedSkills: (match.strongSkills || []).concat(match.weakSkills || []),
          strongSkills: match.strongSkills || [],
          weakSkills: match.weakSkills || [],
          missingSkills: match.missingSkills || [],
          matchedRequiredCount: match.matchedRequiredCount,
          totalRequiredCount: match.totalRequiredCount,
          matchedPreferredCount: match.matchedPreferredCount,
          totalPreferredCount: match.totalPreferredCount,
          isEligible: match.isEligible,
          eligibilityFailures: match.eligibilityFailures,
          matchExplanation: `Evaluated ${match.matchedRequiredCount} of ${match.totalRequiredCount} required competencies with ${match.matchedPreferredCount} preferred skill bonuses.`,
          matchEvidence: {
            totalRequired: match.totalRequiredCount,
            totalMatched: match.matchedRequiredCount,
            preferredBonus: match.preferredBonus
          }
        };
      } catch (e) {
        try {
          const match = await matchingService.matchStudentToOpportunity(studentId, opp);
          return {
            ...opp,
            matchScore: match.matchScore,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            matchExplanation: match.explanation,
            matchEvidence: match.evidence
          };
        } catch (err) {
          return opp;
        }
      }
    }));
  }

  let topMatch = 0;
  let topCompany = '';
  opportunities.forEach(o => {
    if ((o.matchScore || 0) > topMatch) {
      topMatch = o.matchScore;
      topCompany = o.company || o.companyName || '';
    }
  });

  // Student-specific applied IDs
  let appliedIds = [];
  try {
    const apps = await relationalManager.getApplications({ studentId });
    appliedIds = (apps || []).map(a => a.opportunityId || a.opportunity_id);
  } catch (e) {}

  res.json({
    success: true,
    data: opportunities,
    metrics: {
      totalRoles: opportunities.length,
      topMatchScore: topMatch,
      topMatchCompany: topCompany || (opportunities[0]?.company || opportunities[0]?.companyName || 'Available'),
      appliedCount: appliedIds.length
    },
    appliedIds
  });
});

// Feature 2: Personalized "Opportunities For You" matching endpoint
const opportunityMatchingEngine = require('../services/ai/opportunityMatchingEngine');

// GET /api/opportunities/for-you
router.get('/for-you', requireAuth, async (req, res) => {
  try {
    let studentId = req.user?.studentId || req.user?.id;
    if (studentId) {
      const student = await relationalManager.getStudentById(studentId);
      if (student) studentId = student.id;
    }
    if (!studentId) {
      const students = await relationalManager.getStudents();
      studentId = students[0]?.id;
    }

    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const matchedOpps = await opportunityMatchingEngine.getStudentMatchedOpportunities(studentId);
    res.json({
      success: true,
      data: matchedOpps
    });
  } catch (err) {
    console.error('[/api/opportunities/for-you] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias: GET /api/opportunities/recommended
router.get('/recommended', requireAuth, async (req, res) => {
  try {
    let studentId = req.user?.studentId || req.user?.id;
    if (studentId) {
      const student = await relationalManager.getStudentById(studentId);
      if (student) studentId = student.id;
    }
    if (!studentId) {
      const students = await relationalManager.getStudents();
      studentId = students[0]?.id;
    }

    const matchedOpps = await opportunityMatchingEngine.getStudentMatchedOpportunities(studentId);
    res.json({ success: true, data: matchedOpps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/opportunities/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const opp = await relationalManager.getOpportunityById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const studentId = req.user?.studentId || req.user?.id;
    let match = { matchScore: 0, matchedSkills: [], missingSkills: [] };
    if (studentId) {
      try {
        const matchingService = require('../services/matchingService');
        match = await matchingService.matchStudentToOpportunity(studentId, req.params.id);
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        ...opp,
        matchScore: match?.matchScore ?? 0,
        matchedSkills: match?.matchedSkills || [],
        missingSkills: match?.missingSkills || [],
        evidence: match?.evidence,
        explanation: match?.explanation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/opportunities/:id/match
router.get('/:id/match', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    const opportunityId = req.params.id;
    const result = await require('../services/matchingService').matchStudentToOpportunity(studentId, opportunityId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/opportunities/:id/apply
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const opp = await relationalManager.getOpportunityById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const studentId = req.user?.studentId || req.user?.id;
    const student = await relationalManager.getStudentById(studentId);
    const oppId = opp.oppId || opp.id || req.params.id;

    // Prevent duplicate applications: UNIQUE(student_id, opportunity_id)
    const existingApps = await relationalManager.getApplications({
      studentId: student?.id || studentId,
      opportunityId: oppId
    });
    if (existingApps && existingApps.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: You have already applied for this opportunity.'
      });
    }

    const application = await relationalManager.submitApplication(
      student || { studentId },
      opp
    );

    res.status(201).json({
      success: true,
      message: `Application transmitted successfully to ${opp.company || opp.companyName || 'the company'}! Your verified profile has been attached.`,
      data: application
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
