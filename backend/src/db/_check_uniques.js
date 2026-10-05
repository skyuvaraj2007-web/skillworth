const { Client } = require('pg');
(async () => {
  const c = new Client({host:'localhost',port:5432,user:'postgres',password:'#9942891197@Rudra',database:'skillnexus_db'});
  await c.connect();
  const tables = ['assessment_questions', 'question_options', 'assessment_attempts', 'application_stage_history', 'course_modules'];
  for (const t of tables) {
    console.log('--- ' + t + ' ---');
    const cr = await c.query("SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='" + t + "'::regclass AND contype IN ('u','p') ORDER BY contype");
    for (const row of cr.rows) console.log('  ' + row.contype + ': ' + row.conname + ' = ' + row.def);
    const ir = await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='" + t + "' AND indexdef LIKE '%UNIQUE%'");
    for (const row of ir.rows) console.log('  UNIQUE IDX: ' + row.indexname + ' -> ' + row.indexdef);
    const colr = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='" + t + "' ORDER BY ordinal_position");
    console.log('  COLUMNS: ' + colr.rows.map(r => r.column_name).join(', '));
    console.log('');
  }
  await c.end();
})();
