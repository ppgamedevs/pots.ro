"use client";

import Link from "next/link";
import Image from "next/image";
import { SrcSet } from "./PromoHero";

export interface CategoryTile {
  name: string;
  image: SrcSet;
  href: string;
}

export interface CategoryTilesProps {
  items: CategoryTile[];
}

export function CategoryTiles({ items }: CategoryTilesProps) {
  return (
    <section className="py-8 lg:py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <Link 
              key={index}
              href={item.href}
              className="group block"
            >
              <div className="relative h-48 lg:h-64 overflow-hidden rounded-lg transition-micro group-hover:shadow-elev">
                {/* Background Image */}
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  className="object-cover transition-micro group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl lg:text-2xl font-semibold text-white mb-1">
                    {item.name}
                  </h3>
                  
                  <div className="text-sm text-white/90">
                    Vezi produsele
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
