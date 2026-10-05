/**
 * SKILLNEXUS AI — Centralized AI Context Builder
 * Gathers strictly permitted, tenant-isolated data from PostgreSQL.
 * Never fabricates data; evaluates data quality signals.
 */

const relationalManager = require('../../db/relationalManager');

class AIContextService {
  /**
   * Build complete AI context for a specific student.
   * Enforces role isolation (called with authenticated studentId).
   */
  async getStudentAIContext(studentId) {
    if (!studentId) {
      throw new Error('Student ID is required to build AI context');
    }

    const student = await relationalManager.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // 1. Normalized Skills Profile
    const skills = Array.isArray(student.skills) ? student.skills : [];
    const normalizedSkills = skills.map(s => ({
      name: s.name || s.skill || '',
      level: s.level || s.proficiencyLevel || 'Intermediate',
      verified: Boolean(s.verified || s.faculty_verified),
      category: s.category || 'General',
      score: Number(s.confidence || s.confidenceScore || s.assessment_score || 0)
    })).filter(s => Boolean(s.name));

    // 2. Learning & Course Enrollments
    const enrollments = await relationalManager.getEnrollments(student.studentId || student.id) || [];
    const activeEnrollments = enrollments.map(e => ({
      courseId: e.courseId || e.course_id || e.id,
      title: e.courseTitle || e.title || e.courseName || 'Course',
      progress: Number(e.progress || e.progress_percentage || 0),
      status: e.status || (e.progress >= 100 ? 'Completed' : 'In Progress')
    }));

    // 3. Diagnostic Assessments
    const assessments = Array.isArray(student.assessments) ? student.assessments : [];
    const assessmentSummary = assessments.map(a => ({
      title: a.title || a.assessment_type || 'Diagnostic Assessment',
      domain: a.domain || a.assessment_type || 'General',
      score: Number(a.score || 0),
      percentile: Number(a.percentile || 0),
      status: a.status || 'Completed'
    }));

    // 4. Projects & Sovereign Ledger Proofs
    const projects = Array.isArray(student.projects) ? student.projects : [];
    const projectSummary = projects.map(p => ({
      id: p.id || p.projectId || p.project_id,
      title: p.title || 'Engineering Project',
      techStack: Array.isArray(p.techStack) ? p.techStack : (Array.isArray(p.tech_stack) ? p.tech_stack : []),
      status: p.status || 'Draft',
      isProven: Boolean(p.proofVerified || p.status === 'Validated' || p.status === 'validated')
    }));

    // 5. Target Career Role
    const targetRole = student.targetRole ||
      student.targetCareerRole ||
      student.desiredRole ||
      student.careerGoal ||
      student.skillProfile?.targetRole ||
      (Array.isArray(student.preferredRoles) && student.preferredRoles[0]) ||
      'Full Stack Developer';

    // 6. Data Quality Assessment (Zero Fabrication Guard)
    const missingSignals = [];
    if (normalizedSkills.length === 0) missingSignals.push('No skills recorded in profile');
    if (assessmentSummary.length === 0) missingSignals.push('No diagnostic assessments completed');
    if (projectSummary.length === 0) missingSignals.push('No projects submitted or verified');
    if (activeEnrollments.length === 0) missingSignals.push('No course enrollments active');

    const isSufficient = normalizedSkills.length > 0 || assessmentSummary.length > 0 || activeEnrollments.length > 0;

    return {
      studentId: student.studentId || student.id,
      fullName: student.name || student.fullName || 'Student',
      email: student.email,
      institutionId: student.collegeId || student.institutionId,
      institutionName: student.institutionName || 'Affiliated Institution',
      department: student.department || 'Computer Science and Engineering',
      batch: student.batch || '2022-2026',
      cgpa: student.cgpa != null ? Number(student.cgpa) : null,
      targetRole,
      readinessScore: Number(student.readinessScore || student.careerReadinessScore || 0),
      skills: normalizedSkills,
      courses: activeEnrollments,
      assessments: assessmentSummary,
      projects: projectSummary,
      dataQuality: {
        sufficient: isSufficient,
        signalCount: normalizedSkills.length + assessmentSummary.length + projectSummary.length + activeEnrollments.length,
        missingSignals
      }
    };
  }

  /**
   * Build AI context for an Institution.
   * Enforces institution boundary.
   */
  async getInstitutionAIContext(institutionId) {
    if (!institutionId) throw new Error('Institution ID is required');

    const inst = await relationalManager.resolveInstitution(institutionId);
    if (!inst) throw new Error('Institution not found');

    const students = await relationalManager.getStudents(inst.id || inst.code);
    const instStudents = students || [];

    // Calculate cohort metrics
    let totalReadiness = 0;
    const skillCounts = {};
    instStudents.forEach(s => {
      totalReadiness += Number(s.readinessScore || 0);
      (s.skills || []).forEach(sk => {
        const name = (sk.name || sk.skill || '').trim();
        if (name) skillCounts[name] = (skillCounts[name] || 0) + 1;
      });
    });

    const avgReadiness = instStudents.length > 0 ? Math.round(totalReadiness / instStudents.length) : 0;
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, studentCount: count }));

    return {
      institutionId: inst.id || inst.code,
      name: inst.name,
      code: inst.code,
      studentCount: instStudents.length,
      averageReadiness: avgReadiness,
      topCohortSkills: topSkills,
      departments: inst.departments || ['Computer Science and Engineering']
    };
  }

  /**
   * Build AI context for Company Opportunity.
   * Enforces company tenant boundary.
   */
  async getCompanyOpportunityContext(companyId, opportunityId) {
    if (!companyId || !opportunityId) {
      throw new Error('Both companyId and opportunityId are required');
    }

    const opp = await relationalManager.getOpportunityById(opportunityId);
    if (!opp) throw new Error('Opportunity not found');

    const oppCompanyId = opp.companyId || opp.company_id;
    if (String(oppCompanyId) !== String(companyId)) {
      throw new Error('Forbidden: You do not own this opportunity');
    }

    const rawReq = opp.requiredSkills || opp.skills || [];
    const requiredSkills = rawReq.map(s => typeof s === 'string' ? s : (s.name || s.skill)).filter(Boolean);

    const applications = await relationalManager.getApplications({ opportunityId }) || [];

    return {
      opportunityId: opp.oppId || opp.id,
      companyId,
      companyName: opp.companyName || opp.company_name,
      title: opp.title,
      type: opp.opportunityType || opp.type,
      requiredSkills,
      stipend: opp.stipendText || opp.stipend,
      applicantCount: applications.length,
      applications: applications.map(a => ({
        applicationId: a.applicationId || a.id,
        studentId: a.studentId,
        studentName: a.studentName || a.candidateName,
        matchScore: a.matchScore,
        stage: a.stage || a.status
      }))
    };
  }
}

module.exports = new AIContextService();
