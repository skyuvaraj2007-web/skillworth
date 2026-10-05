require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'applications'");
  console.log('applications cols:', r.rows.map(x => x.column_name).join(', '));
  await pool.end();
}
run().catch(console.error);
