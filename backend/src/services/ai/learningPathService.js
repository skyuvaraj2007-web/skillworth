/**
 * SKILLNEXUS AI — Learning Path Service
 * Converts identified student skill gaps into an ordered pedagogical roadmap.
 * Respects prerequisite hierarchy, current student level, and target role.
 */

const skillGapService = require('./skillGapService');
const courseRecommendationService = require('./courseRecommendationService');
const aiContextService = require('./aiContextService');

// Known pedagogical prerequisites
const PREREQUISITE_HIERARCHY = {
  'React': ['JavaScript', 'HTML', 'CSS'],
  'Next.js': ['React', 'JavaScript'],
  'Node.js': ['JavaScript'],
  'REST APIs': ['JavaScript', 'Node.js'],
  'FastAPI': ['Python'],
  'PyTorch': ['Python', 'Linear Algebra', 'Data Structures'],
  'TensorFlow': ['Python', 'Data Structures'],
  'Deep Learning': ['Machine Learning', 'Python'],
  'Machine Learning': ['Python', 'Linear Algebra', 'Statistics'],
  'Kubernetes': ['Docker', 'Linux'],
  'Docker': ['Linux'],
  'System Design': ['Data Structures', 'SQL', 'REST APIs']
};

class LearningPathService {
  /**
   * Generates a step-by-step ordered learning path for the student's target role.
   */
  async generateLearningPath(studentId) {
    const context = await aiContextService.getStudentAIContext(studentId);
    const gapAnalysis = await skillGapService.analyzeSkillGap(studentId);
    const courseRecs = await courseRecommendationService.getRecommendations(studentId);

    if (!context.dataQuality.sufficient && context.skills.length === 0) {
      return {
        targetRole: gapAnalysis.targetRole || 'Full Stack Developer',
        path: [],
        message: 'Insufficient learning data. Please complete profile skills or baseline assessments to generate a personalized learning roadmap.',
        dataQuality: context.dataQuality
      };
    }

    // Collect all skills to learn: priority gaps first, then missing skills, then partial skills
    const skillsToLearn = [];
    const seen = new Set();

    (gapAnalysis.priorityGaps || []).forEach(g => {
      if (!seen.has(g.name)) {
        seen.add(g.name);
        skillsToLearn.push({ name: g.name, type: 'CRITICAL', requiredLevel: g.requiredLevel });
      }
    });

    (gapAnalysis.missingSkills || []).forEach(g => {
      if (!seen.has(g.name)) {
        seen.add(g.name);
        skillsToLearn.push({ name: g.name, type: 'MISSING', requiredLevel: g.requiredLevel });
      }
    });

    (gapAnalysis.partialSkills || []).forEach(g => {
      if (!seen.has(g.name)) {
        seen.add(g.name);
        skillsToLearn.push({ name: g.name, type: 'ADVANCEMENT', requiredLevel: g.requiredLevel });
      }
    });

    // Topological sorting based on prerequisite hierarchy
    const sortedSkills = [];
    const added = new Set();

    // Helper: recursively add prerequisites first
    function addWithPrereqs(skillItem, visiting = new Set()) {
      const name = skillItem.name;
      if (added.has(name)) return;
      if (visiting.has(name)) {
        // Break cycle if any
        added.add(name);
        sortedSkills.push(skillItem);
        return;
      }

      visiting.add(name);
      const prereqs = PREREQUISITE_HIERARCHY[name] || [];
      prereqs.forEach(pName => {
        // If prerequisite is in our skillsToLearn and not yet added, add it first
        const pItem = skillsToLearn.find(s => s.name.toLowerCase() === pName.toLowerCase());
        if (pItem && !added.has(pItem.name)) {
          addWithPrereqs(pItem, visiting);
        }
      });

      visiting.delete(name);
      added.add(name);
      sortedSkills.push(skillItem);
    }

    skillsToLearn.forEach(s => addWithPrereqs(s));

    // Map ordered skills to actual database courses
    const recMap = new Map();
    (courseRecs.recommendations || []).forEach(r => {
      recMap.set(r.targetSkill.toLowerCase(), r);
    });

    const path = sortedSkills.map((item, index) => {
      const matchedCourse = recMap.get(item.name.toLowerCase());
      return {
        step: index + 1,
        skill: item.name,
        type: item.type,
        targetLevel: item.requiredLevel || 'Intermediate',
        courseId: matchedCourse ? matchedCourse.courseId : null,
        courseTitle: matchedCourse ? matchedCourse.title : `Foundational ${item.name} Module`,
        reason: matchedCourse
          ? matchedCourse.reason
          : `Mastering ${item.name} is a foundational requirement for ${gapAnalysis.targetRole}.`,
        estimatedDuration: matchedCourse?.duration || '3-4 Weeks',
        milestone: index === 0 ? 'Foundation Sprint' : (index === sortedSkills.length - 1 ? 'Capstone Project Proof' : 'Core Specialization')
      };
    });

    return {
      targetRole: gapAnalysis.targetRole,
      orderingSource: 'AI Pedagogical Sequencing & Prerequisite Dependency Graph',
      path,
      totalSteps: path.length,
      estimatedCompletionWeeks: path.length * 3
    };
  }
}

module.exports = new LearningPathService();
