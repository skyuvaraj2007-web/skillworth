/**
 * SKILLNEXUS AI — Institution Data Mapping & Multi-Tenant Isolation Verification
 */
const relationalManager = require('../src/db/relationalManager');

async function runVerification() {
  console.log('--------------------------------------------------');
  console.log('🧪 RUNNING INSTITUTION DATA MAPPING & ISOLATION TESTS');
  console.log('--------------------------------------------------');

  const timestamp = Date.now();

  // 1. Setup Test Data: Institution A & Institution B
  const instAData = {
    role: 'institution',
    email: `alpha_inst_${timestamp}@test.edu`,
    password: 'password123',
    institutionName: 'Alpha Tech University',
    institutionCode: `INST_ALPHA_${timestamp}`
  };

  const instBData = {
    role: 'institution',
    email: `beta_inst_${timestamp}@test.edu`,
    password: 'password123',
    institutionName: 'Beta Institute of Technology',
    institutionCode: `INST_BETA_${timestamp}`
  };

  console.log('\nStep 1: Registering Test Institutions...');
  const resInstA = await relationalManager.registerUser(instAData);
  const resInstB = await relationalManager.registerUser(instBData);

  if (!resInstA.success || !resInstB.success) {
    throw new Error(`Failed to register institutions: ${resInstA.message || resInstB.message}`);
  }

  const instAId = resInstA.user.institutionId || resInstA.user.collegeId;
  const instBId = resInstB.user.institutionId || resInstB.user.collegeId;

  console.log(`✅ Institution A Created: ID=${instAId}, Code=${instAData.institutionCode}`);
  console.log(`✅ Institution B Created: ID=${instBId}, Code=${instBData.institutionCode}`);

  // 2. Register Student A under Institution A & Student B under Institution B
  console.log('\nStep 2: Registering Students with Institution Mappings...');

  const stuAData = {
    role: 'student',
    email: `student_alpha_${timestamp}@test.edu`,
    password: 'password123',
    name: 'Arun Alpha Student',
    collegeId: instAData.institutionCode,
    institutionId: instAId,
    department: 'CSE',
    course: 'B.Tech Computer Science',
    year: 'III Year',
    regNo: `REG-ALPHA-${timestamp}`
  };

  const stuBData = {
    role: 'student',
    email: `student_beta_${timestamp}@test.edu`,
    password: 'password123',
    name: 'Bhavna Beta Student',
    collegeId: instBData.institutionCode,
    institutionId: instBId,
    department: 'AI & DS',
    course: 'B.Tech AI',
    year: 'II Year',
    regNo: `REG-BETA-${timestamp}`
  };

  const resStuA = await relationalManager.registerUser(stuAData);
  const resStuB = await relationalManager.registerUser(stuBData);

  if (!resStuA.success || !resStuB.success) {
    throw new Error(`Failed to register students: ${resStuA.message || resStuB.message}`);
  }

  console.log(`✅ Student A Registered: ID=${resStuA.user.studentId}, institutionId=${resStuA.user.institutionId}`);
  console.log(`✅ Student B Registered: ID=${resStuB.user.studentId}, institutionId=${resStuB.user.institutionId}`);

  // --------------------------------------------------
  // TEST 1: Institution A sees Student A
  // --------------------------------------------------
  console.log('\n🔍 TEST 1: Querying Students for Institution A...');
  const studentsInstA = await relationalManager.getStudents(instAData.institutionCode);
  const foundStuAInInstA = studentsInstA.some(s => s.email === stuAData.email || s.name === stuAData.name);

  if (foundStuAInInstA) {
    console.log('✅ TEST 1 PASSED: Student A correctly appears in Institution A dashboard roster.');
  } else {
    console.error('❌ TEST 1 FAILED: Student A missing from Institution A roster.');
    process.exit(1);
  }

  // --------------------------------------------------
  // TEST 2: Institution A does NOT see Student B
  // --------------------------------------------------
  console.log('\n🔍 TEST 2: Checking Data Isolation for Institution A...');
  const foundStuBInInstA = studentsInstA.some(s => s.email === stuBData.email || s.name === stuBData.name);

  if (!foundStuBInInstA) {
    console.log('✅ TEST 2 PASSED: Student B DOES NOT appear in Institution A roster (Data Isolation Enforced).');
  } else {
    console.error('❌ TEST 2 FAILED: Data leak! Student B appeared in Institution A roster!');
    process.exit(1);
  }

  // --------------------------------------------------
  // TEST 3: Institution B sees Student B and NOT Student A
  // --------------------------------------------------
  console.log('\n🔍 TEST 3: Querying Students for Institution B...');
  const studentsInstB = await relationalManager.getStudents(instBData.institutionCode);
  const foundStuBInInstB = studentsInstB.some(s => s.email === stuBData.email || s.name === stuBData.name);
  const foundStuAInInstB = studentsInstB.some(s => s.email === stuAData.email || s.name === stuAData.name);

  if (foundStuBInInstB && !foundStuAInInstB) {
    console.log('✅ TEST 3 PASSED: Institution B sees ONLY Student B (Student A isolated).');
  } else {
    console.error(`❌ TEST 3 FAILED: Inst B roster check failed (foundB=${foundStuBInInstB}, foundA=${foundStuAInInstB})`);
    process.exit(1);
  }

  // --------------------------------------------------
  // TEST 4: Student Update Reflection
  // --------------------------------------------------
  console.log('\n🔍 TEST 4: Updating Student A details and verifying fresh retrieval...');
  const freshStudentsA = await relationalManager.getStudents(instAData.institutionCode);
  const targetStuA = freshStudentsA.find(s => s.email === stuAData.email);

  if (targetStuA) {
    targetStuA.department = 'Robotics & Automation';
    targetStuA.cgpa = 9.85;
    targetStuA.skills = [{ name: 'Deep Learning', level: 'Advanced', verified: true }];

    // Save updated student in relational data store
    const currentData = relationalManager._read();
    const idx = (currentData.students || []).findIndex(s => s.studentId === targetStuA.studentId || s.email === stuAData.email);
    if (idx !== -1) {
      currentData.students[idx] = { ...currentData.students[idx], ...targetStuA };
      relationalManager._write(currentData);
    }
  }

  const updatedStudentsInstA = await relationalManager.getStudents(instAData.institutionCode);
  const reloadedStuA = updatedStudentsInstA.find(s => s.email === stuAData.email);

  if (reloadedStuA && reloadedStuA.department === 'Robotics & Automation' && Number(reloadedStuA.cgpa) === 9.85) {
    console.log('✅ TEST 4 PASSED: Student updates reflected dynamically on Institution A reload.');
  } else {
    console.error('❌ TEST 4 FAILED: Updated student information not reflected correctly.');
    process.exit(1);
  }

  // --------------------------------------------------
  // TEST 5: Scoped Search Verification
  // --------------------------------------------------
  console.log('\n🔍 TEST 5: Scoped Search Verification...');
  const searchResultsB = studentsInstB.filter(s =>
    (s.name || '').toLowerCase().includes('arun') || (s.email || '').toLowerCase().includes('alpha')
  );

  if (searchResultsB.length === 0) {
    console.log('✅ TEST 5 PASSED: Search for Student A from Institution B returned 0 results.');
  } else {
    console.error('❌ TEST 5 FAILED: Cross-institution search leak detected!');
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('🎉 ALL 5 ACCEPTANCE CRITERIA TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runVerification().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
