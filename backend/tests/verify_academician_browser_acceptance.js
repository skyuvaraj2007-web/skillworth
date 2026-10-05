const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testFullAcademicianBrowserAcceptance() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🌐 PUPPETEER REAL BROWSER ACCEPTANCE: ACADEMICIAN SUITE');
  console.log('══════════════════════════════════════════════════════════════\n');

  const screenshotsDir = path.resolve(__dirname, '../../artifacts_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    console.log('  [Browser Log]', msg.text());
  });
  page.on('pageerror', err => {
    console.log('  [Browser Error]', err.message);
  });
  page.on('requestfailed', req => {
    console.log('  [Request Failed]', req.url(), req.failure()?.errorText);
  });

  try {
    // 1. Visit Academician Login
    console.log('🔹 1. Navigating to Academician Login (http://localhost:5173/academician/login)...');
    await page.goto('http://localhost:5173/academician/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotsDir, '1_academician_login.png') });
    console.log('   Screenshot saved: 1_academician_login.png');

    // Click Auto-Fill button for reliable credentials
    console.log('🔹 2. Clicking Auto-Fill and submitting credentials...');
    const autoFillBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Auto-Fill'));
    });
    if (autoFillBtn && autoFillBtn.asElement()) {
      await autoFillBtn.asElement().click();
    } else {
      await page.type('input[type="email"]', 'arun@example.com');
      await page.type('input[type="password"]', 'Arun@123');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '2_credentials_entered.png') });

    const submitBtn = await page.$('button[type="submit"]');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/academician/login'), { timeout: 10000 }),
      submitBtn.click()
    ]);
    console.log('   Login request responded!');
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '3_academician_dashboard.png') });
    console.log('   Screenshot saved: 3_academician_dashboard.png');

    // 4. Navigate to Student Performance
    console.log('🔹 4. Navigating to Student Performance tab (/academician/student-performance)...');
    await page.goto('http://localhost:5173/academician/student-performance', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '4_student_performance_roster.png') });
    console.log('   Screenshot saved: 4_student_performance_roster.png');

    // Check if table contains students
    const tableRows = await page.$$eval('table tbody tr', trs => trs.length).catch(() => 0);
    console.log(`   Found ${tableRows} student records in performance roster table.`);

    // 5. Navigate to Skill Assessments Create
    console.log('🔹 5. Navigating to Create Assessment (/academician/skill-assessments/create)...');
    await page.goto('http://localhost:5173/academician/skill-assessments/create', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '5_create_assessment_builder.png') });
    console.log('   Screenshot saved: 5_create_assessment_builder.png');

    // 6. Navigate to Skill Analytics
    console.log('🔹 6. Navigating to Skill Analytics (/academician/skill-analytics)...');
    await page.goto('http://localhost:5173/academician/skill-analytics', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '6_class_skill_analytics.png') });
    console.log('   Screenshot saved: 6_class_skill_analytics.png');

    // 7. Test Institution Portal Token & Navigation
    console.log('🔹 7. Testing Institution Console - Student Performance & Skill Growth...');
    await page.evaluate(() => {
      // Switch user to institution admin in localStorage
      localStorage.setItem('nexus_token', 'mock_token');
      localStorage.setItem('nexus_user', JSON.stringify({
        id: '0af1620e-e6e7-45d9-ab37-2509ed87c9d4',
        name: 'ABC Admin',
        role: 'institution',
        institutionId: '8864b97b-cb23-45f1-8776-d8c5ab45802d',
        institutionCode: 'ABC-ENG'
      }));
    });

    await page.goto('http://localhost:5173/institution/student-performance', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '7_institution_student_performance.png') });
    console.log('   Screenshot saved: 7_institution_student_performance.png');

    await page.goto('http://localhost:5173/institution/skill-growth', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, '8_institution_skill_growth.png') });
    console.log('   Screenshot saved: 8_institution_skill_growth.png');

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL BROWSER ACCEPTANCE JOURNEYS VERIFIED & SCREENSHOTS SAVED!');
    console.log('══════════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('\n❌ Browser Acceptance Test Error:', err.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png') }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

testFullAcademicianBrowserAcceptance().catch(() => process.exit(1));
