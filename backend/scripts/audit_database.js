const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function audit() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    const counts = {};
    for (const t of tables) {
      try {
        const c = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
        counts[t] = parseInt(c.rows[0].count, 10);
      } catch (e) {
        counts[t] = 'error: ' + e.message;
      }
    }
    console.log(JSON.stringify(counts, null, 2));
  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    await pool.end();
  }
}

audit();
