import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Cpu, 
  CreditCard, 
  AlertTriangle,
  Lock,
  ChevronRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { SAFETY_ARTICLES } from '../data/safetyBlogData';

export default function SafetyBlogHub() {
  const [apiPosts, setApiPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    const fetchApiPosts = async () => {
      try {
        const res = await api.get('/blog/posts');
        if (Array.isArray(res.data)) {
          setApiPosts(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch blog posts in Safety Hub:', err);
      }
    };
    fetchApiPosts();
  }, []);

  // Merge safety articles with any updated content from the database
  const allArticles = useMemo(() => {
    const map = new Map();
    SAFETY_ARTICLES.forEach(a => map.set(a.slug, a));
    apiPosts.forEach(p => {
      if (map.has(p.slug)) {
        map.set(p.slug, { ...map.get(p.slug), ...p });
      }
    });
    return Array.from(map.values());
  }, [apiPosts]);

  // Filter tags
  const filterTags = [
    { label: 'All 15 Guides', value: 'All' },
    { label: 'Payment & Scams', value: 'Payment' },
    { label: 'GPU & Hardware Testing', value: 'Hardware' },
    { label: 'Console & Account Safety', value: 'Security' },
    { label: 'Checklists', value: 'Checklist' },
  ];

  const pillarArticle = useMemo(() => {
    return allArticles.find(a => a.slug === 'used-gaming-hardware-buying-checklist') || allArticles[0];
  }, [allArticles]);

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      // Tag filtering
      let matchesTag = true;
      if (selectedTag === 'Payment') {
        matchesTag = article.tags.some(t => ['PaymentSafety', 'UPIFraud', 'SellerProtection', 'PaymentScams', 'PlatformSafety', 'PaymentRisks'].includes(t));
      } else if (selectedTag === 'Hardware') {
        matchesTag = article.tags.some(t => ['PCBuilding', 'HardwareTesting', 'GPUVerification', 'FakeGPU', 'MiningGPU', 'Thermals', 'RefurbishedHardware'].includes(t));
      } else if (selectedTag === 'Security') {
        matchesTag = article.tags.some(t => ['ConsoleSafety', 'PS5Bans', 'AccountLock', 'AccountSecurity', 'PhishingProtection', 'ReputationSafety'].includes(t));
      } else if (selectedTag === 'Checklist') {
        matchesTag = article.tags.some(t => ['MasterChecklist', 'HardwareGuide', 'SafetyPillar', 'PCInspection', 'UnboxingEvidence'].includes(t));
      }

      // Search query filtering
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.tags.some(t => t.toLowerCase().includes(query));

      return matchesTag && matchesSearch;
    });
  }, [searchQuery, selectedTag, allArticles]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">Safety & Fraud Prevention</span>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-card/90 to-background border border-border p-6 sm:p-10 mb-10 shadow-xl shadow-black/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4" />
              Safety & Fraud Prevention Hub
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight mb-4">
              P2P Gaming Hardware Safety & Anti-Fraud Center
            </h1>
            
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
              Essential diagnostic guides, verification checklists, and anti-scam tutorials for buying and selling used graphics cards, custom gaming rigs, consoles, and peripherals with confidence.
            </p>

            {/* Search Input */}
            <div className="relative w-full max-w-xl">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search 15 safety guides: GPU-Z, fake GPUs, UPI scams, testing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-card border-border/80 shadow-sm text-sm"
              />
            </div>
          </div>
        </div>

        {/* Pillar Guide Featured Box */}
        {pillarArticle && !searchQuery && selectedTag === 'All' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-violet-400" />
                Featured Master Pillar Guide
              </h2>
              <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                Essential Reading
              </Badge>
            </div>

            <Link
              to={pillarArticle.url}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-violet-500/30 hover:border-violet-500/60 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/5 transition-all card-glow p-6 sm:p-8"
            >
              <div className="lg:col-span-5 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                <img
                  src={pillarArticle.cover_image}
                  alt={pillarArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
                    <Badge className="bg-violet-600/10 text-violet-400 border-violet-500/20 text-[10px] font-bold">
                      {pillarArticle.category}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {pillarArticle.readingTime}
                    </span>
                    <span>•</span>
                    <span>{formatDate(pillarArticle.publishedAt)}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-violet-400 transition-colors mb-3 leading-snug">
                    {pillarArticle.title}
                  </h3>

                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
                    {pillarArticle.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {pillarArticle.tags.map(tag => (
                      <span key={tag} className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-violet-400 pt-2 border-t border-border/60">
                  Read Complete Buying Checklist <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {filterTags.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTag(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === tab.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground">
              All Fraud Prevention Articles ({filteredArticles.length})
            </h2>
            <span className="text-xs text-muted-foreground">Updated for 2026</span>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
                <Link
                  key={article.id || index}
                  to={article.url}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 card-glow flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Cover image */}
                    <div className="aspect-[16/10] w-full overflow-hidden bg-muted relative">
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <Badge className="bg-black/70 backdrop-blur-sm text-white border-white/10 text-[10px] font-semibold">
                          {article.readingTime}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                        <span className="text-cyan-400 font-semibold">{article.category}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-violet-400 transition-colors leading-snug line-clamp-2 mb-2">
                        {article.title}
                      </h3>

                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-3">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px] truncate max-w-[60%]">
                        By {article.author.name}
                      </span>
                      <span className="font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 flex items-center gap-1 transition-colors shrink-0">
                        Read Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base sm:text-lg text-foreground mb-1">No safety guides found</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4">
                Try searching with different keywords like GPU, UPI, testing, or console.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Marketplace Safety Action Banner */}
        <div className="bg-gradient-to-r from-violet-500/10 via-card to-violet-500/5 dark:from-violet-950/50 dark:via-card dark:to-zinc-950 border border-violet-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Ready to Browse Verified Gaming Hardware?
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl">
              Explore thousands of verified gamer listings across Kerala with in-person inspection and verified seller badges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/marketplace">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <ShoppingBag className="w-4 h-4" />
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/blog/safety/used-gaming-hardware-buying-checklist">
              <Button variant="outline" className="border-border">
                Open Checklist
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
