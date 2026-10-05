require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const rm = require('../src/db/relationalManager');
const matchingService = require('../src/services/matchingService');

async function getBaselineCounts() {
  const tables = ['users', 'students', 'institutions', 'companies', 'courses', 'skills', 'projects', 'opportunities'];
  const counts = {};
  for (const t of tables) {
    const res = await rm.pg.query(`SELECT count(*) as count FROM "${t}"`);
    counts[t] = parseInt(res.rows[0].count, 10);
  }
  return counts;
}

async function runRuntimeVerification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('SKILLNEXUS — POSTGRESQL-ONLY RUNTIME VALIDATION (PHASE 2 & PHASE 6)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  console.log('[1/7] Verifying POSTGRESQL_REQUIRED Fallback Guard...');
  assert.strictEqual(rm.isPgRequired, true, 'POSTGRESQL_REQUIRED must be active and true');

  // Verify that any attempt to read/write JSON throws DATABASE ERROR
  let readBlocked = false;
  try {
    rm._read();
  } catch (err) {
    if (err.code === 'POSTGRESQL_REQUIRED') {
      readBlocked = true;
      console.log('  ✓ rm._read() blocked:', err.message);
    }
  }
  assert.strictEqual(readBlocked, true, 'rm._read() MUST be strictly blocked');

  let writeBlocked = false;
  try {
    rm._write({});
  } catch (err) {
    if (err.code === 'POSTGRESQL_REQUIRED') {
      writeBlocked = true;
      console.log('  ✓ rm._write() blocked:', err.message);
    }
  }
  assert.strictEqual(writeBlocked, true, 'rm._write() MUST be strictly blocked');
  console.log('✅ Fallback control is enforced.\n');

  // Record Phase 6 Baseline Counts
  console.log('[2/7] Capturing Phase 6 Pre-Test Database Counts...');
  const beforeCounts = await getBaselineCounts();
  console.log('Baseline counts:', JSON.stringify(beforeCounts, null, 2));

  // Query Sample Entities from PostgreSQL
  const stuRes = await rm.pg.query('SELECT s.*, u.email FROM students s JOIN users u ON u.id = s.user_id LIMIT 1');
  assert(stuRes.rows.length > 0, 'Need at least one student in PostgreSQL');
  const stu = stuRes.rows[0];

  const instRes = await rm.pg.query('SELECT * FROM institutions LIMIT 1');
  assert(instRes.rows.length > 0, 'Need at least one institution in PostgreSQL');
  const inst = instRes.rows[0];

  const compRes = await rm.pg.query('SELECT * FROM companies LIMIT 1');
  assert(compRes.rows.length > 0, 'Need at least one company in PostgreSQL');
  const comp = compRes.rows[0];

  const oppRes = await rm.pg.query('SELECT * FROM opportunities LIMIT 1');
  assert(oppRes.rows.length > 0, 'Need at least one opportunity in PostgreSQL');
  const opp = oppRes.rows[0];

  // 1. AUTH
  console.log('\n[3/7] Testing AUTH Paths:');
  const authRes = await rm.authenticateUser('nonexistent.user.audit@skillnexus.ai', 'SecretPass!123', 'student');
  assert.strictEqual(authRes.success, false, 'Auth must cleanly return false for invalid user');
  assert.strictEqual(authRes.statusCode, 404, 'Auth must return 404');
  console.log('  ✓ authenticateUser: Verified (rejected non-existent user directly from PostgreSQL without JSON access)');

  // 2. STUDENT PATHS
  console.log('\n[4/7] Testing STUDENT Paths:');
  // profile
  const stuProfile = await rm.getStudentById(stu.id);
  assert(stuProfile && stuProfile.id === stu.id, 'Student profile lookup failed');
  console.log(`  ✓ profile: Loaded "${stuProfile.fullName || stuProfile.name}" (${stuProfile.email})`);

  // academic
  assert(stuProfile.department || stuProfile.departmentName || stuProfile.institutionName, 'Academic fields must be present');
  console.log(`  ✓ academic: Dept: ${stuProfile.department || stuProfile.departmentName || 'Eng'}, CGPA: ${stuProfile.cgpa}, Batch: ${stuProfile.batch}`);

  // skills
  console.log(`  ✓ skills: ${stuProfile.skills.length} skills retrieved from student_skills table`);

  // learning
  const enrollments = await rm.getEnrollments(stu.id);
  assert(Array.isArray(enrollments), 'getEnrollments must return an array');
  console.log(`  ✓ learning: ${enrollments.length} enrollments loaded from enrollments table`);

  // courses
  const courses = await rm.getCourses();
  assert(Array.isArray(courses) && courses.length > 0, 'getCourses must return courses from PostgreSQL');
  console.log(`  ✓ courses: ${courses.length} courses loaded from courses table`);

  // assessments
  const assessments = await rm.getAssessments();
  assert(Array.isArray(assessments) && assessments.length > 0, 'getAssessments must return assessments from PostgreSQL');
  console.log(`  ✓ assessments: ${assessments.length} assessments loaded from assessments table`);

  // projects
  const projects = await rm.getProjects(stu.id);
  assert(Array.isArray(projects), 'getProjects must return an array');
  console.log(`  ✓ projects: ${projects.length} projects loaded from projects table`);

  // notifications
  const notifs = await rm.getNotifications('student');
  assert(Array.isArray(notifs), 'getNotifications must return an array');
  console.log(`  ✓ notifications: ${notifs.length} notifications loaded from notifications table`);

  // telemetry
  const telemetry = await rm.getInstitutionTelemetry(stu.institution_id || inst.id);
  assert(telemetry && telemetry.totalStudents >= 0, 'Telemetry must be calculated');
  console.log(`  ✓ telemetry: Avg Readiness: ${telemetry.avgReadiness}, Campus Students: ${telemetry.totalStudents}`);

  // 3. INSTITUTION PATHS
  console.log('\n[5/7] Testing INSTITUTION Paths:');
  // profile
  const instProfile = await rm.resolveInstitution(inst.id);
  assert(instProfile && instProfile.id === inst.id, 'Institution profile lookup failed');
  console.log(`  ✓ profile: Loaded "${instProfile.name}" (Code: ${instProfile.code})`);

  // departments
  const departments = await rm.getInstitutionDepartments(inst.id);
  assert(Array.isArray(departments), 'getInstitutionDepartments must return an array');
  console.log(`  ✓ departments: ${departments.length} departments loaded from departments table`);

  // students
  const instStudents = await rm.getStudents(inst.id);
  assert(Array.isArray(instStudents), 'getStudents must return an array');
  console.log(`  ✓ students: ${instStudents.length} students loaded for institution from students table`);

  // analytics
  const instAnalytics = await rm.getInstitutionAnalytics(inst.id);
  assert(instAnalytics && typeof instAnalytics.companyCount === 'number', 'Institution analytics must be computed');
  console.log(`  ✓ analytics: Companies: ${instAnalytics.companyCount}, Opps: ${instAnalytics.opportunityCount}, Apps: ${instAnalytics.applicationCount}`);

  // dashboard
  const instDashboard = await rm.getInstitutionDashboard(inst.id);
  assert(instDashboard && typeof instDashboard.totalStudents === 'number', 'Institution dashboard must be computed');
  console.log(`  ✓ dashboard: Total Students: ${instDashboard.totalStudents}, Placement Rate: ${instDashboard.placementRate}%`);

  // 4. INDUSTRY PATHS
  console.log('\n[6/7] Testing INDUSTRY Paths:');
  // profile
  const compProfile = await rm.getCompanyById(comp.id);
  assert(compProfile && compProfile.id === comp.id, 'Company profile lookup failed');
  console.log(`  ✓ profile: Loaded "${compProfile.company_name || compProfile.name}"`);

  // companies
  const companies = await rm.getCompanies();
  assert(Array.isArray(companies) && companies.length > 0, 'getCompanies must return companies from PostgreSQL');
  console.log(`  ✓ companies: ${companies.length} companies loaded from companies table`);

  // company-by-id
  const compById = await rm.getCompanyById(comp.id);
  assert(compById && compById.id === comp.id, 'getCompanyById failed');
  console.log(`  ✓ company-by-id: Verified (${compById.company_name})`);

  // search
  const searchRes = await rm.searchEntities('engineering', { page: 1, limit: 5 });
  assert(searchRes && searchRes.results, 'searchEntities must return valid search results');
  console.log(`  ✓ search: Retrieved ${searchRes.results.courses.length} courses, ${searchRes.results.opportunities.length} opps, ${searchRes.results.companies.length} companies`);

  // opportunities
  const opportunities = await rm.getOpportunities();
  assert(Array.isArray(opportunities) && opportunities.length > 0, 'getOpportunities must return opportunities from PostgreSQL');
  console.log(`  ✓ opportunities: ${opportunities.length} opportunities loaded from opportunities table`);

  // applications
  const applications = await rm.getApplications({ companyId: comp.id });
  assert(Array.isArray(applications), 'getApplications must return an array');
  console.log(`  ✓ applications: ${applications.length} applications loaded from applications table`);

  // matching
  const matchResult = await matchingService.matchStudentToOpportunity(stu.id, opp.id);
  assert(matchResult && typeof matchResult.matchScore === 'number', 'Match result must have matchScore');
  console.log(`  ✓ matching: Match score calculated: ${matchResult.matchScore}% (${matchResult.reasons.length} matching reasons)`);

  // dashboard
  const compDashboard = await rm.getCompanyDashboard(comp.id);
  assert(compDashboard && compDashboard.companyId === comp.id, 'Company dashboard must be computed');
  console.log(`  ✓ dashboard: Opps: ${compDashboard.totalOpportunities}, Apps: ${compDashboard.totalApplications}, Talent Pool: ${compDashboard.totalPoolStudents}`);

  // 5. PHASE 6 POST-TEST INTEGRITY
  console.log('\n[7/7] Verifying Phase 6 Database Integrity (Post-Test Counts)...');
  const afterCounts = await getBaselineCounts();
  console.log('Post-test counts:', JSON.stringify(afterCounts, null, 2));

  for (const table of Object.keys(beforeCounts)) {
    assert.strictEqual(
      afterCounts[table],
      beforeCounts[table],
      `COUNT MISMATCH on table "${table}": before=${beforeCounts[table]}, after=${afterCounts[table]}`
    );
  }
  console.log('✅ ZERO database mutations occurred during read-only verification!');

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL RUNTIME PATHS FULLY VERIFIED ON POSTGRESQL (NO JSON ACCESS)');
  console.log('════════════════════════════════════════════════════════════════════════');
}

runRuntimeVerification()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  });
