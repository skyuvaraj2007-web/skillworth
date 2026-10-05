require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position`);
  console.log('projects columns:', r.rows.map(x => `${x.column_name} (${x.data_type})`).join(', '));

  const certs = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'certificates' ORDER BY ordinal_position`);
  console.log('\ncertificates columns:', certs.rows.map(x => `${x.column_name} (${x.data_type})`).join(', '));

  await pool.end();
}
run().catch(console.error);
