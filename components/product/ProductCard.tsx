"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SrcSet } from "../promo/PromoHero";
import AddToCartButton from "../cart/AddToCartButton";

export interface ProductCardProps {
  id?: string;
  image: SrcSet;
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
  stockQty?: number;
}

export function ProductCard({ 
  id,
  image, 
  title, 
  seller, 
  price, 
  oldPrice, 
  badge, 
  href,
  stockQty = 10 // Default stock if not provided
}: ProductCardProps) {
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  
  // Extract product ID from href if not provided
  // href format: /p/{id}-{slug}
  let productId: string | null = id || null;
  
  if (!productId && href) {
    // Try to extract UUID from href: /p/{uuid}-{slug}
    const uuidMatch = href.match(/\/p\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      productId = uuidMatch[1];
    } else {
      // Fallback: try to get first part before dash
      const parts = href.split('/p/')[1]?.split('-');
      if (parts && parts.length > 0) {
        productId = parts[0];
      }
    }
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductCard render:', { id, href, productId, stockQty });
  }
  
  if (!productId) {
    console.warn('ProductCard: No product ID found for', { id, href, title });
  }

  return (
    <div className="group bg-bg border border-line rounded-lg overflow-hidden transition-micro hover:shadow-card flex flex-col h-full">
      <Link href={href} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-micro group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Badge */}
          {badge && (
            <div className="absolute top-2 left-2">
              <Badge 
                variant={badge === 'reducere' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {badge === 'nou' && 'Nou'}
                {badge === 'reducere' && `-${discount}%`}
                {badge === 'stoc redus' && 'Stoc redus'}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title - fixed height for 2 lines */}
          <h3 className="text-sm font-medium text-ink mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-micro">
            {title}
          </h3>
          
          {/* Seller */}
          <p className="text-xs text-muted mb-3">
            de {seller}
          </p>
          
          {/* Price - flex-1 to push button down */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-ink">
                {price.toLocaleString('ro-RO')} lei
              </span>
              
              {oldPrice && (
                <span className="text-sm text-muted line-through">
                  {oldPrice.toLocaleString('ro-RO')} lei
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Add to Cart Button - fixed at bottom */}
      <div 
        className="px-4 pb-4 mt-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {productId ? (
          <AddToCartButton
            productId={productId}
            stockQty={stockQty}
            variant="default"
            size="sm"
            className="w-full"
          />
        ) : (
          <Button 
            size="sm" 
            className="w-full transition-micro"
            disabled
          >
            Adaugă în coș
          </Button>
        )}
      </div>
    </div>
  );
}
