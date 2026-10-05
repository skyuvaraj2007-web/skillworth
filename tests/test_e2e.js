const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../backend/server');

const PORT = 5599; // Isolated port for testing

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  SKILLWORTH STANDALONE END-TO-END VALIDATION SUITE');
  console.log('====================================================');

  const server = app.listen(PORT);
  let failed = 0;
  let passed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [? PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [? FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  try {
    // 1. Health check
    await test('GET /api/health returns status OK', async () => {
      const res = await request('GET', '/api/health');
      if (res.status !== 200 || res.body.status !== 'OK') throw new Error('Health check failed');
      if (!res.body.application.includes('SkillWorth')) throw new Error('Application branding missing');
    });

    // 2. Authentication: Learner Demo Login
    let learnerToken = '';
    await test('POST /api/auth/login validates Learner Demo account', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'learner.demo@skillworth.org',
        password: 'SkillWorth@2026',
        role: 'LEARNER'
      });
      if (res.status !== 200 || !res.body.token) throw new Error('Learner login failed');
      learnerToken = res.body.token;
      if (res.body.user.role !== 'LEARNER') throw new Error('Role mismatch');
    });

    // 3. Authentication: Assessor Demo Login
    let assessorToken = '';
    await test('POST /api/auth/login validates Assessor Demo account', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'assessor.demo@skillworth.org',
        password: 'SkillWorth@2026',
        role: 'INSTITUTION'
      });
      if (res.status !== 200 || !res.body.token) throw new Error('Assessor login failed');
      assessorToken = res.body.token;
    });

    // 4. Registration: Fresh Learner
    let freshLearnerEmail = `candidate_${Date.now()}@university.edu`;
    let freshToken = '';
    await test('POST /api/auth/register creates fresh Learner profile', async () => {
      const res = await request('POST', '/api/auth/register', {
        role: 'LEARNER',
        fullName: 'Ravi Chandran',
        email: freshLearnerEmail,
        password: 'Password@2026',
        collegeName: 'Coimbatore Institute of Technology',
        department: 'Information Technology',
        degree: 'B.Tech',
        studentId: 'CIT-2026-IT',
        primarySkill: 'Python Software Engineering',
        skillLevel: 'Intermediate'
      });
      if (res.status !== 201 || !res.body.token) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
      freshToken = res.body.token;
    });

    // 5. Skills Domain
    await test('GET /api/skills returns competencies list', async () => {
      const res = await request('GET', '/api/skills');
      if (res.status !== 200 || !res.body.skills || res.body.skills.length === 0) throw new Error('Skills empty');
    });

    // 6. Assessment Attempt & Credential Generation
    let generatedCredentialId = '';
    await test('POST /api/assessments/attempt evaluates candidate and issues credential', async () => {
      const res = await request('POST', '/api/assessments/attempt', {
        assessmentId: 'asm_py_intermediate',
        answers: [
          { questionId: 'q1', answer: 'Generators using the yield statement' },
          { questionId: 'q2', answer: 'threading.Lock with context manager (with lock:)' },
          { questionId: 'q3', answer: 'gather returns results in the exact order futures were passed; wait returns sets of completed and pending tasks' },
          { questionId: 'q4', answer: 'Perform SQL JOIN or select_related / prefetch_related in the ORM' }
        ],
        practicalTaskSnippet: 'class RateLimiter:\n    def __init__(self): pass'
      }, freshToken);

      if (res.status !== 200 || !res.body.result) throw new Error(`Assessment attempt failed: ${JSON.stringify(res.body)}`);
      if (res.body.result.percentage < 70) throw new Error('Expected passing score');
      if (!res.body.credential || !res.body.credential.credentialId.startsWith('SW-')) {
        throw new Error('Valid SkillWorth credential SW-XXXXXX was not generated');
      }
      generatedCredentialId = res.body.credential.credentialId;
    });

    // 7. Industry Verification of Pre-existing Credential
    await test('GET /api/credentials/verify/SW-884201 verifies ISO 17024 certification', async () => {
      const res = await request('GET', '/api/credentials/verify/SW-884201');
      if (res.status !== 200 || !res.body.valid) throw new Error('Failed to verify SW-884201');
      if (res.body.credential.status !== 'VALID') throw new Error('Status not valid');
      if (res.body.credential.learnerEmail) throw new Error('PII leak: learnerEmail should not be exposed');
    });

    // 8. Industry Verification of Newly Generated Credential
    await test(`GET /api/credentials/verify/${generatedCredentialId} verifies newly generated credential`, async () => {
      const res = await request('GET', `/api/credentials/verify/${generatedCredentialId}`);
      if (res.status !== 200 || !res.body.valid) throw new Error(`Failed to verify ${generatedCredentialId}`);
      if (res.body.credential.status !== 'VALID') throw new Error('Status not valid');
    });

    // 9. Assessor Evaluation
    await test('POST /api/assessor/evaluate signs off on candidate evidence', async () => {
      const res = await request('POST', '/api/assessor/evaluate', {
        evidenceId: 'EVD-DEMO-01',
        decision: 'APPROVE',
        feedback: 'Candidate successfully demonstrated token bucket rate limiter with sliding window counters.'
      }, assessorToken);

      if (res.status !== 200 || !res.body.evidence) throw new Error('Assessor evaluation failed');
      if (res.body.evidence.verificationStatus !== 'VERIFIED') throw new Error('Status not verified');
    });

  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
