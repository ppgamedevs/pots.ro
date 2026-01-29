import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: unknown;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({ 
  page, 
  totalPages, 
  onPageChange, 
  totalItems,
  itemsPerPage = 24 
}: PaginationProps) {
  const onPageChangeFn = typeof onPageChange === 'function' ? (onPageChange as (page: number) => void) : undefined;
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Info */}
          {totalItems && (
            <div className="text-sm text-muted">
              Afișând {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, totalItems)} din {totalItems} produse
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChangeFn?.(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {visiblePages.map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`dots-${index}`} className="px-3 py-2 text-muted">
                      ...
                    </span>
                  );
                }

                const pageNumber = pageNum as number;
                const isCurrentPage = pageNumber === page;

                return (
                  <Button
                    key={pageNumber}
                    variant={isCurrentPage ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onPageChangeFn?.(pageNumber)}
                    className={`w-10 h-10 p-0 ${
                      isCurrentPage 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-bg-soft'
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChangeFn?.(page + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1"
            >
              Următor
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
