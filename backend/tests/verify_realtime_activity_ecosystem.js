// backend/tests/verify_realtime_activity_ecosystem.js
/**
 * Automated Verification Suite for SkillNexus AI:
 * REAL-TIME, DATA-DRIVEN, AND ACTIVITY-BASED ECOSYSTEM SPECIFICATION
 * 
 * Verifies via Live HTTP & Services:
 * 1. Zero-State Principle: Strict 0% Capability Snapshot, 7x30 0-activity heatmap, 0 stats
 * 2. Next Best Action: Dynamically generated from real student activity state
 * 3. Activity-Based Progression: Recalculates capability scores when skills/activity exist
 * 4. Emerging Tech & Courses: Dynamic readiness calculation and Google research links
 * 5. Explainable AI Matching: Deterministic match scores with explainable reasons & improvements
 * 6. Institution & Company Portals: Authentic 0% / 0 metrics when no activity exists
 * 7. Multi-Tenant Isolation: Complete segregation between different users and institutions
 */

const http = require('http');
const relationalManager = require('../src/db/relationalManager');
const matchingService = require('../src/services/matchingService');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runEcosystemVerification() {
  console.log('================================================================');
  console.log('🌐 SKILLNEXUS AI — REAL-TIME ACTIVITY-BASED ECOSYSTEM SPEC TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const instId = 'TN010';

    // ─── 1. ZERO-STATE INTEGRITY FOR FRESH STUDENT ───
    console.log('--- 1. ZERO-STATE INTEGRITY FOR FRESH STUDENT ---');
    const freshEmail = `realtime.fresh.${timestamp}@nexus.edu`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      role: 'student',
      name: 'Priya Sundaram',
      email: freshEmail,
      password: 'StrongPassword123!',
      collegeId: instId,
      department: 'Computer Science',
      careerGoal: 'Cloud AI Architect'
    });

    assert(regRes.status === 200 || regRes.status === 201, `Fresh student registration succeeded (${regRes.status})`);
    const studentToken = regRes.data.token;
    assert(!!studentToken, 'Acquired valid JWT token for fresh student');

    // Fetch dashboard data for fresh student
    const dashRes = await makeRequest('GET', '/api/students/dashboard-data', null, studentToken);
    assert(dashRes.status === 200, 'GET /api/students/dashboard-data returned 200 OK');
    const dData = dashRes.data.data;
    assert(!!dData, 'Dashboard payload exists');

    // Verify Capability Snapshot is strictly 0%
    const caps = dData.capabilitySnapshot || {};
    assert(caps.technicalSkills === 0, `Technical Skills is authentic 0% (was ${caps.technicalSkills})`);
    assert(caps.problemSolving === 0, `Problem Solving is authentic 0% (was ${caps.problemSolving})`);
    assert(caps.communication === 0, `Communication is authentic 0% (was ${caps.communication})`);
    assert(caps.systemDesign === 0, `System Design is authentic 0% (was ${caps.systemDesign})`);
    assert(caps.cloudDistributed === 0, `Cloud/Distributed is authentic 0% (was ${caps.cloudDistributed})`);

    // Verify Next Best Action for zero-activity student
    const nba = dData.nextBestAction || {};
    assert(nba.action === 'questionnaire' || nba.action === 'assessment', `Best Action prompts assessment/questionnaire (action: ${nba.action})`);
    assert(nba.priority === 'critical', `Best Action priority is critical (priority: ${nba.priority})`);

    // Verify Heatmap is 7x30 zeroes
    const heatmap = dData.heatmapData;
    assert(Array.isArray(heatmap) && heatmap.length === 7 && heatmap[0].length === 30, 'Heatmap is properly formatted as 7x30 grid');
    const maxHeatLevel = Math.max(...heatmap.flat());
    assert(maxHeatLevel === 0, 'Heatmap contains authentic 0 activity levels for fresh student with no recorded events');

    // Verify basic counters are genuine 0
    assert(dData.assessmentCount === 0, 'Assessment count is 0');
    assert(dData.skillsVerified === 0, 'Verified skills count is 0');
    assert(dData.coursesEnrolled === 0, 'Enrolled courses count is 0');
    assert(dData.projectsCompleted === 0, 'Projects completed count is 0');

    // ─── 2. DYNAMIC ACTIVITY-BASED PROGRESSION ───
    console.log('\n--- 2. DYNAMIC ACTIVITY-BASED PROGRESSION ---');
    // Update student with skills
    const studentRecord = await relationalManager.getStudentById(regRes.data.user.studentId);
    studentRecord.skills = [
      { name: 'Python Programming', level: 'advanced', confidence: 88, verified: true },
      { name: 'Docker & Kubernetes', level: 'advanced', confidence: 82, verified: true },
      { name: 'Data Structures & Algorithms', level: 'advanced', confidence: 78, verified: true }
    ];
    await relationalManager.saveStudent(studentRecord);

    // Re-fetch dashboard data
    const updatedDashRes = await makeRequest('GET', '/api/students/dashboard-data', null, studentToken);
    const upData = updatedDashRes.data.data;
    const upCaps = upData.capabilitySnapshot || {};

    assert(upCaps.technicalSkills > 0, `Technical Skills dynamically recalculated from Python (score: ${upCaps.technicalSkills}%)`);
    assert(upCaps.cloudDistributed > 0, `Cloud/Distributed dynamically recalculated from Docker/K8s (score: ${upCaps.cloudDistributed}%)`);
    assert(upCaps.problemSolving > 0, `Problem Solving dynamically recalculated from DSA (score: ${upCaps.problemSolving}%)`);

    // Next Best Action should now recommend course enrollment or project building
    const updatedNba = upData.nextBestAction || {};
    assert(!!updatedNba.title, `Best Action dynamically adapted (title: "${updatedNba.title}", action: "${updatedNba.actionText || updatedNba.action}")`);

    // ─── 3. COURSE CATALOG & DYNAMIC RESEARCH URLS ───
    console.log('\n--- 3. COURSE CATALOG & DYNAMIC GOOGLE RESEARCH URLS ---');
    assert(Array.isArray(upData.recommendedCourses) && upData.recommendedCourses.length > 0, 'Recommended courses list returned');
    const firstCourse = upData.recommendedCourses[0];
    const researchLink = firstCourse.googleResearchUrl || firstCourse.researchUrl;
    assert(typeof researchLink === 'string' && researchLink.includes('google.com/search?q='),
      `Course "${firstCourse.title}" contains dynamic Google research URL`);

    // Emerging Tech endpoint
    const emergingRes = await makeRequest('GET', '/api/emerging-tech', null, studentToken);
    assert(emergingRes.status === 200, 'GET /api/emerging-tech returned 200 OK');
    const emergingList = emergingRes.data.data || [];
    assert(emergingList.length > 0, 'Emerging tech list populated');
    const genAiTech = emergingList.find(t => t.slug === 'generative-ai') || emergingList[0];
    assert(typeof genAiTech.studentReadiness === 'number', `Student readiness dynamically computed (${genAiTech.studentReadiness}%)`);
    const eResearchLink = genAiTech.googleResearchUrl || genAiTech.researchUrl;
    assert(typeof eResearchLink === 'string' && eResearchLink.includes('google.com/search?q='),
      'Emerging tech attached contextual Google research link');

    // ─── 4. EXPLAINABLE AI MATCHING ENGINE ───
    console.log('\n--- 4. EXPLAINABLE AI MATCHING ENGINE ---');
    const jobReq = {
      title: 'Senior AI Engineer',
      requiredSkills: ['Python', 'Docker', 'React', 'AWS'],
      preferredSkills: ['Kubernetes'],
      minCgpa: 7.0
    };

    const matchWithSkills = matchingService.calculateMatch(
      { skills: ['Python Programming', 'Docker & Kubernetes'], cgpa: 8.5 },
      jobReq
    );
    assert(matchWithSkills.matchScore > 0, `Candidate with matched skills received match score: ${matchWithSkills.matchScore}%`);
    assert(Array.isArray(matchWithSkills.reasons) && matchWithSkills.reasons.length > 0, 'Explainable reasons provided');
    assert(Array.isArray(matchWithSkills.improvements) && matchWithSkills.improvements.length > 0, 'Actionable improvements provided');
    assert(typeof matchWithSkills.explanation === 'string' && matchWithSkills.explanation.length > 0, 'Natural language explanation provided');

    const zeroMatch = matchingService.calculateMatch({ skills: [], cgpa: 6.0 }, jobReq);
    assert(zeroMatch.matchScore === 0, 'Zero-match candidate receives strictly 0% match (no artificial floor)');

    // ─── 5. INSTITUTION & INDUSTRY DASHBOARDS AUTHENTIC ZEROES ───
    console.log('\n--- 5. INSTITUTION & INDUSTRY DASHBOARDS AUTHENTIC ZEROES ---');
    const emptyInstId = `EMPTY_COLLEGE_${timestamp}`;
    const instDash = await relationalManager.getInstitutionDashboard(emptyInstId);
    assert(instDash.totalStudents === 0, 'Empty institution reports 0 total students');
    assert(instDash.placementRate === 0, `Placement rate is genuine 0 for empty institution (was: ${instDash.placementRate})`);
    assert(instDash.curriculumAlignment === 0, `Curriculum alignment is genuine 0 for empty institution (was: ${instDash.curriculumAlignment})`);

    const emptyCompId = `EMPTY_CORP_${timestamp}`;
    const compDash = await relationalManager.getCompanyDashboard(emptyCompId);
    assert(compDash.activePostings === 0 || compDash.openPositions === 0, 'Empty company reports 0 active job postings');
    assert(compDash.talentMatchScore === 0, `Talent match score is genuine 0 for empty company (was: ${compDash.talentMatchScore})`);

    // ─── 6. MULTI-TENANT ISOLATION ───
    console.log('\n--- 6. MULTI-TENANT ISOLATION ---');
    const otherStudentEmail = `isolated.student.${timestamp}@othercollege.edu`;
    const regColleges = relationalManager.getRegisteredInstitutions();
    const otherInst = regColleges.find(c => c.id !== instId && (c.collegeId !== instId)) || regColleges[1] || { id: 'INST_BETA_1788798737304' };
    const otherInstId = otherInst.id || otherInst.collegeId;

    const otherReg = await makeRequest('POST', '/api/auth/register', {
      role: 'student',
      name: 'Deepak Raj',
      email: otherStudentEmail,
      password: 'StrongPassword123!',
      collegeId: otherInstId,
      department: 'Mechanical',
      careerGoal: 'Robotics Specialist'
    });
    assert(otherReg.status === 200 || otherReg.status === 201, `Student in other institution (${otherInstId}) registered successfully`);

    const instStudentsA = await relationalManager.getStudents(instId);
    const leaked = instStudentsA.some(s => s.email === otherStudentEmail);
    assert(!leaked, `Institution TN010 student roster does not contain students from ${otherInstId}`);

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runEcosystemVerification();
