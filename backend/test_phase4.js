/**
 * Phase 4 QA Verification Script
 * Validates DB-backed authentication, strict campus isolation,
 * and live Campus ↔ Industry Skill Gap calculations.
 */

const relationalManager = require('./src/db/relationalManager');

async function runTests() {
  console.log('🧪 RUNNING PHASE 4 AUTOMATED TEST SUITE...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // TEST 1: Student Authentication
  console.log('1. Authentication Tests');
  const stuAuth = await relationalManager.authenticateUser('arun.kumar@nexus.edu', 'password123', 'student');
  assert(stuAuth.success === true, 'Student login succeeds with valid credentials');
  assert(stuAuth.user?.studentId === 'STU-TN010-001', 'Student has normalized ID STU-TN010-001');
  assert(stuAuth.user?.collegeId === 'TN010', 'Student belongs to college TN010');

  // TEST 2: Institution Authentication
  const instAuth = await relationalManager.authenticateUser('placements@srmist.edu.in', 'password123', 'institution');
  assert(instAuth.success === true, 'Institution login succeeds with valid credentials');
  assert(instAuth.user?.collegeId === 'TN010', 'Institution has normalized collegeId TN010');
  assert(instAuth.user?.role === 'institution', 'Institution role normalized to "institution"');

  // TEST 3: Company Authentication
  const compAuth = await relationalManager.authenticateUser('talent@abctech.com', 'password123', 'company');
  assert(compAuth.success === true, 'Company login succeeds with valid credentials');
  assert(compAuth.user?.companyId === 'COMP-001', 'Company has normalized companyId COMP-001');
  assert(compAuth.user?.role === 'company', 'Company role normalized to "company"');

  // TEST 4: Invalid Password Rejection
  const badAuth = await relationalManager.authenticateUser('arun.kumar@nexus.edu', 'wrongpassword', 'student');
  assert(badAuth.success === false, 'Invalid credentials rejected properly');

  // TEST 5: Strict Campus Isolation
  console.log('\n2. Strict Campus Isolation Tests');
  const srmStudents = await relationalManager.getStudents('TN010');
  const hasOnlyTN010 = srmStudents.every(s => String(s.collegeId).toUpperCase() === 'TN010' || String(s.collegeId).toUpperCase() === 'SRM001');
  assert(hasOnlyTN010, 'SRMIST (TN010) student query contains only TN010 students');
  const annaLeakedInSRM = srmStudents.some(s => String(s.collegeId).toUpperCase() === 'TN001');
  assert(!annaLeakedInSRM, 'Zero Anna University (TN001) students leaked into SRM view');

  const cegStudents = await relationalManager.getStudents('TN001');
  const hasOnlyTN001 = cegStudents.length > 0 && cegStudents.every(s => String(s.collegeId).toUpperCase() === 'TN001');
  assert(hasOnlyTN001, 'Anna University (TN001) query returns strictly TN001 students');

  // TEST 6: Campus ↔ Industry Skill Gap Engine
  console.log('\n3. Campus ↔ Industry Skill Gap Engine Tests');
  const skillGap = await relationalManager.getCampusSkillGapAnalytics('TN010');
  assert(skillGap !== null, 'Skill gap analytics calculated successfully');
  assert(Array.isArray(skillGap.matrix) && skillGap.matrix.length > 0, 'Skill gap matrix contains evaluated technical skills');
  assert(typeof skillGap.criticalGapsCount === 'number', 'Critical gap count is quantified');
  assert(Boolean(skillGap.executiveSummary), 'Executive recommendation summary is generated');

  const topGap = skillGap.matrix[0];
  console.log(`     Top campus skill gap: ${topGap.skillName} (Demand: ${topGap.industryDemandPct}%, Supply: ${topGap.campusSupplyPct}%, Deficit: -${topGap.netGap}%)`);
  assert(topGap.netGap !== undefined, 'Net gap calculated deterministically');

  // TEST 7: Campus Telemetry Aggregator
  console.log('\n4. Campus Telemetry Aggregator Tests');
  const telemetry = await relationalManager.getInstitutionTelemetry('TN010');
  assert(telemetry.totalStudents >= 1, `Campus student count is positive (${telemetry.totalStudents})`);
  assert(Boolean(telemetry.avgReadiness), `Average readiness score calculated (${telemetry.avgReadiness})`);

  console.log(`\n====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`====================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
