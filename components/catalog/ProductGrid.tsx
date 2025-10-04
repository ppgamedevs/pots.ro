"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart } from "lucide-react";

export interface ProductCardProps {
  id: string;
  image: {
    src: string;
    alt: string;
  };
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
}

export function ProductCard({ 
  image, 
  title, 
  seller, 
  price, 
  oldPrice, 
  badge, 
  href 
}: ProductCardProps) {
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <div className="group bg-bg border border-line rounded-lg overflow-hidden transition-micro hover:shadow-card">
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
            <div className="absolute top-2 right-2">
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
        <div className="p-4">
          <h3 className="text-sm font-medium text-ink mb-1 line-clamp-2 group-hover:text-primary transition-micro">
            {title}
          </h3>
          
          <p className="text-xs text-muted mb-3">
            de {seller}
          </p>
          
          <div className="flex items-center justify-between mb-3">
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
      
      {/* Add to Cart Button */}
      <div className="px-4 pb-4">
        <Button 
          size="sm" 
          className="w-full transition-micro"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Handle add to cart
            console.log('Add to cart:', title);
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adaugă în coș
        </Button>
      </div>
    </div>
  );
}

export function ProductGrid({ items }: { items: ProductCardProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          id={item.id}
          image={item.image}
          title={item.title}
          seller={item.seller}
          price={item.price}
          oldPrice={item.oldPrice}
          badge={item.badge}
          href={item.href}
        />
      ))}
    </div>
  );
}
