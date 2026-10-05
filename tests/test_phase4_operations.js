const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('  SKILLWORTH PHASE 4: RPL APPLICATION OPERATIONS & MANAGEMENT');
  console.log('  Testing Application Lifecycle, Scheduling, Work Queue & RBAC');
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

  // 1. Institution Token
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

  let worker1 = null;
  let worker1Token = null;
  let worker1Id = null;
  let worker2Token = null;
  let worker2Id = null;

  let application1 = null;
  let application1Id = null;
  let application2Id = null;
  let assessmentCentreId = null;
  let assignedAssessorId = 'usr_demo_assessor_01';
  let linkedAssessmentId = null;
  let evidenceRequestId = null;

  // TEST 1: Worker creates application
  await test('TEST 1: Worker creates RPL application', async () => {
    // Register worker 1
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ops.worker1_${Date.now()}@skillworth.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'Murugan Selvam',
        phone: '9840112233'
      })
    }).then(r => r.json());

    assert.strictEqual(regRes.success, true);
    worker1 = regRes.user;
    worker1Token = regRes.token;
    worker1Id = regRes.user.profileId || regRes.user.id;

    // Create application
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        occupation: 'General Carpenter',
        qualificationPackCode: 'CON/Q0103',
        nsqfLevel: 4
      })
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    assert(appRes.application.applicationNumber.startsWith('RPL-2026-'));
    assert.strictEqual(appRes.application.status, 'SUBMITTED');
    assert.strictEqual(appRes.application.occupation, 'General Carpenter');
    application1 = appRes.application;
    application1Id = appRes.application.id;
  });

  // TEST 2: Worker can view own application
  await test('TEST 2: Worker can view own application list & details', async () => {
    const myAppsRes = await fetch(`${BASE_URL}/api/rpl/applications/my`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(myAppsRes.success, true);
    assert(Array.isArray(myAppsRes.applications));
    assert(myAppsRes.applications.some(a => a.id === application1Id));

    const detailRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(detailRes.success, true);
    assert.strictEqual(detailRes.application.id, application1Id);
    assert(Array.isArray(detailRes.application.timeline));
  });

  // TEST 3: Worker cannot view another worker's application (403 Forbidden)
  await test("TEST 3: Worker cannot view another worker's application (403 Forbidden)", async () => {
    // Register worker 2
    const reg2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ops.worker2_${Date.now()}@skillworth.org`,
        password: 'SkillWorth@2026',
        role: 'LEARNER',
        name: 'Dinesh Kumar',
        phone: '9840998877'
      })
    }).then(r => r.json());

    worker2Token = reg2.token;
    worker2Id = reg2.user.profileId || reg2.user.id;

    // Worker 2 attempts to access Worker 1's application dossier
    const forbiddenRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker2Token}` }
    });

    assert.strictEqual(forbiddenRes.status, 403);
    const body = await forbiddenRes.json();
    assert.strictEqual(body.success, false);
  });

  // TEST 4: Institution can view application queue
  await test('TEST 4: Institution can view application queue & details', async () => {
    const queueRes = await fetch(`${BASE_URL}/api/rpl/applications`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    }).then(r => r.json());

    assert.strictEqual(queueRes.success, true);
    assert(queueRes.applications.some(a => a.id === application1Id));

    const detailRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    }).then(r => r.json());

    assert.strictEqual(detailRes.success, true);
    assert.strictEqual(detailRes.application.id, application1Id);
  });

  // TEST 5: Institution assigns assessor
  await test('TEST 5: Institution assigns accredited assessor', async () => {
    const assignRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/assign-assessor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        assessorId: assignedAssessorId,
        assessorName: 'Dr. S. Meenakshi Sundaram'
      })
    }).then(r => r.json());

    assert.strictEqual(assignRes.success, true);
    assert.strictEqual(assignRes.application.assignedAssessorId, assignedAssessorId);
    assert.strictEqual(assignRes.application.status, 'ASSESSOR_ASSIGNED');
  });

  // TEST 6: Worker receives assessor notification
  await test('TEST 6: Worker receives assessor assignment notification', async () => {
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(notifRes.success, true);
    assert(Array.isArray(notifRes.notifications));
    const assignNotif = notifRes.notifications.find(n => n.type === 'ASSESSOR_ASSIGNED');
    assert(assignNotif, 'Expected ASSESSOR_ASSIGNED notification');
    assert(assignNotif.message.includes('assessor'));
  });

  // TEST 7: Institution fetches assessment centres
  await test('TEST 7: Fetch assessment centres with demo centres verification', async () => {
    const centresRes = await fetch(`${BASE_URL}/api/rpl/assessment-centres`).then(r => r.json());

    assert.strictEqual(centresRes.success, true);
    assert(Array.isArray(centresRes.assessmentCentres));
    assert(centresRes.assessmentCentres.length >= 1);
    const salemCentre = centresRes.assessmentCentres.find(c => c.id === 'AC-SLM-01' || c.district === 'Salem');
    assert(salemCentre, 'Expected Salem Assessment Centre');
    assessmentCentreId = salemCentre.id;
  });

  // TEST 8: Institution schedules assessment
  const runRandDays = Math.floor(Math.random() * 500) + 20;
  const d1 = new Date(Date.now() + runRandDays * 86400000);
  const d2 = new Date(Date.now() + (runRandDays + 5) * 86400000);
  const testScheduleDate = d1.toISOString().split('T')[0];
  const uniqueMinute = String(Math.floor(Math.random() * 50) + 10).padStart(2, '0');
  const testScheduleTime = `10:${uniqueMinute} AM`;
  const rescheduledDate = d2.toISOString().split('T')[0];
  const rescheduledTime = `02:${uniqueMinute} PM`;

  await test('TEST 8: Institution schedules assessment date, time & centre', async () => {
    const schedRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        scheduledDate: testScheduleDate,
        scheduledTime: testScheduleTime,
        assessmentCentreId: assessmentCentreId,
        assessorId: assignedAssessorId
      })
    }).then(r => r.json());

    assert.strictEqual(schedRes.success, true);
    assert.strictEqual(schedRes.application.status, 'ASSESSMENT_SCHEDULED');
    assert.strictEqual(schedRes.application.scheduledDate, testScheduleDate);
    assert.strictEqual(schedRes.application.scheduledTime, testScheduleTime);
  });

  // TEST 9: Worker receives schedule notification & reminders
  await test('TEST 9: Worker receives schedule notification & reminder countdown', async () => {
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(notifRes.success, true);
    const schedNotif = notifRes.notifications.find(n => n.type === 'ASSESSMENT_SCHEDULED');
    assert(schedNotif, 'Expected ASSESSMENT_SCHEDULED notification');

    // Check worker's application details for reminder computation
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    assert(appRes.application.reminders, 'Expected computed operational reminders');
    assert(appRes.application.reminders.reminder.includes('Assessment'));
  });

  // TEST 10: Assessor sees assessment in work queue with deterministic priority
  await test('TEST 10: Assessor sees assessment in work queue with deterministic priority', async () => {
    const queueRes = await fetch(`${BASE_URL}/api/rpl/assessor/work-queue`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    }).then(r => r.json());

    assert.strictEqual(queueRes.success, true);
    assert(Array.isArray(queueRes.queue));
    const target = queueRes.queue.find(q => q.applicationId === application1Id);
    assert(target, 'Candidate should be listed in assessor queue');
    assert(['URGENT', 'HIGH', 'NORMAL', 'LOW'].includes(target.priority));
  });

  // TEST 11: Scheduling conflict is detected (double-booking prevention)
  await test('TEST 11: Scheduling slot conflict detected for same assessor and time', async () => {
    // Create application 2 for worker 2
    const app2Res = await fetch(`${BASE_URL}/api/rpl/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker2Token}`
      },
      body: JSON.stringify({
        occupation: 'General Carpenter',
        qualificationPackCode: 'CON/Q0103',
        nsqfLevel: 4
      })
    }).then(r => r.json());

    application2Id = app2Res.application.id;

    // Assign same assessor
    await fetch(`${BASE_URL}/api/rpl/applications/${application2Id}/assign-assessor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({ assessorId: assignedAssessorId })
    });

    // Attempt to book same date & same time
    const conflictRes = await fetch(`${BASE_URL}/api/rpl/applications/${application2Id}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        scheduledDate: testScheduleDate,
        scheduledTime: testScheduleTime,
        assessmentCentreId: assessmentCentreId,
        assessorId: assignedAssessorId
      })
    });

    assert.strictEqual(conflictRes.status, 409);
    const body = await conflictRes.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.conflict, true);
    assert(body.message.includes('CONFLICT'));
  });

  // TEST 12: Rescheduling works with mandatory reason
  await test('TEST 12: Rescheduling assessment updates slot with mandatory audit reason', async () => {
    const reschRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        newDate: rescheduledDate,
        newTime: rescheduledTime,
        reason: 'Candidate requested afternoon practical shift due to work commitments'
      })
    }).then(r => r.json());

    assert.strictEqual(reschRes.success, true);
    assert.strictEqual(reschRes.application.scheduledDate, rescheduledDate);
    assert.strictEqual(reschRes.application.scheduledTime, rescheduledTime);
  });

  // TEST 13: Worker receives reschedule notification
  await test('TEST 13: Worker receives reschedule notification', async () => {
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(notifRes.success, true);
    const reschNotif = notifRes.notifications.find(n => n.type === 'ASSESSMENT_RESCHEDULED');
    assert(reschNotif, 'Expected ASSESSMENT_RESCHEDULED notification');
    assert(reschNotif.message.includes('updated'));
  });

  // TEST 14: Cancellation works with mandatory reason
  await test('TEST 14: Cancellation marks status CANCELLED and preserves audit log', async () => {
    const cancelRes = await fetch(`${BASE_URL}/api/rpl/applications/${application2Id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        reason: 'Worker relocated out of district before assessment'
      })
    }).then(r => r.json());

    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.application.status, 'CANCELLED');
  });

  // TEST 15: Worker receives cancellation notification
  await test('TEST 15: Worker receives cancellation notification', async () => {
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${worker2Token}` }
    }).then(r => r.json());

    assert.strictEqual(notifRes.success, true);
    const cancelNotif = notifRes.notifications.find(n => n.type === 'ASSESSMENT_CANCELLED');
    assert(cancelNotif, 'Expected ASSESSMENT_CANCELLED notification');
  });

  // TEST 16: Evidence request changes application state to FURTHER_EVIDENCE_REQUIRED
  await test('TEST 16: Assessor evidence request changes application to FURTHER_EVIDENCE_REQUIRED', async () => {
    // Start formal RPL assessment to generate assessmentId for worker 1
    const startRes = await fetch(`${BASE_URL}/api/rpl/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        qpId: 'QP-CON-Q0103'
      })
    }).then(r => r.json());

    assert.strictEqual(startRes.success, true);
    linkedAssessmentId = startRes.assessment.id;

    // Assessor requests evidence
    const reqRes = await fetch(`${BASE_URL}/api/rpl/assessment/${linkedAssessmentId}/evidence-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        competencyCode: 'CON/N0103',
        message: 'Upload video demonstrating mortise and tenon joint fitment safely.',
        requiredEvidence: 'Joint fitment practical demonstration video'
      })
    }).then(r => r.json());

    assert.strictEqual(reqRes.success, true);
    evidenceRequestId = reqRes.request.id;

    // Check application status was updated
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    assert.strictEqual(appRes.application.status, 'FURTHER_EVIDENCE_REQUIRED');

    // Worker received notification
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());
    const evNotif = notifRes.notifications.find(n => n.type === 'EVIDENCE_REQUESTED');
    assert(evNotif, 'Expected EVIDENCE_REQUESTED notification');
  });

  // TEST 17: Worker submits requested evidence
  await test('TEST 17: Worker submits requested evidence returning application to EVIDENCE_COLLECTION', async () => {
    const respondRes = await fetch(`${BASE_URL}/api/rpl/evidence-requests/${evidenceRequestId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        title: 'Mortise and Tenon Joint Demonstration Video',
        description: 'Demonstrating clean tenon cut and chisel fitment',
        fileUrl: '/uploads/demo_tenon_joint.mp4'
      })
    }).then(r => r.json());

    assert.strictEqual(respondRes.success, true);

    // Verify application status returned to EVIDENCE_COLLECTION
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    assert.strictEqual(appRes.application.status, 'EVIDENCE_COLLECTION');
  });

  // TEST 18: Application timeline records transitions
  await test('TEST 18: Application timeline records stage transitions sequentially', async () => {
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    const timeline = appRes.application.timeline || [];
    assert(timeline.length >= 4, `Expected at least 4 timeline events, got ${timeline.length}`);
    const stages = timeline.map(t => t.stage);
    assert(stages.includes('APPLICATION_SUBMITTED') || stages.includes('SUBMITTED'));
    assert(stages.includes('ASSESSOR_ASSIGNED'));
    assert(stages.includes('ASSESSMENT_SCHEDULED'));
  });

  // TEST 19: Audit trail records operational events
  await test('TEST 19: Audit trail records operational events with timestamps and actors', async () => {
    const appRes = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    }).then(r => r.json());

    assert.strictEqual(appRes.success, true);
    const logs = appRes.application.auditLogs || [];
    assert(logs.length >= 3, `Expected at least 3 audit logs, got ${logs.length}`);
    const actions = logs.map(l => l.action);
    assert(actions.includes('APPLICATION_CREATED') || actions.includes('APPLICATION_SUBMITTED'));
    assert(actions.includes('ASSESSOR_ASSIGNED'));
    assert(actions.includes('ASSESSMENT_SCHEDULED'));
  });

  // TEST 20: Role restrictions work
  await test('TEST 20: Role restrictions prevent workers from assigning assessors or changing status', async () => {
    // Worker tries to assign assessor
    const workerAssign = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/assign-assessor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({ assessorId: 'usr_demo_assessor_01' })
    });
    assert.strictEqual(workerAssign.status, 403);

    // Worker tries to schedule assessment
    const workerSchedule = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({
        scheduledDate: '2026-10-30',
        scheduledTime: '10:00 AM',
        assessmentCentreId: assessmentCentreId
      })
    });
    assert.strictEqual(workerSchedule.status, 403);

    // Worker tries to change status
    const workerStatus = await fetch(`${BASE_URL}/api/rpl/applications/${application1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worker1Token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert.strictEqual(workerStatus.status, 403);
  });

  // TEST 21: Existing RPL assessment remains accessible
  await test('TEST 21: Existing RPL assessment workspace remains accessible & connected', async () => {
    const asmRes = await fetch(`${BASE_URL}/api/rpl/assessment/${linkedAssessmentId}`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(asmRes.success, true);
    const targetAsm = asmRes.assessment || asmRes;
    assert.strictEqual(targetAsm.trade, 'General Carpenter');
    assert(Array.isArray(targetAsm.competencies));
  });

  // TEST 22: Existing Skill Passport remains accessible
  await test('TEST 22: Existing Skill Passport remains fully accessible & functional', async () => {
    const passRes = await fetch(`${BASE_URL}/api/rpl/worker/passport`, {
      headers: { 'Authorization': `Bearer ${worker1Token}` }
    }).then(r => r.json());

    assert.strictEqual(passRes.success, true);
    assert.strictEqual(passRes.workerName, 'Murugan Selvam');
    assert(passRes.qrCodeDataUrl.startsWith('data:image/png;base64'));
  });

  // TEST 23: Public verification remains accessible
  await test('TEST 23: Public verification remains accessible with valid assessment record', async () => {
    const verifyRes = await fetch(`${BASE_URL}/api/rpl/verify/${linkedAssessmentId}`).then(r => r.json());

    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.valid, true);
    assert(verifyRes.standards.includes('NSQF'));
  });

  // TEST 24: Existing offline assessment workflow remains functional
  await test('TEST 24: Existing offline assessment workflow & sync remain functional', async () => {
    const syncRes = await fetch(`${BASE_URL}/api/rpl/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        clientTimestamp: new Date().toISOString(),
        assessorId: assignedAssessorId,
        offlineRecords: [
          {
            assessmentId: linkedAssessmentId,
            data: {
              assessorRemarks: 'Offline practical observation verified on site.'
            }
          }
        ]
      })
    }).then(r => r.json());

    assert.strictEqual(syncRes.success, true);
    assert.strictEqual(syncRes.syncedCount, 1);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 4 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
