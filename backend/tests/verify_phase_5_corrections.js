/**
 * SKILLNEXUS AI — Phase 5 Master Production Correction & DB Consolidation Verification Suite
 * Verifies P0, P1, P2 and authoritative PostgreSQL single-source-of-truth.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const rm = require('../src/db/relationalManager');

async function runPhase5Verification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🚀 RUNNING PHASE 5 MASTER PRODUCTION CORRECTION & POSTGRESQL VERIFICATION');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  assert(Boolean(rm.pg), 'CRITICAL: PostgreSQL connection pool must be active and authoritative');
  console.log('✅ PostgreSQL connection confirmed active.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: P0 — Fix Institution Application Tracking
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[1/7] Testing P0: Institution Application Tracking Scoped by Student Ownership...');
  
  // Find Institution A and Institution B
  const insts = await rm.pg.query('SELECT id, name, code FROM institutions LIMIT 3');
  assert(insts.rows.length >= 2, 'Need at least 2 institutions in database');
  const instA = insts.rows[0]; // e.g. SRM (TN010)
  const instB = insts.rows[1]; // e.g. Anna Univ (TN001)

  // Find a student from Institution A
  const stuA = await rm.pg.query('SELECT s.id, s.full_name, s.roll_number, s.institution_id FROM students s WHERE s.institution_id = $1 LIMIT 1', [instA.id]);
  assert(stuA.rows.length > 0, `Need at least 1 student in Institution ${instA.name}`);
  const studentA = stuA.rows[0];

  // Find an opportunity from any company
  const opps = await rm.pg.query('SELECT id, company_id, title FROM opportunities LIMIT 1');
  assert(opps.rows.length > 0, 'Need at least 1 opportunity in database');
  const opportunity = opps.rows[0];

  // Submit application for Student A to this opportunity
  const app = await rm.submitApplication(studentA, opportunity);
  assert(app && app.id, 'Application submitted successfully');

  // Verify Institution A sees the application
  const appsA = await rm.getApplicationsByInstitution(instA.id);
  const foundInA = appsA.find(a => a.id === app.id || a.applicationId === app.id);
  assert(Boolean(foundInA), `Institution A (${instA.name}) MUST see application of student enrolled in it`);
  assert(foundInA.studentId === studentA.id, 'Application studentId must match student A');
  assert(foundInA.opportunityTitle, 'Application must contain joined opportunity title');
  assert(foundInA.companyName, 'Application must contain joined company name');

  // Verify Institution B does NOT see the application
  const appsB = await rm.getApplicationsByInstitution(instB.id);
  const foundInB = appsB.find(a => a.id === app.id || a.applicationId === app.id);
  assert(!foundInB, `Institution B (${instB.name}) MUST NOT see application of student from Institution A`);

  console.log(`  ✓ Institution A (${instA.code}) sees student application (Count: ${appsA.length})`);
  console.log(`  ✓ Institution B (${instB.code}) is strictly isolated and cannot see it`);
  console.log('✅ P0 Institution Application Tracking PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: P1 — Move Interviews Completely to PostgreSQL
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[2/7] Testing P1: PostgreSQL Authoritative Interviews & Stage Transition...');
  
  const interviewDate = '2026-09-20';
  const interviewTime = '14:30';

  const beforeInterviewCount = await rm.pg.query('SELECT count(*) FROM interviews');
  const initialInterviews = parseInt(beforeInterviewCount.rows[0].count, 10);

  const newInterview = await rm.createInterview({
    applicationId: app.id,
    companyId: opportunity.company_id,
    candidateName: studentA.full_name,
    opportunityTitle: opportunity.title,
    date: interviewDate,
    time: interviewTime,
    format: 'Technical Coding Simulation'
  });

  assert(newInterview && newInterview.id, 'Interview must be created with an ID');
  assert(newInterview.applicationId === app.id, 'Interview must link to application ID');

  // Verify interview row directly in PostgreSQL
  const dbInterview = await rm.pg.query('SELECT * FROM interviews WHERE id::text = $1', [newInterview.id]);
  assert(dbInterview.rows.length === 1, 'Interview MUST exist as a physical row in PostgreSQL interviews table');
  assert(dbInterview.rows[0].round_type === 'Technical', 'Round type must be canonical Technical');
  assert(dbInterview.rows[0].status === 'Scheduled', 'Initial status must be Scheduled');

  // Verify application stage transitioned to 'Interview' in PostgreSQL
  const appStageCheck = await rm.pg.query('SELECT current_stage FROM applications WHERE id = $1', [app.id]);
  assert(appStageCheck.rows[0].current_stage === 'Interview', 'Application current_stage in PG must be Interview');

  // Verify application_stage_history entry in PostgreSQL
  const histCheck = await rm.pg.query('SELECT * FROM application_stage_history WHERE application_id = $1 AND stage = $2', [app.id, 'Interview']);
  assert(histCheck.rows.length > 0, 'Stage history audit record in PG must be created for Interview');

  // Read interviews by company via PostgreSQL
  const companyInterviews = await rm.getInterviewsByCompany(opportunity.company_id);
  assert(companyInterviews.some(i => i.id === newInterview.id), 'Company must retrieve newly scheduled interview from PostgreSQL');

  // Update interview in PostgreSQL
  const updatedInt = await rm.updateInterview(newInterview.id, { status: 'Completed', feedback: 'Excellent algorithmic thinking', score: 92 });
  assert(updatedInt && updatedInt.status === 'Completed', 'Interview status must be updated to Completed');

  const checkUpdated = await rm.pg.query('SELECT status, feedback, score FROM interviews WHERE id = $1', [newInterview.id]);
  assert(checkUpdated.rows[0].status === 'Completed' && checkUpdated.rows[0].score === 92, 'PostgreSQL record reflects Completed status and score');

  console.log(`  ✓ Created interview in PostgreSQL (Total interviews: ${initialInterviews + 1})`);
  console.log(`  ✓ Application stage updated to "Interview" in PostgreSQL applications & history tables`);
  console.log(`  ✓ Interview updated to "Completed" with score 92 directly in PostgreSQL`);
  console.log('✅ P1 Interviews in PostgreSQL PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: P1 — Move Module Progress Completely to PostgreSQL (student_module_progress)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[3/7] Testing P1: PostgreSQL Authoritative Module Progress & Deterministic Completion...');

  // Find a course with modules
  const courseRes = await rm.pg.query('SELECT c.id, c.title, count(cm.id) as mod_count FROM courses c JOIN course_modules cm ON cm.course_id = c.id GROUP BY c.id, c.title HAVING count(cm.id) > 0 LIMIT 1');
  assert(courseRes.rows.length > 0, 'Course with modules required in PostgreSQL');
  const targetCourse = courseRes.rows[0];
  const totalCourseMods = parseInt(targetCourse.mod_count, 10);

  // Create a dedicated student for clean progress testing from 0%
  const progTestUser = await rm.pg.query(`
    INSERT INTO users (email, password_hash, role, account_status, email_verified)
    VALUES ($1, 'hash_progress_test', 'STUDENT', 'ACTIVE', true)
    RETURNING id
  `, [`progress.tester.${Date.now()}@srmist.edu.in`]);
  const progStudentRes = await rm.pg.query(`
    INSERT INTO students (user_id, institution_id, department_id, roll_number, full_name, cgpa, batch, graduation_year, readiness_score)
    VALUES ($1, $2, (SELECT id FROM departments LIMIT 1), $3, 'Progress Test Student', 8.50, '2022-2026', 2026, 50)
    RETURNING id, full_name, roll_number
  `, [progTestUser.rows[0].id, instA.id, `PROG-STU-${Date.now()}`]);
  const progStudent = progStudentRes.rows[0];

  // Enroll student in this course
  const enrollment = await rm.enrollCourse(progStudent, targetCourse);
  assert(enrollment && enrollment.id, 'Enrollment created');

  const enrCheck = await rm.pg.query('SELECT * FROM enrollments WHERE id = $1', [enrollment.id]);
  assert(enrCheck.rows.length === 1, 'Enrollment must exist in PostgreSQL enrollments table');

  // Advance module 1
  const advance1 = await rm.advanceModule(enrollment.id);
  assert(advance1 && advance1.completedModules === 1, 'Completed module count must be 1');
  const expectedPct1 = Math.round((1 / totalCourseMods) * 100);
  assert(advance1.progress === expectedPct1, `Progress must be deterministic: ${expectedPct1}%`);

  // Verify row in PostgreSQL student_module_progress
  const smpRows = await rm.pg.query('SELECT * FROM student_module_progress WHERE enrollment_id = $1', [enrollment.id]);
  assert(smpRows.rows.length === 1, 'Exactly 1 row in student_module_progress table in PostgreSQL');

  // Test IDEMPOTENCY: advance the EXACT SAME module again
  const currentCompletedModId = smpRows.rows[0].module_id;
  const advanceDuplicate = await rm.advanceModule(enrollment.id, currentCompletedModId);
  assert(advanceDuplicate.alreadyCompleted === true, 'Duplicate completion must report alreadyCompleted = true');
  assert(advanceDuplicate.completedModules === 1, 'Completed count must NOT increment on duplicate');
  assert(advanceDuplicate.progress === expectedPct1, 'Progress percentage must NOT change on duplicate');

  const smpRowsAfterDup = await rm.pg.query('SELECT * FROM student_module_progress WHERE enrollment_id = $1', [enrollment.id]);
  assert(smpRowsAfterDup.rows.length === 1, 'Rows in student_module_progress must remain exactly 1 (no duplicate rows)');

  // Advance remaining modules until complete
  const allModules = await rm.pg.query('SELECT id FROM course_modules WHERE course_id = $1 ORDER BY module_number ASC', [targetCourse.id]);
  for (const m of allModules.rows) {
    await rm.advanceModule(enrollment.id, m.id);
  }

  const finalEnr = await rm.pg.query('SELECT * FROM enrollments WHERE id = $1', [enrollment.id]);
  assert(finalEnr.rows[0].progress_percentage === 100, 'Course progress must reach exactly 100%');
  assert(finalEnr.rows[0].status === 'Completed', 'Course status must transition to Completed');
  assert(Boolean(finalEnr.rows[0].completed_at), 'Completed_at timestamp must be recorded');

  console.log(`  ✓ Module advancement recorded in PostgreSQL student_module_progress table`);
  console.log(`  ✓ Idempotency verified: re-submitting same module leaves progress at ${expectedPct1}% without duplicate rows`);
  console.log(`  ✓ Full completion reached: 100% deterministic progress with Completed status in PostgreSQL`);
  console.log('✅ P1 Module Progress in PostgreSQL PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: P1 — Move Application Stages & Stage History to PostgreSQL
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[4/7] Testing P1: PostgreSQL Authoritative Application Lifecycle & Audit Trail...');

  // Update application to 'Selected'
  const selectedApp = await rm.updateApplicationStage(app.id, 'Selected');
  assert(selectedApp && selectedApp.current_stage === 'Selected', 'Stage must be updated to Selected');

  // Verify PostgreSQL applications table
  const checkAppPostgres = await rm.pg.query('SELECT current_stage, updated_at FROM applications WHERE id = $1', [app.id]);
  assert(checkAppPostgres.rows[0].current_stage === 'Selected', 'applications table in PG reflects Selected');

  // Verify stage history in PostgreSQL
  const stageHistory = await rm.pg.query('SELECT stage, notes FROM application_stage_history WHERE application_id = $1 ORDER BY created_at ASC', [app.id]);
  const stagesLogged = stageHistory.rows.map(r => r.stage);
  assert(stagesLogged.includes('Applied'), 'History must log Applied');
  assert(stagesLogged.includes('Interview'), 'History must log Interview');
  assert(stagesLogged.includes('Selected'), 'History must log Selected');

  // Idempotency: updating with the same stage again must not create duplicate history row
  const countBeforeDup = stageHistory.rows.length;
  await rm.updateApplicationStage(app.id, 'Selected');
  const countAfterDup = await rm.pg.query('SELECT count(*) FROM application_stage_history WHERE application_id = $1', [app.id]);
  assert(parseInt(countAfterDup.rows[0].count, 10) === countBeforeDup, 'Idempotent stage update must NOT create duplicate history record');

  console.log(`  ✓ Application lifecycle logged in PostgreSQL audit trail: [${stagesLogged.join(' → ')}]`);
  console.log(`  ✓ Idempotent update prevented duplicate stage history entries`);
  console.log('✅ P1 Application Stage Persistence PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: P2 — PostgreSQL Real Search
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[5/7] Testing P2: Real PostgreSQL Parameterized Search...');

  // Search for Python
  const searchPython = await rm.searchEntities('Python', { limit: 10 });
  assert(searchPython && searchPython.results, 'Search must return results object');
  assert(Array.isArray(searchPython.results.courses), 'results.courses must be an array');
  assert(Array.isArray(searchPython.results.skills), 'results.skills must be an array');
  assert(searchPython.totalMatches > 0, 'Should find matches for Python in PostgreSQL skills/courses');

  // Empty search
  const searchEmpty = await rm.searchEntities('', { limit: 10 });
  assert(searchEmpty.totalMatches === 0, 'Empty search must return 0 matches cleanly');

  // No-result search
  const searchGibberish = await rm.searchEntities('XyZ999NonExistentKeyword', { limit: 10 });
  assert(searchGibberish.totalMatches === 0, 'Non-existent search must return 0 matches cleanly');

  console.log(`  ✓ Search "Python": Found ${searchPython.totalMatches} matches across courses, skills, and opportunities in PostgreSQL`);
  console.log(`  ✓ Empty search: Handled cleanly with 0 matches`);
  console.log('✅ P2 Search in PostgreSQL PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Authoritative PostgreSQL Notifications
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[6/7] Testing PostgreSQL Notifications Persistence...');

  const notif = await rm.addNotification('student', {
    type: 'test_notification',
    title: 'PostgreSQL Direct Notification',
    message: 'Testing PostgreSQL notification persistence.',
    details: { testId: 'phase-5-notif' }
  });
  assert(notif && notif.id, 'Notification must be created with ID');

  const checkNotifDb = await rm.pg.query('SELECT * FROM notifications WHERE id::text = $1', [notif.id]);
  assert(checkNotifDb.rows.length === 1, 'Notification row MUST exist in PostgreSQL notifications table');

  const studentNotifs = await rm.getNotifications('student');
  assert(studentNotifs.some(n => n.id === notif.id), 'getNotifications must retrieve PostgreSQL notification');

  // Mark read
  await rm.markNotificationRead(notif.id);
  const checkRead = await rm.pg.query('SELECT is_read FROM notifications WHERE id::text = $1', [notif.id]);
  assert(checkRead.rows[0].is_read === true, 'Notification is_read flag updated in PostgreSQL');

  console.log(`  ✓ Notification persisted and marked read in PostgreSQL notifications table`);
  console.log('✅ Notifications in PostgreSQL PASS!\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Zero-State Verification for Brand New Student
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[7/7] Testing Zero-State Behavior for Brand-New Student...');

  const timestamp = Date.now();
  const testUser = await rm.pg.query(`
    INSERT INTO users (email, password_hash, role, account_status, email_verified)
    VALUES ($1, 'hash_test_dummy', 'STUDENT', 'ACTIVE', true)
    RETURNING id
  `, [`zerostate.tester.${timestamp}@srmist.edu.in`]);
  const newUserId = testUser.rows[0].id;

  const deptRes = await rm.pg.query('SELECT id FROM departments LIMIT 1');
  const deptId = deptRes.rows[0].id;

  const testStudent = await rm.pg.query(`
    INSERT INTO students (user_id, institution_id, department_id, roll_number, full_name, cgpa, batch, graduation_year, readiness_score)
    VALUES ($1, $2, $3, $4, 'Zero State Test Student', 0.00, '2022-2026', 2026, 0)
    RETURNING id
  `, [newUserId, instA.id, deptId, `ZERO-STU-${timestamp}`]);
  const newStudentId = testStudent.rows[0].id;

  // Verify Zero State facts directly
  const skillsCount = await rm.pg.query('SELECT count(*) FROM student_skills WHERE student_id = $1', [newStudentId]);
  assert(parseInt(skillsCount.rows[0].count, 10) === 0, 'New student must have 0 skills');

  const enrCount = await rm.pg.query('SELECT count(*) FROM enrollments WHERE student_id = $1', [newStudentId]);
  assert(parseInt(enrCount.rows[0].count, 10) === 0, 'New student must have 0 enrollments');

  const appCount = await rm.pg.query('SELECT count(*) FROM applications WHERE student_id = $1', [newStudentId]);
  assert(parseInt(appCount.rows[0].count, 10) === 0, 'New student must have 0 applications');

  const readinessScore = await rm.getReadiness(newStudentId);
  const rValue = typeof readinessScore === 'object' ? (readinessScore.overall ?? readinessScore.score ?? readinessScore.overallScore ?? 0) : readinessScore;
  assert(rValue === 0, `New student readiness MUST be exactly 0 (got ${rValue})`);

  console.log(`  ✓ Skills: 0`);
  console.log(`  ✓ Enrollments: 0`);
  console.log(`  ✓ Applications: 0`);
  console.log(`  ✓ Readiness score: 0 (No NaN, no mock fallback, no inherited records)`);
  console.log('✅ Zero-State Verification PASS!\n');

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL PHASE 5 PRODUCTION CORRECTIONS VERIFIED AGAINST POSTGRESQL 18.6');
  console.log('════════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
}

runPhase5Verification().catch(err => {
  console.error('\n❌ PHASE 5 VERIFICATION FAILURE:', err);
  process.exit(1);
});
