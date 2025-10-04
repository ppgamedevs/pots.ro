"use client";

export function ProductCardSkeleton() {
  return (
    <div className="bg-bg border border-line rounded-lg overflow-hidden animate-pulse">
      {/* Image */}
      <div className="aspect-square bg-bg-soft" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-bg-soft rounded w-3/4" />
        <div className="h-3 bg-bg-soft rounded w-1/2" />
        <div className="h-5 bg-bg-soft rounded w-1/3" />
      </div>
      
      {/* Button */}
      <div className="px-4 pb-4">
        <div className="h-8 bg-bg-soft rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function PDPGallerySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Main Image */}
      <div className="aspect-square bg-bg-soft rounded-lg" />
      
      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-square bg-bg-soft rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function PDPInfoSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-bg-soft rounded w-3/4" />
      
      {/* Seller */}
      <div className="h-4 bg-bg-soft rounded w-1/3" />
      
      {/* Rating */}
      <div className="h-4 bg-bg-soft rounded w-1/4" />
      
      {/* Price */}
      <div className="space-y-2">
        <div className="h-8 bg-bg-soft rounded w-1/2" />
        <div className="h-4 bg-bg-soft rounded w-1/3" />
      </div>
      
      {/* Stock */}
      <div className="h-4 bg-bg-soft rounded w-1/4" />
      
      {/* Badges */}
      <div className="flex gap-2">
        <div className="h-6 bg-bg-soft rounded-full w-16" />
        <div className="h-6 bg-bg-soft rounded-full w-20" />
      </div>
    </div>
  );
}

export function PDPActionsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Quantity */}
      <div className="h-12 bg-bg-soft rounded-lg" />
      
      {/* Add to Cart */}
      <div className="h-14 bg-bg-soft rounded-lg" />
      
      {/* Quick Actions */}
      <div className="flex gap-2">
        <div className="flex-1 h-12 bg-bg-soft rounded-lg" />
        <div className="flex-1 h-12 bg-bg-soft rounded-lg" />
      </div>
    </div>
  );
}

export function CategoryHeaderSkeleton() {
  return (
    <div className="py-8 lg:py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-bg-soft rounded w-1/2" />
            <div className="h-5 bg-bg-soft rounded w-3/4" />
            <div className="h-4 bg-bg-soft rounded w-1/4" />
          </div>
          <div className="lg:w-80 lg:h-64 bg-bg-soft rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function FiltersBarSkeleton() {
  return (
    <div className="bg-bg border-b border-line py-4 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 bg-bg-soft rounded w-16" />
              <div className="flex gap-2">
                <div className="h-8 bg-bg-soft rounded-full w-20" />
                <div className="h-8 bg-bg-soft rounded-full w-16" />
                <div className="h-8 bg-bg-soft rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
