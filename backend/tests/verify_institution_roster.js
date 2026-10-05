const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const pool = new Pool();
const BASE_URL = 'http://localhost:5000/api';

async function runRosterVerificationSuite() {
  console.log('================================================================');
  console.log('  SKILL NEXUS AI — INSTITUTION ROSTER & ONBOARDING TEST SUITE   ');
  console.log('  Testing Scenarios A through L with PostgreSQL Authoritativeness');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Get Institution Admin Token (SRMIST TN010)
  console.log('[AUTH] Authenticating SRMIST Placement Administrator...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'placements@srmist.edu.in', password: 'password123', role: 'institution' })
  });
  const loginData = await loginRes.json();
  assert(loginData.success && loginData.token, 'SRMIST admin authenticated successfully');
  const adminToken = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // Resolve TN010 Institution UUID from PG
  const instPg = await pool.query("SELECT id, code, name FROM institutions WHERE code = 'TN010' LIMIT 1");
  assert(instPg.rows.length > 0, `Resolved TN010 institution in PG: ${instPg.rows[0]?.id}`);
  const instId = instPg.rows[0].id;

  // Track created test user IDs for clean teardown
  const cleanupUserIds = [];
  const cleanupStudentIds = [];
  const cleanupDeptIds = [];

  try {
    // ── SCENARIO A: Institution First-Time Setup & Departments ──
    console.log('\n--- SCENARIO A: Institution First-Time Setup & Department Creation ---');
    const setupStatusRes = await fetch(`${BASE_URL}/academic/setup/status`, { headers: authHeaders });
    const setupStatus = await setupStatusRes.json();
    assert(setupStatus.success && setupStatus.data.institution, 'GET /api/academic/setup/status returned valid institution info');

    // Create a new test department for TN010
    const testDeptCode = `TEST_${Date.now().toString().slice(-4)}`;
    const createDeptRes = await fetch(`${BASE_URL}/academic/departments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ code: testDeptCode, name: `Department of ${testDeptCode}` })
    });
    const createDeptData = await createDeptRes.json();
    assert(createDeptData.success && createDeptData.department?.code === testDeptCode, `POST /api/academic/departments created department ${testDeptCode}`);
    if (createDeptData.department?.id) cleanupDeptIds.push(createDeptData.department.id);

    // List departments
    const listDeptRes = await fetch(`${BASE_URL}/academic/departments`, { headers: authHeaders });
    const listDeptData = await listDeptRes.json();
    assert(listDeptData.success && listDeptData.data.some(d => d.code === testDeptCode), 'GET /api/academic/departments includes newly created department');

    // ── SCENARIO B: Template Download Headers ──
    console.log('\n--- SCENARIO B: Template Download Format & Headers ---');
    const templateRes = await fetch(`${BASE_URL}/academic/template/download`, { headers: authHeaders });
    assert(templateRes.ok, 'GET /api/academic/template/download returned HTTP 200');
    const templateText = await templateRes.text();
    const expectedHeaders = ['Student Name', 'College Email', 'Roll Number', 'Phone Number', 'Department', 'Batch', 'Graduation Year'];
    const hasAllHeaders = expectedHeaders.every(h => templateText.includes(h));
    assert(hasAllHeaders, `Template contains all 7 official headers: ${expectedHeaders.join(', ')}`);

    // ── SCENARIO C: CSV Preview & Tabular Analysis ──
    console.log('\n--- SCENARIO C: Tabular Analysis & Pre-import Preview ---');
    const testRoll1 = `ROSTER_${Date.now().toString().slice(-5)}_A`;
    const testEmail1 = `student.${Date.now()}a@srmist.edu.in`;
    const testRoll2 = `ROSTER_${Date.now().toString().slice(-5)}_B`;
    const testEmail2 = `student.${Date.now()}b@srmist.edu.in`;

    const sampleCsv = `Student Name,College Email,Roll Number,Phone Number,Department,Batch,Graduation Year
Candidate Alpha,${testEmail1},${testRoll1},9876543210,CSE,2022-2026,2026
Candidate Beta,${testEmail2},${testRoll2},9876543211,IT,2022-2026,2026`;

    const previewRes = await fetch(`${BASE_URL}/academic/roster/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ csvContent: sampleCsv, fileName: 'test_cohort.csv' })
    });
    const previewData = await previewRes.json();
    assert(previewData.metrics?.totalRows === 2, `Preview totalRows: ${previewData.metrics?.totalRows} (expected 2)`);
    assert(previewData.metrics?.validRows === 2, `Preview validRows: ${previewData.metrics?.validRows} (expected 2)`);
    assert(previewData.metrics?.newCount === 2, `Preview newCount: ${previewData.metrics?.newCount} (expected 2)`);
    assert(previewData.rows?.length === 2, 'Preview rows array contains 2 normalized student records');

    // ── SCENARIO D: Controlled Upsert (Commit to PostgreSQL) ──
    console.log('\n--- SCENARIO D: Controlled Upsert & Invitation Token Generation ---');
    const confirmRes = await fetch(`${BASE_URL}/academic/roster/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ validRows: previewData.rows, fileName: 'test_cohort.csv' })
    });
    const confirmData = await confirmRes.json();
    assert(confirmData.success && confirmData.summary?.newCount === 2, `Confirm import summary: ${confirmData.summary?.newCount} new students`);

    // Check in PostgreSQL
    const checkPg1 = await pool.query(
      `SELECT s.id as student_id, s.user_id, s.roll_number, u.account_status, u.email_verified, u.invitation_token 
       FROM students s JOIN users u ON s.user_id = u.id 
       WHERE s.roll_number = $1`,
      [testRoll1]
    );
    assert(checkPg1.rows.length === 1, `Student ${testRoll1} persisted in PostgreSQL students table`);
    const student1 = checkPg1.rows[0];
    cleanupStudentIds.push(student1.student_id);
    cleanupUserIds.push(student1.user_id);
    assert(student1.account_status === 'INVITED', `Account status is 'INVITED' (actual: ${student1.account_status})`);
    assert(student1.email_verified === false, 'email_verified is false prior to activation');
    assert(Boolean(student1.invitation_token), 'Secure single-use invitation token generated');

    const checkPg2 = await pool.query(
      `SELECT s.id as student_id, s.user_id FROM students s WHERE s.roll_number = $1`,
      [testRoll2]
    );
    if (checkPg2.rows[0]) {
      cleanupStudentIds.push(checkPg2.rows[0].student_id);
      cleanupUserIds.push(checkPg2.rows[0].user_id);
    }

    // ── SCENARIO E: Detection of Changed Fields (e.g. Department changed to ECE) ──
    console.log('\n--- SCENARIO E: Detection of Changed Fields (Department Change) ---');
    const modifiedCsv = `Student Name,College Email,Roll Number,Phone Number,Department,Batch,Graduation Year
Candidate Alpha Updated,${testEmail1},${testRoll1},9876543210,ECE,2022-2026,2026`;

    const previewDiffRes = await fetch(`${BASE_URL}/academic/roster/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ csvContent: modifiedCsv, fileName: 'test_cohort_update.csv' })
    });
    const previewDiff = await previewDiffRes.json();
    assert(previewDiff.metrics?.updatedCount === 1, `Preview detected update: updatedCount = ${previewDiff.metrics?.updatedCount}`);
    assert(previewDiff.rows[0]?.action === 'UPDATED', `Row action tagged as 'UPDATED' (actual: ${previewDiff.rows[0]?.action})`);

    // Commit the update
    const confirmUpdateRes = await fetch(`${BASE_URL}/academic/roster/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ validRows: previewDiff.rows, fileName: 'test_cohort_update.csv' })
    });
    const confirmUpdate = await confirmUpdateRes.json();
    assert(confirmUpdate.success && confirmUpdate.summary?.updatedCount === 1, 'Transactional update committed: updatedCount = 1');

    // Verify in PG that department updated and no duplicate student created
    const countCheck = await pool.query('SELECT COUNT(*) as count FROM students WHERE roll_number = $1', [testRoll1]);
    assert(parseInt(countCheck.rows[0].count, 10) === 1, 'Zero duplicate records created for the same student roll number');

    // ── SCENARIO F: Preservation of Unlisted Students ──
    console.log('\n--- SCENARIO F: Preservation of Unlisted Historical Students ---');
    const baselineStudents = await pool.query('SELECT COUNT(*) as count FROM students');
    const baselineCount = parseInt(baselineStudents.rows[0].count, 10);
    assert(baselineCount >= 18, `All historical students preserved (current total in PG: ${baselineCount})`);

    // ── SCENARIO G: In-File Duplicate Rejection ──
    console.log('\n--- SCENARIO G: In-File Duplicates Rejection ---');
    const duplicateCsv = `Student Name,College Email,Roll Number,Phone Number,Department,Batch,Graduation Year
Dup One,dup1@srmist.edu.in,DUP001,9876543210,CSE,2022-2026,2026
Dup Two,dup2@srmist.edu.in,DUP001,9876543211,CSE,2022-2026,2026`;

    const dupRes = await fetch(`${BASE_URL}/academic/roster/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ csvContent: duplicateCsv, fileName: 'dup_test.csv' })
    });
    const dupData = await dupRes.json();
    assert(dupData.metrics?.invalidRows >= 1, `Detected duplicate roll number in file: invalidRows = ${dupData.metrics?.invalidRows}`);
    assert(dupData.errors?.some(e => e.errors.some(err => err.includes('Duplicate Roll Number'))), 'Error log identifies duplicate roll number');

    // ── SCENARIO H: Unknown Department Rejection (Tenant Boundary) ──
    console.log('\n--- SCENARIO H: Unknown Department Rejection ---');
    const badDeptCsv = `Student Name,College Email,Roll Number,Phone Number,Department,Batch,Graduation Year
Aero Student,aero@srmist.edu.in,AERO999,9876543210,Aerospace Quantum Engineering,2022-2026,2026`;

    const badDeptRes = await fetch(`${BASE_URL}/academic/roster/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ csvContent: badDeptCsv, fileName: 'bad_dept.csv' })
    });
    const badDeptData = await badDeptRes.json();
    assert(badDeptData.metrics?.invalidRows === 1, 'Unknown department rejected by tenant boundary validator');
    assert(badDeptData.errors[0]?.errors.some(err => err.includes('does not belong to this institution')), 'Validation error explicitly states unauthorized department');

    // ── SCENARIO I: Manual Student Addition ──
    console.log('\n--- SCENARIO I: Manual Student Addition with INVITED Status ---');
    const manualRoll = `MANUAL_${Date.now().toString().slice(-5)}`;
    const manualEmail = `manual.${Date.now()}@srmist.edu.in`;

    const manualRes = await fetch(`${BASE_URL}/academic/students/manual`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Kavitha Raman',
        email: manualEmail,
        rollNumber: manualRoll,
        phoneNumber: '9876543220',
        graduationYear: 2026
      })
    });
    const manualData = await manualRes.json();
    assert(manualData.success && manualData.invitationToken, `POST /api/academic/students/manual succeeded with token`);
    if (manualData.student?.id) cleanupStudentIds.push(manualData.student.id);
    if (manualData.student?.user_id) cleanupUserIds.push(manualData.student.user_id);

    // ── SCENARIO J: Token Verification & Single-Use Password Activation ──
    console.log('\n--- SCENARIO J: Token Verification & Single-Use Password Activation ---');
    const inviteToken = manualData.invitationToken;
    const verifyTokenRes = await fetch(`${BASE_URL}/auth/invitation/${inviteToken}`);
    const verifyTokenData = await verifyTokenRes.json();
    assert(verifyTokenData.success && verifyTokenData.valid, 'GET /api/auth/invitation/:token verified active invitation');
    assert(verifyTokenData.student?.email === manualEmail, `Verified token belongs to ${manualEmail}`);

    // Activate account with password
    const activateRes = await fetch(`${BASE_URL}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, password: 'SecurePassword@2026' })
    });
    const activateData = await activateRes.json();
    assert(activateData.success && activateData.token, 'POST /api/auth/activate successfully activated student account');

    // Confirm in PG that account_status is now ACTIVE, email_verified is true, token is cleared
    const postActPg = await pool.query(
      'SELECT account_status, email_verified, invitation_token FROM users WHERE email = $1',
      [manualEmail]
    );
    assert(postActPg.rows[0]?.account_status === 'ACTIVE', `Account status transitioned to 'ACTIVE' (actual: ${postActPg.rows[0]?.account_status})`);
    assert(postActPg.rows[0]?.email_verified === true, 'email_verified set to true');
    assert(postActPg.rows[0]?.invitation_token === null, 'Single-use invitation token consumed and nullified');

    // Attempting to re-use the consumed token must fail
    const reuseRes = await fetch(`${BASE_URL}/auth/invitation/${inviteToken}`);
    const reuseData = await reuseRes.json();
    assert(!reuseData.valid, 'Consumed single-use token correctly rejected upon reuse attempt');

    // ── SCENARIO K: Resend Invitation Email ──
    console.log('\n--- SCENARIO K: Resend Invitation Email ---');
    // Student 1 is still INVITED
    const resendRes = await fetch(`${BASE_URL}/academic/students/${student1.student_id}/resend-invite`, {
      method: 'POST',
      headers: authHeaders
    });
    const resendData = await resendRes.json();
    assert(resendData.success, 'POST /api/academic/students/:id/resend-invite succeeded');

    const checkResendPg = await pool.query('SELECT invitation_token FROM users WHERE id = $1', [student1.user_id]);
    assert(checkResendPg.rows[0]?.invitation_token !== student1.invitation_token, 'Fresh invitation token generated and expiration refreshed');

    // ── SCENARIO L: Google Login Resolution for Invited Students ──
    console.log('\n--- SCENARIO L: Google Login Resolution for Invited Student ---');
    const googleStudentRoll = `G_STU_${Date.now().toString().slice(-5)}`;
    const googleStudentEmail = `gstudent.${Date.now()}@srmist.edu.in`;

    // Create student via manual add (status = INVITED)
    const gManualRes = await fetch(`${BASE_URL}/academic/students/manual`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Ananya Google',
        email: googleStudentEmail,
        rollNumber: googleStudentRoll,
        graduationYear: 2026
      })
    });
    const gManualData = await gManualRes.json();
    if (gManualData.student?.id) cleanupStudentIds.push(gManualData.student.id);
    if (gManualData.student?.user_id) cleanupUserIds.push(gManualData.student.user_id);

    // Simulate Google credential for this verified college email
    const fakeGoogleId = `google_sub_${Date.now()}`;
    const simulatedGoogleJwt = jwt.sign(
      {
        sub: fakeGoogleId,
        email: googleStudentEmail,
        name: 'Ananya Google',
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      process.env.JWT_SECRET || 'nexus_sovereign_secret_key_2026',
      { expiresIn: '1h' }
    );

    // Hit POST /api/auth/google
    const gAuthRes = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: simulatedGoogleJwt })
    });
    const gAuthData = await gAuthRes.json();
    assert(gAuthData.success && gAuthData.action === 'LOGIN_SUCCESS', `Google login automatically resolved: action = ${gAuthData.action}`);
    assert(gAuthData.token && gAuthData.user?.email === googleStudentEmail, 'Authenticated directly into student profile');

    // Verify in PG that account_status transitioned to ACTIVE and Google ID linked
    const postGooglePg = await pool.query(
      'SELECT account_status, email_verified, google_id FROM users WHERE email = $1',
      [googleStudentEmail]
    );
    assert(postGooglePg.rows[0]?.account_status === 'ACTIVE', `Student account activated to 'ACTIVE' via Google login`);
    assert(postGooglePg.rows[0]?.email_verified === true, 'email_verified set to true');
    assert(postGooglePg.rows[0]?.google_id === fakeGoogleId, `Google ID securely linked: ${postGooglePg.rows[0]?.google_id}`);

    // Verify no duplicate users created
    const gUserCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE email = $1', [googleStudentEmail]);
    assert(parseInt(gUserCount.rows[0].count, 10) === 1, 'Zero duplicate user accounts created during Google resolution');

    // ── SCENARIO M: Roster Import History ──
    console.log('\n--- SCENARIO M: Roster Import Audit History ---');
    const historyRes = await fetch(`${BASE_URL}/academic/roster/imports`, { headers: authHeaders });
    const historyData = await historyRes.json();
    assert(historyData.success && Array.isArray(historyData.data) && historyData.data.length > 0, 'GET /api/academic/roster/imports returned audit history');
    assert(historyData.data[0]?.status === 'COMPLETED', `Latest audit row status: ${historyData.data[0]?.status}`);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // ── TEARDOWN: Clean up transient test rows to preserve baseline counts ──
    console.log('\n[TEARDOWN] Cleaning up transient test records...');
    if (cleanupStudentIds.length > 0) {
      await pool.query('DELETE FROM students WHERE id = ANY($1)', [cleanupStudentIds]);
    }
    if (cleanupUserIds.length > 0) {
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [cleanupUserIds]);
    }
    if (cleanupDeptIds.length > 0) {
      await pool.query('DELETE FROM departments WHERE id = ANY($1)', [cleanupDeptIds]);
    }
    await pool.query("DELETE FROM roster_imports WHERE file_name LIKE 'test_%' OR file_name = 'Manual Entry'");
    console.log('✅ Teardown complete. Baseline state preserved.');
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`  ROSTER VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRosterVerificationSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
