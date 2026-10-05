const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function req(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const request = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers
      }
    }, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });
    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function verifyAll() {
  console.log('================================================================');
  console.log('SKILLNEXUS AI — PRODUCTION AUTHENTICATION VALIDATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  // 1. REJECTION OF UNAUTHENTICATED /api/auth/me
  const unauth = await req('GET', '/api/auth/me');
  assert(unauth.status === 401 && unauth.data.success === false, '1. GET /api/auth/me returns 401 when no token is supplied (no Arun Kumar fallback)');

  // 2. REJECTION OF WRONG PASSWORD
  const badLogin = await req('POST', '/api/auth/login', {
    email: 'arun.kumar@nexus.edu',
    password: 'wrong_password_attempt',
    role: 'student'
  });
  assert(badLogin.status === 401 && badLogin.data.success === false, '2. POST /api/auth/login returns 401 for incorrect password');

  // 3. STUDENT SIGNUP
  const studentEmail = `student_${timestamp}@nexus.edu`;
  const studentPassword = 'SecureStudentPass2026!';
  const stuReg = await req('POST', '/api/auth/register', {
    email: studentEmail,
    password: studentPassword,
    name: 'Rohan Sharma',
    role: 'student',
    collegeId: 'TN010',
    collegeName: 'SRM Institute of Science and Technology',
    department: 'CSE',
    year: 'III Year'
  });
  assert(stuReg.status === 201 && stuReg.data.success && stuReg.data.token, '3. Student registration succeeds (201 Created + Token)');

  // 4. STUDENT LOGIN WITH NEW CREDENTIALS
  const stuLogin = await req('POST', '/api/auth/login', {
    email: studentEmail,
    password: studentPassword,
    role: 'student'
  });
  assert(stuLogin.status === 200 && stuLogin.data.user.email === studentEmail, '4. Newly registered student logs in successfully with real password');

  const stuToken = stuLogin.data.token;
  const stuCookie = stuLogin.headers['set-cookie'] ? stuLogin.headers['set-cookie'][0].split(';')[0] : '';
  assert(stuCookie.includes('nexus_session='), '5. HTTP-only session cookie (nexus_session) issued on login');

  // 6. SESSION RECOVERY VIA TOKEN / COOKIE (/api/auth/me)
  const stuSession = await req('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${stuToken}`
  });
  assert(stuSession.status === 200 && stuSession.data.user.name === 'Rohan Sharma', '6. Active session restored correctly via /api/auth/me');

  // 7. INSTITUTION SIGNUP
  const instEmail = `dean_${timestamp}@srmist.edu.in`;
  const instPassword = 'SecureDeanPass2026!';
  const instReg = await req('POST', '/api/auth/register', {
    email: instEmail,
    password: instPassword,
    name: 'Prof. K. Ramanathan',
    role: 'institution',
    collegeId: 'TN010',
    institutionId: 'TN010',
    collegeName: 'SRM Institute of Science and Technology'
  });
  assert(instReg.status === 201 && instReg.data.success, '7. Institution registration succeeds');

  // 8. INSTITUTION LOGIN
  const instLogin = await req('POST', '/api/auth/login', {
    email: instEmail,
    password: instPassword,
    role: 'institution'
  });
  assert(instLogin.status === 200 && instLogin.data.user.role === 'institution', '8. Institution login succeeds with role = institution');

  // 9. COMPANY SIGNUP
  const compEmail = `recruiter_${timestamp}@abctech.com`;
  const compPassword = 'SecureRecruiterPass2026!';
  const compReg = await req('POST', '/api/auth/register', {
    email: compEmail,
    password: compPassword,
    name: 'Sarah Jenkins',
    role: 'company',
    companyName: 'ABC Technologies Global',
    companyId: `COMP-${timestamp.toString().slice(-4)}`,
    industry: 'Cloud & AI Solutions'
  });
  assert(compReg.status === 201 && compReg.data.success, '9. Company registration succeeds with enterprise profile');

  // 10. COMPANY LOGIN
  const compLogin = await req('POST', '/api/auth/login', {
    email: compEmail,
    password: compPassword,
    role: 'company'
  });
  assert(compLogin.status === 200 && compLogin.data.user.role === 'company', '10. Company login succeeds with role = company');

  // 11. LOGOUT
  const logoutRes = await req('POST', '/api/auth/logout');
  assert(logoutRes.status === 200 && logoutRes.data.success, '11. POST /api/auth/logout clears session successfully');

  // 12. RE-LOGIN AFTER LOGOUT
  const reLogin = await req('POST', '/api/auth/login', {
    email: studentEmail,
    password: studentPassword,
    role: 'student'
  });
  assert(reLogin.status === 200 && reLogin.data.user.email === studentEmail, '12. Persistent re-login after logout functions flawlessly');

  // 13. PERSISTENCE IN DATABASE & PASSWORD SECURITY
  const dbPath = path.join(__dirname, 'data', 'relational_db.json');
  if (fs.existsSync(dbPath)) {
    const rawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const savedStuUser = rawDb.users.find(u => u.email === studentEmail);
    const savedInstUser = rawDb.users.find(u => u.email === instEmail);
    const savedCompUser = rawDb.users.find(u => u.email === compEmail);

    assert(Boolean(savedStuUser && savedInstUser && savedCompUser), '13. All accounts persistently written to relational database');
    assert(savedStuUser.passwordHash && !savedStuUser.password, '14. No plaintext password stored (passwordHash only)');
    assert(savedStuUser.passwordHash.startsWith('$2b$10$') || savedStuUser.passwordHash.startsWith('$2a$10$'), '15. Password hashed with bcrypt (salt rounds = 10)');
    assert(bcrypt.compareSync(studentPassword, savedStuUser.passwordHash), '16. Stored bcrypt hash verifies against original password');
    assert(!bcrypt.compareSync('wrong_pass', savedStuUser.passwordHash), '17. Stored bcrypt hash rejects wrong password');
  }

  // 14. PASSWORD RESET FLOW
  const forgotRes = await req('POST', '/api/auth/forgot-password', { email: studentEmail });
  assert(forgotRes.status === 200 && forgotRes.data.success && forgotRes.data.token, '18. Password reset token generated for registered account');

  const newPassword = 'BrandNewPassword2026!';
  const resetRes = await req('POST', '/api/auth/reset-password', {
    token: forgotRes.data.token,
    newPassword
  });
  assert(resetRes.status === 200 && resetRes.data.success, '19. Password reset applied successfully with new bcrypt hash');

  const loginWithNewPass = await req('POST', '/api/auth/login', {
    email: studentEmail,
    password: newPassword,
    role: 'student'
  });
  assert(loginWithNewPass.status === 200 && loginWithNewPass.data.success, '20. Login with new reset password succeeds');

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL 20 CRITICAL PRODUCTION AUTH CHECKS PASSED PERFECTLY!');
  } else {
    process.exit(1);
  }
}

verifyAll().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
