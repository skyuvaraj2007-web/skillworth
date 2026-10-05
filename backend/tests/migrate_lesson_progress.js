const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await pool.query('ALTER TABLE student_lesson_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW()');
  await pool.query('ALTER TABLE student_lesson_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0');
  await pool.query('ALTER TABLE student_lesson_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');
  console.log('Added missing columns to student_lesson_progress');
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
