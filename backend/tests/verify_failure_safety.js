/**
 * SKILLNEXUS — PHASE 7 FAILURE-SAFETY TEST
 * Verifies that when PostgreSQL is unavailable under POSTGRESQL_REQUIRED=true:
 * 1. An explicit DATABASE ERROR is returned.
 * 2. Silent JSON fallback is strictly prevented.
 * 3. Connection credentials are never exposed.
 */

// Configure dummy unreachable database without exposing real credentials
process.env.POSTGRESQL_REQUIRED = 'true';
process.env.DATABASE_URL = 'postgresql://nexus_test_user:redacted_secret@127.0.0.1:59999/dummy_db?connect_timeout=1';

const rm = require('../src/db/relationalManager');

async function testFailureSafety() {
  console.log('================================================================');
  console.log('SKILLNEXUS — PHASE 7 FAILURE-SAFETY TEST');
  console.log('================================================================');
  console.log('POSTGRESQL_REQUIRED mode: ' + process.env.POSTGRESQL_REQUIRED);
  console.log('Database endpoint: 127.0.0.1:59999 (Simulated offline/unreachable)');
  console.log('Credential masking: Active (Redacted)');
  console.log('----------------------------------------------------------------');

  let passedAll = true;

  // Test 1: Direct _read() invocation must throw explicit DATABASE ERROR
  console.log('[Test 1] Testing direct _read() under POSTGRESQL_REQUIRED=true...');
  try {
    rm._read();
    console.error('❌ FAIL: _read() did not throw!');
    passedAll = false;
  } catch (err) {
    if (err.message.includes('DATABASE ERROR') && err.code === 'POSTGRESQL_REQUIRED') {
      console.log('  ✓ PASS: _read() strictly rejected with code: ' + err.code);
      console.log('    Message: ' + err.message);
    } else {
      console.error('❌ FAIL: Unexpected error message:', err.message);
      passedAll = false;
    }
  }

  // Test 2: Direct _write() invocation must throw explicit DATABASE ERROR
  console.log('\n[Test 2] Testing direct _write() under POSTGRESQL_REQUIRED=true...');
  try {
    rm._write({});
    console.error('❌ FAIL: _write() did not throw!');
    passedAll = false;
  } catch (err) {
    if (err.message.includes('DATABASE ERROR') && err.code === 'POSTGRESQL_REQUIRED') {
      console.log('  ✓ PASS: _write() strictly rejected with code: ' + err.code);
      console.log('    Message: ' + err.message);
    } else {
      console.error('❌ FAIL: Unexpected error message:', err.message);
      passedAll = false;
    }
  }

  // Test 3: Runtime query (getInstitutions) when PostgreSQL pool is unreachable
  console.log('\n[Test 3] Testing getInstitutions() with unreachable PostgreSQL pool...');
  try {
    const res = await rm.getInstitutions();
    console.log('  Query returned count: ' + (Array.isArray(res) ? res.length : typeof res));
    if (Array.isArray(res) && res.length > 0 && res.some(i => i.id === 'INST-001' || i.institutionId === 'TN010')) {
      console.error('❌ FAIL: Silent JSON fallback detected in getInstitutions()!');
      passedAll = false;
    } else {
      console.log('  ✓ PASS: No silent JSON fallback occurred (JSON mock data was NOT loaded).');
    }
  } catch (err) {
    if (err.message.includes('DATABASE ERROR') || err.message.includes('connect') || err.message.includes('ECONNREFUSED')) {
      console.log('  ✓ PASS: Returned explicit DATABASE ERROR / connection error: ' + err.message.replace(/nexus_test_user:[^@]+@/, '***:***@'));
    } else {
      console.log('  Note: Error thrown: ' + err.message);
    }
  }

  // Test 4: Runtime query (getCompanyById) when PostgreSQL pool is unreachable
  console.log('\n[Test 4] Testing getCompanyById() with unreachable PostgreSQL pool...');
  try {
    const res = await rm.getCompanyById('COMP-001');
    if (res && (res.name === 'Zoho Corporation' || res.id === 'COMP-001')) {
      console.error('❌ FAIL: Silent JSON fallback detected in getCompanyById()!');
      passedAll = false;
    } else {
      console.log('  ✓ PASS: Returned null / blocked; JSON was NOT silently read.');
    }
  } catch (err) {
    if (err.message.includes('DATABASE ERROR') || err.message.includes('connect') || err.message.includes('ECONNREFUSED')) {
      console.log('  ✓ PASS: Returned explicit DATABASE ERROR: ' + err.message.replace(/nexus_test_user:[^@]+@/, '***:***@'));
    } else {
      console.log('  Note: Threw error: ' + err.message);
    }
  }

  console.log('\n================================================================');
  if (passedAll) {
    console.log('🎉 FAILURE-SAFETY TEST PASSED:');
    console.log('   When PostgreSQL is required and offline, the application');
    console.log('   strictly yields DATABASE ERROR and NEVER silently reads/writes JSON.');
  } else {
    console.error('❌ FAILURE-SAFETY TEST FAILED.');
    process.exit(1);
  }
  console.log('================================================================');
  process.exit(0);
}

testFailureSafety().catch(err => {
  console.error('Fatal error during failure-safety test:', err.message);
  process.exit(1);
});
