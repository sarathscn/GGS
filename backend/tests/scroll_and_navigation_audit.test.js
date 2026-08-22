const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Scroll Position, Header Visibility & Navigation Audit Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const scrollToTopPath = path.join(__dirname, '../../frontend/src/components/ScrollToTop.js');
  const scrollToTopCode = fs.readFileSync(scrollToTopPath, 'utf8');

  const appPath = path.join(__dirname, '../../frontend/src/App.js');
  const appCode = fs.readFileSync(appPath, 'utf8');

  const navbarPath = path.join(__dirname, '../../frontend/src/components/Navbar.js');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');

  const cssPath = path.join(__dirname, '../../frontend/src/index.css');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  const dashboardPath = path.join(__dirname, '../../frontend/src/pages/Dashboard.js');
  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

  // 1. ScrollToTop Architecture & Route Restoration
  console.log('\n--- Section 1: ScrollToTop Architecture & Route Restoration ---');
  assert(fs.existsSync(scrollToTopPath), 'ScrollToTop.js component exists');
  assert(scrollToTopCode.includes("window.scrollTo"), 'ScrollToTop resets window scroll on navigation');
  assert(scrollToTopCode.includes("top: 0"), 'ScrollToTop scrolls to top: 0');
  assert(scrollToTopCode.includes("behavior: 'instant'"), 'ScrollToTop uses instant behavior to prevent visible jumps');
  assert(scrollToTopCode.includes("navType !== 'POP'"), 'ScrollToTop preserves browser history scroll on Back/Forward (POP)');
  assert(scrollToTopCode.includes("hash"), 'ScrollToTop handles anchor hash navigation');
  assert(appCode.includes('<ScrollToTop />') || appCode.includes('<ScrollToTop/>'), 'App.js mounts ScrollToTop inside BrowserRouter');

  // 2. Dual Scrollport Elimination & CSS Architecture
  console.log('\n--- Section 2: Dual Scrollport Elimination & CSS Architecture ---');
  assert(cssCode.includes('overflow-x: clip'), 'index.css uses overflow-x: clip to prevent dual scrollport jumps');
  assert(!cssCode.includes('html, body {\n        max-width: 100%;\n        overflow-x: hidden;'), 'index.css avoids simultaneous overflow-x: hidden on html and body');
  assert(cssCode.includes('.rgb-gradient-text'), 'index.css preserves animated brand text gradient');

  // 3. Header / Navbar Visibility & Scroll Locking Safety
  console.log('\n--- Section 3: Header / Navbar Visibility & Mobile Scroll Locking ---');
  assert(navbarCode.includes('sticky top-0 z-40'), 'Navbar uses sticky top-0 positioning with high z-index');
  assert(navbarCode.includes('document.body.style.overflow = \'hidden\''), 'Navbar locks body scroll when mobile menu opens');
  assert(navbarCode.includes('document.body.style.overflow = \'\''), 'Navbar restores body scroll when mobile menu closes');
  assert(navbarCode.includes('type="button"'), 'Navbar buttons use explicit type="button" to prevent form submissions');

  // 4. Tab & Query Synchronization
  console.log('\n--- Section 4: Tab & Query Synchronization ---');
  assert(dashboardCode.includes('resolveTab'), 'Dashboard.js normalizes tab queries (settings -> profile)');
  assert(dashboardCode.includes('useEffect(') && dashboardCode.includes('setActiveTab'), 'Dashboard.js syncs activeTab with searchParams');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
