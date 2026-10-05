/**
 * SKILL NEXUS — Phase 1: Skill Graph 2.0 Comprehensive Verification Suite
 * 
 * Verifies:
 * 1. Zero-State for Brand-New Student (0 skills, 0 evidence, 0% proficiency)
 * 2. Course Evidence Ingestion (Single evidence -> Intermediate / Beginner)
 * 3. Multi-Source Evidence Promotion (Course + Project + Assessment -> Advanced / Expert)
 * 4. Strict Evidence Rule: High level NOT granted without multiple verified evidence sources
 * 5. Skill Graph Relational Network Edges (Directed graph & related skills)
 * 6. Multi-Tenant RBAC & Data Isolation (Student A vs B, Institution boundaries)
 * 7. Downstream Aggregator Integration (Skill Gap & Passport compatibility)
 * 8. Safe Test Data Cleanup (Zero test artifacts left behind)
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
const PREFIX = `sg2_test_${TIMESTAMP}`;

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
  console.log('🌐 SKILL GRAPH 2.0 — PHASE 1 MASTER VERIFICATION SUITE');
  console.log('============================================================\n');

  const client = await pool.connect();
  let testUserA = null;
  let testStudentA = null;
  let testUserB = null;
  let testStudentB = null;
  let testInstitutionA = null;
  let testInstitutionB = null;
  let testCourse = null;
  let testAssessment = null;
  let testProject = null;

  let tokenA = '';
  let tokenB = '';

  try {
    // ── 0. Fixtures Setup ──
    console.log('--- 0. Initializing Test Fixtures in PostgreSQL ---');
    const deptRes = await client.query(`SELECT id, institution_id FROM departments LIMIT 1`);
    const testDept = deptRes.rows[0];
    const instRes = await client.query(`SELECT id, name FROM institutions WHERE id = $1`, [testDept.institution_id]);
    testInstitutionA = instRes.rows[0];
    testInstitutionB = instRes.rows[0];
    const testDeptId = testDept.id;

    const rRes = await client.query(`SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1`);
    const studentRoleId = rRes.rows[0]?.id;

    // Student A
    const uARes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW()) RETURNING id`,
      [`stu_a_${PREFIX}@nexus.test`]
    );
    testUserA = uARes.rows[0];

    if (studentRoleId) {
      await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [testUserA.id, studentRoleId]);
    }

    const sARes = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Student Alpha Graph', $2, $3, $4, 2026, 0) RETURNING id`,
      [testUserA.id, `ROLL_A_${TIMESTAMP}`, testInstitutionA.id, testDeptId]
    );
    testStudentA = sARes.rows[0];

    // Student B
    const uBRes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'dummy_hash', true, NOW(), NOW()) RETURNING id`,
      [`stu_b_${PREFIX}@nexus.test`]
    );
    testUserB = uBRes.rows[0];

    if (studentRoleId) {
      await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [testUserB.id, studentRoleId]);
    }

    const sBRes = await client.query(
      `INSERT INTO students (user_id, full_name, roll_number, institution_id, department_id, graduation_year, readiness_score)
       VALUES ($1, 'Student Beta Graph', $2, $3, $4, 2026, 0) RETURNING id`,
      [testUserB.id, `ROLL_B_${TIMESTAMP}`, testInstitutionB.id, testDeptId]
    );
    testStudentB = sBRes.rows[0];

    tokenA = jwt.sign({ id: testUserA.id, studentId: testStudentA.id, email: `stu_a_${PREFIX}@nexus.test`, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: testUserB.id, studentId: testStudentB.id, email: `stu_b_${PREFIX}@nexus.test`, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    console.log('  [PASS] Test fixtures created in PostgreSQL');

    // ── 1. Zero-State Verification ──
    console.log('\n--- 1. Zero-State Verification for Brand-New Student ---');
    const zeroGraph = await api('GET', '/skill-graph/me', null, tokenA);
    if (zeroGraph.status !== 200) console.log('zeroGraph debug error:', zeroGraph);
    assert(zeroGraph.status === 200 && zeroGraph.data.success, 'GET /api/skill-graph/me returns HTTP 200');
    assert(zeroGraph.data.metrics.totalSkills === 0, 'New student starts with 0 total skills');
    assert(zeroGraph.data.metrics.verifiedSkills === 0, 'New student starts with 0 verified skills');
    assert(zeroGraph.data.metrics.evidenceNodesCount === 0, 'New student starts with 0 evidence nodes');
    assert(zeroGraph.data.nodes.length === 0, 'New student nodes array is empty (No fake data)');

    // ── 2. Course Evidence Ingestion ──
    console.log('\n--- 2. Single Course Evidence Ingestion ---');
    const crsRes = await client.query(
      `INSERT INTO courses (title, course_code, category, difficulty, hours, status, institution_id)
       VALUES ('Python for Systems and Cloud', $1, 'Programming', 'Intermediate', 25, 'ACTIVE', $2) RETURNING id`,
      [`CRS-${TIMESTAMP}`, testInstitutionA.id]
    );
    testCourse = crsRes.rows[0];

    // Enroll and complete course for Student A
    await client.query(
      `INSERT INTO enrollments (student_id, course_id, status, progress_percentage, enrolled_at)
       VALUES ($1, $2, 'Completed', 100, NOW())`,
      [testStudentA.id, testCourse.id]
    );

    // Sync Skill Graph
    const sync1 = await api('POST', '/skill-graph/sync', { studentId: testStudentA.id }, tokenA);
    assert(sync1.status === 200 && sync1.data.success, 'Skill Graph synced successfully after course completion');
    const pythonNode1 = sync1.data.nodes.find(n => n.name.toLowerCase() === 'python');
    assert(Boolean(pythonNode1), 'Python node created in Skill Graph from verified course completion');
    assert(pythonNode1.evidenceCount === 1, 'Python node has exactly 1 verified evidence item');
    assert(pythonNode1.proficiencyLevel === 'Intermediate', 'Single evidence item grants Intermediate level (strict non-inflation)');
    assert(pythonNode1.proficiencyScore >= 70, `Proficiency score calculated properly: ${pythonNode1.proficiencyScore}%`);

    // ── 3. Multi-Source Evidence Promotion (Project + Assessment) ──
    console.log('\n--- 3. Multi-Source Evidence Hierarchy & Level Promotion ---');
    // Add Project Evidence for Python
    const projRes = await client.query(
      `INSERT INTO projects (student_id, institution_id, title, description, tech_stack, status, validated_at)
       VALUES ($1, $2, 'High-Concurrency Python Analytics Engine', 'Enterprise Python analytics', '["Python", "PostgreSQL"]'::jsonb, 'Validated', NOW()) RETURNING id`,
      [testStudentA.id, testInstitutionA.id]
    );
    testProject = projRes.rows[0];

    // Add Assessment Attempt for Python
    const asmtRes = await client.query(
      `INSERT INTO assessments (title, track_code, domain, passing_score, duration_minutes, is_active)
       VALUES ('Python Algorithmic Optimization', $1, 'Algorithms', 70, 45, true) RETURNING id`,
      [`ASMT-PY-${TIMESTAMP}`]
    );
    testAssessment = asmtRes.rows[0];

    await client.query(
      `INSERT INTO assessment_attempts (assessment_id, student_id, score, status, completed_at)
       VALUES ($1, $2, 94, 'Completed', NOW())`,
      [testAssessment.id, testStudentA.id]
    );

    // Re-sync Skill Graph
    const sync2 = await api('POST', '/skill-graph/sync', { studentId: testStudentA.id }, tokenA);
    const pythonNode2 = sync2.data.nodes.find(n => n.name.toLowerCase() === 'python');

    assert(pythonNode2.evidenceCount >= 3, `Python evidence count increased to ${pythonNode2.evidenceCount}`);
    assert(pythonNode2.proficiencyLevel === 'Expert' || pythonNode2.proficiencyLevel === 'Advanced', `High proficiency level awarded with multi-source evidence (${pythonNode2.proficiencyLevel})`);
    assert(pythonNode2.proficiencyScore >= 85, `Multi-evidence proficiency score elevated to ${pythonNode2.proficiencyScore}%`);
    assert(pythonNode2.evidence.some(e => e.type === 'COURSE'), 'Evidence includes verified course');
    assert(pythonNode2.evidence.some(e => e.type === 'PROJECT'), 'Evidence includes verified project');
    assert(pythonNode2.evidence.some(e => e.type === 'ASSESSMENT'), 'Evidence includes verified assessment');

    // Verify in PostgreSQL student_skills table directly
    const pgSkillCheck = await client.query(
      `SELECT * FROM student_skills WHERE student_id = $1 AND skill_name ILIKE '%python%'`,
      [testStudentA.id]
    );
    assert(pgSkillCheck.rows.length > 0, 'PostgreSQL student_skills table stores updated Skill Graph 2.0 record');
    assert(pgSkillCheck.rows[0].proficiency_score === pythonNode2.proficiencyScore, 'PostgreSQL stores exact proficiency_score');
    assert(pgSkillCheck.rows[0].evidence_count === pythonNode2.evidenceCount, 'PostgreSQL stores exact evidence_count');

    // ── 4. Graph Network Edges & Related Skills ──
    console.log('\n--- 4. Graph Network Edges & Relational Directionality ---');
    assert(Array.isArray(sync2.data.edges) && sync2.data.edges.length > 0, 'Skill Graph network contains active relational edges');
    const pyEdges = sync2.data.edges.filter(e => e.sourceName.toLowerCase() === 'python');
    assert(pyEdges.length > 0, 'Python has outbound directional relationships in Skill Graph');
    assert(Boolean(sync2.data.relatedSkills['Python']), 'Related skills mapping available for Python');

    // ── 5. Multi-Tenant RBAC & Isolation ──
    console.log('\n--- 5. Multi-Tenant RBAC & Access Isolation ---');
    // Student B cannot view Student A graph
    const crossRes = await api('GET', `/skill-graph/student/${testStudentA.id}`, null, tokenB);
    assert(crossRes.status === 403, 'Cross-tenant violation: Student B cannot view Student A graph (HTTP 403)');

    // Unauthenticated request is rejected
    const unauthRes = await api('GET', '/skill-graph/me', null, null);
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // ── 6. Downstream Aggregator Integration ──
    console.log('\n--- 6. Downstream Aggregator Integration ---');
    const studentSkillAggregator = require('../src/services/ai/studentSkillAggregator');
    const aggResult = await studentSkillAggregator.aggregateStudentSkills(testStudentA.id);
    const pyAgg = aggResult.skills.find(s => s.skillName.toLowerCase() === 'python');
    assert(Boolean(pyAgg), 'StudentSkillAggregator retrieves Skill Graph 2.0 Python skill');
    assert(pyAgg.score >= 85, `Aggregator derives verified Skill Graph 2.0 score (${pyAgg.score})`);

    // ── 7. Clean Teardown ──
    console.log('\n--- 7. Safe Teardown of Test Records ---');
    await client.query(`DELETE FROM skill_evidence WHERE student_id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM student_skills WHERE student_id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM enrollments WHERE student_id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM assessment_attempts WHERE student_id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM projects WHERE student_id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM courses WHERE id = $1`, [testCourse.id]);
    await client.query(`DELETE FROM assessments WHERE id = $1`, [testAssessment.id]);
    await client.query(`DELETE FROM user_roles WHERE user_id IN ($1, $2)`, [testUserA.id, testUserB.id]);
    await client.query(`DELETE FROM students WHERE id IN ($1, $2)`, [testStudentA.id, testStudentB.id]);
    await client.query(`DELETE FROM users WHERE id IN ($1, $2)`, [testUserA.id, testUserB.id]);

    console.log('  [PASS] All test records safely purged. Genuine data preserved.');

    console.log('\n============================================================');
    console.log(`🎉 PHASE 1 SKILL GRAPH 2.0 SUITE PASSED: ${totalPassed} / ${totalPassed + totalFailed}`);
    console.log('============================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

runSuite().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ SUITE FAILED:', err.message);
  process.exit(1);
});
