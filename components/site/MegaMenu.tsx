"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, User, Store, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "./SiteHeader";
import { UserMenu } from "./UserMenu";

interface MegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ categories, isOpen, onClose }: MegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Handle swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartY.current || !touchStartX.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = touchEndX - touchStartX.current;
    
    // Close menu on swipe up or swipe left
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -50) {
      onClose();
    } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        onTouchEnd={onClose}
        style={{ touchAction: 'manipulation' }}
      />
      
      {/* Mega Menu */}
      <div 
        ref={menuRef}
        className="fixed top-16 left-0 right-0 bg-bg border-b border-line shadow-elev z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center p-4 md:hidden">
          <div className="text-xs text-muted">
            Glisează în sus pentru a închide
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-3 h-12 w-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg"
            aria-label="Închide meniul"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {/* Mobile Navigation */}
          <div className="md:hidden mb-8">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/creare-cont" onClick={onClose}>
                <Button variant="outline" className="w-full justify-start h-12 text-sm">
                  <User className="mr-2 h-4 w-4" />
                  Creează cont
                </Button>
              </Link>
              <Link href="/login" onClick={onClose}>
                <Button variant="outline" className="w-full justify-start h-12 text-sm">
                  <User className="mr-2 h-4 w-4" />
                  Autentificare
                </Button>
              </Link>
              <Link href="/seller" onClick={onClose}>
                <Button variant="outline" className="w-full justify-start h-12 text-sm">
                  <Store className="mr-2 h-4 w-4" />
                  Devino vânzător
                </Button>
              </Link>
              <Link href="/cart" onClick={onClose}>
                <Button variant="outline" className="w-full justify-start h-12 text-sm">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Coș de cumpărături
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Categories Grid */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <Link 
                      href={category.href}
                      className="text-lg font-semibold text-ink hover:text-primary transition-micro block"
                      onClick={onClose}
                    >
                      {category.name}
                    </Link>
                    
                    {category.subcategories && (
                      <div className="space-y-2">
                        {category.subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={subcategory.href}
                            className="text-sm text-muted hover:text-ink transition-micro block"
                            onClick={onClose}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Image */}
            <div className="md:col-span-1">
              <div className="relative h-48 md:h-60 bg-bg-soft rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.png"
                  alt="Promo categorie"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-semibold">Colecția de toamnă</h3>
                  <p className="text-sm opacity-90">Descoperă noutățile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
