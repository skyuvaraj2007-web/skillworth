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

async function baseline() {
  try {
    const tableRes = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
    const userRes = await pool.query("SELECT count(*) FROM users");
    const stuRes = await pool.query("SELECT count(*) FROM students");
    const instRes = await pool.query("SELECT count(*) FROM institutions");
    const compRes = await pool.query("SELECT count(*) FROM companies");
    const oppRes = await pool.query("SELECT count(*) FROM opportunities");
    const courseRes = await pool.query("SELECT count(*) FROM courses");
    const appRes = await pool.query("SELECT count(*) FROM applications");

    const baseline = {
      tableCount: parseInt(tableRes.rows[0].count, 10),
      userCount: parseInt(userRes.rows[0].count, 10),
      studentCount: parseInt(stuRes.rows[0].count, 10),
      institutionCount: parseInt(instRes.rows[0].count, 10),
      companyCount: parseInt(compRes.rows[0].count, 10),
      opportunityCount: parseInt(oppRes.rows[0].count, 10),
      courseCount: parseInt(courseRes.rows[0].count, 10),
      applicationCount: parseInt(appRes.rows[0].count, 10)
    };

    console.log('=== PRE-MIGRATION BASELINE ===');
    console.log(JSON.stringify(baseline, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Baseline recording error:', err);
    process.exit(1);
  }
}

baseline();
