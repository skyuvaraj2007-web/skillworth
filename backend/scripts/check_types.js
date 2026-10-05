const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool();

async function check() {
  const tables = ['students', 'institutions', 'companies', 'courses', 'assessments', 'assessment_questions'];
  for (const t of tables) {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [t]
    );
    console.log(`\nTable [${t}]:`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await pool.end();
}

check().catch(console.error);
