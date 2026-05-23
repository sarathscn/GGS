import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      const response = await api.get(`/pages/${slug}`);
      setPage(response.data);
    } catch (err) {
      setError('Page not found');
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown to HTML converter
  const renderMarkdown = (content) => {
    if (!content) return '';
    
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black mt-8 mb-4">$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="italic">$1</strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      // Line breaks
      .replace(/\n/gim, '<br/>');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <article className="bg-card border border-border rounded-xl p-6 sm:p-8">
          <header className="mb-8 pb-6 border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-black mb-2">{page?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(page?.updated_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </header>

          <div 
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(page?.content)}</p>` }}
          />
        </article>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <Link to="/page/about" className="hover:text-foreground">About</Link>
          <span>•</span>
          <Link to="/page/contact" className="hover:text-foreground">Contact</Link>
          <span>•</span>
          <Link to="/page/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
          <span>•</span>
          <Link to="/page/terms" className="hover:text-foreground">Terms</Link>
          <span>•</span>
          <Link to="/page/refund-policy" className="hover:text-foreground">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
