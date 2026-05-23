import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
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
                className={`group bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 card-glow animate-fadeIn stagger-${index % 6 + 1}`}
                data-testid={`category-card-${category.slug}`}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-600/80 backdrop-blur-sm flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg">{category.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div className="flex items-center text-violet-500 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>Browse Listings</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
