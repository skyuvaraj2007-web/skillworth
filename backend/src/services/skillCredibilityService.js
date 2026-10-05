/**
 * Skill Credibility Engine — Phase 2
 * 
 * Computes evidence-backed credibility scores (0–100) per skill.
 * Proficiency answers: "How strong is the demonstrated skill?"
 * Credibility answers: "How strong is the evidence supporting this skill?"
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillnexus'
});
pool.on('error', (err) => {
  console.warn('[skillCredibility pool idle client]:', err.message);
});

class SkillCredibilityService {
  /**
   * Calculate credibility for a single skill of a student
   */
  async calculateSkillCredibility(studentId, skillId, client = null) {
    const pg = client || pool;

    // 1. Fetch skill and student skill record
    const ssRes = await pg.query(
      `SELECT ss.*, s.name as skill_name, cat.name as skill_category
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       LEFT JOIN skill_categories cat ON cat.id = s.category_id
       WHERE ss.student_id = $1 AND ss.skill_id = $2`,
      [studentId, skillId]
    );

    let studentSkill = ssRes.rows[0] || null;
    if (!studentSkill) {
      const skRes = await pg.query(
        `SELECT s.*, s.name as skill_name, cat.name as skill_category
         FROM skills s
         LEFT JOIN skill_categories cat ON cat.id = s.category_id
         WHERE s.id = $1`,
        [skillId]
      );
      if (skRes.rows.length === 0) return null;
      const sk = skRes.rows[0];
      studentSkill = {
        student_id: studentId,
        skill_id: skillId,
        skill_name: sk.skill_name || sk.name,
        skill_category: sk.skill_category,
        proficiency_score: 0,
        proficiency_level: 'Beginner',
        assessment_score: 0,
        project_evidence: [],
        certification_evidence: [],
        last_verified_at: null
      };
    }

    // 2. Fetch all linked evidence records
    const evRes = await pg.query(
      `SELECT * FROM skill_evidence
       WHERE student_id = $1 AND skill_id = $2
       ORDER BY created_at DESC`,
      [studentId, skillId]
    );

    const evidenceList = evRes.rows;

    const hasAssessment = Number(studentSkill.assessment_score || 0) > 0;
    const hasProject = Array.isArray(studentSkill.project_evidence)
      ? studentSkill.project_evidence.length > 0
      : (studentSkill.project_evidence && typeof studentSkill.project_evidence === 'object' && Object.keys(studentSkill.project_evidence).length > 0 && studentSkill.project_evidence !== '[]');
    const hasCert = Array.isArray(studentSkill.certification_evidence)
      ? studentSkill.certification_evidence.length > 0
      : (studentSkill.certification_evidence && typeof studentSkill.certification_evidence === 'object' && Object.keys(studentSkill.certification_evidence).length > 0 && studentSkill.certification_evidence !== '[]');

    // 3. ZERO-STATE CHECK (No evidence and no claimed proficiency)
    if (evidenceList.length === 0 && !hasAssessment && !hasProject && !hasCert && (!studentSkill.proficiency_score || studentSkill.proficiency_score === 0)) {
      return this._buildZeroCredibility(studentSkill);
    }

    // 4. MULTI-SOURCE MULTIPLICITY (Max 40 points)
    const distinctTypes = new Set();
    const scores = [];
    let latestDate = studentSkill.last_verified_at ? new Date(studentSkill.last_verified_at) : null;

    evidenceList.forEach(e => {
      if (e.evidence_type) {
        const rawType = String(e.evidence_type).toUpperCase();
        const normType = rawType === 'CERTIFICATE' ? 'CERTIFICATION' : rawType;
        distinctTypes.add(normType);
      }
      if (e.score != null && Number(e.score) > 0) scores.push(Number(e.score));
      if (e.created_at) {
        const d = new Date(e.created_at);
        if (!latestDate || d > latestDate) latestDate = d;
      }
    });

    if (hasAssessment) {
      distinctTypes.add('ASSESSMENT');
      scores.push(Number(studentSkill.assessment_score));
    }
    if (hasProject) distinctTypes.add('PROJECT');
    if (hasCert) distinctTypes.add('CERTIFICATION');

    let sourceCount = distinctTypes.size;
    let isSelfClaim = false;

    // Single unverified self-declaration
    if (sourceCount === 0 && studentSkill.proficiency_score > 0) {
      sourceCount = 1;
      isSelfClaim = true;
      distinctTypes.add('CLAIM');
    }

    let multiplicityScore = 0;
    if (isSelfClaim) multiplicityScore = 10;
    else if (sourceCount === 1) multiplicityScore = 15;
    else if (sourceCount === 2) multiplicityScore = 25;
    else if (sourceCount === 3) multiplicityScore = 35;
    else if (sourceCount >= 4) multiplicityScore = 40;

    // 5. VERIFICATION STRENGTH (Max 30 points)
    let verificationScore = 0;
    const verifiedCount = evidenceList.filter(e => {
      const st = String(e.verification_status || '').toUpperCase();
      return st === 'VERIFIED' || st === 'VALIDATED';
    }).length;

    if (hasAssessment && studentSkill.assessment_score >= 80) {
      verificationScore += 15;
    } else if (hasAssessment && studentSkill.assessment_score >= 60) {
      verificationScore += 10;
    }

    if (hasProject) {
      verificationScore += 8;
    }

    if (hasCert) {
      // Certification contributes supporting weight, but does NOT produce high credibility alone
      verificationScore += 7;
    }

    if (verifiedCount > 0) {
      verificationScore += Math.min(10, verifiedCount * 5);
    }

    verificationScore = Math.min(30, verificationScore);

    // 6. RECENCY FACTOR (Max 15 points)
    let recencyScore = 70; // default moderate
    let recencyRating = 'Moderate';
    if (latestDate) {
      const diffMs = Date.now() - latestDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 60) {
        recencyScore = 100;
        recencyRating = 'High';
      } else if (diffDays <= 180) {
        recencyScore = 85;
        recencyRating = 'Good';
      } else if (diffDays <= 365) {
        recencyScore = 65;
        recencyRating = 'Moderate';
      } else {
        recencyScore = 40;
        recencyRating = 'Needs Refresh';
      }
    }
    const recencyContribution = Math.round((recencyScore / 100) * 15);

    // 7. CONSISTENCY FACTOR (Max 15 points)
    let consistencyScore = 100;
    let consistencyNote = 'Performance signals are consistent across evidence sources.';

    if (scores.length >= 2) {
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const gap = maxScore - minScore;

      if (gap > 35) {
        consistencyScore = 45;
        consistencyNote = 'Evidence shows inconsistent performance across evaluations. Additional validation recommended.';
      } else if (gap > 20) {
        consistencyScore = 75;
        consistencyNote = 'Minor variance detected across assessment and project performance.';
      }
    }
    const consistencyContribution = Math.round((consistencyScore / 100) * 15);

    // 8. FINAL CREDIBILITY CALCULATION
    let totalCredibility = multiplicityScore + verificationScore + recencyContribution + consistencyContribution;

    // STRICT NON-INFLATION:
    if (isSelfClaim) {
      totalCredibility = Math.min(30, totalCredibility);
    } else if (sourceCount <= 1) {
      totalCredibility = Math.min(48, totalCredibility);
    }
    // If only certification exists without project/assessment, cannot exceed 50
    if (sourceCount === 1 && distinctTypes.has('CERTIFICATION')) {
      totalCredibility = Math.min(42, totalCredibility);
    }

    totalCredibility = Math.max(0, Math.min(100, Math.round(totalCredibility)));

    // Qualitative strength category
    let verificationStrength = 'Low';
    if (isSelfClaim) verificationStrength = 'Self-Declared';
    else if (totalCredibility >= 65) verificationStrength = 'Strong';
    else if (totalCredibility >= 45) verificationStrength = 'Moderate';
    else if (sourceCount <= 1) verificationStrength = 'Self-Declared';
    else verificationStrength = 'Low';

    // Summary of evidence
    const evidenceSummary = evidenceList.map(e => ({
      id: e.id,
      type: e.evidence_type,
      title: e.title,
      score: e.score,
      status: e.verification_status,
      confidence: e.confidence,
      date: e.created_at
    }));

    const result = {
      studentId,
      skillId,
      skillName: studentSkill.skill_name,
      credibilityScore: totalCredibility,
      proficiencyScore: studentSkill.proficiency_score || 0,
      evidenceSourceCount: sourceCount,
      verificationStrength,
      recencyScore,
      recencyRating,
      consistencyScore,
      consistencyNote,
      multiplicityScore,
      verificationScore,
      evidenceSummary,
      calculationVersion: '2.0.0',
      calculatedAt: new Date().toISOString()
    };

    // Upsert into skill_credibility_scores
    await pg.query(
      `INSERT INTO skill_credibility_scores (
        student_id, skill_id, credibility_score, evidence_source_count,
        verification_strength, recency_score, consistency_score, consistency_note,
        evidence_summary, calculation_version, calculated_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '2.0.0', NOW(), NOW())
      ON CONFLICT (student_id, skill_id) DO UPDATE SET
        credibility_score = EXCLUDED.credibility_score,
        evidence_source_count = EXCLUDED.evidence_source_count,
        verification_strength = EXCLUDED.verification_strength,
        recency_score = EXCLUDED.recency_score,
        consistency_score = EXCLUDED.consistency_score,
        consistency_note = EXCLUDED.consistency_note,
        evidence_summary = EXCLUDED.evidence_summary,
        calculated_at = NOW(),
        updated_at = NOW()`,
      [
        studentId,
        skillId,
        totalCredibility,
        sourceCount,
        verificationStrength,
        recencyScore,
        consistencyScore,
        consistencyNote,
        JSON.stringify(evidenceSummary)
      ]
    );

    // Also update student_skills.credibility_score
    await pg.query(
      `UPDATE student_skills
       SET credibility_score = $1, last_updated = NOW()
       WHERE student_id = $2 AND skill_id = $3`,
      [totalCredibility, studentId, skillId]
    );

    return result;
  }

  /**
   * Batch calculate credibility for all skills of a student
   */
  async calculateAllSkillCredibility(studentId, client = null) {
    const pg = client || pool;

    const skillsRes = await pg.query(
      `SELECT skill_id FROM student_skills WHERE student_id = $1`,
      [studentId]
    );

    const results = [];
    for (const row of skillsRes.rows) {
      const cred = await this.calculateSkillCredibility(studentId, row.skill_id, pg);
      if (cred) results.push(cred);
    }

    return results;
  }

  /**
   * Get all stored credibility scores for a student
   */
  async getStudentCredibilityScores(studentId) {
    const res = await pool.query(
      `SELECT sc.*, s.name as skill_name, cat.name as skill_category, ss.proficiency_score, ss.proficiency_level
       FROM skill_credibility_scores sc
       JOIN skills s ON s.id = sc.skill_id
       LEFT JOIN skill_categories cat ON cat.id = s.category_id
       LEFT JOIN student_skills ss ON ss.student_id = sc.student_id AND ss.skill_id = sc.skill_id
       WHERE sc.student_id = $1
       ORDER BY sc.credibility_score DESC`,
      [studentId]
    );

    return res.rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      skillId: r.skill_id,
      skillName: r.skill_name,
      category: r.skill_category,
      proficiencyScore: r.proficiency_score || 0,
      proficiencyLevel: r.proficiency_level || 'Beginner',
      credibilityScore: r.credibility_score,
      evidenceSourceCount: r.evidence_source_count,
      verificationStrength: r.verification_strength,
      recencyScore: r.recency_score,
      consistencyScore: r.consistency_score,
      consistencyNote: r.consistency_note,
      evidenceSummary: Array.isArray(r.evidence_summary) ? r.evidence_summary : [],
      calculatedAt: r.calculated_at
    }));
  }

  /**
   * Explain credibility calculation for a single skill
   */
  async explainSkillCredibility(studentId, skillId) {
    let scoreObj = await this.calculateSkillCredibility(studentId, skillId);
    if (!scoreObj) return null;

    return {
      skillId: scoreObj.skillId,
      skillName: scoreObj.skillName,
      credibilityScore: scoreObj.credibilityScore,
      proficiencyScore: scoreObj.proficiencyScore,
      verificationStrength: scoreObj.verificationStrength,
      recencyScore: scoreObj.recencyScore,
      recencyRating: scoreObj.recencyRating,
      consistencyScore: scoreObj.consistencyScore,
      consistencyNote: scoreObj.consistencyNote,
      explanation: scoreObj.consistencyNote || 'Performance signals evaluated.',
      evidenceSourceCount: scoreObj.evidenceSourceCount,
      multiplicityScore: scoreObj.multiplicityScore,
      verificationScore: scoreObj.verificationScore,
      factors: [
        {
          name: 'Multi-Source Evidence',
          score: scoreObj.multiplicityScore,
          max: 40,
          description: `${scoreObj.evidenceSourceCount} independent evidence type(s) verified.`
        },
        {
          name: 'Verification Rigor',
          score: scoreObj.verificationScore,
          max: 30,
          description: 'Evaluated from sandbox tests, assessments, and validated project proofs.'
        },
        {
          name: 'Recency Factor',
          score: Math.round((scoreObj.recencyScore / 100) * 15),
          max: 15,
          description: `Evidence demonstrated recently (${scoreObj.recencyRating}).`
        },
        {
          name: 'Consistency Rating',
          score: Math.round((scoreObj.consistencyScore / 100) * 15),
          max: 15,
          description: scoreObj.consistencyNote
        }
      ],
      evidenceItems: scoreObj.evidenceSummary,
      calculatedAt: scoreObj.calculatedAt
    };
  }

  _buildZeroCredibility(skill) {
    return {
      studentId: null,
      skillId: skill.id || skill.skill_id,
      skillName: skill.name || skill.skill_name || 'Skill',
      credibilityScore: 0,
      proficiencyScore: skill.proficiency_score || 0,
      evidenceSourceCount: 0,
      verificationStrength: 'Self-Declared',
      recencyScore: 0,
      recencyRating: 'No Evidence',
      consistencyScore: 100,
      consistencyNote: 'No verified evidence has been recorded for this skill yet.',
      explanation: 'No verified evidence has been recorded for this skill yet.',
      multiplicityScore: 0,
      verificationScore: 0,
      evidenceSummary: [],
      calculationVersion: '2.0.0',
      calculatedAt: new Date().toISOString()
    };
  }
}

module.exports = new SkillCredibilityService();
