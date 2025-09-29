import { buildPaginationMeta, getPagination, type PageParams } from "@/lib/pagination";
import { createClient } from "@supabase/supabase-js";

export type OrderOpt = { column: string; ascending?: boolean; nullsFirst?: boolean };
export type FilterFn<T> = (q: ReturnType<ReturnType<typeof createClient>["from"]>) => typeof q;

/**
 * Paginate a table or view with Supabase.
 * Usage:
 *   const { items, meta } = await supaPaginate(
 *     sb, "products", { page, pageSize },
 *     q => q.eq("status", "active"), { column: "created_at", ascending: false }, "*, sellers(*)"
 *   )
 */
export async function supaPaginate<T = any>(
  supabase: any,
  table: string,
  pageParams: PageParams,
  filter?: FilterFn<T>,
  order?: OrderOpt,
  select: string = "*"
): Promise<{ items: T[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const calc = getPagination(pageParams);
  let query = supabase.from(table).select(select, { count: "exact" });

  if (filter) query = (filter as any)(query);
  if (order?.column) {
    query = query.order(order.column, {
      ascending: order.ascending ?? true,
      nullsFirst: order.nullsFirst ?? false,
    });
  }

  // Supabase range is inclusive; end index = offset + limit - 1
  query = query.range(calc.offset, calc.offset + calc.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const meta = buildPaginationMeta(count ?? 0, calc);
  return { items: (data as T[]) ?? [], meta };
}

/**
 * Paginate with RPC function (for complex queries)
 * Usage:
 *   const { items, meta } = await supaPaginateRpc(
 *     sb, "get_products_with_stats", { page, pageSize },
 *     { search: "ceramic", category: "ghivece" }
 *   )
 */
export async function supaPaginateRpc<T = any>(
  supabase: any,
  rpcName: string,
  pageParams: PageParams,
  params: Record<string, any> = {}
): Promise<{ items: T[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const calc = getPagination(pageParams);
  
  const { data, error, count } = await supabase.rpc(rpcName, {
    ...params,
    offset: calc.offset,
    limit: calc.limit,
  }, { count: "exact" });

  if (error) throw error;

  const meta = buildPaginationMeta(count ?? 0, calc);
  return { items: (data as T[]) ?? [], meta };
}
