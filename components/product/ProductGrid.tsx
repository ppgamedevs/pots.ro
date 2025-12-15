import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  price: number;
  image?: {
    src: string;
    alt: string;
  };
  seller: string;
  category: string;
  slug: string;
  oldPrice?: number;
  badge?: string;
}

interface ProductGridProps {
  items: Product[];
  loading?: boolean;
}

export default function ProductGrid({ items, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line p-4 bg-white animate-pulse">
            <div className="aspect-square bg-bg-soft rounded-lg mb-3" />
            <div className="h-4 bg-bg-soft rounded mb-2" />
            <div className="h-3 bg-bg-soft rounded w-2/3 mb-2" />
            <div className="h-4 bg-bg-soft rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="i-lucide:search h-12 w-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">Nu am găsit produse</h3>
        <p className="text-subink">Încearcă să modifici termenii de căutare</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((product) => (
        <Link
          key={product.id}
          href={`/p/${product.slug}`}
          className="group rounded-xl border border-line p-4 bg-white hover:shadow-card transition-micro"
        >
          <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-bg-soft">
            {product.image ? (
              <Image
                src={product.image.src}
                alt={product.image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-micro"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                loading="lazy"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <span className="i-lucide:image h-8 w-8" />
              </div>
            )}
            {product.badge && (
              <div className="absolute top-2 left-2 chip bg-primary text-white border-primary">
                {product.badge}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-medium text-ink line-clamp-2 group-hover:text-primary transition-micro">
              {product.title}
            </h3>
            <p className="text-sm text-subink">{product.seller}</p>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">
                {product.price.toLocaleString("ro-RO")} RON
              </span>
              {product.oldPrice && (
                <span className="text-sm text-muted line-through">
                  {product.oldPrice.toLocaleString("ro-RO")} RON
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
