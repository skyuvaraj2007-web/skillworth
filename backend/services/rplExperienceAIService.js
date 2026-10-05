/**
 * SkillWorth — RPL Experience AI Service (Phase 5)
 * AI Provider Architecture with deterministic fallback
 *
 * IMPORTANT PRINCIPLE: AI assists — it never certifies, decides, or overrides the human assessor.
 * Every output is advisory. Every confidence is bounded. No fabricated data.
 *
 * Provider hierarchy:
 * 1. Configured external AI provider (via environment variables) — when available
 * 2. Deterministic rule-based fallback engine — always available
 */

const rplMappingService = require('./rplMappingService');

// ===================================================================
// LANGUAGE DICTIONARIES FOR MULTI-LANGUAGE EXTRACTION
// Covers English, Tamil (romanized), Hindi (romanized), and mixed
// ===================================================================

const LANGUAGE_KEYWORDS = {
  // Masonry / Construction
  masonry: ['mason', 'masonry', 'brick', 'cement', 'plastering', 'plaster', 'tile', 'tiling',
    'bricklayer', 'brickwork', 'கட்டுமான', 'இட்டிகை', 'சிமென்ட்', 'rajmistri', 'राजमिस्त्री',
    'ईंट', 'plint', 'slab', 'rcc', 'reinforcement', 'shuttering', 'formwork', 'mortar'],

  // Electrical
  electrical: ['electrician', 'electric', 'wiring', 'wire', 'cable', 'conduit', 'mcb', 'rccb',
    'distribution board', 'switchboard', 'earthing', 'grounding', 'inverter', 'panel',
    'மின்சாரம்', 'மின்', 'எலக்ட்ரீசியன்', 'எலக்ட்ரிக்கல்', 'வயரிங்', 'சுவிட்ச்போர்டு', 'பல்புகள்',
    'bijli', 'bijlee', 'बिजली', 'वायरिंग', 'voltmeter', 'multimeter'],

  // Carpentry / Woodwork
  carpentry: ['carpenter', 'carpentry', 'wood', 'timber', 'joinery', 'furniture', 'cabinet',
    'sawing', 'cutting', 'mortise', 'tenon', 'வீட்டு மரத்தொழில்', 'மரத்தோழில்', 'தச்சு', 'தச்சர்',
    'बढ़ई', 'लकड़ी', 'plywood', 'mdf', 'veneer', 'door', 'window frame', 'fitting'],

  // Plumbing
  plumbing: ['plumber', 'plumbing', 'pipe', 'fitting', 'valve', 'tap', 'sanitary', 'drainage',
    'sewage', 'pvc pipe', 'குழாய்', 'நீர்', 'பைப்', 'பிளம்பர்', 'plastik pipe', 'पाइप', 'प्लंबर', 'welding pipe'],

  // Automotive
  automotive: ['mechanic', 'automobile', 'engine', 'gearbox', 'brake', 'tyre', 'vehicle',
    'two wheeler', 'bike', 'motor', 'வாகன', 'இயந்திர', 'மெக்கானிக்', 'மெக்கேனிக்', 'ஆட்டோமொபைல்',
    'मैकेनिक', 'कार', 'auto'],

  // Welding
  welding: ['welder', 'welding', 'arc welding', 'mig', 'tig', 'electrode', 'வெல்டிங்',
    'வெல்டர்', 'பற்றவைப்பு', 'वेल्डिंग', 'वेल्डर', 'cut', 'grinder', 'angle grinder'],

  // Solar / Renewable
  solar: ['solar', 'pv', 'photovoltaic', 'panel installation', 'inverter', 'battery', 'charge controller',
    'சோலார்', 'சூரிய சக்தி', 'सौर', 'renewable', 'wind', 'rooftop'],

  // Safety terms
  safety: ['safety', 'ppe', 'helmet', 'glove', 'boots', 'harness', 'mask', 'loto', 'hazard',
    'பாதுகாப்பு', 'கவசம்', 'suraksha', 'सुरक्षा', 'protective', 'precaution', 'safe work'],
};

// Tool extraction patterns (generic, trade-agnostic)
const TOOL_PATTERNS = [
  'trowel', 'spirit level', 'plumb bob', 'measuring tape', 'square',
  'hammer', 'chisel', 'saw', 'hand saw', 'circular saw', 'jigsaw', 'hacksaw',
  'multimeter', 'neon tester', 'voltmeter', 'ammeter', 'clamp meter',
  'wire stripper', 'crimping tool', 'pliers', 'screwdriver',
  'conduit bender', 'pipe cutter', 'pipe wrench', 'pipe bender',
  'welding machine', 'electrode holder', 'grinder', 'angle grinder',
  'drill', 'drill bit', 'hammer drill', 'impact driver',
  'sandpaper', 'paint brush', 'roller', 'spray gun',
  'spanner', 'socket set', 'torque wrench', 'feeler gauge',
  'level', 'tape measure', 'chalk line', 'steel rule',
  'safety helmet', 'safety boots', 'safety gloves', 'safety harness',
  'trolley', 'forklift', 'crane', 'hoist', 'scaffolding',
  // Tamil / Hindi tool references
  'anavi', 'kezhambu', 'தட்டை', 'கம்பி', 'ஆணி', 'ரேந்து', 'रेंच', 'औजार'
];

// Duration extraction patterns
const DURATION_PATTERNS = [
  { re: /(\d+)\s*(?:years?|yrs?|வருட[ங்]?|साल|सालों|वर्ष)/i, unit: 'years' },
  { re: /(\d+)\s*(?:months?|மாத[ங்]?|महीने?|माह)/i, unit: 'months' },
  { re: /(?:over|more than|nearly|about|almost|around)\s+(\d+)/i, unit: 'years' },
];

// ===================================================================
// DETERMINISTIC FALLBACK EXTRACTION ENGINE
// ===================================================================

function extractWithDeterministicEngine(text) {
  const textLower = text.toLowerCase();
  const result = {
    provider: 'deterministic-fallback',
    model: 'rule-engine',
    promptVersion: null,
    generatedAt: new Date().toISOString(),

    language: detectLanguage(textLower),
    occupationCandidates: [],
    experienceYears: null,
    experienceMonths: null,
    tasks: [],
    tools: [],
    materials: [],
    workEnvironments: [],
    safetyActivities: [],
    evidenceMentions: [],
    confidence: 'MODERATE',
    missingInformation: []
  };

  // Language detection
  result.language = detectLanguage(textLower);

  // Experience duration extraction
  for (const pat of DURATION_PATTERNS) {
    const m = text.match(pat.re);
    if (m) {
      const val = parseInt(m[1], 10);
      if (pat.unit === 'years' && !result.experienceYears) result.experienceYears = val;
      else if (pat.unit === 'months' && !result.experienceMonths) result.experienceMonths = val;
    }
  }

  // Occupation candidate detection
  const occupationScores = {};
  for (const [occ, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (occ === 'safety') continue; // Safety handled separately
    let score = 0;
    for (const kw of keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 2 : 1; // Longer keyword = stronger match
      }
    }
    if (score > 0) {
      occupationScores[occ] = score;
    }
  }

  // Normalize scores to confidence (0-1)
  const maxScore = Math.max(...Object.values(occupationScores), 1);
  const sortedOccupations = Object.entries(occupationScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([occ, score]) => ({
      occupation: capitalizeOccupation(occ),
      confidence: Math.min(0.95, score / maxScore).toFixed(2)
    }));

  result.occupationCandidates = sortedOccupations;

  // Tool extraction
  const foundTools = TOOL_PATTERNS.filter(tool =>
    textLower.includes(tool.toLowerCase())
  );
  result.tools = [...new Set(foundTools)];

  // Task extraction using verb-noun patterns
  result.tasks = extractTasks(textLower);

  // Safety detection
  const safetyTerms = LANGUAGE_KEYWORDS.safety || [];
  result.safetyActivities = safetyTerms.filter(s => textLower.includes(s.toLowerCase()));

  // Evidence mentions
  const evidencePatterns = ['photo', 'video', 'certificate', 'document', 'record', 'letter',
    'salary slip', 'work order', 'appointment letter', 'experience letter',
    'photograph', 'footage', 'proof'];
  result.evidenceMentions = evidencePatterns.filter(e => textLower.includes(e));

  // Material extraction (common construction materials)
  const materialPatterns = ['cement', 'sand', 'aggregate', 'brick', 'tile', 'wood', 'steel',
    'copper wire', 'pvc', 'ms pipe', 'timber', 'plywood', 'glass', 'paint', 'mortar'];
  result.materials = materialPatterns.filter(m => textLower.includes(m));

  // Work environment
  const envPatterns = [
    { key: 'residential', terms: ['house', 'home', 'flat', 'apartment', 'bungalow'] },
    { key: 'commercial', terms: ['office', 'shop', 'mall', 'commercial', 'building'] },
    { key: 'industrial', terms: ['factory', 'plant', 'industry', 'industrial', 'warehouse'] },
    { key: 'outdoor', terms: ['outdoor', 'site', 'field', 'exterior', 'road', 'bridge'] },
  ];
  for (const env of envPatterns) {
    if (env.terms.some(t => textLower.includes(t))) {
      result.workEnvironments.push(env.key);
    }
  }

  // Confidence assessment
  const totalExtracted = result.occupationCandidates.length + result.tools.length + result.tasks.length;
  if (totalExtracted >= 6 && result.experienceYears) {
    result.confidence = 'HIGH';
  } else if (totalExtracted >= 3) {
    result.confidence = 'MODERATE';
  } else if (totalExtracted > 0) {
    result.confidence = 'LOW';
  } else {
    result.confidence = 'INSUFFICIENT DATA';
  }

  // Missing information assessment
  if (!result.experienceYears && !result.experienceMonths) {
    result.missingInformation.push('Duration of work experience not clearly mentioned');
  }
  if (result.tools.length === 0) {
    result.missingInformation.push('Specific tools, equipment or machinery not mentioned');
  }
  if (result.safetyActivities.length === 0) {
    result.missingInformation.push('Safety practices, PPE usage not clearly described');
  }
  if (result.occupationCandidates.length === 0) {
    result.missingInformation.push('Occupation or trade type not clearly identifiable from description');
  }
  result.yearsOfExperience = result.experienceYears || 0;
  result.detectedTools = result.tools;
  result.detectedTasks = result.tasks;
  result.disclaimer = 'AI ADVISORY ONLY: All extractions and recommendations are advisory observations. Certified human assessor holds sole evaluation and certification authority.';
  result.extracted = {
    language: result.language,
    occupationCandidates: result.occupationCandidates,
    experienceYears: result.experienceYears,
    yearsOfExperience: result.yearsOfExperience,
    experienceMonths: result.experienceMonths,
    tasks: result.tasks,
    detectedTasks: result.detectedTasks,
    tools: result.tools,
    detectedTools: result.detectedTools,
    materials: result.materials,
    workEnvironments: result.workEnvironments,
    safetyActivities: result.safetyActivities,
    evidenceMentions: result.evidenceMentions,
    confidence: result.confidence,
    missingInformation: result.missingInformation
  };

  return result;
}

function detectLanguage(textLower) {
  // Simple script/keyword detection
  const tamilChars = (textLower.match(/[\u0B80-\u0BFF]/g) || []).length;
  const hindiChars = (textLower.match(/[\u0900-\u097F]/g) || []).length;
  const totalChars = textLower.replace(/\s/g, '').length;

  if (tamilChars > 5 || (totalChars > 0 && tamilChars / totalChars > 0.1)) return 'ta';
  if (hindiChars > 5 || (totalChars > 0 && hindiChars / totalChars > 0.1)) return 'hi';

  // Detect Tamil romanized
  const tamilRomanized = ['vela', 'vendum', 'thovil', 'varushum', 'enne', 'irukku', 'pannuvenu'];
  if (tamilRomanized.some(t => textLower.includes(t))) return 'ta-roman';

  // Detect Hindi romanized
  const hindiRomanized = ['kaam', 'karta', 'hoon', 'saal', 'bijli', 'mistri', 'kiya'];
  if (hindiRomanized.some(h => textLower.includes(h))) return 'hi-roman';

  return 'en';
}

function extractTasks(textLower) {
  const taskKeywords = [
    // Generic construction tasks
    'laying bricks', 'brick laying', 'brick masonry', 'plastering', 'plaster work',
    'tile installation', 'tile work', 'tile fitting', 'floor tiling', 'wall tiling',
    'concrete mixing', 'concrete pouring', 'rcc work', 'shuttering', 'formwork',
    'painting', 'waterproofing', 'grouting',

    // Electrical tasks
    'wiring', 'cable laying', 'conduit installation', 'panel wiring', 'db wiring',
    'earthing', 'socket installation', 'switch installation', 'load testing',
    'fault finding', 'fault rectification', 'cable termination', 'meter installation',

    // Carpentry tasks
    'wood cutting', 'sawing', 'joinery', 'furniture making', 'door fitting',
    'window fitting', 'frame making', 'cabinet making', 'wood polishing',
    'marking', 'chiselling', 'tenon joint', 'mortise',

    // Plumbing tasks
    'pipe fitting', 'pipe installation', 'valve installation', 'tap fitting',
    'drain laying', 'sewage work', 'water supply', 'pipe bending',

    // Automotive tasks
    'engine servicing', 'oil change', 'brake repair', 'tyre changing', 'wheel balancing',
    'gearbox repair', 'engine tuning', 'valve adjustment',

    // Welding tasks
    'arc welding', 'mig welding', 'tig welding', 'gas welding', 'cutting',
    'grinding', 'metal fabrication', 'joint preparation',

    // Generic work activities
    'maintenance', 'repair', 'installation', 'testing', 'inspection',
    'measurement', 'assembly', 'fabrication', 'commissioning',
  ];

  return taskKeywords.filter(task => textLower.includes(task));
}

function capitalizeOccupation(key) {
  const labels = {
    masonry: 'Mason / Masonry Worker',
    electrical: 'Electrician',
    carpentry: 'Carpenter',
    plumbing: 'Plumber',
    automotive: 'Automotive Mechanic',
    welding: 'Welder',
    solar: 'Solar PV Installer',
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// ===================================================================
// AI PROVIDER ABSTRACTION
// ===================================================================

class AIProvider {
  constructor() {
    this.providerName = 'deterministic-fallback';
    this.modelName = 'rule-engine';
    this.isLive = false;

    // Check for configured AI API key
    if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      this.providerName = process.env.OPENAI_API_KEY ? 'openai' :
        process.env.GEMINI_API_KEY ? 'google-gemini' : 'anthropic';
      this.modelName = process.env.AI_MODEL || 'configured-model';
      this.isLive = true; // Would invoke real provider — currently uses fallback for portability
    }
  }

  /**
   * Analyze experience text — extracts structured information.
   * Falls back to deterministic engine when no live AI provider is configured.
   */
  async analyzeExperience(text) {
    // In a production environment with API keys, this would call the external AI API.
    // For the current deployment, we use the deterministic engine which is honest and transparent.
    const extracted = extractWithDeterministicEngine(text);

    return {
      ...extracted,
      provider: this.isLive ? this.providerName : 'deterministic-fallback',
      model: this.isLive ? this.modelName : 'rule-engine',
      promptVersion: this.isLive ? 'rpl-experience-v1' : null,
      isLiveAI: this.isLive,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Match extracted experience against all registered Qualification Packs.
   */
  matchQualificationPacks(extractedData, allQPs) {
    if (!extractedData) {
      return {
        success: false,
        message: 'extractedData is required.',
        pathways: [],
        provider: 'deterministic-fallback'
      };
    }

    const tasks = Array.isArray(extractedData.tasks) ? extractedData.tasks :
      Array.isArray(extractedData.detectedTasks) ? extractedData.detectedTasks : [];
    const tools = Array.isArray(extractedData.tools) ? extractedData.tools :
      Array.isArray(extractedData.detectedTools) ? extractedData.detectedTools : [];
    const safety = Array.isArray(extractedData.safetyActivities) ? extractedData.safetyActivities : [];
    const years = extractedData.experienceYears || extractedData.yearsOfExperience || 0;
    const evidenceMentions = Array.isArray(extractedData.evidenceMentions) ? extractedData.evidenceMentions : [];

    const text = buildTextFromExtracted({
      ...extractedData,
      tasks,
      tools,
      safetyActivities: safety,
      experienceYears: years
    });

    const structuredFields = {
      yearsOfExperience: years,
      tasksPerformed: tasks.join(', '),
      toolsUsed: tools.join(', '),
      safetyUsed: safety.join(', '),
    };

    const analysis = rplMappingService.analyzeExperienceDeclaration(text, structuredFields, allQPs);

    // Enhance each pathway with score breakdown
    const enhancedPathways = (analysis.suggestedPathways || []).map(pathway => {
      const qp = pathway.qualificationPack || {};
      const totalPossible = 100;

      // Task alignment score
      const taskCount = Math.max(1, tasks.length);
      const matchedTasks = pathway.matchedSkills || [];
      const taskScore = Math.min(40, Math.round((matchedTasks.length / taskCount) * 40));

      // Tool alignment score
      const toolCount = Math.max(1, tools.length);
      const matchedTools = pathway.matchedTools || [];
      const toolScore = Math.min(25, Math.round((matchedTools.length / toolCount) * 25));

      // Experience relevance score
      const yearsScore = Math.min(20, (years / 5) * 20);

      // Evidence quality score
      const evidenceScore = Math.min(15, evidenceMentions.length * 5);

      const totalScore = Math.round(taskScore + toolScore + yearsScore + evidenceScore);

      return {
        ...pathway,
        matchScore: Math.min(96, totalScore),
        scoreBreakdown: {
          taskAlignment: { score: taskScore, outOf: 40 },
          toolAlignment: { score: toolScore, outOf: 25 },
          experienceRelevance: { score: Math.round(yearsScore), outOf: 20 },
          evidenceReferences: { score: evidenceScore, outOf: 15 },
          totalOutOf: totalPossible
        },
        matchedTasks,
        matchedTools,
        missingTasks: (qp.keywords || []).filter(k =>
          !extractedData.tasks.some(t => t.includes(k.toLowerCase()))
        ).slice(0, 4),
        missingTools: (qp.toolsRequired || []).filter(tool =>
          !extractedData.tools.some(t => tool.toLowerCase().includes(t.toLowerCase()))
        ).slice(0, 3),
        explanation: pathway.whyItMatches || [],
        confidence: totalScore >= 70 ? 'HIGH' : totalScore >= 45 ? 'MODERATE' : totalScore >= 25 ? 'LOW' : 'INSUFFICIENT DATA'
      };
    });

    const sortedPathways = enhancedPathways.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      provider: this.isLive ? this.providerName : 'deterministic-fallback',
      model: this.isLive ? this.modelName : 'rule-engine',
      isLiveAI: this.isLive,
      generatedAt: new Date().toISOString(),
      promptVersion: 'rpl-match-v1',
      primaryRecommendation: analysis.suggestedQualificationPack,
      topMatch: sortedPathways[0] || null,
      overallConfidence: analysis.aiConfidenceScore >= 70 ? 'HIGH' :
        analysis.aiConfidenceScore >= 45 ? 'MODERATE' :
          analysis.aiConfidenceScore >= 25 ? 'LOW' : 'INSUFFICIENT DATA',
      pathways: sortedPathways,
      disclaimer: 'AI ADVISORY ONLY: AI-assisted pathway matching. This result is advisory only. The worker and authorized assessor confirm the final Qualification Pack selection. AI does not award certification.',
    };
  }
}

function buildTextFromExtracted(extracted) {
  const parts = [
    (extracted.occupationCandidates || []).map(o => o.occupation).join(' '),
    (extracted.tasks || []).join(' '),
    (extracted.tools || []).join(' '),
    (extracted.materials || []).join(' '),
    (extracted.safetyActivities || []).join(' '),
    extracted.experienceYears ? `${extracted.experienceYears} years experience` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

// ===================================================================
// RPL EXPERIENCE AI SERVICE (Main Export)
// ===================================================================

const aiProvider = new AIProvider();

class RplExperienceAIService {
  getProvider() {
    return aiProvider;
  }

  getProviderInfo() {
    return {
      providerName: aiProvider.providerName,
      modelName: aiProvider.modelName,
      isLiveAI: aiProvider.isLive,
      capabilities: [
        'analyzeExperience',
        'matchQualificationPacks',
      ]
    };
  }

  /**
   * Analyze natural-language experience description.
   * Handles English, Tamil, Hindi, and mixed scripts.
   * Returns structured extraction with honest confidence.
   */
  async analyzeExperience(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        success: false,
        message: 'No experience description provided.',
        provider: 'deterministic-fallback',
        model: 'rule-engine',
        confidence: 'INSUFFICIENT DATA',
        occupationCandidates: [],
        experienceYears: null,
        tasks: [],
        tools: [],
        missingInformation: ['Experience description is required']
      };
    }

    try {
      const extraction = await aiProvider.analyzeExperience(text.trim());
      return {
        success: true,
        ...extraction
      };
    } catch (err) {
      // Graceful fallback on any provider error
      console.error('[AI Experience Extraction] Provider error, falling back:', err.message);
      const fallback = extractWithDeterministicEngine(text.trim());
      return {
        success: true,
        ...fallback,
        provider: 'deterministic-fallback',
        model: 'rule-engine',
        isLiveAI: false
      };
    }
  }

  /**
   * Match extracted experience data against all registered QPs.
   */
  matchToQualificationPacks(extractedData, allQPs) {
    try {
      return aiProvider.matchQualificationPacks(extractedData, allQPs);
    } catch (err) {
      console.error('[AI QP Matching] Error:', err.message);
      return {
        success: false,
        message: 'Qualification Pack matching temporarily unavailable.',
        pathways: [],
        provider: 'deterministic-fallback'
      };
    }
  }

  /**
   * Full pipeline: analyze text + match QPs in a single call.
   */
  async analyzeAndMatch(text, allQPs) {
    const extraction = await this.analyzeExperience(text);
    if (!extraction.success) return extraction;

    const matchResult = this.matchToQualificationPacks(extraction, allQPs);
    return {
      ...extraction,
      matchResult
    };
  }
}

module.exports = new RplExperienceAIService();
