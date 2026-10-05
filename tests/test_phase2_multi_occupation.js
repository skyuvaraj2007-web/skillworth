const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runMultiOccupationRplTests() {
  console.log('================================================================');
  console.log('  SKILLWORTH PHASE 2: MULTI-OCCUPATION RPL VERIFICATION SUITE');
  console.log('  Testing Data-Driven Architecture Across Trades & Security Rules');
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

  // 1. Get Assessor Token
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

  // -------------------------------------------------------------
  // TEST 1: WORKER 1 (ELECTRICIAN EXPERIENCE -> QP-ELE-Q1401)
  // -------------------------------------------------------------
  let worker1Token = null;
  let worker1AsmId = null;

  await test('TEST 1.1: Register Worker 1 (Electrician candidate)', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `electrician_${Date.now()}@worker.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'K. Rajendran',
        phone: '9840112233'
      })
    }).then(r => r.json());

    assert.strictEqual(regRes.success, true);
    worker1Token = regRes.token;
  });

  await test('TEST 1.2: Worker 1 declares electrical experience and maps to QP-ELE-Q1401', async () => {
    const decRes = await fetch(`${BASE_URL}/api/rpl/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        experiences: [
          {
            occupation: 'Electrician',
            jobTitle: 'Field Wireman',
            sector: 'Electronics & Electrical',
            years: 7,
            tasks: 'Conduit laying, DB box wiring, MCB installation, earthing pit verification',
            tools: 'Wire stripper, neon tester, multimeter, Megger'
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(decRes.success, true);
    assert.strictEqual(decRes.declaration.yearsOfExperience, 7);
    assert(decRes.aiAnalysis.suggestedTrade.includes('Electrician'));

    // Start assessment
    const startRes = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        qpId: 'QP-ELE-Q1401',
        declarationId: decRes.declaration.id
      })
    }).then(r => r.json());

    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.assessment.trade, 'Electrician');
    worker1AsmId = startRes.assessment.id;
  });

  await test('TEST 1.3: Complete Worker 1 evaluation using universal engine', async () => {
    // Assessor scores checklist
    const scoreRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}/checklist-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        scores: { 'chk_1_1': 3, 'chk_1_2': 3, 'chk_2_1': 4 }
      })
    }).then(r => r.json());
    assert.strictEqual(scoreRes.success, true);

    // Assessor final decision
    const decRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        decision: 'RECOMMENDED_FOR_CERTIFICATION',
        remarks: 'Candidate demonstrates solid wiring tradecraft and zero-energy safety protocol.'
      })
    }).then(r => r.json());

    assert.strictEqual(decRes.success, true);
    assert.strictEqual(decRes.assessment.status, 'COMPLETED');
    assert.strictEqual(decRes.assessment.finalRecommendation, 'RECOMMENDED_FOR_CERTIFICATION');
  });

  // -------------------------------------------------------------
  // TEST 2: WORKER 2 (CARPENTER EXPERIENCE -> QP-CON-Q0103)
  // SAME ASSESSMENT ENGINE, DIFFERENT TRADE DATA
  // -------------------------------------------------------------
  let worker2Token = null;
  let worker2AsmId = null;

  await test('TEST 2.1: Register Worker 2 (Carpenter candidate)', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `carpenter_${Date.now()}@worker.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'M. Selvam',
        phone: '9840445566'
      })
    }).then(r => r.json());

    assert.strictEqual(regRes.success, true);
    worker2Token = regRes.token;
  });

  await test('TEST 2.2: Worker 2 declares carpentry experience and maps to QP-CON-Q0103', async () => {
    const decRes = await fetch(`${BASE_URL}/api/rpl/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker2Token}`
      },
      body: JSON.stringify({
        experiences: [
          {
            occupation: 'General Carpenter',
            jobTitle: 'Joinery Craftsman',
            sector: 'Construction',
            years: 6,
            tasks: 'Timber sizing, try-square marking, mortise and tenon joinery, rebate cutting',
            tools: 'Chisels, jack plane, circular saw, bar clamps, measuring tape'
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(decRes.success, true);
    assert(decRes.aiAnalysis.suggestedTrade.includes('Carpenter'));

    // Start assessment with Carpenter QP
    const startRes = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker2Token}`
      },
      body: JSON.stringify({
        qpId: 'QP-CON-Q0103',
        declarationId: decRes.declaration.id
      })
    }).then(r => r.json());

    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.assessment.trade, 'General Carpenter');
    assert.strictEqual(startRes.assessment.qpCode, 'CON/Q0103');
    worker2AsmId = startRes.assessment.id;
  });

  await test('TEST 2.3: Evaluate Carpenter on the same generic engine with trade-specific rubric', async () => {
    const detailsRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker2AsmId}`, {
      headers: { 'Authorization': `Bearer ${assessorToken}` }
    }).then(r => r.json());

    assert.strictEqual(detailsRes.success, true);
    assert.strictEqual(detailsRes.assessment.trade, 'General Carpenter');
    // Verify carpenter competencies loaded dynamically
    assert(detailsRes.assessment.competencies.some(c => c.code === 'CON/N0111'));
    assert(detailsRes.assessment.competencies.some(c => c.code === 'CON/N0112'));

    // Assessor scores carpenter checklist
    const chkId = detailsRes.assessment.checklists[0].id;
    const scoreRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker2AsmId}/checklist-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        scores: { [chkId]: 4 }
      })
    }).then(r => r.json());
    assert.strictEqual(scoreRes.success, true);
    assert(scoreRes.assessment.totalScore > 0);

    // Final decision
    const decRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker2AsmId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        decision: 'RECOMMENDED_FOR_CERTIFICATION',
        remarks: 'Candidate demonstrated square mortise and tenon joinery within 0.5mm tolerance.'
      })
    }).then(r => r.json());

    assert.strictEqual(decRes.success, true);
    assert.strictEqual(decRes.assessment.trade, 'General Carpenter');
  });

  // -------------------------------------------------------------
  // TEST 3: WORKER WITH MULTIPLE WORK EXPERIENCES ACROSS TRADES
  // -------------------------------------------------------------
  await test('TEST 3: Multi-Occupation Worker suggests multiple viable pathways', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/experience/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        declarationText: 'I worked 4 years repairing two-wheelers and motorcycles doing engine service and brake work, and also 3 years doing plumbing pipe joints.',
        structuredFields: {
          experiences: [
            {
              occupation: 'Automotive Mechanic',
              jobTitle: 'Two-Wheeler Service Technician',
              sector: 'Automotive',
              years: 4,
              tasks: 'Engine oil change, brake shoe replacement, valve tappet adjustment',
              tools: 'Feeler gauge, socket set, torque wrench'
            },
            {
              occupation: 'General Plumber',
              jobTitle: 'Plumber',
              sector: 'Plumbing',
              years: 3,
              tasks: 'CPVC pipe solvent joining, P-trap installation, pressure testing',
              tools: 'Pipe wrench, hacksaw, PTFE tape'
            }
          ]
        }
      })
    }).then(r => r.json());

    assert.strictEqual(res.success, true);
    assert(Array.isArray(res.suggestedPathways));
    assert(res.suggestedPathways.length >= 2, 'Should suggest multiple pathways');
    // Should contain Automotive or Plumbing in top pathways
    const trades = res.suggestedPathways.map(p => p.qualificationPack.trade);
    assert(trades.some(t => t.includes('Automotive') || t.includes('Two-Wheeler')));
    assert(trades.some(t => t.includes('Plumber')));
  });

  // -------------------------------------------------------------
  // TEST 4: MANUAL WORKFLOW FALLBACK (AI BYPASS / UNAVAILABLE)
  // -------------------------------------------------------------
  await test('TEST 4: Manual pathway selection works without AI intervention', async () => {
    // Worker selects QP-CSC-Q0204 (Welder) directly from directory
    const startRes = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        qpId: 'QP-CSC-Q0204', // Manual welder selection
        declarationId: null
      })
    }).then(r => r.json());

    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.assessment.trade, 'Manual Metal Arc Welder (MMAW / SMAW)');
    assert(startRes.assessment.competencies.some(c => c.code === 'CSC/N0204'));
  });

  // -------------------------------------------------------------
  // TEST 5: OFFLINE SAVE, RECONNECT & CONFLICT HANDLING
  // -------------------------------------------------------------
  await test('TEST 5.1: Offline evaluation sync succeeds when online', async () => {
    const syncRes = await fetch(`${BASE_URL}/api/rpl/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        clientTimestamp: new Date().toISOString(),
        offlineRecords: [
          {
            assessmentId: worker1AsmId,
            data: { assessorFinalRemarks: 'Verified during offline field inspection.' }
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(syncRes.success, true);
    assert.strictEqual(syncRes.syncedCount, 1);
    assert.strictEqual(syncRes.conflicts.length, 0);
  });

  await test('TEST 5.2: Sync conflict detection when server record is newer', async () => {
    const conflictRes = await fetch(`${BASE_URL}/api/rpl/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        clientTimestamp: '2020-01-01T00:00:00.000Z', // Outdated timestamp
        offlineRecords: [
          {
            assessmentId: worker1AsmId,
            data: { assessorFinalRemarks: 'Outdated local overwrite.' }
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(conflictRes.success, true);
    assert.strictEqual(conflictRes.conflicts.length, 1);
    assert(conflictRes.conflicts[0].reason.includes('newer than client'));
  });

  // -------------------------------------------------------------
  // TEST 6: HUMAN ASSESSOR OVERRIDE AUDIT LOGGING
  // -------------------------------------------------------------
  await test('TEST 6: Assessor AI override records mandatory reason in audit trail', async () => {
    const overrideReason = 'Candidate demonstrated exceptional joint fit speed surpassing AI telemetry.';
    await fetch(`${BASE_URL}/api/rpl/assessment/${worker2AsmId}/checklist-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        scores: { 'chk_carp_1_1': 4 },
        acceptedAi: { 'chk_carp_1_1': false },
        overrideReason: { 'chk_carp_1_1': overrideReason }
      })
    });

    const reportRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker2AsmId}/report`).then(r => r.json());
    assert.strictEqual(reportRes.success, true);
    assert(reportRes.report.auditTrail.length > 0);
    const hasOverrideLog = reportRes.report.auditTrail.some(l => l.details && l.details.includes('AI Overrides'));
    assert(hasOverrideLog, 'Audit trail must log AI override activity');
  });

  // -------------------------------------------------------------
  // TEST 7: CONSISTENCY ANALYTICS TRANSPARENCY
  // -------------------------------------------------------------
  await test('TEST 7: Consistency analytics does not fabricate production numbers', async () => {
    const analytics = await fetch(`${BASE_URL}/api/rpl/analytics/assessor-consistency`).then(r => r.json());
    assert.strictEqual(analytics.success, true);
    // Either isSimulated with notice OR empirical with sample size
    if (analytics.isSimulated) {
      assert(analytics.datasetNotice.includes('Calculations require >= 5'));
      assert(analytics.datasetLabel.includes('Prototype'));
    } else {
      assert(analytics.totalAssessmentsEvaluated >= 5);
      assert(analytics.datasetLabel.includes('Empirical'));
    }
  });

  // -------------------------------------------------------------
  // TEST 8: SECURITY & ROLE AUTHORIZATION CHECKS
  // -------------------------------------------------------------
  await test('TEST 8.1: Candidate cannot view another candidate assessment dossier (403)', async () => {
    // Worker 2 tries to view Worker 1's assessment
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}`, {
      headers: { 'Authorization': `Bearer ${worker2Token}` }
    });
    assert.strictEqual(res.status, 403);
  });

  await test('TEST 8.2: Candidate cannot score checklist or submit decisions (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({ decision: 'RECOMMENDED_FOR_CERTIFICATION', remarks: 'Self approval' })
    });
    assert.strictEqual(res.status, 403);
  });

  await test('TEST 8.3: Candidate cannot assign assessor or schedule assessment (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({ assessorId: 'usr_fake' })
    });
    assert.strictEqual(res.status, 403);
  });

  // -------------------------------------------------------------
  // TEST 9: INSTITUTION ASSESSMENT SCHEDULING & QP MANAGEMENT
  // -------------------------------------------------------------
  await test('TEST 9.1: Institution schedules assessment date & location', async () => {
    const schedRes = await fetch(`${BASE_URL}/api/rpl/assessment/${worker1AsmId}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        date: '2026-10-25',
        time: '10:00 AM - 02:00 PM',
        location: 'Chennai Skill Training Hub - Lab 3',
        assessorName: 'Dr. S. Meenakshi Sundaram'
      })
    }).then(r => r.json());

    assert.strictEqual(schedRes.success, true);
    assert.strictEqual(schedRes.assessment.status, 'ASSESSMENT_SCHEDULED');
    assert.strictEqual(schedRes.assessment.scheduledDate, '2026-10-25');
  });

  await test('TEST 9.2: Institution dynamically registers new Qualification Pack (Data-Driven)', async () => {
    const qpRes = await fetch(`${BASE_URL}/api/rpl/qualification-packs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assessorToken}`
      },
      body: JSON.stringify({
        trade: 'Textile Power Loom Operator',
        qpCode: 'TSC/Q2201',
        sector: 'Textiles & Handlooms',
        nsqfLevel: 4,
        description: 'Operation of high-speed rapier and air-jet power looms, weft insertion, and fabric defect inspection.',
        keywords: ['textile', 'loom', 'weft', 'warp', 'shuttle', 'fabric', 'yarn'],
        toolsRequired: ['Reed hook', 'Weft feeder', 'Yarn tension meter', 'Pick glass']
      })
    }).then(r => r.json());

    assert.strictEqual(qpRes.success, true);
    assert.strictEqual(qpRes.qualificationPack.trade, 'Textile Power Loom Operator');

    // Verify it is immediately in the QP directory
    const listRes = await fetch(`${BASE_URL}/api/rpl/qualification-packs`).then(r => r.json());
    assert(listRes.qualificationPacks.some(qp => qp.qpCode === 'TSC/Q2201'));
  });

  console.log('\n================================================================');
  console.log(`  PHASE 2 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) process.exit(1);
}

runMultiOccupationRplTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
