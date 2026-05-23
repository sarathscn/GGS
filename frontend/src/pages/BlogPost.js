import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, Calendar, Eye, User } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/blog/posts/${slug}`);
      setPost(response.data);
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

  const renderMarkdown = (content) => {
    if (!content) return '';
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br/>');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Post Not Found</h2>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <article>
          {/* Header */}
          <header className="mb-8">
            <Badge variant="outline" className="mb-4">{post.category}</Badge>
            <h1 className="text-3xl sm:text-4xl font-black mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.views_count} views</span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          <div className="aspect-video rounded-xl overflow-hidden mb-8">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(post.content)}</p>` }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
