const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  for (const t of ['courses', 'course_modules', 'enrollments', 'course_assignments', 'notifications']) {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      [t]
    );
    console.log(`=== TABLE ${t} ===`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  const conRes = await pool.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'enrollments'::regclass"
  );
  console.log('=== ENROLLMENTS CONSTRAINTS ===');
  console.log(conRes.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
