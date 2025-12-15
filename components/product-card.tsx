import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { AspectRatio } from "./ui/layout-stable";
import { Product, getStockStatus, stockBadgeConfig } from "@/lib/schemas/product-attributes";
import AddToCartButton from "./cart/AddToCartButton";

type ProductCardProps = {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  currency?: string; // "RON"
  imageUrl: string;
  sellerSlug?: string;
  attributes?: Product["attributes"];
};

export function ProductCard({ id, slug, title, price, currency = "RON", imageUrl, sellerSlug, attributes }: ProductCardProps) {

  // Get stock status for badge
  const stockQty = attributes?.stock_qty || 0;
  const stockStatus = getStockStatus(stockQty);
  const stockBadge = stockBadgeConfig[stockStatus];

  // Check if product is in stock
  const isInStock = attributes?.is_in_stock ?? true;

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10
                    hover:shadow-soft transition-all duration-200 p-3 hover:-translate-y-[1px]">
      <Link href={`/p/${id}-${slug}`} className="block relative">
        <AspectRatio ratio={1} className="overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt={`${title} - imagine produs`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </AspectRatio>
        
        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          <Badge 
            variant={stockBadge.variant}
            className={stockBadge.className}
          >
            {stockBadge.label}
          </Badge>
        </div>
      </Link>

      <div className="mt-3 space-y-1">
        <Link href={`/p/${id}-${slug}`} className="line-clamp-1 font-medium text-slate-900 dark:text-slate-100">{title}</Link>
        {sellerSlug && (
          <Link 
            href={`/s/${sellerSlug}`} 
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {sellerSlug}
          </Link>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {price.toFixed(2)} {currency}
          </div>
          
          {/* Add to Cart Button */}
          <AddToCartButton
            productId={String(id)}
            stockQty={stockQty}
            variant="secondary"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
