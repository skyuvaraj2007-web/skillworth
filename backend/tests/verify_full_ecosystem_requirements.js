// backend/tests/verify_full_ecosystem_requirements.js
/**
 * SKILLNEXUS AI — Comprehensive Automated Verification Suite for 14 Requirement Tests
 * 
 * Tests 1-3: Student Zero-State & Activity-Driven Progression
 * Tests 4-6: Institution Relationship Isolation & Cross-College Prevention
 * Tests 7-9: Industry Collaboration Boundary & Access Denials
 * Tests 10-12: Auth Email+Password, Removal of College ID from Login, Forgot Password
 * Tests 13-14: Emerging Tech Google Button URL & Learning Route Resolution
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function fetchJson(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE 14-TEST ECOSYSTEM VERIFICATION SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: Student Tests (Tests 1 - 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Student Lifecycle & Zero-State ---');

  // Test 1: New Student Account Creation -> Initial Zero State
  const studentEmail = `student.zero.${timestamp}@campus.edu`;
  const studentPassword = 'SecureStudent123!';

  const regRes = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      name: 'Zero State Student',
      institutionId: 'TN010',
      collegeId: 'TN010'
    })
  });
  assert(regRes.status === 201 || regRes.status === 200, 'Student account created successfully');

  // Verify OTP
  const otp = regRes.data.demoOtp || '123456';
  const verifyRes = await fetchJson(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      otp: otp,
      role: 'student',
      purpose: 'ACCOUNT_VERIFICATION'
    })
  });
  assert(verifyRes.ok, 'Student account verified with OTP');

  // Login
  const loginRes = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: studentPassword,
      role: 'student'
    })
  });
  assert(loginRes.ok && loginRes.data.token, 'Student logged in successfully with email and password');
  const studentToken = loginRes.data.token;
  const studentAuthHeader = { 'Authorization': `Bearer ${studentToken}` };

  // Check Dashboard Zero State
  const dashRes = await fetchJson(`${API_BASE}/students/dashboard`, { headers: studentAuthHeader });
  assert(dashRes.ok, 'Student dashboard endpoint responded successfully');
  const dData = dashRes.data.data;

  assert(dData.coursesCompleted === 0, 'Test 1: coursesCompleted = 0');
  assert(dData.coursesEnrolled === 0, 'Test 1: coursesEnrolled = 0');
  assert(dData.skillsVerified === 0, 'Test 1: skillsVerified = 0');
  assert(dData.skillsSelfAssessed === 0, 'Test 1: skillsSelfAssessed = 0');
  assert(dData.projectsCompleted === 0, 'Test 1: projectsCompleted = 0');
  assert(dData.projectsTotal === 0, 'Test 1: projectsTotal = 0');
  assert(dData.assessmentCount === 0, 'Test 1: assessmentCount = 0');
  assert(dData.careerReadiness === 0, 'Test 1: careerReadiness = 0%');
  assert(dData.capabilities.technicalSkills === 0, 'Test 1: Technical skills capability = 0');
  assert(dData.capabilities.problemSolving === 0, 'Test 1: Problem solving capability = 0');
  assert(Array.isArray(dData.achievements) && dData.achievements.length === 0, 'Test 1: Achievements = 0 (empty)');
  assert(dData.nextBestAction.priority === 'critical', 'Test 1: Next best action prompts starting first assessment');

  // Test 2: Student completes one learning activity -> Relevant progress changes
  const relationalManager = require('../src/db/relationalManager');
  const studentRecord = await relationalManager.getStudentById(studentEmail);
  const course = {
    courseId: `CRS-ADV-${timestamp}`,
    title: 'Cloud Systems Engineering',
    totalModules: 8,
    category: 'Cloud',
    modules: Array.from({ length: 8 }, (_, i) => ({ id: `mod_${i + 1}`, title: `Module ${i + 1}` }))
  };
  const testEnrollment = await relationalManager.enrollCourse(studentRecord, course);
  assert(testEnrollment && (testEnrollment.progress === 0 || testEnrollment.progress_percentage === 0), 'Student enrolled in course with 0% initial progress');

  // Verify enrolled course appears in learning list
  const learningRes = await fetchJson(`${API_BASE}/learning`, { headers: studentAuthHeader });
  assert(learningRes.ok, 'Fetched learning enrollments');
  const enrollments = learningRes.data.data.enrollments || [];
  assert(enrollments.length >= 1, 'Enrolled course visible in student learning list');

  const advanceRes = await fetchJson(`${API_BASE}/learning/${encodeURIComponent(testEnrollment.id || testEnrollment.enrollmentId)}/modules/mod_1/complete`, {
    method: 'POST',
    headers: studentAuthHeader
  });
  assert(advanceRes.ok && advanceRes.data.data.progress > 0, 'Test 2: Learning module completed and progress updated');

  // Test 3: Student completes course/assessment -> Corresponding metrics update
  const assessRes = await fetchJson(`${API_BASE}/students/assess`, {
    method: 'POST',
    headers: studentAuthHeader,
    body: JSON.stringify({
      careerGoal: 'Full Stack Engineer',
      domain: 'Information Technology',
      categoryRatings: { programming: 90, systemDesign: 80, cloudDevOps: 75, dataAI: 70, problemSolving: 85 },
      primarySkills: ['JavaScript', 'React', 'Node.js', 'SQL']
    })
  });
  assert(assessRes.ok && assessRes.data.data.readinessScore > 0, 'Test 3: Assessment completed and readiness score updated');

  const dashAfterRes = await fetchJson(`${API_BASE}/students/dashboard`, { headers: studentAuthHeader });
  assert(dashAfterRes.ok, 'Fetched updated dashboard');
  const dAfter = dashAfterRes.data.data;
  assert(dAfter.careerReadiness > 0, 'Test 3: Dashboard careerReadiness updated based on genuine activity');
  assert(dAfter.capabilities.technicalSkills > 0, 'Test 3: Technical skills capability calculated from activity');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: Institution Relationship Isolation (Tests 4 - 6)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: Institution Isolation ---');

  // Register Institution A
  const instAEmail = `instA.${timestamp}@srm.edu`;
  const instPass = 'AdminPass123!';
  const instAReg = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: instAEmail,
      password: instPass,
      role: 'institution',
      name: 'SRM Admin',
      institutionId: 'TN010',
      collegeId: 'TN010',
      institutionName: 'SRM Institute of Science and Technology'
    })
  });
  assert(instAReg.ok || instAReg.status === 201, 'Institution A registered');
  await fetchJson(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ email: instAEmail, otp: instAReg.data.demoOtp || '123456', role: 'institution', purpose: 'ACCOUNT_VERIFICATION' })
  });
  const instALogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: instAEmail, password: instPass, role: 'institution' })
  });
  const instAToken = instALogin.data.token;
  const instAHeaders = { 'Authorization': `Bearer ${instAToken}` };

  // Register Institution B (different institution)
  const instBEmail = `instB.${timestamp}@vit.edu`;
  const instBReg = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: instBEmail,
      password: instPass,
      role: 'institution',
      name: 'VIT Admin',
      institutionId: 'TN012',
      collegeId: 'TN012',
      institutionName: 'Vellore Institute of Technology'
    })
  });
  assert(instBReg.ok || instBReg.status === 201, 'Institution B registered');
  await fetchJson(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ email: instBEmail, otp: instBReg.data.demoOtp || '123456', role: 'institution', purpose: 'ACCOUNT_VERIFICATION' })
  });
  const instBLogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: instBEmail, password: instPass, role: 'institution' })
  });
  const instBToken = instBLogin.data.token;
  const instBHeaders = { 'Authorization': `Bearer ${instBToken}` };

  // Test 4: Student belongs to Institution A -> Institution A can see permitted student data
  const instAStudents = await fetchJson(`${API_BASE}/academic/students`, { headers: instAHeaders });
  assert(instAStudents.ok, 'Institution A fetched its student roster');
  const foundInA = (instAStudents.data.data || []).some(s => s.email === studentEmail);
  assert(foundInA, 'Test 4: Institution A can see student belonging to its campus');

  // Test 5: Student belongs to Institution A -> Institution B cannot see that student
  const instBStudents = await fetchJson(`${API_BASE}/academic/students`, { headers: instBHeaders });
  assert(instBStudents.ok, 'Institution B fetched its student roster');
  const foundInB = (instBStudents.data.data || []).some(s => s.email === studentEmail);
  assert(!foundInB, 'Test 5: Institution B CANNOT see Institution A student in roster');

  // Direct ID check: Institution B attempts to view Institution A student directly
  const directAccessRes = await fetchJson(`${API_BASE}/academic/students/${encodeURIComponent(studentEmail)}`, { headers: instBHeaders });
  assert(directAccessRes.status === 404 || directAccessRes.status === 403, 'Test 5: Institution B directly querying Institution A student is denied (404/403)');

  // Test 6: Student has no institution -> No institution sees that student
  const unassocEmail = `unassociated.${timestamp}@personal.com`;
  const unassocReg = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: unassocEmail,
      password: 'PersonalStudent123!',
      role: 'student',
      name: 'Unassociated Student',
      institutionId: '',
      collegeId: ''
    })
  });
  assert(unassocReg.ok || unassocReg.status === 201, 'Unassociated student registered');
  await fetchJson(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ email: unassocEmail, otp: unassocReg.data.demoOtp || '123456', role: 'student', purpose: 'ACCOUNT_VERIFICATION' })
  });

  const instAAfter = await fetchJson(`${API_BASE}/academic/students`, { headers: instAHeaders });
  const unassocInA = (instAAfter.data.data || []).some(s => s.email === unassocEmail);
  const instBAfter = await fetchJson(`${API_BASE}/academic/students`, { headers: instBHeaders });
  const unassocInB = (instBAfter.data.data || []).some(s => s.email === unassocEmail);
  assert(!unassocInA && !unassocInB, 'Test 6: Student with no institution relationship appears in NEITHER institution roster');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: Industry Collaboration & Student Access (Tests 7 - 9)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Industry Collaboration Isolation ---');

  // Company A (COMP-001) has collaboration with TN010
  const compAEmail = `recruiterA.${timestamp}@techcorp.com`;
  const compPass = 'CompanyPass123!';
  const compAReg = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: compAEmail,
      password: compPass,
      role: 'company',
      name: 'TechCorp Recruiter',
      companyId: 'COMP-001',
      companyName: 'ABC Technologies'
    })
  });
  assert(compAReg.ok || compAReg.status === 201, 'Company A registered');
  await fetchJson(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ email: compAEmail, otp: compAReg.data.demoOtp || '123456', role: 'company', purpose: 'ACCOUNT_VERIFICATION' })
  });
  const compALogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: compAEmail, password: compPass, role: 'company' })
  });
  const compAToken = compALogin.data.token;
  const compAHeaders = { 'Authorization': `Bearer ${compAToken}` };

  // Test 7: Company has collaboration with student's institution -> Student appears in talent pipeline
  const candidatesRes = await fetchJson(`${API_BASE}/company/candidates`, { headers: compAHeaders });
  assert(candidatesRes.ok, 'Company A fetched authorized candidate pool');
  const foundStudentInCompA = (candidatesRes.data.data || []).some(s => s.email === studentEmail || s.collegeId === 'TN010');
  assert(foundStudentInCompA, 'Test 7: Company with collaboration sees eligible students');

  // Test 8: Company has no collaboration with unassociated student -> Student does NOT appear
  const unassocInComp = (candidatesRes.data.data || []).some(s => s.email === unassocEmail);
  assert(!unassocInComp, 'Test 8: Student with no collaboration does NOT appear in company candidates');

  // Test 9: Company attempts to access unassociated student via GET /api/students/:studentId
  const directForbiddenRes = await fetchJson(`${API_BASE}/students/${encodeURIComponent(unassocEmail)}`, { headers: compAHeaders });
  assert(directForbiddenRes.status === 403 || directForbiddenRes.status === 404, 'Test 9: Company attempting to access unauthorized student is denied (403 Forbidden)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: Authentication, UI & Forgot Password (Tests 10 - 12)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 4: Authentication & Login Security ---');

  // Test 10: Login with email + password -> Successful authentication
  const test10Login = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail, password: studentPassword, role: 'student' })
  });
  assert(test10Login.ok && test10Login.data.success, 'Test 10: Valid email + password logs in successfully');

  // Test 11: Login UI code inspection -> College ID field does NOT exist in login forms
  const instLoginCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/InstitutionLogin.jsx'), 'utf8');
  const indLoginCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/IndustryLogin.jsx'), 'utf8');
  const stuLoginCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/StudentLogin.jsx'), 'utf8');

  // In InstitutionLogin, the form input for INSTITUTION ID / AISHE CODE in login must be removed
  const hasInstIdInputInLogin = instLoginCode.includes('INSTITUTION ID / AISHE CODE');
  const hasCompanyIdInputInLogin = indLoginCode.includes('value={companyId}') && indLoginCode.includes('COMPANY ID');
  const hasStudentCollegeIdInLogin = stuLoginCode.includes('EMAIL / STUDENT ID');

  assert(!hasInstIdInputInLogin, 'Test 11: Institution login UI does not contain INSTITUTION ID / AISHE CODE input');
  assert(!hasCompanyIdInputInLogin, 'Test 11: Industry login UI does not contain COMPANY ID input');
  assert(!hasStudentCollegeIdInLogin, 'Test 11: Student login UI label is clean EMAIL (no College ID / Student ID required)');

  // Test 12: Forgot password flow
  const forgotRes = await fetchJson(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail, role: 'student' })
  });
  assert(forgotRes.ok && forgotRes.data.success, 'Test 12: Forgot password initiates OTP successfully');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 5: Navigation, Emerging Tech & Learning Page (Tests 13 - 14)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 5: Navigation & Component Verification ---');

  // Test 13: Emerging Tech Google button safe URL generation
  const googleResearchUtil = require('../../frontend/src/utils/googleResearch.js');
  const urlFromString = googleResearchUtil.getGoogleResearchUrl('Artificial Intelligence');
  const urlFromObject = googleResearchUtil.getGoogleResearchUrl({ category: 'Generative AI', focus: 'LLMs' });
  const urlFromNull = googleResearchUtil.getGoogleResearchUrl(null);

  assert(urlFromString.startsWith('https://www.google.com/search?q='), 'Test 13: String Google research URL generated safely');
  assert(urlFromObject.includes('Generative+AI') || urlFromObject.includes('Generative%20AI'), 'Test 13: Object-based Google research URL generated safely without throwing error');
  assert(urlFromNull.startsWith('https://www.google.com/search?q='), 'Test 13: Fallback Google research URL generated safely for null/undefined');

  // Test 14: Learning Page route registration and data loading
  const appCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  assert(appCode.includes("path === '/learning' || path === '/my-learning' || path === '/courses'"), 'Test 14: Direct top-level /learning route registered in App.jsx resolvePath');
  assert(appCode.includes("path === '/student/learning'"), 'Test 14: Student /student/learning route registered in App.jsx resolvePath');

  const myLearningCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/MyLearning.jsx'), 'utf8');
  assert(!myLearningCode.includes('seedDemoEnrollments(studentId'), 'Test 14: Fake demo seeds removed from MyLearning.jsx');
  assert(myLearningCode.includes('fetch(`${apiBase}/learning`'), 'Test 14: MyLearning.jsx fetches authentic enrollments from backend API');

  // Verify learning API endpoint for new student returns empty enrollments
  const cleanLearningRes = await fetchJson(`${API_BASE}/learning`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
  assert(cleanLearningRes.ok, 'Test 14: GET /api/learning endpoint loads cleanly for authenticated student');

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
