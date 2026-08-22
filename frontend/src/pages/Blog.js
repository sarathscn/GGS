import { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/blog/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = 
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find(p => p.slug === 'top-5-scams-avoid-buying-used-gaming-gear') || posts[0];
  const regularPosts = filteredPosts.filter(p => p.id !== (selectedCategory === 'All' && !searchQuery ? featuredPost?.id : null));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            GGS Knowledge Hub & Guides
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            Gaming Marketplace Insights
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
            Expert advice on testing used hardware, safe local Kerala swaps, pricing strategies, and avoiding marketplace scams.
          </p>
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
                className="pl-10 h-11 rounded-xl bg-card"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills (Horizontal Scrolling on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-bold'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-violet-500/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Post (Displayed when on 'All' and no search query) */}
        {selectedCategory === 'All' && !searchQuery && featuredPost && (
          <div className="mb-12">
            <Link
              to={`/blog/${featuredPost.slug}`}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border rounded-2xl overflow-hidden hover:border-violet-500/50 shadow-xl shadow-black/5 transition-all card-glow"
            >
              <div className="lg:col-span-7 aspect-video lg:aspect-auto relative overflow-hidden bg-muted min-h-[260px] sm:min-h-[320px]">
                <img
                  src={featuredPost.cover_image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-violet-600 text-white font-bold text-xs shadow-md">
                    <Sparkles className="w-3 h-3 mr-1" /> Featured Guide
                  </Badge>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="mb-3 text-xs bg-violet-500/10 text-violet-500 border-violet-500/20">
                    {featuredPost.category}
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-violet-500 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(featuredPost.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {featuredPost.views_count} views
                    </span>
                  </div>
                  <span className="font-bold text-violet-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Regular Articles Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-violet-500/50 shadow-md transition-all flex flex-col justify-between card-glow"
              >
                <div>
                  <div className="aspect-video overflow-hidden relative bg-muted">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="secondary" className="text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border-0">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-violet-500 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{post.views_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg text-foreground">No articles match your search</h3>
            <p className="text-muted-foreground text-sm mt-1">Try searching for other keywords or select 'All' categories.</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
