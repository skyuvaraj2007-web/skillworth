require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'skills' ORDER BY ordinal_position");
  console.log('skills columns:', r.rows.map(x => `${x.column_name} (${x.data_type})`).join(', '));

  const sampleSkills = await pool.query("SELECT * FROM skills LIMIT 5");
  console.log('sample skills:', sampleSkills.rows);

  await pool.end();
}
run().catch(console.error);
