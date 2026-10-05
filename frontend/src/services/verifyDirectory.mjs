import { searchColleges, getDirectoryStats, getAllDistricts, getCollegeById } from './collegeDirectory.js';

const testQueries = [
  'Anna', 'Anna University', 'PSG', 'PSG Tech', 'SRM', 'VIT',
  'Coimbatore', 'Madurai', 'Chennai', 'Engineering', 'Arts',
  'Science', 'Government', 'Technology', 'Medical'
];

console.log('=== SEARCH TESTS ===');
testQueries.forEach(q => {
  const res = searchColleges(q, 3);
  console.log(`Query: "${q}" => ${res.length} results: ${res.map(r => `${r.collegeName} [${r.collegeId}] (${r.tier})`).join(' | ')}`);
});

console.log('\n=== PRIORITY RANKING CHECKS ===');
const annaTop = searchColleges('Anna University', 1)[0];
console.log('Top match for "Anna University":', annaTop?.collegeName, '=> Correct?', annaTop?.collegeName === 'Anna University');

const psgTop = searchColleges('PSG Tech', 1)[0];
console.log('Top match for "PSG Tech":', psgTop?.collegeName, '=> Correct?', psgTop?.collegeName?.includes('PSG College of Technology'));

const srmTop = searchColleges('SRM', 1)[0];
console.log('Top match for "SRM":', srmTop?.collegeName, '=> Correct?', srmTop?.collegeName?.includes('SRM Institute of Science and Technology'));

console.log('\n=== USER REQUESTED INSTITUTIONS CHECKS ===');
const velalarEng = searchColleges('velalar college of engineering', 1)[0];
console.log('Match for "velalar college of engineering":', velalarEng?.collegeName, `[${velalarEng?.collegeId}]`);

const velalarArts = searchColleges('velalar arts', 1)[0];
console.log('Match for "velalar arts":', velalarArts?.collegeName, `[${velalarArts?.collegeId}]`);

const nandhaEng = searchColleges('nandha engineering', 1)[0];
console.log('Match for "nandha engineering":', nandhaEng?.collegeName, `[${nandhaEng?.collegeId}]`);

const nandhaArts = searchColleges('nandha arts', 1)[0];
console.log('Match for "nandha arts":', nandhaArts?.collegeName, `[${nandhaArts?.collegeId}]`);

console.log('\n=== STATS CHECK ===');
const stats = getDirectoryStats();
console.log('Total:', stats.total, 'Active:', stats.active, 'Districts Count:', stats.districtsCount);
console.log('Tiers Breakdown:', stats.tiers);
console.log('Are all 38 districts covered?', getAllDistricts().length === 38);
