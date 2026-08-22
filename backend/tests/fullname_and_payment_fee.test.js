const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { validateFullName, sanitizeFullNameInput, FULL_NAME_ERROR_MESSAGE, FULL_NAME_REGEX } = require('../src/utils/userValidation');
const { calculateListingPayment, BASE_LISTING_SERVICE_CHARGE, DEFAULT_GST_PERCENTAGE, REFUND_POLICY_VERSION } = require('../src/utils/pricingUtils');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Payment = require('../src/models/Payment');
const generateInvoiceData = require('../src/utils/invoiceGenerator');

// MongoDB connection string for tests
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ggs';

async function runTests() {
  console.log('🧪 Starting Full Name Validation and Payment/Tax Test Suite...\n');
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

  // Connect to DB for model integration tests
  await mongoose.connect(MONGO_URI);

  // ----------------------------------------------------
  // SECTION 1: Full Name Validation Unit Tests
  // ----------------------------------------------------
  console.log('\n--- Section 1: Full Name Validation Unit Tests ---');

  const validNames = [
    'John Doe',
    'A',
    'Sarath Kumar',
    'Jane Mary Doe',
    'Twenty Characters AB', // exactly 20 characters
    'Alice Bob Charlie'
  ];

  for (const name of validNames) {
    const res = validateFullName(name);
    assert(res.isValid === true && res.cleanName === name, `Accepts valid name: "${name}" (${name.length} chars)`);
  }

  const invalidNames = [
    { input: '', reason: 'empty string' },
    { input: ' John', reason: 'leading space' },
    { input: 'John ', reason: 'trailing space' },
    { input: 'John  Doe', reason: 'multiple consecutive spaces' },
    { input: 'John123', reason: 'contains numbers' },
    { input: 'John_Doe', reason: 'contains underscore' },
    { input: 'John-Doe', reason: 'contains hyphen' },
    { input: 'John Doe.', reason: 'contains period/punctuation' },
    { input: 'John@Doe', reason: 'contains special char @' },
    { input: 'John Doe Gamer Pro Max', reason: 'length > 20 characters (23 chars)' },
    { input: 'Twenty One Characters', reason: 'length > 20 characters (21 chars)' },
    { input: 'John 😀', reason: 'contains emoji' },
    { input: null, reason: 'null value' },
    { input: undefined, reason: 'undefined value' }
  ];

  for (const item of invalidNames) {
    const res = validateFullName(item.input);
    assert(res.isValid === false, `Rejects invalid name (${item.reason}): "${item.input}"`);
    if (item.input !== null && item.input !== undefined) {
      assert(res.error === FULL_NAME_ERROR_MESSAGE, `Returns exact error message for "${item.input}"`);
    }
  }

  // ----------------------------------------------------
  // SECTION 2: Full Name Sanitization While Typing
  // ----------------------------------------------------
  console.log('\n--- Section 2: Full Name Sanitization While Typing ---');

  assert(sanitizeFullNameInput('John123 Doe!') === 'John Doe', 'Sanitizes numbers and punctuation from typing input');
  assert(sanitizeFullNameInput('John   Doe') === 'John Doe', 'Collapses multiple spaces to single space');
  assert(sanitizeFullNameInput('VeryLongNameThatExceedsTwentyCharactersNow') === 'VeryLongNameThatExce', 'Slices typing input to max 20 chars');
  assert(sanitizeFullNameInput(null) === '', 'Sanitizes null input safely to empty string');

  // ----------------------------------------------------
  // SECTION 3: Centralized Pricing and GST Calculation
  // ----------------------------------------------------
  console.log('\n--- Section 3: Centralized Pricing and GST Calculation ---');

  // Default: ₹8.47 + 18% GST = ₹10.00 (1000 paise)
  const defaultPricing = calculateListingPayment();
  assert(defaultPricing.baseFee === 8.47, 'Base service charge is ₹8.47');
  assert(defaultPricing.baseFeePaise === 847, 'Base service charge in paise is 847');
  assert(defaultPricing.gstPercentage === 18, 'Default GST rate is 18%');
  assert(defaultPricing.gstAmount === 1.53, 'GST Amount for ₹8.47 is ₹1.53');
  assert(defaultPricing.gstAmountPaise === 153, 'GST Amount in paise is 153');
  assert(defaultPricing.totalAmount === 10.00, 'Total Amount payable is ₹10.00 (8.47 + 1.53)');
  assert(defaultPricing.totalAmountPaise === 1000, 'Total Amount in paise is 1000');
  assert(defaultPricing.formattedBaseFee === '₹8.47', 'Formatted base fee is ₹8.47');
  assert(defaultPricing.formattedGstAmount === '₹1.53', 'Formatted GST amount is ₹1.53');
  assert(defaultPricing.formattedTotal === '₹10.00', 'Formatted total amount is ₹10.00');

  // Custom GST percentages
  const zeroGst = calculateListingPayment({ baseFee: 8.47, gstPercentage: 0 });
  assert(zeroGst.gstAmount === 0 && zeroGst.totalAmount === 8.47, '0% GST calculates ₹0.00 tax and ₹8.47 total');

  const twelveGst = calculateListingPayment({ baseFee: 8.47, gstPercentage: 12 });
  assert(twelveGst.totalAmount === 9.49, '12% GST calculates correct total');

  // Floating point precision test (ensures no floating point rounding artifacts)
  const precisionTest = calculateListingPayment({ baseFee: 8.47, gstPercentage: 18 });
  assert(Number.isFinite(precisionTest.totalAmount) && (precisionTest.totalAmount.toString().split('.')[1]?.length || 0) <= 2, 'Total amount has at most 2 decimal places');

  // ----------------------------------------------------
  // SECTION 4: Payment Model & No-Refund Policy Integration
  // ----------------------------------------------------
  console.log('\n--- Section 4: Payment Model & No-Refund Policy Integration ---');

  const testUserId = uuidv4();
  const testListingId = uuidv4();

  const testUser = new User({
    id: testUserId,
    name: 'Sarath Kumar',
    email: `sarath_${Date.now()}@example.com`,
    role: 'user'
  });
  await testUser.save();

  const testListing = new Listing({
    id: testListingId,
    seller_id: testUserId,
    title: 'PlayStation 5 Console Disk Edition',
    slug: `ps5-console-disk-${Date.now()}`,
    category_id: 'gaming-consoles',
    category: 'Gaming Consoles',
    description: 'Mint condition PS5 console with two dualsense controllers.',
    price: 42000,
    condition: 'Like New',
    location: 'Kochi, Kerala',
    contact_phone: '+919876543210',
    item_type: 'physical',
    payment_status: 'pending_payment',
    status: 'pending'
  });
  await testListing.save();

  // Create Payment Document with ₹8.47 + 18% GST and policy acknowledgement
  const paymentDoc = new Payment({
    id: uuidv4(),
    user_id: testUserId,
    listing_id: testListingId,
    base_amount: defaultPricing.baseFee,
    gst_percentage: defaultPricing.gstPercentage,
    gst_amount: defaultPricing.gstAmount,
    amount: defaultPricing.totalAmount,
    currency: 'INR',
    status: 'completed',
    payment_method: 'upi',
    transaction_id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
    policy_accepted: true,
    policy_version: REFUND_POLICY_VERSION,
    policy_accepted_at: new Date().toISOString()
  });
  await paymentDoc.save();

  assert(paymentDoc.base_amount === 8.47, 'Payment record accurately stores base_amount ₹8.47');
  assert(paymentDoc.gst_percentage === 18, 'Payment record accurately stores gst_percentage 18');
  assert(paymentDoc.gst_amount === 1.53, 'Payment record accurately stores gst_amount ₹1.53');
  assert(paymentDoc.amount === 10.00, 'Payment record accurately stores total amount ₹10.00');
  assert(paymentDoc.policy_accepted === true, 'Payment record records policy_accepted === true');
  assert(paymentDoc.policy_version === 'v2.0', 'Payment record records policy_version === "v2.0"');
  assert(Boolean(paymentDoc.policy_accepted_at), 'Payment record records policy_accepted_at timestamp');

  // Verify Invoice Generation uses the new breakdown
  const invoice = generateInvoiceData(paymentDoc, testListing, testUser);
  assert(invoice.base_amount === 8.47, 'Invoice contains base_amount ₹8.47');
  assert(invoice.gst_rate === 18, 'Invoice contains gst_rate 18%');
  assert(invoice.gst_amount === 1.53, 'Invoice contains gst_amount ₹1.53');
  assert(invoice.total_amount === 10.00, 'Invoice contains total_amount ₹10.00');
  assert(invoice.user_name === 'Sarath Kumar', 'Invoice contains verified user full name');

  // Cleanup test docs
  await User.deleteOne({ id: testUserId });
  await Listing.deleteOne({ id: testListingId });
  await Payment.deleteOne({ id: paymentDoc.id });

  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`🏁 Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
