/**
 * SKILLNEXUS AI — PRODUCTION-EMPTY DATABASE PURGE SCRIPT
 * Phase 3 & 4 implementation
 * 
 * Requirements:
 * 1. Connects ONLY to PostgreSQL.
 * 2. Requires POSTGRESQL_REQUIRED=true.
 * 3. Refuses to run against JSON/local storage.
 * 4. Refuses to run unless CLEAR_DEMO_DATA=true is explicitly set in environment.
 * 5. Masks credentials and sensitive tokens from console output.
 * 6. Uses PostgreSQL transaction (BEGIN...COMMIT) respecting foreign keys.
 * 7. Preserves static reference data: roles, skill_categories, skills.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function main() {
  console.log('\n================================================================');
  console.log('⚡ SKILLNEXUS AI — PRODUCTION-EMPTY DATABASE PURGE');
  console.log('================================================================');

  // Safety Check 1: PostgreSQL Requirement Flag
  const pgReq = String(process.env.POSTGRESQL_REQUIRED || '').toLowerCase() === 'true';
  if (!pgReq) {
    console.error('❌ FATAL: POSTGRESQL_REQUIRED=true is mandatory. Purge script will NOT run against JSON/local storage.');
    process.exit(1);
  }

  // Safety Check 2: Explicit Safety Flag
  const safetyFlag = String(process.env.CLEAR_DEMO_DATA || '').toLowerCase() === 'true';
  if (!safetyFlag) {
    console.error('❌ SAFETY ABORT: CLEAR_DEMO_DATA=true environment flag is required.');
    console.error('   To execute, run with the flag explicitly set:');
    console.error('   PowerShell:  $env:CLEAR_DEMO_DATA="true"; node backend/scripts/clear_demo_data.js');
    console.error('   Bash:        CLEAR_DEMO_DATA=true node backend/scripts/clear_demo_data.js\n');
    process.exit(1);
  }

  // Database Connection (PostgreSQL Only)
  if (!process.env.DATABASE_URL && !(process.env.PGHOST && process.env.PGDATABASE)) {
    console.error('❌ FATAL: No PostgreSQL credentials found in environment.');
    process.exit(1);
  }

  const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
      };

  const pool = new Pool(poolConfig);
  let client;

  try {
    client = await pool.connect();

    // Masked host information (Phase 4 requirement: NEVER print passwords or secrets)
    const hostInfo = poolConfig.host || (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL.replace(/^postgresql:\/\//, 'http://')).host : 'PostgreSQL Host');
    console.log(`📡 Connected to PostgreSQL Target: [${hostInfo}] (Credentials Masked)`);
    console.log(`🛡️  Safety check passed: CLEAR_DEMO_DATA=true confirmed.`);

    // 1. Audit Table Counts Before Deletion
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const allTables = tablesRes.rows.map(r => r.table_name);

    console.log('\n📊 PRE-CLEANUP ROW COUNTS AUDIT:');
    const beforeCounts = {};
    for (const t of allTables) {
      try {
        const c = await client.query(`SELECT COUNT(*) FROM "${t}"`);
        beforeCounts[t] = parseInt(c.rows[0].count, 10);
      } catch (e) {
        beforeCounts[t] = 'N/A';
      }
    }

    const keyTables = [
      'users', 'students', 'institutions', 'companies', 'departments',
      'courses', 'course_modules', 'course_skills', 'opportunities',
      'opportunity_skills', 'applications', 'projects', 'assessments',
      'skills', 'skill_categories', 'roles'
    ];

    keyTables.forEach(t => {
      console.log(`   ${t.padEnd(25)} : ${beforeCounts[t] !== undefined ? beforeCounts[t] : '0'}`);
    });

    // 2. Identify Demo Records To Remove
    console.log('\n🔍 IDENTIFYING DEMO RECORDS FOR PURGE:');
    console.log(`   - Demo opportunities to remove     : ${beforeCounts['opportunities'] || 0}`);
    console.log(`   - Demo opportunity skills to remove: ${beforeCounts['opportunity_skills'] || 0}`);
    console.log(`   - Demo companies to remove         : ${beforeCounts['companies'] || 0}`);
    console.log(`   - Demo courses to remove           : ${beforeCounts['courses'] || 0}`);
    console.log(`   - Demo course modules to remove    : ${beforeCounts['course_modules'] || 0}`);
    console.log(`   - Demo course skills to remove     : ${beforeCounts['course_skills'] || 0}`);
    console.log(`   - Demo departments to remove       : ${beforeCounts['departments'] || 0}`);
    console.log(`   - Demo institutions to remove      : ${beforeCounts['institutions'] || 0}`);
    console.log(`   - Static reference roles preserved : ${beforeCounts['roles'] || 0}`);
    console.log(`   - Static reference categories kept : ${beforeCounts['skill_categories'] || 0}`);
    console.log(`   - Static master skills preserved   : ${beforeCounts['skills'] || 0}`);

    // 3. Begin Transaction
    console.log('\n⏳ Initiating PostgreSQL Transaction (BEGIN)...');
    await client.query('BEGIN');

    // Ordered deletion respecting foreign-key constraints
    const tablesToPurge = [
      'application_stage_history',
      'applications',
      'match_results',
      'interviews',
      'talent_pool_candidates',
      'conversation_participants',
      'messages',
      'notifications',
      'assessment_answers',
      'assessment_results',
      'assessment_attempts',
      'assessments',
      'proctor_events',
      'project_proofs',
      'project_skills',
      'projects',
      'student_module_progress',
      'enrollments',
      'student_badges',
      'student_skills',
      'skill_evidence',
      'certificates',
      'digital_passports',
      'user_sessions',
      'user_roles',
      'institution_members',
      'company_members',
      'students',
      'users',
      'placement_drive_departments',
      'placement_drive_opportunities',
      'placement_drives',
      'curriculum_skills',
      'curricula',
      'opportunity_skills',
      'opportunities',
      'company_institution_partnerships',
      'companies',
      'course_skills',
      'course_modules',
      'courses',
      'departments',
      'institutions'
    ];

    for (const tbl of tablesToPurge) {
      if (allTables.includes(tbl)) {
        await client.query(`DELETE FROM "${tbl}";`);
        console.log(`   ✔ Purged demo records from: "${tbl}"`);
      }
    }

    // 4. Verification queries inside transaction
    console.log('\n🔍 Running Referential Integrity & Clean-State Verification...');

    const checkU = await client.query('SELECT COUNT(*) FROM users');
    const checkS = await client.query('SELECT COUNT(*) FROM students');
    const checkI = await client.query('SELECT COUNT(*) FROM institutions');
    const checkC = await client.query('SELECT COUNT(*) FROM companies');
    const checkO = await client.query('SELECT COUNT(*) FROM opportunities');
    const checkRoles = await client.query('SELECT COUNT(*) FROM roles');
    const checkSkills = await client.query('SELECT COUNT(*) FROM skills');
    const checkCats = await client.query('SELECT COUNT(*) FROM skill_categories');

    console.log(`   - Users count          : ${checkU.rows[0].count} (Expected: 0)`);
    console.log(`   - Students count       : ${checkS.rows[0].count} (Expected: 0)`);
    console.log(`   - Institutions count   : ${checkI.rows[0].count} (Expected: 0)`);
    console.log(`   - Companies count      : ${checkC.rows[0].count} (Expected: 0)`);
    console.log(`   - Opportunities count  : ${checkO.rows[0].count} (Expected: 0)`);
    console.log(`   - Preserved Roles      : ${checkRoles.rows[0].count} (Expected: >= 4)`);
    console.log(`   - Preserved Categories : ${checkCats.rows[0].count} (Expected: >= 10)`);
    console.log(`   - Preserved Skills     : ${checkSkills.rows[0].count} (Expected: >= 42)`);

    if (
      parseInt(checkU.rows[0].count, 10) === 0 &&
      parseInt(checkS.rows[0].count, 10) === 0 &&
      parseInt(checkI.rows[0].count, 10) === 0 &&
      parseInt(checkC.rows[0].count, 10) === 0 &&
      parseInt(checkO.rows[0].count, 10) === 0 &&
      parseInt(checkRoles.rows[0].count, 10) >= 4 &&
      parseInt(checkSkills.rows[0].count, 10) >= 42
    ) {
      await client.query('COMMIT');
      console.log('\n✅ TRANSACTION COMMITTED SUCCESSFULLY!');
      console.log('✨ All demo, test, seed, and mock records have been safely removed.');
      console.log('✨ The PostgreSQL database is completely production-empty and ready for real users.');
    } else {
      await client.query('ROLLBACK');
      console.error('\n❌ INTEGRITY CHECK FAILED: Verification counts did not match expected values. Transaction rolled back.');
      process.exit(1);
    }
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 Rolled back transaction due to error.');
      } catch (rbErr) {}
    }
    console.error('❌ FATAL ERROR executing purge:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
