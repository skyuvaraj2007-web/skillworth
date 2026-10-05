const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');
const rplMappingService = require('../services/rplMappingService');

// 1. GET /api/rpl/qualification-packs - List available Qualification Packs
router.get('/qualification-packs', (req, res) => {
  try {
    const packs = db.getQualificationPacks();
    return res.json({ success: true, qualificationPacks: packs });
  } catch (err) {
    console.error('[RPL QP Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve qualification packs.' });
  }
});

// 2. GET /api/rpl/qualification-packs/:id - Get QP details with competencies & checklists
router.get('/qualification-packs/:id', (req, res) => {
  try {
    const pack = db.getQualificationPackById(req.params.id);
    if (!pack) return res.status(404).json({ success: false, message: 'Qualification pack not found.' });
    return res.json({ success: true, qualificationPack: pack });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving qualification pack.' });
  }
});

// 3. POST /api/rpl/experience/analyze - Real-time AI analysis of text / voice transcript
router.post('/experience/analyze', (req, res) => {
  try {
    const { declarationText, voiceTranscript, structuredFields } = req.body;
    const text = declarationText || voiceTranscript || '';
    const analysis = rplMappingService.analyzeExperienceDeclaration(text, structuredFields || {});
    return res.json(analysis);
  } catch (err) {
    console.error('[RPL AI Analyze Error]', err);
    return res.status(500).json({ success: false, message: 'AI experience analysis service temporarily unavailable.' });
  }
});

// 4. POST /api/rpl/experience - Submit worker experience declaration
router.post('/experience', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const learnerName = req.user.name || 'Candidate';

    const result = db.submitExperienceDeclaration({
      ...req.body,
      learnerId,
      learnerName
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('[RPL Experience Submit Error]', err);
    return res.status(500).json({ success: false, message: 'Error submitting experience declaration.' });
  }
});

// 5. GET /api/rpl/my-assessment - Worker's active RPL assessment
router.get('/my-assessment', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const assessment = db.getMyRplAssessment(learnerId);
    return res.json({ success: true, assessment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve RPL assessment.' });
  }
});

// 6. POST /api/rpl/assessment/start - Initialize RPL assessment after worker confirms mapping
router.post('/assessment/start', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const learnerName = req.user.name || 'Candidate';
    const { qpId, declarationId } = req.body;

    const result = db.startRplAssessment({
      learnerId,
      learnerName,
      qpId,
      declarationId
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('[RPL Start Error]', err);
    return res.status(500).json({ success: false, message: 'Error starting RPL assessment.' });
  }
});

// 7. GET /api/rpl/assessor/assessments - Assessor's assigned assessments list with filters
router.get('/assessor/assessments', requireAuth, (req, res) => {
  try {
    const { trade, status } = req.query;
    const assessments = db.getAllRplAssessments({ trade, status });
    return res.json({ success: true, assessments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment records.' });
  }
});

// 8. GET /api/rpl/assessment/:id - Full assessment workspace details
router.get('/assessment/:id', requireAuth, (req, res) => {
  try {
    const assessment = db.getRplAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    // Generate explainable AI assistance for the current evidence
    const aiAssistance = rplMappingService.generateAssessmentAssistance(
      assessment.evidenceList || [],
      assessment.competencies ? assessment.competencies[0] : null
    );

    return res.json({
      success: true,
      assessment,
      aiAssistance
    });
  } catch (err) {
    console.error('[RPL Get Details Error]', err);
    return res.status(500).json({ success: false, message: 'Error loading assessment workspace.' });
  }
});

// 9. POST /api/rpl/assessment/:id/checklist-score - Assessor scores checklist with human-in-the-loop override
router.post('/assessment/:id/checklist-score', requireAuth, (req, res) => {
  try {
    const assessmentId = req.params.id;
    const assessorId = req.user.id;
    const assessorName = req.user.name || 'Authorized Assessor';

    const result = db.submitChecklistEvaluation(assessmentId, {
      ...req.body,
      assessorId,
      assessorName
    });

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[RPL Score Error]', err);
    return res.status(500).json({ success: false, message: 'Error recording checklist evaluation.' });
  }
});

// 10. POST /api/rpl/assessment/:id/decision - Final assessor decision & certification recommendation
router.post('/assessment/:id/decision', requireAuth, (req, res) => {
  try {
    const assessmentId = req.params.id;
    const assessorId = req.user.id;
    const assessorName = req.user.name || 'Authorized Assessor';
    const { decision, remarks } = req.body;

    if (!['RECOMMENDED_FOR_CERTIFICATION', 'FURTHER_EVIDENCE_REQUIRED', 'NOT_YET_COMPETENT'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision status. Must be RECOMMENDED_FOR_CERTIFICATION, FURTHER_EVIDENCE_REQUIRED, or NOT_YET_COMPETENT.'
      });
    }

    const result = db.submitRplFinalDecision(assessmentId, {
      decision,
      remarks,
      assessorId,
      assessorName
    });

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[RPL Decision Error]', err);
    return res.status(500).json({ success: false, message: 'Error processing final assessment decision.' });
  }
});

// 11. GET /api/rpl/assessment/:id/report - Formal assessment report
router.get('/assessment/:id/report', (req, res) => {
  try {
    const assessment = db.getRplAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const report = {
      reportId: 'REP-' + assessment.id,
      generatedAt: new Date().toISOString(),
      standards: 'ISO/IEC 17024 & National Skills Qualifications Framework (NSQF)',
      worker: {
        learnerId: assessment.learnerId,
        learnerName: assessment.learnerName
      },
      qualification: {
        trade: assessment.trade,
        jobRole: assessment.jobRole,
        qpCode: assessment.qpCode,
        nsqfLevel: assessment.nsqfLevel
      },
      assessmentSummary: {
        totalScore: assessment.totalScore,
        maxScore: assessment.maxScore,
        percentage: assessment.percentage,
        finalDecision: assessment.finalRecommendation || 'PENDING_DECISION',
        assessorRemarks: assessment.assessorFinalRemarks,
        credentialId: assessment.credentialId || null
      },
      competencyProfile: assessment.competencyProfile,
      competencyBreakdown: (assessment.competencies || []).map(c => ({
        code: c.code,
        name: c.name,
        weight: c.weight,
        status: c.status,
        score: c.score
      })),
      assessor: {
        assessorName: assessment.assessorName,
        assessorId: assessment.assessorId,
        accreditation: 'Approved ISO/IEC 17024 Lead Assessor'
      },
      auditTrail: assessment.auditLogs || [],
      statement: 'Final certification decision is subject to authorized assessor / institution approval.'
    };

    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating assessment report.' });
  }
});

// 12. POST /api/rpl/evidence/quality-check - AI Evidence Quality Analysis
router.post('/evidence/quality-check', (req, res) => {
  try {
    const { evidenceItem, competencyCode } = req.body;
    if (!evidenceItem) return res.status(400).json({ success: false, message: 'evidenceItem is required.' });

    const result = rplMappingService.checkEvidenceQuality(evidenceItem, competencyCode);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'AI Evidence Quality service temporarily unavailable.' });
  }
});

// 13. GET /api/rpl/analytics/assessor-consistency - Assessor Consistency Analytics
router.get('/analytics/assessor-consistency', (req, res) => {
  try {
    const analytics = rplMappingService.calculateConsistencyAnalytics();
    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve consistency analytics.' });
  }
});

// 14. POST /api/rpl/sync - Offline synchronization with conflict detection
router.post('/sync', requireAuth, (req, res) => {
  try {
    const result = db.syncRplOfflineData({
      ...req.body,
      assessorId: req.user.id
    });
    return res.json(result);
  } catch (err) {
    console.error('[RPL Sync Error]', err);
    return res.status(500).json({ success: false, message: 'Error processing synchronization.' });
  }
});

module.exports = router;
