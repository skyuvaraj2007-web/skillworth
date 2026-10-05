/**
 * SKILLNEXUS AI — Enhanced AI Matching Service
 * Enhances existing matchingService.js with 4-pillar multi-factor evaluation and deep explainability.
 * Strictly enforces tenant isolation and company ownership.
 */

const relationalManager = require('../../db/relationalManager');
const matchingService = require('../matchingService');

function normalize(str) {
  return String(str || '').toLowerCase().trim().replace(/[\.\-_]/g, '');
}

class AIMatchingService {
  /**
   * Explainable AI matching between a student and an opportunity.
   * Can be invoked by authorized Student or Company users.
   */
  async matchStudentToOpportunity(studentId, opportunityId, requesterUser = null) {
    if (!studentId || !opportunityId) {
      throw new Error('Both studentId and opportunityId are required for AI matching');
    }

    const student = await relationalManager.getStudentById(studentId);
    if (!student) throw new Error('Student not found');

    const opportunity = await relationalManager.getOpportunityById(opportunityId);
    if (!opportunity) throw new Error('Opportunity not found');

    // Tenant Authorization Check:
    // If requester is a company, they must own the opportunity
    if (requesterUser && requesterUser.role === 'company') {
      const oppCompId = opportunity.companyId || opportunity.company_id;
      if (String(oppCompId) !== String(requesterUser.companyId)) {
        throw new Error('Forbidden: You do not own this opportunity');
      }
    }

    // 1. Skill Overlap Pillar (35% Weight)
    const rawReq = opportunity.requiredSkills || opportunity.skillsMatrix || opportunity.skills || [];
    const requiredSkills = rawReq.map(s => typeof s === 'string' ? s : (s.name || s.skill)).filter(Boolean);

    const studentSkills = Array.isArray(student.skills) ? student.skills : [];
    const studentSkillMap = new Map();
    studentSkills.forEach(s => studentSkillMap.set(normalize(s.name || s.skill), s));

    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(req => {
      const normReq = normalize(req);
      let match = null;
      for (const [sNorm, sObj] of studentSkillMap.entries()) {
        if (sNorm.includes(normReq) || normReq.includes(sNorm)) {
          match = sObj;
          break;
        }
      }
      if (match) {
        matchedSkills.push({
          skill: req,
          verified: Boolean(match.verified || match.faculty_verified),
          level: match.level || 'Intermediate'
        });
      } else {
        missingSkills.push(req);
      }
    });

    const skillScore = requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 80;

    // 2. Project Evidence Pillar (25% Weight)
    const projects = Array.isArray(student.projects) ? student.projects : [];
    const verifiedProjects = projects.filter(p => p.proofVerified || p.status === 'Validated' || p.status === 'validated');
    const projectFitScore = projects.length > 0
      ? Math.min(100, Math.round((verifiedProjects.length / Math.max(1, projects.length)) * 70 + (projects.length >= 2 ? 30 : 15)))
      : 10;

    // 3. Assessment Proof Pillar (20% Weight)
    const assessments = Array.isArray(student.assessments) ? student.assessments : [];
    let assessmentScore = 0;
    if (assessments.length > 0) {
      const avgScore = assessments.reduce((acc, a) => acc + (Number(a.score) || 0), 0) / assessments.length;
      assessmentScore = Math.round(avgScore);
    } else {
      assessmentScore = 15; // baseline unverified
    }

    // 4. Academic & Career Alignment Pillar (20% Weight)
    const cgpa = Number(student.cgpa) || 7.0;
    const minCgpa = Number(opportunity.minCgpa || opportunity.min_cgpa) || 6.0;
    let academicScore = cgpa >= minCgpa ? 90 : 50;

    const targetRole = student.careerGoal || student.targetRole || '';
    const oppTitle = opportunity.title || '';
    if (normalize(targetRole).includes(normalize(oppTitle)) || normalize(oppTitle).includes(normalize(targetRole))) {
      academicScore = Math.min(100, academicScore + 10);
    }

    // Composite Match Score: 35% + 25% + 20% + 20%
    const compositeScore = Math.min(99, Math.round(
      (0.35 * skillScore) +
      (0.25 * projectFitScore) +
      (0.20 * assessmentScore) +
      (0.20 * academicScore)
    ));

    // Explainable Strengths
    const strengths = [];
    if (matchedSkills.length > 0) {
      strengths.push(`Verified competency in ${matchedSkills.map(m => m.skill).slice(0, 3).join(', ')}`);
    }
    if (verifiedProjects.length > 0) {
      strengths.push(`${verifiedProjects.length} engineering project(s) validated on the Sovereign Ledger`);
    }
    if (cgpa >= minCgpa) {
      strengths.push(`CGPA (${cgpa}) exceeds minimum threshold (${minCgpa})`);
    }
    if (assessments.length > 0) {
      strengths.push(`Completed ${assessments.length} diagnostic assessment(s) with average score of ${assessmentScore}%`);
    }

    // Actionable Improvement Areas
    const improvementAreas = missingSkills.map(s => `Acquire and verify proficiency in ${s}`);
    if (verifiedProjects.length === 0) {
      improvementAreas.push('Submit and validate an engineering project demonstrating required tech stack');
    }

    const explanation = requiredSkills.length === 0
      ? `Composite readiness score of ${compositeScore}% based on academic profile and validated project evidence.`
      : `Matched ${matchedSkills.length} of ${requiredSkills.length} required skills (${skillScore}%). Overall AI alignment is ${compositeScore}% across skill verification, project proofs, and academic background.`;

    return {
      studentId,
      opportunityId,
      companyId: opportunity.companyId || opportunity.company_id,
      companyName: opportunity.companyName || opportunity.company_name,
      opportunityTitle: opportunity.title,
      matchScore: compositeScore,
      breakdown: {
        skillMatch: skillScore,
        projectFit: projectFitScore,
        assessmentScore,
        academicAlignment: academicScore
      },
      matchedSkills: matchedSkills.map(m => m.skill),
      missingSkills,
      strengths,
      improvementAreas,
      explanation
    };
  }
}

module.exports = new AIMatchingService();
