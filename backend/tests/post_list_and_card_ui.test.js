const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('  EXACT POST CARD & POST LIST SPECIFICATION TEST SUITE');
console.log('======================================================\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
  }
}

const productCardPath = path.resolve(__dirname, '../../frontend/src/components/ProductCard.js');
const postListPath = path.resolve(__dirname, '../../frontend/src/components/PostList.js');

const productCardContent = fs.readFileSync(productCardPath, 'utf8');
const postListContent = fs.readFileSync(postListPath, 'utf8');

// 1. Photos fill entire gallery area & multi-image auto-scroll with snap-to-slide
it('1. Photos must completely fill gallery area with cover fit & snap-to-slide infinite auto-scroll', () => {
  assert.ok(productCardContent.includes('object-cover'), 'Must use object-cover');
  assert.ok(productCardContent.includes('aspect-[4/3]'), 'Must have consistent aspect ratio');
  assert.ok(productCardContent.includes('currentSlideIndex'), 'Must track currentSlideIndex');
  assert.ok(productCardContent.includes('extendedSlides'), 'Must use extended slides for seamless infinite loop');
  assert.ok(productCardContent.includes('translateX(-${currentSlideIndex * 100}%)'), 'Must use exact integer percentage snap-to-slide');
  assert.ok(productCardContent.includes('500ms ease-in-out'), 'Must use smooth 500ms ease-in-out transition');
  assert.ok(productCardContent.includes('handleTransitionEnd'), 'Must handle transition end for seamless reset');
  assert.ok(productCardContent.includes('flex-shrink-0') || productCardContent.includes('shrink-0'), 'Must enforce flex-shrink: 0 on slides');
  assert.ok(productCardContent.includes('min-w-full') && productCardContent.includes('w-full'), 'Slides must occupy 100% full width');
  assert.ok(productCardContent.includes('onTouchStart') && productCardContent.includes('onTouchEnd'), 'Must support touch swipe');
});

// 2. Wishlist Button is OVER photos, top-right
it('2. Wishlist button must float over photos in the top-right corner', () => {
  const imageSectionEnd = productCardContent.indexOf('Card Content Section');
  const wishlistBtnPos = productCardContent.indexOf('data-testid={`wishlist-btn-${listing.id}`}');
  
  assert.ok(wishlistBtnPos < imageSectionEnd, 'Wishlist button must be inside the photo/gallery area');
  assert.ok(productCardContent.includes('absolute top-2 right-2'), 'Wishlist button must be absolutely positioned top-right');
  assert.ok(productCardContent.includes('rounded-full'), 'Wishlist button must be circular');
  assert.ok(productCardContent.includes("aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}"), 'Must have accessible labels');
});

// 3, 4 & 5. Information hierarchy: Category -> Condition -> Title -> Price + Location -> Uploaded User
it('3, 4 & 5. Hierarchy in content area must be Category -> Condition -> Title -> Price + Location -> User', () => {
  const contentSectionStart = productCardContent.indexOf('Card Content Section');
  assert.ok(contentSectionStart > 0, 'Card Content Section must exist');

  const contentSlice = productCardContent.slice(contentSectionStart);

  const categoryPos = contentSlice.indexOf('listing.category_name');
  const conditionPos = contentSlice.indexOf('listing.condition');
  const titlePos = contentSlice.indexOf('listing.title');
  const pricePos = contentSlice.indexOf('formatPrice(listing.price)');
  const locationPos = contentSlice.indexOf('listing.location');
  const userPos = productCardContent.indexOf('seller-link-${listing.seller_id}');

  assert.ok(categoryPos > 0, 'Category must be in content section');
  assert.ok(conditionPos > categoryPos, 'Condition must appear after Category');
  assert.ok(titlePos > conditionPos, 'Title must appear after Condition');
  assert.ok(pricePos > titlePos, 'Price must appear after Title');
  assert.ok(locationPos > titlePos, 'Location must appear after Title');
  assert.ok(userPos > contentSectionStart, 'Uploaded User must appear after content section');
});

// 5. Title formatting
it('5. Title must have 1-2 lines clamp and truncation', () => {
  assert.ok(productCardContent.includes('line-clamp-2'), 'Must use line-clamp-2 for title');
  assert.ok(productCardContent.includes('break-words'), 'Must prevent long word overflows');
  assert.ok(productCardContent.includes('title={listing.title}'), 'Must have full title tooltip');
});

// 6, 7 & 8. Price and Location share the SAME row (Price left, Location right)
it('6, 7 & 8. Price (left) and Location (right) must share the SAME row', () => {
  const contentSectionStart = productCardContent.indexOf('Card Content Section');
  const contentSlice = productCardContent.slice(contentSectionStart);

  const pricePos = contentSlice.indexOf('formatPrice(listing.price)');
  const locationPos = contentSlice.indexOf('listing.location');
  const userPos = productCardContent.indexOf('seller-link-${listing.seller_id}');

  assert.ok(pricePos > 0, 'Price must be present');
  assert.ok(locationPos > 0, 'Location must be present');
  assert.ok(pricePos < userPos, 'Price must come before Uploaded User');
  assert.ok(locationPos < userPos, 'Location must come before Uploaded User');
  assert.ok(productCardContent.includes('justify-between') && productCardContent.includes('MapPin'), 'Price and Location must share a row using flexbox justify-between');
});

// 9. Uploaded User comes after Price + Location
it('9. Uploaded User must come after Price + Location row with subtle divider', () => {
  const pricePos = productCardContent.indexOf('formatPrice(listing.price)');
  const userPos = productCardContent.indexOf('seller-link-${listing.seller_id}');

  assert.ok(userPos > pricePos, 'Uploaded User must appear after Price + Location');
  assert.ok(productCardContent.includes('border-t'), 'Must have subtle divider above Uploaded User');
  assert.ok(productCardContent.includes('Avatar'), 'Must include small avatar');
});

// 10, 11, 12, 13. Reusable PostList grid and loading skeleton
it('10, 11, 12 & 13. PostList component must render responsive grid, skeletons, and empty states', () => {
  assert.ok(postListContent.includes('grid-cols-1'), 'Must support mobile single-column');
  assert.ok(postListContent.includes('sm:grid-cols-2'), 'Must support tablet columns');
  assert.ok(postListContent.includes('xl:grid-cols-4'), 'Must support desktop multi-column');
  assert.ok(postListContent.includes('post-list-skeleton'), 'Must include loading skeleton');
  assert.ok(postListContent.includes('post-list-empty'), 'Must include empty state');
});

console.log(`\n======================================================`);
console.log(`  SPECIFICATION TEST RESULTS: ${passed}/${total} Passed (${((passed/total)*100).toFixed(1)}%)`);
console.log(`======================================================\n`);

if (passed !== total) {
  process.exit(1);
}
