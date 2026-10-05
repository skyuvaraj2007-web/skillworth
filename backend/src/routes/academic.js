const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const rosterService = require('../services/rosterService');
const collegeIntelligenceService = require('../services/collegeIntelligenceService');
const { requireAuth } = require('../middleware/auth');

// Middleware to enforce tenant (institution) isolation
function verifyInstitution(req, res, next) {
  const userRole = (req.user?.role || '').toLowerCase();
  if (!['institution', 'admin'].includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Institution role required' });
  }
  const institutionId = req.user?.institutionId || req.user?.collegeId || (userRole === 'admin' ? req.query.institutionId : null);
  if (!institutionId) {
    return res.status(403).json({ success: false, message: 'Institution context missing' });
  }
  req.institutionId = institutionId;
  next();
}

// ---------- Institution Profile ----------
router.get('/profile', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const profile = await relationalManager.getInstitutionProfile(req.institutionId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Institution profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { name, website, email, district, state } = req.body;
    if (relationalManager.supabase) {
      await relationalManager.query(
        `UPDATE institutions
         SET name = COALESCE($1, name),
             website_url = COALESCE($2, website_url),
             official_email = COALESCE($3, official_email),
             district = COALESCE($4, district),
             state = COALESCE($5, state),
             updated_at = NOW()
         WHERE id::text = $6 OR code = $6`,
        [name || null, website || null, email || null, district || null, state || null, req.institutionId]
      );
    }
    const updated = await relationalManager.getInstitutionProfile(req.institutionId);
    res.json({ success: true, message: 'Institution profile updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Dashboard Stats ----------
router.get('/dashboard-stats', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const students = await relationalManager.getStudents(req.institutionId);
    const skills = await relationalManager.getInstitutionSkills(req.institutionId);
    const placedCount = students.filter(s => {
      const st = String(s.placementStatus || '').toLowerCase();
      return st.includes('placed') || st.includes('selected') || st.includes('joined') || st.includes('offer');
    }).length;
    const placementRate = students.length > 0 ? Math.round((placedCount / students.length) * 100) : 0;
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        totalSkills: skills.length,
        activeLearners: students.length,
        placementRate
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FEATURE 5: COLLEGE SKILL INTELLIGENCE ROUTES
// ══════════════════════════════════════════════════════════════════════════

// 1. GET /api/academic/intelligence/dashboard — Executive KPI Summary & Actionable Insights
router.get('/intelligence/dashboard', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const data = await collegeIntelligenceService.getDashboardKPIs(req.institutionId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/academic/intelligence/dashboard] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/academic/intelligence/skill-analytics — Filterable Multi-Pillar Skill Telemetry
router.get(['/intelligence/skill-analytics', '/skill-analytics'], requireAuth, verifyInstitution, async (req, res) => {
  try {
    const filters = {
      department: req.query.department,
      academicYear: req.query.academicYear,
      batch: req.query.batch,
      skill: req.query.skill,
      assessment: req.query.assessment,
      course: req.query.course
    };
    const data = await collegeIntelligenceService.getSkillAnalytics(req.institutionId, filters);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/academic/intelligence/skill-analytics] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/academic/intelligence/skill-gap — Industry Benchmark Skill Gap Analysis
router.get(['/intelligence/skill-gap', '/skill-gap-matrix'], requireAuth, verifyInstitution, async (req, res) => {
  try {
    const data = await collegeIntelligenceService.getSkillGapAnalysis(req.institutionId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/academic/intelligence/skill-gap] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/academic/intelligence/training-initiative — Provision Training Program from Insight
router.post('/intelligence/training-initiative', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const result = await collegeIntelligenceService.createTrainingInitiative(
      req.institutionId,
      req.body,
      req.user?.id
    );
    res.status(201).json(result);
  } catch (err) {
    console.error('[POST /api/academic/intelligence/training-initiative] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Combined & Cohort Analytics ----------
router.get(['/analytics', '/combined-analytics'], requireAuth, verifyInstitution, async (req, res) => {
  try {
    const students = await relationalManager.getStudents(req.institutionId) || [];
    const courses = await relationalManager.getCourses(req.institutionId) || [];
    const companies = await relationalManager.getCompaniesForInstitution(req.institutionId) || [];
    const opportunities = await relationalManager.getOpportunitiesForInstitution(req.institutionId) || [];
    const applications = await relationalManager.getApplications(req.institutionId) || [];
    const collabs = await relationalManager.getCollaborationsForInstitution(req.institutionId) || { partneredColleges: [], industryPartners: [] };

    const deptMap = {};
    students.forEach(s => {
      const dept = s.department || s.dept || 'Engineering & Technology';
      if (!deptMap[dept]) deptMap[dept] = { count: 0, totalCgpa: 0, readinessSum: 0 };
      deptMap[dept].count++;
      deptMap[dept].totalCgpa += Number(s.cgpa || 7.5);
      deptMap[dept].readinessSum += Number(s.readinessScore || s.readiness || 65);
    });

    const cohortDistribution = Object.keys(deptMap).map(dept => {
      const avgR = Math.round(deptMap[dept].readinessSum / deptMap[dept].count);
      return {
        dept,
        count: `${deptMap[dept].count} Student${deptMap[dept].count > 1 ? 's' : ''}`,
        studentCount: deptMap[dept].count,
        readiness: `${avgR}%`,
        completion: `${Math.min(100, Math.round(avgR * 1.1))}%`,
        growth: `+${Math.max(5, Math.round(avgR * 0.15))}%`,
        avgCgpa: (deptMap[dept].totalCgpa / deptMap[dept].count).toFixed(1)
      };
    });

    const skillDemandMap = {};
    opportunities.forEach(opp => {
      const skills = Array.isArray(opp.requiredSkills) ? opp.requiredSkills : (typeof opp.requiredSkills === 'string' ? opp.requiredSkills.split(',') : (opp.skills || []));
      skills.forEach(sk => {
        const name = String(sk).trim();
        if (name) {
          skillDemandMap[name] = (skillDemandMap[name] || 0) + 1;
        }
      });
    });

    const topSkillsInDemand = Object.keys(skillDemandMap).map(sk => ({
      skill: sk,
      demand: opportunities.length > 0 ? Math.round((skillDemandMap[sk] / opportunities.length) * 100) : 0,
      demandCount: skillDemandMap[sk],
      demandPercent: opportunities.length > 0 ? Math.round((skillDemandMap[sk] / opportunities.length) * 100) : 0,
      companies: 'Corporate Partners'
    })).sort((a, b) => b.demandCount - a.demandCount).slice(0, 6);

    const totalPlaced = applications.filter(a => {
      const st = String(a.stage || a.status || '').toUpperCase();
      return st.includes('SELECT') || st.includes('HIRE') || st.includes('JOIN') || st.includes('OFFER');
    }).length;

    const placementRate = students.length > 0 ? Math.round((totalPlaced / students.length) * 100) : 0;
    const avgReadiness = students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + (Number(s.readinessScore || s.readiness || s.readiness_score) || 0), 0) / students.length)
      : 0;

    const certCount = students.filter(s => (s.certificates && s.certificates.length > 0) || s.hasCertificate).length;
    const certRate = students.length > 0 ? Math.round((certCount / students.length) * 100) : 0;
    const projectTotal = students.reduce((acc, s) => acc + (Array.isArray(s.projects) ? s.projects.length : 0), 0);
    const projectRatio = students.length > 0 ? +(projectTotal / students.length).toFixed(1) : 0;
    const ppoRate = applications.length > 0 ? Math.round((totalPlaced / applications.length) * 100) : 0;

    const domains = [
      { domain: 'Core Programming & Data Structures', campus: courses.length > 0 ? 80 : 0, industry: 88, status: 'Balanced' },
      { domain: 'Full Stack & Web Technologies', campus: courses.length > 0 ? 75 : 0, industry: 85, status: 'Balanced' },
      { domain: 'Cloud Architecture & DevOps', campus: courses.length > 1 ? 55 : 0, industry: 82, status: 'Moderate Deficit' },
      { domain: 'Generative AI & LLM Systems', campus: courses.length > 2 ? 60 : 0, industry: 90, status: 'Critical Deficit (-30%)' },
      { domain: 'Database & Data Modeling', campus: courses.length > 0 ? 70 : 0, industry: 80, status: 'Moderate' }
    ];

    const avgCampus = domains.reduce((a, b) => a + b.campus, 0) / domains.length;
    const avgInd = domains.reduce((a, b) => a + b.industry, 0) / domains.length;
    const alignmentScore = Math.round((avgCampus / (avgInd || 1)) * 100);
    const mostSought = topSkillsInDemand.length > 0 ? topSkillsInDemand[0].skill : 'N/A';

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        totalCourses: courses.length,
        totalCompanies: companies.length,
        totalOpportunities: opportunities.length,
        totalApplications: applications.length,
        totalPartners: (collabs.partneredColleges || []).length + (collabs.industryPartners || []).length,
        placementRate,
        cohortDistribution,
        cohorts: cohortDistribution,
        topSkillsInDemand,
        skillsInDemand: topSkillsInDemand,
        alignmentScore,
        alignmentDelta: 6.5,
        domains,
        studentMetrics: {
          courseCompletionRate: Math.min(100, Math.round(avgReadiness * 0.95 + 10)),
          certificationAttainment: certRate,
          placementReadyAvg: avgReadiness,
          projectArtifactRatio: projectRatio
        },
        corporateMetrics: {
          activeRecruiters: (collabs.industryPartners || []).length || companies.length,
          totalCampusOpenings: opportunities.length,
          mostSoughtSkill: mostSought,
          partnerDemandPct: topSkillsInDemand.length > 0 ? 85 : 0,
          ppoConversionRate: ppoRate
        },
        hasActivity: (students.length > 0 || opportunities.length > 0 || applications.length > 0 || courses.length > 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Skill Growth & Student Performance Analytics ----------
const handleGetSkillGrowth = async (req, res) => {
  try {
    const instId = req.institutionId;
    const { department, classId, skill, semester, academicYear } = req.query;

    if (!relationalManager.supabase) {
      return res.json({
        success: true,
        hasData: false,
        message: 'No skill growth data available yet.',
        data: {
          departments: [],
          departmentGrowth: [],
          skillDistribution: [],
          timeSeries: [],
          departmentComparison: [],
          classComparison: [],
          assessmentImprovement: { initialScore: 0, recentScore: 0, improvement: 0 }
        }
      });
    }

    const instRes = await relationalManager.query(
      `SELECT id, name, code FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1`,
      [String(instId)]
    );
    const instUuid = instRes.rows[0]?.id;

    // Fetch list of departments
    const deptsRes = await relationalManager.query(
      `SELECT id, name, code FROM departments WHERE institution_id = $1 OR institution_id IS NULL ORDER BY name ASC`,
      [instUuid]
    );
    const allDepartments = deptsRes.rows;

    // Department-wise skill growth calculated from real database records
    let deptGrowthQuery = `
      SELECT d.id as department_id, d.name as department_name, d.code as department_code,
             COUNT(DISTINCT s.id)::int as student_count,
             COALESCE(ROUND(AVG(NULLIF(ssh.growth_percentage, 0))), 
                      ROUND(AVG(ss.confidence_score) * 0.75), 0)::int as average_growth,
             COALESCE(ROUND(AVG(ss.confidence_score)), 0)::int as current_skill_score
      FROM departments d
      JOIN students s ON s.department_id = d.id
      LEFT JOIN student_skills ss ON ss.student_id = s.id
      LEFT JOIN student_skill_history ssh ON ssh.student_id = s.id
      WHERE (s.institution_id = $1 OR s.institution_id::text = $2)
    `;
    const params = [instUuid, String(instId)];

    if (department && department !== 'All') {
      params.push(department);
      deptGrowthQuery += ` AND (d.id::text = $${params.length} OR d.code = $${params.length} OR d.name = $${params.length})`;
    }
    if (classId && classId !== 'All') {
      params.push(classId);
      deptGrowthQuery += ` AND s.class_id::text = $${params.length}`;
    }
    if (semester && semester !== 'All') {
      params.push(`%${semester}%`);
      deptGrowthQuery += ` AND s.year_semester ILIKE $${params.length}`;
    }
    if (academicYear && academicYear !== 'All') {
      params.push(academicYear);
      deptGrowthQuery += ` AND (s.batch = $${params.length} OR s.graduation_year::text = $${params.length})`;
    }

    deptGrowthQuery += ` GROUP BY d.id, d.name, d.code ORDER BY d.name ASC`;
    const deptGrowthRes = await relationalManager.query(deptGrowthQuery, params);

    const hasData = deptGrowthRes.rows.some(r => r.student_count > 0 && (r.average_growth > 0 || r.current_skill_score > 0));

    // Skill Distribution across categories
    const distRes = await relationalManager.query(
      `SELECT 
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%python%', '%java%', '%c++', '%programming%', '%coding%', '%javascript%']) THEN ss.confidence_score ELSE NULL END)) as programming,
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%aptitude%', '%quantitative%', '%math%', '%numerical%']) THEN ss.confidence_score ELSE NULL END)) as aptitude,
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%logic%', '%reasoning%', '%analytical%']) THEN ss.confidence_score ELSE NULL END)) as logical_reasoning,
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%communication%', '%english%', '%verbal%', '%soft skill%']) THEN ss.confidence_score ELSE NULL END)) as communication,
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%problem%', '%dsa%', '%algorithm%', '%data structures%']) THEN ss.confidence_score ELSE NULL END)) as problem_solving,
         ROUND(AVG(CASE WHEN sk.name ILIKE ANY(ARRAY['%sql%', '%cloud%', '%web%', '%react%', '%docker%', '%git%']) THEN ss.confidence_score ELSE NULL END)) as technical_skills
       FROM student_skills ss
       JOIN skills sk ON sk.id = ss.skill_id
       JOIN students s ON s.id = ss.student_id
       WHERE (s.institution_id = $1 OR s.institution_id::text = $2)`,
      [instUuid, String(instId)]
    );
    const distRow = distRes.rows[0] || {};
    const skillDistribution = [
      { category: 'Programming', score: Number(distRow.programming) || 0 },
      { category: 'Aptitude', score: Number(distRow.aptitude) || 0 },
      { category: 'Logical Reasoning', score: Number(distRow.logical_reasoning) || 0 },
      { category: 'Communication', score: Number(distRow.communication) || 0 },
      { category: 'Problem Solving', score: Number(distRow.problem_solving) || 0 },
      { category: 'Technical Skills', score: Number(distRow.technical_skills) || 0 }
    ];

    // Skill Growth Over Time
    const timeRes = await relationalManager.query(
      `SELECT TO_CHAR(recorded_at, 'Mon') as month,
              DATE_TRUNC('month', recorded_at) as m_order,
              ROUND(AVG(new_score)) as avg_score
       FROM student_skill_history ssh
       JOIN students s ON s.id = ssh.student_id
       WHERE (s.institution_id = $1 OR s.institution_id::text = $2)
       GROUP BY TO_CHAR(recorded_at, 'Mon'), DATE_TRUNC('month', recorded_at)
       ORDER BY m_order ASC LIMIT 6`,
      [instUuid, String(instId)]
    );
    const timeSeries = timeRes.rows.map(r => ({ month: r.month, score: Number(r.avg_score) || 0 }));

    // Class Comparison
    const classRes = await relationalManager.query(
      `SELECT c.id, c.name, c.section,
              COUNT(DISTINCT s.id)::int as student_count,
              COALESCE(ROUND(AVG(ss.confidence_score)), 0)::int as avg_skill_score
       FROM classes c
       JOIN students s ON s.class_id = c.id
       LEFT JOIN student_skills ss ON ss.student_id = s.id
       WHERE (c.institution_id = $1 OR c.institution_id::text = $2)
       GROUP BY c.id, c.name, c.section
       ORDER BY avg_skill_score DESC LIMIT 8`,
      [instUuid, String(instId)]
    );
    const classComparison = classRes.rows.map(r => ({
      className: `${r.name} ${r.section || ''}`.trim(),
      studentCount: r.student_count,
      avgScore: r.avg_skill_score
    }));

    // Assessment Improvement
    const impRes = await relationalManager.query(
      `WITH ranked AS (
         SELECT aa.student_id, aa.score,
                ROW_NUMBER() OVER (PARTITION BY aa.student_id ORDER BY aa.completed_at ASC) as rn_first,
                ROW_NUMBER() OVER (PARTITION BY aa.student_id ORDER BY aa.completed_at DESC) as rn_last
         FROM assessment_attempts aa
         JOIN students s ON s.id = aa.student_id
         WHERE (s.institution_id = $1 OR s.institution_id::text = $2) AND aa.status = 'Completed'
       )
       SELECT 
         COALESCE(ROUND(AVG(first.score)), 0)::int as initial_score,
         COALESCE(ROUND(AVG(latest.score)), 0)::int as recent_score
       FROM ranked first
       JOIN ranked latest ON latest.student_id = first.student_id AND latest.rn_last = 1
       WHERE first.rn_first = 1`,
      [instUuid, String(instId)]
    );
    const imp = impRes.rows[0] || {};
    const assessmentImprovement = {
      initialScore: Number(imp.initial_score) || 0,
      recentScore: Number(imp.recent_score) || 0,
      improvement: (Number(imp.recent_score) || 0) - (Number(imp.initial_score) || 0)
    };

    return res.json({
      success: true,
      hasData,
      message: hasData ? null : 'No skill growth data available yet.',
      data: {
        departments: allDepartments,
        departmentGrowth: deptGrowthRes.rows.map(r => ({
          departmentId: r.department_id,
          departmentName: r.department_name,
          departmentCode: r.department_code,
          growthPercentage: r.average_growth,
          averageGrowth: r.average_growth,
          currentSkillScore: r.current_skill_score,
          studentCount: r.student_count
        })),
        skillDistribution,
        timeSeries,
        departmentComparison: deptGrowthRes.rows.map(r => ({
          department: r.department_code || r.department_name,
          avgScore: r.current_skill_score
        })),
        classComparison,
        assessmentImprovement
      }
    });
  } catch (err) {
    console.error('[GET /api/academic/skill-growth] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
router.get('/skill-growth', requireAuth, verifyInstitution, handleGetSkillGrowth);
router.get('/skill-growth-analytics', requireAuth, verifyInstitution, handleGetSkillGrowth);

// GET /api/academic/student-performance — Comprehensive Institution Student Performance List
router.get('/student-performance', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const instId = req.institutionId;
    const { department, classId, year, semester, academicianId, search } = req.query;

    if (!relationalManager.supabase) {
      return res.json({ success: true, data: [] });
    }

    const instRes = await relationalManager.query(
      `SELECT id FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1`,
      [String(instId)]
    );
    const instUuid = instRes.rows[0]?.id;

    let query = `
      SELECT s.id, s.full_name, s.roll_number, s.cgpa, s.batch, s.year_semester,
             d.name as department_name, d.code as department_code,
             c.name as class_name, c.section as class_section,
             u.email,
             ap.full_name as academician_name, ap.designation as academician_designation,
             COALESCE(sp.course_progress, (SELECT AVG(e.progress_percentage) FROM enrollments e WHERE e.student_id = s.id), 0)::int as course_progress,
             COALESCE(sp.avg_skill_score, (SELECT AVG(ss.confidence_score) FROM student_skills ss WHERE ss.student_id = s.id), 0)::int as skill_score,
             COALESCE(sp.avg_assessment_score, (SELECT AVG(aa.score) FROM assessment_attempts aa WHERE aa.student_id = s.id AND aa.status = 'Completed'), 0)::int as assessment_score,
             COALESCE(sp.certificates_count, (SELECT COUNT(*) FROM certificates cert WHERE cert.student_id = s.id), 0)::int as certificates,
             COALESCE(sp.readiness_score, s.readiness_score, 0)::int as industry_readiness,
             COALESCE(sp.readiness_status, CASE WHEN COALESCE(s.readiness_score, 0) >= 75 THEN 'Industry Ready' WHEN COALESCE(s.readiness_score, 0) >= 60 THEN 'Near Ready' ELSE 'Needs Support' END) as readiness_status,
             COALESCE(sp.last_activity, s.updated_at, s.created_at) as last_activity
      FROM students s
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN student_staff_mapping m ON m.student_id = s.id AND m.is_active = true
      LEFT JOIN academician_profiles ap ON ap.user_id = m.staff_id
      LEFT JOIN student_performance sp ON sp.student_id = s.id
      WHERE (s.institution_id = $1 OR s.institution_id::text = $2)
    `;
    const params = [instUuid, String(instId)];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(s.full_name) ILIKE $${params.length} OR LOWER(s.roll_number) ILIKE $${params.length} OR LOWER(COALESCE(u.email, '')) ILIKE $${params.length})`;
    }
    if (department && department !== 'All') {
      params.push(department);
      query += ` AND (d.id::text = $${params.length} OR d.code = $${params.length} OR d.name = $${params.length})`;
    }
    if (classId && classId !== 'All') {
      params.push(classId);
      query += ` AND s.class_id::text = $${params.length}`;
    }
    if (year && year !== 'All') {
      params.push(year);
      query += ` AND (s.batch = $${params.length} OR s.graduation_year::text = $${params.length})`;
    }
    if (academicianId && academicianId !== 'All') {
      params.push(academicianId);
      query += ` AND m.staff_id::text = $${params.length}`;
    }

    query += ` ORDER BY s.full_name ASC`;
    const resDb = await relationalManager.query(query, params);

    return res.json({
      success: true,
      data: resDb.rows.map(r => ({
        id: r.id,
        studentId: r.id,
        name: r.full_name,
        rollNumber: r.roll_number || 'N/A',
        department: r.department_name || 'Engineering',
        departmentCode: r.department_code || '',
        class: r.class_name ? `${r.class_name} ${r.class_section || ''}`.trim() : 'Unassigned',
        academician: r.academician_name || 'Not Assigned',
        academicianDesignation: r.academician_designation || '',
        courseProgress: r.course_progress,
        skillScore: r.skill_score,
        assessmentScore: r.assessment_score,
        certificates: r.certificates,
        industryReadiness: r.industry_readiness,
        readinessStatus: r.readiness_status,
        lastActivity: r.last_activity,
        email: r.email
      }))
    });
  } catch (err) {
    console.error('[GET /api/academic/student-performance] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Students ----------
router.get('/students', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const students = await relationalManager.getStudents(req.institutionId);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/students/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const student = await relationalManager.getStudentById(req.params.id);
    const targetInst = String(req.institutionId || '').toUpperCase().trim();
    const sInstId = String(student?.institutionId || student?.institution_id || student?.collegeId || '').toUpperCase().trim();
    const isSameInst = sInstId === targetInst;
    const belongsToInst = student && (isSameInst || req.user?.role === 'admin');
    if (!student || !belongsToInst) {
      return res.status(404).json({ success: false, message: 'Student not found in your institution' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Courses & Skills ----------
router.get('/courses', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const courses = await relationalManager.getCourses(req.institutionId);
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/courses', requireAuth, verifyInstitution, async (req, res) => {
  try {
    if (!['admin', 'institution'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    }
    const created = await relationalManager.createCourse({ ...req.body, institutionId: req.institutionId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/courses/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const course = await relationalManager.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Master Skill Endpoints (10-Step Wizard) ----------
router.get('/skills', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { status } = req.query;
    const result = await relationalManager.getInstitutionSkills(req.institutionId, status || null);
    res.json({ success: true, data: result.skills, metrics: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/skills/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const skill = await relationalManager.getCourseById(req.params.id) || await relationalManager.getSkillById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Course not found' });
    if (skill.institutionId && req.institutionId && String(skill.institutionId).toUpperCase() !== String(req.institutionId).toUpperCase() && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this skill' });
    }
    res.json({ success: true, data: skill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/skills', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const isPublish = req.body.isPublish === true || req.body.status === 'PUBLISHED';
    const saved = await relationalManager.saveSkill(req.institutionId, req.body, isPublish);
    res.status(201).json({
      success: true,
      message: isPublish ? 'Skill published successfully and eligible students notified.' : 'Skill draft saved successfully.',
      data: saved
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/skills/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const isPublish = req.body.isPublish === true || req.body.status === 'PUBLISHED';
    const saved = await relationalManager.saveSkill(req.institutionId, { ...req.body, id: req.params.id }, isPublish);
    res.json({
      success: true,
      message: isPublish ? 'Skill published successfully.' : 'Skill draft updated successfully.',
      data: saved
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/skills/:id/archive', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const archived = await relationalManager.archiveSkill(req.params.id, req.institutionId);
    res.json({ success: true, message: 'Skill archived successfully.', data: archived });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ---------- Enrollments & Requests Management ----------
router.get('/enrollment-requests', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const requests = await relationalManager.getPendingEnrollmentRequests(req.institutionId);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/enrollments/:id/approve', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const updated = await relationalManager.updateEnrollmentStatus(req.params.id, req.institutionId, 'APPROVED');
    res.json({ success: true, message: 'Enrollment request approved. Student has been notified.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/enrollments/:id/reject', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await relationalManager.updateEnrollmentStatus(req.params.id, req.institutionId, 'REJECTED', reason);
    res.json({ success: true, message: 'Enrollment request rejected. Student has been notified.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/enrollments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { studentId } = req.query;
    const enrollments = await relationalManager.getEnrollments(studentId);
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/enrollments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { student, course } = req.body;
    const courseObj = await relationalManager.getCourseById(course);
    if (!courseObj || courseObj.institutionId !== req.institutionId) {
      return res.status(400).json({ success: false, message: 'Course does not belong to your institution' });
    }
    const enrollment = await relationalManager.enrollCourse(student, course);
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Dashboard ----------
router.get('/dashboard', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const dashboard = await relationalManager.getInstitutionDashboard(req.institutionId);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Skill Analytics ----------
router.get('/skill-analytics', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const analytics = await relationalManager.getSkillAnalytics(req.institutionId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/skill-analytics/:skillId', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const skill = await relationalManager.getSkillAnalyticsById(req.params.skillId, req.institutionId);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    res.json({ success: true, data: skill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Skill Intelligence & Enrolled Students ----------
router.get('/skills/:skillId/students', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const skill = await relationalManager.getSkillById(req.params.skillId);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (String(skill.institutionId).toUpperCase() !== String(req.institutionId).toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You cannot access students for another institution\'s skill' });
    }
    const students = await relationalManager.getInstitutionSkillStudents(req.params.skillId, req.institutionId);
    res.json({ success: true, data: students, count: students.length });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.get('/skills/:skillId/intelligence', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const analytics = await relationalManager.getInstitutionSkillAnalytics(req.params.skillId, req.institutionId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ---------- Readiness ----------
router.get('/readiness', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const students = await relationalManager.getStudents(req.institutionId);
    const readinessList = await Promise.all(students.map(s => relationalManager.getReadiness(s.studentId)));
    const result = students.map((s, i) => ({ studentId: s.studentId, readinessScore: readinessList[i] }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/readiness/:studentId', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const student = await relationalManager.getStudentByIdWithOwnership(req.params.studentId, req.institutionId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found in your institution' });
    const readinessScore = await relationalManager.getReadiness(student.studentId);
    res.json({ success: true, data: { studentId: student.studentId, readinessScore } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// ---------- Communication Skill Intelligence ----------
router.get('/communication-analytics', requireAuth, verifyInstitution, async (req, res) => {
  try {
    // Only mapped students for this institution
    const students = await relationalManager.getStudents(req.institutionId);
    const mappedStudents = Array.isArray(students) ? students : [];

    // Filter students with actual recorded communication activities
    const activeStudents = mappedStudents.filter(s => {
      const comm = s.communication;
      return comm && Array.isArray(comm.activities) && comm.activities.length > 0;
    });

    const totalActive = activeStudents.length;

    // Calculate averages across active students
    let avgOverall = 0;
    let avgVocab = 0;
    let avgGrammar = 0;
    let avgReading = 0;
    let avgListening = 0;
    let avgSpeaking = 0;
    let avgConversation = 0;

    const distribution = {
      beginner: 0,     // < 40%
      developing: 0,   // 40% - 69%
      intermediate: 0, // 70% - 84%
      advanced: 0      // 85% - 100%
    };

    if (totalActive > 0) {
      let sumOverall = 0;
      let sumVocab = 0;
      let sumGrammar = 0;
      let sumReading = 0;
      let sumListening = 0;
      let sumSpeaking = 0;
      let sumConversation = 0;

      activeStudents.forEach(s => {
        const c = s.communication || {};
        const cats = c.categories || {};
        const overall = Number(c.overallScore) || 0;

        sumOverall += overall;
        sumVocab += Number(cats.vocabulary?.score ?? cats.vocabulary ?? 0);
        sumGrammar += Number(cats.grammar?.score ?? cats.grammar ?? 0);
        sumReading += Number(cats.reading?.score ?? cats.reading ?? 0);
        sumListening += Number(cats.listening?.score ?? cats.listening ?? 0);
        sumSpeaking += Number(cats.speaking?.score ?? cats.speaking ?? 0);
        sumConversation += Number(cats.conversation?.score ?? cats.conversation ?? 0);

        if (overall >= 85) distribution.advanced++;
        else if (overall >= 70) distribution.intermediate++;
        else if (overall >= 40) distribution.developing++;
        else distribution.beginner++;
      });

      avgOverall = Math.round(sumOverall / totalActive);
      avgVocab = Math.round(sumVocab / totalActive);
      avgGrammar = Math.round(sumGrammar / totalActive);
      avgReading = Math.round(sumReading / totalActive);
      avgListening = Math.round(sumListening / totalActive);
      avgSpeaking = Math.round(sumSpeaking / totalActive);
      avgConversation = Math.round(sumConversation / totalActive);
    }

    res.json({
      success: true,
      data: {
        institutionId: req.institutionId,
        totalMappedStudents: mappedStudents.length,
        activeCommunicationStudents: totalActive,
        participationRate: mappedStudents.length > 0 ? Math.round((totalActive / mappedStudents.length) * 100) : 0,
        averageCommunicationSkill: avgOverall,
        categories: {
          vocabulary: avgVocab,
          grammar: avgGrammar,
          reading: avgReading,
          listening: avgListening,
          speaking: avgSpeaking,
          conversation: avgConversation
        },
        distribution
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Placement Drives ----------
router.get('/placement-drives', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const drives = await relationalManager.getPlacementDrives(req.institutionId);
    res.json({ success: true, data: drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/placement-drives', requireAuth, verifyInstitution, async (req, res) => {
  try {
    if (!['admin', 'institution'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    const created = await relationalManager.createPlacementDrive({ ...req.body, institutionId: req.institutionId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.put('/placement-drives/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    if (!['admin', 'institution'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    const updated = await relationalManager.updatePlacementDrive(req.params.id, { ...req.body, institutionId: req.institutionId });
    if (!updated) return res.status(404).json({ success: false, message: 'Placement drive not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/placement-drives/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const drive = await relationalManager.getPlacementDriveById(req.params.id, req.institutionId);
    if (!drive) return res.status(404).json({ success: false, message: 'Placement drive not found' });
    res.json({ success: true, data: drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Applications & Placement Pipeline ----------
router.get(['/applications', '/pipeline'], requireAuth, verifyInstitution, async (req, res) => {
  try {
    const apps = await relationalManager.getApplicationsByInstitution(req.institutionId);
    res.json({ success: true, data: apps || [], applications: apps || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/applications/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const app = await relationalManager.getApplicationById(req.params.id, req.institutionId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/applications/:id/select', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const selected = await relationalManager.selectStudentForTesting(req.params.id, {
      userId: req.user?.id,
      role: 'institution'
    });
    res.json({ success: true, message: 'Student successfully selected for company testing.', data: selected });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/applications/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });
    const updated = await relationalManager.updateApplicationStage(req.params.id, stage, req.user?.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/applications/:id/stage', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });
    const updated = await relationalManager.updateApplicationStage(req.params.id, stage, req.user?.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Collaborations & Campus Directory ----------
router.get('/collaborations', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const collabs = await relationalManager.getCollaborationsForInstitution(req.institutionId);
    res.json({ success: true, data: collabs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/collaborations', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { targetInstitutionId, message } = req.body;
    if (!targetInstitutionId) return res.status(400).json({ success: false, message: 'targetInstitutionId is required' });
    const created = await relationalManager.createInstitutionCollaborationRequest(req.institutionId, targetInstitutionId, message);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/collaborations/:id/respond', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { action, type, isCompany } = req.body;
    if (type === 'company' || isCompany) {
      const updated = await relationalManager.respondToCompanyPartnership(req.params.id, req.institutionId, action);
      return res.json({ success: true, data: updated });
    }
    const updated = await relationalManager.respondToInstitutionCollaboration(req.params.id, req.institutionId, action);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Partner Companies & Opportunities ----------
router.get('/companies', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const comps = await relationalManager.getCompaniesForInstitution(req.institutionId);
    res.json({ success: true, data: comps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/opportunities', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const opps = await relationalManager.getOpportunitiesForInstitution(req.institutionId);
    res.json({ success: true, data: opps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/projects', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const projects = await relationalManager.getInstitutionProjects(req.institutionId, req.query);
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Partnerships ----------
router.put('/partnerships/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    if (!['admin', 'institution'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    const updated = await relationalManager.updatePartnership(req.params.id, { ...req.body, institutionId: req.institutionId });
    if (!updated) return res.status(404).json({ success: false, message: 'Partnership not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Industry Student Access Requests ----------
router.get('/industry-requests', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const requests = await relationalManager.getInstitutionAccessRequests(req.institutionId);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post(['/industry-requests', '/companies/request-access'], requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { companyId, studentIds, message } = req.body;
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId is required' });

    let finalStudentIds = Array.isArray(studentIds) && studentIds.length > 0 ? studentIds : [];
    if (finalStudentIds.length === 0) {
      const instStudents = await relationalManager.getStudents(req.institutionId);
      finalStudentIds = instStudents.map(s => s.id || s.studentId);
    }

    const request = await relationalManager.createStudentAccessRequest({
      institutionId: req.institutionId,
      companyId,
      studentIds: finalStudentIds,
      message,
      requestedByUserId: req.user?.id
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/industry-requests/:id/revoke', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const result = await relationalManager.revokeCompanyAccess(req.params.id, { institutionId: req.institutionId });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Institution Assessment Tests ----------
router.get('/assessments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const assessments = await relationalManager.getInstitutionAssessments(req.institutionId);
    res.json({ success: true, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { title, assessmentType, durationMinutes, totalMarks, difficulty } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Assessment title is required' });

    const assessment = await relationalManager.createInstitutionAssessment({
      institutionId: req.institutionId,
      title,
      assessmentType: assessmentType || 'LOGICAL',
      durationMinutes,
      totalMarks,
      difficulty
    });
    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/assessments/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const assessment = await relationalManager.getAssessmentQuestionsForStudent(req.params.id, null);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/assessments/:id/results', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const results = await relationalManager.getInstitutionAssessmentResults(req.params.id, req.institutionId);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/:id/questions', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const question = await relationalManager.addAssessmentQuestion(req.params.id, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/assessments/:id/publish', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const result = await relationalManager.publishInstitutionAssessment(req.params.id, req.institutionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Programming Languages & Course Mapping ----------
router.get('/programming-languages', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const langs = await relationalManager.getProgrammingLanguages();
    res.json({ success: true, data: langs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/courses/:courseId/languages', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const langs = await relationalManager.getCourseProgrammingLanguages(req.params.courseId);
    res.json({ success: true, data: langs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ONBOARDING SETUP & ROSTER IMPORT ROUTES
// ══════════════════════════════════════════════════════════════════════════

// GET /api/academic/setup/status
router.get('/setup/status', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const status = await relationalManager.getInstitutionSetupStatus(req.institutionId);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/academic/setup/institution
router.post('/setup/institution', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const updated = await relationalManager.updateInstitutionSetup(req.institutionId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/academic/departments
router.get('/departments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const depts = await relationalManager.getInstitutionDepartments(req.institutionId);
    res.json({ success: true, data: depts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/academic/departments
router.post('/departments', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required' });
    }
    const result = await relationalManager.createDepartment(req.institutionId, { code, name });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/academic/template/download
router.get('/template/download', requireAuth, verifyInstitution, (req, res) => {
  const csvContent = rosterService.generateTemplateCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="SkillNexus_Student_Roster_Template.csv"');
  res.send(csvContent);
});

// POST /api/academic/roster/preview
router.post('/roster/preview', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { csvContent, fileName } = req.body;
    if (!csvContent) {
      return res.status(400).json({ success: false, message: 'CSV content is required for preview' });
    }

    const institutionDepartments = await relationalManager.getInstitutionDepartments(req.institutionId);
    const existingStudents = await relationalManager.getStudents(req.institutionId);

    const preview = rosterService.validateAndPreviewRoster({
      rawContent: csvContent,
      institutionDepartments,
      existingStudents
    });

    res.json(preview);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/academic/roster/confirm
router.post('/roster/confirm', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { validRows, fileName } = req.body;
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows to commit' });
    }

    const adminUserId = req.user?.id || req.user?.userId;
    const result = await relationalManager.upsertStudentRoster(req.institutionId, validRows, adminUserId, fileName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/academic/students/manual
router.post('/students/manual', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    const result = await relationalManager.createManualStudent(req.institutionId, req.body, adminUserId);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/academic/students/:id/resend-invite
router.post('/students/:id/resend-invite', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const result = await relationalManager.resendStudentInvitation(req.institutionId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/academic/students/:id/status
router.patch('/students/:id/status', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const result = await relationalManager.updateStudentAccountStatus(req.institutionId, req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/academic/roster/imports
router.get('/roster/imports', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const history = await relationalManager.getRosterImports(req.institutionId);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Course Certificates Verification ----------
router.get('/course-certificates', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const certificates = await relationalManager.getCourseCertificatesForInstitution(req.institutionId);
    res.json({ success: true, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/course-certificates/:id/verify', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { notes } = req.body || {};
    const result = await relationalManager.verifyCourseCertificate(req.params.id, req.institutionId, 'VERIFIED', notes, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/course-certificates/:id/reject', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { notes, reason } = req.body || {};
    const result = await relationalManager.verifyCourseCertificate(req.params.id, req.institutionId, 'REJECTED', reason || notes, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Student Certificate Verification Workspace ----------
router.get('/certificates', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const result = await relationalManager.getInstitutionCertificates(req.institutionId, req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/certificates/analytics', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const analytics = await relationalManager.getInstitutionCertificateAnalytics(req.institutionId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/certificates/:id', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const cert = await relationalManager.getInstitutionCertificateById(req.institutionId, req.params.id);
    const student = await relationalManager.getStudentById(cert.studentId);
    res.json({
      success: true,
      data: {
        ...cert,
        studentDetails: student ? {
          name: student.name,
          email: student.email,
          regNo: student.regNo || student.registerNumber,
          department: student.department,
          year: student.year,
          readinessScore: student.readinessScore || student.careerReadinessScore || 0
        } : null,
        viewUrl: `/api/certificates/${cert.id}/view`,
        downloadUrl: `/api/certificates/${cert.id}/download`
      }
    });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 403;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/certificates/:id/verify', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const reviewerInfo = {
      id: req.user?.id,
      name: req.user?.name || req.user?.email || 'Institution Reviewer',
      email: req.user?.email
    };
    const verified = await relationalManager.verifyStudentCertificate(req.institutionId, req.params.id, reviewerInfo);
    res.json({
      success: true,
      message: 'Certificate successfully verified and associated with student verified skills.',
      data: verified
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/certificates/:id/reject', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { reason, notes, rejectionReason } = req.body || {};
    const finalReason = rejectionReason || reason || notes;
    if (!finalReason || !String(finalReason).trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    }
    const reviewerInfo = {
      id: req.user?.id,
      name: req.user?.name || req.user?.email || 'Institution Reviewer',
      email: req.user?.email
    };
    const rejected = await relationalManager.rejectStudentCertificate(req.institutionId, req.params.id, reviewerInfo, finalReason);
    res.json({
      success: true,
      message: 'Certificate rejected with feedback recorded.',
      data: rejected
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/certificates/:id/request-correction', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { reason, notes, correctionReason } = req.body || {};
    const finalReason = correctionReason || reason || notes;
    if (!finalReason || !String(finalReason).trim()) {
      return res.status(400).json({ success: false, message: 'Correction details are mandatory.' });
    }
    const reviewerInfo = {
      id: req.user?.id,
      name: req.user?.name || req.user?.email || 'Institution Reviewer',
      email: req.user?.email
    };
    const updated = await relationalManager.requestCertificateCorrection(req.institutionId, req.params.id, reviewerInfo, finalReason);
    res.json({
      success: true,
      message: 'Correction request dispatched to student.',
      data: updated
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/certificates/:id/review', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const reviewerInfo = {
      id: req.user?.id,
      name: req.user?.name || req.user?.email || 'Institution Reviewer',
      email: req.user?.email
    };
    const updated = await relationalManager.reviewStudentCertificate(req.institutionId, req.params.id, reviewerInfo);
    res.json({
      success: true,
      message: 'Certificate status marked as under review.',
      data: updated
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ---------- Institution Skill Gaps ----------
router.get('/skill-gaps', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const intelligence = await relationalManager.getInstitutionSkillGapIntelligence(req.institutionId);
    res.json({ success: true, data: intelligence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Institution Student Project Verification (Pillars 2 & 3) ----------
router.get('/projects/queue', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const projects = await relationalManager.getInstitutionProjects(req.institutionId, req.query);
    res.json({ success: true, data: projects, count: projects.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/projects/analytics', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const analytics = await relationalManager.getInstitutionProjectAnalytics(req.institutionId);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/projects/:id/verify', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { notes } = req.body || {};
    const verified = await relationalManager.verifyStudentProject(req.institutionId, req.params.id, notes);
    res.json({
      success: true,
      message: 'Project verified successfully by institution and linked to student skill evidence.',
      data: verified
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/projects/:id/reject', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { reason, notes, rejectionReason } = req.body || {};
    const finalReason = rejectionReason || reason || notes;
    if (!finalReason || !String(finalReason).trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    }
    const rejected = await relationalManager.rejectStudentProject(req.institutionId, req.params.id, finalReason);
    res.json({
      success: true,
      message: 'Project rejected with mandatory review feedback.',
      data: rejected
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.post('/projects/:id/request-correction', requireAuth, verifyInstitution, async (req, res) => {
  try {
    const { reason, notes, correctionReason } = req.body || {};
    const finalReason = correctionReason || reason || notes;
    if (!finalReason || !String(finalReason).trim()) {
      return res.status(400).json({ success: false, message: 'Correction details are mandatory.' });
    }
    const updated = await relationalManager.requestProjectCorrection(req.institutionId, req.params.id, finalReason);
    res.json({
      success: true,
      message: 'Correction request dispatched to student.',
      data: updated
    });
  } catch (err) {
    const status = err.message.includes('Unauthorized') ? 403 : err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

module.exports = router;
