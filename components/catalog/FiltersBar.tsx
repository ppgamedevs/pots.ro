"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { X, Filter } from "lucide-react";

export interface Facet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options?: {
    value: string;
    label: string;
    count?: number;
  }[];
  min?: number;
  max?: number;
}

export interface FiltersBarProps {
  facets: Facet[];
  selected: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
}

export function FiltersBar({ facets, selected, onChange }: FiltersBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(selected);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localFilters);
    }, 200);

    return () => clearTimeout(timer);
  }, [localFilters, onChange]);

  const handleFilterChange = (facetKey: string, value: string, checked: boolean) => {
    setLocalFilters(prev => {
      const currentValues = prev[facetKey] || [];
      
      if (checked) {
        return {
          ...prev,
          [facetKey]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [facetKey]: currentValues.filter(v => v !== value)
        };
      }
    });
  };

  const clearAllFilters = () => {
    setLocalFilters({});
  };

  const hasActiveFilters = Object.values(localFilters).some(values => values.length > 0);

  return (
    <div className="bg-bg border-b border-line">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden py-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtre
              {hasActiveFilters && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(localFilters).reduce((acc, values) => acc + values.length, 0)}
                </span>
              )}
            </span>
            <span>{isOpen ? 'Ascunde' : 'Arată'}</span>
          </Button>
        </div>

        {/* Desktop Filters */}
        <div className={`${isOpen ? 'block' : 'hidden'} lg:block py-4`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted hover:text-ink"
              >
                <X className="w-4 h-4 mr-1" />
                Șterge filtrele
              </Button>
            )}

            {/* Filter Facets */}
            {facets.map((facet) => (
              <div key={facet.key} className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink whitespace-nowrap">
                  {facet.label}:
                </span>
                
                <div className="flex flex-wrap gap-2">
                  {facet.options?.map((option) => {
                    const isSelected = localFilters[facet.key]?.includes(option.value) || false;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(facet.key, option.value, !isSelected)}
                        className={`px-3 py-1 text-sm rounded-full border transition-micro ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-bg text-muted border-line hover:border-muted'
                        }`}
                      >
                        {option.label}
                        {option.count && (
                          <span className="ml-1 text-xs opacity-75">
                            ({option.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
