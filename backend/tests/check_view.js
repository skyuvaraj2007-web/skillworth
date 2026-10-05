require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await pool.query(`SELECT view_definition FROM information_schema.views WHERE table_name = 'assessment_candidates'`);
  console.log('view definition:', r.rows[0]?.view_definition);
  await pool.end();
}
run().catch(console.error);
