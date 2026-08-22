import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Loader2, ShieldCheck } from 'lucide-react';

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    setError(null);
    try {
      // Map aliases
      let resolvedSlug = slug;
      if (slug === 'terms-and-conditions') resolvedSlug = 'terms';
      if (slug === 'marketplace-safety') resolvedSlug = 'safety';

      const response = await api.get(`/pages/${resolvedSlug}`);
      setPage(response.data);
    } catch (err) {
      setError('Page not found');
    } finally {
      setLoading(false);
    }
  };

  // Robust markdown to HTML converter for policies & guides
  const renderMarkdown = (content) => {
    if (!content) return '';
    
    return content
      // Horizontal Rules
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3 text-foreground pb-1 border-b border-border/40">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl sm:text-3xl font-black mt-4 mb-4 text-foreground">$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="italic text-foreground">$1</strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-violet-400">$1</code>')
      // Markdown Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-violet-500 hover:underline font-medium">$1</a>')
      // Lists (numbered and bullets)
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-5 list-decimal text-muted-foreground my-1">$1</li>')
      .replace(/^[\*\-]\s+(.*$)/gim, '<li class="ml-5 list-disc text-muted-foreground my-1">$1</li>')
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

  if (error) {
    return (
      <div className="min-h-[60vh] py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">The policy or document you requested was not found.</p>
          <Link to="/">
            <Button className="bg-violet-600 hover:bg-violet-700">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <article className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-xl shadow-black/5">
          <header className="mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-violet-500 font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Official Marketplace Policy
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{page?.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Last updated: {page?.updated_at ? new Date(page.updated_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }) : 'August 2026'}
            </p>
          </header>

          <div 
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-sm sm:text-base leading-relaxed text-muted-foreground">${renderMarkdown(page?.content)}</p>` }}
          />
        </article>

        {/* Footer Navigation Bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-x-6 gap-y-3 justify-center text-xs text-muted-foreground font-medium">
          <Link to="/page/about" className="hover:text-violet-500 transition-colors">About Us</Link>
          <Link to="/page/safety" className="hover:text-violet-500 transition-colors text-emerald-500">Marketplace Safety</Link>
          <Link to="/page/terms" className="hover:text-violet-500 transition-colors">Terms & Conditions</Link>
          <Link to="/page/privacy" className="hover:text-violet-500 transition-colors">Privacy Policy</Link>
          <Link to="/page/refund-policy" className="hover:text-violet-500 transition-colors">Refund Policy</Link>
          <Link to="/page/contact" className="hover:text-violet-500 transition-colors text-violet-400">Support / Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
