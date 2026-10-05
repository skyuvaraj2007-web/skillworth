require('dotenv').config();
const rm = require('../src/db/relationalManager');

async function main() {
  const r = await rm.pg.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'applications'::regclass");
  console.log('applications constraints:', r.rows);
  const r2 = await rm.pg.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'interviews'::regclass");
  console.log('interviews constraints:', r2.rows);
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
