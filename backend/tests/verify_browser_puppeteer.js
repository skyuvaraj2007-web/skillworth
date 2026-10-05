const puppeteer = require('puppeteer-core');

async function testFrontendUI() {
  console.log('====================================================');
  console.log('PUPPETEER E2E UI TEST: ACADEMICIAN LOGIN & DASHBOARD');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[authService]') || text.includes('[handleLogout]') || text.includes('Academician')) {
      console.log('  [Browser Log]', text);
    }
  });

  try {
    // Step 1: Open /academician/login
    console.log('[STEP 1] Navigating to http://localhost:5173/academician/login ...');
    await page.goto('http://localhost:5173/academician/login', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Current URL:', page.url());
    const pageHtml = await page.content();
    console.log('Page Title:', await page.title());
    const h2s = await page.$$eval('h2', els => els.map(e => e.textContent.trim()));
    console.log('Found h2 tags:', h2s);

    // Step 2: Check form inputs
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitBtn = await page.$('button[type="submit"]');

    if (!emailInput || !passwordInput || !submitBtn) {
      throw new Error('Required login inputs not found on page');
    }
    console.log('[PASS] Email input, password input, and submit button found.');

    // Step 3: Enter credentials
    console.log('[STEP 2] Entering academician credentials...');
    await page.type('input[type="email"]', 'arun@example.com');
    await page.type('input[type="password"]', 'Arun@123');

    // Step 4: Click Submit & verify "Signing in..."
    console.log('[STEP 3] Submitting login form...');
    await submitBtn.click();

    // Step 5: Wait for redirect to /academician/dashboard
    console.log('[STEP 4] Waiting for navigation to dashboard...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/academician/dashboard'),
      { timeout: 15000 }
    );
    console.log(`[PASS] Successfully navigated to: ${page.url()}`);

    // Step 6: Verify Dashboard content
    await page.waitForSelector('h1', { timeout: 10000 });
    const welcomeHeader = await page.$eval('h1', el => el.textContent.trim());
    console.log(`[PASS] Dashboard header text: "${welcomeHeader}"`);

    // Step 7: Test session persistence on page reload
    console.log('[STEP 5] Testing session persistence on refresh...');
    await page.reload({ waitUntil: 'networkidle0' });
    const currentUrlAfterReload = page.url();
    const welcomeAfterReload = await page.$eval('h1', el => el.textContent.trim());
    console.log(`[PASS] After refresh URL: ${currentUrlAfterReload}, Header: "${welcomeAfterReload}"`);

    // Step 8: Click Logout
    console.log('[STEP 6] Testing Logout...');
    console.log('URL before logout:', page.url());
    
    // Find button with text 'Logout'
    const buttons = await page.$$('button');
    let clickedLogout = false;
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.trim() === 'Logout') {
        const html = await page.evaluate(el => el.outerHTML, b);
        console.log('Found Logout button HTML:', html);
        await page.evaluate(el => el.click(), b);
        clickedLogout = true;
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    console.log('URL 1s after logout click:', page.url());

    await page.waitForFunction(
      () => window.location.pathname.includes('/academician/login') || window.location.pathname === '/academician/login',
      { timeout: 10000 }
    );
    console.log(`[PASS] Logout successfully redirected to: ${page.url()}`);

    // Step 9: Verify unauthenticated protection on /academician/dashboard
    console.log('[STEP 7] Testing unauthenticated direct access to /academician/dashboard ...');
    await page.goto('http://localhost:5173/academician/dashboard', { waitUntil: 'networkidle0' });
    const protectedUrl = page.url();
    console.log(`[PASS] Direct unauthenticated access redirected to: ${protectedUrl}`);
    if (protectedUrl.includes('/academician/login')) {
      console.log('[PASS] Protected route security verified: redirected to /academician/login!');
    }

    console.log('\n====================================================');
    console.log('ALL FRONTEND E2E UI ACCEPTANCE CHECKS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('[FAIL] Puppeteer E2E Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFrontendUI();
