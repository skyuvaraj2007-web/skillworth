require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'student_skills'::regclass
  `);
  console.log('student_skills constraints:', r.rows);
  await pool.end();
}
run().catch(console.error);
