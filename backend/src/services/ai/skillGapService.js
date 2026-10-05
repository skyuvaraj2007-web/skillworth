/**
 * SKILLNEXUS AI — Skill Gap Analysis Service
 * Compares current student skills against target career role benchmarks.
 * Never fabricates skills; handles insufficient data gracefully.
 */

const aiContextService = require('./aiContextService');
const aiProvider = require('./aiProvider');

const ROLE_BENCHMARKS = {
  'Full Stack Developer': [
    { name: 'JavaScript', level: 'Advanced', weight: 0.25, category: 'Programming' },
    { name: 'React', level: 'Intermediate', weight: 0.20, category: 'Frontend' },
    { name: 'Node.js', level: 'Intermediate', weight: 0.20, category: 'Backend' },
    { name: 'SQL', level: 'Intermediate', weight: 0.15, category: 'Database' },
    { name: 'REST APIs', level: 'Intermediate', weight: 0.10, category: 'Architecture' },
    { name: 'Git', level: 'Intermediate', weight: 0.10, category: 'DevOps' }
  ],
  'Full Stack Engineer': [
    { name: 'JavaScript', level: 'Advanced', weight: 0.25, category: 'Programming' },
    { name: 'React', level: 'Intermediate', weight: 0.20, category: 'Frontend' },
    { name: 'Node.js', level: 'Intermediate', weight: 0.20, category: 'Backend' },
    { name: 'SQL', level: 'Intermediate', weight: 0.15, category: 'Database' },
    { name: 'Git', level: 'Intermediate', weight: 0.10, category: 'DevOps' },
    { name: 'Docker', level: 'Beginner', weight: 0.10, category: 'Cloud' }
  ],
  'Data Analyst': [
    { name: 'SQL', level: 'Advanced', weight: 0.30, category: 'Database' },
    { name: 'Python', level: 'Intermediate', weight: 0.25, category: 'Programming' },
    { name: 'Power BI', level: 'Intermediate', weight: 0.20, category: 'Analytics' },
    { name: 'Excel', level: 'Advanced', weight: 0.15, category: 'Analytics' },
    { name: 'Statistics', level: 'Intermediate', weight: 0.10, category: 'Math' }
  ],
  'Data Scientist & AI Systems Engineer': [
    { name: 'Python', level: 'Advanced', weight: 0.30, category: 'Programming' },
    { name: 'Machine Learning', level: 'Intermediate', weight: 0.25, category: 'AI' },
    { name: 'SQL', level: 'Intermediate', weight: 0.20, category: 'Database' },
    { name: 'Deep Learning', level: 'Intermediate', weight: 0.15, category: 'AI' },
    { name: 'Data Visualization', level: 'Intermediate', weight: 0.10, category: 'Analytics' }
  ],
  'AI / Machine Learning Engineer': [
    { name: 'Python', level: 'Advanced', weight: 0.30, category: 'Programming' },
    { name: 'PyTorch', level: 'Intermediate', weight: 0.25, category: 'AI' },
    { name: 'TensorFlow', level: 'Intermediate', weight: 0.15, category: 'AI' },
    { name: 'Data Structures', level: 'Intermediate', weight: 0.15, category: 'Core' },
    { name: 'SQL', level: 'Intermediate', weight: 0.15, category: 'Database' }
  ],
  'Cloud & DevOps Architect': [
    { name: 'Linux', level: 'Intermediate', weight: 0.25, category: 'Systems' },
    { name: 'Docker', level: 'Intermediate', weight: 0.25, category: 'Containers' },
    { name: 'Kubernetes', level: 'Intermediate', weight: 0.20, category: 'Orchestration' },
    { name: 'AWS', level: 'Intermediate', weight: 0.20, category: 'Cloud' },
    { name: 'CI/CD', level: 'Intermediate', weight: 0.10, category: 'DevOps' }
  ]
};

function normalize(str) {
  return String(str || '').toLowerCase().trim().replace(/[\.\-_]/g, '');
}

class SkillGapService {
  /**
   * Perform explainable skill gap analysis for a student.
   * Compares real PostgreSQL student skills against the target role benchmark.
   */
  async analyzeSkillGap(studentId, overrideTargetRole = null) {
    const context = await aiContextService.getStudentAIContext(studentId);
    const targetRole = overrideTargetRole || context.targetRole || 'Full Stack Developer';

    // Insufficient data guard: zero fabrication
    if (!context.dataQuality.sufficient && context.skills.length === 0) {
      return {
        targetRole,
        masteredSkills: [],
        partialSkills: [],
        missingSkills: [],
        priorityGaps: [],
        readinessScore: context.readinessScore || 0,
        explanation: 'Insufficient learning data recorded. Please complete your profile skills or diagnostic assessments to generate a verified skill gap report.',
        dataQuality: context.dataQuality
      };
    }

    // Match benchmarks
    const benchmark = ROLE_BENCHMARKS[targetRole] ||
      ROLE_BENCHMARKS['Full Stack Developer'];

    const studentSkillMap = new Map();
    context.skills.forEach(s => {
      studentSkillMap.set(normalize(s.name), s);
    });

    const masteredSkills = [];
    const partialSkills = [];
    const missingSkills = [];
    const priorityGaps = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    benchmark.forEach(req => {
      totalWeight += req.weight;
      const normReq = normalize(req.name);

      let matchedStudentSkill = null;
      for (const [sNorm, sObj] of studentSkillMap.entries()) {
        if (sNorm.includes(normReq) || normReq.includes(sNorm)) {
          matchedStudentSkill = sObj;
          break;
        }
      }

      if (matchedStudentSkill) {
        if (matchedStudentSkill.verified || matchedStudentSkill.score >= 70) {
          masteredSkills.push({
            name: req.name,
            currentLevel: matchedStudentSkill.level,
            requiredLevel: req.level,
            verified: matchedStudentSkill.verified,
            score: matchedStudentSkill.score
          });
          earnedWeight += req.weight;
        } else {
          partialSkills.push({
            name: req.name,
            currentLevel: matchedStudentSkill.level,
            requiredLevel: req.level,
            verified: matchedStudentSkill.verified,
            score: matchedStudentSkill.score,
            reason: `Proficiency level (${matchedStudentSkill.level}) is below target benchmark (${req.level}) or pending institutional verification.`
          });
          earnedWeight += req.weight * 0.5;
        }
      } else {
        const gapItem = {
          name: req.name,
          requiredLevel: req.level,
          category: req.category,
          importance: req.weight >= 0.20 ? 'CRITICAL' : 'HIGH',
          reason: `Required core competency for ${targetRole}. Currently missing from your verified profile.`
        };
        missingSkills.push(gapItem);
        if (req.weight >= 0.20) {
          priorityGaps.push(gapItem);
        }
      }
    });

    // If no priority gaps were identified above 0.20 weight, take the first missing skill
    if (priorityGaps.length === 0 && missingSkills.length > 0) {
      priorityGaps.push(missingSkills[0]);
    }

    const alignmentScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    // Grounded explanation
    let explanation = '';
    if (missingSkills.length === 0 && partialSkills.length === 0) {
      explanation = `Excellent! Your skill profile exhibits 100% alignment with ${targetRole} industry standards with all core competencies verified.`;
    } else if (priorityGaps.length > 0) {
      const pNames = priorityGaps.map(p => p.name).join(', ');
      explanation = `${pNames} ${priorityGaps.length > 1 ? 'are' : 'is a'} priority gap because the target role "${targetRole}" requires verified proficiency and your profile currently has no verified record.`;
    } else {
      explanation = `You have completed foundational requirements for ${targetRole}. Focus on advancing ${partialSkills.map(p => p.name).join(', ')} from self-assessed to verified status.`;
    }

    // Enhance explanation using AI Provider if available
    if (aiProvider.isAvailable() && missingSkills.length > 0) {
      const prompt = `Student Target Role: ${targetRole}\nMastered: ${masteredSkills.map(s => s.name).join(', ') || 'None'}\nPartial: ${partialSkills.map(s => s.name).join(', ') || 'None'}\nMissing: ${missingSkills.map(s => s.name).join(', ')}\n\nWrite a 2-sentence concise, professional career coaching explanation explaining why the priority skill "${priorityGaps[0]?.name}" must be prioritized. Ground your response strictly in the provided data. Do not fabricate external tools.`;
      const aiRes = await aiProvider.generateCompletion({ prompt });
      if (aiRes.success && aiRes.text) {
        explanation = aiRes.text;
      }
    }

    return {
      targetRole,
      alignmentScore,
      readinessScore: context.readinessScore || 0,
      masteredSkills,
      partialSkills,
      missingSkills,
      priorityGaps,
      explanation,
      dataQuality: context.dataQuality
    };
  }
}

module.exports = new SkillGapService();
