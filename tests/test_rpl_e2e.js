const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runRplTests() {
  console.log('====================================================');
  console.log('  SKILLWORTH RPL ENHANCEMENT VALIDATION SUITE');
  console.log('  Problem Statement ID: 26242 (AI-Assisted RPL)');
  console.log('====================================================');

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

  // 1. Get Auth Token for Learner
  const learnerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'learner.demo@skillworth.org',
      password: 'SkillWorth@2026',
      role: 'LEARNER'
    })
  }).then(r => r.json());
  const learnerToken = learnerLogin.token;

  // 2. Get Auth Token for Assessor
  const assessorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'assessor.demo@skillworth.org',
      password: 'SkillWorth@2026',
      role: 'INSTITUTION'
    })
  }).then(r => r.json());
  const assessorToken = assessorLogin.token;

  // TEST 1: Qualification Packs Listing
  await test('GET /api/rpl/qualification-packs returns NSQF standard packs', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/qualification-packs`).then(r => r.json());
    assert.strictEqual(res.success, true);
    assert(Array.isArray(res.qualificationPacks));
    assert(res.qualificationPacks.some(qp => qp.qpCode === 'ELE/Q1401'));
  });

  // TEST 2: AI Experience Analysis
  await test('POST /api/rpl/experience/analyze accurately maps natural speech/text', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/experience/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        declarationText: 'I have worked as an electrician for eight years handling conduit wiring and distribution boards.'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.suggestedTrade, 'Electrician');
    assert.strictEqual(res.suggestedNsqfLevel, 4);
    assert(res.aiConfidenceScore > 50);
    assert(Array.isArray(res.missingInformation));
  });

  // TEST 3: Submit Experience Declaration
  let declarationId = null;
  await test('POST /api/rpl/experience records declaration with audit log', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${learnerToken}`
      },
      body: JSON.stringify({
        jobRole: 'Field Electrician',
        yearsOfExperience: 8,
        tasksPerformed: 'Domestic wiring, MCB mounting, pipe earthing, conduit running',
        toolsUsed: 'Insulated pliers, neon tester, Megger earth tester',
        safetyUsed: '1000V gloves, safety boots, LOTO tag'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert(res.declaration.id);
    declarationId = res.declaration.id;
  });

  // TEST 4: Start RPL Assessment
  let assessmentId = null;
  await test('POST /api/rpl/assessment/start initiates structured framework', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${learnerToken}`
      },
      body: JSON.stringify({
        qpId: 'QP-ELE-Q1401',
        declarationId
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert(res.assessment.id);
    assert.strictEqual(res.assessment.trade, 'Electrician');
    assert.strictEqual(res.assessment.nsqfLevel, 4);
    assert(res.assessment.checklists.length > 0);
    assessmentId = res.assessment.id;
  });

  // TEST 5: Assessment Workspace & Explainable AI
  await test('GET /api/rpl/assessment/:id provides criteria and explainable AI telemetry', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert(res.assessment);
    assert(res.aiAssistance);
    assert(res.aiAssistance.aiAssessmentSummary.observedIndicators);
    assert(Array.isArray(res.aiAssistance.aiAssessmentSummary.viewReasoning));
  });

  // TEST 6: AI Evidence Quality Checker
  await test('POST /api/rpl/evidence/quality-check validates practical evidence criteria', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/evidence/quality-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidenceItem: {
          title: 'Conduit wiring demonstration',
          description: 'Showing safety gloves and wiring procedure',
          isVideo: true,
          videoMetadata: { durationSeconds: 120 }
        },
        competencyCode: 'ELE/N1401'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.safetyObserved, true);
    assert(res.criteriaMatched);
  });

  // TEST 7: Guided Practical Checklist Scoring with Human-in-the-Loop Override
  await test('POST /api/rpl/assessment/:id/checklist-score stores rubric scores and override reason', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/checklist-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        scores: {
          'chk_1_1': 4,
          'chk_1_2': 3,
          'chk_2_1': 3,
          'chk_3_1': 4,
          'chk_4_1': 4
        },
        acceptedAi: {
          'chk_1_1': true,
          'chk_1_2': false
        },
        overrideReason: {
          'chk_1_2': 'Candidate demonstrated faster conduit alignment during live practical task than AI observation estimated.'
        }
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert(res.assessment.totalScore > 0);
  });

  // TEST 8: Official Assessor Final Decision & Credential Issuance
  let issuedCredentialId = null;
  await test('POST /api/rpl/assessment/:id/decision completes verification and issues SW credential', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        decision: 'RECOMMENDED_FOR_CERTIFICATION',
        remarks: 'Candidate Arun Kumar demonstrated exceptional tradecraft competence in single-phase wiring, distribution board assembly, and 1000V electrical safety.'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.assessment.finalRecommendation, 'RECOMMENDED_FOR_CERTIFICATION');
    assert(res.credential);
    assert(res.credential.credentialId.startsWith('SW-'));
    issuedCredentialId = res.credential.credentialId;
  });

  // TEST 9: Public Credential Verification of newly issued RPL Credential
  await test('GET /api/credentials/verify/:id authenticates newly issued RPL credential', async () => {
    const res = await fetch(`${BASE_URL}/api/credentials/verify/${issuedCredentialId}`).then(r => r.json());
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.credential.status, 'VALID');
    assert(res.credential.standards.includes('NSQF'));
  });

  // TEST 10: Formal RPL Assessment Report
  await test('GET /api/rpl/assessment/:id/report returns comprehensive report with audit trail', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/report`).then(r => r.json());
    assert.strictEqual(res.success, true);
    assert(res.report.reportId);
    assert(res.report.qualification.qpCode);
    assert(Array.isArray(res.report.auditTrail));
    assert(res.report.auditTrail.length > 0);
  });

  // TEST 11: Assessor Consistency Analytics
  await test('GET /api/rpl/analytics/assessor-consistency returns benchmark dataset', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/analytics/assessor-consistency`).then(r => r.json());
    assert.strictEqual(res.success, true);
    assert(res.overallAgreementRate > 80);
    assert(res.datasetLabel.includes('Prototype evaluation dataset'));
    assert(Array.isArray(res.competencies));
  });

  // TEST 12: Offline Synchronization Endpoint
  await test('POST /api/rpl/sync synchronizes cached offline evaluations', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        clientTimestamp: new Date().toISOString(),
        offlineRecords: [
          {
            assessmentId,
            data: {
              assessorFinalRemarks: 'Updated during offline fieldwork sync.'
            }
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.syncedCount, 1);
  });

  console.log('====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runRplTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
