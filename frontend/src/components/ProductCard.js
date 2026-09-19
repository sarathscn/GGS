import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Tag, CheckCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export default function ProductCard({ listing: listingProp, product, onWishlistChange }) {
  const listing = useMemo(() => listingProp || product || {}, [listingProp, product]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Normalize raw images
  const images = useMemo(() => {
    if (!listing) return ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600&auto=format&fit=crop&q=80'];
    let list = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      list = listing.images;
    } else if (typeof listing.images === 'string') {
      try {
        const parsed = JSON.parse(listing.images);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        list = [listing.images];
      }
    } else if (listing.image_url) {
      list = [listing.image_url];
    } else if (listing.image) {
      list = [listing.image];
    }
    const clean = list.filter((img) => typeof img === 'string' && img.trim().length > 0);
    return clean.length > 0
      ? clean
      : ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600&auto=format&fit=crop&q=80'];
  }, [listing]);

  const hasMultipleImages = images.length > 1;

  // Extended slides with cloned tail & head for seamless infinite continuous rotation
  const extendedSlides = useMemo(() => {
    if (!hasMultipleImages) return images;
    return [images[images.length - 1], ...images, images[0]];
  }, [images, hasMultipleImages]);

  // Slide state: starts at index 1 for extended slides (real 1st image)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(hasMultipleImages ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const isTransitioningRef = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipingRef = useRef(false);

  // Compute active image index (0 to images.length - 1) for pagination indicators
  const activeImageIdx = useMemo(() => {
    if (!hasMultipleImages) return 0;
    if (currentSlideIndex === 0) return images.length - 1;
    if (currentSlideIndex === extendedSlides.length - 1) return 0;
    return currentSlideIndex - 1;
  }, [currentSlideIndex, extendedSlides.length, images.length, hasMultipleImages]);

  // Reset slide index smoothly when listing changes
  useEffect(() => {
    setWithTransition(false);
    setCurrentSlideIndex(hasMultipleImages ? 1 : 0);
    isTransitioningRef.current = false;
    const timer = setTimeout(() => setWithTransition(true), 50);
    return () => clearTimeout(timer);
  }, [listing?.id, hasMultipleImages]);

  // Automatic horizontal image carousel / continuous auto-scroll
  useEffect(() => {
    if (!hasMultipleImages || isInteracting) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = setInterval(() => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setWithTransition(true);
      setCurrentSlideIndex((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, [hasMultipleImages, isInteracting]);

  // Handle transition end for seamless infinite loop reset (no visible jump)
  const handleTransitionEnd = useCallback(() => {
    isTransitioningRef.current = false;
    if (!hasMultipleImages) return;

    if (currentSlideIndex === extendedSlides.length - 1) {
      // Reached cloned first slide -> silently snap to real first slide (index 1)
      setWithTransition(false);
      setCurrentSlideIndex(1);
    } else if (currentSlideIndex === 0) {
      // Reached cloned last slide -> silently snap to real last slide (index images.length)
      setWithTransition(false);
      setCurrentSlideIndex(images.length);
    }
  }, [currentSlideIndex, extendedSlides.length, hasMultipleImages, images.length]);

  // Fallback safety timer to ensure transition never gets stuck if event doesn't fire
  useEffect(() => {
    if (!withTransition) {
      const raf = requestAnimationFrame(() => setWithTransition(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [withTransition]);

  // Wishlist check
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && listing?.id) {
      api.get(`/wishlist/check/${listing.id}`)
        .then((res) => {
          if (isMounted) setInWishlist(Boolean(res.data?.in_wishlist));
        })
        .catch((err) => console.error('Failed to check wishlist:', err));
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, listing?.id]);

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

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioningRef.current || !hasMultipleImages) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentSlideIndex((prev) => prev - 1);
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioningRef.current || !hasMultipleImages) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentSlideIndex((prev) => prev + 1);
  };

  const handleSelectDot = (e, dotIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioningRef.current || !hasMultipleImages) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentSlideIndex(dotIndex + 1);
  };

  const handleTouchStart = (e) => {
    setIsInteracting(true);
    isSwipingRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    setIsInteracting(false);
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (isSwipingRef.current && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        // Swipe left -> advance to next slide
        if (!isTransitioningRef.current && hasMultipleImages) {
          isTransitioningRef.current = true;
          setWithTransition(true);
          setCurrentSlideIndex((prev) => prev + 1);
        }
      } else {
        // Swipe right -> advance to prev slide
        if (!isTransitioningRef.current && hasMultipleImages) {
          isTransitioningRef.current = true;
          setWithTransition(true);
          setCurrentSlideIndex((prev) => prev - 1);
        }
      }
    }
    isSwipingRef.current = false;
  };

  const formatPrice = (price) => {
    if (listing.price_type === 'free') return 'Free';
    if (listing.price_type === 'negotiable' && (!price || Number(price) === 0)) return 'Negotiable';
    if (listing.price_type === 'exchange' && (!price || Number(price) === 0)) return 'Exchange';
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  const conditionColors = {
    New: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    'Like New': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    Excellent: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    Good: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    Fair: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  };

  const priceTypeLabels = {
    fixed: null,
    negotiable: 'Negotiable',
    exchange: 'Exchange',
    free: null,
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
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 card-glow cursor-pointer flex flex-col justify-start h-auto min-w-0 max-w-full"
      data-testid={`product-card-${listing.id}`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      <div className="min-w-0 flex flex-col">
        {/* 1. Photos / Image Gallery Area */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950/70 select-none group/carousel"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Snap-to-slide Flex Track with 100% slide width & smooth translateX */}
          <div
            className="flex h-full w-full"
            style={{
              transform: `translateX(-${currentSlideIndex * 100}%)`,
              transition: withTransition ? 'transform 500ms ease-in-out' : 'none',
              willChange: 'transform',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedSlides.map((imgSrc, idx) => (
              <div
                key={idx}
                className="w-full min-w-full h-full shrink-0 flex-shrink-0 relative flex items-center justify-center bg-zinc-950/80"
                style={{ width: '100%', minWidth: '100%', flexShrink: 0 }}
              >
                <img
                  src={imgSrc}
                  alt={`${listing.title || 'Product'} - photo ${idx + 1}`}
                  loading={idx <= 1 ? 'eager' : 'lazy'}
                  draggable={false}
                  className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          {/* Floating Wishlist Button (OVER the photos, top-right corner) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-sm z-20 border border-white/10 transition-transform active:scale-95 ${
              inWishlist ? 'text-red-500' : 'text-white/90 hover:text-white'
            }`}
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            data-testid={`wishlist-btn-${listing.id}`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                inWishlist ? 'fill-current scale-110 text-red-500' : ''
              }`}
            />
          </Button>

          {/* Badges Overlay (Top-Left) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
            {listing.featured && (
              <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 shadow-sm font-semibold">
                Featured
              </Badge>
            )}
            {listing.item_type === 'digital' && (
              <Badge className="bg-cyan-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 shadow-sm font-semibold">
                Digital
              </Badge>
            )}
          </div>

          {/* Views count */}
          {listing.views_count > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full pointer-events-none z-10 shadow-sm">
              <Eye className="w-3 h-3" />
              <span>{listing.views_count}</span>
            </div>
          )}

          {/* Multi-image Controls & Pagination (Only shown when > 1 image) */}
          {hasMultipleImages && (
            <>
              {/* Prev / Next Chevrons */}
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous image"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next image"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-sm"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Pagination Dots (Mapped to real image count) */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-1 z-10 pointer-events-auto">
                {images.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => handleSelectDot(e, dotIdx)}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      dotIdx === activeImageIdx
                        ? 'w-3.5 bg-white shadow-sm'
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card Content Section */}
        <div className="p-3 sm:p-3.5 flex flex-col gap-2 min-w-0">
          {/* 2. Category + Condition Row */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            {/* Category first */}
            <div
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate max-w-[65%]"
              title={listing.category_name}
            >
              <Tag className="w-3 h-3 shrink-0 text-cyan-500" />
              <span className="truncate">{listing.category_name || 'Gaming Gear'}</span>
            </div>
            {/* Condition second */}
            {listing.condition && (
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] py-0 px-1.5 font-semibold ${
                  conditionColors[listing.condition] || 'border-border text-muted-foreground'
                }`}
              >
                {listing.condition}
              </Badge>
            )}
          </div>

          {/* 3. Title (Below Category + Condition) */}
          <Link
            to={listingUrl}
            className="block group-hover:text-violet-400 text-foreground transition-colors min-h-[2.5rem] min-w-0"
            title={listing.title}
          >
            <h3 className="font-bold text-xs sm:text-sm line-clamp-2 leading-snug break-words overflow-hidden text-foreground">
              {listing.title}
            </h3>
          </Link>

          {/* 4. Price + Location (SAME SECTION / SAME ROW) */}
          <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5">
            {/* Price aligned to left */}
            <div className="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[65%]">
              <span
                className={`font-mono text-base sm:text-lg font-black tracking-tight leading-none ${
                  listing.price_type === 'free' || (listing.price_type === 'negotiable' && (!listing.price || Number(listing.price) === 0))
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-violet-700 dark:text-violet-400'
                }`}
                title={formatPrice(listing.price)}
              >
                {formatPrice(listing.price)}
              </span>
              {listing.price_type === 'exchange' && Number(listing.price) > 0 && (
                <span className="text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 shrink-0 leading-tight">
                  Exchange
                </span>
              )}
            </div>

            {/* Location aligned to right */}
            <div
              className="flex items-center justify-end gap-1 text-[10px] sm:text-[11px] text-muted-foreground min-w-0 shrink truncate max-w-[40%]"
              title={listing.location}
            >
              <MapPin className="w-3 h-3 shrink-0 text-violet-600 dark:text-violet-400" />
              <span className="truncate">{listing.location || 'Kerala'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Uploaded User (Below Price + Location row with subtle divider) */}
      <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5 min-w-0">
        <div className="pt-2 border-t border-border/80 flex items-center justify-between min-w-0 gap-2">
          <Link
            to={`/seller/${listing.seller_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-violet-400 text-foreground transition-colors min-w-0 max-w-full"
            data-testid={`seller-link-${listing.seller_id}`}
            title={listing.seller_name}
          >
            <Avatar
              src={listing.seller_avatar}
              name={listing.seller_name}
              size="xs"
              className="w-4 h-4 sm:w-5 sm:h-5 border border-border shrink-0"
            />
            <span className="text-[11px] sm:text-xs truncate font-medium">
              {listing.seller_name || 'Seller'}
            </span>
            {listing.seller_verified && (
              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
          </Link>
          {listing.seller_rating > 0 && (
            <span className="text-[10px] text-amber-500 flex items-center shrink-0">
              ★{listing.seller_rating?.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
