const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// Middleware to enforce tenant (company) isolation
function verifyCompany(req, res, next) {
  const userRole = (req.user?.role || '').toLowerCase();
  if (!['company', 'industry', 'corporate', 'admin'].includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Company role required' });
  }
  const companyId = req.user?.companyId || req.user?.id;
  if (!companyId && userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Company context missing' });
  }
  req.companyId = companyId || req.query.companyId || null;
  next();
}

// ---------- Company Profile ----------
router.get('/profile', requireAuth, verifyCompany, async (req, res) => {
  try {
    const profile = await relationalManager.getCompanyProfile(req.companyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { companyName, industry, website, headquarters, state } = req.body;
    try {
      const updateData = { updated_at: new Date().toISOString() };
      if (companyName) updateData.company_name = companyName;
      if (industry) updateData.industry = industry;
      if (website) updateData.website_url = website;
      if (headquarters) updateData.headquarters = headquarters;
      if (state) updateData.state = state;
      await supabase.from('companies').update(updateData).eq('id', req.companyId);
    } catch (err) {
      console.warn('[company] Supabase profile update note:', err.message);
    }
    const updated = await relationalManager.getCompanyProfile(req.companyId);
    res.json({ success: true, message: 'Company profile updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Candidates (for Company Talent Search) ----------
router.get('/candidates', requireAuth, verifyCompany, async (req, res) => {
  try {
    const students = await relationalManager.getStudents();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Companies ----------
router.get('/', requireAuth, async (req, res) => {
  try {
    const companies = await relationalManager.getCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Opportunities (Scoped to Company or Public) ----------
router.get('/opportunities', async (req, res) => {
  if (req.headers.authorization) {
    return requireAuth(req, res, () => {
      verifyCompany(req, res, async () => {
        try {
          const opps = await relationalManager.getOpportunitiesByCompany(req.companyId);
          res.json({ success: true, data: opps });
        } catch (err) {
          res.status(500).json({ success: false, message: err.message });
        }
      });
    });
  }
  try {
    const opps = await relationalManager.getOpportunities();
    res.json({ success: true, data: opps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/opportunities', requireAuth, verifyCompany, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (!['admin', 'company', 'industry', 'corporate'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    }
    const created = await relationalManager.createOpportunity({ ...req.body, companyId: req.companyId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Feature 2: Industry <-> Student Skill Matching Endpoints ----------
const opportunityMatchingEngine = require('../services/ai/opportunityMatchingEngine');

// GET Recommended Candidates for an Opportunity (with filters)
router.get('/opportunities/:id/recommended-candidates', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await opportunityMatchingEngine.calculateOpportunityMatches(req.params.id, req.query);
    res.json({
      success: true,
      data: result.candidates,
      opportunity: result.opportunity,
      totalCandidates: result.totalCandidates
    });
  } catch (err) {
    console.error('[recommended-candidates] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias: GET /opportunities/:id/matches (backwards compatibility for UI)
router.get('/opportunities/:id/matches', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await opportunityMatchingEngine.calculateOpportunityMatches(req.params.id, req.query);
    res.json({
      success: true,
      data: result.candidates,
      opportunity: result.opportunity,
      totalCandidates: result.totalCandidates
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Calculate/Recalculate Matches
router.post('/opportunities/:id/calculate-matches', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await opportunityMatchingEngine.calculateOpportunityMatches(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Matching calculation complete and persisted',
      data: result.candidates,
      opportunity: result.opportunity
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Shortlist Candidate
router.post('/opportunities/:id/shortlist', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { studentId, isShortlisted = true } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }
    const result = await opportunityMatchingEngine.toggleShortlist(req.params.id, studentId, isShortlisted);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE Shortlist Candidate (Remove shortlist)
router.delete('/opportunities/:id/shortlist/:studentId', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await opportunityMatchingEngine.toggleShortlist(req.params.id, req.params.studentId, false);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Candidates (Students) ----------
router.get('/candidates', requireAuth, verifyCompany, async (req, res) => {
  try {
    const candidates = await relationalManager.getStudentsByCompany(req.companyId);
    res.json({ success: true, data: candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Dashboard ----------
router.get('/dashboard', requireAuth, verifyCompany, async (req, res) => {
  try {
    const dashboard = await relationalManager.getCompanyDashboard(req.companyId);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Profile Update ----------
router.put('/profile', requireAuth, verifyCompany, async (req, res) => {
  try {
    const updated = await relationalManager.updateCompany(req.companyId, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Opportunity Detail ----------
router.get('/opportunities/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const opp = await relationalManager.getOpportunityById(req.params.id);
    if (!opp || opp.companyId !== req.companyId) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, data: opp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/opportunities/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const updated = await relationalManager.updateOpportunity(req.params.id, req.body, req.companyId);
    if (!updated) return res.status(404).json({ success: false, message: 'Opportunity not found or unauthorized' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/opportunities/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const deleted = await relationalManager.deleteOpportunity(req.params.id, req.companyId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Opportunity not found or unauthorized' });
    res.json({ success: true, message: 'Opportunity deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Talent Pools ----------
router.get('/talent-pools', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pools = await relationalManager.getTalentPoolsByCompany(req.companyId);
    res.json({ success: true, data: pools || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/talent-pools', requireAuth, verifyCompany, async (req, res) => {
  try {
    const created = await relationalManager.createTalentPool({ ...req.body, companyId: req.companyId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/talent-pools/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pools = await relationalManager.getTalentPoolsByCompany(req.companyId);
    const pool = pools.find(p => p.poolId === req.params.id);
    if (!pool) return res.status(404).json({ success: false, message: 'Talent pool not found' });
    res.json({ success: true, data: pool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/talent-pools/:id/candidates', requireAuth, verifyCompany, async (req, res) => {
  try {
    const updated = await relationalManager.addCandidateToTalentPool(req.params.id, req.body.studentId);
    if (!updated) return res.status(404).json({ success: false, message: 'Talent pool not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/talent-pools/:id/candidates/:studentId', requireAuth, verifyCompany, async (req, res) => {
  try {
    const success = await relationalManager.removeCandidateFromTalentPool(req.params.id, req.params.studentId);
    if (!success) return res.status(404).json({ success: false, message: 'Talent pool or candidate not found' });
    res.json({ success: true, message: 'Candidate removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Matches for Opportunity ----------
router.get('/opportunities/:id/matches', requireAuth, verifyCompany, async (req, res) => {
  try {
    const matchingService = require('../services/matchingService');
    const opp = await relationalManager.getOpportunityById(req.params.id);
    const oppCompanyId = opp ? (opp.companyId || opp.company_id) : null;
    if (!opp || !oppCompanyId || (String(oppCompanyId) !== String(req.companyId) && req.user?.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    const students = await relationalManager.getStudents(); // all students
    const matches = [];
    for (const student of students) {
      if (!student.studentId && !student.id) continue;
      try {
        const result = matchingService.calculateMatch(student, opp);
        if (result) {
          matches.push({
            studentId: student.studentId || student.id,
            name: student.name || student.fullName,
            matchScore: result.matchScore,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            explanation: result.explanation
          });
        }
      } catch (e) { /* skip unmatched students */ }
    }
    matches.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Applications ----------
router.get('/applications', requireAuth, verifyCompany, async (req, res) => {
  try {
    const apps = await relationalManager.getApplicationsByCompany(req.companyId);
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/applications/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const app = await relationalManager.getApplicationById(req.params.id, req.companyId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/applications/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });
    const app = await relationalManager.getApplicationById(req.params.id, req.companyId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });

    const updated = await relationalManager.updateApplicationStage(req.params.id, stage, req.user?.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/applications/:id/stage', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });
    const app = await relationalManager.getApplicationById(req.params.id, req.companyId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });

    const updated = await relationalManager.updateApplicationStage(req.params.id, stage, req.user?.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/applications/:id/select', requireAuth, verifyCompany, async (req, res) => {
  try {
    const selected = await relationalManager.selectStudentForTesting(req.params.id, {
      userId: req.user?.id,
      role: 'company'
    });
    res.json({ success: true, message: 'Student selected for company testing.', data: selected });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Certificates ----------
router.get('/certificates', requireAuth, verifyCompany, async (req, res) => {
  try {
    const certs = await relationalManager.getCompanyCertificates(req.companyId);
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Interviews ----------
router.get('/interviews', requireAuth, verifyCompany, async (req, res) => {
  try {
    const ints = await relationalManager.getInterviewsByCompany(req.companyId);
    res.json({ success: true, data: ints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/interviews', requireAuth, verifyCompany, async (req, res) => {
  try {
    const created = await relationalManager.createInterview({ ...req.body, companyId: req.companyId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/interviews/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const updated = await relationalManager.updateInterview(req.params.id, req.body, req.companyId);
    if (!updated) return res.status(404).json({ success: false, message: 'Interview not found or unauthorized' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Partnerships ----------
router.get('/partnerships', requireAuth, verifyCompany, async (req, res) => {
  try {
    const parts = await relationalManager.getPartnershipsByCompany(req.companyId);
    const reqs = await relationalManager.getCompanyAccessRequests(req.companyId);
    const formattedReqs = (reqs || []).map(r => ({
      id: r.id,
      requestId: r.id,
      institutionId: r.institutionId,
      institutionName: r.institutionName,
      companyId: req.companyId,
      type: 'COLLABORATION_REQUEST',
      status: r.status,
      message: r.message,
      studentCount: r.studentCount,
      createdAt: r.requestedAt
    }));
    res.json({ success: true, data: [...parts, ...formattedReqs] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/partnerships/:id/accept', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.respondToStudentAccessRequest(req.params.id, req.companyId, 'ACCEPTED', req.user?.id);
    let part = null;
    try {
      const { data: pUp } = await supabase
        .from('company_institution_partnerships')
        .update({ status: 'ACCEPTED' })
        .eq('id', req.params.id)
        .select();
      if (pUp && pUp.length > 0) part = pUp[0];
    } catch (e) {}
    if (!part && !relationalManager.isPgRequired) {
      const data = relationalManager._read();
      const reqRecord = (data.accessRequests || []).find(r => r.id === req.params.id || r.requestId === req.params.id);
      const instId = reqRecord?.institutionId || 'INST-001';
      part = (data.partnerships || []).find(p => p.id === req.params.id || (p.companyId === req.companyId && p.institutionId === instId));
      if (!part) {
        part = {
          id: req.params.id,
          institutionId: instId,
          companyId: req.companyId,
          status: 'ACCEPTED',
          createdAt: new Date().toISOString()
        };
        data.partnerships = data.partnerships || [];
        data.partnerships.unshift(part);
        relationalManager._write(data);
      } else {
        part.status = 'ACCEPTED';
        relationalManager._write(data);
      }
    }
    res.json({ success: true, data: { ...result, status: 'ACCEPTED', partnership: part || { id: req.params.id, status: 'ACCEPTED' } } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/partnerships', requireAuth, verifyCompany, async (req, res) => {
  try {
    const created = await relationalManager.createPartnership({ ...req.body, companyId: req.companyId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/institutions/:institutionId/students', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { institutionId } = req.params;
    let isPartnered = false;
    try {
      const { data: pRes } = await supabase
        .from('company_institution_partnerships')
        .select('id')
        .or(`company_id.eq.${req.companyId}`)
        .in('status', ['ACTIVE', 'ACCEPTED'])
        .limit(1);
      isPartnered = Boolean(pRes && pRes.length > 0);
    } catch (e) {}

    if (!isPartnered && !relationalManager.isPgRequired) {
      const data = relationalManager._read();
      isPartnered = (data.partnerships || []).some(p =>
        (p.companyId === req.companyId || p.company_id === req.companyId) &&
        (p.institutionId === institutionId || p.institution_id === institutionId) &&
        (p.status === 'ACCEPTED' || p.status === 'ACTIVE')
      ) || (data.accessRequests || []).some(r =>
        (r.companyId === req.companyId || r.company_id === req.companyId) &&
        (r.institutionId === institutionId || r.institution_id === institutionId) &&
        r.status === 'ACCEPTED'
      );
    }

    if (!isPartnered) {
      return res.status(403).json({ success: false, message: 'Forbidden: No active partnership with this institution' });
    }

    const instStudents = await relationalManager.getStudents(institutionId);
    let sharedStudentIds = new Set();
    if (!relationalManager.isPgRequired) {
      const data = relationalManager._read();
      sharedStudentIds = new Set(
        (data.sharedStudents || [])
          .filter(s => (s.companyId === req.companyId || s.company_id === req.companyId) && s.accessStatus === 'ACTIVE')
          .map(s => s.studentId || s.student_id)
      );
    }
    const authorized = instStudents.filter(s => sharedStudentIds.has(s.studentId || s.id) || sharedStudentIds.size === 0);
    res.json({ success: true, data: authorized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Student Access Requests ----------
router.get('/student-access-requests', requireAuth, verifyCompany, async (req, res) => {
  try {
    const requests = await relationalManager.getCompanyAccessRequests(req.companyId);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/student-access-requests/:id/respond', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const normalizedAction = String(action || 'ACCEPTED').toUpperCase();
    const result = await relationalManager.respondToStudentAccessRequest(req.params.id, req.companyId, normalizedAction, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/student-access-requests/:id/accept', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.respondToStudentAccessRequest(req.params.id, req.companyId, 'ACCEPTED', req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/student-access-requests/:id/reject', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.respondToStudentAccessRequest(req.params.id, req.companyId, 'REJECTED', req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/student-access-requests/:id/revoke', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.revokeCompanyAccess(req.params.id, { companyId: req.companyId });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Authorized Students Management ----------
router.get('/authorized-students', requireAuth, verifyCompany, async (req, res) => {
  try {
    const students = await relationalManager.getAuthorizedStudentsByCompany(req.companyId);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get(['/students/:studentId', '/candidates/:studentId'], requireAuth, verifyCompany, async (req, res) => {
  try {
    const { studentId } = req.params;
    const isShared = await relationalManager.isStudentSharedWithCompany(studentId, req.companyId);
    if (!isShared) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorized access to this student profile'
      });
    }

    const student = await relationalManager.getStudentById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { password, passwordHash, token, google_id, ...safeStudent } = student;
    res.json({ success: true, data: safeStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/students/:studentId/development', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { studentId } = req.params;
    const isShared = await relationalManager.isStudentSharedWithCompany(studentId, req.companyId);
    if (!isShared) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorized access to this student timeline'
      });
    }

    const timeline = await relationalManager.getStudentDevelopmentTimeline(studentId);
    const events = Array.isArray(timeline) ? timeline : (timeline?.events || []);
    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Placement Offers ----------
router.post('/applications/:id/offer', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { studentId, opportunityId, offerDetails } = req.body;
    const result = await relationalManager.createOffer({
      companyId: req.companyId,
      applicationId: req.params.id,
      studentId,
      opportunityId,
      offerDetails
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Course Learner Profile (Scoped to Course & Company) ----------
router.get('/courses/:courseId/students/:studentId/profile', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const profile = await relationalManager.getCourseLearnerProfileForCompany(req.companyId, courseId, studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Learner profile or enrollment not found for this course' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Course-Wise Skill Benchmark Talent Discovery ----------
router.post('/talent-discovery', requireAuth, verifyCompany, async (req, res) => {
  try {
    const searchParams = req.body || {};
    const result = await relationalManager.searchTalentEcosystem(req.companyId, searchParams);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Targeted Student Search with Benchmark & Verified Evidence ----------
router.post('/targeted-students', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.getTargetedStudents(req.companyId, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/targeted-students', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.getTargetedStudents(req.companyId, req.query || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/skills-catalog', requireAuth, async (req, res) => {
  try {
    const catalog = await relationalManager.getSkillCatalog();
    res.json({ success: true, data: catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/courses-catalog', requireAuth, async (req, res) => {
  try {
    const catalog = await relationalManager.getCourseCatalog();
    res.json({ success: true, data: catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/courses', requireAuth, async (req, res) => {
  try {
    const catalog = await relationalManager.getCourseCatalog();
    res.json({ success: true, data: catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/courses', requireAuth, verifyCompany, async (req, res) => {
  try {
    const {
      title,
      code,
      courseCode,
      category,
      level,
      difficulty,
      durationWeeks,
      duration_weeks,
      duration,
      hours,
      instructor,
      institutionId,
      institution_id,
      skillsDeveloped,
      skillsTaught,
      skills,
      modules,
      description
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Course title is required' });
    }

    const created = await relationalManager.createCourse({
      title: title.trim(),
      code: code || courseCode,
      category: category || 'Cloud Computing',
      level: level || difficulty || 'Intermediate',
      difficulty: level || difficulty || 'Intermediate',
      durationWeeks: durationWeeks || duration_weeks || 8,
      hours: hours || 24,
      instructor: instructor || 'Campus Faculty / Industry Lead',
      companyId: req.companyId,
      companyName: req.user?.companyName || req.user?.company || 'Enterprise Partner',
      institutionId: institutionId || institution_id || null,
      skillsTaught: skillsDeveloped || skillsTaught || skills || [],
      modules: modules || [],
      description: description || ''
    });

    res.status(201).json({
      success: true,
      data: created,
      message: 'Course published successfully! Collaboration institution and students have been notified.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// COMPANY TARGETED ASSESSMENTS & NEXUS AI QUESTION GENERATION
// ════════════════════════════════════════════════════════════════

router.get('/assessments', requireAuth, verifyCompany, async (req, res) => {
  try {
    const list = await relationalManager.getCompanyAssessments(req.companyId);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments', requireAuth, verifyCompany, async (req, res) => {
  try {
    const assessment = await relationalManager.createCompanyAssessment(req.companyId, req.body);
    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/ai-drafts', requireAuth, verifyCompany, async (req, res) => {
  const { category = 'Logical Reasoning', topic = 'Algorithms', difficulty = 'Intermediate', count = 3, targetRole = 'Software Engineer' } = req.body;

  const AIProvider = require('../services/ai/aiProvider');
  const ai = new AIProvider();

  if (!ai.isAvailable()) {
    return res.status(503).json({
      success: false,
      code: 'AI_UNAVAILABLE',
      message: 'NEXUS AI service is currently unavailable or offline. Manual question creation is available.'
    });
  }

  try {
    const prompt = `Generate ${count} assessment questions for role "${targetRole}" in category "${category}" on topic "${topic}" at "${difficulty}" difficulty.
Respond ONLY with a valid JSON array of objects with the following format:
For MCQ (Logical Reasoning or Aptitude):
[
  {
    "category": "${category}",
    "questionType": "MCQ",
    "questionText": "Question description",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation",
    "marks": 2,
    "difficulty": "${difficulty}"
  }
]
For Programming:
[
  {
    "category": "Programming",
    "questionType": "CODE",
    "questionText": "Problem description",
    "programmingLanguage": "JavaScript",
    "starterCode": "function solution(input) {\\n  // Return answer\\n}",
    "inputDescription": "Input format",
    "outputDescription": "Return value",
    "constraints": "Constraints",
    "testCases": [
      { "input": "test1", "expectedOutput": "out1", "isHidden": false },
      { "input": "test2", "expectedOutput": "out2", "isHidden": true }
    ],
    "marks": 10,
    "difficulty": "${difficulty}"
  }
]`;

    const aiRes = await ai.generateCompletion({
      prompt,
      systemPrompt: 'You are NEXUS AI, an assessment creator for SkillNexus enterprise hiring. Output pure JSON without markdown.',
      temperature: 0.3
    });

    if (!aiRes.success || !aiRes.text) {
      return res.status(503).json({
        success: false,
        code: 'AI_UNAVAILABLE',
        message: aiRes.message || 'AI question generation failed.'
      });
    }

    let cleanJson = aiRes.text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    let drafts = JSON.parse(cleanJson);
    if (!Array.isArray(drafts)) drafts = [drafts];

    const validatedDrafts = drafts.map((d, i) => ({
      id: `draft_${Date.now()}_${i}`,
      category: d.category || category,
      questionType: d.questionType || (category === 'Programming' ? 'CODE' : 'MCQ'),
      questionText: d.questionText || d.question || 'Technical Problem',
      options: Array.isArray(d.options) ? d.options : [],
      correctAnswer: d.correctAnswer !== undefined ? String(d.correctAnswer) : '',
      explanation: d.explanation || '',
      marks: Number(d.marks || (category === 'Programming' ? 10 : 2)),
      difficulty: d.difficulty || difficulty,
      programmingLanguage: d.programmingLanguage || 'JavaScript',
      starterCode: d.starterCode || '',
      inputDescription: d.inputDescription || '',
      outputDescription: d.outputDescription || '',
      constraints: d.constraints || '',
      testCases: Array.isArray(d.testCases) ? d.testCases : [],
      status: 'AI_DRAFT_REVIEW_REQUIRED'
    }));

    res.json({
      success: true,
      code: 'AI_DRAFTS_GENERATED',
      message: 'NEXUS AI drafted questions. Review and approve before publishing.',
      data: validatedDrafts
    });
  } catch (err) {
    console.error('[ai-drafts] Error:', err.message);
    res.status(500).json({ success: false, code: 'AI_PARSE_ERROR', message: 'Failed to parse AI questions. Try manual question creation.' });
  }
});

router.get('/assessments/:id', requireAuth, verifyCompany, async (req, res) => {
  try {
    const assessment = await relationalManager.getCompanyAssessmentById(req.params.id, req.companyId);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found or unauthorized' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/:id/questions', requireAuth, verifyCompany, async (req, res) => {
  try {
    const question = await relationalManager.addAssessmentQuestion(req.params.id, req.companyId, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/assessments/:id/questions/:qId', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.deleteAssessmentQuestion(req.params.qId, req.params.id, req.companyId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/:id/targets', requireAuth, verifyCompany, async (req, res) => {
  try {
    const { studentIds = [] } = req.body;
    const result = await relationalManager.assignAssessmentTargets(req.params.id, req.companyId, studentIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/:id/publish', requireAuth, verifyCompany, async (req, res) => {
  try {
    const result = await relationalManager.publishAssessment(req.params.id, req.companyId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// FEATURE 3: INDUSTRY ASSESSMENT BUILDER & QUESTION BANK ROUTES
// ════════════════════════════════════════════════════════════════

// Helper to resolve company DB record
async function resolveCompanyRecord(pg, companyIdentifier) {
  if (!pg) return null;
  const cRes = await pg.query(
    `SELECT c.id, c.company_name FROM companies c
     LEFT JOIN company_members cm ON cm.company_id = c.id
     WHERE c.id::text = $1 OR cm.user_id::text = $1 LIMIT 1`,
    [String(companyIdentifier)]
  );
  if (cRes.rows.length > 0) return cRes.rows[0];
  const fallback = await pg.query(`SELECT id, company_name FROM companies LIMIT 1`);
  return fallback.rows[0] || null;
}

// 1. GET /api/company/question-bank — Search and filter question bank
router.get('/question-bank', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pg = relationalManager.pg;
    if (!pg) throw new Error('Database connection required');

    const company = await resolveCompanyRecord(pg, req.companyId);
    const { category, difficulty, skill, questionType, q, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, company_id, category, question_type, topic, difficulty, skills,
             question_text, options, explanation, marks, programming_language, starter_code,
             input_description, output_description, constraints, test_cases,
             usage_count, is_system, created_at,
             correct_answer, multiple_answers, numerical_answer, numerical_tolerance
      FROM question_bank
      WHERE (company_id = $1 OR company_id IS NULL OR is_system = true)
    `;
    const params = [company?.id || null];
    let paramIndex = 2;

    if (category) {
      query += ` AND category ILIKE $${paramIndex++}`;
      params.push(`%${category}%`);
    }
    if (difficulty) {
      query += ` AND difficulty ILIKE $${paramIndex++}`;
      params.push(`%${difficulty}%`);
    }
    if (questionType) {
      query += ` AND question_type ILIKE $${paramIndex++}`;
      params.push(`%${questionType}%`);
    }
    if (skill) {
      query += ` AND skills @> $${paramIndex++}::jsonb`;
      params.push(JSON.stringify([skill]));
    }
    if (q) {
      query += ` AND (question_text ILIKE $${paramIndex} OR topic ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    query += ` ORDER BY usage_count DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(Number(limit), Number(offset));

    const result = await pg.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/company/question-bank — Save a new reusable question to Question Bank
router.post('/question-bank', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pg = relationalManager.pg;
    if (!pg) throw new Error('Database connection required');

    const company = await resolveCompanyRecord(pg, req.companyId);
    const qData = req.body;

    const resDb = await pg.query(
      `INSERT INTO question_bank (
        company_id, title, category, question_type, topic, difficulty, skills, question_text,
        options, correct_answer, multiple_answers, numerical_answer, numerical_tolerance,
        explanation, marks, programming_language, starter_code, input_description,
        output_description, constraints, test_cases, usage_count, is_system, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8,
        $9::jsonb, $10, $11::jsonb, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21::jsonb, 0, false, NOW()
      ) RETURNING *`,
      [
        company?.id || null,
        qData.title || qData.topic || qData.category || 'Technical Question',
        qData.category || 'Programming',
        qData.questionType || qData.question_type || 'MCQ',
        qData.topic || qData.category || 'General',
        qData.difficulty || 'Intermediate',
        JSON.stringify(Array.isArray(qData.skills) ? qData.skills : (qData.skill ? [qData.skill] : [])),
        qData.questionText || qData.question || '',
        JSON.stringify(Array.isArray(qData.options) ? qData.options : []),
        qData.correctAnswer !== undefined ? String(qData.correctAnswer) : null,
        JSON.stringify(Array.isArray(qData.multipleAnswers) ? qData.multipleAnswers : []),
        qData.numericalAnswer !== undefined && qData.numericalAnswer !== null ? Number(qData.numericalAnswer) : null,
        qData.numericalTolerance !== undefined && qData.numericalTolerance !== null ? Number(qData.numericalTolerance) : 0,
        qData.explanation || null,
        Number(qData.marks || 5),
        qData.programmingLanguage || qData.programming_language || 'JavaScript',
        qData.starterCode || qData.starter_code || null,
        qData.inputDescription || qData.input_description || null,
        qData.outputDescription || qData.output_description || null,
        qData.constraints || null,
        JSON.stringify(Array.isArray(qData.testCases) ? qData.testCases : (Array.isArray(qData.test_cases) ? qData.test_cases : []))
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Question added to Question Bank successfully',
      data: resDb.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/company/candidate-targets — Candidate targeting metadata (colleges, departments, students, opportunities)
router.get('/candidate-targets', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pg = relationalManager.pg;
    if (!pg) throw new Error('Database connection required');

    const company = await resolveCompanyRecord(pg, req.companyId);

    // Colleges / Institutions
    const instRes = await pg.query(`
      SELECT i.id, i.name, i.code, i.city, i.state,
             COALESCE((SELECT COUNT(*) FROM students s WHERE s.institution_id = i.id), 0) AS student_count
      FROM institutions i
      ORDER BY i.name ASC
    `);

    // Departments
    const deptRes = await pg.query(`
      SELECT d.id, d.name, d.code,
             COALESCE((SELECT COUNT(*) FROM students s WHERE s.department_id = d.id), 0) AS student_count
      FROM departments d
      ORDER BY d.name ASC
    `);

    // Top students
    const studRes = await pg.query(`
      SELECT s.id, s.full_name, s.roll_number, s.cgpa, s.year_of_study,
             COALESCE(d.name, 'Engineering') AS department_name,
             COALESCE(i.name, 'Campus Partner') AS institution_name
      FROM students s
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN institutions i ON i.id = s.institution_id
      ORDER BY s.full_name ASC
      LIMIT 150
    `);

    // Company's active opportunities with applicant & shortlisted stats
    let opps = [];
    if (company) {
      const oppRes = await pg.query(`
        SELECT o.id, o.title, o.opportunity_type, o.required_skills, o.status,
               COALESCE((SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id), 0) AS applicant_count,
               COALESCE((SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id AND (a.stage ILIKE '%shortlist%' OR a.status ILIKE '%shortlist%')), 0) +
               COALESCE((SELECT COUNT(*) FROM opportunity_match_scores oms WHERE oms.opportunity_id = o.id AND oms.match_status = 'SHORTLISTED'), 0) AS shortlisted_count
        FROM opportunities o
        WHERE o.company_id = $1
        ORDER BY o.created_at DESC
      `, [company.id]);
      opps = oppRes.rows;
    }

    res.json({
      success: true,
      data: {
        colleges: instRes.rows,
        departments: deptRes.rows,
        students: studRes.rows,
        opportunities: opps
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/company/assessments/builder — 6-Step Industry Assessment Builder Endpoint
router.post('/assessments/builder', requireAuth, verifyCompany, async (req, res) => {
  const pg = relationalManager.pg;
  if (!pg) return res.status(500).json({ success: false, message: 'Database connection required' });

  try {
    const company = await resolveCompanyRecord(pg, req.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company profile required' });

    const {
      title,
      domain = 'Technical & Engineering Benchmark',
      description = '',
      instructions = 'Answer all questions to the best of your ability.',
      opportunityId = null,
      skills = [],
      categories = ['Programming', 'Logical Reasoning', 'Aptitude'],
      skillWeights = {},
      questions = [],
      candidateSelection = {},
      settings = {},
      saveQuestionsToBank = false,
      publishImmediately = false
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required.' });
    }

    const durationMinutes = Number(settings.durationMinutes || settings.timeLimitMinutes || 45);
    const passingScore = Number(settings.passingScore || 70);
    const attemptsAllowed = Number(settings.attemptsAllowed || 1);
    const randomOrder = Boolean(settings.randomOrder);
    const randomOptions = Boolean(settings.randomOptions);
    const totalMarks = questions.reduce((acc, q) => acc + Number(q.marks || 1), 0);
    const trackCode = `TGT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const status = publishImmediately ? 'PUBLISHED' : 'DRAFT';

    // 1. Insert into assessments table
    const asmtInsert = await pg.query(
      `INSERT INTO assessments (
        track_code, company_id, opportunity_id, title, domain, description, instructions,
        assessment_type, categories, skills, skill_weights, duration_minutes, time_limit_minutes,
        passing_score, attempts_allowed, random_order, random_options, settings, status,
        total_marks, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TARGETED_INDUSTRY', $8::jsonb, $9::jsonb, $10::jsonb, $11, $11,
        $12, $13, $14, $15, $16::jsonb, $17,
        $18, NOW(), NOW()
      ) RETURNING *`,
      [
        trackCode,
        company.id,
        opportunityId || null,
        title.trim(),
        domain,
        description,
        instructions,
        JSON.stringify(categories),
        JSON.stringify(skills),
        JSON.stringify(skillWeights),
        durationMinutes,
        passingScore,
        attemptsAllowed,
        randomOrder,
        randomOptions,
        JSON.stringify(settings),
        status,
        totalMarks
      ]
    );

    const createdAssessment = asmtInsert.rows[0];
    const assessmentId = createdAssessment.id;

    // 2. Insert questions into assessment_questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qSkills = Array.isArray(q.skills) && q.skills.length > 0
        ? q.skills
        : (q.category ? [q.category] : []);

      await pg.query(
        `INSERT INTO assessment_questions (
          assessment_id, topic, category, question_type, question_text, options,
          correct_answer, multiple_answers, numerical_answer, numerical_tolerance, explanation,
          marks, difficulty, skills, programming_language, starter_code, input_description,
          output_description, constraints, test_cases, order_index, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb,
          $7, $8::jsonb, $9, $10, $11,
          $12, $13, $14::jsonb, $15, $16, $17,
          $18, $19, $20::jsonb, $21, NOW()
        )`,
        [
          assessmentId,
          q.topic || q.category || 'General',
          q.category || 'Logical Reasoning',
          q.questionType || q.question_type || 'MCQ',
          q.questionText || q.question || '',
          JSON.stringify(Array.isArray(q.options) ? q.options : []),
          q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
          JSON.stringify(Array.isArray(q.multipleAnswers) ? q.multipleAnswers : []),
          q.numericalAnswer !== undefined && q.numericalAnswer !== null ? Number(q.numericalAnswer) : null,
          q.numericalTolerance !== undefined && q.numericalTolerance !== null ? Number(q.numericalTolerance) : 0,
          q.explanation || null,
          Number(q.marks || 1),
          q.difficulty || 'Intermediate',
          JSON.stringify(qSkills),
          q.programmingLanguage || q.programming_language || 'JavaScript',
          q.starterCode || q.starter_code || null,
          q.inputDescription || q.input_description || null,
          q.outputDescription || q.output_description || null,
          q.constraints || null,
          JSON.stringify(Array.isArray(q.testCases) ? q.testCases : (Array.isArray(q.test_cases) ? q.test_cases : [])),
          i + 1
        ]
      );

      // Increment usage count in question bank if question came from bank
      if (q.id && typeof q.id === 'string' && !q.id.startsWith('temp_') && !q.id.startsWith('draft_')) {
        await pg.query(`UPDATE question_bank SET usage_count = usage_count + 1 WHERE id::text = $1`, [q.id]).catch(() => {});
      } else if (saveQuestionsToBank) {
        // Save new question to question bank for company reuse
        await pg.query(
          `INSERT INTO question_bank (
            company_id, title, category, question_type, topic, difficulty, skills, question_text,
            options, correct_answer, multiple_answers, numerical_answer, numerical_tolerance,
            explanation, marks, programming_language, starter_code, input_description,
            output_description, constraints, test_cases, usage_count, is_system, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7::jsonb, $8,
            $9::jsonb, $10, $11::jsonb, $12, $13,
            $14, $15, $16, $17, $18,
            $19, $20, $21::jsonb, 1, false, NOW()
          ) ON CONFLICT DO NOTHING`,
          [
            company.id,
            q.title || q.topic || q.category || 'Technical Question',
            q.category || 'Logical Reasoning',
            q.questionType || q.question_type || 'MCQ',
            q.topic || q.category || 'General',
            q.difficulty || 'Intermediate',
            JSON.stringify(qSkills),
            q.questionText || q.question || '',
            JSON.stringify(Array.isArray(q.options) ? q.options : []),
            q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
            JSON.stringify(Array.isArray(q.multipleAnswers) ? q.multipleAnswers : []),
            q.numericalAnswer !== undefined && q.numericalAnswer !== null ? Number(q.numericalAnswer) : null,
            q.numericalTolerance !== undefined && q.numericalTolerance !== null ? Number(q.numericalTolerance) : 0,
            q.explanation || null,
            Number(q.marks || 1),
            q.programmingLanguage || q.programming_language || 'JavaScript',
            q.starterCode || q.starter_code || null,
            q.inputDescription || q.input_description || null,
            q.outputDescription || q.output_description || null,
            q.constraints || null,
            JSON.stringify(Array.isArray(q.testCases) ? q.testCases : (Array.isArray(q.test_cases) ? q.test_cases : []))
          ]
        ).catch(() => {});
      }
    }

    // 3. Resolve and assign targeted candidates
    let targetedStudentIds = [];
    const targetType = candidateSelection.targetType || 'selected_students';

    if (targetType === 'selected_students' && Array.isArray(candidateSelection.studentIds)) {
      targetedStudentIds = candidateSelection.studentIds;
    } else if (targetType === 'selected_college' && candidateSelection.collegeId) {
      const sRes = await pg.query(`SELECT id FROM students WHERE institution_id = $1`, [candidateSelection.collegeId]);
      targetedStudentIds = sRes.rows.map(r => r.id);
    } else if (targetType === 'selected_department' && candidateSelection.departmentId) {
      const sRes = await pg.query(`SELECT id FROM students WHERE department_id = $1`, [candidateSelection.departmentId]);
      targetedStudentIds = sRes.rows.map(r => r.id);
    } else if (targetType === 'opportunity_applicants' && (candidateSelection.opportunityId || opportunityId)) {
      const oppId = candidateSelection.opportunityId || opportunityId;
      const sRes = await pg.query(`SELECT DISTINCT student_id AS id FROM applications WHERE opportunity_id = $1`, [oppId]);
      targetedStudentIds = sRes.rows.map(r => r.id);
    } else if (targetType === 'opportunity_shortlisted' && (candidateSelection.opportunityId || opportunityId)) {
      const oppId = candidateSelection.opportunityId || opportunityId;
      const sRes = await pg.query(`
        SELECT DISTINCT student_id AS id FROM applications WHERE opportunity_id = $1 AND current_stage ILIKE '%shortlist%'
      `, [oppId]);
      targetedStudentIds = sRes.rows.map(r => r.id);
    }

    let assignedCount = 0;
    for (const sid of targetedStudentIds) {
      const sRes = await pg.query(`SELECT id, institution_id FROM students WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`, [String(sid)]);
      if (sRes.rows.length > 0) {
        const student = sRes.rows[0];
        const ins = await pg.query(
          `INSERT INTO assessment_targets (assessment_id, student_id, institution_id, status, assigned_at)
           VALUES ($1, $2, $3, 'ASSIGNED', NOW())
           ON CONFLICT (assessment_id, student_id) DO NOTHING
           RETURNING id`,
          [assessmentId, student.id, student.institution_id]
        );
        if (ins.rows.length > 0) assignedCount++;
      }
    }

    // 4. Publish immediately if requested
    if (publishImmediately) {
      await relationalManager.publishAssessment(assessmentId, req.companyId);
    }

    res.status(201).json({
      success: true,
      message: publishImmediately
        ? 'Assessment successfully created, published, and targeted students notified!'
        : 'Assessment successfully drafted with questions and candidate assignments.',
      data: {
        id: assessmentId,
        trackCode,
        title: createdAssessment.title,
        status: publishImmediately ? 'PUBLISHED' : 'DRAFT',
        questionCount: questions.length,
        totalMarks,
        assignedCount,
        durationMinutes
      }
    });
  } catch (err) {
    console.error('[POST /assessments/builder] Error:', err);
    res.status(500).json({ success: false, message: 'Assessment creation failed: ' + err.message });
  }
});

// 5. GET /api/company/assessments/:id/results — Ranked assessment candidates with skill-wise performance
router.get('/assessments/:id/results', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pg = relationalManager.pg;
    if (!pg) throw new Error('Database connection required');

    const asmt = await relationalManager.getCompanyAssessmentById(req.params.id, req.companyId);
    if (!asmt) return res.status(404).json({ success: false, message: 'Assessment not found or unauthorized' });

    const rawResults = await pg.query(
      `SELECT at.id AS target_id, at.status, at.score, at.total_marks, at.result_status, at.started_at, at.submitted_at, at.feedback,
              s.id AS student_id, s.full_name AS student_name, s.roll_number, s.email, s.cgpa,
              COALESCE(d.name, 'Engineering') AS department,
              i.id AS institution_id, i.name AS institution_name,
              EXISTS (
                SELECT 1 FROM applications app
                WHERE app.opportunity_id = $2 AND app.student_id = s.id AND app.current_stage ILIKE '%shortlist%'
              ) AS is_shortlisted
       FROM assessment_targets at
       JOIN students s ON s.id = at.student_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN institutions i ON i.id = at.institution_id
       WHERE at.assessment_id = $1
       ORDER BY at.score DESC NULLS LAST, at.submitted_at ASC NULLS LAST`,
      [req.params.id, asmt.opportunity_id || '00000000-0000-0000-0000-000000000000']
    );

    const candidates = rawResults.rows.map((r, idx) => {
      let fb = r.feedback;
      if (typeof fb === 'string') {
        try { fb = JSON.parse(fb); } catch (e) { fb = {}; }
      }
      fb = fb || {};

      return {
        rank: r.score !== null ? idx + 1 : null,
        targetId: r.target_id,
        studentId: r.student_id,
        studentName: r.student_name,
        rollNumber: r.roll_number,
        email: r.email,
        cgpa: r.cgpa,
        department: r.department,
        institutionName: r.institution_name,
        status: r.status,
        score: r.score,
        totalMarks: r.total_marks,
        resultStatus: r.result_status,
        startedAt: r.started_at,
        submittedAt: r.submitted_at,
        isShortlisted: Boolean(r.is_shortlisted),
        skillWisePerformance: fb.skillWisePerformance || {},
        questionBreakdown: fb.breakdown || []
      };
    });

    const completed = candidates.filter(c => c.status === 'COMPLETED');
    const passed = completed.filter(c => c.resultStatus === 'PASSED');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((acc, c) => acc + (c.score || 0), 0) / completed.length)
      : 0;
    const topScore = completed.length > 0
      ? Math.max(...completed.map(c => c.score || 0))
      : 0;

    res.json({
      success: true,
      data: {
        assessment: {
          id: asmt.id,
          title: asmt.title,
          status: asmt.status,
          durationMinutes: asmt.duration_minutes || asmt.time_limit_minutes,
          totalMarks: asmt.total_marks,
          passingScore: asmt.passing_score || 70,
          opportunityId: asmt.opportunity_id,
          skills: asmt.skills || [],
          categories: asmt.categories || [],
          questionCount: asmt.questions?.length || 0
        },
        summary: {
          totalAssigned: candidates.length,
          completedCount: completed.length,
          inProgressCount: candidates.filter(c => c.status === 'IN_PROGRESS').length,
          pendingCount: candidates.filter(c => c.status === 'ASSIGNED').length,
          passCount: passed.length,
          averageScore: avgScore,
          topScore: topScore
        },
        candidates
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/company/assessments/:id/shortlist-candidate — Shortlist candidate from results
router.post('/assessments/:id/shortlist-candidate', requireAuth, verifyCompany, async (req, res) => {
  try {
    const pg = relationalManager.pg;
    if (!pg) throw new Error('Database connection required');

    const asmt = await relationalManager.getCompanyAssessmentById(req.params.id, req.companyId);
    if (!asmt) return res.status(404).json({ success: false, message: 'Assessment not found or unauthorized' });

    const { studentId, opportunityId = asmt.opportunity_id } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    // 1. If associated with an opportunity, update application current_stage
    if (opportunityId) {
      await pg.query(`
        UPDATE applications
        SET current_stage = 'SHORTLISTED', updated_at = NOW()
        WHERE opportunity_id = $1 AND student_id = $2
      `, [opportunityId, studentId]);
    }

    // 2. Notify student
    const sRes = await pg.query(`SELECT user_id, full_name FROM students WHERE id = $1`, [studentId]);
    if (sRes.rows.length > 0 && sRes.rows[0].user_id) {
      const compRes = await pg.query(`SELECT company_name FROM companies WHERE id = $1`, [asmt.company_id]);
      const companyName = compRes.rows[0]?.company_name || 'Enterprise Partner';

      await pg.query(`
        INSERT INTO notifications (
          recipient_type, recipient_id, notification_type, title, message, related_entity_type, related_entity_id, is_read, created_at
        ) VALUES (
          'student', $1, 'ASSESSMENT_SHORTLISTED', $2, $3, 'assessment', $4, false, NOW()
        )
      `, [
        sRes.rows[0].user_id,
        'Congratulations! You have been Shortlisted',
        `Based on your outstanding performance in "${asmt.title}", ${companyName} has shortlisted you!`,
        asmt.id
      ]);
    }

    res.json({
      success: true,
      message: 'Candidate shortlisted successfully and notification sent.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/company/learning-assessments — Posted Assessments in Learning Portal
// ─────────────────────────────────────────────────────────────────────────────
router.get('/learning-assessments', requireAuth, verifyCompany, async (req, res) => {
  const pg = relationalManager.pg;
  if (!pg) return res.status(500).json({ success: false, message: 'Database connection required' });

  try {
    const company = await resolveCompanyRecord(pg, req.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company profile required' });

    const asmtRes = await pg.query(
      `SELECT a.*, 
              COUNT(DISTINCT at.id)::int AS total_assigned,
              COUNT(DISTINCT CASE WHEN at.status = 'COMPLETED' OR at.status = 'SUBMITTED' THEN at.id END)::int AS total_submitted,
              AVG(CASE WHEN at.score IS NOT NULL THEN at.score END)::numeric(5,1) AS average_score
       FROM assessments a
       LEFT JOIN assessment_targets at ON at.assessment_id = a.id
       WHERE a.company_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [company.id]
    );

    const assessmentsWithStudents = await Promise.all(asmtRes.rows.map(async (asmt) => {
      const targetsRes = await pg.query(
        `SELECT at.id AS target_id, at.status, at.score, at.total_marks, at.result_status, at.started_at, at.submitted_at, at.feedback,
                s.id AS student_id, s.full_name AS student_name, s.email, s.roll_number,
                COALESCE(d.name, 'Engineering') AS department,
                i.id AS institution_id, i.name AS institution_name
         FROM assessment_targets at
         JOIN students s ON s.id = at.student_id
         LEFT JOIN departments d ON d.id = s.department_id
         LEFT JOIN institutions i ON i.id = at.institution_id
         WHERE at.assessment_id = $1
         ORDER BY at.score DESC NULLS LAST`,
        [asmt.id]
      );

      let settingsObj = asmt.settings;
      if (typeof settingsObj === 'string') {
        try { settingsObj = JSON.parse(settingsObj); } catch { settingsObj = {}; }
      }
      settingsObj = settingsObj || {};

      return {
        id: asmt.id,
        trackCode: asmt.track_code,
        title: asmt.title,
        domain: asmt.domain,
        description: asmt.description,
        instructions: asmt.instructions,
        status: asmt.status,
        durationMinutes: asmt.duration_minutes || asmt.time_limit_minutes || 45,
        passingScore: asmt.passing_score || 70,
        totalMarks: asmt.total_marks,
        programmingLanguage: settingsObj.programmingLanguage || (Array.isArray(asmt.skills) ? asmt.skills[0] : 'JavaScript'),
        projectTitle: settingsObj.projectTitle || 'Applied Engineering Project',
        projectDomain: settingsObj.projectDomain || asmt.domain || 'Software Engineering',
        projectDescription: settingsObj.projectDescription || asmt.description,
        projectDeliverables: settingsObj.projectDeliverables || 'Comprehensive code implementation and verified unit test execution.',
        starterCode: settingsObj.starterCode || '',
        deadline: settingsObj.deadline || null,
        createdAt: asmt.created_at,
        totalAssigned: asmt.total_assigned || 0,
        totalSubmitted: asmt.total_submitted || 0,
        averageScore: asmt.average_score ? Number(asmt.average_score) : null,
        assignedStudents: targetsRes.rows
      };
    }));

    res.json({
      success: true,
      data: assessmentsWithStudents
    });
  } catch (err) {
    console.error('[GET /company/learning-assessments] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /api/company/learning-assessments — Post Assessment Test for Selected Students
// ─────────────────────────────────────────────────────────────────────────────
router.post('/learning-assessments', requireAuth, verifyCompany, async (req, res) => {
  const pg = relationalManager.pg;
  if (!pg) return res.status(500).json({ success: false, message: 'Database connection required' });

  try {
    const company = await resolveCompanyRecord(pg, req.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company profile required' });

    const {
      title,
      programmingLanguage = 'JavaScript',
      projectTitle = 'Applied Engineering Capstone',
      projectDomain = 'Software Systems',
      projectDescription = '',
      projectDeliverables = 'Complete project implementation, clean repository code, and automated test pass.',
      starterCode = '',
      durationMinutes = 45,
      passingScore = 70,
      deadline = null,
      instructions = 'Solve the programming challenge and project problem statement independently.',
      selectedStudents = [],
      selectedStudentIds = [],
      questions = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    // Resolve target students list
    let targetStudents = [];
    if (Array.isArray(selectedStudents) && selectedStudents.length > 0) {
      targetStudents = selectedStudents;
    } else if (Array.isArray(selectedStudentIds) && selectedStudentIds.length > 0) {
      const sRes = await pg.query(
        `SELECT s.id, s.user_id, s.full_name, s.email, s.institution_id, i.name AS institution_name, COALESCE(d.name, 'Engineering') AS department
         FROM students s
         LEFT JOIN institutions i ON i.id = s.institution_id
         LEFT JOIN departments d ON d.id = s.department_id
         WHERE s.id = ANY($1::uuid[]) OR s.user_id = ANY($1::uuid[])`,
        [selectedStudentIds]
      );
      targetStudents = sRes.rows;
    }

    if (targetStudents.length === 0) {
      // Fallback: pick up to 3 active students from company candidates
      const fallback = await pg.query(
        `SELECT s.id, s.user_id, s.full_name, s.email, s.institution_id, i.name AS institution_name, COALESCE(d.name, 'Engineering') AS department
         FROM students s
         LEFT JOIN institutions i ON i.id = s.institution_id
         LEFT JOIN departments d ON d.id = s.department_id
         LIMIT 3`
      );
      targetStudents = fallback.rows;
    }

    // Prepare questions (if none provided, build default programming challenge + project MCQ)
    let questionsList = questions;
    if (!Array.isArray(questionsList) || questionsList.length === 0) {
      questionsList = [
        {
          topic: projectTitle,
          category: 'Programming',
          questionType: 'PROGRAMMING',
          questionText: `Implement the core algorithmic engine for project: "${projectTitle}". Ensure optimal time complexity and robust edge-case handling.`,
          programmingLanguage: programmingLanguage,
          starterCode: starterCode || `// Solution in ${programmingLanguage}\nfunction solution(input) {\n  // Implement core logic here\n  return true;\n}`,
          inputDescription: 'Formatted input string or stream representing system telemetry.',
          outputDescription: 'Computed optimal result or boolean verification flag.',
          constraints: '1 <= N <= 10^5, Execution time < 2000ms',
          marks: 50,
          difficulty: 'Intermediate',
          testCases: [
            { input: 'test_sample_1', expectedOutput: 'true', isHidden: false },
            { input: 'test_sample_2', expectedOutput: 'true', isHidden: true }
          ]
        },
        {
          topic: 'System Architecture',
          category: 'Technical Architecture',
          questionType: 'MCQ',
          questionText: `For the "${projectTitle}" architecture in ${programmingLanguage}, which deployment pattern guarantees zero-downtime microservice transitions?`,
          options: [
            'Blue-Green Deployment with synthetic health checks',
            'Direct in-place single-instance restarts',
            'Un-versioned container image overwrites',
            'Single monolith replica scale-out'
          ],
          correctAnswer: '0',
          marks: 25,
          difficulty: 'Intermediate',
          explanation: 'Blue-Green deployments provide sovereign zero-downtime routing via dual identical production environments.'
        },
        {
          topic: 'Performance & Scalability',
          category: 'Optimization',
          questionType: 'MCQ',
          questionText: `What is the primary architectural bottleneck to mitigate when scaling "${projectTitle}" across distributed cluster nodes?`,
          options: [
            'Database connection exhaustion and unbounded state synchronization',
            'Client side CSS stylesheet parsing latency',
            'Terminal console logging verbosity',
            'DNS lookup cache TTL expiration'
          ],
          correctAnswer: '0',
          marks: 25,
          difficulty: 'Intermediate',
          explanation: 'Database connection pools and cross-node cache coherency represent primary distributed scale bottlenecks.'
        }
      ];
    }

    const totalMarks = questionsList.reduce((acc, q) => acc + Number(q.marks || 10), 0);
    const trackCode = `LRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const fullDescription = `[Project: ${projectTitle}]\n${projectDescription || 'Applied industrial assessment testing competency in ' + programmingLanguage + '.'}`;
    const fullInstructions = `Programming Language: ${programmingLanguage}\nProject Deliverables: ${projectDeliverables}\n${instructions}`;

    const settingsObj = {
      programmingLanguage,
      projectTitle,
      projectDomain,
      projectDescription,
      projectDeliverables,
      starterCode,
      deadline,
      durationMinutes: Number(durationMinutes)
    };

    // 1. Insert into assessments table
    const asmtInsert = await pg.query(
      `INSERT INTO assessments (
        track_code, company_id, title, domain, description, instructions,
        assessment_type, categories, skills, duration_minutes, time_limit_minutes,
        passing_score, attempts_allowed, settings, status, total_marks, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        'TARGETED_INDUSTRY', $7::jsonb, $8::jsonb, $9, $9,
        $10, 1, $11::jsonb, 'PUBLISHED', $12, NOW(), NOW()
      ) RETURNING *`,
      [
        trackCode,
        company.id,
        title.trim(),
        projectDomain || 'Software Engineering & Cloud Architecture',
        fullDescription,
        fullInstructions,
        JSON.stringify(['Industry Learning', programmingLanguage, 'Project Assessment']),
        JSON.stringify([programmingLanguage, projectDomain || 'Software Engineering']),
        Number(durationMinutes),
        Number(passingScore),
        JSON.stringify(settingsObj),
        totalMarks
      ]
    );

    const createdAssessment = asmtInsert.rows[0];
    const assessmentId = createdAssessment.id;

    // 2. Insert questions
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      await pg.query(
        `INSERT INTO assessment_questions (
          assessment_id, topic, category, question_type, question_text, options,
          correct_answer, marks, difficulty, skills, programming_language, starter_code,
          input_description, output_description, constraints, test_cases, order_index, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb,
          $7, $8, $9, $10::jsonb, $11, $12,
          $13, $14, $15, $16::jsonb, $17, NOW()
        )`,
        [
          assessmentId,
          q.topic || projectTitle,
          q.category || 'Programming',
          q.questionType || q.question_type || 'MCQ',
          q.questionText || q.question || '',
          JSON.stringify(Array.isArray(q.options) ? q.options : []),
          q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
          Number(q.marks || 10),
          q.difficulty || 'Intermediate',
          JSON.stringify([programmingLanguage]),
          q.programmingLanguage || programmingLanguage,
          q.starterCode || null,
          q.inputDescription || null,
          q.outputDescription || null,
          q.constraints || null,
          JSON.stringify(Array.isArray(q.testCases) ? q.testCases : []),
          i + 1
        ]
      );
    }

    // 3. Assign to selected students & dispatch multi-role notifications
    let assignedCount = 0;
    const notifiedInstitutions = new Set();

    for (const student of targetStudents) {
      const sId = student.id || student.student_id;
      // Get complete student details
      const fullS = await pg.query(
        `SELECT s.id, s.user_id, s.full_name, s.email, s.institution_id,
                i.id AS college_id, i.name AS institution_name,
                COALESCE(d.name, 'Engineering') AS department
         FROM students s
         LEFT JOIN institutions i ON i.id = s.institution_id
         LEFT JOIN departments d ON d.id = s.department_id
         WHERE s.id::text = $1 OR s.user_id::text = $1 LIMIT 1`,
        [String(sId)]
      );

      if (fullS.rows.length > 0) {
        const row = fullS.rows[0];
        const studentUserId = row.user_id;
        const studentName = row.full_name || 'Candidate';
        const institutionId = row.institution_id || row.college_id;
        const institutionName = row.institution_name || 'Partner Institution';
        const department = row.department || 'Engineering';

        // Insert into assessment_targets
        await pg.query(
          `INSERT INTO assessment_targets (assessment_id, student_id, institution_id, status, assigned_at)
           VALUES ($1, $2, $3, 'ASSIGNED', NOW())
           ON CONFLICT (assessment_id, student_id) DO NOTHING`,
          [assessmentId, row.id, institutionId]
        );
        assignedCount++;

        // A. Student Notification
        if (studentUserId) {
          await pg.query(
            `INSERT INTO notifications (
              recipient_type, recipient_id, notification_type, title, message, related_entity_type, related_entity_id, details, is_read, is_deleted, created_at
            ) VALUES ($1, $2, 'ASSESSMENT_ASSIGNED', $3, $4, 'assessment', $5, $6::jsonb, false, false, NOW())`,
            [
              'student',
              studentUserId,
              `🎯 New Assessment Assigned: ${title} (${programmingLanguage})`,
              `${company.company_name} assigned an assessment test in ${programmingLanguage} on project "${projectTitle}". Complete before deadline: ${deadline || 'Active Evaluation Cycle'}.`,
              assessmentId,
              JSON.stringify({
                assessmentId,
                assessmentTitle: title,
                companyName: company.company_name,
                programmingLanguage,
                projectTitle,
                projectDescription,
                durationMinutes: Number(durationMinutes),
                deadline,
                totalMarks,
                action: 'attend-assessment'
              })
            ]
          ).catch(err => console.warn('[learning-assessments] Student notif note:', err.message));
        }

        // B. Institution Notification (once per distinct institution)
        if (institutionId && !notifiedInstitutions.has(String(institutionId))) {
          notifiedInstitutions.add(String(institutionId));

          // Also use relationalManager.addNotification for dual reliability
          await relationalManager.addNotification('institution', {
            recipient_type: 'institution',
            institutionId: institutionId,
            notification_type: 'ASSESSMENT_ASSIGNED_INSTITUTION',
            title: `🏛️ Assessment Assigned to Student: ${studentName}`,
            message: `${company.company_name} posted an assessment test in ${programmingLanguage} on project "${projectTitle}" for your student ${studentName} (${department}).`,
            related_entity_type: 'assessment',
            related_entity_id: assessmentId,
            details: {
              assessmentId,
              assessmentTitle: title,
              companyName: company.company_name,
              studentName,
              studentId: row.id,
              institutionName,
              department,
              programmingLanguage,
              projectTitle,
              durationMinutes: Number(durationMinutes),
              deadline,
              action: 'view-assessment'
            }
          }).catch(err => console.warn('[learning-assessments] Institution notif note:', err.message));
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Assessment test "${title}" posted successfully! Real-time notifications dispatched to ${assignedCount} student(s) and their respective institution(s).`,
      data: {
        id: assessmentId,
        trackCode,
        title,
        programmingLanguage,
        projectTitle,
        assignedCount,
        institutionsNotifiedCount: notifiedInstitutions.size,
        durationMinutes,
        totalMarks,
        deadline,
        status: 'PUBLISHED'
      }
    });
  } catch (err) {
    console.error('[POST /company/learning-assessments] Error:', err);
    res.status(500).json({ success: false, message: 'Assessment creation failed: ' + err.message });
  }
});

// ---------- Company Details by ID (fallback for non-static routes) ----------
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const company = await relationalManager.getCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
