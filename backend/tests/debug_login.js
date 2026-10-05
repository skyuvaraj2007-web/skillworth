require('dotenv').config();
const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, 'http://localhost:5000');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname + url.search,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  const regEmail = `karthik.login.check.${Date.now()}@gmail.com`;
  console.log('Registering:', regEmail);
  const reg = await request('POST', '/api/auth/register/student', {
    fullName: 'Karthik Raja',
    email: regEmail,
    password: 'SecurePassword123!',
    institutionId: '4de68ae2-6abb-488b-a777-b6fb24e63c77',
    departmentId: '30582f6b-e994-4a92-a97f-67241efa17b2',
    regNo: '732925CSR111'
  });
  console.log('Reg status:', reg.status, 'reg token:', Boolean(reg.data.token), 'reg user:', reg.data.user);

  const login = await request('POST', '/api/auth/login', {
    email: regEmail,
    password: 'SecurePassword123!'
  });
  console.log('Login status:', login.status, 'login user:', login.data.user);

  const profile = await request('GET', '/api/profile', null, login.data.token);
  console.log('Profile data:', profile.data);
}

test().catch(console.error);
