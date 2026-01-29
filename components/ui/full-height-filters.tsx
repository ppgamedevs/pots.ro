"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export type FiltersState = {
  color?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  material?: string[];
  sort?: string;
};

export type FullHeightFiltersProps = {
  open: boolean;
  onOpenChange: unknown;
  initial: FiltersState;
  onApply: unknown;
  onReset?: unknown;
  className?: string;
};

export function FullHeightFilters({
  open,
  onOpenChange,
  initial,
  onApply,
  onReset,
  className,
}: FullHeightFiltersProps) {
  const onOpenChangeFn: (v: boolean) => void =
    typeof onOpenChange === 'function' ? (onOpenChange as (v: boolean) => void) : () => {};
  const onApplyFn: ((state: FiltersState) => void) | undefined =
    typeof onApply === 'function' ? (onApply as (state: FiltersState) => void) : undefined;
  const onResetFn: (() => void) | undefined =
    typeof onReset === 'function' ? (onReset as () => void) : undefined;
  // local working copy - nu stricăm instant filtrele din URL/UI până la "Aplică"
  const [state, setState] = useState<FiltersState>(initial);
  const [isMobile, setIsMobile] = useState(false);
  const dragStartY = useRef(0);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // bottom sheet full-height pe mobil, drawer pe desktop
  const containerClasses = useMemo(() => {
    if (isMobile) {
      return "fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-none h-[100dvh] rounded-t-2xl";
    }
    return "fixed right-0 top-0 h-full w-[92vw] max-w-md rounded-none";
  }, [isMobile]);

  const panel = (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Filtre produse"
      className={clsx(
        "z-[60] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-soft flex flex-col",
        containerClasses,
        className
      )}
      initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 24, scale: isMobile ? 1 : 1 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 24, scale: isMobile ? 1 : 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.08}
      onDragStart={(_, info) => { dragStartY.current = info.point.y; }}
      onDragEnd={(_, info) => {
        const delta = info.point.y - dragStartY.current;
        if (delta > 120) onOpenChangeFn(false); // swipe down to close
      }}
    >
      {/* Handle pentru swipe (mobil) */}
      {isMobile && (
        <div className="flex items-center justify-center pt-2">
          <div className="h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/20" />
        </div>
      )}

      {/* Header */}
      <div className={clsx(
        "flex items-center justify-between gap-3 px-4 py-3",
        "border-b border-slate-200 dark:border-white/10",
        !isMobile && "pt-4"
      )}>
        <div className="text-base font-semibold">Filtre</div>
        <div className="flex items-center gap-2">
          <button
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-sm hover:shadow-soft"
            onClick={() => {
              onResetFn?.();
              setState({});
            }}
          >
            Reset
          </button>
          <Dialog.Close
            className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </div>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {/* Culoare */}
        <Section title="Culoare">
          <ChipGroup
            options={["white", "black", "natural", "red", "green", "blue", "pink", "purple", "brown", "gray", "gold", "silver"]}
            values={state.color ?? []}
            onChange={(vals) => setState((s) => ({ ...s, color: vals }))}
          />
        </Section>

        {/* Preț */}
        <Section title="Preț (RON)">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              placeholder="Preț minim"
              value={state.priceMin ?? ""}
              onChange={(v) => setState((s) => ({ ...s, priceMin: v }))}
            />
            <NumberInput
              placeholder="Preț maxim"
              value={state.priceMax ?? ""}
              onChange={(v) => setState((s) => ({ ...s, priceMax: v }))}
            />
          </div>
        </Section>

        {/* Material */}
        <Section title="Material">
          <CheckboxList
            options={["ceramic", "porcelain", "glass", "plastic", "metal", "wood", "concrete", "terracotta", "cardboard", "textile"]}
            values={state.material ?? []}
            onToggle={(val) =>
              setState((s) => {
                const cur = new Set(s.material ?? []);
                cur.has(val) ? cur.delete(val) : cur.add(val);
                return { ...s, material: Array.from(cur) };
              })
            }
          />
        </Section>

        {/* Sortare */}
        <Section title="Sortare">
          <SelectNative
            value={state.sort ?? "popularity_desc"}
            onChange={(v) => setState((s) => ({ ...s, sort: v }))}
            options={[
              { value: "popularity_desc", label: "Cele mai populare" },
              { value: "price_asc", label: "Preț crescător" },
              { value: "price_desc", label: "Preț descrescător" },
              { value: "newest", label: "Cele mai noi" },
            ]}
          />
        </Section>
      </div>

      {/* Footer acțiuni */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
        <div className="flex items-center justify-end gap-2">
          <Dialog.Close asChild>
            <button
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-sm hover:shadow-soft"
            >
              Anulează
            </button>
          </Dialog.Close>
          <button
            onClick={() => {
              onApplyFn?.(state);
              onOpenChangeFn(false);
            }}
            className="h-10 px-4 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
          >
            Aplică filtre
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChangeFn}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>{panel}</Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* - UI sub-componente simple - */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Chip({ selected, label, onClick }: { selected?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-3 h-9 rounded-lg text-sm border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "bg-brand text-white border-brand"
          : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:shadow-soft"
      )}
      aria-pressed={selected}
      aria-label={`Filter by ${label}`}
    >
      {label}
    </button>
  );
}

function ChipGroup({ options, values, onChange }: { options: string[]; values: string[]; onChange: (vals: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <Chip
            key={opt}
            label={opt}
            selected={selected}
            onClick={() => {
              const set = new Set(values);
              selected ? set.delete(opt) : set.add(opt);
              onChange(Array.from(set));
            }}
          />
        );
      })}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number | string | null; onChange: (v: number | null) => void; placeholder?: string; }) {
  return (
    <input
      inputMode="numeric"
      pattern="[0-9]*"
      className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      value={value === null ? "" : value}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (!raw) return onChange(null);
        const n = Number(raw);
        onChange(Number.isFinite(n) ? n : null);
      }}
      aria-label={placeholder}
    />
  );
}

function CheckboxList({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (v: string) => void; }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {options.map((opt) => {
        const checked = values.includes(opt);
        return (
          <label key={opt} className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 dark:border-white/20 text-brand focus:ring-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              checked={checked}
              onChange={() => onToggle(opt)}
              aria-label={`Filter by ${opt}`}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function SelectNative({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      aria-label="Sort options"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
