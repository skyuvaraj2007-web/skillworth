/**
 * Career Readiness Engine — Phase 2
 * 
 * Computes deterministic, evidence-grounded Career Readiness scores (0–100).
 * Overall Score = Weighted sum of 7 verifiable components:
 * 1. Technical Skills (25%)
 * 2. Soft Skills (10%)
 * 3. Projects (15%)
 * 4. Certifications (10%)
 * 5. Assessments (15%)
 * 6. Industry Exposure (15%)
 * 7. Interview Readiness (10%)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const skillCredibilityService = require('./skillCredibilityService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillnexus'
});
pool.on('error', (err) => {
  console.warn('[careerReadiness pool idle client]:', err.message);
});

// Configurable weight model
const DEFAULT_WEIGHTS = {
  technical: 0.25,
  softSkills: 0.10,
  projects: 0.15,
  certifications: 0.10,
  assessments: 0.15,
  industryExposure: 0.15,
  interviewReadiness: 0.10
};

class CareerReadinessService {
  constructor() {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.version = '2.0.0';
  }

  /**
   * Calculate and persist Career Readiness for a student
   */
  async calculateCareerReadiness(studentId, client = null) {
    const pg = client || pool;

    // 1. Verify student exists
    const sRes = await pg.query('SELECT id, user_id, full_name, institution_id, department_id, readiness_score FROM students WHERE id = $1', [studentId]);
    if (sRes.rows.length === 0) return null;
    const student = sRes.rows[0];

    // 2. Component 1: Technical Skills (Weight 25%)
    // Derived from Skill Graph skills, proficiency, and credibility
    const skillsRes = await pg.query(
      `SELECT ss.*, sc.credibility_score, s.name as skill_name, cat.name as category
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       LEFT JOIN skill_categories cat ON cat.id = s.category_id
       LEFT JOIN skill_credibility_scores sc ON sc.student_id = ss.student_id AND sc.skill_id = ss.skill_id
       WHERE ss.student_id = $1`,
      [studentId]
    );

    let technicalScore = 0;
    let technicalEvidenceCount = 0;
    let technicalExplanation = 'No technical skills have been verified in your Skill Graph yet.';

    if (skillsRes.rows.length > 0) {
      technicalEvidenceCount = skillsRes.rows.reduce((sum, r) => sum + Number(r.evidence_count || 1), 0);
      
      // Calculate weighted technical capability taking credibility into account
      const skillContributions = skillsRes.rows.map(r => {
        const prof = Number(r.proficiency_score || 0);
        const cred = Number(r.credibility_score || 50) / 100;
        // Credibility weights the proficiency
        return prof * (0.5 + 0.5 * cred);
      });

      const avgCapability = skillContributions.reduce((a, b) => a + b, 0) / skillsRes.rows.length;
      // Multiplier based on breadth of verified skills (e.g. 1 skill = 70% scale, 3+ skills = full scale)
      const breadthFactor = Math.min(1.0, 0.6 + (skillsRes.rows.length * 0.15));
      technicalScore = Math.min(100, Math.round(avgCapability * breadthFactor));
      technicalExplanation = `Calculated from ${skillsRes.rows.length} verified Skill Graph skills with average proficiency of ${Math.round(avgCapability)}%.`;
    }

    // 3. Component 2: Soft Skills (Weight 10%)
    // Check for soft-skill assessments, communication tests, teamwork evaluations
    const softRes = await pg.query(
      `SELECT aa.score, aa.status, a.title, a.domain
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       WHERE aa.student_id = $1 AND (a.domain ILIKE '%soft%' OR a.domain ILIKE '%communication%' OR a.title ILIKE '%communication%' OR a.title ILIKE '%professional%')`,
      [studentId]
    );

    let softScore = 0;
    let softEvidenceCount = softRes.rows.length;
    let softExplanation = 'Limited verified evidence available. Complete communication or professional skills assessments.';

    if (softRes.rows.length > 0) {
      const avg = softRes.rows.reduce((sum, r) => sum + Number(r.score || 0), 0) / softRes.rows.length;
      softScore = Math.round(avg);
      softExplanation = `Verified from ${softRes.rows.length} professional & communication skill assessment(s).`;
    }

    // 4. Component 3: Projects (Weight 15%)
    // Evaluates actual student projects in PostgreSQL
    const projRes = await pg.query(
      `SELECT id, title, status, validated_at, tech_stack, github_url
       FROM projects
       WHERE student_id = $1`,
      [studentId]
    );

    let projectsScore = 0;
    let projectsEvidenceCount = projRes.rows.length;
    let projectsExplanation = 'No engineering projects submitted yet.';

    if (projRes.rows.length > 0) {
      let validCount = 0;
      let scoreAcc = 0;

      projRes.rows.forEach(p => {
        const isValid = p.status === 'Validated' || p.status === 'APPROVED' || p.validated_at !== null;
        if (isValid) {
          validCount++;
          let pVal = 70; // baseline validated
          if (p.github_url) pVal += 15;
          if (p.tech_stack && (Array.isArray(p.tech_stack) ? p.tech_stack.length : Object.keys(p.tech_stack).length) >= 3) {
            pVal += 15;
          }
          scoreAcc += Math.min(100, pVal);
        } else {
          scoreAcc += 35; // pending review project
        }
      });

      projectsScore = Math.min(100, Math.round(scoreAcc / Math.max(1, projRes.rows.length)));
      projectsExplanation = `Derived from ${projRes.rows.length} project(s) (${validCount} verified with code artifacts).`;
    }

    // 5. Component 4: Certifications (Weight 10%)
    // Real certificates from certificates table. Rule: Certificate alone != absolute proof.
    const certRes = await pg.query(
      `SELECT id, title, certificate_number, verification_hash, issued_at
       FROM certificates
       WHERE student_id = $1`,
      [studentId]
    );

    let certScore = 0;
    let certEvidenceCount = certRes.rows.length;
    let certExplanation = 'No verified certifications recorded in ledger.';

    if (certRes.rows.length > 0) {
      let verifiedCertCount = 0;
      certRes.rows.forEach(c => {
        if (c.verification_hash || c.certificate_number) verifiedCertCount++;
      });
      // 1 cert = 70%, 2 certs = 85%, 3+ certs = 95%
      certScore = Math.min(100, 50 + (verifiedCertCount * 20));
      certExplanation = `Backed by ${certRes.rows.length} verified credential(s) in ledger. Verified certificate evidence contributes to readiness alongside practical demonstrations.`;
    }

    // 6. Component 5: Assessments (Weight 15%)
    // Real assessment attempts
    const asmtRes = await pg.query(
      `SELECT aa.score, aa.status, a.title, a.passing_score
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       WHERE aa.student_id = $1 AND (aa.status = 'Completed' OR aa.status = 'PASSED' OR aa.score >= 50)`,
      [studentId]
    );

    let assessmentsScore = 0;
    let assessmentsEvidenceCount = asmtRes.rows.length;
    let assessmentsExplanation = 'No standardized assessments completed yet.';

    if (asmtRes.rows.length > 0) {
      const avg = asmtRes.rows.reduce((sum, r) => sum + Number(r.score || 0), 0) / asmtRes.rows.length;
      assessmentsScore = Math.round(avg);
      assessmentsExplanation = `Evaluated across ${asmtRes.rows.length} diagnostic and programming assessment(s) with ${assessmentsScore}% average score.`;
    }

    // 7. Component 6: Industry Exposure (Weight 15%)
    // Industry challenges, industry assessments, mentorships, internships
    const indRes = await pg.query(
      `SELECT a.id, a.title, c.company_name
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN companies c ON c.id = a.company_id
       WHERE aa.student_id = $1`,
      [studentId]
    );

    let indScore = 0;
    let indEvidenceCount = indRes.rows.length;
    let indExplanation = 'Industry exposure evidence not yet available.';

    if (indRes.rows.length > 0) {
      indScore = Math.min(100, 60 + (indRes.rows.length * 20));
      indExplanation = `Demonstrated industry alignment via ${indRes.rows.length} corporate partner challenge(s) / assessment(s).`;
    }

    // 8. Component 7: Interview Readiness (Weight 10%)
    // Check for diagnostic mock tests / interview practice sessions
    const intvRes = await pg.query(
      `SELECT aa.score, aa.status, a.title
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       WHERE aa.student_id = $1 AND (a.title ILIKE '%interview%' OR a.domain ILIKE '%interview%')`,
      [studentId]
    );

    let intvScore = 0;
    let intvEvidenceCount = intvRes.rows.length;
    let intvExplanation = 'Interview simulation practice not yet completed.';

    if (intvRes.rows.length > 0) {
      const avg = intvRes.rows.reduce((sum, r) => sum + Number(r.score || 0), 0) / intvRes.rows.length;
      intvScore = Math.round(avg);
      intvExplanation = `Calibrated from ${intvRes.rows.length} technical interview simulation session(s).`;
    } else if (technicalScore >= 70 && projectsScore >= 70) {
      // Baseline technical readiness provides foundational interview readiness
      intvScore = Math.round((technicalScore * 0.4) + (projectsScore * 0.4));
      intvExplanation = `Foundational interview readiness estimated from strong technical and project fundamentals (${intvScore}%). Practice session recommended.`;
    }

    // 9. OVERALL WEIGHTED CALCULATION
    const weightedTechnical = technicalScore * this.weights.technical;
    const weightedSoft = softScore * this.weights.softSkills;
    const weightedProjects = projectsScore * this.weights.projects;
    const weightedCert = certScore * this.weights.certifications;
    const weightedAsmt = assessmentsScore * this.weights.assessments;
    const weightedInd = indScore * this.weights.industryExposure;
    const weightedIntv = intvScore * this.weights.interviewReadiness;

    const overallScore = Math.max(0, Math.min(100, Math.round(
      weightedTechnical +
      weightedSoft +
      weightedProjects +
      weightedCert +
      weightedAsmt +
      weightedInd +
      weightedIntv
    )));

    // 10. COMPONENT BREAKDOWN OBJECT
    const techObj = {
      score: technicalScore,
      weight: this.weights.technical,
      weightedScore: Math.round(weightedTechnical * 10) / 10,
      evidenceCount: technicalEvidenceCount,
      explanation: technicalExplanation,
      label: 'Technical Skills'
    };

    const softObj = {
      score: softScore,
      weight: this.weights.softSkills,
      weightedScore: Math.round(weightedSoft * 10) / 10,
      evidenceCount: softEvidenceCount,
      explanation: softExplanation,
      label: 'Soft Skills'
    };

    const componentBreakdown = {
      technical: techObj,
      technicalSkills: techObj,
      softSkills: softObj,
      soft: softObj,
      projects: {
        score: projectsScore,
        weight: this.weights.projects,
        weightedScore: Math.round(weightedProjects * 10) / 10,
        evidenceCount: projectsEvidenceCount,
        explanation: projectsExplanation
      },
      certifications: {
        score: certScore,
        weight: this.weights.certifications,
        weightedScore: Math.round(weightedCert * 10) / 10,
        evidenceCount: certEvidenceCount,
        explanation: certExplanation
      },
      assessments: {
        score: assessmentsScore,
        weight: this.weights.assessments,
        weightedScore: Math.round(weightedAsmt * 10) / 10,
        evidenceCount: assessmentsEvidenceCount,
        explanation: assessmentsExplanation
      },
      industryExposure: {
        score: indScore,
        weight: this.weights.industryExposure,
        weightedScore: Math.round(weightedInd * 10) / 10,
        evidenceCount: indEvidenceCount,
        explanation: indExplanation
      },
      interviewReadiness: {
        score: intvScore,
        weight: this.weights.interviewReadiness,
        weightedScore: Math.round(weightedIntv * 10) / 10,
        evidenceCount: intvEvidenceCount,
        explanation: intvExplanation
      }
    };

    // 11. TOP IMPROVEMENT AREAS & GROUNDED ACTIONS
    const componentsArray = [
      { name: 'Technical Skills', key: 'technicalSkills', score: technicalScore, action: 'Complete an accredited learning module in your Skill Graph.' },
      { name: 'Soft Skills', key: 'softSkills', score: softScore, action: 'Take a verified communication or professional skills assessment.' },
      { name: 'Projects', key: 'projects', score: projectsScore, action: 'Submit a full-stack or systems engineering project with code repository proof.' },
      { name: 'Certifications', key: 'certifications', score: certScore, action: 'Earn and link a verified certificate in cloud, data, or web technologies.' },
      { name: 'Assessments', key: 'assessments', score: assessmentsScore, action: 'Take a diagnostic programming assessment to calibrate your code quality.' },
      { name: 'Industry Exposure', key: 'industryExposure', score: indScore, action: 'Participate in an industry challenge or apply to corporate partner opportunities.' },
      { name: 'Interview Readiness', key: 'interviewReadiness', score: intvScore, action: 'Engage with AI Career Copilot for technical interview preparation.' }
    ];

    componentsArray.sort((a, b) => a.score - b.score);
    const topImprovementAreas = componentsArray.slice(0, 3).map(c => ({
      area: c.name,
      currentScore: c.score,
      recommendedAction: c.action
    }));

    const recommendedActions = topImprovementAreas.map(t => t.recommendedAction);

    // Readiness status label
    let readinessStatus = 'Needs Support';
    if (overallScore === 0) readinessStatus = 'Insufficient Evidence';
    else if (overallScore >= 80) readinessStatus = 'Industry Ready';
    else if (overallScore >= 65) readinessStatus = 'Near Ready';
    else if (overallScore >= 40) readinessStatus = 'Developing';

    const result = {
      studentId,
      overallScore,
      readinessStatus,
      weights: this.weights,
      components: componentBreakdown,
      improvementAreas: topImprovementAreas,
      recommendedActions,
      calculationVersion: this.version,
      calculatedAt: new Date().toISOString()
    };

    // 12. UPSERT into career_readiness_scores
    await pg.query(
      `INSERT INTO career_readiness_scores (
        student_id, overall_score, technical_score, soft_skills_score,
        projects_score, certifications_score, assessments_score,
        industry_exposure_score, interview_readiness_score,
        component_breakdown, improvement_areas, recommended_actions,
        calculation_version, calculated_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      ON CONFLICT (student_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        technical_score = EXCLUDED.technical_score,
        soft_skills_score = EXCLUDED.soft_skills_score,
        projects_score = EXCLUDED.projects_score,
        certifications_score = EXCLUDED.certifications_score,
        assessments_score = EXCLUDED.assessments_score,
        industry_exposure_score = EXCLUDED.industry_exposure_score,
        interview_readiness_score = EXCLUDED.interview_readiness_score,
        component_breakdown = EXCLUDED.component_breakdown,
        improvement_areas = EXCLUDED.improvement_areas,
        recommended_actions = EXCLUDED.recommended_actions,
        calculation_version = EXCLUDED.calculation_version,
        calculated_at = NOW(),
        updated_at = NOW()`,
      [
        studentId,
        overallScore,
        technicalScore,
        softScore,
        projectsScore,
        certScore,
        assessmentsScore,
        indScore,
        intvScore,
        JSON.stringify(componentBreakdown),
        JSON.stringify(topImprovementAreas),
        JSON.stringify(recommendedActions),
        this.version
      ]
    );

    // 13. Append to career_readiness_history
    await pg.query(
      `INSERT INTO career_readiness_history (
        student_id, overall_score, technical_score, soft_skills_score,
        projects_score, certifications_score, assessments_score,
        industry_exposure_score, interview_readiness_score,
        calculation_version, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        studentId,
        overallScore,
        technicalScore,
        softScore,
        projectsScore,
        certScore,
        assessmentsScore,
        indScore,
        intvScore,
        this.version
      ]
    );

    // 14. Synchronize students.readiness_score in PostgreSQL
    await pg.query(
      `UPDATE students
       SET readiness_score = $1, updated_at = NOW()
       WHERE id = $2`,
      [overallScore, studentId]
    );

    return result;
  }

  /**
   * Retrieve current career readiness for student, calculating if not yet cached
   */
  async getCareerReadiness(studentId) {
    const res = await pool.query(
      `SELECT * FROM career_readiness_scores WHERE student_id = $1`,
      [studentId]
    );

    if (res.rows.length === 0) {
      return this.calculateCareerReadiness(studentId);
    }

    const row = res.rows[0];
    let readinessStatus = 'Needs Support';
    if (row.overall_score === 0) readinessStatus = 'Insufficient Evidence';
    else if (row.overall_score >= 80) readinessStatus = 'Industry Ready';
    else if (row.overall_score >= 65) readinessStatus = 'Near Ready';
    else if (row.overall_score >= 40) readinessStatus = 'Developing';

    return {
      studentId: row.student_id,
      overallScore: row.overall_score,
      readinessStatus,
      weights: this.weights,
      components: row.component_breakdown || {},
      improvementAreas: row.improvement_areas || [],
      recommendedActions: row.recommended_actions || [],
      calculationVersion: row.calculation_version,
      calculatedAt: row.calculated_at
    };
  }

  /**
   * Retrieve historical scores for progression tracking
   */
  async getCareerReadinessHistory(studentId) {
    const res = await pool.query(
      `SELECT * FROM career_readiness_history
       WHERE student_id = $1
       ORDER BY calculated_at ASC`,
      [studentId]
    );

    return res.rows.map(r => ({
      id: r.id,
      overallScore: r.overall_score,
      overall_score: r.overall_score,
      technicalScore: r.technical_score,
      technical_score: r.technical_score,
      softSkillsScore: r.soft_skills_score,
      soft_skills_score: r.soft_skills_score,
      projectsScore: r.projects_score,
      projects_score: r.projects_score,
      certificationsScore: r.certifications_score,
      certifications_score: r.certifications_score,
      assessmentsScore: r.assessments_score,
      assessments_score: r.assessments_score,
      industryExposureScore: r.industry_exposure_score,
      industry_exposure_score: r.industry_exposure_score,
      interviewReadinessScore: r.interview_readiness_score,
      interview_readiness_score: r.interview_readiness_score,
      calculatedAt: r.calculated_at,
      calculated_at: r.calculated_at
    }));
  }
}

module.exports = new CareerReadinessService();
