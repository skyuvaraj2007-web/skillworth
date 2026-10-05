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

// Read App.jsx to see valid pages
const appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const emptyHandlers = [];
const consoleHandlers = [];
const invalidActivePages = [];
const buttonsWithoutClick = [];

// Extract valid activePage cases from App.jsx
const validPages = new Set();
const switchMatches = appContent.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g);
for (const m of switchMatches) {
  validPages.add(m[1]);
}
// Also add standard pages
['home', 'skills', 'assessment', 'learning', 'learning-progress', 'enroll', 
 'advanced-tech', 'advanced-tech-deepdive', 'projects', 'opportunities', 
 'passport', 'profile', 'settings', 'notifications', 'help', 'search',
 'institution-console', 'institution-readiness', 'institution-students', 
 'institution-courses', 'institution-proofs', 'institution-company-directory', 
 'institution-company-intelligence', 'institution-company-opportunities', 
 'institution-matching', 'institution-skill-gap', 'institution-placement', 
 'institution-recruitment-drives', 'institution-analytics', 'industry-portal'
].forEach(p => validPages.add(p));

allFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');

  // Check setActivePage calls
  const apMatches = code.matchAll(/setActivePage\(['"]([^'"]+)['"]\)/g);
  for (const m of apMatches) {
    const target = m[1];
    if (!validPages.has(target)) {
      invalidActivePages.push({ file: f, target });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty handler: onClick={() => {}}
    if (line.match(/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/)) {
      emptyHandlers.push({ file: f, line: i + 1, snippet: line.trim() });
    }
    // Console log handler
    if (line.match(/onClick=\{\s*\(\)\s*=>\s*console\.log/)) {
      consoleHandlers.push({ file: f, line: i + 1, snippet: line.trim() });
    }

    // Dead href
    if (line.match(/href=["']#["']/) || line.match(/href=["']javascript:void\(0\);?["']/)) {
      emptyHandlers.push({ file: f, line: i + 1, snippet: line.trim(), type: 'dead_href' });
    }

    // Detect button tag that starts and ends without onClick/type=submit/form
    if (line.includes('<button')) {
      let fullTag = line;
      let j = i;
      while (j < lines.length - 1 && !lines[j].includes('>')) {
        j++;
        fullTag += ' ' + lines[j];
      }
      const tagContent = fullTag.substring(fullTag.indexOf('<button'), fullTag.indexOf('>') + 1);
      if (!tagContent.includes('onClick') && 
          !tagContent.includes('type="submit"') && 
          !tagContent.includes("type='submit'") && 
          !tagContent.includes('type={`submit`}') && 
          !tagContent.includes('form=') &&
          !tagContent.includes('disabled') &&
          !tagContent.includes('data-') &&
          !tagContent.includes('aria-')) {
        // Only if it doesn't look like an inert decorative badge or wrapper
        buttonsWithoutClick.push({ file: f, line: i + 1, snippet: tagContent.replace(/\s+/g, ' ').substring(0, 100) });
      }
    }
  }
});

console.log('--- INVALID setActivePage TARGETS ---');
console.log(invalidActivePages);

console.log('\n--- EMPTY HANDLERS onClick={() => {}} ---');
console.log(emptyHandlers);

console.log('\n--- CONSOLE.LOG HANDLERS ---');
console.log(consoleHandlers);

console.log('\n--- BUTTONS WITHOUT ONCLICK/SUBMIT (' + buttonsWithoutClick.length + ') ---');
buttonsWithoutClick.forEach(b => console.log(`${b.file}:${b.line} -> ${b.snippet}`));
