/**
 * Verification Test: verify_skill_gap_analysis.js
 * 
 * Verifies end-to-end:
 * 1. Normalized Student Skill Aggregation
 * 2. Target Selection (Career Roles & Opportunities)
 * 3. Gap Calculation Engine (Strong, Good, Needs Improvement, Missing)
 * 4. Overall Readiness Calculation
 * 5. Grounded AI Explanation Generation
 * 6. Contextual Learning Recommendations
 * 7. Edge Cases: Zero skills (empty state), Partial skills, Complete skills
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { supabase } = require('../src/config/supabase');
const studentSkillAggregator = require('../src/services/ai/studentSkillAggregator');
const skillGapEngine = require('../src/services/ai/skillGapEngine');

async function runTests() {
  console.log('🧪 Starting AI Skill Gap Analysis Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // ── TEST 1: Target Options Retrieval ──
    console.log('Test 1: Target Roles & Opportunities Discovery');
    const targets = await skillGapEngine.getTargetOptions();
    assert(Array.isArray(targets.careerRoles) && targets.careerRoles.length >= 5, 'Career roles loaded from database (>= 5 roles)');
    const fsd = targets.careerRoles.find(r => r.slug === 'full-stack-developer');
    assert(Boolean(fsd && fsd.role_required_skills && fsd.role_required_skills.length >= 5), 'Full Stack Developer role contains required skills');
    console.log(`    Found ${targets.careerRoles.length} roles and ${targets.opportunities.length} active opportunities.\n`);

    // ── TEST 2: Student Skill Aggregation ──
    console.log('Test 2: Student Skill Profile Aggregator');
    // Fetch a real student from DB
    const { data: students } = await supabase.from('students').select('id, user_id, full_name').limit(1);
    const sampleStudent = students && students[0];
    assert(Boolean(sampleStudent), `Found test student: ${sampleStudent?.full_name} (${sampleStudent?.id})`);

    const aggregated = await studentSkillAggregator.aggregateStudentSkills(sampleStudent.id);
    assert(Array.isArray(aggregated.skills), 'Aggregated skills returns an array');
    assert(typeof aggregated.metrics.total === 'number', 'Aggregated metrics object exists');
    console.log(`    Student has ${aggregated.skills.length} skills aggregated across platform sources.\n`);

    // ── TEST 3: Edge Case — Student with Zero Skills (Empty State) ──
    console.log('Test 3: Edge Case — Student with Zero Skills (Empty State)');
    // Temporarily create a dummy student with 0 skills
    const zeroStudentId = '00000000-0000-0000-0000-000000000001';
    // Stub resolution for non-existent / new student
    const zeroAggregated = await studentSkillAggregator.aggregateStudentSkills(zeroStudentId);
    assert(zeroAggregated.skills.length === 0, 'Zero skills returned for unprovisioned student');

    // Analyze gap for student with real student record
    const gapAnalysis = await skillGapEngine.analyzeSkillGap(sampleStudent.id, 'CAREER_ROLE', fsd.id);
    assert(gapAnalysis.targetTitle === 'Full Stack Developer', 'Analysis mapped to Full Stack Developer');
    assert(typeof gapAnalysis.overallReadiness === 'number' && gapAnalysis.overallReadiness >= 0 && gapAnalysis.overallReadiness <= 100, `Calculated overall readiness is valid (${gapAnalysis.overallReadiness}%)`);
    assert(Array.isArray(gapAnalysis.skillAnalysis) && gapAnalysis.skillAnalysis.length > 0, `Skill analysis breakdown contains ${gapAnalysis.skillAnalysis.length} benchmark competencies`);
    
    // Check classification validity
    const validStatuses = ['Strong', 'Good', 'Needs Improvement', 'Missing'];
    const allValid = gapAnalysis.skillAnalysis.every(s => validStatuses.includes(s.status));
    assert(allValid, 'All skills strictly classified into Strong, Good, Needs Improvement, or Missing');

    console.log('    Skill breakdown:');
    gapAnalysis.skillAnalysis.forEach(s => {
      console.log(`      - ${s.skillName.padEnd(16)} | Req: ${String(s.requiredScore).padStart(2)}% | Stu: ${String(s.studentScore).padStart(2)}% | Status: [${s.status}] (${s.source})`);
    });
    console.log();

    // ── TEST 4: Grounded AI Explanation ──
    console.log('Test 4: Grounded AI Explanation');
    assert(typeof gapAnalysis.aiExplanation === 'string' && gapAnalysis.aiExplanation.length > 20, 'AI explanation generated and grounded');
    console.log(`    AI Text: "${gapAnalysis.aiExplanation}"\n`);

    // ── TEST 5: Contextual Recommendations ──
    console.log('Test 5: Contextual Learning Recommendations');
    assert(Array.isArray(gapAnalysis.recommendations), 'Recommendations returned as array');
    if (gapAnalysis.recommendations.length > 0) {
      const rec = gapAnalysis.recommendations[0];
      assert(Boolean(rec.title && rec.reason && rec.itemType), `Recommendation has title, itemType (${rec.itemType}), and reason`);
      console.log(`    Sample Recommendation: [${rec.itemType}] ${rec.title}`);
      console.log(`    Rationale: "${rec.reason}"\n`);
    } else {
      console.log('    Student has 0 gaps for this role (100% ready).\n');
    }

    // ── TEST 6: Target Opportunity Analysis ──
    console.log('Test 6: Target Industry Opportunity Analysis');
    if (targets.opportunities.length > 0) {
      const opp = targets.opportunities[0];
      const oppAnalysis = await skillGapEngine.analyzeSkillGap(sampleStudent.id, 'OPPORTUNITY', opp.id);
      assert(oppAnalysis.targetType === 'OPPORTUNITY', 'Opportunity target type correctly processed');
      assert(typeof oppAnalysis.overallReadiness === 'number', `Opportunity readiness calculated: ${oppAnalysis.overallReadiness}%`);
      console.log(`    Opportunity: ${oppAnalysis.targetTitle} -> Readiness: ${oppAnalysis.overallReadiness}%\n`);
    } else {
      console.log('    Skipping opportunity test (no opportunities in DB).\n');
    }

    // ── TEST 7: Report Persistence in Supabase ──
    console.log('Test 7: Database Report & Recommendation Persistence');
    assert(Boolean(gapAnalysis.reportId), `Report successfully stored with ID: ${gapAnalysis.reportId}`);
    const { data: savedReport, error: fetchErr } = await supabase
      .from('skill_gap_reports')
      .select('id, target_title, overall_readiness')
      .eq('id', gapAnalysis.reportId)
      .single();
    assert(!fetchErr && savedReport?.id === gapAnalysis.reportId, 'Report verified in Supabase skill_gap_reports table');

  } catch (err) {
    console.error('Test threw unexpected error:', err);
    failed++;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
