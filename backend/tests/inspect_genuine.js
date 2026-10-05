require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const users = await pool.query(
    `SELECT id, email, created_at FROM users WHERE email IN ('sbt@tech.com', 'vcet@gmail.com', 'faculty@skillnexus.edu.in', 'yuva@gmail.com')`
  );
  console.log('Genuine users:', users.rows);

  const student = await pool.query(
    `SELECT s.id, s.full_name, s.roll_number, s.institution_id, i.name as institution_name, s.department_id, d.name as dept_name
     FROM students s
     LEFT JOIN institutions i ON i.id = s.institution_id
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE s.user_id = 'c6de34d3-c6af-4c0d-999c-9c48dd5bb689'`
  );
  console.log('Yuvaraj Student Record:', student.rows);

  const insts = await pool.query(
    `SELECT id, code, name, state FROM institutions WHERE name NOT LIKE '%1789%' AND name NOT LIKE '%Alpha%' AND name NOT LIKE '%Beta%'`
  );
  console.log('Genuine Institutions:', insts.rows);

  const companies = await pool.query(
    `SELECT id, company_name, industry FROM companies WHERE company_name NOT LIKE '%1789%'`
  );
  console.log('Genuine Companies:', companies.rows);

  await pool.end();
}
run().catch(console.error);
