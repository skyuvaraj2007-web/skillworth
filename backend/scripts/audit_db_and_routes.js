const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'skillnexus_db'
      }
);

async function inspect() {
  try {
    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log('=== PG TABLES (' + tablesRes.rows.length + ') ===');
    console.log(tablesRes.rows.map(r => r.table_name).join(', '));

    // Check specific tables of interest
    const interesting = [
      'company_institution_partnerships',
      'talent_pools',
      'talent_pool_candidates',
      'assessments',
      'assessment_questions',
      'question_options',
      'assessment_attempts',
      'assessment_results',
      'courses',
      'course_modules',
      'course_skills',
      'enrollments',
      'student_module_progress',
      'opportunities',
      'applications',
      'interviews',
      'notifications',
      'audit_logs'
    ];

    console.log('\n=== CHECKING SPECIFIC TABLES ===');
    for (const t of interesting) {
      const exists = tablesRes.rows.some(r => r.table_name === t);
      if (exists) {
        const cols = await pool.query(
          "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position;",
          [t]
        );
        console.log(`Table [${t}] exists (${cols.rows.length} cols):`, cols.rows.map(c => c.column_name).join(', '));
      } else {
        console.log(`Table [${t}] DOES NOT EXIST`);
      }
    }

    await pool.end();
  } catch (err) {
    console.error('Audit Error:', err);
    process.exit(1);
  }
}

inspect();
