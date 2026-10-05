require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const rm = require('../src/db/relationalManager');

async function main() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('📊 SKILL NEXUS AI — POSTGRESQL 18.6 COMPLETE DATABASE FORENSIC AUDIT');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // 1. Table inventory
  const tablesRes = await rm.pg.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const tables = tablesRes.rows.map(r => r.table_name);

  let populatedTables = [];
  let emptyTables = [];
  let tableCounts = {};

  for (const t of tables) {
    const countRes = await rm.pg.query(`SELECT count(*) as count FROM ${t}`);
    const c = parseInt(countRes.rows[0].count, 10);
    tableCounts[t] = c;
    if (c > 0) populatedTables.push({ table: t, count: c });
    else emptyTables.push(t);
  }

  console.log(`Total Tables: ${tables.length}`);
  console.log(`Populated Tables: ${populatedTables.length}`);
  console.log(`Empty Tables: ${emptyTables.length}\n`);

  console.log('=== Populated Tables ===');
  console.table(populatedTables);

  console.log('\n=== Empty Tables ===');
  console.log(emptyTables);

  // 2. FK Count
  const fkRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
  `);
  console.log(`\nForeign Key Constraints Count: ${fkRes.rows[0].count}`);

  // 3. Unique constraints count
  const uqRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'
  `);
  console.log(`Unique Constraints Count: ${uqRes.rows[0].count}`);

  // 4. Duplicate emails in users
  const dupEmails = await rm.pg.query(`
    SELECT email, count(*) as count 
    FROM users 
    GROUP BY email 
    HAVING count(*) > 1
  `);
  console.log(`Duplicate Emails in users: ${dupEmails.rows.length}`);

  // 5. Duplicate applications (student_id, opportunity_id)
  const dupApps = await rm.pg.query(`
    SELECT student_id, opportunity_id, count(*) as count 
    FROM applications 
    GROUP BY student_id, opportunity_id 
    HAVING count(*) > 1
  `);
  console.log(`Duplicate Applications: ${dupApps.rows.length}`);

  // 6. Duplicate module progress (enrollment_id, module_id)
  const dupProgress = await rm.pg.query(`
    SELECT enrollment_id, module_id, count(*) as count 
    FROM student_module_progress 
    GROUP BY enrollment_id, module_id 
    HAVING count(*) > 1
  `);
  console.log(`Duplicate Module Progress: ${dupProgress.rows.length}`);

  // 7. Orphan students without user
  const orphanStudents = await rm.pg.query(`
    SELECT s.id 
    FROM students s 
    LEFT JOIN users u ON u.id = s.user_id 
    WHERE u.id IS NULL
  `);
  console.log(`Orphan Students (no user): ${orphanStudents.rows.length}`);

  // 8. Orphan applications without student
  const orphanApps = await rm.pg.query(`
    SELECT a.id 
    FROM applications a 
    LEFT JOIN students s ON s.id = a.student_id 
    WHERE s.id IS NULL
  `);
  console.log(`Orphan Applications: ${orphanApps.rows.length}`);

  // 9. Interviews table rows
  const interviewsRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM interviews
  `);
  console.log(`Interviews in PostgreSQL: ${interviewsRes.rows[0].count}`);

  // 10. Student module progress rows
  const progressRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM student_module_progress
  `);
  console.log(`Student Module Progress rows in PostgreSQL: ${progressRes.rows[0].count}`);

  // 11. Application stage history rows
  const historyRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM application_stage_history
  `);
  console.log(`Application Stage History rows in PostgreSQL: ${historyRes.rows[0].count}`);

  // 12. Notifications rows
  const notifRes = await rm.pg.query(`
    SELECT count(*) as count 
    FROM notifications
  `);
  console.log(`Notifications in PostgreSQL: ${notifRes.rows[0].count}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Audit error:', err);
  process.exit(1);
});
