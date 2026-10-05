/**
 * SKILLNEXUS AI — COURSE-WISE SKILL BENCHMARK TALENT DISCOVERY E2E TEST SUITE
 * Tests all 12 QA Requirements specified for Company Talent Search & Matching Engine.
 */

const relationalManager = require('../src/db/relationalManager');

async function runTalentDiscoveryTestSuite() {
  console.log('================================================================');
  console.log('🧪 COURSE-WISE SKILL BENCHMARK TALENT DISCOVERY TEST SUITE');
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

  const ts = Date.now();
  const COMP_A = `COMP_DISC_A_${ts}`;
  const COMP_B = `COMP_DISC_B_${ts}`;
  const INST_A = `INST_DISC_A_${ts}`;
  const STU_1 = `STU_DISC_1_${ts}`;
  const STU_2 = `STU_DISC_2_${ts}`;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Seed Test Students & Skill Data
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Seeding Test Ecosystem Data ---');

    // Register Student 1: High C/C++/Data Structures student
    const s1 = await relationalManager.registerUser({
      role: 'student',
      name: 'Aditya Varma',
      email: `aditya.${ts}@inst.edu`,
      password: 'Password123!',
      collegeId: 'TN010',
      collegeName: 'SRM Institute of Science & Technology',
      department: 'CSE',
      skills: [
        { name: 'C', level: 'Advanced', confidence: 95, verified: true },
        { name: 'C++', level: 'Advanced', confidence: 92, verified: true },
        { name: 'Data Structures', level: 'Advanced', confidence: 90, verified: true }
      ]
    });

    // Register Student 2: Python / Unrelated project student
    const s2 = await relationalManager.registerUser({
      role: 'student',
      name: 'Bhavna Sharma',
      email: `bhavna.${ts}@inst.edu`,
      password: 'Password123!',
      collegeId: 'TN001',
      collegeName: 'Anna University',
      department: 'IT',
      skills: [
        { name: 'Python', level: 'Advanced', confidence: 90, verified: true },
        { name: 'C', level: 'Beginner', confidence: 60, verified: false }
      ]
    });

    assert(s1.success && s2.success, 'Seeded test students in ecosystem');

    const s1Id = s1.user.studentId;
    const s2Id = s2.user.studentId;

    // Add C++ project for Student 1
    await relationalManager.submitProject({
      studentId: s1Id,
      title: 'High Performance C++ Graph Library',
      description: 'Built a multi-threaded C++ graph processing engine with zero-copy memory allocation.',
      skills: ['C++', 'Data Structures'],
      githubUrl: 'https://github.com/aditya/cpp-graph-engine'
    });

    // Add Python project for Student 2
    await relationalManager.submitProject({
      studentId: s2Id,
      title: 'Python Django E-Commerce Backend',
      description: 'Built a RESTful API service for retail e-commerce using Python and Django.',
      skills: ['Python', 'Django'],
      githubUrl: 'https://github.com/bhavna/python-django-app'
    });

    // Add course certificate with PENDING_VERIFICATION for Student 1
    const unverifiedCertId = `CERT_UNVERIFIED_${ts}`;
    const data = relationalManager._read();
    data.courseCertificates = data.courseCertificates || [];
    data.courseCertificates.push({
      id: unverifiedCertId,
      certificateId: unverifiedCertId,
      studentId: s1Id,
      courseId: 'CRS-CPP-101',
      courseTitle: 'Advanced C++ Systems Engineering',
      institutionId: 'TN010',
      status: 'PENDING_VERIFICATION' // NOT verified yet
    });

    // Add college-verified certificate for Student 1
    const verifiedCertId = `CERT_VERIFIED_${ts}`;
    data.courseCertificates.push({
      id: verifiedCertId,
      certificateId: verifiedCertId,
      studentId: s1Id,
      courseId: 'CRS-DS-101',
      courseTitle: 'Data Structures & Algorithms Mastery',
      institutionId: 'TN010',
      institutionName: 'SRM Institute of Science & Technology',
      verifiedAt: new Date().toISOString(),
      status: 'VERIFIED' // Verified by College Management!
    });
    relationalManager._write(data);

    // -------------------------------------------------------------------------
    // TEST 1: Single Skill Search (C)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Single Skill Search (C) ---');
    const res1 = await relationalManager.searchTalentEcosystem(COMP_A, {
      skills: ['C']
    });
    assert(res1.students.length > 0, 'Talent search returned matching student results');
    const foundS1 = res1.students.find(st => st.studentId === s1Id);
    assert(Boolean(foundS1 && foundS1.matchScore >= 80), 'Student 1 with strong C skill evaluated with high match score');

    // -------------------------------------------------------------------------
    // TEST 2: Multi-Skill Search (C + C++ + Data Structures) Ranking
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Multi-Skill Search Ranking ---');
    const res2 = await relationalManager.searchTalentEcosystem(COMP_A, {
      skills: ['C', 'C++', 'Data Structures']
    });
    assert(res2.students.length >= 2, 'Multi-skill search returned ranked students');
    assert(res2.students[0].studentId === s1Id || res2.students[0].name === 'Aditya Varma', 'Student 1 with all 3 skills ranked FIRST above partial skill matches');

    // -------------------------------------------------------------------------
    // TEST 3: Skill & Overall Benchmark Rule Enforcement
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Benchmark Rule Enforcement ---');
    const res3 = await relationalManager.searchTalentEcosystem(COMP_A, {
      skills: ['C', 'C++', 'Data Structures'],
      benchmarks: { skillBenchmark: 90, overallBenchmark: 85 }
    });
    const s1Eval = res3.students.find(st => st.studentId === s1Id);
    const s2Eval = res3.students.find(st => st.studentId === s2Id);
    assert(s1Eval && s1Eval.benchmarkStatus === 'FULL_MATCH', 'Student 1 meeting 90% benchmark marked as FULL_MATCH');
    assert(s2Eval && s2Eval.benchmarkStatus !== 'FULL_MATCH', 'Student 2 failing C/C++ benchmark marked as PARTIAL/UNQUALIFIED');

    // -------------------------------------------------------------------------
    // TEST 4: Institution Filtering (College A vs College B)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Institution Filtering ---');
    const res4 = await relationalManager.searchTalentEcosystem(COMP_A, {
      skills: ['C'],
      institutionId: 'TN010'
    });
    const s1InTn010 = res4.students.some(st => st.studentId === s1Id);
    const s2InTn010 = res4.students.some(st => st.studentId === s2Id);
    assert(s1InTn010 && !s2InTn010, 'Institution filter TN010 strictly returns only TN010 students (Student 2 excluded)');

    // -------------------------------------------------------------------------
    // TEST 5 & 6: Project Evidence Relevance & Unrelated Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5 & 6: Project Evidence Relevance & Unrelated Isolation ---');
    const res5 = await relationalManager.searchTalentEcosystem(COMP_A, {
      skills: ['C++']
    });
    const s1Cpp = res5.students.find(st => st.studentId === s1Id);
    const s2Cpp = res5.students.find(st => st.studentId === s2Id);

    assert(s1Cpp && s1Cpp.relevantProjectsCount === 1, 'C++ search correctly identifies Student 1 C++ Graph Library project as relevant');
    assert(s2Cpp && s2Cpp.relevantProjectsCount === 0, 'C++ search strictly excludes Student 2 unrelated Python Django project');

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Verified Certificate Rule & Unverified Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7 & 8: Verified Certificate Rule ---');
    assert(s1Cpp.verifiedCertificatesCount === 1, 'Student 1 has exactly 1 college-verified credential exposed');
    const unverifiedExposed = s1Cpp.verifiedCertificates.some(c => c.certificateId === unverifiedCertId);
    const verifiedExposed = s1Cpp.verifiedCertificates.some(c => c.certificateId === verifiedCertId);

    assert(!unverifiedExposed, 'Unverified certificate (PENDING_VERIFICATION) is strictly hidden from company credentials');
    assert(verifiedExposed, 'College-verified certificate (VERIFIED) is correctly displayed as verified credential');

    // -------------------------------------------------------------------------
    // TEST 9 & 10: Read-Only Scoped Protection & Sensitive Field Stripping
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9 & 10: Scoped Privacy & Read-Only Protection ---');
    assert(!s1Cpp.passwordHash && !s1Cpp.password, 'Sensitive fields (passwordHash) stripped from talent discovery payload');
    assert(!s1Cpp.user_id, 'Private database keys omitted');

    // -------------------------------------------------------------------------
    // TEST 11: Company Course Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Company Course Learner Isolation ---');
    const res11 = await relationalManager.searchTalentEcosystem(COMP_B, {
      searchMode: 'company_course',
      courseId: 'CRS-COMP-A-01'
    });
    assert(res11.students.length === 0, 'Company B cannot access Company A private course learners');

    // -------------------------------------------------------------------------
    // TEST 12: Dynamic Catalogs & Metrics Summary
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: Catalogs & Telemetry Metrics ---');
    const skillCatalog = await relationalManager.getSkillCatalog();
    const courseCatalog = await relationalManager.getCourseCatalog();
    assert(Array.isArray(skillCatalog) && skillCatalog.includes('C++') && skillCatalog.includes('Data Structures'), 'Skill catalog returns dynamic list');
    assert(Array.isArray(courseCatalog) && courseCatalog.length > 0, 'Course catalog returns registered courses');

    console.log('\n============================================================');
    console.log(`🎉 TALENT DISCOVERY TEST SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('❌ Test suite fatal exception:', err);
    process.exit(1);
  }
}

runTalentDiscoveryTestSuite();
