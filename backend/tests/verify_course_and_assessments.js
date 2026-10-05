/**
 * SKILLNEXUS AI — End-to-End Course Discontinuation & Industry Targeted Assessment Verification Suite
 * Tests:
 * 1. Institution, Student, and Collaborating Industry dynamic setup in PostgreSQL.
 * 2. Course creation and student enrollment with progress tracking.
 * 3. Course Discontinuation flow:
 *    - Status transition to 'Discontinued'
 *    - Historical progress preservation (NOT marked 100%)
 *    - Dynamic Institution notification dispatch
 *    - Dynamic Collaborating Industry notification dispatch
 *    - Zero notification leakage to unrelated institution or industry
 *    - Idempotency & duplicate protection
 *    - Cross-student unauthorized discontinuation rejection
 * 4. Industry Targeted Assessment flow:
 *    - Creation of targeted assessment
 *    - Manual MCQ & Programming question authoring
 *    - Cohort targeting across institutions
 *    - Publishing & automated student notification dispatch
 *    - Student question retrieval with answer key & hidden test case sanitization
 *    - Cross-student unauthorized assessment access denial
 *    - Server-side authoritative evaluation with isolated VM programming sandbox
 *    - Candidate scoring & result persistence
 *    - Industry targeted scoreboard review & cross-company tenant isolation
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const relationalManager = require('../src/db/relationalManager');
const programmingExecutionService = require('../src/services/programmingExecutionService');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING COURSE DISCONTINUATION & TARGETED ASSESSMENTS');
  console.log('================================================================\n');

  const stamp = Date.now();

  try {
    // ─── 1. SETUP DYNAMIC INSTITUTIONS & COMPANIES ───
    console.log('👉 1. Setting up Dynamic Entities (Institutions & Industry Partners)...');

    // Institution A (Partnered)
    const instARes = await relationalManager.registerUser({
      name: `Vanguard Tech Institute ${stamp}`,
      institutionName: `Vanguard Tech Institute ${stamp}`,
      institutionCode: `VTI-${stamp.toString().slice(-5)}`,
      email: `admin.vanguard.${stamp}@vanguard.edu`,
      password: 'StrongPassword123!',
      role: 'institution',
      district: 'Coimbatore',
      state: 'Tamil Nadu'
    });
    assert(instARes.success, 'Institution A creation failed');
    const instAId = instARes.user.institutionId;
    const instAUserId = instARes.user.id;
    console.log(`   ✓ Institution A created (ID: ${instAId})`);

    // Institution B (Unrelated)
    const instBRes = await relationalManager.registerUser({
      name: `Horizon University ${stamp}`,
      institutionName: `Horizon University ${stamp}`,
      institutionCode: `HZN-${stamp.toString().slice(-5)}`,
      email: `admin.horizon.${stamp}@horizon.edu`,
      password: 'StrongPassword123!',
      role: 'institution',
      district: 'Madurai',
      state: 'Tamil Nadu'
    });
    assert(instBRes.success, 'Institution B creation failed');
    const instBId = instBRes.user.institutionId;
    const instBUserId = instBRes.user.id;
    console.log(`   ✓ Institution B created (ID: ${instBId})`);

    // Company A (Collaborating Partner with Institution A)
    const compARes = await relationalManager.registerUser({
      name: `Cyberdyne Systems ${stamp}`,
      companyName: `Cyberdyne Systems ${stamp}`,
      companyCode: `CYB-${stamp.toString().slice(-5)}`,
      email: `contact.cyberdyne.${stamp}@cyberdyne.io`,
      password: 'StrongPassword123!',
      role: 'company',
      industry: 'AI & Robotics'
    });
    assert(compARes.success, 'Company A creation failed');
    const compAId = compARes.user.companyId;
    const compAUserId = compARes.user.id;
    console.log(`   ✓ Company A created (ID: ${compAId})`);

    // Company B (Unrelated)
    const compBRes = await relationalManager.registerUser({
      name: `OmniCorp ${stamp}`,
      companyName: `OmniCorp ${stamp}`,
      companyCode: `OMN-${stamp.toString().slice(-5)}`,
      email: `contact.omni.${stamp}@omnicorp.io`,
      password: 'StrongPassword123!',
      role: 'company',
      industry: 'Enterprise Cloud'
    });
    assert(compBRes.success, 'Company B creation failed');
    const compBId = compBRes.user.companyId;
    const compBUserId = compBRes.user.id;
    console.log(`   ✓ Company B created (ID: ${compBId})`);

    // Establish Collaboration: Company A ↔ Institution A in PostgreSQL
    await relationalManager.pg.query(
      `INSERT INTO company_institution_partnerships (company_id, institution_id, partnership_tier, status, created_at)
       VALUES ($1, $2, 'Prime Innovation Partner', 'ACTIVE', NOW())
       ON CONFLICT (company_id, institution_id) DO NOTHING`,
      [compAId, instAId]
    );
    console.log('   ✓ Active collaboration created: Company A ↔ Institution A');

    // ─── 2. SETUP DYNAMIC STUDENTS ───
    console.log('\n👉 2. Registering Dynamic Students...');
    // Student A (Enrolled in Institution A)
    const stuARes = await relationalManager.registerUser({
      name: `Anand Sharma ${stamp}`,
      email: `anand.${stamp}@example.com`,
      password: 'StudentPassword123!',
      role: 'student',
      institutionId: instAId,
      department: 'Computer Science and Engineering',
      yearOfStudy: '3'
    });
    assert(stuARes.success, 'Student A creation failed');
    const stuAId = stuARes.user.studentId;
    const stuAUserId = stuARes.user.id;
    console.log(`   ✓ Student A created (ID: ${stuAId}, Mapped: Institution A)`);

    // Student B (Enrolled in Institution B)
    const stuBRes = await relationalManager.registerUser({
      name: `Meera Krishnan ${stamp}`,
      email: `meera.${stamp}@example.com`,
      password: 'StudentPassword123!',
      role: 'student',
      institutionId: instBId,
      department: 'Information Technology',
      yearOfStudy: '4'
    });
    assert(stuBRes.success, 'Student B creation failed');
    const stuBId = stuBRes.user.studentId;
    const stuBUserId = stuBRes.user.id;
    console.log(`   ✓ Student B created (ID: ${stuBId}, Mapped: Institution B)`);

    // ─── 3. COURSE CREATION & ENROLLMENT ───
    console.log('\n👉 3. Creating Course & Establishing Enrollment...');
    const courseRes = await relationalManager.pg.query(
      `INSERT INTO courses (course_code, institution_id, company_id, title, category, difficulty, hours, created_at)
       VALUES ($1, $2, $3, $4, 'Cloud Computing', 'Intermediate', 40, NOW())
       RETURNING *`,
      [`CRS-${stamp.toString().slice(-6)}`, instAId, compAId, `Cloud Microservices & Go ${stamp}`]
    );
    const course = courseRes.rows[0];
    console.log(`   ✓ Course created: "${course.title}" (ID: ${course.id})`);

    // Enroll Student A with 35% progress
    const enrRes = await relationalManager.pg.query(
      `INSERT INTO enrollments (student_id, course_id, status, progress_percentage, enrolled_at)
       VALUES ($1, $2, 'In Progress', 35, NOW() - INTERVAL '3 days')
       RETURNING *`,
      [stuAId, course.id]
    );
    const enrollmentA = enrRes.rows[0];
    assert.strictEqual(enrollmentA.status, 'In Progress');
    assert.strictEqual(enrollmentA.progress_percentage, 35);
    console.log(`   ✓ Student A enrolled with initial progress: ${enrollmentA.progress_percentage}%`);

    // ─── 4. COURSE DISCONTINUATION & MULTI-PARTY NOTIFICATIONS ───
    console.log('\n👉 4. Testing Course Discontinuation & Multi-Party Notifications...');

    // Student B tries to discontinue Student A's course -> Must be rejected
    let unauthorizedBlocked = false;
    try {
      await relationalManager.discontinueCourse(stuBId, enrollmentA.id, 'Trying to cancel someone else');
    } catch (e) {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, 'Cross-student course discontinuation must be strictly blocked');
    console.log('   ✓ Unauthorized student cross-discontinuation blocked');

    // Student A discontinues own course
    const discRes = await relationalManager.discontinueCourse(stuAId, enrollmentA.id, 'Academic workload balance');
    assert(discRes.success, 'Discontinuation failed');
    assert.strictEqual(discRes.data.status, 'Discontinued');
    assert.strictEqual(discRes.data.progress, 35, 'Historical progress must be preserved, NOT falsely marked 100%');
    console.log(`   ✓ Course successfully discontinued! Status: ${discRes.data.status}, Preserved Progress: ${discRes.data.progress}%`);

    // Verify in PostgreSQL database directly
    const verifyEnr = await relationalManager.pg.query(
      `SELECT status, progress_percentage, discontinued_at, discontinuation_reason FROM enrollments WHERE id = $1`,
      [enrollmentA.id]
    );
    const updatedDbEnr = verifyEnr.rows[0];
    assert.strictEqual(updatedDbEnr.status, 'Discontinued');
    assert.strictEqual(updatedDbEnr.progress_percentage, 35);
    assert(updatedDbEnr.discontinued_at !== null, 'discontinued_at must be populated');
    assert.strictEqual(updatedDbEnr.discontinuation_reason, 'Academic workload balance');
    console.log('   ✓ Verified in PostgreSQL: status=Discontinued, progress=35%, timestamp recorded');

    // Verify Duplicate Discontinuation is handled safely
    const dupRes = await relationalManager.discontinueCourse(stuAId, enrollmentA.id, 'Duplicate attempt');
    assert(dupRes.success && dupRes.alreadyDiscontinued, 'Duplicate discontinuation should be idempotent and return true');
    console.log('   ✓ Duplicate discontinuation handled idempotently');

    // Verify Notification for Institution A
    const instNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'COURSE_DISCONTINUED'`,
      [instAUserId]
    );
    assert(instNotifs.rows.length >= 1, 'Institution A must receive COURSE_DISCONTINUED notification');
    console.log(`   ✓ Institution A received discontinuation notification: "${instNotifs.rows[0].message}"`);

    // Verify Notification for Collaborating Company A
    const compNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'COURSE_DISCONTINUED'`,
      [compAUserId]
    );
    assert(compNotifs.rows.length >= 1, 'Collaborating Company A must receive COURSE_DISCONTINUED notification');
    console.log(`   ✓ Collaborating Company A received discontinuation notification: "${compNotifs.rows[0].message}"`);

    // Verify Unrelated Institution B and Company B received ZERO notifications
    const instBNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'COURSE_DISCONTINUED'`,
      [instBUserId]
    );
    assert.strictEqual(instBNotifs.rows.length, 0, 'Unrelated Institution B must NOT receive any notifications');

    const compBNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'COURSE_DISCONTINUED'`,
      [compBUserId]
    );
    assert.strictEqual(compBNotifs.rows.length, 0, 'Unrelated Company B must NOT receive any notifications');
    console.log('   ✓ Zero notification leakage to unrelated institution or industry verified');

    // ─── 5. INDUSTRY TARGETED ASSESSMENT CREATION & QUESTION AUTHORING ───
    console.log('\n👉 5. Testing Industry Targeted Assessment Creation & Question Authoring...');

    // Company A creates assessment
    const asmt = await relationalManager.createCompanyAssessment(compAId, {
      title: `Full-Stack Systems Benchmark ${stamp}`,
      description: 'Technical evaluation for junior systems engineer role.',
      instructions: 'Solve reasoning and coding challenges independently.',
      timeLimitMinutes: 30,
      totalMarks: 50
    });
    assert(asmt && asmt.id, 'Assessment creation failed');
    console.log(`   ✓ Assessment created: "${asmt.title}" (ID: ${asmt.id})`);

    // Add MCQ Question (Logical Reasoning)
    const mcqQ = await relationalManager.addAssessmentQuestion(asmt.id, compAId, {
      category: 'Logical Reasoning',
      questionType: 'MCQ',
      questionText: 'Which data structure offers amortized O(1) push and pop operations?',
      options: ['Stack using Dynamic Array', 'Singly Linked List with tail pointer only', 'Binary Search Tree', 'Sorted Array'],
      correctAnswer: 'Stack using Dynamic Array',
      marks: 10,
      difficulty: 'Intermediate'
    });
    assert(mcqQ && mcqQ.id, 'MCQ question creation failed');
    console.log(`   ✓ Added MCQ question (ID: ${mcqQ.id})`);

    // Add Programming Question
    const codeQ = await relationalManager.addAssessmentQuestion(asmt.id, compAId, {
      category: 'Programming',
      questionType: 'CODE',
      questionText: 'Implement a function sumEvens(arr) that returns the sum of all even integers in the array.',
      programmingLanguage: 'JavaScript',
      starterCode: 'function sumEvens(arr) {\n  // your code\n}',
      marks: 40,
      difficulty: 'Intermediate',
      testCases: [
        { input: '[1, 2, 3, 4, 5, 6]', expectedOutput: '12', isHidden: false },
        { input: '[10, 15, 20]', expectedOutput: '30', isHidden: true }
      ]
    });
    assert(codeQ && codeQ.id, 'Programming question creation failed');
    console.log(`   ✓ Added Programming challenge with public and hidden test cases (ID: ${codeQ.id})`);

    // Target Student A
    const targetRes = await relationalManager.assignAssessmentTargets(asmt.id, compAId, [stuAId]);
    assert(targetRes.success && targetRes.assignedCount === 1, 'Target assignment failed');
    console.log('   ✓ Student A successfully targeted for the assessment');

    // Publish Assessment
    const pubRes = await relationalManager.publishAssessment(asmt.id, compAId);
    assert(pubRes.success, 'Publish assessment failed');
    console.log('   ✓ Assessment published and student notification dispatched');

    // Verify Student A received ASSESSMENT_ASSIGNED notification
    const stuNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'ASSESSMENT_ASSIGNED'`,
      [stuAUserId]
    );
    assert(stuNotifs.rows.length >= 1, 'Student A must receive ASSESSMENT_ASSIGNED notification');
    console.log(`   ✓ Student A received notification: "${stuNotifs.rows[0].message}"`);

    // Verify Student B did NOT receive notification
    const stuBNotifs = await relationalManager.pg.query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND notification_type = 'ASSESSMENT_ASSIGNED'`,
      [stuBUserId]
    );
    assert.strictEqual(stuBNotifs.rows.length, 0, 'Unassigned Student B must NOT receive notification');

    // ─── 6. STUDENT ASSESSMENT ACCESS & SECURITY SANITIZATION ───
    console.log('\n👉 6. Testing Student Assessment Access & Security Sanitization...');

    // Student B (unassigned) tries to access -> Must be denied
    let studentBAccessDenied = false;
    try {
      await relationalManager.getAssignedAssessmentQuestions(asmt.id, stuBId);
    } catch (e) {
      studentBAccessDenied = true;
    }
    assert(studentBAccessDenied, 'Unassigned student access must be strictly denied');
    console.log('   ✓ Unassigned student access blocked');

    // Student A accesses assessment
    const studentAsmt = await relationalManager.getAssignedAssessmentQuestions(asmt.id, stuAId);
    assert(studentAsmt && studentAsmt.questions.length === 2, 'Student A should receive questions');

    // SECURITY CHECK: Verify correct_answer and hidden test cases are NEVER exposed
    const fetchedMcq = studentAsmt.questions.find(q => q.id === mcqQ.id);
    assert(fetchedMcq.correct_answer === undefined, 'SECURITY VIOLATION: correct_answer must NOT be exposed to student');

    const fetchedCode = studentAsmt.questions.find(q => q.id === codeQ.id);
    assert(fetchedCode.test_cases === undefined, 'SECURITY VIOLATION: Full test_cases must NOT be exposed to student');
    assert(Array.isArray(fetchedCode.public_test_cases), 'Public test cases should be an array');
    assert.strictEqual(fetchedCode.public_test_cases.length, 1, 'Hidden test case must NOT be exposed in public_test_cases');
    console.log('   ✓ Security Sanitization verified: correct_answer and hidden test cases are securely stripped');

    // ─── 7. SERVER-SIDE EVALUATION & SANDBOXED EXECUTION ───
    console.log('\n👉 7. Testing Server-Side Evaluation & Sandboxed Code Execution...');

    // Student A submits answers:
    // 1. Correct answer for MCQ
    // 2. Working code for sumEvens
    const studentSubmission = {
      [mcqQ.id]: 'Stack using Dynamic Array',
      [codeQ.id]: `
        function sumEvens(arr) {
          if (typeof arr === 'string') arr = JSON.parse(arr);
          return arr.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);
        }
        result = sumEvens(input);
      `
    };

    const submitRes = await relationalManager.submitAssignedAssessmentAttempt(asmt.id, stuAId, studentSubmission);
    assert(submitRes.success, 'Submission failed');
    assert.strictEqual(submitRes.score, 100, `Expected 100% score, got ${submitRes.score}%`);
    assert.strictEqual(submitRes.resultStatus, 'PASSED');
    console.log(`   ✓ Server-side evaluation passed! Score: ${submitRes.score}%, Result: ${submitRes.resultStatus}`);

    // Verify VM Sandbox Security: Test rejection of malicious submission
    const maliciousCode = 'require("child_process").execSync("whoami");';
    const securityCheck = await programmingExecutionService.executeCode(maliciousCode, 'JavaScript', [{ input: '1', expectedOutput: '1' }]);
    assert.strictEqual(securityCheck.status, 'SECURITY_VIOLATION', 'Malicious code with require/child_process must be blocked');
    console.log('   ✓ Programming sandbox security verified: blocked unauthorized system calls');

    // ─── 8. INDUSTRY SCOREBOARD & TENANT ISOLATION ───
    console.log('\n👉 8. Testing Company Results & Multi-Tenant Isolation...');

    // Company A queries results
    const compAResults = await relationalManager.getCompanyAssessmentResults(asmt.id, compAId);
    assert(compAResults && compAResults.results.length === 1, 'Company A should see 1 candidate result');
    assert.strictEqual(compAResults.results[0].student_name, `Anand Sharma ${stamp}`);
    assert.strictEqual(compAResults.results[0].score, '100.00');
    assert.strictEqual(compAResults.results[0].result_status, 'PASSED');
    console.log(`   ✓ Company A scoreboard verified: Candidate ${compAResults.results[0].student_name} - 100% (PASSED)`);

    // Company B (rival company) tries to access Company A's assessment results -> Must be blocked
    let rivalCompanyBlocked = false;
    try {
      await relationalManager.getCompanyAssessmentResults(asmt.id, compBId);
    } catch (e) {
      rivalCompanyBlocked = true;
    }
    assert(rivalCompanyBlocked, 'Company B must NOT access Company A assessment results');
    console.log('   ✓ Multi-tenant isolation verified: Company B access to Company A results blocked');

    console.log('\n================================================================');
    console.log('🎉 ALL COURSE DISCONTINUATION & TARGETED ASSESSMENT TESTS PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await relationalManager.pg.end();
  }
}

runTests();
