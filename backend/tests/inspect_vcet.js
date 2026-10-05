const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function inspect() {
  try {
    const u = await pool.query("SELECT * FROM users WHERE email = 'vcet@gmail.com'");
    console.log('VCET User:', u.rows[0]);
    if (u.rows.length > 0) {
      const uid = u.rows[0].id;
      const im = await pool.query('SELECT * FROM institution_members WHERE user_id = $1', [uid]);
      console.log('institution_members:', im.rows);
      const ap = await pool.query('SELECT * FROM academician_profiles WHERE user_id = $1', [uid]);
      console.log('academician_profiles:', ap.rows);
      const ur = await pool.query('SELECT * FROM user_roles WHERE user_id = $1', [uid]);
      console.log('user_roles:', ur.rows);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

inspect();
