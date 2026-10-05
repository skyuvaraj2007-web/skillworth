/**
 * SKILLNEXUS AI — Course Recommendation Service
 * Recommends active database courses that directly resolve student skill gaps.
 * Excludes completed courses; fully traceable to PostgreSQL database courses.
 */

const relationalManager = require('../../db/relationalManager');
const skillGapService = require('./skillGapService');
const aiContextService = require('./aiContextService');

function normalize(str) {
  return String(str || '').toLowerCase().trim().replace(/[\.\-_]/g, '');
}

class CourseRecommendationService {
  /**
   * Get personalized course recommendations based on student skill gaps.
   */
  async getRecommendations(studentId) {
    const context = await aiContextService.getStudentAIContext(studentId);
    const gapAnalysis = await skillGapService.analyzeSkillGap(studentId);

    // If student has insufficient data
    if (!context.dataQuality.sufficient && context.skills.length === 0) {
      return {
        recommendations: [],
        message: 'Insufficient learning data. Please complete profile skills or baseline assessments to receive personalized course recommendations.',
        dataQuality: context.dataQuality
      };
    }

    // 1. Get all active courses from PostgreSQL
    const allCourses = await relationalManager.getCourses() || [];

    // 2. Identify completed course IDs
    const completedCourseIds = new Set(
      context.courses
        .filter(c => c.status === 'Completed' || c.progress >= 100)
        .map(c => String(c.courseId).toUpperCase())
    );

    // 3. Compile target skills to resolve
    const prioritySkillSet = new Set((gapAnalysis.priorityGaps || []).map(g => normalize(g.name)));
    const missingSkillSet = new Set((gapAnalysis.missingSkills || []).map(g => normalize(g.name)));
    const partialSkillSet = new Set((gapAnalysis.partialSkills || []).map(g => normalize(g.name)));

    const candidateCourses = [];

    allCourses.forEach(course => {
      const cId = String(course.id || course.courseId || course.course_id || '').toUpperCase();
      // Skip completed courses
      if (completedCourseIds.has(cId)) return;

      const title = course.title || course.course_name || course.name || '';
      const desc = course.description || '';
      const category = course.category || '';
      const courseSkills = Array.isArray(course.skills) ? course.skills : (Array.isArray(course.requiredSkills) ? course.requiredSkills : []);

      // Extract skills covered by this course
      const coveredSkills = [
        ...courseSkills.map(s => typeof s === 'string' ? s : (s.name || s.skill)),
        title,
        desc
      ].map(normalize);

      let relevanceScore = 0;
      let matchedGap = null;
      let priority = 'MEDIUM';

      // Check priority gaps
      for (const pSkill of prioritySkillSet) {
        if (coveredSkills.some(cs => cs.includes(pSkill) || pSkill.includes(cs))) {
          relevanceScore += 50;
          matchedGap = pSkill;
          priority = 'CRITICAL';
          break;
        }
      }

      // Check missing skills
      if (!matchedGap) {
        for (const mSkill of missingSkillSet) {
          if (coveredSkills.some(cs => cs.includes(mSkill) || mSkill.includes(cs))) {
            relevanceScore += 35;
            matchedGap = mSkill;
            priority = 'HIGH';
            break;
          }
        }
      }

      // Check partial skills
      if (!matchedGap) {
        for (const pSkill of partialSkillSet) {
          if (coveredSkills.some(cs => cs.includes(pSkill) || pSkill.includes(cs))) {
            relevanceScore += 20;
            matchedGap = pSkill;
            priority = 'MEDIUM';
            break;
          }
        }
      }

      // Boost if category aligns with student target role or department
      const targetRoleNorm = normalize(gapAnalysis.targetRole);
      if (normalize(category).includes(targetRoleNorm) || targetRoleNorm.includes(normalize(category))) {
        relevanceScore += 15;
      }

      if (relevanceScore > 0 && matchedGap) {
        const originalGapName = (
          (gapAnalysis.priorityGaps || []).find(g => normalize(g.name) === matchedGap) ||
          (gapAnalysis.missingSkills || []).find(g => normalize(g.name) === matchedGap) ||
          (gapAnalysis.partialSkills || []).find(g => normalize(g.name) === matchedGap) ||
          { name: matchedGap }
        ).name;

        candidateCourses.push({
          courseId: course.id || course.courseId || course.course_id,
          title,
          targetSkill: originalGapName,
          reason: `Addresses verified ${originalGapName} skill gap for your target role of ${gapAnalysis.targetRole}.`,
          priority,
          relevanceScore: Math.min(99, relevanceScore + 20),
          difficulty: course.difficulty || 'Intermediate',
          category: course.category || 'Engineering',
          instructor: course.instructor || 'Faculty Specialist',
          duration: course.duration || '6 Weeks'
        });
      }
    });

    // Sort by relevance score descending
    candidateCourses.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      targetRole: gapAnalysis.targetRole,
      recommendations: candidateCourses.slice(0, 6),
      totalGapsIdentified: (gapAnalysis.missingSkills || []).length + (gapAnalysis.partialSkills || []).length
    };
  }
}

module.exports = new CourseRecommendationService();
