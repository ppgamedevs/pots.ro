"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "./SiteHeader";

interface MegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ categories, isOpen, onClose }: MegaMenuProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Mega Menu */}
      <div className="fixed top-16 left-0 right-0 bg-bg border-b border-line shadow-elev z-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-8">
            {/* Categories Grid */}
            <div className="col-span-2">
              <div className="grid grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <Link 
                      href={category.href}
                      className="text-lg font-semibold text-ink hover:text-primary transition-micro block"
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
            <div className="col-span-1">
              <div className="relative h-60 bg-bg-soft rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.png"
                  alt="Promo categorie"
                  fill
                  className="object-cover"
                  sizes="420px"
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
