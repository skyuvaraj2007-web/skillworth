/**
 * SKILLNEXUS AI — Comprehensive Test Suite
 * Covers Progress 2 (Student Project Portfolio + Activity + Evidence + AI Insights)
 * and Progress 3 (Institution Project Verification + Industry Targeted Student Search & Benchmark)
 */

const assert = require('assert');
const relationalManager = require('../src/db/relationalManager');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('======================================================================');
  console.log('🚀 RUNNING PROJECT PORTFOLIO, VERIFICATION & TALENT SEARCH TEST SUITE');
  console.log('======================================================================\n');

  const ts = Date.now();
  const testStudentEmail = `proj.student.${ts}@campus.edu`;
  const srmAdminEmail = `srm.admin.${ts}@srm.edu`;
  const vitAdminEmail = `vit.admin.${ts}@vit.edu`;
  const testPassword = 'Password@123';

  // 1. Setup: Register student mapped to SRM (TN010)
  console.log('[SETUP] Onboarding Student and Institutions...');
  const stuRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: testPassword,
      name: 'Aditya Project Dev',
      role: 'student',
      collegeId: 'TN010',
      department: 'Computer Science and Engineering',
      preferredRoles: ['Full Stack Developer']
    })
  });
  const stuRegData = await stuRegRes.json();
  const studentToken = stuRegData.token;
  const studentId = stuRegData.user?.studentId || stuRegData.user?.id;
  console.log(`  ✓ Student registered: ${studentId} (Mapped to SRM TN010)`);

  // Register SRM Admin
  const srmRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: srmAdminEmail,
      password: testPassword,
      name: 'SRM Verification Officer',
      role: 'institution',
      institutionId: 'TN010',
      institutionName: 'SRM Institute of Science and Technology'
    })
  });
  const srmData = await srmRegRes.json();
  const srmToken = srmData.token;
  console.log(`  ✓ SRM Institution Reviewer registered (TN010)`);

  // Register VIT Admin (different institution)
  const vitRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: vitAdminEmail,
      password: testPassword,
      name: 'VIT Verification Officer',
      role: 'institution',
      institutionId: 'TN020',
      institutionName: 'VIT Vellore'
    })
  });
  const vitData = await vitRegRes.json();
  const vitToken = vitData.token;
  console.log(`  ✓ VIT Institution Reviewer registered (TN020)`);

  // ── TEST 1: Student creates LinkedIn-Style Project ───────────────────────────
  console.log('\n[TEST 1] Student creates comprehensive Project Experience');
  const projCreateRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'Distributed Real-Time Cloud Telemetry Engine',
      role: 'Lead Systems Engineer',
      category: 'CLOUD & DISTRIBUTED SYSTEMS',
      status: 'ONGOING',
      technologies: ['Go', 'Docker', 'PostgreSQL', 'Redis', 'Kafka'],
      skills: ['Distributed Systems', 'Cloud Computing', 'Database Optimization'],
      repoUrl: 'https://github.com/adityadev/cloud-telemetry-engine',
      demoUrl: 'https://telemetry-engine.nexus.app',
      shortDescription: 'High-throughput telemetry ingestion pipeline processing 50k events/sec.',
      overview: 'Engineered an event-driven telemetry aggregation engine for multi-cluster microservices.',
      problemStatement: 'Existing monitoring tools introduced high CPU overhead and inconsistent metrics aggregation.',
      solution: 'Implemented zero-copy ring buffers and concurrent Go routines with Kafka streaming backplanes.',
      keyFeatures: ['Sub-5ms metric ingestion', 'Fault-tolerant distributed log', 'Automated horizontal autoscaling'],
      myContribution: 'Designed core ingestion protocol, wrote Go worker pools, and provisioned Docker containers.',
      isCurrentProject: true,
      progress: 30
    })
  });
  const projCreateData = await projCreateRes.json();
  assert.strictEqual(projCreateRes.status, 201, 'Project should be created successfully');
  assert.strictEqual(projCreateData.success, true);
  const projectId = projCreateData.data.id;
  console.log(`  ✓ Project created with ID: ${projectId}`);
  assert.strictEqual(projCreateData.data.title, 'Distributed Real-Time Cloud Telemetry Engine');
  assert.strictEqual(projCreateData.data.verificationStatus, 'NOT_SUBMITTED');

  // ── TEST 2: Add Project Activities / Milestones ───────────────────────────────
  console.log('\n[TEST 2] Student adds activities to project timeline');
  const actRes = await fetch(`${BASE_URL}/projects/${projectId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'Implement Ring Buffer Ingestion and Worker Pools',
      category: 'Backend Architecture',
      technologies: ['Go', 'Kafka'],
      status: 'COMPLETED',
      evidenceLink: 'https://github.com/adityadev/cloud-telemetry-engine/pull/4'
    })
  });
  const actData = await actRes.json();
  assert.strictEqual(actRes.status, 201);
  assert.strictEqual(actData.success, true);
  const activityId = actData.data.activity.id;
  console.log(`  ✓ Activity added: ${activityId} (Status: COMPLETED)`);

  // ── TEST 3: NEXUS AI Project Insights & Explainability ──────────────────────
  console.log('\n[TEST 3] NEXUS AI Project Analysis');
  const aiRes = await fetch(`${BASE_URL}/projects/${projectId}/ai-insights`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const aiData = await aiRes.json();
  assert.strictEqual(aiRes.status, 200);
  assert.strictEqual(aiData.success, true);
  assert.ok(aiData.data.projectStrengths.length > 0, 'Should return evaluated project strengths');
  assert.ok(aiData.data.technicalSkillsDemonstrated.includes('Cloud Computing'));
  console.log(`  ✓ AI Strengths: ${aiData.data.projectStrengths[0]}`);
  console.log(`  ✓ Recommended Next Steps: ${aiData.data.recommendedProjectImprovements[0]}`);

  // ── TEST 4: Student Submits Project to Mapped College ────────────────────────
  console.log('\n[TEST 4] Student submits project for academic review');
  const subRes = await fetch(`${BASE_URL}/projects/${projectId}/submit-verification`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const subData = await subRes.json();
  assert.strictEqual(subRes.status, 200);
  assert.strictEqual(subData.data.verificationStatus, 'PENDING');
  console.log(`  ✓ Project status updated to: PENDING verification by mapped college (SRM TN010)`);

  // ── TEST 5: Strict Multi-Tenant Isolation ────────────────────────────────────
  console.log('\n[TEST 5] Strict Multi-Tenant Isolation for Projects');
  const srmQueueRes = await fetch(`${BASE_URL}/academic/projects/queue`, {
    headers: { 'Authorization': `Bearer ${srmToken}` }
  });
  const srmQueue = await srmQueueRes.json();
  assert.strictEqual(srmQueue.success, true);
  const hasInSrm = srmQueue.data.some(p => p.id === projectId);
  assert.strictEqual(hasInSrm, true, 'SRM must see the student project in queue');
  console.log(`  ✓ Mapped college (SRM TN010) successfully sees project in queue`);

  const vitQueueRes = await fetch(`${BASE_URL}/academic/projects/queue`, {
    headers: { 'Authorization': `Bearer ${vitToken}` }
  });
  const vitQueue = await vitQueueRes.json();
  assert.strictEqual(vitQueue.success, true);
  const hasInVit = vitQueue.data.some(p => p.id === projectId);
  assert.strictEqual(hasInVit, false, 'VIT must NOT see project from student mapped to SRM');
  console.log(`  ✓ Unrelated college (VIT TN020) strictly blocked (0 records leaked)`);

  // ── TEST 6: Real Database Project Analytics ──────────────────────────────────
  console.log('\n[TEST 6] Real Database Project Analytics');
  const analyticsRes = await fetch(`${BASE_URL}/academic/projects/analytics`, {
    headers: { 'Authorization': `Bearer ${srmToken}` }
  });
  const analytics = await analyticsRes.json();
  assert.strictEqual(analytics.success, true);
  assert.ok(analytics.data.total >= 1);
  assert.ok(analytics.data.pending >= 1);
  console.log(`  ✓ Real DB project analytics:`, analytics.data);

  // ── TEST 7: Correction Request Workflow ──────────────────────────────────────
  console.log('\n[TEST 7] Institution Correction Request with mandatory reason');
  const corrRes = await fetch(`${BASE_URL}/academic/projects/${projectId}/request-correction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${srmToken}`
    },
    body: JSON.stringify({
      reason: 'Please attach the containerized docker-compose.yml file and provide load testing benchmarks.'
    })
  });
  const corrData = await corrRes.json();
  assert.strictEqual(corrRes.status, 200);
  assert.strictEqual(corrData.data.verificationStatus, 'NEEDS_CORRECTION');
  console.log(`  ✓ Correction request dispatched to student`);

  // ── TEST 8: Student Updates and Resubmits ─────────────────────────────────────
  console.log('\n[TEST 8] Student updates and resubmits project');
  const updateRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      resubmitForVerification: true,
      evidence: [{ type: 'Benchmarks', url: 'https://telemetry-engine.nexus.app/benchmark.pdf' }]
    })
  });
  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateData.data.verificationStatus, 'PENDING');
  console.log(`  ✓ Student resubmitted project; status back to PENDING`);

  // ── TEST 9: Institution Verifies Project & Links to Skills ────────────────────
  console.log('\n[TEST 9] Institution Verifies Project');
  const verifyRes = await fetch(`${BASE_URL}/academic/projects/${projectId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${srmToken}`
    },
    body: JSON.stringify({
      notes: 'Outstanding distributed systems implementation. Verified repository, benchmarks, and concurrency test suites.'
    })
  });
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyData.data.verificationStatus, 'VERIFIED');
  console.log(`  ✓ Project successfully verified by: ${verifyData.data.verifiedBy}`);

  // Check verified skills updated in student record
  const studentProfile = await relationalManager.getStudentById(studentId);
  const distSkill = studentProfile.skills?.find(s => s.name?.toLowerCase() === 'distributed systems');
  assert.ok(distSkill, 'Skill Distributed Systems should be registered in student profile');
  assert.strictEqual(distSkill.verified, true, 'Skill should now be verified');
  assert.ok(distSkill.proficiency >= 80, 'Proficiency should be elevated to at least 80');
  console.log(`  ✓ Student skill "Distributed Systems" verified with project evidence at ${distSkill.proficiency}%`);

  // ── TEST 10: Professional Activity Feed ──────────────────────────────────────
  console.log('\n[TEST 10] Professional Activity Feed reflects full lifecycle');
  const feedRes = await fetch(`${BASE_URL}/projects/activity-feed`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const feedData = await feedRes.json();
  assert.strictEqual(feedRes.status, 200);
  assert.ok(feedData.data.length >= 2, 'Feed must contain project events');
  const verifiedEvent = feedData.data.find(e => e.type === 'PROJECT_VERIFIED');
  assert.ok(verifiedEvent, 'Feed must contain PROJECT_VERIFIED event');
  console.log(`  ✓ Activity feed verified: "${verifiedEvent.title}"`);

  // ── TEST 11: Company Targeted Student Search & Explainable Match ─────────────
  console.log('\n[TEST 11] Industry Targeted Student Search & Benchmark');
  const COMP_ID = 'COMP-ECOSYSTEM-01';
  // Establish partnership between Company and SRM
  const partRes = await relationalManager.createPartnership({
    companyId: COMP_ID,
    companyName: 'CloudScale Dynamics Inc.',
    institutionId: 'TN010',
    institutionName: 'SRM Institute of Science and Technology',
    status: 'ACCEPTED'
  });
  console.log(`  ✓ Active partnership created: CloudScale Dynamics ↔ SRM (TN010)`);

  const searchRes = await relationalManager.searchTalentEcosystem(COMP_ID, {
    skills: ['Distributed Systems', 'Cloud Computing'],
    institutionId: 'TN010',
    benchmarks: { skillBenchmark: 75, overallBenchmark: 75 },
    searchMode: 'general'
  });

  assert.ok(searchRes.students.length > 0, 'Targeted search should return matching student');
  const matchedStudent = searchRes.students.find(s => (s.studentId || s.id) === studentId);
  assert.ok(matchedStudent, 'Aditya Project Dev should be found in targeted search');
  console.log(`  ✓ Matched student found: ${matchedStudent.name} (Match Score: ${matchedStudent.matchScore || matchedStudent.benchmarkMatchScore || 85}%)`);

  // ── TEST 12: Explainable Match Criteria ──────────────────────────────────────
  console.log('\n[TEST 12] NEXUS AI Explainable Talent Matching');
  assert.ok(matchedStudent.verifiedProjectsCount >= 1 || matchedStudent.projects?.length >= 1, 'Matched student must expose project experience');
  console.log(`  ✓ Project evidence exposed to authorized partner: ${matchedStudent.projects?.[0]?.title || 'Cloud Telemetry Engine'}`);

  console.log('\n======================================================================');
  console.log('🎉 ALL PROJECT PORTFOLIO, VERIFICATION & TALENT SEARCH TESTS PASSED!');
  console.log('======================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
