/**
 * SKILL NEXUS — Skill Growth & Performance Engine
 * Supabase-Native Architecture
 * 
 * Manages automatic skill evaluation, growth percentage calculation,
 * historical ledger updates, and student_performance synchronization
 * entirely through the Supabase JavaScript Client.
 */

const { supabase } = require('../config/supabase');

/**
 * Normalizes skill categories to standard set
 */
function normalizeSkillCategory(rawCategory) {
  const str = String(rawCategory || '').trim().toLowerCase();
  if (str.includes('program') || str.includes('code') || str.includes('developer') || str.includes('software')) return 'Programming';
  if (str.includes('aptitude') || str.includes('quant') || str.includes('math')) return 'Aptitude';
  if (str.includes('logic') || str.includes('reason')) return 'Logical Reasoning';
  if (str.includes('communicat') || str.includes('soft')) return 'Communication';
  if (str.includes('problem') || str.includes('algori')) return 'Problem Solving';
  if (str.includes('data') || str.includes('cloud') || str.includes('tech')) return 'Technical Skills';
  return 'Programming';
}

/**
 * Records an assessment attempt's effect on student skills and skill growth.
 */
async function recordAssessmentSkillGrowth({ studentId, assessmentId, score, rawCategory = null }) {
  try {
    // 1. Resolve student record
    const { data: student, error: stuErr } = await supabase
      .from('students')
      .select('id, institution_id, department_id, class_id, full_name')
      .or(`id.eq.${studentId},user_id.eq.${studentId},roll_number.eq.${studentId}`)
      .limit(1)
      .maybeSingle();

    if (stuErr || !student) {
      console.warn('[skillGrowthEngine] Student not found for ID:', studentId);
      return null;
    }

    // 2. Resolve skill category
    let skillCategoryName = rawCategory;
    if (!skillCategoryName && assessmentId) {
      const { data: asmt } = await supabase
        .from('assessments')
        .select('domain, assessment_type, title, categories')
        .or(`id.eq.${assessmentId},track_code.eq.${assessmentId}`)
        .limit(1)
        .maybeSingle();

      if (asmt) {
        skillCategoryName = asmt.domain || asmt.assessment_type || asmt.title;
      }
    }
    const standardSkillName = normalizeSkillCategory(skillCategoryName);

    // 3. Find or insert the skill in skills table
    let skillId = null;
    const { data: existingSkill } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', standardSkillName)
      .limit(1)
      .maybeSingle();

    if (existingSkill) {
      skillId = existingSkill.id;
    } else {
      const { data: catLookup } = await supabase
        .from('skill_categories')
        .select('id')
        .ilike('name', `%${standardSkillName}%`)
        .limit(1)
        .maybeSingle();

      let resolvedCatId = catLookup?.id;
      if (!resolvedCatId) {
        const { data: fallbackCat } = await supabase.from('skill_categories').select('id').limit(1).maybeSingle();
        resolvedCatId = fallbackCat?.id;
      }

      const { data: newSkill } = await supabase
        .from('skills')
        .insert({
          name: standardSkillName,
          category_id: resolvedCatId,
          description: `${standardSkillName} assessment verified skill`,
          difficulty: 'Intermediate',
          industry_demand: 'HIGH',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      skillId = newSkill?.id;
    }

    // 4. Query current/previous score in student_skills
    const { data: prevSkill } = await supabase
      .from('student_skills')
      .select('id, confidence_score')
      .eq('student_id', student.id)
      .eq('skill_id', skillId)
      .limit(1)
      .maybeSingle();

    const previousScore = prevSkill ? (Number(prevSkill.confidence_score) || 0) : 0;
    const scoreVal = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

    // Defined calculation:
    // If first attempt: new_score = score
    // If subsequent: weighted moving average (40% prev + 60% latest)
    const newScore = previousScore > 0 ? Math.round((previousScore * 0.4) + (scoreVal * 0.6)) : scoreVal;
    const growthPercentage = previousScore > 0 ? Math.round(((newScore - previousScore) / previousScore) * 100) : scoreVal;

    // 5. Append historical event to student_skill_history
    const resolvedAssessmentUuid = assessmentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(assessmentId))
      ? String(assessmentId)
      : null;

    await supabase.from('student_skill_history').insert({
      student_id: student.id,
      skill_id: skillId,
      skill_name: standardSkillName,
      previous_score: previousScore,
      new_score: newScore,
      growth_percentage: growthPercentage,
      assessment_id: resolvedAssessmentUuid,
      source: 'Skill Assessment Test',
      recorded_at: new Date().toISOString()
    });

    // 6. Update student_skills record
    const levelStr = newScore >= 85 ? 'Expert' : newScore >= 70 ? 'Advanced' : newScore >= 50 ? 'Intermediate' : 'Beginner';
    if (prevSkill) {
      await supabase
        .from('student_skills')
        .update({
          confidence_score: newScore,
          verified_level: levelStr,
          verification_status: 'VERIFIED',
          last_updated: new Date().toISOString()
        })
        .eq('id', prevSkill.id);
    } else {
      await supabase.from('student_skills').insert({
        student_id: student.id,
        skill_id: skillId,
        self_rating: 4,
        claimed_level: 'Intermediate',
        verified_level: levelStr,
        confidence_score: newScore,
        verification_status: 'VERIFIED',
        last_updated: new Date().toISOString()
      });
    }

    // 7. Update student_performance aggregate
    const { data: allSkills } = await supabase.from('student_skills').select('confidence_score').eq('student_id', student.id);
    const { data: allAttempts } = await supabase.from('assessment_attempts').select('score').eq('student_id', student.id).eq('status', 'Completed');
    const { data: allEnrollments } = await supabase.from('enrollments').select('progress_percentage').eq('student_id', student.id);
    const { count: certCnt } = await supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('student_id', student.id);
    const { count: projCnt } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('student_id', student.id);

    const avgSkill = allSkills && allSkills.length > 0
      ? allSkills.reduce((acc, s) => acc + (Number(s.confidence_score) || 0), 0) / allSkills.length
      : newScore;
    const avgAsmt = allAttempts && allAttempts.length > 0
      ? allAttempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0) / allAttempts.length
      : scoreVal;
    const avgProgress = allEnrollments && allEnrollments.length > 0
      ? allEnrollments.reduce((acc, e) => acc + (Number(e.progress_percentage) || 0), 0) / allEnrollments.length
      : 0;

    const readinessScore = Math.round((avgSkill * 0.4) + (avgAsmt * 0.4) + (avgProgress * 0.2));
    const readinessStatus = readinessScore >= 75 ? 'Industry Ready' : readinessScore >= 60 ? 'Near Ready' : 'Needs Support';

    await supabase.from('student_performance').upsert({
      student_id: student.id,
      institution_id: student.institution_id,
      department_id: student.department_id,
      class_id: student.class_id,
      course_progress: avgProgress,
      avg_skill_score: avgSkill,
      avg_assessment_score: avgAsmt,
      certificates_count: certCnt || 0,
      projects_count: projCnt || 0,
      readiness_score: readinessScore,
      readiness_status: readinessStatus,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id' });

    // Also update readiness_score in students table
    await supabase.from('students').update({
      readiness_score: readinessScore,
      updated_at: new Date().toISOString()
    }).eq('id', student.id);

    return {
      success: true,
      studentId: student.id,
      skillName: standardSkillName,
      previousScore,
      newScore,
      growthPercentage,
      readinessScore,
      readinessStatus
    };
  } catch (err) {
    console.error('[skillGrowthEngine] Error recording skill growth:', err);
    throw err;
  }
}

module.exports = {
  recordAssessmentSkillGrowth,
  normalizeSkillCategory
};
