// GGS Safety & Fraud Prevention Knowledge Base & Article Dataset
// 15 Dedicated Comprehensive Fraud Prevention Articles for Used PC & Gaming Hardware

export const SAFETY_CATEGORY = {
  name: 'Safety & Fraud Prevention',
  slug: 'safety',
  description: 'Comprehensive guides, checklists, and hardware testing procedures to protect gamers, buyers, and sellers on peer-to-peer marketplaces.',
  icon: 'ShieldCheck'
};

export const SAFETY_ARTICLES = [
  {
    id: 'art-01',
    slug: 'fake-listing-payment-scams',
    url: '/blog/safety/fake-listing-payment-scams',
    title: 'Fake Listings and Payment Scams: How to Stay Safe on P2P Marketplaces',
    seoTitle: 'Fake Listings & Payment Scams: Buyer & Seller Safety Guide | GGS',
    metaDescription: 'Learn how to detect fake marketplace listings, advance deposit scams, non-delivery fraud, and unverified payment requests before buying used gaming hardware.',
    primaryKeyword: 'fake listings payment scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Marketplace Trust & Safety',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed breakdown of fake sellers, advance token scams, forged delivery receipts, and irreversible payment tricks with a practical buyer verification checklist.',
    tags: ['PaymentSafety', 'ScamPrevention', 'BuyerProtection', 'UPIFraud'],
    relatedSlugs: [
      'off-platform-payment-scams',
      'fake-payment-courier-scams',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'anatomy-of-fake-listing', title: '1. Anatomy of a Fake Marketplace Listing' },
      { id: 'common-scam-types', title: '2. Common Payment & Deposit Scams' },
      { id: 'warning-signs', title: '3. Immediate Red Flags to Watch Out For' },
      { id: 'seller-verification', title: '4. How to Verify a Seller Before Paying' },
      { id: 'buyer-checklist', title: '5. Pre-Payment Verification Checklist' },
      { id: 'what-to-do', title: '6. What to Do if You Sent Money to a Scammer' }
    ],
    content: `
# Fake Listings and Payment Scams: How to Stay Safe on P2P Marketplaces

Peer-to-peer marketplaces allow gamers to find great deals on graphics cards, gaming consoles, and complete PC builds. However, malicious actors frequently exploit buyers through fake listings, advance deposit demands, and non-delivery scams.

This guide provides practical steps to identify deceptive listings, verify genuine sellers, and secure your transactions.

---

## 1. Anatomy of a Fake Marketplace Listing

Scammers rely on psychological triggers—primarily artificial urgency and unrealistically low prices—to bypass a buyer's normal skepticism.

### Typical Characteristics of Fraudulent Listings:
* **Below-Market Pricing:** An RTX 4080 or PS5 listed at 40%–60% below typical market value.
* **Stock or Stolen Photos:** Images ripped from Reddit, eBay, OLX, or YouTube review thumbnails with no custom timestamp.
* **Vague Component Descriptions:** Generic terms like "superfast gaming i7 PC with 8GB graphics" without specifying CPU generation or exact GPU model numbers.
* **Reluctance for In-Person Inspection:** The seller invents elaborate excuses (traveling for work, remote military posting, family emergency) to avoid local face-to-face meetups.

---

## 2. Common Payment & Deposit Scams

Understanding the mechanics of fraudulent transactions helps you spot them before transferring funds.

### A. The "Urgent Token Deposit" Trap
The seller claims multiple other buyers are offering higher amounts, demanding an immediate advance deposit (₹500 to ₹5,000) via UPI to "hold the item." Once money is transferred, the seller blocks the buyer.

### B. The Non-Delivery & Fake Courier Slip Scam
After receiving payment, the seller sends an edited or forged tracking slip with a non-existent courier or claims the package is held at a transport checkpoint requiring an additional "insurance clearance fee."

### C. Irreversible Payment Methods
Scammers insist on non-refundable payment rails (direct wire, gift cards, or untraceable UPI IDs) while avoiding platform checkout or escrow verification.

---

## 3. Immediate Red Flags to Watch Out For

| Red Flag Indicator | Scammer Behavior | Genuine Seller Behavior |
| :--- | :--- | :--- |
| **Pricing** | Unreasonably cheap to trigger panic-buying | Fair market value with small negotiation room |
| **Communication** | Pressures buyer to leave platform immediately | Communicates on-platform, transparent responses |
| **Photos** | Refuses custom photo with buyer username/date | Readily shares custom video/photo with written note |
| **Testing** | Refuses bench testing or live video demo | Offers live benchmark video or in-person test |
| **Payment** | Demands 100% advance or deposit before meet | Accepts payment upon inspection or verified escrow |

---

## 4. How to Verify a Seller Before Paying

1. **Request Timestamped Custom Proof:**
   Ask the seller to place a handwritten piece of paper beside the hardware showing today's date, their name, and your username. If they hesitate or offer excuses, discontinue the conversation.
2. **Reverse Image Search:**
   Run the listing photos through Google Lens or TinEye to verify the pictures are not recycled from another forum.
3. **Inspect Seller Profile & Verification:**
   On GGS, look for the **Verified Seller Badge**, user registration age, completed transaction history, and genuine member reviews.
4. **Prefer Public, Well-Lit Meetup Locations:**
   When buying locally in Kerala, schedule meetups at computer cafes, busy public spots, or police station public zones.

---

## 5. Pre-Payment Verification Checklist

- [ ] Has the seller provided timestamped photos/video of the exact item?
- [ ] Is the seller's profile verified with active contact details?
- [ ] Have you verified the exact hardware specifications (e.g., CPU generation, GPU VRAM)?
- [ ] Are you paying upon physical inspection or through platform buyer protection?
- [ ] Have you confirmed the payment recipient name matches the verified seller identity?

---

## 6. What to Do if You Sent Money to a Scammer

1. **Contact Your Bank or UPI App Immediately:**
   Report the transaction reference number (UTR) to your bank's fraud desk within 24 hours to initiate a dispute flag.
2. **File a National Cyber Crime Report:**
   In India, report the incident immediately via **cybercrime.gov.in** or dial **1930** (Cyber Financial Helpline).
3. **Report the Account on GGS:**
   Submit an urgent report with chat logs, listing ID, and payment screenshots so our moderation team can freeze the account and prevent further victimization.
`
  },
  {
    id: 'art-02',
    slug: 'verify-used-pc-specifications',
    url: '/blog/safety/verify-used-pc-specifications',
    title: 'How to Verify Used PC Specifications Before You Buy',
    seoTitle: 'How to Verify Used PC Specs (CPU, GPU, RAM) | GGS Safety Guide',
    metaDescription: 'Step-by-step guide to verifying pre-owned PC hardware using CPU-Z, GPU-Z, HWiNFO, and CrystalDiskInfo. Avoid misleading CPU generation and fake GPU claims.',
    primaryKeyword: 'verify used pc specifications',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '8 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'Hardware Diagnostics Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed tutorial on validating CPU generations, genuine VRAM, SSD wear levels, and RAM speeds using free diagnostic tools during used PC inspections.',
    tags: ['PCBuilding', 'HardwareTesting', 'CPUZ', 'GPUZ'],
    relatedSlugs: [
      'fake-gpu-scams',
      'test-used-gaming-hardware',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'why-specs-matter', title: '1. Why Exact Model Numbers Matter' },
      { id: 'misleading-tactics', title: '2. Common Misleading Specification Tactics' },
      { id: 'essential-diagnostic-tools', title: '3. The 4 Essential Free Diagnostic Tools' },
      { id: 'step-by-step-verification', title: '4. Step-by-Step System Verification Workflow' },
      { id: 'misleading-vs-trustworthy', title: '5. Misleading vs. Trustworthy Listing Comparison' },
      { id: 'buyer-verification-checklist', title: '6. Used PC Specification Checklist' }
    ],
    content: `
# How to Verify Used PC Specifications Before You Buy

When shopping for a pre-owned gaming rig, relying solely on Windows System Information or DxDiag properties is risky. Deceptive sellers often use generic terms or modified Windows registry entries to mask ancient hardware under modern branding.

This guide walks you through the exact diagnostic software and verification process needed to confirm every core component.

---

## 1. Why Exact Model Numbers Matter

A listing describing a machine as an **"Intel Core i7 Gaming PC with 8GB Graphics"** tells you virtually nothing about performance:
* An **Intel Core i7-2600 (2011, 2nd Gen)** is obsolete for modern AAA gaming and performs vastly worse than an entry-level **Intel Core i3-12100F (2022, 12th Gen)**.
* An "8GB Graphics card" could be a slow **AMD RX 580 2048SP OEM** or a modern high-performance **RTX 4060 8GB**.

Always demand the **exact model number, release generation, and manufacturer details** before agreeing on a price.

---

## 2. Common Misleading Specification Tactics

1. **Old-Generation i7 Traps:** Marketing 10+ year old CPUs (i7-3770, i7-4770) as high-end gaming processors.
2. **Integrated vs. Dedicated Graphics:** Advertising integrated CPU graphics (e.g., Intel UHD 630 or AMD Radeon Vega 8) as dedicated video cards.
3. **Forged Windows Registry Values:** Using registry hacks to make an old GPU or CPU report a modern name in Windows Device Manager.
4. **Mismatched RAM Speed & Dual Channel:** Listing single-channel 2133MHz DDR4 as high-speed gaming memory without enabling XMP/DOCP.

---

## 3. The 4 Essential Free Diagnostic Tools

Bring a portable USB thumb drive containing portable versions of these four industry-standard diagnostic tools:

| Utility | Primary Purpose | Key Verification Parameters |
| :--- | :--- | :--- |
| **CPU-Z** | Processor, Motherboard, & RAM | Exact CPU microarchitecture, TDP, socket, dual-channel RAM speed |
| **GPU-Z** | Dedicated Graphics Card | GPU chip codename, shader count, real VRAM type, BIOS version |
| **HWiNFO64** | Complete System Telemetry | Voltages, CPU/GPU thermal throttle status, power draw |
| **CrystalDiskInfo** | SSD & HDD Health | S.M.A.R.T. health percentage, Total Bytes Written (TBW), bad sectors |

---

## 4. Step-by-Step System Verification Workflow

### Step 1: Run CPU-Z
* Check the **Processor** tab: Confirm the exact CPU Name, Codename, and Core/Thread count.
* Check the **Memory** tab: Confirm Channel # displays **Dual** and verify frequency (multiply DRAM frequency by 2 for DDR speed).

### Step 2: Run GPU-Z
* Look for the **GPU Codename** and **Shaders Count**.
* If GPU-Z displays **[FAKE]** in yellow text next to the GPU name, the card has a spoofed BIOS.
* Click the **Render Test** (?) button to verify PCIe bus interface switching (e.g., PCIe x16 3.0/4.0).

### Step 3: Run CrystalDiskInfo
* Check health indicators for NVMe/SATA drives.
* Avoid systems where SSD health is below **75%** or has hundreds of reallocated sectors.

---

## 5. Misleading vs. Trustworthy Listing Comparison

### ❌ Misleading Listing:
> *"Superfast RGB Gaming PC, Intel Core i7 Processor, 16GB RAM, 8GB Dedicated Gaming Card, 1TB Fast Storage. Plays all games on Ultra!"*

### ✅ Trustworthy Listing:
> *"Custom Gaming PC: AMD Ryzen 5 5600 (6C/12T), B550M Motherboard, 16GB (2x8GB) Corsair Vengeance DDR4-3600 CL18, Zotac RTX 3060 Ti Twin Edge 8GB GDDR6, 1TB Kingston NV2 NVMe SSD (Health 98%), Deepcool PM750D 750W 80+ Gold PSU. Box and invoice available for GPU."*

---

## 6. Used PC Specification Checklist

- [ ] CPU-Z confirms exact CPU model and generation.
- [ ] GPU-Z confirms authentic GPU chip, shader count, and VRAM bandwidth.
- [ ] RAM is running in dual-channel mode with XMP/DOCP profile active.
- [ ] SSD health checked via CrystalDiskInfo (>80% healthy, low TBW).
- [ ] Power supply unit (PSU) is 80-Plus certified from a reputable brand (Corsair, Seasonic, Deepcool, Cooler Master).
`
  },
  {
    id: 'art-03',
    slug: 'fake-gpu-scams',
    url: '/blog/safety/fake-gpu-scams',
    title: 'Fake GPU Scams: How to Verify a Used Graphics Card',
    seoTitle: 'Fake GPU Scams: Identify BIOS Flashed Graphics Cards | GGS Safety',
    metaDescription: 'Complete guide to identifying fake, re-badged, and BIOS-flashed GPUs like GTS 450 flashed to GTX 1060. Step-by-step GPU-Z and FurMark stress testing.',
    primaryKeyword: 'fake gpu scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'GPU Diagnostics Specialist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'How scammers modify BIOS firmware on ancient cards to spoof RTX and GTX models, with practical methods to detect counterfeit GPUs using GPU-Z and benchmarks.',
    tags: ['GPUVerification', 'FakeGPU', 'GraphicsCard', 'FurMark'],
    relatedSlugs: [
      'verify-used-pc-specifications',
      'used-mining-gpu-guide',
      'test-used-gaming-hardware'
    ],
    tableOfContents: [
      { id: 'what-is-fake-gpu', title: '1. What is a Fake or BIOS-Flashed GPU?' },
      { id: 'red-flags', title: '2. Physical & Listing Red Flags' },
      { id: 'gpuz-detection', title: '3. Detecting Fake GPUs Using GPU-Z' },
      { id: 'benchmark-testing', title: '4. Stress Testing & Benchmark Verification' },
      { id: 'questions-for-seller', title: '5. Essential Questions to Ask the Seller' },
      { id: 'buyer-gpu-checklist', title: '6. GPU Verification Checklist' }
    ],
    content: `
# Fake GPU Scams: How to Verify a Used Graphics Card

Graphics cards are the most expensive single component in a modern gaming setup. Because of high demand, counterfeit GPUs remain widespread on unmonitored classifieds.

In a fake GPU scam, a low-cost, obsolete graphics card (such as an ancient Fermi GTS 450 or GT 730) has its video BIOS modified (flashed) so that Windows and Device Manager identify it as a modern GTX 1060, RTX 2060, or RTX 3060.

This article details how to inspect, verify, and stress-test pre-owned graphics cards to ensure you receive genuine hardware.

---

## 1. What is a Fake or BIOS-Flashed GPU?

Scammers take bulk surplus chips from 2010–2014, flash a modified BIOS that spoofs the Device ID string, and house the PCB inside a shroud with counterfeit stickers.

When you install drivers:
* The card crashes or refuses official NVIDIA/AMD WHQL driver updates.
* When running modern games, the card crashes as soon as memory allocation exceeds the real hardware capacity (often 1GB pretending to be 4GB or 6GB).
* 3D rendering performance is 90% below what a genuine model produces.

---

## 2. Physical & Listing Red Flags

1. **Obsolete Video Ports:** If a supposed "GTX 1060" or "RTX" card features a legacy **VGA (D-Sub)** analog blue connector on the rear bracket, it is 100% fake. Modern Pascal, Turing, and Ampere cards do not support native analog VGA ports.
2. **Generic Blue/Green PCB with No Branding:** Authentic AIB manufacturers (ASUS, MSI, Gigabyte, Zotac, Sapphire, PowerColor) use custom black or branded matte PCBs with manufacturer serial stickers.
3. **No Power Connector on High-TDP Cards:** If an alleged "GTX 1070" has no 6-pin or 8-pin PCIe power connector, it is physically incapable of drawing required wattage and is counterfeit.

---

## 3. Detecting Fake GPUs Using GPU-Z

The free TechPowerUp **GPU-Z** tool contains built-in counterfeit detection for NVIDIA GPUs:

* **[FAKE] Warning:** GPU-Z evaluates the device ID against known chip characteristics. If a mismatch exists, it displays **[FAKE]** in the name field.
* **Shader & Die Size Check:** Compare the **Shaders Count**, **Pixel Fillrate**, and **Memory Bandwidth** against official TechPowerUp database specifications.
* **Die Codename:** An RTX 3060 should show **GA106**, not **GF106** or **GK106**.

---

## 4. Stress Testing & Benchmark Verification

Always run a 10-minute synthetic benchmark before finalizing your payment:

1. **3DMark Time Spy / Superposition:**
   Compare the final Graphics Score with online averages for that exact model. A legitimate RTX 3060 scores ~8,400 points in Time Spy; a flashed GTS 450 will score under 300 points or crash instantly.
2. **FurMark / MSI Kombustor Stress Run:**
   Monitor core temperature, hot spot temperature, fan RPM, and power draw (TDP %).
   * Maximum core temp under full load should generally stay below **75°C–82°C**.
   * Artifacts (flashing pixels, geometric tears, screen blackouts) indicate failing VRAM or defective silicon.

---

## 5. Essential Questions to Ask the Seller

- *"Can you provide a 30-second video of GPU-Z and FurMark running on the card?"*
- *"Do you have the original purchase invoice and manufacturer box?"*
- *"Has the card ever been opened for repasting or thermal pad replacement?"*
- *"Are all display outputs (DisplayPort and HDMI) functioning properly?"*

---

## 6. GPU Verification Checklist

- [ ] Rear bracket contains only modern digital outputs (HDMI, DisplayPort) with no legacy VGA.
- [ ] GPU-Z shows authentic GPU codename, memory bandwidth, and zero [FAKE] warnings.
- [ ] Passes 10-minute 3DMark or FurMark test without artifacting or thermal throttling (>85°C).
- [ ] Serial number on PCB sticker matches the box/invoice (if available).
- [ ] Fan bearings spin smoothly without rattling, scraping, or oil leakage.
`
  },
  {
    id: 'art-04',
    slug: 'used-mining-gpu-guide',
    url: '/blog/safety/used-mining-gpu-guide',
    title: 'Buying a Used Mining GPU: Risks, Checks, and What to Know',
    seoTitle: 'Used Mining GPU Guide: Risks, Lifespan & Testing | GGS',
    metaDescription: 'Is buying an ex-mining graphics card safe? Learn how cryptocurrency mining affects GPU lifespan, fan wear, thermal paste, and how to verify stability before purchase.',
    primaryKeyword: 'used mining gpu guide',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'Hardware Reliability Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Balanced, objective guide on evaluating former crypto-mining GPUs: understanding memory degradation, custom VBIOS restoration, fan wear, and thermal repasting.',
    tags: ['MiningGPU', 'HardwareTesting', 'Thermals', 'CryptoHardware'],
    relatedSlugs: [
      'fake-gpu-scams',
      'repaired-refurbished-hardware',
      'test-used-gaming-hardware'
    ],
    tableOfContents: [
      { id: 'what-mining-means', title: '1. What Does Mining Use Actually Mean?' },
      { id: 'myths-vs-reality', title: '2. Mining GPU Myths vs. Reality' },
      { id: 'key-risk-areas', title: '3. Key Components Vulnerable to Mining Wear' },
      { id: 'how-to-inspect', title: '4. Physical & Technical Inspection Guide' },
      { id: 'vbios-check', title: '5. Checking and Restoring Stock VBIOS' },
      { id: 'mining-checklist', title: '6. Ex-Mining GPU Inspection Checklist' }
    ],
    content: `
# Buying a Used Mining GPU: Risks, Checks, and What to Know

With the shift of major cryptocurrencies away from Proof-of-Work, hundreds of thousands of used graphics cards entered the pre-owned market.

While some buyers avoid ex-mining GPUs entirely, others find them to be extraordinary bargains. The reality is nuanced: a well-maintained, undervolted mining card kept in a climate-controlled room can outlast a GPU abused in a dusty, poorly ventilated gaming case.

Here is what you need to know to evaluate an ex-mining graphics card safely.

---

## 1. What Does Mining Use Actually Mean?

Cryptocurrency mining places constant, sustained 24/7 compute loads on a graphics card—primarily stressing the **VRAM (video memory)** rather than the core compute silicon.

Professional miners typically:
* **Undervolt the core clock** (reducing power draw and temperature).
* **Overclock the memory frequency** to maximize hash rates.
* Run cooling fans at constant 70%–85% speeds for months or years.

---

## 2. Mining GPU Myths vs. Reality

* **Myth:** *"Mining completely destroys the GPU chip in 6 months."*
  **Reality:** Silicon degrades primarily from extreme voltage and repeated thermal expansion/contraction cycles (hot-cold cycling common in gaming). Sustained constant temperatures often cause less silicon fatigue than daily gaming cycles.
* **Myth:** *"Mining cards are identical to ordinary used cards."*
  **Reality:** Mining cards often have worn mechanical fan bearings, dried-out thermal paste, degraded thermal pads on GDDR6X memory, and modified mining VBIOS firmware.

---

## 3. Key Components Vulnerable to Mining Wear

1. **Cooling Fan Bearings:** Sleeve and ball bearings run for 10,000+ continuous hours may develop wobble, rattling noises, or reduced RPM.
2. **GDDR6X Memory Junction Thermals:** RTX 3080/3090 series cards running memory intensive algorithms frequently experienced memory junction temperatures exceeding 100°C, causing oily thermal pad residue.
3. **Modified Mining VBIOS:** Many AMD RX 5700/6800 cards have custom BIOS firmware flashed to tighten memory timings, which can cause display driver crashes in gaming until the stock BIOS is restored.

---

## 4. Physical & Technical Inspection Guide

### Physical Check:
* Inspect the PCB backplate for **oily residue** or discoloration around the memory chips.
* Spin each fan gently with your finger: it should rotate smoothly without friction, noise, or axial play.
* Check heatsink fins for heavy corrosion or thick sticky dust.

### Technical Check:
* Monitor **GPU Memory Junction Temperature** in HWiNFO64 during a 15-minute Time Spy loop. Memory junction temp should remain **under 95°C**.
* Verify that display outputs have not been disabled in BIOS.

---

## 5. Checking and Restoring Stock VBIOS

If the card fails to boost correctly or crashes in 3D gaming:
1. Open GPU-Z and compare the **BIOS Version** string with the official TechPowerUp VGA BIOS collection.
2. If custom mining firmware is installed, use **ATIFlash / NVFlash** to reflash the manufacturer's original stock BIOS.

---

## 6. Ex-Mining GPU Inspection Checklist

- [ ] Card is priced appropriately (should be 15%–25% below standard used retail).
- [ ] Fan bearings are quiet and spin freely at 100% manual speed.
- [ ] Memory junction temperature stays below 95°C during stress tests.
- [ ] Stock manufacturer VBIOS is verified and active.
- [ ] Budget a small amount (₹500–₹1,000) for fresh thermal paste and pad replacement if needed.
`
  },
  {
    id: 'art-05',
    slug: 'test-used-gaming-hardware',
    url: '/blog/safety/test-used-gaming-hardware',
    title: 'How to Test Used Gaming Hardware Before Paying',
    seoTitle: 'How to Test Used Gaming Gear (PC, GPU, Console) Before Buying | GGS',
    metaDescription: 'Complete diagnostic testing guide for pre-owned PCs, GPUs, PS5/Xbox consoles, gaming controllers, and monitors before completing in-person payments.',
    primaryKeyword: 'test used gaming hardware',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '9 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'Hardware QA & Diagnostics',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Device-specific inspection routines for gaming PCs, graphics cards, PlayStation/Xbox consoles, mechanical keyboards, gaming mice, and high-refresh monitors.',
    tags: ['HardwareTesting', 'ConsoleTesting', 'MonitorTesting', 'QualityAssurance'],
    relatedSlugs: [
      'verify-used-pc-specifications',
      'stolen-account-locked-devices',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'why-test', title: '1. The Golden Rule of In-Person Testing' },
      { id: 'pc-gpu-testing', title: '2. Testing Complete Gaming PCs & GPUs' },
      { id: 'console-testing', title: '3. Testing PlayStation & Xbox Consoles' },
      { id: 'monitor-testing', title: '4. Testing Gaming Monitors & Panels' },
      { id: 'peripheral-testing', title: '5. Testing Controllers & Mechanical Keyboards' },
      { id: 'seller-refusal', title: '6. What to Do if a Seller Refuses In-Person Testing' }
    ],
    content: `
# How to Test Used Gaming Hardware Before Paying

Never hand over cash or initiate a bank transfer in a parking lot without testing high-value electronics under load. A component that powers on can still crash within 3 minutes of launching a demanding game.

This guide provides an exhaustive testing blueprint for PCs, graphics cards, consoles, monitors, and peripherals.

---

## 1. The Golden Rule of In-Person Testing

> **Rule:** Never buy used hardware that you have not seen operating under full thermal and graphical load.

If you are meeting locally in Kerala, agree on a meetup location equipped with electrical outlets and an internet connection (such as a collaborative gaming cafe, your home, or the seller's workplace).

---

## 2. Testing Complete Gaming PCs & GPUs

### Recommended Testing Duration: **15–20 minutes**

1. **Cold Boot & BIOS Verification:**
   Enter BIOS setup (Del/F2). Confirm CPU model, installed RAM capacity, and storage devices.
2. **Synthetic Stress Testing:**
   * Run **Cinebench R23 / 2024** for multi-core CPU thermal stability.
   * Run **FurMark / 3DMark Time Spy** for GPU stability.
3. **Monitor Thermals in HWiNFO64:**
   * CPU should not throttle continuously above **90°C**.
   * GPU core should stay below **80°C**, and Hot Spot should stay below **95°C**.
4. **Audio & USB Port Check:**
   Plug a USB drive and headset into front-panel and rear I/O ports to ensure no short circuits or dead ports.

---

## 3. Testing PlayStation & Xbox Consoles

### Recommended Testing Duration: **15–20 minutes**

1. **PSN / Xbox Network Login Check:**
   Connect the console to Wi-Fi/Hotspot and sign in to a test PlayStation Network or Xbox Live account.
   * *Critical:* If the console displays error code **WS-37397-9** or **WS-37368-7** (PS5) or a permanent ban screen, the console hardware is banned from online play.
2. **Optical Disc Drive Test:**
   Insert a physical PS5/PS4/Xbox disc. Ensure the drive grabs, reads, and installs the disc quietly without clicking noises.
3. **HDMI Port & High Refresh Output:**
   Inspect the HDMI port pins for bending. Test video output at 4K 60Hz/120Hz and ensure no visual sparkles or signal dropouts occur.
4. **Thermal Fan Noise:**
   Launch a graphics-heavy title (e.g., God of War, Spider-Man, Forza). The console should not sound like a jet engine or shut down due to overheating.

---

## 4. Testing Gaming Monitors & Panels

1. **Dead Pixel & Stuck Pixel Check:**
   Open **DeadPixelTest.org** and cycle through full-screen white, black, red, green, and blue backgrounds.
2. **Backlight Bleed & IPS Glow:**
   Display a pure black screen in a dimly lit room to inspect for excessive backlight leakage around bezels.
3. **High Refresh Rate & G-Sync/FreeSync:**
   Verify in Windows Display Settings that the monitor runs at its full advertised refresh rate (144Hz, 165Hz, 240Hz) without flickering.

---

## 5. Testing Controllers & Mechanical Keyboards

* **Controller Stick Drift Check:**
  Connect the DualSense or Xbox controller to a PC and open **Gamepad-Tester.com**. Inspect analog stick centering: circular error rate should be low, and centering value should stay within **0.00–0.05** with zero unwanted movement.
* **Mechanical Keyboard Key Chatter:**
  Open a keyboard tester (Keyboard-Tester.com) and verify that every key registers once with no missed clicks or double-typing (chatter).

---

## 6. What to Do if a Seller Refuses In-Person Testing

If a seller claims:
* *"I don't have a monitor or power cable right now."*
* *"Just take it home, it works 100% guaranteed."*
* *"Meet me at a metro station exit, I am in a hurry."*

**Politely decline the transaction.** Legitimate sellers with nothing to hide are happy to demonstrate working hardware.
`
  },
  {
    id: 'art-06',
    slug: 'bait-and-switch-scams',
    url: '/blog/safety/bait-and-switch-scams',
    title: 'Bait-and-Switch Scams in Used Gaming Hardware: How to Avoid Them',
    seoTitle: 'Bait and Switch Gaming Hardware Scams: How to Avoid | GGS',
    metaDescription: 'Protect yourself from bait-and-switch hardware fraud. Learn how dishonest sellers swap GPUs, downgrade SSDs, or omit advertised accessories at handover.',
    primaryKeyword: 'bait and switch scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '6 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Dispute Resolution Lead',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Tactics used by deceptive sellers to swap advertised components for inferior substitutes at the point of exchange, and how to verify exact parts on delivery.',
    tags: ['BaitAndSwitch', 'ConsumerSafety', 'DisputeResolution', 'HardwareAuditing'],
    relatedSlugs: [
      'verify-used-pc-specifications',
      'shipping-damage-empty-box-scams',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'what-is-bait-and-switch', title: '1. What is a Bait-and-Switch Scam?' },
      { id: 'common-tactics', title: '2. Common Tactics Used by Dishonest Sellers' },
      { id: 'documentation', title: '3. How to Document the Agreed Listing Details' },
      { id: 'handover-verification', title: '4. The Point-of-Exchange Inspection' },
      { id: 'resolution-steps', title: '5. What to Do if an Item Differs From the Listing' }
    ],
    content: `
# Bait-and-Switch Scams in Used Gaming Hardware: How to Avoid Them

In a **bait-and-switch** scam, a seller advertises a premium gaming component or complete PC at an attractive price, but delivers an inferior, damaged, or stripped-down version during the final handover.

Because buyers are often excited during meetups, subtle substitutions—such as replacing an advertised Samsung 980 Pro NVMe with a generic SATA SSD—frequently go unnoticed until after payment is completed.

---

## 1. What is a Bait-and-Switch Scam?

Bait-and-switch occurs when the delivered item differs materially from the listing photos, advertised specifications, or included accessories.

### Frequent Examples in Used Gaming Gear:
* **GPU Downgrade:** Listing displays an RTX 3070 8GB; handover PC contains a GTX 1660 Super.
* **Component Stripping:** Advertised with 32GB RAM and modular Gold PSU; handover PC contains 8GB single-stick RAM and a cheap unbranded power supply.
* **Missing Accessories:** Original power brick, controller dongle, modular PSU cables, or Wi-Fi antennas are withheld after payment.
* **Condition Downgrade:** Photos showed a pristine console; physical device has broken casing tabs and heavy scratches.

---

## 2. Common Tactics Used by Dishonest Sellers

1. **The "Last-Minute Swapping" Excuse:** The seller claims the advertised GPU had an issue right before leaving, so they swapped in a "similar" one without adjusting the price.
2. **Pre-Packed Box Rush:** Handing over a sealed cardboard box in a hurry, urging the buyer to check it later at home.
3. **The Box Trick:** Providing the box of an expensive product (e.g., RTX 4070 Ti) containing a lower-tier graphics card (e.g., RTX 3060).

---

## 3. How to Document the Agreed Listing Details

* **Save Full Listing Screenshots:** Capture screenshots of the original listing description, serial numbers, photos, and price.
* **Confirm Specs in Chat:** Explicitly message: *"Confirming the PC includes AMD Ryzen 5 5600, RTX 3060 Ti 8GB, 16GB DDR4-3600, and 1TB NVMe as listed for ₹42,000."*
* **Ask for Serial Numbers in Advance:** Request photo proof of serial numbers on the GPU, motherboard, and console body.

---

## 4. The Point-of-Exchange Inspection

Never leave the exchange location until you have verified:
1. **Open the PC Side Panel:** Visually verify the GPU model sticker, CPU cooler, RAM count, and power supply label.
2. **Match Serial Numbers:** Ensure the serial number on the physical component matches the manufacturer box and invoice.
3. **Check All Accessories:** Count cables, controllers, power adapters, and display cables agreed upon in chat.

---

## 5. What to Do if an Item Differs From the Listing

* **Before Paying:** If any component differs from the agreed specifications, **stop the transaction immediately**. Do not accept partial explanations or promises of future refunds.
* **If Paid via Platform Protection:** File a dispute immediately on GGS with listing screenshots and photos of the received hardware.
* **Report the Listing:** Submit a moderation ticket so our safety team can investigate the seller's account for repeated deception.
`
  },
  {
    id: 'art-07',
    slug: 'stolen-account-locked-devices',
    url: '/blog/safety/stolen-account-locked-devices',
    title: 'How to Avoid Stolen or Account-Locked Gaming Devices',
    seoTitle: 'Avoid Stolen & Banned Gaming Consoles (PS5, Xbox, Steam Deck) | GGS',
    metaDescription: 'How to check for hardware bans, iCloud/Steam activation locks, and stolen gaming consoles and laptops before buying on peer-to-peer marketplaces.',
    primaryKeyword: 'stolen account locked gaming devices',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Security & Device Integrity Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed instructions to verify console serial numbers, perform complete factory resets, detect online PSN/Xbox hardware bans, and avoid iCloud/MDM-locked laptops.',
    tags: ['ConsoleSafety', 'PS5Bans', 'AccountLock', 'DeviceIntegrity'],
    relatedSlugs: [
      'test-used-gaming-hardware',
      'bait-and-switch-scams',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'the-danger-of-locked-devices', title: '1. The Danger of Account-Locked & Banned Devices' },
      { id: 'console-hardware-bans', title: '2. Console Hardware Bans (PS5 & Xbox)' },
      { id: 'portable-activation-locks', title: '3. Handheld & Laptop Activation Locks' },
      { id: 'ownership-verification', title: '4. How to Verify Legitimate Ownership' },
      { id: 'factory-reset-protocol', title: '5. The Mandatory Factory Reset Protocol' },
      { id: 'red-flags-stolen-gear', title: '6. Red Flags of Potentially Stolen Hardware' }
    ],
    content: `
# How to Avoid Stolen or Account-Locked Gaming Devices

Buying a pre-owned PlayStation 5, Xbox Series X, Nintendo Switch, or gaming laptop can turn into a total loss if the device is **hardware-banned** by the manufacturer or locked to a previous owner's account.

Once Sony, Microsoft, Nintendo, or Apple applies a permanent hardware or activation ban, the device is permanently prevented from connecting to online servers, rendering multiplayer and digital game libraries useless.

---

## 1. The Danger of Account-Locked & Banned Devices

Unlike software bugs, hardware bans are tied to the **motherboard SoC and unique cryptographic device IDs**:
* Reformatting or factory resetting the device **does not lift** a console hardware ban.
* Banned consoles cannot download game updates, access digital stores, or play online multiplayer.
* Stolen devices reported to police can be seized without financial compensation to the buyer.

---

## 2. Console Hardware Bans (PS5 & Xbox)

### PlayStation 5 & PS4:
* Connect the console to a Wi-Fi hotspot during your meetup.
* Sign in with a valid PlayStation Network account.
* **Error WS-37397-9 / WS-37368-7:** Indicates a permanent console ban due to fraudulent chargebacks, jailbreaking, or TOS violations.

### Xbox Series X / Series S / One:
* Connect to internet and attempt to launch Xbox Network services.
* Look for suspension notices indicating the console has been suspended from Xbox Live.

### Nintendo Switch:
* Connect to the Nintendo eShop.
* **Error 2124-4007 / 2124-4508:** Indicates the device is permanently banned from Nintendo Network services due to CFW modifications or stolen credit card purchases.

---

## 3. Handheld & Laptop Activation Locks

* **Steam Deck & ASUS ROG Ally:**
  Ensure the previous user has unlinked their Steam account and disabled BIOS administrator passwords.
* **Apple MacBooks & Gaming Laptops:**
  Ensure Apple iCloud Activation Lock / Find My is completely disabled. On Windows laptops, check that no **MDM (Mobile Device Management)** enterprise enrollment profiles or BitLocker recovery locks exist.

---

## 4. How to Verify Legitimate Ownership

1. **Request the Original Purchase Invoice:**
   A genuine seller who purchased the console from Amazon, Flipkart, Vijay Sales, or Sony Center can usually provide a matching invoice or digital order screenshot.
2. **Inspect the Physical Serial Number Barcode:**
   Verify that the serial number sticker on the console chassis has not been peeled, scratched off, or tampered with.

---

## 5. The Mandatory Factory Reset Protocol

Always perform a live factory reset in front of the seller:
1. Initialize the console through Settings:
   * *PS5:* Settings > System > System Software > Reset Options > Reset Your Console.
   * *Xbox:* Settings > System > Console info > Reset console > Reset and remove everything.
   * *Switch:* Settings > System > Formatting Options > Initialize Console.
2. After the reboot, complete the initial setup wizard and connect to the internet.
3. If the console finishes setup and logs into the network without error prompts, it is clean.

---

## 6. Red Flags of Potentially Stolen Hardware

* Seller has no power brick, original cables, or controller (often stolen in a hurry).
* Seller refuses to let you power on the device or connect it to Wi-Fi.
* Serial number stickers have been physically removed or defaced.
* The price is substantially below 50% of market value with high pressure for immediate cash payment.
`
  },
  {
    id: 'art-08',
    slug: 'fake-payment-courier-scams',
    url: '/blog/safety/fake-payment-courier-scams',
    title: 'Fake Payment and Courier Scams: Protect Yourself When Selling Online',
    seoTitle: 'Fake Payment & Courier Scams: Seller Protection Guide | GGS',
    metaDescription: 'How sellers can detect forged UPI payment screenshots, fake bank SMS alerts, fraudulent courier representatives, and shipping fee extortion scams.',
    primaryKeyword: 'fake payment courier scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Seller Protection Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1556742049-0a67c57750c9?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Crucial safety guide for sellers on recognizing edited payment confirmations, reverse QR code fraud, fake bank verification emails, and bogus courier pickups.',
    tags: ['SellerProtection', 'PaymentScams', 'UPIFraud', 'SafeSelling'],
    relatedSlugs: [
      'fake-listing-payment-scams',
      'off-platform-payment-scams',
      'chargeback-refund-abuse'
    ],
    tableOfContents: [
      { id: 'seller-vulnerabilities', title: '1. Why Sellers are Prime Targets for Scams' },
      { id: 'screenshot-forgeries', title: '2. The Fake Payment Screenshot & SMS Trick' },
      { id: 'reverse-qr-scam', title: '3. The Reverse QR Code / "Receive Money" Scam' },
      { id: 'fake-courier-fee', title: '4. The Bogus Courier / Army Officer Scam' },
      { id: 'payment-verification-rules', title: '5. The 4 Golden Rules of Payment Verification' },
      { id: 'seller-protection-checklist', title: '6. Complete Seller Protection Checklist' }
    ],
    content: `
# Fake Payment and Courier Scams: Protect Yourself When Selling Online

When listing valuable gaming gear online, buyers are not the only ones targeted by fraudsters. Sellers frequently fall prey to sophisticated payment manipulation, edited transaction receipts, and fake courier pickup scams.

This guide details the exact tactics fraudsters use against sellers and how to ensure your funds are safely in your account before handing over merchandise.

---

## 1. Why Sellers are Prime Targets for Scams

Sellers are eager to close deals quickly. Fraudsters exploit this excitement by creating the illusion that money has already been sent, urging the seller to dispatch the hardware immediately or pay bogus "processing fees."

---

## 2. The Fake Payment Screenshot & SMS Trick

### How it works:
1. The buyer sends an edited image or Photoshop template of a Google Pay, PhonePe, Paytm, or IMPS transfer confirmation showing your name and amount.
2. Simultaneously, you may receive a forged SMS message from an unverified sender (e.g., \`+91-XXXXX\` or generic sender ID) mimicking your bank's credit notification format.
3. The scammer insists: *"Payment is successful! Please dispatch the GPU immediately with Dunzo / Porter / Speed Post."*

### The Reality:
**A screenshot is never proof of payment.** Screenshots take 30 seconds to generate using free online invoice-generating apps.

---

## 3. The Reverse QR Code / "Receive Money" Scam

### How it works:
1. The scammer claims they are paying from an "Army / Corporate / Merchant account" that requires barcode approval.
2. They send you a QR code on WhatsApp saying: *"Scan this QR code in Google Pay to receive ₹25,000 directly into your bank account."*
3. When you scan the QR code and enter your UPI PIN, **money is deducted from your bank account** instead of credited.

> **CRITICAL RULE:** You **NEVER** enter your UPI PIN to receive money. Entering a UPI PIN always authorizes an outgoing payment from your bank account.

---

## 4. The Bogus Courier / Army Officer Scam

A classic Indian classifieds scam involves an alleged "Military Officer" or "CISF Inspector" who:
* Offers to pay full price without negotiation.
* Claims a military logistics truck or private transport agent will collect the item.
* Sends a fake receipt showing payment is "pending in escrow" until you pay a ₹2,000 "gate pass verification insurance fee."

---

## 5. The 4 Golden Rules of Payment Verification

1. **Verify on Your Own Banking App:**
   Never release hardware until you open your bank app (HDFC, SBI, ICICI, etc.) on your own smartphone and confirm the balance has increased.
2. **Do Not Trust SMS Alone:**
   Spoofed SMS alerts are easy to send. Only direct bank ledger balance confirmation matters.
3. **No Third-Party Pickup Until Funds Clear:**
   If a courier service (Porter, Dunzo, Swiggy Genie) arrives for pickup, ensure 100% of payment is settled in your account first.
4. **Decline Requests for "Security Deposits" to Receive Funds:**
   Legitimate buyers never require you to send money to receive money.

---

## 6. Complete Seller Protection Checklist

- [ ] Bank account balance verified directly inside banking app (not via screenshot or SMS).
- [ ] No QR code scanned to "receive" funds.
- [ ] Buyer identity verified with consistent profile information.
- [ ] Serial number of the hardware documented in video before packaging.
- [ ] Item handed over only after complete payment settlement.
`
  },
  {
    id: 'art-09',
    slug: 'shipping-damage-empty-box-scams',
    url: '/blog/safety/shipping-damage-empty-box-scams',
    title: 'Shipping Damage and Empty-Box Scams: Protecting Buyers and Sellers',
    seoTitle: 'Empty-Box & Shipping Damage Scams: Buyer & Seller Safety | GGS',
    metaDescription: 'How to avoid shipping fraud, broken component disputes, and empty box claims when buying or selling gaming hardware across peer-to-peer marketplaces.',
    primaryKeyword: 'shipping damage empty box scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '8 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Logistics & Evidence Specialist',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Crucial packaging, unboxing, serial-number documentation, and video-evidence protocols to protect both buyers and sellers from transport disputes.',
    tags: ['ShippingSafety', 'CourierDisputes', 'UnboxingEvidence', 'PackagingGuide'],
    relatedSlugs: [
      'bait-and-switch-scams',
      'fake-payment-courier-scams',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'shipping-risks', title: '1. The Realities of P2P Hardware Shipping' },
      { id: 'seller-packaging-protocol', title: '2. The Seller Packaging & Evidence Protocol' },
      { id: 'buyer-unboxing-protocol', title: '3. The Buyer Continuous Unboxing Protocol' },
      { id: 'serial-number-tracking', title: '4. Serial Number & Weight Tracking' },
      { id: 'dispute-resolution', title: '5. How Marketplace Disputes Are Resolved Fairly' }
    ],
    content: `
# Shipping Damage and Empty-Box Scams: Protecting Buyers and Sellers

When shipping delicate, high-value electronics like tempered-glass PC cases, graphics cards, and curved gaming monitors across states, both buyers and sellers face real risks:
* **The Buyer's Risk:** Receiving an empty box, bricks, or broken components damaged in transit without insurance.
* **The Seller's Risk:** A dishonest buyer receives a working GPU, swaps it for their own dead GPU, and falsely claims the box arrived damaged or empty.

Creating an unbroken chain of physical evidence protects both honest parties.

---

## 1. The Realities of P2P Hardware Shipping

Whenever possible, **in-person local meetups** are the safest method for exchanging heavy or fragile gaming hardware. However, when shipping is necessary, strict procedural safeguards are mandatory.

---

## 2. The Seller Packaging & Evidence Protocol

As a seller, you must prove that the exact working item was securely packaged:

1. **Record a Continuous Packaging Video:**
   * Show the working hardware running a benchmark on screen with the serial number visible.
   * Power down, place the item into anti-static bubble wrap, and seal the shipping box with custom tamper-evident security tape.
   * Show the shipping label clearly affixed to the box without stopping the video.
2. **Double-Box Delicate Components:**
   * Never ship a graphics card installed on a motherboard inside a PC case; PCIe slots frequently snap during courier transit. Ship the GPU in its original box separately.
   * Use at least 2 inches of dense bubble wrap on all sides.
3. **Record Package Weight at Courier Counter:**
   * Ensure the courier receipt explicitly records the **exact parcel weight** down to the gram (e.g., 2.34 kg).

---

## 3. The Buyer Continuous Unboxing Protocol

As a buyer, you must document the delivery from the moment the courier hands you the parcel:

1. **Inspect Outer Box Before Signing:**
   Check for crushed corners, resealed generic tape, or tears in the packaging. Note any damage on the delivery slip.
2. **Film an Unbroken 360° Unboxing Video:**
   * Start recording before cutting any tape.
   * Clearly show the unopened shipping label, tracking barcode, and all 6 sides of the box.
   * Open the package on camera without moving out of frame.
   * Inspect the hardware serial number and show it clearly to the camera lens.
   * Power on and test the device.

---

## 4. Serial Number & Weight Tracking

| Protection Measure | Why It Protects the Seller | Why It Protects the Buyer |
| :--- | :--- | :--- |
| **Parcel Weight Receipt** | Proves the heavy GPU was inside when shipped | Proves if parcel was tampered/drained en route |
| **Continuous Video** | Prevents false "empty box" claims | Proves item arrived broken or substituted |
| **Serial Number on Invoice** | Prevents buyer swapping for a dead card | Ensures correct warranted hardware was sent |
| **Tamper-Evident Tape** | Shows if courier opened the parcel | Proves if box was resealed by third party |

---

## 5. How Marketplace Disputes Are Resolved Fairly

On GGS, when a shipping dispute arises:
* **Evidence Required from Seller:** Complete continuous packaging video, weight receipt from logistics provider, and tracking scan timeline.
* **Evidence Required from Buyer:** Unbroken 360° unboxing video showing sealed box, label, and physical inspection.
* When both parties follow protocol, courier transit insurance claims can be successfully processed.
`
  },
  {
    id: 'art-10',
    slug: 'repaired-refurbished-hardware',
    url: '/blog/safety/repaired-refurbished-hardware',
    title: 'Buying Repaired or Refurbished Gaming Hardware: What to Check',
    seoTitle: 'Buying Refurbished & Repaired Gaming Hardware Guide | GGS',
    metaDescription: 'Learn how to inspect repaired GPUs, motherboard MOSFET rework, refurbished gaming laptops, and replaced panels. Avoid undisclosed DIY bake repairs.',
    primaryKeyword: 'repaired refurbished hardware',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'Hardware Repair & QA Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Distinguishing professional manufacturer refurbished hardware from risky DIY repairs, heat-gun GPU reflows, and undisclosed liquid damage.',
    tags: ['RefurbishedHardware', 'GPURepair', 'HardwareInspection', 'BGAWork'],
    relatedSlugs: [
      'used-mining-gpu-guide',
      'verify-used-pc-specifications',
      'test-used-gaming-hardware'
    ],
    tableOfContents: [
      { id: 'refurbished-vs-repaired', title: '1. Factory Refurbished vs. Third-Party Repaired' },
      { id: 'dangerous-diy-repairs', title: '2. The Danger of "Oven-Baked" & Heat-Gun GPU Reflows' },
      { id: 'signs-of-rework', title: '3. Physical Signs of PCB Rework & Soldering' },
      { id: 'laptop-inspection', title: '4. Inspecting Repaired Gaming Laptops' },
      { id: 'questions-to-ask', title: '5. What to Ask the Seller About Repair History' },
      { id: 'refurbished-checklist', title: '6. Refurbished Hardware Inspection Checklist' }
    ],
    content: `
# Buying Repaired or Refurbished Gaming Hardware: What to Check

Not all repaired hardware is bad—professional BGA chip replacements and manufacturer-certified refurbished units can offer great value. However, undisclosed DIY repairs (such as temporary heat-gun reflows or poorly soldered power stages) frequently fail within days of purchase.

Here is how to distinguish professionally refurbished gear from high-risk temporary fixes.

---

## 1. Factory Refurbished vs. Third-Party Repaired

* **Manufacturer / Official RMA Refurbished:**
  Repaired by authorized brand service centers (e.g., ASUS RMA, MSI, Sony Service), tested with factory diagnostic rigs, and backed by a replacement warranty.
* **Professional Component-Level Repair:**
  Repaired by skilled technicians with BGA rework stations (e.g., replaced VRAM chip, repaired MOSFET, or fixed power rails).
* **DIY "Oven / Heat-Gun" Reflows:**
  A temporary hack where an amateur blasts a dead GPU with a heat gun to temporarily restore cracked solder balls. **These repairs typically fail within 1 to 4 weeks.**

---

## 2. The Danger of "Oven-Baked" & Heat-Gun GPU Reflows

When a GPU develops cracked BGA solder joints beneath the memory or core, baking the card temporarily melts the solder and restores contact. However, without clean reballing with fresh flux and leaded solder, thermal expansion will quickly break the connection again.

---

## 3. Physical Signs of PCB Rework & Soldering

Inspect the bare PCB under strong directional light:
1. **Flux Residue:** Look for sticky, amber-colored residue around memory chips, inductors, or MOSFETs.
2. **Discolored PCB Mask:** Yellowing or browning of the green/black solder mask indicates excessive local heat from a heat gun.
3. **Mismatched Memory Chips:** All VRAM chips should share identical manufacturer batch codes (e.g., Samsung or Micron). If 1 of the 8 chips has a different batch code or looks newly soldered, that channel was reworked.
4. **Missing or Torn Warranty Stickers:** Tampered screw stickers on the GPU heatsink indicate previous disassembly.

---

## 4. Inspecting Repaired Gaming Laptops

* **Battery Replacement:** Check battery health using \`powercfg /batteryreport\` in Windows terminal. Non-OEM third-party batteries often lack proper thermal sensors.
* **Display Panel Replacement:** Check panel model in HWiNFO to ensure an original 144Hz/240Hz IPS panel wasn't replaced with a cheap 60Hz TN panel.
* **Liquid Damage Indicators (LDI):** Inspect white sticker dots inside ports or underneath the bottom cover. If the dots are red or pink, the laptop suffered liquid intrusion.

---

## 5. What to Ask the Seller About Repair History

* *"Has this hardware ever been repaired, repasted, or serviced at a repair shop?"*
* *"Do you have the service slip or invoice detailing what was repaired?"*
* *"Was the work done under official brand warranty or by a third-party technician?"*

---

## 6. Refurbished Hardware Inspection Checklist

- [ ] PCB inspected for flux residue, browning, or mismatched memory chips.
- [ ] Liquid contact indicators verified white (no pink/red staining).
- [ ] Ran 30-minute continuous load test (Time Spy / FurMark / Cinebench) with zero black screens.
- [ ] Original warranty or shop service bill verified if claimed.
`
  },
  {
    id: 'art-11',
    slug: 'account-takeover-prevention',
    url: '/blog/safety/account-takeover-prevention',
    title: 'How to Protect Your P2P Marketplace Account From Takeover Scams',
    seoTitle: 'Marketplace Account Takeover & Phishing Protection Guide | GGS',
    metaDescription: 'Protect your P2P marketplace and gaming accounts from phishing, session hijacking, credential stuffing, and fake support impersonation.',
    primaryKeyword: 'marketplace account takeover scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '6 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Cybersecurity Operations',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Step-by-step security hardening against phishing links, session token theft, password reuse, and fake customer support agents attempting account compromise.',
    tags: ['AccountSecurity', 'PhishingProtection', 'CyberSecurity', 'MFA'],
    relatedSlugs: [
      'off-platform-payment-scams',
      'fake-listing-payment-scams',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'why-hack-accounts', title: '1. Why Scammers Target High-Reputation Accounts' },
      { id: 'common-attack-vectors', title: '2. Common Account Takeover Vectors' },
      { id: 'spotting-phishing-links', title: '3. How to Spot Fake Phishing Domains' },
      { id: 'security-hardening', title: '4. Essential Account Security Hardening' },
      { id: 'compromise-response', title: '5. Immediate Steps if Your Account is Compromised' }
    ],
    content: `
# How to Protect Your P2P Marketplace Account From Takeover Scams

Established marketplace accounts with verified badges, 5-star ratings, and positive trading histories are valuable targets for fraudsters. Scammers hijack legitimate accounts to publish fake high-value listings that immediately appear trustworthy to unsuspecting buyers.

This guide details how account takeover attacks occur and the exact steps to lock down your marketplace profile.

---

## 1. Why Scammers Target High-Reputation Accounts

Building a verified profile with genuine buyer reviews takes months. Scammers hijack aged accounts so they can post fake RTX 4090 or PS5 listings and collect advance UPI deposits before the real owner discovers the breach.

---

## 2. Common Account Takeover Vectors

1. **Phishing Links in Marketplace Chat:**
   A buyer sends a link saying: *"Please verify your bank details here to receive payment: \`gamegear-secure-pay.xyz\`."* Entering your login credentials immediately exposes your account.
2. **Credential Stuffing from Data Leaks:**
   Using the same password on gaming forums, Discord, and your marketplace account allows automated bots to log in using credentials leaked from unrelated website breaches.
3. **Fake Support Staff Impersonation:**
   Scammers message pretending to be "GGS Help Desk" or "Marketplace Compliance," claiming your listing is suspended unless you provide an OTP or password.

> **RULE:** Official GGS support staff will **NEVER** ask for your account password, login OTP, or bank UPI PIN.

---

## 3. How to Spot Fake Phishing Domains

* **Check the URL carefully:** Ensure the address in your browser is exactly the official domain. Watch out for typosquatting (e.g., \`ggs-marketplace-auth.net\` or \`gamegear-swap.co\`).
* **Look for SSL Certificate Details:** Check that the connection is secure and verified.

---

## 4. Essential Account Security Hardening

- [ ] **Enable Multi-Factor Authentication (MFA / 2FA):** Always use an authenticator app (Google Authenticator, Authy) rather than SMS where available.
- [ ] **Use a Unique 16+ Character Password:** Use a dedicated password manager (Bitwarden, 1Password) to generate unique passwords.
- [ ] **Never Share Verification OTPs:** Treat OTP codes as strictly confidential.
- [ ] **Review Active Login Sessions:** Periodically check active sessions in your profile settings and terminate unrecognized devices.

---

## 5. Immediate Steps if Your Account is Compromised

1. **Change Your Password Immediately:** If you still have access, update your password and terminate all active sessions.
2. **Contact GGS Security Support:** Alert our security team to temporarily freeze your account and remove unauthorized listings posted in your name.
3. **Warn Your Contacts:** If scammers messaged active buyers from your chat history, notify those buyers immediately.
`
  },
  {
    id: 'art-12',
    slug: 'chargeback-refund-abuse',
    url: '/blog/safety/chargeback-refund-abuse',
    title: 'Chargeback and Refund Abuse: Understanding Marketplace Payment Risks',
    seoTitle: 'Chargeback & Refund Abuse: P2P Payment Risk Guide | GGS',
    metaDescription: 'Understand how payment reversals, chargeback disputes, and false refund claims work in peer-to-peer electronics transactions, and how sellers protect funds.',
    primaryKeyword: 'chargeback refund abuse',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '7 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Financial Integrity Specialist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed overview of credit card chargeback mechanisms, friendly fraud, false non-delivery claims, and documentation strategies for marketplace sellers.',
    tags: ['PaymentRisks', 'ChargebackProtection', 'DisputeRules', 'FriendlyFraud'],
    relatedSlugs: [
      'fake-payment-courier-scams',
      'shipping-damage-empty-box-scams',
      'off-platform-payment-scams'
    ],
    tableOfContents: [
      { id: 'what-is-chargeback-abuse', title: '1. What is Chargeback Abuse ("Friendly Fraud")?' },
      { id: 'how-chargebacks-work', title: '2. How Payment Provider Dispute Rules Work' },
      { id: 'common-abuse-scenarios', title: '3. Common Refund & Chargeback Abuse Scenarios' },
      { id: 'seller-protection-strategies', title: '4. How Sellers Can Defend Against False Claims' },
      { id: 'dispute-management', title: '5. Managing Payment Disputes Fairly' }
    ],
    content: `
# Chargeback and Refund Abuse: Understanding Marketplace Payment Risks

Payment chargebacks are an essential consumer protection designed to shield buyers from unauthorized credit card transactions and unfulfilled merchant orders. However, in peer-to-peer electronics marketplaces, chargeback mechanisms are sometimes exploited by dishonest buyers through "friendly fraud."

This guide explains how chargebacks operate, the risks involved in different payment methods, and how sellers can establish documented evidence to defend against fraudulent claims.

---

## 1. What is Chargeback Abuse ("Friendly Fraud")?

Chargeback abuse occurs when a buyer receives authentic, fully functional gaming hardware, but later files a false dispute with their credit card issuer or bank claiming:
* *"I never authorized this transaction."*
* *"The package was never delivered."*
* *"The item arrived completely defective or empty."*

The payment provider temporarily reverses the funds from the seller while the dispute is investigated.

---

## 2. How Payment Provider Dispute Rules Work

Chargebacks are governed by payment networks (Visa, Mastercard, RuPay) and banking regulations.

* **Issuer Priority:** Banks generally side with their cardholders initially unless the seller provides incontrovertible proof of delivery, serial number match, and customer authorization.
* **Evidence Window:** Sellers typically have **7 to 14 days** to submit representment evidence to contest a chargeback.

---

## 3. Common Refund & Chargeback Abuse Scenarios

1. **The "Unauthorized Card" Claim:** A buyer purchases a gaming console using a family member's credit card, and the cardholder later files an unauthorized transaction claim.
2. **The "Empty Box" False Report:** The buyer receives a high-end GPU, claims the box contained paper, and demands an instant card refund.
3. **The Component Swap Refund:** The buyer requests a return, but sends back their own broken component instead of the seller's working hardware.

---

## 4. How Sellers Can Defend Against False Claims

* **Always Retain Proof of Delivery:** Retain digitally signed courier delivery receipts showing recipient signature and GPS delivery coordinates.
* **Record Physical Serial Numbers on Invoices:** Ensure the buyer acknowledges the exact serial number in chat prior to dispatch.
* **Use Platform Integrated Payments:** Platform escrow and verified transaction records provide structured mediation that protects both parties against one-sided bank clawbacks.

---

## 5. Managing Payment Disputes Fairly

When a legitimate issue occurs (such as accidental transit damage), honest communication and courier insurance claims are the proper solution. Understanding payment provider rules ensures sellers protect their business while maintaining fair trading standards.
`
  },
  {
    id: 'art-13',
    slug: 'off-platform-payment-scams',
    url: '/blog/safety/off-platform-payment-scams',
    title: 'Why You Should Avoid Off-Platform Payments on P2P Marketplaces',
    seoTitle: 'Why You Must Avoid Off-Platform Payments | GGS Safety Guide',
    metaDescription: 'Why moving conversations to WhatsApp/Telegram and paying via direct unverified links eliminates your marketplace protection and leads to scams.',
    primaryKeyword: 'off platform payment scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '6 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Marketplace Trust & Safety',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed explanation of why fraudsters pressure users into WhatsApp, Telegram, or fake escrow links, and how staying on-platform guarantees protection.',
    tags: ['PlatformSafety', 'WhatsAppScams', 'EscrowSafety', 'BuyerSecurity'],
    relatedSlugs: [
      'fake-listing-payment-scams',
      'account-takeover-prevention',
      'used-gaming-hardware-buying-checklist'
    ],
    tableOfContents: [
      { id: 'the-off-platform-trap', title: '1. The Off-Platform Trap Explained' },
      { id: 'why-scammers-insist', title: '2. Why Scammers Urge You to Leave the Platform' },
      { id: 'fake-escrow-links', title: '3. Fake Escrow & Fake Delivery Websites' },
      { id: 'loss-of-protection', title: '4. What Protections You Lose When Leaving' },
      { id: 'what-to-do', title: '5. How to Respond to Off-Platform Pressure' }
    ],
    content: `
# Why You Should Avoid Off-Platform Payments on P2P Marketplaces

One of the most common warning signs across peer-to-peer marketplaces is a buyer or seller who urgently pressures you to move communication away from the platform onto WhatsApp, Telegram, Discord, or direct email.

While messaging apps are convenient, leaving the verified platform strips away all security guardrails, chat moderation logs, and dispute protection.

---

## 1. The Off-Platform Trap Explained

A typical scam message looks like this:
> *"I am rarely online here. Please message my WhatsApp at +91-98XXXXXX right now for quick deal and instant discount."*

Once on WhatsApp:
* The scammer sends fake escrow links mimicking the marketplace.
* They share forged identity cards to build false trust.
* They request advance UPI or cryptocurrency transfers.

---

## 2. Why Scammers Urge You to Leave the Platform

1. **To Evade Automated Safety Filters:** Platform chat systems automatically flag suspicious payment links, blacklisted phone numbers, and known scam phrases.
2. **To Prevent Account Bans from Stopping the Scam:** If our moderators ban a scammer's profile on GGS, they can still continue defrauding you on WhatsApp if you left the platform.
3. **To Eliminate Evidence:** Off-platform chat logs cannot be verified by platform moderators during dispute investigations.

---

## 3. Fake Escrow & Fake Delivery Websites

Scammers often create clones of courier or marketplace websites (e.g., \`ggs-secure-escrow.in\` or \`bluedart-safe-pay.com\`) that claim:
* *"Funds are safely held by GGS Escrow. Goods will be delivered in 24 hours. Click here to deposit."*

These websites are 100% fraudulent. GGS never operates external payment websites or third-party escrow domains.

---

## 4. What Protections You Lose When Leaving

* **Verified Chat Audit Trails:** On-platform messages are encrypted and timestamped for dispute evidence.
* **Moderation & Account Verification:** You lose visibility over whether the user's account has been flagged or banned.
* **Dispute Resolution Support:** Platform customer support cannot enforce refunds for payments sent via external third-party channels.

---

## 5. How to Respond to Off-Platform Pressure

If a user refuses to communicate on-platform:
1. **Reply Firmly:** *"For safety and verification, I only communicate and transact directly inside the GGS platform."*
2. **If They Insist:** Block the user and report the conversation to GGS moderation.
`
  },
  {
    id: 'art-14',
    slug: 'fake-review-scams',
    url: '/blog/safety/fake-review-scams',
    title: 'Fake Reviews and Reputation Manipulation on P2P Marketplaces',
    seoTitle: 'Fake Reviews & Reputation Manipulation Guide | GGS Safety',
    metaDescription: 'How to spot fake 5-star seller ratings, review rings, and manipulated feedback on peer-to-peer gaming hardware marketplaces.',
    primaryKeyword: 'fake review scams',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '6 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Fraud Team',
      role: 'Trust & Reputation Analyst',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detailed analysis of feedback fraud: spotting coordinated review rings, generic bot ratings, fake transaction farming, and verifying genuine seller history.',
    tags: ['ReputationSafety', 'ReviewFraud', 'SellerTrust', 'MarketplaceIntegrity'],
    relatedSlugs: [
      'fake-listing-payment-scams',
      'used-gaming-hardware-buying-checklist',
      'account-takeover-prevention'
    ],
    tableOfContents: [
      { id: 'why-reviews-matter', title: '1. The Value of Seller Reputation' },
      { id: 'how-reviews-are-faked', title: '2. How Feedback & Reviews are Manipulated' },
      { id: 'spotting-fake-reviews', title: '3. Red Flags of Artificial Feedback' },
      { id: 'evaluating-reputation', title: '4. How to Authenticate a Seller\'s Track Record' },
      { id: 'reporting-manipulation', title: '5. Reporting Suspicious Feedback' }
    ],
    content: `
# Fake Reviews and Reputation Manipulation on P2P Marketplaces

User reviews and reputation ratings are the backbone of trust on peer-to-peer marketplaces. However, unscrupulous sellers sometimes attempt to artificially boost their profiles using **review rings**, dummy transactions, or purchased 5-star ratings.

This guide explains how review manipulation operates and how to evaluate a seller's feedback profile accurately.

---

## 1. The Value of Seller Reputation

A seller with high ratings and verified feedback naturally attracts buyers with less friction. Fraudsters recognize this and use tactics like "feedback farming"—creating multiple dummy accounts to leave glowing reviews on low-cost items before listing a fake high-ticket item like an RTX 4090.

---

## 2. How Feedback & Reviews are Manipulated

1. **Coordinated Review Rings:** A network of colluding accounts created by the same person or group leaving reciprocal 5-star reviews on zero-value transactions.
2. **Low-Value Farming:** Completing 10 dummy transactions for ₹50 items (cables, stickers) to build a 100% positive rating, followed by an immediate listing of a ₹1,00,000 gaming laptop.
3. **Generic Copied Feedback:** Bot-generated comments like "Very good seller highly recommended" repeated word-for-word across multiple reviews on the same day.

---

## 3. Red Flags of Artificial Feedback

* **Cluster Timestamps:** Multiple 5-star reviews submitted within minutes or hours of each other on newly created accounts.
* **Reviewer Profile Age:** Accounts leaving the reviews were created on the same day as the seller's profile.
* **Absence of Hardware Details:** Reviews lack specific component mentions (e.g., "Tested the RTX 3070 with FurMark, thermals are great at 68°C").

---

## 4. How to Authenticate a Seller's Track Record

* **Check Verified Purchase Badges:** Look for reviews attached to completed platform transactions.
* **Review Transaction Variety:** A trustworthy seller has a history of selling varied gaming hardware over several months.
* **Look for the GGS KYC Verification Badge:** Government ID-verified sellers provide accountability that cannot be forged with bot reviews.

---

## 5. Reporting Suspicious Feedback

If you notice a seller with suspicious or coordinated review patterns, click **Report User** in their profile. Our integrity team investigates IP clustering, device fingerprints, and transaction history to remove manipulated ratings.
`
  },
  {
    id: 'art-15',
    slug: 'used-gaming-hardware-buying-checklist',
    url: '/blog/safety/used-gaming-hardware-buying-checklist',
    title: 'The Complete Used Gaming Hardware Buying Checklist',
    seoTitle: 'The Complete Used Gaming Hardware Buying Checklist (2026) | GGS',
    metaDescription: 'The definitive pre-owned gaming hardware buying checklist. Comprehensive physical inspection, thermal testing, price checks, and anti-fraud verification steps.',
    primaryKeyword: 'used gaming hardware buying checklist',
    category: 'Safety & Fraud Prevention',
    categorySlug: 'safety',
    readingTime: '10 min read',
    publishedAt: '2026-09-08',
    author: {
      name: 'GGS Safety & Hardware Team',
      role: 'Master Hardware Architect',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120'
    },
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'The master pillar checklist for buying used PCs, GPUs, consoles, monitors, and peripherals. Print or save this complete pre-payment verification guide.',
    tags: ['MasterChecklist', 'HardwareGuide', 'SafetyPillar', 'PCInspection'],
    relatedSlugs: [
      'verify-used-pc-specifications',
      'fake-gpu-scams',
      'test-used-gaming-hardware',
      'fake-listing-payment-scams'
    ],
    tableOfContents: [
      { id: 'master-workflow', title: '1. The Master 6-Phase Buying Workflow' },
      { id: 'phase-1-pre-contact', title: 'Phase 1: Pre-Contact & Price Analysis' },
      { id: 'phase-2-seller-verification', title: 'Phase 2: Seller & Profile Verification' },
      { id: 'phase-3-spec-audit', title: 'Phase 3: Hardware Specification Audit' },
      { id: 'phase-4-physical-check', title: 'Phase 4: Physical Hands-On Inspection' },
      { id: 'phase-5-stress-testing', title: 'Phase 5: Benchmark & Stress Testing' },
      { id: 'phase-6-payment-handover', title: 'Phase 6: Safe Payment & Final Handover' },
      { id: 'device-specific-checklists', title: 'Device-Specific Quick Reference Checklists' }
    ],
    content: `
# The Complete Used Gaming Hardware Buying Checklist

Buying pre-owned gaming hardware is one of the smartest ways to build a high-performance gaming setup on a budget. However, navigating classifieds requires a methodical, step-by-step verification process to avoid defective parts, fake listings, and modified hardware.

This **Master Buying Checklist** is your complete reference guide covering every phase—from initial listing evaluation to final payment.

---

## 1. The Master 6-Phase Buying Workflow

\`\`\`text
[ Phase 1: Price Check ] ➔ [ Phase 2: Seller Check ] ➔ [ Phase 3: Spec Audit ]
                                                                 ↓
[ Phase 6: Safe Payment ] 🠔 [ Phase 5: Stress Test ] 🠔 [ Phase 4: Physical Test ]
\`\`\`

---

## Phase 1: Pre-Contact & Price Analysis
- [ ] **Market Price Sanity Check:** Compare the asking price against recent completed sales on GGS. If an RTX 3080 is listed for ₹15,000 when market rate is ₹30,000, treat with extreme caution.
- [ ] **Reverse Image Search:** Verify photos are not taken from Reddit or eBay.
- [ ] **Evaluate Description Detail:** Authentic sellers list exact brand models, purchase dates, warranty status, and reasons for selling.

---

## Phase 2: Seller & Profile Verification
- [ ] **Check GGS Verification Badge:** Look for Government ID-verified sellers.
- [ ] **Review Member Age & Feedback:** Check how long the account has been active.
- [ ] **Request Custom Timestamp Photo:** Ask for a photo of the item with today's date and both usernames written on paper beside the hardware.
- [ ] **Keep All Chats on GGS:** Refuse requests to move communication to WhatsApp or Telegram ([Read our Off-Platform Guide](/blog/safety/off-platform-payment-scams)).

---

## Phase 3: Hardware Specification Audit
- [ ] **Verify Exact CPU Generation:** Confirm exact model (e.g., Ryzen 5 5600X or i5-12400F), not generic "i7 Processor" ([Read our Spec Verification Guide](/blog/safety/verify-used-pc-specifications)).
- [ ] **Confirm GPU Chip Details in GPU-Z:** Ensure genuine shader counts, real VRAM capacity, and zero \`[FAKE]\` warnings ([Read our Fake GPU Guide](/blog/safety/fake-gpu-scams)).
- [ ] **Check SSD Health in CrystalDiskInfo:** S.M.A.R.T. health percentage should be above 80% with low reallocated sector counts.
- [ ] **Verify RAM Dual-Channel Operation:** Confirm 2 or 4 matched sticks running at full XMP/DOCP rated MHz speeds in CPU-Z.

---

## Phase 4: Physical Hands-On Inspection
- [ ] **Inspect PCB & Solder Mask:** Check for browning, burnt smell, or sticky flux residue indicating DIY rework ([Read our Refurbished Hardware Guide](/blog/safety/repaired-refurbished-hardware)).
- [ ] **Test Cooling Fans:** Spin fans manually to ensure bearings rotate silently without wobble or grinding.
- [ ] **Inspect I/O Ports:** Check HDMI, DisplayPort, and USB ports for bent pins or physical damage.
- [ ] **Check Serial Number Stickers:** Verify the serial number on the hardware matches the original box and invoice.

---

## Phase 5: Benchmark & Stress Testing
- [ ] **15-Minute GPU Stress Test:** Run FurMark or 3DMark Time Spy. Verify core temp stays below 80°C and no artifacting occurs ([Read our Hardware Testing Guide](/blog/safety/test-used-gaming-hardware)).
- [ ] **CPU Multi-Core Cinebench Run:** Confirm the system does not crash or thermal throttle uncontrollably under sustained load.
- [ ] **Console Online Network Test:** Sign into PSN or Xbox Live to confirm zero hardware bans ([Read our Stolen/Banned Device Guide](/blog/safety/stolen-account-locked-devices)).

---

## Phase 6: Safe Payment & Final Handover
- [ ] **Never Pay Advance Booking Deposits:** Pay only after physical inspection or through platform protection ([Read our Payment Scam Guide](/blog/safety/fake-listing-payment-scams)).
- [ ] **Confirm Direct Banking App Settlement:** If you are the seller, verify balance in your bank app, not via screenshot ([Read our Seller Protection Guide](/blog/safety/fake-payment-courier-scams)).
- [ ] **Collect All Included Accessories:** Power cables, Wi-Fi antennas, controller dongles, and original invoices.

---

## Device-Specific Quick Reference Checklists

### Complete Gaming PC Checklist
* PSU is tier-rated 80-Plus certified from a reputable brand (Corsair, Cooler Master, Deepcool, Seasonic).
* Dual-channel RAM enabled in BIOS.
* Windows boots clean without BSOD errors.
* Case fans, AIO pump, and RGB controllers functioning properly.

### Console Checklist (PS5 / Xbox Series X / Switch)
* Optical disc drive reads game discs smoothly.
* HDMI port displays 4K 60Hz/120Hz without flickering.
* Wireless controller analog sticks tested on Gamepad-Tester.com for zero stick drift.
* Console successfully logs into online multiplayer network.

### Gaming Monitor Checklist
* Tested for dead pixels on full-screen white/black backgrounds.
* High refresh rate (144Hz+) verified in Windows display properties.
* Backlight bleed evaluated in dim lighting.
`
  }
];

// Helper to lookup article by slug
export function getSafetyArticleBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slug.replace(/^\/blog\/safety\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
  return SAFETY_ARTICLES.find(
    (a) => a.slug === cleanSlug || a.slug === slug || a.url === slug || a.url === `/blog/safety/${cleanSlug}`
  ) || null;
}
