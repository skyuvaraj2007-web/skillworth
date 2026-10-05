/**
 * Clear Student & Mock User Data Utility
 * Safely backs up and empties student/user data from PostgreSQL and local JSON stores,
 * while preserving master catalogs (colleges, departments, skills, courses, badges).
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const RELATIONAL_DB_PATH = path.join(DATA_DIR, 'relational_db.json');
const DB_JSON_PATH = path.join(DATA_DIR, 'db.json');

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Database Reset (Student & User Data Clean)`);
  console.log(`⏱ Timestamp: ${timestamp}`);
  console.log(`======================================================\n`);

  // 1. Ensure backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // 2. Backup local JSON stores
  if (fs.existsSync(RELATIONAL_DB_PATH)) {
    const backupRelPath = path.join(BACKUP_DIR, `relational_db_${timestamp}.json`);
    fs.copyFileSync(RELATIONAL_DB_PATH, backupRelPath);
    console.log(`✅ Backed up relational_db.json to: ${backupRelPath}`);
  }

  if (fs.existsSync(DB_JSON_PATH)) {
    const backupDbPath = path.join(BACKUP_DIR, `db_${timestamp}.json`);
    fs.copyFileSync(DB_JSON_PATH, backupDbPath);
    console.log(`✅ Backed up db.json to: ${backupDbPath}`);
  }

  // 3. PostgreSQL Backup & Purge
  let pool = null;
  if (process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGDATABASE)) {
    try {
      const poolConfig = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.PGHOST,
            port: parseInt(process.env.PGPORT || '5432', 10),
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE
          };
      pool = new Pool(poolConfig);
      await pool.query('SELECT 1');
      console.log(`✅ Connected to PostgreSQL database`);

      // Dump user & student count for verification
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      const stuCountRes = await pool.query('SELECT COUNT(*) FROM students');
      console.log(`📊 Current PG records: ${userCountRes.rows[0].count} users, ${stuCountRes.rows[0].count} students`);

      // Backup critical tables to JSON file before deletion
      console.log(`📦 Exporting PG users and students snapshot...`);
      const usersDump = await pool.query('SELECT * FROM users');
      const stuDump = await pool.query('SELECT * FROM students');
      const pgBackupPath = path.join(BACKUP_DIR, `pg_export_${timestamp}.json`);
      fs.writeFileSync(pgBackupPath, JSON.stringify({
        timestamp,
        users: usersDump.rows,
        students: stuDump.rows
      }, null, 2), 'utf-8');
      console.log(`✅ Exported PG backup snapshot to: ${pgBackupPath}`);

      // Perform Cascaded Purge on user and student dependent tables
      const tablesToClean = [
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
        'assessment_attempts',
        'assessments',
        'digital_passports',
        'user_sessions',
        'user_roles',
        'institution_members',
        'company_members',
        'students',
        'users'
      ];

      console.log(`\n🧹 Purging PostgreSQL student & user records via TRUNCATE CASCADE...`);
      const existingTables = [];
      for (const table of tablesToClean) {
        const check = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [table]);
        if (check.rows[0].exists) {
          existingTables.push(`"${table}"`);
        }
      }

      if (existingTables.length > 0) {
        await pool.query(`TRUNCATE TABLE ${existingTables.join(', ')} CASCADE;`);
        console.log(`   ✔ Successfully truncated ${existingTables.length} tables cleanly with CASCADE.`);
      }

      // Verify final counts
      const postUserCount = await pool.query('SELECT COUNT(*) FROM users');
      const postStuCount = await pool.query('SELECT COUNT(*) FROM students');
      const postInstCount = await pool.query('SELECT COUNT(*) FROM institutions');
      const postSkillCount = await pool.query('SELECT COUNT(*) FROM skills');

      console.log(`\n📊 Post-cleanup PG verification:`);
      console.log(`   - Users: ${postUserCount.rows[0].count}`);
      console.log(`   - Students: ${postStuCount.rows[0].count}`);
      console.log(`   - Institutions (Preserved): ${postInstCount.rows[0].count}`);
      console.log(`   - Skills (Preserved): ${postSkillCount.rows[0].count}`);
    } catch (pgErr) {
      console.error(`❌ PostgreSQL Error:`, pgErr.message);
    } finally {
      if (pool) await pool.end();
    }
  } else {
    console.log(`ℹ️ No PostgreSQL credentials configured, skipping PG purge.`);
  }

  // 4. Reset backend/data/relational_db.json
  console.log(`\n🧹 Resetting local relational_db.json...`);
  if (fs.existsSync(RELATIONAL_DB_PATH)) {
    try {
      const relData = JSON.parse(fs.readFileSync(RELATIONAL_DB_PATH, 'utf-8'));
      relData.users = [];
      relData.students = [];
      relData.enrollments = [];
      relData.projects = [];
      relData.applications = [];
      relData.notifications = [];
      relData.matchResults = [];
      relData.interviews = [];
      relData.accessRequests = [];
      relData.sharedStudents = [];
      relData.institutionAssessments = [];
      relData.courseCertificates = [];
      // Keep institutions, skillsList, courses, companies, opportunities, partnerships intact
      fs.writeFileSync(RELATIONAL_DB_PATH, JSON.stringify(relData, null, 2), 'utf-8');
      console.log(`✅ relational_db.json reset: users (0), students (0). Master colleges & skills preserved.`);
    } catch (relErr) {
      console.error(`❌ Error resetting relational_db.json:`, relErr.message);
    }
  }

  // 5. Reset backend/data/db.json
  console.log(`\n🧹 Resetting local db.json...`);
  if (fs.existsSync(DB_JSON_PATH)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf-8'));
      dbData.users = [];
      dbData.assessments = [];
      dbData.projects = [];
      dbData.applications = [];
      dbData.digitalCredentials = [];
      dbData.accreditedSeals = [];
      dbData.institutionCohorts = [];
      dbData.industryPings = [];
      // Keep skills, learningCourses, weeklyTelemetry, emergingTechnologies, opportunities
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
      console.log(`✅ db.json reset: users (0), assessments (0), projects (0).`);
    } catch (dbErr) {
      console.error(`❌ Error resetting db.json:`, dbErr.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`✨ DATABASE CLEAR COMPLETE`);
  console.log(`Now all new records will be created exclusively by registered users.`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
