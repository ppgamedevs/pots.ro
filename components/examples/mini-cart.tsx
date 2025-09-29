"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MiniCart() {
  const [open, setOpen] = useState(false);
  const items = [{ id: 1, title: "Ghiveci alb", qty: 2, price: 49.9 }];

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Coș</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Coșul tău"
        side="right"
        footer={
          <>
            <button
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-sm"
              onClick={() => setOpen(false)}
            >
              Continuă cumpărăturile
            </button>
            <a href="/checkout/payment">
              <Button>Continuă la plată</Button>
            </a>
          </>
        }
      >
        <div className="grid gap-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between">
              <div className="max-w-[60%]">
                <div className="text-sm font-medium line-clamp-1">{i.title}</div>
                <div className="text-xs text-slate-500">Cantitate: {i.qty}</div>
              </div>
              <div className="text-sm font-semibold">{(i.qty * i.price).toFixed(2)} RON</div>
            </div>
          ))}
          <div className="border-t border-slate-200 dark:border-white/10 pt-3 flex items-center justify-between">
            <div className="text-sm">Subtotal</div>
            <div className="text-sm font-semibold">{subtotal.toFixed(2)} RON</div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
