const assert = require('assert');
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runMySkillsTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 VERIFYING STUDENT "MY SKILLS" COMPREHENSIVE END-TO-END SUITE');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const studentAEmail = `myskills_stu_a_${timestamp}@nexus.edu`;
  const studentBEmail = `myskills_stu_b_${timestamp}@nexus.edu`;
  let tokenA = '';
  let tokenB = '';
  let studentAId = '';
  let studentBId = '';

  // 1. Setup Student A
  await test('Register Student A: starts with clean profile and 0 skills', async () => {
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Skills Audit Student A',
      email: studentAEmail,
      password: 'Password123!',
      role: 'student',
      studentId: `STU-SKILL-A-${timestamp}`
    });
    assert.strictEqual(regRes.status, 201, 'Student A registration should succeed');
    assert.ok(regRes.data.token, 'Token should be returned');
    tokenA = regRes.data.token;
    studentAId = regRes.data.user.studentId || regRes.data.user.id;

    // Verify GET /api/skills returns empty array (no demo/seed skills)
    const skillsRes = await makeRequest('GET', '/api/skills', null, tokenA);
    assert.strictEqual(skillsRes.status, 200);
    assert.strictEqual(skillsRes.data.success, true);
    assert.ok(Array.isArray(skillsRes.data.data), 'skills.data should be an array');
    assert.strictEqual(skillsRes.data.data.length, 0, 'Clean student must have 0 skills initially (no Arun Kumar fallback)');
    assert.strictEqual(skillsRes.data.count, 0);

    // Verify canonical alias GET /api/student/skills returns identical empty array
    const aliasRes = await makeRequest('GET', '/api/student/skills', null, tokenA);
    assert.strictEqual(aliasRes.status, 200);
    assert.strictEqual(aliasData = aliasRes.data.success, true);
    assert.strictEqual(aliasRes.data.data.length, 0, 'Alias /api/student/skills must return 0 skills');
  });

  // 2. Setup Student B (Isolation Check)
  await test('Register Student B: ensures strict isolation between students', async () => {
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Skills Audit Student B',
      email: studentBEmail,
      password: 'Password123!',
      role: 'student',
      studentId: `STU-SKILL-B-${timestamp}`
    });
    assert.strictEqual(regRes.status, 201);
    tokenB = regRes.data.token;
    studentBId = regRes.data.user.studentId || regRes.data.user.id;

    const skillsRes = await makeRequest('GET', '/api/student/skills', null, tokenB);
    assert.strictEqual(skillsRes.data.data.length, 0, 'Student B starts with 0 skills');
  });

  // 3. Manual Skill Addition by Student A
  let reactSkillId = '';
  await test('Student A adds manual skill (Self-Assessed, unverified)', async () => {
    const addRes = await makeRequest('POST', '/api/student/skills', {
      name: 'React.js',
      category: 'Web Development',
      level: 'INTERMEDIATE',
      confidence: 72
    }, tokenA);

    assert.strictEqual(addRes.status, 201, 'Adding skill should return 201');
    assert.strictEqual(addRes.data.success, true);
    assert.ok(addRes.data.data, 'Should return created skill object');
    assert.strictEqual(addRes.data.data.name, 'React.js');
    assert.strictEqual(addRes.data.data.level, 'Intermediate', 'Level INTERMEDIATE must normalize to canonical Intermediate');
    assert.strictEqual(addRes.data.data.verified, false, 'Manual skill must be unverified');
    assert.strictEqual(addRes.data.data.verificationStatus, 'SELF_ASSESSED');
    reactSkillId = addRes.data.data.id;
    assert.ok(reactSkillId, 'Skill should have an ID');

    // Fetch Student A skills again
    const listRes = await makeRequest('GET', '/api/student/skills', null, tokenA);
    assert.strictEqual(listRes.data.data.length, 1, 'Student A should now have exactly 1 skill');
    assert.strictEqual(listRes.data.data[0].name, 'React.js');

    // Verify Student B still has 0 skills (No bleed)
    const listBRes = await makeRequest('GET', '/api/student/skills', null, tokenB);
    assert.strictEqual(listBData = listBRes.data.data.length, 0, 'Student B must still have 0 skills');
  });

  // 4. Canonical Level Normalization Tests
  await test('Canonical level normalization on skill creation', async () => {
    const levelsToTest = [
      { input: 'beginner', expected: 'Beginner' },
      { input: 'ADVANCED', expected: 'Advanced' },
      { input: 'expert', expected: 'Expert' },
      { input: 'INVALID_XYZ', expected: 'Intermediate' }
    ];

    for (const item of levelsToTest) {
      const res = await makeRequest('POST', '/api/student/skills', {
        name: `Skill-${item.input}`,
        category: 'Programming',
        level: item.input
      }, tokenA);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.level, item.expected, `Input "${item.input}" must normalize to "${item.expected}"`);
    }

    const listRes = await makeRequest('GET', '/api/student/skills', null, tokenA);
    assert.strictEqual(listRes.data.data.length, 5, 'Student A should have 1 + 4 = 5 skills');
  });

  // 5. Updating an existing skill
  await test('Student A updates an existing skill level and confidence', async () => {
    const updateRes = await makeRequest('PUT', `/api/student/skills/${reactSkillId}`, {
      level: 'ADVANCED',
      confidence: 90
    }, tokenA);

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.success, true);
    assert.strictEqual(updateRes.data.data.level, 'Advanced');
    assert.strictEqual(updateRes.data.data.confidence, 90);
  });

  // 6. Deleting a skill
  await test('Student A deletes a skill', async () => {
    const deleteRes = await makeRequest('DELETE', `/api/student/skills/${reactSkillId}`, null, tokenA);
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.data.success, true);

    // Verify count decreased to 4
    const listRes = await makeRequest('GET', '/api/student/skills', null, tokenA);
    assert.strictEqual(listRes.data.data.length, 4);
    assert.ok(!listRes.data.data.some(s => s.id === reactSkillId), 'Deleted skill must not exist in list');
  });

  // 7. Assessment Attestation Flow (Verified Skills)
  await test('Submitting an assessment attests verified skills directly to student ledger', async () => {
    const assessRes = await makeRequest('POST', '/api/assessments/submit', {
      assessmentId: 'gen-ai-eval-01',
      title: 'Full Stack & AI Core Competency',
      domain: 'Computer Science',
      totalQuestions: 10,
      score: 88,
      answers: { q1: 'a', q2: 'b' }
    }, tokenA);

    assert.strictEqual(assessRes.status, 200);
    assert.strictEqual(assessRes.data.success, true);
    assert.ok(assessRes.data.data.passed, 'Assessment with score 88 should pass');
    assert.ok(assessRes.data.data.skillsAttested > 0, 'Should attest skills to student record');

    // Verify Student A now has verified skills with real evidence
    const listRes = await makeRequest('GET', '/api/student/skills', null, tokenA);
    const verifiedSkills = listRes.data.data.filter(s => s.verified === true);
    assert.ok(verifiedSkills.length > 0, 'Student A should now have verified skills');

    const sampleVerified = verifiedSkills[0];
    assert.strictEqual(sampleVerified.verified, true);
    assert.strictEqual(sampleVerified.verificationStatus, 'VERIFIED');
    assert.ok(sampleVerified.evidence, 'Verified skill must contain evidence object');
    assert.ok(sampleVerified.evidence.examScore.includes('88'), 'Evidence must reference real exam score 88%');

    // Student B should still have 0 skills
    const listBRes = await makeRequest('GET', '/api/student/skills', null, tokenB);
    assert.strictEqual(listBRes.data.data.length, 0, 'Student B still has 0 skills (isolation maintained)');
  });

  // 8. Auth Enforcement
  await test('Reject unauthenticated skills mutation', async () => {
    const res = await makeRequest('POST', '/api/student/skills', { name: 'Hacker Skill' });
    assert.ok(res.status === 401 || res.status === 403, 'Unauthenticated request must be rejected with 401/403');
  });

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`TOTAL SUITE RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMySkillsTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
