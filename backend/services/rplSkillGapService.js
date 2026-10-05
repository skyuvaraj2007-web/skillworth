/**
 * SkillWorth — RPL Skill Gap Service (Phase 5)
 * Data-driven gap analysis between worker's demonstrated competencies and QP requirements.
 *
 * IMPORTANT: Gap analysis is advisory guidance for the worker and assessor.
 * It does NOT constitute an official assessment finding.
 * Only an authorized human assessor can make official competency determinations.
 */

class RplSkillGapService {
  /**
   * Compute skill gap analysis for a worker against a Qualification Pack.
   * Uses graded checklist scores from a completed assessment (if available),
   * or estimation from evidence coverage when assessment is in progress.
   *
   * @param {Object} qualificationPack - The full QP object with competencies
   * @param {Array} checklists - Graded checklist items from rpl_assessments
   * @param {Array} evidenceList - Submitted evidence items
   * @param {Object} extractedProfile - Result from rplExperienceAIService.analyzeExperience()
   * @returns {Object} Gap analysis report
   */
  computeGapAnalysis(qualificationPack, checklists = [], evidenceList = [], extractedProfile = {}) {
    if (!qualificationPack || !Array.isArray(qualificationPack.competencies)) {
      return {
        success: false,
        message: 'Invalid Qualification Pack — cannot compute gap analysis.',
        provider: 'deterministic-fallback'
      };
    }

    const qp = qualificationPack;
    const now = new Date().toISOString();

    // Index checklist items by competency ID/code
    const checklistByComp = {};
    for (const item of checklists) {
      const key = item.competencyCode || item.competencyId || 'GENERAL';
      if (!checklistByComp[key]) checklistByComp[key] = [];
      checklistByComp[key].push(item);
    }

    // Index evidence by competency
    const evidenceByComp = {};
    for (const ev of evidenceList) {
      const keys = ev.competencyCode
        ? [ev.competencyCode]
        : (ev.linkedCompetencies || []);
      for (const k of keys) {
        if (!evidenceByComp[k]) evidenceByComp[k] = [];
        evidenceByComp[k].push(ev);
      }
    }

    // Analyze each competency
    const competencyGaps = qp.competencies.map(comp => {
      const compCheckItems = checklistByComp[comp.code] ||
        checklistByComp[comp.id] ||
        [];
      const compEvidence = evidenceByComp[comp.code] || evidenceByComp[comp.id] || [];

      // Scored items (assessor has graded)
      const scoredItems = compCheckItems.filter(
        i => i.score !== null && i.score !== undefined
      );
      const hasAssessorScores = scoredItems.length > 0;

      // Average score (0-4 rubric scale)
      const avgScore = hasAssessorScores
        ? scoredItems.reduce((a, b) => a + Number(b.score || 0), 0) / scoredItems.length
        : null;

      // Status from checklist (if assessor has judged)
      let competencyStatus;
      if (avgScore === null) {
        competencyStatus = 'PENDING_ASSESSMENT';
      } else if (avgScore >= 3) {
        competencyStatus = 'COMPETENT';
      } else if (avgScore >= 2) {
        competencyStatus = 'WITH_SUPPORT';
      } else if (avgScore >= 1) {
        competencyStatus = 'PARTIAL';
      } else {
        competencyStatus = 'NOT_DEMONSTRATED';
      }

      // Evidence coverage
      const evidenceCoverage = compEvidence.length > 0 ? 'COVERED' : 'GAP';
      const hasVideo = compEvidence.some(
        e => e.isVideo || (e.mimeType && e.mimeType.startsWith('video/'))
      );

      // AI-estimated gap severity (advisory only)
      let gapSeverity = 'UNKNOWN';
      if (competencyStatus === 'COMPETENT') {
        gapSeverity = 'NO_GAP';
      } else if (competencyStatus === 'WITH_SUPPORT') {
        gapSeverity = 'MINOR_GAP';
      } else if (competencyStatus === 'PARTIAL') {
        gapSeverity = 'MODERATE_GAP';
      } else if (competencyStatus === 'NOT_DEMONSTRATED') {
        gapSeverity = 'SIGNIFICANT_GAP';
      } else if (evidenceCoverage === 'COVERED') {
        // Pending assessor review, but evidence present
        gapSeverity = 'PENDING_REVIEW';
      } else {
        gapSeverity = 'GAP_NO_EVIDENCE';
      }

      // Build recommendations
      const recommendations = this._buildCompetencyRecommendations(
        comp, competencyStatus, compEvidence, hasVideo, extractedProfile
      );

      // Check AI-acceptance rate for this competency
      const overrideCount = scoredItems.filter(i => i.acceptedAi === false).length;

      return {
        competencyId: comp.id,
        competencyCode: comp.code,
        competencyName: comp.name,
        weight: comp.weight || 0,
        competencyStatus,
        averageScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
        evidenceCoverage,
        evidenceCount: compEvidence.length,
        hasVideoEvidence: hasVideo,
        gapSeverity,
        assessorScoredItems: scoredItems.length,
        totalChecklistItems: compCheckItems.length,
        aiOverrideCount: overrideCount,
        performanceCriteria: (comp.performanceCriteria || []).map((crit, idx) => {
          const critStatus = scoredItems.some(s => s.criterionId === `crit_${idx}` && s.score >= 3)
            ? 'MET'
            : scoredItems.some(s => s.criterionId === `crit_${idx}`)
              ? 'PARTIALLY_MET'
              : 'NOT_ASSESSED';
          return {
            criterion: crit,
            status: critStatus
          };
        }),
        recommendations
      };
    });

    // Overall gap statistics
    const competent = competencyGaps.filter(c => c.competencyStatus === 'COMPETENT').length;
    const withSupport = competencyGaps.filter(c => c.competencyStatus === 'WITH_SUPPORT').length;
    const partial = competencyGaps.filter(c => c.competencyStatus === 'PARTIAL').length;
    const notDemonstrated = competencyGaps.filter(c => c.competencyStatus === 'NOT_DEMONSTRATED').length;
    const pending = competencyGaps.filter(c => c.competencyStatus === 'PENDING_ASSESSMENT').length;
    const total = competencyGaps.length;

    const overallCompletionPercent = total > 0
      ? Math.round((competent / total) * 100)
      : 0;

    // Weighted completion score (based on QP weights)
    const totalWeight = competencyGaps.reduce((sum, c) => sum + (c.weight || 0), 0) || 100;
    const weightedScore = competencyGaps
      .filter(c => c.competencyStatus === 'COMPETENT')
      .reduce((sum, c) => sum + (c.weight || 0), 0);
    const weightedCompletionPercent = Math.round((weightedScore / totalWeight) * 100);

    // Overall readiness category
    let readinessCategory;
    if (pending === total) {
      readinessCategory = 'ASSESSMENT_NOT_STARTED';
    } else if (competent === total) {
      readinessCategory = 'FULLY_COMPETENT';
    } else if (overallCompletionPercent >= 75) {
      readinessCategory = 'LARGELY_COMPETENT';
    } else if (overallCompletionPercent >= 50) {
      readinessCategory = 'PARTIALLY_COMPETENT';
    } else if (overallCompletionPercent >= 25) {
      readinessCategory = 'EARLY_STAGE';
    } else {
      readinessCategory = 'REQUIRES_ASSESSMENT';
    }

    // Evidence gap summary
    const evidenceGaps = competencyGaps
      .filter(c => c.evidenceCoverage === 'GAP' && c.gapSeverity !== 'NO_GAP')
      .map(c => ({
        competencyName: c.competencyName,
        competencyCode: c.competencyCode,
        message: `No evidence submitted for ${c.competencyName} — ${c.gapSeverity}`
      }));

    // Priority recommendations for the worker
    const priorityActions = this._buildPriorityActions(competencyGaps, qp);

    return {
      success: true,
      provider: 'deterministic-fallback',
      model: 'rule-engine',
      promptVersion: null,
      generatedAt: now,
      qualificationPackId: qp.id,
      qualificationPackCode: qp.qpCode,
      trade: qp.trade,
      nsqfLevel: qp.nsqfLevel,
      summary: {
        readinessCategory,
        overallCompletionPercent,
        weightedCompletionPercent,
        totalCompetencies: total,
        competent,
        withSupport,
        partial,
        notDemonstrated,
        pending,
        evidenceGapCount: evidenceGaps.length,
      },
      competencyGaps,
      evidenceGaps,
      priorityActions,
      disclaimer: 'AI-GENERATED GAP ANALYSIS — ADVISORY ONLY. This gap analysis is based on available data and does not constitute an official assessment finding. The authorized human assessor makes all final competency determinations. Certification decisions are solely the authority of the approved assessment body.'
    };
  }

  _buildCompetencyRecommendations(comp, status, evidence, hasVideo, extractedProfile) {
    const recs = [];

    if (status === 'PENDING_ASSESSMENT' || status === 'NOT_DEMONSTRATED') {
      recs.push({
        type: 'EVIDENCE_REQUIRED',
        priority: 'HIGH',
        message: `Submit practical evidence demonstrating ${comp.name}`,
        detail: comp.requiredEvidence && comp.requiredEvidence.length > 0
          ? `Suggested evidence types: ${comp.requiredEvidence.slice(0, 2).join(', ')}`
          : 'Photos, videos, or work records demonstrating this competency'
      });
    }

    if (!hasVideo && (status === 'PARTIAL' || status === 'WITH_SUPPORT' || status === 'PENDING_ASSESSMENT')) {
      recs.push({
        type: 'VIDEO_RECOMMENDED',
        priority: 'MEDIUM',
        message: 'A continuous video demonstration is strongly recommended for this competency',
        detail: 'Record a 2-3 minute video showing the complete practical task execution'
      });
    }

    if (comp.assessmentChecklist && comp.assessmentChecklist.length > 0) {
      const pendingChecks = comp.assessmentChecklist.slice(0, 2).map(c => c.task);
      recs.push({
        type: 'CHECKLIST_REVIEW',
        priority: 'LOW',
        message: 'Review the assessor\'s practical task checklist for this competency',
        detail: `Key tasks: ${pendingChecks.join('; ')}`
      });
    }

    if (status === 'COMPETENT') {
      recs.push({
        type: 'COMPETENCY_MET',
        priority: 'INFO',
        message: `Competency ${comp.name} has been assessed as demonstrated`,
        detail: 'Assessor has graded this competency area'
      });
    }

    return recs;
  }

  _buildPriorityActions(competencyGaps, qp) {
    const actions = [];

    // High priority: evidence gaps on high-weight competencies
    const highWeightGaps = competencyGaps
      .filter(c => c.gapSeverity === 'GAP_NO_EVIDENCE' || c.gapSeverity === 'SIGNIFICANT_GAP')
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 3);

    for (const comp of highWeightGaps) {
      actions.push({
        priority: 'HIGH',
        action: `Submit practical evidence for ${comp.competencyName}`,
        competencyCode: comp.competencyCode,
        reason: 'No evidence submitted — competency cannot be evaluated without evidence'
      });
    }

    // Medium priority: video missing
    const noVideos = competencyGaps
      .filter(c => !c.hasVideoEvidence && c.competencyStatus !== 'COMPETENT')
      .slice(0, 2);

    for (const comp of noVideos) {
      if (!highWeightGaps.find(h => h.competencyCode === comp.competencyCode)) {
        actions.push({
          priority: 'MEDIUM',
          action: `Record video demonstration for ${comp.competencyName}`,
          competencyCode: comp.competencyCode,
          reason: 'Video demonstration helps assessors verify practical skills more thoroughly'
        });
      }
    }

    // Safety note if any competency has no safety evidence
    const noSafety = competencyGaps.filter(c =>
      !c.hasVideoEvidence &&
      c.competencyName.toLowerCase().includes('safety')
    );

    if (noSafety.length > 0) {
      actions.push({
        priority: 'HIGH',
        action: 'Submit evidence of safety practices and PPE usage',
        competencyCode: noSafety[0].competencyCode,
        reason: 'Health & Safety is a mandatory competency in all NSQF Qualification Packs'
      });
    }

    return actions;
  }

  /**
   * Compare AI suggested score vs assessor final score for consistency tracking.
   * Returns statistical comparison used in the consistency analytics panel.
   */
  computeOverrideAnalysis(assessmentHistory = []) {
    const analyses = assessmentHistory
      .filter(a => a.checklists && a.checklists.length > 0)
      .flatMap(a => a.checklists.filter(
        c => c.score !== null && c.aiSuggestedScore !== null
      ));

    if (analyses.length === 0) {
      return {
        totalItems: 0,
        overrideCount: 0,
        overrideRate: 0,
        averageDivergence: 0,
        averageAiScore: null,
        averageAssessorScore: null,
        trend: 'INSUFFICIENT_DATA'
      };
    }

    const overrides = analyses.filter(c => c.acceptedAi === false);
    const overrideRate = Math.round((overrides.length / analyses.length) * 100);

    const aiScores = analyses.map(c => Number(c.aiSuggestedScore || 0));
    const assessorScores = analyses.map(c => Number(c.score || 0));

    const avgAI = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
    const avgAssessor = assessorScores.reduce((a, b) => a + b, 0) / assessorScores.length;

    const divergences = analyses.map(c =>
      Math.abs(Number(c.score || 0) - Number(c.aiSuggestedScore || 0))
    );
    const avgDivergence = divergences.reduce((a, b) => a + b, 0) / divergences.length;

    let trend;
    if (overrideRate > 40) trend = 'HIGH_OVERRIDE_RATE';
    else if (overrideRate > 20) trend = 'MODERATE_OVERRIDE_RATE';
    else trend = 'LOW_OVERRIDE_RATE';

    return {
      totalItems: analyses.length,
      overrideCount: overrides.length,
      overrideRate,
      averageDivergence: Math.round(avgDivergence * 100) / 100,
      averageAiScore: Math.round(avgAI * 100) / 100,
      averageAssessorScore: Math.round(avgAssessor * 100) / 100,
      trend
    };
  }
}

module.exports = new RplSkillGapService();
