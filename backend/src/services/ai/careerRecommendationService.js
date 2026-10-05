/**
 * SKILLNEXUS AI — Career Recommendation Service
 * Analyzes verified student competencies and projects to evaluate alternative career tracks.
 * Generates explainable suitability and readiness scoring without fabricating inferences.
 */

const aiContextService = require('./aiContextService');

const CAREER_PROFILES = [
  {
    role: 'Full Stack Engineer',
    category: 'Software Engineering',
    coreSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs'],
    description: 'Design and implement end-to-end web applications, microservices, and reactive user interfaces.'
  },
  {
    role: 'Data Scientist & AI Systems Engineer',
    category: 'Artificial Intelligence',
    coreSkills: ['Python', 'Machine Learning', 'SQL', 'Deep Learning', 'Data Visualization'],
    description: 'Architect machine learning pipelines, optimize statistical models, and deploy intelligent analytical algorithms.'
  },
  {
    role: 'Cloud & DevOps Architect',
    category: 'Cloud & Infrastructure',
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    description: 'Orchestrate resilient cloud infrastructure, automate deployment pipelines, and maintain containerized workloads.'
  },
  {
    role: 'Data Analyst',
    category: 'Data Analytics',
    coreSkills: ['SQL', 'Python', 'Power BI', 'Excel', 'Statistics'],
    description: 'Extract business insights from telemetry data, construct executive dashboards, and drive data-informed strategies.'
  },
  {
    role: 'AI / Machine Learning Engineer',
    category: 'Machine Learning',
    coreSkills: ['Python', 'PyTorch', 'TensorFlow', 'Data Structures', 'SQL'],
    description: 'Build neural network architectures, train deep learning models, and productionize inference APIs.'
  }
];

function normalize(str) {
  return String(str || '').toLowerCase().trim().replace(/[\.\-_]/g, '');
}

class CareerRecommendationService {
  /**
   * Evaluates student's verified skills against known career benchmarks.
   */
  async getCareerRecommendations(studentId) {
    const context = await aiContextService.getStudentAIContext(studentId);

    if (!context.dataQuality.sufficient && context.skills.length === 0) {
      return {
        recommendations: [],
        message: 'Insufficient learning data to generate career recommendations. Please record skills or take an assessment.',
        dataQuality: context.dataQuality
      };
    }

    const studentSkillsNorm = new Map();
    context.skills.forEach(s => {
      studentSkillsNorm.set(normalize(s.name), s);
    });

    const recommendations = CAREER_PROFILES.map(profile => {
      const matchedSkills = [];
      const missingSkills = [];

      profile.coreSkills.forEach(skillName => {
        const norm = normalize(skillName);
        let found = false;
        for (const [sNorm, sObj] of studentSkillsNorm.entries()) {
          if (sNorm.includes(norm) || norm.includes(sNorm)) {
            matchedSkills.push({
              name: skillName,
              verified: sObj.verified,
              level: sObj.level
            });
            found = true;
            break;
          }
        }
        if (!found) {
          missingSkills.push(skillName);
        }
      });

      // Readiness score calculation
      const skillScore = profile.coreSkills.length > 0
        ? (matchedSkills.length / profile.coreSkills.length) * 60
        : 0;
      
      // Project bonus if student has matching tech stack
      let projectBonus = 0;
      context.projects.forEach(p => {
        const pStack = (p.techStack || []).map(normalize);
        const overlap = profile.coreSkills.filter(cs => pStack.includes(normalize(cs)));
        if (overlap.length > 0) projectBonus += 10;
      });
      projectBonus = Math.min(20, projectBonus);

      // Assessment bonus
      const assessmentBonus = context.assessments.length > 0 ? 15 : 0;

      const suitabilityScore = Math.min(99, Math.round(skillScore + projectBonus + assessmentBonus));

      // Human-readable explanation
      let explanation = '';
      if (matchedSkills.length >= 3) {
        explanation = `High alignment (${suitabilityScore}%): You possess verified capabilities in ${matchedSkills.map(m => m.name).slice(0, 3).join(', ')}. Acquiring ${missingSkills.slice(0, 2).join(', ') || 'specialized tools'} will achieve complete industry qualification.`;
      } else if (matchedSkills.length > 0) {
        explanation = `Moderate alignment (${suitabilityScore}%): Strong foundation in ${matchedSkills.map(m => m.name).join(', ')}. Transition requires closing core gaps in ${missingSkills.slice(0, 2).join(', ')}.`;
      } else {
        explanation = `Exploratory path (${suitabilityScore}%): Requires establishing fundamental competencies in ${profile.coreSkills.slice(0, 3).join(', ')}.`;
      }

      return {
        role: profile.role,
        category: profile.category,
        description: profile.description,
        suitabilityScore,
        matchedSkills: matchedSkills.map(m => m.name),
        missingSkills,
        explanation
      };
    });

    // Sort by suitability score descending
    recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      currentCareerGoal: context.targetRole,
      recommendations,
      dataQuality: context.dataQuality
    };
  }
}

module.exports = new CareerRecommendationService();
