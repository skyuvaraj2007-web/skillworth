require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function debug() {
  const user = await pool.query("SELECT u.id, u.email, s.id as student_id FROM users u JOIN students s ON s.user_id = u.id WHERE u.email LIKE 'karthik.live.test%' LIMIT 1");
  console.log('User:', user.rows[0]);
  if (!user.rows[0]) return;

  const loginRes = await request('POST', '/api/auth/login', {
    email: user.rows[0].email,
    password: 'SecurePassword123!'
  });
  const token = loginRes.data.token;
  console.log('Login token:', Boolean(token));

  const prof = await request('GET', '/api/profile', null, token);
  console.log('Profile payload:', JSON.stringify(prof.data, null, 2));

  const apps = await request('GET', '/api/opportunities/applications/student', null, token);
  console.log('Apps payload:', JSON.stringify(apps.data, null, 2));

  const proj = await request('POST', '/api/projects', {
    title: 'High-Concurrency In-Memory Key-Value Store',
    description: 'LSM-tree KV Store',
    techStack: ['Node.js']
  }, token);
  console.log('Proj create response:', proj.status, JSON.stringify(proj.data, null, 2));

  await pool.end();
}

debug().catch(console.error);
