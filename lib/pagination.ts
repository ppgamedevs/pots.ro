export type PageParams = {
  page?: number | string | null;
  pageSize?: number | string | null;
  maxPageSize?: number; // hard cap
  defaultPageSize?: number;
};

export type PageCalc = {
  page: number;        // 1-based
  pageSize: number;    // requested (clamped)
  limit: number;       // for SQL
  offset: number;      // for SQL
};

/** Safe pagination from search params or inputs. */
export function getPagination({
  page,
  pageSize,
  maxPageSize = 60,
  defaultPageSize = 24,
}: PageParams): PageCalc {
  const p = clampInt(toInt(page, 1), 1, 1_000_000);
  const ps = clampInt(toInt(pageSize, defaultPageSize), 1, maxPageSize);
  return { page: p, pageSize: ps, limit: ps, offset: (p - 1) * ps };
}

function toInt(v: number | string | null | undefined, fallback: number): number {
  if (v == null) return fallback;
  const n = typeof v === "string" ? parseInt(v, 10) : Math.trunc(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

/** Build meta for API responses & UI. */
export function buildPaginationMeta(totalItems: number, calc: PageCalc): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / calc.pageSize));
  const page = Math.min(calc.page, totalPages);
  return {
    page,
    pageSize: calc.pageSize,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

// Legacy compatibility exports
export type PaginationInput = PageParams;
export type PaginationCalc = PageCalc;

export function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
