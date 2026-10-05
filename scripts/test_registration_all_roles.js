/**
 * Comprehensive Automated Test Script for SkillWorth Account Creation System
 * Tests all three roles: Learner, Institution (with Assessor application), and Industry.
 * Tests Validation, Duplicate Handling, Database Persistence, and Login.
 */

const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('  SKILLWORTH ACCOUNT CREATION SYSTEM - COMPLETE VERIFICATION  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  // ────────────────────────────────────────────────────────────────
  // TEST 1: LEARNER / STUDENT REGISTRATION
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Learner / Student Account Creation ---');
  const learnerPayload = {
    role: 'learner',
    fullName: 'Aarav Sharma',
    email: `aarav.sharma.${timestamp}@example.com`,
    mobile: '+91 98765 43210',
    dob: '2003-05-14',
    collegeName: 'PSG College of Technology',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
    specialization: 'Artificial Intelligence',
    currentYear: '3rd Year',
    studentId: `PSG-CS-${timestamp}`,
    graduationYear: '2026',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    primarySkill: 'Full Stack Web Development',
    skillLevel: 'Intermediate',
    areasOfInterest: ['Cloud Computing', 'Machine Learning'],
    preferredLanguage: 'ta',
    password: 'SecureLearner@2026'
  };

  const learnerRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, learnerPayload);

  assert(learnerRes.status === 201 || learnerRes.status === 200, `Learner registration status 200/201 (Got ${learnerRes.status})`);
  assert(learnerRes.body?.success === true, 'Response returns success: true');
  assert(learnerRes.body?.user?.role === 'student', 'User role assigned as "student"');
  assert(learnerRes.body?.token != null, 'Authentication token returned on registration');
  assert(learnerRes.body?.user?.primarySkill === 'Full Stack Web Development', 'Primary skill saved in returned user');
  assert(learnerRes.body?.user?.preferredLanguage === 'ta', 'Preferred language "ta" saved');

  // Login with newly created learner
  console.log('Logging in with newly created Learner credentials...');
  const learnerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: learnerPayload.email,
    password: learnerPayload.password,
    role: 'student'
  });

  assert(learnerLogin.status === 200, `Learner login succeeded with 200 (Got ${learnerLogin.status})`);
  assert(learnerLogin.body?.user?.name === 'Aarav Sharma', `Learner actual name retrieved: ${learnerLogin.body?.user?.name}`);
  assert(learnerLogin.body?.user?.collegeName === 'PSG College of Technology', `Learner actual college retrieved: ${learnerLogin.body?.user?.collegeName}`);
  assert(learnerLogin.body?.user?.department === 'Computer Science and Engineering', `Learner actual department retrieved: ${learnerLogin.body?.user?.department}`);
  assert(learnerLogin.body?.user?.primarySkill === 'Full Stack Web Development', `Learner primary skill retrieved: ${learnerLogin.body?.user?.primarySkill}`);

  // ────────────────────────────────────────────────────────────────
  // TEST 2: INSTITUTION REGISTRATION (WITH ASSESSOR OPTION)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Institution & Assessor Account Creation ---');
  const institutionPayload = {
    role: 'institution',
    institutionName: `National Institute of Tech ${timestamp}`,
    institutionType: 'University / Institute',
    officialEmail: `admin.${timestamp}@nitt.edu`,
    officialPhone: '+91 431 2500000',
    website: 'https://www.nitt.edu',
    recognitionId: `NIRF-ENG-${timestamp}`,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    address: 'Tanjore Main Road, National Highway 67, Tiruchirappalli',
    repFullName: 'Dr. K. Ramanathan',
    repDesignation: 'Dean of Academic Affairs',
    repEmail: `dean.academic.${timestamp}@nitt.edu`,
    repPhone: '+91 94433 12345',
    preferredLanguage: 'en',
    password: 'InstitutionSecure@2026',
    // Assessor Accreditation
    applyAsAssessor: true,
    assessorFullName: 'Dr. K. Ramanathan',
    assessorDesignation: 'Professor & Lead Assessor',
    assessorDepartment: 'Computer Science',
    assessorQualification: 'Ph.D. Computer Science',
    assessorSpecialization: 'Distributed Systems & Cloud',
    assessorExperience: 14,
    assessorSkills: ['Distributed Systems', 'Cloud Computing', 'Python'],
    assessorCertifications: 'ISO 17024 Certified Assessor'
  };

  const instRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, institutionPayload);

  assert(instRes.status === 201 || instRes.status === 200, `Institution registration status 200/201 (Got ${instRes.status})`);
  assert(instRes.body?.success === true, 'Institution registration success: true');
  assert(instRes.body?.user?.institutionVerificationStatus === 'PENDING_VERIFICATION', 'Institution initial status is PENDING_VERIFICATION');
  assert(instRes.body?.user?.assessorStatus === 'PENDING', 'Assessor accreditation initial status is PENDING');

  // Login with newly created institution
  console.log('Logging in with newly created Institution credentials...');
  const instLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: institutionPayload.officialEmail,
    password: institutionPayload.password,
    role: 'institution'
  });

  assert(instLogin.status === 200, `Institution login succeeded with 200 (Got ${instLogin.status})`);
  assert(instLogin.body?.user?.institutionVerificationStatus === 'PENDING_VERIFICATION', 'Institution status remains PENDING_VERIFICATION in session');
  assert(instLogin.body?.user?.assessorStatus === 'PENDING', 'Assessor status remains PENDING in session');

  // ────────────────────────────────────────────────────────────────
  // TEST 3: INDUSTRY / COMPANY REGISTRATION
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Industry / Company Account Creation ---');
  const industryPayload = {
    role: 'industry',
    companyName: `Apex Data Systems ${timestamp}`,
    industrySector: 'Information Technology & Software',
    website: 'https://apexdatasystems.com',
    officialEmail: `talent.${timestamp}@apexdatasystems.com`,
    officialPhone: '+91 80 4123 4567',
    state: 'Karnataka',
    district: 'Bengaluru',
    officeAddress: 'Tech Park Phase 2, Outer Ring Road, Bengaluru',
    repFullName: 'Priya Sundaram',
    repDesignation: 'Director of Technical Recruiting',
    repEmail: `priya.${timestamp}@apexdatasystems.com`,
    repPhone: '+91 99887 76655',
    preferredLanguage: 'hi',
    password: 'CompanySecure@2026',
    recruitmentSkills: ['React', 'Node.js', 'Docker', 'PostgreSQL'],
    recruitmentLevels: ['Intermediate', 'Advanced'],
    recruitmentJobRoles: ['Full Stack Engineer', 'Cloud DevOps Engineer'],
    internshipInterests: true
  };

  const indRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, industryPayload);

  assert(indRes.status === 201 || indRes.status === 200, `Industry registration status 200/201 (Got ${indRes.status})`);
  assert(indRes.body?.success === true, 'Industry registration success: true');
  assert(indRes.body?.user?.companyName === industryPayload.companyName, `Company name saved: ${indRes.body?.user?.companyName}`);
  assert(indRes.body?.user?.verificationStatus === 'PENDING_VERIFICATION', 'Company verification status is PENDING_VERIFICATION');

  // Login with newly created company
  console.log('Logging in with newly created Industry credentials...');
  const indLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: industryPayload.officialEmail,
    password: industryPayload.password,
    role: 'company'
  });

  assert(indLogin.status === 200, `Industry login succeeded with 200 (Got ${indLogin.status})`);
  assert(indLogin.body?.user?.preferredLanguage === 'hi', 'Preferred language "hi" retained');
  assert(indLogin.body?.user?.companyName === industryPayload.companyName, 'Company actual name retained in session');

  // ────────────────────────────────────────────────────────────────
  // TEST 4: VALIDATION & DUPLICATE EMAIL HANDLING
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Validation & Error Cases ---');
  
  // Duplicate email
  const duplicateRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, learnerPayload);

  assert(duplicateRes.status === 409, `Duplicate email registration rejected with 409 (Got ${duplicateRes.status})`);
  assert(duplicateRes.body?.message?.toLowerCase().includes('already exists') || duplicateRes.body?.error?.toLowerCase().includes('already exists'), 'Duplicate email error message clearly informs user');

  // Weak password
  const weakPasswordRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    role: 'learner',
    fullName: 'Test Weak',
    email: `weak.${timestamp}@example.com`,
    password: '123'
  });

  assert(weakPasswordRes.status === 400, `Weak password rejected with 400 Bad Request (Got ${weakPasswordRes.status})`);

  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
