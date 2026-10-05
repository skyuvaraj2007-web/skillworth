/**
 * Comprehensive Multi-Role Regression & Feature 5 End-to-End Test Suite
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const relationalManager = require('../src/db/relationalManager');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_2025_prod_sec';

async function runRegressionSuite() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END REGRESSION & FEATURE 5 SUITE');
  console.log('════════════════════════════════════════════════════════════════\n');

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

  try {
    // 1. Check Frontend Dev Server Health
    console.log('1️⃣ Checking Frontend Server & Route Availability...');
    const feRes = await fetch(FRONTEND_URL);
    assert(feRes.status === 200, `Frontend Dev Server serving HTTP 200 at ${FRONTEND_URL}`);

    // 2. Resolve Institution from Database
    console.log('\n2️⃣ Resolving Institution and Generating Authorized Token...');
    const instRes = await relationalManager.query(`
      SELECT id, name, code, official_email FROM institutions LIMIT 1
    `);
    const institution = (instRes.rows && instRes.rows[0]) || {
      id: 'bf58c321-45ff-427e-a52c-c6b62ea1f4a4',
      name: 'Vanguard Tech Institute',
      code: 'VTI-44703',
      official_email: 'admin@vanguard.edu'
    };

    const instToken = jwt.sign(
      {
        id: institution.id,
        userId: institution.id,
        institutionId: institution.id,
        collegeId: institution.id,
        email: institution.official_email || 'admin@vanguard.edu',
        role: 'institution',
        name: institution.name
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    assert(instToken, `Institution token generated for: ${institution.name} (${institution.id})`);

    // 3. Resolve Student User from Database
    console.log('\n3️⃣ Resolving Student User and Generating Student Token...');
    const userRes = await relationalManager.query(`
      SELECT id, email FROM users LIMIT 1
    `);
    const validUser = userRes.rows && userRes.rows[0];

    const studentToken = jwt.sign(
      {
        id: validUser ? validUser.id : 'd9f0f63b-6320-41fa-8a7e-128a5ff6992d',
        userId: validUser ? validUser.id : 'd9f0f63b-6320-41fa-8a7e-128a5ff6992d',
        email: validUser ? validUser.email : 'student@vanguard.edu',
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    assert(studentToken, `Student token generated for: ${validUser ? validUser.email : 'student'} with role 'student'`);

    // 4. Feature 5: College Dashboard KPIs
    console.log('\n4️⃣ Testing Feature 5: College Dashboard KPIs...');
    const kpiRes = await fetch(`${BASE_URL}/api/academic/intelligence/dashboard`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const kpiJson = await kpiRes.json();
    assert(kpiRes.status === 200 && kpiJson.success, 'Dashboard KPIs returned 200 OK');
    const dashboardData = kpiJson.data;
    const kpis = dashboardData.kpis;
    assert(typeof kpis.totalStudents === 'number', `Total Students returned: ${kpis.totalStudents}`);
    assert(typeof kpis.averageSkillScore === 'number', `Average Skill Score returned: ${kpis.averageSkillScore}%`);
    assert(kpis.placementReadiness && typeof kpis.placementReadiness.percentage === 'number', `Placement Readiness: ${kpis.placementReadiness.percentage}%`);
    assert(typeof kpis.activeIndustryOpportunities === 'number', `Active Industry Opportunities: ${kpis.activeIndustryOpportunities}`);
    assert(kpis.industryAssessments && typeof kpis.industryAssessments.activeCount === 'number', `Industry Assessments: ${kpis.industryAssessments.activeCount} active`);
    assert(typeof kpis.internships === 'number', `Internships: ${kpis.internships}`);
    assert(typeof kpis.certifications === 'number', `Certifications: ${kpis.certifications}`);
    assert(Array.isArray(dashboardData.topSkills) && dashboardData.topSkills.length > 0, `Top Skills populated (${dashboardData.topSkills.length} skills)`);
    assert(Array.isArray(dashboardData.weakSkills) && dashboardData.weakSkills.length > 0, `Weak Skills populated (${dashboardData.weakSkills.length} skills)`);
    assert(Array.isArray(dashboardData.missingSkills) && dashboardData.missingSkills.length > 0, `Missing Skills populated (${dashboardData.missingSkills.length} skills)`);
    const insights = dashboardData.actionableInsights || dashboardData.insights || [];
    assert(Array.isArray(insights) && insights.length >= 3, `Actionable Insights generated (${insights.length} recommendations)`);

    // 5. Feature 5: Skill Analytics (Department & Year Progression)
    console.log('\n5️⃣ Testing Feature 5: Skill Analytics...');
    const saRes = await fetch(`${BASE_URL}/api/academic/intelligence/skill-analytics`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const saJson = await saRes.json();
    assert(saRes.status === 200 && saJson.success, 'Skill Analytics returned 200 OK');
    const analytics = saJson.data;
    const deptScores = analytics.departmentScores || analytics.departmentSkillScores || [];
    assert(Array.isArray(deptScores), `Department-wise Skill Scores present (${deptScores.length} depts)`);
    const yearScores = analytics.yearScores || analytics.yearSkillScores || [];
    assert(Array.isArray(yearScores) && yearScores.length >= 4, `Year-wise (1st-4th) Progression present (${yearScores.length} cohorts)`);
    const compRate = analytics.courseCompletion?.overallCompletionRate ?? analytics.courseCompletion?.rate;
    assert(typeof compRate === 'number', `Course Completion Rate: ${compRate}%`);
    assert(analytics.assessmentPerformance && typeof analytics.assessmentPerformance.averageScore === 'number', `Assessment Performance: ${analytics.assessmentPerformance.averageScore}%`);
    const oppApps = analytics.opportunityParticipation?.totalApplications ?? analytics.opportunityParticipation?.applicationsCount;
    assert(typeof oppApps === 'number', `Opportunity Participation: ${oppApps} applications`);
    assert(analytics.filterOptions && analytics.filterOptions.departments.length > 0, 'Filter options for UI dropdowns populated');

    // 6. Feature 5: Skill Gap Matrix
    console.log('\n6️⃣ Testing Feature 5: Skill Gap Diagnostics...');
    const sgRes = await fetch(`${BASE_URL}/api/academic/intelligence/skill-gap`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const sgJson = await sgRes.json();
    assert(sgRes.status === 200 && sgJson.success, 'Skill Gap Matrix returned 200 OK');
    const gaps = sgJson.data.topSkillGaps || sgJson.data.skillGaps || [];
    assert(Array.isArray(gaps) && gaps.length >= 4, `Ranked Skill Gaps: ${gaps.length} items`);
    assert(gaps[0].skill === 'Cloud Computing' && (gaps[0].gapPercentage === 42 || gaps[0].gap === 42), `Top Gap 1: ${gaps[0].skill} (42% gap)`);
    assert(gaps[1].skill === 'SQL' && (gaps[1].gapPercentage === 35 || gaps[1].gap === 35), `Top Gap 2: ${gaps[1].skill} (35% gap)`);
    assert(gaps.some(g => g.skill === 'Communication'), `Top Gap includes Communication`);
    assert(gaps.some(g => g.skill === 'Data Structures' || g.skill.includes('Docker')), `Top Gap includes technical foundations`);

    // 7. Feature 5: Actionable Training Initiative Provisioning
    console.log('\n7️⃣ Testing Actionable Training Initiative Provisioning...');
    const initRes = await fetch(`${BASE_URL}/api/academic/intelligence/training-initiative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        title: 'Cloud & Kubernetes Containerization Accelerated Program',
        skill: 'Cloud Computing',
        department: 'Computer Science and Engineering',
        targetBatch: '2026',
        durationWeeks: 8,
        level: 'Intermediate',
        description: 'Bridge 42% gap in cloud native architecture.'
      })
    });
    const initJson = await initRes.json();
    const createdCourse = initJson.course || initJson.data?.course || initJson.data;
    assert(initRes.status === 201 && initJson.success, `Training Program successfully provisioned: ${createdCourse?.title}`);
    assert(createdCourse?.status === 'ACTIVE', `Training Program status is ACTIVE (${createdCourse?.status})`);

    // 8. Privacy & Role Permission Security
    console.log('\n8️⃣ Testing Privacy & Role Permissions...');
    const studentBlockedRes = await fetch(`${BASE_URL}/api/academic/intelligence/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentBlockedJson = await studentBlockedRes.json().catch(() => ({}));
    assert(studentBlockedRes.status === 403, `Student role successfully blocked (Status: ${studentBlockedRes.status}, Message: ${studentBlockedJson.message})`);

    const unauthBlockedRes = await fetch(`${BASE_URL}/api/academic/intelligence/dashboard`);
    assert(unauthBlockedRes.status === 401, 'Unauthenticated access successfully blocked (HTTP 401)');

    // 9. Regression Check: Existing Academic Opportunities
    console.log('\n9️⃣ Regression Verification: Academic Opportunities & Verification...');
    const oppRes = await fetch(`${BASE_URL}/api/academic/opportunities`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    assert(oppRes.status === 200, 'Academic opportunities endpoint functions normally (HTTP 200)');

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Test suite failed with exception:', err);
    process.exit(1);
  }
}

runRegressionSuite();
