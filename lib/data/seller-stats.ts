// Mock implementation - replace with actual Supabase client
// import { createClient } from "@supabase/supabase-js";

// Mock data for demonstration
const mockOrderCounts = {
  "seller-1": { active: 12, shipped: 5, delivered: 20, refund_requested: 1 },
  "seller-2": { active: 8, shipped: 3, delivered: 15, refund_requested: 0 },
  "seller-3": { active: 15, shipped: 7, delivered: 25, refund_requested: 2 },
};

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

export async function getSellerOrderCounts(sellerId: string) {
  // Mock implementation - replace with actual Supabase query
  const counts = mockOrderCounts[sellerId as keyof typeof mockOrderCounts] || {
    active: 0,
    shipped: 0,
    delivered: 0,
    refund_requested: 0,
  };

  return counts;

  // Real Supabase implementation:
  // const statuses = ["active", "shipped", "delivered", "refund_requested"] as const;
  // const results: Record<string, number> = {};

  // for (const s of statuses) {
  //   const { count, error } = await supabase
  //     .from("orders_seller_view")        // view where each row is (order_id, seller_id, status)
  //     .select("order_id", { count: "exact", head: true })
  //     .eq("seller_id", sellerId)
  //     .eq("status", s);
  //   if (error) throw error;
  //   results[s] = count ?? 0;
  // }

  // return results; // { active: 12, shipped: 3, delivered: 20, refund_requested: 1 }
}
