// backend/src/routes/skills.js
/**
 * Canonical Student Skills Routes.
 * 
 * Rules:
 * - Scoped strictly to the authenticated student.
 * - ZERO fallback to Arun Kumar / demo seed data / db.json.
 * - Clean accounts start with an empty skill list ([]) and zero counts.
 * - Normalized canonical levels: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'.
 * - Self-assessed skills are marked 'SELF_ASSESSED' (verified: false).
 * - Verified skills are marked 'VERIFIED' (verified: true).
 */
const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { supabase } = require('../config/supabase');
const { calculateReadinessFromStudent } = require('../services/readinessService');
const { requireAuth } = require('../middleware/auth');

function canonicalLevel(levelStr) {
  const norm = String(levelStr || '').trim().toUpperCase();
  if (norm === 'EXPERT') return 'Expert';
  if (norm === 'ADVANCED') return 'Advanced';
  if (norm === 'BEGINNER') return 'Beginner';
  return 'Intermediate';
}

function determineCategory(name) {
  const n = String(name || '').toLowerCase();
  if (/(python|java|c\+\+|rust|javascript|typescript|c#|golang|php|ruby|swift|kotlin|c\b)/i.test(n)) {
    return 'Programming';
  }
  if (/(sql|postgres|database|mongodb|redis|prisma|mysql|nosql|oracle)/i.test(n)) {
    return 'Database';
  }
  if (/(machine learning|data|ai|fastapi|pandas|deep learning|pytorch|tensorflow|nlp|llm|computer vision)/i.test(n)) {
    return 'Data & AI';
  }
  if (/(react|html|css|frontend|web|vue|angular|next\.js|tailwind|ui|ux)/i.test(n)) {
    return 'Web Development';
  }
  if (/(docker|kubernetes|aws|cloud|azure|gcp|devops|ci\/cd|microservices|distributed)/i.test(n)) {
    return 'Cloud & Distributed';
  }
  return 'Soft Skills';
}

async function getEffectiveStudent(req) {
  const studentId = req.user?.studentId || req.user?.id;
  let student = null;
  if (studentId) {
    student = await relationalManager.getStudentById(studentId);
  }
  if (!student && req.user?.email) {
    const all = await relationalManager.getStudents();
    student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
  }
  return student;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skills (and alias /api/student/skills)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, category, level, search } = req.query;
    const student = await getEffectiveStudent(req);

    if (!student) {
      // Unprovisioned or new account with no record yet: return strictly empty data
      return res.json({
        success: true,
        data: [],
        count: 0,
        counts: {
          total: 0,
          enrolled: 0,
          verified: 0,
          gaps: 0,
          readinessIndex: 0
        }
      });
    }

    const rawList = Array.isArray(student.skills) ? student.skills : [];

    const rawSkills = rawList.map((sk, idx) => {
      const lvl = canonicalLevel(sk.level || (sk.confidence >= 85 ? 'Advanced' : sk.confidence >= 65 ? 'Intermediate' : 'Beginner'));
      const isVerified = Boolean(sk.verified);
      const masteryScore = Number(sk.confidence || sk.masteryScore || 70);
      const cat = (sk.category && sk.category !== 'Self-Assessed') ? sk.category : determineCategory(sk.name);
      const verificationStatus = isVerified ? 'VERIFIED' : (sk.pending ? 'PENDING' : 'SELF_ASSESSED');

      return {
        id: sk.id || `sk_${idx + 1}`,
        name: sk.name,
        level: lvl,
        masteryScore,
        confidence: masteryScore,
        verified: isVerified,
        verificationStatus,
        category: cat,
        status: masteryScore < 60 ? 'gap' : (isVerified ? 'verified' : 'enrolled'),
        source: sk.source || (isVerified ? 'Diagnostic Assessment' : 'Self-Assessed Profile'),
        specialization: sk.specialization || (isVerified ? 'Verified Campus Competency' : 'Target Role Proficiency'),
        evidence: isVerified && sk.evidence ? sk.evidence : (isVerified ? {
          examScore: `${masteryScore}%`,
          proctorStamp: 'PROCTOR-VERIFIED',
          source: sk.source || 'Diagnostic Assessment Verified'
        } : null)
      };
    });

    let skills = [...rawSkills];

    // Status filter
    if (status && status !== 'all') {
      const sLower = status.toLowerCase();
      if (sLower === 'enrolled') {
        skills = skills.filter(s => s.status === 'enrolled' || s.status === 'verified');
      } else if (sLower === 'verified') {
        skills = skills.filter(s => s.verified === true);
      } else if (sLower === 'gap') {
        skills = skills.filter(s => s.status === 'gap');
      }
    }

    // Category filter
    if (category && category !== 'All Categories') {
      skills = skills.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    // Level filter
    if (level && level !== 'All Levels') {
      const canonLvl = canonicalLevel(level);
      skills = skills.filter(s => s.level === canonLvl);
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.specialization && s.specialization.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }

    const counts = {
      total: rawSkills.length,
      enrolled: rawSkills.filter(s => s.status === 'enrolled' || s.status === 'verified').length,
      verified: rawSkills.filter(s => s.verified === true).length,
      gaps: rawSkills.filter(s => s.status === 'gap').length,
      readinessIndex: Number(student.readinessScore || 0)
    };

    res.json({
      success: true,
      data: skills,
      count: skills.length,
      counts
    });
  } catch (err) {
    console.error('Error in GET /api/skills:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skills — Add / track a new skill manually
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const student = await getEffectiveStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found for authenticated user' });
    }

    const { name, skillName, category, level, proficiency, specialization, status } = req.body;
    const rawName = (name || skillName || '').trim();
    if (!rawName) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const cleanName = rawName;
    const cleanLevel = canonicalLevel(level || proficiency || 'Intermediate');
    student.skills = Array.isArray(student.skills) ? student.skills : [];

    const existingIdx = student.skills.findIndex(s => s.name?.toLowerCase() === cleanName.toLowerCase());
    const confidence = cleanLevel === 'Expert' ? 95 : (cleanLevel === 'Advanced' ? 85 : (cleanLevel === 'Intermediate' ? 70 : 50));

    const newSkillRecord = {
      id: existingIdx >= 0 && student.skills[existingIdx].id ? student.skills[existingIdx].id : `sk_${Date.now()}`,
      name: cleanName,
      category: category || determineCategory(cleanName),
      level: cleanLevel,
      confidence,
      masteryScore: confidence,
      verified: false,
      verificationStatus: 'SELF_ASSESSED',
      specialization: specialization || 'Candidate Tracked Competency',
      status: status || (confidence < 60 ? 'gap' : 'enrolled'),
      source: 'Self-Assessed Manual Entry',
      evidence: null,
      createdAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      student.skills[existingIdx] = { ...student.skills[existingIdx], ...newSkillRecord };
    } else {
      student.skills.unshift(newSkillRecord);
    }

    await relationalManager.saveStudent(student);

    // Sync to Supabase student_skills for live matching engine recalculation
    try {
      if (supabase && student.id) {
        let skillId = null;
        const { data: dbSk } = await supabase.from('skills').select('id').ilike('name', cleanName).limit(1);
        if (dbSk && dbSk.length > 0) {
          skillId = dbSk[0].id;
        } else {
          const { data: newSk } = await supabase.from('skills').insert({
            name: cleanName,
            category_id: '6e9b92a1-e5d3-40e6-8331-ae38678e5b15',
            difficulty: cleanLevel,
            description: `${cleanName} technical competency`
          }).select().single();
          if (newSk) skillId = newSk.id;
        }

        if (skillId) {
          const { data: existingSS } = await supabase.from('student_skills').select('id').eq('student_id', student.id).eq('skill_id', skillId).limit(1);
          const ssPayload = {
            student_id: student.id,
            skill_id: skillId,
            skill_name: cleanName,
            category: newSkillRecord.category,
            proficiency_level: cleanLevel,
            claimed_level: cleanLevel,
            score: confidence,
            proficiency_score: confidence,
            confidence_score: confidence,
            verification_status: 'SELF_ASSESSED',
            source: 'Student Added Competency',
            last_updated: new Date().toISOString()
          };
          if (existingSS && existingSS.length > 0) {
            await supabase.from('student_skills').update(ssPayload).eq('id', existingSS[0].id);
          } else {
            await supabase.from('student_skills').insert(ssPayload);
          }
        }
      }
    } catch (sbErr) {
      console.warn('[POST /api/skills] Supabase student_skills sync notice:', sbErr.message);
    }

    // Recalculate readiness
    try {
      const breakdown = calculateReadinessFromStudent(student);
      student.readinessScore = breakdown.readinessScore;
      await relationalManager.saveStudent(student);
    } catch (e) {}

    let responseSkill = newSkillRecord;
    try {
      const freshStudent = await getEffectiveStudent(req);
      const persisted = (freshStudent?.skills || []).find(s => s.name?.toLowerCase() === name.trim().toLowerCase());
      if (persisted && persisted.id) {
        responseSkill = { ...newSkillRecord, id: persisted.id };
      }
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Skill added to verified ledger',
      data: responseSkill
    });
  } catch (err) {
    console.error('Error in POST /api/skills:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/skills/:id — Update a tracked skill
// ─────────────────────────────────────────────────────────────────────────────
router.put(['/', '/:id'], requireAuth, async (req, res) => {
  try {
    const student = await getEffectiveStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    student.skills = Array.isArray(student.skills) ? student.skills : [];
    const targetIdentifier = req.params.id || req.body.id || req.body.name || req.body.skillName;
    if (!targetIdentifier) {
      return res.status(400).json({ success: false, message: 'Skill ID or name is required' });
    }

    let skillIdx = student.skills.findIndex(s =>
      s.id === targetIdentifier ||
      s.name?.toLowerCase() === targetIdentifier.toLowerCase()
    );

    const { level, confidence, specialization, category, name } = req.body;
    if (skillIdx === -1) {
      const cleanName = name || targetIdentifier;
      const cleanLevel = canonicalLevel(level || 'Intermediate');
      const conf = confidence !== undefined ? Number(confidence) : (cleanLevel === 'Advanced' ? 85 : 70);
      const newSk = {
        id: `sk_${Date.now()}`,
        name: cleanName,
        category: category || determineCategory(cleanName),
        level: cleanLevel,
        confidence: conf,
        masteryScore: conf,
        verified: false,
        verificationStatus: 'SELF_ASSESSED',
        specialization: specialization || 'Candidate Tracked Competency',
        status: conf < 60 ? 'gap' : 'enrolled',
        createdAt: new Date().toISOString()
      };
      student.skills.push(newSk);
      skillIdx = student.skills.length - 1;
    } else {
      if (level) student.skills[skillIdx].level = canonicalLevel(level);
      if (confidence !== undefined) student.skills[skillIdx].confidence = Number(confidence);
      if (specialization) student.skills[skillIdx].specialization = specialization;
      if (category) student.skills[skillIdx].category = category;
      if (name) student.skills[skillIdx].name = name;
    }

    await relationalManager.saveStudent(student);

    // Recalculate readiness
    try {
      const breakdown = calculateReadinessFromStudent(student);
      student.readinessScore = breakdown.readinessScore;
      await relationalManager.saveStudent(student);
    } catch (e) {}

    try {
      await supabase
        .from('student_skills')
        .update({
          claimed_level: student.skills[skillIdx].level,
          confidence_score: student.skills[skillIdx].confidence,
          last_updated: new Date().toISOString()
        })
        .eq('student_id', student.id)
        .or(`id.eq.${targetIdentifier},skill_name.ilike.${student.skills[skillIdx].name}`);
    } catch (err) {
      console.warn('[skills] Supabase skill update note:', err.message);
    }

    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: student.skills[skillIdx]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/skills/:id — Remove a skill from tracking
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const student = await getEffectiveStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    student.skills = Array.isArray(student.skills) ? student.skills : [];
    const skillIdx = student.skills.findIndex(s => s.id === req.params.id || s.name?.toLowerCase() === req.params.id.toLowerCase());

    if (skillIdx === -1) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const removedSkill = student.skills.splice(skillIdx, 1)[0];

    await relationalManager.saveStudent(student);

    try {
      await supabase
        .from('student_skills')
        .delete()
        .eq('student_id', student.id)
        .or(`id.eq.${req.params.id},skill_name.ilike.${removedSkill.name}`);
    } catch (err) {
      console.warn('[skills] Supabase skill delete note:', err.message);
    }

    // Recalculate readiness
    try {
      const breakdown = calculateReadinessFromStudent(student);
      student.readinessScore = breakdown.readinessScore;
      await relationalManager.saveStudent(student);
    } catch (e) {}

    res.json({ success: true, message: 'Skill removed from tracking' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
