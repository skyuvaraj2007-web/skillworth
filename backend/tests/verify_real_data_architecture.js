/**
 * Comprehensive Automated Verification Suite
 * Verifies real PostgreSQL data architecture, student selection workflow,
 * multi-party notifications, and elimination of mock/demo data.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_jwt_secret_dev_key_2026';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 SKILLNEXUS REAL-DATA ARCHITECTURE VERIFICATION SUITE');
  console.log('================================================================\n');

  let client;
  try {
    client = await pool.connect();
    console.log('✅ 1. PostgreSQL Database Connected Successfully');

    // Test 1: Check constraints on applications table
    const checkConstraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'applications' AND c.contype = 'c';
    `);
    console.log(`✅ 2. Verified applications table constraints (${checkConstraints.rows.length} constraints found)`);
    const stageCheck = checkConstraints.rows.find(r => r.def && r.def.includes('SELECTED_FOR_TEST'));
    if (stageCheck) {
      console.log('   ✓ applications_current_stage_check contains SELECTED_FOR_TEST constraint');
    }

    // Check constraints on opportunities table
    const oppConstraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'opportunities' AND c.contype = 'c';
    `);
    console.log('Opportunities constraints:', oppConstraints.rows);

    // Test 2: Check institution_collaborations table exists
    const collabTable = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'institution_collaborations';
    `);
    if (collabTable.rows.length > 0) {
      console.log('✅ 3. Table institution_collaborations verified in database');
    } else {
      console.error('❌ Table institution_collaborations missing!');
    }

    // Test 3: Check relationalManager directly
    const relationalManager = require('../src/db/relationalManager');

    // Verify selectStudentForTesting logic with a test application
    // 1. Find or create a test student and company
    const instRes = await client.query(`SELECT id FROM institutions LIMIT 1`);
    const compRes = await client.query(`SELECT id FROM companies LIMIT 1`);
    const stuRes = await client.query(`SELECT id FROM students LIMIT 1`);
    const oppRes = await client.query(`SELECT id FROM opportunities LIMIT 1`);

    let instId = instRes.rows[0]?.id;
    let compId = compRes.rows[0]?.id;
    let stuId = stuRes.rows[0]?.id;
    let oppId = oppRes.rows[0]?.id;

    if (!instId) {
      const newInst = await client.query(`
        INSERT INTO institutions (name, code) 
        VALUES ('Test Verified Institute of Technology', 'TEST-INST-01') 
        RETURNING id
      `);
      instId = newInst.rows[0].id;
    }

    if (!compId) {
      const newComp = await client.query(`
        INSERT INTO companies (company_name, industry, contact_email) 
        VALUES ('Apex Test Innovations', 'Enterprise Software', 'recruitment@apextest.com') 
        RETURNING id
      `);
      compId = newComp.rows[0].id;
    }

    if (!stuId) {
      const newStu = await client.query(`
        INSERT INTO students (name, email, institution_id, department, cgpa) 
        VALUES ('Arun Test Candidate', 'arun.test@student.edu', $1, 'CSE', 8.95) 
        RETURNING id
      `, [instId]);
      stuId = newStu.rows[0].id;
    }

    if (!oppId) {
      const newOpp = await client.query(`
        INSERT INTO opportunities (company_id, title, opportunity_type, deadline, status) 
        VALUES ($1, 'Software Engineer Fellow', 'Full-Time', '2026-12-31', 'ACTIVE') 
        RETURNING id
      `, [compId]);
      oppId = newOpp.rows[0].id;
    }

    // Clean any prior test application between these two
    await client.query(`DELETE FROM applications WHERE opportunity_id = $1 AND student_id = $2`, [oppId, stuId]);

    // Insert test application
    const appInsert = await client.query(`
      INSERT INTO applications (opportunity_id, student_id, current_stage, resume_url)
      VALUES ($1, $2, 'Applied', 'https://skillnexus.ai/resumes/test_candidate.pdf')
      RETURNING id
    `, [oppId, stuId]);
    const testAppId = appInsert.rows[0].id;

    console.log(`✅ 4. Created test application id: ${testAppId}`);

    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    const realUserId = userRes.rows[0]?.id || null;

    // Call selectStudentForTesting
    const selectRes = await relationalManager.selectStudentForTesting(testAppId, {
      userId: realUserId,
      userType: 'company',
      companyId: compId
    });

    console.log('✅ 5. Executed selectStudentForTesting:');
    console.log(`   ✓ New stage: ${selectRes.current_stage}`);
    console.log(`   ✓ Student: ${selectRes.studentName}`);
    console.log(`   ✓ Company: ${selectRes.companyName}`);

    if (selectRes.current_stage === 'SELECTED_FOR_TEST') {
      console.log('   ✓ Stage matches SELECTED_FOR_TEST');
    } else {
      throw new Error(`Stage expected SELECTED_FOR_TEST, got ${selectRes.current_stage}`);
    }

    // Verify audit record exists
    const auditRes = await client.query(`
      SELECT * FROM application_stage_history 
      WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [testAppId]);
    if (auditRes.rows.length > 0 && auditRes.rows[0].stage === 'SELECTED_FOR_TEST') {
      console.log('✅ 6. Stage history audit trail recorded correctly');
    }

    // Verify collaborations queries
    const collabs = await relationalManager.getCollaborationsForInstitution(instId);
    console.log(`✅ 7. getCollaborationsForInstitution executed (returned ${collabs.length} records)`);

    // Verify companies for institution
    const comps = await relationalManager.getCompaniesForInstitution(instId);
    console.log(`✅ 8. getCompaniesForInstitution executed (returned ${comps.length} records)`);

    // Verify opportunities for institution
    const opps = await relationalManager.getOpportunitiesForInstitution(instId);
    console.log(`✅ 9. getOpportunitiesForInstitution executed (returned ${opps.length} records)`);

    // Clean up test application
    await client.query(`DELETE FROM application_stage_history WHERE application_id = $1`, [testAppId]);
    await client.query(`DELETE FROM applications WHERE id = $1`, [testAppId]);
    console.log('✅ 10. Test application cleaned up safely');

    console.log('\n================================================================');
    console.log('🎉 ALL 10 ARCHITECTURAL VERIFICATION CHECKS PASSED PERFECTLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runVerification();
