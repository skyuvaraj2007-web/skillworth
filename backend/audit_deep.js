const fs = require('fs');
const path = require('path');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDir(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = scanDir('frontend/src');

console.log('=== 1. INSTITUTION COMPONENT NAVIGATION AUDIT ===');
const instFiles = allFiles.filter(f => f.includes('institution'));
instFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const matches = [...code.matchAll(/setActivePage\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  if (matches.length > 0) {
    console.log(path.basename(f), '->', matches);
  }
});

console.log('\n=== 2. COMPANY COMPONENT NAVIGATION AUDIT ===');
const compFiles = allFiles.filter(f => f.includes('company'));
compFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const matches = [...code.matchAll(/onTabSelect\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  if (matches.length > 0) {
    console.log(path.basename(f), 'onTabSelect ->', matches);
  }
  const apMatches = [...code.matchAll(/setActivePage\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  if (apMatches.length > 0) {
    console.log(path.basename(f), 'setActivePage ->', apMatches);
  }
});

console.log('\n=== 3. STUDENT PAGES NAVIGATION AUDIT ===');
const studentFiles = allFiles.filter(f => f.includes('pages') && !f.includes('Institution') && !f.includes('Industry'));
studentFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const matches = [...code.matchAll(/setActivePage\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  if (matches.length > 0) {
    console.log(path.basename(f), '->', matches);
  }
});

console.log('\n=== 4. SEARCH & FILTER AUDIT ===');
allFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (code.includes('search') || code.includes('Search') || code.includes('filter') || code.includes('Filter')) {
    // Check if any search input has no onChange
    const lines = code.split('\n');
    lines.forEach((l, idx) => {
      if ((l.includes('<input') && (l.includes('search') || l.includes('Search') || l.includes('placeholder="Search') || l.includes("placeholder='Search"))) && !l.includes('onChange')) {
        let full = l;
        let j = idx;
        while (j < lines.length - 1 && !lines[j].includes('>')) {
          j++;
          full += ' ' + lines[j];
        }
        if (!full.includes('onChange') && !full.includes('readOnly') && !full.includes('disabled')) {
          console.log(`Potential dead search input: ${path.basename(f)}:${idx+1} -> ${l.trim()}`);
        }
      }
    });
  }
});

console.log('\n=== 5. MODAL CLOSE BUTTON AUDIT ===');
allFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (code.includes('Modal') || code.includes('Dialog') || code.includes('modal') || code.includes('dialog')) {
    const lines = code.split('\n');
    lines.forEach((l, idx) => {
      if ((l.includes('<button') && (l.includes('Close') || l.includes('Cancel') || l.includes('<X ') || l.includes('<X/>'))) && !l.includes('onClick')) {
        let full = l;
        let j = idx;
        while (j < lines.length - 1 && !lines[j].includes('>')) {
          j++;
          full += ' ' + lines[j];
        }
        if (!full.includes('onClick')) {
          console.log(`Potential dead modal close button: ${path.basename(f)}:${idx+1} -> ${l.trim()}`);
        }
      }
    });
  }
});

console.log('\n=== AUDIT RUN COMPLETED ===');
