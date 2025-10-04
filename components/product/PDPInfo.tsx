"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export interface Seller {
  name: string;
  href: string;
}

export interface PDPInfoProps {
  title: string;
  seller: Seller;
  price: number;
  oldPrice?: number;
  stockLabel: string;
  badges?: string[];
  rating?: number;
  reviewCount?: number;
}

export function PDPInfo({ 
  title, 
  seller, 
  price, 
  oldPrice, 
  stockLabel, 
  badges = [], 
  rating,
  reviewCount 
}: PDPInfoProps) {
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold text-ink leading-tight">
        {title}
      </h1>

      {/* Seller */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">de</span>
        <Link 
          href={seller.href}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-micro"
        >
          {seller.name}
        </Link>
      </div>

      {/* Rating */}
      {rating && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-line'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted">
            {rating.toFixed(1)} ({reviewCount} recenzii)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl lg:text-4xl font-bold text-ink">
            {price.toLocaleString('ro-RO')} lei
          </span>
          
          {oldPrice && (
            <span className="text-lg text-muted line-through">
              {oldPrice.toLocaleString('ro-RO')} lei
            </span>
          )}
          
          {discount > 0 && (
            <span className="px-2 py-1 bg-primary text-white text-sm font-medium rounded">
              -{discount}%
            </span>
          )}
        </div>
        
        {oldPrice && (
          <p className="text-sm text-muted">
            Economisești {(oldPrice - price).toLocaleString('ro-RO')} lei
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          stockLabel.toLowerCase().includes('în stoc') 
            ? 'bg-green-500' 
            : 'bg-orange-500'
        }`} />
        <span className="text-sm font-medium text-ink">{stockLabel}</span>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-bg-soft text-muted text-sm rounded-full border border-line"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
