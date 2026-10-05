const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const c = new Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'skillnexus_db'
  });

  try {
    await c.connect();
    await c.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;');
    await c.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';");
    console.log('✅ Columns google_id and auth_provider verified in PostgreSQL users table.');
    await c.end();
  } catch (err) {
    console.warn('⚠️ Could not connect or alter table:', err.message);
  }
}

run();
