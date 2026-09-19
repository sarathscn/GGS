// 15 Dedicated Safety & Fraud Prevention Articles for MongoDB Seeding

const SAFETY_BLOG_ARTICLES = [
  {
    title: 'Fake Listings and Payment Scams: How to Stay Safe on P2P Marketplaces',
    slug: 'fake-listing-payment-scams',
    excerpt: 'Detailed breakdown of fake sellers, advance token scams, forged delivery receipts, and irreversible payment tricks with a practical buyer verification checklist.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&auto=format&fit=crop&q=80',
    tags: ['PaymentSafety', 'ScamPrevention', 'BuyerProtection', 'UPIFraud'],
    views_count: 1420,
    content: `# Fake Listings and Payment Scams: How to Stay Safe on P2P Marketplaces

Peer-to-peer marketplaces allow gamers to find great deals on graphics cards, gaming consoles, and complete PC builds. However, malicious actors frequently exploit buyers through fake listings, advance deposit demands, and non-delivery scams.

This guide provides practical steps to identify deceptive listings, verify genuine sellers, and secure your transactions.

---

## 1. Anatomy of a Fake Marketplace Listing

Scammers rely on psychological triggers—primarily artificial urgency and unrealistically low prices—to bypass a buyer's normal skepticism.

### Typical Characteristics of Fraudulent Listings:
- **Below-Market Pricing:** An RTX 4080 or PS5 listed at 40%–60% below typical market value.
- **Stock or Stolen Photos:** Images ripped from Reddit, eBay, OLX, or YouTube review thumbnails with no custom timestamp.
- **Vague Component Descriptions:** Generic terms like "superfast gaming i7 PC with 8GB graphics" without specifying CPU generation or exact GPU model numbers.
- **Reluctance for In-Person Inspection:** The seller invents elaborate excuses to avoid local face-to-face meetups.

---

## 2. Common Payment & Deposit Scams

### A. The "Urgent Token Deposit" Trap
The seller claims multiple other buyers are offering higher amounts, demanding an immediate advance deposit (₹500 to ₹5,000) via UPI to "hold the item." Once money is transferred, the seller blocks the buyer.

### B. The Non-Delivery & Fake Courier Slip Scam
After receiving payment, the seller sends an edited or forged tracking slip with a non-existent courier or claims the package is held at a transport checkpoint requiring an additional "insurance clearance fee."

---

## 3. How to Verify a Seller Before Paying

1. **Request Timestamped Custom Proof:** Ask the seller to place a handwritten piece of paper beside the hardware showing today's date and both usernames.
2. **Reverse Image Search:** Run the listing photos through Google Lens.
3. **Inspect Seller Profile & Verification:** Look for the Verified Seller Badge on GGS.
4. **Prefer Public Meetup Locations:** Schedule meetups at computer cafes or busy public spots.
`
  },
  {
    title: 'How to Verify Used PC Specifications Before You Buy',
    slug: 'verify-used-pc-specifications',
    excerpt: 'Detailed tutorial on validating CPU generations, genuine VRAM, SSD wear levels, and RAM speeds using free diagnostic tools during used PC inspections.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=1200&auto=format&fit=crop&q=80',
    tags: ['PCBuilding', 'HardwareTesting', 'CPUZ', 'GPUZ'],
    views_count: 1890,
    content: `# How to Verify Used PC Specifications Before You Buy

When shopping for a pre-owned gaming rig, relying solely on Windows System Information or DxDiag properties is risky. Deceptive sellers often use generic terms or modified Windows registry entries to mask ancient hardware under modern branding.

---

## 1. Why Exact Model Numbers Matter

A listing describing a machine as an "Intel Core i7 Gaming PC with 8GB Graphics" tells you virtually nothing about performance:
- An Intel Core i7-2600 (2011, 2nd Gen) is obsolete for modern AAA gaming and performs vastly worse than an entry-level modern i3-12100F.
- An "8GB Graphics card" could be a slow AMD RX 580 2048SP OEM or a modern high-performance RTX 4060 8GB.

---

## 2. The 4 Essential Free Diagnostic Tools

1. **CPU-Z:** Checks exact CPU microarchitecture, TDP, socket, and dual-channel RAM frequency.
2. **GPU-Z:** Checks GPU chip codename, shader count, real VRAM type, and BIOS version.
3. **HWiNFO64:** Monitors voltages, thermal throttle status, and power draw.
4. **CrystalDiskInfo:** Evaluates SSD/HDD health percentage and Total Bytes Written (TBW).
`
  },
  {
    title: 'Fake GPU Scams: How to Verify a Used Graphics Card',
    slug: 'fake-gpu-scams',
    excerpt: 'How scammers modify BIOS firmware on ancient cards to spoof RTX and GTX models, with practical methods to detect counterfeit GPUs using GPU-Z and benchmarks.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&auto=format&fit=crop&q=80',
    tags: ['GPUVerification', 'FakeGPU', 'GraphicsCard', 'FurMark'],
    views_count: 2310,
    content: `# Fake GPU Scams: How to Verify a Used Graphics Card

Counterfeit GPUs remain widespread on unmonitored classifieds. In a fake GPU scam, a low-cost, obsolete graphics card has its video BIOS modified (flashed) so that Windows and Device Manager identify it as a modern GTX or RTX card.

---

## 1. Physical & Listing Red Flags

- **Obsolete Video Ports:** If a supposed GTX 1060 or RTX card features an analog blue VGA (D-Sub) connector, it is 100% fake. Modern cards do not support analog VGA.
- **Generic PCB with No Branding:** Authentic AIB manufacturers use custom branded matte PCBs with manufacturer serial stickers.

---

## 2. Detecting Fake GPUs Using GPU-Z

The free TechPowerUp GPU-Z tool evaluates the device ID against known chip characteristics. If a mismatch exists, it displays **[FAKE]** in yellow text next to the GPU name.
`
  },
  {
    title: 'Buying a Used Mining GPU: Risks, Checks, and What to Know',
    slug: 'used-mining-gpu-guide',
    excerpt: 'Balanced, objective guide on evaluating former crypto-mining GPUs: understanding memory degradation, custom VBIOS restoration, fan wear, and thermal repasting.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=1200&auto=format&fit=crop&q=80',
    tags: ['MiningGPU', 'HardwareTesting', 'Thermals', 'CryptoHardware'],
    views_count: 1750,
    content: `# Buying a Used Mining GPU: Risks, Checks, and What to Know

A well-maintained, undervolted mining card kept in a climate-controlled room can outlast a GPU abused in a dusty gaming case. Here is how to evaluate ex-mining graphics cards safely.

---

## Key Components Vulnerable to Mining Wear:
1. **Cooling Fan Bearings:** Sleeve bearings run for 10,000+ hours may develop wobble or rattling noises.
2. **GDDR6X Memory Junction Thermals:** Check memory junction temperature in HWiNFO64 during a 15-minute Time Spy loop (should stay under 95°C).
3. **Modified Mining VBIOS:** Restore stock manufacturer VBIOS using ATIFlash/NVFlash if custom mining firmware was installed.
`
  },
  {
    title: 'How to Test Used Gaming Hardware Before Paying',
    slug: 'test-used-gaming-hardware',
    excerpt: 'Device-specific inspection routines for gaming PCs, graphics cards, PlayStation/Xbox consoles, mechanical keyboards, gaming mice, and high-refresh monitors.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    tags: ['HardwareTesting', 'ConsoleTesting', 'MonitorTesting', 'QualityAssurance'],
    views_count: 2680,
    content: `# How to Test Used Gaming Hardware Before Paying

Never hand over cash or initiate a bank transfer without testing high-value electronics under load for 15–20 minutes.

---

## 1. Testing Complete Gaming PCs & GPUs
- Run Cinebench R23/2024 for CPU multi-core stability.
- Run FurMark/3DMark Time Spy for GPU graphics stability.
- Check that CPU temps remain below 90°C and GPU core stays below 80°C.

---

## 2. Testing PlayStation & Xbox Consoles
- Connect to Wi-Fi and sign in with a test PSN/Xbox account to confirm zero hardware bans.
- Test optical disc drive insertion, reading, and ejection.
`
  },
  {
    title: 'Bait-and-Switch Scams in Used Gaming Hardware: How to Avoid Them',
    slug: 'bait-and-switch-scams',
    excerpt: 'Tactics used by deceptive sellers to swap advertised components for inferior substitutes at the point of exchange, and how to verify exact parts on delivery.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=1200&auto=format&fit=crop&q=80',
    tags: ['BaitAndSwitch', 'ConsumerSafety', 'DisputeResolution', 'HardwareAuditing'],
    views_count: 1540,
    content: `# Bait-and-Switch Scams in Used Gaming Hardware: How to Avoid Them

In a bait-and-switch scam, a seller advertises a premium gaming component but delivers an inferior, damaged, or stripped-down version during the final handover.

---

## How to Protect Yourself:
1. Save full screenshots of the original listing description and serial numbers.
2. Confirm the exact component list in chat prior to meeting.
3. Open the PC side panel and match serial numbers before completing payment.
`
  },
  {
    title: 'How to Avoid Stolen or Account-Locked Gaming Devices',
    slug: 'stolen-account-locked-devices',
    excerpt: 'Detailed instructions to verify console serial numbers, perform complete factory resets, detect online PSN/Xbox hardware bans, and avoid iCloud/MDM-locked laptops.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80',
    tags: ['ConsoleSafety', 'PS5Bans', 'AccountLock', 'DeviceIntegrity'],
    views_count: 1980,
    content: `# How to Avoid Stolen or Account-Locked Gaming Devices

Buying a pre-owned PlayStation 5, Xbox Series X, or gaming laptop can result in a total loss if the device is hardware-banned by the manufacturer or locked to a previous owner's account.

---

## Mandatory Verification Steps:
1. Perform a live factory reset in front of the seller.
2. Connect to Wi-Fi and complete the setup wizard to confirm online login succeeds without ban error codes.
3. Verify the serial number barcode sticker has not been defaced or removed.
`
  },
  {
    title: 'Fake Payment and Courier Scams: Protect Yourself When Selling Online',
    slug: 'fake-payment-courier-scams',
    excerpt: 'Crucial safety guide for sellers on recognizing edited payment confirmations, reverse QR code fraud, fake bank verification emails, and bogus courier pickups.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1556742049-0a67c57750c9?w=1200&auto=format&fit=crop&q=80',
    tags: ['SellerProtection', 'PaymentScams', 'UPIFraud', 'SafeSelling'],
    views_count: 2120,
    content: `# Fake Payment and Courier Scams: Protect Yourself When Selling Online

Sellers are frequently targeted by fraudsters using forged payment screenshots, spoofed bank SMS alerts, and reverse QR code traps.

---

## Golden Rules for Sellers:
- **Screenshots are never proof:** Check your own mobile banking app directly.
- **You NEVER enter a UPI PIN to receive money:** Entering a PIN always authorizes an outgoing transfer.
- **Release goods only after ledger balance settlement.**
`
  },
  {
    title: 'Shipping Damage and Empty-Box Scams: Protecting Buyers and Sellers',
    slug: 'shipping-damage-empty-box-scams',
    excerpt: 'Crucial packaging, unboxing, serial-number documentation, and video-evidence protocols to protect both buyers and sellers from transport disputes.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    tags: ['ShippingSafety', 'CourierDisputes', 'UnboxingEvidence', 'PackagingGuide'],
    views_count: 1670,
    content: `# Shipping Damage and Empty-Box Scams: Protecting Buyers and Sellers

Creating an unbroken chain of physical evidence protects honest buyers and sellers from courier transit damage and empty box claims.

---

## Evidence Protocols:
- **Sellers:** Record continuous video of working hardware running a benchmark, packing into box with anti-static wrap, and affixing the label. Ensure courier receipt lists exact package weight.
- **Buyers:** Film an unbroken 360° unboxing video showing sealed shipping label and serial numbers upon delivery.
`
  },
  {
    title: 'Buying Repaired or Refurbished Gaming Hardware: What to Check',
    slug: 'repaired-refurbished-hardware',
    excerpt: 'Distinguishing professional manufacturer refurbished hardware from risky DIY repairs, heat-gun GPU reflows, and undisclosed liquid damage.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&auto=format&fit=crop&q=80',
    tags: ['RefurbishedHardware', 'GPURepair', 'HardwareInspection', 'BGAWork'],
    views_count: 1490,
    content: `# Buying Repaired or Refurbished Gaming Hardware: What to Check

Professional BGA rework and manufacturer-certified refurbished units offer great value, but temporary DIY heat-gun reflows frequently fail within weeks.

---

## What to Inspect:
1. Check bare PCB under light for sticky flux residue around memory chips or MOSFETs.
2. Check for yellowing/browning of green solder mask from excessive heat-gun application.
3. Check liquid contact indicators (LDI dots) inside laptops (must be white, not red/pink).
`
  },
  {
    title: 'How to Protect Your P2P Marketplace Account From Takeover Scams',
    slug: 'account-takeover-prevention',
    excerpt: 'Step-by-step security hardening against phishing links, session token theft, password reuse, and fake customer support agents attempting account compromise.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&auto=format&fit=crop&q=80',
    tags: ['AccountSecurity', 'PhishingProtection', 'CyberSecurity', 'MFA'],
    views_count: 1380,
    content: `# How to Protect Your P2P Marketplace Account From Takeover Scams

Established marketplace accounts with verified badges are targeted by fraudsters to post fake listings and collect advance deposits.

---

## Hardening Steps:
- Enable Multi-Factor Authentication (MFA).
- Never click external login links sent in marketplace chat.
- Official staff will NEVER ask for your password, login OTP, or UPI PIN.
`
  },
  {
    title: 'Chargeback and Refund Abuse: Understanding Marketplace Payment Risks',
    slug: 'chargeback-refund-abuse',
    excerpt: 'Detailed overview of credit card chargeback mechanisms, friendly fraud, false non-delivery claims, and documentation strategies for marketplace sellers.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    tags: ['PaymentRisks', 'ChargebackProtection', 'DisputeRules', 'FriendlyFraud'],
    views_count: 1510,
    content: `# Chargeback and Refund Abuse: Understanding Marketplace Payment Risks

Understanding payment provider rules and establishing clear delivery proof protects sellers against fraudulent payment reversals.

---

## Key Seller Defenses:
- Retain digitally signed courier delivery slips.
- Record physical serial numbers on invoices and confirm with buyer in chat before shipment.
- Use platform escrow and integrated payment records for structured dispute mediation.
`
  },
  {
    title: 'Why You Should Avoid Off-Platform Payments on P2P Marketplaces',
    slug: 'off-platform-payment-scams',
    excerpt: 'Detailed explanation of why fraudsters pressure users into WhatsApp, Telegram, or fake escrow links, and how staying on-platform guarantees protection.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    tags: ['PlatformSafety', 'WhatsAppScams', 'EscrowSafety', 'BuyerSecurity'],
    views_count: 2240,
    content: `# Why You Should Avoid Off-Platform Payments on P2P Marketplaces

Moving conversations to WhatsApp, Telegram, or external links strips away chat audit trails, account verification, and dispute resolution.

---

## Why Scammers Insist on Leaving:
1. To evade automated platform fraud detection filters.
2. To send fake escrow phishing links mimicking the marketplace.
3. To continue scamming even after their marketplace profile is banned.
`
  },
  {
    title: 'Fake Reviews and Reputation Manipulation on P2P Marketplaces',
    slug: 'fake-review-scams',
    excerpt: 'Detailed analysis of feedback fraud: spotting coordinated review rings, generic bot ratings, fake transaction farming, and verifying genuine seller history.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
    tags: ['ReputationSafety', 'ReviewFraud', 'SellerTrust', 'MarketplaceIntegrity'],
    views_count: 1330,
    content: `# Fake Reviews and Reputation Manipulation on P2P Marketplaces

How to spot artificial ratings, coordinated feedback rings, and evaluate a seller's genuine track record.

---

## Red Flags of Fake Feedback:
- Multiple 5-star reviews clustered within minutes of each other on newly registered accounts.
- Generic repetitive comments without specific hardware mentions.
- Look for verified purchase badges and Government ID-verified seller accounts on GGS.
`
  },
  {
    title: 'The Complete Used Gaming Hardware Buying Checklist',
    slug: 'used-gaming-hardware-buying-checklist',
    excerpt: 'The master pillar checklist for buying used PCs, GPUs, consoles, monitors, and peripherals. Print or save this complete pre-payment verification guide.',
    category: 'Safety & Fraud Prevention',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    tags: ['MasterChecklist', 'HardwareGuide', 'SafetyPillar', 'PCInspection'],
    views_count: 3410,
    content: `# The Complete Used Gaming Hardware Buying Checklist

The master pillar checklist covering every step of evaluating and buying used gaming gear:
1. **Price Check:** Compare against current market rates.
2. **Seller Verification:** Check GGS KYC badge and request custom timestamp photo.
3. **Spec Audit:** Verify CPU generation in CPU-Z and GPU chip in GPU-Z.
4. **Physical Check:** Inspect PCB, fan bearings, and serial number stickers.
5. **Stress Test:** Run 15-minute FurMark / Time Spy / Cinebench benchmarks.
6. **Safe Payment:** Pay upon physical inspection or through platform protection.
`
  }
];

module.exports = {
  SAFETY_BLOG_ARTICLES
};
