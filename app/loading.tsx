import { CategoryGridSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero skeleton */}
        <div className="animate-pulse mb-8">
          <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl mb-6" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        
        {/* Products grid skeleton */}
        <CategoryGridSkeleton count={12} />
      </div>
    </div>
  );
}
