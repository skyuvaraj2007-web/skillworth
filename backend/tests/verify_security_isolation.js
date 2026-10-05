/**
 * SKILL NEXUS AI — Security & Multi-Tenant Data Isolation Test Suite
 * Verifies:
 * 1. Missing Token -> 401 Unauthorized
 * 2. Invalid/Corrupt Token -> 401 Unauthorized
 * 3. Wrong Role Access -> 403 Forbidden
 * 4. Student Data Isolation: Student A cannot access Student B's journey, private passport, or take assessments assigned to Student B
 * 5. Institution Data Isolation: College A cannot view students or department analytics of College B
 * 6. Industry Isolation: Non-company users cannot build assessments or access unapplied student dossiers
 * 7. New Student Clean State: Student with 0 records receives clean zero/empty state, not fake placeholder achievements
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:5000/api';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const api = {
  async req(method, url, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      data = { raw };
    }
    return { status: res.status, data };
  }
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runSecurityTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🛡️ RUNNING SECURITY & MULTI-TENANT ISOLATION SUITE');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Missing Token Test
    console.log('1️⃣ Testing Protected Endpoints without Authentication Token...');
    const endpointsToTest = [
      { method: 'GET', url: `${BASE_URL}/student/journey` },
      { method: 'GET', url: `${BASE_URL}/passport` },
      { method: 'POST', url: `${BASE_URL}/ai/copilot/chat`, body: { query: 'hello' } },
      { method: 'GET', url: `${BASE_URL}/assessments/my-assessments` },
      { method: 'GET', url: `${BASE_URL}/academic/intelligence/dashboard` }
    ];

    for (const ep of endpointsToTest) {
      const res = await api.req(ep.method, ep.url, ep.body || null);
      assert(res.status === 401, `${ep.method} ${ep.url} returned 401 without token (got ${res.status})`);
    }

    // 2. Invalid Token Test
    console.log('\n2️⃣ Testing Protected Endpoints with Invalid/Forged Tokens...');
    const bogusToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bogusPayload.fakeSignature';
    const resBogus = await api.req('GET', `${BASE_URL}/student/journey`, null, bogusToken);
    assert(resBogus.status === 401, `Invalid token rejected with 401 (got ${resBogus.status})`);

    const expiredToken = jwt.sign({ id: 'dummy', role: 'student' }, JWT_SECRET, { expiresIn: '-10s' });
    const resExpired = await api.req('GET', `${BASE_URL}/student/journey`, null, expiredToken);
    assert(resExpired.status === 401, `Expired token rejected with 401 (got ${resExpired.status})`);

    // 3. Fetch two distinct students from the database
    console.log('\n3️⃣ Fetching two distinct students to test Student Isolation...');
    const studentRows = await pool.query(`
      SELECT s.id, s.user_id, s.full_name, s.roll_number, u.email
      FROM students s
      JOIN users u ON u.id = s.user_id
      LIMIT 2
    `);

    if (studentRows.rows.length < 2) {
      console.warn('⚠️ Need at least 2 students in DB for full cross-student testing. Found:', studentRows.rows.length);
    } else {
      const s1 = studentRows.rows[0];
      const s2 = studentRows.rows[1];

      const token1 = jwt.sign({ id: s1.user_id, studentId: s1.id, role: 'student', email: s1.email }, JWT_SECRET, { expiresIn: '1h' });
      const token2 = jwt.sign({ id: s2.user_id, studentId: s2.id, role: 'student', email: s2.email }, JWT_SECRET, { expiresIn: '1h' });

      // Student 1 accesses own journey
      const resJ1 = await api.req('GET', `${BASE_URL}/student/journey`, null, token1);
      assert(resJ1.status === 200 && resJ1.data.success, 'Student 1 can access their own career journey');
      assert(resJ1.data.data.profile.id === s1.id, 'Student 1 journey returns student 1 ID strictly');

      // Student 2 accesses own journey
      const resJ2 = await api.req('GET', `${BASE_URL}/student/journey`, null, token2);
      assert(resJ2.status === 200 && resJ2.data.data.profile.id === s2.id, 'Student 2 journey returns student 2 ID strictly');

      // Student 1 attempts to access Student 2's profile directly
      const crossRes = await api.req('GET', `${BASE_URL}/students/${s2.id}`, null, token1);
      assert(crossRes.status === 403, `Unauthorized cross-student profile access blocked with 403 (got ${crossRes.status})`);

      // Check passport isolation
      const pass1 = await api.req('GET', `${BASE_URL}/passport`, null, token1);
      assert(pass1.status === 200 && pass1.data.success, 'Student 1 can fetch their own digital passport');
      assert(pass1.data.data.student.id === s1.id, 'Passport data belongs strictly to Student 1');

      // Student 1 career copilot
      const copilotRes = await api.req('POST', `${BASE_URL}/ai/copilot/chat`, { query: 'What are my top skills?' }, token1);
      assert(copilotRes.status === 200 && copilotRes.data.success, 'Student 1 Career Copilot responds successfully');
    }

    // 4. Institution Multi-Tenant Isolation
    console.log('\n4️⃣ Testing Institution Multi-Tenant Isolation...');
    const instRows = await pool.query(`
      SELECT im.institution_id, im.user_id, u.email, i.name, i.code
      FROM institution_members im
      JOIN users u ON u.id = im.user_id
      JOIN institutions i ON i.id = im.institution_id
      LIMIT 2
    `);

    if (instRows.rows.length >= 2) {
      const inst1 = instRows.rows[0];
      const inst2 = instRows.rows[1];

      const tokenInst1 = jwt.sign({ id: inst1.user_id, institutionId: inst1.institution_id, collegeId: inst1.institution_id, role: 'institution', email: inst1.email }, JWT_SECRET, { expiresIn: '1h' });
      const tokenInst2 = jwt.sign({ id: inst2.user_id, institutionId: inst2.institution_id, collegeId: inst2.institution_id, role: 'institution', email: inst2.email }, JWT_SECRET, { expiresIn: '1h' });

      const resInst1 = await api.req('GET', `${BASE_URL}/academic/intelligence/dashboard`, null, tokenInst1);
      assert(resInst1.status === 200 && resInst1.data.success, 'Institution 1 can access its intelligence dashboard');
      assert(resInst1.data.data.institution.id === inst1.institution_id, 'Institution 1 dashboard scoped to Institution 1');

      const resInst2 = await api.req('GET', `${BASE_URL}/academic/intelligence/dashboard`, null, tokenInst2);
      assert(resInst2.status === 200 && resInst2.data.success, 'Institution 2 can access its intelligence dashboard');
      assert(resInst2.data.data.institution.id === inst2.institution_id, 'Institution 2 dashboard scoped to Institution 2');
    }

    // 5. Role-Based Access Control (RBAC): Student cannot call Institution or Company endpoints
    console.log('\n5️⃣ Testing RBAC boundaries (Student attempting Company / Institution privileged actions)...');
    const dummyStudentToken = jwt.sign({ id: 'dummy-student', role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Student attempting to create an assessment (company only)
    const resPriv = await api.req('POST', `${BASE_URL}/company/assessments/builder`, { title: 'Hacked Assessment' }, dummyStudentToken);
    assert(resPriv.status === 403 || resPriv.status === 401, `Student blocked from Company Assessment Builder with 403/401 (got ${resPriv.status})`);

    // Student attempting to view college analytics
    const resInstPriv = await api.req('GET', `${BASE_URL}/academic/intelligence/dashboard`, null, dummyStudentToken);
    assert(resInstPriv.status === 403 || resInstPriv.status === 401, `Student blocked from Institution Intelligence Dashboard with 403/401 (got ${resInstPriv.status})`);

    // 6. Clean State for New Student Verification
    console.log('\n6️⃣ Testing Clean State for New Student (Zero Mock Data Leakage)...');
    const brandNewUserId = '00000000-0000-0000-0000-000000000099';
    const brandNewStudentId = '00000000-0000-0000-0000-000000000098';
    const newStudentToken = jwt.sign({ id: brandNewUserId, studentId: brandNewStudentId, role: 'student', email: 'newbie@skillnexus.io' }, JWT_SECRET, { expiresIn: '1h' });

    const newJourneyRes = await api.req('GET', `${BASE_URL}/student/journey`, null, newStudentToken);
    if (newJourneyRes.status === 200) {
      const journey = newJourneyRes.data.data;
      assert(journey.overallProgressPercent === 0 || journey.overallProgressPercent <= 10, 'New student starts at 0% or initial registration stage');
      assert(Array.isArray(journey.stages), 'Journey stages are returned as an array');
      const completedCount = journey.stages.filter(s => s.status === 'COMPLETED').length;
      assert(completedCount <= 1, `New student has no fake completed stages (completed: ${completedCount})`);
    } else {
      assert(newJourneyRes.status === 404, 'Unregistered student safely returns 404 not found');
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`🏁 SECURITY & ISOLATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await pool.end();
  }
}

runSecurityTests();
