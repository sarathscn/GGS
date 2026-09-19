import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  UserPlus, 
  PlusCircle, 
  Edit3, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  HelpCircle, 
  Search, 
  ChevronRight, 
  Store, 
  ShieldAlert, 
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Layers,
  MapPin,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

export default function HelpGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const sections = [
    { id: 'welcome', title: 'Welcome to GGs', icon: Sparkles },
    { id: 'account', title: 'How to Create an Account', icon: UserPlus },
    { id: 'create-post', title: 'How to Create a Post', icon: PlusCircle },
    { id: 'manage-post', title: 'How to Edit or Delete a Post', icon: Edit3 },
    { id: 'reporting', title: 'How to Report a Post or User', icon: Flag },
    { id: 'best-practices', title: 'What You Should Do', icon: CheckCircle2 },
    { id: 'prohibitions', title: 'What You Should Not Do', icon: XCircle },
    { id: 'security', title: 'Account Safety & Privacy', icon: ShieldCheck },
    { id: 'getting-help', title: 'Getting Help & Support', icon: HelpCircle }
  ];

  const faqs = [
    {
      q: 'Why does GGS charge a ₹10 listing service fee and what is the validity period?',
      a: 'To keep the marketplace clean of bulk bot spam and fake deals, GGS charges a nominal base fee of ₹8.47 plus 18% GST (₹1.53), totaling ₹10.00. Each listing comes with a 90-day active validity period. The listing service charge is non-refundable once published and after the 90-day validity period.'
    },
    {
      q: 'How do I request a 30-day listing expiry extension?',
      a: 'If your item has not sold as it approaches expiry, you can request a one-time 30-day extension directly from your User Dashboard → My Listings by clicking the "Request 30d Extension" button. This automatically links a Support Ticket for admin review.'
    },
    {
      q: 'Can I get a one-time free edit allowance for my listing?',
      a: 'Yes! Sellers can request a one-time free edit allowance via support tickets if significant updates or corrections are needed. Once approved by an admin, you can modify your listing details without paying additional fees.'
    },
    {
      q: 'How do I become a Verified Seller?',
      a: 'Navigate to Dashboard → Profile & Settings → Seller Verification. Upload a valid government ID (Aadhaar, Passport, Driving License, or Voter ID). Once approved by an admin, a green Verified Seller badge appears on your profile and all listings.'
    },
    {
      q: 'Can I test hardware before making payment?',
      a: 'Yes! We strongly recommend meeting in safe public locations (malls, tech cafes, computer repair shops) and stress-testing GPUs (FurMark/GPU-Z), consoles (PSN login), and PCs before handing over cash or UPI transfers.'
    },
    {
      q: 'How can I track the status of my reports or support tickets?',
      a: 'Go to your User Dashboard → Tickets & Reports. You can see the real-time status (Under Review, Resolved, Rejected), the admin decision, and the admin’s official remarks.'
    }
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <div className="border-b border-border/80 bg-gradient-to-b from-violet-950/20 via-background to-background py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Official Platform User Guide
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            How to Use <span className="gradient-text">Game Gear Swap</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Your step-by-step guide to buying, selling, testing hardware, managing listings, and trading safely across Kerala's peer-to-peer gaming community.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search help guide (e.g., listing fee, verify GPU, reporting)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Quick Navigation
              </p>
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <sec.icon className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
              <div className="pt-3 mt-3 border-t border-border">
                <Link
                  to="/blog/safety"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Safety Hub (15 Guides)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Guide Content */}
          <div className="lg:col-span-3 space-y-12">

            {/* SECTION 1: Welcome to GGs */}
            <section id="welcome" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">1. Welcome to GGs</h2>
                  <p className="text-xs text-muted-foreground">Kerala's Dedicated Gaming & Hardware Exchange</p>
                </div>
              </div>

              <div className="text-sm text-foreground/90 space-y-3 leading-relaxed">
                <p>
                  <strong>Game Gear Swap (GGS)</strong> is Kerala's specialized peer-to-peer marketplace created exclusively for gamers, PC enthusiasts, and hardware builders. 
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <p className="text-xs font-bold text-foreground">🎯 What You Can Do</p>
                    <p className="text-xs text-muted-foreground">Trade graphics cards, CPUs, gaming consoles (PS5, Xbox, Switch), mechanical keyboards, custom gaming rigs, and digital collectibles across all 14 districts.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <p className="text-xs font-bold text-foreground">🛡️ Safe, Local Community</p>
                    <p className="text-xs text-muted-foreground">Direct buyer-seller messaging, admin KYC verification badges, localized district/taluk filtering, and transparent admin dispute review.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: How to Create an Account */}
            <section id="account" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">2. How to Create an Account & Profile</h2>
                  <p className="text-xs text-muted-foreground">Registration, Login, and Profile Setup</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                  <li><strong>Sign Up:</strong> Click <strong>Sign Up</strong> in the header. Enter your Full Name (letters and single spaces only), unique Username, Email, and Mobile Phone Number.</li>
                  <li><strong>Authentication:</strong> You can log in securely using your Email & Password or via Mobile OTP authentication.</li>
                  <li><strong>Update Profile:</strong> Navigate to <strong>Dashboard → Profile & Settings</strong> to customize your avatar, bio, and default Kerala location.</li>
                  <li><strong>Seller KYC:</strong> Submit your government ID in the verification tab to earn the official green <strong>Verified Seller</strong> badge.</li>
                </ol>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400">
                  💡 <em>Tip:</em> Always use a strong, unique password and verify that your phone number is correct for local meetup coordination.
                </div>
              </div>
            </section>

            {/* SECTION 3: How to Create a Post */}
            <section id="create-post" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">3. How to Create a Post / Sell Your Ad</h2>
                  <p className="text-xs text-muted-foreground">Step-by-Step Listing Creation Flow</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                <p>Creating an ad on GGS takes less than 2 minutes. Follow these exact steps:</p>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wide">Step 1: Title & Category</p>
                    <p className="text-xs text-muted-foreground">Click <strong>+ Sell (Post Your Ad)</strong>. Enter a descriptive title with brand and model (e.g., <em>"ASUS TUF Gaming RTX 4070 Ti 12GB - 1 Year Warranty"</em>). Select your primary category and subcategory.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wide">Step 2: Condition & Custom Specifications</p>
                    <p className="text-xs text-muted-foreground">Choose an honest condition (<em>Brand New, Like New, Excellent, Good, Fair</em>). Add custom spec rows such as CPU Model, VRAM capacity, Storage Type, or Warranty Period.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wide">Step 3: Upload Original Photos</p>
                    <p className="text-xs text-muted-foreground">Upload 1 to 5 clear, high-resolution original photos of the actual hardware. Stock images or internet downloads are prohibited.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wide">Step 4: Price & Kerala Location</p>
                    <p className="text-xs text-muted-foreground">Set your asking price (₹1 to ₹10,00,000). Select Fixed, Negotiable, or Exchange. Choose your District, Taluk, and Area, and position your pickup pin on Google Maps.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 space-y-1.5">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wide">Step 5: ₹10 Service Fee & Publication</p>
                    <p className="text-xs text-muted-foreground">Review the transparent invoice breakdown: ₹8.47 Base Charge + ₹1.53 (18% GST) = <strong>₹10.00 Total</strong>. Complete payment via UPI or Card to publish your ad immediately.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: How to Edit, Extend, or Delete a Post */}
            <section id="manage-post" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">4. Post Validity, Extensions, Edits & Deletion</h2>
                  <p className="text-xs text-muted-foreground">90-day lifecycle, one-click 30-day extension, and free edit requests</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <span><strong>90-Day Post Validity:</strong> Every published listing remains active for 90 days from its publication date. You can view the exact expiration date and days remaining in your Dashboard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <span><strong>30-Day Expiry Extension:</strong> If your listing hasn't sold as it nears expiration, click <strong>Request 30d Extension</strong> on the listing card. Admins review and grant a single 30-day extension per post.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <span><strong>One-Time Free Edit Allowance:</strong> Need to update photos, price, or description after the initial window? Submit an edit request via <strong>Tickets & Reports</strong>. Once approved, you get a one-time free edit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <span><strong>Mark as Sold:</strong> Once your deal is finalized, click <strong>Mark Sold</strong> so other buyers know it is no longer available.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <span><strong>Safe Deletion & No Refund:</strong> You can delete your listing anytime. Deleted listings are safely hidden from buyers while preserving payment and transaction history for audits. Listing fees are non-refundable after publication and upon expiry/deletion.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 5: How to Report a Post or User */}
            <section id="reporting" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">5. How to Report a Post, Message, or User</h2>
                  <p className="text-xs text-muted-foreground">Community Safety, Moderation, and Decision Transparency</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                <p>If you encounter suspicious activity, fake deals, counterfeit items, or harassment:</p>
                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                  <li><strong>On Listings:</strong> Click the <strong>Report</strong> flag on the product detail page or listing card.</li>
                  <li><strong>In Chat:</strong> Click the three dots menu inside any conversation and select <strong>Report Chat</strong>.</li>
                  <li><strong>Select Reason:</strong> Choose the appropriate category (<em>Fake Deal, Counterfeit Item, Spam, Harassment, Prohibited Goods, Misleading Price</em>).</li>
                  <li><strong>Submit Evidence:</strong> Describe the violation clearly and submit.</li>
                  <li><strong>Track Resolution:</strong> Open your <strong>Dashboard → Tickets & Reports</strong> tab to inspect the administrator's review decision and explanatory remarks in real time.</li>
                </ol>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400">
                  ⚠️ <em>Emergency Notice:</em> For emergencies or physical safety threats, please contact your local law enforcement authorities immediately rather than relying solely on a marketplace ticket.
                </div>
              </div>
            </section>

            {/* SECTION 6: What You Should Do */}
            <section id="best-practices" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">6. What You Should Do (Best Practices)</h2>
                  <p className="text-xs text-muted-foreground">Recommended Practices for Safe & Smooth Trades</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-emerald-400">✅ Meet in Public Places</p>
                  <p className="text-xs text-muted-foreground">Arrange pickups in well-lit public spots (malls, metro stations, coffee shops, or gaming cafes).</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-emerald-400">✅ Test Hardware In Person</p>
                  <p className="text-xs text-muted-foreground">Run benchmark tools (GPU-Z, FurMark, Cinebench) and test consoles for online network connectivity before paying.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-emerald-400">✅ Confirm UPI in Your App</p>
                  <p className="text-xs text-muted-foreground">Never rely on screenshots shown on a buyer's phone. Verify that funds have credited your own banking app.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-emerald-400">✅ Communicate In-App</p>
                  <p className="text-xs text-muted-foreground">Keep chats inside GGS to protect your phone number and maintain documented trade records.</p>
                </div>
              </div>
            </section>

            {/* SECTION 7: What You Should Not Do */}
            <section id="prohibitions" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">7. What You Should Not Do (Prohibitions)</h2>
                  <p className="text-xs text-muted-foreground">Zero Tolerance Policy on Fraud & Marketplace Abuse</p>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <p className="text-xs text-muted-foreground">The following violations result in immediate account termination and forfeiture of verification:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 font-medium">
                    ❌ Demanding advance courier or token deposits before physical inspection.
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 font-medium">
                    ❌ Posting stolen, cloned, or BIOS-flashed fake graphics cards.
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 font-medium">
                    ❌ Scanning reverse UPI QR codes claiming to "receive money".
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 font-medium">
                    ❌ Listing banned gaming accounts, cheats, hacks, or stolen consoles.
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 8: Account Safety and Privacy */}
            <section id="security" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">8. Account Safety & Privacy</h2>
                  <p className="text-xs text-muted-foreground">Protecting Your Account & Personal Credentials</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><strong>Never Share OTPs:</strong> GGS staff will NEVER ask for your login One-Time Password (OTP) or banking credentials.</li>
                  <li><strong>Masked KYC Data:</strong> Verification documents are strictly visible to admins and sensitive numbers are masked in our database.</li>
                  <li><strong>Location Privacy:</strong> Only your general District and Taluk are shown publicly; exact private addresses are never broadcasted.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 9: Getting Help & FAQ */}
            <section id="getting-help" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">9. Frequently Asked Questions & Support</h2>
                  <p className="text-xs text-muted-foreground">Direct Assistance and Help Desk</p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm hover:bg-muted/40 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === idx ? 'rotate-180 text-violet-500' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/50 pt-3 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Support Links Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-cyan-600/20 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-bold text-sm text-foreground">Need dedicated support or want to report an issue?</p>
                  <p className="text-xs text-muted-foreground">Submit a support ticket directly to the GGS moderation team.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to="/page/contact">
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 rounded-xl">
                      Contact Support
                    </Button>
                  </Link>
                  <Link to="/blog/safety">
                    <Button variant="outline" size="sm" className="font-bold text-xs h-9 rounded-xl">
                      Safety Center
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
