const { v4: uuidv4 } = require('uuid');
const StaticPage = require('../models/StaticPage');
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');
const { SAFETY_BLOG_ARTICLES } = require('./safetyBlogArticles');

const STATIC_PAGES = [
  {
    slug: 'about',
    title: 'About Game Gear Swap (GGS)',
    content: `# About Game Gear Swap (GGS)

Welcome to **Game Gear Swap (GGS)**, Kerala's dedicated peer-to-peer marketplace engineered exclusively for gamers, PC enthusiasts, and hardware builders.

---

## 🎮 Our Mission

Our mission is to create a transparent, reliable, and localized ecosystem where gamers across all 14 districts of Kerala can trade, buy, and sell pre-owned gaming gear without unreasonable middleman markups or rampant marketplace spam.

Whether you are upgrading your graphics card, building your dream custom desktop, hunting for rare console titles, or swapping mechanical keyboards, GGS connects you directly with fellow passionate gamers in your region.

---

## 🛡️ Why GGS is Different

- **Anti-Spam Marketplace Architecture**: A nominal listing service charge (₹8.47 + 18% GST = ₹10.00) filters out bulk bot spam, scam syndicates, and duplicate ad floods to keep the marketplace clean and ad-free.
- **Dedicated Kerala Administrative Filtering**: Search by District, Taluk, and Local Area to find verified deals right in your neighborhood.
- **KYC & Seller Verification**: Admin-reviewed seller verification badges help buyers identify trustworthy local traders.
- **Hardware-Centric Specifications**: Filter and list by exact hardware details (CPUs, GPUs, VRAM, refresh rates, console revisions, and conditions).
- **In-App Real-Time Messaging**: Coordinate safe local meetups without exposing your phone number publicly unless you choose to.
`
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Effective Date**: January 2024 (Updated August 2026)

At **Game Gear Swap (GGS)**, your privacy and data security are fundamental priorities. This Privacy Policy details the exact types of information we collect, how your data is utilized, how listing and location data is published, and how payment and verification records are protected.

---

## 1. Information We Collect

We collect only the information necessary to provide a functional, secure peer-to-peer gaming marketplace:

- **Account & Identity Data**: Full name, username, email address, mobile phone number, avatar URL, and hashed authentication credentials.
- **Listing Data**: Ad titles, descriptions, categories, hardware specifications, condition, pricing, and uploaded product photographs.
- **Location Data**: District, Taluk, Town/Village/Area, and optional address details or map coordinates provided by you during ad creation.
- **Communication Data**: Messages, timestamps, read receipts, and image attachments exchanged via our in-app chat service.
- **Payment & Transaction Metadata**: Base service charge amounts (₹8.47), applicable GST rates (18%), calculated GST amounts (₹1.53), total paid (₹10.00), payment timestamps, gateway transaction reference IDs, and No-Refund policy acceptance records.
- **Verification (KYC) Data**: Government identification type, masked document number (storing only last 4 digits), and secure document image uploads submitted for seller verification.
- **Support & Moderation Data**: Support tickets, reported ad details, flagged chat logs, and abuse reports.

---

## 2. Location Privacy & Public Visibility

- **Public Location**: When you publish a listing, the general administrative region (e.g., *District, Taluk, Area*) is displayed publicly so local buyers can gauge proximity.
- **Exact Address & Residential Privacy**: Optional specific address lines or exact pinpoint coordinates are only utilized to assist local pickup navigation. We urge sellers not to input sensitive personal residential information if they prefer meeting in public pickup spots.

---

## 3. Payment Processing & Financial Privacy

- **Third-Party Gateways**: All payments (such as UPI, Debit/Credit Cards, and Net Banking) are securely processed through certified payment gateway partners.
- **No Stored Card Data**: GGS **never** stores your credit card numbers, debit card PINs, CVV codes, UPI PINs, or net banking passwords on our servers.
- **Retained Records**: We retain transaction reference IDs, invoice breakdowns, GST tax line items, and timestamps solely for accounting, tax compliance, anti-fraud auditing, and transaction dispute support.

---

## 4. Verification (KYC) Document Security

- KYC documents and identification photos submitted for Seller Verification are accessible **strictly to authorized platform administrators and moderators**.
- Sensitive document numbers are permanently masked in database views (e.g., \`****1234\`).
- Verification documents are never displayed publicly on seller profiles or listings.

---

## 5. In-App Messaging Privacy

- Conversations between buyers and sellers are private and visible only to the participating accounts.
- Automated safety filters screen messages for blocked scam patterns and off-platform fraudulent payment links.
- Moderators may inspect reported conversations only when an abuse, scam, or harassment report is formally filed by a participant.

---

## 6. Information Security & Limitations

We employ industry-standard access controls, database authentication, token encryption, and HTTPS/WSS encryption across all web traffic. However, please understand that no electronic data transmission or cloud storage system can be guaranteed to be 100% immune from security threats. We encourage users to maintain strong passwords and never share verification codes (OTPs).

---

## 7. Contact Us Regarding Privacy

If you have questions, corrections, or data removal inquiries, please submit a request through our [Support Portal](/page/contact).
`
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Effective Date**: January 2024 (Updated August 2026)

Please see our comprehensive [Privacy Policy](/page/privacy) for detailed information on data collection, location privacy, payment metadata, and verification handling.
`
  },
  {
    slug: 'terms',
    title: 'Terms and Conditions',
    content: `# Terms and Conditions

**Last Updated**: August 2026

Welcome to **Game Gear Swap (GGS)**. By accessing, browsing, registering an account, publishing a listing, or using our services, you agree to be bound by the following terms and conditions.

---

## 1. Account Integrity & User Obligations

- **Truthful Information**: Users must register with accurate full names (letters and single spaces only, max 20 characters) and valid contact credentials.
- **Account Security**: You are responsible for safeguarding your credentials. Sharing accounts or attempting to impersonate another individual is strictly prohibited.
- **One Person, One Identity**: Maintaining multiple fake or disposable accounts for malicious activity, spam, or bypassing bans will lead to permanent termination.

---

## 2. Listing Rules & Hardware Accuracy

- **Genuine Gaming Gear**: Every listing must represent genuine, physical or verifiable digital gaming items in your legal possession.
- **Accurate Descriptions & Specs**: Sellers must accurately describe the condition, functional state, warranty status, and hardware specifications of their items.
- **Original Photography**: Listings must use clear, actual photos of the physical item being sold. Stock images or stolen photos from other listings are prohibited.
- **Prohibited Goods**: Stolen hardware, counterfeit items, illegal modchips/jailbreak piracy kits, cracked software, malware, or accounts obtained via fraudulent methods are strictly barred.

---

## 3. Marketplace Behavior & Zero-Tolerance Fraud Policy

- **No Scams or Deceptive Deals**: Misleading prices, advance-payment scams, non-existent items, fake discount traps, and phishing links will result in immediate permanent banning and reporting to law enforcement authorities.
- **Respectful Communication**: Harassment, hate speech, threats, spamming, and abusive behavior across in-app messages are strictly forbidden.

---

## 4. Listing Service Charge, 90-Day Validity & Extensions

- **Publishing Service Fee**: GGS charges a nominal base service charge of **₹8.47** plus applicable statutory GST (**18% = ₹1.53**, total payable: **₹10.00**) to publish a listing on the marketplace.
- **90-Day Post Validity**: Each listing has an active validity period of **90 days** from the date of publication.
- **30-Day Expiry Extension**: Sellers may request a one-time 30-day extension per listing via support tickets prior to expiration.
- **One-Time Free Edit Allowance**: Sellers may request a one-time free edit allowance for their listing via support tickets.
- **No Refund Policy**: As detailed in our [Refund Policy](/page/refund-policy), this listing service charge is non-refundable once payment is completed, including after the 90-day validity period, upon expiry, or if the ad is deleted by the user or removed for rule violations.

---

## 5. Platform Role & Disclaimer of Warranties

- GGS operates as an online peer-to-peer directory and connection platform.
- GGS is not a party to the physical transaction between buyers and sellers, does not hold physical custody of listed items, and does not guarantee the condition, longevity, or performance of pre-owned gaming gear.
- Buyers and sellers are solely responsible for inspecting hardware, testing functionality, and agreeing upon mutually safe transaction terms.

---

## 6. Moderation & Termination Rights

GGS reserves the right to review listings, edit category placements, reject non-compliant posts, suspend accounts, revoke seller verification badges, and remove listings without prior notice in the event of policy violations.
`
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    content: `# Refund Policy

**Last Updated**: August 2026

At **Game Gear Swap (GGS)**, we maintain clear and transparent policies regarding all marketplace transactions, post validity, and service charges.

---

## 1. Listing Service Charge & 90-Day Validity

To maintain a high-quality, ad-free marketplace free of spam bots and bulk automated posts, GGS charges a nominal service fee:

- **Base Listing Service Charge**: **₹8.47**
- **Statutory GST (18%)**: **₹1.53**
- **Total Amount Payable**: **₹10.00**
- **Listing Validity**: **90 Days Active**

This fee directly covers the operational costs of cataloging, server infrastructure, real-time database hosting, map geolocation services, and ad moderation.

---

## 2. Non-Refundable Nature of the Service Charge (No Refund After 90 Days Validity Period)

The **₹10.00 listing service charge (₹8.47 + 18% GST) is strictly non-refundable once payment is successfully completed and the listing is published or queued**.

Specifically, **no refunds or credits will be issued** in the following circumstances:

1. **After 90 Days Validity Period / Expiration**: Your listing expires naturally after its 90-day active duration.
2. **User Deletion**: You choose to delete, withdraw, or mark your listing as sold before the end of its natural lifecycle.
3. **Change of Mind**: You decide not to sell the item or choose to sell it elsewhere.
4. **Moderator Removal / Policy Violations**: Your listing is removed by an administrator or moderator due to violations of our Terms and Conditions, prohibited items policy, fake deal listings, or misleading specifications.
5. **Account Suspension / Ban**: Your account is suspended or banned due to fraudulent activities, abusive behavior, or marketplace violations.

---

## 3. Expiry Extensions & Free Edit Allowances

- **30-Day Extension**: If your listing is nearing expiration without selling, you may request a single **30-day extension** via support ticket directly from your dashboard.
- **One-Time Free Edit Allowance**: Sellers can submit a request for a one-time free edit allowance if major updates are required.

---

## 4. Payment Disputes & Statutory Exceptions

Nothing in this policy is intended to exclude, restrict, or modify any statutory consumer rights, legal guarantees, or mandatory payment gateway dispute resolution procedures established under applicable Indian banking and consumer protection laws.

If you believe you were mistakenly charged multiple times due to a network timeout or gateway duplication error, please reach out to us with your Transaction Reference ID via our [Contact Support Portal](/page/contact) within **7 days** of the transaction.
`
  },
  {
    slug: 'safety',
    title: 'Marketplace Safety & Anti-Fraud Policy',
    content: `# Marketplace Safety & Anti-Fraud Policy

**Zero Tolerance for Scams, Fake Deals, and Deceptive Listings**

The safety of Kerala's gaming community is our highest priority. GGS enforces strict anti-fraud safeguards to ensure every buyer and seller can trade pre-owned hardware with confidence.

---

## 🚫 Prohibited Activities (Zero Tolerance)

The following activities are strictly prohibited on GGS and will result in **immediate account suspension, ad deletion, forfeiture of verification, and potential reporting to cyber police authorities**:

1. **Fake Listings & Non-Existent Products**: Posting gear you do not own or possess.
2. **Unrealistic Pricing / Fake Deals**: Listing premium hardware (e.g., RTX 4090 or PS5) at absurdly low prices to entice advance UPI transfers.
3. **Stolen Photos**: Using downloaded internet images or photos copied from other user listings.
4. **Advance Payment Scams**: Demanding courier fees, token advances, or reservation deposits before allowing physical inspection.
5. **Impersonation**: Pretending to represent GGS administrators, moderators, or verified corporate sellers.
6. **Counterfeit & Pirated Goods**: Counterfeit hardware, clone controllers, cracked digital keys, or stolen accounts.

---

## 💡 Best Practices for Safe Transactions

### 1. Meet in a Safe, Public Location
- Always arrange physical meetups in well-lit, public spaces (e.g., popular malls, metro stations, coffee shops, or gaming cafes).
- Never meet in secluded or unfamiliar areas.

### 2. Inspect & Test Hardware Before Paying
- **GPUs / Components**: If buying high-end graphics cards or motherboards, request a video showing benchmark stress tests (e.g., FurMark, 3DMark) or test at a mutually agreed local PC shop.
- **Consoles**: Power on the console, check HDMI output, test controller inputs, verify Wi-Fi connectivity, and ensure the console is not banned from online networks (PSN / Xbox Live / Nintendo eShop).
- **Laptops / Monitors**: Check for dead pixels, screen backlight bleed, keyboard switches, and battery health reports.

### 3. Avoid Suspicious Payment Requests
- Never scan untrusted QR codes or approve reverse UPI collect requests.
- Pay only after you have physically inspected and verified the gear.
- Never share OTPs (One-Time Passwords) or banking credentials with anyone.

---

## 🚨 How to Report Suspicious Activity

If you encounter an ad, seller, buyer, or chat message that appears fraudulent, deceptive, or violating our rules:

1. Click **Report** on the listing card or inside the chat window.
2. Choose the appropriate reason (*Fake Deal, Scam, Counterfeit, Stolen Photos, Spam*).
3. Provide any supporting context or screenshots.
4. Or submit a detailed ticket directly via our [Support Portal](/page/contact).
`
  },
  {
    slug: 'prohibited-items',
    title: 'Prohibited Items Policy',
    content: `# Prohibited Items Policy

To protect our marketplace and comply with legal regulations, the following items may **not** be listed, sold, or exchanged on GGS:

---

## 1. Prohibited Hardware & Physical Items
- Stolen, looted, or misappropriated hardware.
- Counterfeit electronics, clone graphics cards, or fake console accessories.
- Hardware with removed, altered, or defaced serial numbers.
- Defective or dead hardware sold under the guise of working condition without explicit disclosure.

---

## 2. Prohibited Digital Goods & Services
- Hacked, stolen, or compromised gaming accounts (Steam, PSN, Xbox, Epic, Riot).
- Cheats, aimbots, wallhacks, exploits, or illicit automation scripts.
- Pirated game ROMs, cracked software, or unauthorized digital keys.
- Services promoting unauthorized game modifications or illegal digital bypasses.

---

## 3. General Prohibited Items
- Non-gaming related unrelated goods and bulk commercial spam.
- Any goods or materials that violate Indian law.

Violations will lead to listing removal without refund and immediate account restriction.
`
  },
  {
    slug: 'verified-sellers',
    title: 'Verified Sellers Program',
    content: `# Verified Sellers Program

The **GGS Verified Seller** badge is an official trust indicator awarded to marketplace sellers who have completed administrative identity screening and KYC verification.

---

## 🌟 Benefits of Becoming a Verified Seller

- **Verified Trust Badge**: A visible green badge displayed prominently on your profile and all your active listings.
- **Higher Buyer Confidence**: Local Kerala buyers prioritize verified traders when purchasing valuable hardware.
- **Faster Moderation & Priority Support**: Expedited review of new listings and priority support ticket handling.
- **Featured Marketplace Placement**: Enhanced visibility across category searches.

---

## 📋 How Verification Works

1. **Submit KYC in Dashboard**: Navigate to **Dashboard → Profile & Settings → Seller Verification**.
2. **Submit Identification Details**: Provide your government ID type (Aadhaar, Passport, Driving License, or Voter ID), masked document number, and clear document photograph.
3. **Admin Review**: Our administrative moderation team verifies the legitimacy of the submitted information.
4. **Approval**: Upon approval by an administrator, the Verified Seller badge is activated immediately.

*Note: All verification data is held strictly private under our [Privacy Policy](/page/privacy) and is never shared with third parties or shown to the public.*
`
  },
  {
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    content: `# GGS Community Guidelines

**Building a Safe, Respectful, and Transparent Gaming Hardware Marketplace in Kerala**

At **Game Gear Swap (GGS)**, our mission is to provide an authentic, trustworthy platform where gamers, PC enthusiasts, and hardware builders can trade pre-owned gear with complete peace of mind. These Community Guidelines set the standard of conduct expected from every member.

---

## 1. What You Should Do (Community Best Practices)

- **Be Respectful and Honest**: Treat fellow gamers with courtesy. Accurately describe the condition, history, working state, and specifications of your hardware.
- **Meet in Safe Public Locations**: Conduct trades in well-lit, public meeting spots (malls, metro stations, gaming cafes, or reputable local computer repair shops).
- **Inspect and Test Before Paying**: Request live benchmark runs (FurMark, GPU-Z, Cinebench) and test consoles for online network connectivity before completing payments.
- **Confirm UPI Transactions on Your Own Device**: When selling, always verify that funds have credited your own mobile banking app before handing over the gear. Never rely solely on a buyer's phone screenshot.
- **Keep Conversations In-App**: Use GGS in-app chat to protect your personal contact details and ensure a documented transaction history.
- **Report Genuine Violations**: If you encounter suspicious deals, fake hardware, or harassment, submit a report with clear evidence to assist our moderation team.

---

## 2. What You Should Not Do (Prohibitions & Zero Tolerance)

The following activities are strictly prohibited and will result in **immediate account suspension, ad removal, and permanent forfeiture of verification**:

- **No Advance Payment Demands**: Never demand courier fees, token advances, or reservation deposits before allowing physical inspection.
- **No Counterfeit, Stolen, or Modified Hardware**: Selling stolen equipment, clone accessories, or GPUs with modified/flashed BIOS firmware is strictly prohibited.
- **No Harassment, Threats, or Abuse**: Bullying, hate speech, abusive language, or discriminatory behavior in chats or reviews will not be tolerated.
- **No Spamming or Duplicate Listings**: Do not flood the marketplace with identical posts or create fake duplicate accounts to manipulate visibility.
- **No Scams or Phishing**: Sending reverse QR codes, malicious links, or attempting account takeovers will lead to immediate reporting to cyber police authorities.
- **No Off-Platform Coercion**: Forcing buyers or sellers to complete deals off-platform to evade safety safeguards is barred.

---

## 3. Reporting & Moderation Enforcement

- **How to Report**: Use the **Report** button on any listing or in any chat conversation to submit a report.
- **Decision Transparency**: All reports and support tickets are reviewed by administrators. You can track the status, administrative decision, and official remarks in your **Dashboard → Tickets & Reports**.
- **Good Faith Reporting**: Reports must be submitted in good faith. Misusing the report system to harass other sellers is a policy violation.

---

## 4. Need Assistance?

If you have questions or encounter an issue, please contact our administrative support team through our [Support Portal](/page/contact).
`
  }
];

const BLOG_POSTS = [
  {
    title: 'Welcome to GGs: Kerala\'s Dedicated Gaming Hardware Marketplace',
    slug: 'welcome-to-ggs',
    excerpt: 'Discover why Game Gear Swap was built, how our localized platform operates, and how we protect gamers across all 14 districts of Kerala.',
    category: 'Announcements',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    tags: ['Welcome', 'Community', 'KeralaGaming', 'Marketplace'],
    views_count: 2450,
    content: `# Welcome to GGs: Kerala's Dedicated Gaming Hardware Marketplace

Welcome to **Game Gear Swap (GGS)**, Kerala's first community-driven peer-to-peer marketplace engineered exclusively for gamers, PC enthusiasts, and hardware builders!

---

## 🎮 Why GGS Exists

For years, local gamers across Kerala faced the same frustrations on generic classifieds: spam bots, suspicious advance payment demands, misleading hardware descriptions, and lack of specialized PC filtering.

GGS was created to solve these exact problems. Whether you are upgrading your graphics card, hunting for rare console editions, swapping mechanical keyboards, or building a custom water-cooled rig, GGS connects you directly with passionate, verified gamers in your neighborhood.

---

## 🛡️ What Makes GGS Different

1. **Anti-Spam Architecture**: A nominal ₹10 listing service fee (₹8.47 + 18% GST) prevents bot farms and spam syndicates from flooding our marketplace.
2. **Kerala-Centric Location Filtering**: Search and filter by all 14 Districts, Taluks, and Local Areas.
3. **Hardware-Specific Attributes**: Filter by exact VRAM, CPU generation, switch types, monitor refresh rates, and console revisions.
4. **Verified Seller Badges**: Completed KYC screening gives buyers peace of mind.
5. **In-App Real-Time Messaging**: Chat safely without revealing your personal phone number until you choose to.

---

## 🚀 How to Get Started

- **Browse the Marketplace**: Explore hundreds of verified listings across [Marketplace](/marketplace) and [Categories](/categories).
- **Read Our User Guide**: Check out our comprehensive [User Guide](/guide) for step-by-step instructions.
- **Join the Community**: Create your account, verify your profile, and start trading today!
`
  },
  {
    title: 'How to Create Your First Post on GGs: Complete Step-by-Step Guide',
    slug: 'how-to-create-your-first-post',
    excerpt: 'Step-by-step posting guide: creating a title, choosing categories, adding custom specs, uploading photos, setting Kerala locations, and publishing your ad.',
    category: 'Seller Guides',
    cover_image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    tags: ['Posting', 'Selling', 'Guide', 'Tutorial'],
    views_count: 1890,
    content: `# How to Create Your First Post on GGs: Complete Step-by-Step Guide

Selling your gaming equipment on GGS is designed to be clear, fast, and structured for maximum buyer engagement. Follow this comprehensive guide to publish your first ad.

---

## Step 1: Sign In and Click 'Sell'

Log into your account and click the **+ Sell (Post Your Ad)** button in the top navigation bar.

---

## Step 2: Title & Category Selection

- **Descriptive Title**: Include brand, model, and key highlight (e.g., *MSI GeForce RTX 4070 Gaming X Trio 12GB - Pristine with Box & Bill*).
- **Category & Subcategory**: Select the precise category (e.g., *PC Components → Graphics Cards* or *Gaming Consoles → PlayStation*).

---

## Step 3: Condition & Custom Specifications

- **Honest Condition**: Choose *Brand New, Like New, Excellent, Good,* or *Fair*.
- **Add Key Specs**: Add custom spec rows such as VRAM Capacity, Processor Model, Storage Health, or Warranty remaining.

---

## Step 4: Upload Original Photography

- Upload 1 to 5 clear, authentic photos of your actual unit.
- Show ports, serial number stickers, and original accessories.

---

## Step 5: Price & Kerala Location

- Set a fair price between ₹1 and ₹10,00,000.
- Select your **District, Taluk, and Area**, and position your pickup pin on Google Maps.

---

## Step 6: Pay the ₹10 Service Fee & Publish

- Review the transparent fee: ₹8.47 Base + ₹1.53 GST = ₹10.00 Total.
- Complete payment via UPI or Card to publish your ad live across Kerala!
`
  },
  {
    title: 'How to Report Content Responsibly on GGs',
    slug: 'how-to-report-content-responsibly',
    excerpt: 'Learn when to report listings or users, how our moderation team reviews tickets, and how to track admin decisions on your dashboard.',
    category: 'Safety Guides',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    tags: ['Reporting', 'Safety', 'Moderation', 'Transparency'],
    views_count: 1540,
    content: `# How to Report Content Responsibly on GGs

Maintaining a safe and trustworthy community is a shared responsibility. Here is everything you need to know about reporting suspicious content and tracking moderation resolutions.

---

## When to Submit a Report

You should submit a report if you encounter:
- **Fake Listings / Scam Deals**: Absurdly cheap prices with advance payment demands.
- **Counterfeit or Stolen Hardware**: Items with removed serial numbers or flashed BIOS firmware.
- **Harassment or Threats**: Abusive messages, foul language, or discriminatory conduct in chat.
- **Prohibited Goods**: Banned online accounts, cheats, malware, or pirated software.

---

## How to Submit a Report

1. **On Listings**: Click the **Report** button on any listing card or product detail page.
2. **In Chat**: Click the three dots inside the conversation and select **Report Chat**.
3. **Support Portal**: Submit a detailed ticket via our [Contact Support](/page/contact) page.

---

## Transparent Admin Decisions

Unlike other platforms where reports vanish into a black hole, GGS features full **Admin Decision & Remark Transparency**:
- Open your **Dashboard → Tickets & Reports**.
- View the real-time status: *Under Review, Resolved,* or *Rejected*.
- Read the official **Admin Remark** explaining the decision taken.

---

## Good Faith Participation

Reports must be submitted truthfully. Filing false reports against competing sellers is a violation of our Terms and can lead to account penalties.
`
  },
  {
    title: 'GGs Community Guidelines: What to Do and What Not to Do',
    slug: 'community-guidelines-what-to-do-and-not-to-do',
    excerpt: 'The fundamental standards of conduct for buyers, sellers, and hardware builders on Game Gear Swap.',
    category: 'Community',
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    tags: ['Guidelines', 'Rules', 'Safety', 'Community'],
    views_count: 2120,
    content: `# GGs Community Guidelines: What to Do and What Not to Do

To preserve a welcoming and secure marketplace for Kerala's gaming community, all members agree to follow these core guidelines.

---

## ✅ What You Should Do

1. **Communicate Clearly & Respectfully**: Answer questions about your gear honestly and respond to buyer inquiries promptly.
2. **Meet in Safe Public Locations**: Conduct trades in public spots like shopping malls, tech cafes, or local computer shops.
3. **Test Hardware in Person**: Perform stress tests and verify console online connectivity before paying.
4. **Verify UPI Transfers on Your Device**: Ensure payments have settled in your own banking app before handing over hardware.

---

## ❌ What You Should Not Do

1. **Never Demand Advance Shipping Fees**: Demanding courier deposits before in-person inspection is strictly forbidden.
2. **No Counterfeit or Defective Goods**: Do not sell faulty hardware disguised as working condition.
3. **No Off-Platform Deal Coercion**: Do not pressure users to move transactions off the platform to bypass security safeguards.
4. **No Spam or Engagement Manipulation**: Do not create duplicate accounts or spam listings.
`
  },
  {
    title: 'Tips for Better Community Discussions & Safe Deals',
    slug: 'tips-for-better-community-discussions',
    excerpt: 'Practical communication etiquette, effective negotiation tips, and hardware inquiry advice for buyers and sellers on GGS.',
    category: 'Buyer Guides',
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    tags: ['Negotiation', 'Communication', 'Deals', 'Tips'],
    views_count: 1780,
    content: `# Tips for Better Community Discussions & Safe Deals

Clear, respectful communication leads to faster deals, better prices, and lasting positive reputation in the gaming community. Here are practical tips for negotiating and trading effectively on GGS.

---

## 1. Tips for Buyers

- **Ask Specific Technical Questions**: Inquire about purchase date, original GST invoice, remaining warranty, and past stress-test thermals.
- **Make Reasonable Offers**: Respect the seller's asking price. Extreme lowballing (e.g., offering ₹10,000 for a ₹40,000 GPU) is unproductive.
- **Propose Safe Meetup Locations**: Suggest well-known tech spots in your district where power outlets and test benches are accessible.

---

## 2. Tips for Sellers

- **Be Transparent About Flaws**: Mention any minor cosmetic scratches, missing box accessories, or fan noise upfront.
- **Provide Verification Videos**: Be willing to share a short video clip showing the hardware running benchmark tests.
- **Update Listing Status**: Once an item is sold, promptly mark it as sold in your dashboard to avoid disappointing other buyers.

---

## 3. Building Community Trust

Leave honest ratings and reviews after completing a deal. Positive feedback builds your credibility as a trusted gamer and seller in Kerala!
`
  },
  {
    title: 'How to Sell a Product on GGS: Complete Step-by-Step Guide',
    slug: 'how-to-sell-on-ggs',
    excerpt: 'Everything you need to know about creating an ad, setting realistic prices, adding specs, and closing safe sales on Kerala’s gaming marketplace.',
    category: 'Seller Guides',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    tags: ['Selling', 'Guide', 'Marketplace', 'Tips'],
    views_count: 1420,
    content: `# How to Sell a Product on GGS: Complete Step-by-Step Guide

Selling your pre-owned gaming gear on **Game Gear Swap (GGS)** is straightforward, safe, and designed specifically for Kerala's gaming community. Follow this comprehensive guide to get your listing live and connect with buyers quickly.

---

## Step 1: Create or Sign In to Your GGS Account

Before posting an ad, sign up using your email or mobile number. Ensure your **Full Name** and contact preferences are accurately configured in your profile.

---

## Step 2: Navigate to 'Post Your Ad'

Click the **Sell** or **Post Your Ad** button in the main header navigation.

---

## Step 3: Fill Out Accurate Listing Details

- **Title**: Write a clear, descriptive title including the brand and model (e.g., *NVIDIA RTX 4070 Ti 12GB - Like New with Box & Bill*).
- **Category & Subcategory**: Choose the appropriate category (e.g., *Graphics Cards*, *Gaming Consoles*, *Custom PCs*).
- **Condition**: Select an honest condition rating (*Brand New, Like New, Excellent, Good, Fair*).
- **Pricing**: Set a fair, competitive price based on current market trends. Choose Fixed Price, Negotiable, or Exchange.

---

## Step 4: Add Detailed Hardware Specifications

Take advantage of our custom specification rows:
- Add key specs like CPU, RAM, Storage capacity, VRAM, and Warranty remaining.
- Full System listings support up to 10 detailed spec lines; other categories support up to 5 lines.

---

## Step 5: Upload High-Quality Original Photos

- Upload 1 to 5 clear, well-lit photos of the actual physical product.
- Include angles showing ports, serial number labels, original packaging, and accessories.
- The first photo will serve as your listing's cover image.

---

## Step 6: Select Your Kerala Location

- Pick your **District** (e.g., *Ernakulam, Kozhikode, Thrissur, Thiruvananthapuram*).
- Select your **Taluk** and **Local Town/Village**.
- Use the interactive Google Map pin to pinpoint pickup coordinates.

---

## Step 7: Pay the ₹10 Listing Service Charge

Review the itemized breakdown:
- **Listing Service Charge**: ₹8.47
- **GST (18%)**: ₹1.53
- **Total Payable**: ₹10.00

Read and check the **No-Refund Policy Acknowledgement**, select your payment method (UPI, Card, or Net Banking), and complete the payment.

---

## Step 8: Respond to In-App Messages & Coordinate Safe Meetups

Once live, interested buyers will contact you via in-app chat. Agree upon a mutually convenient public location in Kerala to demo and complete the swap!
`
  },
  {
    title: 'How to Spot a Good Used Gaming Gear Deal in Kerala',
    slug: 'how-to-spot-good-used-gaming-gear-deal',
    excerpt: 'Learn how to evaluate market values, inspect hardware history, verify warranties, and identify authentic gaming bargains.',
    category: 'Buying Guides',
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    tags: ['Buying', 'PC Gaming', 'Kerala', 'Deals'],
    views_count: 2180,
    content: `# How to Spot a Good Used Gaming Gear Deal in Kerala

Finding great value in the pre-owned gaming market requires a keen eye and disciplined evaluation. Here is how seasoned gamers find authentic bargains while avoiding lemons.

---

## 1. Benchmark Pre-Owned Market Value

Before contacting a seller, check current retail prices and recent second-hand trade prices across Kerala. 
- A reasonable discount for 1-to-2-year-old hardware in pristine condition is typically **25% to 40% off the current new retail price**.
- Be skeptical of prices discounted by **70% or more on current-generation hardware**; these are often scam attempts.

---

## 2. Inquire About Purchase History & Original Invoices

Always ask the seller:
- When and where was the item purchased (local Kerala retailer vs online)?
- Is the original tax invoice and retail box available?
- Does the serial number on the invoice match the physical unit?

---

## 3. Verify Remaining Manufacturer Warranty

Leading hardware manufacturers (ASUS, MSI, Gigabyte, Zotac, Corsair) provide serial-number warranty lookup on their official portals. Ask the seller for the serial number to verify exact warranty expiration dates.

---

## 4. Prioritize Verified Sellers

Look for the green **Verified Seller** badge on GGS. These sellers have completed administrative KYC identity verification, giving you added peace of mind.
`
  },
  {
    title: 'Top 5 Scams to Avoid When Buying Used Gaming Gear',
    slug: 'top-5-scams-avoid-buying-used-gaming-gear',
    excerpt: 'Essential anti-scam awareness for gamers: advance payment tricks, fake invoice traps, stolen photo schemes, and how to stay 100% protected.',
    category: 'Scam Awareness',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    tags: ['Safety', 'Scams', 'AntiFraud', 'Tips'],
    views_count: 3840,
    content: `# Top 5 Scams to Avoid When Buying Used Gaming Gear

Peer-to-peer marketplaces offer tremendous deals, but scammers occasionally attempt deceptive tactics. Here are the top 5 scams to watch out for and how to protect yourself.

---

## 1. The 'Advance Courier / Token Deposit' Scam

**The Tactic**: The seller lists an enticing deal (e.g., PS5 for ₹22,000) and claims they are in a different district (e.g., Kasaragod or Idukki). They ask for a ₹1,000 to ₹3,000 "advance shipping deposit" via Google Pay before shipping. Once paid, they block communication.

**Protection Rule**: **Never send advance payments or courier tokens to unverified strangers**. Always inspect the gear in person before paying.

---

## 2. Stolen Photos with Fake Watermarks

**The Tactic**: Fraudsters download high-resolution photos from Reddit or international forums, crop them, and claim they are original photos.

**Protection Rule**: Ask the seller to take a quick photo or short video holding a piece of paper with today’s date and their GGS username written on it next to the gear.

---

## 3. The Reverse UPI QR Code / Collect Request Trick

**The Tactic**: A fraudulent buyer contacts you claiming they want to buy your gear immediately. They send you a UPI QR code or payment request saying, *"Scan this QR code to receive the money."*

**Protection Rule**: Remember: **Entering your UPI PIN ALWAYS DEDUCTS money from your bank account**. You never need to scan a QR code or enter a PIN to receive payments.

---

## 4. Counterfeit GPUs with Flashed BIOS

**The Tactic**: Old, low-tier graphics cards (like an old GTS 450) with flashed BIOS firmware modified to report as an "RTX 3060" in Windows Device Manager.

**Protection Rule**: Run **GPU-Z** during physical testing. GPU-Z accurately identifies fake BIOS firmware and displays a prominent warning.

---

## 5. Banned or Region-Locked Consoles

**The Tactic**: Selling a PlayStation 5 or Nintendo Switch that has been permanently hardware-banned from online networks (PSN / eShop) due to fraudulent credit cards or hacked software.

**Protection Rule**: Connect the console to Wi-Fi at the meetup and verify that you can log into the official network store without error codes.
`
  },
  {
    title: 'How to Check a Used Graphics Card (GPU) Before Buying',
    slug: 'how-to-check-used-graphics-card',
    excerpt: 'Step-by-step technical testing guide: FurMark stress tests, GPU-Z checks, temperature curves, VRAM artifacts, and thermal pad inspection.',
    category: 'Technical Guides',
    cover_image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
    tags: ['GPU', 'Hardware', 'Testing', 'PCBuilding'],
    views_count: 2750,
    content: `# How to Check a Used Graphics Card (GPU) Before Buying

Graphics cards are the most valuable component in a gaming rig. Here is an essential checklist to thoroughly test a pre-owned GPU before closing a deal.

---

## 1. Physical & Visual Inspection

- **PCIe Connector Pins**: Check for chipped, scratched, or missing gold contact pins.
- **Fan Bearings**: Spin each fan gently with your finger. They should spin smoothly without wobbling, grinding noise, or stiffness.
- **Heatsink Oxidation**: Check for white powdery corrosion or green oxidation on copper heatpipes.
- **Tamper Warranty Stickers**: Check if the screw sticker over the GPU core bracket has been punctured or removed (indicating past disassembly).

---

## 2. Technical Diagnostic Software Tools

Bring a bootable USB drive or test PC with the following diagnostic tools:
- **GPU-Z**: Verifies model number, VRAM vendor (Samsung, Micron, Hynix), bus width, and BIOS authenticity.
- **FurMark (Kombustor)**: High-load stress test to check thermal stability and power draw under load.
- **3DMark (TimeSpy / FireStrike)**: Comprehensive DirectX rendering test to detect frame hitching and VRAM artifacts.
- **HWiNFO64**: Real-time sensor monitoring for GPU Hotspot and VRAM junction temperatures.

---

## 3. Temperature Thresholds to Expect

During a 15-minute FurMark stress test:
- **Core Temperature**: Should remain below **75°C to 80°C** under full load.
- **Hotspot Temperature**: Should generally stay within **15°C to 20°C** of core temperature (under **95°C**).
- **Fan Curve**: Fans should ramp up progressively without rattling.
`
  },
  {
    title: 'What to Check Before Buying a Used Gaming Console (PS5, Xbox, Switch)',
    slug: 'what-to-check-before-buying-used-console',
    excerpt: 'Comprehensive buyer checklist for PlayStation 5, Xbox Series X/S, and Nintendo Switch consoles: HDMI ports, optical drives, stick drift, and online bans.',
    category: 'Console Guides',
    cover_image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
    tags: ['PlayStation', 'Xbox', 'NintendoSwitch', 'Console'],
    views_count: 1980,
    content: `# What to Check Before Buying a Used Gaming Console (PS5, Xbox, Switch)

Buying a pre-owned gaming console is an affordable way to enjoy current-generation titles. Follow this checklist to ensure the console is in top mechanical and digital condition.

---

## 1. Test the HDMI Port & Video Output
HDMI port damage is the #1 physical failure point on pre-owned consoles.
- Plug the HDMI cable firmly into the console and gently nudge the cable base. The TV picture should remain rock-solid without flickering or disconnecting.
- Verify 4K / 120Hz output settings in the console display menu.

---

## 2. Test the Optical Disc Drive (For Disc Editions)
- Insert a PS5/PS4 or Xbox game disc.
- Listen to the drive mechanism: disc insertion and ejection should be smooth without mechanical grinding.
- Ensure the console reads and begins installing the game data without "Unrecognized Disc" errors.

---

## 3. Check for Network & PSN/Xbox Live Bans
- Connect the console to your mobile hotspot or Wi-Fi.
- Open the PlayStation Store / Xbox Store / Nintendo eShop.
- Attempt to sign in with an account. If the console displays error code **WS-37368-7** (PS5) or similar, the console hardware has been permanently banned.

---

## 4. Test Gamepad Controller & Stick Drift
- On Nintendo Switch, open **Settings → Controllers and Sensors → Calibrate Control Sticks**.
- On PS5 / Xbox, launch a test game or browser controller tester to confirm thumbsticks center at 0.0 with zero ghost drift.
`
  },
  {
    title: 'How to Price Used Gaming Gear in Kerala',
    slug: 'how-to-price-used-gaming-gear',
    excerpt: 'A seller guide on how to calculate realistic depreciation, factor in warranty value, and price your gear for fast, profitable sales.',
    category: 'Seller Guides',
    cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    tags: ['Pricing', 'Selling', 'Kerala', 'Economics'],
    views_count: 1620,
    content: `# How to Price Used Gaming Gear in Kerala

Setting the right price is the difference between an ad that sits unsold for months and one that sells within 48 hours. Here is how to price your gear competitively while maximizing your return.

---

## 1. The Rule of Hardware Depreciation

- **Hardware < 6 months old (with Box & Bill)**: 10% to 15% below the lowest current new retail price.
- **Hardware 6 to 18 months old (with active warranty)**: 25% to 35% below current new retail price.
- **Hardware > 2 years old (out of warranty)**: 45% to 60% below original purchase price, factored against modern equivalent performance.

---

## 2. Price Against Modern Equivalents, Not Historical Spend

Technology moves fast. If you bought an RTX 2080 Ti for ₹1,10,000 four years ago, remember that a brand-new ₹30,000 modern GPU (like the RTX 4060) matches or exceeds its performance with lower power draw and DLSS 3 support. Price your gear relative to what a buyer can purchase today for the same money.

---

## 3. The Value of Original Packaging & Invoices

Having the original retail box, accessories, and GST tax invoice adds **10% to 15% tangible resale value** because it provides transferrable warranty proof and safe transport packaging.
`
  },
  {
    title: 'Best Practices for Safe Local Gaming Gear Deals in Kerala',
    slug: 'safe-local-gaming-gear-deals',
    excerpt: 'Top recommended public meeting spots across Kochi, Kozhikode, Trivandrum, Thrissur, and guidelines for testing hardware in person.',
    category: 'Safety Guides',
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    tags: ['Safety', 'Kerala', 'LocalDeals', 'Meetups'],
    views_count: 2490,
    content: `# Best Practices for Safe Local Gaming Gear Deals in Kerala

Conducting transactions locally across Kerala is the safest and most rewarding way to buy and sell pre-owned hardware. Here are practical tips for smooth, secure meetups.

---

## 1. Choose Public, Neutral Meeting Locations

Recommended public meetup spots in Kerala:
- **Kochi**: Lulu Mall (Edappally), Centre Square Mall (MG Road), Ernakulam South Metro Station, or well-known tech cafes.
- **Kozhikode**: Focus Mall, HiLITE Mall (Bypass), or Calicut Beach promenade during daytime.
- **Thiruvananthapuram**: Mall of Travancore, Lulu Mall (Akkulam), or Statue junction.
- **Thrissur**: Sobha City Mall, Swaraj Round cafe spots.

---

## 2. In-Store Hardware Testing Collaboration

For high-value components (e.g., custom rigs or motherboards):
- Many local computer repair and gaming cafes in Kerala will test components on their bench for a small nominal diagnostic fee (₹100–₹200).
- Propose meeting at a reputable local computer shop where power and test monitors are readily available.

---

## 3. Confirm Digital UPI Payments on Your Own Device

When receiving payment via Google Pay, PhonePe, or Paytm:
- Do not rely solely on the buyer showing you a screenshot on their phone.
- **Check your own mobile banking app or SMS alert** to confirm the funds have settled into your account before handing over the gear.
`
  },
  {
    title: 'Used PC Buying Checklist: Essential Tests & Inspection',
    slug: 'used-pc-buying-checklist',
    excerpt: 'Comprehensive step-by-step checklist when buying a complete pre-owned gaming desktop in Kerala: PSU health, SSD life, CPU thermals, and RAM stability.',
    category: 'PC Building',
    cover_image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    tags: ['CustomPC', 'Checklist', 'PCBuilding', 'GamingDesktop'],
    views_count: 2110,
    content: `# Used PC Buying Checklist: Essential Tests & Inspection

Buying a complete pre-built or custom used gaming desktop can save thousands of rupees compared to assembling from scratch. Follow this inspection workflow when evaluating a complete rig.

---

## 1. Power Supply Unit (PSU) Inspection
- Check the PSU brand and 80-Plus efficiency rating (Bronze, Gold, Platinum).
- Never compromise on tier-rated power supplies (Corsair, Seasonic, Cooler Master, Deepcool). Avoid unbranded generic power supplies.

---

## 2. Storage Drive Health (SSD / NVMe)
- Run **CrystalDiskInfo**.
- Check the **Health Status percentage** and Total Bytes Written (TBW).
- An SSD with 90%+ health and low bad sector count is in great condition.

---

## 3. CPU Thermals & Cinebench Stress Run
- Run **Cinebench R23 / 2024** multi-core benchmark while monitoring temperatures with HWiNFO64.
- Modern CPUs (Ryzen 5000/7000, Intel 12th-14th Gen) should not thermal throttle continuously above **90°C** under sustained air/AIO cooling.

---

## 4. RAM Memory Stability Test
- Run Windows Memory Diagnostic or **MemTest64** to ensure zero memory address errors.
- Confirm in Task Manager that XMP/DOCP is enabled and running at full advertised MHz speeds.
`
  }
];

async function seedOrUpdateContent() {
  console.log('🌱 Seeding/Updating Static Pages and Blog Content...');

  // Find admin user for author attribution
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne({});
  }
  const authorId = adminUser ? adminUser.id : uuidv4();

  // 1. Seed or Update Static Pages
  for (const page of STATIC_PAGES) {
    await StaticPage.findOneAndUpdate(
      { slug: page.slug },
      {
        $set: {
          title: page.title,
          content: page.content,
          updated_at: new Date().toISOString()
        },
        $setOnInsert: {
          id: uuidv4()
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Seeded/Updated ${STATIC_PAGES.length} Static Pages.`);

  // 2. Seed or Update Blog Posts (including 15 Safety & Fraud Prevention Articles)
  const allBlogPosts = [...BLOG_POSTS, ...SAFETY_BLOG_ARTICLES];
  for (const post of allBlogPosts) {
    await BlogPost.findOneAndUpdate(
      { slug: post.slug },
      {
        $set: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          cover_image: post.cover_image,
          tags: post.tags,
          author_id: authorId
        },
        $setOnInsert: {
          id: uuidv4(),
          views_count: post.views_count || Math.floor(500 + Math.random() * 1500),
          created_at: new Date().toISOString()
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Seeded/Updated ${allBlogPosts.length} Blog Posts.`);
}

module.exports = {
  STATIC_PAGES,
  BLOG_POSTS,
  SAFETY_BLOG_ARTICLES,
  seedOrUpdateContent
};
