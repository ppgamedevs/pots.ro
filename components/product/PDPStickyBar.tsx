"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ShoppingCart, X } from "lucide-react";

export interface PDPStickyBarProps {
  price: number;
  oldPrice?: number;
  cta: string;
  onClick: () => void;
  stockLabel: string;
}

export function PDPStickyBar({ 
  price, 
  oldPrice, 
  cta, 
  onClick, 
  stockLabel 
}: PDPStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show sticky bar when user scrolls past 50% of the page
      setIsVisible(scrollPosition > windowHeight * 0.5 && scrollPosition < documentHeight - windowHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-sm border-t border-line shadow-elev">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Price */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-ink">
                  {price.toLocaleString('ro-RO')} lei
                </span>
                {oldPrice && (
                  <span className="text-sm text-muted line-through">
                    {oldPrice.toLocaleString('ro-RO')} lei
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{stockLabel}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onClick}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-micro"
              aria-label="Adaugă produsul în coș"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {cta}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-2"
              aria-label="Ascunde bara"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
