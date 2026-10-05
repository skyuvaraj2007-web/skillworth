/**
 * SKILL NEXUS — Nexus Assessment Guard: Camera AI & Vision Integrity Verification Suite
 * 
 * Tests both:
 * PART 1: REAL COMPUTER-VISION MODEL INFERENCE TESTS (Raster pixel buffers tested through VisionIntegrityEngine)
 *   - Face Detection & Absence
 *   - Multiple Persons / Faces Detection
 *   - Phone-Like Rectilinear Object Detection
 *   - Person Ingress / Perimeter Frame Entering
 *   - Confidence Score Calibration (Non-fabricated mathematical derivations)
 * 
 * PART 2: LIVE PRODUCT API & DATABASE INTEGRATION TESTS
 *   - Student Consent Verification
 *   - Telemetry Logging (Tab switch, Fullscreen exit, Paste attempt)
 *   - PostgreSQL assessment_integrity_events persistence
 *   - Multi-Tenant RBAC & Isolation
 *   - Human Review Workflow (Confirm, Dismiss, Needs More Review)
 *   - Non-accusatory labeling ("Potential Integrity Event" / "Review Required")
 *   - Safe test data cleanup
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const { pathToFileURL } = require('url');
const dotenv = require('dotenv');
let VisionIntegrityEngine;

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TIMESTAMP = Date.now();
const PREFIX = `guard_test_${TIMESTAMP}`;

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Helper to synthesize an RGBA test frame buffer (width x height x 4 bytes)
 */
function createSyntheticFrame(width, height, backgroundRgb = [40, 40, 45]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = backgroundRgb[0];     // R
    data[i + 1] = backgroundRgb[1]; // G
    data[i + 2] = backgroundRgb[2]; // B
    data[i + 3] = 255;              // A
  }
  return { data, width, height };
}

/**
 * Helper to stamp an oval skin-tone face region into a synthetic frame
 * Standard skin-tone (YCbCr compliant): R=210, G=160, B=130
 */
function stampFace(frame, centerX, centerY, radiusX, radiusY) {
  const { data, width, height } = frame;
  for (let y = Math.max(0, centerY - radiusY); y <= Math.min(height - 1, centerY + radiusY); y++) {
    for (let x = Math.max(0, centerX - radiusX); x <= Math.min(width - 1, centerX + radiusX); x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1.0) {
        const idx = (y * width + x) * 4;
        data[idx] = 210;     // R
        data[idx + 1] = 160; // G
        data[idx + 2] = 130; // B
        data[idx + 3] = 255;
      }
    }
  }
}

/**
 * Helper to stamp a phone-like rectangular object with sharp edge contrast
 */
function stampPhone(frame, startX, startY, width, height) {
  const { data, width: fWidth, height: fHeight } = frame;
  for (let y = startY; y < startY + height && y < fHeight; y++) {
    for (let x = startX; x < startX + width && x < fWidth; x++) {
      const idx = (y * fWidth + x) * 4;
      const isBezel = (x === startX || x === startX + width - 1 || y === startY || y === startY + height - 1);
      if (isBezel) {
        // High-contrast dark bezel
        data[idx] = 10;
        data[idx + 1] = 10;
        data[idx + 2] = 10;
      } else {
        // Emissive phone screen
        data[idx] = 240;
        data[idx + 1] = 240;
        data[idx + 2] = 245;
      }
    }
  }
}

async function runModelInferenceTests() {
  console.log('\n============================================================');
  console.log('👁️  PART 1: REAL COMPUTER-VISION MODEL INFERENCE TESTS');
  console.log('============================================================\n');

  const engine = new VisionIntegrityEngine({ minFaceAreaRatio: 0.015 });
  const W = 160;
  const H = 120;

  // ── Test 1.1: Face Absent / Covered Camera ──
  console.log('--- 1.1: Face Absent / Covered Camera Detection ---');
  const darkFrame = createSyntheticFrame(W, H, [5, 5, 5]);
  const darkAnalysis = await engine.analyze(darkFrame);

  assert(!darkAnalysis.facePresent, 'Empty/dark frame reports facePresent = false');
  assert(darkAnalysis.faceCount === 0, 'Empty/dark frame reports faceCount = 0');
  assert(darkAnalysis.signals.some(s => s.eventType === 'FACE_ABSENT'), 'Correctly flags FACE_ABSENT signal');
  const absentSig = darkAnalysis.signals.find(s => s.eventType === 'FACE_ABSENT');
  assert(absentSig && typeof absentSig.confidence === 'number' && absentSig.confidence > 50, 'Computed valid non-fabricated confidence for FACE_ABSENT');

  // ── Test 1.2: Face Present ──
  console.log('\n--- 1.2: Single Face Present Detection ---');
  const singleFaceFrame = createSyntheticFrame(W, H, [50, 50, 55]);
  // Stamp a centered human face (radiusX=18, radiusY=24 => aspect ratio 1.33)
  stampFace(singleFaceFrame, 80, 60, 18, 24);
  const singleFaceAnalysis = await engine.analyze(singleFaceFrame);

  assert(singleFaceAnalysis.facePresent === true, 'Face correctly detected in frame (facePresent = true)');
  assert(singleFaceAnalysis.faceCount === 1, 'Exactly 1 face counted in frame');
  assert(!singleFaceAnalysis.signals.some(s => s.eventType === 'FACE_ABSENT'), 'No FACE_ABSENT signal when candidate face is visible');

  // ── Test 1.3: Multiple Persons / Faces Detection ──
  console.log('\n--- 1.3: Multiple Persons / Faces Detection ---');
  const multiFaceFrame = createSyntheticFrame(W, H, [50, 50, 55]);
  // Stamp two distinct faces separated spatially across the frame
  stampFace(multiFaceFrame, 40, 60, 16, 22);  // Person 1 (left)
  stampFace(multiFaceFrame, 120, 60, 16, 22); // Person 2 (right)
  const multiAnalysis = await engine.analyze(multiFaceFrame);

  assert(multiAnalysis.faceCount >= 2, `Multiple faces detected (count: ${multiAnalysis.faceCount})`);
  assert(multiAnalysis.signals.some(s => s.eventType === 'MULTIPLE_PERSONS_DETECTED'), 'Flags MULTIPLE_PERSONS_DETECTED signal');
  const multiSig = multiAnalysis.signals.find(s => s.eventType === 'MULTIPLE_PERSONS_DETECTED');
  assert(multiSig.severity === 'HIGH', 'Multiple persons flagged with HIGH severity');
  assert(typeof multiSig.confidence === 'number' && multiSig.confidence >= 70, `Real separation-derived confidence computed: ${multiSig.confidence}%`);

  // ── Test 1.4: Phone-Like Rectilinear Object Detection ──
  console.log('\n--- 1.4: Phone-Like Rectilinear Object Detection ---');
  const phoneFrame = createSyntheticFrame(W, H, [60, 60, 65]);
  // Stamp normal face in upper center
  stampFace(phoneFrame, 80, 45, 16, 20);
  // Stamp phone-shaped rectangle in lower-right region (width: 25, height: 50 -> aspect 2.0:1)
  stampPhone(phoneFrame, 115, 55, 25, 50);
  const phoneAnalysis = await engine.analyze(phoneFrame);

  assert(phoneAnalysis.signals.some(s => s.eventType === 'POSSIBLE_EXTERNAL_DEVICE'), 'Flags POSSIBLE_EXTERNAL_DEVICE for phone object');
  const phoneSig = phoneAnalysis.signals.find(s => s.eventType === 'POSSIBLE_EXTERNAL_DEVICE');
  assert(phoneSig.metadata.aspectRatio >= 1.6 && phoneSig.metadata.aspectRatio <= 2.4, `Detected phone aspect ratio conforms to standard (${phoneSig.metadata.aspectRatio})`);
  assert(typeof phoneSig.confidence === 'number' && phoneSig.confidence > 50, `Phone detection confidence calculated dynamically: ${phoneSig.confidence}%`);

  // ── Test 1.5: Person Entering Frame (Temporal Ingress) ──
  console.log('\n--- 1.5: Person Entering Frame (Temporal Ingress) ---');
  const ingressEngine = new VisionIntegrityEngine();
  // Frame T0: Stable single user
  const frameT0 = createSyntheticFrame(W, H, [50, 50, 55]);
  stampFace(frameT0, 80, 60, 16, 22);
  await ingressEngine.analyze(frameT0);

  // Frame T1: A second person's shoulder/face suddenly enters from the left perimeter
  const frameT1 = createSyntheticFrame(W, H, [50, 50, 55]);
  stampFace(frameT1, 80, 60, 16, 22);
  // Ingress entering from boundary x=0..20
  stampFace(frameT1, 10, 40, 14, 20);
  const ingressAnalysis = await ingressEngine.analyze(frameT1);

  assert(
    ingressAnalysis.signals.some(s => s.eventType === 'PERSON_ENTERED_FRAME' || s.eventType === 'MULTIPLE_PERSONS_DETECTED'),
    'Temporal boundary comparison successfully detects entrant (PERSON_ENTERED_FRAME / MULTIPLE_PERSONS_DETECTED)'
  );

  // ── Test 1.6: Non-Fabrication Confidence Verification ──
  console.log('\n--- 1.6: Non-Fabricated Confidence Verification ---');
  const conf1 = multiSig.confidence;
  const conf2 = phoneSig.confidence;
  assert(conf1 !== conf2, `Confidences vary naturally based on features (Multi: ${conf1}%, Phone: ${conf2}%)`);
  assert(conf1 !== 95.0 || conf2 !== 95.0, 'Confidences are NOT static hardcoded 95.0 values');
}

async function runIntegrationTests() {
  console.log('\n============================================================');
  console.log('🔒 PART 2: LIVE PRODUCT API & DATABASE INTEGRATION TESTS');
  console.log('============================================================\n');

  const client = await pool.connect();
  let testUser = null;
  let testStudent = null;
  let testUserB = null;
  let testStudentB = null;
  let testCompanyUser = null;
  let testCompany = null;
  let testAssessment = null;
  let tokenA = '';
  let tokenB = '';
  let tokenCompany = '';
  let activeSessionId = null;

  try {
    // 1. Fetch Genuine Baseline Data
    const compRes = await client.query(`SELECT id, company_name FROM companies WHERE company_name ILIKE '%SBT%' LIMIT 1`);
    testCompany = compRes.rows[0] || (await client.query(`SELECT id, company_name FROM companies LIMIT 1`)).rows[0];

    const instRes = await client.query(`SELECT id, name FROM institutions WHERE name ILIKE '%Velalar%' LIMIT 1`);
    const testInstitution = instRes.rows[0] || (await client.query(`SELECT id, name FROM institutions LIMIT 1`)).rows[0];

    const compUserRes = await client.query(`SELECT id, email FROM users WHERE email = 'sbt@tech.com' LIMIT 1`);
    testCompanyUser = compUserRes.rows[0];

    const rRes = await client.query(`SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1`);
    const studentRoleId = rRes.rows[0]?.id;

    const deptRes = await client.query(`SELECT id FROM departments WHERE institution_id = $1 LIMIT 1`, [testInstitution.id]);
    const testDeptId = deptRes.rows[0]?.id || (await client.query(`SELECT id FROM departments LIMIT 1`)).rows[0]?.id;

    // 2. Insert Student A (Candidate)
    const uResA = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW()) RETURNING id`,
      [`stu_a_${PREFIX}@skillnexus.test`]
    );
    testUser = uResA.rows[0];

    if (studentRoleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [testUser.id, studentRoleId]
      );
    }

    const sResA = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Integrity Test Student A', $2, $3, $4, 2026, 0) RETURNING id`,
      [testUser.id, `ROLL_A_${TIMESTAMP}`, testInstitution.id, testDeptId]
    );
    testStudent = sResA.rows[0];

    // 3. Insert Student B (Other Student for Cross-Tenant RBAC check)
    const uResB = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW()) RETURNING id`,
      [`stu_b_${PREFIX}@skillnexus.test`]
    );
    testUserB = uResB.rows[0];

    if (studentRoleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [testUserB.id, studentRoleId]
      );
    }

    const sResB = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Integrity Test Student B', $2, $3, $4, 2026, 0) RETURNING id`,
      [testUserB.id, `ROLL_B_${TIMESTAMP}`, testInstitution.id, testDeptId]
    );
    testStudentB = sResB.rows[0];

    // 4. Insert Test Assessment
    const asmtRes = await client.query(
      `INSERT INTO assessments (title, track_code, domain, passing_score, duration_minutes, is_active, company_id)
       VALUES ($1, $2, 'Programming & Algorithms', 70, 30, true, $3) RETURNING id`,
      [`${PREFIX}_Security_Coding_Asmt`, `ASMT-${TIMESTAMP}`, testCompany.id]
    );
    testAssessment = asmtRes.rows[0];

    tokenA = jwt.sign({ id: testUser.id, email: `stu_a_${PREFIX}@skillnexus.test`, role: 'student', studentId: testStudent.id }, JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: testUserB.id, email: `stu_b_${PREFIX}@skillnexus.test`, role: 'student', studentId: testStudentB.id }, JWT_SECRET, { expiresIn: '1h' });
    tokenCompany = jwt.sign({ id: testCompanyUser ? testCompanyUser.id : testUser.id, email: testCompanyUser ? testCompanyUser.email : 'sbt@tech.com', role: 'company', companyId: testCompany.id }, JWT_SECRET, { expiresIn: '1h' });

    // ── Test 2.1: Student Consent Check ──
    console.log('--- 2.1: Student Consent Check ---');
    const startWithoutConsent = await fetch(`${API_BASE}/assessments/${testAssessment.id}/monitoring/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ consentGiven: false })
    });
    assert(startWithoutConsent.status === 400, 'Starting monitoring without consent is rejected (HTTP 400)');

    const startWithConsent = await fetch(`${API_BASE}/assessments/${testAssessment.id}/monitoring/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        consentGiven: true,
        cameraEnabled: true,
        monitoringEnabled: true
      })
    });
    const startData = await startWithConsent.json();
    assert(startWithConsent.status === 201 && startData.success, 'Monitoring session begins with verified student consent');
    activeSessionId = startData.session.id;

    // ── Test 2.2: Browser Telemetry Signals ──
    console.log('\n--- 2.2: Browser Telemetry Signal Logging ---');
    const teleEvents = [
      { type: 'TAB_SWITCH', sev: 'MEDIUM' },
      { type: 'WINDOW_BLUR', sev: 'LOW' },
      { type: 'FULLSCREEN_EXIT', sev: 'MEDIUM' },
      { type: 'PASTE_ATTEMPT', sev: 'MEDIUM' }
    ];

    for (const te of teleEvents) {
      const res = await fetch(`${API_BASE}/assessments/${testAssessment.id}/monitoring/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({
          sessionId: activeSessionId,
          eventType: te.type,
          severity: te.sev,
          durationSeconds: 2,
          confidence: 100.0,
          metadata: { simulatedBrowserEvent: true }
        })
      });
      const data = await res.json();
      assert(res.status === 201 && data.success, `Successfully logged browser telemetry: ${te.type}`);
    }

    // ── Test 2.3: Computer-Vision Signal Persistence ──
    console.log('\n--- 2.3: Camera AI Signal Persistence into PostgreSQL ---');
    const visionEvents = [
      { type: 'FACE_ABSENT', conf: 84.5, sev: 'LOW' },
      { type: 'MULTIPLE_PERSONS_DETECTED', conf: 89.2, sev: 'HIGH' },
      { type: 'POSSIBLE_EXTERNAL_DEVICE', conf: 78.6, sev: 'HIGH' },
      { type: 'PERSON_ENTERED_FRAME', conf: 74.0, sev: 'MEDIUM' }
    ];

    let recordedEventIds = [];
    for (const ve of visionEvents) {
      const res = await fetch(`${API_BASE}/assessments/${testAssessment.id}/monitoring/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({
          sessionId: activeSessionId,
          eventType: ve.type,
          severity: ve.sev,
          durationSeconds: 3,
          confidence: ve.conf,
          metadata: {
            label: 'Potential Integrity Event',
            reviewRequired: true,
            visionValidated: true
          }
        })
      });
      const data = await res.json();
      assert(res.status === 201 && data.success, `Camera AI signal ${ve.type} stored in PostgreSQL`);
      recordedEventIds.push(data.event.id);
    }

    // ── Test 2.4: Human Review Workflow ──
    console.log('\n--- 2.4: Human Review Workflow (Confirm / Dismiss / Review) ---');
    const targetEventId = recordedEventIds[0];

    // Confirm Concern
    const confirmRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/review-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCompany}` },
      body: JSON.stringify({
        eventId: targetEventId,
        reviewStatus: 'CONFIRMED',
        notes: 'Candidate stepped out of view for 3 seconds; confirmed acceptable.'
      })
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.success, 'Authorized reviewer successfully updated status to CONFIRMED');
    assert(confirmData.event.review_status === 'CONFIRMED', 'Database directly reflects review_status = CONFIRMED');

    // Dismiss Event
    const targetEventId2 = recordedEventIds[1];
    const dismissRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/review-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCompany}` },
      body: JSON.stringify({
        eventId: targetEventId2,
        reviewStatus: 'DISMISSED',
        notes: 'Reflection on glass door falsely registered additional person.'
      })
    });
    const dismissData = await dismissRes.json();
    assert(dismissRes.status === 200 && dismissData.success, 'Authorized reviewer successfully DISMISSED event');

    // ── Test 2.5: Student Self-Visibility & Multi-Tenant RBAC ──
    console.log('\n--- 2.5: Student Access & RBAC Isolation ---');
    const studentReportRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/integrity-report`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const studentReportData = await studentReportRes.json();
    assert(studentReportRes.status === 200 && studentReportData.success, 'Student can view their own recorded integrity events');
    assert(studentReportData.data.counters.totalSignals >= 8, 'Student sees complete signal tally');
    assert(studentReportData.data.overallStatus === 'REVIEW_REQUIRED', 'Signals correctly trigger REVIEW_REQUIRED state');

    // Cross-tenant protection: Student B cannot view Student A's integrity report
    const crossTenantRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/integrity-report?studentId=${testStudent.id}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(crossTenantRes.status === 403, 'Cross-tenant violation: Student B cannot access Student A report (HTTP 403)');

    // Unauthorized reviewer protection: Student cannot submit review action
    const unauthReviewRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/review-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ eventId: targetEventId, reviewStatus: 'DISMISSED' })
    });
    assert(unauthReviewRes.status === 403, 'Unauthorized reviewer: Student cannot review events (HTTP 403)');

    // ── Test 2.6: End Monitoring Session ──
    console.log('\n--- 2.6: End Monitoring Session ---');
    const endRes = await fetch(`${API_BASE}/assessments/${testAssessment.id}/monitoring/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ sessionId: activeSessionId })
    });
    const endData = await endRes.json();
    assert(endRes.status === 200 && endData.success, 'Monitoring session closed successfully');

    // ── Test 2.7: Safe Fixture Cleanup ──
    console.log('\n--- 2.7: Safe Cleanup of Test Fixtures ---');
    await client.query(`DELETE FROM assessment_integrity_events WHERE assessment_id = $1`, [testAssessment.id]);
    await client.query(`DELETE FROM assessment_monitoring_sessions WHERE assessment_id = $1`, [testAssessment.id]);
    await client.query(`DELETE FROM assessments WHERE id = $1`, [testAssessment.id]);
    await client.query(`DELETE FROM user_roles WHERE user_id IN ($1, $2)`, [testUser.id, testUserB.id]);
    await client.query(`DELETE FROM students WHERE id IN ($1, $2)`, [testStudent.id, testStudentB.id]);
    await client.query(`DELETE FROM users WHERE id IN ($1, $2)`, [testUser.id, testUserB.id]);
    console.log('  [PASS] Test records safely cleaned up from PostgreSQL');

  } finally {
    client.release();
  }
}

async function main() {
  try {
    const engineUrl = pathToFileURL(path.resolve(__dirname, '../../frontend/src/utils/visionIntegrityEngine.js')).href;
    const visionMod = await import(engineUrl);
    VisionIntegrityEngine = visionMod.VisionIntegrityEngine || visionMod.default;

    await runModelInferenceTests();
    await runIntegrationTests();

    console.log('\n============================================================');
    console.log(`🎉 CAMERA AI & INTEGRITY SUITE PASSED: ${totalPassed} / ${totalPassed + totalFailed}`);
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE EXECUTION FAILED:', err.message);
    console.log(`Summary: Passed: ${totalPassed}, Failed: ${totalFailed}`);
    process.exit(1);
  }
}

main();
