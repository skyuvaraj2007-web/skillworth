const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const { mapStudentToStaff, remapStudentOnClassChange } = require('../src/services/staffMappingEngine');

async function test() {
  const stu = (await pool.query("SELECT id FROM students WHERE roll_number = 'STU001'")).rows[0];
  const clsA = (await pool.query("SELECT id FROM classes WHERE name = 'III CSE A'")).rows[0];
  const clsB = (await pool.query("SELECT id FROM classes WHERE name = 'III CSE B'")).rows[0];
  const arun = (await pool.query("SELECT id FROM users WHERE email = 'arun@example.com'")).rows[0];

  console.log('Mapping Rahul to Class A...');
  await pool.query('UPDATE students SET class_id = $1 WHERE id = $2', [clsA.id, stu.id]);
  await mapStudentToStaff(stu.id, pool);

  const check1 = await pool.query('SELECT * FROM student_staff_mapping WHERE student_id = $1 AND staff_id = $2 AND is_active = true', [stu.id, arun.id]);
  console.log('Active mapping in Class A:', check1.rows.length === 1 ? 'YES ✅' : 'NO ❌');

  console.log('Transferring Rahul to Class B...');
  await remapStudentOnClassChange(stu.id, clsB.id, null, pool);

  const check2 = await pool.query('SELECT * FROM student_staff_mapping WHERE student_id = $1 AND staff_id = $2 AND is_active = true', [stu.id, arun.id]);
  console.log('Active mapping in Class A after transfer:', check2.rows.length === 0 ? 'REMOVED ✅' : 'STILL ACTIVE ❌');

  const history = await pool.query('SELECT * FROM student_staff_mapping WHERE student_id = $1 AND staff_id = $2', [stu.id, arun.id]);
  console.log('Historical record preserved in DB:', history.rows.length > 0 && history.rows[0].ended_at ? 'YES ✅' : 'NO ❌');

  await pool.end();
}

test().catch(console.error);
