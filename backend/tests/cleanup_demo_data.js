/**
 * Skill Nexus — Safe Demo Data Cleanup Script
 * 
 * Strict safety rules:
 * 1. Connect to PostgreSQL using process.env.DATABASE_URL.
 * 2. Confidently identify ONLY test/demo records created by automated test suites.
 * 3. EXPLICITLY WHITELIST and PRESERVE all genuine production users, institutions, and companies.
 * 4. Execute deletion in atomic SQL transaction with correct foreign-key dependency ordering.
 * 5. Display deletion preview and summary.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// Explicit whitelist of genuine users and institutions that MUST NEVER be deleted
const PRESERVED_GENUINE_EMAILS = [
  'yuva@gmail.com',
  'vcet@gmail.com',
  'faculty@skillnexus.edu.in',
  'sbt@tech.com'
];

const PRESERVED_GENUINE_INSTITUTION_CODES = [
  '2712',      // Velalar College of Engineering and Technology
  'ABC-ENG',   // ABC Engineering College
  '2005',      // Government College of Technology, Coimbatore
  'APEX-9294', // Apex Institute of Technology
  'APEX-5884'  // Apex Institute of Technology
];

async function cleanup(dryRun = false) {
  const client = await pool.connect();
  try {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('🧹 SKILL NEXUS — DEMO DATA CLEANUP & VERIFICATION');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('Mode:', dryRun ? 'PREVIEW (DRY RUN)' : 'LIVE CLEANUP');

    // 1. Identify Test Users
    const allUsers = await client.query('SELECT id, email, created_at FROM users');
    const testUsers = allUsers.rows.filter(u => {
      const email = u.email.toLowerCase();
      if (PRESERVED_GENUINE_EMAILS.includes(email)) return false;
      return (
        email.includes('test') ||
        /1789\d{9}/.test(email) ||
        email.endsWith('@example.com') ||
        email.endsWith('@test.local') ||
        email.endsWith('@test.edu') ||
        email.startsWith('dup_') ||
        email.startsWith('contact_1789') ||
        email.startsWith('kavitha_1789') ||
        email.startsWith('principal_1789') ||
        email.startsWith('staff_dr_arun_1789') ||
        email.startsWith('inactive_staff_1789') ||
        email.startsWith('suresh_1789')
      );
    });

    const testUserIds = testUsers.map(u => u.id);

    // 2. Identify Test Students
    const testStudents = await client.query(
      `SELECT id, user_id, full_name, roll_number FROM students 
       WHERE user_id = ANY($1::uuid[]) 
          OR full_name ILIKE '%test%' 
          OR full_name ILIKE '%Anand Sharma 1789%' 
          OR full_name ILIKE '%Meera Krishnan 1789%'
          OR roll_number ILIKE '%TEST%'`,
      [testUserIds]
    );
    const testStudentIds = testStudents.rows.map(s => s.id);

    // Ensure genuine student Yuvaraj is NOT in testStudentIds
    const yuvaCheck = testStudents.rows.find(s => s.full_name === 'Yuvaraj' || s.roll_number === '732925CSR178');
    if (yuvaCheck) {
      throw new Error('SAFETY ABORT: Genuine student Yuvaraj was mistakenly flagged as test!');
    }

    // 3. Identify Test Institutions
    const allInsts = await client.query('SELECT id, code, name FROM institutions');
    const testInstitutions = allInsts.rows.filter(i => {
      if (PRESERVED_GENUINE_INSTITUTION_CODES.includes(i.code)) return false;
      return (
        /1789\d{9}/.test(i.name) ||
        /1789\d{9}/.test(i.code) ||
        i.name.toLowerCase().includes('vanguard tech institute 1789') ||
        i.name.toLowerCase().includes('horizon university 1789') ||
        i.name.toLowerCase().includes('college alpha 1789') ||
        i.name.toLowerCase().includes('college beta 1789')
      );
    });
    const testInstIds = testInstitutions.map(i => i.id);

    // 4. Identify Test Companies
    const allCompanies = await client.query('SELECT id, company_name FROM companies');
    const testCompanies = allCompanies.rows.filter(c => {
      if (c.company_name === 'SBT TECH') return false;
      return (
        /1789\d{9}/.test(c.company_name) ||
        c.company_name.toLowerCase().includes('cyberdyne') ||
        c.company_name.toLowerCase().includes('omnicorp') ||
        c.company_name.toLowerCase().includes('test')
      );
    });
    const testCompanyIds = testCompanies.map(c => c.id);

    // 5. Identify Test Opportunities & Assessments
    const testOpps = await client.query(
      `SELECT id, title FROM opportunities 
       WHERE company_id = ANY($1::uuid[]) 
          OR title ILIKE '%test%' 
          OR title ILIKE '%demo%'`,
      [testCompanyIds.length > 0 ? testCompanyIds : ['00000000-0000-0000-0000-000000000000']]
    );
    const testOppIds = testOpps.rows.map(o => o.id);

    const testAssessments = await client.query(
      `SELECT id, title FROM assessments 
       WHERE company_id = ANY($1::uuid[]) 
          OR institution_id = ANY($2::uuid[])
          OR title ILIKE '%test%' 
          OR title ILIKE '%demo%'`,
      [
        testCompanyIds.length > 0 ? testCompanyIds : ['00000000-0000-0000-0000-000000000000'],
        testInstIds.length > 0 ? testInstIds : ['00000000-0000-0000-0000-000000000000']
      ]
    );
    const testAssessmentIds = testAssessments.rows.map(a => a.id);

    console.log('\nDemo cleanup preview:');
    console.log(`* Test Users:          ${testUsers.length}`);
    console.log(`* Test Students:       ${testStudents.rows.length}`);
    console.log(`* Test Institutions:   ${testInstitutions.length}`);
    console.log(`* Test Companies:      ${testCompanies.length}`);
    console.log(`* Test Opportunities:  ${testOpps.rows.length}`);
    console.log(`* Test Assessments:    ${testAssessments.rows.length}`);
    console.log(`\nPreserved Genuine Accounts:`);
    console.log(`* Genuine Users:       ${allUsers.rows.length - testUsers.length}`);
    console.log(`* Genuine Institutions:${allInsts.rows.length - testInstitutions.length}`);
    console.log(`* Genuine Companies:   ${allCompanies.rows.length - testCompanies.length}`);

    if (dryRun) {
      console.log('\n[Dry Run] No records were deleted.');
      return;
    }

    console.log('\nExecuting atomic deletion in transaction...');
    await client.query('BEGIN');

    // Child records of test students
    if (testStudentIds.length > 0) {
      await client.query(`
        DELETE FROM assessment_results 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ANY($1::uuid[]))
      `, [testStudentIds]);
      await client.query(`
        DELETE FROM assessment_answers 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ANY($1::uuid[]))
      `, [testStudentIds]);
      await client.query(`
        DELETE FROM proctor_events 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ANY($1::uuid[]))
      `, [testStudentIds]);

      await client.query('DELETE FROM digital_passports WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM applications WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM assessment_attempts WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM assessment_targets WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      
      await client.query(`
        DELETE FROM skill_evidence 
        WHERE student_skill_id IN (SELECT id FROM student_skills WHERE student_id = ANY($1::uuid[]))
      `, [testStudentIds]);
      await client.query('DELETE FROM student_skills WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_skill_history WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM skill_gap_records WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM skill_gap_reports WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM projects WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_projects WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM certificates WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_certificates WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM enrollments WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM opportunity_matches WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM match_results WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_staff_mapping WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_faculty_remarks WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_badges WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
      await client.query('DELETE FROM student_performance WHERE student_id = ANY($1::uuid[])', [testStudentIds]);
    }

    // Child records of test assessments
    if (testAssessmentIds.length > 0) {
      await client.query(`
        DELETE FROM assessment_results 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE assessment_id = ANY($1::uuid[]))
      `, [testAssessmentIds]);
      await client.query(`
        DELETE FROM assessment_answers 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE assessment_id = ANY($1::uuid[]))
      `, [testAssessmentIds]);
      await client.query(`
        DELETE FROM proctor_events 
        WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE assessment_id = ANY($1::uuid[]))
      `, [testAssessmentIds]);
      await client.query('DELETE FROM assessment_targets WHERE assessment_id = ANY($1::uuid[])', [testAssessmentIds]);
      await client.query('DELETE FROM assessment_questions WHERE assessment_id = ANY($1::uuid[])', [testAssessmentIds]);
      await client.query('DELETE FROM assessment_attempts WHERE assessment_id = ANY($1::uuid[])', [testAssessmentIds]);
      await client.query('DELETE FROM assessments WHERE id = ANY($1::uuid[])', [testAssessmentIds]);
    }

    // Child records of test opportunities
    if (testOppIds.length > 0) {
      await client.query('DELETE FROM applications WHERE opportunity_id = ANY($1::uuid[])', [testOppIds]);
      await client.query('DELETE FROM opportunity_matches WHERE opportunity_id = ANY($1::uuid[])', [testOppIds]);
      await client.query('DELETE FROM opportunity_skills WHERE opportunity_id = ANY($1::uuid[])', [testOppIds]);
      await client.query('DELETE FROM opportunities WHERE id = ANY($1::uuid[])', [testOppIds]);
    }

    // Delete test students
    if (testStudentIds.length > 0) {
      await client.query('DELETE FROM students WHERE id = ANY($1::uuid[])', [testStudentIds]);
    }

    // Child records of test institutions
    if (testInstIds.length > 0) {
      await client.query('DELETE FROM institution_members WHERE institution_id = ANY($1::uuid[])', [testInstIds]);
      await client.query('DELETE FROM classes WHERE institution_id = ANY($1::uuid[])', [testInstIds]);
      await client.query('DELETE FROM departments WHERE institution_id = ANY($1::uuid[])', [testInstIds]);
      await client.query('DELETE FROM institutions WHERE id = ANY($1::uuid[])', [testInstIds]);
    }

    // Child records of test companies
    if (testCompanyIds.length > 0) {
      await client.query('DELETE FROM company_members WHERE company_id = ANY($1::uuid[])', [testCompanyIds]);
      await client.query('DELETE FROM companies WHERE id = ANY($1::uuid[])', [testCompanyIds]);
    }

    // Delete test users
    if (testUserIds.length > 0) {
      await client.query('DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])', [testUserIds]);
      await client.query('DELETE FROM academician_profiles WHERE user_id = ANY($1::uuid[])', [testUserIds]);
      await client.query('DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])', [testUserIds]);
      await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [testUserIds]);
    }

    await client.query('COMMIT');
    console.log('✅ PASS: Cleanup completed successfully.');

    // Verification check on remaining data
    const remUsers = await client.query('SELECT count(*) FROM users');
    const remStudents = await client.query('SELECT count(*) FROM students');
    const remInsts = await client.query('SELECT count(*) FROM institutions');
    const remComps = await client.query('SELECT count(*) FROM companies');

    console.log('\nPost-Cleanup Database Summary:');
    console.log(`* Remaining Users:         ${remUsers.rows[0].count}`);
    console.log(`* Remaining Students:      ${remStudents.rows[0].count}`);
    console.log(`* Remaining Institutions:  ${remInsts.rows[0].count}`);
    console.log(`* Remaining Companies:     ${remComps.rows[0].count}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Deletion failed. Rolled back transaction:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

const isDryRun = process.argv.includes('--dry-run');
cleanup(isDryRun).catch(() => process.exit(1));
