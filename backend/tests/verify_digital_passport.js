const assert = require('assert');
const jwt = require('jsonwebtoken');
const relationalManager = require('../src/db/relationalManager');
const { supabase } = require('../src/config/supabase');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: 'STUDENT',
      studentId: user.student_id || user.id
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING FEATURE 4: DIGITAL SKILL PASSPORT');
  console.log('════════════════════════════════════════════════════════════════\n');

  // 1. Find a test student
  const { data: students, error: stuErr } = await supabase
    .from('students')
    .select('*, users (id, email)')
    .limit(1);

  assert(!stuErr && students && students.length > 0, 'Must have at least one test student in database');
  const studentRow = students[0];
  const userObj = {
    id: studentRow.users?.id || studentRow.user_id,
    email: studentRow.users?.email || 'student.test@example.com',
    student_id: studentRow.id
  };
  const token = generateToken(userObj);

  console.log(`🔑 Authenticated Student: ${studentRow.full_name} (${userObj.email})`);
  console.log(`   Student ID: ${studentRow.id}\n`);

  // 2. Test GET /api/passport (Authenticated)
  console.log('1️⃣ Testing GET /api/passport (Authenticated Student Passport)...');
  const passRes = await fetch(`${BASE_URL}/passport`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const passData = await passRes.json();
  assert.strictEqual(passRes.status, 200, 'GET /api/passport must return 200');
  assert.strictEqual(passData.success, true, 'Response must indicate success');
  
  const d = passData.data;
  assert(d.student, 'Must have student object');
  assert(d.passport && d.passport.publicId, 'Must have passport object with publicId');
  assert(d.skillScore && typeof d.skillScore.overallScore === 'number', 'Must have skillScore object with overallScore');
  assert(Array.isArray(d.skills), 'Must have skills array');
  assert(Array.isArray(d.projects), 'Must have projects array');
  assert(Array.isArray(d.certifications), 'Must have certifications array');
  assert(Array.isArray(d.courses), 'Must have courses array');
  assert(Array.isArray(d.assessments), 'Must have assessments array');
  assert(Array.isArray(d.experiences), 'Must have experiences array');

  console.log(`   ✅ Passport Loaded: Public ID = ${d.passport.publicId}`);
  console.log(`   ✅ Overall Skill Score (from Skill Engine): ${d.skillScore.overallScore}% (${d.skillScore.readinessTier})`);
  console.log(`   ✅ Total Skills Evaluated: ${d.skills.length} (${d.skillScore.verifiedSkillsCount} verified)`);
  console.log(`   ✅ Verified Items Across Platform: ${d.metrics.verifiedItemsCount}`);
  
  // Verify sources
  if (d.skills.length > 0) {
    console.log(`   Sample Skill: "${d.skills[0].skillName}" -> Source: ${d.skills[0].source}`);
  }
  if (d.assessments.length > 0) {
    console.log(`   Sample Assessment: "${d.assessments[0].title}" -> ${d.assessments[0].verificationSource}`);
  }

  const publicId = d.passport.publicId;

  // Initialize privacy to strict default before testing
  await fetch(`${BASE_URL}/passport/privacy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      isPublic: true,
      privacySettings: {
        showEmail: false,
        showRollNumber: false,
        showCgpa: false,
        showAssessments: true,
        showProjects: true,
        showCertificates: true,
        showCourses: true,
        showExperience: true
      }
    })
  });

  // 3. Test Public Verification Route GET /api/passport/public/:publicId (NO AUTH)
  console.log('\n2️⃣ Testing GET /api/passport/public/:publicId (Public Unauthenticated Recruiter Route)...');
  const pubRes = await fetch(`${BASE_URL}/passport/public/${publicId}`);
  const pubData = await pubRes.json();
  assert.strictEqual(pubRes.status, 200, 'Public passport must return 200 without authentication');
  assert.strictEqual(pubData.success, true, 'Public response must be successful');
  assert.strictEqual(pubData.data.isPrivate, false, 'Passport should be public by default');
  assert(pubData.data.verificationSeal, 'Must contain authentic verificationSeal');
  assert.strictEqual(pubData.data.verificationSeal.publicIdentifier, publicId);

  console.log(`   ✅ Verification Seal: ${pubData.data.verificationSeal.verifiedBy}`);
  console.log(`   ✅ Status: ${pubData.data.verificationSeal.verificationStatus}`);
  console.log(`   ✅ Ledger Hash: ${pubData.data.verificationSeal.qrHash.slice(0, 24)}...`);

  // Verify default privacy redaction: email, rollNumber, cgpa should be null on public view
  assert.strictEqual(pubData.data.student.email, null, 'Email should be masked on public view by default');
  assert.strictEqual(pubData.data.student.rollNumber, null, 'Roll number should be masked by default');
  assert.strictEqual(pubData.data.student.cgpa, null, 'CGPA should be masked by default');
  console.log('   🔒 Privacy Verified: Sensitive PII (email, roll number, CGPA) is redacted on public view.');

  // 4. Test Privacy Settings Update PUT /api/passport/privacy
  console.log('\n3️⃣ Testing PUT /api/passport/privacy (Updating Privacy Controls)...');
  const updateRes = await fetch(`${BASE_URL}/passport/privacy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      isPublic: true,
      privacySettings: {
        showEmail: true,
        showRollNumber: false,
        showCgpa: false,
        showAssessments: true,
        showProjects: true,
        showCertificates: true,
        showCourses: true,
        showExperience: true
      }
    })
  });
  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200, 'PUT /api/passport/privacy must return 200');
  assert.strictEqual(updateData.success, true);
  console.log('   ✅ Privacy Settings Updated: showEmail enabled.');

  // Re-verify public view now exposes email because student explicitly allowed it
  const pubRes2 = await fetch(`${BASE_URL}/passport/public/${publicId}`);
  const pubData2 = await pubRes2.json();
  assert.strictEqual(pubData2.data.student.email, studentRow.users?.email || userObj.email, 'Email should be visible when student enables showEmail');
  console.log(`   ✅ Privacy Control Functional: Public view reflects updated setting (Email: ${pubData2.data.student.email}).`);

  // 5. Test Private Mode (isPublic: false)
  console.log('\n4️⃣ Testing Toggle Private Mode (isPublic: false)...');
  await fetch(`${BASE_URL}/passport/privacy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ isPublic: false })
  });

  const privateRes = await fetch(`${BASE_URL}/passport/public/${publicId}`);
  assert.strictEqual(privateRes.status, 403, 'Private passport must return 403 for public visitors');
  const privateData = await privateRes.json();
  assert.strictEqual(privateData.isPrivate, true);
  console.log('   🔒 Private Passport Verified: Public view returns 403 Forbidden with candidate private status.');

  // Re-enable public mode for subsequent operations
  await fetch(`${BASE_URL}/passport/privacy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ isPublic: true })
  });

  // 6. Test Invalid Public ID
  console.log('\n5️⃣ Testing Invalid Public ID (Error Handling)...');
  const invalidRes = await fetch(`${BASE_URL}/passport/public/NX-NONEXISTENT-99999`);
  assert.strictEqual(invalidRes.status, 404, 'Invalid public ID must return 404 Not Found');
  console.log('   ✅ Invalid Public ID correctly returns 404 Not Found.');

  // 7. Test Export JSON-LD
  console.log('\n6️⃣ Testing GET /api/passport/export-jsonld...');
  const jsonLdRes = await fetch(`${BASE_URL}/passport/export-jsonld`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(jsonLdRes.status, 200);
  const jsonLdDoc = await jsonLdRes.json();
  assert(jsonLdDoc['@context'], 'Must have W3C @context');
  assert(jsonLdDoc.credentialSubject, 'Must have credentialSubject');
  assert(jsonLdDoc.proof, 'Must have cryptographic proof object');
  console.log(`   ✅ W3C Verifiable Credential Exported: Signed for ${jsonLdDoc.credentialSubject.name}`);

  console.log('\n🎉 ALL FEATURE 4 BACKEND & PASSPORT VERIFICATION TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
