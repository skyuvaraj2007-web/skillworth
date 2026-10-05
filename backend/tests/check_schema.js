const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Add unique constraint to student_lesson_progress
  try {
    await pool.query('ALTER TABLE student_lesson_progress ADD CONSTRAINT uq_enrollment_lesson UNIQUE(enrollment_id, lesson_id)');
    console.log('Unique constraint added to student_lesson_progress');
  } catch(e) { console.log('Constraint may already exist:', e.message); }
  
  // Add course_assignments improvements  
  try {
    await pool.query('ALTER TABLE course_assignments ADD COLUMN IF NOT EXISTS target_type VARCHAR(50)');
    console.log('Added target_type column to course_assignments');
  } catch(e) { console.log('course_assignments update:', e.message); }

  // Check notifications table schema
  const notifRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position");
  console.log('Notifications columns:', notifRes.rows.map(r => r.column_name).join(', '));

  // Check course_assignments schema
  const caRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'course_assignments' ORDER BY ordinal_position");
  console.log('course_assignments columns:', caRes.rows.map(r => r.column_name).join(', '));

  // Check student_lesson_progress schema
  const slpRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'student_lesson_progress' ORDER BY ordinal_position");
  console.log('student_lesson_progress columns:', slpRes.rows.map(r => r.column_name).join(', '));

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
