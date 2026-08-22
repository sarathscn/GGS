import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const [postRes, allPostsRes] = await Promise.all([
        api.get(`/blog/posts/${slug}`),
        api.get('/blog/posts')
      ]);
      setPost(postRes.data);
      if (Array.isArray(allPostsRes.data)) {
        const related = allPostsRes.data
          .filter(p => p.slug !== slug && (p.category === postRes.data.category || true))
          .slice(0, 3);
        setRelatedPosts(related);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Article link copied to clipboard!');
    }
  };

  const renderMarkdown = (content) => {
    if (!content) return '';
    return content
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl sm:text-2xl font-bold mt-8 mb-3 text-foreground pb-2 border-b border-border/40">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl sm:text-3xl font-black mt-4 mb-4 text-foreground">$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="italic text-foreground">$1</strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-muted-foreground">$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-violet-400">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-violet-500 hover:underline font-semibold">$1</a>')
      // Lists (numbered and bullets)
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-5 list-decimal text-muted-foreground my-1.5 leading-relaxed">$1</li>')
      .replace(/^[\*\-]\s+(.*$)/gim, '<li class="ml-5 list-disc text-muted-foreground my-1.5 leading-relaxed">$1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p class="mb-4 text-sm sm:text-base leading-relaxed text-muted-foreground">')
      // Line breaks
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
      <div className="min-h-[60vh] py-12 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold text-foreground">Article Not Found</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">The article you were looking for doesn't exist or was removed.</p>
          <Link to="/blog">
            <Button className="bg-violet-600 hover:bg-violet-700">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to All Guides
          </Link>

          <Button variant="outline" size="sm" onClick={handleShare} className="h-8 gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" />
            Share Guide
          </Button>
        </div>

        {/* Main Article Container */}
        <article className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-xl shadow-black/5">
          
          {/* Header */}
          <header className="mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-violet-600/10 text-violet-500 border-violet-500/20 text-xs font-bold">
                {post.category}
              </Badge>
              <span className="text-xs text-muted-foreground">• 5 min read</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-500" />
                <span className="font-semibold text-foreground">{post.author_name || 'GGS Moderation Team'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{post.views_count} reads</span>
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

          {/* Article Markdown Body */}
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-sm sm:text-base leading-relaxed text-muted-foreground">${renderMarkdown(post.content)}</p>` }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Related Topics</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-mono">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Safety Callout Box */}
          <div className="mt-8 bg-violet-500/5 border border-violet-500/15 rounded-xl p-5 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block mb-1">Trade Safely on GGS</strong>
              Always meet in safe public spaces in Kerala, inspect hardware before paying, and never send advance money or courier deposits to unverified contacts.
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-foreground mb-6">More Guides & Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-violet-500/50 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2">{r.category}</Badge>
                    <h4 className="font-bold text-sm text-foreground group-hover:text-violet-500 transition-colors line-clamp-2">
                      {r.title}
                    </h4>
                  </div>
                  <span className="text-xs text-violet-500 font-semibold flex items-center gap-1 mt-3">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
