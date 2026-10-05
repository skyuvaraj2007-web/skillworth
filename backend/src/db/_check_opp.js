const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'localhost',port:5432,user:'postgres',password:'#9942891197@Rudra',database:'skillnexus_db'});
  await c.connect();
  for (const t of ['opportunities','projects','applications']) {
    const r=await c.query("SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='"+t+"'::regclass AND contype IN ('u','p')");
    console.log(t + ':', JSON.stringify(r.rows));
  }
  await c.end();
})();
