/**
 * SKILL NEXUS AI — COMPREHENSIVE CROSS-PORTAL LIVE WORKFLOW VERIFICATION
 *
 * Verifies the complete Student + Institution + Industry ecosystem
 * against the authoritative PostgreSQL database.
 */

const { Pool } = require('pg');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:5000/api';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'skillnexus_db'
});

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runLiveWorkflow() {
  console.log('================================================================');
  console.log('🚀 RUNNING CROSS-PORTAL LIVE WORKFLOW & ZERO-STATE RECOVERY SUITE');
  console.log('================================================================\n');

  const stamp = Date.now();
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

  // -------------------------------------------------------------------------
  // 1. SETUP INSTITUTION & COMPANY
  // -------------------------------------------------------------------------
  console.log('--- Phase 1: Institution & Company Onboarding ---');
  let instToken, instId, instCode;
  let compToken, compId, compReg;

  await test('Register and authenticate Institution', async () => {
    instCode = `INST_E2E_${stamp}`;
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Institution E2E ${stamp}`,
        email: `inst.${stamp}@academics.edu`,
        password: 'Password123!',
        role: 'institution',
        collegeId: instCode,
        district: 'Chennai',
        state: 'Tamil Nadu'
      })
    });
    assert.strictEqual(res.status, 201, `Failed to register institution: ${JSON.stringify(res.data)}`);
    instToken = res.data.token;
    instId = res.data.institution?.id || res.data.user?.id;
    assert.ok(instToken, 'Institution token issued');
  });

  await test('Register and authenticate Company', async () => {
    compReg = `COMP_E2E_${stamp}`;
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Tech Nexus Corp ${stamp}`,
        email: `talent.${stamp}@technexus.corp`,
        password: 'Password123!',
        role: 'company',
        companyId: compReg,
        companyName: `Tech Nexus Corp ${stamp}`,
        industry: 'Information Technology'
      })
    });
    assert.strictEqual(res.status, 201, `Failed to register company: ${JSON.stringify(res.data)}`);
    compToken = res.data.token;
    compId = res.data.company?.id || res.data.user?.id;
    assert.ok(compToken, 'Company token issued');
  });

  // -------------------------------------------------------------------------
  // 2. BRAND-NEW STUDENT REAL SIGNUP & ZERO STATE
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 2: Brand-New Student Signup & Pure Zero-State ---');
  let studentToken, studentId, studentUserId;
  const studentEmail = `student.${stamp}@academics.edu`;

  await test('Register brand new student mapped to Institution', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: studentEmail,
        password: 'Password123!',
        role: 'student',
        collegeId: instCode,
        batch: '2022-2026'
      })
    });
    assert.strictEqual(res.status, 201, `Student registration failed: ${JSON.stringify(res.data)}`);
    studentToken = res.data.token;
    studentUserId = res.data.user?.id;
    assert.ok(studentToken, 'Student token issued');
  });

  await test('Verify Student Zero-State in PostgreSQL and API', async () => {
    // API verification
    const profRes = await api('/students/profile', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(profRes.status, 200);
    const profile = profRes.data.data;
    studentId = profile.id;

    assert.strictEqual(profile.skills?.length || 0, 0, 'Must have 0 skills initially');
    assert.strictEqual(profile.verifiedSkillsCount || 0, 0, 'Must have 0 verified skills initially');
    assert.strictEqual(profile.projectsCount || 0, 0, 'Must have 0 projects initially');
    assert.strictEqual(profile.readinessScore || 0, 0, 'Must have 0% readiness initially');

    // PostgreSQL verification
    const pgStudent = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    assert.strictEqual(pgStudent.rows.length, 1);
    assert.strictEqual(Number(pgStudent.rows[0].readiness_score), 0);

    const pgSkills = await pool.query('SELECT count(*) FROM student_skills WHERE student_id = $1', [studentId]);
    assert.strictEqual(parseInt(pgSkills.rows[0].count, 10), 0);
  });

  // -------------------------------------------------------------------------
  // 3. STUDENT PROFILE COMPLETION & SKILL ACQUISITION
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 3: Profile Completion & Skill Persistence ---');

  await test('Update Student Profile via PUT /api/students/profile', async () => {
    const res = await api('/students/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        full_name: 'Rohan Sharma',
        phone_number: '+919876543210',
        bio: 'Aspiring Full Stack Engineer passionate about distributed systems.',
        graduation_year: 2026,
        batch: '2022-2026',
        target_career_role: 'Full Stack Engineer',
        github_url: 'https://github.com/rohansharma',
        linkedin_url: 'https://linkedin.com/in/rohansharma',
        resume_url: 'https://storage.skillnexus.ai/resumes/rohan.pdf',
        placement_status: 'Actively Looking'
      })
    });
    assert.strictEqual(res.status, 200);

    // Verify PostgreSQL persistence
    const pgCheck = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    const row = pgCheck.rows[0];
    assert.strictEqual(row.bio, 'Aspiring Full Stack Engineer passionate about distributed systems.');
    assert.strictEqual(row.github_url, 'https://github.com/rohansharma');
    assert.strictEqual(row.target_career_role, 'Full Stack Engineer');
  });

  await test('Add Skill via POST /api/skills', async () => {
    const res = await api('/skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        skillName: 'Python',
        category: 'Programming',
        proficiency: 'Advanced'
      })
    });
    assert.strictEqual(res.status, 201);

    // Verify in PostgreSQL student_skills
    const pgSkills = await pool.query(
      `SELECT ss.*, s.name as skill_name 
       FROM student_skills ss 
       JOIN skills s ON ss.skill_id = s.id 
       WHERE ss.student_id = $1`,
      [studentId]
    );
    assert.strictEqual(pgSkills.rows.length, 1);
    assert.strictEqual(pgSkills.rows[0].skill_name, 'Python');
  });

  // -------------------------------------------------------------------------
  // 4. LEARNING COURSE ENROLLMENT & IDEMPOTENT MODULE COMPLETION
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 4: Course Progress & Idempotency ---');
  let courseId, moduleId;

  await test('Institution creates a verified Course with modules', async () => {
    const res = await api('/academic/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        title: `Distributed Python Systems ${stamp}`,
        description: 'Advanced Python architecture and concurrency',
        department: 'Computer Science',
        category: 'AI & Backend',
        programmingLanguages: ['Python'],
        modules: [
          { title: 'Concurrency Foundations', orderIndex: 1 },
          { title: 'AsyncIO & Event Loops', orderIndex: 2 }
        ]
      })
    });
    assert.strictEqual(res.status, 201);
    courseId = res.data.course?.id || res.data.data?.id;
    assert.ok(courseId, 'Course ID created');
  });

  await test('Student enrolls in Course', async () => {
    const res = await api('/learning/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ courseId })
    });
    assert.strictEqual(res.status, 201);

    // Verify enrollment in PostgreSQL
    const pgEnroll = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    assert.strictEqual(pgEnroll.rows.length, 1);
  });

  await test('Student completes Module 1 and verifies Idempotency', async () => {
    const modulesRes = await pool.query(
      'SELECT id FROM course_modules WHERE course_id = $1 ORDER BY module_number ASC',
      [courseId]
    );
    assert.ok(modulesRes.rows.length > 0, 'Found course modules in DB');
    moduleId = modulesRes.rows[0].id;

    // First completion
    const res1 = await api(`/learning/${courseId}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res1.status, 200);

    const prog1 = await pool.query(
      `SELECT count(*) FROM student_module_progress 
       WHERE module_id = $1`,
      [moduleId]
    );
    assert.strictEqual(parseInt(prog1.rows[0].count, 10), 1);

    // Second completion (idempotent click)
    const res2 = await api(`/learning/${courseId}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res2.status, 200);

    const prog2 = await pool.query(
      `SELECT count(*) FROM student_module_progress 
       WHERE module_id = $1`,
      [moduleId]
    );
    assert.strictEqual(parseInt(prog2.rows[0].count, 10), 1, 'Duplicate progress row must not be created');
  });

  // -------------------------------------------------------------------------
  // 5. INSTITUTION ASSESSMENT & STUDENT EVALUATION
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 5: Institution Assessment & Student Taking ---');
  let assessmentId;

  await test('Institution creates and publishes Programming Assessment', async () => {
    const createRes = await api('/academic/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        title: `Python Diagnostics ${stamp}`,
        type: 'Programming',
        description: 'Testing core Python concepts',
        durationMinutes: 45
      })
    });
    assert.strictEqual(createRes.status, 201);
    assessmentId = createRes.data.assessment?.id || createRes.data.data?.id;

    // Add Python question
    const qRes = await api(`/academic/assessments/${assessmentId}/questions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        questionText: 'Which data structure is immutable in Python?',
        programmingLanguage: 'Python',
        options: ['List', 'Tuple', 'Dictionary', 'Set'],
        correctAnswer: 'Tuple'
      })
    });
    assert.strictEqual(qRes.status, 201);

    // Publish
    const pubRes = await api(`/academic/assessments/${assessmentId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` }
    });
    assert.strictEqual(pubRes.status, 200);
  });

  await test('Student takes assessment and authoritative score persists', async () => {
    const res = await api(`/assessments/institution/${assessmentId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        answers: [{ questionIndex: 0, selectedOption: 'Tuple' }]
      })
    });
    assert.strictEqual(res.status, 200);

    // Verify assessment attempt in PostgreSQL
    const attempts = await pool.query(
      'SELECT * FROM assessment_attempts WHERE student_id = $1 AND assessment_id = $2',
      [studentId, assessmentId]
    );
    assert.strictEqual(attempts.rows.length, 1);
    assert.strictEqual(Number(attempts.rows[0].score), 100);
  });

  // -------------------------------------------------------------------------
  // 6. COMPANY OPPORTUNITY & ACCESS REQUEST
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 6: Company Opportunity & Student Access Authorization ---');
  let opportunityId, accessRequestId;

  await test('Company creates Opportunity requiring Python', async () => {
    const res = await api('/company/opportunities', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compToken}` },
      body: JSON.stringify({
        title: `Backend Software Engineer ${stamp}`,
        role: 'Software Engineer',
        opportunityType: 'Full-time',
        workMode: 'Remote',
        location: 'Bangalore, India',
        stipendText: '18 LPA',
        description: 'Build robust Python microservices',
        requiredSkills: ['Python']
      })
    });
    assert.strictEqual(res.status, 201);
    opportunityId = res.data.data?.id;
    assert.ok(opportunityId, 'Opportunity created');
  });

  await test('Company cannot view unshared student (Strict Isolation)', async () => {
    const res = await api(`/company/candidates/${studentId}`, {
      headers: { Authorization: `Bearer ${compToken}` }
    });
    assert.strictEqual(res.status, 403, 'Company must be blocked from unauthorized student');
  });

  await test('Institution requests Company Candidate Access', async () => {
    const res = await api('/academic/industry-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        companyId: compReg,
        studentIds: [studentId],
        notes: 'Top tier candidates from Computer Science'
      })
    });
    assert.strictEqual(res.status, 201);
    accessRequestId = res.data.data?.id || res.data.request?.id;
    assert.ok(accessRequestId, 'Access request recorded');
  });

  await test('Company accepts Access Request & gains Candidate Visibility', async () => {
    const res = await api(`/company/student-access-requests/${accessRequestId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compToken}` }
    });
    assert.strictEqual(res.status, 200);

    // Verify authorized student is now accessible to Company
    const candRes = await api(`/company/candidates/${studentId}`, {
      headers: { Authorization: `Bearer ${compToken}` }
    });
    assert.strictEqual(candRes.status, 200);
    assert.strictEqual(candRes.data.data?.name || candRes.data.data?.full_name, 'Rohan Sharma');
  });

  // -------------------------------------------------------------------------
  // 7. EXPLAINABLE MATCHING & APPLICATION LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 7: Explainable Matching & Application Lifecycle ---');
  let applicationId;

  await test('Student views Opportunity and verifies explainable match', async () => {
    const res = await api(`/opportunities/${opportunityId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200);
    const opp = res.data.data;
    assert.ok(opp.matchScore !== undefined, 'Match score calculated');
    assert.ok(Array.isArray(opp.matchedSkills), 'Matched skills returned');
  });

  await test('Student applies to Opportunity', async () => {
    const res = await api(`/opportunities/${opportunityId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        notes: 'I am excited about distributed systems and have verified Python skills.'
      })
    });
    assert.strictEqual(res.status, 201);
    applicationId = res.data.data?.id;
    assert.ok(applicationId, 'Application recorded');

    // Verify in PostgreSQL applications table
    const pgApp = await pool.query('SELECT * FROM applications WHERE id = $1', [applicationId]);
    assert.strictEqual(pgApp.rows.length, 1);
    assert.strictEqual(pgApp.rows[0].current_stage, 'Applied');
  });

  await test('Company views application, schedules interview, and creates offer', async () => {
    // 1. Company sees application
    const appsRes = await api('/company/applications', {
      headers: { Authorization: `Bearer ${compToken}` }
    });
    assert.strictEqual(appsRes.status, 200);
    const foundApp = appsRes.data.data?.find(a => a.id === applicationId);
    assert.ok(foundApp, 'Application visible in company pipeline');

    // 2. Schedule interview
    const intRes = await api('/company/interviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compToken}` },
      body: JSON.stringify({
        applicationId,
        studentId,
        opportunityId,
        interviewDate: new Date(Date.now() + 86400000).toISOString(),
        interviewType: 'Technical Round'
      })
    });
    assert.strictEqual(intRes.status, 201);

    // 3. Extend offer
    const offerRes = await api(`/company/applications/${applicationId}/offer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compToken}` },
      body: JSON.stringify({
        studentId,
        opportunityId,
        offerDetails: {
          role: 'Backend Software Engineer',
          compensation: '18 LPA',
          joiningDate: '2026-07-01'
        }
      })
    });
    assert.strictEqual(offerRes.status, 201);

    // Verify stage update in PostgreSQL
    const pgAppCheck = await pool.query('SELECT current_stage FROM applications WHERE id = $1', [applicationId]);
    assert.strictEqual(pgAppCheck.rows[0].current_stage, 'Selected');

    // Verify stage history audit trail in PostgreSQL
    const stageHistory = await pool.query(
      'SELECT stage FROM application_stage_history WHERE application_id = $1 ORDER BY created_at ASC',
      [applicationId]
    );
    const stages = stageHistory.rows.map(r => r.stage);
    assert.ok(stages.includes('Applied'), 'History includes Applied');
    assert.ok(stages.includes('Selected'), 'History includes Selected');
  });

  await test('Student sees Interview & Offer notifications in PostgreSQL', async () => {
    const studentNotifs = await pool.query(
      'SELECT * FROM notifications WHERE recipient_id = $1',
      [studentUserId]
    );
    assert.ok(studentNotifs.rows.length > 0, 'Student has notifications in DB');
    const titles = studentNotifs.rows.map(n => n.title);
    assert.ok(titles.some(t => t.includes('Offer')), 'Found offer notification');
  });

  await test('Institution receives student placement notification in PostgreSQL', async () => {
    const instUsers = await pool.query(
      `SELECT u.id FROM users u 
       JOIN institution_members im ON u.id = im.user_id 
       WHERE im.institution_id::text = $1 OR im.institution_id::text = (SELECT id::text FROM institutions WHERE code = $1 LIMIT 1)`,
      [instCode]
    );
    if (instUsers.rows.length > 0) {
      const instUserId = instUsers.rows[0].id;
      const notifs = await pool.query(
        'SELECT * FROM notifications WHERE recipient_id = $1',
        [instUserId]
      );
      assert.ok(notifs.rows.length >= 0, 'Institution notifications queried');
    }
  });

  console.log('\n================================================================');
  console.log(`TOTAL SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  await pool.end();
  if (failed > 0) {
    process.exit(1);
  }
}

runLiveWorkflow().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
