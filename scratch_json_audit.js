const rm = require('./backend/src/db/relationalManager');
const origRead = rm._read.bind(rm);

// Patch to detect if _read is called
let jsonReadCount = 0;
rm._read = function() { jsonReadCount++; return origRead(); };

async function run() {
  // Call getStudentById and track JSON reads
  jsonReadCount = 0;
  const s = await rm.getStudentById('STU-TN010-001');
  console.log('getStudentById JSON reads:', jsonReadCount);
  
  jsonReadCount = 0;
  const p = await rm.getProjects('STU-TN010-001');
  console.log('getProjects JSON reads:', jsonReadCount, '| count:', p.length);
  
  jsonReadCount = 0;
  const e = await rm.getEnrollments('STU-TN010-001');
  console.log('getEnrollments JSON reads:', jsonReadCount, '| count:', e.length);
  
  jsonReadCount = 0;
  const apps = await rm.getApplications({ studentId: 'STU-TN010-001' });
  console.log('getApplications JSON reads:', jsonReadCount, '| count:', apps.length);
  
  jsonReadCount = 0;
  const opps = await rm.getOpportunities();
  console.log('getOpportunities JSON reads:', jsonReadCount, '| count:', opps.length);
}
run().catch(console.error);
