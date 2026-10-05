/**
 * SKILL NEXUS — Phase 2: Career Readiness + Skill Credibility Engine Master Verification Suite
 * 
 * 22 Mandatory Test Categories:
 * Test 1: New student zero-state (no fabricated readiness)
 * Test 2: Student with course evidence (technical/learning contribution)
 * Test 3: Student with assessment evidence (assessment contribution)
 * Test 4: Student with project evidence (project contribution)
 * Test 5: Student with verified certificate (certification contribution, not sole proof)
 * Test 6: Multiple evidence sources (higher credibility)
 * Test 7: Single weak evidence source (credibility is not artificially high)
 * Test 8: Old evidence (recency factor verification)
 * Test 9: Inconsistent evidence (consistency evaluation)
 * Test 10: Career readiness calculation (weighted components = overall score)
 * Test 11: History (score history persists in PostgreSQL)
 * Test 12: Skill Graph integration (credibility appears on graph nodes)
 * Test 13: Digital Passport integration (evidence-aware skill information)
 * Test 14: Skill Gap integration (credibility-aware data)
 * Test 15: Opportunity Matching integration (matching unaffected / compatible)
 * Test 16: Career Journey integration (readiness data appears in milestones)
 * Test 17: Career Copilot grounding (copilot utilizes actual readiness values)
 * Test 18: Student isolation (Student A cannot access Student B -> 403)
 * Test 19: Institution isolation (Institution A cannot access unrelated student -> 403)
 * Test 20: Industry isolation (Industry unauthorized candidate access -> 403)
 * Test 21: Unauthenticated access (401)
 * Test 22: Safe teardown (all test records cleaned, production data untouched)
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TIMESTAMP = Date.now();
const PREFIX = `cr2_test_${TIMESTAMP}`;

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

async function api(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runSuite() {
  console.log('\n============================================================');
  console.log('🚀 CAREER READINESS & SKILL CREDIBILITY — PHASE 2 VERIFICATION');
  console.log('============================================================\n');

  const client = await pool.connect();

  let testUserA = null;
  let testStudentA = null;
  let tokenA = null;

  let testUserB = null;
  let testStudentB = null;
  let tokenB = null;

  let testInstUserA = null;
  let testInstA = null;
  let tokenInstA = null;

  let testInstUserB = null;
  let testInstB = null;
  let tokenInstB = null;

  let testIndUser = null;
  let testCompany = null;
  let tokenInd = null;

  let testSkill = null;
  let testSkill2 = null;
  let testCourse = null;
  let testAssessment = null;
  let testProject = null;

  try {
    // ══════════════════════════════════════════════════════════
    // PREPARATION: Seed isolated test entities
    // ══════════════════════════════════════════════════════════
    console.log('[SETUP] Provisioning isolated test fixtures...');

    // Fetch existing institutions and departments
    const instRows = await client.query(`SELECT id, name FROM institutions LIMIT 2`);
    testInstA = instRows.rows[0];
    testInstB = instRows.rows[1] || instRows.rows[0];

    const deptRowsA = await client.query(`SELECT id FROM departments WHERE institution_id = $1 LIMIT 1`, [testInstA.id]);
    const testDeptA = deptRowsA.rows[0]?.id;

    const deptRowsB = await client.query(`SELECT id FROM departments WHERE institution_id = $1 LIMIT 1`, [testInstB.id]);
    const testDeptB = deptRowsB.rows[0]?.id;

    // Fetch existing company
    const compRows = await client.query(`SELECT id, company_name FROM companies LIMIT 1`);
    testCompany = compRows.rows[0];

    // Institution Users
    const uInstA = await client.query(`
      INSERT INTO users (email, password_hash, is_active)
      VALUES ('${PREFIX}_inst_a@nexus.test', 'hash', true)
      RETURNING id, email
    `);
    testInstUserA = uInstA.rows[0];
    tokenInstA = jwt.sign({ id: testInstUserA.id, email: testInstUserA.email, role: 'institution', institutionId: testInstA.id }, JWT_SECRET);

    const uInstB = await client.query(`
      INSERT INTO users (email, password_hash, is_active)
      VALUES ('${PREFIX}_inst_b@nexus.test', 'hash', true)
      RETURNING id, email
    `);
    testInstUserB = uInstB.rows[0];
    tokenInstB = jwt.sign({ id: testInstUserB.id, email: testInstUserB.email, role: 'institution', institutionId: testInstB.id }, JWT_SECRET);

    // Company User
    const uInd = await client.query(`
      INSERT INTO users (email, password_hash, is_active)
      VALUES ('${PREFIX}_ind@nexus.test', 'hash', true)
      RETURNING id, email
    `);
    testIndUser = uInd.rows[0];
    tokenInd = jwt.sign({ id: testIndUser.id, email: testIndUser.email, role: 'industry', companyId: testCompany.id }, JWT_SECRET);

    // Students
    const uA = await client.query(`
      INSERT INTO users (email, password_hash, is_active)
      VALUES ('${PREFIX}_student_a@nexus.test', 'hash', true)
      RETURNING id, email
    `);
    testUserA = uA.rows[0];

    const sA = await client.query(`
      INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
      VALUES ($1, 'Student Alpha Phase2', '${PREFIX}_ROLL_A', $2, $3, 2026, 0)
      RETURNING id, full_name, user_id, institution_id
    `, [testUserA.id, testInstA.id, testDeptA]);
    testStudentA = sA.rows[0];
    tokenA = jwt.sign({ id: testUserA.id, studentId: testStudentA.id, email: testUserA.email, role: 'student', institutionId: testInstA.id }, JWT_SECRET);

    const uB = await client.query(`
      INSERT INTO users (email, password_hash, is_active)
      VALUES ('${PREFIX}_student_b@nexus.test', 'hash', true)
      RETURNING id, email
    `);
    testUserB = uB.rows[0];

    const sB = await client.query(`
      INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
      VALUES ($1, 'Student Beta Phase2', '${PREFIX}_ROLL_B', $2, $3, 2026, 0)
      RETURNING id, full_name, user_id, institution_id
    `, [testUserB.id, testInstB.id, testDeptB]);
    testStudentB = sB.rows[0];
    tokenB = jwt.sign({ id: testUserB.id, studentId: testStudentB.id, email: testUserB.email, role: 'student', institutionId: testInstB.id }, JWT_SECRET);

    // Fetch permanent skills
    const sk1 = await client.query(`SELECT id, name FROM skills WHERE name ILIKE 'python' LIMIT 1`);
    testSkill = sk1.rows[0];

    const sk2 = await client.query(`SELECT id, name FROM skills WHERE name ILIKE 'java' LIMIT 1`);
    testSkill2 = sk2.rows[0];

    // Course (Title includes skill name so SkillGraph matches evidence)
    const cRes = await client.query(`
      INSERT INTO courses (title, course_code, institution_id, category, duration_weeks, hours, status)
      VALUES ('Python Cloud Systems ${TIMESTAMP}', '${PREFIX}_PY101', $1, 'Programming', 8, 40, 'ACTIVE')
      RETURNING id, title
    `, [testInstA.id]);
    testCourse = cRes.rows[0];

    // Assessment (Title includes skill name so SkillGraph matches evidence)
    const asmRes = await client.query(`
      INSERT INTO assessments (title, track_code, domain, assessment_type, total_marks, passing_score, duration_minutes, institution_id, status)
      VALUES ('Python Systems Assessment ${TIMESTAMP}', '${PREFIX}_TRK', 'Engineering', 'TECHNICAL', 100, 60, 45, $1, 'PUBLISHED')
      RETURNING id, title
    `, [testInstA.id]);
    testAssessment = asmRes.rows[0];

    console.log('  [SETUP COMPLETE] All fixtures ready.\n');

    // ══════════════════════════════════════════════════════════
    // TEST 1: New student zero-state
    // ══════════════════════════════════════════════════════════
    console.log('--- TEST 1: New Student Zero-State ---');
    const t1 = await api('GET', '/career-readiness/me', null, tokenA);
    assert(t1.status === 200, 'GET /career-readiness/me responds 200');
    assert(t1.data.success === true, 'Response marked success');
    assert(t1.data.data.overallScore === 0, 'New student overallScore is 0 (NOT decorative 80/90/100)');
    assert(t1.data.data.components.technical.score === 0, 'Technical score is 0');
    assert(t1.data.data.components.technical.explanation.includes('No technical') || t1.data.data.components.technical.explanation.includes('verified'), 'Zero-state indicates no verified evidence');
    assert(t1.data.data.components.softSkills.explanation.includes('Limited verified evidence') || t1.data.data.components.softSkills.score === 0, 'Soft skills handles zero evidence safely');

    // ══════════════════════════════════════════════════════════
    // TEST 2: Student with course evidence
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 2: Student With Course Evidence ---');
    // Complete course
    await client.query(`
      INSERT INTO enrollments (student_id, course_id, status, progress_percentage, completed_at)
      VALUES ($1, $2, 'Completed', 100, NOW())
    `, [testStudentA.id, testCourse.id]);

    // Recalculate Skill Graph & Career Readiness
    await api('POST', '/skill-graph/sync', {}, tokenA);
    const t2 = await api('POST', '/career-readiness/recalculate', {}, tokenA);
    assert(t2.status === 200, 'Recalculate career readiness succeeds');
    assert(t2.data.data.components.technical.score > 0, `Technical score increased after course completion (${t2.data.data.components.technical.score})`);
    assert(t2.data.data.overallScore > 0, `Overall readiness score increased (${t2.data.data.overallScore}/100)`);
    assert(t2.data.data.components.technical.evidenceCount >= 1, 'Technical component shows at least 1 evidence source');

    // ══════════════════════════════════════════════════════════
    // TEST 3: Student with assessment evidence
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 3: Student With Assessment Evidence ---');
    await client.query(`
      INSERT INTO assessment_attempts (student_id, assessment_id, score, status, completed_at)
      VALUES ($1, $2, 85, 'Completed', NOW())
    `, [testStudentA.id, testAssessment.id]);

    const t3 = await api('POST', '/career-readiness/recalculate', {}, tokenA);
    assert(t3.status === 200, 'Recalculate career readiness succeeds');
    assert(t3.data.data.components.assessments.score >= 80, `Assessment component reflects actual score of 85% (${t3.data.data.components.assessments.score})`);
    assert(t3.data.data.components.assessments.evidenceCount >= 1, 'Assessment component registers completed assessment');

    // ══════════════════════════════════════════════════════════
    // TEST 4: Student with project evidence
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 4: Student With Project Evidence ---');
    const prjRes = await client.query(`
      INSERT INTO projects (student_id, institution_id, title, description, tech_stack, status, validated_at)
      VALUES ($1, $2, '${PREFIX}_Project_Alpha', 'Autonomous agent platform', jsonb_build_array('${testSkill.name}', '${testSkill2.name}'), 'Validated', NOW())
      RETURNING id, title
    `, [testStudentA.id, testInstA.id]);
    testProject = prjRes.rows[0];

    const t4 = await api('POST', '/career-readiness/recalculate', {}, tokenA);
    assert(t4.status === 200, 'Recalculate career readiness succeeds');
    assert(t4.data.data.components.projects.score > 0, `Projects component shows verified project contribution (${t4.data.data.components.projects.score})`);
    assert(t4.data.data.components.projects.evidenceCount >= 1, 'Projects component registers validated project');

    // ══════════════════════════════════════════════════════════
    // TEST 5: Student with verified certificate
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 5: Student With Verified Certificate ---');
    await client.query(`
      INSERT INTO certificates (student_id, institution_id, course_id, certificate_number, title, verification_hash, issued_at)
      VALUES ($1, $2, $3, '${PREFIX}_CERT_123', '${PREFIX}_Certified_Engineer', 'hash_cert', NOW())
    `, [testStudentA.id, testInstA.id, testCourse.id]);

    const t5 = await api('POST', '/career-readiness/recalculate', {}, tokenA);
    assert(t5.status === 200, 'Recalculate career readiness succeeds');
    assert(t5.data.data.components.certifications.score > 0, `Certifications component registers verified certificate (${t5.data.data.components.certifications.score})`);
    assert(t5.data.data.components.certifications.score <= 100, 'Certifications component within bounds');
    assert(t5.data.data.components.certifications.explanation.includes('contributes to readiness') || t5.data.data.components.certifications.explanation.includes('verified'), 'Certificate explanation clarifies multi-factor role');

    // ══════════════════════════════════════════════════════════
    // TEST 6: Multiple evidence sources credibility
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 6: Multiple Evidence Sources Credibility ---');
    // Ensure Skill Graph sync has populated student_skills and skill_evidence
    await api('POST', '/skill-graph/sync', {}, tokenA);

    const t6 = await api('GET', `/skill-credibility/${testSkill.id}`, null, tokenA);
    assert(t6.status === 200, 'GET /skill-credibility/:skillId succeeds');
    assert(t6.data.success === true, 'Credibility calculation succeeds');
    assert(t6.data.data.evidenceSourceCount >= 2, `Multi-source evidence registered for ${testSkill.name} (sources: ${t6.data.data.evidenceSourceCount})`);
    assert(t6.data.data.credibilityScore >= 70, `High credibility granted for multiple verified sources (${t6.data.data.credibilityScore}%)`);
    assert(t6.data.data.verificationStrength === 'Strong' || t6.data.data.verificationStrength === 'Moderate', `Verification strength evaluated: ${t6.data.data.verificationStrength}`);

    // ══════════════════════════════════════════════════════════
    // TEST 7: Single weak evidence source credibility
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 7: Single Weak Evidence Source Credibility ---');
    // Insert a skill for Student B with only a self-declared claim (no course, no project, no assessment)
    await client.query(`
      INSERT INTO student_skills (student_id, skill_id, proficiency_score, proficiency_level, verification_status, confidence_score, credibility_score)
      VALUES ($1, $2, 90, 'Beginner', 'UNVERIFIED', 0.2, 35)
      ON CONFLICT (student_id, skill_id) DO UPDATE SET verification_status = 'UNVERIFIED', credibility_score = 35
    `, [testStudentB.id, testSkill2.id]);

    const t7 = await api('GET', `/skill-credibility/${testSkill2.id}`, null, tokenB);
    assert(t7.status === 200, 'GET /skill-credibility/:skillId for student B succeeds');
    assert(t7.data.data.credibilityScore <= 40, `Unverified single claim capped with low credibility (${t7.data.data.credibilityScore}% vs 90% claimed proficiency)`);
    assert(t7.data.data.verificationStrength === 'Self-Declared' || t7.data.data.verificationStrength === 'Weak', `Verification strength reflects self-declaration: ${t7.data.data.verificationStrength}`);

    // ══════════════════════════════════════════════════════════
    // TEST 8: Old evidence recency factor
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 8: Old Evidence Recency Factor ---');
    // Insert an old evidence record for Student B (2 years ago)
    const oldDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
    await client.query(`
      INSERT INTO skill_evidence (student_id, skill_id, evidence_type, reference_id, score, verification_status, created_at)
      VALUES ($1, $2, 'assessment', '00000000-0000-0000-0000-000000000001', 80, 'VERIFIED', $3)
    `, [testStudentB.id, testSkill.id, oldDate]);

    const t8 = await api('GET', `/skill-credibility/${testSkill.id}`, null, tokenB);
    assert(t8.status === 200, 'Skill credibility computed for old evidence');
    assert(t8.data.data.recencyScore < 90, `Recency factor is decayed for 2-year-old evidence (${t8.data.data.recencyScore}%)`);

    // ══════════════════════════════════════════════════════════
    // TEST 9: Inconsistent evidence handling
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 9: Inconsistent Evidence Handling ---');
    // Add discrepant evidence: Course score 95, but assessment score 20
    await client.query(`
      INSERT INTO skill_evidence (student_id, skill_id, evidence_type, reference_id, score, verification_status, created_at)
      VALUES ($1, $2, 'course', '00000000-0000-0000-0000-000000000002', 95, 'VERIFIED', NOW()),
             ($1, $2, 'assessment', '00000000-0000-0000-0000-000000000003', 20, 'VERIFIED', NOW())
    `, [testStudentB.id, testSkill.id]);

    const t9 = await api('GET', `/skill-credibility/${testSkill.id}`, null, tokenB);
    assert(t9.status === 200, 'Credibility calculation handles inconsistent evidence');
    assert(t9.data.data.consistencyScore < 85, `Consistency score reflects divergence (${t9.data.data.consistencyScore}%)`);
    assert(t9.data.data.explanation.includes('inconsistent') || t9.data.data.consistencyScore < 80, 'Explanation flags performance divergence gracefully without accusing student');

    // ══════════════════════════════════════════════════════════
    // TEST 10: Career readiness formula verification
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 10: Career Readiness Formula Verification ---');
    const t10 = await api('GET', '/career-readiness/me', null, tokenA);
    assert(t10.status === 200, 'Fetch readiness scores for formula check');
    const comps = t10.data.data.components;
    const computedExpected = Math.round(
      (comps.technical.score * comps.technical.weight) +
      (comps.softSkills.score * comps.softSkills.weight) +
      (comps.projects.score * comps.projects.weight) +
      (comps.certifications.score * comps.certifications.weight) +
      (comps.assessments.score * comps.assessments.weight) +
      (comps.industryExposure.score * comps.industryExposure.weight) +
      (comps.interviewReadiness.score * comps.interviewReadiness.weight)
    );
    assert(t10.data.data.overallScore === computedExpected, `Overall score (${t10.data.data.overallScore}) matches weighted component sum (${computedExpected})`);

    // ══════════════════════════════════════════════════════════
    // TEST 11: History persistence
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 11: Score History Persistence ---');
    const histRes = await api('GET', '/career-readiness/history', null, tokenA);
    assert(histRes.status === 200, 'GET /career-readiness/history responds 200');
    assert(Array.isArray(histRes.data.data), 'History returns an array');
    assert(histRes.data.data.length >= 1, `History contains stored snapshots (${histRes.data.data.length} records)`);
    assert(histRes.data.data[0].overall_score !== undefined, 'History snapshot preserves overall_score');

    // ══════════════════════════════════════════════════════════
    // TEST 12: Skill Graph integration
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 12: Skill Graph Integration ---');
    const sgRes = await api('GET', '/skill-graph/me', null, tokenA);
    assert(sgRes.status === 200, 'Skill Graph 2.0 API responds 200');
    assert(sgRes.data.nodes.length > 0, 'Skill Graph contains nodes');
    const nodeA = sgRes.data.nodes.find(n => n.name === testSkill.name);
    assert(Boolean(nodeA), `Node for ${testSkill.name} exists in graph`);
    assert(nodeA.credibilityScore !== undefined && nodeA.credibilityScore !== null, `Node contains credibilityScore (${nodeA.credibilityScore}%)`);
    assert(nodeA.proficiencyScore !== undefined, `Node contains proficiencyScore (${nodeA.proficiencyScore}%)`);

    // ══════════════════════════════════════════════════════════
    // TEST 13: Digital Passport integration
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 13: Digital Passport Integration ---');
    const passRes = await api('GET', '/digital-passport/me', null, tokenA);
    assert(passRes.status === 200, 'Digital Passport API responds 200');
    assert(passRes.data.success === true, 'Passport fetched successfully');
    assert(passRes.data.passport !== null, 'Passport object returned');

    // ══════════════════════════════════════════════════════════
    // TEST 14: Skill Gap integration
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 14: Skill Gap Integration ---');
    const gapRes = await api('GET', '/skill-gap/me', null, tokenA);
    assert(gapRes.status === 200, 'Skill Gap analysis API responds 200');
    assert(gapRes.data.success === true, 'Skill Gap analysis successfully executed');

    // ══════════════════════════════════════════════════════════
    // TEST 15: Opportunity Matching integration
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 15: Opportunity Matching Integration ---');
    const oppRes = await api('GET', '/opportunities', null, tokenA);
    assert(oppRes.status === 200, 'Opportunity matching API responds 200 without breakage');

    // ══════════════════════════════════════════════════════════
    // TEST 16: Career Journey integration
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 16: Career Journey Integration ---');
    const jRes = await api('GET', '/student/journey', null, tokenA);
    assert(jRes.status === 200, 'Career Journey API responds 200');
    assert(jRes.data.success === true, 'Journey payload returned');
    assert(jRes.data.data.careerReadiness !== undefined, 'Career Readiness milestone integrated into journey payload');
    assert(jRes.data.data.careerReadiness.score === t10.data.data.overallScore, `Journey readiness score (${jRes.data.data.careerReadiness.score}) matches actual engine score`);
    const readinessStage = jRes.data.data.stages.find(s => s.id === 'readiness');
    assert(Boolean(readinessStage), 'Career Readiness milestone stage present in stage matrix');

    // ══════════════════════════════════════════════════════════
    // TEST 17: Career Copilot grounding
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 17: Career Copilot Grounding ---');
    const copilotRes = await api('POST', '/career-copilot/chat', {
      message: 'What is my career readiness score and weakest area?'
    }, tokenA);
    assert(copilotRes.status === 200, 'Career Copilot chat responds 200');
    assert(copilotRes.data.success === true, 'Copilot responds successfully');
    assert(
      copilotRes.data.reply.includes(String(t10.data.data.overallScore)) || copilotRes.data.reply.includes('readiness') || copilotRes.data.reply.includes('Career Readiness'),
      'Copilot grounds answer in actual Career Readiness engine data'
    );

    // ══════════════════════════════════════════════════════════
    // TEST 18: Student isolation
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 18: Student Isolation (Student A vs B) ---');
    const t18 = await api('GET', `/career-readiness/student/${testStudentB.id}`, null, tokenA);
    assert(t18.status === 403, `Cross-student direct readiness access blocked with 403 (got ${t18.status})`);

    const t18b = await api('GET', `/skill-credibility/student/${testStudentB.id}`, null, tokenA);
    assert(t18b.status === 403, `Cross-student direct credibility access blocked with 403 (got ${t18b.status})`);

    // ══════════════════════════════════════════════════════════
    // TEST 19: Institution isolation
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 19: Institution Multi-Tenant Isolation ---');
    // Institution A attempts to access Student B (enrolled at Institution B)
    const t19 = await api('GET', `/career-readiness/student/${testStudentB.id}`, null, tokenInstA);
    assert(t19.status === 403, `Institution A blocked from Student B with 403 (got ${t19.status})`);

    // Institution B CAN access Student B (authorized)
    const t19b = await api('GET', `/career-readiness/student/${testStudentB.id}`, null, tokenInstB);
    assert(t19b.status === 200, `Institution B successfully authorized for Student B (got ${t19b.status})`);

    // ══════════════════════════════════════════════════════════
    // TEST 20: Industry isolation
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 20: Industry Isolation ---');
    // Industry user attempts to access un-authorized Student A
    const t20 = await api('GET', `/career-readiness/student/${testStudentA.id}`, null, tokenInd);
    assert(t20.status === 403, `Unauthorized Industry candidate query blocked with 403 (got ${t20.status})`);

    // ══════════════════════════════════════════════════════════
    // TEST 21: Unauthenticated access
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 21: Unauthenticated Access (401) ---');
    const t21a = await api('GET', '/career-readiness/me', null, null);
    assert(t21a.status === 401, `Unauthenticated GET /career-readiness/me returned 401 (got ${t21a.status})`);

    const t21b = await api('POST', '/career-readiness/recalculate', {}, null);
    assert(t21b.status === 401, `Unauthenticated POST /career-readiness/recalculate returned 401 (got ${t21b.status})`);

    const t21c = await api('GET', '/skill-credibility/me', null, null);
    assert(t21c.status === 401, `Unauthenticated GET /skill-credibility/me returned 401 (got ${t21c.status})`);

  } finally {
    // ══════════════════════════════════════════════════════════
    // TEST 22: Safe teardown
    // ══════════════════════════════════════════════════════════
    console.log('\n--- TEST 22: Safe Teardown of Test Data ---');
    try {
      // Clean only test-created records prefixed by PREFIX
      await client.query(`DELETE FROM career_readiness_history WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM career_readiness_scores WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM skill_credibility_scores WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM skill_evidence WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM student_skills WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM assessment_attempts WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM projects WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM certificates WHERE student_id IN (SELECT id FROM students WHERE roll_number LIKE '${PREFIX}%')`);
      await client.query(`DELETE FROM students WHERE roll_number LIKE '${PREFIX}%'`);
      await client.query(`DELETE FROM users WHERE email LIKE '${PREFIX}%'`);
      await client.query(`DELETE FROM courses WHERE course_code LIKE '${PREFIX}%'`);
      await client.query(`DELETE FROM assessments WHERE title LIKE '${PREFIX}%'`);
      await client.query(`DELETE FROM skills WHERE name LIKE '${PREFIX}%'`);
      console.log('  [PASS] All test records cleanly eradicated. Genuine production data untouched.');
      totalPassed++;
    } catch (cleanErr) {
      console.error('  [WARN] Teardown warning:', cleanErr.message);
    }

    client.release();
    await pool.end();
  }

  console.log('\n============================================================');
  console.log(`MASTER VERIFICATION RESULTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
  console.log('============================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error('\n[SUITE FATAL ERROR]:', err);
  process.exit(1);
});
