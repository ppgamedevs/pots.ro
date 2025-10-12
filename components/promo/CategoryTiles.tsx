"use client";

import Link from "next/link";
import Image from "next/image";
import { SrcSet } from "./PromoHero";

export interface CategoryTile {
  name: string;
  image: SrcSet;
  href: string;
  description?: string;
  buttonText?: string;
}

export interface CategoryTilesProps {
  items: CategoryTile[];
}

export function CategoryTiles({ items }: CategoryTilesProps) {
  return (
    <section className="py-8 lg:py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {items.map((item, index) => (
            <Link 
              key={index}
              href={item.href}
              className="group block"
            >
              <div className="relative h-40 sm:h-48 lg:h-64 overflow-hidden rounded-lg transition-micro group-hover:shadow-elev">
                {/* Background Image */}
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  className="object-cover transition-micro group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl lg:text-2xl font-semibold text-white mb-1">
                    {item.name}
                  </h3>
                  
                  {item.description && (
                    <p className="text-sm text-white/90 mb-3 max-w-md">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900 hover:bg-white transition-colors">
                    {item.buttonText || "Vezi produsele"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                      <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
