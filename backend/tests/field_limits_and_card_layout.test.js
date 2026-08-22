const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { FIELD_LIMITS, validateFieldLength } = require('../src/utils/fieldLimits');

console.log('\n--- STARTING FIELD LIMITS & CARD LAYOUT AUDIT TESTS ---\n');

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

// 1. Core Field Limits Constants
it('should have standard required limits defined in FIELD_LIMITS', () => {
  assert.strictEqual(FIELD_LIMITS.TITLE, 60, 'Title max should be 60');
  assert.strictEqual(FIELD_LIMITS.DESCRIPTION, 1000, 'Description max should be 1000');
  assert.strictEqual(FIELD_LIMITS.BRAND, 40, 'Brand max should be 40');
  assert.strictEqual(FIELD_LIMITS.MODEL, 40, 'Model max should be 40');
  assert.strictEqual(FIELD_LIMITS.SPEC_KEY, 30, 'Spec key max should be 30');
  assert.strictEqual(FIELD_LIMITS.SPEC_VALUE, 50, 'Spec value max should be 50');
  assert.strictEqual(FIELD_LIMITS.LOCATION_ADDRESS, 80, 'Address max should be 80');
  assert.strictEqual(FIELD_LIMITS.LOCATION_NAME, 40, 'District/taluk max should be 40');
  assert.strictEqual(FIELD_LIMITS.FULL_NAME, 20, 'Full name max should be 20');
  assert.strictEqual(FIELD_LIMITS.USERNAME, 9, 'Username max should be 9');
  assert.strictEqual(FIELD_LIMITS.REVIEW_COMMENT, 500, 'Review comment max should be 500');
  assert.strictEqual(FIELD_LIMITS.REPORT_DETAILS, 500, 'Report details max should be 500');
  assert.strictEqual(FIELD_LIMITS.SUPPORT_SUBJECT, 100, 'Support subject max should be 100');
  assert.strictEqual(FIELD_LIMITS.SUPPORT_MESSAGE, 1000, 'Support message max should be 1000');
  assert.strictEqual(FIELD_LIMITS.CHAT_MESSAGE, 1000, 'Chat message max should be 1000');
});

// 2. Title Validation
it('should validate title boundaries properly', () => {
  // Valid title
  const valid = validateFieldLength('RTX 4080 Super - Mint Condition with Box', FIELD_LIMITS.TITLE, true, 'Title');
  assert.strictEqual(valid.valid, true);

  // Exact 60 chars
  const exact60 = 'A'.repeat(60);
  const exactCheck = validateFieldLength(exact60, FIELD_LIMITS.TITLE, true, 'Title');
  assert.strictEqual(exactCheck.valid, true);

  // 61 chars (overflow)
  const over61 = 'A'.repeat(61);
  const overCheck = validateFieldLength(over61, FIELD_LIMITS.TITLE, true, 'Title');
  assert.strictEqual(overCheck.valid, false);
  assert.match(overCheck.error, /cannot exceed 60 characters/);

  // Empty or whitespace required check
  const emptyCheck = validateFieldLength('   ', FIELD_LIMITS.TITLE, true, 'Title');
  assert.strictEqual(emptyCheck.valid, false);
  assert.match(emptyCheck.error, /is required/);
});

// 3. Description Validation
it('should validate description boundaries properly', () => {
  // Valid description
  const validDesc = 'Selling my mint RTX 4080 Super. Used for 3 months with valid invoice.';
  const validCheck = validateFieldLength(validDesc, FIELD_LIMITS.DESCRIPTION, true, 'Description');
  assert.strictEqual(validCheck.valid, true);

  // Exact 1000 chars
  const exact1000 = 'D'.repeat(1000);
  const exactCheck = validateFieldLength(exact1000, FIELD_LIMITS.DESCRIPTION, true, 'Description');
  assert.strictEqual(exactCheck.valid, true);

  // 1001 chars (overflow)
  const over1001 = 'D'.repeat(1001);
  const overCheck = validateFieldLength(over1001, FIELD_LIMITS.DESCRIPTION, true, 'Description');
  assert.strictEqual(overCheck.valid, false);
  assert.match(overCheck.error, /cannot exceed 1000 characters/);
});

// 4. Brand & Model Validation
it('should validate brand and model boundaries', () => {
  // Valid 40 chars
  assert.strictEqual(validateFieldLength('ASUS ROG Strix Republic of Gamers', FIELD_LIMITS.BRAND, false, 'Brand').valid, true);
  // Over 40 chars
  const overBrand = 'B'.repeat(41);
  const brandCheck = validateFieldLength(overBrand, FIELD_LIMITS.BRAND, false, 'Brand');
  assert.strictEqual(brandCheck.valid, false);
  assert.match(brandCheck.error, /cannot exceed 40 characters/);

  // Model over 40 chars
  const overModel = 'M'.repeat(41);
  const modelCheck = validateFieldLength(overModel, FIELD_LIMITS.MODEL, false, 'Model');
  assert.strictEqual(modelCheck.valid, false);
  assert.match(modelCheck.error, /cannot exceed 40 characters/);
});

// 5. Location & Address Validation
it('should validate location and address details length', () => {
  assert.strictEqual(validateFieldLength('Near Infopark Phase 2, Kakkanad, Kochi', FIELD_LIMITS.LOCATION_ADDRESS, false, 'Address').valid, true);
  const overAddress = 'L'.repeat(81);
  const addrCheck = validateFieldLength(overAddress, FIELD_LIMITS.LOCATION_ADDRESS, false, 'Address');
  assert.strictEqual(addrCheck.valid, false);
  assert.match(addrCheck.error, /cannot exceed 80 characters/);
});

// 6. Review, Report, Support & Chat Limits
it('should validate review, report, support and chat lengths', () => {
  // Review Comment (max 500)
  assert.strictEqual(validateFieldLength('Great seller, fast meetup and verified item.', FIELD_LIMITS.REVIEW_COMMENT, false, 'Review').valid, true);
  assert.strictEqual(validateFieldLength('R'.repeat(501), FIELD_LIMITS.REVIEW_COMMENT, false, 'Review').valid, false);

  // Report Details (max 500)
  assert.strictEqual(validateFieldLength('Report details here...', FIELD_LIMITS.REPORT_DETAILS, false, 'Report details').valid, true);
  assert.strictEqual(validateFieldLength('R'.repeat(501), FIELD_LIMITS.REPORT_DETAILS, false, 'Report details').valid, false);

  // Support Subject (max 100) & Message (max 1000)
  assert.strictEqual(validateFieldLength('S'.repeat(100), FIELD_LIMITS.SUPPORT_SUBJECT, true, 'Subject').valid, true);
  assert.strictEqual(validateFieldLength('S'.repeat(101), FIELD_LIMITS.SUPPORT_SUBJECT, true, 'Subject').valid, false);

  assert.strictEqual(validateFieldLength('M'.repeat(1000), FIELD_LIMITS.SUPPORT_MESSAGE, true, 'Description').valid, true);
  assert.strictEqual(validateFieldLength('M'.repeat(1001), FIELD_LIMITS.SUPPORT_MESSAGE, true, 'Description').valid, false);

  // Chat Message (max 1000)
  assert.strictEqual(validateFieldLength('C'.repeat(1000), FIELD_LIMITS.CHAT_MESSAGE, false, 'Message').valid, true);
  assert.strictEqual(validateFieldLength('C'.repeat(1001), FIELD_LIMITS.CHAT_MESSAGE, false, 'Message').valid, false);
});

// 7. ProductCard Layout & CSS Invariants
it('should verify ProductCard has required overflow prevention classes and line clamping', () => {
  const cardPath = path.join(__dirname, '../../frontend/src/components/ProductCard.js');
  const cardContent = fs.readFileSync(cardPath, 'utf8');

  // Must have line-clamp-2
  assert.ok(cardContent.includes('line-clamp-2'), 'ProductCard must include line-clamp-2 for title');
  // Must have min-h-[2.5rem] for 2-line title height reservation
  assert.ok(cardContent.includes('min-h-[2.5rem]'), 'ProductCard must include min-h-[2.5rem] for consistent card heights');
  // Must have break-words
  assert.ok(cardContent.includes('break-words'), 'ProductCard must include break-words to handle unbroken text');
  // Must have title tooltip attribute
  assert.ok(cardContent.includes('title={listing.title}'), 'ProductCard must include title={listing.title} for accessible full text hover');
  // Must have location truncation
  assert.ok(cardContent.includes('truncate') && cardContent.includes('title={listing.location}'), 'ProductCard must include location truncation and tooltip');
  // Must have seller name truncation
  assert.ok(cardContent.includes('truncate font-medium') && cardContent.includes('title={listing.seller_name}'), 'ProductCard must include seller name truncation');
});

// 8. Frontend Forms have maxLength & validation attributes
it('should verify PostListing and EditListing enforce maxLength and character counters', () => {
  const postListingPath = path.join(__dirname, '../../frontend/src/pages/PostListing.js');
  const postContent = fs.readFileSync(postListingPath, 'utf8');

  assert.ok(postContent.includes('FIELD_LIMITS.TITLE'), 'PostListing must reference FIELD_LIMITS.TITLE');
  assert.ok(postContent.includes('FIELD_LIMITS.DESCRIPTION'), 'PostListing must reference FIELD_LIMITS.DESCRIPTION');
  assert.ok(postContent.includes('maxLength={FIELD_LIMITS.TITLE}'), 'PostListing must set maxLength on title');
  assert.ok(postContent.includes('maxLength={FIELD_LIMITS.DESCRIPTION}'), 'PostListing must set maxLength on description');
  assert.ok(postContent.includes('{title.length} / {FIELD_LIMITS.TITLE}'), 'PostListing must display title character counter');
  assert.ok(postContent.includes('{description.length} / {FIELD_LIMITS.DESCRIPTION}'), 'PostListing must display description character counter');

  const editListingPath = path.join(__dirname, '../../frontend/src/pages/EditListing.js');
  const editContent = fs.readFileSync(editListingPath, 'utf8');

  assert.ok(editContent.includes('FIELD_LIMITS.TITLE'), 'EditListing must reference FIELD_LIMITS.TITLE');
  assert.ok(editContent.includes('maxLength={FIELD_LIMITS.TITLE}'), 'EditListing must set maxLength on title');
  assert.ok(editContent.includes('maxLength={FIELD_LIMITS.DESCRIPTION}'), 'EditListing must set maxLength on description');
  assert.ok(editContent.includes('{title.length} / {FIELD_LIMITS.TITLE}'), 'EditListing must display title character counter');
});

// 9. Router imports in EditListing
it('should verify EditListing properly imports Link and router hooks from react-router-dom', () => {
  const editListingPath = path.join(__dirname, '../../frontend/src/pages/EditListing.js');
  const editContent = fs.readFileSync(editListingPath, 'utf8');

  assert.ok(/import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(editContent), 'EditListing must import Link from react-router-dom');
  assert.ok(/import\s*\{[^}]*\buseParams\b[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(editContent), 'EditListing must import useParams from react-router-dom');
  assert.ok(/import\s*\{[^}]*\buseNavigate\b[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(editContent), 'EditListing must import useNavigate from react-router-dom');
});

console.log(`\nTests Completed: ${passed}/${total} passed\n`);
if (passed !== total) {
  process.exit(1);
}
