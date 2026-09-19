import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Loader2, 
  BookOpen, 
  Calendar, 
  Eye, 
  Search, 
  ArrowRight, 
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Clock
} from 'lucide-react';
import { SAFETY_ARTICLES } from '../data/safetyBlogData';

export default function Blog() {
  const [apiPosts, setApiPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/blog/posts');
      setApiPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine Safety Articles & API Posts without duplicate slugs
  const allPosts = useMemo(() => {
    const map = new Map();
    // Safety articles first
    SAFETY_ARTICLES.forEach(a => map.set(a.slug, a));
    // Overlay any API posts
    apiPosts.forEach(p => map.set(p.slug, { ...map.get(p.slug), ...p }));
    return Array.from(map.values());
  }, [apiPosts]);

  const categories = useMemo(() => {
    return ['All', 'Safety & Fraud Prevention', ...new Set(allPosts.map(p => p.category).filter(c => c && c !== 'Safety & Fraud Prevention'))];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, selectedCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    return allPosts.find(p => p.slug === 'used-gaming-hardware-buying-checklist') || allPosts[0];
  }, [allPosts]);

  const regularPosts = useMemo(() => {
    return filteredPosts.filter(p => p.slug !== (selectedCategory === 'All' && !searchQuery ? featuredPost?.slug : null));
  }, [filteredPosts, selectedCategory, searchQuery, featuredPost]);

  const formatDate = (dateString) => {
    return new Date(dateString || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            GGS Knowledge Hub & Guides
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            Gaming Marketplace Insights & Safety
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
            Expert diagnostic guides on testing used graphics cards, verifying CPU generations, preventing payment fraud, and safe gaming gear swaps across Kerala.
          </p>
        </div>

        {/* Safety Hub Banner Highlight */}
        <div className="mb-10 bg-gradient-to-r from-emerald-500/10 via-card to-violet-500/10 dark:from-emerald-950/40 dark:via-card dark:to-violet-950/30 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Dedicated Safety & Fraud Prevention Center</h3>
              <p className="text-xs text-muted-foreground">Explore all 15 specialized anti-scam guides, fake GPU checks, and pre-purchase testing routines.</p>
            </div>
          </div>
          <Link to="/blog/safety" className="shrink-0">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 shadow-sm">
              Open Safety Center <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles, GPUs, consoles, safety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card border-border"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Link to Safety category */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Post (Only when on 'All' and no search) */}
        {selectedCategory === 'All' && !searchQuery && featuredPost && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Master Guide</span>
            </div>

            <Link 
              to={featuredPost.url || `/blog/${featuredPost.slug}`}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border rounded-2xl overflow-hidden hover:border-violet-500/50 shadow-xl shadow-black/5 transition-all card-glow"
            >
              <div className="lg:col-span-6 aspect-video lg:aspect-auto h-full min-h-[260px] relative overflow-hidden bg-muted">
                <img
                  src={featuredPost.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <Badge className="bg-violet-600/10 text-violet-400 border-violet-500/20 text-xs font-bold">
                      {featuredPost.category}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readingTime || '8 min read'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(featuredPost.publishedAt || featuredPost.created_at)}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-violet-400 transition-colors leading-snug mb-3">
                    {featuredPost.title}
                  </h2>

                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground font-medium">
                    By {featuredPost.author?.name || featuredPost.author_name || 'GGS Safety Team'}
                  </span>
                  <span className="font-bold text-violet-400 flex items-center gap-1">
                    Read Master Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory === 'All' ? 'All Knowledge Base Guides' : selectedCategory} ({filteredPosts.length})
            </h2>
            <span className="text-xs text-muted-foreground">Sorted by most recent</span>
          </div>

          {regularPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Link
                  key={post.slug || post.id}
                  to={post.url || `/blog/${post.slug}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 card-glow flex flex-col justify-between h-full shadow-sm"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-[16/10] w-full overflow-hidden bg-muted relative">
                      <img
                        src={post.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <Badge className="bg-black/70 backdrop-blur-sm text-white border-white/10 text-[10px]">
                          {post.readingTime || '6 min read'}
                        </Badge>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                        <Badge variant="outline" className="text-[10px] border-border text-cyan-400">
                          {post.category}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(post.publishedAt || post.created_at)}</span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-violet-400 transition-colors leading-snug line-clamp-2 mb-2">
                        {post.title}
                      </h3>

                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px] truncate max-w-[60%]">
                        {post.author?.name || post.author_name || 'GGS Team'}
                      </span>
                      <span className="font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 flex items-center gap-1 transition-colors">
                        Read <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground mb-1">No articles found</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4">Try searching for a different keyword or select another category</p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
