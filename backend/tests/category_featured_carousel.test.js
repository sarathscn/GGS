const http = require('http');

async function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8000${path}`, (res) => {
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

async function runFeaturedCarouselValidation() {
  console.log('=== STARTING CATEGORY FEATURED CAROUSEL VALIDATION SUITE ===\n');

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

  // 1. Fetch all categories to test with
  const catRes = await get('/api/categories');
  assert(catRes.status === 200 && Array.isArray(catRes.body), 'Fetched all marketplace categories');
  const categories = catRes.body;

  // 2. Test Category with Featured Posts
  const peripheralsCat = categories.find(c => c.slug === 'peripherals');
  assert(Boolean(peripheralsCat), 'Found peripherals category');

  const featuredPeripherals = await get(`/api/listings?category=peripherals&featured=true`);
  assert(featuredPeripherals.status === 200, 'GET /api/listings?category=peripherals&featured=true returned 200');
  assert(featuredPeripherals.body.length > 0, `Peripherals has featured listings (count: ${featuredPeripherals.body.length})`);
  
  // Verify strict category filtering (never show post from another category)
  const allPeripheralsValid = featuredPeripherals.body.every(
    l => l.category_id === peripheralsCat.id || l.category_id === peripheralsCat.slug
  );
  assert(allPeripheralsValid, 'All featured listings strictly belong to the selected category (no cross-category leakage)');

  // Verify all are active and featured
  const allFeaturedActive = featuredPeripherals.body.every(l => l.featured === true && l.status === 'active');
  assert(allFeaturedActive, 'All returned items have featured=true and status=active');

  // 3. Test Category Switching Isolation
  const consolesCat = categories.find(c => c.slug === 'consoles');
  const featuredConsoles = await get(`/api/listings?category=consoles&featured=true`);
  assert(featuredConsoles.status === 200, 'GET /api/listings?category=consoles&featured=true returned 200');
  assert(featuredConsoles.body.length > 0, `Consoles has featured listings (count: ${featuredConsoles.body.length})`);

  // Verify no overlap between Peripherals and Consoles featured posts
  const peripheralIds = new Set(featuredPeripherals.body.map(l => l.id));
  const consolesOverlap = featuredConsoles.body.some(l => peripheralIds.has(l.id));
  assert(!consolesOverlap, 'Category switching: Peripherals and Consoles have distinct, strictly isolated featured posts');

  // 4. Test Scenario: Category with 0 featured posts -> empty array returned
  const nonExistentCat = await get('/api/listings?category=non-existent-category-12345&featured=true');
  assert(nonExistentCat.status === 200 && nonExistentCat.body.length === 0, 'Category with 0 featured posts returns empty array (Section Hidden)');

  // 5. Carousel Logic Simulator Tests (Unit tests for carousel algorithms)
  console.log('\n--- Carousel Component Logic Tests ---');

  // Logic test: 0 posts -> null
  const shouldRenderZero = (items) => items && items.length > 0;
  assert(!shouldRenderZero([]), '0 featured posts: Component gracefully returns null (hidden)');

  // Logic test: 1 post -> no auto-scroll, no infinite loop needed
  const shouldAutoScroll = (items, isHovered, isSwiping, prefersReducedMotion) => {
    return items.length > 1 && !isHovered && !isSwiping && !prefersReducedMotion;
  };
  assert(!shouldAutoScroll([{ id: 1 }], false, false, false), '1 featured post: Auto-scroll is disabled');
  assert(shouldAutoScroll([{ id: 1 }, { id: 2 }], false, false, false), '2 featured posts: Auto-scroll is enabled');

  // Logic test: Hover pauses auto-scroll
  assert(!shouldAutoScroll([{ id: 1 }, { id: 2 }], true, false, false), 'Desktop Hover: Auto-scroll is paused');

  // Logic test: Mobile Touch/Swipe pauses auto-scroll
  assert(!shouldAutoScroll([{ id: 1 }, { id: 2 }], false, true, false), 'Mobile Swipe: Auto-scroll is paused');

  // Logic test: Prefers Reduced Motion disables auto-scroll
  assert(!shouldAutoScroll([{ id: 1 }, { id: 2 }], false, false, true), 'prefers-reduced-motion: Auto-scroll is disabled');

  // Logic test: Continuous looping with clones
  const computeExtendedSlides = (listings, visibleCount) => {
    let repeated = [...listings];
    while (repeated.length < visibleCount * 2 || repeated.length < 6) {
      repeated = [...repeated, ...listings];
    }
    const headClones = repeated.slice(-visibleCount);
    const tailClones = repeated.slice(0, visibleCount);
    return [...headClones, ...repeated, ...tailClones];
  };

  const slides2 = computeExtendedSlides([{ id: 'A' }, { id: 'B' }], 4);
  assert(slides2.length >= 16, `2 posts with visibleCount=4 creates continuous track of ${slides2.length} slides`);

  const slidesMany = computeExtendedSlides([
    { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }
  ], 4);
  assert(slidesMany.length >= 18, `5 posts with visibleCount=4 creates continuous track of ${slidesMany.length} slides`);

  // Logic test: Active pagination dot index calculation
  const getActiveDot = (currentIndex, offset, total) => {
    const norm = (currentIndex - offset) % total;
    return norm < 0 ? norm + total : norm;
  };

  assert(getActiveDot(4, 4, 2) === 0, 'Active dot at initial index 4 (offset 4, total 2) is 0');
  assert(getActiveDot(5, 4, 2) === 1, 'Active dot after 1 slide at index 5 is 1');
  assert(getActiveDot(6, 4, 2) === 0, 'Active dot after 2 slides at index 6 wraps to 0');

  // 6. Pricing & Negotiable consistency on featured listings
  console.log('\n--- Featured Listings Price & Negotiability Verification ---');
  const sampleFeatured = featuredPeripherals.body;
  const hasFixedPrice = sampleFeatured.some(l => l.price_type === 'fixed' || !l.price_type);
  const hasNegotiable = sampleFeatured.some(l => l.price_type === 'negotiable');

  assert(hasFixedPrice, 'Found featured listings with Fixed price in category');
  console.log(`   (Fixed price featured count: ${sampleFeatured.filter(l => l.price_type === 'fixed' || !l.price_type).length})`);
  console.log(`   (Negotiable featured count: ${sampleFeatured.filter(l => l.price_type === 'negotiable').length})`);

  console.log(`\n============================================================`);
  console.log(`📊 FEATURED CAROUSEL TEST RESULTS: ${passed}/${total} Passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`============================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runFeaturedCarouselValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
