/**
 * SKILL NEXUS AI — Skill Gap Analysis REST API Routes
 * 
 * Endpoints for FEATURE 1: AI SKILL GAP ANALYSIS.
 * Supports:
 * - Target role & opportunity selection
 * - Student skill aggregation & normalized profiles
 * - Skill gap analysis execution & persistent reports
 * - Contextual learning recommendations
 * - Role-based access control (Student, Academician, Institution, Company, Admin)
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const skillGapEngine = require('../services/ai/skillGapEngine');
const studentSkillAggregator = require('../services/ai/studentSkillAggregator');
const { supabase } = require('../config/supabase');

async function getResolvedStudent(req) {
  const candidates = [req.user?.studentId, req.user?.id, req.user?.userId, req.user?.rollNumber].filter(Boolean);
  for (const c of candidates) {
    const s = await studentSkillAggregator.resolveStudent(c);
    if (s) return s;
  }
  if (req.user?.email) {
    try {
      const { data: u } = await supabase.from('users').select('id, students(*)').ilike('email', req.user.email).maybeSingle();
      if (u?.students?.[0]) return u.students[0];
      if (Array.isArray(u?.students)) return u.students[0];
    } catch {}
  }
  return null;
}

// 0. GET /api/skill-gap/me — Get authenticated student's active skill gap analysis
router.get('/me', requireAuth, async (req, res) => {
  try {
    const student = await getResolvedStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const targetRole = student.target_career_role || 'Full Stack Engineer';
    const analysis = await skillGapEngine.analyzeSkillGap(student.id, targetRole);
    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    console.error('[/api/skill-gap/me] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/skill-gap/roles — Get all selectable target roles & opportunities
// ─────────────────────────────────────────────────────────────────────────────
router.get('/roles', requireAuth, async (req, res) => {
  try {
    const data = await skillGapEngine.getTargetOptions();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[/api/skill-gap/roles] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/skill-gap/student-skills — Get aggregated student skill profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student-skills', requireAuth, async (req, res) => {
  try {
    const student = await getResolvedStudent(req);
    if (!student && req.user?.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student role required' });
    }

    const data = student ? await studentSkillAggregator.aggregateStudentSkills(student.id) : { skills: [], metrics: { total: 0 } };
    res.json({ success: true, data });
  } catch (err) {
    console.error('[/api/skill-gap/student-skills] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/skill-gap/analyze — Execute Skill Gap Analysis
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    // Permit student analyzing self, or faculty/institution analyzing studentId passed in body
    let student = await getResolvedStudent(req);
    if ((req.user?.role === 'academician' || req.user?.role === 'faculty' || req.user?.role === 'institution') && req.body.studentId) {
      student = await studentSkillAggregator.resolveStudent(req.body.studentId);
    }

    if (!student) {
      return res.status(400).json({ success: false, message: 'Student record could not be resolved for authenticated session' });
    }

    const { targetType = 'CAREER_ROLE', targetId = null } = req.body;
    const report = await skillGapEngine.analyzeSkillGap(student.id, targetType, targetId);

    res.json({
      success: true,
      message: `Skill gap analysis calculated for ${report.targetTitle}`,
      data: report
    });
  } catch (err) {
    console.error('[/api/skill-gap/analyze] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/skill-gap/reports/latest — Get latest report for authenticated student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reports/latest', requireAuth, async (req, res) => {
  try {
    const resolved = await getResolvedStudent(req);
    if (!resolved) {
      return res.json({ success: true, data: null });
    }

    const { data: reports, error } = await supabase
      .from('skill_gap_reports')
      .select(`
        id,
        target_type,
        target_title,
        overall_readiness,
        strong_count,
        good_count,
        improve_count,
        missing_count,
        skill_analysis,
        ai_explanation,
        created_at,
        learning_recommendations (*)
      `)
      .eq('student_id', resolved.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    const latest = reports && reports[0] ? reports[0] : null;
    res.json({ success: true, data: latest });
  } catch (err) {
    console.error('[/api/skill-gap/reports/latest] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/skill-gap/reports/:id — Get report details by ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reports/:id', requireAuth, async (req, res) => {
  try {
    const { data: report, error } = await supabase
      .from('skill_gap_reports')
      .select(`
        *,
        learning_recommendations (*)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/skill-gap/recommendations — Get active recommendations
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const resolved = await getResolvedStudent(req);
    if (!resolved) {
      return res.json({ success: true, data: [] });
    }

    const { data: recs, error } = await supabase
      .from('learning_recommendations')
      .select('*')
      .eq('student_id', resolved.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, data: recs || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/skill-gap/cohort-analytics — Permitted College / Academician view
// ─────────────────────────────────────────────────────────────────────────────
router.get('/cohort-analytics', requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'academician' && role !== 'faculty' && role !== 'institution' && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied: Institutional access required' });
    }

    // Get recent reports across students in the institution
    const { data: reports, error } = await supabase
      .from('skill_gap_reports')
      .select(`
        id,
        target_title,
        overall_readiness,
        strong_count,
        missing_count,
        created_at,
        students (
          id,
          full_name,
          roll_number,
          batch,
          readiness_score
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const totalAnalyses = reports?.length || 0;
    const avgReadiness = totalAnalyses > 0
      ? Math.round(reports.reduce((acc, r) => acc + (r.overall_readiness || 0), 0) / totalAnalyses)
      : 0;

    res.json({
      success: true,
      data: {
        totalAnalyses,
        averageReadiness: avgReadiness,
        recentReports: reports || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /api/skill-gap/admin/roles — Admin create new career role benchmark
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/roles', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { title, category, description, minReadinessScore, skills } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: role, error: rErr } = await supabase
      .from('career_roles')
      .insert({
        title,
        slug,
        category,
        description: description || '',
        min_readiness_score: minReadinessScore || 75
      })
      .select('id')
      .single();

    if (rErr) throw rErr;

    if (Array.isArray(skills) && skills.length > 0) {
      const skillRows = skills.map(s => ({
        role_id: role.id,
        skill_name: s.skillName || s.name,
        category: s.category || category,
        importance: s.importance || 'HIGH',
        required_score: s.requiredScore || 75,
        min_level: s.minLevel || 'Intermediate',
        weight: s.weight || 1.0
      }));

      await supabase.from('role_required_skills').insert(skillRows);
    }

    res.status(201).json({ success: true, message: 'Role benchmark created successfully', data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
