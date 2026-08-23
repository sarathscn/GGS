import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Tag, CheckCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function ProductCard({ listing: listingProp, product, onWishlistChange }) {
  const listing = listingProp || product || {};
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && listing?.id) {
      checkWishlist();
    }
  }, [isAuthenticated, listing?.id]);

  const checkWishlist = async () => {
    try {
      const response = await api.get(`/wishlist/check/${listing.id}`);
      setInWishlist(response.data.in_wishlist);
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${listing.id}`);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist?listing_id=${listing.id}`);
        toast.success('Added to wishlist');
      }
      setInWishlist(!inWishlist);
      onWishlistChange?.();
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (listing.price_type === 'free') return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const conditionColors = {
    'New': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    'Like New': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Excellent': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    'Good': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Fair': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  const priceTypeLabels = {
    'fixed': null,
    'negotiable': 'Negotiable',
    'exchange': 'Exchange',
    'free': null,
  };

  const listingUrl = `/listing/${listing.slug || listing.id}`;

  const handleCardClick = (e) => {
    if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
      return;
    }
    navigate(listingUrl);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('a, button, [role="button"]')) {
        return;
      }
      e.preventDefault();
      navigate(listingUrl);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 card-glow cursor-pointer flex flex-col justify-between h-full"
      data-testid={`product-card-${listing.id}`}
    >
      <div>
        {/* Image Container with Non-nested Link */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Link to={listingUrl} tabIndex={-1} aria-hidden="true" className="block w-full h-full">
            <img
              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=400'}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
          
          {/* Wishlist Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 z-10 ${
              inWishlist ? 'text-red-500' : 'text-white'
            }`}
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            data-testid={`wishlist-btn-${listing.id}`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
            {listing.featured && (
              <Badge className="bg-amber-500 text-white">
                Featured
              </Badge>
            )}
            {listing.item_type === 'digital' && (
              <Badge className="bg-cyan-500 text-white">
                Digital
              </Badge>
            )}
          </div>

          {/* Views */}
          {listing.views_count > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none z-10">
              <Eye className="w-3 h-3" />
              <span>{listing.views_count}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-between">
          {/* Category */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 truncate min-w-0">
            <Tag className="w-3 h-3 shrink-0 text-cyan-500" />
            <span className="truncate">{listing.category_name}</span>
          </div>

          {/* Title Link with fixed 2-line height & word break */}
          <Link 
            to={listingUrl} 
            className="block group-hover:text-violet-500 transition-colors mb-2 min-h-[2.5rem]" 
            title={listing.title}
          >
            <h3 className="font-bold text-sm line-clamp-2 leading-snug break-words overflow-hidden text-foreground">
              {listing.title}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2 min-w-0">
            <p className={`font-mono text-lg font-bold truncate ${listing.price_type === 'free' ? 'text-emerald-500' : 'text-violet-500'}`}>
              {formatPrice(listing.price)}
            </p>
            {priceTypeLabels[listing.price_type] && (
              <span className="text-xs text-muted-foreground truncate shrink-0">{priceTypeLabels[listing.price_type]}</span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <Badge variant="outline" className={`shrink-0 ${conditionColors[listing.condition] || ''}`}>
              {listing.condition}
            </Badge>
            <div 
              className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 max-w-[130px] sm:max-w-[150px] truncate"
              title={listing.location}
            >
              <MapPin className="w-3 h-3 shrink-0 text-violet-400" />
              <span className="truncate">{listing.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Info with Independent Non-nested Link */}
      <div className="px-4 pb-4">
        <div className="pt-3 border-t border-border flex items-center justify-between min-w-0 gap-2">
          <Link 
            to={`/seller/${listing.seller_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:text-violet-500 text-foreground transition-colors z-10 min-w-0 max-w-[70%]"
            data-testid={`seller-link-${listing.seller_id}`}
            title={listing.seller_name}
          >
            <Avatar
              src={listing.seller_avatar}
              name={listing.seller_name}
              size="xs"
              className="w-6 h-6 border border-border"
            />
            <span className="text-xs truncate font-medium">{listing.seller_name}</span>
            {listing.seller_verified && (
              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
          </Link>
          {listing.seller_rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <span className="text-amber-500">★</span>
              <span>{listing.seller_rating?.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
