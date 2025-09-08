import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

type ProductCardProps = {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  currency?: string; // "RON"
  imageUrl: string;
  sellerSlug?: string;
};

export function ProductCard({ id, slug, title, price, currency = "RON", imageUrl, sellerSlug }: ProductCardProps) {
  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10
                    hover:shadow-soft transition p-3 hover:-translate-y-[1px]">
      <Link href={`/p/${id}-${slug}`} className="block relative aspect-square overflow-hidden rounded-xl">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mt-3 space-y-1">
        <Link href={`/p/${id}-${slug}`} className="line-clamp-1 font-medium">{title}</Link>
        {sellerSlug && (
          <Link href={`/s/${sellerSlug}`} className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand">
            {sellerSlug}
          </Link>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="text-base font-semibold">{price.toFixed(2)} {currency}</div>
          <Button variant="secondary" size="sm">Adaugă</Button>
        </div>
      </div>
    </div>
  );
}
