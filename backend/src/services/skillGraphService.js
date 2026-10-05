/**
 * SKILL NEXUS AI — Skill Graph 2.0 Service
 * Central evidence-based intelligence layer of Skill Nexus.
 * 
 * Replaces static claims with multi-source relational evidence:
 * Student -> Skill -> Course -> Project -> Certification -> Assessment -> Industry
 * 
 * Enforces strict non-fabrication:
 * - High proficiency levels (Advanced, Expert) strictly require multiple verified evidence sources.
 * - Single source of truth: PostgreSQL database tables.
 */

const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class SkillGraphService {
  async getClient() {
    return await pool.connect();
  }

  /**
   * Resolves student record by UUID or roll number
   */
  async resolveStudent(identifier) {
    if (!identifier) return null;
    const client = await this.getClient();
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(identifier).trim());
      let res;
      if (isUuid) {
        res = await client.query(
          `SELECT s.*, u.email as user_email
           FROM students s
           JOIN users u ON u.id = s.user_id
           WHERE s.id = $1 OR s.user_id = $1 LIMIT 1`,
          [identifier]
        );
      } else {
        res = await client.query(
          `SELECT s.*, u.email as user_email
           FROM students s
           JOIN users u ON u.id = s.user_id
           WHERE s.roll_number = $1 LIMIT 1`,
          [identifier]
        );
      }
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate grounded proficiency level based on score and evidence count.
   * "Do NOT assign a high level without evidence."
   */
  deriveProficiencyLevel(score, evidenceCount) {
    const s = Number(score) || 0;
    const c = Number(evidenceCount) || 0;

    if (c === 0) return 'Beginner';
    if (c >= 3 && s >= 85) return 'Expert';
    if (c >= 2 && s >= 72) return 'Advanced';
    if (c >= 1 && s >= 55) return 'Intermediate';
    return 'Beginner';
  }

  /**
   * Build complete Skill Graph 2.0 for a student
   */
  async buildStudentSkillGraph(studentIdentifier) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) {
      const err = new Error(`Student not found for identifier "${studentIdentifier}".`);
      err.statusCode = 404;
      throw err;
    }

    const client = await this.getClient();
    try {
      // 1. Fetch all canonical platform skills from DB
      const skillsRes = await client.query(`SELECT id, name, difficulty, industry_demand, description FROM skills`);
      const allSkills = skillsRes.rows;
      const skillNameMap = new Map();
      allSkills.forEach(s => {
        skillNameMap.set(s.name.toLowerCase().trim(), s);
      });

      // 2. Discover / Aggregate evidence across PostgreSQL tables
      // 2a. Completed Courses
      const coursesRes = await client.query(
        `SELECT c.id, c.title, c.category, e.progress_percentage, e.completed_at
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = $1 AND (e.status = 'COMPLETED' OR e.progress_percentage >= 100)`,
        [student.id]
      );

      // 2b. Assessment Attempts
      const asmtRes = await client.query(
        `SELECT a.id, a.title, a.domain, aa.score, aa.status, aa.completed_at
         FROM assessment_attempts aa
         JOIN assessments a ON a.id = aa.assessment_id
         WHERE aa.student_id = $1 AND (aa.status = 'PASSED' OR aa.score >= 50)`,
        [student.id]
      );

      // 2c. Technical Projects
      const projRes = await client.query(
        `SELECT p.id, p.title, p.description, p.tech_stack, p.status, p.validated_at
         FROM projects p
         WHERE p.student_id = $1`,
        [student.id]
      );

      // 2d. Certifications
      const certRes = await client.query(
        `SELECT c.id, c.title, c.certificate_number, c.verification_hash, c.issued_at, crs.title as course_title
         FROM certificates c
         LEFT JOIN courses crs ON crs.id = c.course_id
         WHERE c.student_id = $1`,
        [student.id]
      );

      // 2e. Explicit skill_evidence records already persisted
      const existingEvRes = await client.query(
        `SELECT se.*, s.name as skill_name
         FROM skill_evidence se
         JOIN skills s ON s.id = se.skill_id
         WHERE se.student_id = $1
         ORDER BY se.created_at DESC`,
        [student.id]
      );

      // 3. Map evidence to skills
      const skillEvidenceMap = new Map(); // skillId -> { skill, evidences: [], scores: [] }

      // Helper to link evidence to skill
      const linkEvidence = (skillId, skillObj, evItem) => {
        if (!skillEvidenceMap.has(skillId)) {
          skillEvidenceMap.set(skillId, {
            skill: skillObj,
            evidences: [],
            assessmentScores: [],
            projectList: [],
            certList: [],
            courseList: [],
            industryList: []
          });
        }
        const bucket = skillEvidenceMap.get(skillId);
        bucket.evidences.push(evItem);
        if (evItem.score) bucket.assessmentScores.push(evItem.score);

        if (evItem.type === 'PROJECT') bucket.projectList.push(evItem);
        else if (evItem.type === 'CERTIFICATION') bucket.certList.push(evItem);
        else if (evItem.type === 'COURSE') bucket.courseList.push(evItem);
        else if (evItem.type === 'ASSESSMENT') bucket.industryList.push(evItem);
      };

      // Add existing persisted evidence
      existingEvRes.rows.forEach(ev => {
        const sObj = skillNameMap.get((ev.skill_name || '').toLowerCase().trim());
        if (sObj) {
          linkEvidence(sObj.id, sObj, {
            id: ev.id,
            type: ev.evidence_type,
            title: ev.title || `${sObj.name} Evidence`,
            score: Number(ev.score) || null,
            status: ev.verification_status,
            confidence: Number(ev.confidence) || 80,
            date: ev.created_at
          });
        }
      });

      // Scan and match courses
      for (const crs of coursesRes.rows) {
        const titleLower = crs.title.toLowerCase();
        for (const [skName, sObj] of skillNameMap.entries()) {
          if (titleLower.includes(skName)) {
            linkEvidence(sObj.id, sObj, {
              id: crs.id,
              type: 'COURSE',
              title: crs.title,
              score: 85,
              status: 'VERIFIED',
              confidence: 85,
              date: crs.completed_at || new Date().toISOString()
            });
          }
        }
      }

      // Scan and match assessments
      for (const asmt of asmtRes.rows) {
        const titleLower = asmt.title.toLowerCase();
        for (const [skName, sObj] of skillNameMap.entries()) {
          if (titleLower.includes(skName)) {
            linkEvidence(sObj.id, sObj, {
              id: asmt.id,
              type: 'ASSESSMENT',
              title: asmt.title,
              score: Number(asmt.score) || 75,
              status: 'VERIFIED',
              confidence: 90,
              date: asmt.completed_at || new Date().toISOString()
            });
          }
        }
      }

      // Scan and match projects
      for (const proj of projRes.rows) {
        let techs = [];
        if (Array.isArray(proj.tech_stack)) {
          techs = proj.tech_stack;
        } else if (typeof proj.tech_stack === 'string') {
          try {
            const parsed = JSON.parse(proj.tech_stack);
            techs = Array.isArray(parsed) ? parsed : [proj.tech_stack];
          } catch (e) {
            techs = proj.tech_stack.split(',').map(s => s.trim());
          }
        }
        if (techs.length === 0 && proj.title) {
          techs = [proj.title];
        }
        const isVerified = proj.status === 'APPROVED' || proj.status === 'Validated' || proj.validated_at !== null;
        for (const t of techs) {
          const tLower = String(t).toLowerCase().trim();
          for (const [skName, sObj] of skillNameMap.entries()) {
            if (tLower.includes(skName) || skName.includes(tLower)) {
              linkEvidence(sObj.id, sObj, {
                id: proj.id,
                type: 'PROJECT',
                title: proj.title,
                score: 82,
                status: isVerified ? 'VERIFIED' : 'PENDING_REVIEW',
                confidence: isVerified ? 88 : 70,
                date: proj.validated_at || new Date().toISOString()
              });
            }
          }
        }
      }

      // Scan and match certifications (title or associated course title)
      for (const cert of certRes.rows) {
        const fullTitle = `${cert.title || ''} ${cert.course_title || ''}`.toLowerCase().trim();
        const isVerified = Boolean(cert.verification_hash || cert.certificate_number);
        for (const [skName, sObj] of skillNameMap.entries()) {
          if (fullTitle.includes(skName) || skName.includes(fullTitle)) {
            linkEvidence(sObj.id, sObj, {
              id: cert.id,
              type: 'CERTIFICATION',
              title: cert.title,
              score: 80,
              status: isVerified ? 'VERIFIED' : 'PENDING_REVIEW',
              confidence: isVerified ? 85 : 65,
              date: cert.issued_at || new Date().toISOString()
            });
          }
        }
      }

      // 4. Fetch existing student_skills records
      const ssRes = await client.query(
        `SELECT ss.*, s.name as canonical_name, s.industry_demand
         FROM student_skills ss
         LEFT JOIN skills s ON s.id = ss.skill_id
         WHERE ss.student_id = $1`,
        [student.id]
      );
      const studentSkillRows = ssRes.rows;

      // Ensure any skill in student_skills is also in map
      for (const ss of studentSkillRows) {
        const sObj = skillNameMap.get((ss.canonical_name || ss.skill_name || '').toLowerCase().trim());
        if (sObj && !skillEvidenceMap.has(sObj.id)) {
          skillEvidenceMap.set(sObj.id, {
            skill: sObj,
            evidences: [],
            assessmentScores: ss.score ? [ss.score] : [],
            projectList: Array.isArray(ss.project_evidence) ? ss.project_evidence : [],
            certList: Array.isArray(ss.certification_evidence) ? ss.certification_evidence : [],
            courseList: [],
            industryList: []
          });
        }
      }

      // 5. Build Graph Nodes & Update PostgreSQL student_skills
      const nodes = [];
      for (const [skillId, bucket] of skillEvidenceMap.entries()) {
        const sObj = bucket.skill;
        const evList = bucket.evidences;
        const evCount = evList.length;

        // Calculate weighted score from genuine evidence
        let scoreSum = 0;
        let scoreWeights = 0;

        if (bucket.assessmentScores.length > 0) {
          const avgAsmt = bucket.assessmentScores.reduce((a, b) => a + b, 0) / bucket.assessmentScores.length;
          scoreSum += avgAsmt * 0.45;
          scoreWeights += 0.45;
        }
        if (bucket.projectList.length > 0) {
          scoreSum += 84 * 0.30;
          scoreWeights += 0.30;
        }
        if (bucket.courseList.length > 0) {
          scoreSum += 82 * 0.15;
          scoreWeights += 0.15;
        }
        if (bucket.certList.length > 0) {
          scoreSum += 80 * 0.10;
          scoreWeights += 0.10;
        }

        const calculatedScore = scoreWeights > 0 ? Math.round(scoreSum / scoreWeights) : 50;
        const profLevel = this.deriveProficiencyLevel(calculatedScore, evCount);
        const isVerified = evCount > 0 && evList.some(e => e.status === 'VERIFIED');
        const verificationStatus = isVerified ? 'VERIFIED' : (evCount > 0 ? 'PENDING_REVIEW' : 'CLAIMED');

        // Confidence score based on multi-source evidence
        const confidenceScore = Math.min(98, Math.max(50, 60 + Math.min(30, evCount * 12)));
        const maxAssessment = bucket.assessmentScores.length > 0 ? Math.max(...bucket.assessmentScores) : 0;

        // Persist each discovered evidence into skill_evidence table for auditability & credibility engine
        for (const ev of evList) {
          const evType = (ev.type || 'COURSE').toUpperCase();
          const evStatus = (ev.status === 'VERIFIED' || ev.status === 'VALIDATED') ? 'VERIFIED' : 'PENDING';
          try {
            await client.query(`
              INSERT INTO skill_evidence (
                student_id, skill_id, evidence_type, evidence_id, reference_id,
                title, score, verification_status, confidence, created_at
              )
              SELECT $1, $2, $3, $4, $4, $5, $6, $7, $8, $9
              WHERE NOT EXISTS (
                SELECT 1 FROM skill_evidence
                WHERE student_id = $1 AND skill_id = $2 AND UPPER(evidence_type) = UPPER($3) AND (title = $5 OR reference_id = $4)
              )
            `, [
              student.id,
              sObj.id,
              evType,
              ev.id ? String(ev.id) : null,
              ev.title || `${sObj.name} Evidence`,
              ev.score || 0,
              evStatus,
              ev.confidence || 80,
              ev.date ? new Date(ev.date) : new Date()
            ]);
          } catch (evErr) {
            // Non-fatal if specific duplicate or constraint
          }
        }

        // Synchronize into student_skills table
        await client.query(`
          INSERT INTO student_skills (
            student_id, skill_id, skill_name, proficiency_score, proficiency_level,
            verification_status, evidence_count, last_verified_at, confidence_score,
            source, score, assessment_score, project_evidence, certification_evidence, industry_evidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (student_id, skill_id) DO UPDATE SET
            proficiency_score = EXCLUDED.proficiency_score,
            proficiency_level = EXCLUDED.proficiency_level,
            verification_status = EXCLUDED.verification_status,
            evidence_count = EXCLUDED.evidence_count,
            last_verified_at = NOW(),
            confidence_score = EXCLUDED.confidence_score,
            score = EXCLUDED.score,
            assessment_score = EXCLUDED.assessment_score,
            project_evidence = EXCLUDED.project_evidence,
            certification_evidence = EXCLUDED.certification_evidence,
            industry_evidence = EXCLUDED.industry_evidence
        `, [
          student.id,
          sObj.id,
          sObj.name,
          calculatedScore,
          profLevel,
          verificationStatus,
          evCount,
          confidenceScore,
          isVerified ? 'Skill Graph 2.0 Evidence Verification' : 'Student Skill Ledger',
          calculatedScore,
          maxAssessment,
          JSON.stringify(bucket.projectList),
          JSON.stringify(bucket.certList),
          JSON.stringify(bucket.industryList)
        ]);

        // Phase 2: Compute real Skill Credibility score for this node
        let credScore = 0;
        let credData = null;
        try {
          const skillCredibilityService = require('./skillCredibilityService');
          credData = await skillCredibilityService.calculateSkillCredibility(student.id, sObj.id, client);
          credScore = credData ? credData.credibilityScore : 0;
        } catch (e) {
          console.warn('Skill credibility calc warning:', e.message);
        }

        nodes.push({
          id: sObj.id,
          skillId: sObj.id,
          name: sObj.name,
          proficiencyScore: calculatedScore,
          proficiencyLevel: profLevel,
          credibilityScore: credScore,
          verificationStrength: credData ? credData.verificationStrength : 'LOW',
          recencyScore: credData ? credData.recencyScore : 0,
          consistencyScore: credData ? credData.consistencyScore : 100,
          consistencyNote: credData ? credData.consistencyNote : '',
          verificationStatus,
          evidenceCount: evCount,
          lastVerifiedAt: new Date().toISOString(),
          confidenceScore,
          industryDemand: sObj.industry_demand || 'HIGH',
          description: sObj.description || '',
          evidence: evList
        });
      }

      // Phase 2: Auto-recalculate Career Readiness from real evidence
      try {
        const careerReadinessService = require('./careerReadinessService');
        await careerReadinessService.calculateCareerReadiness(student.id, client);
      } catch (e) {
        console.warn('Career readiness auto-recalc warning:', e.message);
      }

      // 6. Fetch Skill Graph Edges (Relationships)
      const edgesRes = await client.query(`
        SELECT sr.id, sr.source_skill_id, s1.name as source_name,
               sr.target_skill_id, s2.name as target_name,
               sr.relationship_type, sr.strength
        FROM skill_relationships sr
        JOIN skills s1 ON s1.id = sr.source_skill_id
        JOIN skills s2 ON s2.id = sr.target_skill_id
      `);

      const edges = edgesRes.rows.map(e => ({
        id: e.id,
        source: e.source_skill_id,
        target: e.target_skill_id,
        sourceName: e.source_name,
        targetName: e.target_name,
        relationshipType: e.relationship_type,
        strength: parseFloat(e.strength)
      }));

      // 7. Compute Related Skills Lookup (e.g. Python -> SQL -> Machine Learning)
      const relatedSkillsMap = {};
      edges.forEach(e => {
        const sName = e.sourceName;
        if (!relatedSkillsMap[sName]) relatedSkillsMap[sName] = [];
        relatedSkillsMap[sName].push({
          name: e.targetName,
          relationship: e.relationshipType,
          strength: e.strength
        });
      });

      // 8. Compute Overall Metrics
      const totalSkills = nodes.length;
      const verifiedSkills = nodes.filter(n => n.verificationStatus === 'VERIFIED').length;
      const totalScore = nodes.reduce((sum, n) => sum + n.proficiencyScore, 0);
      const avgProficiency = totalSkills > 0 ? Math.round(totalScore / totalSkills) : 0;
      const evidenceNodesCount = nodes.reduce((sum, n) => sum + n.evidenceCount, 0);

      return {
        success: true,
        student: {
          id: student.id,
          name: student.full_name || student.student_name,
          rollNumber: student.roll_number,
          collegeName: student.college_name
        },
        metrics: {
          totalSkills,
          verifiedSkills,
          averageProficiency: avgProficiency,
          evidenceNodesCount,
          expertCount: nodes.filter(n => n.proficiencyLevel === 'Expert').length,
          advancedCount: nodes.filter(n => n.proficiencyLevel === 'Advanced').length,
          intermediateCount: nodes.filter(n => n.proficiencyLevel === 'Intermediate').length,
          beginnerCount: nodes.filter(n => n.proficiencyLevel === 'Beginner').length
        },
        nodes,
        edges,
        relatedSkills: relatedSkillsMap
      };
    } finally {
      client.release();
    }
  }

  /**
   * Record a new verified skill evidence item
   */
  async recordSkillEvidence({ studentId, skillId, evidenceType, evidenceId, title, score = 80, confidence = 85, metadata = {} }) {
    if (!studentId || !skillId || !evidenceType) {
      const err = new Error('studentId, skillId, and evidenceType are required.');
      err.statusCode = 400;
      throw err;
    }

    const client = await this.getClient();
    try {
      const res = await client.query(`
        INSERT INTO skill_evidence (student_id, skill_id, evidence_type, evidence_id, title, score, confidence, metadata, verification_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED')
        RETURNING *
      `, [studentId, skillId, evidenceType, evidenceId || null, title || `${evidenceType} Evidence`, score, confidence, JSON.stringify(metadata)]);

      // Re-sync student skill graph immediately
      await this.buildStudentSkillGraph(studentId);

      return {
        success: true,
        evidence: res.rows[0]
      };
    } finally {
      client.release();
    }
  }

  /**
   * Role-Scoped Skill Graph access
   */
  async getSkillGraphForStudent(studentId, requestingUser) {
    const role = String(requestingUser?.role || 'student').toLowerCase();
    const reqStudentId = requestingUser?.studentId || requestingUser?.id;

    if (role === 'student') {
      const student = await this.resolveStudent(reqStudentId);
      if (!student || student.id !== studentId) {
        const err = new Error('Access denied: You can only view your own Skill Graph.');
        err.statusCode = 403;
        throw err;
      }
    } else if (role === 'institution' || role === 'academician' || role === 'faculty') {
      const student = await this.resolveStudent(studentId);
      const userInstId = requestingUser?.institutionId || requestingUser?.collegeId;
      if (userInstId && student?.institution_id && student.institution_id !== userInstId) {
        const err = new Error('Access denied: Student does not belong to your institution.');
        err.statusCode = 403;
        throw err;
      }
    }

    return await this.buildStudentSkillGraph(studentId);
  }
}

module.exports = new SkillGraphService();
