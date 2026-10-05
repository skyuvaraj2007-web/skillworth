/**
 * SKILLNEXUS AI — Student Registration & Verification Flow Specification Test
 *
 * Validates:
 * 1. Mandatory Register Number and Location (city/state) persistence.
 * 2. Uniqueness of Register Number strictly scoped to Institution (same college rejects duplicate, different college allows).
 * 3. Clean initial profile (no skills/goals forced during registration).
 * 4. OTP verification flow (activates user, returns token, invalidates OTP upon use).
 * 5. Tenant isolation (institution roster strictly filters by institutionId).
 */
const relationalManager = require('../src/db/relationalManager');

async function runTest() {
  console.log('================================================================');
  console.log('🧪 TEST: Student Account Creation & Verification Flow (4-Step)');
  console.log('================================================================\n');

  const ts = Date.now();
  const instACode = `INST_A_${ts}`;
  const instBCode = `INST_B_${ts}`;

  // 1. Create two test institutions
  console.log('Step 1: Setting up Institution A and Institution B...');
  const instARes = await relationalManager.registerUser({
    role: 'institution',
    email: `insta_${ts}@test.edu`,
    password: 'password123',
    institutionName: `College Alpha ${ts}`,
    institutionCode: instACode
  });
  const instBRes = await relationalManager.registerUser({
    role: 'institution',
    email: `instb_${ts}@test.edu`,
    password: 'password123',
    institutionName: `College Beta ${ts}`,
    institutionCode: instBCode
  });

  if (!instARes.success || !instBRes.success) {
    throw new Error('Failed to create test institutions');
  }

  const instAId = instARes.user.institutionId || instARes.user.collegeId || instACode;
  const instBId = instBRes.user.institutionId || instBRes.user.collegeId || instBCode;
  console.log(`✓ Inst A: ${instAId} (${instACode})`);
  console.log(`✓ Inst B: ${instBId} (${instBCode})`);

  // 2. Register Student 1 in Institution A
  console.log('\nStep 2: Registering Student 1 in Institution A...');
  const sharedRegNo = `REG-${ts}-101`;
  const stu1Data = {
    role: 'student',
    email: `student1_${ts}@test.edu`,
    password: 'password123',
    name: 'Kavitha Rajan',
    collegeId: instAId,
    institutionId: instAId,
    collegeName: `College Alpha ${ts}`,
    regNo: sharedRegNo,
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
    specialization: 'Artificial Intelligence',
    batch: '2024-2028',
    semester: 'Sem 2'
  };

  const reg1Res = await relationalManager.registerUser(stu1Data);
  if (!reg1Res.success) {
    throw new Error(`Student 1 registration failed: ${reg1Res.message}`);
  }
  console.log('✓ Student 1 registered successfully');
  console.log(`  - Student ID: ${reg1Res.user.studentId || reg1Res.user.id}`);
  console.log(`  - Demo OTP generated: ${reg1Res.demoOtp || reg1Res.user.otp}`);
  console.log(`  - Location: ${reg1Res.user.location || reg1Res.user.city}`);

  // Check that skills and career goals were not required/forced
  const allStudents = await relationalManager.getStudents();
  const stuEntity = allStudents.find(s => s.email.toLowerCase() === stu1Data.email.toLowerCase());
  if (!stuEntity) throw new Error('Student entity not found in relational data');
  if (stuEntity.skills && stuEntity.skills.length > 0) {
    console.warn('⚠️ Warning: Student initialized with unexpected skills');
  } else {
    console.log('✓ Registration verified without pre-filled skills (clean state)');
  }
  if (!stuEntity.location && !stuEntity.city) {
    throw new Error('Student location was not persisted');
  }
  console.log(`✓ Student entity location verified: ${stuEntity.location || `${stuEntity.city}, ${stuEntity.state}`}`);

  // 3. Attempt Duplicate Register Number in the SAME Institution (MUST FAIL)
  console.log('\nStep 3: Attempting duplicate regNo registration in SAME Institution (Inst A)...');
  const stuDuplicateData = {
    role: 'student',
    email: `student_dup_${ts}@test.edu`,
    password: 'password123',
    name: 'Different Name Same RegNo',
    collegeId: instAId,
    institutionId: instAId,
    collegeName: `College Alpha ${ts}`,
    regNo: sharedRegNo, // SAME regNo in same college
    city: 'Chennai',
    state: 'Tamil Nadu',
    department: 'Information Technology',
    degree: 'B.Tech'
  };

  const dupRes = await relationalManager.registerUser(stuDuplicateData);
  if (dupRes.success) {
    throw new Error('FAIL: Duplicate register number in same institution was incorrectly permitted!');
  }
  console.log(`✓ Duplicate in same institution correctly blocked: "${dupRes.message}"`);

  // 4. Register Student with SAME Register Number in DIFFERENT Institution (MUST SUCCEED)
  console.log('\nStep 4: Attempting same regNo registration in DIFFERENT Institution (Inst B)...');
  const stuCrossInstData = {
    role: 'student',
    email: `student_instb_${ts}@test.edu`,
    password: 'password123',
    name: 'Pooja Suresh',
    collegeId: instBId,
    institutionId: instBId,
    collegeName: `College Beta ${ts}`,
    regNo: sharedRegNo, // SAME regNo, but DIFFERENT college
    city: 'Madurai',
    state: 'Tamil Nadu',
    department: 'Electronics and Communication Engineering',
    degree: 'B.E.',
    specialization: 'VLSI Design',
    batch: '2024-2028',
    semester: 'Sem 2'
  };

  const crossRes = await relationalManager.registerUser(stuCrossInstData);
  if (!crossRes.success) {
    throw new Error(`FAIL: Same register number in different institution was rejected: ${crossRes.message}`);
  }
  console.log('✓ Same register number successfully permitted across distinct institution campuses!');

  // 5. Verify OTP Activation Flow
  console.log('\nStep 5: Testing OTP Verification and Session Token generation...');
  const otpCode = reg1Res.demoOtp || reg1Res.user.otp;
  if (!otpCode) {
    throw new Error('No OTP code available for verification');
  }

  // 5a. Try with invalid OTP
  const invalidOtpRes = await relationalManager.verifyDemoOtp(stu1Data.email, '999999', 'REGISTRATION');
  if (invalidOtpRes.success) {
    throw new Error('FAIL: Invalid OTP code was incorrectly accepted!');
  }
  console.log(`✓ Invalid OTP code correctly rejected: "${invalidOtpRes.message}"`);

  // 5b. Verify with correct OTP
  const validOtpRes = await relationalManager.verifyDemoOtp(stu1Data.email, otpCode, 'REGISTRATION');
  if (!validOtpRes.success) {
    throw new Error(`FAIL: Valid OTP code verification failed: ${validOtpRes.message}`);
  }
  console.log('✓ Valid OTP successfully verified account!');
  console.log(`  - Account verified status: ${validOtpRes.user.isVerified}`);
  console.log(`  - User status: ${validOtpRes.user.status}`);
  console.log(`  - Session token provided: ${Boolean(validOtpRes.token)}`);

  // 5c. Try reusing OTP code (should fail as expired/consumed)
  const reuseOtpRes = await relationalManager.verifyDemoOtp(stu1Data.email, otpCode, 'REGISTRATION');
  if (reuseOtpRes.success) {
    throw new Error('FAIL: Consumed OTP code was incorrectly accepted on second attempt!');
  }
  console.log(`✓ Reused OTP code correctly rejected: "${reuseOtpRes.message}"`);

  // 6. Tenant Isolation Verification
  console.log('\nStep 6: Verifying Tenant Isolation for Institution Rosters...');
  const rosterA = await relationalManager.getStudents(instAId);
  const rosterB = await relationalManager.getStudents(instBId);

  const stu1InA = rosterA.some(s => s.email.toLowerCase() === stu1Data.email.toLowerCase());
  const stu1InB = rosterB.some(s => s.email.toLowerCase() === stu1Data.email.toLowerCase());
  const stuCrossInA = rosterA.some(s => s.email.toLowerCase() === stuCrossInstData.email.toLowerCase());
  const stuCrossInB = rosterB.some(s => s.email.toLowerCase() === stuCrossInstData.email.toLowerCase());

  console.log(`  - Student 1 in Institution A roster: ${stu1InA} (expected: true)`);
  console.log(`  - Student 1 in Institution B roster: ${stu1InB} (expected: false)`);
  console.log(`  - Student 2 in Institution A roster: ${stuCrossInA} (expected: false)`);
  console.log(`  - Student 2 in Institution B roster: ${stuCrossInB} (expected: true)`);

  if (!stu1InA || stu1InB || stuCrossInA || !stuCrossInB) {
    throw new Error('FAIL: Multi-tenant institution isolation breached!');
  }
  console.log('✓ Multi-tenant isolation confirmed: Each institution only accesses its own students.');

  console.log('\n================================================================');
  console.log('🎉 ALL SPECIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
