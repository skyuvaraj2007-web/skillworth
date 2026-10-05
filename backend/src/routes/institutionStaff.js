/**
 * SKILLNEXUS AI — Institution Staff & Class Management Controller
 * Route prefix: /api/institution
 * Manages Staff Directory, Add Staff, Class Assignment, Remapping, and Class Definitions.
 */

const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const {
  mapStaffToExistingStudents,
  remapStudentOnClassChange,
  getClassProgressAnalytics
} = require('../services/staffMappingEngine');

// Middleware to verify Institution Admin / Authorized Staff
async function verifyInstitutionAdmin(req, res, next) {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (!['institution', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Institution administrative privileges required.'
      });
    }

    const institutionId = req.query.institutionId || req.user?.institutionId || req.user?.collegeId;
    if (!institutionId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Institution context missing.'
      });
    }

    req.institutionId = institutionId;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/institution/staff — List Staff Grouped or Tabular with Stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/staff', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const instId = req.institutionId;

    if (!relationalManager.supabase) {
      return res.json({ success: true, data: [], grouped: {} });
    }

    const query = `
      SELECT 
        u.id as user_id, u.email, ap.full_name as name, u.is_active, u.created_at,
        ap.id as profile_id, ap.faculty_id as staff_id, ap.full_name, ap.designation,
        ap.phone, ap.qualification, ap.specialization, ap.experience, ap.joining_date, ap.gender,
        d.id as department_id, d.name as department_name, d.code as department_code,
        c.id as class_id, c.name as class_name, c.section as class_section, c.year_semester,
        sa.id as assignment_id, sa.assignment_type, sa.is_primary, sa.status as assignment_status,
        (
          SELECT COUNT(DISTINCT m.student_id)::int 
          FROM student_staff_mapping m 
          WHERE m.staff_id = u.id AND m.is_active = true
        ) as mapped_students_count
      FROM users u
      JOIN academician_profiles ap ON ap.user_id = u.id
      LEFT JOIN departments d ON d.id = ap.department_id
      LEFT JOIN classes c ON c.id = ap.class_id
      LEFT JOIN staff_assignments sa ON sa.staff_id = u.id AND LOWER(sa.status) = 'active'
      WHERE (
          ap.institution_id::text = $1 
          OR ap.institution_id IN (SELECT id FROM institutions WHERE code = $1 OR id::text = $1)
        )
      ORDER BY d.name ASC NULLS LAST, c.name ASC NULLS LAST, ap.full_name ASC
    `;

    const result = await relationalManager.query(query, [String(instId)]);
    const staffList = result.rows;

    // Build hierarchical grouping: Institution -> Department -> Class -> Staff
    const grouped = {};
    staffList.forEach(s => {
      const dept = s.department_name || 'Unassigned Department';
      const cls = s.class_name ? `${s.class_name} ${s.class_section || ''}`.trim() : 'Unassigned Class';
      if (!grouped[dept]) grouped[dept] = {};
      if (!grouped[dept][cls]) grouped[dept][cls] = [];
      grouped[dept][cls].push(s);
    });

    return res.json({
      success: true,
      count: staffList.length,
      data: staffList,
      staff: staffList,
      grouped
    });
  } catch (err) {
    console.error('Error fetching institution staff:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/institution/staff — Add New Staff / Academician
// ─────────────────────────────────────────────────────────────────────────────
router.post('/staff', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const instId = req.institutionId;
    const {
      name,
      email,
      password,
      staffId,
      age,
      departmentId,
      classId,
      designation = 'Assistant Professor',
      assignmentType = 'Class Advisor',
      phone,
      qualification,
      specialization,
      experience,
      joiningDate,
      gender,
      profilePhoto,
      bio
    } = req.body;

    if (!name || !email || !password || !staffId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and staff ID are required fields.'
      });
    }

    if (!relationalManager.supabase) {
      return res.status(500).json({ success: false, message: 'Database connection offline' });
    }

    // Check duplicate email
    const dupEmail = await relationalManager.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (dupEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Resolve Institution UUID
    const instQuery = await relationalManager.query(
      'SELECT id FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1',
      [String(instId)]
    );
    const resolvedInstUuid = instQuery.rows[0]?.id || null;

    // Resolve Department UUID
    let resolvedDeptUuid = null;
    if (departmentId) {
      const deptQuery = await relationalManager.query(
        'SELECT id FROM departments WHERE (id::text = $1 OR code = $1 OR name ILIKE $1) AND (institution_id = $2 OR institution_id IS NULL) LIMIT 1',
        [String(departmentId), resolvedInstUuid]
      );
      resolvedDeptUuid = deptQuery.rows[0]?.id || null;
    }

    // Resolve Class UUID
    let resolvedClassUuid = null;
    if (classId) {
      const classQuery = await relationalManager.query(
        'SELECT id FROM classes WHERE id::text = $1 OR name ILIKE $1 LIMIT 1',
        [String(classId)]
      );
      resolvedClassUuid = classQuery.rows[0]?.id || null;
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Insert into users
    const userRes = await relationalManager.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       RETURNING id, email`,
      [email.trim().toLowerCase(), passwordHash]
    );
    const newUser = userRes.rows[0];

    // Assign ACADEMICIAN / FACULTY role in user_roles
    const roleRes = await relationalManager.query(
      "SELECT id FROM roles WHERE code IN ('ACADEMICIAN', 'FACULTY') ORDER BY CASE WHEN code = 'ACADEMICIAN' THEN 1 ELSE 2 END LIMIT 1"
    );
    if (roleRes.rows.length > 0) {
      await relationalManager.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING",
        [newUser.id, roleRes.rows[0].id]
      );
    }

    // 2. Insert into academician_profiles
    const apRes = await relationalManager.query(
      `INSERT INTO academician_profiles (
        user_id, institution_id, department_id, class_id, full_name, faculty_id,
        designation, phone, official_email, age, qualification, specialization,
        experience, joining_date, gender, bio, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, NOW(), NOW()
      ) RETURNING *`,
      [
        newUser.id,
        resolvedInstUuid,
        resolvedDeptUuid,
        resolvedClassUuid,
        name.trim(),
        staffId.trim(),
        designation,
        phone || null,
        email.trim().toLowerCase(),
        age ? parseInt(age, 10) : null,
        qualification || null,
        specialization || null,
        experience || null,
        joiningDate || null,
        gender || null,
        bio || null
      ]
    );
    const newProfile = apRes.rows[0];

    // 3. Create staff assignment if class is selected
    let assignment = null;
    if (resolvedClassUuid) {
      const saRes = await relationalManager.query(
        `INSERT INTO staff_assignments (
          staff_id, institution_id, department_id, class_id, assignment_type, is_primary, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()
        ) RETURNING *`,
        [
          newUser.id,
          resolvedInstUuid,
          resolvedDeptUuid,
          resolvedClassUuid,
          assignmentType || 'Class Advisor',
          assignmentType === 'Class Advisor'
        ]
      );
      assignment = saRes.rows[0];

      // 4. Automatically identify students belonging to the same institution + department + class
      // and map them to this staff member!
      await mapStaffToExistingStudents(newUser.id, resolvedClassUuid, resolvedDeptUuid, resolvedInstUuid, assignment.id);
    }

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully and eligible students mapped.',
      data: {
        user: newUser,
        profile: newProfile,
        assignment
      }
    });
  } catch (err) {
    console.error('Error creating staff:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/institution/staff/:id/assign — Staff Assignment
// ─────────────────────────────────────────────────────────────────────────────
router.post('/staff/:id/assign', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const staffUserId = req.params.id;
    const instId = req.institutionId;
    const { departmentId, classId, assignmentType = 'Class Advisor' } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required for assignment' });
    }

    // Resolve Institution UUID
    const instQuery = await relationalManager.query(
      'SELECT id FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1',
      [String(instId)]
    );
    const resolvedInstUuid = instQuery.rows[0]?.id || null;

    // Resolve Department UUID
    let resolvedDeptUuid = null;
    if (departmentId) {
      const deptQuery = await relationalManager.query(
        'SELECT id FROM departments WHERE (id::text = $1 OR code = $1 OR name ILIKE $1) LIMIT 1',
        [String(departmentId)]
      );
      resolvedDeptUuid = deptQuery.rows[0]?.id || null;
    }

    // Resolve Class UUID
    const classQuery = await relationalManager.query(
      'SELECT id, department_id FROM classes WHERE id::text = $1 OR name ILIKE $1 LIMIT 1',
      [String(classId)]
    );
    if (classQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified class not found' });
    }
    const resolvedClassUuid = classQuery.rows[0].id;
    if (!resolvedDeptUuid && classQuery.rows[0].department_id) {
      resolvedDeptUuid = classQuery.rows[0].department_id;
    }

    // Update academician profile class and department
    await relationalManager.query(
      `UPDATE academician_profiles 
       SET department_id = COALESCE($1, department_id), class_id = $2, updated_at = NOW() 
       WHERE user_id = $3`,
      [resolvedDeptUuid, resolvedClassUuid, staffUserId]
    );

    // Insert staff assignment
    const isPrimary = assignmentType === 'Class Advisor';
    const saRes = await relationalManager.query(
      `INSERT INTO staff_assignments (
        staff_id, institution_id, department_id, class_id, assignment_type, is_primary, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()
      ) RETURNING *`,
      [staffUserId, resolvedInstUuid, resolvedDeptUuid, resolvedClassUuid, assignmentType, isPrimary]
    );
    const assignment = saRes.rows[0];

    // Trigger automatic mapping of matching students
    const mappingResult = await mapStaffToExistingStudents(
      staffUserId,
      resolvedClassUuid,
      resolvedDeptUuid,
      resolvedInstUuid,
      assignment.id
    );

    return res.json({
      success: true,
      message: `Staff assigned to class successfully. ${mappingResult.mappedCount} students automatically mapped.`,
      data: {
        assignment,
        mappingResult
      }
    });
  } catch (err) {
    console.error('Error assigning staff:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PUT /api/institution/staff/:id/status — Toggle Activate/Deactivate
// ─────────────────────────────────────────────────────────────────────────────
router.put('/staff/:id/status', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await relationalManager.query(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_active`,
      [Boolean(isActive), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.json({
      success: true,
      message: `Staff account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/institution/staff/:id/reset-password — Reset Password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/staff/:id/reset-password', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await relationalManager.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.json({
      success: true,
      message: 'Staff password reset successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/institution/staff/:id/students — View Mapped Students
// ─────────────────────────────────────────────────────────────────────────────
router.get('/staff/:id/students', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.id, s.full_name, s.roll_number, s.cgpa, s.batch, s.year_semester,
        d.name as department_name,
        c.name as class_name, c.section as class_section,
        u.email, u.is_active,
        m.assigned_at, m.is_active as mapping_active,
        COALESCE((SELECT AVG(ss.confidence_score) FROM student_skills ss WHERE ss.student_id = s.id), 0)::int as skill_score,
        COALESCE((SELECT AVG(aa.score) FROM assessment_attempts aa WHERE aa.student_id = s.id AND aa.status = 'Completed'), 0)::int as assessment_score,
        COALESCE((SELECT AVG(e.progress_percentage) FROM enrollments e WHERE e.student_id = s.id), 0)::int as course_progress
      FROM student_staff_mapping m
      JOIN students s ON s.id = m.student_id
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE m.staff_id = $1 AND m.is_active = true
      ORDER BY s.full_name ASC
    `;

    const result = await relationalManager.query(query, [id]);
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/institution/classes & POST /api/institution/classes
// ─────────────────────────────────────────────────────────────────────────────
router.get('/classes', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const instId = req.institutionId;
    const query = `
      SELECT c.*, d.name as department_name, d.code as department_code,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count,
             (SELECT COUNT(*) FROM staff_assignments sa WHERE sa.class_id = c.id AND sa.status = 'active') as staff_count
      FROM classes c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.institution_id::text = $1 
         OR c.institution_id IN (SELECT id FROM institutions WHERE code = $1 OR id::text = $1)
      ORDER BY d.name ASC, c.name ASC, c.section ASC
    `;
    const result = await relationalManager.query(query, [String(instId)]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/classes', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const instId = req.institutionId;
    const { departmentId, name, section, yearSemester, batch } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({ success: false, message: 'Class name and department ID are required.' });
    }

    const instQuery = await relationalManager.query(
      'SELECT id FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1',
      [String(instId)]
    );
    const resolvedInstUuid = instQuery.rows[0]?.id || null;

    const result = await relationalManager.query(
      `INSERT INTO classes (institution_id, department_id, name, section, year_semester, batch, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING *`,
      [resolvedInstUuid, departmentId, name.trim(), section?.trim() || 'A', yearSemester || null, batch || null]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PUT /api/institution/students/:id/class — Remap Student on Class Change
// ─────────────────────────────────────────────────────────────────────────────
router.put('/students/:id/class', requireAuth, verifyInstitutionAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { newClassId, newDepartmentId } = req.body;

    if (!newClassId) {
      return res.status(400).json({ success: false, message: 'newClassId is required' });
    }

    const remapResult = await remapStudentOnClassChange(studentId, newClassId, newDepartmentId);
    return res.json(remapResult);
  } catch (err) {
    console.error('Error remapping student:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
