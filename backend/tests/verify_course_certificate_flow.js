const relationalManager = require('../src/db/relationalManager');
const assert = require('assert');

async function runVerificationTest() {
  console.log('=== STARTING COURSE-RELATED PROJECT & COLLEGE CERTIFICATE SHARING TEST ===');

  const testStudentId = `STU-TEST-${Date.now()}`;
  const testCourseId = `CRS-TEST-${Date.now()}`;
  const testCompanyId = `COMP-TEST-${Date.now()}`;
  const testInstitutionId = `TN010`;

  console.log(`\n[STEP 1] Setup Test Data:
  Student: ${testStudentId}
  Course: ${testCourseId}
  Company: ${testCompanyId}
  Institution: ${testInstitutionId}`);

  // Create course owned by Company
  const course = await relationalManager.createCourse({
    courseId: testCourseId,
    title: 'Enterprise AI Architecture & Microservices',
    companyId: testCompanyId,
    institutionId: testInstitutionId
  });
  console.log('✓ Course created with Company Ownership:', course.courseId, 'Owned by:', course.companyId);

  // Enroll Student
  const enrollment = await relationalManager.enrollCourse(testStudentId, testCourseId);
  console.log('✓ Student enrolled:', enrollment.enrollmentId, 'Progress:', enrollment.progress, '%');

  // Advance Progress to 100%
  let currentProgress = 0;
  let certGenerated = null;
  while (currentProgress < 100) {
    const adv = await relationalManager.advanceModule(enrollment.enrollmentId);
    currentProgress = adv.progress;
    if (adv.certificateGenerated) {
      certGenerated = adv.certificate;
    }
  }
  console.log(`✓ Course progress advanced to ${currentProgress}%. Certificate generated:`, certGenerated?.certificateId);
  assert(certGenerated, 'Certificate should be generated upon 100% course completion');
  assert.strictEqual(certGenerated.status, 'PENDING_VERIFICATION', 'Certificate status must be PENDING_VERIFICATION');

  // Submit Course-Related Project
  const project = await relationalManager.submitProject({
    studentId: testStudentId,
    courseId: testCourseId,
    title: 'Enterprise Microservice AI Gateway',
    description: 'Built proctored microservices gateway with FastAPI and Docker.',
    githubUrl: 'https://github.com/teststudent/ai-gateway',
    skills: ['FastAPI', 'Docker', 'Python']
  });
  console.log('✓ Course-related project submitted:', project.projectId, 'Course ID:', project.courseId);

  // [STEP 5] Company views learner profile BEFORE college verification
  console.log('\n[STEP 5] Company views Learner Profile BEFORE College Verification...');
  let companyProfileBefore = await relationalManager.getCourseLearnerProfileForCompany(testCompanyId, testCourseId, testStudentId);
  console.log('  Course Progress:', companyProfileBefore.progress, '%');
  console.log('  Course Projects Count:', companyProfileBefore.courseProjects.length);
  console.log('  Certificate Status seen by Company:', companyProfileBefore.certificate.status);
  console.log('  Certificate Details released:', companyProfileBefore.certificate.details);

  assert.strictEqual(companyProfileBefore.certificate.status, 'PENDING_VERIFICATION');
  assert.strictEqual(companyProfileBefore.certificate.details, null, 'Full cert details must remain hidden before verification');

  // [STEP 6] College / Institution verifies certificate
  console.log('\n[STEP 6] Institution / College Management verifies course certificate...');
  const verificationResult = await relationalManager.verifyCourseCertificate(
    certGenerated.certificateId,
    testInstitutionId,
    'VERIFIED',
    'Verified by Academic Dean of Computer Science',
    'USER-DEAN-01'
  );
  console.log('✓ College Verification Result:', verificationResult.success, 'New Status:', verificationResult.certificate.status);
  assert.strictEqual(verificationResult.certificate.status, 'VERIFIED');

  // [STEP 7] Company views learner profile AFTER college verification
  console.log('\n[STEP 7] Company views Learner Profile AFTER College Verification...');
  let companyProfileAfter = await relationalManager.getCourseLearnerProfileForCompany(testCompanyId, testCourseId, testStudentId);
  console.log('  Certificate Status seen by Company:', companyProfileAfter.certificate.status);
  console.log('  Certificate Details released:', companyProfileAfter.certificate.details?.certificateId);
  console.log('  Cryptographic Verification Hash:', companyProfileAfter.certificate.details?.verificationHash);

  assert.strictEqual(companyProfileAfter.certificate.status, 'VERIFIED');
  assert(companyProfileAfter.certificate.details, 'Full cert details MUST be released after college verification');
  assert(companyProfileAfter.certificate.details.verificationHash, 'Verification hash MUST be populated');

  console.log('\n============================================================');
  console.log('🎉 ALL 7 TEST STEPS PASSED SUCCESSFULLY!');
  console.log('Course-Related Project & College Certificate Sharing Workflow fully validated.');
  console.log('============================================================');
}

runVerificationTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
