import ProductCard from './ProductCard';

export default function PostList({
  listings = [],
  loading = false,
  skeletonCount = 8,
  emptyTitle = 'No posts found',
  emptyMessage = 'There are currently no listings matching your criteria.',
  emptyAction = null,
  onWishlistChange,
  className = '',
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4',
}) {
  if (loading) {
    return (
      <div className={`${gridClassName} ${className}`} data-testid="post-list-skeleton">
        {[...Array(skeletonCount)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border overflow-hidden animate-pulse flex flex-col justify-between h-full"
          >
            <div>
              {/* Image Skeleton with top-right Wishlist Skeleton */}
              <div className="relative aspect-[4/3] bg-muted/60 w-full">
                <div className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/80" />
              </div>

              {/* Content Skeleton: Category -> Condition -> Title -> Price + Location */}
              <div className="p-3 sm:p-3.5 space-y-2.5">
                {/* 1. Category + Condition Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3.5 bg-muted/80 rounded w-1/3" />
                  <div className="h-3.5 bg-muted/80 rounded w-1/4" />
                </div>

                {/* 2. Title */}
                <div className="space-y-1.5 py-0.5">
                  <div className="h-4 bg-muted rounded w-4/5" />
                  <div className="h-3.5 bg-muted/70 rounded w-2/3" />
                </div>

                {/* 3. Price (left) + Location (right) Row */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="h-5 sm:h-6 bg-muted rounded w-1/3" />
                  <div className="h-3.5 bg-muted/60 rounded w-2/5" />
                </div>
              </div>
            </div>

            {/* Uploaded User (below divider) */}
            <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5">
              <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted/80 shrink-0" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className={`text-center py-12 px-4 bg-card/60 rounded-2xl border border-border ${className}`} data-testid="post-list-empty">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <img src="/ggs-logo.jpg" alt="" className="w-9 h-9 object-contain rounded-lg opacity-80" />
        </div>
        <h3 className="font-bold text-base sm:text-lg mb-1 text-foreground">{emptyTitle}</h3>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto mb-4">
          {emptyMessage}
        </p>
        {emptyAction && <div className="flex justify-center">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={`${gridClassName} ${className}`} data-testid="post-list-grid">
      {listings.map((listing, index) => (
        <div
          key={listing.id || index}
          className={`animate-fadeIn stagger-${(index % 6) + 1} h-full min-w-0`}
        >
          <ProductCard listing={listing} onWishlistChange={onWishlistChange} />
        </div>
      ))}
    </div>
  );
}

export { ProductCard };
