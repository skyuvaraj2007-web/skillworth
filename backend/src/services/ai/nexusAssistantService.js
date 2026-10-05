/**
 * SKILLNEXUS AI — NEXUS AI Assistant Service
 * Context-aware, role-isolated conversational intelligence assistant.
 * Strict authorization enforced before AI processing; rejects cross-tenant queries.
 */

const aiContextService = require('./aiContextService');
const skillGapService = require('./skillGapService');
const courseRecommendationService = require('./courseRecommendationService');
const careerRecommendationService = require('./careerRecommendationService');
const aiProvider = require('./aiProvider');
const relationalManager = require('../../db/relationalManager');

class NexusAssistantService {
  /**
   * Main conversational interface.
   * Dispatches based on authenticated user's role.
   */
  async chat(user, message) {
    if (!user) {
      throw new Error('Unauthorized: Authentication required to interact with NEXUS AI');
    }

    const role = (user.role || 'student').toLowerCase();
    const query = (message || '').trim();

    if (!query) {
      return {
        reply: 'Hello! How can I assist you with your career readiness, skill intelligence, or opportunities today?',
        suggestions: ['Analyze my skill gaps', 'Recommend courses', 'Review readiness']
      };
    }

    // Security Gate: Check for cross-tenant / unauthorized probe attempts
    const lowerQ = query.toLowerCase();
    if (
      lowerQ.includes('show me other student') ||
      lowerQ.includes('another student') ||
      lowerQ.includes('password') ||
      lowerQ.includes('secret') ||
      lowerQ.includes('admin token') ||
      lowerQ.includes('user table') ||
      lowerQ.includes('database password')
    ) {
      return {
        reply: 'Security Notice: NEXUS AI operates under strict multi-tenant isolation. Access to other user profiles, credentials, or system administration records is strictly restricted.',
        suggestions: ['Review my own skills', 'View my target role alignment']
      };
    }

    if (role === 'student') {
      return await this._handleStudentChat(user, query);
    } else if (role === 'institution') {
      return await this._handleInstitutionChat(user, query);
    } else if (role === 'company' || role === 'industry') {
      return await this._handleCompanyChat(user, query);
    } else {
      return {
        reply: `NEXUS AI is active. Current role: ${role}. How can I assist your workflow?`,
        suggestions: ['System status', 'Telemetry overview']
      };
    }
  }

  // --- 1. STUDENT CONVERSATIONAL INTELLIGENCE ---
  async _handleStudentChat(user, query) {
    const studentId = user.studentId || user.id;
    const context = await aiContextService.getStudentAIContext(studentId);
    const q = query.toLowerCase();

    // Skill gaps & priority queries
    if (q.includes('gap') || q.includes('missing') || q.includes('improve')) {
      const gaps = await skillGapService.analyzeSkillGap(studentId);
      if (gaps.priorityGaps.length > 0) {
        const topGaps = gaps.priorityGaps.map(g => g.name).join(', ');
        return {
          reply: `Based on your target role (**${gaps.targetRole}**), your primary skill gaps are **${topGaps}**. ${gaps.explanation}`,
          suggestions: ['Recommend courses to close gaps', 'Generate my personalized learning path', 'Check career alternatives'],
          telemetry: { gapsFound: gaps.missingSkills.length, readiness: `${context.readinessScore}%` }
        };
      } else {
        return {
          reply: `Great work! Your verified skills currently align well with **${gaps.targetRole}**. You have verified ${gaps.masteredSkills.length} core competencies.`,
          suggestions: ['Explore matching opportunities', 'Take an advanced assessment']
        };
      }
    }

    // Course recommendations queries
    if (q.includes('course') || q.includes('learn') || q.includes('study')) {
      const recs = await courseRecommendationService.getRecommendations(studentId);
      if (recs.recommendations && recs.recommendations.length > 0) {
        const top3 = recs.recommendations.slice(0, 3);
        const list = top3.map(r => `• **${r.title}** (${r.targetSkill}) — *${r.reason}*`).join('\n');
        return {
          reply: `Here are top database courses specifically selected to close your verified skill gaps:\n\n${list}`,
          suggestions: ['Show full learning path', 'Enroll in top recommendation', 'Review my skill gaps']
        };
      } else {
        return {
          reply: `You are currently aligned or enrolled in active courses. Browse the course catalog to explore emerging tech tracks!`,
          suggestions: ['Browse Catalog', 'Explore Advanced Tech']
        };
      }
    }

    // Readiness score queries
    if (q.includes('readiness') || (q.includes('career') && q.includes('score')) || q.includes('weakest')) {
      return {
        reply: `Your current Career Readiness score is **${context.readinessScore}%**. Readiness is computed across verified technical skills, assessments, and project proofs.`,
        suggestions: ['Take diagnostic assessment', 'Submit a project proof', 'View skill gaps']
      };
    }

    // Career role suitability queries
    if (q.includes('career') || q.includes('role') || q.includes('job title') || q.includes('fit')) {
      const careers = await careerRecommendationService.getCareerRecommendations(studentId);
      if (careers.recommendations && careers.recommendations.length > 0) {
        const top2 = careers.recommendations.slice(0, 2);
        const list = top2.map(c => `• **${c.role}** (${c.suitabilityScore}% fit): ${c.explanation}`).join('\n\n');
        return {
          reply: `Based on your verified skills, projects, and academic profile, here are your best-fit career tracks:\n\n${list}`,
          suggestions: ['Change my target role', 'View required skills for top fit', 'Find matching opportunities']
        };
      }
    }

    // Fallback synthesis with AI provider or structured guidance
    if (aiProvider.isAvailable()) {
      const prompt = `Student Profile: ${context.fullName}, Dept: ${context.department}, Target Role: ${context.targetRole}, Readiness: ${context.readinessScore}%, Skills: ${context.skills.map(s => s.name).join(', ') || 'None'}.\n\nUser Question: "${query}"\n\nProvide an encouraging, direct 2-3 sentence career companion response grounded ONLY in this student's profile.`;
      const aiRes = await aiProvider.generateCompletion({ prompt });
      if (aiRes.success && aiRes.text) {
        return {
          reply: aiRes.text,
          suggestions: ['Review my skill gaps', 'Show course recommendations', 'Check career readiness']
        };
      }
    }

    return {
      reply: `Greetings ${context.fullName}! I am your NEXUS AI Companion. You currently have ${context.skills.length} skills recorded, ${context.courses.length} active course enrollments, and an overall readiness of **${context.readinessScore}%**. How can I assist your career progression today?`,
      suggestions: ['What skills am I missing?', 'Recommend courses for my gaps', 'What career roles fit me?', 'Why is my readiness score low?']
    };
  }

  // --- 2. INSTITUTION CONVERSATIONAL INTELLIGENCE ---
  async _handleInstitutionChat(user, query) {
    const instId = user.institutionId || user.collegeId;
    const context = await aiContextService.getInstitutionAIContext(instId);
    const q = query.toLowerCase();

    if (q.includes('weak') || q.includes('gap') || q.includes('skill')) {
      const topSkills = context.topCohortSkills.map(s => `${s.name} (${s.studentCount} students)`).join(', ');
      return {
        reply: `Institutional Skill Analysis for **${context.name}** (${context.studentCount} students, Avg Readiness: ${context.averageReadiness}%):\n\nTop represented competencies: ${topSkills || 'None recorded'}. Recommend introducing curriculum modules in Cloud Architecture and System Design to lift campus-wide placement readiness.`,
        suggestions: ['View skill analytics dashboard', 'Review departmental performance']
      };
    }

    return {
      reply: `NEXUS Academic Intelligence active for **${context.name}**. Tracking ${context.studentCount} students with an average readiness of **${context.averageReadiness}%**. Ask about cohort skill gaps, department trends, or curriculum suggestions!`,
      suggestions: ['Which skills are weak across students?', 'What is our student readiness trend?', 'How to improve placement readiness?']
    };
  }

  // --- 3. COMPANY CONVERSATIONAL INTELLIGENCE ---
  async _handleCompanyChat(user, query) {
    const compId = user.companyId || user.id;
    const opps = await relationalManager.getOpportunitiesByCompany(compId) || [];

    return {
      reply: `NEXUS Recruiter Intelligence active for **${user.name || 'Company Partner'}**. You currently have **${opps.length} active opportunity listings**. I can help you analyze applicant distributions, evaluate candidate skill matches, and identify pipeline talent!`,
      suggestions: ['Show candidate match distribution', 'Review talent pool readiness', 'Analyze skills in applicant pool']
    };
  }
}

module.exports = new NexusAssistantService();
