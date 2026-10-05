const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('  SKILLWORTH PHASE 3: COMPETENCY EVIDENCE MATRIX & SKILL PASSPORT');
  console.log('  Testing Data-Driven Matrix, Evidence Workflow & Worker Passport');
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

  // Assessor Token
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

  let worker1 = null;
  let worker1Token = null;
  let worker1Id = null;
  let assessmentId = null;
  let competencyToTest = null;
  let evidenceId = null;
  let evidenceRequestId = null;
  let worker2Token = null;
  let verificationRecordId = null;

  // TEST 1: Create worker
  await test('TEST 1: Create worker (Arun Kumar - Carpenter candidate)', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `arun.carpenter_${Date.now()}@worker.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'Arun Kumar',
        phone: '9840223344'
      })
    }).then(r => r.json());

    assert.strictEqual(regRes.success, true, 'Worker registration failed');
    worker1 = regRes.user;
    worker1Token = regRes.token;
    worker1Id = regRes.user.profileId || regRes.user.id;
  });

  // TEST 2: Create assessment
  await test('TEST 2: Create assessment (General Carpenter pathway)', async () => {
    // 2a. Submit multi-occupation experience declaration
    const expRes = await fetch(`${BASE_URL}/api/rpl/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        jobRole: 'General Carpenter',
        yearsOfExperience: 8,
        experiences: [
          {
            occupation: 'General Carpenter',
            sector: 'Construction',
            years: 6,
            tasks: 'Timber sizing, joinery cutting, door frame fitting, surface sanding',
            tools: 'Handsaw, bevel gauge, chisels, smoothing plane'
          },
          {
            occupation: 'Construction Woodworker',
            sector: 'Construction',
            years: 2,
            tasks: 'Formwork shuttering, scaffolding support, timber measurement',
            tools: 'Claw hammer, tape measure, spirit level'
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(expRes.success, true, 'Experience declaration failed');

    // 2b. Start RPL assessment
    const startRes = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        qpId: 'QP-CON-Q0103',
        declarationId: expRes.declaration.id
      })
    }).then(r => r.json());

    assert.strictEqual(startRes.success, true, 'Starting assessment failed');
    assert.ok(startRes.assessment?.id, 'Assessment ID missing');
    assessmentId = startRes.assessment.id;
  });

  // TEST 3: Generate competency matrix
  await test('TEST 3: Generate competency matrix dynamically from QP data', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/matrix`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to fetch matrix');
    assert.ok(Array.isArray(res.matrix) && res.matrix.length > 0, 'Matrix competencies missing');
    assert.strictEqual(res.qualificationPack.trade, 'General Carpenter');
    
    // Pick first competency for subsequent test steps
    competencyToTest = res.matrix[0];
    assert.ok(competencyToTest.competencyId, 'Competency ID missing');
    assert.ok(competencyToTest.performanceCriteria.length > 0, 'Performance criteria missing');
    assert.ok(['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT DATA'].includes(competencyToTest.aiConfidence), 'Invalid AI confidence category');
  });

  // TEST 4: Upload evidence
  await test('TEST 4: Upload evidence artifact', async () => {
    // Simulate candidate evidence submission
    const res = await fetch(`${BASE_URL}/api/evidence/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        title: 'Joinery Joint Mortise & Tenon Video Demonstration',
        description: 'Demonstrating accurate mortise marking and hand cutting with chisel',
        evidenceType: 'Video Demonstration',
        skillId: 'carpentry_joinery',
        skillName: 'General Carpentry',
        competency: competencyToTest.competencyName,
        fileUrl: '/uploads/demo_joinery_workpiece.mp4'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Evidence upload failed');
    assert.ok(res.evidence?.id, 'Evidence ID missing');
    evidenceId = res.evidence.id;
  });

  // TEST 5: Link evidence to competency
  await test('TEST 5: Link evidence to competency', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/evidence-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        evidenceId,
        competencyId: competencyToTest.competencyId,
        competencyCode: competencyToTest.competencyCode,
        criterion: competencyToTest.performanceCriteria[0]
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to link evidence');
    assert.strictEqual(res.evidence.assessmentId, assessmentId);
    assert.strictEqual(res.evidence.competencyCode, competencyToTest.competencyCode);
  });

  // TEST 6: Request additional evidence
  await test('TEST 6: Assessor requests additional evidence', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/evidence-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        competencyId: competencyToTest.competencyId,
        competencyCode: competencyToTest.competencyCode,
        competencyName: competencyToTest.competencyName,
        requiredEvidence: 'Safety procedure and PPE compliance demonstration video',
        message: 'Please upload a short video showing your PPE check and workspace safety clearance before using power saws.',
        deadline: '2026-11-15'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Evidence request creation failed');
    assert.strictEqual(res.request.status, 'EVIDENCE_REQUESTED');
    evidenceRequestId = res.request.id;
  });

  // TEST 7: Worker receives request
  await test('TEST 7: Worker receives evidence request in dossier', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/evidence-requests?assessmentId=${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to fetch worker requests');
    const targetReq = res.requests.find(r => r.id === evidenceRequestId);
    assert.ok(targetReq, 'Target evidence request not received by worker');
    assert.strictEqual(targetReq.status, 'EVIDENCE_REQUESTED');
  });

  // TEST 8: Worker submits evidence
  await test('TEST 8: Worker submits requested evidence', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/evidence-requests/${evidenceRequestId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        title: 'Safe Workshop & Personal Safety Gear Video',
        description: 'Demonstrating safety goggles, ear protection, and clean work bench setup',
        fileUrl: '/uploads/safety_demonstration.mp4',
        isVideo: true
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Evidence response failed');
    assert.strictEqual(res.request.status, 'EVIDENCE_SUBMITTED');
    assert.ok(res.evidence.id, 'New evidence record not generated');
  });

  // TEST 9: Assessor reviews evidence
  await test('TEST 9: Assessor reviews updated evidence matrix', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/matrix`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to load matrix');
    const comp = res.matrix.find(m => m.competencyId === competencyToTest.competencyId);
    assert.ok(comp.evidenceSubmitted >= 1, 'Submitted evidence not linked in matrix');
    assert.ok(comp.evidenceList.length >= 1, 'Evidence artifacts list empty');
  });

  // TEST 10: Assessor scores competency
  await test('TEST 10: Assessor scores competency on 0–4 rubric', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/matrix/${competencyToTest.competencyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        assessorScore: 4,
        assessorDecision: 'COMPETENT',
        assessorRemarks: 'Excellent dimensional accuracy and joinery fit verified in hands-on observation.'
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Scoring failed');
    assert.strictEqual(res.competency.status, 'COMPETENT');
    assert.strictEqual(res.competency.score, 100);
  });

  // TEST 11: Matrix updates correctly
  await test('TEST 11: Matrix reflects updated score and decision', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/matrix`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    const comp = res.matrix.find(m => m.competencyId === competencyToTest.competencyId);
    assert.strictEqual(comp.assessorScore, 4);
    assert.strictEqual(comp.assessorDecision, 'COMPETENT');
    assert.strictEqual(comp.status, 'COMPETENT');
  });

  // TEST 12: Evidence coverage calculated correctly
  await test('TEST 12: Evidence coverage calculated correctly from active data', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/evidence-coverage`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to calculate evidence coverage');
    assert.ok(typeof res.coverage.coveragePercentage === 'number', 'Coverage percentage must be numeric');
    assert.ok(res.coverage.totalCompetencies > 0, 'Total competencies must be > 0');
    assert.ok(res.coverage.fullySupported >= 1, 'Fully supported count should reflect scored competency');
  });

  // TEST 13: Skill gap calculated correctly
  await test('TEST 13: Skill gap derived from actual non-competent units', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/skill-gaps`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to calculate skill gaps');
    assert.ok(Array.isArray(res.skillGaps), 'Skill gaps must be an array');
    // Ensure scored competency (COMPETENT) is NOT in skill gaps
    const foundTested = res.skillGaps.find(g => g.competencyId === competencyToTest.competencyId);
    assert.strictEqual(foundTested, undefined, 'Competent unit should not be listed as skill gap');
    if (res.skillGaps.length > 0) {
      assert.ok(res.skillGaps[0].recommendedNextStep, 'Skill gap must include recommended next step');
    }
  });

  // TEST 14: Skill Passport generated
  await test('TEST 14: Skill Passport generated with QR code and RPL journey', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/worker/passport`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to generate Worker Skill Passport');
    assert.strictEqual(res.workerName, 'Arun Kumar');
    assert.ok(res.workerId.startsWith('SW-WRK-'), 'Worker ID format invalid');
    assert.strictEqual(res.primaryOccupation, 'General Carpenter');
    assert.ok(res.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR code data URI invalid');
    assert.ok(res.verificationUrl.includes('/verify/'), 'Verification URL missing record ID');
    assert.ok(res.rplJourneyStep >= 2, 'RPL journey step not progressing');
    verificationRecordId = res.recordId;
  });

  // TEST 15: Worker can access own passport
  await test('TEST 15: Worker can access own passport by workerId', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/worker/passport/${worker1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(res.success, true, 'Failed to access own passport');
    assert.strictEqual(res.workerName, 'Arun Kumar');
  });

  // TEST 16: Worker cannot access another worker's passport
  await test('TEST 16: Worker cannot access another candidate\'s passport (403 Forbidden)', async () => {
    // Register worker 2
    const reg2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `worker2_${Date.now()}@worker.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'Babu Rao',
        phone: '9840998877'
      })
    }).then(r => r.json());
    worker2Token = reg2.token;

    // Worker 2 attempts to view Worker 1's passport
    const res = await fetch(`${BASE_URL}/api/rpl/worker/passport/${worker1Id}`, {
      headers: { 'Authorization': `Bearer ${worker2Token}` }
    });

    assert.strictEqual(res.status, 403, 'Should forbid unauthorized worker access (403)');
  });

  // TEST 17: Public verification works
  await test('TEST 17: Public verification endpoint verifies assessment record', async () => {
    // Public fetch (no Authorization header)
    const res = await fetch(`${BASE_URL}/api/rpl/verify/${verificationRecordId}`).then(r => r.json());

    assert.strictEqual(res.success, true, 'Public verification failed');
    assert.strictEqual(res.valid, true, 'Record is not valid');
    assert.strictEqual(res.verificationStatus, 'VALID SKILLWORTH ASSESSMENT RECORD');
    assert.ok(res.workerName.startsWith('Arun'), 'Worker name format unexpected');
  });

  // TEST 18: Private information is not exposed
  await test('TEST 18: Private information is protected in public verification response', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/verify/${verificationRecordId}`).then(r => r.json());

    assert.strictEqual(res.email, undefined, 'Worker email must not be exposed');
    assert.strictEqual(res.password, undefined, 'Worker password must not be exposed');
    assert.strictEqual(res.phone, undefined, 'Worker phone must not be exposed');
    assert.strictEqual(res.privateEvidence, undefined, 'Private evidence files must not be exposed');
    assert.strictEqual(res.internalNotes, undefined, 'Internal notes must not be exposed');
  });

  // TEST 19: QR verification URL is correct
  await test('TEST 19: QR verification URL points strictly to public verification route', async () => {
    const passportRes = await fetch(`${BASE_URL}/api/rpl/worker/passport`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.ok(passportRes.verificationUrl.includes(`/verify/${verificationRecordId}`), 'Verification URL incorrect');
    assert.ok(!passportRes.verificationUrl.includes('token='), 'Verification URL must not encode authentication tokens');
    assert.ok(!passportRes.verificationUrl.includes('password='), 'Verification URL must not encode credentials');
  });

  // TEST 20: Final Assessor Decision & Regression Verification
  await test('TEST 20: Final Assessor Decision submission & audit logging', async () => {
    const finalRes = await fetch(`${BASE_URL}/api/rpl/assessment/${assessmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        decision: 'RECOMMENDED_FOR_CERTIFICATION',
        remarks: 'Candidate Arun Kumar thoroughly demonstrated trade competencies per NSQF guidelines.'
      })
    }).then(r => r.json());

    assert.strictEqual(finalRes.success, true, 'Final decision recording failed');
    assert.strictEqual(finalRes.assessment.finalRecommendation, 'RECOMMENDED_FOR_CERTIFICATION');
    assert.ok(finalRes.credential?.credentialId, 'RPL assessment credential ID not generated');

    // Verify passport status updates to RECOMMENDED FOR CERTIFICATION
    const updatedPassport = await fetch(`${BASE_URL}/api/rpl/worker/passport`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(updatedPassport.passportStatus, 'RECOMMENDED FOR CERTIFICATION');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 3 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
