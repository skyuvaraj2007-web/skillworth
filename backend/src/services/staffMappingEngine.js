/**
 * SKILLNEXUS AI — Staff Mapping Engine
 * Supabase-Native Architecture
 * 
 * Core business logic for:
 * 1. Automatic mapping: student.institution_id == staff.institution_id AND student.department_id == staff.department_id AND student.class_id == staff.class_id
 * 2. Automatic remapping when student changes Department or Class while preserving historical academic data.
 * 3. Retroactive mapping when a staff member is assigned to a class that already has registered students.
 * 4. Class progress analytics calculation.
 */

const { supabase } = require('../config/supabase');

/**
 * Maps a student to all active staff members assigned to their Institution + Department + Class.
 */
async function mapStudentToStaff(studentId) {
  try {
    const { data: student, error: stuErr } = await supabase
      .from('students')
      .select('id, institution_id, department_id, class_id, full_name')
      .eq('id', studentId)
      .limit(1)
      .maybeSingle();

    if (stuErr || !student) {
      return { success: false, message: 'Student not found.' };
    }

    if (!student.class_id) {
      return {
        success: true,
        status: 'PENDING_CLASS_ASSIGNMENT',
        message: 'Student does not have an assigned class yet.',
        mappedCount: 0
      };
    }

    // Query active staff assignments matching institution_id, department_id, class_id
    const { data: assignments } = await supabase
      .from('staff_assignments')
      .select('id, staff_id, assignment_type, is_primary')
      .eq('institution_id', student.institution_id)
      .eq('department_id', student.department_id)
      .eq('class_id', student.class_id)
      .ilike('status', 'active');

    let mappedCount = 0;
    const staffIds = [];

    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        const { data: existing } = await supabase
          .from('student_staff_mapping')
          .select('id')
          .eq('student_id', student.id)
          .eq('staff_id', assignment.staff_id)
          .eq('class_id', student.class_id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          await supabase.from('student_staff_mapping').insert({
            student_id: student.id,
            staff_id: assignment.staff_id,
            assignment_id: assignment.id,
            class_id: student.class_id,
            is_active: true,
            assigned_at: new Date().toISOString()
          });
          mappedCount++;
          staffIds.push(assignment.staff_id);

          // If assignment type is Mentor or Class Advisor, also ensure mentorship record exists
          if (['Class Advisor', 'Mentor'].includes(assignment.assignment_type)) {
            await supabase.from('mentorships').insert({
              academician_id: assignment.staff_id,
              student_id: student.id,
              status: 'ACTIVE',
              goals: 'Academic & Career Development',
              faculty_notes: 'Class assignment mapping',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }
    }

    return {
      success: true,
      status: mappedCount > 0 ? 'MAPPED' : 'NO_STAFF_ASSIGNED_YET',
      mappedCount,
      staffIds
    };
  } catch (err) {
    console.error('Error in mapStudentToStaff:', err);
    throw err;
  }
}

/**
 * Automatically remaps a student on Class or Department change.
 * Ends old active mappings while preserving all prior academic history.
 */
async function remapStudentOnClassChange(studentId, newClassId, newDeptId = null) {
  try {
    // 1. Mark existing active mappings as ended
    await supabase
      .from('student_staff_mapping')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .eq('is_active', true);

    // 2. Update student's class and optional department
    const updates = { class_id: newClassId, updated_at: new Date().toISOString() };
    if (newDeptId) updates.department_id = newDeptId;

    await supabase.from('students').update(updates).eq('id', studentId);

    // 3. Map student to staff assigned to new class
    const mapResult = await mapStudentToStaff(studentId);

    return {
      success: true,
      message: 'Student class remapped successfully while preserving all academic history.',
      remappingResult: mapResult
    };
  } catch (err) {
    console.error('Error in remapStudentOnClassChange:', err);
    throw err;
  }
}

/**
 * Retroactively maps all existing students in a class when a staff member is assigned to it.
 */
async function mapStaffToExistingStudents(staffId, classId, deptId, instId, assignmentId = null) {
  try {
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', instId)
      .eq('department_id', deptId)
      .eq('class_id', classId);

    let mappedCount = 0;
    if (students && students.length > 0) {
      for (const student of students) {
        const { data: existing } = await supabase
          .from('student_staff_mapping')
          .select('id')
          .eq('student_id', student.id)
          .eq('staff_id', staffId)
          .eq('class_id', classId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          await supabase.from('student_staff_mapping').insert({
            student_id: student.id,
            staff_id: staffId,
            assignment_id: assignmentId,
            class_id: classId,
            is_active: true,
            assigned_at: new Date().toISOString()
          });
          mappedCount++;
        }
      }
    }

    return {
      success: true,
      eligibleStudentsCount: students ? students.length : 0,
      newlyMappedCount: mappedCount
    };
  } catch (err) {
    console.error('Error in mapStaffToExistingStudents:', err);
    throw err;
  }
}

/**
 * Computes class-level analytics based strictly on real student records.
 */
async function getClassProgressAnalytics(classId, institutionId) {
  try {
    const { data: classInfo } = await supabase
      .from('classes')
      .select('id, name, section, year_semester, departments(name, code)')
      .eq('id', classId)
      .eq('institution_id', institutionId)
      .limit(1)
      .maybeSingle();

    if (!classInfo) {
      return null;
    }

    const { data: students } = await supabase
      .from('students')
      .select('id, readiness_score, cgpa')
      .eq('class_id', classId)
      .eq('institution_id', institutionId);

    const totalStudents = students ? students.length : 0;
    const dept = classInfo.departments || {};

    if (totalStudents === 0) {
      return {
        classId,
        className: classInfo.name,
        department: dept.name,
        yearSemester: classInfo.year_semester,
        totalStudents: 0,
        avgCourseProgress: 0,
        avgSkillScore: 0,
        assessmentCompletion: 0,
        industryReadyStudents: 0,
        studentsNeedingAttention: 0
      };
    }

    const studentIds = students.map(s => s.id);

    // 1. Avg Skill Score
    const { data: skills } = await supabase
      .from('student_skills')
      .select('confidence_score')
      .in('student_id', studentIds);

    const avgSkillScore = skills && skills.length > 0
      ? Math.round(skills.reduce((acc, s) => acc + (Number(s.confidence_score) || 0), 0) / skills.length)
      : 0;

    // 2. Avg Course Progress
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('progress_percentage')
      .in('student_id', studentIds);

    const avgCourseProgress = enrollments && enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + (Number(e.progress_percentage) || 0), 0) / enrollments.length)
      : 0;

    // 3. Assessment completion rate
    const { data: attempts } = await supabase
      .from('assessment_attempts')
      .select('student_id')
      .in('student_id', studentIds)
      .eq('status', 'Completed');

    const completedAsmtStudents = attempts ? new Set(attempts.map(a => a.student_id)).size : 0;
    const assessmentCompletion = Math.round((completedAsmtStudents / totalStudents) * 100);

    // 4. Industry Ready
    const industryReadyStudents = students.filter(s => Number(s.readiness_score || 0) >= 80).length;

    // 5. Students Needing Attention
    const studentsNeedingAttention = students.filter(s => Number(s.readiness_score || 0) < 50).length;

    return {
      classId,
      className: classInfo.name,
      department: dept.name,
      departmentCode: dept.code,
      yearSemester: classInfo.year_semester,
      totalStudents,
      avgCourseProgress,
      avgSkillScore,
      assessmentCompletion,
      industryReadyStudents,
      studentsNeedingAttention
    };
  } catch (err) {
    console.error('Error in getClassProgressAnalytics:', err);
    throw err;
  }
}

module.exports = {
  mapStudentToStaff,
  remapStudentOnClassChange,
  mapStaffToExistingStudents,
  getClassProgressAnalytics
};
