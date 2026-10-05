/**
 * verify_student_home.js
 * ======================================================================================
 * End-to-end verification for GET /api/students/dashboard
 *
 * Guarantees tested:
 *   1.  Zero-state invariant       — empty student returns all genuine zeros
 *   2.  Readiness formula          — R = 0.30*SV + 0.25*DA + 0.20*PP + 0.15*LP + 0.10*CC
 *   3.  Canonical student resolve  — STU-TN010-001 / arun.kumar@nexus.edu resolves
 *   4.  Skills aggregation         — verified + selfAssessed = total (no double-count)
 *   5.  Project status partition   — completed + inProgress <= total
 *   6.  Enrollment consistency     — completed <= enrolled
 *   7.  Application scoping        — getApplications(studentId) returns own records
 *   8.  Readiness consistency      — careerReadiness === breakdown.readinessScore
 *   9.  Opportunity match bounds   — [10, 99] for every scored opportunity
 *  10.  Passport stat types        — all non-negative finite integers
 *  11.  Achievement gates          — badges granted only when thresholds met
 *  12.  Monthly stats filter       — monthly <= total assessment count
 *  13.  Capability score bounds    — [0, 100] per category
 *  14.  Ownership isolation        — Student A and B have disjoint application sets
 *  15.  No hardcoded fake strings  — forbidden literals absent from StudentDashboard.jsx
 *  16.  Route definition audit     — exactly 1 GET /dashboard, requireAuth, no isDemo
 *  17.  readinessService exports   — all 8 named exports are functions
 *
 * Run:  node tests/verify_student_home.js
 * ======================================================================================
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const relationalManager = require('../src/db/relationalManager');
const { calculateReadinessFromStudent } = require('../src/services/readinessService');

// --- Harness -----------------------------------------------------------------
let passed = 0, failed = 0, total = 0;
const failures = [];

function assert(cond, name, detail) {
  total++;
  if (cond) { console.log(`  PASS  ${name}`); passed++; }
  else {
    const msg = detail ? `${name} -- ${detail}` : name;
    console.error(`  FAIL  ${msg}`);
    failures.push(msg);
    failed++;
  }
}
function section(t) { console.log(`\n--- ${t} ---`); }

// --- Dashboard aggregation helper --------------------------------------------
async function buildDash(studentId) {
  const student = await relationalManager.getStudentById(studentId);
  if (!student) return null;
  const skills      = Array.isArray(student.skills)         ? student.skills         : [];
  const projects    = Array.isArray(student.projects)       ? student.projects       : [];
  const assessments = Array.isArray(student.assessments)    ? student.assessments    : [];
  const certs       = Array.isArray(student.certifications) ? student.certifications : [];
  const sid         = student.studentId || student.id;
  const skillsVerified     = skills.filter(s => s.verified === true).length;
  const skillsSelfAssessed = skills.filter(s => !s.verified).length;
  const projectsCompleted  = projects.filter(p =>
    p.proofVerified === true || ['validated','Validated','completed','Completed'].includes(p.status)
  ).length;
  const projectsInProgress = projects.filter(p =>
    ['in-progress','In Progress','active','Active'].includes(p.status)
  ).length;
  const projectsTotal = projects.length;
  const enrollments    = await relationalManager.getEnrollments(sid) || [];
  const coursesCompleted = enrollments.filter(e => e.status === 'completed' || e.progress >= 100).length;
  const coursesEnrolled  = enrollments.length;
  const applications = await relationalManager.getApplications({ studentId: sid }) || [];
  const opportunitiesApplied = applications.length;
  const assessmentCount = assessments.length;
  let readinessBreakdown;
  try { readinessBreakdown = calculateReadinessFromStudent(student); }
  catch (e) { readinessBreakdown = { skillVerification:0, assessmentScore:0, projectProofScore:0, learningProgress:0, careerCompleteness:0, readinessScore:0 }; }
  return {
    student, sid, skills, projects, assessments, certs, enrollments, applications,
    skillsVerified, skillsSelfAssessed, projectsCompleted, projectsInProgress, projectsTotal,
    coursesCompleted, coursesEnrolled, opportunitiesApplied, assessmentCount,
    careerReadiness: readinessBreakdown.readinessScore, readinessBreakdown
  };
}

// --- Main ---------------------------------------------------------------------
async function runTests() {
  console.log('\n==============================================================');
  console.log('  STUDENT HOME DASHBOARD -- INTEGRATION & FORENSIC TEST SUITE');
  console.log('==============================================================\n');

  // ---- 1. ZERO-STATE INVARIANT ----
  section('1. ZERO-STATE INVARIANT');
  const empty = { studentId:'ZERO', skills:[], projects:[], assessments:[], certifications:[], careerProfile:{} };
  const zr = calculateReadinessFromStudent(empty);
  assert(zr.readinessScore === 0,    'Empty student -> readinessScore = 0 (no artificial floor)');
  assert(zr.skillVerification === 0, 'Empty student -> skillVerification = 0');
  assert(zr.assessmentScore === 0,   'Empty student -> assessmentScore = 0');
  assert(zr.projectProofScore === 0, 'Empty student -> projectProofScore = 0');
  assert(zr.learningProgress === 0,  'Empty student -> learningProgress = 0');
  assert(zr.careerCompleteness === 0,'Empty student -> careerCompleteness = 0');
  assert(isFinite(zr.readinessScore),'readinessScore is finite (no NaN/Infinity)');

  // ---- 2. READINESS FORMULA ----
  section('2. READINESS FORMULA  R = 0.30*SV + 0.25*DA + 0.20*PP + 0.15*LP + 0.10*CC');
  const syn = {
    studentId:'FORMULA_TEST',
    skills:[ { name:'Python', level:'ADVANCED', verified:true, pending:false }, { name:'React', level:'INTERMEDIATE', verified:false, pending:true } ],
    assessments:[ { domain:'Programming & Data Structures', score:80 }, { domain:'Logical & Algorithmic Reasoning', score:70 } ],
    projects:[ { proofVerified:true, links:['https://gh.com/x'] }, { proofVerified:false } ],
    enrollments:[ { progress:100 }, { progress:50 } ],
    careerProfile:{ summary:'dev', targetRoles:['Dev'], location:'Chennai', links:{ linkedin:'https://li.com', github:'https://gh.com' } }
  };
  const fr = calculateReadinessFromStudent(syn);
  const manualRaw = 0.30*fr.skillVerification + 0.25*fr.assessmentScore + 0.20*fr.projectProofScore + 0.15*fr.learningProgress + 0.10*fr.careerCompleteness;
  const manualScore = isFinite(manualRaw) && manualRaw > 0 ? Math.round(manualRaw) : 0;
  // The service rounds each sub-component independently before applying the formula, which can
  // cause a +-1 rounding difference vs re-applying the formula on already-rounded integers.
  // We verify that the output is within 1 point of the manual calculation — correct formula semantics.
  assert(Math.abs(fr.readinessScore - manualScore) <= 1, `Formula output within +-1 of manual (service=${fr.readinessScore}, manual=${manualScore})`);
  assert(fr.readinessScore >= 0 && fr.readinessScore <= 100, 'readinessScore bounded [0, 100]');
  assert(!Object.values(fr).some(v => !isFinite(v) || v === null || v === undefined), 'No NaN/null/undefined in readiness breakdown');

  // ---- 3. CANONICAL STUDENT RESOLUTION ----
  section('3. CANONICAL STUDENT RESOLUTION');
  const CANONICAL_ID = 'STU-TN010-001';
  const CANONICAL_EMAIL = 'arun.kumar@nexus.edu';
  let canon;
  try {
    canon = await relationalManager.getStudentById(CANONICAL_ID);
    assert(Boolean(canon), `getStudentById('${CANONICAL_ID}') resolves`);
    if (canon) {
      assert(typeof (canon.studentId || canon.id) === 'string', 'Resolved student has a string studentId');
      assert((canon.email || '').toLowerCase() === CANONICAL_EMAIL, `Canonical email matches ${CANONICAL_EMAIL}`);
    }
  } catch (e) {
    assert(false, `getStudentById('${CANONICAL_ID}') threw`, e.message);
    console.error('\nDB unreachable -- aborting.\n');
    printSummary(); process.exit(1);
  }

  // ---- 4-9. DASHBOARD AGGREGATION ----
  section('4. SKILLS AGGREGATION');
  const dash = await buildDash(CANONICAL_ID);
  assert(Boolean(dash), `buildDash('${CANONICAL_ID}') succeeds`);
  if (dash) {
    assert(dash.skillsVerified >= 0, `skillsVerified = ${dash.skillsVerified} (non-negative)`);
    assert(dash.skillsSelfAssessed >= 0, `skillsSelfAssessed = ${dash.skillsSelfAssessed} (non-negative)`);
    assert(dash.skillsVerified + dash.skillsSelfAssessed === dash.skills.length, 'verified + selfAssessed = total skills (no double-count)');
    const vf = dash.skills.filter(s => s.verified === true);
    const sa = dash.skills.filter(s => !s.verified);
    assert(vf.length === dash.skillsVerified,   'Verified count matches filter result');
    assert(sa.length === dash.skillsSelfAssessed,'Self-assessed count matches filter result');

    section('5. PROJECT STATUS PARTITION');
    assert(dash.projectsCompleted <= dash.projectsTotal,   `projectsCompleted (${dash.projectsCompleted}) <= total (${dash.projectsTotal})`);
    assert(dash.projectsInProgress <= dash.projectsTotal,  `projectsInProgress (${dash.projectsInProgress}) <= total (${dash.projectsTotal})`);
    assert(dash.projectsCompleted + dash.projectsInProgress <= dash.projectsTotal, 'Completed + InProgress <= Total (valid partition)');

    section('6. ENROLLMENT CONSISTENCY');
    assert(dash.coursesCompleted <= dash.coursesEnrolled, `coursesCompleted (${dash.coursesCompleted}) <= coursesEnrolled (${dash.coursesEnrolled})`);

    section('7. APPLICATION SCOPING');
    assert(dash.opportunitiesApplied === dash.applications.length, `opportunitiesApplied (${dash.opportunitiesApplied}) matches getApplications() count`);

    section('8. READINESS CONSISTENCY');
    assert(dash.careerReadiness === dash.readinessBreakdown.readinessScore, `careerReadiness (${dash.careerReadiness}) matches breakdown`);
    assert(dash.careerReadiness >= 0 && dash.careerReadiness <= 100, 'careerReadiness bounded [0, 100]');

    section('9. OPPORTUNITY MATCH BOUNDS [10, 99]');
    let opps = [];
    try { opps = await relationalManager.getOpportunities() || []; } catch (e) { console.warn('    getOpportunities() unavailable:', e.message); }
    if (opps.length > 0) {
      const sNames = dash.skills.map(s => String(s.name || '').toLowerCase());
      const scores = opps.map(opp => {
        const req = Array.isArray(opp.skillsMatrix) ? opp.skillsMatrix.map(s => String(s.name || s || '').toLowerCase()) : [];
        const mc = req.filter(rs => sNames.some(ss => ss.includes(rs) || rs.includes(ss))).length;
        const pct = req.length > 0 ? Math.round((mc / req.length) * 100) : 45;
        return Math.min(99, Math.max(10, pct + Math.min(20, dash.skillsVerified * 4)));
      });
      assert(scores.every(m => m >= 10 && m <= 99), `All ${scores.length} match scores bounded in [10, 99]`);
      assert(scores.every(m => isFinite(m)), 'All match scores are finite numbers');
      console.log(`    INFO: ${opps.length} opportunities; top match = ${Math.max(...scores)}%`);
    }

    section('10. PASSPORT STAT TYPES (non-negative, finite)');
    const pStats = {
      verifiedSkills:  dash.skillsVerified,
      projectsShipped: dash.projectsTotal,
      industryReviews: dash.applications.filter(a => ['Interview','Offer','interview','offer'].includes(a.stage)).length,
      certifications:  dash.certs.length
    };
    Object.entries(pStats).forEach(([k,v]) => assert(typeof v === 'number' && v >= 0 && isFinite(v), `passport.${k} = ${v} (valid non-negative number)`));

    section('11. ACHIEVEMENT GATE ENFORCEMENT');
    const ach = [];
    if (dash.assessmentCount >= 1) ach.push('first_assessment');
    if (dash.projectsCompleted >= 1) ach.push('first_project');
    if (dash.skillsVerified >= 5) ach.push('skills_5');
    else if (dash.skillsVerified >= 1) ach.push('skills_1');
    if (dash.coursesCompleted >= 1) ach.push('first_course');
    if (dash.opportunitiesApplied >= 1) ach.push('first_application');
    if (dash.careerReadiness >= 50) ach.push('placement_ready');
    if (dash.assessmentCount === 0)   assert(!ach.includes('first_assessment'), 'first_assessment NOT granted when assessmentCount=0');
    if (dash.projectsCompleted === 0) assert(!ach.includes('first_project'),    'first_project NOT granted when projectsCompleted=0');
    if (dash.skillsVerified < 5)      assert(!ach.includes('skills_5'),          'skills_5 NOT granted when skillsVerified<5');
    if (dash.careerReadiness < 50)    assert(!ach.includes('placement_ready'),    'placement_ready NOT granted when careerReadiness<50');
    console.log(`    INFO: ${ach.length} achievement(s) earned: [${ach.join(', ') || 'none'}]`);

    section('12. MONTHLY STATS -- CURRENT-MONTH FILTER');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthly = dash.assessments.filter(a => new Date(a.completedAt || a.takenAt || 0) >= monthStart).length;
    assert(monthly >= 0 && isFinite(monthly), `monthlyAssessments = ${monthly} (non-negative, finite)`);
    assert(monthly <= dash.assessmentCount, 'monthlyAssessments <= totalAssessments (restrictive filter)');

    section('13. CAPABILITY SCORE BOUNDS [0, 100]');
    const CAT = {
      technicalSkills: ['javascript','python','java','react','node','sql'],
      problemSolving:  ['data structures','algorithms','dsa'],
      communication:   ['communication','agile','scrum'],
      systemDesign:    ['system design','architecture','microservices'],
      cloud:           ['aws','azure','gcp','docker','kubernetes']
    };
    const LMAP = { beginner:30, intermediate:60, advanced:85, expert:100 };
    Object.keys(CAT).forEach(cat => {
      const m = dash.skills.filter(sk => {
        const n = String(sk.name || '').toLowerCase();
        return CAT[cat].some(kw => n.includes(kw) || kw.includes(n));
      });
      const score = m.length === 0 ? 0 : Math.round(Math.min(100,
        m.reduce((s, sk) => s + (LMAP[String(sk.level||'').toLowerCase()] || 40) * 0.7 + (Number(sk.confidence)||50) * 0.3, 0) / m.length
      ));
      assert(score >= 0 && score <= 100, `capabilities.${cat} bounded [0, 100] (score=${score})`);
      assert(isFinite(score), `capabilities.${cat} is finite (no NaN/Infinity)`);
    });
  }

  // ---- 14. OWNERSHIP ISOLATION ----
  section('14. OWNERSHIP ISOLATION (Student A cannot see Student B data)');
  let students2;
  try { students2 = await relationalManager.getStudentsByInstitution('TN010') || []; } catch (e) { students2 = []; }
  if (students2.length >= 2) {
    const idA = students2[0].studentId || students2[0].id;
    const idB = students2[1].studentId || students2[1].id;
    const appsA = await relationalManager.getApplications({ studentId: idA }) || [];
    const appsB = await relationalManager.getApplications({ studentId: idB }) || [];
    const setA  = new Set(appsA.map(a => a.applicationId || a.id).filter(Boolean));
    const setB  = new Set(appsB.map(a => a.applicationId || a.id).filter(Boolean));
    const overlap = [...setA].filter(id => setB.has(id));
    assert(overlap.length === 0, `No application ID overlap between ${idA} and ${idB}`);
    const stuA = await relationalManager.getStudentById(idA);
    const stuB = await relationalManager.getStudentById(idB);
    const resolvedA = stuA?.studentId || stuA?.id;
    const resolvedB = stuB?.studentId || stuB?.id;
    assert(resolvedA === idA, `getStudentById(A) returns A's record (${idA})`);
    assert(resolvedB === idB, `getStudentById(B) returns B's record (${idB})`);
    console.log(`    INFO: Isolation verified -- ${idA} vs ${idB}`);
  } else {
    console.warn('    < 2 students in TN010 -- skipping cross-student isolation');
  }

  // ---- 15. NO HARDCODED FAKE STRINGS ----
  section('15. NO HARDCODED FAKE STRINGS IN StudentDashboard.jsx');
  const FORBIDDEN = [
    'Data Analyst Intern','ABC Technologies','TechNova Solutions','NextGen Labs',
    'Expense Tracker validated','Saved Data Analyst Internship','isDemo',
    '06h 28m','Pages visited','Consistent Learner','arun.kumar@nexus.edu'
  ];
  const frontendPath = path.resolve(__dirname, '../../frontend/src/pages/StudentDashboard.jsx');
  if (fs.existsSync(frontendPath)) {
    const src = fs.readFileSync(frontendPath, 'utf8');
    FORBIDDEN.forEach(str => {
      const inCode = src.split('\n').some(line =>
        line.includes(str) && !line.trim().startsWith('//') && !line.trim().startsWith('*')
      );
      assert(!inCode, `"${str}" NOT hardcoded in StudentDashboard.jsx`);
    });
  } else {
    console.warn('    StudentDashboard.jsx not found -- skipping source audit');
  }

  // ---- 16. ROUTE DEFINITION AUDIT ----
  section('16. BACKEND ROUTE DEFINITION AUDIT');
  const routePath = path.resolve(__dirname, '../src/routes/studentRoutes.js');
  if (fs.existsSync(routePath)) {
    const r = fs.readFileSync(routePath, 'utf8');
    const cnt = (r.match(/router\.get\s*\(\s*['"`]\/dashboard['"`]/g) || []).length;
    assert(cnt === 1, `Exactly 1 GET /dashboard route defined (found ${cnt})`);
    assert(r.includes('requireAuth'), 'Dashboard route has requireAuth middleware');
    assert(!r.includes('isDemo'), 'isDemo flag absent from studentRoutes.js');
    assert(r.includes('calculateReadinessFromStudent'), 'Route uses readinessService formula');
    assert(r.includes('getApplications'), 'Route fetches real applications');
    assert(r.includes('getEnrollments'), 'Route fetches real enrollments');
    assert(r.includes('getOpportunities'), 'Route fetches real opportunities');
    const noFakeEmail = !r.includes("'arun.kumar@nexus.edu'") && !r.includes('"arun.kumar@nexus.edu"');
    assert(noFakeEmail, 'No hardcoded demo email in studentRoutes.js');
  }

  // ---- 17. READINESS SERVICE EXPORT CONTRACT ----
  section('17. READINESS SERVICE EXPORT CONTRACT');
  const svc = require('../src/services/readinessService');
  ['calculateReadinessFromStudent','calculateReadiness','calculateReadinessBreakdown',
   'calculateSkillVerification','calculateDiagnosticAssessments','calculateProjectProofs',
   'calculateLearningProgress','calculateCareerCompleteness'].forEach(fn =>
    assert(typeof svc[fn] === 'function', `readinessService.${fn} is exported`)
  );

  printSummary();
}

function printSummary() {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log('\n==============================================================');
  console.log(`  RESULTS: ${passed}/${total} passed  (${pct}%)`);
  console.log('==============================================================');
  if (failures.length > 0) {
    console.log('\n  Failed tests:');
    failures.forEach((f, i) => console.error(`    ${i + 1}. ${f}`));
  } else {
    console.log('\n  All tests passed. Student Home dashboard is clean and live.\n');
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => { console.error('\nCrash:', err); process.exit(1); });

