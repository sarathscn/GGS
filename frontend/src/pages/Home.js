import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import ProductCard from '../components/ProductCard';
import { getDistricts } from '../lib/keralaLocations';
import api from '../lib/api';
import { 
  ArrowRight, 
  Gamepad2, 
  Monitor, 
  Cpu, 
  Keyboard,
  Download,
  Package,
  Shield,
  Zap,
  Users,
  Search,
  MapPin,
  Star,
  CheckCircle
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [district, setDistrict] = useState('all');
  const districts = getDistricts();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, latestRes, categoriesRes] = await Promise.all([
        api.get('/listings/featured'),
        api.get('/listings/latest'),
        api.get('/categories'),
      ]);
      setFeaturedListings(featuredRes.data);
      setLatestListings(latestRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (district && district !== 'all') params.set('district', district);
    navigate(`/marketplace?${params.toString()}`);
  };

  const categoryIcons = {
    'pc-components': Cpu,
    'peripherals': Keyboard,
    'consoles': Gamepad2,
    'systems': Monitor,
    'digital': Download,
    'accessories': Package,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-card py-12 lg:py-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=1920')] bg-cover bg-center opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="bg-violet-600/10 text-violet-500 border-violet-500/20 mb-4">
              Kerala's #1 Gaming Marketplace
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              <span className="block">Buy. Sell. Upgrade.</span>
              <span className="gradient-text">Your Gaming Gear</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Kerala's trusted marketplace for pre-owned gaming PCs, consoles, parts, and accessories. 
              Trade safely with verified gamers.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-2 shadow-xl">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search gaming gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-0 focus-visible:ring-0"
                    data-testid="hero-search-input"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[180px] h-12 border-0" data-testid="hero-category-select">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="w-full md:w-[160px] h-12 border-0" data-testid="hero-district-select">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Kerala</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" size="lg" className="h-12 px-8 bg-violet-600 hover:bg-violet-700" data-testid="hero-search-btn">
                  <Search className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Search</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/marketplace">
              <Button variant="outline" size="lg" data-testid="browse-listings-btn">
                Browse Listings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link to="/post">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600" data-testid="post-ad-btn">
                  Post Your Ad
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600" data-testid="login-to-sell-btn">
                  Login to Sell
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Browse Categories</h2>
              <p className="text-muted-foreground mt-1">Find exactly what you're looking for</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" className="hidden sm:flex">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => {
              const IconComponent = categoryIcons[category.slug] || Gamepad2;
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className={`group p-4 rounded-xl border border-border bg-background hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 animate-fadeIn stagger-${index % 6 + 1}`}
                  data-testid={`category-${category.slug}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-violet-600/10 flex items-center justify-center mb-3 group-hover:bg-violet-600/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-violet-500" />
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-violet-500 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {category.subcategories?.length || 0} subcategories
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 mb-2">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Top Picks
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black">Featured Listings</h2>
              </div>
              <Link to="/marketplace?featured=true">
                <Button variant="ghost">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredListings.map((listing, index) => (
                <div key={listing.id} className={`animate-fadeIn stagger-${index % 4 + 1} h-full min-w-0`}>
                  <ProductCard listing={listing} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Latest Listings</h2>
              <p className="text-muted-foreground mt-1">Fresh drops from the community</p>
            </div>
            <Link to="/marketplace">
              <Button variant="ghost">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

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
          ) : latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {latestListings.map((listing, index) => (
                <div key={listing.id} className={`animate-fadeIn stagger-${index % 4 + 1} h-full min-w-0`}>
                  <ProductCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to post your gaming gear!</p>
              <Link to="/post">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  Post Listing
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why GGS Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Why Choose GGS?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join thousands of gamers who trust Game Gear Swap for their buying and selling needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Verified Sellers</h3>
              <p className="text-muted-foreground text-sm">
                KYC verified sellers ensure safe transactions and authentic products
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quick Listing</h3>
              <p className="text-muted-foreground text-sm">
                List your gaming gear in minutes with our simple posting flow
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Gamer Community</h3>
              <p className="text-muted-foreground text-sm">
                Connect with fellow gamers across Kerala who share your passion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 p-8 lg:p-12">
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
                Ready to Sell Your Gaming Gear?
              </h2>
              <p className="text-white/80 mb-6">
                List your items for just ₹10.00 (incl. GST) and reach thousands of gamers across Kerala. 
                Fast, simple, and secure.
              </p>
              <Link to={isAuthenticated ? "/post" : "/login"}>
                <Button size="lg" className="bg-white text-violet-600 hover:bg-white/90" data-testid="cta-sell-btn">
                  Post Your Ad (@ ₹10 incl. GST)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="absolute right-4 -bottom-10 opacity-20 pointer-events-none">
              <img src="/ggs-logo.jpg" alt="" className="w-64 h-64 object-contain rounded-3xl mix-blend-overlay" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
