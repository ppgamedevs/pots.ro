"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "../ui/badge";
import AddToCartButton from "../cart/AddToCartButton";

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
  stockQty?: number; // Stock quantity for AddToCartButton
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

  return (
    <div className="group bg-bg border border-line rounded-lg overflow-hidden transition-micro hover:shadow-card flex flex-col h-full">
      <Link href={href} className="block flex-1 flex flex-col">
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
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-ink mb-1 line-clamp-2 group-hover:text-primary transition-micro">
            {title}
          </h3>
          
          <p className="text-xs text-muted mb-3">
            de {seller}
          </p>
          
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
      
      {/* Add to Cart Button */}
      <div
        className="px-4 pb-4"
        onClick={(e) => {
          // Nu navigăm la PDP când dăm click pe buton
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <AddToCartButton
          productId={id}
          stockQty={stockQty}
          size="sm"
          className="w-full transition-micro"
        />
      </div>
    </div>
  );
}

export function ProductGrid({ items }: { items: ProductCardProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
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
