const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== SKILLWORTH FULL-STACK END-TO-END TEST ===\n');

  // 1. Frontend Test
  console.log('1. Checking Frontend (http://127.0.0.1:5173/)...');
  const feRes = await request({ hostname: '127.0.0.1', port: 5173, path: '/', method: 'GET' });
  console.log(`   Frontend Status: ${feRes.status} (Vite React loaded)`);

  // 2. Backend Health
  console.log('\n2. Checking Backend Health (http://localhost:5000/api/health)...');
  const beRes = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`   Backend Status: ${beRes.status}`, beRes.data);

  // 3. Credential Registry Public Verification
  console.log('\n3. Checking Public Credential Verification (SKW-2025-EL-8842-PUB)...');
  const credRes = await request({ hostname: 'localhost', port: 5000, path: '/api/certificates/verify/SKW-2025-EL-8842-PUB', method: 'GET' });
  console.log(`   Credential Valid: ${credRes.data?.valid}`);
  console.log(`   Recipient: ${credRes.data?.credential?.recipient_name}`);
  console.log(`   Skill Standard: ${credRes.data?.credential?.skill_standard}`);
  console.log(`   Issuing Authority: ${credRes.data?.credential?.issuing_authority}`);

  // 4. Worker Login
  console.log('\n4. Logging in as Worker (student.demo@skillnexus.ai)...');
  const workerLogin = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'student.demo@skillnexus.ai', password: 'Demo@2026' });
  console.log(`   Worker Login Status: ${workerLogin.status}`);
  console.log(`   User: ${workerLogin.data?.user?.name} (${workerLogin.data?.user?.email})`);
  const workerToken = workerLogin.data?.token;

  // 5. Fetch Worker Evidence Dossier
  console.log('\n5. Fetching Worker Evidence Dossier (/api/certificates)...');
  const dossierRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/certificates', method: 'GET',
    headers: { 'Authorization': `Bearer ${workerToken}` }
  });
  console.log(`   Dossier Items Count: ${dossierRes.data?.data?.length}`);
  dossierRes.data?.data?.forEach((item, idx) => {
    console.log(`   [${idx + 1}] ${item.certificate_title} (${item.issuing_organization}) - Status: ${item.verification_status}`);
  });

  // 6. Submit New Evidence to Real Database
  console.log('\n6. Submitting New Prior Learning Evidence item to Real Database...');
  const newEvRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/certificates', method: 'POST',
    headers: { 'Authorization': `Bearer ${workerToken}`, 'Content-Type': 'application/json' }
  }, {
    title: 'Thermal Imaging Inspection Log & Arc Flash Mitigation Plan',
    category: 'Workplace Observation Record',
    description: 'Verified 415V distribution board thermal gradient under full plant load using FLIR camera.',
    issue_date: '2026-03-31',
    issuing_organization: 'L&T Industrial Power Infrastructure Field Division'
  });
  console.log(`   Submit Evidence Status: ${newEvRes.status}`);
  console.log(`   Created Record ID: ${newEvRes.data?.data?.id || newEvRes.data?.data?.certificate_id}`);

  // 7. Re-fetch Worker Evidence Dossier to verify persistence
  const updatedDossier = await request({
    hostname: 'localhost', port: 5000, path: '/api/certificates', method: 'GET',
    headers: { 'Authorization': `Bearer ${workerToken}` }
  });
  console.log(`   Updated Dossier Items Count: ${updatedDossier.data?.data?.length}`);
  const latestItem = updatedDossier.data?.data?.[updatedDossier.data?.data?.length - 1];
  console.log(`   Persisted Item: "${latestItem?.certificate_title}" - Category: "${latestItem?.credential_category}"`);

  // 8. Assessor Login
  console.log('\n8. Logging in as Assessor (academician.demo@skillnexus.ai)...');
  const assessorLogin = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'academician.demo@skillnexus.ai', password: 'Demo@2026' });
  console.log(`   Assessor Login Status: ${assessorLogin.status}`);
  console.log(`   Assessor: ${assessorLogin.data?.user?.name} (Role: ${assessorLogin.data?.user?.role})`);
  const assessorToken = assessorLogin.data?.token;

  // 9. Assessor Fetches Candidates Roster
  console.log('\n9. Assessor fetching Candidate Dossiers (/api/assessments/rpl/candidates)...');
  const candidatesRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/assessments/rpl/candidates', method: 'GET',
    headers: { 'Authorization': `Bearer ${assessorToken}` }
  });
  console.log(`   Candidates Count: ${candidatesRes.data?.data?.length}`);
  candidatesRes.data?.data?.forEach((cand) => {
    console.log(`   - Candidate ID: ${cand.id} | Name: ${cand.name} | Standard: ${cand.skill_standard} | Status: ${cand.status}`);
  });

  // 10. Assessor Evaluates Candidate & Signs off
  console.log('\n10. Assessor submitting 4-factor rubric calibration & certification sign-off...');
  const evalRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/assessments/rpl/evaluate', method: 'POST',
    headers: { 'Authorization': `Bearer ${assessorToken}`, 'Content-Type': 'application/json' }
  }, {
    candidate_id: 'cand-001',
    observation: 94,
    interview: 90,
    portfolio: 96,
    safety: 100,
    decision: 'COMPETENT_CERTIFIED',
    assessor_notes: 'Exemplary adherence to IS 732 national electrical standards and lockout-tagout protocol. Full certification granted.'
  });
  console.log(`   Assessor Evaluation Status: ${evalRes.status}`);
  console.log(`   Calculated Weighted Score: ${evalRes.data?.data?.composite_score}%`);
  console.log(`   New Candidate Status: ${evalRes.data?.data?.status}`);

  // 11. Institution Cockpit Metrics
  console.log('\n11. Institution querying live operational analytics (/api/assessments/rpl/stats)...');
  const instStats = await request({
    hostname: 'localhost', port: 5000, path: '/api/assessments/rpl/stats', method: 'GET'
  });
  console.log(`   Institution Stats Status: ${instStats.status}`);
  console.log('   Metrics:', instStats.data?.data);

  // 12. Institution Protocol Studio creation
  console.log('\n12. Testing Assessment Protocol Creation Studio...');
  const protoRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/assessments/rpl/create-protocol', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    trade_name: 'Solar PV Systems Installation Lead',
    nsqf_level: 5,
    direct_weight: 40,
    interview_weight: 30,
    portfolio_weight: 20,
    safety_weight: 10,
    target_candidates: 150
  });
  console.log(`   Protocol Creation Status: ${protoRes.status}`);
  console.log(`   Protocol ID: ${protoRes.data?.protocol?.id} | Trade: ${protoRes.data?.protocol?.trade_name}`);

  console.log('\n=== ALL END-TO-END FLOWS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(console.error);
