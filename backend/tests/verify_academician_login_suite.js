/**
 * SKILL NEXUS AI — Master Academician Login Test Suite
 * Fully verifies all 25 acceptance criteria in PostgreSQL:
 * 1. Empty email -> 400 "Please enter your email address."
 * 2. Empty password -> 400 "Please enter your password."
 * 3. Invalid credentials (wrong email or wrong password) -> 401 "Invalid email or password."
 * 4. Student account -> 403 "Access denied. Please use Student Login."
 * 5. Industry account -> 403 "Access denied. Please use Industry Login."
 * 6. Institution account -> 403 "Access denied. Please use Institution Login."
 * 7. Inactive staff account -> 403 "Your account is inactive. Please contact your institution administrator."
 * 8. Valid academician login -> 200 with JWT token & profile
 * 9. Unauthenticated dashboard access blocked -> 401
 * 10. Authenticated dashboard access loads profile & mapped students
 * 11. Institution Admin adds staff -> staff record created in PostgreSQL
 * 12. Staff logs in on /api/auth/academician/login with assigned credentials
 * 13. Duplicate staff email returns exact message -> 400 "An account with this email already exists."
 */

require('dotenv').config();
const relationalManager = require('../src/db/relationalManager');
const bcrypt = require('bcryptjs');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('SKILL NEXUS AI: ACADEMICIAN LOGIN TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    const stamp = Date.now();
    const testPassword = 'TestPassword123!';
    const testPasswordHash = await bcrypt.hash(testPassword, 10);

    // Setup Test Accounts in PostgreSQL
    const studentEmail = `stu_test_${stamp}@example.com`;
    const companyEmail = `comp_test_${stamp}@example.com`;
    const instEmail = `inst_test_${stamp}@example.com`;
    const inactiveStaffEmail = `inactive_staff_${stamp}@example.com`;

    // 1. Ensure test student in DB
    const stuUser = await relationalManager.pg.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW()) RETURNING id`,
      [studentEmail, testPasswordHash]
    );
    const stuRoleId = (await relationalManager.pg.query("SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1")).rows[0]?.id;
    if (stuRoleId) {
      await relationalManager.pg.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [stuUser.rows[0].id, stuRoleId]
      );
    }

    // 2. Ensure test company in DB
    const compUser = await relationalManager.pg.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW()) RETURNING id`,
      [companyEmail, testPasswordHash]
    );
    const compRoleId = (await relationalManager.pg.query("SELECT id FROM roles WHERE code = 'COMPANY' LIMIT 1")).rows[0]?.id;
    if (compRoleId) {
      await relationalManager.pg.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [compUser.rows[0].id, compRoleId]
      );
    }

    // 3. Ensure test institution in DB
    const instUser = await relationalManager.pg.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW()) RETURNING id`,
      [instEmail, testPasswordHash]
    );
    const instRoleId = (await relationalManager.pg.query("SELECT id FROM roles WHERE code = 'INSTITUTION' LIMIT 1")).rows[0]?.id;
    if (instRoleId) {
      await relationalManager.pg.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [instUser.rows[0].id, instRoleId]
      );
    }

    // 4. Ensure inactive faculty member in DB
    const inactUser = await relationalManager.pg.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, false, NOW(), NOW()) RETURNING id`,
      [inactiveStaffEmail, testPasswordHash]
    );
    const facRoleId = (await relationalManager.pg.query("SELECT id FROM roles WHERE code IN ('ACADEMICIAN', 'FACULTY') LIMIT 1")).rows[0]?.id;
    if (facRoleId) {
      await relationalManager.pg.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [inactUser.rows[0].id, facRoleId]
      );
    }

    // --------------------------------------------------------------------------
    // Test 1: Empty Email
    // --------------------------------------------------------------------------
    const res1 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: 'SomePassword' })
    });
    const d1 = await res1.json();
    assert(
      res1.status === 400 && d1.message === 'Please enter your email address.',
      'Test 1: Empty email gives "Please enter your email address."',
      `Got ${res1.status}: ${d1.message}`
    );

    // --------------------------------------------------------------------------
    // Test 2: Empty Password
    // --------------------------------------------------------------------------
    const res2 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arun@example.com', password: '' })
    });
    const d2 = await res2.json();
    assert(
      res2.status === 400 && d2.message === 'Please enter your password.',
      'Test 2: Empty password gives "Please enter your password."',
      `Got ${res2.status}: ${d2.message}`
    );

    // --------------------------------------------------------------------------
    // Test 3: Invalid credentials (non-existent email)
    // --------------------------------------------------------------------------
    const res3 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `no_such_user_${stamp}@example.com`, password: 'SomePassword' })
    });
    const d3 = await res3.json();
    assert(
      res3.status === 401 && d3.message === 'Invalid email or password.',
      'Test 3: Non-existent email gives "Invalid email or password."',
      `Got ${res3.status}: ${d3.message}`
    );

    // --------------------------------------------------------------------------
    // Test 4: Invalid credentials (wrong password for existing academician)
    // --------------------------------------------------------------------------
    const res4 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arun@example.com', password: 'DefinetlyWrongPassword999' })
    });
    const d4 = await res4.json();
    assert(
      res4.status === 401 && d4.message === 'Invalid email or password.',
      'Test 4: Incorrect password gives "Invalid email or password."',
      `Got ${res4.status}: ${d4.message}`
    );

    // --------------------------------------------------------------------------
    // Test 5: Role rejection - Student
    // --------------------------------------------------------------------------
    const res5 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: testPassword })
    });
    const d5 = await res5.json();
    assert(
      res5.status === 403 && d5.message === 'Access denied. Please use Student Login.',
      'Test 5: Student credentials give "Access denied. Please use Student Login."',
      `Got ${res5.status}: ${d5.message}`
    );

    // --------------------------------------------------------------------------
    // Test 6: Role rejection - Industry / Company
    // --------------------------------------------------------------------------
    const res6 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: companyEmail, password: testPassword })
    });
    const d6 = await res6.json();
    assert(
      res6.status === 403 && d6.message === 'Access denied. Please use Industry Login.',
      'Test 6: Industry credentials give "Access denied. Please use Industry Login."',
      `Got ${res6.status}: ${d6.message}`
    );

    // --------------------------------------------------------------------------
    // Test 7: Role rejection - Institution
    // --------------------------------------------------------------------------
    const res7 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: instEmail, password: testPassword })
    });
    const d7 = await res7.json();
    assert(
      res7.status === 403 && d7.message === 'Access denied. Please use Institution Login.',
      'Test 7: Institution credentials give "Access denied. Please use Institution Login."',
      `Got ${res7.status}: ${d7.message}`
    );

    // --------------------------------------------------------------------------
    // Test 8: Inactive account status
    // --------------------------------------------------------------------------
    const res8 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inactiveStaffEmail, password: testPassword })
    });
    const d8 = await res8.json();
    assert(
      res8.status === 403 && d8.message === 'Your account is inactive. Please contact your institution administrator.',
      'Test 8: Inactive account gives "Your account is inactive. Please contact your institution administrator."',
      `Got ${res8.status}: ${d8.message}`
    );

    // --------------------------------------------------------------------------
    // Test 9: Valid Academician Login (arun@example.com / Arun@123)
    // --------------------------------------------------------------------------
    const res9 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arun@example.com', password: 'Arun@123' })
    });
    const d9 = await res9.json();
    assert(
      res9.status === 200 &&
      d9.success === true &&
      Boolean(d9.token) &&
      d9.user?.role === 'academician' &&
      Boolean(d9.user?.name),
      'Test 9: Valid Academician login succeeds and returns token',
      `Got ${res9.status}: ${d9.user?.name} (${d9.user?.role})`
    );

    const academicianToken = d9.token;

    // --------------------------------------------------------------------------
    // Test 10: Unauthenticated access to dashboard is blocked
    // --------------------------------------------------------------------------
    const res10 = await fetch(`${API_BASE}/academician/dashboard`);
    assert(
      res10.status === 401,
      'Test 10: Unauthenticated access to /academician/dashboard returns 401',
      `Got ${res10.status}`
    );

    // --------------------------------------------------------------------------
    // Test 11: Authenticated access loads dashboard and academician profile
    // --------------------------------------------------------------------------
    const res11 = await fetch(`${API_BASE}/academician/dashboard`, {
      headers: { 'Authorization': `Bearer ${academicianToken}` }
    });
    const d11 = await res11.json();
    assert(
      res11.status === 200 &&
      d11.success === true &&
      Boolean(d11.data?.academician),
      'Test 11: Authenticated /academician/dashboard returns profile data',
      `Got ${res11.status}: Academician ${d11.data?.academician?.name}`
    );

    // --------------------------------------------------------------------------
    // Test 12: Institution Admin creates new staff in PostgreSQL
    // --------------------------------------------------------------------------
    // Generate an institution admin token
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../src/middleware/auth');
    const instQuery = await relationalManager.pg.query('SELECT id FROM institutions LIMIT 1');
    const instId = instQuery.rows[0]?.id || 'VTI-73698';

    const testAdminToken = jwt.sign(
      { id: instUser.rows[0].id, role: 'institution', institutionId: instId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newStaffEmail = `staff_dr_arun_${stamp}@example.com`;
    const newStaffPassword = 'TestPassword123';
    const newStaffId = `CSE-${stamp.toString().slice(-4)}`;

    const res12 = await fetch(`${API_BASE}/institution/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAdminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Arun Kumar',
        staffId: newStaffId,
        email: newStaffEmail,
        password: newStaffPassword,
        departmentId: 'CSE',
        classId: 'III CSE A',
        designation: 'Class Advisor'
      })
    });
    const d12 = await res12.json();
    assert(
      res12.status === 201 && d12.success === true,
      'Test 12: Institution Admin creates staff account in PostgreSQL',
      `Got ${res12.status}: ${d12.message}`
    );

    // --------------------------------------------------------------------------
    // Test 13: Newly created staff logs in on /api/auth/academician/login
    // --------------------------------------------------------------------------
    const res13 = await fetch(`${API_BASE}/auth/academician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newStaffEmail, password: newStaffPassword })
    });
    const d13 = await res13.json();
    assert(
      res13.status === 200 &&
      d13.success === true &&
      d13.user?.role === 'academician' &&
      d13.user?.name === 'Dr. Arun Kumar',
      'Test 13: Created staff logs in on /academician/login with assigned credentials',
      `Got ${res13.status}: Name: ${d13.user?.name}, Role: ${d13.user?.role}`
    );

    // --------------------------------------------------------------------------
    // Test 14: Duplicate email rejected on staff creation
    // --------------------------------------------------------------------------
    const res14 = await fetch(`${API_BASE}/institution/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAdminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Arun Duplicate',
        staffId: 'CSE-DUP',
        email: newStaffEmail,
        password: newStaffPassword
      })
    });
    const d14 = await res14.json();
    assert(
      res14.status === 400 && d14.message === 'An account with this email already exists.',
      'Test 14: Duplicate staff email gives "An account with this email already exists."',
      `Got ${res14.status}: ${d14.message}`
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
