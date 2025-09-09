import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPrevNext?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    showPrevNext = true,
    showFirstLast = false,
    maxVisiblePages = 5,
    className,
    ...props 
  }, ref) => {
    const getVisiblePages = () => {
      const pages: (number | string)[] = [];
      const half = Math.floor(maxVisiblePages / 2);
      
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, currentPage + half);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= half) {
        end = Math.min(totalPages, maxVisiblePages);
      }
      if (currentPage > totalPages - half) {
        start = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (showFirstLast && start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push("...");
        }
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (showFirstLast && end < totalPages) {
        if (end < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
      
      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center space-x-1", className)}
        {...props}
      >
        {showPrevNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina anterioară</span>
          </Button>
        )}

        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="flex h-8 w-8 items-center justify-center text-slate-500 dark:text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        {showPrevNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Pagina următoare</span>
          </Button>
        )}
      </div>
    );
  }
);
Pagination.displayName = "Pagination";

export { Pagination };
