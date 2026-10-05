/**
 * COMPREHENSIVE SKILLWORTH STANDALONE TEST SUITE
 * Validates the complete SkillWorth end-to-end RPL lifecycle:
 * 1. Role-based Account Creation (Learner, Institution, Industry)
 * 2. Video & Evidence Uploads & Persistence
 * 3. Assessment Attempt & Scoring
 * 4. Assessor Final Verification Decision
 * 5. Credential Generation (SW-XXXXXX)
 * 6. Industry Credential Verification
 * 7. Multi-language and Independence Verification
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('  SKILLWORTH RPL PLATFORM — COMPREHENSIVE STANDALONE VERIFICATION');
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

  // 1. LEARNER REGISTRATION
  console.log('\n--- 1. Testing Learner Account Creation ---');
  const learnerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    role: 'LEARNER',
    fullName: 'Kavitha Ramasamy',
    email: `kavitha.${timestamp}@example.com`,
    mobile: '+91 98451 23456',
    dob: '2004-02-15',
    collegeName: 'Coimbatore Institute of Technology',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
    specialization: 'Artificial Intelligence',
    currentYear: '3rd Year',
    studentId: `CIT-CS-${timestamp}`,
    graduationYear: '2026',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    primarySkill: 'Python Software Engineering',
    skillLevel: 'Intermediate',
    preferredLanguage: 'ta',
    password: 'SecurePass@2026'
  });

  assert(learnerRes.status === 201, `Learner registration returned 201 Created (Got ${learnerRes.status})`);
  assert(learnerRes.body?.success === true, 'Learner registration response success: true');
  assert(learnerRes.body?.token != null, 'Authentication token returned');
  const learnerId = learnerRes.body?.user?.id || learnerRes.body?.user?.learnerId;
  const learnerToken = learnerRes.body?.token;

  // Learner Login
  const learnerLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: `kavitha.${timestamp}@example.com`,
    password: 'SecurePass@2026',
    role: 'LEARNER'
  });
  assert(learnerLogin.status === 200, 'Learner login succeeded with 200');
  assert(learnerLogin.body?.user?.fullName === 'Kavitha Ramasamy', `Learner actual name retrieved: ${learnerLogin.body?.user?.fullName}`);
  assert(learnerLogin.body?.user?.preferredLanguage === 'ta', 'Learner preferred language "ta" preserved');

  // 2. INSTITUTION & ASSESSOR REGISTRATION
  console.log('\n--- 2. Testing Institution & Assessor Registration ---');
  const instRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    role: 'INSTITUTION',
    institutionName: `National Institute of Tech ${timestamp}`,
    institutionType: 'Autonomous Institute',
    officialEmail: `admin.${timestamp}@nitt.edu`,
    officialPhone: '+91 431 2500000',
    website: 'https://www.nitt.edu',
    recognitionId: `REC-${timestamp}`,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    address: 'Tanjore Main Road, NH 67, Tiruchirappalli',
    repFullName: 'Dr. K. Ramanathan',
    repDesignation: 'Dean of Academic Affairs',
    preferredLanguage: 'en',
    password: 'InstitutionPass@2026',
    // Assessor Application
    applyAsAssessor: true,
    assessorFullName: 'Dr. K. Ramanathan',
    assessorDesignation: 'Professor & Lead Assessor',
    assessorDepartment: 'Computer Science',
    assessorQualification: 'Ph.D. Computer Science',
    assessorSpecialization: 'Distributed Computing',
    assessorExperience: 14,
    assessorSkills: ['Python Software Engineering', 'Cloud Architecture'],
    assessorCertifications: 'ISO 17024 Certified Assessor'
  });

  assert(instRes.status === 201, `Institution registration returned 201 (Got ${instRes.status})`);
  assert(instRes.body?.user?.verificationStatus === 'PENDING_VERIFICATION', 'Institution verification status is PENDING_VERIFICATION');
  assert(instRes.body?.user?.assessorStatus === 'PENDING', 'Assessor accreditation status is PENDING');

  // 3. INDUSTRY REGISTRATION
  console.log('\n--- 3. Testing Industry / Company Registration ---');
  const indRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    role: 'INDUSTRY',
    companyName: `Apex Software Labs ${timestamp}`,
    industrySector: 'Information Technology',
    website: 'https://apexlabs.io',
    officialEmail: `talent.${timestamp}@apexlabs.io`,
    officialPhone: '+91 80 4123 4567',
    state: 'Karnataka',
    district: 'Bengaluru',
    officeAddress: 'Outer Ring Road, Bengaluru',
    repFullName: 'Priya Sundaram',
    repDesignation: 'Director of Talent Acquisition',
    preferredLanguage: 'hi',
    password: 'CompanyPass@2026',
    recruitmentSkills: ['Python', 'Docker', 'React']
  });

  assert(indRes.status === 201, `Industry registration returned 201 (Got ${indRes.status})`);
  assert(indRes.body?.user?.verificationStatus === 'PENDING_VERIFICATION', 'Company status is PENDING_VERIFICATION');

  // 4. EVIDENCE SUBMISSION (With Video Demonstration)
  console.log('\n--- 4. Testing Evidence & Video Demonstration Submission ---');
  // Write a dummy video demonstration file
  const testVideoPath = path.resolve(__dirname, '../uploads/test_demo_video.mp4');
  fs.writeFileSync(testVideoPath, Buffer.from('FAKE_VIDEO_STREAM_DATA_ISO17024_DEMO'));

  const evidenceRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/evidence/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    learnerId,
    learnerName: 'Kavitha Ramasamy',
    skillId: 'skill_python_dev',
    skillName: 'Python Software Engineering',
    competency: 'PY-API-02: API Development & Database Integration',
    evidenceType: 'Video Demonstration',
    title: 'High-Concurrency Python Async API Live Demonstration',
    description: 'Walkthrough video demonstrating non-blocking asynchronous endpoints, database connection pooling, and error handling.',
    fileUrl: '/uploads/test_demo_video.mp4',
    fileName: 'test_demo_video.mp4',
    isVideo: true
  });

  assert(evidenceRes.status === 201, `Evidence submission returned 201 (Got ${evidenceRes.status})`);
  assert(evidenceRes.body?.evidence?.isVideo === true, 'Evidence flagged as video demonstration');
  assert(evidenceRes.body?.evidence?.aiAnalysis?.confidenceScore >= 80, `AI preliminary analysis score generated: ${evidenceRes.body?.evidence?.aiAnalysis?.confidenceScore}%`);
  const evidenceId = evidenceRes.body?.evidence?.id;

  // 5. ASSESSMENT ATTEMPT & SCORING
  console.log('\n--- 5. Testing Assessment Attempt Protocol ---');
  const asmRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/assessments/submit-attempt',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    assessmentId: 'asm_py_intermediate',
    learnerId,
    learnerName: 'Kavitha Ramasamy',
    skillName: 'Python Software Engineering',
    answers: [
      { questionId: 'q1', answer: 'Generators using the yield statement' },
      { questionId: 'q2', answer: 'threading.Lock() using a context manager with statement' },
      { questionId: 'q3', answer: 'Deep copy creates fully independent recursive copies; shallow copy references nested objects.' },
      { questionId: 'q4', answer: 'Implemented sliding window rate limiter in video demonstration.' }
    ]
  });

  assert(asmRes.status === 201, `Assessment attempt returned 201 (Got ${asmRes.status})`);
  assert(asmRes.body?.result?.passed === true, `Assessment passed: ${asmRes.body?.result?.passed} (${asmRes.body?.result?.percentage}%)`);
  assert(asmRes.body?.credential?.credentialId != null, `SkillWorth credential generated upon passing: ${asmRes.body?.credential?.credentialId}`);
  const issuedCredentialId = asmRes.body?.credential?.credentialId;

  // 6. ASSESSOR FINAL VERIFICATION
  console.log('\n--- 6. Testing Authorized Assessor Final Evaluation ---');
  const evalRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/assessor/evaluate-evidence',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    evidenceId,
    decision: 'APPROVE',
    feedback: 'Excellent demonstration of Python asynchronous I/O and ISO 17024 benchmarks.',
    assessorName: 'Dr. K. Ramanathan'
  });

  assert(evalRes.status === 200, 'Assessor evaluation approved with 200');
  assert(evalRes.body?.evidence?.verificationStatus === 'VERIFIED', 'Evidence status updated to VERIFIED');

  // 7. INDUSTRY CREDENTIAL VERIFICATION
  console.log('\n--- 7. Testing Industry Credential Verification ---');
  const verifyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/credentials/verify/${issuedCredentialId}`,
    method: 'GET'
  });

  assert(verifyRes.status === 200, `Credential verification returned 200 (Got ${verifyRes.status})`);
  assert(verifyRes.body?.valid === true, 'Credential validated as true');
  assert(verifyRes.body?.credential?.status === 'VALID', 'Credential status is VALID');
  assert(verifyRes.body?.credential?.skill === 'Python Software Engineering', `Credential verified skill: ${verifyRes.body?.credential?.skill}`);

  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
