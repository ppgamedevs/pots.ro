"use client";

import { useState, useRef, useEffect } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "../ui/button";

interface SearchProps {
  suggestions: string[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function Search({ suggestions, placeholder = "Caută produse...", className = "", autoFocus = false }: SearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouncing pentru performanță
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(debouncedQuery.toLowerCase())
  ).slice(0, 6);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          className="w-full h-14 pl-10 pr-4 bg-bg border border-line rounded-lg focus-ring transition-micro"
          aria-label="Căutare produse"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (query || filteredSuggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-line rounded-lg shadow-elev z-50">
          <div className="py-2">
            {query && (
              <div className="px-4 py-2 text-sm text-muted">
                Căutări pentru "{query}"
              </div>
            )}
            
            {filteredSuggestions.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-muted uppercase tracking-wide">
                  Sugestii populare
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-bg-soft transition-micro focus-ring"
                  >
                    {suggestion}
                  </button>
                ))}
              </>
            )}
            
            {query && filteredSuggestions.length === 0 && (
              <div className="px-4 py-2 text-sm text-muted">
                Nu am găsit rezultate. Încearcă "cutii rotunde".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
