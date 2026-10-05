const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const relationalManager = require('../src/db/relationalManager');
const assert = require('assert');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING AUTH, DATA MAPPING & PROFILE ISOLATION');
  console.log('================================================================');

  const suffix = Date.now();
  const instAEmail = `contact_${suffix}@apextech.edu`;
  const stuAEmail = `kavitha_${suffix}@apextech.edu`;
  const instBEmail = `admin_${suffix}@zenith.edu`;
  const stuBEmail = `vignesh_${suffix}@zenith.edu`;
  const compEmail = `hr_${suffix}@quantumrobotics.ai`;

  // TEST 1: Register Institution A
  console.log('\n👉 1. Registering Institution A (Apex Institute of Technology)...');
  const instA = await relationalManager.registerUser({
    role: 'institution',
    name: 'Apex Institute of Technology',
    institutionName: 'Apex Institute of Technology',
    institutionCode: `APEX-${suffix.toString().slice(-4)}`,
    email: instAEmail,
    password: 'Password123!',
    city: 'Coimbatore',
    state: 'Tamil Nadu'
  });
  assert(instA && instA.success, `Institution A registration failed: ${instA?.message}`);
  const instAId = instA.user.institutionId;
  console.log(`   ✓ Institution A created with ID: ${instAId}`);

  // TEST 2: Register Student A linked to Institution A
  console.log('\n👉 2. Registering Student A (Kavitha S) linked to Institution A...');
  const stuA = await relationalManager.registerUser({
    role: 'student',
    name: 'Kavitha S',
    email: stuAEmail,
    password: 'Password123!',
    institutionId: instAId,
    college: 'Apex Institute of Technology',
    collegeName: 'Apex Institute of Technology',
    department: 'Computer Science',
    degree: 'B.E.',
    year: 'III Year',
    regNo: `APEX${suffix.toString().slice(-4)}`
  });
  assert(stuA && stuA.success, `Student A registration failed: ${stuA?.message}`);
  console.log(`   ✓ Student A created with ID: ${stuA.user.studentId}, mapped institution: ${stuA.user.institutionId}`);

  // TEST 3: Verify Student Profile mapping
  console.log('\n👉 3. Checking Student Profile for Student A...');
  const profileA = await relationalManager.getStudentById(stuA.user.studentId);
  assert(profileA, 'Profile A not found');
  assert.strictEqual(profileA.name, 'Kavitha S', 'Student name mismatch');
  assert.strictEqual(profileA.institutionName, 'Apex Institute of Technology', 'Student college should be Apex Institute');
  assert.notStrictEqual(profileA.institutionName, 'SRM Institute of Science and Technology', 'SRM MUST NOT appear');
  console.log(`   ✓ Student A college correctly mapped to: "${profileA.institutionName}"`);

  // TEST 4: Register Institution B & Student B
  console.log('\n👉 4. Registering Institution B (Zenith University) & Student B (Vignesh R)...');
  const instB = await relationalManager.registerUser({
    role: 'institution',
    name: 'Zenith University',
    institutionName: 'Zenith University',
    institutionCode: `ZENITH-${suffix.toString().slice(-4)}`,
    email: instBEmail,
    password: 'Password123!',
    city: 'Madurai'
  });
  assert(instB && instB.success, `Institution B registration failed: ${instB?.message}`);
  const instBId = instB.user.institutionId;

  const stuB = await relationalManager.registerUser({
    role: 'student',
    name: 'Vignesh R',
    email: stuBEmail,
    password: 'Password123!',
    institutionId: instBId,
    college: 'Zenith University',
    collegeName: 'Zenith University',
    department: 'Information Technology',
    regNo: `ZEN${suffix.toString().slice(-4)}`
  });
  assert(stuB && stuB.success, `Student B registration failed: ${stuB?.message}`);

  const profileB = await relationalManager.getStudentById(stuB.user.studentId);
  assert.strictEqual(profileB.institutionName, 'Zenith University', 'Student B must see Zenith University');
  assert.notStrictEqual(profileB.institutionName, profileA.institutionName, 'Data must NOT leak between students');
  console.log(`   ✓ Student B college correctly mapped to: "${profileB.institutionName}" (No cross-contamination)`);

  // TEST 5: Institution Profile Data Isolation
  console.log('\n👉 5. Checking Institution Profile Isolation...');
  const instProfile = await relationalManager.getInstitutionProfile(instAId);
  assert(instProfile, 'Institution profile not found');
  assert.strictEqual(instProfile.institutionName, 'Apex Institute of Technology');
  assert.strictEqual(instProfile.studentCount, 1, 'Should have exactly 1 student enrolled');
  assert(instProfile.cgpa === undefined, 'Institution profile must NOT show student CGPA');
  console.log(`   ✓ Institution profile verified: name="${instProfile.institutionName}", studentCount=${instProfile.studentCount}`);

  // TEST 6: Company Profile Data Isolation
  console.log('\n👉 6. Registering Industry (Quantum Robotics) & Verifying Company Profile...');
  const comp = await relationalManager.registerUser({
    role: 'company',
    name: 'Quantum Robotics Inc',
    companyName: 'Quantum Robotics Inc',
    email: compEmail,
    password: 'Password123!',
    industry: 'Robotics & Automation',
    city: 'Bangalore'
  });
  assert(comp && comp.success, `Company registration failed: ${comp?.message}`);
  const compId = comp.user.id || comp.user.companyId;
  const compProfile = await relationalManager.getCompanyProfile(compId);
  assert(compProfile, 'Company profile not found');
  assert.strictEqual(compProfile.companyName, 'Quantum Robotics Inc');
  assert(compProfile.cgpa === undefined, 'Company profile must NOT show student CGPA');
  console.log(`   ✓ Company profile verified: name="${compProfile.companyName}", industry="${compProfile.industry}"`);

  // TEST 7: Forgot Password & Reset Password Flow
  console.log('\n👉 7. Testing Forgot Password with OTP & Password Update...');
  const otpRes = await relationalManager.forgotPasswordWithOtp(stuAEmail);
  assert(otpRes && otpRes.success, 'Forgot password request failed');
  const otpCode = otpRes.demoOtp || otpRes.otp;
  assert(otpCode, 'OTP not generated');
  console.log(`   ✓ OTP generated for password reset: ${otpCode}`);

  // Verify Reset OTP
  const verifyRes = await relationalManager.verifyDemoOtp(stuAEmail, otpCode, 'PASSWORD_RESET');
  assert(verifyRes && verifyRes.success, 'OTP verification failed');
  console.log('   ✓ OTP successfully verified for reset token');

  // Reset Password
  const resetRes = await relationalManager.resetPasswordWithOtp(stuAEmail, otpCode, 'BrandNewPassword2026!');
  assert(resetRes && resetRes.success, 'Password update failed');
  console.log('   ✓ Password updated with bcrypt hashing');

  // Verify Login with Old Password fails
  const failedLogin = await relationalManager.authenticateUser(stuAEmail, 'Password123!');
  assert(!failedLogin.success, 'Old password should no longer work');
  console.log('   ✓ Old password successfully rejected');

  // Verify Login with New Password succeeds
  const successLogin = await relationalManager.authenticateUser(stuAEmail, 'BrandNewPassword2026!');
  assert(successLogin.success, 'Login with new password failed');
  assert(successLogin.user, 'User object not returned upon login');
  console.log(`   ✓ Login with new password succeeded! Logged in as: ${successLogin.user.name}`);

  console.log('\n================================================================');
  console.log('🎉 ALL 7 AUTOMATED INTEGRATION TESTS PASSED WITH ZERO ERRORS!');
  console.log('================================================================');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
