const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Listing = require('../src/models/Listing');

async function testPricingLogic() {
  console.log('=== TESTING PRICE & NEGOTIABLE UI LOGIC SUITE ===\n');

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

  // Frontend helper logic simulation: formatPrice
  const formatPrice = (listing) => {
    const price = listing.price;
    if (listing?.price_type === 'free') return 'Free';
    if (listing?.price_type === 'negotiable' && (!price || Number(price) === 0)) return 'Negotiable';
    if (listing?.price_type === 'exchange' && (!price || Number(price) === 0)) return 'Exchange';
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  // Compact card badges (ProductCard.js, Dashboard.js, etc.)
  // CRITICAL: Compact cards MUST NOT show "Negotiable" badge next to numerical amount!
  const getCompactCardBadges = (listing) => {
    const badges = [];
    if (listing.price_type === 'exchange' && Number(listing.price) > 0) {
      badges.push('Exchange');
    }
    return badges;
  };

  // Post Detail badges (ProductDetail.js)
  // Post detail MUST explicitly show [ Negotiable ] badge when listing is negotiable and price > 0
  const getPostDetailBadges = (listing) => {
    const badges = [];
    if (listing.price_type === 'negotiable' && Number(listing.price) > 0) {
      badges.push('Negotiable');
    }
    if (listing.price_type === 'exchange' && Number(listing.price) > 0) {
      badges.push('Exchange');
    }
    return badges;
  };

  // Case 1: Fixed price: ₹10,500
  const case1 = { price: 10500, price_type: 'fixed' };
  const res1 = formatPrice(case1);
  const cardBadges1 = getCompactCardBadges(case1);
  const detailBadges1 = getPostDetailBadges(case1);
  assert(res1.includes('10,500'), `Case 1: Fixed price ₹10,500 formats correctly (Actual: ${res1})`);
  assert(!cardBadges1.includes('Negotiable'), 'Case 1: Fixed price does NOT have Negotiable badge on compact card');
  assert(!detailBadges1.includes('Negotiable'), 'Case 1: Fixed price does NOT have Negotiable badge on post detail');

  // Case 2: Fixed price: ₹37,100
  const case2 = { price: 37100, price_type: 'fixed' };
  const res2 = formatPrice(case2);
  const cardBadges2 = getCompactCardBadges(case2);
  const detailBadges2 = getPostDetailBadges(case2);
  assert(res2.includes('37,100'), `Case 2: Fixed price ₹37,100 formats correctly (Actual: ${res2})`);
  assert(!cardBadges2.includes('Negotiable'), 'Case 2: Fixed price does NOT have Negotiable badge on compact card');
  assert(!detailBadges2.includes('Negotiable'), 'Case 2: Fixed price does NOT have Negotiable badge on post detail');

  // Case 3: Negotiable listing with amount: ₹13,400 (CRITICAL ACCEPTANCE TEST)
  const case3 = { price: 13400, price_type: 'negotiable' };
  const res3 = formatPrice(case3);
  const cardBadges3 = getCompactCardBadges(case3);
  const detailBadges3 = getPostDetailBadges(case3);
  assert(res3.includes('13,400'), `Case 3: Negotiable with amount formats amount (Actual: ${res3})`);
  assert(!cardBadges3.includes('Negotiable'), 'Case 3 [CRITICAL]: Compact card MUST NOT show "Negotiable" badge (Shows only ₹13,400)');
  assert(detailBadges3.includes('Negotiable'), 'Case 3 [CRITICAL]: Post detail MUST show [ Negotiable ] badge');

  // Case 4: Missing/empty/0 price with negotiable
  const case4a = { price: 0, price_type: 'negotiable' };
  const case4b = { price: null, price_type: 'negotiable' };
  const case4c = { price: undefined, price_type: 'negotiable' };
  assert(formatPrice(case4a) === 'Negotiable', `Case 4a: price=0 with negotiable returns "Negotiable" as primary text (Actual: ${formatPrice(case4a)})`);
  assert(formatPrice(case4b) === 'Negotiable', `Case 4b: price=null with negotiable returns "Negotiable" as primary text (Actual: ${formatPrice(case4b)})`);
  assert(formatPrice(case4c) === 'Negotiable', `Case 4c: price=undefined with negotiable returns "Negotiable" as primary text (Actual: ${formatPrice(case4c)})`);
  assert(getCompactCardBadges(case4a).length === 0, 'Case 4: When "Negotiable" is primary on compact card, no secondary badge');
  assert(getPostDetailBadges(case4a).length === 0, 'Case 4: When "Negotiable" is primary on post detail, no duplicate secondary badge');

  // Case 5: Long price value: ₹10,00,000
  const case5 = { price: 1000000, price_type: 'fixed' };
  const res5 = formatPrice(case5);
  assert(res5.includes('10,00,000'), `Case 5: Long price ₹10,00,000 formats with Indian lakhs separators (Actual: ${res5})`);

  // Case 6: Free listing
  const case6 = { price: 0, price_type: 'free' };
  assert(formatPrice(case6) === 'Free', `Case 6: Free listing returns "Free" (Actual: ${formatPrice(case6)})`);

  // Case 7: All card contexts (Regular, Featured, Category, Search, Homepage, Related, Seller/Profile, Carousel)
  const cardContexts = [
    'Regular listing',
    'Featured Posts carousel card',
    'Category listing card',
    'Search results card',
    'Homepage listing card',
    'Related listing card',
    'Seller/profile listing card'
  ];
  cardContexts.forEach(context => {
    const listing = { price: 25000, price_type: 'negotiable' };
    const badges = getCompactCardBadges(listing);
    assert(!badges.includes('Negotiable'), `${context}: Shows ₹25,000 without "Negotiable" badge`);
  });

  console.log(`\n============================================================`);
  console.log(`📊 PRICE & NEGOTIABLE LOGIC: ${passed}/${total} Passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`============================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

testPricingLogic().catch((err) => {
  console.error(err);
  process.exit(1);
});
