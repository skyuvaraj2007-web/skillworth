const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (e) { json = raw; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUTH ENDPOINT TESTS ---');

  // Test 1: GET /api/auth/me without token -> Should be 401
  const t1 = await request('GET', '/api/auth/me');
  console.log('1. GET /api/auth/me without token:', t1.status, t1.body.success === false ? '✅ PASS (401)' : '❌ FAIL');

  // Test 2: POST /api/auth/login with invalid password -> Should be 401
  const t2 = await request('POST', '/api/auth/login', {
    email: 'arun.kumar@nexus.edu',
    password: 'wrongpassword'
  });
  console.log('2. Bad password login:', t2.status, t2.body.success === false ? '✅ PASS (401)' : '❌ FAIL');

  // Test 3: POST /api/auth/login with valid password -> Should be 200 + set cookie
  const t3 = await request('POST', '/api/auth/login', {
    email: 'arun.kumar@nexus.edu',
    password: 'password123',
    role: 'student'
  });
  const hasCookie = t3.headers['set-cookie'] && t3.headers['set-cookie'].some(c => c.includes('nexus_session='));
  console.log('3. Student valid login:', t3.status, t3.body.success && hasCookie ? '✅ PASS (200 + Cookie)' : '❌ FAIL');

  const studentToken = t3.body.token;

  // Test 4: GET /api/auth/me with Bearer token -> Should be 200 with Arun Kumar
  const t4 = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${studentToken}`
  });
  console.log('4. GET /api/auth/me with Bearer token:', t4.status, t4.body.user?.email === 'arun.kumar@nexus.edu' ? '✅ PASS (Profile returned)' : '❌ FAIL');

  // Test 5: Register a brand new student
  const newEmail = `test.student.${Date.now()}@nexus.edu`;
  const t5 = await request('POST', '/api/auth/register', {
    email: newEmail,
    password: 'RealSecurePassword2026!',
    name: 'Real Test Student',
    role: 'student',
    collegeId: 'TN010'
  });
  console.log('5. Register new student:', t5.status, t5.body.success ? '✅ PASS (Registered)' : '❌ FAIL');

  // Test 6: Login with newly registered student
  const t6 = await request('POST', '/api/auth/login', {
    email: newEmail,
    password: 'RealSecurePassword2026!',
    role: 'student'
  });
  console.log('6. Login new student:', t6.status, t6.body.user?.email === newEmail ? '✅ PASS (Logged in)' : '❌ FAIL');

  // Test 7: Register a new Company recruiter
  const compEmail = `recruiter.${Date.now()}@acmecorp.com`;
  const t7 = await request('POST', '/api/auth/register', {
    email: compEmail,
    password: 'AcmePassword2026!',
    name: 'Jane Talent Lead',
    role: 'company',
    companyName: 'Acme Robotics AI',
    industry: 'Robotics'
  });
  console.log('7. Register new company:', t7.status, t7.body.success ? '✅ PASS (Registered company)' : '❌ FAIL');

  // Test 8: Login with newly registered company
  const t8 = await request('POST', '/api/auth/login', {
    email: compEmail,
    password: 'AcmePassword2026!',
    role: 'company'
  });
  console.log('8. Login new company:', t8.status, t8.body.user?.companyName === 'Acme Robotics AI' || t8.body.user?.name === 'Jane Talent Lead' ? '✅ PASS (Company profile)' : '❌ FAIL');

  // Test 9: Logout
  const t9 = await request('POST', '/api/auth/logout');
  const clearedCookie = t9.headers['set-cookie'] && t9.headers['set-cookie'].some(c => c.includes('nexus_session=;'));
  console.log('9. POST /api/auth/logout:', t9.status, clearedCookie ? '✅ PASS (Cookie cleared)' : '❌ FAIL');

  console.log('--- ALL AUTH BACKEND TESTS COMPLETE ---');
}

runTests().catch(console.error);
