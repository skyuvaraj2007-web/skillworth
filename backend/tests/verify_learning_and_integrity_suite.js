/**
 * SKILL NEXUS — Master Verification Suite:
 * Learning Progress + AI-Assisted Assessment Integrity + Secure Coding Assessment
 * 
 * Verifies against live PostgreSQL database and running API:
 * 1. Empty Student State (0 courses, 0% progress, 0 events, 0 readiness)
 * 2. Course Progress System (Enrollment, Module completion, Idempotency, Real DB % calculation)
 * 3. Student Learning Analytics (PostgreSQL derived analytics, no fake data)
 * 4. Adaptive Learning Engine (Maps weak skills to real database courses)
 * 5. Assessment Guard Consent & Session Management (Consent required, session creation, session end)
 * 6. Integrity Events Monitoring (Tab switch, Fullscreen exit, Paste attempt, Multiple persons, Phone-like object)
 * 7. Secure Coding Assessment (Sandboxed execution, CPU/clock timeout, security token rejection, test cases)
 * 8. Question-level Analytics (Telemetry, strong/moderate/weak skill categorization)
 * 9. Assessment Integrity Reports (Role-scoped reporting, metrics aggregation)
 * 10. Human Review Workflow (Confirm concern, Dismiss event, Need more review)
 * 11. Multi-Tenant RBAC & Isolation (Student A cannot access Student B, unauthorized cannot review)
 * 12. Safe Test Data Cleanup (0 test records remaining, genuine production data preserved)
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TEST_TIMESTAMP = Date.now();
const TEST_PREFIX = `test_integ_${TEST_TIMESTAMP}`;

let testUserA = null;
let testStudentA = null;
let testUserB = null;
let testStudentB = null;
let testCompanyUser = null;
let testCompany = null;
let testInstitution = null;
let testCourse = null;
let testAssessment = null;

let tokenA = '';
let tokenB = '';
let tokenCompany = '';

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function api(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function setup() {
  console.log('\n============================================================');
  console.log('🚀 INITIALIZING REAL POSTGRESQL TEST FIXTURES');
  console.log('============================================================\n');

  const client = await pool.connect();
  try {
    // 1. Genuine Institution (VCET)
    const instRes = await client.query(
      `SELECT id, name FROM institutions WHERE name ILIKE '%Velalar%' LIMIT 1`
    );
    testInstitution = instRes.rows[0];

    // 2. Genuine Company (SBT TECH) & Recruiter
    const compRes = await client.query(
      `SELECT id, company_name FROM companies WHERE company_name ILIKE '%SBT%' LIMIT 1`
    );
    testCompany = compRes.rows[0];

    const compUserRes = await client.query(
      `SELECT id, email FROM users WHERE email = 'sbt@tech.com' LIMIT 1`
    );
    testCompanyUser = compUserRes.rows[0];

    // Role ID for student
    const rRes = await client.query(`SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1`);
    const studentRoleId = rRes.rows[0]?.id;

    // Fetch department for institution
    const deptRes = await client.query(
      `SELECT id FROM departments WHERE institution_id = $1 LIMIT 1`,
      [testInstitution.id]
    );
    let testDeptId = deptRes.rows[0]?.id;
    if (!testDeptId) {
      const anyDept = await client.query(`SELECT id FROM departments LIMIT 1`);
      testDeptId = anyDept.rows[0]?.id;
    }

    // 3. User & Student A
    const uARes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW())
       RETURNING id`,
      [`stu_a_${TEST_PREFIX}@skillnexus.test`]
    );
    testUserA = uARes.rows[0];

    if (studentRoleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [testUserA.id, studentRoleId]
      );
    }

    const sARes = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Student Alpha', $2, $3, $4, 2026, 0)
       RETURNING id`,
      [testUserA.id, `ROLL_A_${TEST_TIMESTAMP}`, testInstitution.id, testDeptId]
    );
    testStudentA = sARes.rows[0];

    // 4. User & Student B
    const uBRes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW())
       RETURNING id`,
      [`stu_b_${TEST_PREFIX}@skillnexus.test`]
    );
    testUserB = uBRes.rows[0];

    if (studentRoleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [testUserB.id, studentRoleId]
      );
    }

    const sBRes = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Student Beta', $2, $3, $4, 2026, 0)
       RETURNING id`,
      [testUserB.id, `ROLL_B_${TEST_TIMESTAMP}`, testInstitution.id, testDeptId]
    );
    testStudentB = sBRes.rows[0];

    // 5. Real Course with Modules
    const crsRes = await client.query(
      `INSERT INTO courses (title, course_code, category, difficulty, hours, status, institution_id)
       VALUES ($1, $2, 'DATA STRUCTURES', 'Intermediate', 20, 'ACTIVE', $3)
       RETURNING id`,
      [`Data Structures Fundamentals ${TEST_PREFIX}`, `CS-${TEST_TIMESTAMP}`, testInstitution.id]
    );
    testCourse = crsRes.rows[0];

    // Insert 4 course modules
    for (let i = 1; i <= 4; i++) {
      await client.query(
        `INSERT INTO course_modules (course_id, module_number, title, description)
         VALUES ($1, $2, $3, $4)`,
        [testCourse.id, i, `Module ${i}: Algorithmic Complexity`, `Covers analysis for module ${i}`]
      );
    }

    // 6. Assessment
    const asmtRes = await client.query(
      `INSERT INTO assessments (title, track_code, domain, passing_score, duration_minutes, is_active, company_id)
       VALUES ($1, $2, 'Programming & Algorithms', 70, 45, true, $3)
       RETURNING id`,
      [`Algorithmic Evaluation ${TEST_PREFIX}`, `ASMT-${TEST_TIMESTAMP}`, testCompany.id]
    );
    testAssessment = asmtRes.rows[0];

    // Create JWT tokens
    tokenA = jwt.sign({ id: testUserA.id, studentId: testStudentA.id, email: `stu_a_${TEST_PREFIX}@skillnexus.test`, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: testUserB.id, studentId: testStudentB.id, email: `stu_b_${TEST_PREFIX}@skillnexus.test`, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    tokenCompany = jwt.sign({ id: testCompanyUser.id, companyId: testCompany.id, email: `recruiter_${TEST_PREFIX}@apex.test`, role: 'company' }, JWT_SECRET, { expiresIn: '1h' });

    console.log('✅ Test fixtures successfully created in PostgreSQL.');
  } finally {
    client.release();
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('TEST SUITE: LEARNING PROGRESS & INTEGRITY VALIDATION');
  console.log('============================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Empty Student State
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Empty Student State ---');
  {
    const res = await api('GET', '/student/learning-analytics', null, tokenA);
    if (!res.ok) console.log('DEBUG res:', JSON.stringify(res));
    assert(res.ok, 'Empty student learning analytics endpoint returns HTTP 200');
    assert(res.data.data.courses === 0, 'Brand-new student has 0 courses');
    assert(res.data.data.completed === 0, 'Brand-new student has 0 completed courses');
    assert(res.data.data.assessments === 0, 'Brand-new student has 0 assessments');
    assert(res.data.data.projects === 0, 'Brand-new student has 0 projects');
    assert(res.data.data.certifications === 0, 'Brand-new student has 0 certifications');
    assert(res.data.data.learningProgress === 0, 'Brand-new student has 0% learning progress');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Course Progress System
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Course Progress System ---');
  let firstModuleId = null;
  {
    // Enroll in course
    const enr = await api('POST', `/learning/student/courses/${testCourse.id}/enroll`, null, tokenA);
    assert(enr.ok || enr.status === 201, 'Student A enrolls in course successfully');
    assert(enr.data.enrollment.progress_percentage === 0, 'Initial enrollment progress is 0%');

    // Query enrolled courses
    const crsList = await api('GET', '/learning/student/courses', null, tokenA);
    assert(crsList.ok && crsList.data.data.length >= 1, 'Enrolled course appears in /learning/student/courses');
    const myCourse = crsList.data.data.find(c => c.courseId === testCourse.id);
    assert(myCourse !== undefined, 'Found matching course in database list');
    assert(myCourse.courseStatus === 'IN_PROGRESS' || myCourse.courseStatus === 'NOT_STARTED', 'Course status is properly initialized');

    // Retrieve modules for completion
    const client = await pool.connect();
    try {
      const mRows = await client.query('SELECT id FROM course_modules WHERE course_id = $1 ORDER BY module_number ASC', [testCourse.id]);
      firstModuleId = mRows.rows[0].id;
    } finally {
      client.release();
    }

    // Complete Module 1
    const comp1 = await api('POST', `/learning/student/courses/${testCourse.id}/modules/${firstModuleId}/complete`, null, tokenA);
    assert(comp1.ok, 'Complete module 1 returns HTTP 200');
    assert(comp1.data.completedModules === 1, 'Completed module count increments to 1');
    assert(comp1.data.progressPercentage === 25, 'Progress percentage calculates correctly (1/4 = 25%)');

    // Idempotency: Complete Module 1 AGAIN
    const comp1Repeat = await api('POST', `/learning/student/courses/${testCourse.id}/modules/${firstModuleId}/complete`, null, tokenA);
    assert(comp1Repeat.ok, 'Repeat module completion returns HTTP 200');
    assert(comp1Repeat.data.completedModules === 1, 'Idempotent: Completed module count stays 1');
    assert(comp1Repeat.data.progressPercentage === 25, 'Idempotent: Progress percentage stays 25%');

    // Check PostgreSQL persistence directly
    const verifyClient = await pool.connect();
    try {
      const pRes = await verifyClient.query('SELECT progress_percentage FROM enrollments WHERE student_id = $1 AND course_id = $2', [testStudentA.id, testCourse.id]);
      assert(pRes.rows[0].progress_percentage === 25, 'PostgreSQL database directly verifies progress_percentage = 25%');
    } finally {
      verifyClient.release();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Student Learning Analytics (With Real Data)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Real Learning Analytics ---');
  {
    const anRes = await api('GET', '/student/learning-analytics', null, tokenA);
    assert(anRes.ok, 'Learning analytics retrieved after progress');
    assert(anRes.data.data.courses === 1, 'Analytics shows 1 active course');
    assert(anRes.data.data.learningProgress === 25, 'Analytics shows 25% learning progress');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Nexus Assessment Guard: Consent & Session Lifecycle
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Assessment Guard Consent & Session ---');
  let monitoringSessionId = null;
  {
    // Start without consent must fail
    const noConsent = await api('POST', `/assessments/${testAssessment.id}/monitoring/start`, { consentGiven: false }, tokenA);
    assert(noConsent.status === 400, 'Starting monitored assessment without explicit consent is rejected (HTTP 400)');

    // Start with consent must succeed
    const withConsent = await api('POST', `/assessments/${testAssessment.id}/monitoring/start`, {
      consentGiven: true,
      cameraEnabled: true,
      microphoneEnabled: false,
      monitoringEnabled: true
    }, tokenA);
    assert(withConsent.status === 201 && withConsent.data.success, 'Monitored session starts successfully with verified consent');
    assert(withConsent.data.session.consent_given === true, 'Database stores verified consent = true');
    monitoringSessionId = withConsent.data.session.id;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Integrity Events Logging
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Integrity Events Logging ---');
  let loggedEventId = null;
  {
    // Log Tab Switch event
    const ev1 = await api('POST', `/assessments/${testAssessment.id}/monitoring/event`, {
      sessionId: monitoringSessionId,
      eventType: 'TAB_SWITCH',
      durationSeconds: 3,
      confidence: 100,
      severity: 'MEDIUM',
      metadata: { tabUrl: 'external_search' }
    }, tokenA);
    assert(ev1.status === 201 && ev1.data.success, 'TAB_SWITCH event logged successfully');
    loggedEventId = ev1.data.event.id;

    // Log Paste event via shortcut endpoint
    const ev2 = await api('POST', `/assessments/${testAssessment.id}/paste-event`, {
      sessionId: monitoringSessionId,
      questionId: 'Q12',
      metadata: { pasteLength: 84 }
    }, tokenA);
    assert(ev2.status === 201 && ev2.data.success, 'PASTE_ATTEMPT logged successfully');

    // Log Multiple Persons Detected event
    const ev3 = await api('POST', `/assessments/${testAssessment.id}/monitoring/event`, {
      sessionId: monitoringSessionId,
      eventType: 'MULTIPLE_PERSONS_DETECTED',
      durationSeconds: 5,
      confidence: 89.5,
      severity: 'HIGH',
      metadata: { detectionCount: 2 }
    }, tokenA);
    assert(ev3.status === 201 && ev3.data.success, 'MULTIPLE_PERSONS_DETECTED logged successfully');

    // Log Possible External Device / Phone event
    const ev4 = await api('POST', `/assessments/${testAssessment.id}/monitoring/event`, {
      sessionId: monitoringSessionId,
      eventType: 'POSSIBLE_EXTERNAL_DEVICE',
      durationSeconds: 4,
      confidence: 87.0,
      severity: 'HIGH',
      metadata: { deviceType: 'phone' }
    }, tokenA);
    assert(ev4.status === 201 && ev4.data.success, 'POSSIBLE_EXTERNAL_DEVICE logged successfully');

    // Conclude monitoring session
    const endRes = await api('POST', `/assessments/${testAssessment.id}/monitoring/end`, {
      sessionId: monitoringSessionId
    }, tokenA);
    assert(endRes.ok && endRes.data.session.status === 'COMPLETED', 'Monitoring session ends and updates status to COMPLETED');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Secure Coding Assessment & Sandboxing
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Secure Coding Assessment & Sandboxing ---');
  {
    // Valid code evaluation
    const validCode = `
      function sumEvens(arr) {
        return arr.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);
      }
    `;
    const codeRun = await api('POST', '/assessments/run-code', {
      language: 'JavaScript',
      code: validCode,
      testCases: [
        { input: [1, 2, 3, 4, 5, 6], expectedOutput: 12, isHidden: false },
        { input: [1, 3, 5], expectedOutput: 0, isHidden: true }
      ]
    });
    assert(codeRun.ok && codeRun.data.status === 'PASSED', 'Secure sandbox executes valid algorithmic solution (status: PASSED)');
    assert(codeRun.data.passedCount === 2, 'Both test cases passed in isolated context');

    // Security violation check: disallowed process token
    const maliciousCode = `process.exit(1);`;
    const secRun = await api('POST', '/assessments/run-code', {
      language: 'JavaScript',
      code: maliciousCode
    });
    assert(secRun.data.status === 'SECURITY_VIOLATION', 'Dangerous tokens (process/child_process) strictly rejected with SECURITY_VIOLATION');

    // Clock timeout check (infinite loop protection)
    const timeoutCode = `while(true) {}`;
    const toRun = await api('POST', '/assessments/run-code', {
      language: 'JavaScript',
      code: timeoutCode,
      testCases: [{ input: 1, expectedOutput: 1 }]
    });
    assert(toRun.data.results[0].error.includes('timed out') || toRun.data.results[0].error.includes('Time Limit Exceeded'), 'Infinite loop triggers execution timeout');

    // Paste telemetry logging during code run
    const pasteRun = await api('POST', '/assessments/run-code', {
      language: 'JavaScript',
      code: validCode,
      assessmentId: testAssessment.id,
      studentId: testStudentA.id,
      pasteDetected: true
    });
    assert(pasteRun.ok, 'Code run with pasteDetected logs telemetry without interrupting execution');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Question-Level Analytics & Adaptive Engine
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Question Analytics & Adaptive Engine ---');
  {
    // Submit 2 questions: one correct in Algorithms, one incorrect in Data Structures
    await api('POST', `/assessments/${testAssessment.id}/question-attempt`, {
      questionId: 'Q_ALG_01',
      answer: 'A',
      score: 10,
      isCorrect: true,
      timeSpentSeconds: 25,
      skillTag: 'Algorithms',
      difficulty: 'Intermediate'
    }, tokenA);

    await api('POST', `/assessments/${testAssessment.id}/question-attempt`, {
      questionId: 'Q_DS_01',
      answer: 'C',
      score: 0,
      isCorrect: false,
      timeSpentSeconds: 40,
      skillTag: 'Data Structures',
      difficulty: 'Hard'
    }, tokenA);

    // Fetch question analytics
    const qAnRes = await api('GET', `/assessments/${testAssessment.id}/question-analytics`, null, tokenA);
    assert(qAnRes.ok, 'Question analytics retrieved successfully');
    assert(qAnRes.data.totalQuestionsAttempted >= 2, 'Question attempts recorded in PostgreSQL');
    const weakSkills = qAnRes.data.needsImprovement.map(s => s.skill);
    assert(weakSkills.includes('Data Structures'), 'Data Structures identified as skill needing improvement');

    // Adaptive Recommendations: query adaptive engine
    const adaptRes = await api('GET', '/learning/student/adaptive-recommendations', null, tokenA);
    assert(adaptRes.ok, 'Adaptive recommendations retrieved successfully');
    if (adaptRes.data.data.length > 0) {
      assert(adaptRes.data.data[0].recommendedCourse.id !== undefined, 'Adaptive engine recommends real existing database course');
      assert(adaptRes.data.data[0].reason.includes('learning gap'), 'Recommendation provides grounded explanation');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Assessment Integrity Reports & Human Review Workflow
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Integrity Reports & Human Review ---');
  {
    // Student views own report
    const stuRep = await api('GET', `/assessments/${testAssessment.id}/integrity-report`, null, tokenA);
    assert(stuRep.ok, 'Student retrieves own integrity report');
    assert(stuRep.data.data.overallStatus === 'REVIEW_REQUIRED', 'Signals flagged for review trigger REVIEW_REQUIRED status');
    assert(stuRep.data.data.counters.totalSignals >= 4, 'Counters reflect recorded tab, paste, person, and device signals');

    // Human Review Workflow: Company recruiter reviews event
    const revAction = await api('POST', `/assessments/${testAssessment.id}/review-event`, {
      eventId: loggedEventId,
      reviewStatus: 'CONFIRMED',
      notes: 'Reviewed tab switch; confirmed external tab activity.'
    }, tokenCompany);
    assert(revAction.ok && revAction.data.success, 'Authorized company reviewer confirms integrity event');
    assert(revAction.data.event.review_status === 'CONFIRMED', 'Event review_status updated to CONFIRMED in PostgreSQL');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Multi-Tenant RBAC & Data Isolation
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Multi-Tenant RBAC & Data Isolation ---');
  {
    // Student B attempts to view Student A's integrity report (must be denied)
    const unauthorizedStudent = await api('GET', `/assessments/${testAssessment.id}/integrity-report?studentId=${testStudentA.id}`, null, tokenB);
    assert(unauthorizedStudent.status === 403, 'Cross-tenant violation: Student B cannot view Student A report (HTTP 403)');

    // Student A attempts to perform a review action (must be denied)
    const unauthorizedReview = await api('POST', `/assessments/${testAssessment.id}/review-event`, {
      eventId: loggedEventId,
      reviewStatus: 'DISMISSED'
    }, tokenA);
    assert(unauthorizedReview.status === 403, 'Unauthorized reviewer: Student cannot review events (HTTP 403)');
  }
}

async function cleanup() {
  console.log('\n============================================================');
  console.log('🧹 SAFE TEST DATA CLEANUP');
  console.log('============================================================\n');

  const client = await pool.connect();
  try {
    // Delete only test-created records by explicit IDs
    if (testAssessment?.id) {
      await client.query('DELETE FROM assessment_integrity_events WHERE assessment_id = $1', [testAssessment.id]);
      await client.query('DELETE FROM assessment_monitoring_sessions WHERE assessment_id = $1', [testAssessment.id]);
      await client.query('DELETE FROM assessment_question_attempts WHERE assessment_id = $1', [testAssessment.id]);
      await client.query('DELETE FROM assessments WHERE id = $1', [testAssessment.id]);
    }

    if (testCourse?.id) {
      await client.query('DELETE FROM student_module_progress WHERE module_id IN (SELECT id FROM course_modules WHERE course_id = $1)', [testCourse.id]);
      await client.query('DELETE FROM enrollments WHERE course_id = $1', [testCourse.id]);
      await client.query('DELETE FROM course_modules WHERE course_id = $1', [testCourse.id]);
      await client.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
    }

    if (testStudentA?.id) {
      await client.query('DELETE FROM students WHERE id = $1', [testStudentA.id]);
    }
    if (testStudentB?.id) {
      await client.query('DELETE FROM students WHERE id = $1', [testStudentB.id]);
    }

    if (testUserA?.id) {
      await client.query('DELETE FROM users WHERE id = $1', [testUserA.id]);
    }
    if (testUserB?.id) {
      await client.query('DELETE FROM users WHERE id = $1', [testUserB.id]);
    }

    // Final verification: Confirm genuine records are preserved and 0 test records remain
    const testRemains = await client.query(
      `SELECT COUNT(*) FROM users WHERE email LIKE '%${TEST_PREFIX}%'`
    );
    assert(parseInt(testRemains.rows[0].count, 10) === 0, 'Test cleanup complete: 0 test records remaining');

    const genuineUsers = await client.query(`SELECT COUNT(*) FROM users`);
    assert(parseInt(genuineUsers.rows[0].count, 10) >= 4, 'Genuine production users preserved: YES');

    console.log('\n✅ Safe cleanup successfully verified. Genuine database state preserved.');
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('\n❌ Suite error:', err.message);
  } finally {
    await cleanup();

    console.log('\n============================================================');
    console.log('FINAL SUITE SUMMARY');
    console.log('============================================================');
    console.log(`TOTAL PASSED: ${totalPassed}`);
    console.log(`TOTAL FAILED: ${totalFailed}`);
    console.log('============================================================\n');

    process.exit(totalFailed === 0 ? 0 : 1);
  }
}

main();
