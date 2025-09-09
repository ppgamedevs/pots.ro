export type PaginationInput = {
  page?: number;        // 1-based
  pageSize?: number;    // default 24
  maxPageSize?: number; // safety cap, default 100
};

export type PaginationCalc = {
  page: number;
  pageSize: number;
  limit: number;
  offset: number; // SQL-style
  from: number;   // Supabase .range() inclusive start (0-based)
  to: number;     // Supabase .range() inclusive end
};

export function getPagination({
  page = 1,
  pageSize = 24,
  maxPageSize = 100,
}: PaginationInput = {}): PaginationCalc {
  const safeSize = Math.min(Math.max(1, pageSize), maxPageSize);
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeSize;
  const limit = safeSize;
  const from = offset; // supabase is 0-based inclusive
  const to = offset + safeSize - 1; // inclusive
  return { page: safePage, pageSize: safeSize, limit, offset, from, to };
}

export function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
