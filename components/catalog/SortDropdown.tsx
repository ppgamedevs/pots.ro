"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

export interface SortOption {
  label: string;
  value: string;
}

export interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
}

export function SortDropdown({ value, onChange, options }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(option => option.value === value) || options[0];

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[200px] justify-between"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-line rounded-lg shadow-elev z-20">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-micro first:rounded-t-lg last:rounded-b-lg ${
                  option.value === value
                    ? 'bg-primary text-white'
                    : 'hover:bg-bg-soft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
