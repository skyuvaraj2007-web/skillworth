/**
 * HTTP End-to-End Test for 4-Step Registration over Express API
 */
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let resData = '';
      res.on('data', chunk => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Testing GET /api/auth/institutions/registered ---');
  const insts = await get('/api/auth/institutions/registered');
  console.log(`Status: ${insts.status}, Count: ${insts.body?.data?.length}`);
  if (insts.status !== 200 || !insts.body?.data?.length) {
    throw new Error('Failed to fetch registered institutions');
  }

  const sampleInst = insts.body.data[0];
  const collegeId = sampleInst.collegeId || sampleInst.id;
  console.log(`Selected Institution: ${sampleInst.collegeName} (${collegeId})`);
  console.log(`Departments count: ${sampleInst.departments?.length}`);

  const ts = Date.now();
  const testRegNo = `717821E${ts.toString().slice(-4)}`;

  console.log('\n--- Testing POST /api/auth/register (Student) ---');
  const regPayload = {
    name: 'Suresh Karthik',
    email: `suresh_${ts}@student.edu`,
    phone: '+91 9876543210',
    password: 'Password123!',
    role: 'student',
    regNo: testRegNo,
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    collegeId: collegeId,
    collegeName: sampleInst.collegeName,
    department: sampleInst.departments[0] || 'Computer Science and Engineering',
    degree: 'B.Tech',
    specialization: 'Artificial Intelligence',
    batch: '2024-2028',
    semester: 'Sem 2'
  };

  const regRes = await post('/api/auth/register', regPayload);
  console.log(`Status: ${regRes.status}, Success: ${regRes.body?.success}`);
  console.log(`Demo OTP: ${regRes.body?.demoOtp}`);

  if (regRes.status !== 201 || !regRes.body?.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
  }

  console.log('\n--- Testing Duplicate regNo in Same College (Must Fail) ---');
  const dupPayload = {
    ...regPayload,
    email: `dup_${ts}@student.edu`,
    name: 'Duplicate Student'
  };
  const dupRes = await post('/api/auth/register', dupPayload);
  console.log(`Status: ${dupRes.status}, Message: "${dupRes.body?.message}"`);
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate regNo, got ${dupRes.status}`);
  }

  console.log('\n--- Testing POST /api/auth/verify-otp ---');
  const verifyRes = await post('/api/auth/verify-otp', {
    email: regPayload.email,
    otp: regRes.body.demoOtp,
    type: 'REGISTRATION'
  });
  console.log(`Status: ${verifyRes.status}, Success: ${verifyRes.body?.success}`);
  console.log(`Token returned: ${Boolean(verifyRes.body?.token)}`);
  console.log(`User status: ${verifyRes.body?.user?.status}, isVerified: ${verifyRes.body?.user?.isVerified}`);

  if (verifyRes.status !== 200 || !verifyRes.body?.success || !verifyRes.body?.token) {
    throw new Error('OTP verification failed over HTTP');
  }

  console.log('\n🎉 ALL HTTP END-TO-END REGISTRATION TESTS PASSED!');
}

run().catch(err => {
  console.error('\n❌ HTTP E2E Test Failed:', err);
  process.exit(1);
});
