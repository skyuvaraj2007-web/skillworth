const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'localhost',port:5432,user:'postgres',password:'#9942891197@Rudra',database:'skillnexus_db'});
  await c.connect();

  // Check constraints on users table
  const r=await c.query("SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='users'::regclass");
  console.log('USERS constraints:', JSON.stringify(r.rows, null, 2));

  // Check if email has a unique index
  const r2=await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='users'");
  console.log('\nUSERS indexes:', JSON.stringify(r2.rows, null, 2));

  await c.end();
})();
