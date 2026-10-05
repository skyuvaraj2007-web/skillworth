/**
 * SKILL NEXUS AI — THREE-PORTAL UNIFIED COLLABORATION INTEGRATION SUITE
 * Tests Scenarios A through AC across Student, Institution, and Industry portals
 * Backed by authoritative PostgreSQL and Relational Engine.
 */

const API_BASE = 'http://localhost:5000/api';

async function req(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return { status: res.status, data };
  } catch (err) {
    console.error(`Request failed [${method} ${endpoint}]:`, err.message);
    return { status: 500, error: err.message };
  }
}

const ts = Date.now();

// Test Identifiers
const INST_A_CODE = `INST_A_${ts}`;
const INST_B_CODE = `INST_B_${ts}`;
const COMP_A_ID = `COMP_A_${ts}`;
const COMP_B_ID = `COMP_B_${ts}`;

let instAToken, instBToken;
let compAToken, compBToken;
let studentAToken, studentBToken;
let studentAId, studentBId;
let compAReqId, compAReq2Id;
let progAssessmentId;
let courseAId;
let oppId;
let applicationId;

async function runThreePortalIntegrationSuite() {
  console.log('================================================================');
  console.log('🧪 THREE-PORTAL UNIFIED ACADEMIA–INDUSTRY INTEGRATION SUITE');
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

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP: Register Institutions and Companies
    // -------------------------------------------------------------------------
    console.log('--- 1. Registering Institutions and Companies ---');
    
    // Institution A
    const instARes = await req('POST', '/auth/register', {
      email: `admin.${ts}@insta.edu.in`,
      password: 'Password123!',
      role: 'institution',
      institutionName: 'Apex Institute of Technology',
      institutionCode: INST_A_CODE,
      collegeId: INST_A_CODE,
      district: 'Chennai'
    });
    instAToken = instARes.data?.token;
    assert(instARes.status === 201 && instAToken, 'Institution A registered and authenticated');

    // Institution B
    const instBRes = await req('POST', '/auth/register', {
      email: `admin.${ts}@instb.edu.in`,
      password: 'Password123!',
      role: 'institution',
      institutionName: 'Beacon Engineering College',
      institutionCode: INST_B_CODE,
      collegeId: INST_B_CODE,
      district: 'Coimbatore'
    });
    instBToken = instBRes.data?.token;
    assert(instBRes.status === 201 && instBToken, 'Institution B registered and authenticated');

    // Company A
    const compARes = await req('POST', '/auth/register', {
      email: `recruiter.${ts}@compa.tech`,
      password: 'Password123!',
      role: 'company',
      companyName: 'CloudWave Technologies',
      companyId: COMP_A_ID,
      industry: 'Software & Cloud Architecture'
    });
    compAToken = compARes.data?.token;
    assert(compARes.status === 201 && compAToken, 'Company A registered and authenticated');

    // Company B
    const compBRes = await req('POST', '/auth/register', {
      email: `recruiter.${ts}@compb.tech`,
      password: 'Password123!',
      role: 'company',
      companyName: 'DataGrid Labs',
      companyId: COMP_B_ID,
      industry: 'Data Engineering & AI'
    });
    compBToken = compBRes.data?.token;
    assert(compBRes.status === 201 && compBToken, 'Company B registered and authenticated');

    // -------------------------------------------------------------------------
    // 2. SCENARIO A: New Student Registration & Truthful Zero State
    // -------------------------------------------------------------------------
    console.log('\n--- 2. New Student Zero State & Baseline Truth ---');

    const stuARes = await req('POST', '/auth/register', {
      email: `student.a.${ts}@insta.edu.in`,
      password: 'Password123!',
      role: 'student',
      fullName: 'Aravind Swaminathan',
      collegeId: INST_A_CODE,
      department: 'CSE',
      regNo: `REG_A_${ts}`,
      cgpa: '0.00',
      graduationYear: 2027
    });
    studentAToken = stuARes.data?.token;
    studentAId = stuARes.data?.user?.studentId || stuARes.data?.user?.id;
    assert(stuARes.status === 201 && studentAToken, 'Student A registered under Institution A');

    // Fetch Stats
    const statsRes = await req('GET', '/students/stats', null, studentAToken);
    const stats = statsRes.data?.data || {};
    assert(stats.skillsVerified === 0, 'New Student A has 0 verified skills');
    assert(stats.projectsCompleted === 0, 'New Student A has 0 completed projects');
    assert(stats.coursesCompleted === 0, 'New Student A has 0 completed courses');
    assert((stats.careerReadiness || 0) === 0, 'New Student A has strictly 0% readiness');

    // -------------------------------------------------------------------------
    // 3. SCENARIO B & C: Student Skills & Institution Student Visibility
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Student Skills & Institution Visibility ---');

    // Add manual skill
    const addSkillRes = await req('POST', '/skills', {
      name: 'Python',
      level: 'Intermediate',
      category: 'Programming'
    }, studentAToken);
    assert(addSkillRes.status === 201, 'Student A added manual skill (Python)');

    // Institution A views students
    const instAStudentsRes = await req('GET', '/academic/students', null, instAToken);
    const instAStudents = instAStudentsRes.data?.data || [];
    const foundStuA = instAStudents.find(s => s.studentId === studentAId || s.id === studentAId);
    assert(Boolean(foundStuA), 'Institution A sees Student A in student roster');

    // Institution B must NOT see Student A
    const instBStudentsRes = await req('GET', '/academic/students', null, instBToken);
    const instBStudents = instBStudentsRes.data?.data || [];
    const leakedInB = instBStudents.some(s => s.studentId === studentAId || s.id === studentAId);
    assert(!leakedInB, 'Institution B CANNOT see Student A (Strict Institution Isolation)');

    // -------------------------------------------------------------------------
    // 4. SCENARIO D: Company Access Security — Unauthorized Student Blocked (403)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Company Unauthorized Student Access Enforcement ---');

    // Company A attempts to view Student A before any access request is granted
    const unauthRes = await req('GET', `/company/students/${studentAId}`, null, compAToken);
    assert(unauthRes.status === 403, 'Company A is blocked (HTTP 403) from viewing unshared Student A');

    // -------------------------------------------------------------------------
    // 5. SCENARIOS E, F, G, H: Access Request, Pending State & Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Institution Access Request: Pending & Rejection Flow ---');

    // Institution A sends access request to Company A
    const req1Res = await req('POST', '/academic/industry-requests', {
      companyId: COMP_A_ID,
      studentIds: [studentAId],
      message: 'Requesting access for campus recruitment drive'
    }, instAToken);
    assert(req1Res.status === 201, 'Institution A sent access request to Company A');
    compAReqId = req1Res.data?.data?.id;

    // Company A views pending requests
    const compPendingRes = await req('GET', '/company/student-access-requests', null, compAToken);
    const pendingReq = (compPendingRes.data?.data || []).find(r => r.id === compAReqId);
    assert(pendingReq && pendingReq.status === 'PENDING', 'Company A sees request with PENDING status');

    // Company A rejects the request
    const rejectRes = await req('POST', `/company/student-access-requests/${compAReqId}/reject`, {}, compAToken);
    assert(rejectRes.status === 200 && rejectRes.data?.data?.status === 'REJECTED', 'Company A rejected access request');

    // Institution A sees rejection
    const instReqsRes = await req('GET', '/academic/industry-requests', null, instAToken);
    const reqAfterReject = (instReqsRes.data?.data || []).find(r => r.id === compAReqId);
    assert(reqAfterReject && reqAfterReject.status === 'REJECTED', 'Institution A receives REJECTED status update');

    // Verify Company A is STILL blocked after rejection
    const stillBlockedRes = await req('GET', `/company/students/${studentAId}`, null, compAToken);
    assert(stillBlockedRes.status === 403, 'Company A remains blocked (HTTP 403) after rejection');

    // -------------------------------------------------------------------------
    // 6. SCENARIOS I, J, K, L: Second Request & Acceptance
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Re-request & Acceptance Workflow ---');

    // Institution A sends request again
    const req2Res = await req('POST', '/academic/industry-requests', {
      companyId: COMP_A_ID,
      studentIds: [studentAId],
      message: 'Updated credentials for priority consideration'
    }, instAToken);
    compAReq2Id = req2Res.data?.data?.id;
    assert(req2Res.status === 201, 'Institution A sent second access request to Company A');

    // Company A accepts request
    const acceptRes = await req('POST', `/company/student-access-requests/${compAReq2Id}/accept`, {}, compAToken);
    assert(acceptRes.status === 200 && acceptRes.data?.data?.status === 'ACCEPTED', 'Company A accepted access request');

    // Institution A sees accepted status
    const instReqsRes2 = await req('GET', '/academic/industry-requests', null, instAToken);
    const reqAfterAccept = (instReqsRes2.data?.data || []).find(r => r.id === compAReq2Id);
    assert(reqAfterAccept && reqAfterAccept.status === 'ACCEPTED', 'Institution A sees ACCEPTED status');

    // -------------------------------------------------------------------------
    // 7. SCENARIOS L, M, N, O: Authorized Student Access & Cross-Tenant Security
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Authorized Student Access & Multi-Tenant Boundaries ---');

    // Company A now accesses Student A profile
    const authStuRes = await req('GET', `/company/students/${studentAId}`, null, compAToken);
    assert(authStuRes.status === 200, 'Company A successfully accesses authorized Student A (HTTP 200)');
    assert(authStuRes.data?.data?.name === 'Aravind Swaminathan', 'Student profile contains accurate name');
    assert(!authStuRes.data?.data?.passwordHash, 'Sensitive security fields (passwordHash) stripped');

    // Register Student B in Institution A
    const stuBRes = await req('POST', '/auth/register', {
      email: `student.b.${ts}@insta.edu.in`,
      password: 'Password123!',
      role: 'student',
      fullName: 'Bhavani Shankar',
      collegeId: INST_A_CODE,
      department: 'ECE',
      regNo: `REG_B_${ts}`,
      cgpa: '8.20',
      graduationYear: 2027
    });
    studentBId = stuBRes.data?.user?.studentId || stuBRes.data?.user?.id;

    // Company A attempts to view Student B (who was NOT included in the accepted request)
    const compAToStuB = await req('GET', `/company/students/${studentBId}`, null, compAToken);
    assert(compAToStuB.status === 403, 'Company A blocked (HTTP 403) from accessing unauthorized Student B');

    // Company B attempts to view Student A (authorized only for Company A)
    const compBToStuA = await req('GET', `/company/students/${studentAId}`, null, compBToken);
    assert(compBToStuA.status === 403, 'Company B blocked (HTTP 403) from accessing Student A (Company Isolation)');

    // -------------------------------------------------------------------------
    // 8. SCENARIO P: Continuous Student Development Timeline
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Continuous Student Development Timeline ---');

    const timelineRes = await req('GET', `/company/students/${studentAId}/development`, null, compAToken);
    assert(timelineRes.status === 200, 'Company A loaded development timeline');
    assert(Array.isArray(timelineRes.data?.data), 'Timeline returns array of chronological events');

    // -------------------------------------------------------------------------
    // 9. SCENARIOS Q, R, S, T: Industry Offerings, Applications, Interviews & Offers
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Industry Offerings, Applications, Interview & Offer Lifecycle ---');

    // Company A creates internship
    const oppRes = await req('POST', '/company/opportunities', {
      title: 'Full Stack Systems Engineer Intern',
      description: 'Distributed Go and React development internship',
      location: 'Chennai / Hybrid',
      type: 'Internship',
      stipend: '₹35,000 / month',
      skillsRequired: ['Python', 'JavaScript', 'SQL']
    }, compAToken);
    assert(oppRes.status === 201, 'Company A posted new internship');
    oppId = oppRes.data?.data?.oppId || oppRes.data?.data?.id;

    // Student A applies to internship
    const applyRes = await req('POST', `/opportunities/${oppId}/apply`, {
      resumeUrl: 'https://skillnexus.ai/resumes/aravind_swaminathan.pdf',
      coverNote: 'Excited to contribute to high-performance distributed systems'
    }, studentAToken);
    assert(applyRes.status === 201, 'Student A applied to Company A internship');
    applicationId = applyRes.data?.data?.applicationId || applyRes.data?.data?.id;

    // Company A schedules interview
    const interviewRes = await req('POST', '/company/interviews', {
      applicationId,
      studentId: studentAId,
      roundType: 'Technical Architecture Round',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      meetingLink: 'https://meet.skillnexus.ai/comp-a-tech-round'
    }, compAToken);
    assert(interviewRes.status === 201, 'Company A scheduled interview for Student A');

    // Company A extends offer
    const offerRes = await req('POST', `/company/applications/${applicationId}/offer`, {
      studentId: studentAId,
      opportunityId: oppId,
      offerDetails: {
        ctc: '₹14,00,000 / annum',
        role: 'Associate Software Engineer',
        startDate: '2027-06-01'
      }
    }, compAToken);
    assert(offerRes.status === 201 && offerRes.data?.data?.status === 'Offer', 'Company A extended placement offer to Student A');

    // -------------------------------------------------------------------------
    // 10. SCENARIOS U, V, W, X: Institution Assessment Tests & Multi-Language Engine
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Institution Assessment Tests & Multi-Language Questions ---');

    // Get programming languages
    const langsRes = await req('GET', '/academic/programming-languages', null, instAToken);
    const langs = langsRes.data?.data || [];
    assert(langs.length >= 5, `Retrieved ${langs.length} normalized programming languages from database`);
    const pyLang = langs.find(l => l.code === 'python');
    const javaLang = langs.find(l => l.code === 'java');
    const cppLang = langs.find(l => l.code === 'cpp');
    const jsLang = langs.find(l => l.code === 'javascript');
    assert(Boolean(pyLang && javaLang && cppLang && jsLang), 'Found Python, Java, C++, and JavaScript in database');

    // Institution A creates Programming Assessment
    const createAsmtRes = await req('POST', '/academic/assessments', {
      title: 'Advanced Algorithmic Programming & Data Structures',
      assessmentType: 'PROGRAMMING',
      durationMinutes: 60,
      totalMarks: 100,
      difficulty: 'Advanced'
    }, instAToken);
    assert(createAsmtRes.status === 201, 'Institution A created Programming Assessment');
    progAssessmentId = createAsmtRes.data?.data?.id;

    // Add Python question
    const q1Res = await req('POST', `/academic/assessments/${progAssessmentId}/questions`, {
      topic: 'Dynamic Programming in Python',
      questionText: 'What is the time complexity of top-down memoized Fibonacci in Python with lru_cache?',
      difficulty: 'Medium',
      marks: 25,
      programmingLanguageId: pyLang.id,
      languageCode: 'python',
      options: [
        { text: 'O(N) time and O(N) space', isCorrect: true },
        { text: 'O(2^N) exponential time', isCorrect: false },
        { text: 'O(1) constant time', isCorrect: false }
      ]
    }, instAToken);
    assert(q1Res.status === 201, 'Added Python question to assessment');

    // Add Java question
    const q2Res = await req('POST', `/academic/assessments/${progAssessmentId}/questions`, {
      topic: 'Concurrency in Java',
      questionText: 'Which class provides lock-free thread-safe updates to a 64-bit integer in Java?',
      difficulty: 'Hard',
      marks: 25,
      programmingLanguageId: javaLang.id,
      languageCode: 'java',
      options: [
        { text: 'AtomicLong', isCorrect: true },
        { text: 'volatile Long', isCorrect: false },
        { text: 'SynchronizedLong', isCorrect: false }
      ]
    }, instAToken);
    assert(q2Res.status === 201, 'Added Java question to assessment');

    // Publish assessment
    const pubRes = await req('POST', `/academic/assessments/${progAssessmentId}/publish`, {}, instAToken);
    assert(pubRes.status === 200 && pubRes.data?.data?.status === 'PUBLISHED', 'Institution A published assessment');

    // -------------------------------------------------------------------------
    // 11. SCENARIOS Y & Z: Course-Language Mapping & Student Eligibility Filtering
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Course-Language Mapping & Student Question Eligibility ---');

    // Institution A creates Python AI Course
    const courseRes = await req('POST', '/academic/courses', {
      title: 'Applied AI & Neural Architecture with Python',
      code: 'CS-801-PY',
      category: 'Artificial Intelligence',
      duration: '8 Weeks',
      hours: 32
    }, instAToken);
    assert(courseRes.status === 201, 'Institution A created AI & Python course');
    courseAId = courseRes.data?.data?.courseId || courseRes.data?.data?.id;

    // Enroll Student A in Course A
    const enrollRes = await req('POST', '/academic/enrollments', {
      student: studentAId,
      course: courseAId
    }, instAToken);
    assert(enrollRes.status === 201, 'Student A enrolled in Python AI course');

    // Student A fetches assessment questions
    const stuQuestionsRes = await req('GET', `/assessments/institution/${progAssessmentId}`, null, studentAToken);
    assert(stuQuestionsRes.status === 200, 'Student A loaded institution assessment');
    const servedQuestions = stuQuestionsRes.data?.data?.questions || [];
    
    // Check that student enrolled in Python course gets Python question, not Java
    const hasPythonQ = servedQuestions.some(q => q.languageCode === 'python' || q.programmingLanguageId === pyLang.id);
    const hasJavaQ = servedQuestions.some(q => q.languageCode === 'java' || q.programmingLanguageId === javaLang.id);
    assert(hasPythonQ, 'Student A receives eligible Python question matching course enrollment');
    assert(!hasJavaQ, 'Student A DOES NOT receive ineligible Java question (Strict Eligibility Filter)');

    // -------------------------------------------------------------------------
    // 12. SCENARIO AA: Assessment Submission, Scoring & Readiness Recalculation
    // -------------------------------------------------------------------------
    console.log('\n--- 12. Assessment Submission & Authoritative Scoring ---');

    const submitRes = await req('POST', `/assessments/institution/${progAssessmentId}/submit`, {
      answers: {}
    }, studentAToken);
    assert(submitRes.status === 200, 'Student A submitted assessment attempt');
    assert(submitRes.data?.data?.percentage >= 0, 'Computed valid numeric percentage');

    const institutionResultsRes = await req('GET', `/academic/assessments/${progAssessmentId}/results`, null, instAToken);
    const institutionResults = institutionResultsRes.data?.data || [];
    const studentResult = institutionResults.find(result => result.studentId === studentAId);
    assert(institutionResultsRes.status === 200, 'Institution loaded persisted assessment results');
    assert(studentResult && studentResult.score === submitRes.data?.data?.percentage,
      'Institution sees Student A assessment score');

    // -------------------------------------------------------------------------
    // 13. SCENARIOS AB & AC: Course Progression Invariants & Duplicate Idempotence
    // -------------------------------------------------------------------------
    console.log('\n--- 13. Deterministic Course Progress & Idempotence ---');

    // Enroll Student A in SRMIST Deep Learning Course
    const deepLearningCourseId = 'CRS-TN010-01';
    await req('POST', '/learning/enroll', { courseId: deepLearningCourseId }, studentAToken);

    // Verify Continue is Read-Only
    const resumeRes1 = await req('GET', `/learning/${deepLearningCourseId}/resume`, null, studentAToken);
    const progBefore = resumeRes1.data?.data?.progress || 0;

    const resumeRes2 = await req('GET', `/learning/${deepLearningCourseId}/resume`, null, studentAToken);
    const progAfter = resumeRes2.data?.data?.progress || 0;
    assert(progBefore === progAfter, 'GET /learning/:id/resume is strictly READ-ONLY (progress unchanged)');

    // Complete Module 1
    const comp1 = await req('POST', `/learning/${deepLearningCourseId}/modules/1/complete`, {}, studentAToken);
    const progM1 = comp1.data?.data?.progressPercentage;
    assert(progM1 > 0, `Completing module 1 explicitly advanced progress to ${progM1}%`);

    // Duplicate Completion on Module 1 (Must be idempotent)
    const comp2 = await req('POST', `/learning/${deepLearningCourseId}/modules/1/complete`, {}, studentAToken);
    const progM2 = comp2.data?.data?.progressPercentage;
    assert(progM1 === progM2, `Duplicate completion click is IDEMPOTENT (remains ${progM2}%)`);

    // -------------------------------------------------------------------------
    // 14. SUMMARY & RESULT
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TOTAL SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('Fatal Suite Execution Error:', error);
    process.exit(1);
  }
}

runThreePortalIntegrationSuite();
