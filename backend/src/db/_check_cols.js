const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'localhost',port:5432,user:'postgres',password:'#9942891197@Rudra',database:'skillnexus_db'});
  await c.connect();
  const r = await c.query("SELECT 1");
  await c.end();
})();
