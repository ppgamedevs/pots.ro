import { buildPaginationMeta, getPagination, type PageParams } from "@/lib/pagination";
import { createClient } from "@supabase/supabase-js";

export type OrderOpt = { column: string; ascending?: boolean; nullsFirst?: boolean };
export type RpcParams = Record<string, any>;

/**
 * Paginate results from a Supabase RPC function that returns a set (rows).
 * Your SQL function should SELECT from a view/table and be stable/immutable if possible.
 *
 * Example SQL (Postgres):
 *   CREATE OR REPLACE FUNCTION rpc_products_active(search text DEFAULT NULL)
 *   RETURNS SETOF products AS $$
 *     SELECT * FROM products
 *     WHERE status = 'active'
 *       AND (search IS NULL OR to_tsvector('simple', title || ' ' || coalesce(description,'')) @@ websearch_to_tsquery('simple', search));
 *   $$ LANGUAGE sql STABLE;
 */
export async function supaPaginateRpc<T = any>(
  supabase: any,
  fnName: string,
  pageParams: PageParams,
  args: RpcParams = {},
  order?: OrderOpt,
  select?: string // leave undefined if your RPC already picks columns; else use select() after rpc via from?
): Promise<{ items: T[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const calc = getPagination(pageParams);

  // 1) get total count (re-run without range; light but 2 calls total)
  // If your function is expensive, create a COUNT variant (e.g., rpc_products_active_count) and call that instead.
  const totalQ = supabase.rpc(fnName, args, { count: "exact" });
  const { count: totalCount, error: totalErr } = await totalQ;
  if (totalErr) throw totalErr;

  // 2) fetch page window
  let pageQ = supabase.rpc(fnName, args, { count: "exact" });

  // Optional order (works if your RPC exposes columns)
  if (order?.column) {
    // @ts-ignore supabase-js allows order after rpc on implicit virtual table
    pageQ = (pageQ as any).order?.(order.column, {
      ascending: order.ascending ?? true,
      nullsFirst: order.nullsFirst ?? false,
    }) ?? pageQ;
  }

  // Range is inclusive in Supabase: [offset, offset+limit-1]
  // @ts-ignore some drivers let you chain range() on rpc()
  pageQ = (pageQ as any).range?.(calc.offset, calc.offset + calc.limit - 1) ?? pageQ;

  const { data, error } = await pageQ;
  if (error) throw error;

  const meta = buildPaginationMeta(totalCount ?? 0, calc);
  return { items: (data as T[]) ?? [], meta };
}

/**
 * Alternative: Single-call RPC with pagination in SQL
 * Use this if you want to avoid 2 calls (count + data)
 * 
 * Your SQL function should return rows with total_count:
 * CREATE OR REPLACE FUNCTION rpc_products_paginated(
 *   search text DEFAULT NULL,
 *   page_offset integer DEFAULT 0,
 *   page_limit integer DEFAULT 24
 * )
 * RETURNS TABLE(
 *   id integer,
 *   title text,
 *   -- ... other columns
 *   total_count bigint
 * ) AS $$
 *   SELECT 
 *     p.*,
 *     COUNT(*) OVER() as total_count
 *   FROM products p
 *   WHERE status = 'active'
 *     AND (search IS NULL OR to_tsvector('simple', title || ' ' || coalesce(description,'')) @@ websearch_to_tsquery('simple', search))
 *   ORDER BY created_at DESC
 *   LIMIT page_limit OFFSET page_offset;
 * $$ LANGUAGE sql STABLE;
 */
export async function supaPaginateRpcSingle<T = any>(
  supabase: any,
  fnName: string,
  pageParams: PageParams,
  args: RpcParams = {}
): Promise<{ items: T[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const calc = getPagination(pageParams);
  
  const { data, error } = await supabase.rpc(fnName, {
    ...args,
    page_offset: calc.offset,
    page_limit: calc.limit,
  });
  
  if (error) throw error;
  
  // Extract total_count from first row (if available)
  const totalCount = data?.[0]?.total_count ?? 0;
  const items = data?.map((row: any) => {
    const { total_count, ...item } = row;
    return item;
  }) ?? [];
  
  const meta = buildPaginationMeta(totalCount, calc);
  return { items, meta };
}
