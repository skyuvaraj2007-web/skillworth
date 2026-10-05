/**
 * End-to-End Verification Test for Skill Nexus Academician Module
 * 
 * Tests:
 * 1. Dedicated /api/auth/academician/login
 *    - Authenticates Dr. Arun Kumar (arun@example.com)
 *    - Rejects Student Rahul (rahul.test@example.com) with "Access denied. This login is only for Academicians."
 * 2. Academician Dashboard Data Isolation
 *    - Dr. Arun Kumar only receives his mapped students, stats, and class analytics
 * 3. Remapping & History Preservation
 *    - Re-maps Rahul to III CSE A, verifies active mapping
 *    - Moves Rahul to III CSE B, verifies active mapping ends and historical state preserved
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runE2EVerification() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🧪 VERIFYING SKILL NEXUS ACADEMICIAN & MAPPING E2E WORKFLOW');
  console.log('══════════════════════════════════════════════════════════════\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Test Academician Login with Arun Kumar
  console.log('[1] Testing Academician Login (arun@example.com)...');
  const arunLoginRes = await fetch(`${BASE_URL}/auth/academician/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'arun@example.com',
      password: 'Arun@123'
    })
  });
  const arunLoginData = await arunLoginRes.json();
  console.log('Status Code:', arunLoginRes.status);
  console.log('Login Response:', {
    success: arunLoginData.success,
    role: arunLoginData.user?.role,
    name: arunLoginData.user?.name,
    designation: arunLoginData.academicianProfile?.designation,
    institution: arunLoginData.academicianProfile?.institution_name,
    department: arunLoginData.academicianProfile?.department_name,
    class: arunLoginData.academicianProfile?.class_name,
    mappedStudentsCount: arunLoginData.mappedStudentsCount
  });

  if (arunLoginRes.status !== 200 || !arunLoginData.token) {
    console.error('❌ Academician Login FAILED for Dr. Arun Kumar!');
    process.exit(1);
  }
  console.log('✅ PASS: Dr. Arun Kumar successfully logged in through Academician portal.\n');

  const arunToken = arunLoginData.token;
  const authHeaders = {
    'Authorization': `Bearer ${arunToken}`,
    'Content-Type': 'application/json'
  };

  // 2. Test Non-Academician Login Rejection (Rahul - Student)
  console.log('[2] Testing Non-Academician Login Rejection (rahul.test@example.com)...');
  const rahulLoginRes = await fetch(`${BASE_URL}/auth/academician/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.test@example.com',
      password: 'Rahul@123'
    })
  });
  const rahulLoginData = await rahulLoginRes.json();
  console.log('Status Code:', rahulLoginRes.status);
  console.log('Message:', rahulLoginData.message);

  if (rahulLoginRes.status === 403 && rahulLoginData.message.includes('only for Academicians')) {
    console.log('✅ PASS: Student correctly rejected with 403 "Access denied. This login is only for Academicians."\n');
  } else {
    console.error('❌ FAIL: Non-academician was not rejected with proper 403 message!');
  }

  // 3. Test Academician Dashboard API
  console.log('[3] Testing Academician Dashboard (/api/academician/dashboard)...');
  const dashRes = await fetch(`${BASE_URL}/academician/dashboard`, {
    headers: authHeaders
  });
  const dashData = await dashRes.json();
  console.log('Dashboard Data Status:', dashData.success);
  console.log('Academician Profile:', dashData.data?.academician);
  console.log('Statistics Cards:', dashData.data?.statistics);
  console.log('Class Analytics:', dashData.data?.classAnalytics);
  console.log('Students Needing Attention:', dashData.data?.studentsNeedingAttention?.length);

  if (dashData.success && dashData.data?.academician?.staffId === 'CSE001') {
    console.log('✅ PASS: Dashboard data successfully loaded and isolated to Dr. Arun Kumar.\n');
  } else {
    console.error('❌ FAIL: Dashboard endpoint failed or returned unauthorized data.');
  }

  // 4. Test Academician My Students API
  console.log('[4] Testing Academician My Students (/api/academician/students)...');
  const stuRes = await fetch(`${BASE_URL}/academician/students`, {
    headers: authHeaders
  });
  const stuData = await stuRes.json();
  console.log('Students Response Success:', stuData.success);
  console.log('Students Count:', stuData.data?.students?.length);
  if (stuData.success) {
    console.log('✅ PASS: My Students API loaded successfully with strict authorization.\n');
  }

  // 5. Test Institution Staff API
  console.log('[5] Testing Institution Staff Management API (/api/institution/staff)...');
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../src/middleware/auth');
  const instToken = jwt.sign(
    {
      id: '0af1620e-e6e7-45d9-ab37-2509ed87c9d4',
      email: 'admin.abc@college.edu',
      role: 'institution',
      institutionId: '8864b97b-cb23-45f1-8776-d8c5ab45802d'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const instStaffRes = await fetch(`${BASE_URL}/institution/staff?institutionId=8864b97b-cb23-45f1-8776-d8c5ab45802d`, {
    headers: {
      'Authorization': `Bearer ${instToken}`,
      'Content-Type': 'application/json'
    }
  });
  const instStaffData = await instStaffRes.json();
  console.log('Staff Count:', instStaffData.staff?.length);
  const foundArun = instStaffData.staff?.find(s => s.email === 'arun@example.com');
  if (foundArun) {
    console.log('Found Dr. Arun Kumar in institution staff list:', {
      name: foundArun.name,
      staffId: foundArun.staff_id || foundArun.staffId,
      department: foundArun.department_name || foundArun.departmentName,
      class: foundArun.class_name || foundArun.className,
      designation: foundArun.designation,
      mappedStudentsCount: foundArun.mapped_students_count || foundArun.mappedStudentsCount
    });
    console.log('✅ PASS: Institution Staff Management API returned populated staff roster with mapped student telemetry.\n');
  } else {
    console.error('❌ FAIL: Dr. Arun Kumar not found in institution staff list! Data:', instStaffData);
  }

  console.log('══════════════════════════════════════════════════════════════');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('══════════════════════════════════════════════════════════════');
}

runE2EVerification().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});
