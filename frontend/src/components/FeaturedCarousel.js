import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ProductCard from './ProductCard';

/**
 * FeaturedCarousel Component
 * Displays an auto-scrolling horizontal carousel of featured listings in a category.
 * Features:
 * - Smooth auto-scroll (4s interval) with pause on hover/touch
 * - Seamless infinite loop transition
 * - Responsive cards (1 on mobile, 2 on tablet, 3-4 on desktop)
 * - Touch swipe gestures for mobile
 * - Accessible Next/Prev buttons and pagination dots
 * - Keyboard navigation (ArrowLeft / ArrowRight)
 * - Respects prefers-reduced-motion
 * - Auto-hidden if 0 featured posts, no auto-scroll if 1 featured post
 */
export default function FeaturedCarousel({
  listings = [],
  categoryName = 'Category',
  title,
  subtitle,
  desktopCount = 3,
  className = 'mb-10 pb-8 border-b border-border/60',
}) {
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === 'undefined') return desktopCount;
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return desktopCount;
  });

  const total = listings.length;
  const hasMultiple = total > 1;

  // Responsive breakpoint tracking
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(desktopCount);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [desktopCount]);

  // Prefers-reduced-motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e) => setPrefersReducedMotion(e.matches);
      if (mq.addEventListener) mq.addEventListener('change', listener);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', listener);
      };
    }
  }, []);

  // Build extended slides for seamless looping
  const { baseList, allSlides, offset } = useMemo(() => {
    if (total <= 1) {
      return { baseList: listings, allSlides: listings, offset: 0 };
    }

    // Ensure baseList is large enough to fill at least visibleCount * 2 cards
    let repeated = [...listings];
    while (repeated.length < visibleCount * 2 || repeated.length < 6) {
      repeated = [...repeated, ...listings];
    }

    const headClones = repeated.slice(-visibleCount);
    const tailClones = repeated.slice(0, visibleCount);
    const slides = [...headClones, ...repeated, ...tailClones];

    return {
      baseList: repeated,
      allSlides: slides,
      offset: visibleCount,
    };
  }, [listings, total, visibleCount]);

  const [currentIndex, setCurrentIndex] = useState(offset);
  const [withTransition, setWithTransition] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(0);

  const isTransitioningRef = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipingRef = useRef(false);

  // Sync index when category/listings or offset changes
  useEffect(() => {
    setWithTransition(false);
    setCurrentIndex(offset);
    isTransitioningRef.current = false;
    const timer = setTimeout(() => setWithTransition(true), 50);
    return () => clearTimeout(timer);
  }, [offset, categoryName]);

  // Active slide index for pagination dots (0 to total - 1)
  const activeDotIndex = useMemo(() => {
    if (total <= 1) return 0;
    const normalized = (currentIndex - offset) % total;
    return normalized < 0 ? normalized + total : normalized;
  }, [currentIndex, offset, total]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!hasMultiple || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
    setLastInteraction(Date.now());
  }, [hasMultiple]);

  const handlePrev = useCallback(() => {
    if (!hasMultiple || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
    setLastInteraction(Date.now());
  }, [hasMultiple]);

  const handleDotClick = useCallback(
    (index) => {
      if (!hasMultiple || isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setWithTransition(true);
      setCurrentIndex(offset + index);
      setLastInteraction(Date.now());
    },
    [hasMultiple, offset]
  );

  // Handle seamless infinite transition snap on transition end
  const handleTransitionEnd = useCallback(() => {
    isTransitioningRef.current = false;
    if (!hasMultiple || total <= 1) return;

    if (currentIndex >= baseList.length + offset) {
      setWithTransition(false);
      setCurrentIndex(offset);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
    } else if (currentIndex <= 0) {
      setWithTransition(false);
      setCurrentIndex(baseList.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
    }
  }, [currentIndex, baseList.length, offset, hasMultiple, total]);

  // Auto-scroll interval (3.8s)
  useEffect(() => {
    if (!hasMultiple || isHovered || isSwiping || prefersReducedMotion) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, 3800);

    return () => clearInterval(interval);
  }, [hasMultiple, isHovered, isSwiping, prefersReducedMotion, handleNext, lastInteraction]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    if (!hasMultiple) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipingRef.current = true;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwipingRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Prevent vertical scrolling only if horizontal swipe dominates
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwipingRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    isSwipingRef.current = false;
    setIsSwiping(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Hide section completely if 0 featured posts
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section
      className={`${className} relative focus:outline-none`}
      aria-roledescription="carousel"
      aria-label={title || `Featured listings in ${categoryName}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="featured-posts-section"
    >
      {/* Header with Title, Badge, and Manual Navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 fill-amber-700 dark:fill-amber-300" />
              Featured Posts
            </Badge>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {subtitle || `Top-rated gaming gear in ${categoryName}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
            {title || `Featured in ${categoryName}`}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:hidden">
              {subtitle}
            </p>
          )}
        </div>

        {/* Previous and Next Navigation Buttons (visible when > 1 post) */}
        {hasMultiple && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border/80 hover:bg-violet-600/10 hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              onClick={handlePrev}
              aria-label="Previous featured listing"
              data-testid="featured-prev-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border/80 hover:bg-violet-600/10 hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              onClick={handleNext}
              aria-label="Next featured listing"
              data-testid="featured-next-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Carousel Track Container */}
      <div
        className="overflow-hidden relative -mx-2 px-0 py-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex"
          style={{
            transform: hasMultiple
              ? `translateX(-${currentIndex * (100 / visibleCount)}%)`
              : 'none',
            transition:
              withTransition && !prefersReducedMotion
                ? 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)'
                : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {allSlides.map((item, idx) => (
            <div
              key={`${item.id || item.slug || idx}-${idx}`}
              className="px-2 shrink-0 box-border h-full"
              style={{
                width: `${100 / visibleCount}%`,
                flex: `0 0 ${100 / visibleCount}%`,
              }}
            >
              <div className="h-full">
                <ProductCard listing={item} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessible Pagination Dots (visible when > 1 post) */}
      {hasMultiple && total <= 12 && (
        <div
          className="flex items-center justify-center gap-1.5 mt-4"
          role="tablist"
          aria-label="Featured listings pagination"
        >
          {listings.map((_, dotIdx) => (
            <button
              key={dotIdx}
              role="tab"
              aria-selected={dotIdx === activeDotIndex}
              aria-label={`Go to featured post ${dotIdx + 1}`}
              onClick={() => handleDotClick(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                dotIdx === activeDotIndex
                  ? 'w-6 bg-violet-500 shadow-sm shadow-violet-500/50'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
