const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runPhase5Tests() {
  console.log('================================================================');
  console.log('  SKILLWORTH PHASE 5: AI-POWERED RPL INTELLIGENCE & DISCOVERY');
  console.log('  Testing Experience AI, Evidence AI, Skill Gap & Advisory');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [\x1b[32m\u2713 PASS\x1b[0m] ${name}`);
      passed++;
    } catch (e) {
      console.log(`  [\x1b[31m\u2717 FAIL\x1b[0m] ${name}`);
      console.error('    Error details:', e.message);
      failed++;
    }
  }

  // Setup test tokens
  // 1. Assessor / Institution token
  const instLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'assessor.demo@skillworth.org',
      password: 'SkillWorth@2026',
      role: 'INSTITUTION'
    })
  }).then(r => r.json());
  const instToken = instLogin.token;

  // 2. Assessor role login
  const assessorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'assessor.demo@skillworth.org',
      password: 'SkillWorth@2026',
      role: 'ASSESSOR'
    })
  }).then(r => r.json());
  const assessorToken = assessorLogin.token || instToken;

  // 3. Worker / Learner registration
  const workerEmail = `ai.worker_${Date.now()}@skillworth.org`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: workerEmail,
      password: 'SkillWorth@2026',
      role: 'LEARNER',
      name: 'Ravi Kumar AI Test'
    })
  }).then(r => r.json());
  const workerToken = regRes.token;
  const workerId = regRes.user?.id;

  // 4. Create an RPL application for skill-gap testing
  const appRes = await fetch(`${BASE_URL}/api/rpl/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
    body: JSON.stringify({
      trade: 'Domestic Electrician',
      sector: 'Electronics & Electrical',
      nsqfLevel: 4,
      qpCode: 'ELE/Q6001',
      yearsOfExperience: 5
    })
  }).then(r => r.json());
  const testApplicationId = appRes.application?.id || appRes.id;

  // TEST 1: GET /api/rpl/ai/provider-info returns 200, principles, provider metadata
  await test('TEST 1: GET /api/rpl/ai/provider-info returns 200 with AI governance metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/provider-info`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.principleStatement, 'Must contain principleStatement');
    assert.ok(data.provider, 'Must specify provider');
  });

  // TEST 2: POST /api/rpl/ai/experience/extract with empty text returns 400
  await test('TEST 2: POST /api/rpl/ai/experience/extract rejects empty narrative with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' })
    });
    assert.strictEqual(res.status, 400);
  });

  // TEST 3: POST /api/rpl/ai/experience/extract with English electrician text
  await test('TEST 3: POST /api/rpl/ai/experience/extract parses English electrician narrative', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I have worked for 5 years as an electrician doing residential house wiring, installing MCB and distribution boxes with multimeter and conduit bender.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.extracted, 'Must return extracted profile');
    assert.ok(data.extracted.yearsOfExperience >= 5, 'Must extract years of experience');
    assert.ok(data.extracted.detectedTools.length > 0, 'Must extract tools');
  });

  // TEST 4: POST /api/rpl/ai/experience/extract with Tamil text
  await test('TEST 4: POST /api/rpl/ai/experience/extract parses Tamil language work description', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'நான் 4 வருடங்களாக எலக்ட்ரீசியன் மற்றும் வயரிங் வேலை செய்கிறேன். சுவிட்ச்போர்டு வயரிங் மற்றும் பைப் போடுவது தெரியும்.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.extracted.detectedTasks.length > 0 || data.extracted.occupationCandidates.length > 0);
  });

  // TEST 5: POST /api/rpl/ai/experience/extract with Hindi text
  await test('TEST 5: POST /api/rpl/ai/experience/extract parses Hindi language work description', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'मैं 6 साल से ऑटोमोबाइल मैकेनिक का काम कर रहा हूँ। इंजन रिपेयर, सर्विसिंग और ब्रेक काम करता हूँ।'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.extracted.yearsOfExperience >= 5 || data.extracted.occupationCandidates.length > 0);
  });

  // TEST 6: POST /api/rpl/ai/experience/extract contains AI disclaimer
  await test('TEST 6: POST /api/rpl/ai/experience/extract output contains AI advisory disclaimer', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I have 3 years experience in plumbing and pipe jointing.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.disclaimer, 'Response must contain disclaimer string');
    assert.ok(data.disclaimer.includes('AI ADVISORY ONLY') || data.disclaimer.includes('advisory'));
  });

  // TEST 7: POST /api/rpl/ai/experience/match with extractedData returns 200 and pathways
  await test('TEST 7: POST /api/rpl/ai/experience/match maps extracted profile to QP pathways', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extractedData: {
          yearsOfExperience: 5,
          occupationCandidates: [{ trade: 'Electrician', confidence: 0.9 }],
          detectedTools: ['multimeter', 'tester', 'wire stripper'],
          detectedTasks: ['house wiring', 'conduit installation']
        }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.matchResult, 'Must contain matchResult');
    assert.ok(Array.isArray(data.matchResult.pathways), 'Pathways must be an array');
    assert.ok(data.matchResult.pathways.length > 0, 'Must find at least 1 matching QP');
  });

  // TEST 8: POST /api/rpl/ai/experience/match with missing body returns 400
  await test('TEST 8: POST /api/rpl/ai/experience/match rejects missing extractedData with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
  });

  // TEST 9: POST /api/rpl/ai/experience/analyze-and-match with narrative returns matchResult
  await test('TEST 9: POST /api/rpl/ai/experience/analyze-and-match performs end-to-end extraction and matching', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/analyze-and-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I have 7 years experience in metal fabrication, arc welding, and cutting with gas torch and angle grinder.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.matchResult.pathways.length > 0);
    assert.ok(data.matchResult.topMatch, 'Must include topMatch');
  });

  // TEST 10: POST /api/rpl/ai/experience/analyze-and-match pathways sorted by matchScore
  await test('TEST 10: POST /api/rpl/ai/experience/analyze-and-match returns pathways sorted descending by matchScore', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/experience/analyze-and-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I have 4 years experience in plumbing, installing PVC pipes, water pumps, sanitary fittings, and fixing leakages.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    const pathways = data.matchResult.pathways;
    for (let i = 0; i < pathways.length - 1; i++) {
      assert.ok(
        pathways[i].matchScore >= pathways[i + 1].matchScore,
        `Pathways must be sorted descending: ${pathways[i].matchScore} >= ${pathways[i + 1].matchScore}`
      );
    }
  });

  // TEST 11: POST /api/rpl/ai/evidence/analyze without auth returns 401
  await test('TEST 11: POST /api/rpl/ai/evidence/analyze rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidenceItem: { title: 'Wiring video', description: 'Testing MCB' }
      })
    });
    assert.strictEqual(res.status, 401);
  });

  // TEST 12: POST /api/rpl/ai/evidence/analyze with auth returns 200 and relevance
  await test('TEST 12: POST /api/rpl/ai/evidence/analyze evaluates artifact against competency standard', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        evidenceItem: {
          title: '3-Phase Panel Board Assembly & Earth Testing',
          description: 'Demonstrating earthing resistance measurement with megger and multimeter wearing safety gloves.',
          isVideo: true,
          durationSeconds: 120
        },
        competencyCode: 'ELE/N6001',
        qpId: 'qp_ele_01'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.analysis.relevance, 'Must compute relevance score');
    assert.ok(Array.isArray(data.analysis.detectedItems), 'Must identify detected artifacts');
  });

  // TEST 13: POST /api/rpl/ai/evidence/analyze response contains AI disclaimer and confidence
  await test('TEST 13: POST /api/rpl/ai/evidence/analyze includes transparency disclaimer and confidence badge', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        evidenceItem: {
          title: 'Conduit laying demo',
          description: 'PVC conduit pipe cutting and bending'
        },
        competencyCode: 'ELE/N6001'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.disclaimer, 'Must include disclaimer');
    assert.ok(data.analysis.confidence, 'Must specify confidence level');
  });

  // TEST 14: POST /api/rpl/ai/evidence/analyze-set with empty array returns 200
  await test('TEST 14: POST /api/rpl/ai/evidence/analyze-set handles empty evidence set gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze-set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        evidenceList: [],
        competencyCode: 'ELE/N6001'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.analysis.itemCount, 0);
  });

  // TEST 15: POST /api/rpl/ai/evidence/analyze-set with multiple items computes aggregate
  await test('TEST 15: POST /api/rpl/ai/evidence/analyze-set aggregates multi-artifact evidence portfolio', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze-set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        evidenceList: [
          {
            title: 'MCB box wiring',
            description: 'Wiring distribution box with copper busbars',
            isVideo: true,
            durationSeconds: 90
          },
          {
            title: 'Earth resistance test photo',
            description: 'Megger earth electrode test showing 2.5 ohms',
            isVideo: false
          }
        ],
        competencyCode: 'ELE/N6001',
        qpId: 'qp_ele_01'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.analysis.itemCount, 2);
    assert.ok(data.analysis.overallRelevance !== undefined);
  });

  // TEST 16: POST /api/rpl/ai/evidence/analyze-set contains AI disclaimer
  await test('TEST 16: POST /api/rpl/ai/evidence/analyze-set includes AI advisory disclaimer', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/evidence/analyze-set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        evidenceList: [{ title: 'Demo', description: 'Test' }]
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.disclaimer);
  });

  // TEST 17: GET /api/rpl/ai/skill-gap/:applicationId with invalid ID returns 404
  await test('TEST 17: GET /api/rpl/ai/skill-gap/:applicationId returns 404 for non-existent application', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/skill-gap/NON_EXISTENT_APP_ID`, {
      headers: { 'Authorization': `Bearer ${workerToken}` }
    });
    assert.strictEqual(res.status, 404);
  });

  // TEST 18: GET /api/rpl/ai/skill-gap/:applicationId with valid application returns 200
  await test('TEST 18: GET /api/rpl/ai/skill-gap/:applicationId computes competency gap report', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/skill-gap/${testApplicationId}`, {
      headers: { 'Authorization': `Bearer ${workerToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.gapReport, 'Must include gapReport');
    assert.ok(Array.isArray(data.gapReport.competencyGaps), 'competencyGaps must be array');
    assert.ok(Array.isArray(data.gapReport.priorityActions), 'priorityActions must be array');
  });

  // TEST 19: GET /api/rpl/ai/skill-gap/:applicationId contains AI disclaimer
  await test('TEST 19: GET /api/rpl/ai/skill-gap/:applicationId includes AI advisory notice', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/skill-gap/${testApplicationId}`, {
      headers: { 'Authorization': `Bearer ${workerToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.disclaimer);
  });

  // TEST 20: POST /api/rpl/ai/assessor-advisory with LEARNER role returns 403
  await test('TEST 20: POST /api/rpl/ai/assessor-advisory rejects LEARNER role with 403', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/assessor-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
      body: JSON.stringify({
        applicationId: testApplicationId,
        competencyCode: 'ELE/N6001'
      })
    });
    assert.strictEqual(res.status, 403);
  });

  // TEST 21: POST /api/rpl/ai/assessor-advisory with ASSESSOR role returns 200
  await test('TEST 21: POST /api/rpl/ai/assessor-advisory authorizes ASSESSOR / INSTITUTION role', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/assessor-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${instToken}` },
      body: JSON.stringify({
        applicationId: testApplicationId,
        competencyCode: 'ELE/N6001',
        qpId: 'qp_ele_01'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
  });

  // TEST 22: POST /api/rpl/ai/assessor-advisory includes structured advisory observations
  await test('TEST 22: POST /api/rpl/ai/assessor-advisory includes observed indicators & suggested criteria', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/assessor-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${instToken}` },
      body: JSON.stringify({
        applicationId: testApplicationId,
        competencyCode: 'ELE/N6001',
        qpId: 'qp_ele_01'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.advisory, 'Must contain advisory payload');
    assert.ok(data.disclaimer, 'Must contain disclaimer');
    assert.strictEqual(data.isAssessorDecisionFinal, true, 'Must affirm human assessor final authority');
  });

  // TEST 23: GET /api/rpl/ai/consistency-analytics with LEARNER role returns 403
  await test('TEST 23: GET /api/rpl/ai/consistency-analytics rejects LEARNER role with 403', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/consistency-analytics`, {
      headers: { 'Authorization': `Bearer ${workerToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  // TEST 24: GET /api/rpl/ai/consistency-analytics with ASSESSOR/INSTITUTION role returns 200
  await test('TEST 24: GET /api/rpl/ai/consistency-analytics returns assessor-AI alignment analytics', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/ai/consistency-analytics`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.overrideAnalysis !== undefined, 'Must return overrideAnalysis');
    assert.ok(data.consistencyAnalytics !== undefined, 'Must return consistencyAnalytics');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL 24)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
