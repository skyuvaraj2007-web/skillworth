const assert = require('assert');
const relationalManager = require('../src/db/relationalManager');
const tamilNaduColleges = require('../src/db/tamilNaduEngineeringColleges');

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 SKILLNEXUS AI: ACCOUNT CREATION & AUTHENTICATION E2E TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    return async () => {
      try {
        process.stdout.write(`TEST [${totalTests}] ${name}... `);
        await fn();
        console.log('✅ PASSED');
        passedTests++;
      } catch (err) {
        console.log('❌ FAILED');
        console.error('   Error:', err.message);
        throw err;
      }
    };
  }

  // -------------------------------------------------------------
  // TEST 1: Tamil Nadu College Master Data Coverage
  // -------------------------------------------------------------
  await test('Tamil Nadu College Master covers all 38 districts with valid TNEA codes', async () => {
    const districts = tamilNaduColleges.getAllDistricts();
    assert.strictEqual(districts.length, 38, `Expected 38 districts, found ${districts.length}`);
    
    // Check known districts
    assert(districts.includes('Chennai'), 'Chennai must be present');
    assert(districts.includes('Coimbatore'), 'Coimbatore must be present');
    assert(districts.includes('Madurai'), 'Madurai must be present');
    assert(districts.includes('Chengalpattu'), 'Chengalpattu must be present');
    assert(districts.includes('Kanniyakumari') || districts.includes('Kanyakumari'), 'Kanniyakumari must be present');

    // Search by code
    const gct = tamilNaduColleges.getCollegeByCode('2005');
    assert(gct, 'Should find college with TNEA code 2005 (Government College of Technology)');
    assert.strictEqual(gct.district, 'Coimbatore');
    assert.strictEqual(gct.collegeCode, '2005');

    // Search query
    const results = tamilNaduColleges.searchColleges('Guindy');
    assert(results.length > 0, 'Should find College of Engineering Guindy');
    assert.strictEqual(results[0].collegeCode, '0001');
  })();

  // -------------------------------------------------------------
  // TEST 2: Institution Registration with Master College & Academic Structure
  // -------------------------------------------------------------
  const instTimestamp = Date.now();
  const testInstEmail = `principal_${instTimestamp}@gct.ac.in`;
  const testInstPassword = 'SecureGctPassword!2026';
  let instDemoOtp = '';

  await test('Institution registers with 38-district master college and custom academic structure', async () => {
    const regResult = await relationalManager.registerUser({
      role: 'institution',
      email: testInstEmail,
      name: 'Dr. S. K. Narayanan',
      password: testInstPassword,
      institutionId: 'TN-GCT-2005',
      institutionName: 'Government College of Technology, Coimbatore',
      collegeCode: '2005',
      district: 'Coimbatore',
      university: 'Anna University',
      designation: 'Principal & Placement Director',
      academicStructure: {
        departments: [
          'Computer Science and Engineering',
          'Information Technology',
          'Artificial Intelligence & Data Science'
        ],
        degrees: ['B.E.', 'B.Tech', 'M.E.'],
        specializations: [
          'Artificial Intelligence & Machine Learning',
          'Cloud Computing & DevOps',
          'Cybersecurity & Threat Intelligence'
        ]
      }
    });

    assert.strictEqual(regResult.success, true, 'Institution registration should succeed');
    assert(regResult.demoOtp, 'Registration must return a 6-digit Demo OTP');
    assert.strictEqual(regResult.demoOtp.length, 6, 'OTP must be 6 digits');
    assert.strictEqual(regResult.user.isVerified, false, 'User must be unverified initially');
    assert.strictEqual(regResult.user.status, 'PENDING_VERIFICATION', 'Status must be PENDING_VERIFICATION');

    instDemoOtp = regResult.demoOtp;
  })();

  // -------------------------------------------------------------
  // TEST 3: Login before OTP verification must be rejected
  // -------------------------------------------------------------
  await test('Login is rejected for unverified institution account with 403', async () => {
    const res = await relationalManager.authenticateUser(testInstEmail, testInstPassword, 'institution');
    assert.strictEqual(res.success, false, 'Should have rejected login for unverified institution');
    assert.strictEqual(res.code, 403, 'Should return status 403');
    assert.strictEqual(res.message, 'Please verify your account before logging in.');
  })();

  // -------------------------------------------------------------
  // TEST 4: Institution Demo OTP verification
  // -------------------------------------------------------------
  await test('Institution verifies Demo OTP and account transitions to isVerified: true', async () => {
    // Attempt with invalid OTP first
    const badOtpRes = await relationalManager.verifyDemoOtp(testInstEmail, '000000');
    if (!badOtpRes || !badOtpRes.message) {
      console.log('DEBUG badOtpRes:', badOtpRes);
    }
    assert.strictEqual(badOtpRes.success, false);
    assert(
      badOtpRes.message.toLowerCase().includes('incorrect') ||
      badOtpRes.message.toLowerCase().includes('invalid') ||
      badOtpRes.message.toLowerCase().includes('expired'),
      `Unexpected message: ${badOtpRes.message}`
    );

    // Verify with actual Demo OTP
    const verifyResult = await relationalManager.verifyDemoOtp(testInstEmail, instDemoOtp);
    assert.strictEqual(verifyResult.success, true);
    assert.strictEqual(verifyResult.isVerified, true);
  })();

  // -------------------------------------------------------------
  // TEST 5: Verified Institution Login Succeeds & Appears in Registered Institutions
  // -------------------------------------------------------------
  await test('Verified Institution can log in and is exposed via getRegisteredInstitutions()', async () => {
    const authResult = await relationalManager.authenticateUser(testInstEmail, testInstPassword, 'institution');
    assert.strictEqual(authResult.success, true);
    assert(authResult.token, 'Must return JWT auth token');
    assert.strictEqual(authResult.user.email, testInstEmail);

    // Verify it is in registered institutions list with its academic structure
    const registered = await relationalManager.getRegisteredInstitutions();
    const found = registered.find(inst => inst.email === testInstEmail || inst.id === 'TN-GCT-2005');
    assert(found, 'Newly registered institution must appear in registered institutions list');
    assert(found.academicStructure, 'Academic structure must be preserved');
    assert(found.academicStructure.departments.includes('Artificial Intelligence & Data Science'));
  })();

  // -------------------------------------------------------------
  // TEST 6: Student Registration with UNREGISTERED college is rejected
  // -------------------------------------------------------------
  await test('Student registration with unregistered college is strictly rejected', async () => {
    const fakeCollegeId = `FAKE-COLLEGE-${Date.now()}`;
    const regRes = await relationalManager.registerUser({
      role: 'student',
      email: `student_fail_${Date.now()}@unregistered.edu`,
      name: 'Rejected Student',
      password: 'Password123!',
      collegeId: fakeCollegeId,
      collegeName: 'Unregistered Non-Existent College of Engineering'
    });
    assert.strictEqual(regRes.success, false);
    assert.strictEqual(regRes.code, 400);
    assert(regRes.message.includes('Selected institution is not registered on SkillNexus AI'));
  })();

  // -------------------------------------------------------------
  // TEST 7: Student Registration with Registered College & Demo OTP
  // -------------------------------------------------------------
  const studentTimestamp = Date.now();
  const testStudentEmail = `student_${studentTimestamp}@gct.ac.in`;
  const testStudentPassword = 'StudentPassword!2026';
  let studentDemoOtp = '';

  await test('Student registers mapped to registered institution with academic structure fields', async () => {
    const regResult = await relationalManager.registerUser({
      role: 'student',
      email: testStudentEmail,
      name: 'Karthik Subramanian',
      password: testStudentPassword,
      collegeId: 'TN-GCT-2005',
      collegeName: 'Government College of Technology, Coimbatore',
      university: 'Anna University',
      department: 'Computer Science and Engineering',
      degree: 'B.E.',
      course: 'B.E.',
      specialization: 'Artificial Intelligence & Machine Learning',
      year: 'III Year',
      semester: 'Sem 5',
      batch: '2023 - 2027',
      regNo: `710023104${studentTimestamp.toString().slice(-4)}`,
      cgpa: '9.15',
      creditsCompleted: 104,
      totalCredits: 160,
      activeBacklogs: 0
    });

    assert.strictEqual(regResult.success, true);
    assert(regResult.demoOtp, 'Student registration must generate Demo OTP');
    assert.strictEqual(regResult.user.isVerified, false);
    studentDemoOtp = regResult.demoOtp;
  })();

  // -------------------------------------------------------------
  // TEST 8: Student Login Validations (Unverified, Non-Existent, Wrong Password, Success)
  // -------------------------------------------------------------
  await test('Student authentication rejects unverified account, non-existent email, and wrong password', async () => {
    // 1. Unverified account
    const unverifiedRes = await relationalManager.authenticateUser(testStudentEmail, testStudentPassword, 'student');
    assert.strictEqual(unverifiedRes.success, false);
    assert.strictEqual(unverifiedRes.code, 403);
    assert.strictEqual(unverifiedRes.message, 'Please verify your account before logging in.');

    // 2. Non-existent account
    const nonExistentRes = await relationalManager.authenticateUser('nonexistent.student.999@gct.ac.in', 'password', 'student');
    assert.strictEqual(nonExistentRes.success, false);
    assert.strictEqual(nonExistentRes.code, 404);
    assert.strictEqual(nonExistentRes.message, 'Account not found. Please create an account first.');

    // Verify student OTP
    const otpRes = await relationalManager.verifyDemoOtp(testStudentEmail, studentDemoOtp);
    assert.strictEqual(otpRes.success, true);
    assert.strictEqual(otpRes.isVerified, true);

    // 3. Incorrect password
    const wrongPassRes = await relationalManager.authenticateUser(testStudentEmail, 'WrongPassword123!', 'student');
    assert.strictEqual(wrongPassRes.success, false);
    assert.strictEqual(wrongPassRes.code, 401);
    assert.strictEqual(wrongPassRes.message, 'Incorrect password.');

    // 4. Successful login
    const authSuccess = await relationalManager.authenticateUser(testStudentEmail, testStudentPassword, 'student');
    assert.strictEqual(authSuccess.success, true);
    assert(authSuccess.token);
    assert.strictEqual(authSuccess.user.email, testStudentEmail);
  })();

  // -------------------------------------------------------------
  // TEST 9: Student Roster Isolation (Mapped to GCT, NOT visible to other colleges)
  // -------------------------------------------------------------
  await test('Institution Student Roster enforces strict campus data isolation', async () => {
    // GCT should see this student in its roster
    const gctRoster = await relationalManager.getStudents('TN-GCT-2005');
    const studentInGct = gctRoster.find(s => s.email === testStudentEmail);
    assert(studentInGct, 'Student must appear in GCT institution roster');
    assert.strictEqual(studentInGct.department, 'Computer Science and Engineering');
    assert.strictEqual(studentInGct.degree, 'B.E.');

    // Another institution (e.g. TN010 SRM) should NOT see this student
    const srmRoster = await relationalManager.getStudents('TN010');
    const studentInSrm = srmRoster.find(s => s.email === testStudentEmail);
    assert.strictEqual(studentInSrm, undefined, 'Student must NOT be visible to other institutions');
  })();

  // -------------------------------------------------------------
  // TEST 10: Forgot Password & Password Reset Lifecycle with Demo OTP
  // -------------------------------------------------------------
  await test('Forgot password generates Demo OTP and successfully updates bcrypt password', async () => {
    // 1. Request reset OTP
    const forgotRes = await relationalManager.forgotPasswordWithOtp(testStudentEmail, 'student');
    assert.strictEqual(forgotRes.success, true);
    assert(forgotRes.demoOtp, 'Must return Demo OTP for reset');
    assert.strictEqual(forgotRes.demoOtp.length, 6);

    const resetOtp = forgotRes.demoOtp;

    // 2. Verify reset OTP
    const verifyResetRes = await relationalManager.verifyDemoOtp(testStudentEmail, resetOtp, 'PASSWORD_RESET');
    assert.strictEqual(verifyResetRes.success, true);

    // 3. Reset password to new password
    const newPassword = 'NewlyChangedPassword!2026';
    const resetRes = await relationalManager.resetPasswordWithOtp(testStudentEmail, resetOtp, newPassword, 'student');
    assert.strictEqual(resetRes.success, true);

    // 4. Old password must fail with 401
    const oldAuthRes = await relationalManager.authenticateUser(testStudentEmail, testStudentPassword, 'student');
    assert.strictEqual(oldAuthRes.success, false);
    assert.strictEqual(oldAuthRes.code, 401);
    assert.strictEqual(oldAuthRes.message, 'Incorrect password.');

    // 5. New password must succeed
    const newAuthRes = await relationalManager.authenticateUser(testStudentEmail, newPassword, 'student');
    assert.strictEqual(newAuthRes.success, true);
    assert(newAuthRes.token);
  })();

  // -------------------------------------------------------------
  // TEST 11: Industry Enterprise Registration, OTP Verification, and Login
  // -------------------------------------------------------------
  const industryTimestamp = Date.now();
  const testIndustryEmail = `talent_${industryTimestamp}@zoho.com`;
  const testIndustryPassword = 'ZohoEnterprise!2026';

  await test('Industry enterprise registers, verifies Demo OTP, and logs in successfully', async () => {
    // 1. Register Industry
    const regRes = await relationalManager.registerUser({
      role: 'company',
      email: testIndustryEmail,
      name: 'Ramesh Sundaram',
      password: testIndustryPassword,
      companyName: 'Zoho Corporation',
      companyId: `ZOHO-${industryTimestamp.toString().slice(-4)}`,
      industry: 'Software Products & SaaS',
      designation: 'Head of University Relations'
    });

    assert.strictEqual(regRes.success, true);
    assert(regRes.demoOtp);
    assert.strictEqual(regRes.user.isVerified, false);

    // 2. Verify OTP
    const verifyRes = await relationalManager.verifyDemoOtp(testIndustryEmail, regRes.demoOtp);
    assert.strictEqual(verifyRes.success, true);

    // 3. Login
    const loginRes = await relationalManager.authenticateUser(testIndustryEmail, testIndustryPassword, 'company');
    assert.strictEqual(loginRes.success, true);
    assert(loginRes.token);
    assert.strictEqual(loginRes.user.companyName, 'Zoho Corporation');
  })();

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests} / ${totalTests} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E VERIFICATION TEST SUITE FAILED:', err);
  process.exit(1);
});
