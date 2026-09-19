import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * GGS Unified Pagination Component
 * 
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalRecords - Total count of records
 * @param {number} pageSize - Number of items per page (default 20)
 * @param {function} onPageChange - Callback when page changes (page: number) => void
 * @param {string} className - Optional container styling
 */
export default function PaginationControls({
  currentPage = 1,
  totalPages,
  totalRecords,
  totalItems,
  totalCount,
  pageSize,
  itemsPerPage,
  limit,
  onPageChange,
  className = ''
}) {
  const actualTotalRecords = Number(totalRecords ?? totalItems ?? totalCount ?? 0);
  const actualPageSize = Number(pageSize ?? itemsPerPage ?? limit ?? 20);
  const calculatedTotalPages = Math.max(1, Number(totalPages ?? (Math.ceil(actualTotalRecords / actualPageSize) || 1)));

  if (!actualTotalRecords || calculatedTotalPages <= 1) {
    return null;
  }

  const startRecord = Math.min(actualTotalRecords, (currentPage - 1) * actualPageSize + 1);
  const endRecord = Math.min(actualTotalRecords, currentPage * actualPageSize);
  const effectiveTotalPages = totalPages ? Number(totalPages) : calculatedTotalPages;

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (effectiveTotalPages <= maxVisible + 2) {
      for (let i = 1; i <= effectiveTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(effectiveTotalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= effectiveTotalPages - 2) {
        start = effectiveTotalPages - 3;
        end = effectiveTotalPages - 1;
      }

      if (start > 2) {
        pages.push('ellipsis-start');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < effectiveTotalPages - 1) {
        pages.push('ellipsis-end');
      }

      pages.push(effectiveTotalPages);
    }

    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 border-t border-violet-500/10 ${className}`}>
      {/* Range Display */}
      <div className="text-xs sm:text-sm text-muted-foreground select-none">
        Showing <span className="font-semibold text-foreground">{startRecord}</span>–
        <span className="font-semibold text-foreground">{endRecord}</span> of{' '}
        <span className="font-semibold text-foreground">{actualTotalRecords}</span> records
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 select-none">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
            currentPage <= 1
              ? 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed'
              : 'bg-card text-foreground border-border hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40 active:scale-95'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 mr-1 shrink-0" />
          <span>Previous</span>
        </button>

        {/* Numeric Page Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (typeof page === 'string') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-muted-foreground select-none">
                  …
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[32px] h-8 px-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/30'
                    : 'bg-card text-foreground border-border hover:bg-muted active:scale-95'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile Compact Page Indicator */}
        <div className="sm:hidden px-2 py-1 text-xs font-medium text-foreground bg-muted/60 rounded border border-border">
          {currentPage} / {effectiveTotalPages}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
          disabled={currentPage >= effectiveTotalPages}
          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
            currentPage >= effectiveTotalPages
              ? 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed'
              : 'bg-card text-foreground border-border hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40 active:scale-95'
          }`}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
        </button>
      </div>
    </div>
  );
}