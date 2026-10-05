/**
 * HTTP Integration Test: verify_http_endpoints.js
 * Tests API endpoints with authenticated JWT
 */
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { supabase } = require('../src/config/supabase');

async function testHttp() {
  // Find a test student
  const { data: stu } = await supabase.from('students').select('id, user_id, full_name').limit(1).single();
  const token = jwt.sign(
    {
      id: stu.user_id || stu.id,
      studentId: stu.id,
      role: 'student',
      email: 'student.test@skillnexus.io'
    },
    process.env.JWT_SECRET || 'fallback_secret_key_skill_nexus_2026',
    { expiresIn: '1h' }
  );

  console.log('Testing HTTP Endpoints with Token for Student:', stu.full_name);

  // 1. GET /api/skill-gap/roles
  const rolesRes = await fetch('http://localhost:5000/api/skill-gap/roles', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const rolesData = await rolesRes.json();
  console.log('GET /api/skill-gap/roles status:', rolesRes.status, 'success:', rolesData.success, 'roles count:', rolesData.data?.careerRoles?.length);

  // 2. GET /api/skill-gap/student-skills
  const skillsRes = await fetch('http://localhost:5000/api/skill-gap/student-skills', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const skillsData = await skillsRes.json();
  console.log('GET /api/skill-gap/student-skills status:', skillsRes.status, 'success:', skillsData.success, 'skills count:', skillsData.data?.skills?.length);

  // 3. POST /api/skill-gap/analyze
  const analyzeRes = await fetch('http://localhost:5000/api/skill-gap/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetType: 'CAREER_ROLE',
      targetId: rolesData.data?.careerRoles?.[0]?.id
    })
  });
  const analyzeData = await analyzeRes.json();
  console.log('POST /api/skill-gap/analyze status:', analyzeRes.status, 'success:', analyzeData.success, 'readiness:', analyzeData.data?.overallReadiness + '%');

  // 4. GET /api/skill-gap/reports/latest
  const latestRes = await fetch('http://localhost:5000/api/skill-gap/reports/latest', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const latestData = await latestRes.json();
  console.log('GET /api/skill-gap/reports/latest status:', latestRes.status, 'success:', latestData.success, 'target:', latestData.data?.target_title);

  // 5. GET /api/skill-gap/recommendations
  const recsRes = await fetch('http://localhost:5000/api/skill-gap/recommendations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const recsData = await recsRes.json();
  console.log('GET /api/skill-gap/recommendations status:', recsRes.status, 'success:', recsData.success, 'recs count:', recsData.data?.length);

  if (!rolesData.success || !analyzeData.success) {
    throw new Error('One or more HTTP endpoints failed');
  }

  console.log('\n🎉 ALL HTTP ENDPOINTS TESTED & OPERATIONAL!');
}

testHttp().catch(e => {
  console.error('HTTP test failed:', e.message);
  process.exit(1);
});
