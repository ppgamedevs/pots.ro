"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CategoryFilters() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="md:hidden">
        <Button variant="secondary" onClick={() => setOpen(true)}>Filtre</Button>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Filtre"
        description="Rafinează rezultatele"
        side="right"
        footer={
          <>
            <button
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-sm"
              onClick={() => setOpen(false)}
            >
              Închide
            </button>
            <Button onClick={() => setOpen(false)}>Aplică filtre</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Culoare</div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox />
                <span>Alb</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox />
                <span>Negru</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox />
                <span>Roșu</span>
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Sortare</div>
            <Select defaultValue="popular">
              <SelectTrigger>
                <SelectValue placeholder="Alege sortarea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Cele mai populare</SelectItem>
                <SelectItem value="price-asc">Preț crescător</SelectItem>
                <SelectItem value="price-desc">Preț descrescător</SelectItem>
                <SelectItem value="new">Cele mai noi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Sheet>
    </>
  );
}
