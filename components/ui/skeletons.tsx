import { clsx } from "clsx";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse", className)}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Image skeleton */}
        <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Title skeleton */}
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          
          {/* Price skeleton */}
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          
          {/* Seller skeleton */}
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="animate-pulse" aria-live="polite">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
          
          {/* Price skeleton */}
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          
          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
          </div>
          
          {/* Specs skeleton */}
          <div className="space-y-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Button skeleton */}
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-live="polite">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
