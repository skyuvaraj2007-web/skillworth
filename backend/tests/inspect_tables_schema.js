require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const tables = ['users', 'students', 'institutions', 'companies', 'opportunities', 'assessments', 'applications'];
  for (const t of tables) {
    const res = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\nTable ${t}:`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  const sampleUsers = await pool.query('SELECT * FROM users LIMIT 5');
  console.log('\nSample users:', sampleUsers.rows);

  const sampleInst = await pool.query('SELECT id, name, code, state FROM institutions LIMIT 5');
  console.log('\nSample institutions:', sampleInst.rows);

  const sampleStu = await pool.query('SELECT id, user_id, full_name, institution_id, department, email FROM students LIMIT 5');
  console.log('\nSample students:', sampleStu.rows);

  await pool.end();
}

run().catch(console.error);
