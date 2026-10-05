const { spawnSync } = require('child_process');
const path = require('path');

const testFiles = [
  'test_e2e.js',
  'test_rpl_e2e.js',
  'test_phase2_multi_occupation.js',
  'test_phase3_competency_passport.js',
  'test_phase4_operations.js',
  'test_phase5_ai_intelligence.js'
];

let totalPassed = 0;
let totalFailed = 0;

console.log('====================================================');
console.log('  SKILLWORTH SUITE - EXECUTING ALL PHASE TESTS');
console.log('====================================================\n');

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  const result = spawnSync(process.execPath, [filePath], { stdio: 'inherit' });
  if (result.status === 0) {
    totalPassed++;
  } else {
    totalFailed++;
  }
}

console.log('\n====================================================');
console.log(`  OVERALL SUITE RESULTS: ${totalPassed} SUITES PASSED, ${totalFailed} FAILED`);
console.log('====================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
