"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

export function Pagination({
  totalPages,
  currentPage,
  maxPagesToShow = 5,
  ariaLabel = "Pagination",
}: {
  totalPages: number;
  currentPage: number; // 1-based
  maxPagesToShow?: number;
  ariaLabel?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();

  const buildHref = (page: number) => {
    const params = new URLSearchParams(search.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    return `${pathname}?${params.toString()}`.replace(/\?$/, "");
  };

  if (totalPages <= 1) return null;

  // windowing
  const half = Math.floor(maxPagesToShow / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxPagesToShow - 1);
  if (end - start + 1 < maxPagesToShow) start = Math.max(1, end - maxPagesToShow + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const buttonBase =
    "min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg border text-sm transition-all duration-200 " +
    "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 " +
    "hover:shadow-soft hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950";

  return (
    <nav aria-label={ariaLabel} className="mt-6 flex items-center justify-center gap-2">
      {/* Prev */}
      <Link
        aria-label="Anterior"
        href={buildHref(Math.max(1, currentPage - 1))}
        className={clsx(buttonBase, currentPage === 1 && "pointer-events-none opacity-50")}
      >
        ‹
      </Link>

      {/* First + ellipsis */}
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className={buttonBase}>1</Link>
          {start > 2 && <span className="px-1 text-slate-500 dark:text-slate-400">…</span>}
        </>
      )}

      {/* Window */}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={clsx(
            buttonBase,
            p === currentPage && "bg-brand text-white border-brand hover:shadow-none hover:translate-y-0"
          )}
        >
          {p}
        </Link>
      ))}

      {/* Last + ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-500 dark:text-slate-400">…</span>}
          <Link href={buildHref(totalPages)} className={buttonBase}>{totalPages}</Link>
        </>
      )}

      {/* Next */}
      <Link
        aria-label="Următor"
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        className={clsx(buttonBase, currentPage === totalPages && "pointer-events-none opacity-50")}
      >
        ›
      </Link>
    </nav>
  );
}