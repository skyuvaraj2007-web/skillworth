/**
 * Test: verify_partial_skills.js
 * Verifies partial and complete skills gap calculation
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { supabase } = require('../src/config/supabase');
const skillGapEngine = require('../src/services/ai/skillGapEngine');

async function testProgression() {
  const { data: stu } = await supabase.from('students').select('id, full_name').limit(1).single();
  console.log('Testing with student:', stu.full_name, stu.id);

  // 1. Insert partial skills:
  // JavaScript: 90% -> Strong
  // Node.js: 65% -> Good
  // SQL: 35% -> Needs Improvement
  // Others: 0% -> Missing
  await supabase.from('student_skills').delete().eq('student_id', stu.id);
  const insRes = await supabase.from('student_skills').insert([
    {
      student_id: stu.id,
      skill_name: 'JavaScript',
      claimed_level: 'Advanced',
      verified_level: 'Advanced',
      confidence_score: 90,
      verification_status: 'VERIFIED',
      source: 'Diagnostic Exam Verified'
    },
    {
      student_id: stu.id,
      skill_name: 'Node.js',
      claimed_level: 'Intermediate',
      confidence_score: 55,
      verification_status: 'CLAIMED',
      source: 'Course In Progress'
    },
    {
      student_id: stu.id,
      skill_name: 'SQL',
      claimed_level: 'Beginner',
      confidence_score: 35,
      verification_status: 'SELF_ASSESSED',
      source: 'Self-Assessed'
    }
  ]);
  if (insRes.error) console.error('Insert error in test:', insRes.error);

  const report = await skillGapEngine.analyzeSkillGap(stu.id, 'CAREER_ROLE', 'full-stack-developer');
  console.log('Overall Readiness:', report.overallReadiness + '%');
  console.log('Counts:', JSON.stringify(report.counts));
  report.skillAnalysis.forEach(s => {
    console.log(`  - ${s.skillName.padEnd(16)}: Req ${s.requiredScore}% vs Stu ${s.studentScore}% -> [${s.status}] (${s.verificationStatus})`);
  });
  console.log('AI Explanation:', report.aiExplanation);

  // Assert expected classifications
  const js = report.skillAnalysis.find(s => s.skillName === 'JavaScript');
  const node = report.skillAnalysis.find(s => s.skillName === 'Node.js');
  const sql = report.skillAnalysis.find(s => s.skillName === 'SQL');
  const docker = report.skillAnalysis.find(s => s.skillName === 'Docker');

  if (js.status !== 'Strong') throw new Error(`Expected JavaScript to be Strong, got ${js.status}`);
  if (node.status !== 'Good') throw new Error(`Expected Node.js to be Good, got ${node.status}`);
  if (sql.status !== 'Needs Improvement') throw new Error(`Expected SQL to be Needs Improvement, got ${sql.status}`);
  if (docker.status !== 'Missing') throw new Error(`Expected Docker to be Missing, got ${docker.status}`);
  if (report.overallReadiness <= 0 || report.overallReadiness >= 100) throw new Error(`Expected readiness between 1 and 99, got ${report.overallReadiness}`);

  console.log('✅ ALL PARTIAL GAP CLASSIFICATIONS VERIFIED ACCURATELY!');

  // Clean up test skills
  await supabase.from('student_skills').delete().eq('student_id', stu.id);
  console.log('Cleaned up test skills.');
}

testProgression().catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});
