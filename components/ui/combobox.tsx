"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Lightweight searchable combobox using `cmdk`, without Radix Popover.
 * Renders an input + an anchored list (like autocomplete).
 */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Caută…",
  emptyText = "Nicio opțiune",
  className,
  disabled = false,
}: ComboboxProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  React.useEffect(() => {
    // keep query in sync with selected label when closed
    if (!open) setQuery(selected?.label ?? "");
  }, [open, selected?.label]);

  React.useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const clear = () => {
    onValueChange("");
    setQuery("");
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Command
        className={cn(
          "w-full rounded-lg border border-line bg-white",
          disabled && "opacity-60 pointer-events-none"
        )}
        filter={(value, search) => {
          if (!search) return 1;
          return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        }}
      >
        <div className="flex items-center gap-2 px-3">
          <Command.Input
            ref={inputRef}
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            disabled={disabled}
            aria-expanded={open}
            aria-autocomplete="list"
          />

          {value ? (
            <button
              type="button"
              className="rounded p-1 text-muted hover:text-ink hover:bg-bg-soft transition-micro"
              onClick={clear}
              aria-label="Șterge selecția"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {open && (
          <Command.List className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-elev">
            <div className="max-h-56 overflow-auto p-1">
              <Command.Empty className="px-3 py-2 text-sm text-muted">
                {emptyText}
              </Command.Empty>

              {options.map((opt) => (
                <Command.Item
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                    setQuery(opt.label);
                  }}
                  className={cn(
                    "flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm text-ink",
                    "aria-selected:bg-bg-soft",
                    "hover:bg-bg-soft"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : null}
                </Command.Item>
              ))}
            </div>
          </Command.List>
        )}
      </Command>
    </div>
  );
}


