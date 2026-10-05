/**
 * SkillWorth — RPL Evidence AI Service (Phase 5)
 * AI-assisted evidence analysis for the assessor workspace.
 *
 * IMPORTANT: All outputs are ADVISORY OBSERVATIONS only.
 * AI cannot verify physical authenticity of evidence.
 * The authorized human assessor makes all final competency decisions.
 * No fabricated data. No automatic passing.
 */

// Evidence type patterns (by file extension / MIME / description)
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.3gp'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

// Quality indicators that suggest relevant evidence
const QUALITY_INDICATORS = {
  positive: [
    'tool', 'equipment', 'machine', 'work', 'task', 'installation', 'completed',
    'demonstration', 'site', 'actual', 'practical', 'job', 'project',
    'measurement', 'testing', 'assembly', 'safety',
    // Tamil/Hindi
    'வேலை', 'தொழில்', 'கருவி', 'काम', 'काज', 'यंत्र', 'औजार'
  ],
  negative: [
    'drawing', 'diagram', 'rough', 'sketch', 'draft', 'theoretical', 'fake',
    'copy', 'duplicate', 'expired', 'invalid'
  ]
};

// Safety indicator patterns
const SAFETY_INDICATORS = [
  'ppe', 'safety', 'helmet', 'glove', 'boot', 'harness', 'loto', 'lockout',
  'earthing', 'earthed', 'grounded', 'de-energized', 'isolated', 'precaution',
  'protective', 'safe', 'hazard', 'risk', 'protection',
  // Tamil/Hindi
  'பாதுகாப்பு', 'suraksha', 'सुरक्षा', 'safety shoes'
];

class RplEvidenceAIService {
  /**
   * Analyze evidence item against a specific competency and QP.
   * Returns advisory observation (not a determination).
   */
  analyzeEvidence(evidenceItem, competency, targetQP) {
    const title = (evidenceItem.title || '').toLowerCase();
    const description = (evidenceItem.description || '').toLowerCase();
    const fileName = (evidenceItem.fileName || '').toLowerCase();
    const content = `${title} ${description} ${fileName}`;

    const isVideo = Boolean(
      evidenceItem.isVideo ||
      VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext)) ||
      (evidenceItem.mimeType && evidenceItem.mimeType.startsWith('video/'))
    );
    const isImage = Boolean(
      IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext)) ||
      (evidenceItem.mimeType && evidenceItem.mimeType.startsWith('image/'))
    );
    const isDocument = Boolean(
      DOCUMENT_EXTENSIONS.some(ext => fileName.endsWith(ext)) ||
      (evidenceItem.mimeType && (
        evidenceItem.mimeType.includes('pdf') || evidenceItem.mimeType.includes('word')
      ))
    );

    // Score quality indicators
    const positiveMatches = QUALITY_INDICATORS.positive.filter(i => content.includes(i.toLowerCase()));
    const negativeMatches = QUALITY_INDICATORS.negative.filter(i => content.includes(i.toLowerCase()));
    const safetyMatches = SAFETY_INDICATORS.filter(s => content.includes(s.toLowerCase()));

    // Trade-specific keyword matching against QP
    let qpKeywordMatches = [];
    let qpToolMatches = [];
    if (targetQP) {
      qpKeywordMatches = (targetQP.keywords || []).filter(k => content.includes(k.toLowerCase()));
      qpToolMatches = (targetQP.toolsRequired || []).filter(tool => {
        const words = tool.toLowerCase().split(/[\s,/()]+/);
        return words.some(w => w.length > 3 && content.includes(w));
      });
    }

    // Competency-specific matching
    let competencyMatches = [];
    if (competency) {
      const compText = `${competency.name || ''} ${competency.description || ''}`.toLowerCase();
      const compWords = compText.split(/\s+/).filter(w => w.length > 4);
      competencyMatches = compWords.filter(w => content.includes(w));
    }

    // Calculate relevance
    const totalPositive = positiveMatches.length + qpKeywordMatches.length * 2 + qpToolMatches.length * 2;
    const hasSafety = safetyMatches.length > 0;

    let relevance;
    if (totalPositive >= 5 || qpKeywordMatches.length >= 3) {
      relevance = 'HIGH';
    } else if (totalPositive >= 2 || qpKeywordMatches.length >= 1) {
      relevance = 'MODERATE';
    } else {
      relevance = 'LOW';
    }

    // Deduct for negative indicators
    if (negativeMatches.length > 0) relevance = 'LOW';

    // Build detectedItems list
    const detectedItems = [];
    if (isVideo) detectedItems.push('Video evidence artifact submitted');
    if (isImage) detectedItems.push('Photo/image artifact submitted');
    if (isDocument) detectedItems.push('Document artifact submitted');
    if (qpToolMatches.length > 0) {
      detectedItems.push(`Trade tools referenced: ${qpToolMatches.slice(0, 2).join(', ')}`);
    }
    if (qpKeywordMatches.length > 0) {
      detectedItems.push(`Occupational keywords detected: ${qpKeywordMatches.slice(0, 3).join(', ')}`);
    }
    if (hasSafety) {
      detectedItems.push('Safety/PPE references detected');
    }
    if (competencyMatches.length > 0) {
      detectedItems.push(`Competency-relevant terms: ${competencyMatches.slice(0, 2).join(', ')}`);
    }

    // Build potentially supported criteria
    const potentiallySupportedCriteria = [];
    if (competency && Array.isArray(competency.performanceCriteria)) {
      competency.performanceCriteria.forEach(criterion => {
        const criterionLower = criterion.toLowerCase();
        const criterionWords = criterionLower.split(/\s+/).filter(w => w.length > 4);
        const matchCount = criterionWords.filter(w => content.includes(w)).length;
        if (matchCount >= 2) {
          potentiallySupportedCriteria.push({
            criterion: criterion.substring(0, 80) + (criterion.length > 80 ? '...' : ''),
            support: 'POSSIBLY_SUPPORTED',
            note: 'AI observation — requires assessor verification'
          });
        }
      });
    }

    // Build missing information list
    const missingInformation = [];
    if (!isVideo) {
      missingInformation.push('A continuous video demonstration is generally recommended for practical competency evidence');
    }
    if (!hasSafety) {
      missingInformation.push('Safety practices / PPE usage not clearly referenced in evidence description');
    }
    if (isVideo && evidenceItem.videoMetadata && evidenceItem.videoMetadata.durationSeconds < 30) {
      missingInformation.push('Video duration appears brief — a 2-3 minute continuous demonstration is recommended');
    }
    if (qpToolMatches.length === 0 && targetQP && targetQP.toolsRequired && targetQP.toolsRequired.length > 0) {
      missingInformation.push(`Specific trade tools not referenced (expected: ${(targetQP.toolsRequired || []).slice(0, 2).join(', ')})`);
    }

    // Build concerns
    const concerns = [];
    if (negativeMatches.length > 0) {
      concerns.push(`Evidence description contains potentially ambiguous terms: ${negativeMatches.join(', ')}`);
    }
    if (competencyMatches.length === 0 && competency) {
      concerns.push('Evidence description does not clearly reference competency-specific activities');
    }

    // Confidence level
    const confidence = relevance === 'HIGH' && detectedItems.length >= 3 ? 'MODERATE' :
      relevance === 'MODERATE' ? 'LOW' : 'INSUFFICIENT DATA';
    // Note: Never exceeds MODERATE — AI cannot physically inspect evidence

    // Build advisory summary
    const summaryPhrases = {
      HIGH: `Submitted artifact appears potentially consistent with ${competency?.name || 'the target competency'}. Workpiece, tool usage, and operational activity may be observable. Assessor verification is required.`,
      MODERATE: `Artifact appears to document an occupational activity. Some criteria may be partially supported. Assessor review and possible oral questioning recommended.`,
      LOW: `Evidence artifact relevance is unclear from available information. Assessor should examine the artifact directly before making any determination.`
    };

    const fullPayload = {
      provider: 'deterministic-fallback',
      model: 'rule-engine',
      promptVersion: null,
      generatedAt: new Date().toISOString(),
      evidenceId: evidenceItem.id || evidenceItem.evidenceId,
      competencyCode: competency?.code,
      competencyName: competency?.name,
      relevance,
      confidence,
      evidenceType: isVideo ? 'VIDEO' : isImage ? 'IMAGE' : isDocument ? 'DOCUMENT' : 'OTHER',
      detectedItems,
      potentiallySupportedCriteria: potentiallySupportedCriteria.slice(0, 3),
      missingInformation,
      concerns,
      advisorySummary: summaryPhrases[relevance] || summaryPhrases.LOW,
      disclaimer: 'AI ADVISORY ONLY: AI OBSERVATION ONLY. AI cannot physically verify evidence authenticity, location, or candidate identity. All competency determinations are made solely by the authorized human assessor.'
    };

    return {
      success: true,
      analysis: fullPayload,
      ...fullPayload
    };
  }

  /**
   * Batch analyze multiple evidence items against a competency.
   */
  analyzeEvidenceSet(evidenceList, competency, targetQP) {
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
      const emptyPayload = {
        itemCount: 0,
        totalAnalyzed: 0,
        analysisResults: [],
        overallRelevance: 'LOW',
        overallConfidence: 'INSUFFICIENT DATA',
        hasVideo: false,
        hasSafety: false,
        advisorySummary: 'No evidence artifacts submitted for this competency.',
        disclaimer: 'AI ADVISORY ONLY: AI OBSERVATION ONLY. Authorized human assessor makes all competency determinations.'
      };
      return {
        success: true,
        analysis: emptyPayload,
        ...emptyPayload
      };
    }

    const results = evidenceList.map(ev => this.analyzeEvidence(ev, competency, targetQP));

    const highRelevance = results.filter(r => r.relevance === 'HIGH').length;
    const hasVideo = results.some(r => r.evidenceType === 'VIDEO');
    const hasSafety = results.some(r => r.detectedItems && r.detectedItems.some(d => d.includes('Safety')));

    let overallRelevance = 'LOW';
    if (highRelevance >= 2 || (highRelevance >= 1 && hasVideo)) overallRelevance = 'HIGH';
    else if (highRelevance >= 1 || results.some(r => r.relevance === 'MODERATE')) overallRelevance = 'MODERATE';

    const setPayload = {
      itemCount: results.length,
      totalAnalyzed: results.length,
      provider: 'deterministic-fallback',
      model: 'rule-engine',
      generatedAt: new Date().toISOString(),
      analysisResults: results,
      overallRelevance,
      overallConfidence: 'MODERATE', // Batch analysis caps at MODERATE
      hasVideo,
      hasSafety,
      advisorySummary: `Analyzed ${results.length} artifact(s). ${highRelevance} appear potentially relevant. ${hasVideo ? 'Video evidence present.' : 'No video evidence.'} ${hasSafety ? 'Safety references detected.' : 'Safety evidence not explicitly referenced.'}`,
      disclaimer: 'AI ADVISORY ONLY: AI OBSERVATION ONLY. These observations are advisory. The authorized human assessor makes all final competency decisions.'
    };

    return {
      success: true,
      analysis: setPayload,
      ...setPayload
    };
  }
}

module.exports = new RplEvidenceAIService();
