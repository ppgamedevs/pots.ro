"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "./Search";
import { Button } from "../ui/button";
import { Category } from "./SiteHeader";

interface MainBarProps {
  categories: Category[];
  suggestions: string[];
  onMegaMenuToggle: (open: boolean) => void;
  onMiniCartToggle: (open: boolean) => void;
}

export function MainBar({ categories, suggestions, onMegaMenuToggle, onMiniCartToggle }: MainBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-ink">
            Florist<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
          <Search 
            suggestions={suggestions}
            placeholder="Caută ghivece, cutii, accesorii..."
            className="w-full"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onMegaMenuToggle(true)}
            className="transition-micro"
          >
            Categorii
          </Button>
          
          <Button variant="ghost" size="sm" className="transition-micro">
            Devino Vânzător
          </Button>
          
          <Button variant="ghost" size="sm" className="transition-micro">
            Cont
          </Button>
          
          <Button variant="ghost" size="sm" className="transition-micro">
            Favorite
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMiniCartToggle(true)}
            className="transition-micro"
          >
            Coș
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="transition-micro"
          >
            🔍
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMiniCartToggle(true)}
            className="transition-micro"
          >
            🛒
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="lg:hidden py-4 border-t border-line">
          <Search 
            suggestions={suggestions}
            placeholder="Caută produse..."
            className="w-full"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
