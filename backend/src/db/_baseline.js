// Phase 2.2.1 — Pre-fix baseline: record current row counts + inspect constraints for affected tables
const { Client } = require('pg');
(async () => {
  const c = new Client({host:'localhost',port:5432,user:'postgres',password:'#9942891197@Rudra',database:'skillnexus_db'});
  await c.connect();

  // 1. Current row counts for ALL tables
  const tablesRes = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
  console.log('=== CURRENT ROW COUNTS (BASELINE) ===\n');
  const counts = {};
  for (const row of tablesRes.rows) {
    const r = await c.query('SELECT COUNT(*) FROM "' + row.table_name + '"');
    counts[row.table_name] = parseInt(r.rows[0].count, 10);
    console.log(row.table_name + ': ' + counts[row.table_name]);
  }

  // 2. Inspect constraints and unique indexes for the 8 affected tables
  const affectedTables = [
    'assessment_questions', 'question_options', 'assessment_attempts',
    'application_stage_history', 'course_modules', 'notifications',
    'project_proofs', 'skill_evidence'
  ];

  console.log('\n=== CONSTRAINTS & INDEXES FOR AFFECTED TABLES ===\n');
  for (const t of affectedTables) {
    console.log('--- ' + t + ' ---');
    // Constraints
    try {
      const cr = await c.query("SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='" + t + "'::regclass ORDER BY contype");
      for (const row of cr.rows) {
        console.log('  CONSTRAINT: ' + row.conname + ' [' + row.contype + '] ' + row.def);
      }
    } catch(e) { console.log('  (no constraints or table missing)'); }
    // Indexes
    try {
      const ir = await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='" + t + "'");
      for (const row of ir.rows) {
        console.log('  INDEX: ' + row.indexname + ' -> ' + row.indexdef);
      }
    } catch(e) {}
    // Columns
    try {
      const colr = await c.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='" + t + "' ORDER BY ordinal_position");
      console.log('  COLUMNS:');
      for (const row of colr.rows) {
        console.log('    ' + row.column_name + ' ' + row.data_type + (row.is_nullable === 'NO' ? ' NOT NULL' : '') + (row.column_default ? ' DEFAULT ' + row.column_default : ''));
      }
    } catch(e) {}
    console.log('');
  }

  await c.end();
  const fs = require('fs');
  fs.writeFileSync(require('path').resolve('backend', 'baseline_counts.json'), JSON.stringify(counts, null, 2));
  console.log('\nBaseline saved to backend/baseline_counts.json');
})();
