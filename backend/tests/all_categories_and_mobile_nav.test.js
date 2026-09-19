const http = require('http');
const fs = require('fs');
const path = require('path');

async function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8000${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runValidation() {
  console.log('=== ALL CATEGORIES FEATURED CAROUSEL & MOBILE NAVIGATION TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log('✅ [PASS]', message);
      passed++;
    } else {
      console.error('❌ [FAIL]', message);
    }
  }

  // 1. API: Featured listings across all categories
  console.log('--- 1. API & Featured Posts Data Verification ---');
  const featuredRes = await get('/api/listings?featured=true');
  assert(featuredRes.status === 200, 'GET /api/listings?featured=true returned status 200');
  assert(Array.isArray(featuredRes.body), 'Response is an array');
  assert(featuredRes.body.length > 0, `Found ${featuredRes.body.length} featured listings in the marketplace`);
  
  const allActiveAndFeatured = featuredRes.body.every(l => l.featured === true && l.status === 'active');
  assert(allActiveAndFeatured, 'All returned items have featured=true and status=active');

  // Check multi-category distribution in global featured listings
  const categoryIds = new Set(featuredRes.body.map(l => l.category_id));
  assert(categoryIds.size >= 2, `Global featured listings span multiple categories (${categoryIds.size} distinct categories)`);

  // 2. Categories.js Page Structure Verification
  console.log('\n--- 2. All Categories Page Structure (Categories.js) ---');
  const categoriesJsPath = path.join(__dirname, '../../frontend/src/pages/Categories.js');
  const categoriesJsContent = fs.readFileSync(categoriesJsPath, 'utf8');

  // Ensure Category cards grid remains intact
  assert(categoriesJsContent.includes('All Categories'), 'Header contains "All Categories"');
  assert(categoriesJsContent.includes('Browse gaming gear by category'), 'Header contains "Browse gaming gear by category"');
  assert(categoriesJsContent.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'), 'Existing category cards grid structure is preserved');
  assert(categoriesJsContent.includes('categoryImages'), 'Category images preserved');
  assert(categoriesJsContent.includes('Browse Listings'), 'Browse Listings links preserved');

  // Ensure Featured Posts section is BELOW the category grid
  const gridIndex = categoriesJsContent.indexOf('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6');
  const featuredIndex = categoriesJsContent.indexOf('Featured Posts');
  assert(featuredIndex > gridIndex, 'Featured Posts section appears strictly BELOW the complete category grid');

  // Check Featured Posts header & props
  assert(categoriesJsContent.includes('title="Featured Posts"'), 'FeaturedCarousel received title="Featured Posts"');
  assert(categoriesJsContent.includes('subtitle="Discover highlighted gaming gear from trusted sellers"'), 'FeaturedCarousel received requested subtitle');
  assert(categoriesJsContent.includes('desktopCount={3}'), 'FeaturedCarousel configured with desktopCount={3}');
  assert(categoriesJsContent.includes('api.get(\'/listings?featured=true\')'), 'Fetches from live listing endpoint with ?featured=true');
  assert(categoriesJsContent.includes('item.featured === true && item.status === \'active\''), 'Filters only active featured listings');
  assert(categoriesJsContent.includes('featuredListings.length > 0 &&'), 'Hides Featured Posts section if 0 featured listings');

  // 3. Carousel Component Configuration (FeaturedCarousel.js)
  console.log('\n--- 3. Featured Carousel Responsive Logic ---');
  const carouselJsPath = path.join(__dirname, '../../frontend/src/components/FeaturedCarousel.js');
  const carouselJsContent = fs.readFileSync(carouselJsPath, 'utf8');

  assert(carouselJsContent.includes('desktopCount = 3'), 'Default/configurable desktopCount is 3');
  assert(carouselJsContent.includes('w < 640) setVisibleCount(1)'), 'Mobile (<640px) shows 1 card');
  assert(carouselJsContent.includes('w < 1024) setVisibleCount(2)'), 'Tablet (<1024px) shows 2 cards');
  assert(carouselJsContent.includes('setVisibleCount(desktopCount)'), 'Desktop shows desktopCount (3 cards)');
  assert(carouselJsContent.includes('handleTouchStart') && carouselJsContent.includes('handleTouchEnd'), 'Touch swipe gesture handling present for mobile');
  assert(carouselJsContent.includes('prefersReducedMotion'), 'prefers-reduced-motion accessibility supported');
  assert(carouselJsContent.includes('handleNext') && carouselJsContent.includes('handlePrev'), 'Previous and Next navigation buttons present');
  assert(carouselJsContent.includes('activeDotIndex'), 'Pagination indicators present');

  // 4. Compact Card Pricing vs Detail Page Verification
  console.log('\n--- 4. Compact Card vs Post Detail Pricing Rules ---');
  const productCardJsPath = path.join(__dirname, '../../frontend/src/components/ProductCard.js');
  const productCardContent = fs.readFileSync(productCardJsPath, 'utf8');

  // In ProductCard.js, there must NOT be a secondary "Negotiable" badge next to numerical amount
  const cardHasNegotiableBadge = /price_type === ['"]negotiable['"].*?Negotiable/s.test(
    productCardContent.slice(productCardContent.indexOf('formatPrice(listing.price)'))
  );
  assert(!cardHasNegotiableBadge, 'ProductCard.js: Secondary "Negotiable" badge is REMOVED from compact cards');

  // In ProductDetail.js, [ Negotiable ] badge MUST be present
  const productDetailJsPath = path.join(__dirname, '../../frontend/src/pages/ProductDetail.js');
  const productDetailContent = fs.readFileSync(productDetailJsPath, 'utf8');
  assert(productDetailContent.includes('data-testid="listing-negotiable-badge"'), 'ProductDetail.js: Retains explicit "listing-negotiable-badge"');
  assert(productDetailContent.includes('Negotiable'), 'ProductDetail.js: Displays "Negotiable" badge on post detail');

  // 5. Mobile Navigation / Action Section Verification (Dashboard.js)
  console.log('\n--- 5. Mobile Navigation Responsiveness (Dashboard.js) ---');
  const dashboardJsPath = path.join(__dirname, '../../frontend/src/pages/Dashboard.js');
  const dashboardJsContent = fs.readFileSync(dashboardJsPath, 'utf8');

  // Check that the restrictive overflow-x-auto flex-nowrap has been removed
  assert(!dashboardJsContent.includes('flex-nowrap gap-1'), 'Dashboard.js: Removed rigid flex-nowrap from action tabs');
  assert(dashboardJsContent.includes('flex-wrap'), 'Dashboard.js: TabsList uses responsive flex-wrap layout');
  assert(dashboardJsContent.includes('lg:inline-flex'), 'Dashboard.js: Preserves desktop inline-flex layout');
  assert(dashboardJsContent.includes('min-h-[40px]'), 'Dashboard.js: All tab triggers maintain >=40px touch targets');
  assert(dashboardJsContent.includes('whitespace-nowrap'), 'Dashboard.js: Each tab trigger stays cohesive without clipped words');
  assert(dashboardJsContent.includes('data-testid="tab-payments"'), 'Dashboard.js: tab-payments is accessible');
  assert(dashboardJsContent.includes('data-testid="tab-reports"'), 'Dashboard.js: tab-reports (Activity & Reports) is accessible');
  assert(dashboardJsContent.includes('data-testid="tab-profile"'), 'Dashboard.js: tab-profile (Profile Settings) is accessible');

  // Also check that Dashboard compact cards also removed the secondary Negotiable badge
  const dashCardHasNegotiableBadge = /price_type === ['"]negotiable['"].*?Negotiable/s.test(
    dashboardJsContent.slice(dashboardJsContent.indexOf('formatPrice(listing.price)'), dashboardJsContent.indexOf('formatPrice(listing.price)') + 500)
  );
  assert(!dashCardHasNegotiableBadge, 'Dashboard.js: Secondary "Negotiable" badge is REMOVED from dashboard compact cards');

  console.log(`\n============================================================`);
  console.log(`📊 ALL CATEGORIES & MOBILE NAV RESULTS: ${passed}/${total} Passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`============================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
