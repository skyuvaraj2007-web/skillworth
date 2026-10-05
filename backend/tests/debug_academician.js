require('dotenv').config();
const relationalManager = require('../src/db/relationalManager');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    const pwCheck = await relationalManager.pg.query(
      `SELECT email, password_hash, is_active FROM users WHERE email IN (
        'admin.horizon.1789139773698@horizon.edu',
        'anand.1789139773698@example.com',
        'arun@example.com'
      )`
    );
    for (const r of pwCheck.rows) {
      console.log(r.email, 'Bcrypt compare Arun@123:', bcrypt.compareSync('Arun@123', r.password_hash), 'password:', bcrypt.compareSync('password', r.password_hash), 'Password123:', bcrypt.compareSync('Password123', r.password_hash), 'Admin@123:', bcrypt.compareSync('Admin@123', r.password_hash));
    }
  } catch (err) {
    console.error('DEBUG CAUGHT ERROR:', err);
  }
}

test();
