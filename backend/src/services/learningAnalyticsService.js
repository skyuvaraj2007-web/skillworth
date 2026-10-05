/**
 * SKILLNEXUS — Learning Analytics & Adaptive Engine Service
 * 
 * Invariants:
 * - Single source of truth: PostgreSQL database.
 * - Real queries across enrollments, courses, course_modules, student_lesson_progress,
 *   assessment_attempts, projects, certificates, student_skills, and assessment_question_attempts.
 * - Brand-new student returns clean zero metrics without fabricated data or fake charts.
 * - Adaptive recommendations recommend ONLY existing real database courses.
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

class LearningAnalyticsService {
  async getClient() {
    return await pool.connect();
  }

  /**
   * Resolve student row from any identifier
   */
  async resolveStudent(identifier) {
    if (!identifier) return null;
    const client = await this.getClient();
    try {
      const res = await client.query(
        `SELECT s.id, s.institution_id, s.full_name as student_name, s.roll_number, u.email 
         FROM students s
         LEFT JOIN users u ON u.id = s.user_id
         WHERE s.id::text = $1 OR s.user_id::text = $1 OR s.roll_number = $1 OR u.email = $1 
         LIMIT 1`,
        [String(identifier)]
      );
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve all enrolled courses and detailed progress for a student
   */
  async getStudentCoursesAndProgress(studentIdentifier) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) return [];

    const client = await this.getClient();
    try {
      const query = `
        SELECT 
          e.id as enrollment_id,
          e.student_id,
          e.course_id,
          e.status as enrollment_status,
          e.progress_percentage,
          e.enrolled_at,
          e.completed_at,
          c.title as course_title,
          c.course_code,
          c.category,
          c.difficulty,
          c.hours,
          c.instructor_name,
          c.description,
          (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) as total_modules,
          (SELECT COUNT(*) FROM student_module_progress smp WHERE smp.enrollment_id = e.id AND smp.status = 'Completed') as completed_modules,
          (SELECT COUNT(*) FROM student_lesson_progress slp WHERE slp.enrollment_id = e.id AND slp.status = 'Completed') as completed_lessons,
          (SELECT COALESCE(SUM(time_spent_seconds), 0) FROM student_lesson_progress slp WHERE slp.enrollment_id = e.id) as time_spent_seconds,
          (SELECT MAX(completed_at) FROM student_lesson_progress slp WHERE slp.enrollment_id = e.id) as last_activity
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = $1
        ORDER BY e.enrolled_at DESC
      `;
      const res = await client.query(query, [student.id]);

      return res.rows.map(row => {
        const progress = Number(row.progress_percentage) || 0;
        let status = 'NOT_STARTED';
        if (progress >= 100 || row.enrollment_status === 'Completed') {
          status = 'COMPLETED';
        } else if (progress > 0 || row.completed_modules > 0 || row.completed_lessons > 0) {
          status = 'IN_PROGRESS';
        }

        const totalMods = Math.max(1, parseInt(row.total_modules, 10) || 1);
        const compMods = Math.min(totalMods, parseInt(row.completed_modules, 10) || 0);

        return {
          enrollmentId: row.enrollment_id,
          courseId: row.course_id,
          studentId: row.student_id,
          courseTitle: row.course_title,
          courseCode: row.course_code,
          category: row.category || 'General',
          difficulty: row.difficulty || 'Intermediate',
          instructorName: row.instructor_name || 'Faculty Mentor',
          hours: row.hours || 10,
          timeSpentSeconds: parseInt(row.time_spent_seconds, 10) || 0,
          timeSpentHours: Math.round(((parseInt(row.time_spent_seconds, 10) || 0) / 3600) * 10) / 10,
          moduleCount: totalMods,
          completedModules: compMods,
          lessonCount: parseInt(row.completed_lessons, 10) || 0,
          completedLessons: parseInt(row.completed_lessons, 10) || 0,
          progressPercentage: progress,
          courseStatus: status,
          status,
          enrolledAt: row.enrolled_at,
          completedAt: row.completed_at,
          lastActivity: row.last_activity || row.enrolled_at
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Enroll a student in a course starting at 0%
   */
  async enrollStudentInCourse(studentIdentifier, courseId) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) throw new Error(`Student "${studentIdentifier}" not found.`);

    const client = await this.getClient();
    try {
      // Check if course exists
      const crsRes = await client.query(`SELECT id, title FROM courses WHERE id = $1`, [courseId]);
      if (crsRes.rows.length === 0) {
        throw new Error(`Course with ID "${courseId}" does not exist.`);
      }

      // Check existing enrollment
      const exRes = await client.query(
        `SELECT id, status, progress_percentage FROM enrollments WHERE student_id = $1 AND course_id = $2`,
        [student.id, courseId]
      );
      if (exRes.rows.length > 0) {
        return {
          success: true,
          alreadyEnrolled: true,
          message: 'Student is already enrolled in this course.',
          enrollment: exRes.rows[0]
        };
      }

      const insRes = await client.query(
        `INSERT INTO enrollments (student_id, course_id, status, progress_percentage, enrolled_at)
         VALUES ($1, $2, 'In Progress', 0, NOW())
         RETURNING *`,
        [student.id, courseId]
      );

      return {
        success: true,
        alreadyEnrolled: false,
        message: 'Student successfully enrolled in course at 0% progress.',
        enrollment: insRes.rows[0]
      };
    } finally {
      client.release();
    }
  }

  /**
   * Complete a module idempotently and recalculate progress percentage
   */
  async completeModule(studentIdentifier, courseId, moduleId) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) throw new Error(`Student "${studentIdentifier}" not found.`);

    const client = await this.getClient();
    try {
      // Find enrollment
      const enrRes = await client.query(
        `SELECT id, progress_percentage, status FROM enrollments WHERE student_id = $1 AND course_id = $2`,
        [student.id, courseId]
      );
      if (enrRes.rows.length === 0) {
        throw new Error('Student is not enrolled in this course.');
      }
      const enrollment = enrRes.rows[0];

      // Upsert module progress
      await client.query(
        `INSERT INTO student_module_progress (enrollment_id, module_id, status, completed_at)
         VALUES ($1, $2, 'Completed', NOW())
         ON CONFLICT (enrollment_id, module_id) DO UPDATE SET status = 'Completed', completed_at = NOW()`,
        [enrollment.id, moduleId]
      );

      // Total modules for course
      const modCountRes = await client.query(
        `SELECT COUNT(*) FROM course_modules WHERE course_id = $1`,
        [courseId]
      );
      const totalModules = Math.max(1, parseInt(modCountRes.rows[0].count, 10) || 1);

      // Completed modules for enrollment
      const compModRes = await client.query(
        `SELECT COUNT(*) FROM student_module_progress WHERE enrollment_id = $1 AND status = 'Completed'`,
        [enrollment.id]
      );
      const completedModules = parseInt(compModRes.rows[0].count, 10) || 1;

      const newProgress = Math.min(100, Math.round((completedModules / totalModules) * 100));
      const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';

      await client.query(
        `UPDATE enrollments 
         SET progress_percentage = $1, status = $2, completed_at = $3
         WHERE id = $4`,
        [newProgress, newStatus, newStatus === 'Completed' ? new Date().toISOString() : null, enrollment.id]
      );

      return {
        success: true,
        enrollmentId: enrollment.id,
        courseId,
        moduleId,
        totalModules,
        completedModules,
        progressPercentage: newProgress,
        status: newStatus === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Complete student learning analytics from PostgreSQL data
   * Brand new student returns clean 0s.
   */
  async getStudentLearningAnalytics(studentIdentifier) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) {
      return {
        courses: 0,
        completed: 0,
        assessments: 0,
        projects: 0,
        certifications: 0,
        learningProgress: 0,
        courseCompletionRate: 0,
        assessmentAverageScore: 0,
        skillsGainedCount: 0,
        weakSkills: [],
        skillsGained: [],
        learningActivity: { totalMinutes: 0, totalHours: 0, streakDays: 0, weeklyBreakdown: [] },
        improvementOverTime: []
      };
    }

    const client = await this.getClient();
    try {
      const studentId = student.id;

      // 1. Course Enrollments stats
      const courseStats = await client.query(`
        SELECT 
          COUNT(*) as total_enrolled,
          COUNT(CASE WHEN progress_percentage >= 100 OR status = 'Completed' THEN 1 END) as completed_courses,
          COUNT(CASE WHEN progress_percentage > 0 AND progress_percentage < 100 THEN 1 END) as active_courses,
          COALESCE(AVG(progress_percentage), 0) as avg_progress
        FROM enrollments
        WHERE student_id = $1
      `, [studentId]);

      const totalCourses = parseInt(courseStats.rows[0].total_enrolled, 10) || 0;
      const completedCourses = parseInt(courseStats.rows[0].completed_courses, 10) || 0;
      const activeCourses = parseInt(courseStats.rows[0].active_courses, 10) || 0;
      const avgProgress = Math.round(parseFloat(courseStats.rows[0].avg_progress) || 0);

      // 2. Assessments stats
      const asmtStats = await client.query(`
        SELECT 
          COUNT(*) as total_attempts,
          COALESCE(AVG(score), 0) as avg_score,
          COUNT(CASE WHEN score >= 70 THEN 1 END) as passed_attempts
        FROM assessment_attempts
        WHERE student_id = $1
      `, [studentId]);

      const totalAssessments = parseInt(asmtStats.rows[0].total_attempts, 10) || 0;
      const avgScore = Math.round(parseFloat(asmtStats.rows[0].avg_score) || 0);

      // 3. Projects stats
      const projStats = await client.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status IN ('Completed', 'completed', 'Validated', 'validated') THEN 1 END) as completed_projects
        FROM projects
        WHERE student_id = $1
      `, [studentId]);

      const totalProjects = parseInt(projStats.rows[0].total_projects, 10) || 0;
      const completedProjects = parseInt(projStats.rows[0].completed_projects, 10) || 0;

      // 4. Certifications stats
      const certStats = await client.query(`
        SELECT COUNT(*) as total_certs FROM certificates WHERE student_id = $1
      `, [studentId]);

      const totalCertifications = parseInt(certStats.rows[0].total_certs, 10) || 0;

      // 5. Skills Gained
      const skillsRes = await client.query(`
        SELECT sk.name, sc.name as category, ssk.confidence_score as mastery_score, ssk.claimed_level as level, ssk.verification_status
        FROM student_skills ssk
        JOIN skills sk ON sk.id = ssk.skill_id
        LEFT JOIN skill_categories sc ON sc.id = sk.category_id
        WHERE ssk.student_id = $1
        ORDER BY ssk.confidence_score DESC LIMIT 10
      `, [studentId]);

      const skillsGained = skillsRes.rows.map(r => ({
        name: r.name,
        category: r.category || 'Engineering',
        masteryScore: r.mastery_score || 70,
        level: r.level || 'Intermediate',
        verified: r.verification_status === 'VERIFIED'
      }));

      // 6. Weak Skills (from question attempts with < 50% accuracy or skill gap reports)
      const weakSkillsRes = await client.query(`
        SELECT 
          skill_tag,
          COUNT(*) as total_q,
          COUNT(CASE WHEN is_correct THEN 1 END) as correct_q
        FROM assessment_question_attempts
        WHERE student_id = $1 AND skill_tag IS NOT NULL
        GROUP BY skill_tag
        HAVING (COUNT(CASE WHEN is_correct THEN 1 END)::float / GREATEST(1, COUNT(*))) < 0.55
        ORDER BY total_q DESC
        LIMIT 5
      `, [studentId]);

      const weakSkills = weakSkillsRes.rows.map(r => {
        const accuracy = Math.round(((parseInt(r.correct_q, 10) || 0) / Math.max(1, parseInt(r.total_q, 10))) * 100);
        return {
          skill: r.skill_tag,
          accuracy,
          totalQuestions: parseInt(r.total_q, 10)
        };
      });

      // 7. Learning Activity Time
      const actRes = await client.query(`
        SELECT 
          COALESCE(SUM(time_spent_seconds), 0) as total_seconds,
          COUNT(DISTINCT DATE(completed_at)) as active_days
        FROM student_lesson_progress
        WHERE student_id = $1
      `, [studentId]);

      const totalSeconds = parseInt(actRes.rows[0].total_seconds, 10) || 0;
      const totalMinutes = Math.round(totalSeconds / 60);
      const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
      const activeDays = parseInt(actRes.rows[0].active_days, 10) || 0;

      // 8. Chronological Improvement Points
      const improveRes = await client.query(`
        SELECT 
          score,
          started_at
        FROM assessment_attempts
        WHERE student_id = $1
        ORDER BY started_at ASC
        LIMIT 10
      `, [studentId]);

      const improvementOverTime = improveRes.rows.map((r, idx) => ({
        attempt: idx + 1,
        score: Number(r.score) || 0,
        date: r.started_at
      }));

      return {
        courses: totalCourses,
        completed: completedCourses,
        activeCourses,
        assessments: totalAssessments,
        assessmentAverageScore: avgScore,
        projects: totalProjects,
        completedProjects,
        certifications: totalCertifications,
        learningProgress: avgProgress,
        courseCompletionRate: avgProgress,
        skillsGainedCount: skillsGained.length,
        skillsGained,
        weakSkills,
        learningActivity: {
          totalMinutes,
          totalHours,
          streakDays: activeDays,
          weeklyBreakdown: []
        },
        improvementOverTime
      };
    } finally {
      client.release();
    }
  }

  /**
   * Adaptive Learning Engine: Maps weak skills to real database courses
   */
  async getAdaptiveRecommendations(studentIdentifier) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) return [];

    const client = await this.getClient();
    try {
      const studentId = student.id;

      // Identify weak skills from question attempts
      const weakQRes = await client.query(`
        SELECT skill_tag
        FROM assessment_question_attempts
        WHERE student_id = $1 AND skill_tag IS NOT NULL
        GROUP BY skill_tag
        ORDER BY (COUNT(CASE WHEN is_correct THEN 1 END)::float / GREATEST(1, COUNT(*))) ASC
        LIMIT 3
      `, [studentId]);

      const weakSkills = weakQRes.rows.map(r => r.skill_tag);

      // If no weak questions yet, inspect skill_gap_records
      if (weakSkills.length === 0) {
        const gapRes = await client.query(`
          SELECT skill_name FROM skill_gap_records WHERE student_id = $1 LIMIT 3
        `, [studentId]);
        weakSkills.push(...gapRes.rows.map(r => r.skill_name));
      }

      if (weakSkills.length === 0) {
        return [];
      }

      // Find real courses matching these skills
      const recommendations = [];
      for (const skill of weakSkills) {
        const crsRes = await client.query(`
          SELECT c.id, c.title, c.category, c.difficulty, c.hours, c.instructor_name,
                 EXISTS(SELECT 1 FROM enrollments e WHERE e.student_id = $1 AND e.course_id = c.id) as is_enrolled
          FROM courses c
          WHERE c.title ILIKE $2 OR c.category ILIKE $2 OR c.skill_category ILIKE $2
          LIMIT 1
        `, [studentId, `%${skill}%`]);

        if (crsRes.rows.length > 0) {
          const c = crsRes.rows[0];
          recommendations.push({
            weakSkill: skill,
            recommendedCourse: {
              id: c.id,
              title: c.title,
              category: c.category,
              difficulty: c.difficulty,
              hours: c.hours,
              instructorName: c.instructor_name
            },
            isEnrolled: Boolean(c.is_enrolled),
            reason: `Assessment performance indicates a learning gap in ${skill}. Completing this course will remediate the gap.`
          });
        }
      }

      return recommendations;
    } finally {
      client.release();
    }
  }
}

module.exports = new LearningAnalyticsService();
