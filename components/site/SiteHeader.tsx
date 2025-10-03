"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { MainBar } from "./MainBar";
import { MegaMenu } from "./MegaMenu";
import { MiniCart } from "./MiniCart";

export interface Category {
  id: string;
  name: string;
  href: string;
  subcategories?: {
    id: string;
    name: string;
    href: string;
  }[];
}

export interface SiteHeaderProps {
  categories: Category[];
  suggestions?: string[];
}

export function SiteHeader({ categories, suggestions = [] }: SiteHeaderProps) {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-bg/95 backdrop-blur-sm border-b border-line">
        <TopBar />
        <MainBar 
          categories={categories}
          suggestions={suggestions}
          onMegaMenuToggle={setMegaMenuOpen}
          onMiniCartToggle={setMiniCartOpen}
        />
      </header>
      
      <MegaMenu 
        categories={categories}
        isOpen={megaMenuOpen}
        onClose={() => setMegaMenuOpen(false)}
      />
      
      <MiniCart 
        isOpen={miniCartOpen}
        onClose={() => setMiniCartOpen(false)}
      />
    </>
  );
}
