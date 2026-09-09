import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { getDistricts, getTaluks, getAreas } from '../lib/keralaLocations';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Search, SlidersHorizontal, X, Gamepad2, MapPin, Filter } from 'lucide-react';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [condition, setCondition] = useState(searchParams.get('condition') || 'all');
  const [itemType, setItemType] = useState(searchParams.get('type') || 'all');
  const [district, setDistrict] = useState(searchParams.get('district') || 'all');
  const [taluk, setTaluk] = useState(searchParams.get('taluk') || 'all');
  const [area, setArea] = useState(searchParams.get('area') || 'all');
  const [priceType, setPriceType] = useState(searchParams.get('price_type') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');

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

  const districts = getDistricts();
  const taluks = district !== 'all' ? getTaluks(district) : [];
  const areas = district !== 'all' && taluk !== 'all' ? getAreas(district, taluk) : [];

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
      if (searchParams.get('type') && searchParams.get('type') !== 'all') {
        params.append('item_type', searchParams.get('type'));
      }
      if (searchParams.get('district') && searchParams.get('district') !== 'all') {
        params.append('location_district', searchParams.get('district'));
      }
      if (searchParams.get('taluk') && searchParams.get('taluk') !== 'all') {
        params.append('location_taluk', searchParams.get('taluk'));
      }
      if (searchParams.get('area') && searchParams.get('area') !== 'all') {
        params.append('location_area', searchParams.get('area'));
      }
      if (searchParams.get('price_type') && searchParams.get('price_type') !== 'all') {
        params.append('price_type', searchParams.get('price_type'));
      }
      if (searchParams.get('min_price')) params.append('min_price', searchParams.get('min_price'));
      if (searchParams.get('max_price')) params.append('max_price', searchParams.get('max_price'));
      if (searchParams.get('verified') === 'true') params.append('seller_verified', 'true');
      if (searchParams.get('featured') === 'true') params.append('featured', 'true');
      if (searchParams.get('sort')) params.append('sort', searchParams.get('sort'));

      const response = await api.get(`/listings?${params.toString()}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (overrides = {}) => {
    const params = new URLSearchParams();
    
    const currentQuery = overrides.query !== undefined ? overrides.query : query;
    const currentCategory = overrides.category !== undefined ? overrides.category : category;
    const currentCondition = overrides.condition !== undefined ? overrides.condition : condition;
    const currentItemType = overrides.itemType !== undefined ? overrides.itemType : itemType;
    const currentDistrict = overrides.district !== undefined ? overrides.district : district;
    const currentTaluk = overrides.taluk !== undefined ? overrides.taluk : taluk;
    const currentArea = overrides.area !== undefined ? overrides.area : area;
    const currentPriceType = overrides.priceType !== undefined ? overrides.priceType : priceType;
    const currentMinPrice = overrides.minPrice !== undefined ? overrides.minPrice : minPrice;
    const currentMaxPrice = overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
    const currentVerified = overrides.verifiedOnly !== undefined ? overrides.verifiedOnly : verifiedOnly;
    const currentSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;

    if (currentQuery) params.set('q', currentQuery);
    if (currentCategory !== 'all') params.set('category', currentCategory);
    if (currentCondition !== 'all') params.set('condition', currentCondition);
    if (currentItemType !== 'all') params.set('type', currentItemType);
    if (currentDistrict !== 'all') params.set('district', currentDistrict);
    if (currentTaluk !== 'all') params.set('taluk', currentTaluk);
    if (currentArea !== 'all') params.set('area', currentArea);
    if (currentPriceType !== 'all') params.set('price_type', currentPriceType);
    if (currentMinPrice) params.set('min_price', currentMinPrice);
    if (currentMaxPrice) params.set('max_price', currentMaxPrice);
    if (currentVerified) params.set('verified', 'true');
    if (currentSortBy !== 'latest') params.set('sort', currentSortBy);
    
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setSubcategory('all');
    setCondition('all');
    setItemType('all');
    setDistrict('all');
    setTaluk('all');
    setArea('all');
    setPriceType('all');
    setMinPrice('');
    setMaxPrice('');
    setVerifiedOnly(false);
    setSortBy('latest');
    setSearchParams({});
  };

  const hasFilters = query || category !== 'all' || condition !== 'all' || itemType !== 'all' || 
                     district !== 'all' || taluk !== 'all' || area !== 'all' || priceType !== 'all' || minPrice || maxPrice || verifiedOnly;

  const selectedCategory = categories.find(c => c.slug === category);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory('all'); }}>
          <SelectTrigger data-testid="filter-category">
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

      {/* Subcategory */}
      {selectedCategory?.subcategories?.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <Select value={subcategory} onValueChange={setSubcategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {selectedCategory.subcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range (₹)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            data-testid="filter-min-price"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            data-testid="filter-max-price"
          />
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label>Condition</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger data-testid="filter-condition">
            <SelectValue placeholder="Any Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Condition</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Like New">Like New</SelectItem>
            <SelectItem value="Excellent">Excellent</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>District</Label>
          <Select value={district} onValueChange={(val) => { setDistrict(val); setTaluk('all'); setArea('all'); }}>
            <SelectTrigger data-testid="filter-district">
              <SelectValue placeholder="All Kerala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Kerala</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {district !== 'all' && (
          <div className="space-y-2">
            <Label>Sub-District (Taluk)</Label>
            <Select key={`filter-taluk-${district}`} value={taluk} onValueChange={(val) => { setTaluk(val); setArea('all'); }}>
              <SelectTrigger data-testid="filter-taluk">
                <SelectValue placeholder="All Taluks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Taluks</SelectItem>
                {taluks.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {taluk !== 'all' && (
          <div className="space-y-2">
            <Label>Village / Area</Label>
            <Select key={`filter-area-${taluk}`} value={area} onValueChange={setArea}>
              <SelectTrigger data-testid="filter-area">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={itemType} onValueChange={setItemType}>
          <SelectTrigger data-testid="filter-type">
            <SelectValue placeholder="Physical & Digital" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Physical & Digital</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Type */}
      <div className="space-y-2">
        <Label>Pricing</Label>
        <Select value={priceType} onValueChange={setPriceType}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fixed">Fixed Price</SelectItem>
            <SelectItem value="negotiable">Negotiable</SelectItem>
            <SelectItem value="exchange">Exchange</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verified Seller */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="verified"
          checked={verifiedOnly}
          onCheckedChange={setVerifiedOnly}
          data-testid="filter-verified"
        />
        <label htmlFor="verified" className="text-sm cursor-pointer">
          Verified Sellers Only
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>
          Clear
        </Button>
        <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'} available
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); applyFilters({ sortBy: v }); }}>
              <SelectTrigger className="w-[140px] sm:w-[160px]" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden" data-testid="mobile-filters-btn">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasFilters && <Badge className="ml-2 bg-violet-600">!</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-80 max-w-[85vw] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search listings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="pl-12 h-12"
              data-testid="marketplace-search"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => { setQuery(''); applyFilters({ query: '' }); }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {query && (
              <Badge variant="secondary" className="gap-1">
                Search: {query}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setQuery(''); applyFilters({ query: '' }); }} />
              </Badge>
            )}
            {category !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.slug === category)?.name}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setCategory('all'); applyFilters({ category: 'all' }); }} />
              </Badge>
            )}
            {district !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {district}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setDistrict('all'); setTaluk('all'); setArea('all'); applyFilters({ district: 'all', taluk: 'all', area: 'all' }); }} />
              </Badge>
            )}
            {taluk !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {taluk}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setTaluk('all'); setArea('all'); applyFilters({ taluk: 'all', area: 'all' }); }} />
              </Badge>
            )}
            {area !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {area}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setArea('all'); applyFilters({ area: 'all' }); }} />
              </Badge>
            )}
            {verifiedOnly && (
              <Badge variant="secondary" className="gap-1">
                Verified Only
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setVerifiedOnly(false); applyFilters({ verifiedOnly: false }); }} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600">
              Clear All
            </Button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h3>
              <FilterContent />
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1 w-full min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border animate-pulse overflow-hidden">
                    <div className="aspect-[4/3] bg-muted/60"></div>
                    <div className="p-3.5 space-y-2">
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-5 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {listings.map((listing, index) => (
                  <div key={listing.id} className={`animate-fadeIn stagger-${index % 6 + 1} h-full min-w-0`}>
                    <ProductCard listing={listing} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/95 dark:bg-zinc-900 border border-border flex items-center justify-center mx-auto mb-4 p-1 shadow-sm">
                  <img src="/ggs-logo.jpg" alt="" className="w-full h-full object-contain rounded-xl" />
                </div>
                <h3 className="font-bold text-lg mb-1 text-foreground">No listings found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your district, price range, or category filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
