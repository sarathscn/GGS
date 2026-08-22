const KERALA_CITIES = [
  'Kasaragod',
  'Kannur',
  'Wayanad',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Thrissur',
  'Ernakulam',
  'Idukki',
  'Kottayam',
  'Alappuzha',
  'Pathanamthitta',
  'Kollam',
  'Thiruvananthapuram'
];

const KERALA_DISTRICTS = [
  'Kasaragod',
  'Kannur',
  'Wayanad',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Thrissur',
  'Ernakulam',
  'Idukki',
  'Kottayam',
  'Alappuzha',
  'Pathanamthitta',
  'Kollam',
  'Thiruvananthapuram'
];

const BLOCKED_WORDS = [
  'abuse', 'scam', 'fraud', 'cheat', 'fake', 'stupid', 'idiot', 'fool',
  'hate', 'kill', 'die', 'threat', 'violence', 'racist', 'sexist'
];

const { BASE_LISTING_SERVICE_CHARGE } = require('./pricingUtils');

const LISTING_FEE = BASE_LISTING_SERVICE_CHARGE; // ₹8.47 base listing service charge (₹10.00 incl. 18% GST)

module.exports = {
  KERALA_CITIES,
  KERALA_DISTRICTS,
  BLOCKED_WORDS,
  LISTING_FEE
};
