"use client";

export function TopBar() {
  return (
    <div className="hidden lg:block bg-bg-soft border-b border-line">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center text-sm text-subink">
          <span>Plăți securizate</span>
          <span className="mx-2">•</span>
          <span>14 zile retur</span>
          <span className="mx-2">•</span>
          <span>Selleri verificați</span>
        </div>
      </div>
    </div>
  );
}
