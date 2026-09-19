import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import FeaturedCarousel from '../components/FeaturedCarousel';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Headphones, 
  Gamepad2, 
  Users,
  ArrowRight
} from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedListings();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedListings = async () => {
    try {
      const response = await api.get('/listings?featured=true');
      const activeFeatured = (response.data || []).filter(
        (item) => item.featured === true && item.status === 'active'
      );
      setFeaturedListings(activeFeatured);
    } catch (error) {
      console.error('Failed to fetch featured listings:', error);
    }
  };

  const categoryIcons = {
    'gaming-pcs': Monitor,
    'graphics-cards': Cpu,
    'processors': Cpu,
    'motherboards': HardDrive,
    'ram': HardDrive,
    'storage': HardDrive,
    'gaming-consoles': Gamepad2,
    'gaming-accessories': Headphones,
    'game-discs': Gamepad2,
    'digital-accounts': Users,
  };

  const categoryImages = {
    'pc-components': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600',
    'peripherals': 'https://images.unsplash.com/photo-1660391532247-4a8ad1060817?w=600',
    'consoles': 'https://images.unsplash.com/photo-1622979138084-c03ae28968ed?w=600',
    'systems': 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600',
    'digital': 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600',
    'accessories': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
    'gaming-pcs': 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600',
    'graphics-cards': 'https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=600',
    'processors': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600',
    'motherboards': 'https://images.unsplash.com/photo-1650526569688-4a655df65834?w=600',
    'ram': 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600',
    'storage': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600',
    'gaming-consoles': 'https://images.unsplash.com/photo-1622979138084-c03ae28968ed?w=600',
    'gaming-accessories': 'https://images.unsplash.com/photo-1660391532247-4a8ad1060817?w=600',
    'game-discs': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
    'digital-accounts': 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600',
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">All Categories</h1>
          <p className="text-muted-foreground">Browse gaming gear by category</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.slug] || Gamepad2;
            const imageUrl = category.image_url || categoryImages[category.slug] || 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600';
            
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`group bg-card border border-border/80 rounded-xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 card-glow animate-fadeIn stagger-${index % 6 + 1}`}
                data-testid={`category-card-${category.slug}`}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Strong dark gradient overlay: fading smoothly from transparent at the top into near-black at the bottom (55-70% opacity near title area) */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(10, 11, 18, 0.05) 0%, rgba(10, 11, 18, 0.15) 30%, rgba(10, 11, 18, 0.58) 60%, rgba(10, 11, 18, 0.70) 78%, rgba(10, 11, 18, 0.95) 100%)',
                    }}
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-md">
                        <Gamepad2 className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-card">
                  <p className="text-sm text-muted-foreground dark:text-zinc-300 line-clamp-2 leading-relaxed mb-3 font-medium">
                    {category.description}
                  </p>
                  <div className="flex items-center text-violet-600 dark:text-violet-400 font-bold text-sm group-hover:text-violet-700 dark:group-hover:text-violet-300 group-hover:gap-2 transition-all">
                    <span>Browse Listings</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured Posts Carousel at the Bottom of All Categories */}
        {featuredListings.length > 0 && (
          <div className="mt-16 pt-12 border-t border-border/60" data-testid="all-categories-featured-section">
            <FeaturedCarousel
              listings={featuredListings}
              title="Featured Posts"
              subtitle="Discover highlighted gaming gear from trusted sellers"
              desktopCount={3}
              className="relative focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
