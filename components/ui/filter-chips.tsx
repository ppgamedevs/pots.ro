import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

const FilterChip = React.forwardRef<HTMLDivElement, FilterChipProps>(
  ({ label, value, onRemove, className, ...props }, ref) => (
    <div
      ref={ref}
      onClick={onRemove}
      className={cn(
        "cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
        className
      )}
      {...props}
    >
      <Badge variant="secondary">
        {label}
        <X className="h-3 w-3 ml-1" />
      </Badge>
    </div>
  )
);
FilterChip.displayName = "FilterChip";

export interface FilterChipsProps {
  filters: Record<string, string[]>;
  filterOptions: Record<string, Array<{ value: string; label: string }>>;
  onFilterRemove: (filterType: string, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

const FilterChips = React.forwardRef<HTMLDivElement, FilterChipsProps>(
  ({ filters, filterOptions, onFilterRemove, onClearAll, className, ...props }, ref) => {
    const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

    if (!hasActiveFilters) return null;

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2 items-center", className)}
        {...props}
      >
        {Object.entries(filters).map(([filterType, values]) =>
          values.map((value) => {
            const option = filterOptions[filterType]?.find(opt => opt.value === value);
            return (
              <FilterChip
                key={`${filterType}-${value}`}
                label={option?.label || value}
                value={value}
                onRemove={() => onFilterRemove(filterType, value)}
              />
            );
          })
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4 mr-1" />
          Șterge toate
        </Button>
      </div>
    );
  }
);
FilterChips.displayName = "FilterChips";

export { FilterChip, FilterChips };
