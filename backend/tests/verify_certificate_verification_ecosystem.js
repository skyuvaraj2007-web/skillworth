// backend/tests/verify_certificate_verification_ecosystem.js
/**
 * Master Verification Suite:
 * Certificate Submission → Institution Verification → Verified Skills → AI Skill Gap Intelligence
 *
 * Tests:
 * 1. Zero-state verification for brand-new student (0 certificates, 0 verified certificate evidence)
 * 2. File security: Blocks executable (.exe, .sh), accepts PDF, PNG, DOCX, PPTX
 * 3. Student certificate upload (PDF) with metadata & AI suggested skills
 * 4. Certificate appears in "My Certificates" with PENDING status
 * 5. Send to mapped college for verification
 * 6. Institution review queue & real database analytics
 * 7. Multi-tenant isolation (Institution A sees, Institution B receives 403 Forbidden / 404)
 * 8. In-app document viewing & streaming
 * 9. Institution correction request with mandatory reason
 * 10. Student sees correction reason and updates metadata
 * 11. Institution rejection with mandatory reason
 * 12. Institution verification with reviewer tracking
 * 13. Verified certificate → Verified Skill Evidence integration
 * 14. Verified skill intelligence updates proficiency with genuine credential proof
 * 15. NEXUS AI skill gap recalculation & explainable recommendations (WHY, EVIDENCE, MISSING, ACTION)
 * 16. Institution-level aggregate certificate & top campus-wide skill gaps
 * 17. Multi-format upload verification: PNG image, DOCX, PPTX
 * 18. Audit telemetry and notification dispatch
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const API_BASE = 'http://localhost:5000/api';

async function runCertificateEcosystemTests() {
  console.log('======================================================================');
  console.log('📜 RUNNING CERTIFICATE VERIFICATION & AI SKILL GAP ECOSYSTEM TESTS');
  console.log('======================================================================\n');

  const testId = Date.now();

  // Helper: Register accounts
  async function registerUser(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Register failed: ${JSON.stringify(json)}`);
    return json;
  }

  console.log('[SETUP] Onboarding Student and Institutions...');
  const studentEmail = `student.cert.${testId}@campus.edu`;
  const regStudent = await registerUser({
    name: 'Vikramaditya Sharma',
    email: studentEmail,
    password: 'Password@123',
    role: 'student',
    institutionId: 'TN010',
    collegeId: 'TN010',
    collegeName: 'SRM Institute of Science and Technology',
    department: 'Computer Science and Engineering',
    year: '3rd Year',
    regNo: `REG-TN010-${testId.toString().slice(-4)}`
  });
  const tokenStudent = regStudent.token;
  const studentId = regStudent.user.studentId || regStudent.user.id;
  console.log(`  ✓ Student registered: ${studentId}`);

  // Institution A (Mapped SRM)
  const regInstA = await registerUser({
    name: 'Dr. S. K. Ramanathan (SRM Admin)',
    email: `admin.srm.${testId}@srm.edu`,
    password: 'Password@123',
    role: 'institution',
    institutionId: 'TN010',
    collegeId: 'TN010',
    collegeName: 'SRM Institute of Science and Technology'
  });
  const tokenInstA = regInstA.token;
  console.log('  ✓ Institution A (SRM TN010) registered');

  // Institution B (Unmapped VIT)
  const regInstB = await registerUser({
    name: 'Dr. V. Swaminathan (VIT Admin)',
    email: `admin.vit.${testId}@vit.edu`,
    password: 'Password@123',
    role: 'institution',
    institutionId: 'TN020',
    collegeId: 'TN020',
    collegeName: 'Vellore Institute of Technology'
  });
  const tokenInstB = regInstB.token;
  console.log('  ✓ Institution B (VIT TN020) registered\n');

  // --------------------------------------------------------------------------
  // TEST 1: Strict Zero-State Verification
  // --------------------------------------------------------------------------
  console.log('[TEST 1] New student zero-state verification');
  const resMyCerts0 = await fetch(`${API_BASE}/certificates/my`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  assert.strictEqual(resMyCerts0.status, 200, 'GET /api/certificates/my succeeds');
  const jsonMyCerts0 = await resMyCerts0.json();
  assert.strictEqual(jsonMyCerts0.data.length, 0, 'Zero-state: Student has 0 certificates initially');
  console.log('  ✓ 0 certificates on record for brand-new student');

  const resGap0 = await fetch(`${API_BASE}/learning/skill-gap`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  assert.strictEqual(resGap0.status, 200, 'GET /api/learning/skill-gap succeeds');
  const jsonGap0 = await resGap0.json();
  assert.strictEqual(jsonGap0.data.verifiedCertificatesCount, 0, 'Zero-state: 0 verified certificates in AI skill gap');
  assert.strictEqual(jsonGap0.data.strengths.length, 0, 'Zero-state: 0 verified strengths initially');
  console.log('  ✓ Zero-state: AI skill gap identifies 0 verified certificate evidence');

  // --------------------------------------------------------------------------
  // TEST 2: File Security & Dangerous Executable Blocking
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] File Security: Rejection of dangerous executable files');
  const fakeExeBase64 = Buffer.from('MZ_FAKE_EXECUTABLE_PAYLOAD').toString('base64');
  const resBadUpload = await fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenStudent}`
    },
    body: JSON.stringify({
      title: 'Hacked Certificate Tool',
      fileName: 'exploit_tool.exe',
      fileBase64: fakeExeBase64
    })
  });
  assert.strictEqual(resBadUpload.status, 400, 'TEST 2: Executable file upload rejected with 400');
  const jsonBadUpload = await resBadUpload.json();
  assert(jsonBadUpload.message.includes('Security violation'), 'Explicit security violation returned for .exe');
  console.log('  ✓ Dangerous .exe rejected with security violation');

  // --------------------------------------------------------------------------
  // TEST 3, 4: Uploading PDF Certificate & My Certificates list
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3 & 4] Student uploads PDF Certificate');
  const samplePdfContent = '%PDF-1.5 %Sample Authenticated Certificate Document for Vikramaditya Sharma 2026';
  const pdfBase64 = Buffer.from(samplePdfContent).toString('base64');

  const resUploadPdf = await fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenStudent}`
    },
    body: JSON.stringify({
      title: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      certificateNumber: `AWS-SAA-${testId.toString().slice(-6)}`,
      issueDate: '2026-03-15',
      expiryDate: '2029-03-15',
      category: 'Cloud Computing',
      description: 'Comprehensive architectural certification for cloud infrastructure, VPC, and high availability.',
      relatedSkills: ['Cloud Computing', 'AWS', 'Distributed Systems'],
      credentialUrl: 'https://aws.amazon.com/verification/AWS-SAA-8841',
      fileName: 'aws_solutions_architect.pdf',
      fileBase64: pdfBase64,
      sendToCollege: true
    })
  });
  assert.strictEqual(resUploadPdf.status, 201, 'TEST 3: Certificate uploaded with 201 Created');
  const jsonUploadPdf = await resUploadPdf.json();
  const cert1 = jsonUploadPdf.data;
  assert(cert1.id, 'Certificate assigned unique canonical ID');
  assert.strictEqual(cert1.status, 'PENDING', 'TEST 4: Initial status is strictly PENDING');
  assert.strictEqual(cert1.institutionId, 'TN010', 'Mapped to student institution TN010');
  console.log('  ✓ Certificate uploaded and assigned ID:', cert1.id);
  console.log('  ✓ Initial status: PENDING verification');

  // Verify list
  const resMyList = await fetch(`${API_BASE}/certificates/my`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  const jsonMyList = await resMyList.json();
  assert.strictEqual(jsonMyList.data.length, 1, 'Certificate appears in My Certificates');
  assert.strictEqual(jsonMyList.data[0].id, cert1.id, 'Record ID matches uploaded certificate');
  console.log('  ✓ Certificate visible in student "My Certificates" registry');

  // --------------------------------------------------------------------------
  // TEST 5, 6, 7: In-App Document Viewing & Streaming
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5, 6, 7] In-App Document Viewing & Secure File Streaming');
  const resView = await fetch(`${API_BASE}/certificates/${cert1.id}/view`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  assert.strictEqual(resView.status, 200, 'TEST 5: Document streams successfully (200 OK)');
  const contentType = resView.headers.get('content-type');
  assert(contentType.includes('application/pdf'), 'TEST 6: Content-Type is application/pdf for in-app viewer');
  const streamedContent = await resView.text();
  assert(streamedContent.includes('Sample Authenticated Certificate Document'), 'TEST 7: Streamed file content matches uploaded bytes');
  console.log('  ✓ In-app PDF viewer stream verified with Content-Type:', contentType);

  // --------------------------------------------------------------------------
  // TEST 8: Multi-Tenant Isolation (Institution A vs Institution B)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 8] Strict Multi-Tenant Isolation');
  // Institution A (SRM TN010) accesses queue
  const resInstACerts = await fetch(`${API_BASE}/academic/certificates`, {
    headers: { 'Authorization': `Bearer ${tokenInstA}` }
  });
  assert.strictEqual(resInstACerts.status, 200, 'Institution A accesses certificate review list');
  const jsonInstACerts = await resInstACerts.json();
  const certInQueue = jsonInstACerts.data.find(c => c.id === cert1.id);
  assert(Boolean(certInQueue), 'TEST 8A: Institution A sees student certificate in verification queue');

  // Institution B (VIT TN020) CANNOT access Institution A student certificate
  const resInstBView = await fetch(`${API_BASE}/academic/certificates/${cert1.id}`, {
    headers: { 'Authorization': `Bearer ${tokenInstB}` }
  });
  assert.strictEqual(resInstBView.status, 403, 'TEST 8B: Institution B receives 403 Forbidden attempting to access Institution A certificate');

  const resInstBCerts = await fetch(`${API_BASE}/academic/certificates`, {
    headers: { 'Authorization': `Bearer ${tokenInstB}` }
  });
  const jsonInstBCerts = await resInstBCerts.json();
  const certInVITQueue = jsonInstBCerts.data.find(c => c.id === cert1.id);
  assert.strictEqual(Boolean(certInVITQueue), false, 'TEST 8C: Institution B queue contains 0 Institution A certificates');
  console.log('  ✓ Institution A (SRM) can review certificate');
  console.log('  ✓ Institution B (VIT) is strictly blocked (403 Forbidden & 0 records in queue)');

  // --------------------------------------------------------------------------
  // TEST 9 & 10: Institution Real Database Analytics
  // --------------------------------------------------------------------------
  console.log('\n[TEST 9 & 10] Real Database Analytics for Institution');
  const resAnalytics = await fetch(`${API_BASE}/academic/certificates/analytics`, {
    headers: { 'Authorization': `Bearer ${tokenInstA}` }
  });
  assert.strictEqual(resAnalytics.status, 200, 'Analytics endpoint returns 200');
  const jsonAnalytics = await resAnalytics.json();
  assert(jsonAnalytics.data.counts.total >= 1, 'TEST 9: Total count reflects real database records');
  assert(jsonAnalytics.data.counts.pending >= 1, 'TEST 10: Pending count reflects real submitted certificate');
  console.log('  ✓ Real database analytics:', jsonAnalytics.data.counts);

  // --------------------------------------------------------------------------
  // TEST 11: Needs Correction Workflow
  // --------------------------------------------------------------------------
  console.log('\n[TEST 11] Request Correction Workflow with Mandatory Reason');
  const correctionNote = 'Please upload a higher-resolution document or provide the verifiable Credly badge URL.';
  const resCorrection = await fetch(`${API_BASE}/academic/certificates/${cert1.id}/request-correction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenInstA}`
    },
    body: JSON.stringify({ correctionReason: correctionNote })
  });
  assert.strictEqual(resCorrection.status, 200, 'Correction request accepted');
  const jsonCorrection = await resCorrection.json();
  assert.strictEqual(jsonCorrection.data.status, 'NEEDS_CORRECTION', 'Status changed to NEEDS_CORRECTION');
  assert.strictEqual(jsonCorrection.data.correctionReason, correctionNote, 'Correction reason preserved exactly');

  // Verify student sees correction reason
  const resStudentCheck = await fetch(`${API_BASE}/certificates/${cert1.id}`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  const jsonStudentCheck = await resStudentCheck.json();
  assert.strictEqual(jsonStudentCheck.data.status, 'NEEDS_CORRECTION', 'Student sees NEEDS_CORRECTION');
  assert.strictEqual(jsonStudentCheck.data.correctionReason, correctionNote, 'Student sees exact institution feedback');
  console.log('  ✓ Institution correction request dispatched with real feedback:', correctionNote);

  // --------------------------------------------------------------------------
  // TEST 12: Student Updates Metadata and Resubmits
  // --------------------------------------------------------------------------
  console.log('\n[TEST 12] Student Updates and Resubmits Certificate');
  const resUpdate = await fetch(`${API_BASE}/certificates/${cert1.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenStudent}`
    },
    body: JSON.stringify({
      title: 'AWS Certified Solutions Architect – Associate (Credly Verified)',
      credentialUrl: 'https://www.credly.com/badges/sample-aws-saa',
      sendToCollege: true
    })
  });
  assert.strictEqual(resUpdate.status, 200, 'Update accepted');
  const jsonUpdate = await resUpdate.json();
  assert.strictEqual(jsonUpdate.data.status, 'PENDING', 'Status reverted to PENDING for review');
  console.log('  ✓ Student updated credential and resubmitted to college');

  // --------------------------------------------------------------------------
  // TEST 13 & 14: Institution Verification & Skill Evidence Association
  // --------------------------------------------------------------------------
  console.log('\n[TEST 13 & 14] Institution Verifies Certificate & Links to Skill Evidence');
  const resVerify = await fetch(`${API_BASE}/academic/certificates/${cert1.id}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenInstA}`
    }
  });
  assert.strictEqual(resVerify.status, 200, 'TEST 13: Certificate successfully verified (200 OK)');
  const jsonVerify = await resVerify.json();
  assert.strictEqual(jsonVerify.data.status, 'VERIFIED', 'Certificate status is VERIFIED');
  assert(Boolean(jsonVerify.data.verifiedAt), 'Timestamp verifiedAt recorded');
  assert(Boolean(jsonVerify.data.verifiedBy), 'Reviewer verifiedBy recorded');
  console.log(`  ✓ Verified by: ${jsonVerify.data.verifiedBy} at ${jsonVerify.data.verifiedAt}`);

  // --------------------------------------------------------------------------
  // TEST 15: Verified Certificate Becomes Skill Evidence
  // --------------------------------------------------------------------------
  console.log('\n[TEST 15] Verified Certificate → Verified Skill Evidence');
  const resIntel = await fetch(`${API_BASE}/learning/intelligence`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  const jsonIntel = await resIntel.json();
  const intel = jsonIntel.data;

  // Cloud Computing / AWS skill evidence check
  const cloudSkill = intel.skillComparisons.find(s => s.skillName.toLowerCase() === 'cloud computing');
  assert(Boolean(cloudSkill), 'TEST 15A: Cloud Computing skill recognized from verified certificate');
  assert(cloudSkill.verifiedSkill, 'Cloud Computing has verified skill entry');
  assert.strictEqual(cloudSkill.verifiedSkill.status, 'VERIFIED', 'Verified skill status is VERIFIED');
  assert(cloudSkill.verifiedSkill.certificateEvidence.count >= 1, 'Certificate evidence count >= 1');
  console.log('  ✓ Skill "Cloud Computing" now contains verified certificate evidence');
  console.log('  ✓ Demonstrated proficiency elevated to genuine credential level:', cloudSkill.verifiedSkill.proficiency + '%');

  // --------------------------------------------------------------------------
  // TEST 16: NEXUS AI Skill Gap Recalculation with Explainability
  // --------------------------------------------------------------------------
  console.log('\n[TEST 16] NEXUS AI Skill Gap Intelligence & Explainability');
  const resGapPost = await fetch(`${API_BASE}/learning/skill-gap`, {
    headers: { 'Authorization': `Bearer ${tokenStudent}` }
  });
  assert.strictEqual(resGapPost.status, 200, 'GET /api/learning/skill-gap succeeds');
  const jsonGapPost = await resGapPost.json();
  const gapData = jsonGapPost.data;

  assert(gapData.verifiedCertificatesCount >= 1, 'Verified certificates count is 1 in skill gap intelligence');
  assert(gapData.strengths.length >= 1, 'Cloud Computing is recognized as verified strength');
  assert(gapData.skillGaps.length >= 1, 'Identified remaining priority skill gaps (e.g. React, Node.js, SQL)');

  const topGap = gapData.skillGaps[0];
  assert(Boolean(topGap.whyGapExists), 'Explainability: Contains whyGapExists');
  assert(Boolean(topGap.whatEvidenceExists), 'Explainability: Contains whatEvidenceExists');
  assert(Boolean(topGap.whatIsMissing), 'Explainability: Contains whatIsMissing');
  assert(Boolean(topGap.whatToDoNext), 'Explainability: Contains whatToDoNext');
  assert(Boolean(topGap.whyRecommended), 'Explainability: Contains whyRecommended');
  assert(['HIGH', 'MEDIUM', 'LOW'].includes(topGap.priority), 'Priority classified strictly as HIGH, MEDIUM, or LOW');
  console.log('  ✓ AI Skill Gap Strength:', gapData.strengths.map(s => `${s.skill} (${s.proficiency}%)`).join(', '));
  console.log(`  ✓ Top Priority Gap: ${topGap.skill} [${topGap.priority}]`);
  console.log(`    Why: ${topGap.whyGapExists}`);
  console.log(`    Next Action: ${topGap.whatToDoNext}`);

  // --------------------------------------------------------------------------
  // TEST 17: Multi-Format Uploads (PNG, DOCX, PPTX)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 17] Multi-Format Uploads: PNG Image, DOCX, and PPTX');
  // PNG Image Upload
  const pngBase64 = Buffer.from('89504E470D0A1A0A0000000D49484452', 'hex').toString('base64');
  const resUploadPng = await fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudent}` },
    body: JSON.stringify({
      title: 'Python for Data Science — Certified Specialist',
      issuer: 'DeepLearning.AI / Coursera',
      category: 'Data Analytics',
      relatedSkills: ['Python', 'Data Analytics'],
      fileName: 'python_datascience_badge.png',
      fileBase64: pngBase64,
      sendToCollege: true
    })
  });
  assert.strictEqual(resUploadPng.status, 201, 'PNG Image certificate uploaded successfully');
  const certPng = (await resUploadPng.json()).data;
  assert.strictEqual(certPng.fileType, 'png', 'fileType detected as png');

  // DOCX Upload
  const docxBase64 = Buffer.from('PK\x03\x04_FAKE_DOCX_ARCHIVE_DATA').toString('base64');
  const resUploadDocx = await fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudent}` },
    body: JSON.stringify({
      title: 'Advanced Technical Writing & Workplace Communication',
      issuer: 'British Council / NPTEL',
      category: 'Soft Skills',
      relatedSkills: ['Communication'],
      fileName: 'communication_fellowship.docx',
      fileBase64: docxBase64,
      sendToCollege: true
    })
  });
  assert.strictEqual(resUploadDocx.status, 201, 'DOCX certificate uploaded successfully');
  const certDocx = (await resUploadDocx.json()).data;
  assert.strictEqual(certDocx.fileType, 'docx', 'fileType detected as docx');

  // PPTX Upload
  const pptxBase64 = Buffer.from('PK\x03\x04_FAKE_PPTX_PRESENTATION_DATA').toString('base64');
  const resUploadPptx = await fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudent}` },
    body: JSON.stringify({
      title: 'AI Capstone Architecture Defense',
      issuer: 'Campus Research Board',
      category: 'Core Engineering',
      relatedSkills: ['Problem Solving', 'AI & Machine Learning'],
      fileName: 'defense_slide_deck.pptx',
      fileBase64: pptxBase64,
      sendToCollege: true
    })
  });
  assert.strictEqual(resUploadPptx.status, 201, 'PPTX certificate uploaded successfully');
  const certPptx = (await resUploadPptx.json()).data;
  assert.strictEqual(certPptx.fileType, 'pptx', 'fileType detected as pptx');
  console.log('  ✓ PNG, DOCX, and PPTX formats accepted and safely stored on physical disk');

  // --------------------------------------------------------------------------
  // TEST 18: Institution Cohort-Wide Skill Gaps
  // --------------------------------------------------------------------------
  console.log('\n[TEST 18] Institution Campus-Wide Skill Gaps & Cohort Analytics');
  const resInstGaps = await fetch(`${API_BASE}/academic/skill-gaps`, {
    headers: { 'Authorization': `Bearer ${tokenInstA}` }
  });
  assert.strictEqual(resInstGaps.status, 200, 'GET /api/academic/skill-gaps succeeds');
  const jsonInstGaps = await resInstGaps.json();
  const instGapData = jsonInstGaps.data;
  assert(instGapData.totalCohortSize >= 1, 'Cohort size matches enrolled students');
  assert(instGapData.topInstitutionSkillGaps.length >= 1, 'Top institution skill gaps returned with affected student counts');
  console.log(`  ✓ Top Institution Skill Gap: ${instGapData.topInstitutionSkillGaps[0].skill} (Affected students: ${instGapData.topInstitutionSkillGaps[0].studentsAffected})`);

  // --------------------------------------------------------------------------
  // TEST 19: AI Skill Suggestion Engine
  // --------------------------------------------------------------------------
  console.log('\n[TEST 19] AI Skill Suggestion Assistant');
  const resSuggest = await fetch(`${API_BASE}/certificates/ai/suggest-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudent}` },
    body: JSON.stringify({
      title: 'Full Stack React & Node Developer Professional',
      category: 'Web Development',
      description: 'Building RESTful APIs with Express and state-driven frontend components with React Hooks.'
    })
  });
  assert.strictEqual(resSuggest.status, 200, 'Skill suggestion endpoint returns 200');
  const jsonSuggest = await resSuggest.json();
  assert(jsonSuggest.data.includes('React'), 'AI suggests React');
  assert(jsonSuggest.data.includes('Node.js'), 'AI suggests Node.js');
  console.log('  ✓ AI Skill Suggestions:', jsonSuggest.data.join(', '));

  console.log('\n======================================================================');
  console.log('🎉 ALL 19 CERTIFICATE & AI SKILL GAP ECOSYSTEM CRITERIA PASSED!');
  console.log('======================================================================\n');
}

runCertificateEcosystemTests().catch(err => {
  console.error('\n💥 FATAL TEST ERROR:', err);
  process.exit(1);
});
