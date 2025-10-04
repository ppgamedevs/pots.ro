import { HomePageSample, PDPSample, CategorySample } from "@/components/skeleton/FloristMarketSkeleton";

export default function SkeletonDemo() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation pentru a testa diferite pagini */}
      <div className="fixed top-4 right-4 z-50 bg-white border border-line rounded-lg p-4 shadow-elev">
        <h3 className="text-sm font-semibold text-ink mb-2">Demo Pages</h3>
        <div className="space-y-2">
          <a href="#homepage" className="block text-xs text-primary hover:text-primary/80">Homepage</a>
          <a href="#pdp" className="block text-xs text-primary hover:text-primary/80">PDP</a>
          <a href="#category" className="block text-xs text-primary hover:text-primary/80">Category</a>
        </div>
      </div>

      {/* Homepage Sample */}
      <div id="homepage">
        <HomePageSample />
      </div>

      {/* PDP Sample */}
      <div id="pdp" className="border-t-4 border-primary">
        <PDPSample />
      </div>

      {/* Category Sample */}
      <div id="category" className="border-t-4 border-primary">
        <CategorySample />
      </div>
    </div>
  );
}
