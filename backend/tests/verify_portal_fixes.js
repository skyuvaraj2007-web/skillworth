const assert = require('assert');
const http = require('http');
const relationalManager = require('../src/db/relationalManager');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function makeDownloadRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method: 'GET', headers }, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => {
        resolve({ status: res.statusCode, buffer: data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 VERIFYING ACADEMIA-INDUSTRY PORTAL AUDIT & FIXES');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ [FAIL] ${name}:`, err.message);
        failed++;
      }
    })();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Clean Registration & Database State Audit
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Clean Registration & Database State ---');
  const ts = Date.now();
  const cleanEmail = `clean.student.${ts}@campus.edu`;
  let studentToken = null;
  let cleanStudentId = null;

  await test('New student registration starts with clean profile (0 progress, empty skills, unassessed)', async () => {
    const res = await makeRequest('POST', '/api/auth/register', {
      role: 'student',
      name: 'Rohan Sharma',
      email: cleanEmail,
      password: 'StrongPassword123!',
      collegeId: 'TN010',
      department: 'CSE',
      careerGoal: 'AI / Machine Learning Engineer'
    });

    // Accept both 200 and 201 as success
    assert(res.status === 200 || res.status === 201, `Registration failed (${res.status}): ${JSON.stringify(res.data)}`);
    assert(res.data.success || res.data.token, `Registration returned non-success: ${JSON.stringify(res.data)}`);

    // Use returned token directly
    studentToken = res.data.token;

    const student = await relationalManager.getStudentById(res.data.user.studentId);
    assert(student, 'Student record not found in database');
    cleanStudentId = student.studentId;

    // Verify clean profile guarantees
    assert.strictEqual(student.readinessScore, 0, 'Readiness score must start at 0');
    assert.strictEqual(student.placementStatus, 'Unassessed', 'Placement status must be Unassessed');
    assert.deepStrictEqual(student.skills, [], 'Skills must be an empty array');
    assert.deepStrictEqual(student.assessments, [], 'Assessments must be an empty array');
    assert.deepStrictEqual(student.projects, [], 'Projects must be an empty array');
    assert.strictEqual(student.hasCompletedQuestionnaire, false, 'hasCompletedQuestionnaire must be false');

    // Verify 0 enrollments
    const enrollments = await relationalManager.getEnrollments(student.studentId);
    assert.strictEqual(enrollments.length, 0, 'New student must not have pre-seeded enrollments');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Course Progress Logic & Module Tracking
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Deterministic Course Progress Logic ---');
  let testEnrollment = null;

  await test('Enroll student in a course and verify 0% initial progress', async () => {
    const student = await relationalManager.getStudentById(cleanStudentId);
    const course = {
      courseId: 'COURSE-AI-101',
      title: 'Deep Learning with PyTorch',
      totalModules: 8,
      modules: Array.from({ length: 8 }, (_, i) => ({ id: `mod_${i + 1}`, title: `Module ${i + 1}` }))
    };
    testEnrollment = await relationalManager.enrollCourse(student, course);
    assert(testEnrollment, 'Failed to create enrollment');
    assert.strictEqual(testEnrollment.progress, 0, 'Initial progress must be 0%');
    assert.strictEqual(testEnrollment.completedModules, 0, 'Initial completedModules must be 0');
  });

  await test('Advance module 1: progress updates accurately (1/8 = 13%)', async () => {
    const res = await makeRequest('PUT', `/api/learning/${testEnrollment.id}/progress`, { moduleId: 'mod_1' }, studentToken);
    assert.strictEqual(res.status, 200, `API call failed: ${JSON.stringify(res.data)}`);
    assert.strictEqual(res.data.data.completedCount, 1, 'Completed count should be 1');
    assert.strictEqual(res.data.data.completionPercentage, 13, 'Progress should be 13%');
  });

  await test('Duplicate click on module 1 does NOT increment progress (no blind ++ counter)', async () => {
    const res = await makeRequest('PUT', `/api/learning/${testEnrollment.id}/progress`, { moduleId: 'mod_1' }, studentToken);
    assert.strictEqual(res.status, 200, `API call failed: ${JSON.stringify(res.data)}`);
    assert.strictEqual(res.data.data.completedCount, 1, 'Completed count must remain 1');
    assert.strictEqual(res.data.data.completionPercentage, 13, 'Progress must remain 13%');
  });

  await test('Advance module 2: progress reaches 25% (2/8 = 25%)', async () => {
    const res = await makeRequest('PUT', `/api/learning/${testEnrollment.id}/progress`, { moduleId: 'mod_2' }, studentToken);
    assert.strictEqual(res.status, 200, `API call failed: ${JSON.stringify(res.data)}`);
    assert.strictEqual(res.data.data.completedCount, 2, 'Completed count should be 2');
    assert.strictEqual(res.data.data.completionPercentage, 25, 'Progress should be 25%');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Student Skills Questionnaire Flow & Profile
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Student Skills Questionnaire Flow ---');

  await test('Submit skills questionnaire and verify profile & role gap analysis', async () => {
    const res = await makeRequest('POST', '/api/students/assess', {
      careerGoal: 'AI / Machine Learning Engineer',
      domain: 'Artificial Intelligence & DeepTech',
      primarySkills: ['Python', 'PyTorch', 'SQL'],
      experienceLevel: 'Intermediate',
      workPreference: 'Hybrid',
      categoryRatings: {
        programming: 85,
        systemDesign: 70,
        cloudDevOps: 65,
        dataAI: 80,
        problemSolving: 85
      }
    }, studentToken);

    assert.strictEqual(res.status, 200, `Questionnaire submission failed: ${JSON.stringify(res.data)}`);
    const profile = res.data.data.skillProfile;
    assert(profile, 'Skill profile missing from response');
    assert.strictEqual(profile.targetRole, 'AI / Machine Learning Engineer');
    assert(Array.isArray(profile.matchedSkills), 'matchedSkills must be an array');
    assert(Array.isArray(profile.missingSkills), 'missingSkills must be an array');
    assert(profile.matchedSkills.includes('Python'), 'Python must be in matchedSkills');
    assert(profile.missingSkills.includes('TensorFlow'), 'TensorFlow must be in missingSkills');
    assert(res.data.data.readinessScore > 0, 'Readiness score must be calculated and > 0');

    // Check student hasCompletedQuestionnaire flag in DB
    const student = await relationalManager.getStudentById(cleanStudentId);
    assert.strictEqual(student.hasCompletedQuestionnaire, true, 'hasCompletedQuestionnaire must be set to true');
  });

  await test('GET /api/students/profile returns calculated profile and gaps', async () => {
    const res = await makeRequest('GET', '/api/students/profile', null, studentToken);
    assert.strictEqual(res.status, 200, `Profile fetch failed: ${JSON.stringify(res.data)}`);
    assert(res.data.data.skillProfile, 'Skill profile missing');
    assert.strictEqual(res.data.data.hasCompletedQuestionnaire, true);
    assert.strictEqual(res.data.data.studentId, cleanStudentId);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Matching & Recommendations with Gap Analysis
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Matching & Recommendations Engine ---');

  await test('GET /api/internships/recommendations returns sorted match scores and gap analysis', async () => {
    const res = await makeRequest('GET', `/api/internships/recommendations?student_id=${cleanStudentId}`, null, studentToken);
    assert.strictEqual(res.status, 200, `Recommendations fetch failed: ${JSON.stringify(res.data)}`);
    assert(Array.isArray(res.data.data), 'Data should be array of opportunities');
    assert(res.data.data.length > 0, 'Should return opportunities');

    // Verify descending order
    for (let i = 0; i < res.data.data.length - 1; i++) {
      assert(res.data.data[i].matchScore >= res.data.data[i + 1].matchScore, 'Opportunities must be sorted descending by matchScore');
    }

    // Verify gap analysis is included
    const top = res.data.data[0];
    assert(top.gapAnalysis, 'Top opportunity must include gapAnalysis');
    assert(Array.isArray(top.matchedSkills), 'Top opportunity must include matchedSkills');
    assert(Array.isArray(top.missingSkills), 'Top opportunity must include missingSkills');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Internship / Placement Application Workflow
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Application Lifecycle & Status Tracking ---');
  let appliedAppId = null;

  await test('Student applies to an internship: status set to Submitted', async () => {
    const opps = await relationalManager.getOpportunities();
    assert(opps && opps.length > 0, 'No opportunities available to apply to');
    const targetOpp = opps[0];
    const oppId = targetOpp.oppId || targetOpp.opportunityId || targetOpp.id;

    const res = await makeRequest('POST', `/api/internships/${encodeURIComponent(oppId)}/apply`, null, studentToken);
    assert.strictEqual(res.status, 201, `Application failed: ${JSON.stringify(res.data)}`);
    assert(res.data.data, 'Application data missing');
    assert.strictEqual(res.data.data.status, 'Submitted', 'Initial status must be Submitted');
    appliedAppId = res.data.data.id || res.data.data.applicationId;
  });

  await test('Student can track applied internship via /api/students/applications', async () => {
    const res = await makeRequest('GET', '/api/students/applications', null, studentToken);
    assert.strictEqual(res.status, 200, `Failed to fetch student applications: ${JSON.stringify(res.data)}`);
    assert(Array.isArray(res.data.data), 'Data must be array');
    const myApp = res.data.data.find(a => (a.id || a.applicationId) === appliedAppId);
    assert(myApp, 'Applied record must be visible to student');
    assert.strictEqual(myApp.status, 'Submitted');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Dashboards & Analytics — register real institution/company users
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Institutional & Company Analytics ---');

  // Register a real institution user
  let instToken = null;
  const instRes = await makeRequest('POST', '/api/auth/register', {
    role: 'institution',
    name: 'SRM Admin',
    email: `instadmin.${ts}@srm.edu`,
    password: 'InstPassword123!',
    collegeId: 'TN010',
    institutionName: 'SRM Institute'
  });
  if ((instRes.status === 200 || instRes.status === 201) && instRes.data.token) {
    instToken = instRes.data.token;
  }

  // Register a real company user
  let compToken = null;
  const compRes = await makeRequest('POST', '/api/auth/register', {
    role: 'company',
    name: 'TechCorp Recruiter',
    email: `recruiter.${ts}@techcorp.com`,
    password: 'CompPassword123!',
    companyName: 'TechCorp Global Systems'
  });
  if ((compRes.status === 200 || compRes.status === 201) && compRes.data.token) {
    compToken = compRes.data.token;
  }

  await test('Institution dashboard returns total assessed, avg skill level, and placement stats', async () => {
    assert(instToken, `Institution registration failed (${instRes.status}): ${JSON.stringify(instRes.data)}`);
    const res = await makeRequest('GET', '/api/academic/dashboard', null, instToken);
    assert.strictEqual(res.status, 200, `Institution dashboard failed: ${JSON.stringify(res.data)}`);
    assert(typeof res.data.data.totalStudentsAssessed === 'number', 'totalStudentsAssessed must be number');
    assert(typeof res.data.data.avgSkillLevel === 'number', 'avgSkillLevel must be number');
    assert(res.data.data.placementStats, 'placementStats must be present');
  });

  await test('Company dashboard returns applications per internship and applicant match stats', async () => {
    assert(compToken, `Company registration failed (${compRes.status}): ${JSON.stringify(compRes.data)}`);
    const res = await makeRequest('GET', '/api/company/dashboard', null, compToken);
    assert.strictEqual(res.status, 200, `Company dashboard failed: ${JSON.stringify(res.data)}`);
    assert(Array.isArray(res.data.data.applicationsPerInternship), 'applicationsPerInternship must be array');
    assert(typeof res.data.data.avgApplicantMatch === 'number', 'avgApplicantMatch must be number');
    assert(res.data.data.stageCounts, 'stageCounts must be present');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Role-Based Access Control (RBAC) Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Server-Side RBAC Enforcement ---');

  await test('Student cannot access company endpoint (returns 403 Forbidden)', async () => {
    const res = await makeRequest('POST', '/api/company/opportunities', { title: 'Unauthorized' }, studentToken);
    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await test('Student cannot access academic dashboard (returns 403 Forbidden)', async () => {
    const res = await makeRequest('GET', '/api/academic/dashboard', null, studentToken);
    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await test('Company cannot submit student skill assessment (returns 403 Forbidden)', async () => {
    assert(compToken, 'Company token not available');
    const res = await makeRequest('POST', '/api/students/assess', { careerGoal: 'Hacker' }, compToken);
    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Document / Resume Upload & Download
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Portfolios & Document Upload/Download ---');
  let uploadedDocId = null;

  await test('Upload student resume and save to physical filesystem', async () => {
    const testContent = Buffer.from('PDF_SAMPLE_DOCUMENT_FOR_VERIFICATION_ROHAN_SHARMA_2026').toString('base64');
    const res = await makeRequest('POST', '/api/students/documents', {
      title: 'Rohan_Sharma_ML_Resume_2026',
      type: 'Resume',
      fileName: 'Rohan_Sharma_Resume.pdf',
      fileBase64: testContent,
      mimeType: 'application/pdf'
    }, studentToken);

    assert.strictEqual(res.status, 201, `Document upload failed: ${JSON.stringify(res.data)}`);
    assert(res.data.data.id, 'Document ID missing');
    assert(res.data.data.downloadUrl, 'Download URL missing');
    uploadedDocId = res.data.data.id;
  });

  await test('List student documents via GET /api/students/documents', async () => {
    const res = await makeRequest('GET', '/api/students/documents', null, studentToken);
    assert.strictEqual(res.status, 200, `Failed to fetch documents: ${JSON.stringify(res.data)}`);
    assert(Array.isArray(res.data.data), 'Data must be array');
    const doc = res.data.data.find(d => d.id === uploadedDocId);
    assert(doc, 'Uploaded document must be in list');
    assert.strictEqual(doc.type, 'Resume');
  });

  await test('Download document via GET /api/students/documents/:docId/download', async () => {
    const res = await makeDownloadRequest(`/api/students/documents/${uploadedDocId}/download`, studentToken);
    assert.strictEqual(res.status, 200, `Download failed with status ${res.status}`);
    const downloadedStr = res.buffer.toString();
    assert.strictEqual(downloadedStr, 'PDF_SAMPLE_DOCUMENT_FOR_VERIFICATION_ROHAN_SHARMA_2026', 'Downloaded content matches uploaded content');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 9: Product Truth, Zero Readiness Floor & Data Isolation
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Product Truth, Zero Readiness Floor & Data Isolation ---');

  const ts2 = Date.now() + 100;
  const brandNewEmail = `truth.student.${ts2}@campus.edu`;
  let brandNewToken = null;
  let brandNewStudentId = null;

  await test('Brand-new student registration starts with STRICT 0% readiness (NO Math.max(1,...) floor)', async () => {
    const regRes = await makeRequest('POST', '/api/auth/register', {
      role: 'student',
      name: 'Ananya Iyer',
      email: brandNewEmail,
      password: 'SecurePassword789!',
      collegeId: 'TN010',
      department: 'ECE',
      careerGoal: 'Embedded Systems Engineer'
    });
    assert(regRes.status === 200 || regRes.status === 201, `Registration failed: ${JSON.stringify(regRes.data)}`);
    brandNewToken = regRes.data.token;
    brandNewStudentId = regRes.data.user.studentId;

    const student = await relationalManager.getStudentById(brandNewStudentId);
    assert.strictEqual(student.readinessScore, 0, 'Initial readinessScore MUST be 0 (no artificial floor)');
  });

  await test('GET /api/students/stats returns authoritative 0 values for brand-new student', async () => {
    const res = await makeRequest('GET', '/api/students/stats', null, brandNewToken);
    assert.strictEqual(res.status, 200, `Stats endpoint failed: ${JSON.stringify(res.data)}`);
    assert(res.data.success, 'Stats request not successful');
    const stats = res.data.data;
    assert.strictEqual(stats.skillsVerified, 0, 'New student must have 0 verified skills');
    assert.strictEqual(stats.projectsCompleted, 0, 'New student must have 0 projects completed');
    assert.strictEqual(stats.coursesCompleted, 0, 'New student must have 0 courses completed');
    assert.strictEqual(stats.careerReadiness, 0, 'New student career readiness must be 0');
    assert.strictEqual(stats.careerJourney, 0, 'New student career journey must be 0');
    assert.strictEqual(stats.hasCompletedQuestionnaire, false, 'hasCompletedQuestionnaire must be false');
    assert.deepStrictEqual(stats.readinessBreakdown, {
      skillVerification: 0,
      assessmentScore: 0,
      projectProofScore: 0,
      learningProgress: 0,
      careerCompleteness: 0,
      readinessScore: 0
    }, 'All readiness breakdown components must be 0');
  });

  let truthEnrollment = null;
  await test('Enroll student and test GET /api/learning/:id/resume does NOT mutate progress', async () => {
    const student = await relationalManager.getStudentById(brandNewStudentId);
    const course = {
      courseId: 'COURSE-TRUTH-101',
      title: 'Systems Engineering',
      totalModules: 6,
      modules: Array.from({ length: 6 }, (_, i) => ({ id: `mod_${i + 1}`, title: `Module ${i + 1}` }))
    };
    truthEnrollment = await relationalManager.enrollCourse(student, course);
    assert.strictEqual(truthEnrollment.progress, 0, 'Enrollment starts at 0%');

    // Call resume 3 times (simulating clicking "Continue" multiple times)
    for (let i = 0; i < 3; i++) {
      const resumeRes = await makeRequest('GET', `/api/learning/${truthEnrollment.id}/resume`, null, brandNewToken);
      assert.strictEqual(resumeRes.status, 200, 'Resume endpoint must return 200');
      assert.strictEqual(resumeRes.data.data.progress, 0, 'Resume MUST NOT advance progress!');
      assert.strictEqual(resumeRes.data.data.completedModules, 0, 'Resume MUST NOT advance completedModules!');
    }

    const checkEnrollment = (await relationalManager.getEnrollments(brandNewStudentId)).find(e => e.id === truthEnrollment.id);
    assert.strictEqual(checkEnrollment.progress, 0, 'Database progress must remain 0 after multiple Continue clicks');
  });

  await test('POST /api/learning/:id/modules/:moduleId/complete advances module and is idempotent', async () => {
    // Complete mod_1
    const comp1 = await makeRequest('POST', `/api/learning/${truthEnrollment.id}/modules/mod_1/complete`, null, brandNewToken);
    assert.strictEqual(comp1.status, 200, `Complete module failed: ${JSON.stringify(comp1.data)}`);
    assert.strictEqual(comp1.data.data.completedModules, 1, 'Completed modules should be 1');
    assert.strictEqual(comp1.data.data.progress, 17, 'Progress should be round(1/6 * 100) = 17%');

    // Duplicate call on mod_1 MUST NOT increment progress
    const comp1Dup = await makeRequest('POST', `/api/learning/${truthEnrollment.id}/modules/mod_1/complete`, null, brandNewToken);
    assert.strictEqual(comp1Dup.status, 200, 'Duplicate complete call must succeed idempotently');
    assert.strictEqual(comp1Dup.data.data.completedModules, 1, 'Completed modules must remain 1');
    assert.strictEqual(comp1Dup.data.data.progress, 17, 'Progress must remain 17%');
    assert(comp1Dup.data.data.alreadyCompleted === true || comp1Dup.data.message.includes('already completed'), 'Message should indicate already completed');
  });

  await test('User Data Isolation: Student A data does NOT bleed into Student B', async () => {
    const statsA = (await makeRequest('GET', '/api/students/stats', null, studentToken)).data.data;
    const statsB = (await makeRequest('GET', '/api/students/stats', null, brandNewToken)).data.data;

    // Student A completed questionnaire and has readiness > 0; Student B hasn't
    assert(statsA.hasCompletedQuestionnaire === true, 'Student A questionnaire should be true');
    assert(statsB.hasCompletedQuestionnaire === false, 'Student B questionnaire should be false');
    assert(statsA.readinessBreakdown.careerCompleteness > 0, 'Student A has career completeness');
    assert.strictEqual(statsB.readinessBreakdown.careerCompleteness, 0, 'Student B has 0 career completeness');

    const enrollmentsA = (await makeRequest('GET', '/api/learning', null, studentToken)).data.data.enrollments;
    const enrollmentsB = (await makeRequest('GET', '/api/learning', null, brandNewToken)).data.data.enrollments;
    assert(enrollmentsA.every(e => e.studentId === cleanStudentId), "Student A enrollments must only belong to Student A");
    assert(enrollmentsB.every(e => e.studentId === brandNewStudentId), "Student B enrollments must only belong to Student B");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`TOTAL SUITE RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
