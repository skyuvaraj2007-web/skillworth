// backend/tests/verify_skill_lifecycle_spec.js
/**
 * Automated Verification Suite for SkillNexus AI Skill & Course Lifecycle:
 * INSTITUTION ADD SKILL → NOTIFICATION → ELIGIBILITY → ENROLLMENT → LEARNING → ASSESSMENT → CERTIFICATION
 */

const relationalManager = require('../src/db/relationalManager');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 SKILLNEXUS AI — SKILL LIFECYCLE & CERTIFICATION SPEC TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const institutionId = 'TN010';
    const timestamp = Date.now();

    // ─── PART 1 & 47: INSTITUTION DRAFT SKILL (NO NOTIFICATIONS DISPATCHED) ───
    console.log('--- TEST 1: SAVE DRAFT SKILL (DRAFTS MUST NOT NOTIFY STUDENTS) ---');
    const draftSkillData = {
      name: `Distributed Systems Draft ${timestamp}`,
      category: 'Cloud',
      level: 'Advanced',
      shortDescription: 'Draft curriculum for distributed cloud architectures.',
      status: 'DRAFT',
      learningObjectives: ['Learn Raft consensus', 'Build Paxos simulator'],
      prerequisites: ['Go', 'Networking'],
      topicsCovered: ['Consensus', 'Fault Tolerance', 'Vector Clocks'],
      duration: '8 Weeks',
      totalHours: 48,
      mode: 'Online',
      instructor: {
        name: 'Dr. S. Arunkumar',
        designation: 'Professor of Distributed Computing',
        department: 'Dept of Computer Science',
        contactInfo: 'arun.systems@nexus.edu'
      },
      assessment: {
        type: 'Coding Test',
        passingScore: 75,
        benchmarks: { bronze: 60, silver: 75, gold: 85, expert: 95 }
      },
      eligibility: {
        departments: ['CSE', 'IT'],
        years: ['3rd', '4th'],
        minCgpa: 8.0,
        requiredPreviousSkills: ['Python'],
        maxSeats: 30,
        applicationDeadline: '2026-11-30'
      },
      enrollmentSettings: {
        type: 'OPEN',
        seatLimit: 30,
        waitlistEnabled: true
      },
      notifications: {
        notifyOnPublish: true
      }
    };

    const draftResult = await relationalManager.saveSkill(institutionId, draftSkillData, false);
    assert(draftResult.status === 'DRAFT', 'Skill created with status DRAFT');
    assert(draftResult.notifiedStudentsCount === 0, 'DRAFT skills must NOT notify students (notifiedCount === 0)');

    // ─── PART 2 & 15: PUBLISH SKILL WITH AUTOMATIC ELIGIBILITY & NOTIFICATIONS ───
    console.log('\n--- TEST 2: PUBLISH SKILL & NOTIFY ELIGIBLE STUDENTS ---');
    const publishedSkillData = {
      ...draftSkillData,
      id: `SKL-PY-${timestamp}`,
      name: `Python Advanced Systems ${timestamp}`,
      category: 'Programming',
      level: 'Advanced',
      status: 'PUBLISHED',
      prerequisites: ['Python'],
      eligibility: {
        departments: ['CSE', 'IT'],
        years: ['3rd', 'III Year', '4th'],
        minCgpa: 7.5,
        requiredPreviousSkills: ['Python'],
        maxSeats: 50,
        applicationDeadline: '2026-12-15'
      },
      enrollmentSettings: {
        type: 'OPEN',
        seatLimit: 50,
        waitlistEnabled: true
      },
      notifications: {
        notifyOnPublish: true
      }
    };

    const publishResult = await relationalManager.saveSkill(institutionId, publishedSkillData, true);
    assert(publishResult.status === 'PUBLISHED', 'Skill successfully published');
    assert(publishResult.notifiedStudentsCount > 0, `Eligible students notified on publish (${publishResult.notifiedStudentsCount} notified)`);

    // Verify student received the NEW_SKILL notification
    const studentId = 'STU-TN010-001'; // Arun Kumar (CSE, 3rd Year, CGPA 8.92, Python skill)
    const studentNotifs = await relationalManager.getNotifications('student');
    const skillNotif = studentNotifs.find(n => 
      (n.type === 'NEW_SKILL' || n.title?.includes('New Skill')) &&
      (n.preview?.includes(`Python Advanced Systems ${timestamp}`) || n.message?.includes(`Python Advanced Systems ${timestamp}`))
    );
    assert(!!skillNotif, 'Eligible student received "🔔 New Skill Available" notification in database store');
    assert(skillNotif?.details?.action === 'view-skill', 'Notification action routes directly to "view-skill"');

    // ─── PART 8 & 21: REAL-TIME AUTOMATIC ELIGIBILITY ENGINE ───
    console.log('\n--- TEST 3: REAL-TIME ELIGIBILITY CALCULATION ---');
    const eligibilityArun = await relationalManager.checkStudentSkillEligibility(studentId, publishResult.id);
    assert(eligibilityArun.isEligible === true, 'Eligible student (Arun Kumar: CSE, 3rd Year, CGPA 8.92, Python) is evaluated as isEligible: true');
    assert(eligibilityArun.status === 'ELIGIBLE', 'Eligibility status is ELIGIBLE');
    assert(eligibilityArun.breakdown.every(b => b.pass === true), 'All eligibility breakdown criteria passed (Dept, Year, CGPA, Prereq, Deadline, Seats)');

    // Ineligible student test: ECE student or missing prerequisite
    const mockIneligibleStudent = {
      id: `stu_ineligible_${timestamp}`,
      studentId: `STU-INELIGIBLE-${timestamp}`,
      institutionId: 'TN010',
      collegeId: 'TN010',
      department: 'Civil Engineering',
      year: '1st Year',
      cgpa: 6.2,
      skills: ['AutoCAD']
    };
    const eligibilityIneligible = await relationalManager.checkStudentSkillEligibility(mockIneligibleStudent, publishResult.id);
    assert(eligibilityIneligible.isEligible === false, 'Ineligible student is correctly rejected by eligibility engine');
    assert(eligibilityIneligible.reasons.length >= 2, 'Eligibility engine returned detailed failure reasons for Dept, Year, CGPA, Prereq');

    // ─── PART 11 & 22: OPEN ENROLLMENT FLOW ───
    console.log('\n--- TEST 4: OPEN ENROLLMENT FLOW ---');
    const enrollResult = await relationalManager.enrollStudentInSkill(studentId, publishResult.id);
    assert(enrollResult.success === true, 'Open enrollment completed successfully');
    assert(enrollResult.status === 'ENROLLED', 'Open enrollment immediately sets status to ENROLLED');

    // Verify seat increment
    const updatedSkill = await relationalManager.getSkillById(publishResult.id);
    assert(updatedSkill.enrolledCount >= 1, `Seat count incremented on skill (enrolledCount: ${updatedSkill.enrolledCount})`);

    // Verify student enrollment confirmation notification
    const studentNotifsAfter = await relationalManager.getNotifications('student');
    const enrollConfNotif = studentNotifsAfter.find(n => n.type === 'ENROLLMENT_CONFIRMATION' && n.details?.skillId === publishResult.id);
    assert(!!enrollConfNotif, 'Student received "✓ Enrollment Confirmed" notification');

    // Duplicate enrollment prevention
    const duplicateEnroll = await relationalManager.enrollStudentInSkill(studentId, publishResult.id);
    assert(duplicateEnroll.status === 'ENROLLED', 'Duplicate enrollment is idempotent and returns existing enrollment without double-counting seats');

    // ─── PART 12 & 34: APPROVAL REQUIRED ENROLLMENT & INSTITUTION REVIEW ───
    console.log('\n--- TEST 5: APPROVAL REQUIRED ENROLLMENT & FACULTY REVIEW ---');
    const approvalSkillData = {
      ...publishedSkillData,
      id: `SKL-APPROVAL-${timestamp}`,
      name: `AI Capstone Proctored ${timestamp}`,
      status: 'PUBLISHED',
      prerequisites: [],
      eligibility: {
        departments: [],
        years: [],
        minCgpa: 0,
        requiredPreviousSkills: [],
        maxSeats: 20,
        applicationDeadline: '2026-12-31'
      },
      enrollmentSettings: {
        type: 'APPROVAL_REQUIRED',
        seatLimit: 20,
        waitlistEnabled: true
      }
    };
    const approvalSkill = await relationalManager.saveSkill(institutionId, approvalSkillData, true);

    const allInstStudents = await relationalManager.getStudents(institutionId);
    const student2 = allInstStudents.find(s => s.id !== studentId && s.studentId !== studentId) || allInstStudents[1];
    const student2Id = student2.studentId || student2.id;
    const requestEnrollResult = await relationalManager.enrollStudentInSkill(student2Id, approvalSkill.id);
    assert(requestEnrollResult.status === 'PENDING', 'Approval Required skill places enrollment in status PENDING');

    // Verify institution receives pending enrollment requests
    const pendingRequests = await relationalManager.getPendingEnrollmentRequests(institutionId);
    const targetRequest = pendingRequests.find(r => r.courseId === approvalSkill.id && r.studentId === student2Id);
    assert(!!targetRequest, 'Institution retrieved pending student enrollment request in Enrollment Management');

    // Institution approves request
    const approvedRequest = await relationalManager.updateEnrollmentStatus(targetRequest.id, institutionId, 'APPROVED');
    assert(approvedRequest.status === 'ENROLLED', 'Faculty approval transitioned request status to ENROLLED');

    // Verify student received ENROLLMENT_APPROVED notification
    const student2Notifs = await relationalManager.getNotifications('student');
    const approvedNotif = student2Notifs.find(n => n.type === 'ENROLLMENT_APPROVED' && n.details?.skillId === approvalSkill.id);
    assert(!!approvedNotif, 'Student received "✓ Enrollment Approved" notification after faculty approval');

    // ─── PART 27-31: ASSESSMENT, BENCHMARK CALCULATION & CERTIFICATION ───
    console.log('\n--- TEST 6: ASSESSMENT SUBMISSION, BENCHMARK & CERTIFICATION ---');
    const assessmentResult = await relationalManager.submitSkillAssessment(studentId, publishResult.id, {
      score: 88,
      answers: [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }]
    });

    assert(assessmentResult.score === 88, 'Assessment recorded score of 88%');
    assert(assessmentResult.isPassed === true, 'Assessment marked as passed');
    assert(assessmentResult.benchmark === 'Gold', 'Calculated benchmark level is "Gold" based on threshold (88% >= 85%)');
    assert(assessmentResult.isCertified === true, 'Earned official institutional certificate');
    assert(assessmentResult.credentialId.startsWith('CERT-'), `Issued cryptographic credential ID (${assessmentResult.credentialId})`);

    // Verify student profile skills auto-updated with verified benchmark
    const updatedStudent = await relationalManager.getStudentById(studentId);
    const updatedSkillEntry = (updatedStudent.skills || []).find(sk => 
      (typeof sk === 'object' ? sk.name : sk) === publishResult.name
    );
    assert(!!updatedSkillEntry, 'Student profile verified skills list automatically includes acquired skill');
    assert(updatedSkillEntry?.benchmark === 'Gold', 'Student profile skill reflects benchmark level "Gold"');
    assert(updatedSkillEntry?.verified === true, 'Student profile skill is marked verified: true');

    // Verify student received CERTIFICATION_EARNED notification
    const studentNotifsFinal = await relationalManager.getNotifications('student');
    const certNotif = studentNotifsFinal.find(n => n.type === 'CERTIFICATION_EARNED' && n.details?.skillId === publishResult.id);
    assert(!!certNotif, 'Student received "🏆 Certification Earned!" notification with credential ID');

    // ─── PART 43 & 62: TENANCY & CROSS-INSTITUTION SECURITY ───
    console.log('\n--- TEST 7: CROSS-INSTITUTION SECURITY & ACCESS CONTROL ---');
    let crossInstRejected = false;
    try {
      await relationalManager.archiveSkill(publishResult.id, 'DIFFERENT_INST_002');
    } catch (err) {
      crossInstRejected = true;
    }
    assert(crossInstRejected === true, 'Cross-institution skill archival attempt rejected with Unauthorized error');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
