import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
LoadingSkeleton.displayName = "LoadingSkeleton";

export interface ProductCardSkeletonProps {
  className?: string;
}

const ProductCardSkeleton = React.forwardRef<HTMLDivElement, ProductCardSkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-3",
        className
      )}
      {...props}
    >
      <LoadingSkeleton className="aspect-square rounded-xl mb-3" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <LoadingSkeleton className="h-5 w-16" />
          <LoadingSkeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
);
ProductCardSkeleton.displayName = "ProductCardSkeleton";

export interface CategoryHeaderSkeletonProps {
  className?: string;
}

const CategoryHeaderSkeleton = React.forwardRef<HTMLDivElement, CategoryHeaderSkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-8 text-center",
        className
      )}
      {...props}
    >
      <LoadingSkeleton className="h-8 w-96 mx-auto mb-4" />
      <LoadingSkeleton className="h-4 w-80 mx-auto" />
    </div>
  )
);
CategoryHeaderSkeleton.displayName = "CategoryHeaderSkeleton";

export { LoadingSkeleton, ProductCardSkeleton, CategoryHeaderSkeleton };
