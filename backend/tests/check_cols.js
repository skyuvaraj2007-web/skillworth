require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const check = ['assessment_results', 'assessment_attempts', 'assessment_candidates', 'skill_evidence'];
  for (const t of check) {
    const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [t]);
    console.log(t, r.rows.map(x => x.column_name));
  }
  await pool.end();
}
run().catch(console.error);
