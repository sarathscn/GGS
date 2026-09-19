import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import FeaturedCarousel from '../components/FeaturedCarousel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, SlidersHorizontal, Gamepad2 } from 'lucide-react';

export default function CategoryListings() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [condition, setCondition] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoryRes, listingsRes, featuredRes] = await Promise.all([
        api.get(`/categories/${slug}`),
        api.get(`/listings?category=${slug}`),
        api.get(`/listings?category=${slug}&featured=true`).catch(() => ({ data: [] })),
      ]);
      setCategory(categoryRes.data);
      setListings(listingsRes.data);

      const featured = (featuredRes.data && featuredRes.data.length > 0)
        ? featuredRes.data.filter((l) => l.status === 'active')
        : (listingsRes.data || []).filter((l) => Boolean(l.featured) && l.status === 'active');
      setFeaturedListings(featured);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings
    .filter(listing => condition === 'all' || listing.condition === condition)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border">
                  <div className="aspect-[4/3] bg-muted"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-5 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link to="/categories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{category?.name}</h1>
            <p className="text-muted-foreground mt-1">{category?.description}</p>
          </div>
          <Badge variant="outline" className="self-start">
            {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'}
          </Badge>
        </div>

        {/* Featured Posts Carousel */}
        <FeaturedCarousel
          listings={featuredListings}
          categoryName={category?.name || 'Category'}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="w-[130px] sm:w-[140px]" data-testid="condition-filter">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="Like New">Like New</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] sm:w-[140px]" data-testid="sort-filter">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredListings.map((listing, index) => (
              <div key={listing.id} className={`animate-fadeIn stagger-${index % 4 + 1} h-full min-w-0`}>
                <ProductCard listing={listing} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-2xl p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/95 dark:bg-zinc-900 border border-border flex items-center justify-center mx-auto mb-4 p-1 shadow-sm">
              <img src="/ggs-logo.jpg" alt="" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-foreground">No listings found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {condition !== 'all' 
                ? `No ${condition.toLowerCase()} items in this category yet.`
                : 'No items in this category yet.'}
            </p>
            <Link to="/post">
              <Button className="bg-violet-600 hover:bg-violet-700 font-bold text-xs h-10 px-4 rounded-xl">
                Post the First Listing (@ ₹10 incl. GST)
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
