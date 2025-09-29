"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  selectable?: boolean;
  onSelectionChange?: (keys: (string | number)[]) => void;
  className?: string;
};

type SortState = { key: string | null; dir: "asc" | "desc" };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectable = false,
  onSelectionChange,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const key = sort.key as keyof T;
    const arr = [...rows];
    arr.sort((a: any, b: any) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sort.dir === "asc" ? -1 : 1;
      if (as > bs) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sort]);

  const allSelected = selectable && rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => {
    if (!selectable) return;
    const s = new Set<string | number>();
    if (!allSelected) rows.forEach((r) => s.add(rowKey(r)));
    setSelected(s);
    onSelectionChange?.(Array.from(s));
  };

  const toggleOne = (id: string | number) => {
    if (!selectable) return;
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
    onSelectionChange?.(Array.from(s));
  };

  const onSort = (col: Column<T>) => {
    if (!col.sortable) return;
    const key = String(col.key);
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <div className={clsx("w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/70 backdrop-blur">
          <tr>
            {selectable && (
              <th className="w-10 p-3 text-left">
                <input
                  aria-label="Selectează toate"
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand focus:ring-offset-0"
                />
              </th>
            )}
            {columns.map((c) => {
              const isSorted = sort.key === String(c.key);
              return (
                <th
                  key={String(c.key)}
                  scope="col"
                  onClick={() => onSort(c)}
                  className={clsx(
                    "p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-white/10",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.sortable && "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  )}
                  style={{ width: c.width }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && (
                      <span className="text-slate-400">
                        {isSorted ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                className="p-6 text-center text-slate-500"
                colSpan={(selectable ? 1 : 0) + columns.length}
              >
                Nu există rezultate.
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => {
              const id = rowKey(row);
              return (
                <tr
                  key={String(id)}
                  className={clsx(
                    "border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors",
                    i % 2 === 1 && "bg-slate-50/40 dark:bg-white/[0.03]"
                  )}
                >
                  {selectable && (
                    <td className="p-3">
                      <input
                        aria-label={`Selectează rând ${i + 1}`}
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand focus:ring-offset-0"
                      />
                    </td>
                  )}
                  {columns.map((c) => {
                    const content = c.render ? c.render(row) : (row as any)[c.key as any];
                    return (
                      <td
                        key={String(c.key)}
                        className={clsx(
                          "p-3 text-slate-800 dark:text-slate-100",
                          c.align === "right" && "text-right",
                          c.align === "center" && "text-center"
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
