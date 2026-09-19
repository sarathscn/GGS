import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Search as SearchIcon, SlidersHorizontal, X, Gamepad2 } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [condition, setCondition] = useState(searchParams.get('condition') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.get('q')) params.append('search', searchParams.get('q'));
      if (searchParams.get('category') && searchParams.get('category') !== 'all') {
        params.append('category', searchParams.get('category'));
      }
      if (searchParams.get('condition') && searchParams.get('condition') !== 'all') {
        params.append('condition', searchParams.get('condition'));
      }
      if (searchParams.get('min_price')) params.append('min_price', searchParams.get('min_price'));
      if (searchParams.get('max_price')) params.append('max_price', searchParams.get('max_price'));
      if (searchParams.get('featured')) params.append('featured', 'true');

      const response = await api.get(`/listings?${params.toString()}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category !== 'all') params.set('category', category);
    if (condition !== 'all') params.set('condition', condition);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const sortedListings = [...listings].sort((a, b) => {
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

  const hasFilters = query || category !== 'all' || condition !== 'all' || minPrice || maxPrice;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black">Search Listings</h1>
          <p className="text-muted-foreground mt-1">Find the perfect gaming gear</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search gaming gear..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12"
                data-testid="search-query-input"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="search-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger data-testid="search-condition">
                    <SelectValue placeholder="Any Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Min Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  data-testid="search-min-price"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Max Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  data-testid="search-max-price"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" data-testid="search-submit">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600">
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <Badge variant="outline">
            {sortedListings.length} {sortedListings.length === 1 ? 'result' : 'results'}
          </Badge>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[160px]" data-testid="search-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-muted/60"></div>
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedListings.map((listing, index) => (
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
            <h3 className="font-bold text-lg mb-1 text-foreground">No matching listings found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search keywords, district filters, or category selection
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
