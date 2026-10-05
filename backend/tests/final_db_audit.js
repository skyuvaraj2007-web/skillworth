const { Pool } = require('pg');
require('dotenv').config();

async function runAudit() {
  const pool = new Pool();
  console.log('--- POSTGRESQL FINAL AUDIT ---');

  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`Total Tables in Public Schema: ${tablesRes.rows.length}`);

  const counts = {};
  for (const t of tablesRes.rows) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM "${t.table_name}"`);
      counts[t.table_name] = parseInt(res.rows[0].count, 10);
    } catch (e) {
      counts[t.table_name] = 'ERROR: ' + e.message;
    }
  }

  console.log('Row counts summary:');
  console.log(`- users: ${counts['users']}`);
  console.log(`- students: ${counts['students']}`);
  console.log(`- institutions: ${counts['institutions']}`);
  console.log(`- companies: ${counts['companies']}`);
  console.log(`- opportunities: ${counts['opportunities']}`);
  console.log(`- courses: ${counts['courses']}`);
  console.log(`- applications: ${counts['applications']}`);
  console.log(`- assessments: ${counts['assessments']}`);
  console.log(`- assessment_questions: ${counts['assessment_questions']}`);
  console.log(`- programming_languages: ${counts['programming_languages']}`);
  console.log(`- course_programming_languages: ${counts['course_programming_languages']}`);
  console.log(`- institution_company_access_requests: ${counts['institution_company_access_requests']}`);
  console.log(`- institution_company_shared_students: ${counts['institution_company_shared_students']}`);

  // Check duplicate users
  const dupUsers = await pool.query(
    'SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1'
  );
  console.log(`Duplicate Users by email: ${dupUsers.rows.length}`);

  // Check duplicate students
  const dupStudents = await pool.query(
    'SELECT roll_number, COUNT(*) FROM students GROUP BY roll_number HAVING COUNT(*) > 1'
  );
  console.log(`Duplicate Students by roll_number: ${dupStudents.rows.length}`);

  // Foreign key and constraint audit
  const newTables = [
    'institution_company_access_requests',
    'institution_company_shared_students',
    'programming_languages',
    'course_programming_languages'
  ];

  for (const nt of newTables) {
    const fks = await pool.query(
      `SELECT tc.constraint_name, tc.constraint_type, kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       LEFT JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
       WHERE tc.table_name = $1`,
      [nt]
    );
    console.log(`\nConstraints for ${nt}:`);
    fks.rows.forEach(r => {
      console.log(`  - ${r.constraint_name} [${r.constraint_type}] on ${r.column_name} -> ${r.foreign_table_name || 'N/A'}(${r.foreign_column_name || 'N/A'})`);
    });
  }

  // Check indexes on new tables
  const idxRes = await pool.query(`
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE tablename IN ('institution_company_access_requests', 'institution_company_shared_students', 'programming_languages', 'course_programming_languages')
    ORDER BY tablename, indexname
  `);
  console.log('\nIndexes on newly created tables:');
  idxRes.rows.forEach(idx => console.log(`  - ${idx.tablename}.${idx.indexname}: ${idx.indexdef}`));

  await pool.end();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
