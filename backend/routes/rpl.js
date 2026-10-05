const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');
const rplMappingService = require('../services/rplMappingService');
const rplExperienceAIService = require('../services/rplExperienceAIService');
const rplEvidenceAIService = require('../services/rplEvidenceAIService');
const rplSkillGapService = require('../services/rplSkillGapService');

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
      standards: 'SkillWorth RPL Assessment Standards & National Skills Qualifications Framework (NSQF)',
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
        accreditation: 'Approved SkillWorth Lead Assessor'
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

// 16. GET /api/rpl/analytics/assessor-consistency - Assessor Consistency Analytics
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

// ============================================================
// PHASE 3: DYNAMIC COMPETENCY EVIDENCE MATRIX & WORKER SKILL PASSPORT
// ============================================================

// 18. GET /api/rpl/assessment/:id/matrix - Get dynamic competency evidence matrix
router.get('/assessment/:id/matrix', requireAuth, (req, res) => {
  try {
    const assessment = db.getRplAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment record not found.' });

    // Worker can only view their own assessment matrix
    if (req.user.role === 'LEARNER') {
      const isOwner = assessment.learnerId === req.user.profileId || assessment.learnerId === req.user.id;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to authorized candidate.' });
      }
    }

    const matrixData = db.getAssessmentEvidenceMatrix(req.params.id);
    if (!matrixData) {
      return res.status(404).json({ success: false, message: 'Unable to compile competency evidence matrix.' });
    }

    return res.json(matrixData);
  } catch (err) {
    console.error('[Matrix Get Error]', err);
    return res.status(500).json({ success: false, message: 'Error loading competency evidence matrix.' });
  }
});

// 19. PATCH /api/rpl/assessment/:id/matrix/:competencyId - Assessor evaluates single competency
router.patch('/assessment/:id/matrix/:competencyId', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot evaluate competency scores.' });
    }

    const { assessorScore, assessorDecision, assessorRemarks, overrideReason, acceptedAi } = req.body;
    const result = db.updateMatrixCompetency(req.params.id, req.params.competencyId, {
      assessorScore,
      assessorDecision,
      assessorRemarks,
      overrideReason,
      acceptedAi
    }, req.user);

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[Matrix Update Error]', err);
    return res.status(500).json({ success: false, message: 'Error updating competency matrix.' });
  }
});

// 20. GET /api/rpl/assessment/:id/evidence-coverage - Real calculated evidence coverage breakdown
router.get('/assessment/:id/evidence-coverage', requireAuth, (req, res) => {
  try {
    const matrixData = db.getAssessmentEvidenceMatrix(req.params.id);
    if (!matrixData) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    return res.json({
      success: true,
      assessmentId: req.params.id,
      coverage: matrixData.coverage
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error calculating evidence coverage.' });
  }
});

// 21. POST /api/rpl/assessment/:id/evidence-link - Link uploaded evidence to a specific competency
router.post('/assessment/:id/evidence-link', requireAuth, (req, res) => {
  try {
    const { evidenceId, competencyId, competencyCode, criterion } = req.body;
    if (!evidenceId) return res.status(400).json({ success: false, message: 'evidenceId is required.' });

    const result = db.linkEvidenceToCompetency(req.params.id, evidenceId, {
      competencyId,
      competencyCode,
      criterion
    }, req.user);

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[Evidence Link Error]', err);
    return res.status(500).json({ success: false, message: 'Error linking evidence item.' });
  }
});

// 22. POST /api/rpl/assessment/:id/evidence-request - Assessor requests additional evidence
router.post('/assessment/:id/evidence-request', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot initiate evidence requests.' });
    }

    const { competencyId, competencyCode, competencyName, requiredEvidence, message, deadline } = req.body;
    if (!competencyCode && !competencyId) {
      return res.status(400).json({ success: false, message: 'competencyCode or competencyId is required.' });
    }

    const result = db.createEvidenceRequest(req.params.id, {
      competencyId,
      competencyCode,
      competencyName,
      requiredEvidence,
      message,
      deadline
    }, req.user);

    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[Evidence Request Error]', err);
    return res.status(500).json({ success: false, message: 'Error creating evidence request.' });
  }
});

// 23. GET /api/rpl/evidence-requests - Get evidence requests for candidate or assessment
router.get('/evidence-requests', requireAuth, (req, res) => {
  try {
    const filters = {};
    if (req.query.assessmentId) filters.assessmentId = req.query.assessmentId;
    if (req.query.status) filters.status = req.query.status;

    if (req.user.role === 'LEARNER') {
      filters.learnerId = req.user.profileId || req.user.id;
    } else if (req.query.learnerId) {
      filters.learnerId = req.query.learnerId;
    }

    const requests = db.getEvidenceRequests(filters);
    return res.json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving evidence requests.' });
  }
});

// 24. POST /api/rpl/evidence-requests/:requestId/respond - Candidate fulfills evidence request
router.post('/evidence-requests/:requestId/respond', requireAuth, (req, res) => {
  try {
    const { title, description, fileUrl, fileName, isVideo } = req.body;
    const result = db.respondToEvidenceRequest(req.params.requestId, {
      title,
      description,
      fileUrl,
      fileName,
      isVideo
    }, req.user);

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[Evidence Request Response Error]', err);
    return res.status(500).json({ success: false, message: 'Error fulfilling evidence request.' });
  }
});

// 25. GET /api/rpl/assessment/:id/skill-gaps - Calculate skill gaps from real assessment data
router.get('/assessment/:id/skill-gaps', requireAuth, (req, res) => {
  try {
    const result = db.calculateSkillGaps(req.params.id);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error calculating skill gaps.' });
  }
});

// 26. GET /api/rpl/worker/passport - Current candidate's Worker Skill Passport
router.get('/worker/passport', requireAuth, async (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
    const passport = await db.getWorkerSkillPassport(learnerId, origin);
    return res.json(passport);
  } catch (err) {
    console.error('[Worker Passport Error]', err);
    return res.status(500).json({ success: false, message: 'Error generating Worker Skill Passport.' });
  }
});

// 27. GET /api/rpl/worker/passport/:workerId - Get passport by worker ID (with role security)
router.get('/worker/passport/:workerId', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.workerId;
    if (req.user.role === 'LEARNER') {
      const isSelf = targetId === req.user.profileId || targetId === req.user.id;
      if (!isSelf) {
        return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own Skill Passport.' });
      }
    }

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
    const passport = await db.getWorkerSkillPassport(targetId, origin);
    return res.json(passport);
  } catch (err) {
    console.error('[Worker Passport Target Error]', err);
    return res.status(500).json({ success: false, message: 'Error generating Skill Passport.' });
  }
});

// 28. PATCH /api/rpl/worker/passport/visibility - Manage public/private profile visibility
router.patch('/worker/passport/visibility', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const { isPublic } = req.body;
    const result = db.setPassportVisibility(learnerId, isPublic);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error setting passport visibility.' });
  }
});

// 29. GET /api/rpl/verify/:recordId - Public verification for SkillWorth assessment records
router.get('/verify/:recordId', (req, res) => {
  try {
    const result = db.getPublicVerificationRecord(req.params.recordId);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[Public Verify Error]', err);
    return res.status(500).json({ success: false, message: 'Error verifying assessment record.' });
  }
});

// ================= Phase 4: RPL Application Operations & Assessment Management =================

// 30. POST /api/rpl/applications - Create new RPL application
router.post('/applications', requireAuth, (req, res) => {
  try {
    const isLearner = req.user.role === 'LEARNER';
    const learnerId = isLearner ? (req.user.profileId || req.user.id) : (req.body.learnerId || req.user.id);
    const learnerName = isLearner ? (req.user.name || req.user.fullName || 'Candidate') : (req.body.learnerName || 'Candidate');

    const result = db.createRplApplication({
      ...req.body,
      learnerId,
      learnerName
    }, req.user);

    return res.status(201).json(result);
  } catch (err) {
    console.error('[RPL Create Application Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create RPL application.' });
  }
});

// 31. GET /api/rpl/applications/my - Current worker's RPL applications
router.get('/applications/my', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const applications = db.getMyRplApplications(learnerId);
    return res.json({ success: true, applications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve your applications.' });
  }
});

// 32. GET /api/rpl/applications/:id - Application detail with RBAC
router.get('/applications/:id', requireAuth, (req, res) => {
  try {
    const application = db.getRplApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'RPL application not found.' });
    }

    if (req.user.role === 'LEARNER') {
      const isOwner = application.learnerId === req.user.profileId || application.learnerId === req.user.id;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own application.' });
      }
    }

    return res.json({ success: true, application });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
});

// 33. GET /api/rpl/applications - Institution Application Review Queue (with filters & search)
router.get('/applications', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot browse the institutional application queue.' });
    }

    const { status, occupation, sector, qpCode, assessorId, assessmentCentreId, search } = req.query;
    const applications = db.getAllRplApplications({
      status,
      occupation,
      sector,
      qpCode,
      assessorId,
      assessmentCentreId,
      search
    });

    return res.json({ success: true, applications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve application queue.' });
  }
});

// 34. PATCH /api/rpl/applications/:id/status - Update application lifecycle status
router.patch('/applications/:id/status', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot modify application status.' });
    }

    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const result = db.updateRplApplicationStatus(req.params.id, status, reason, req.user);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating application status.' });
  }
});

// 35. POST /api/rpl/applications/:id/assign-assessor - Assign assessor to application
router.post('/applications/:id/assign-assessor', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot assign assessors.' });
    }

    const { assessorId, assessorName } = req.body;
    if (!assessorId) return res.status(400).json({ success: false, message: 'Assessor ID is required.' });

    const result = db.assignRplAssessor(req.params.id, { assessorId, assessorName }, req.user);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error assigning assessor.' });
  }
});

// 36. POST /api/rpl/applications/:id/schedule - Schedule practical assessment with conflict prevention
router.post('/applications/:id/schedule', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot schedule assessments.' });
    }

    const result = db.scheduleRplAssessment(req.params.id, req.body, req.user);
    if (!result.success) {
      const statusCode = result.conflict ? 409 : 400;
      return res.status(statusCode).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error scheduling assessment.' });
  }
});

// 37. POST /api/rpl/applications/:id/reschedule - Reschedule assessment with mandatory reason
router.post('/applications/:id/reschedule', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot reschedule assessments directly.' });
    }

    const { newDate, newTime, reason } = req.body;
    if (!newDate || !newTime || !reason) {
      return res.status(400).json({ success: false, message: 'New date, new time, and rescheduling reason are required.' });
    }

    const result = db.rescheduleRplAssessment(req.params.id, { newDate, newTime, reason }, req.user);
    if (!result.success) {
      const statusCode = result.conflict ? 409 : 400;
      return res.status(statusCode).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error rescheduling assessment.' });
  }
});

// 38. POST /api/rpl/applications/:id/cancel - Cancel assessment with mandatory reason
router.post('/applications/:id/cancel', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot cancel scheduled assessments.' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    const result = db.cancelRplAssessment(req.params.id, { reason }, req.user);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error cancelling assessment.' });
  }
});

// 39. GET /api/rpl/assessor/work-queue - Assessor priority work queue
router.get('/assessor/work-queue', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to authorized assessors.' });
    }

    const assessorId = req.query.assessorId || (req.user.role === 'ASSESSOR' ? (req.user.profileId || req.user.id) : null);
    const result = db.getAssessorWorkQueue(assessorId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving assessor work queue.' });
  }
});

// 40. GET /api/rpl/institution/overview - Real database RPL Command Centre metrics
router.get('/institution/overview', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to authorized institutions.' });
    }

    const institutionId = req.user.profileId || req.user.id;
    const result = db.getInstitutionRplOverview(institutionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving institution overview.' });
  }
});

// 41. GET /api/rpl/assessment-centres - List assessment centres
router.get('/assessment-centres', (req, res) => {
  try {
    const centres = db.getAssessmentCentres(req.query);
    return res.json({ success: true, assessmentCentres: centres });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving assessment centres.' });
  }
});

// 42. POST /api/rpl/assessment-centres - Create new assessment centre
router.post('/assessment-centres', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Candidates cannot configure assessment centres.' });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Centre name is required.' });

    const result = db.createAssessmentCentre(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating assessment centre.' });
  }
});

// 43. Notification endpoints (also accessible via /api/rpl/notifications)
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const notifications = db.getNotifications(userId);
    return res.json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving notifications.' });
  }
});

router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const result = db.markNotificationRead(req.params.id, userId);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating notification status.' });
  }
});

router.post('/notifications/read-all', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const result = db.markAllNotificationsRead(userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error marking all notifications read.' });
  }
});

// =============================================================================
// PHASE 5: AI-POWERED RPL INTELLIGENCE ENDPOINTS
// All outputs are advisory only — no automated certification, no automated
// pass/fail. The authorized human assessor retains sole decision authority.
// =============================================================================

// P5-1: GET /api/rpl/ai/provider-info - Active AI provider metadata
router.get('/ai/provider-info', (req, res) => {
  try {
    return res.json({
      success: true,
      provider: rplExperienceAIService.getProviderInfo(),
      principleStatement: 'AI assists. AI does not certify. The authorized human assessor is the final authority.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving AI provider info.' });
  }
});

// P5-2: POST /api/rpl/ai/experience/extract - NLP extraction from experience text
// Analyzes free-text experience description and extracts structured fields
router.post('/ai/experience/extract', async (req, res) => {
  try {
    const { text, voiceTranscript, declarationText } = req.body;
    const inputText = text || voiceTranscript || declarationText || '';
    if (!inputText || inputText.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Experience text is required for AI extraction.'
      });
    }
    const result = await rplExperienceAIService.analyzeExperience(inputText);
    return res.json(result);
  } catch (err) {
    console.error('[AI Experience Extract]', err);
    return res.status(500).json({
      success: false,
      message: 'AI experience extraction temporarily unavailable.'
    });
  }
});

// P5-3: POST /api/rpl/ai/experience/match - Match extracted profile to QPs
// Returns ranked, scored QP pathways with full explainability
router.post('/ai/experience/match', async (req, res) => {
  try {
    const { extractedData, text } = req.body;
    const allQPs = db.getQualificationPacks();

    let extracted = extractedData;
    if (!extracted && text) {
      extracted = await rplExperienceAIService.analyzeExperience(text);
    }
    if (!extracted) {
      return res.status(400).json({
        success: false,
        message: 'Either extractedData or text is required.'
      });
    }

    const matchResult = rplExperienceAIService.matchToQualificationPacks(extracted, allQPs);
    return res.json({
      success: true,
      matchResult,
      ...matchResult
    });
  } catch (err) {
    console.error('[AI QP Match]', err);
    return res.status(500).json({
      success: false,
      message: 'AI qualification pack matching temporarily unavailable.'
    });
  }
});

// P5-4: POST /api/rpl/ai/experience/analyze-and-match - Combined pipeline
// Single endpoint: analyze text + match all QPs in one call
router.post('/ai/experience/analyze-and-match', async (req, res) => {
  try {
    const { text, voiceTranscript, declarationText } = req.body;
    const inputText = text || voiceTranscript || declarationText || '';
    if (!inputText || inputText.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Experience text is required.'
      });
    }
    const allQPs = db.getQualificationPacks();
    const result = await rplExperienceAIService.analyzeAndMatch(inputText, allQPs);
    return res.json(result);
  } catch (err) {
    console.error('[AI Analyze+Match]', err);
    return res.status(500).json({
      success: false,
      message: 'AI analysis pipeline temporarily unavailable.'
    });
  }
});

// P5-5: POST /api/rpl/ai/evidence/analyze - Analyze a single evidence item
// Against a competency and target QP — returns advisory observation
router.post('/ai/evidence/analyze', requireAuth, (req, res) => {
  try {
    const { evidenceItem, competencyCode, qpId } = req.body;
    if (!evidenceItem) {
      return res.status(400).json({ success: false, message: 'evidenceItem is required.' });
    }
    let competency = null;
    let targetQP = null;
    if (qpId) {
      targetQP = db.getQualificationPackById(qpId);
      if (targetQP && competencyCode) {
        competency = (targetQP.competencies || []).find(
          c => c.code === competencyCode || c.id === competencyCode
        );
      }
    }
    const result = rplEvidenceAIService.analyzeEvidence(evidenceItem, competency, targetQP);
    return res.json(result);
  } catch (err) {
    console.error('[AI Evidence Analyze]', err);
    return res.status(500).json({
      success: false,
      message: 'AI evidence analysis temporarily unavailable.'
    });
  }
});

// P5-6: POST /api/rpl/ai/evidence/analyze-set - Batch evidence analysis
// Analyzes all evidence for a competency and returns aggregated observation
router.post('/ai/evidence/analyze-set', requireAuth, (req, res) => {
  try {
    const { evidenceList, competencyCode, qpId } = req.body;
    if (!Array.isArray(evidenceList)) {
      return res.status(400).json({ success: false, message: 'evidenceList array is required.' });
    }
    let competency = null;
    let targetQP = null;
    if (qpId) {
      targetQP = db.getQualificationPackById(qpId);
      if (targetQP && competencyCode) {
        competency = (targetQP.competencies || []).find(
          c => c.code === competencyCode || c.id === competencyCode
        );
      }
    }
    const result = rplEvidenceAIService.analyzeEvidenceSet(evidenceList, competency, targetQP);
    return res.json(result);
  } catch (err) {
    console.error('[AI Evidence Set]', err);
    return res.status(500).json({
      success: false,
      message: 'AI evidence batch analysis temporarily unavailable.'
    });
  }
});

// P5-7: GET /api/rpl/ai/skill-gap/:applicationId - Compute gap analysis for an application
// Maps assessor scores + evidence to identify competency gaps — advisory only
router.get('/ai/skill-gap/:applicationId', requireAuth, (req, res) => {
  try {
    const application = db.getRplApplicationById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const qpId = application.qualificationPackId || application.qpId || application.qualificationPackCode;
    let qp = qpId ? db.getQualificationPackById(qpId) : null;
    if (!qp && application.occupation) {
      const qps = db.getQualificationPacks();
      qp = qps.find(p => p.trade === application.occupation || p.occupation === application.occupation || p.qpCode === application.occupation);
    }
    if (!qp) {
      const qps = db.getQualificationPacks();
      qp = qps[0] || null;
    }
    if (!qp) {
      return res.status(404).json({ success: false, message: 'Qualification Pack not found.' });
    }

    // Get linked assessment checklists
    const linkedAssessment = db.getRplAssessmentByApplicationId(req.params.applicationId);
    const checklists = linkedAssessment ? (linkedAssessment.checklists || []) : [];

    // Get worker's evidence
    const allEvidence = db.getEvidenceForLearner ? db.getEvidenceForLearner(application.learnerId || application.workerId) : [];

    const gapResult = rplSkillGapService.computeGapAnalysis(qp, checklists, allEvidence, {});
    return res.json({
      success: true,
      gapReport: gapResult,
      ...gapResult,
      disclaimer: gapResult.disclaimer || 'AI ADVISORY ONLY: Competency gap analysis is advisory only.'
    });
  } catch (err) {
    console.error('[AI Skill Gap]', err);
    return res.status(500).json({
      success: false,
      message: 'Skill gap analysis temporarily unavailable.'
    });
  }
});

// P5-8: POST /api/rpl/ai/assessor-advisory - AI assistance for assessor workspace
// Given evidence list + competency, returns structured advisory observations
router.post('/ai/assessor-advisory', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'INSTITUTION' && req.user.role !== 'ASSESSOR') {
      return res.status(403).json({
        success: false,
        message: 'Only assessors and institution staff can access AI advisory tools.'
      });
    }
    const { evidenceList, competencyCode, qpId, applicationId } = req.body;

    let competency = null;
    let targetQP = null;
    if (qpId) {
      targetQP = db.getQualificationPackById(qpId);
      if (targetQP && competencyCode) {
        competency = (targetQP.competencies || []).find(
          c => c.code === competencyCode || c.id === competencyCode
        );
      }
    }

    // AI Evidence Set analysis
    const evidenceAnalysis = rplEvidenceAIService.analyzeEvidenceSet(
      evidenceList || [], competency, targetQP
    );

    // Classic assessment assistance (from rplMappingService)
    const classicAssistance = rplMappingService.generateAssessmentAssistance(
      evidenceList || [], competency, targetQP
    );

    const advisoryPayload = {
      evidenceAnalysis,
      assessmentAssistance: classicAssistance.aiAssessmentSummary,
      suggestedScore: classicAssistance.aiAssessmentSummary?.aiSuggestedScore || 3,
      suggestedRating: classicAssistance.aiAssessmentSummary?.aiSuggestedRating || 'Competent',
      observedIndicators: classicAssistance.aiAssessmentSummary?.observedIndicators || [],
      missingOrUnclear: classicAssistance.aiAssessmentSummary?.missingOrUnclear || [],
      isAssessorDecisionFinal: true
    };

    return res.json({
      success: true,
      provider: 'deterministic-fallback',
      model: 'rule-engine',
      generatedAt: new Date().toISOString(),
      advisory: advisoryPayload,
      isAssessorDecisionFinal: true,
      evidenceAnalysis,
      assessmentAssistance: classicAssistance.aiAssessmentSummary,
      disclaimer: 'AI ADVISORY ONLY. Assessor has sole override authority and makes all final competency decisions.'
    });
  } catch (err) {
    console.error('[AI Assessor Advisory]', err);
    return res.status(500).json({
      success: false,
      message: 'AI assessor advisory temporarily unavailable.'
    });
  }
});

// P5-9: GET /api/rpl/ai/consistency-analytics - Consistency analytics across all assessments
router.get('/ai/consistency-analytics', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'INSTITUTION' && req.user.role !== 'ASSESSOR') {
      return res.status(403).json({
        success: false,
        message: 'Only assessors and institution staff can access consistency analytics.'
      });
    }
    const allAssessments = db.getAllRplAssessments ? db.getAllRplAssessments() : [];
    const analytics = rplMappingService.calculateConsistencyAnalytics(allAssessments);
    const overrideAnalysis = rplSkillGapService.computeOverrideAnalysis(allAssessments);
    return res.json({
      success: true,
      consistencyAnalytics: analytics,
      ...analytics,
      overrideAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AI Consistency Analytics]', err);
    return res.status(500).json({
      success: false,
      message: 'Consistency analytics temporarily unavailable.'
    });
  }
});

module.exports = router;

