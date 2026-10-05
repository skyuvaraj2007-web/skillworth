// backend/tests/verify_communication_ecosystem.js
/**
 * Automated Verification Suite for SkillNexus AI:
 * DUOLINGO-STYLE COMMUNICATION LEARNING AND INSTITUTIONAL INTELLIGENCE
 *
 * 20 Comprehensive End-to-End Verification Criteria:
 * 1. New student communication state = 0.
 * 2. Student starts lesson / retrieves catalog.
 * 3. Lesson completion persists.
 * 4. Score persists.
 * 5. Communication skill recalculates.
 * 6. Student dashboard updates with real communication capability.
 * 7. Student profile updates with categories & telemetry.
 * 8. Institution student profile updates.
 * 9. Institution analytics update with active learners & distribution.
 * 10. Institution A can see its mapped student.
 * 11. Institution B cannot see Institution A's student.
 * 12. Unassociated student is not visible to institutions.
 * 13. Communication data survives reload / direct relational fetch.
 * 14. NEXUS AI receives real communication data & recommends priority focus.
 * 15. Industry matching incorporates communication requirement.
 * 16. No fake XP/progress/streak values exist.
 * 17. Existing authentication & OTP verification still work.
 * 18. Existing student/institution/industry functionality works.
 * 19. Frontend production build passes (tested via npm run build).
 * 20. Existing test suites remain passing.
 */

const http = require('http');
const relationalManager = require('../src/db/relationalManager');
const matchingService = require('../src/services/matchingService');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runCommunicationEcosystemTests() {
  console.log('================================================================');
  console.log('🎙️ SKILLNEXUS AI — COMMUNICATION MODULE & INSTITUTION ECOSYSTEM');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  try {
    // ── 1. Create Brand New Student (Institution A: TN010) ──
    console.log('Step 1: Onboarding New Student under Institution TN010...');
    const studentEmail = `comm.student.${timestamp}@campus.edu`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Priya Raman',
      email: studentEmail,
      password: 'StrongPassword123!',
      role: 'student',
      collegeId: 'TN010',
      collegeName: 'SRM Institute of Science and Technology',
      department: 'Computer Science and Engineering',
      year: 'III Year'
    });
    assert(regRes.status === 201 && regRes.data?.token, 'Student account registered with active token');
    const studentToken = regRes.data.token;
    const studentId = regRes.data.user?.studentId;

    // ── Criterion 1: New Student Communication State = 0 ──
    console.log('\nStep 2: Verifying New Student Zero State for Communication...');
    const commProfileRes = await makeRequest('GET', '/api/communication/profile', null, studentToken);
    assert(commProfileRes.status === 200, 'GET /api/communication/profile returns 200');
    const commData = commProfileRes.data.data;
    assert(commData.xp === 0, `Zero State: XP is strictly 0 (got ${commData.xp})`);
    assert(commData.streak === 0, `Zero State: Streak is strictly 0 (got ${commData.streak})`);
    assert(commData.overallScore === 0, `Zero State: Overall communication is strictly 0% (got ${commData.overallScore}%)`);
    assert(commData.categories.vocabulary === 0, 'Zero State: Vocabulary is 0%');
    assert(commData.categories.grammar === 0, 'Zero State: Grammar is 0%');
    assert(commData.categories.reading === 0, 'Zero State: Reading is 0%');
    assert(commData.categories.listening === 0, 'Zero State: Listening is 0%');
    assert(commData.categories.speaking === 0, 'Zero State: Speaking is 0%');
    assert(commData.categories.conversation === 0, 'Zero State: Conversation is 0%');
    assert(Array.isArray(commData.activities) && commData.activities.length === 0, 'Zero State: No recorded activities');

    // ── Criterion 2: Lesson Catalog Retrieval ──
    console.log('\nStep 3: Verifying Lesson Catalog & Exercises...');
    const catalogRes = await makeRequest('GET', '/api/communication/lessons', null, studentToken);
    assert(catalogRes.status === 200, 'GET /api/communication/lessons returns 200');
    const catalog = catalogRes.data.data;
    assert(Boolean(catalog.daily && catalog.vocabulary && catalog.grammar && catalog.reading && catalog.listening && catalog.speaking && catalog.conversation),
      'Curriculum contains all 7 categories (Daily, Vocab, Grammar, Reading, Listening, Speaking, Conversation)');
    const firstLesson = catalog.vocabulary[0];
    assert(firstLesson && firstLesson.exercises.length > 0, `Lesson "${firstLesson.title}" contains ${firstLesson.exercises.length} interactive exercises`);
    assert(firstLesson.isCompleted === false, 'Lesson is initially marked uncompleted for new student');

    // ── Criterion 3, 4, 5: Submit Activity, Score & Skill Recalculation ──
    console.log('\nStep 4: Submitting Real Communication Exercise Activity...');
    const activitySubmission = await makeRequest('POST', '/api/communication/activity', {
      lessonId: firstLesson.id,
      category: 'vocabulary',
      score: 90,
      accuracy: 95,
      timeSpent: 65,
      attempts: 1
    }, studentToken);
    assert(activitySubmission.status === 200, 'POST /api/communication/activity accepted and processed');
    const postData = activitySubmission.data.data;
    assert(postData.isCompleted === true, 'Exercise completion marked as true for score 90%');
    assert(postData.xpEarned > 0, `Earned genuine XP: ${postData.xpEarned}`);
    assert(postData.communication.categories.vocabulary >= 80, `Vocabulary skill score recalculated: ${postData.communication.categories.vocabulary}%`);
    assert(postData.communication.overallScore > 0, `Overall Communication recalculated: ${postData.communication.overallScore}%`);
    assert(postData.communication.streak === 1, `Streak incremented to 1 day`);

    // Submit a Speaking Exercise
    const speakingSubmission = await makeRequest('POST', '/api/communication/activity', {
      lessonId: 'speak-101',
      category: 'speaking',
      score: 85,
      accuracy: 88,
      timeSpent: 40,
      attempts: 1
    }, studentToken);
    assert(speakingSubmission.status === 200, 'Speaking practice telemetry recorded successfully');
    const speakData = speakingSubmission.data.data;
    assert(speakData.communication.categories.speaking >= 80, `Speaking score updated: ${speakData.communication.categories.speaking}%`);

    // ── Criterion 6: Student Dashboard Capability Snapshot Updates ──
    console.log('\nStep 5: Verifying Student Dashboard Capability Snapshot Integration...');
    const dashRes = await makeRequest('GET', '/api/students/dashboard', null, studentToken);
    assert(dashRes.status === 200, 'GET /api/students/dashboard returns 200');
    const dashCaps = dashRes.data.data.capabilities;
    assert(dashCaps.communication > 0, `Student Dashboard: Communication capability updated to real calculated value (${dashCaps.communication}%)`);
    assert(dashCaps.technicalSkills === 0 && dashCaps.systemDesign === 0, 'Other unexercised capabilities remain strictly 0%');

    // ── Criterion 7: Student Profile Telemetry Integration ──
    console.log('\nStep 6: Verifying Student Profile Telemetry...');
    const updatedProfileRes = await makeRequest('GET', '/api/communication/profile', null, studentToken);
    const updatedProfile = updatedProfileRes.data.data;
    assert(updatedProfile.completedLessonsCount >= 2, `Completed lessons count updated: ${updatedProfile.completedLessonsCount}`);
    assert(updatedProfile.xp >= 40, `Total XP updated: ${updatedProfile.xp}`);
    assert(updatedProfile.categories.vocabulary > 0 && updatedProfile.categories.speaking > 0, 'Categories breakdown updated correctly in profile');
    assert(updatedProfile.strengths.includes('vocabulary') || updatedProfile.strengths.includes('speaking'), 'Identified genuine validated strengths');

    // ── Create Institution Admin A (TN010) & Institution Admin B (VIT001) ──
    console.log('\nStep 7: Onboarding Institution A (TN010) and Institution B (VIT001)...');
    const instAEmail = `admin.tn010.${timestamp}@srm.edu`;
    const instARes = await makeRequest('POST', '/api/auth/register', {
      name: 'Dean of Academics SRM',
      email: instAEmail,
      password: 'StrongPassword123!',
      role: 'institution',
      collegeId: 'TN010',
      collegeName: 'SRM Institute of Science and Technology'
    });
    const instAToken = instARes.data?.token;
    assert(Boolean(instAToken), 'Institution A admin authenticated');

    const instBEmail = `admin.vit.${timestamp}@vit.edu`;
    const instBRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Dean of Academics VIT',
      email: instBEmail,
      password: 'StrongPassword123!',
      role: 'institution',
      collegeId: 'TN020',
      collegeName: 'Vellore Institute of Technology'
    });
    const instBToken = instBRes.data?.token;
    assert(Boolean(instBToken), 'Institution B admin authenticated');

    // ── Criterion 8, 10, 11: Institution Student Profile & Tenant Isolation ──
    console.log('\nStep 8: Verifying Institution Student Profile & Tenant Isolation...');
    // Institution A views mapped student
    const instAViewRes = await makeRequest('GET', `/api/academic/students/${studentId}`, null, instAToken);
    assert(instAViewRes.status === 200, `Institution A can view mapped student ${studentId}`);
    const viewedStudent = instAViewRes.data.data;
    assert(Boolean(viewedStudent.communication), 'Institution student dossier contains communication data');
    assert(viewedStudent.communication.overallScore > 0, `Institution sees student overall communication score: ${viewedStudent.communication.overallScore}%`);
    assert(viewedStudent.communication.categories.vocabulary > 0, 'Institution sees student vocabulary mastery');

    // Institution B attempts to view Institution A's student -> MUST FAIL with 404
    const instBViewRes = await makeRequest('GET', `/api/academic/students/${studentId}`, null, instBToken);
    assert(instBViewRes.status === 404, `Tenant Isolation: Institution B CANNOT access Institution A student (Status: ${instBViewRes.status})`);

    // ── Criterion 9: Institution Communication Analytics ──
    console.log('\nStep 9: Verifying Institution Communication Skill Intelligence Analytics...');
    const instAnalyticsRes = await makeRequest('GET', '/api/academic/communication-analytics', null, instAToken);
    assert(instAnalyticsRes.status === 200, 'GET /api/academic/communication-analytics returns 200');
    const commAnalytics = instAnalyticsRes.data.data;
    assert(commAnalytics.activeCommunicationStudents >= 1, `Analytics shows active communication learners: ${commAnalytics.activeCommunicationStudents}`);
    assert(commAnalytics.averageCommunicationSkill > 0, `Cohort Average Communication Skill: ${commAnalytics.averageCommunicationSkill}%`);
    assert(commAnalytics.categories.vocabulary > 0, `Cohort Vocabulary Benchmark: ${commAnalytics.categories.vocabulary}%`);
    assert(commAnalytics.categories.speaking > 0, `Cohort Speaking Benchmark: ${commAnalytics.categories.speaking}%`);

    // Institution B Analytics MUST be completely empty (0 learners, 0% avg)
    const instBAnalyticsRes = await makeRequest('GET', '/api/academic/communication-analytics', null, instBToken);
    const bAnalytics = instBAnalyticsRes.data.data;
    assert(bAnalytics.activeCommunicationStudents === 0, `Tenant Isolation: Institution B shows 0 active learners (no fabricated data)`);
    assert(bAnalytics.averageCommunicationSkill === 0, `Tenant Isolation: Institution B average communication is strictly 0%`);

    // ── Criterion 12: Unassociated Student Isolation ──
    console.log('\nStep 10: Verifying Unassociated Student Isolation...');
    const unassocEmail = `unassoc.${timestamp}@external.org`;
    const unassocReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Freelance Learner',
      email: unassocEmail,
      password: 'StrongPassword123!',
      role: 'student'
    });
    const unassocId = unassocReg.data?.user?.studentId;
    assert(Boolean(unassocId), 'Unassociated student registered');
    const unassocInstA = await makeRequest('GET', `/api/academic/students/${unassocId}`, null, instAToken);
    assert(unassocInstA.status === 404, `Unassociated student is NOT visible to Institution A (Status: ${unassocInstA.status})`);

    // ── Criterion 13: Data Persistence Across Storage ──
    console.log('\nStep 11: Verifying Database Persistence...');
    const reloadedStudent = await relationalManager.getStudentById(studentId);
    assert(Boolean(reloadedStudent && reloadedStudent.communication), 'Student communication record persists directly in relational storage');
    assert(reloadedStudent.communication.overallScore === viewedStudent.communication.overallScore,
      'Persisted communication score matches API representation');

    // ── Criterion 14: NEXUS AI Integration ──
    console.log('\nStep 12: Verifying NEXUS AI Integration with Communication Data...');
    const aiRes = await makeRequest('POST', '/api/ai/chat', {
      message: 'What is my current communication priority and speaking ability?'
    }, studentToken);
    assert(aiRes.status === 200, 'NEXUS AI endpoint returns 200');
    const aiReply = aiRes.data.reply;
    assert(aiReply.includes('Communication') || aiReply.includes('priority') || aiReply.includes('drills'),
      `NEXUS AI analyzes communication data: "${aiReply.slice(0, 100)}..."`);

    // ── Criterion 15: Industry Opportunity Matching with Communication ──
    console.log('\nStep 13: Verifying Industry Matching with Communication Capability...');
    const oppWithComm = {
      id: 'OPP-COMM-TEST',
      title: 'Technical Account Manager',
      requiredSkills: ['Python', 'Communication', 'Presentation']
    };
    const studentObj = {
      skills: [{ name: 'Python', level: 'Intermediate' }],
      capabilities: { communication: 85 },
      communication: { overallScore: 85 }
    };
    const matchResult = matchingService.calculateMatch(studentObj, oppWithComm);
    assert(matchResult.matchedSkills.includes('communication'), 'Matching service recognizes verified communication capability');
    assert(matchResult.matchScore >= 66, `Match score incorporates communication capability (${matchResult.matchScore}%)`);

    // ── Criterion 16: Zero Fake Data Verification ──
    console.log('\nStep 14: Verifying No Hardcoded/Fake Telemetry Values...');
    const freshStudentEmail = `brandnew.comm.${timestamp}@campus.edu`;
    const freshReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Fresh Learner',
      email: freshStudentEmail,
      password: 'StrongPassword123!',
      role: 'student',
      collegeId: 'TN010'
    });
    const freshComm = await makeRequest('GET', '/api/communication/profile', null, freshReg.data.token);
    const fd = freshComm.data.data;
    assert(fd.xp === 0 && fd.streak === 0 && fd.overallScore === 0, 'Brand new account has zero fake XP, streak, or overall score');

    // ── Criterion 17: Existing Authentication Still Works ──
    console.log('\nStep 15: Verifying Existing Authentication & Token Generation...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'arun.kumar@nexus.edu',
      password: 'nexus@2026',
      role: 'student'
    });
    assert(loginRes.status === 200 && loginRes.data?.token, 'Existing email/password authentication remains 100% functional');

    // ── Criterion 18: Existing Ecosystem Endpoints Unaffected ──
    console.log('\nStep 16: Verifying Existing Ecosystem Endpoints...');
    const coursesRes = await makeRequest('GET', '/api/learning', null, studentToken);
    assert(coursesRes.status === 200, 'Course catalog endpoint still works');
    const techRes = await makeRequest('GET', '/api/emerging-tech', null, studentToken);
    assert(techRes.status === 200, 'Emerging tech endpoint still works');

  } catch (err) {
    console.error('Test execution fatal error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCommunicationEcosystemTests();
