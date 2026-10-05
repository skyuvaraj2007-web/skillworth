const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');
const rplMappingService = require('../services/rplMappingService');

// 1. GET /api/rpl/qualification-packs - List available Qualification Packs (dynamic, data-driven)
router.get('/qualification-packs', (req, res) => {
  try {
    const packs = db.getQualificationPacks();
    return res.json({ success: true, qualificationPacks: packs });
  } catch (err) {
    console.error('[RPL QP Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve qualification packs.' });
  }
});

// 2. GET /api/rpl/qualification-packs/:id - Get QP details with competencies, performance criteria & rubrics
router.get('/qualification-packs/:id', (req, res) => {
  try {
    const pack = db.getQualificationPackById(req.params.id);
    if (!pack) return res.status(404).json({ success: false, message: 'Qualification pack not found.' });
    return res.json({ success: true, qualificationPack: pack });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving qualification pack.' });
  }
});

// 3. POST /api/rpl/qualification-packs - Add/Manage Qualification Pack (Admin / Institution)
router.post('/qualification-packs', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot create Qualification Packs.' });
    }

    const { trade, qpCode, sector, nsqfLevel, competencies } = req.body;
    if (!trade || !qpCode) {
      return res.status(400).json({ success: false, message: 'Trade title and QP code are required.' });
    }

    const result = db.addQualificationPack(req.body, req.user);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[RPL Add QP Error]', err);
    return res.status(500).json({ success: false, message: 'Error creating qualification pack.' });
  }
});

// 4. POST /api/rpl/experience/analyze - AI analysis of text / voice transcript across all trades
router.post('/experience/analyze', (req, res) => {
  try {
    const { declarationText, voiceTranscript, structuredFields } = req.body;
    const text = declarationText || voiceTranscript || '';
    const packs = db.getQualificationPacks();
    const analysis = rplMappingService.analyzeExperienceDeclaration(text, structuredFields || {}, packs);
    return res.json(analysis);
  } catch (err) {
    console.error('[RPL AI Analyze Error]', err);
    return res.status(500).json({ success: false, message: 'AI experience analysis service temporarily unavailable.' });
  }
});

// 5. POST /api/rpl/experience - Submit worker multi-occupation experience declaration
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

// 6. GET /api/rpl/my-assessment - Worker's active RPL assessment
router.get('/my-assessment', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const assessment = db.getMyRplAssessment(learnerId);
    return res.json({ success: true, assessment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve RPL assessment.' });
  }
});

// 7. POST /api/rpl/assessment/start - Initialize RPL assessment pathway after worker confirms mapping
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

// 8. GET /api/rpl/assessor/assessments - Assessor's assigned assessments list with filters
router.get('/assessor/assessments', requireAuth, (req, res) => {
  try {
    const { trade, status } = req.query;
    const assessments = db.getAllRplAssessments({ trade, status });
    return res.json({ success: true, assessments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment records.' });
  }
});

// 9. GET /api/rpl/assessment/:id - Full assessment workspace details with security check
router.get('/assessment/:id', requireAuth, (req, res) => {
  try {
    const assessment = db.getRplAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    // Security check: Candidate can only access their own assessment dossier
    if (req.user.role === 'LEARNER') {
      const isOwner = assessment.learnerId === req.user.profileId || assessment.learnerId === req.user.id;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to authorized dossier owner.' });
      }
    }

    // Get the target QP for dynamic trade assistance
    const targetQp = db.getQualificationPackById(assessment.qualificationPackId || assessment.qpCode);

    // Generate explainable AI assistance for the current evidence
    const aiAssistance = rplMappingService.generateAssessmentAssistance(
      assessment.evidenceList || [],
      assessment.competencies ? assessment.competencies[0] : null,
      targetQp
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

// 10. POST /api/rpl/assessment/:id/checklist-score - Assessor scores checklist with human-in-the-loop override
router.post('/assessment/:id/checklist-score', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot evaluate assessment checklists.' });
    }

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

// 11. POST /api/rpl/assessment/:id/decision - Final assessor decision & assessment recommendation
router.post('/assessment/:id/decision', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot submit final assessment decisions.' });
    }

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

// 12. POST /api/rpl/assessment/:id/schedule - Institution schedules practical assessment
router.post('/assessment/:id/schedule', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot self-schedule assessments.' });
    }

    const assessmentId = req.params.id;
    const result = db.scheduleAssessment(assessmentId, req.body, req.user);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[RPL Schedule Error]', err);
    return res.status(500).json({ success: false, message: 'Error scheduling assessment.' });
  }
});

// 13. POST /api/rpl/assessment/:id/assign - Institution assigns authorized assessor
router.post('/assessment/:id/assign', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot assign assessors.' });
    }

    const assessmentId = req.params.id;
    const result = db.assignAssessor(assessmentId, req.body, req.user);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[RPL Assign Error]', err);
    return res.status(500).json({ success: false, message: 'Error assigning assessor.' });
  }
});

// 14. GET /api/rpl/assessment/:id/report - Formal assessment report
router.get('/assessment/:id/report', (req, res) => {
  try {
    const assessment = db.getRplAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const report = {
      reportId: 'REP-' + assessment.id,
      generatedAt: new Date().toISOString(),
      standards: 'ISO/IEC 17024 Guidelines & National Skills Qualifications Framework (NSQF)',
      worker: {
        learnerId: assessment.learnerId,
        learnerName: assessment.learnerName
      },
      qualification: {
        trade: assessment.trade,
        occupation: assessment.occupation,
        jobRole: assessment.jobRole,
        qpCode: assessment.qpCode,
        nsqfLevel: assessment.nsqfLevel
      },
      assessmentSummary: {
        totalScore: assessment.totalScore,
        maxScore: assessment.maxScore,
        percentage: assessment.percentage,
        finalDecision: assessment.finalRecommendation || 'PENDING_DECISION',
        certificationStatus: assessment.certificationStatus || 'PENDING',
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
      statement: 'This is a SkillWorth RPL Assessment Record and Recommendation. Official certification is issued by accredited Sector Skill Councils / Awarding Bodies upon formal validation.'
    };

    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating assessment report.' });
  }
});

// 15. POST /api/rpl/evidence/quality-check - Dynamic AI Evidence Quality Analysis across trades
router.post('/evidence/quality-check', (req, res) => {
  try {
    const { evidenceItem, competencyCode, qpId } = req.body;
    if (!evidenceItem) return res.status(400).json({ success: false, message: 'evidenceItem is required.' });

    const targetQp = db.getQualificationPackById(qpId || 'QP-ELE-Q1401');
    const result = rplMappingService.checkEvidenceQuality(evidenceItem, competencyCode, targetQp);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'AI Evidence Quality service temporarily unavailable.' });
  }
});

// 16. GET /api/rpl/analytics/assessor-consistency - Assessor Consistency Analytics (Real or Honest Prototype Simulation)
router.get('/analytics/assessor-consistency', (req, res) => {
  try {
    const assessments = db.getAllRplAssessments();
    const analytics = rplMappingService.calculateConsistencyAnalytics(assessments);
    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve consistency analytics.' });
  }
});

// 17. POST /api/rpl/sync - Offline synchronization with conflict detection
router.post('/sync', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Synchronize restricted to assessors.' });
    }

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
