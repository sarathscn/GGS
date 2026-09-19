import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Eye, 
  User, 
  Share2, 
  ShieldCheck, 
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  FileText,
  ShoppingBag,
  ListOrdered
} from 'lucide-react';
import { toast } from 'sonner';
import { getSafetyArticleBySlug, SAFETY_ARTICLES } from '../data/safetyBlogData';

export default function BlogPost() {
  const { slug } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current route is in safety category
  const isSafetySection = location.pathname.startsWith('/blog/safety') || (post && post.category === 'Safety & Fraud Prevention');

  useEffect(() => {
    fetchPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, location.pathname]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      // 1. Try to fetch from backend API first so edited articles from DB are loaded
      const [postRes, allPostsRes] = await Promise.allSettled([
        api.get(`/blog/posts/${slug}`),
        api.get('/blog/posts')
      ]);
      
      let fetchedPost = postRes.status === 'fulfilled' && postRes.value?.data ? postRes.value.data : null;
      let allPosts = allPostsRes.status === 'fulfilled' && Array.isArray(allPostsRes.value?.data) 
        ? allPostsRes.value.data 
        : [];

      // 2. If API post not found, fallback to local safety article dataset
      if (!fetchedPost) {
        fetchedPost = getSafetyArticleBySlug(slug);
      }

      if (fetchedPost) {
        setPost(fetchedPost);
        document.title = `${fetchedPost.seo_title || fetchedPost.title} | Game Gear Swap`;

        // Calculate related posts
        let related = [];
        if (allPosts.length > 0) {
          related = allPosts.filter(p => p.slug !== slug).slice(0, 3);
        }
        if (related.length === 0) {
          related = SAFETY_ARTICLES.filter(a => a.slug !== slug).slice(0, 3);
        }
        setRelatedPosts(related);
      } else {
        setPost(null);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      const fallback = getSafetyArticleBySlug(slug);
      if (fallback) {
        setPost(fallback);
        const related = SAFETY_ARTICLES.filter(a => a.slug !== fallback.slug).slice(0, 3);
        setRelatedPosts(related);
        document.title = `${fallback.title} | GGS Safety Guide`;
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Article link copied to clipboard!');
    }
  };

  // Table of Contents generation
  const tableOfContents = useMemo(() => {
    if (post?.tableOfContents && post.tableOfContents.length > 0) {
      return post.tableOfContents;
    }
    if (!post?.content) return [];
    
    const headings = [];
    const lines = post.content.split('\n');
    lines.forEach(line => {
      const match = line.match(/^##\s+(.*$)/);
      if (match) {
        const title = match[1].trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, title });
      }
    });
    return headings;
  }, [post]);

  // Enhanced markdown renderer
  const renderMarkdown = (content) => {
    if (!content) return '';
    return content
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-8 border-border/80" />')
      // Custom H2 with anchors for TOC
      .replace(/^## (.*$)/gim, (_, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h2 id="${id}" class="text-xl sm:text-2xl font-bold mt-10 mb-4 text-foreground pb-2 border-b border-border/60 scroll-mt-24">${text}</h2>`;
      })
      // Headers H3 & H1
      .replace(/^### (.*$)/gim, '<h3 class="text-base sm:text-lg font-bold mt-6 mb-2.5 text-foreground">$1</h3>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl sm:text-3xl font-black mt-4 mb-6 text-foreground tracking-tight">$1</h1>')
      // Callout box / blockquotes (> [!WARNING], > [!TIP], > [!IMPORTANT], > CRITICAL RULE)
      .replace(/^>\s*\*\*CRITICAL RULE:\*\*\s*(.*$)/gim, '<div class="my-6 p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500 text-zinc-800 dark:text-red-200 text-xs sm:text-sm leading-relaxed"><strong class="text-red-700 dark:text-red-400 block mb-1">CRITICAL RULE</strong>$1</div>')
      .replace(/^>\s*\*\*Rule:\*\*\s*(.*$)/gim, '<div class="my-6 p-4 rounded-xl bg-violet-500/10 border-l-4 border-violet-500 text-zinc-800 dark:text-violet-200 text-xs sm:text-sm leading-relaxed"><strong class="text-violet-900 dark:text-violet-300 block mb-1">Golden Rule</strong>$1</div>')
      .replace(/^>\s*(.*$)/gim, '<blockquote class="my-4 pl-4 border-l-2 border-violet-500/40 italic text-muted-foreground text-xs sm:text-sm">$1</blockquote>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="italic text-foreground">$1</strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-muted-foreground">$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-violet-700 dark:text-violet-300 border border-border/50">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-violet-600 dark:text-violet-400 hover:underline font-semibold">$1</a>')
      // Checklists
      .replace(/^-\s*\[\s*\]\s+(.*$)/gim, '<div class="flex items-start gap-2.5 my-2 text-xs sm:text-sm text-muted-foreground"><span class="w-4 h-4 rounded border border-border bg-muted/40 mt-0.5 shrink-0 flex items-center justify-center"></span><span>$1</span></div>')
      .replace(/^-\s*\[x\]\s+(.*$)/gim, '<div class="flex items-start gap-2.5 my-2 text-xs sm:text-sm text-foreground"><span class="w-4 h-4 rounded bg-emerald-500 text-white mt-0.5 shrink-0 flex items-center justify-center text-[10px]">✓</span><span>$1</span></div>')
      // Standard bullet lists & numbered lists
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-5 list-decimal text-muted-foreground my-1.5 leading-relaxed text-xs sm:text-sm">$1</li>')
      .replace(/^[\*\-]\s+(.*$)/gim, '<li class="ml-5 list-disc text-muted-foreground my-1.5 leading-relaxed text-xs sm:text-sm">$1</li>')
      // Tables (Basic markdown table parsing)
      .replace(/\|(.+)\|/gim, (match) => {
        // Table row wrapper
        return match;
      })
      // Paragraphs & breaks
      .replace(/\n\n/gim, '</p><p class="mb-4 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground">')
      .replace(/\n/gim, '<br/>');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] py-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4 bg-card border border-border rounded-2xl p-8">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold text-foreground">Guide Not Found</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 mb-6">
            The article you were looking for doesn't exist or was relocated.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/blog/safety">
              <Button className="bg-violet-600 hover:bg-violet-700">Safety Hub</Button>
            </Link>
            <Link to="/blog">
              <Button variant="outline">All Blog Posts</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 overflow-x-auto no-scrollbar" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <Link to="/blog" className="hover:text-foreground transition-colors shrink-0">Blog</Link>
          {isSafetySection && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              <Link to="/blog/safety" className="hover:text-foreground transition-colors shrink-0 text-violet-400">
                Safety & Fraud Prevention
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
        </nav>

        {/* Action Header Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to={isSafetySection ? "/blog/safety" : "/blog"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {isSafetySection ? "Back to Safety Hub" : "Back to All Guides"}
          </Link>

          <Button variant="outline" size="sm" onClick={handleShare} className="h-8 gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" />
            Share Article
          </Button>
        </div>

        {/* Main Article Container */}
        <article className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-xl shadow-black/5 mb-10">
          
          {/* Header Metadata */}
          <header className="mb-8 pb-6 border-b border-border">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Link to="/blog/safety">
                <Badge className="bg-violet-600/10 text-violet-400 border-violet-500/20 text-xs font-bold hover:bg-violet-600/20 transition-colors">
                  {post.category || 'Safety & Fraud Prevention'}
                </Badge>
              </Link>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTime || '7 min read'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground pt-3 border-t border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    {post.author?.name || post.author_name || 'GGS Safety & Hardware Team'}
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{post.author?.role || 'Marketplace Safety Desk'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(post.publishedAt || post.created_at)}</span>
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span className="text-[11px] text-muted-foreground/80">(Updated: {formatDate(post.updated_at)})</span>
                  )}
                </div>
                {post.views_count > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.views_count} views</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8 shadow-md border border-border bg-muted">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Table of Contents (for structured navigation) */}
          {tableOfContents.length > 0 && (
            <div className="mb-8 p-5 bg-muted/40 border border-border rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-3">
                <ListOrdered className="w-4 h-4 text-violet-400" />
                In This Guide
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-violet-400 transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-violet-500 font-bold">›</span>
                      <span>{item.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Markdown Body */}
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground">${renderMarkdown(post.content)}</p>` }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Related Topics
              </span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-mono">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Safety Center Callout Box */}
          <div className="mt-8 bg-gradient-to-r from-violet-500/10 via-card to-violet-500/5 dark:from-violet-950/40 dark:via-card dark:to-zinc-950 border border-violet-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-foreground font-bold block mb-0.5">Need to report a suspicious listing?</strong>
                <p className="text-muted-foreground text-xs">Our moderation team investigates flagged hardware and suspicious seller profiles 24/7.</p>
              </div>
            </div>
            <Link to="/contact">
              <Button size="sm" variant="outline" className="border-violet-500/50 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 dark:hover:text-white font-semibold shrink-0">
                Contact Support
              </Button>
            </Link>
          </div>
        </article>

        {/* Related Safety Articles */}
        {relatedPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                Related Safety & Fraud Guides
              </h3>
              <Link to="/blog/safety" className="text-xs font-semibold text-violet-400 hover:underline">
                View all 15 guides →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug || r.id}
                  to={r.url || `/blog/${r.slug}`}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-violet-500/50 transition-all flex flex-col justify-between shadow-sm card-glow"
                >
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2 border-violet-500/20 text-violet-400">
                      {r.category}
                    </Badge>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </h4>
                  </div>
                  <span className="text-xs text-violet-400 font-semibold flex items-center gap-1 mt-3">
                    Read Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Return CTA */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div>
            <h4 className="font-bold text-base text-foreground mb-1">Looking for Tested Gaming Gear in Kerala?</h4>
            <p className="text-muted-foreground text-xs sm:text-sm">Browse thousands of verified PC parts, consoles, and graphics cards.</p>
          </div>
          <Link to="/marketplace">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <ShoppingBag className="w-4 h-4" />
              Explore Marketplace
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
