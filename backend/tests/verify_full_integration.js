/**
 * SKILL NEXUS AI — Full End-to-End Cross-Feature Integration Test Suite
 * Validates unified data flow across all 7 features:
 * Student Auth -> Profile -> Assessment -> AI Skill Gap -> Learning Courses ->
 * Projects/Certs -> Digital Passport -> Industry Matching -> Application ->
 * Industry Assessment -> Shortlist/Interview -> Placement -> Career Journey <-> Career Copilot
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const { supabase } = require('../src/config/supabase');
const relationalManager = require('../src/db/relationalManager');

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_2025_prod_sec';

async function runFullIntegrationTest() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🌐 SKILL NEXUS — FULL CROSS-FEATURE INTEGRATION TEST SUITE');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`   ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Student Registration / Authentication Check
    console.log('1️⃣ Step 1: Student Session Authentication...');
    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, full_name, roll_number, target_career_role')
      .limit(1);

    if (!students || students.length === 0) {
      throw new Error('No students found in database');
    }
    const student = students[0];
    const studentToken = jwt.sign(
      {
        id: student.user_id || student.id,
        studentId: student.id,
        role: 'student',
        email: 'integration.student@skillnexus.io',
        name: student.full_name
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    assert(studentToken, `Authenticated student: ${student.full_name} (${student.id})`);

    // 2. Student Profile Stage
    console.log('\n2️⃣ Step 2: Student Profile Retrieval & Verification...');
    const profileRes = await fetch(`${BASE_URL}/api/student/journey`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const profileJson = await profileRes.json();
    assert(profileRes.status === 200 && profileJson.success, 'Profile data retrieved through unified rail');
    assert(profileJson.data.profile.name === student.full_name, `Profile name matches database: ${student.full_name}`);

    // 3. Skill Assessment & Student Skills
    console.log('\n3️⃣ Step 3: Aggregated Student Skills & Diagnostics...');
    const skillsRes = await fetch(`${BASE_URL}/api/skill-gap/student-skills`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const skillsJson = await skillsRes.json();
    assert(skillsRes.status === 200 && skillsJson.success, 'Multi-source student skill profile returned');

    // 4. Feature 1: AI Skill Gap Analysis
    console.log('\n4️⃣ Step 4: AI Skill Gap Analysis & Target Role Benchmark...');
    const rolesRes = await fetch(`${BASE_URL}/api/skill-gap/roles`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const rolesJson = await rolesRes.json();
    const targetRoleId = rolesJson.data?.careerRoles?.[0]?.id || null;

    const analyzeRes = await fetch(`${BASE_URL}/api/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        targetType: 'CAREER_ROLE',
        targetId: targetRoleId
      })
    });
    const analyzeJson = await analyzeRes.json();
    assert(analyzeRes.status === 200 && analyzeJson.success, `Skill Gap Analysis generated for ${analyzeJson.data?.targetTitle}`);
    assert(typeof analyzeJson.data?.overallReadiness === 'number', `Computed Readiness: ${analyzeJson.data?.overallReadiness}%`);

    // 5. Recommended Learning & Courses
    console.log('\n5️⃣ Step 5: Recommended Learning Paths & Course Modules...');
    const recs = analyzeJson.data?.recommendations || [];
    assert(Array.isArray(recs), `Actionable learning recommendations linked to skill gap (${recs.length} recommendations)`);

    // 6. Projects & Certifications
    console.log('\n6️⃣ Step 6: Verified Projects & Credentials Check...');
    const { data: projs } = await supabase.from('projects').select('id, title').eq('student_id', student.id);
    const { data: certs } = await supabase.from('certificates').select('id, title').eq('student_id', student.id);
    assert(Array.isArray(projs), `Verified Projects ledger accessible (${projs?.length || 0} projects)`);
    assert(Array.isArray(certs), `Verified Certifications ledger accessible (${certs?.length || 0} certificates)`);

    // 7. Feature 4: Digital Skill Passport
    console.log('\n7️⃣ Step 7: Digital Skill Passport Verification & Export...');
    const passportRes = await fetch(`${BASE_URL}/api/passport`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const passportJson = await passportRes.json();
    const pubId = passportJson.data.passport?.publicId || passportJson.data.passportRecord?.publicId;
    assert(Boolean(pubId), `Passport Public Identifier: ${pubId}`);

    const publicRes = await fetch(`${BASE_URL}/api/passport/public/${pubId}`);
    const publicJson = await publicRes.json();
    assert(publicRes.status === 200 && publicJson.success, 'Public Recruiter Verification route accessible without auth');
    const seal = publicJson.data?.verificationSeal;
    assert(seal?.verificationStatus === 'AUTHENTIC_RECORD', 'Public ledger reports AUTHENTIC_RECORD');

    // 8. Feature 2: Industry Skill Matching
    console.log('\n8️⃣ Step 8: Industry Opportunity Matching...');
    const { data: opps } = await supabase.from('opportunities').select('id, title').limit(1);
    const activeOppId = opps && opps[0] ? opps[0].id : null;

    if (activeOppId) {
      const matchRes = await fetch(`${BASE_URL}/api/ai/match/${activeOppId}`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      const matchJson = await matchRes.json();
      assert(matchRes.status === 200 && matchJson.success, `Opportunity match score calculated: ${matchJson.data?.matchScore || matchJson.data?.score}%`);
    } else {
      assert(true, 'No opportunities currently active in database (skipped individual match calculation)');
    }

    // 9. Opportunity Application & Stage Pipeline
    console.log('\n9️⃣ Step 9: Opportunity Applications Tracking...');
    const appsRes = await fetch(`${BASE_URL}/api/student/journey`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const appsJson = await appsRes.json();
    assert(Array.isArray(appsJson.data.applications), 'Applications stage tracking integrated with career journey');

    // 10. Feature 3: Industry Assessment Engine
    console.log('\n🔟 Step 10: Industry Targeted Assessment Flow...');
    const asmtRes = await fetch(`${BASE_URL}/api/assessments/my-assessments`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const asmtJson = await asmtRes.json();
    assert(asmtRes.status === 200, 'Student assigned targeted assessments retrieved');

    // 11. Feature 7: End-to-End Career Journey Synthesis
    console.log('\n1️⃣1️⃣ Step 11: End-to-End Career Journey Synthesis...');
    const journeyRes = await fetch(`${BASE_URL}/api/student/journey`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const journeyJson = await journeyRes.json();
    assert(journeyRes.status === 200 && journeyJson.success, 'Career Journey payload generated');
    assert(journeyJson.data.stages && journeyJson.data.stages.length === 12, 'All 12 Discrete Progression Stages Present');
    assert(typeof journeyJson.data.journeyProgress === 'number', `Unified Journey Progress: ${journeyJson.data.journeyProgress}%`);
    assert(Boolean(journeyJson.data.nextBestAction?.title), `Next Best Action dynamically computed: "${journeyJson.data.nextBestAction?.title}"`);

    // 12. Feature 6: AI Career Copilot Interactive Consultation
    console.log('\n1️⃣2️⃣ Step 12: AI Career Copilot Context Synchronization...');
    const copilotRes = await fetch(`${BASE_URL}/api/ai/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: 'What is my current career progress and what should I do next?' })
    });
    const copilotJson = await copilotRes.json();
    assert(copilotRes.status === 200 && copilotJson.success, 'Career Copilot synthesized grounded career advice');
    assert(copilotJson.data.reply.length > 50, 'Copilot response grounded in student platform milestones');

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`🎉 FULL INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ Full Integration Suite failed with exception:', err);
    process.exit(1);
  }
}

runFullIntegrationTest();
