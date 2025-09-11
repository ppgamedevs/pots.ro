"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import useSWR from "swr";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import clsx from "clsx";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { EmptyState } from "@/components/ui/empty-states";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  // ⌘K / CtrlK shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // debounce ușor
  const debounced = useDebouncedValue(q, 120);
  const { data } = useSWR(
    debounced ? `/api/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const go = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const { products = [], categories = [], sellers = [] } = data ?? {};

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content 
          className="fixed left-1/2 top-24 z-[60] w-[92vw] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-soft"
          aria-label="Căutare produse"
        >
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Caută produse, categorii, vânzători</span>
            <Dialog.Close className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Închide">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <Command
            label="Căutare"
            className="w-full"
            filter={(value, search) => rank(value, search)} // highlight aware
          >
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Ex: ghiveci alb, cutii înalte, atelier ceramic…"
              className="h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
              autoFocus
              aria-label="Căutare"
            />
            <Command.List className="max-h-[60vh] overflow-auto border-t border-slate-200 dark:border-white/10">
              {!q && (
                <Command.Empty className="p-4 text-sm text-slate-500">Tastează pentru a căuta…</Command.Empty>
              )}
              {q && products.length === 0 && categories.length === 0 && sellers.length === 0 && (
                <div className="p-4">
                  <EmptyState type="search" searchQuery={q} />
                </div>
              )}

              {/* Products */}
              {products.length > 0 && (
                <>
                  <Command.Group heading="Produse">
                    {products.map((p: any) => (
                      <Command.Item
                        key={`p-${p.id}`}
                        onSelect={() => go(`/p/${p.id}-${p.slug}`)}
                        className={rowClass}
                      >
                        <div className="flex items-center gap-3">
                          {/* thumb */}
                          <div className="h-9 w-9 overflow-hidden rounded-md bg-slate-100">
                            {/* poți schimba cu next/image dacă vrei */}
                            {p.image_url ? <img src={p.image_url} alt={`${p.title} - product thumbnail`} className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate">{highlight(p.title, debounced)}</div>
                            <div className="text-xs text-slate-500">
                              {(p.price ?? 0).toFixed(2)} {p.currency || "RON"} • {p.seller_slug || "seller"}
                            </div>
                          </div>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Separator alwaysRender />
                </>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <>
                  <Command.Group heading="Categorii">
                    {categories.map((c: any) => (
                      <Command.Item
                        key={`c-${c.slug}`}
                        onSelect={() => go(`/c/${c.slug}`)}
                        className={rowClass}
                      >
                        <span>{highlight(c.name || c.slug, debounced)}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Separator alwaysRender />
                </>
              )}

              {/* Sellers */}
              {sellers.length > 0 && (
                <Command.Group heading="Vânzători">
                  {sellers.map((s: any) => (
                    <Command.Item
                      key={`s-${s.slug}`}
                      onSelect={() => go(`/s/${s.slug}`)}
                      className={rowClass}
                    >
                      <span>{highlight(s.brand_name || s.slug, debounced)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* — helpers — */

const rowClass = clsx(
  "px-3 py-2 text-sm cursor-pointer",
  "aria-selected:bg-slate-100 dark:aria-selected:bg-white/10",
  "data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none"
);

// Basic ranking: prioritize prefix/word-start matches
function rank(value: string, search: string) {
  const v = value.toLowerCase();
  const s = search.toLowerCase();
  if (!s) return 1;
  if (v.startsWith(s)) return 1;
  if (v.includes(` ${s}`)) return 0.9;
  if (v.includes(s)) return 0.6;
  return 0.4; // still match, lower rank
}

// Highlight occurrences (simple)
function highlight(text: string, term: string) {
  if (!term) return text;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-yellow-200/60 dark:bg-yellow-300/20 rounded-sm">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}
