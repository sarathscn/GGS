const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Profile Sidebar, Auth, Branding & Scroll Fix Verification Suite...\n');
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

  const navbarPath = path.join(__dirname, '../../frontend/src/components/Navbar.js');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');

  const loginPath = path.join(__dirname, '../../frontend/src/pages/Login.js');
  const loginCode = fs.readFileSync(loginPath, 'utf8');

  const logoPath = path.join(__dirname, '../../frontend/src/components/Logo.js');
  const logoCode = fs.readFileSync(logoPath, 'utf8');

  const cssPath = path.join(__dirname, '../../frontend/src/index.css');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  // 1. User Privacy & Demo Credentials Removal
  console.log('\n--- Section 1: User Privacy & Demo Credentials Removal ---');
  assert(!navbarCode.includes('user.email'), 'Navbar.js does NOT display user.email anywhere');
  assert(!navbarCode.includes('user.phone'), 'Navbar.js does NOT display user.phone in profile summaries');
  assert(!loginCode.includes('Demo Credentials'), 'Login.js does NOT contain Demo Credentials');
  assert(!loginCode.includes('admin123'), 'Login.js does NOT contain admin123 hardcoded demo password');
  assert(!loginCode.includes('user123'), 'Login.js does NOT contain user123 hardcoded demo password');

  // 2. Desktop Compact Profile Dropdown
  console.log('\n--- Section 2: Desktop Compact Profile Dropdown ---');
  assert(navbarCode.includes('DropdownMenuContent'), 'Desktop uses compact DropdownMenuContent');
  assert(navbarCode.includes('data-testid="user-menu-trigger"'), 'Desktop includes user profile trigger button');
  assert(navbarCode.includes('data-testid="dropdown-profile-link"'), 'Desktop dropdown contains Profile link');
  assert(navbarCode.includes('data-testid="dropdown-dashboard-link"'), 'Desktop dropdown contains Dashboard link');
  assert(navbarCode.includes('data-testid="dropdown-wishlist-link"'), 'Desktop dropdown contains Wishlist link');
  assert(navbarCode.includes('data-testid="dropdown-messages-link"'), 'Desktop dropdown contains Messages link');
  assert(navbarCode.includes('data-testid="dropdown-settings-link"'), 'Desktop dropdown contains Settings link');
  assert(navbarCode.includes('data-testid="dropdown-admin-link"'), 'Desktop dropdown contains Admin Panel link');
  assert(navbarCode.includes('data-testid="dropdown-logout-btn"'), 'Desktop dropdown contains Logout button');
  assert(navbarCode.includes('{isAdmin && ('), 'Admin panel in dropdown is strictly guarded by isAdmin');

  // 3. React Portal Architecture & 100% Opaque Surface
  console.log('\n--- Section 3: Portal Stacking Context & Opaque Surfaces ---');
  assert(navbarCode.includes('createPortal('), 'Mobile sidebar is mounted directly to document.body via React Portal');
  assert(navbarCode.includes('bg-background text-foreground'), 'Sidebar panel uses 100% solid opaque background token');
  assert(!navbarCode.includes('bg-background/98'), 'Sidebar does not use translucent alpha background modifiers');
  assert(navbarCode.includes('z-[1010]'), 'Sidebar drawer uses z-[1010] independent stacking context');
  assert(navbarCode.includes('z-[1000]'), 'Backdrop overlay uses z-[1000] layer');
  assert(navbarCode.includes('bg-black/65'), 'Backdrop overlay is separate semi-transparent element');
  assert(navbarCode.includes("e.key === 'Escape'"), 'Sidebar listens to Escape key for accessibility');

  // 4. Mobile Slide-In Sidebar Drawer Structure
  console.log('\n--- Section 4: Mobile Slide-In Sidebar Drawer Structure ---');
  assert(navbarCode.includes('data-testid="mobile-sidebar"'), 'Mobile navigation implements slide-in sidebar drawer');
  assert(navbarCode.includes('translate-x-full'), 'Sidebar translates outside viewport when closed');
  assert(navbarCode.includes('translate-x-0'), 'Sidebar translates to 0 when open');
  assert(navbarCode.includes('data-testid="sidebar-close-btn"'), 'Sidebar includes dedicated close button');
  assert(navbarCode.includes('data-testid="sidebar-sell-btn"'), 'Sidebar includes prominent Sell button');
  assert(navbarCode.includes('data-testid="mobile-marketplace-link"'), 'Sidebar includes Marketplace link');
  assert(navbarCode.includes('data-testid="mobile-categories-link"'), 'Sidebar includes Categories link');
  assert(navbarCode.includes('data-testid="mobile-blog-link"'), 'Sidebar includes Blog link');
  assert(navbarCode.includes('data-testid="mobile-messages-link"'), 'Sidebar includes Messages link');
  assert(navbarCode.includes('data-testid="mobile-profile-link"'), 'Sidebar includes Profile & Settings link');
  assert(navbarCode.includes('data-testid="mobile-dashboard-link"'), 'Sidebar includes Dashboard link');
  assert(navbarCode.includes('data-testid="mobile-wishlist-link"'), 'Sidebar includes Wishlist link');
  assert(navbarCode.includes('data-testid="mobile-admin-link"'), 'Sidebar includes Admin Panel link');
  assert(navbarCode.includes('data-testid="mobile-logout-btn"'), 'Sidebar includes Logout button');
  assert(navbarCode.includes('Trust & Support'), 'Trust & Support section is unconditionally present');
  assert(navbarCode.includes('/page/safety'), 'Trust & Support contains Marketplace Safety link');
  assert(navbarCode.includes('/page/terms'), 'Trust & Support contains Terms & Conditions link');
  assert(navbarCode.includes('/page/refund-policy'), 'Trust & Support contains Refund Policy link');
  assert(navbarCode.includes('/page/contact'), 'Trust & Support contains Contact Support link');

  // 5. Auth Buttons & Button Form Safety
  console.log('\n--- Section 5: Auth Buttons Theme & Form Type Safety ---');
  assert(navbarCode.includes('data-testid="mobile-login-btn"') && navbarCode.includes('variant="outline"'), 'Mobile Login button uses outline secondary theme styling');
  assert(navbarCode.includes('data-testid="mobile-signup-btn"') && navbarCode.includes('bg-violet-600'), 'Mobile Sign Up button uses violet primary CTA styling');
  assert(navbarCode.includes('data-testid="login-link"') && navbarCode.includes('variant="outline"'), 'Desktop Login button uses outline secondary theme styling');
  assert(navbarCode.includes('data-testid="signup-link"') && navbarCode.includes('bg-violet-600'), 'Desktop Sign Up button uses violet primary CTA styling');
  assert(navbarCode.includes('type="button"'), 'Navbar buttons explicitly use type="button" to prevent form submissions');

  // 6. GGS Brand Title RGB Gradient Animation
  console.log('\n--- Section 6: GGS Brand Title RGB Gradient Animation ---');
  assert(logoCode.includes('rgb-gradient-text'), 'Logo.js applies rgb-gradient-text class to GAME GEAR SWAP');
  assert(cssCode.includes('.rgb-gradient-text'), 'index.css defines .rgb-gradient-text utility');
  assert(cssCode.includes('@keyframes rgbGradient'), 'index.css defines rgbGradient keyframe animation');
  assert(cssCode.includes('prefers-reduced-motion: reduce'), 'index.css respects prefers-reduced-motion');
  assert(cssCode.includes('overflow-x: clip'), 'index.css uses overflow-x: clip to prevent dual scrollport jumps');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
