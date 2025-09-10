"use client";
import { useState } from "react";
import { FullHeightFilters, type FiltersState } from "@/components/ui/full-height-filters";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export function FiltersTrigger() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const initial: FiltersState = {
    color: params.getAll("color"),
    priceMin: params.get("min") ? Number(params.get("min")) : null,
    priceMax: params.get("max") ? Number(params.get("max")) : null,
    material: params.getAll("mat"),
    sort: params.get("sort") ?? "popular",
  };

  const apply = (st: FiltersState) => {
    const q = new URLSearchParams(params.toString());
    q.delete("color"); (st.color ?? []).forEach((c) => q.append("color", c));
    q.delete("mat");   (st.material ?? []).forEach((m) => q.append("mat", m));
    st.priceMin == null ? q.delete("min") : q.set("min", String(st.priceMin));
    st.priceMax == null ? q.delete("max") : q.set("max", String(st.priceMax));
    st.sort ? q.set("sort", st.sort) : q.delete("sort");
    q.delete("page"); // reset pagina la 1 când schimb filtrele

    router.push(`?${q.toString()}`);
  };

  const reset = () => {
    const q = new URLSearchParams(params.toString());
    ["color","mat","min","max","sort","page"].forEach((k) => q.delete(k));
    router.push(`?${q.toString()}`);
  };

  return (
    <>
      <div className="md:hidden">
        <Button variant="secondary" onClick={() => setOpen(true)}>Filtre</Button>
      </div>
      <div className="hidden md:block">
        {/* Poți afișa și ca drawer pe desktop — componenta se adaptează automat */}
        <Button variant="secondary" onClick={() => setOpen(true)}>Filtre</Button>
      </div>
      <FullHeightFilters open={open} onOpenChange={setOpen} initial={initial} onApply={apply} onReset={reset} />
    </>
  );
}
