const assert = require('assert');
const http = require('http');

const API_BASE = 'http://localhost:5000';

function post(endpoint, body, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(endpoint, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(endpoint, body, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SKILLNEXUS AI — VERIFY ACCOUNT CREATION & MAPPING TEST SUITE');
  console.log('================================================================\n');

  const stamp = Date.now();
  const collegeIdA = `TEST_INST_A_${stamp}`;
  const collegeIdB = `TEST_INST_B_${stamp}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Register Institution A & Institution B
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('👉 TEST 1: Registering Institution A and Institution B...');
  const instARes = await post('/api/auth/register', {
    email: `inst.a.${stamp}@campus.edu`,
    password: 'password123',
    role: 'institution',
    name: 'Dr. A. Ramanathan',
    collegeName: 'Alpha Engineering College',
    collegeId: collegeIdA,
    institutionId: collegeIdA,
    aisheCode: `AISHE-A-${stamp}`,
    affiliatedUniversity: 'Anna University',
    institutionType: 'Autonomous College',
    district: 'Chennai',
    state: 'Tamil Nadu',
    departments: ['CSE', 'ECE', 'AI & DS'],
    programs: ['B.Tech', 'M.Tech']
  });
  assert.strictEqual(instARes.status, 201, 'Institution A registration must return 201');
  assert.strictEqual(instARes.data.success, true, 'Institution A registration success must be true');
  const tokenInstA = instARes.data.token;
  console.log('   ✅ Institution A registered with collegeId:', collegeIdA);

  const instBRes = await post('/api/auth/register', {
    email: `inst.b.${stamp}@campus.edu`,
    password: 'password123',
    role: 'institution',
    name: 'Dr. B. Sundaram',
    collegeName: 'Beta Institute of Technology',
    collegeId: collegeIdB,
    institutionId: collegeIdB,
    aisheCode: `AISHE-B-${stamp}`,
    affiliatedUniversity: 'Anna University',
    institutionType: 'University',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    departments: ['CSE', 'Mechanical'],
    programs: ['B.Tech']
  });
  assert.strictEqual(instBRes.status, 201, 'Institution B registration must return 201');
  const tokenInstB = instBRes.data.token;
  console.log('   ✅ Institution B registered with collegeId:', collegeIdB);

  // Check initial empty rosters for both new institutions (ZERO dummy data, strict isolation)
  const instARosterInitial = await get('/api/academic/students', tokenInstA);
  assert.strictEqual(instARosterInitial.status, 200);
  assert.strictEqual(instARosterInitial.data.data.length, 0, 'New Institution A roster must start empty (0 students)');
  console.log('   ✅ Institution A initially has 0 students (no mock data leakage)');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Register Student A mapped to Institution A
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👉 TEST 2: Registering Student A mapped to Institution A...');
  const studentAEmail = `student.a.${stamp}@alpha.edu`;
  const studentARes = await post('/api/auth/register', {
    name: 'Arun Kumar Alpha',
    email: studentAEmail,
    phone: '+91 98765 00001',
    password: 'password123',
    role: 'student',
    gender: 'Male',
    dob: '2004-05-15',
    regNo: `REG-A-${stamp}`,
    collegeId: collegeIdA,
    institutionId: collegeIdA,
    collegeName: 'Alpha Engineering College',
    university: 'Anna University',
    department: 'CSE',
    degree: 'B.Tech CSE',
    specialization: 'Artificial Intelligence',
    year: 'III Year',
    semester: 'Sem 5',
    batch: '2023-2027',
    cgpa: '8.40',
    creditsCompleted: 96,
    totalCredits: 160,
    activeBacklogs: 0,
    historyOfBacklogs: 0,
    skills: ['Python', 'React', 'SQL', 'Git'],
    certifications: ['AWS Cloud Practitioner'],
    careerGoals: 'Full Stack Engineer'
  });

  assert.strictEqual(studentARes.status, 201, 'Student A registration must return 201');
  const tokenStudentA = studentARes.data.token;
  const studentAId = studentARes.data.user.studentId;
  console.log('   ✅ Student A registered. ID:', studentAId, 'mapped to:', collegeIdA);

  // Verify Student A profile
  const profileARes = await get('/api/students/profile', tokenStudentA);
  assert.strictEqual(profileARes.status, 200);
  const pA = profileARes.data.data;
  assert.strictEqual(pA.collegeId, collegeIdA);
  assert.strictEqual(Number(pA.cgpa), 8.4);
  assert.strictEqual(Number(pA.creditsCompleted), 96);
  assert.strictEqual(Number(pA.totalCredits), 160);
  assert.strictEqual(pA.courseCompletionPercentage, 60, '96 / 160 credits must equal 60% completion');
  assert.strictEqual(pA.courseCompletionStatus, 'In Progress');
  assert.strictEqual(pA.skills.length, 4);
  console.log('   ✅ Student A profile integrity validated: 60% completion, CGPA 8.40, 4 skills');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Register Student B mapped to Institution B
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👉 TEST 3: Registering Student B mapped to Institution B...');
  const studentBEmail = `student.b.${stamp}@beta.edu`;
  const studentBRes = await post('/api/auth/register', {
    name: 'Bhavna Sundar Beta',
    email: studentBEmail,
    phone: '+91 98765 00002',
    password: 'password123',
    role: 'student',
    gender: 'Female',
    dob: '2004-08-20',
    regNo: `REG-B-${stamp}`,
    collegeId: collegeIdB,
    institutionId: collegeIdB,
    collegeName: 'Beta Institute of Technology',
    university: 'Anna University',
    department: 'Mechanical',
    degree: 'B.Tech Mechanical',
    specialization: 'Robotics',
    year: 'IV Year',
    semester: 'Sem 7',
    batch: '2022-2026',
    cgpa: '9.10',
    creditsCompleted: 160,
    totalCredits: 160,
    activeBacklogs: 0,
    historyOfBacklogs: 0,
    skills: ['CAD', 'MATLAB', 'Python', 'ROS'],
    certifications: ['Certified SolidWorks Associate'],
    careerGoals: 'Robotics Engineer'
  });

  assert.strictEqual(studentBRes.status, 201, 'Student B registration must return 201');
  const tokenStudentB = studentBRes.data.token;
  const studentBId = studentBRes.data.user.studentId;
  console.log('   ✅ Student B registered. ID:', studentBId, 'mapped to:', collegeIdB);

  // Verify Student B profile (completed credits = 100% completion)
  const profileBRes = await get('/api/students/profile', tokenStudentB);
  assert.strictEqual(profileBRes.status, 200);
  const pB = profileBRes.data.data;
  assert.strictEqual(pB.courseCompletionPercentage, 100, '160 / 160 credits must equal 100% completion');
  assert.strictEqual(pB.courseCompletionStatus, 'Completed');
  console.log('   ✅ Student B profile integrity validated: 100% completion, Status: Completed');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: Strict Student-Institution Tenant Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👉 TEST 4: Verifying Student-Institution Mapping & Strict Tenant Isolation...');

  // Institution A queries its students
  const instARoster = await get('/api/academic/students', tokenInstA);
  assert.strictEqual(instARoster.status, 200);
  const aStudents = instARoster.data.data;
  assert.strictEqual(aStudents.length, 1, 'Institution A must have exactly 1 student');
  assert.strictEqual(aStudents[0].studentId, studentAId, 'Institution A student must be Student A');
  console.log('   ✅ Institution A sees Student A');

  // Institution B queries its students
  const instBRoster = await get('/api/academic/students', tokenInstB);
  assert.strictEqual(instBRoster.status, 200);
  const bStudents = instBRoster.data.data;
  assert.strictEqual(bStudents.length, 1, 'Institution B must have exactly 1 student');
  assert.strictEqual(bStudents[0].studentId, studentBId, 'Institution B student must be Student B');
  console.log('   ✅ Institution B sees Student B');

  // Cross-tenant verification: Institution A requests Student B directly by ID
  const crossTenantRes = await get(`/api/academic/students/${studentBId}`, tokenInstA);
  assert.strictEqual(crossTenantRes.status, 404, 'Institution A must NOT be able to view Student B from Institution B');
  console.log('   ✅ Cross-tenant security confirmed: Institution A blocked (404) from accessing Student B');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: Single Source of Truth & Real-Time Profile Updates
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👉 TEST 5: Real-Time Profile Updates & Instant Synchronization...');

  // Student A updates their CGPA and credits completed
  const updateRes = await put('/api/students/profile', {
    cgpa: '9.25',
    creditsCompleted: 128,
    totalCredits: 160,
    activeBacklogs: 1,
    skills: [
      { name: 'Python', level: 'Advanced', verified: false },
      { name: 'React', level: 'Intermediate', verified: false },
      { name: 'SQL', level: 'Intermediate', verified: false },
      { name: 'Git', level: 'Intermediate', verified: false },
      { name: 'Kubernetes', level: 'Foundational', verified: false }
    ],
    careerGoals: 'Lead Cloud Architect'
  }, tokenStudentA);

  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.success, true);
  assert.strictEqual(Number(updateRes.data.data.cgpa), 9.25);
  assert.strictEqual(updateRes.data.data.courseCompletionPercentage, 80, '128 / 160 credits must equal 80% completion');
  console.log('   ✅ Student A updated profile via PUT /api/students/profile');

  // Institution A queries Student A again — updates must be immediately visible
  const instAStudentCheck = await get(`/api/academic/students/${studentAId}`, tokenInstA);
  assert.strictEqual(instAStudentCheck.status, 200);
  const syncedStudent = instAStudentCheck.data.data;
  assert.strictEqual(Number(syncedStudent.cgpa), 9.25, 'Updated CGPA must reflect in Institution view immediately');
  assert.strictEqual(syncedStudent.creditsCompleted, 128, 'Updated credits must reflect in Institution view immediately');
  assert.strictEqual(syncedStudent.courseCompletionPercentage, 80, 'Updated completion percentage must reflect in Institution view immediately');
  assert.strictEqual(syncedStudent.activeBacklogs, 1, 'Updated backlogs must reflect in Institution view immediately');
  assert.strictEqual(syncedStudent.skills.length, 5, 'Updated skills must reflect in Institution view immediately');
  console.log('   ✅ Real-time synchronization confirmed: Institution A immediately saw updated CGPA (9.25), 80% completion, 5 skills');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6: Industry / Company Account Creation & Login
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n👉 TEST 6: Industry / Company Account Creation & Login...');
  const companyEmail = `talent.${stamp}@innovatetech.corp`;
  const companyId = `INNOVATE_TECH_${stamp}`;
  const companyRes = await post('/api/auth/register', {
    companyName: 'InnovateTech Systems Global',
    companyId: companyId,
    email: companyEmail,
    businessEmail: companyEmail,
    password: 'password123',
    role: 'company',
    name: 'Sarah Jenkins',
    contactPerson: 'Sarah Jenkins',
    designation: 'Head of Technical Talent Acquisition',
    phone: '+91 44 4920 1100',
    industry: 'Cloud Infrastructure & AI',
    sector: 'Technology & AI',
    companyType: 'Enterprise',
    city: 'Chennai',
    state: 'Tamil Nadu',
    companySize: '500-1000',
    hiringVolume: '50-100 hires/year',
    website: 'https://innovatetech.corp'
  });

  assert.strictEqual(companyRes.status, 201, 'Company registration must return 201');
  assert.strictEqual(companyRes.data.success, true);
  const tokenCompany = companyRes.data.token;
  console.log('   ✅ Company registered:', companyId, 'Email:', companyEmail);

  // Verify company OTP before login
  if (companyRes.data && companyRes.data.demoOtp) {
    const otpVerifyRes = await post('/api/auth/verify-otp', {
      email: companyEmail,
      otp: companyRes.data.demoOtp,
      purpose: 'ACCOUNT_VERIFICATION'
    });
    assert.strictEqual(otpVerifyRes.status, 200, 'Company OTP verification should succeed');
    console.log('   ✅ Company OTP verified successfully');
  }

  // Log in as company
  const companyLogin = await post('/api/auth/login', {
    email: companyEmail,
    password: 'password123',
    role: 'company'
  });
  assert.strictEqual(companyLogin.status, 200);
  assert.strictEqual(companyLogin.data.success, true);
  assert.strictEqual(companyLogin.data.user.role, 'company');
  console.log('   ✅ Company login succeeded with official corporate credentials');

  console.log('\n================================================================');
  console.log('🎉 ALL 6 TESTS PASSED! ACCOUNT CREATION & MAPPING AUDIT 100% GREEN');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
