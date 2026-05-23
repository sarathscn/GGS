import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Loader2, BookOpen, Calendar, Eye, ArrowRight } from 'lucide-react';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-violet-600/10 text-violet-500 border-violet-500/20 mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            GGS Blog
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black mb-4">Gaming Insights & Guides</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tips on buying, selling, and staying safe in the gaming marketplace
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500/50 transition-all card-glow"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <Badge variant="outline" className="mb-3">{post.category}</Badge>
                  <h2 className="font-bold text-lg mb-2 group-hover:text-violet-500 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views_count} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Check back soon for gaming guides and tips!</p>
          </div>
        )}
      </div>
    </div>
  );
}
