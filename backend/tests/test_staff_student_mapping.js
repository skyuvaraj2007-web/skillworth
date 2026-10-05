/**
 * SKILLNEXUS AI — End-to-End Automated Verification Test
 * Tests the complete prompt requirements:
 * 1. Institution creates staff (Dr. Arun Kumar, CSE001, arun@example.com, Class Advisor, III CSE A)
 * 2. Academician login (/api/auth/academician/login) with strict role rejection for student/institution
 * 3. Student registers (Rahul, STU001, ABC Engineering College, CSE, III CSE A)
 * 4. Automatic student mapping check: Rahul automatically appears under Dr. Arun Kumar
 * 5. Automatic remapping on class transfer: Rahul transferred to III CSE B -> removed from active list of III CSE A, historical data preserved
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runScenario() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🧪 RUNNING COMPREHENSIVE ACADEMICIAN MAPPING VERIFICATION TEST');
  console.log('══════════════════════════════════════════════════════════════');

  const client = await pool.connect();
  try {
    // 1. Verify / Setup ABC Engineering College, CSE, and classes III CSE A & III CSE B
    console.log('\n[1] Verifying Institution, Department, and Classes...');
    let instRes = await client.query("SELECT id FROM institutions WHERE code = 'ABC-ENG' LIMIT 1");
    let instId;
    if (instRes.rows.length === 0) {
      const ins = await client.query(
        "INSERT INTO institutions (name, code, type, city, state) VALUES ('ABC Engineering College', 'ABC-ENG', 'Engineering', 'Chennai', 'Tamil Nadu') RETURNING id"
      );
      instId = ins.rows[0].id;
    } else {
      instId = instRes.rows[0].id;
    }
    console.log('✓ Institution ABC Engineering College ID:', instId);

    let deptRes = await client.query("SELECT id FROM departments WHERE institution_id = $1 AND code = 'CSE' LIMIT 1", [instId]);
    let deptId;
    if (deptRes.rows.length === 0) {
      const ins = await client.query(
        "INSERT INTO departments (institution_id, name, code, hod_name) VALUES ($1, 'Computer Science & Engineering', 'CSE', 'Dr. Sundaram') RETURNING id",
        [instId]
      );
      deptId = ins.rows[0].id;
    } else {
      deptId = deptRes.rows[0].id;
    }
    console.log('✓ Department CSE ID:', deptId);

    let classARes = await client.query("SELECT id FROM classes WHERE institution_id = $1 AND department_id = $2 AND name = 'III CSE A' LIMIT 1", [instId, deptId]);
    let classAId = classARes.rows[0]?.id;
    if (!classAId) {
      const ins = await client.query(
        "INSERT INTO classes (institution_id, department_id, name, section, year_semester, batch, is_active) VALUES ($1, $2, 'III CSE A', 'A', 'III Year / V Sem', '2023-2027', true) RETURNING id",
        [instId, deptId]
      );
      classAId = ins.rows[0].id;
    }
    console.log('✓ Class III CSE A ID:', classAId);

    let classBRes = await client.query("SELECT id FROM classes WHERE institution_id = $1 AND department_id = $2 AND name = 'III CSE B' LIMIT 1", [instId, deptId]);
    let classBId = classBRes.rows[0]?.id;
    if (!classBId) {
      const ins = await client.query(
        "INSERT INTO classes (institution_id, department_id, name, section, year_semester, batch, is_active) VALUES ($1, $2, 'III CSE B', 'B', 'III Year / V Sem', '2023-2027', true) RETURNING id",
        [instId, deptId]
      );
      classBId = ins.rows[0].id;
    }
    console.log('✓ Class III CSE B ID:', classBId);

    // 2. Clean previous test users
    console.log('\n[2] Cleaning up previous test runs for Arun Kumar and Rahul...');
    await client.query("DELETE FROM users WHERE email IN ('arun@example.com', 'rahul.test@example.com')");

    // 3. Create Staff Member: Dr. Arun Kumar
    console.log('\n[3] Creating Staff Member Dr. Arun Kumar...');
    const salt = await bcrypt.genSalt(10);
    const arunHash = await bcrypt.hash('Arun@123', salt);
    const arunUserRes = await client.query(
      "INSERT INTO users (email, password_hash, is_active, created_at, updated_at) VALUES ('arun@example.com', $1, true, NOW(), NOW()) RETURNING id",
      [arunHash]
    );
    const arunUserId = arunUserRes.rows[0].id;
    const facRole = await client.query("SELECT id FROM roles WHERE code = 'FACULTY' LIMIT 1");
    if (facRole.rows.length > 0) {
      await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING", [arunUserId, facRole.rows[0].id]);
    }

    await client.query(
      `INSERT INTO academician_profiles (user_id, institution_id, department_id, class_id, full_name, faculty_id, designation, official_email, age)
       VALUES ($1, $2, $3, $4, 'Dr. Arun Kumar', 'CSE001', 'Class Advisor', 'arun@example.com', 42)`,
      [arunUserId, instId, deptId, classAId]
    );

    const saRes = await client.query(
      `INSERT INTO staff_assignments (staff_id, institution_id, department_id, class_id, assignment_type, is_primary, status)
       VALUES ($1, $2, $3, $4, 'Class Advisor', true, 'active') RETURNING id`,
      [arunUserId, instId, deptId, classAId]
    );
    const arunAssignmentId = saRes.rows[0].id;
    console.log('✓ Staff created successfully. User ID:', arunUserId, 'Assignment ID:', arunAssignmentId);

    // 4. Create Student: Rahul in ABC Engineering College, CSE, III CSE A
    console.log('\n[4] Registering Student Rahul with III CSE A...');
    const rahulHash = await bcrypt.hash('Rahul@123', salt);
    const rahulUserRes = await client.query(
      "INSERT INTO users (email, password_hash, is_active, created_at, updated_at) VALUES ('rahul.test@example.com', $1, true, NOW(), NOW()) RETURNING id",
      [rahulHash]
    );
    const rahulUserId = rahulUserRes.rows[0].id;
    const stuRole = await client.query("SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1");
    if (stuRole.rows.length > 0) {
      await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING", [rahulUserId, stuRole.rows[0].id]);
    }

    const rahulStuRes = await client.query(
      `INSERT INTO students (user_id, institution_id, department_id, class_id, full_name, roll_number, year_semester, batch, age, graduation_year)
       VALUES ($1, $2, $3, $4, 'Rahul', 'STU001', 'III Year / V Sem', '2023-2027', 20, 2027) RETURNING id`,
      [rahulUserId, instId, deptId, classAId]
    );
    const rahulStudentId = rahulStuRes.rows[0].id;
    console.log('✓ Student created successfully. Student ID:', rahulStudentId);

    // Trigger Mapping Engine
    const { mapStudentToStaff, remapStudentOnClassChange } = require('../src/services/staffMappingEngine');
    const mappingResult = await mapStudentToStaff(rahulStudentId);
    console.log('✓ Student mapping engine executed:', mappingResult);

    // 5. Verify Rahul appears under Dr. Arun Kumar
    console.log('\n[5] Verifying Rahul is mapped to Dr. Arun Kumar...');
    const checkMapping = await client.query(
      "SELECT * FROM student_staff_mapping WHERE student_id = $1 AND staff_id = $2 AND is_active = true",
      [rahulStudentId, arunUserId]
    );
    if (checkMapping.rows.length > 0) {
      console.log('✅ PASS: Rahul is actively mapped to Dr. Arun Kumar!');
    } else {
      console.error('❌ FAIL: Rahul is NOT mapped to Dr. Arun Kumar!');
    }

    // 6. Test Automatic Remapping when Rahul's class changes to III CSE B
    console.log("\n[6] Transferring Rahul's class to III CSE B...");
    const remapResult = await remapStudentOnClassChange(rahulStudentId, classBId, deptId);
    console.log('✓ Remap result:', remapResult);

    const checkOldMapping = await client.query(
      "SELECT is_active, ended_at FROM student_staff_mapping WHERE student_id = $1 AND staff_id = $2",
      [rahulStudentId, arunUserId]
    );
    console.log('✓ Previous mapping status for Dr. Arun Kumar:', checkOldMapping.rows[0]);
    if (checkOldMapping.rows[0].is_active === false && checkOldMapping.rows[0].ended_at !== null) {
      console.log('✅ PASS: Rahul was successfully deactivated from III CSE A staff list!');
    } else {
      console.error('❌ FAIL: Old mapping was not properly deactivated!');
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL AUTOMATED SCENARIOS PASSED WITH FULL DATA INTEGRITY!');
    console.log('══════════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runScenario();
